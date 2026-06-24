import 'express-async-errors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import * as OneSignal from 'onesignal-node';
import { getDb, saveDb } from './server/db.js';
import { calculateNextDates, isDonorReady } from './src/utils/intervals.js';
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
} from './src/types.js';

import { dispatchNotifications, sendTransactionalEmail } from './server/notifications.js';

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
  if (hash.startsWith('$2')) {
    return bcrypt.compareSync(password, hash);
  }
  const sha = crypto.createHash('sha256').update(password).digest('hex');
  return hash === sha || hash === password;
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

// Recalculates stats for a single donor based on their donations
async function recalculateDonorStats(donorId: number) {
  const db = await getDb();
  const donor = db.donors.find(d => d.id === donorId);
  if (!donor) return;

  const donations = db.donations
    .filter(d => d.donorId === donorId)
    .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());

  const lastDonation = donations[0] || null;
  const totalDonationsCount = donations.length;
  const bloodDonationsCount = donations.filter(d => d.donationType === 'blood').length;
  
  const plasmaDonationsCount = donations.filter(d => d.donationType === 'plasma').length;
  const plateletsDonationsCount = donations.filter(d => d.donationType === 'platelets').length;
  
  const bloodFreeCount = donations.filter(d => d.donationType === 'blood' && !d.isPaid).length;
  const bloodPaidCount = donations.filter(d => d.donationType === 'blood' && d.isPaid).length;
  const compFreeCount = donations.filter(d => d.donationType !== 'blood' && d.donationType !== 'granulocytes' && !d.isPaid).length;
  const compPaidCount = donations.filter(d => d.donationType !== 'blood' && d.donationType !== 'granulocytes' && d.isPaid).length;

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
  donor.plasmaDonationsCount = plasmaDonationsCount;
  donor.plateletsDonationsCount = plateletsDonationsCount;
  donor.bloodFreeCount = bloodFreeCount;
  donor.bloodPaidCount = bloodPaidCount;
  donor.compFreeCount = compFreeCount;
  donor.compPaidCount = compPaidCount;
  donor.lastDonationDate = lastDonation ? lastDonation.donationDate : null;
  donor.lastDonationType = lastDonation ? lastDonation.donationType : null;
  donor.nextAvailableDate = nextAvailableDateStr;

  await saveDb(db);
}

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
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Пожалуйста, введите e-mail и пароль' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
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
  app.post('/api/auth/register', async (req, res) => {
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
      pushEnabled,
      emailNotificationsEnabled
    } = req.body;

    if (!lastName || !firstName || !birthDate || !gender || !bloodGroup || !rhFactor || !weight || !phone || !email || !password || !primaryCenterId) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    const cleanEmail = email.toLowerCase().trim();

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

    const db = await getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким e-mail уже зарегистрирован' });
    }

    // Create User account
    const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser: User = {
      id: newUserId,
      email: cleanEmail,
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

    await saveDb(db);

    try {
      await sendTransactionalEmail(email, 'welcome');
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }

    res.json({ success: true, message: 'Регистрация прошла успешно. Ожидайте подтверждения центра крови!' });
  });

  // RESET PASSWORD REQUEST MOCK
  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }
    
    // Generate a 4-digit mock code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetCode = resetCode;
    await saveDb(db);
    
    try {
      await sendTransactionalEmail(email, 'reset', { code: resetCode, email });
    } catch (err) {
      console.error('Failed to send reset email:', err);
    }

    res.json({ success: true, message: `Код для восстановления пароля отправлен на ваш e-mail.` });
  });

  // CONFIRM RESET PASSWORD
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    
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
    await saveDb(db);
    
    res.json({ success: true, message: 'Пароль успешно изменён' });
  });

  // --- ADMIN SYSTEM CONTROLS ---

  // ADMIN ALL DATA
  app.get('/api/admin/all-data', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; 
    const userId = parseInt(userIdStr);

    const db = await getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ прерван' });
    }

    res.json({
      users: db.users,
      centers: db.centers,
      donors: db.donors,
      donorCenters: db.donorCenters,
      donations: db.donations,
      medicalNotes: db.medicalNotes,
      news: db.news,
      notifications: db.notifications,
      donationAppointments: db.donationAppointments || []
    });
  });

  // ADMIN UPDATE ENTITY
  app.post('/api/admin/update-entity', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; 
    const userId = parseInt(userIdStr);

    const db = await getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ прерван' });
    }

    const { entityName, entity } = req.body;
    if (!entityName || !entity) {
      return res.status(400).json({ error: 'Неверные параметры запроса' });
    }

    const collection = (db as any)[entityName];
    if (!Array.isArray(collection)) {
      return res.status(400).json({ error: 'Неверное имя коллекции' });
    }

    // Generate or parse id
    const id = entity.id ? parseInt(entity.id) : null;
    
    if (id) {
      const idx = collection.findIndex((item: any) => item.id === id);
      if (idx !== -1) {
        // Update in place
        collection[idx] = { ...collection[idx], ...entity, id };
      } else {
        // Add with specific id
        collection.push({ ...entity, id });
      }
    } else {
      // Create new
      const nextId = collection.length > 0 ? Math.max(...collection.map((item: any) => item.id)) + 1 : 1;
      collection.push({ ...entity, id: nextId });
    }

    // For specific dependencies
    if (entityName === 'donations') {
      const donorId = entity.donorId ? parseInt(entity.donorId) : null;
      if (donorId) {
        setTimeout(() => recalculateDonorStats(donorId).catch(console.error), 200);
      }
    } else if (entityName === 'donationAppointments' && entity.status === 'completed') {
      const appt = collection.find((item: any) => item.id === id);
      if (appt) {
        // Check if a donation already exists for this appointment
        const donationExists = db.donations.find(d => d.donorId === appt.donorId && d.donationDate === appt.appointmentDate && d.centerId === appt.centerId);
        
        if (!donationExists) {
          const nextDonationId = db.donations.length > 0 ? Math.max(...db.donations.map(d => d.id)) + 1 : 1;
          db.donations.push({
            id: nextDonationId,
            donorId: appt.donorId,
            centerId: appt.centerId,
            donationDate: appt.appointmentDate,
            donationType: appt.donationType,
            isPaid: false, // Default
            volumeMl: 450, // Default
            createdAt: new Date().toISOString()
          });
          const donorId = parseInt(appt.donorId);
          if (donorId) {
            setTimeout(() => recalculateDonorStats(donorId).catch(console.error), 200);
          }
        }
      }
    }

    await saveDb(db);
    res.json({ success: true, db });
  });

  // ADMIN DELETE ENTITY
  app.post('/api/admin/delete-entity', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; 
    const userId = parseInt(userIdStr);

    const db = await getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ прерван' });
    }

    const { entityName, id } = req.body;
    if (!entityName || id === undefined) {
      return res.status(400).json({ error: 'Неверные параметры запроса' });
    }

    const collection = (db as any)[entityName];
    if (!Array.isArray(collection)) {
      return res.status(400).json({ error: 'Неверное имя коллекции' });
    }

    const targetId = parseInt(id);
    const idx = collection.findIndex((item: any) => item.id === targetId);
    if (idx !== -1) {
      collection.splice(idx, 1);
    }

    await saveDb(db);
    res.json({ success: true, db });
  });

  // GET ALL CLINICS
  app.get('/api/centers', async (req, res) => {
    const db = await getDb();
    res.json(db.centers);
  });

  // UPDATE CENTER NEEDS
  app.patch('/api/centers/:id/needs', async (req, res) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; 
    const userId = parseInt(userIdStr);

    const db = await getDb();
    const user = db.users.find(u => u.id === userId);
    const centerId = parseInt(req.params.id);

    if (!user || user.role !== 'center' || user.centerId !== centerId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    const index = db.centers.findIndex(c => c.id === centerId);
    if (index === -1) {
      return res.status(404).json({ error: 'Центр не найден' });
    }

    const { bloodNeeds } = req.body;
    db.centers[index].bloodNeeds = { ...db.centers[index].bloodNeeds, ...bloodNeeds };
    
    await saveDb(db);
    res.json(db.centers[index]);
  });

  // GET PUBLIC STATS
  let cachedPublicStats: any = null;
  let publicStatsCacheTime = 0;
  app.get('/api/public-stats', async (req, res) => {
    if (cachedPublicStats && Date.now() - publicStatsCacheTime < 5 * 60 * 1000) {
      return res.json(cachedPublicStats);
    }

    const db = await getDb();
    const activeDonors = db.donors.filter(d => d.status === 'active').length;
    const centersCount = db.centers.length;
    const sentAlerts = db.notifications.length;

    const needsAggregate: Record<string, { sum: number, count: number }> = {
      I_pos: { sum: 0, count: 0 }, I_neg: { sum: 0, count: 0 },
      II_pos: { sum: 0, count: 0 }, II_neg: { sum: 0, count: 0 },
      III_pos: { sum: 0, count: 0 }, III_neg: { sum: 0, count: 0 },
      IV_pos: { sum: 0, count: 0 }, IV_neg: { sum: 0, count: 0 }
    };

    db.centers.forEach((c: any) => {
      if (c.bloodNeeds) {
        Object.entries(c.bloodNeeds).forEach(([key, val]) => {
          if (needsAggregate[key]) {
            needsAggregate[key].sum += val as number;
            needsAggregate[key].count += 1;
          }
        });
      }
    });

    const averageNeeds: Record<string, number> = {};
    Object.keys(needsAggregate).forEach(key => {
      averageNeeds[key] = needsAggregate[key].count > 0 
        ? Math.round(needsAggregate[key].sum / needsAggregate[key].count) 
        : 100;
    });

    cachedPublicStats = {
      totalDonorsCount: activeDonors,
      centersCount: centersCount,
      sentAlertsCount: sentAlerts,
      averageNeeds
    };
    publicStatsCacheTime = Date.now();

    res.json(cachedPublicStats);
  });

  // GET GLOBAL NEWS
  app.get('/api/news', async (req, res) => {
    const db = await getDb();
    res.json(db.news); // Front-end will filter for guests
  });

  // CREATE NEWS (CENTER)
  app.post('/api/news', async (req, res) => {
    const { title, content, isPublished, publishedAt, centerId, sentBy } = req.body;
    if (!title || !content || !centerId) {
      return res.status(400).json({ error: 'Заголовок и текст обязательны' });
    }

    const db = await getDb();
    const newId = db.news.length > 0 ? Math.max(...db.news.map(n => n.id)) + 1 : 1;
    db.news.push({
      id: newId,
      centerId: parseInt(centerId),
      title,
      content,
      isPublished: true, // We always treat as true and check date for status in UI
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: parseInt(sentBy) || 1
    });
    await saveDb(db);
    res.json({ success: true });
  });

  // UPDATE NEWS (CENTER)
  app.put('/api/news/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content, isPublished, publishedAt } = req.body;

    const db = await getDb();
    const newsIdx = db.news.findIndex(n => n.id === id);
    if (newsIdx === -1) return res.status(404).json({ error: 'Новость не найдена' });

    db.news[newsIdx].title = title || db.news[newsIdx].title;
    db.news[newsIdx].content = content || db.news[newsIdx].content;
    
    if (publishedAt) {
      db.news[newsIdx].publishedAt = new Date(publishedAt).toISOString();
    }

    await saveDb(db);
    res.json({ success: true });
  });

  // DELETE NEWS (CENTER)
  app.delete('/api/news/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const db = await getDb();
    const index = db.news.findIndex(n => n.id === id);
    if (index === -1) return res.status(404).json({ error: 'Новость не найдена' });
    db.news.splice(index, 1);
    await saveDb(db);
    res.json({ success: true });
  });

  // GET DONOR PROFILE INFO
  app.get('/api/donor/profile', async (req, res) => {
    // Basic session decoding from Header token
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });

    const userIdStr = token.split('-')[3]; // Extract user ID mock from e.g. mock-session-token-1-12312
    const userId = parseInt(userIdStr);

    const db = await getDb();
    const donor = db.donors.find(d => d.userId === userId);
    if (!donor) return res.status(404).json({ error: 'Профиль донора не найден' });

    // Find links to centers
    const links = db.donorCenters.filter(dc => dc.donorId === donor.id);
    const medicalNotes = db.medicalNotes.filter(m => m.donorId === donor.id);
    const donations = db.donations
      .filter(d => d.donorId === donor.id)
      .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());


    // Calculate donor setup info
    const confirmedCenters = links.filter(l => l.status === 'confirmed');
    const todayStr = new Date().toISOString().split('T')[0];
    const readiness = isDonorReady(donor, todayStr, medicalNotes, confirmedCenters.length > 0);

    const user = db.users.find(u => u.id === userId);
    if (user) {
      donor.email = user.email;
    }

    res.json({
      donor,
      links,
      medicalNotes,
      donations,
      readiness
    });
  });

  // UPDATE DONOR PROFILE (FROM CABINET)
  app.put('/api/donor/profile', async (req, res) => {
    const { donorId, lastName, firstName, middleName, weight, phone, birthDate, gender, bloodGroup, rhFactor, email } = req.body;
    if (!donorId) return res.status(400).json({ error: 'Не указан ID донора' });

    const db = await getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    donor.lastName = lastName || donor.lastName;
    donor.firstName = firstName || donor.firstName;
    donor.middleName = middleName !== undefined ? middleName : donor.middleName;
    donor.phone = phone || donor.phone;
    donor.birthDate = birthDate || donor.birthDate;
    donor.gender = gender || donor.gender;
    donor.bloodGroup = bloodGroup || donor.bloodGroup;
    donor.rhFactor = rhFactor || donor.rhFactor;
    if (weight) donor.weight = parseFloat(weight);

    const user = db.users.find(u => u.id === donor.userId);
    if (user && email && typeof email === 'string') {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        user.email = cleanEmail;
      }
      donor.email = cleanEmail;
    }

    // Reset status of all centers links to pending to request center confirmation
    const ties = db.donorCenters.filter(dc => dc.donorId === donor.id);
    for (const link of ties) {
      link.status = 'pending';
      link.resubmissionCount = (link.resubmissionCount || 0) + 1;
      link.resubmittedAt = new Date().toISOString();
      link.confirmedAt = null;
      link.confirmedById = null;
    }

    await saveDb(db);
    await recalculateDonorStats(donor.id);

    res.json({ success: true, donor });
  });

  // ATTACH AN ADDITIONAL CENTER FOR THE DONOR
  app.post('/api/donor/link-center', async (req, res) => {
    const { donorId, centerId } = req.body;
    if (!donorId || !centerId) return res.status(400).json({ error: 'ID донора и центра обязательны' });

    const db = await getDb();
    const existing = db.donorCenters.find(dc => dc.donorId === parseInt(donorId) && dc.centerId === parseInt(centerId));
    if (existing) {
      if (existing.status === 'rejected') {
        // change back to pending as resubmission
        existing.status = 'pending';
        existing.resubmissionCount++;
        existing.resubmittedAt = new Date().toISOString();
        existing.confirmedAt = null;
        existing.confirmedById = null;
        existing.rejectionReason = undefined;
        await saveDb(db);
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

    await saveDb(db);
    res.json({ success: true, message: 'Заявка на привязку успешно отправлена в центр крови!' });
  });

  // SET THE PRIMARY (HOME) CENTER FOR THE DONOR
  app.post('/api/donor/set-primary-center', async (req, res) => {
    const { donorId, centerId } = req.body;
    if (!donorId || !centerId) return res.status(400).json({ error: 'ID донора и центра обязательны' });

    const db = await getDb();
    const parseDonorId = parseInt(donorId);
    const parseCenterId = parseInt(centerId);

    const userCenterLinks = db.donorCenters.filter(dc => dc.donorId === parseDonorId);
    const targetLink = userCenterLinks.find(dc => dc.centerId === parseCenterId);
    if (!targetLink) {
      return res.status(404).json({ error: 'Связь с данным центром не найдена' });
    }

    for (const link of userCenterLinks) {
      link.isPrimary = (link.centerId === parseCenterId);
    }

    await saveDb(db);
    res.json({ success: true, message: 'Домашний центр успешно изменен!' });
  });

  // DONOR RESUBMIT FOR REJECTED TIE
  app.post('/api/donor/resubmit/:centerId', async (req, res) => {
    const centerId = parseInt(req.params.centerId);
    const { donorId } = req.body;

    const db = await getDb();
    const link = db.donorCenters.find(l => l.donorId === parseInt(donorId) && l.centerId === centerId);
    if (!link) return res.status(404).json({ error: 'Связь не найдена' });

    link.status = 'pending';
    link.resubmissionCount++;
    link.resubmittedAt = new Date().toISOString();
    link.confirmedAt = null;
    link.confirmedById = null;
    link.rejectionReason = undefined;
    
    await saveDb(db);
    res.json({ success: true });
  });

  // UPDATE DONOR PAUSE
  app.put('/api/donor/pause', async (req, res) => {
    const { donorId, personalPause, personalPauseUntil, personalPauseNote } = req.body;
    const db = await getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Профиль не найден' });

    donor.personalPause = !!personalPause;
    donor.personalPauseUntil = personalPause ? (personalPauseUntil || null) : null;
    donor.personalPauseNote = personalPause ? (personalPauseNote || null) : null;

    const todayStr = new Date().toISOString().split('T')[0];
    const donorTies = db.donorCenters.filter(dc => dc.donorId === donor.id && dc.status === 'confirmed');
    const centerIds = donorTies.length > 0 ? donorTies.map(dc => dc.centerId) : (db.centers && db.centers.length > 0 ? [db.centers[0].id] : [1]);

    if (donor.personalPause) {
      // Find or create medical notes for each associated center
      centerIds.forEach(cid => {
        let existingNote = db.medicalNotes.find(m => m.donorId === donor.id && m.centerId === cid && m.reason.startsWith('Временный медотвод: Личная пауза'));
        
        if (existingNote) {
          existingNote.reason = `Временный медотвод: Личная пауза донора (${personalPauseNote || 'Временно не могу сдавать'})`;
          existingNote.startDate = todayStr;
          existingNote.endDate = personalPauseUntil || null;
          existingNote.isActive = true;
          existingNote.liftedAt = null;
          existingNote.liftedBy = null;
          existingNote.liftNote = null;
        } else {
          const nextId = db.medicalNotes.length > 0 ? Math.max(...db.medicalNotes.map(m => m.id)) + 1 : 1;
          const newNote = {
            id: nextId,
            donorId: donor.id,
            centerId: cid,
            createdBy: 1, // System
            reason: `Временный медотвод: Личная пауза донора (${personalPauseNote || 'Временно не могу сдавать'})`,
            startDate: todayStr,
            endDate: personalPauseUntil || null,
            isActive: true,
            liftedAt: null,
            liftedBy: null,
            liftNote: null,
            createdAt: new Date().toISOString()
          };
          db.medicalNotes.push(newNote);
        }
      });
    } else {
      // Deactivate / lift any active personal pause medical notes
      db.medicalNotes.forEach(m => {
        if (m.donorId === donor.id && m.reason.startsWith('Временный медотвод: Личная пауза') && m.isActive) {
          m.isActive = false;
          m.liftedAt = new Date().toISOString();
          m.liftedBy = 1; // System
          m.liftNote = 'Личная пауза отключена донором';
        }
      });
    }

    await saveDb(db);
    res.json({ success: true, donor });
  });

  // UPDATE NOTIFICATION ENABLED CHANNELS
  app.put('/api/donor/notifications', async (req, res) => {
    const { donorId, pushEnabled, emailNotificationsEnabled, onesignalPlayerId } = req.body;
    const db = await getDb();
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Профиль не найден' });

    if (pushEnabled !== undefined) donor.pushEnabled = !!pushEnabled;
    if (emailNotificationsEnabled !== undefined) donor.emailNotificationsEnabled = !!emailNotificationsEnabled;
    if (onesignalPlayerId !== undefined) donor.onesignalPlayerId = onesignalPlayerId;

    await saveDb(db);
    res.json({ success: true, donor });
  });

  // GET RECEIVED NOTIFICATIONS FOR DONOR HISTORY
  app.get('/api/donor/notifications/:donorId', async (req, res) => {
    const donorId = parseInt(req.params.donorId);
    if (!donorId) return res.status(400).json({ error: 'Не указан ID донора' });

    const db = await getDb();
    
    // Find all recipient entries for this donor
    const recs = db.notificationRecipients.filter(r => r.donorId === donorId);
    
    // map recipient records to actual notification details, sorted by date DESC
    const history = recs.map(rec => {
      const notif = db.notifications.find(n => n.id === rec.notificationId);
      const center = db.centers.find(c => c.id === (notif?.centerId || notif?.centerId));
      return {
        id: rec.id,
        messageText: notif?.messageText || 'Уведомление от центра крови',
        centerName: center?.name || 'Центр крови',
        sentAt: rec.sentAt || notif?.createdAt || new Date().toISOString(),
        pushStatus: rec.pushStatus,
        emailStatus: rec.emailStatus,
        channel: notif?.channel || 'all',
        isRead: rec.isRead
      };
    }).sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    res.json({ success: true, notifications: history });
  });

  app.post('/api/donor/notifications/read-all', async (req, res) => {
    const { donorId } = req.body;
    if (!donorId) return res.status(400).json({ error: 'Не указан ID донора' });

    const db = await getDb();
    let changed = false;
    db.notificationRecipients.forEach(r => {
      if (r.donorId === donorId && !r.isRead) {
        r.isRead = true;
        changed = true;
      }
    });

    if (changed) {
      await saveDb(db);
    }
    res.json({ success: true });
  });

  // CENTER DASHBOARD DATA
  app.get('/api/center/stats/:centerId', async (req, res) => {
    const centerId = parseInt(req.params.centerId);
    const db = await getDb();

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

    // Calculate response metrics
    const centerDonations = db.donations.filter(d => d.centerId === centerId);
    let totalSent = 0;
    let respondedCount = 0;
    let totalResponseTimeMs = 0;

    db.notifications.filter(n => n.centerId === centerId).forEach(n => {
       const recs = db.notificationRecipients.filter(r => r.notificationId === n.id);
       totalSent += recs.length;
       
       recs.forEach(rec => {
           const sentTime = new Date(rec.sentAt).getTime();
           const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
           
           // Check if donor made a donation after sentAt within 7 days
           const matchingDonation = centerDonations.find(d => 
               d.donorId === rec.donorId && 
               new Date(d.donationDate).getTime() >= sentTime &&
               new Date(d.donationDate).getTime() <= sentTime + sevenDaysMs
           );
           
           if (matchingDonation) {
               respondedCount++;
               totalResponseTimeMs += (new Date(matchingDonation.donationDate).getTime() - sentTime);
           }
       });
    });

    let rate = totalSent > 0 ? Math.round((respondedCount / totalSent) * 100) : 0;
    let avgResponseTimeHours = respondedCount > 0 ? (totalResponseTimeMs / respondedCount) / (1000 * 60 * 60) : 0;

    // Suspension breakdown
    const todayForMedical = new Date();
    todayForMedical.setHours(0,0,0,0);

    let permanentCount = 0;
    let temporaryCount = 0;
    let noSuspensionCount = 0;

    confirmedDonors.forEach(d => {
       const donorNotes = db.medicalNotes.filter(m => m.donorId === d.id && m.isActive);
       const activeNotes = donorNotes.filter(m => {
          const start = new Date(m.startDate);
          start.setHours(0,0,0,0);
          if (start > todayForMedical) return false;
          if (m.endDate) {
              const end = new Date(m.endDate);
              end.setHours(23,59,59,999);
              if (end < todayForMedical) return false;
          }
          return true;
       });

       if (activeNotes.length === 0) {
          noSuspensionCount++;
       } else if (activeNotes.some(m => !m.endDate)) {
          permanentCount++;
       } else {
          temporaryCount++;
       }
    });

    const totalDonorsCount = confirmedDonors.length;
    let permPercent = 0;
    let tempPercent = 0;
    let nonePercent = 100;

    if (totalDonorsCount > 0) {
       permPercent = Math.round((permanentCount / totalDonorsCount) * 100);
       tempPercent = Math.round((temporaryCount / totalDonorsCount) * 100);
       nonePercent = 100 - (permPercent + tempPercent);
       if (nonePercent < 0) {
          nonePercent = 0;
       }
    }

    const suspensionBreakdown = [
       { label: 'Постоянный медотвод', value: permPercent, color: 'bg-red-500' },
       { label: 'Временный медотвод', value: tempPercent, color: 'bg-amber-500' },
       { label: 'Нет медотводов', value: nonePercent, color: 'bg-emerald-500' }
    ];

    // Weekly load (based on actual appointments for the next 7 days)
    const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
    const now = new Date();
    const weeklyLoad = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const count = db.donationAppointments?.filter(a => 
            a.centerId === centerId && 
            a.appointmentDate === dateStr &&
            a.status === 'confirmed'
        ).length || 0;
        
        // Define color based on load thresholds (e.g., >20 is high, >10 is medium)
        let color = 'bg-emerald-100 text-emerald-700';
        if (count > 10) color = 'bg-amber-100 text-amber-700';
        if (count > 20) color = 'bg-red-100 text-red-700';
        
        weeklyLoad.push({ day: i === 0 ? 'Сегодня' : days[d.getDay()], load: count, color });
    }

    res.json({
      totalDonors: confirmedDonors.length,
      readyCount,
      pendingCount: pendingDonors.length,
      notificationsThisMonth,
      bloodGroupStats,
      rhStats,
      responseRate: rate + '%',
      avgResponseTime: avgResponseTimeHours.toFixed(1),
      suspensionBreakdown,
      weeklyLoad,
      tip: 'Данные основаны на реальных записях в системе'
    });
  });

  // CENTER GET CONNECTED CONFIRMED DONORS
  app.get('/api/center/donors', async (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = await getDb();
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

    const todayStr2 = new Date().toISOString().split('T')[0];
    const donorsWithReadiness = donors.map(d => {
      const notes = db.medicalNotes.filter(m => m.donorId === d.id);
      return {
        ...d,
        readiness: isDonorReady(d, todayStr2, notes, true)
      };
    });

    res.json(donorsWithReadiness);
  });

  // GET DETAILED DONOR CARD FOR CENTER
  app.get('/api/center/donors/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const centerId = parseInt(req.query.centerId as string);

    const db = await getDb();
    const donor = db.donors.find(d => d.id === id);
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    const link = db.donorCenters.find(dc => dc.donorId === id && dc.centerId === centerId);
    const donations = db.donations
      .filter(d => d.donorId === id)
      .sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());
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
  app.post('/api/center/donors', async (req, res) => {
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

    const cleanEmail = email.toLowerCase().trim();
    const db = await getDb();
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким e-mail уже зарегистрирован' });
    }

    const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    db.users.push({
      id: newUserId,
      email: cleanEmail,
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

    await saveDb(db);

    try {
      await sendTransactionalEmail(email, 'center_added', { email, password });
    } catch (err) {
      console.error('Failed to send center_added email:', err);
    }

    res.json({ success: true, donor });
  });

  // UPDATE DONOR PROFILE FROM CENTER
  app.put('/api/center/donors/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { lastName, firstName, middleName, weight, phone, email, birthDate, gender, bloodGroup, rhFactor, status } = req.body;

    const db = await getDb();
    const donor = db.donors.find(d => d.id === id);
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

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

    const user = db.users.find(u => u.id === donor.userId);
    if (user && email) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        user.email = cleanEmail;
      }
      donor.email = cleanEmail;
    }

    await saveDb(db);
    await recalculateDonorStats(id);

    res.json({ success: true, donor });
  });

  // ADD RECORD OF DONATION
  app.post('/api/center/donors/:id/donations', async (req, res) => {
    const donorId = parseInt(req.params.id);
    const { centerId, donationDate, donationType, volumeMl, note, addedBy, isPaid } = req.body;

    if (!donationDate || !donationType) {
      return res.status(400).json({ error: 'Дата и тип донации обязательны' });
    }
    
    let parsedVolume: number | undefined;
    if (volumeMl !== undefined) {
      parsedVolume = parseInt(volumeMl);
      if (isNaN(parsedVolume) || parsedVolume < 0 || parsedVolume > 1000) {
        return res.status(400).json({ error: 'Недопустимый объем донации' });
      }
    }

    const db = await getDb();
    const newId = db.donations.length > 0 ? Math.max(...db.donations.map(d => d.id)) + 1 : 1;
    db.donations.push({
      id: newId,
      donorId,
      centerId: parseInt(centerId),
      donationDate,
      donationType,
      isPaid: Boolean(isPaid),
      volumeMl: parsedVolume,
      note,
      addedBy: addedBy ? parseInt(addedBy) : undefined,
      createdAt: new Date().toISOString()
    });

    await saveDb(db);
    await recalculateDonorStats(donorId);

    res.json({ success: true });
  });

  // DELETE RECORD OF DONATION
  app.delete('/api/donations/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const db = await getDb();
    const donationIdx = db.donations.findIndex(d => d.id === id);
    if (donationIdx === -1) return res.status(404).json({ error: 'Донация не найдена' });

    const donorId = db.donations[donationIdx].donorId;
    db.donations.splice(donationIdx, 1);
    await saveDb(db);
    await recalculateDonorStats(donorId);

    res.json({ success: true });
  });

  // ADD MEDICAL NOTE
  app.post('/api/center/donors/:id/medical-notes', async (req, res) => {
    const donorId = parseInt(req.params.id);
    const { centerId, reason, startDate, endDate, createdBy } = req.body;

    if (!reason || !startDate) {
      return res.status(400).json({ error: 'Причина медотвода и дата начала обязательны' });
    }

    const db = await getDb();
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

    await saveDb(db);
    res.json({ success: true });
  });

  // LIFT MEDICAL NOTE
  app.put('/api/center/medical-notes/:id/lift', async (req, res) => {
    const id = parseInt(req.params.id);
    const { liftNote, liftedBy } = req.body;

    const db = await getDb();
    const note = db.medicalNotes.find(m => m.id === id);
    if (!note) return res.status(404).json({ error: 'Медотвод не найден' });

    note.isActive = false;
    note.liftedAt = new Date().toISOString();
    note.liftedBy = liftedBy ? parseInt(liftedBy) : 2;
    note.liftNote = liftNote || 'Снят врачом вручную';

    await saveDb(db);
    res.json({ success: true });
  });

  // GET LIST OF PENDING APPLICATIONS
  app.get('/api/center/pending', async (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = await getDb();
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
  app.post('/api/center/pending/:id/resolve', async (req, res) => {
    const linkId = parseInt(req.params.id);
    const { status, rejectionReason, confirmedById } = req.body; // 'confirmed' or 'rejected'

    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const db = await getDb();
    const link = db.donorCenters.find(dc => dc.id === linkId);
    if (!link) return res.status(404).json({ error: 'Заявка не найдена' });

    link.status = status as DonorCenterStatus;
    if (status === 'confirmed') {
      link.confirmedAt = new Date().toISOString();
      link.confirmedById = confirmedById ? parseInt(confirmedById) : 2;
      link.rejectionReason = undefined;
      
      const donor = db.donors.find(d => d.id === link.donorId);
      if (donor && donor.emailNotificationsEnabled) {
          try {
              sendTransactionalEmail(donor.email, 'confirmed');
          } catch(e) {}
      }

    } else {
      link.rejectionReason = rejectionReason || 'Не указана';
      link.confirmedAt = null;
      link.confirmedById = null;
      
      const donor = db.donors.find(d => d.id === link.donorId);
      if (donor && donor.emailNotificationsEnabled) {
          try {
              sendTransactionalEmail(donor.email, 'rejected', { reason: link.rejectionReason });
          } catch(e) {}
      }
    }

    await saveDb(db);
    res.json({ success: true });
  });

  // HELPER FILTER FOR TARGET NOTIFICATE GROUP FOR COUNTS & DISPATCH
  function getRecipientsForFilter(db: any, params: any): { donors: Donor[]; ids: number[] } {
    const centerId = parseInt(params.centerId);

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
  app.post('/api/center/notify/preview', async (req, res) => {
    const db = await getDb();
    const list = getRecipientsForFilter(db, req.body);
    res.json({ count: list.donors.length });
  });

  // SEND SYSTEM ALERTS (PUSH, EMAIL)
  app.post('/api/center/notify/send', async (req, res) => {
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

    const db = await getDb();

    // Get filter list
    const filterResults = getRecipientsForFilter(db, req.body);
    const targetDonors = filterResults.donors;
    const newNotificationId = db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;

    let totalPush = 0;
    let totalEmail = 0;

    const recipientsMap = targetDonors.map(donor => {
      let pushStatus: 'sent' | 'skipped' | 'failed' = 'skipped';
      let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';

      const needsPush = ['push', 'all'].includes(channel);
      const needsEmail = ['email', 'all'].includes(channel);

      if (needsPush) {
        if (donor.pushEnabled && donor.onesignalPlayerId) {
          pushStatus = 'sent';
          totalPush++;
        } else {
          pushStatus = 'failed';
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
        emailStatus,
        sentAt: new Date().toISOString(),
        isRead: false
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
      emailSent: totalEmail,
      status: targetDonors.length === 0 ? 'failed' : 'sent',
      createdAt: new Date().toISOString()
    });

    await saveDb(db);

    // Dispatch async notifications
    const center = db.centers.find(c => c.id === parseInt(centerId));
    const centerPhone = center ? center.phone : '';
    dispatchNotifications(targetDonors, channel as string, messageText, centerPhone);

    res.json({
      success: true,
      recipientsCount: targetDonors.length,
      pushSent: totalPush,
      emailSent: totalEmail
    });
  });

  // ===================== DONATION APPOINTMENTS =====================

  app.get('/api/appointments', async (req, res) => {
    const { donorId, centerId } = req.query;
    const db = await getDb();
    let result = db.donationAppointments || [];
    if (donorId) result = result.filter(a => a.donorId === parseInt(donorId as string));
    if (centerId) result = result.filter(a => a.centerId === parseInt(centerId as string));
    
    // Add donor info
    const enriched = result.map(a => {
        const d = db.donors.find(d => d.id === a.donorId);
        return {
            ...a,
            donorName: d ? `${d.lastName} ${d.firstName}` : 'Неизвестный донор',
            donorBg: d ? `${d.bloodGroup} ${d.rhFactor === 'positive' ? 'Rh+' : 'Rh-'}` : ''
        };
    });
    
    res.json(enriched);
  });

  app.post('/api/appointments', async (req, res) => {
    const db = await getDb();
    const { donorId, centerId, appointmentDate, appointmentTime, donationType } = req.body;
    
    const donor = db.donors.find(d => d.id === parseInt(donorId));
    if (!donor) return res.status(404).json({ error: 'Донор не найден' });

    const medicalNotes = db.medicalNotes.filter(m => m.donorId === donor.id);
    const link = db.donorCenters.find(lc => lc.donorId === donor.id && lc.centerId === parseInt(centerId));
    const todayStr = new Date().toISOString().split('T')[0];
    const readiness = isDonorReady(donor, todayStr, medicalNotes, link?.status === 'confirmed');

    if (!readiness.ready) {
      return res.status(400).json({ error: readiness.reason || 'Запись на донацию невозможна из-за действующего отвода или периода восстановления' });
    }

    const apptTime = appointmentTime || '10:00';
    if (apptTime < '09:00' || apptTime > '17:00') {
      return res.status(400).json({ error: 'Запись возможна только в рабочее время с 09:00 до 17:00' });
    }

    if (!db.donationAppointments) db.donationAppointments = [];
    const newId = db.donationAppointments.length > 0 ? Math.max(...db.donationAppointments.map(a => a.id)) + 1 : 1;
    
    const newAppt = {
      id: newId,
      donorId: parseInt(donorId),
      centerId: parseInt(centerId),
      appointmentDate,
      appointmentTime,
      donationType,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };
    
    db.donationAppointments.push(newAppt);
    await saveDb(db);
    res.json(newAppt);
  });

  app.put('/api/appointments/:id', async (req, res) => {
    const db = await getDb();
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!db.donationAppointments) db.donationAppointments = [];
    const appt = db.donationAppointments.find(a => a.id === id);
    if (!appt) return res.status(404).json({ error: 'Not found' });
    
    appt.status = status;
    
    // If completed, optionally create a donation record (simplification)
    if (status === 'completed') {
        const donationId = db.donations.length > 0 ? Math.max(...db.donations.map(d => d.id)) + 1 : 1;
        db.donations.push({
            id: donationId,
            donorId: appt.donorId,
            centerId: appt.centerId,
            donationDate: appt.appointmentDate,
            donationType: appt.donationType,
            createdAt: new Date().toISOString()
        });
        await recalculateDonorStats(appt.donorId);
    }
    
    await saveDb(db);
    res.json(appt);
  });

  // NEWS LOGS
  app.get('/api/center/notifications', async (req, res) => {
    const centerId = parseInt(req.query.centerId as string);
    if (!centerId) return res.status(400).json({ error: 'Не указан ID центра' });

    const db = await getDb();
    const lists = db.notifications.filter(n => n.centerId === centerId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(lists);
  });

  // --- Vite Dev Server Middleware Integration ---
  async function startServer() {
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
        if (req.originalUrl.startsWith('/api')) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    // Global Error Handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[Error:', req.method, req.originalUrl, ']', err);
      if (req.originalUrl.startsWith('/api')) {
        res.status(500).json({ error: 'Внутренняя ошибка сервера. Пожалуйста, проверьте введённые данные.' });
      } else {
        next(err);
      }
    });

    const PORT = 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Donor-Alert] Express back-end running at http://localhost:${PORT}`);
    });
  }

  if (!process.env.VERCEL) {
    startServer().catch(err => {
      console.error('[Donor-Alert] Failed to start server:', err);
    });
  }

  export default app;
