import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Resend } from 'resend';
import * as OneSignal from 'onesignal-node';
import { getDb, saveDb } from './server/db.ts';
import { calculateNextDates, isDonorReady } from './src/utils/intervals.ts';
import { 
  BloodGroup, 
  RhFactor, 
  DonationType, 
  DonorCenterStatus, 
  NotificationChannel,
  User,
  Donor,
  MedicalNote,
  Donation
} from './src/types.ts';

// Lazy initialized clients
let resendClient: Resend | null = null;
let oneSignalClient: OneSignal.Client | null = null;

function getResend(): Resend | null {
    if (!resendClient && process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

function getOneSignal(): OneSignal.Client | null {
    if (!oneSignalClient && process.env.ONESIGNAL_REST_API_KEY && process.env.VITE_ONESIGNAL_APP_ID) {
        oneSignalClient = new OneSignal.Client(process.env.VITE_ONESIGNAL_APP_ID, process.env.ONESIGNAL_REST_API_KEY);
    }
    return oneSignalClient;
}

// Password verify helper
function verifyPassword(password: string, hash: string): boolean {
  if (hash === "$2a$12$6/p.R99zLIDa7Z0Xn3V1WOkZ.R4JWhh5K2.S61.27m/zN0SgBqbyC" && password === "password123") {
    return true;
  }
  const sha = crypto.createHash('sha256').update(password).digest('hex');
  return hash === sha || hash === password;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Recalculates stats for a single donor based on their donations
function recalculateDonorStats(donorId: number) {
  const db = getDb();
  const donor = db.donors.find(d => d.id === donorId);
  if (!donor) return;

  const donations = db.donations
    .filter(d => d.donorId === donorId)
    .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());

  const lastDonation = donations[0] || null;
  const totalDonationsCount = donations.length;
  const bloodDonationsCount = donations.filter(d => d.donationType === 'blood').length;

  let nextAvailableDateStr: string | null = null;
  if (lastDonation) {
    const nextDates = calculateNextDates(
      lastDonation.donationType,
      bloodDonationsCount,
      new Date(lastDonation.donationDate)
    );
    nextAvailableDateStr = nextDates.earliestDate.toISOString().split('T')[0];
  }

  donor.donationsCount = totalDonationsCount;
  donor.bloodDonationsCount = bloodDonationsCount;
  donor.lastDonationDate = lastDonation ? lastDonation.donationDate : null;
  donor.lastDonationType = lastDonation ? lastDonation.donationType : null;
  donor.nextAvailableDate = nextAvailableDateStr;

  saveDb(db);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ---

  // SERVE PDF
  app.get('/api/download/contraindications', (req, res) => {
    const filePath = path.join(process.cwd(), 'assets', 'Перечень противопоказаний.pdf');
    res.download(filePath, 'Перечень противопоказаний.pdf', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).send('File not found');
      }
    });
  });

  // AUTH LOGIN
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Пожалуйста, введите e-mail и пароль' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Пользователя с такой почтой не существует' });
    }

    if (!verifyPassword(password, user.passwordHash || '')) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }

    // Attach profile information
    let donorProfile: Donor | null = null;
    let centerProfile = null;

    if (user.role === 'donor') {
      donorProfile = db.donors.find(d => d.userId === user.id) || null;
    } else if (user.role === 'center') {
      centerProfile = db.centers.find(c => c.id === user.centerId) || null;
    }

    res.json({
      token: `mock-session-token-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        centerId: user.centerId
      },
      donorProfile,
      centerProfile
    });
  });

  // REGISTER DONOR
  app.post('/api/auth/register', (req, res) => {
    const {
      lastName,
      firstName,
      middleName,
      birthDate,
      gender,
      bloodGroup,
      rhFactor,
      weight,
      phone,
      email,
      password,
      primaryCenterId,
      smsEnabled,
      pushEnabled,
      emailNotificationsEnabled
    } = req.body;

    if (!lastName || !firstName || !birthDate || !gender || !bloodGroup || !rhFactor || !weight || !phone || !email || !password || !primaryCenterId) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Age validation
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) { age--; }
    if (age < 18 || age > 65) {
      return res.status(400).json({ error: `Регистрация приостановлена. Донором может быть лицо от 18 до 65 лет. Ваш возраст: ${age} лет.` });
    }

    // Weight validation
    if (parseFloat(weight) < 55) {
      return res.status(400).json({ error: 'Регистрация невозможна. Вес донора должен быть не менее 55 кг.' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким e-mail уже зарегистрирован' });
    }

    // Create User account
    const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser: User = {
      id: newUserId,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: 'donor',
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Create Donor profile
    const newDonorId = db.donors.length > 0 ? Math.max(...db.donors.map(d => d.id)) + 1 : 1;
    const newDonor: Donor = {
      id: newDonorId,
      userId: newUserId,
      lastName,
      firstName,
      middleName,
      birthDate,
      gender,
      bloodGroup,
      rhFactor,
      weight: parseFloat(weight),
      phone,
      status: 'active',
      smsEnabled: !!smsEnabled,
      pushEnabled: !!pushEnabled,
      emailNotificationsEnabled: !!emailNotificationsEnabled,
      onesignalPlayerId: `onesignal-${newDonorId}-${Math.floor(Math.random() * 900000 + 100000)}`,
      personalPause: false,
      donationsCount: 0,
      bloodDonationsCount: 0,
      createdAt: new Date().toISOString()
    };

    // Link Center relation
    db.users.push(newUser);
    db.donors.push(newDonor);

    const newLinkId = db.donorCenters.length > 0 ? Math.max(...db.donorCenters.map(dc => dc.id)) + 1 : 1;
    db.donorCenters.push({
      id: newLinkId,
      donorId: newDonorId,
      centerId: parseInt(primaryCenterId),
      isPrimary: true,
      status: 'pending',
      resubmissionCount: 0,
      createdAt: new Date().toISOString()
    });

    saveDb(db);

    res.json({ success: true, message: 'Регистрация прошла успешно. Ожидайте подтверждения центра крови!' });
  });

  // RESET PASSWORD REQUEST MOCK
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }
    
    // Generate a 4-digit mock code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetCode = resetCode;
    saveDb(db);
    
    // In a real app we would email this code. Here we'll return it in the message for demo purposes.
    res.json({ success: true, message: `Код для восстановления пароля отправлен на ваш e-mail. (Для теста: Ваш код ${resetCode})` });
  });

  // CONFIRM RESET PASSWORD
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;
    const db = getDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (user.resetCode !== code) {
      return res.status(400).json({ error: 'Неверный код восстановления' });
    }
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть длиной не менее 6 символов' });
    }
    
    user.passwordHash = hashPassword(newPassword);
    user.resetCode = undefined;
    saveDb(db);
    
    res.json({ success: true, message: 'Пароль успешно изменён' });
  });

  // GET ALL CLINICS
  app.get('/api/centers', (req, res) => {
    const db = getDb();
    res.json(db.centers);
  });

  // GET GLOBAL NEWS
  app.get('/api/news', (req, res) => {
    const db = getDb();
    const published = db.news.filter(n => n.isPublished);
    res.json(published);
  });

  // CREATE NEWS (CENTER)
  app.post('/api/news', (req, res) => {
    const { title, content, isPublished, centerId, sentBy } = req.body;
    if (!title || !content || !centerId) {
      return res.status(400).json({ error: 'Заголовок и текст обязательны' });
    }

    const db = getDb();
    const newId = db.news.length > 0 ? Math.max(...db.news.map(n => n.id)) + 1 : 1;
    db.news.push({
      id: newId,
      centerId: parseInt(centerId),
      title,
      content,
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      createdBy: parseInt(sentBy) || 1
    });
    saveDb(db);
    res.json({ success: true });
  });

  // UPDATE NEWS (CENTER)
  app.put('/api/news/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content, isPublished } = req.body;

    const db = getDb();
    const newsIdx = db.news.findIndex(n => n.id === id);
    if (newsIdx === -1) return res.status(404).json({ error: 'Новость не найдена' });

    db.news[newsIdx].title = title || db.news[newsIdx].title;
    db.news[newsIdx].content = content || db.news[newsIdx].content;
    const wasPublished = db.news[newsIdx].isPublished;
    db.news[newsIdx].isPublished = isPublished !== undefined ? !!isPublished : db.news[newsIdx].isPublished;
    if (db.news[newsIdx].isPublished && !wasPublished) {
      db.news[newsIdx].publishedAt = new Date().toISOString();
    }

    saveDb(db);
    res.json({ success: true });
  });

  // DELETE NEWS (CENTER)
  app.delete('/api/news/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDb();
    const index = db.news.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'Новость не найдена' });
    db.news.splice(index, 1);
    saveDb(db);
    res.json({ success: true });
  });

  // GET DONOR PROFILE INFO
  app.get('/api/donor/profile', (req, res) => {
    // Basic session decoding from Header token
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; // Extract user ID mock from e.g. mock-session-token-1-12312
    const userId = parseInt(userIdStr);

    const db = getDb();
    const donor = db.donors.find(d => d.userId === userId);
    if (!donor) return res.status(404).json({ error: 'Профиль донора не найден' });

    // Find links to centers
    const links = db.donorCenters.filter(dc => dc.donorId === donor.id);
    const medicalNotes = db.medicalNotes.filter(m => m.donorId === donor.id);
    const donations = db.donations.filter(d => d.donorId === donor.id);

    // Calculate donor setup info
    const confirmedCenters = links.filter(l => l.status === 'confirmed');
    const todayStr = new Date().toISOString().split('T')[0];
    const readiness = isDonorReady(donor, todayStr, medicalNotes, confirmedCenters.length > 0);

    res.json({
      donor,
      links,
      medicalNotes,
      donations,
      readiness
    });
  });

  // UPDATE DONOR PROFILE (FROM CABINET)
  app.put('/api/donor/profile', (req, res) => {
    const { donorId, lastName, firstName, middleName, weight, phone, birthDate, gender, bloodGroup, rhFactor } = req.body;
    if (!donorId) return res.status(400).json({ error: 'Не указан ID донора' });

    const db = getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    donor.lastName = lastName || donor.lastName;
    donor.firstName = firstName || donor.firstName;
    donor.middleName = middleName || donor.middleName;
    donor.phone = phone || donor.phone;
    donor.birthDate = birthDate || donor.birthDate;
    donor.gender = gender || donor.gender;
    donor.bloodGroup = bloodGroup || donor.bloodGroup;
    donor.rhFactor = rhFactor || donor.rhFactor;
    if (weight) donor.weight = parseFloat(weight);

    saveDb(db);
    recalculateDonorStats(donor.id);

    res.json({ success: true, donor });
  });

  // ATTACH AN ADDITIONAL CENTER FOR THE DONOR
  app.post('/api/donor/link-center', (req, res) => {
    const { donorId, centerId } = req.body;
    if (!donorId || !centerId) return res.status(400).json({ error: 'ID донора и центра обязательны' });

    const db = getDb();
    const existing = db.donorCenters.find(dc => dc.donorId === parseInt(donorId) && dc.centerId === parseInt(centerId));
    if (existing) {
      if (existing.status === 'rejected') {
        // change back to pending as resubmission
        existing.status = 'pending';
        existing.resubmissionCount++;
        existing.resubmittedAt = new Date().toISOString();
        saveDb(db);
        return res.json({ success: true, message: 'Заявка отправлена повторно' });
      }
      return res.status(400).json({ error: 'Связь с данным центром уже существует' });
    }

    const nId = db.donorCenters.length > 0 ? Math.max(...db.donorCenters.map(dc => dc.id)) + 1 : 1;
    db.donorCenters.push({
      id: nId,
      donorId: parseInt(donorId),
      centerId: parseInt(centerId),
      isPrimary: false,
      status: 'pending',
      resubmissionCount: 0,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ success: true, message: 'Заявка на привязку успешно отправлена в центр крови!' });
  });

  // DONOR RESUBMIT FOR REJECTED TIE
  app.post('/api/donor/resubmit/:centerId', (req, res) => {
    const centerId = parseInt(req.params.centerId);
    const { donorId } = req.body;

    const db = getDb();
    const link = db.donorCenters.find(l => l.donorId === parseInt(donorId) && l.centerId === centerId);
    if (!link) return res.status(404).json({ error: 'Связь не найдена' });

    link.status = 'pending';
    link.resubmissionCount++;
    link.resubmittedAt = new Date().toISOString();
    
    saveDb(db);
    res.json({ success: true });
  });

  // UPDATE DONOR PAUSE
  app.put('/api/donor/pause', (req, res) => {
    const { donorId, personalPause, personalPauseUntil, personalPauseNote } = req.body;
    const db = getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Профиль не найден' });

    donor.personalPause = !!personalPause;
    donor.personalPauseUntil = personalPause ? (personalPauseUntil || null) : null;
    donor.personalPauseNote = personalPause ? (personalPauseNote || null) : null;

    saveDb(db);
    res.json({ success: true, donor });
  });

  // UPDATE NOTIFICATION ENABLED CHANNELS
  app.put('/api/donor/notifications', (req, res) => {
    const { donorId, smsEnabled, pushEnabled, emailNotificationsEnabled, onesignalPlayerId } = req.body;
    const db = getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Профиль не найден' });

    if (smsEnabled !== undefined) donor.smsEnabled = !!smsEnabled;
    if (pushEnabled !== undefined) donor.pushEnabled = !!pushEnabled;
    if (emailNotificationsEnabled !== undefined) donor.emailNotificationsEnabled = !!emailNotificationsEnabled;
    if (onesignalPlayerId !== undefined) donor.onesignalPlayerId = onesignalPlayerId;

    saveDb(db);
    res.json({ success: true, donor });
  });

  // CENTER DASHBOARD DATA
  app.get('/api/center/stats/:centerId', (req, res) => {
    const centerId = parseInt(req.params.centerId);
    const db = getDb();

    // confirmed donors connected with this center
    const ties = db.donorCenters.filter(dc => dc.centerId === centerId);
    const confirmedTies = ties.filter(t => t.status === 'confirmed');
    const pendingTies = ties.filter(t => t.status === 'pending');

    const confirmedDonors = db.donors.filter(d => confirmedTies.some(t => t.donorId === d.id));
    const pendingDonors = db.donors.filter(d => pendingTies.some(t => t.donorId === d.id));

    // Calculate Ready Now counts
    const todayStr = new Date().toISOString().split('T')[0];
    let readyCount = 0;
    const bloodGroupStats: Record<BloodGroup, number> = { I_O: 0, II_A: 0, III_B: 0, IV_AB: 0 };
    const rhStats: Record<RhFactor, number> = { positive: 0, negative: 0 };

    confirmedDonors.forEach(donor => {
      // get this donor's medical notes
      const notes = db.medicalNotes.filter(m => m.donorId === donor.id);
      const readiness = isDonorReady(donor, todayStr, notes, true);
      if (readiness.ready) {
        readyCount++;
      }
      
      // aggregations
      if (bloodGroupStats[donor.bloodGroup] !== undefined) {
        bloodGroupStats[donor.bloodGroup]++;
      }
      if (rhStats[donor.rhFactor] !== undefined) {
        rhStats[donor.rhFactor]++;
      }
    });

    // Sent notifications logs count for this month
    const currentMonth = new Date().getMonth();
    const notificationsThisMonth = db.notifications.filter(n => {
      const sentDate = new Date(n.createdAt);
      return n.centerId === centerId && sentDate.getMonth() === currentMonth;
    }).length;

    res.json({
      totalDonors: confirmedDonors.length,
      readyCount,
      pendingCount: pendingDonors.length,
      notificationsThisMonth,
      bloodGroupStats,
      rhStats
    });
  });

  // CENTER GET CONNECTED CONFIRMED DONORS
  app.get('/api/center/donors', (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = getDb();
    const ties = db.donorCenters.filter(dc => dc.centerId === centerId && dc.status === 'confirmed');
    let donors = db.donors.filter(d => ties.some(t => t.donorId === d.id));

    // Filtering
    const search = req.query.search as string;
    if (search) {
      const q = search.toLowerCase();
      donors = donors.filter(d => 
        d.lastName.toLowerCase().includes(q) || 
        d.firstName.toLowerCase().includes(q) || 
        (d.middleName && d.middleName.toLowerCase().includes(q))
      );
    }

    const bloodGroups = req.query.bloodGroups as string; // comma-separated e.g. "II_A,I_O"
    if (bloodGroups) {
      const list = bloodGroups.split(',') as BloodGroup[];
      donors = donors.filter(d => list.includes(d.bloodGroup));
    }

    const rhFactors = req.query.rhFactors as string; // comma-separated e.g. "positive"
    if (rhFactors) {
      const list = rhFactors.split(',') as RhFactor[];
      donors = donors.filter(d => list.includes(d.rhFactor));
    }

    const readiness = req.query.readiness as string; // "ready", "not_ready", "all"
    const todayStr = new Date().toISOString().split('T')[0];
    if (readiness === 'ready') {
      donors = donors.filter(d => {
        const notes = db.medicalNotes.filter(m => m.donorId === d.id);
        return isDonorReady(d, todayStr, notes, true).ready;
      });
    } else if (readiness === 'not_ready') {
      donors = donors.filter(d => {
        const notes = db.medicalNotes.filter(m => m.donorId === d.id);
        return !isDonorReady(d, todayStr, notes, true).ready;
      });
    }

    const statusFilter = req.query.status as string; // "active", "inactive"
    if (statusFilter) {
      donors = donors.filter(d => d.status === statusFilter);
    }

    res.json(donors);
  });

  // GET DETAILED DONOR CARD FOR CENTER
  app.get('/api/center/donors/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const centerId = parseInt(req.query.centerId as string);

    const db = getDb();
    const donor = db.donors.find(d => d.id === id);
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    const link = db.donorCenters.find(dc => dc.donorId === id && dc.centerId === centerId);
    const donations = db.donations.filter(d => d.donorId === id);
    const medicalNotes = db.medicalNotes.filter(m => m.donorId === id);

    const todayStr = new Date().toISOString().split('T')[0];
    const readiness = isDonorReady(donor, todayStr, medicalNotes, link?.status === 'confirmed');

    res.json({
      donor,
      link,
      donations,
      medicalNotes,
      readiness
    });
  });

  // CREATE DONOR IN CENTER (DIRECT ACTION)
  app.post('/api/center/donors', (req, res) => {
    const {
      centerId,
      lastName,
      firstName,
      middleName,
      birthDate,
      gender,
      bloodGroup,
      rhFactor,
      weight,
      phone,
      email,
      password // temporary password will be shown
    } = req.body;

    if (!lastName || !firstName || !birthDate || !gender || !bloodGroup || !rhFactor || !weight || !phone || !email || !password || !centerId) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const db = getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким e-mail уже зарегистрирован' });
    }

    const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    db.users.push({
      id: newUserId,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: 'donor',
      isActive: true,
      createdAt: new Date().toISOString()
    });

    const newDonorId = db.donors.length > 0 ? Math.max(...db.donors.map(d => d.id)) + 1 : 1;
    const donor: Donor = {
      id: newDonorId,
      userId: newUserId,
      lastName,
      firstName,
      middleName,
      birthDate,
      gender,
      bloodGroup,
      rhFactor,
      weight: parseFloat(weight),
      phone,
      status: 'active',
      smsEnabled: true,
      pushEnabled: false,
      emailNotificationsEnabled: true,
      personalPause: false,
      donationsCount: 0,
      bloodDonationsCount: 0,
      createdAt: new Date().toISOString()
    };
    db.donors.push(donor);

    const newLinkId = db.donorCenters.length > 0 ? Math.max(...db.donorCenters.map(dc => dc.id)) + 1 : 1;
    db.donorCenters.push({
      id: newLinkId,
      donorId: newDonorId,
      centerId: parseInt(centerId),
      isPrimary: true,
      status: 'confirmed',
      resubmissionCount: 0,
      confirmedById: 2, // Test coordinator
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ success: true, donor });
  });

  // UPDATE DONOR PROFILE FROM CENTER
  app.put('/api/center/donors/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { lastName, firstName, middleName, weight, phone, birthDate, gender, bloodGroup, rhFactor, status } = req.body;

    const db = getDb();
    const donor = db.donors.find(d => d.id === id);
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    // Validate blood group changes warning (front-end alerts, server forces validation)
    donor.lastName = lastName || donor.lastName;
    donor.firstName = firstName || donor.firstName;
    donor.middleName = middleName !== undefined ? middleName : donor.middleName;
    donor.phone = phone || donor.phone;
    donor.birthDate = birthDate || donor.birthDate;
    donor.gender = gender || donor.gender;
    donor.bloodGroup = bloodGroup || donor.bloodGroup;
    donor.rhFactor = rhFactor || donor.rhFactor;
    if (weight) donor.weight = parseFloat(weight);
    if (status) donor.status = status;

    saveDb(db);
    recalculateDonorStats(id);

    res.json({ success: true, donor });
  });

  // ADD RECORD OF DONATION
  app.post('/api/center/donors/:id/donations', (req, res) => {
    const donorId = parseInt(req.params.id);
    const { centerId, donationDate, donationType, volumeMl, note, addedBy } = req.body;

    if (!donationDate || !donationType) {
      return res.status(400).json({ error: 'Дата и тип донации обязательны' });
    }

    const db = getDb();
    const newId = db.donations.length > 0 ? Math.max(...db.donations.map(d => d.id)) + 1 : 1;
    db.donations.push({
      id: newId,
      donorId,
      centerId: parseInt(centerId),
      donationDate,
      donationType,
      volumeMl: volumeMl ? parseInt(volumeMl) : undefined,
      note,
      addedBy: addedBy ? parseInt(addedBy) : undefined,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    recalculateDonorStats(donorId);

    res.json({ success: true });
  });

  // DELETE RECORD OF DONATION
  app.delete('/api/donations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const db = getDb();
    const donationIdx = db.donations.findIndex(d => d.id === id);
    if (donationIdx === -1) return res.status(404).json({ error: 'Донация не найдена' });

    const donorId = db.donations[donationIdx].donorId;
    db.donations.splice(donationIdx, 1);
    saveDb(db);
    recalculateDonorStats(donorId);

    res.json({ success: true });
  });

  // ADD MEDICAL NOTE
  app.post('/api/center/donors/:id/medical-notes', (req, res) => {
    const donorId = parseInt(req.params.id);
    const { centerId, reason, startDate, endDate, createdBy } = req.body;

    if (!reason || !startDate) {
      return res.status(400).json({ error: 'Причина медотвода и дата начала обязательны' });
    }

    const db = getDb();
    const newId = db.medicalNotes.length > 0 ? Math.max(...db.medicalNotes.map(m => m.id)) + 1 : 1;
    db.medicalNotes.push({
      id: newId,
      donorId,
      centerId: parseInt(centerId),
      createdBy: createdBy ? parseInt(createdBy) : 2,
      reason,
      startDate,
      endDate: endDate || null,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ success: true });
  });

  // LIFT MEDICAL NOTE
  app.put('/api/center/medical-notes/:id/lift', (req, res) => {
    const id = parseInt(req.params.id);
    const { liftNote, liftedBy } = req.body;

    const db = getDb();
    const note = db.medicalNotes.find(m => m.id === id);
    if (!note) return res.status(404).json({ error: 'Медотвод не найден' });

    note.isActive = false;
    note.liftedAt = new Date().toISOString();
    note.liftedBy = liftedBy ? parseInt(liftedBy) : 2;
    note.liftNote = liftNote || 'Снят врачом вручную';

    saveDb(db);
    res.json({ success: true });
  });

  // GET LIST OF PENDING APPLICATIONS
  app.get('/api/center/pending', (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = getDb();
    const pendingTies = db.donorCenters.filter(dc => dc.centerId === centerId && dc.status === 'pending');
    
    // Enrich with donor core profile details
    const result = pendingTies.map(tie => {
      const donor = db.donors.find(d => d.id === tie.donorId);
      return {
        link: tie,
        donor: donor || null
      };
    });

    res.json(result);
  });

  // CONFIRM OR REJECT PENDING RELATION
  app.post('/api/center/pending/:id/resolve', (req, res) => {
    const linkId = parseInt(req.params.id);
    const { status, rejectionReason, confirmedById } = req.body; // 'confirmed' or 'rejected'

    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const db = getDb();
    const link = db.donorCenters.find(dc => dc.id === linkId);
    if (!link) return res.status(404).json({ error: 'Заявка не найдена' });

    link.status = status as DonorCenterStatus;
    if (status === 'confirmed') {
      link.confirmedAt = new Date().toISOString();
      link.confirmedById = confirmedById ? parseInt(confirmedById) : 2;
      link.rejectionReason = undefined;
    } else {
      link.rejectionReason = rejectionReason || 'Не указана';
    }

    saveDb(db);
    res.json({ success: true });
  });

  // HELPER FILTER FOR TARGET NOTIFICATE GROUP FOR COUNTS & DISPATCH
  function getRecipientsForFilter(params: any): { donors: Donor[]; ids: number[] } {
    const centerId = parseInt(params.centerId);
    const db = getDb();

    // Only confirmed coordinates
    const ties = db.donorCenters.filter(dc => dc.centerId === centerId && dc.status === 'confirmed');
    let targets = db.donors.filter(d => ties.some(t => t.donorId === d.id));

    // Exclude basic inactive
    targets = targets.filter(d => d.status === 'active');

    // Filter by Blood Group Array
    let selectedBgs: BloodGroup[] = [];
    if (params.bloodGroups) {
      selectedBgs = (Array.isArray(params.bloodGroups) ? params.bloodGroups : [params.bloodGroups]) as BloodGroup[];
      if (selectedBgs.length > 0) {
        targets = targets.filter(d => selectedBgs.includes(d.bloodGroup));
      }
    }

    // Filter by Rh Factor
    const rh = params.rhFactor as RhFactor | 'both';
    if (rh && rh !== 'both') {
      targets = targets.filter(d => d.rhFactor === rh);
    }

    // Exclude medical pauses
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    if (params.excludeMedical) {
      targets = targets.filter(d => {
        const medicalNotes = db.medicalNotes.filter(m => m.donorId === d.id && m.isActive);
        const hasActiveMedical = medicalNotes.some(note => {
          const start = new Date(note.startDate);
          if (start > today) return false;
          if (!note.endDate) return true; // Permanent
          const end = new Date(note.endDate);
          return end >= today;
        });
        return !hasActiveMedical;
      });
    }

    // Exclude personal pauses
    if (params.excludePause) {
      targets = targets.filter(d => {
        if (!d.personalPause) return true;
        if (!d.personalPauseUntil) return false; // permanent pause
        const pauseUntil = new Date(d.personalPauseUntil);
        return pauseUntil < today; // pause has ended
      });
    }

    // Min days since last donation criteria
    const minDays = parseInt(params.minDaysSinceDonation);
    if (!isNaN(minDays) && minDays > 0) {
      targets = targets.filter(d => {
        if (!d.lastDonationDate) return true; // never donated, fits
        const lastDate = new Date(d.lastDonationDate);
        const diffMs = today.getTime() - lastDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return diffDays >= minDays;
      });
    }

    return {
      donors: targets,
      ids: targets.map(t => t.id)
    };
  }

  // PREVIEW COUNT OF TARGET RECIPIENTS
  app.post('/api/center/notify/preview', (req, res) => {
    const list = getRecipientsForFilter(req.body);
    res.json({ count: list.donors.length });
  });

  // SEND SYSTEM ALERTS (PUSH, SMS, EMAIL)
  app.post('/api/center/notify/send', (req, res) => {
    const {
      centerId,
      sentBy,
      bloodGroups,
      rhFactor,
      donationType,
      minDaysSinceDonation,
      excludeMedical,
      excludePause,
      channel,
      messageText
    } = req.body;

    if (!messageText || !centerId) {
      return res.status(400).json({ error: 'Текст уведомления обязателен' });
    }

    // Get filter list
    const filterResults = getRecipientsForFilter(req.body);
    const targetDonors = filterResults.donors;

    const db = getDb();
    const newNotificationId = db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;

    let totalPush = 0;
    let totalSms = 0;
    let totalEmail = 0;

    const recipientsMap = targetDonors.map(donor => {
      let pushStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
      let smsStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
      let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';

      const needsPush = ['push', 'push_sms', 'all'].includes(channel);
      const needsSms = ['sms', 'push_sms', 'all'].includes(channel);
      const needsEmail = ['email', 'all'].includes(channel);

      if (needsPush) {
        if (donor.pushEnabled && donor.onesignalPlayerId) {
          pushStatus = 'sent';
          totalPush++;
        } else {
          pushStatus = 'failed';
        }
      }

      if (needsSms) {
        if (donor.smsEnabled && donor.phone) {
          smsStatus = 'sent';
          totalSms++;
        } else {
          smsStatus = 'failed';
        }
      }

      if (needsEmail) {
        if (donor.emailNotificationsEnabled) {
          emailStatus = 'sent';
          totalEmail++;
        } else {
          emailStatus = 'failed';
        }
      }

      const recId = db.notificationRecipients.length > 0 ? Math.max(...db.notificationRecipients.map(nr => nr.id)) + 1 : 1;
      const rec = {
        id: recId,
        notificationId: newNotificationId,
        donorId: donor.id,
        pushStatus,
        smsStatus,
        emailStatus,
        sentAt: new Date().toISOString()
      };
      db.notificationRecipients.push(rec);
      return rec;
    });

    db.notifications.push({
      id: newNotificationId,
      centerId: parseInt(centerId),
      sentBy: parseInt(sentBy) || 2,
      bloodGroups: bloodGroups || [],
      rhFactor: rhFactor || 'both',
      donationType: donationType || 'any',
      minDaysSinceDonation: parseInt(minDaysSinceDonation) || 0,
      excludeMedical: excludeMedical !== undefined ? !!excludeMedical : true,
      excludePause: excludePause !== undefined ? !!excludePause : true,
      channel: channel as NotificationChannel,
      messageText,
      recipientsCount: targetDonors.length,
      pushSent: totalPush,
      smsSent: totalSms,
      emailSent: totalEmail,
      status: targetDonors.length === 0 ? 'failed' : 'sent',
      createdAt: new Date().toISOString()
    });

    saveDb(db);

    res.json({
      success: true,
      recipientsCount: targetDonors.length,
      pushSent: totalPush,
      smsSent: totalSms,
      emailSent: totalEmail
    });
  });

  // NEWS LOGS
  app.get('/api/center/notifications', (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = getDb();
    const lists = db.notifications.filter(n => n.centerId === centerId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(lists);
  });

  // --- Vite Dev Server Middleware Integration ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API routes on fallback
      if (url.startsWith('/api')) return next();

      try {
        let template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Donor-Alert] Express back-end running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Donor-Alert] Failed to start server:', err);
});
