import * as fs from 'fs';
import * as path from 'path';
import { BloodCenter, User, Donor, DonorCenter, Donation, MedicalNote, News, Notification, NotificationRecipient, BloodGroup, RhFactor, DonationType } from '../src/types';

// Hardcoded path relative to app root
const STORE_PATH = path.join(process.cwd(), 'database_store.json');

export interface DatabaseState {
  centers: BloodCenter[];
  users: User[];
  donors: Donor[];
  donorCenters: DonorCenter[];
  donations: Donation[];
  medicalNotes: MedicalNote[];
  news: News[];
  notifications: Notification[];
  notificationRecipients: NotificationRecipient[];
}

const INITIAL_CENTERS: BloodCenter[] = [
  {
    id: 1,
    name: "ГУ «РНПЦ трансфузиологии и медицинских биотехнологий» (Минск)",
    address: "г. Минск, ул. Долгиновский тракт, д. 160",
    phone: "+375 (17) 289-86-40",
    email: "rnpc@blood.by",
    workingHours: "Пн-Пт: 08:00 - 16:00, Сб: 08:30 - 13:00",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "https://form.blood.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "ГУЗ «Витебский областной центр трансфузиологии»",
    address: "г. Витебск, ул. Фрунзе, д. 71",
    phone: "+375 (212) 24-03-80",
    email: "voct@bankblood-vitebsk.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "https://bankblood-vitebsk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "ГУ «Брестская областная станция переливания крови»",
    address: "г. Брест, ул. Медицинская, д. 2",
    phone: "+375 (162) 28-53-01",
    email: "bospk@brest.by",
    workingHours: "Пн-Пт: 08:00 - 16:30",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "https://tutmed.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: "УЗ «Мозырская станция переливания крови»",
    address: "г. Мозырь, ул. Нагорная, д. 56А",
    phone: "+375 (236) 24-74-12",
    email: "mozyr@mozyrdonor.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "https://mozyrdonor.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    name: "УЗ «Рогачевская станция переливания крови»",
    address: "г. Рогачев, ул. Октябрьская, д. 33",
    phone: "+375 (233) 92-12-88",
    email: "rspk@rogachev.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "http://rspk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    name: "УЗ «Могилевская областная станция переливания крови»",
    address: "г. Могилев, ул. Пионерская, д. 17",
    phone: "+375 (222) 25-30-24",
    email: "mospk@mogilev.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "https://mospk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    name: "УЗ «Бобруйская зональная станция переливания крови»",
    address: "г. Бобруйск, ул. Пушкина, д. 206А",
    phone: "+375 (225) 72-00-50",
    email: "bzspk@bobruisk.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CCUf68beDA",
    eRegistrationLink: "http://bzspk.by",
    createdAt: new Date().toISOString()
  },
  // Adding regional centers to complete 40+ medical centers of Belarus (6 oblasts)
  // MINSK OBLAST
  ...[
    { id: 8, name: "Борисовская станция переливания крови", address: "г. Борисов, ул. Лопатина, д. 172", phone: "+375 (177) 76-21-42" },
    { id: 9, name: "Молодечненская станция переливания крови", address: "г. Молодечно, ул. Чкалова, д. 3", phone: "+375 (176) 58-13-11" },
    { id: 10, name: "Солигорская станция переливания крови", address: "г. Солигорск, ул. Козлова, д. 6", phone: "+375 (174) 26-38-09" },
    { id: 11, name: "Слуцкая станция переливания крови", address: "г. Слуцк, ул. Чайковского, д. 21", phone: "+375 (179) 55-23-01" },
  ].map((c, i) => ({ ...c, email: `c${8+i}@blood.by`, workingHours: "Пн-Пт: 08:00 - 15:00", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),
  
  // BREST OBLAST
  ...[
    { id: 12, name: "Барановичская станция переливания крови", address: "г. Барановичи, ул. 50-лет ВЛКСМ, д. 4А", phone: "+375 (163) 49-21-39" },
    { id: 13, name: "Пинская станция переливания крови", address: "г. Пинск, ул. Горького, д. 43", phone: "+375 (165) 31-61-02" },
    { id: 14, name: "Кобринская станция переливания крови", address: "г. Кобрин, ул. Советская, д. 111", phone: "+375 (164) 22-12-32" },
  ].map((c, i) => ({ ...c, email: `c${12+i}@blood.by`, workingHours: "Пн-Пт: 08:00 - 15:30", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),

  // VITEBSK OBLAST
  ...[
    { id: 15, name: "Оршанская станция переливания крови", address: "г. Орша, ул. Пионерская, д. 15", phone: "+375 (216) 51-24-11" },
    { id: 16, name: "Новополоцкая станция переливания крови", address: "г. Новополоцк, ул. Больничная, д. 4", phone: "+375 (214) 50-11-20" },
    { id: 17, name: "Полоцкая станция переливания крови", address: "г. Полоцк, ул. Коммунистическая, д. 23", phone: "+375 (214) 42-24-30" },
  ].map((c, i) => ({ ...c, email: `c${15+i}@blood.by`, workingHours: "Пн-Пт: 08:00 - 16:00", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),

  // GOMEL OBLAST
  ...[
    { id: 18, name: "Гомельский областной госпиталь ИВ - ОПК", address: "г. Гомель, ул. Ильича, д. 286", phone: "+375 (232) 36-12-88" },
    { id: 19, name: "Гомельская областная станция переливания крови", address: "г. Гомель, ул. Демьяна Бедного, д. 2", phone: "+375 (232) 53-98-32" },
    { id: 20, name: "Речицкая центральная районная больница - ОПК", address: "г. Речица, ул. Трифонова, д. 117", phone: "+375 (234) 06-23-45" },
    { id: 21, name: "Светлогорская станция переливания крови", address: "г. Светлогорск, ул. Свердлова, д. 8", phone: "+375 (234) 27-09-10" },
    { id: 22, name: "Жлобинская ЦРБ - Отделение переливания крови", address: "г. Жлобин, ул. Воровского, д. 1", phone: "+375 (233) 42-28-11" },
  ].map((c, i) => ({ ...c, email: `c${18+i}@blood.by`, workingHours: "Пн-Пт: 08:30 - 14:30", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),

  // GRODNO OBLAST
  ...[
    { id: 23, name: "Гродненская областная станция переливания крови", address: "г. Гродно, ул. Кабяка, д. 22", phone: "+375 (152) 31-54-04" },
    { id: 24, name: "Лидская станция переливания крови", address: "г. Лида, ул. Черняховского, д. 1", phone: "+375 (154) 52-94-11" },
    { id: 25, name: "Слонимская ЦРБ - ОПК", address: "г. Слоним, ул. Войкова, д. 51А", phone: "+375 (156) 22-10-14" },
    { id: 26, name: "Волковысская ЦРБ - ОПК", address: "г. Волковыск, ул. Горбатова, д. 1", phone: "+375 (151) 25-90-23" },
    { id: 27, name: "Сморгонская ЦРБ - ОПК", address: "г. Сморгонь, ул. Первомайская, д. 60", phone: "+375 (159) 23-89-21" },
  ].map((c, i) => ({ ...c, email: `c${23+i}@blood.by`, workingHours: "Пн-Пт: 08:00 - 15:00", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),

  // MOGILEV OBLAST + OTHER DISTRICTS TO FIT 40+ CLINICS IN BELARUS
  ...[
    { id: 28, name: "Горецкая центральная районная больница - ОПК", address: "г. Горки, ул. Кирова, д. 18", phone: "+375 (223) 37-12-32" },
    { id: 29, name: "Кричевская ЦРБ - ОПК", address: "г. Кричев, ул. Ленинская, д. 72", phone: "+375 (224) 15-60-23" },
    { id: 30, name: "Осиповичская ЦРБ - ОПК", address: "г. Осиповичи, ул. Октябрьская, д. 2", phone: "+375 (223) 57-19-14" },
  ].map((c, i) => ({ ...c, email: `c${28+i}@blood.by`, workingHours: "Пн-Пт: 08:00 - 15:30", mapLink: "https://yandex.by", createdAt: new Date().toISOString() })),

  // MORE REPRESENTATIVE CLINICS ACROSS MINSK AND REGIONS
  ...[
    { id: 31, name: "Минская областная клиническая больница - ОПК", address: "Минский р-н, пос. Лесной, д. 1", phone: "+375 (17) 265-22-26" },
    { id: 32, name: "Городской трансфузиологический кабинет (Минск, 6-я ГКБ)", address: "г. Минск, ул. Уральская, д. 5", phone: "+375 (17) 398-90-67" },
    { id: 33, name: "ОПК Минской ЦРБ (Минский р-н)", address: "г. Минск, ул. Фрунзе, д. 1", phone: "+375 (17) 508-11-23" },
    { id: 34, name: "Жодинская ЦГБ - ОПК", address: "г. Жодино, ул. Радищева, д. 2", phone: "+375 (177) 56-38-04" },
    { id: 35, name: "Несвижская ЦРБ - ОПК", address: "г. Несвиж, ул. Сырокомли, д. 29", phone: "+375 (177) 02-30-24" },
    { id: 36, name: "Вилейская ЦРБ - ОПК", address: "г. Вилейка, ул. Маркова, д. 27", phone: "+375 (177) 15-51-11" },
    { id: 37, name: "Речицкая ЦРБ - Филиал переливания крови", address: "г. Речица, ул. Пушкина, д. 45", phone: "+375 (234) 09-90-11" },
    { id: 38, name: "Калинковичская ЦРБ - ОПК", address: "г. Калинковичи, ул. Князева, д. 3", phone: "+375 (234) 53-12-89" },
    { id: 39, name: "Добрушская ЦРБ - ОПК", address: "г. Добруш, ул. Комарова, д. 10", phone: "+375 (233) 37-12-55" },
    { id: 40, name: "Хойникская ЦРБ - ОПК", address: "г. Хойники, ул. Советская, д. 129", phone: "+375 (233) 02-12-78" },
    { id: 41, name: "Лунинецкая ЦРБ - ОПК", address: "г. Лунинец, ул. Красная, д. 104", phone: "+375 (164) 73-12-80" },
    { id: 42, name: "Берёзовская ЦРБ - ОПК", address: "г. Берёза, ул. Ленина, д. 1", phone: "+375 (164) 33-14-15" },
  ].map((c) => ({ ...c, email: `c${c.id}@blood.by`, workingHours: "Пн-Пт: 08:30 - 15:30", mapLink: "https://yandex.by", createdAt: new Date().toISOString() }))
];

// Seed initial users
const INITIAL_USERS: User[] = [
  {
    id: 1,
    email: "donor@test.by",
    passwordHash: "$2a$12$6/p.R99zLIDa7Z0Xn3V1WOkZ.R4JWhh5K2.S61.27m/zN0SgBqbyC", // bcrypt for "password123"
    role: "donor",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    email: "center@test.by",
    passwordHash: "$2a$12$6/p.R99zLIDa7Z0Xn3V1WOkZ.R4JWhh5K2.S61.27m/zN0SgBqbyC", // "password123"
    role: "center",
    centerId: 1, // ГУ «РНПЦ трансфузиологии и медицинских биотехнологий» (Минск)
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DONORS: Donor[] = [
  {
    id: 1,
    userId: 1,
    lastName: "Павлов",
    firstName: "Алексей",
    middleName: "Игоревич",
    birthDate: "1993-08-14",
    gender: "male",
    bloodGroup: "II_A",
    rhFactor: "positive",
    weight: 78,
    phone: "+375 (29) 111-22-33",
    status: "active",
    smsEnabled: true,
    pushEnabled: true,
    emailNotificationsEnabled: true,
    onesignalPlayerId: "onesignal-player-donor-1",
    personalPause: false,
    donationsCount: 12,
    bloodDonationsCount: 12,
    lastDonationDate: "2026-04-01",
    lastDonationType: "blood",
    // 12th donation. Is it 5th or 10th? No, so next is 60 days
    nextAvailableDate: "2026-05-31", // available now (current date in additional metadata is June 2026)
    createdAt: new Date().toISOString()
  }
];

// Add 19 more realistic donors (to make 20+)
const NAMES_MALE = [
  { last: "Казак", first: "Максим", middle: "Валерьевич" },
  { last: "Козлов", first: "Дмитрий", middle: "Николаевич" },
  { last: "Новик", first: "Сергей", middle: "Андреевич" },
  { last: "Шевченко", first: "Андрей", middle: "Сергеевич" },
  { last: "Ковальчук", first: "Юрий", middle: "Михайлович" },
  { last: "Климович", first: "Александр", middle: "Николаевич" },
  { last: "Макаревич", first: "Владислав", middle: "Евгеньевич" },
  { last: "Захаров", first: "Иван", middle: "Сергеевич" },
  { last: "Романов", first: "Артем", middle: "Александрович" },
  { last: "Лебедев", first: "Антон", middle: "Анатольевич" }
];

const NAMES_FEMALE = [
  { last: "Клименко", first: "Ольга", middle: "Игоревна" },
  { last: "Баранова", first: "Мария", middle: "Викторовна" },
  { last: "Мороз", first: "Екатерина", middle: "Сергеевна" },
  { last: "Савицкая", first: "Анна", middle: "Дмитриевна" },
  { last: "Шушкевич", first: "Наталья", middle: "Константиновна" },
  { last: "Карпович", first: "Елена", middle: "Витальевна" },
  { last: "Кравцова", first: "Татьяна", middle: "Григорьевна" },
  { last: "Васильева", first: "Ирина", middle: "Алексеевна" },
  { last: "Кузнецова", first: "Светлана", middle: "Валерьевна" }
];

const BLOOD_GROUPS: BloodGroup[] = ["I_O", "II_A", "III_B", "IV_AB"];
const RH_FACTORS: RhFactor[] = ["positive", "negative"];

// We will construct the rest of the 20 donors dynamically so they have varied parameters:
// 5 of them will have 'pending' status in Minsk RNPCC (ID 1) to demo the pending pool.
// 2 will have active medical notes (медотводы).
// 1 will have personal pause.
// Each will be linked to users as well.

const seededState: DatabaseState = {
  centers: INITIAL_CENTERS,
  users: [...INITIAL_USERS],
  donors: [...INITIAL_DONORS],
  donorCenters: [
    {
      id: 1,
      donorId: 1,
      centerId: 1, // Минск РНПЦ
      isPrimary: true,
      status: "confirmed",
      confirmedById: 2,
      confirmedAt: "2026-03-01T12:00:00Z",
      createdAt: "2026-02-20T10:00:00Z",
      resubmissionCount: 0
    }
  ],
  donations: [],
  medicalNotes: [],
  news: [
    {
      id: 1,
      centerId: 1,
      title: "Срочная потребность в крови II(A) Rh+",
      content: "Уважаемые доноры! В связи со сложной хирургической операцией в НПЦ детской онкологии, нашему центру экстренно требуется пополнение запасов эритроцитарной массы II группы резус-положительный. Просим всех, кто подходит по срокам, обратиться в регистратуру РНПЦ.",
      isPublished: true,
      publishedAt: "2026-06-01T09:00:00Z",
      createdAt: "2026-06-01T09:00:00Z",
      createdBy: 2
    }
  ],
  notifications: [
    {
      id: 1,
      centerId: 1,
      sentBy: 2,
      bloodGroups: ["II_A"],
      rhFactor: "positive",
      donationType: "blood",
      minDaysSinceDonation: 60,
      excludeMedical: true,
      excludePause: true,
      channel: "all",
      messageText: "Донор-Алерт: Срочно требуется кровь группы II (A) Rh+. Позвоните: +375 (17) 289-86-40 или посетите личный кабинет.",
      recipientsCount: 4,
      pushSent: 4,
      smsSent: 3,
      emailSent: 4,
      status: "sent",
      createdAt: "2026-06-03T10:45:00Z"
    }
  ],
  notificationRecipients: []
};

// Fill up dynamic databases
for (let i = 0; i < 19; i++) {
  const isMale = i % 2 === 0;
  const nameSet = isMale ? NAMES_MALE[Math.floor(i / 2) % NAMES_MALE.length] : NAMES_FEMALE[Math.floor(i / 2) % NAMES_FEMALE.length];
  const bg = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
  const rh = RH_FACTORS[(i + 1) % RH_FACTORS.length];
  const weight = isMale ? 70 + (i % 6) * 4 : 54 + (i % 5) * 5; // some may be just 54 kg (underweight, non-ready)
  const phone = `+375 (29) 555-${String(3000 + i).padStart(4, '0')}`;
  const userId = 3 + i;
  const donorId = 2 + i;
  const email = `donor${donorId}@test.by`;

  // Create User
  seededState.users.push({
    id: userId,
    email,
    passwordHash: "$2a$12$6/p.R99zLIDa7Z0Xn3V1WOkZ.R4JWhh5K2.S61.27m/zN0SgBqbyC", // password123
    role: "donor",
    isActive: true,
    createdAt: new Date().toISOString()
  });

  // Calculate some fake history
  const donationsCount = (i * 3) % 15;
  const lastDonDate = donationsCount > 0 ? `2026-03-${String(10 + i).padStart(2, '0')}` : null;
  const nextAvail = lastDonDate ? `2026-05-${String(10 + i).padStart(2, '0')}` : null;

  // Create Donor
  const donor: Donor = {
    id: donorId,
    userId,
    lastName: nameSet.last,
    firstName: nameSet.first,
    middleName: nameSet.middle,
    birthDate: `${1975 + (i * 2) % 25}-04-12`,
    gender: isMale ? "male" : "female",
    bloodGroup: bg,
    rhFactor: rh,
    weight,
    phone,
    status: "active",
    smsEnabled: i % 3 !== 2,
    pushEnabled: i % 3 === 0,
    emailNotificationsEnabled: true,
    onesignalPlayerId: `onesignal-player-donor-${donorId}`,
    personalPause: i === 6, // donor 8 has a personal pause
    personalPauseUntil: i === 6 ? "2026-08-30" : null,
    personalPauseNote: i === 6 ? "Отпуск у моря" : null,
    donationsCount,
    bloodDonationsCount: Math.ceil(donationsCount * 0.8),
    lastDonationDate: lastDonDate,
    lastDonationType: donationsCount > 0 ? "blood" : null,
    nextAvailableDate: nextAvail,
    createdAt: new Date().toISOString()
  };
  seededState.donors.push(donor);

  // Connection with Minsk Center (ID 1)
  // Let's make exactly 5 "pending" status to showcase the confirmation interface (donors 2, 3, 4, 5, 6)
  // Others are confirmed.
  const isPending = i < 5;
  const isRejected = i === 12; // one is rejected for demo

  seededState.donorCenters.push({
    id: donorId,
    donorId,
    centerId: 1, // Минск РНПЦ
    isPrimary: true,
    status: isPending ? "pending" : isRejected ? "rejected" : "confirmed",
    rejectionReason: isRejected ? "В предоставленной медицинской выписке отсутствует печать терапевта. Пожалуйста, прикрепите скан новой выписки." : undefined,
    confirmedById: isPending || isRejected ? undefined : 2,
    confirmedAt: isPending || isRejected ? undefined : "2026-04-10T09:00:00Z",
    resubmissionCount: isRejected ? 1 : 0,
    resubmittedAt: isRejected ? "2026-05-15T10:00:00Z" : undefined,
    createdAt: new Date().toISOString()
  });

  // Adding fake history entries
  if (donationsCount > 0) {
    seededState.donations.push({
      id: i * 2 + 1,
      donorId,
      centerId: 1,
      donationDate: lastDonDate!,
      donationType: "blood",
      volumeMl: 450,
      note: "Регулярная донация, без осложнений",
      addedBy: 2,
      createdAt: lastDonDate!
    });
  }

  // Create active medical notes for exactly 2 donors (donor 9 and donor 10)
  if (i === 7) {
    seededState.medicalNotes.push({
      id: 1,
      donorId,
      centerId: 1,
      createdBy: 2,
      reason: "Острая респираторная инфекция",
      startDate: "2026-06-01",
      endDate: "2026-06-16", // Active right now (Metadata current time: June 5, 2026)
      isActive: true,
      createdAt: "2026-06-01T10:00:00Z"
    });
  }
  if (i === 8) {
    seededState.medicalNotes.push({
      id: 2,
      donorId,
      centerId: 1,
      createdBy: 2,
      reason: "Прием антибиотиков",
      startDate: "2024-04-01",
      endDate: "2024-04-11", // Expired historical one
      isActive: false,
      liftedAt: "2024-04-11T12:00:00Z",
      liftedBy: 2,
      liftNote: "Срок медотвода истек",
      createdAt: "2024-04-01T10:00:00Z"
    });
  }
}

// Ensure the helper saves to file
function saveState(state: DatabaseState) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EROFS') {
        console.warn('Read-only file system detected (likely Cloud Run). Database not persisted to disk.');
    } else {
        console.error('Error saving state', err);
    }
  }
}

// Load state of store
export function getDb(): DatabaseState {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Database file corrupt. Seeding again...');
      saveState(seededState);
      return seededState;
    }
  } else {
    saveState(seededState);
    return seededState;
  }
}

export function saveDb(state: DatabaseState) {
  saveState(state);
}
