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
  lastDonationDate?: string | null;
  lastDonationType?: DonationType | null;
  nextAvailableDate?: string | null;
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
}

export interface Donation {
  id: number;
  donorId: number;
  centerId: number;
  donationDate: string; // ISO date YYYY-MM-DD
  donationType: DonationType;
  volumeMl?: number;
  note?: string;
  addedBy?: number;
  createdAt: string;
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

export function getGamificationStatus(bloodDonationsCount: number): { title: string; nextAt: number; color: string } {
  if (bloodDonationsCount === 0) return { title: 'Новый донор', nextAt: 1, color: 'text-slate-500 bg-slate-50 border-slate-200' };
  if (bloodDonationsCount <= 2) return { title: 'Начинающий донор', nextAt: 3, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (bloodDonationsCount <= 5) return { title: 'Активный донор', nextAt: 6, color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (bloodDonationsCount <= 9) return { title: 'Опытный донор', nextAt: 10, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  if (bloodDonationsCount <= 19) return { title: 'Серебряный донор', nextAt: 20, color: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { title: 'Почётный донор', nextAt: 20, color: 'text-rose-600 bg-rose-50 border-rose-300 animate-pulse' };
}
