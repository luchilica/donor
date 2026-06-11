import { PrismaClient, UserRole, Gender, BloodGroup, RhFactor, DonationType, DonorStatus, DonorCenterStatus, NotificationRhFactor, NotificationDonationType, NotificationChannel, NotificationStatus, DeliveryStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const STORE_PATH = path.join(process.cwd(), 'database_store.json');

async function main() {
  console.log('Starting data migration to Supabase...');

  if (!fs.existsSync(STORE_PATH)) {
    console.error(`Error: local data file database_store.json not found at ${STORE_PATH}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(STORE_PATH, 'utf-8');
  const data = JSON.parse(rawData);

  // Clear existing tables in reverse dependency order to avoid foreign key violations
  console.log('Cleaning existing database tables...');
  await prisma.notificationRecipient.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.medicalNote.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.donorCenter.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.smsTemplate.deleteMany({});
  await prisma.bloodCenter.deleteMany({});
  console.log('Database cleaned successfully.');

  // 1. Blood Centers
  if (data.centers && data.centers.length > 0) {
    console.log(`Migrating ${data.centers.length} blood centers...`);
    for (const item of data.centers) {
      await prisma.bloodCenter.create({
        data: {
          id: item.id,
          name: item.name,
          address: item.address,
          phone: item.phone,
          email: item.email || null,
          workingHours: item.workingHours || null,
          mapLink: item.mapLink || null,
          eRegistrationLink: item.eRegistrationLink || null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 2. Users
  if (data.users && data.users.length > 0) {
    console.log(`Migrating ${data.users.length} users...`);
    for (const item of data.users) {
      await prisma.user.create({
        data: {
          id: item.id,
          email: item.email,
          passwordHash: item.passwordHash,
          role: item.role as UserRole,
          centerId: item.centerId || null,
          isActive: item.isActive !== undefined ? item.isActive : true,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          lastLogin: item.lastLogin ? new Date(item.lastLogin) : null,
        }
      });
    }
  }

  // 3. Donors
  if (data.donors && data.donors.length > 0) {
    console.log(`Migrating ${data.donors.length} donors...`);
    for (const item of data.donors) {
      await prisma.donor.create({
        data: {
          id: item.id,
          userId: item.userId,
          lastName: item.lastName,
          firstName: item.firstName,
          middleName: item.middleName || null,
          birthDate: new Date(item.birthDate),
          gender: item.gender as Gender,
          bloodGroup: item.bloodGroup as BloodGroup,
          rhFactor: item.rhFactor as RhFactor,
          weight: item.weight,
          phone: item.phone,
          status: (item.status || 'active') as DonorStatus,
          smsEnabled: item.smsEnabled !== undefined ? item.smsEnabled : false,
          pushEnabled: item.pushEnabled !== undefined ? item.pushEnabled : false,
          emailNotificationsEnabled: item.emailNotificationsEnabled !== undefined ? item.emailNotificationsEnabled : true,
          onesignalPlayerId: item.onesignalPlayerId || null,
          personalPause: item.personalPause !== undefined ? item.personalPause : false,
          personalPauseUntil: item.personalPauseUntil ? new Date(item.personalPauseUntil) : null,
          personalPauseNote: item.personalPauseNote || null,
          donationsCount: item.donationsCount || 0,
          bloodDonationsCount: item.bloodDonationsCount || 0,
          lastDonationDate: item.lastDonationDate ? new Date(item.lastDonationDate) : null,
          lastDonationType: item.lastDonationType ? (item.lastDonationType as DonationType) : null,
          nextAvailableDate: item.nextAvailableDate ? new Date(item.nextAvailableDate) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 4. Donor Centers (Links between Donors and Blood Centers)
  if (data.donorCenters && data.donorCenters.length > 0) {
    console.log(`Migrating ${data.donorCenters.length} donor center ties...`);
    for (const item of data.donorCenters) {
      await prisma.donorCenter.create({
        data: {
          id: item.id,
          donorId: item.donorId,
          centerId: item.centerId,
          isPrimary: item.isPrimary !== undefined ? item.isPrimary : false,
          status: (item.status || 'pending') as DonorCenterStatus,
          rejectionReason: item.rejectionReason || null,
          resubmissionCount: item.resubmissionCount || 0,
          resubmittedAt: item.resubmittedAt ? new Date(item.resubmittedAt) : null,
          confirmedAt: item.confirmedAt ? new Date(item.confirmedAt) : null,
          confirmedById: item.confirmedById || null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 5. Donations
  if (data.donations && data.donations.length > 0) {
    console.log(`Migrating ${data.donations.length} donations...`);
    for (const item of data.donations) {
      await prisma.donation.create({
        data: {
          id: item.id,
          donorId: item.donorId,
          centerId: item.centerId,
          donationDate: new Date(item.donationDate),
          donationType: item.donationType as DonationType,
          volumeMl: item.volumeMl || null,
          note: item.note || null,
          addedById: item.addedById || item.addedBy || null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 6. Medical Notes (Contraindications/Abstinence)
  if (data.medicalNotes && data.medicalNotes.length > 0) {
    console.log(`Migrating ${data.medicalNotes.length} medical notes...`);
    for (const item of data.medicalNotes) {
      await prisma.medicalNote.create({
        data: {
          id: item.id,
          donorId: item.donorId,
          centerId: item.centerId,
          createdById: item.createdById || item.createdBy || 1, // fallback to avoid crash
          reason: item.reason,
          startDate: new Date(item.startDate),
          endDate: item.endDate ? new Date(item.endDate) : null,
          isActive: item.isActive !== undefined ? item.isActive : true,
          liftedAt: item.liftedAt ? new Date(item.liftedAt) : null,
          liftedById: item.liftedById || item.liftedBy || null,
          liftNote: item.liftNote || null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 7. News
  if (data.news && data.news.length > 0) {
    console.log(`Migrating ${data.news.length} news articles...`);
    for (const item of data.news) {
      await prisma.news.create({
        data: {
          id: item.id,
          centerId: item.centerId,
          title: item.title,
          content: item.content,
          isPublished: item.isPublished !== undefined ? item.isPublished : false,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          createdById: item.createdById || null,
        }
      });
    }
  }

  // 8. Notifications
  if (data.notifications && data.notifications.length > 0) {
    console.log(`Migrating ${data.notifications.length} notifications...`);
    for (const item of data.notifications) {
      await prisma.notification.create({
        data: {
          id: item.id,
          centerId: item.centerId,
          sentById: item.sentById || item.sentBy || null,
          bloodGroups: typeof item.bloodGroups === 'string' ? item.bloodGroups : JSON.stringify(item.bloodGroups),
          rhFactor: item.rhFactor as NotificationRhFactor,
          donationType: item.donationType as NotificationDonationType,
          minDaysSinceDonation: item.minDaysSinceDonation || 0,
          excludeMedical: item.excludeMedical !== undefined ? item.excludeMedical : true,
          excludePause: item.excludePause !== undefined ? item.excludePause : true,
          channel: item.channel as NotificationChannel,
          messageText: item.messageText,
          recipientsCount: item.recipientsCount || 0,
          pushSent: item.pushSent || 0,
          smsSent: item.smsSent || 0,
          emailSent: item.emailSent || 0,
          status: item.status as NotificationStatus,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // 9. Notification Recipients
  if (data.notificationRecipients && data.notificationRecipients.length > 0) {
    console.log(`Migrating ${data.notificationRecipients.length} notification recipients...`);
    for (const item of data.notificationRecipients) {
      await prisma.notificationRecipient.create({
        data: {
          id: item.id,
          notificationId: item.notificationId,
          donorId: item.donorId,
          pushStatus: item.pushStatus as DeliveryStatus,
          smsStatus: item.smsStatus as DeliveryStatus,
          emailStatus: item.emailStatus as DeliveryStatus,
          sentAt: item.sentAt ? new Date(item.sentAt) : new Date(),
        }
      });
    }
  }

  // 10. SMS Templates
  if (data.smsTemplates && data.smsTemplates.length > 0) {
    console.log(`Migrating ${data.smsTemplates.length} SMS templates...`);
    for (const item of data.smsTemplates) {
      await prisma.smsTemplate.create({
        data: {
          id: item.id,
          centerId: item.centerId || null,
          name: item.name,
          text: item.text,
          isDefault: item.isDefault !== undefined ? item.isDefault : false,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        }
      });
    }
  }

  // Reset the PostgreSQL sequences for auto-increment fields to prevent future registration key collisions
  console.log('Resetting PostgreSQL sequences...');
  const tables = [
    { name: 'blood_centers', seq: 'blood_centers' },
    { name: 'users', seq: 'users' },
    { name: 'donors', seq: 'donors' },
    { name: 'donor_centers', seq: 'donor_centers' },
    { name: 'donations', seq: 'donations' },
    { name: 'medical_notes', seq: 'medical_notes' },
    { name: 'news', seq: 'news' },
    { name: 'notifications', seq: 'notifications' },
    { name: 'notification_recipients', seq: 'notification_recipients' },
    { name: 'sms_templates', seq: 'sms_templates' }
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('"${table.name}"', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM "${table.name}";
      `);
      console.log(`Successfully reset sequence for table ${table.name}`);
    } catch (e: any) {
      console.warn(`Could not reset sequence for table ${table.name}: ${e.message}`);
    }
  }

  console.log('Data migration complete!');
}

main()
  .catch((e) => {
    console.error('Error during migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
