export type UserRole = 'donor' | 'center' | 'admin';
export type Gender = 'male' | 'female';
export type BloodGroup = 'I_O' | 'II_A' | 'III_B' | 'IV_AB';
export type RhFactor = 'positive' | 'negative';
export type DonorStatus = 'active' | 'inactive';
export type DonationType = 'blood' | 'plasma' | 'platelets' | 'granulocytes';
export type DonorCenterStatus = 'pending' | 'confirmed' | 'rejected';
export type NotificationChannel = 'push' | 'sms' | 'email' | 'push_sms' | 'all';
export type NotificationStatus = 'sent' | 'partial' | 'failed';

export interface BloodCenter {
  id: number;
  name: string;
  shortName?: string;
  address: string;
  phone: string;
  email?: string;
  workingHours?: string;
  mapLink?: string;
  eRegistrationLink?: string;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  passwordHash?: string;
  role: UserRole;
  centerId?: number | null;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
  resetCode?: string;
}

export interface Donor {
  id: number;
  userId: number;
  lastName: string;
  firstName: string;
  middleName?: string;
  birthDate: string; // ISO date YYYY-MM-DD
  gender: Gender;
  bloodGroup: BloodGroup;
  rhFactor: RhFactor;
  weight: number;
  phone: string;
  status: DonorStatus;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailNotificationsEnabled: boolean;
  onesignalPlayerId?: string | null;
  personalPause: boolean;
  personalPauseUntil?: string | null; // ISO date YYYY-MM-DD
  personalPauseNote?: string | null;
  donationsCount: number;
  bloodDonationsCount: number;
  plasmaDonationsCount?: number;
  plateletsDonationsCount?: number;
  bloodFreeCount?: number;
  bloodPaidCount?: number;
  compFreeCount?: number;
  compPaidCount?: number;
  lastDonationDate?: string | null;
  lastDonationType?: DonationType | null;
  nextAvailableDate?: string | null;
  email?: string;
  createdAt: string;
}

export interface DonorCenter {
  id: number;
  donorId: number;
  centerId: number;
  isPrimary: boolean;
  status: DonorCenterStatus;
  rejectionReason?: string;
  resubmissionCount: number;
  resubmittedAt?: string | null;
  confirmedAt?: string | null;
  confirmedById?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Donation {
  id: number;
  donorId: number;
  centerId: number;
  donationDate: string; // ISO date YYYY-MM-DD
  donationType: DonationType;
  isPaid?: boolean;
  volumeMl?: number;
  note?: string;
  addedBy?: number;
  createdAt: string;
  date?: string;
  type?: string;
  volume?: number;
}

export interface MedicalNote {
  id: number;
  donorId: number;
  centerId: number;
  createdBy: number;
  reason: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate?: string | null; // ISO date YYYY-MM-DD (null = permanent)
  isActive: boolean;
  liftedAt?: string | null;
  liftedBy?: number | null;
  liftNote?: string | null;
  createdAt: string;
}

export interface News {
  id: number;
  centerId: number;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  createdBy: number;
}

export interface Notification {
  id: number;
  centerId: number;
  sentBy: number;
  bloodGroups: BloodGroup[]; // stored as stringified array or similar
  rhFactor: RhFactor | 'both';
  donationType: DonationType | 'any';
  minDaysSinceDonation: number;
  excludeMedical: boolean;
  excludePause: boolean;
  channel: NotificationChannel;
  messageText: string;
  recipientsCount: number;
  pushSent: number;
  smsSent: number;
  emailSent: number;
  status: NotificationStatus;
  createdAt: string;
}

export interface NotificationRecipient {
  id: number;
  notificationId: number;
  donorId: number;
  pushStatus: 'sent' | 'failed' | 'skipped';
  smsStatus: 'sent' | 'failed' | 'skipped';
  emailStatus: 'sent' | 'failed' | 'skipped';
  sentAt: string;
}

export interface SmsTemplate {
  id: number;
  centerId?: number | null;
  name: string;
  text: string;
  isDefault: boolean;
  createdAt: string;
}

// Client helper translations
export function formatBloodGroup(bg: BloodGroup): string {
  switch (bg) {
    case 'I_O': return 'I (O)';
    case 'II_A': return 'II (A)';
    case 'III_B': return 'III (B)';
    case 'IV_AB': return 'IV (AB)';
    default: return bg;
  }
}

export function formatRhFactor(rh: RhFactor): string {
  return rh === 'positive' ? 'Rh+' : 'Rh-';
}

export function getGamificationStatus(
  bloodFree: number,
  compFree: number,
  bloodPaid: number,
  compPaid: number
): { title: string; currentPoints: number; nextAt: number; color: string } {
  const points = bloodFree * 4 + compFree * 2 + bloodPaid * 2 + compPaid * 1;
  
  if (points === 0) return { title: 'НОВЫЙ', currentPoints: 0, nextAt: 4, color: 'text-slate-500 bg-slate-50 border-slate-200' };
  if (points < 12) return { title: 'НАЧИНАЮЩИЙ', currentPoints: points, nextAt: 12, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (points < 24) return { title: 'АКТИВНЫЙ', currentPoints: points, nextAt: 24, color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (points < 40) return { title: 'ОПЫТНЫЙ', currentPoints: points, nextAt: 40, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  if (points < 80) return { title: 'СЕРЕБРЯНЫЙ', currentPoints: points, nextAt: 80, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  
  return { title: 'ПОЧЁТНЫЙ', currentPoints: points, nextAt: 80, color: 'text-rose-600 bg-rose-50 border-rose-300 animate-pulse' };
}
