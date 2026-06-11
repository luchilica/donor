import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { BloodCenter, User, Donor, DonorCenter, Donation, MedicalNote, News, Notification, NotificationRecipient, SmsTemplate, BloodGroup, RhFactor, DonationType } from '../src/types';

function getClientUrl(urlStr: string | undefined): string | undefined {
  if (!urlStr) return urlStr;
  try {
    const u = new URL(urlStr);
    u.username = encodeURIComponent(decodeURIComponent(u.username));
    u.password = encodeURIComponent(decodeURIComponent(u.password));
    
    if (u.searchParams.get('pgbouncer') !== 'true') {
       u.searchParams.set('pgbouncer', 'true');
    }
    
    return u.toString();
  } catch(e) {
    return urlStr;
  }
}

let dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (dbUrl) {
  dbUrl = getClientUrl(dbUrl);
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

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
  smsTemplates: SmsTemplate[];
}

const INITIAL_CENTERS: BloodCenter[] = [
  {
    id: 1,
    name: "ГУ «РНПЦ трансфузиологии и медицинских биотехнологий» (Минск)",
    address: "г. Минск, ул. Долгиновский тракт, д. 160",
    phone: "+375 29 390-84-84",
    email: "branch@blood.by",
    workingHours: "Пн-Пт: 08:00 - 16:00, Сб: 08:30 - 13:00",
    mapLink: "https://yandex.by/maps/-/CPdxaM7D",
    eRegistrationLink: "https://form.blood.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "ГУЗ «Витебский областной центр трансфузиологии»",
    address: "г. Витебск, ул. Фрунзе, д. 71",
    phone: "+375 21 248-03-80",
    email: "vospk@vitebsk.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPdxa0Pb",
    eRegistrationLink: "https://bankblood-vitebsk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "ГУ «Брестская областная станция переливания крови»",
    address: "г. Брест, ул. Медицинская, д. 2",
    phone: "+375 16 228-53-81",
    email: "bospk@bospk.by",
    workingHours: "Пн-Пт: 08:00 - 16:30",
    mapLink: "https://yandex.by/maps/-/CPdxmYnF",
    eRegistrationLink: "https://bospk.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: "УЗ «Мозырская станция переливания крови»",
    address: "г. Мозырь, ул. Нагорная, д. 56А",
    phone: "+375 23 624-19-48",
    email: "mail@mozyrdonor.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3bI4G",
    eRegistrationLink: "https://mozyrdonor.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    name: "УЗ «Рогачевская станция переливания крови»",
    address: "г. Рогачев, ул. Октябрьская, д. 31",
    phone: "+375 23 392-79-50",
    email: "info@rspk.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CPd3RCZR",
    eRegistrationLink: "http://rspk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    name: "УЗ «Могилевская областная станция переливания крови»",
    address: "г. Могилев, ул. Пионерская, д. 17",
    phone: "+375 22 278-14-22",
    email: "mospk@mospk.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CPdxqOkz",
    eRegistrationLink: "https://mospk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    name: "УЗ «Бобруйская зональная станция переливания крови»",
    address: "г. Бобруйск, ул. Пушкина, д. 206А",
    phone: "+375 22 573-46-70",
    email: "info@bzspk.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/profile/-/CPdxuJ20",
    eRegistrationLink: "http://bzspk.by",
    createdAt: new Date().toISOString()
  },
  {
    id: 8,
    name: "Борисовская станция переливания крови",
    address: "г. Борисов, ул. 8 Марта д.11",
    phone: "+375 17 794-37-01",
    email: "kancelaria@borisov-crb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPdxBMlA",
    eRegistrationLink: "https://borcrb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 9,
    name: "Молодечненская станция переливания крови",
    address: "Молодечно, ул. Чкалова, 2В",
    phone: "+375 17 674-97-08",
    email: "info@omispk.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPdxJP29",
    eRegistrationLink: "https://omispk.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 10,
    name: "Солигорская станция переливания крови",
    address: "Солигорск, ул. Коржа, 1",
    phone: "+375 17 424-92-61",
    email: "solcrb@soligorskcrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPdxRHLa",
    eRegistrationLink: "https://soligorskcrb.by/podrazdelenija-crb/medicisnkie-uchrezhdenija-g-soligorska/jendoskopicheskoe-otdelenie-s-uzi-diagnostikoj/otdelenie-perelivanija-krovi-transfuziologii/",
    createdAt: new Date().toISOString()
  },
  {
    id: 11,
    name: "Слуцкая станция переливания крови",
    address: "г. Слуцк, ул. Чайковского, д. 21",
    phone: "+375 17 957-17-48",
    email: "info@slcrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPdxZLoq",
    eRegistrationLink: "https://slcrb.by/podrazdeleniya/stantsiya-perelivaniya-krovi/",
    createdAt: new Date().toISOString()
  },
  {
    id: 12,
    name: "Барановичская станция переливания крови",
    address: "г. Барановичи, ул. 50-лет ВЛКСМ, д. 4Д",
    phone: "+375 16 364-48-28",
    email: "spk@barcp.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPdxbQ86",
    eRegistrationLink: "https://barcp.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 13,
    name: "Пинская станция переливания крови",
    address: "г. Пинск, ул. Горького, д. 43",
    phone: "+375 16 565-32-05",
    email: "cp_pinsk@pcp.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPdxb-I7",
    eRegistrationLink: "https://pcp.by/stancija-perelivanija-krovi/obshhaja-informacija/",
    createdAt: new Date().toISOString()
  },
  {
    id: 14,
    name: "Кобринская станция переливания крови",
    address: "г. Кобрин, ул. Советская, д. 132",
    phone: "+375 16 422-58-00",
    email: "tmo@kobrincrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPdxj-kG",
    eRegistrationLink: "https://kobrincrb.by/podrazdeleniya/bolnicza/otdelenie-transfuziologii/",
    createdAt: new Date().toISOString()
  },
  {
    id: 15,
    name: "Оршанская станция переливания крови",
    address: "г. Орша, ул. Оршично-Набережная, д. 1",
    phone: "+375 21 651-60-73",
    email: "o-voct@bankblood-vitebsk.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CPdxnX6R",
    eRegistrationLink: "https://bankblood-vitebsk.by/filial-2-g-orsha/",
    createdAt: new Date().toISOString()
  },
  {
    id: 16,
    name: "Новополоцкая станция переливания крови",
    address: "г. Новополоцк, ул. Гайдарова, д. 4В",
    phone: "+375 21 450-62-60",
    email: "n-voct@bankblood-vitebsk.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CPdxr86R",
    eRegistrationLink: "https://bankblood-vitebsk.by/filial-1-g-novopoloczk/",
    createdAt: new Date().toISOString()
  },
  {
    id: 17,
    name: "Полоцкая станция переливания крови",
    address: "г. Полоцк, ул. Нижне-Покровская, д. 41",
    phone: "+375 21 443-63-75",
    email: "p-voct@bankblood-vitebsk.by",
    workingHours: "Пн-Пт: 08:00 - 16:00",
    mapLink: "https://yandex.by/maps/-/CPdxv8OB",
    eRegistrationLink: "https://bankblood-vitebsk.by/filial-3-g-poloczk/",
    createdAt: new Date().toISOString()
  },
  {
    id: 18,
    name: "Гомельский областной госпиталь ИВ - ОПК",
    address: "г. Гомель, ул. Ильича, д. 286Б",
    phone: "+375 23 253-98-32",
    email: "ggkb3@ggkb3.by",
    workingHours: "Пн-Пт: 08:30 - 14:30",
    mapLink: "https://yandex.by/maps/-/CPd3QW3~",
    eRegistrationLink: "https://www.ggkb3.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 19,
    name: "Гомельская областная станция переливания крови",
    address: "г. Гомель, ул. Демьяна Бедного, д. 2",
    phone: "+375 23 234-72-51",
    email: "reghosp@gokb.by",
    workingHours: "Пн-Пт: 08:30 - 14:30",
    mapLink: "https://yandex.by/maps/-/CPd3YQoB",
    eRegistrationLink: "https://gokb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 20,
    name: "Речицкая центральная районная больница - ОПК",
    address: "г. Речица, ул. Трифонова, д. 117",
    phone: "+375 23 404-46-34",
    email: "rcrb@rechitsa.by",
    workingHours: "Пн-Пт: 08:30 - 14:30",
    mapLink: "https://yandex.by/maps/-/CPd3mRJo",
    eRegistrationLink: "https://www.med.rechitsa.by/index.php/struktura/drygie-otd/otdelenie-transfuziologii",
    createdAt: new Date().toISOString()
  },
  {
    id: 21,
    name: "Светлогорская станция переливания крови",
    address: "г. Светлогорск, ул. Свердлова, д. 8",
    phone: "+375 23 427-69-00",
    email: "svetlcge@mail.gomel.by",
    workingHours: "Пн-Пт: 08:30 - 14:30",
    mapLink: "https://yandex.by/maps/-/CPd35GYH",
    eRegistrationLink: "https://www.svetlcge.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 22,
    name: "Жлобинская ЦРБ - Отделение переливания крови",
    address: "г. Жлобин, ул. Воровского, д. 1",
    phone: "+375 23 344-25-21",
    email: "zhlcrb@zhlcrb.by",
    workingHours: "Пн-Пт: 08:30 - 14:30",
    mapLink: "https://yandex.by/maps/-/CPd3FAoZ",
    eRegistrationLink: "https://zhlcrb.by/novost/1140-pamyatka-donoru",
    createdAt: new Date().toISOString()
  },
  {
    id: 23,
    name: "Гродненская областная станция переливания крови",
    address: "г. Гродно, ул. Кабяка, д. 22",
    phone: "+375 15 231-54-05",
    email: "donor@mailgrodno.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3F84s",
    eRegistrationLink: "https://donor.mailgrodno.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 24,
    name: "Лидская станция переливания крови",
    address: "г. Лида, ул. Кирова, д. 19",
    phone: "+375 15 453-20-69",
    email: "cancel@crblida.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3ZQ49",
    eRegistrationLink: "https://crblida.by/index.php/informatsiya/donorstvo/prisoedinyajsya-k-donorskomu-dvizheniyu",
    createdAt: new Date().toISOString()
  },
  {
    id: 25,
    name: "Слонимская ЦРБ - ОПК",
    address: "г. Слоним, ул. Войкова, д. 51А",
    phone: "+375 15 626-59-68",
    email: "info@slncrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3jMNe",
    eRegistrationLink: "https://slncrb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 26,
    name: "Волковысская ЦРБ - ОПК",
    address: "г. Волковыск, ул. Горбатова, д. 1",
    phone: "+375 15 125-90-30",
    email: "crb@volrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3jK4U",
    eRegistrationLink: "https://www.volrb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 27,
    name: "Сморгонская ЦРБ - ОПК",
    address: "г. Сморгонь, пер. Больничный, д. 13",
    phone: "+375 15 922-49-07",
    email: "hospital@smorgon-crb.by",
    workingHours: "Пн-Пт: 08:00 - 15:00",
    mapLink: "https://yandex.by/maps/-/CPd3vMz4",
    eRegistrationLink: "http://smorgon-crb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 28,
    name: "Горецкая центральная районная больница - ОПК",
    address: "г. Горки, ул. Кирова, д. 18",
    phone: "+375 22 335-40-11",
    email: "priemnaya@gorkicrb.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd3z2mQ",
    eRegistrationLink: "https://gorkicrb.by/opkotdelenie-perelivaniya-krovi/",
    createdAt: new Date().toISOString()
  },
  {
    id: 29,
    name: "Кричевская ЦРБ - ОПК",
    address: "г. Кричев, ул. Ленинская, д. 70",
    phone: "+375 22 412-72-80",
    email: "krichev-crb@mogilev.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~AXlg",
    eRegistrationLink: "https://krichev-crb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 30,
    name: "Осиповичская ЦРБ - ОПК",
    address: "г. Осиповичи, ул. Октябрьская, д. 2",
    phone: "+375 22 357-05-80",
    email: "oblzdrav@mogilev.by",
    workingHours: "Пн-Пт: 08:00 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~IYLO",
    eRegistrationLink: "https://ocrb.by/?ysclid=mq6bko9inj711418264",
    createdAt: new Date().toISOString()
  },
  {
    id: 31,
    name: "Минская областная клиническая больница - ОПК",
    address: "Минский р-н, пос. Лесной, д. 1",
    phone: "+375 17 265-25-58",
    email: "info@mokb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~MHy0",
    eRegistrationLink: "https://minsk-okb.by/otdelenia/hirurgia/perelivanie-krovi.html?ysclid=mq6bpffb8d321241165",
    createdAt: new Date().toISOString()
  },
  {
    id: 32,
    name: "Городской трансфузиологический кабинет (Минск, 6-я ГКБ)",
    address: "г. Минск, ул. Уральская, д. 5",
    phone: "+375 17 239-59-13",
    email: "6gkb-trfz@mcct.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~UMM~",
    eRegistrationLink: "https://mcct.by/?ysclid=mq6bq5498y845565086",
    createdAt: new Date().toISOString()
  },
  {
    id: 33,
    name: "ОПК Минской ЦРБ (Минский р-н)",
    address: "д. Боровляны, ул. Фрунзенская, д. 1А, корп. 6",
    phone: "+375 17 505-27-33",
    email: "uz-mcrb@mcrkb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~YDJ7",
    eRegistrationLink: "https://mcrb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 34,
    name: "Жодинская ЦГБ - ОПК",
    address: "г. Жодино, пр. Венисье, д. 1",
    phone: "+375 17 753-49-05",
    email: "info@zhcgb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~4W-v",
    eRegistrationLink: "https://zhcgb.by/ru/otdelenie-transfuziologi?ysclid=mq6bvtjb81344566277",
    createdAt: new Date().toISOString()
  },
  {
    id: 35,
    name: "Несвижская ЦРБ - ОПК",
    address: "г. Несвиж г.п. Городея, ул. Гагарина, д. 13",
    phone: "+375 17 705-81-57",
    email: "crb@nesvizh-hospital.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~aPjK",
    eRegistrationLink: "https://nesvizh-hospital.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 36,
    name: "Вилейская ЦРБ - ОПК",
    address: "г. Вилейка, ул. Пионерская, д. 42",
    phone: "+375 17 715-15-09",
    email: "crb@vilcrb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~mF6z",
    eRegistrationLink: "https://vilcrb.by/",
    createdAt: new Date().toISOString()
  },
  {
    id: 37,
    name: "Речицкая ЦРБ - Филиал переливания крови",
    address: "г. Речица, ул. Трифонова, д. 119",
    phone: "+375 23 409-95-27",
    email: "rcrb@rechitsa.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~qAJe",
    eRegistrationLink: "https://med.rechitsa.by/index.php/struktura/drygie-otd/otdelenie-transfuziologii",
    createdAt: new Date().toISOString()
  },
  {
    id: 38,
    name: "Калинковичская ЦРБ - ОПК",
    address: "г. Калинковичи, ул. Князева, д. 7",
    phone: "+375 23 452-35-54",
    email: "kln-tmo@mail.gomel.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~uTLe",
    eRegistrationLink: "https://kcrb.by/o-nas/otdeleniya?ysclid=mq6c3lswf9789109011",
    createdAt: new Date().toISOString()
  },
  {
    id: 39,
    name: "Добрушская ЦРБ - ОПК",
    address: "г. Добруш, ул. Чапаева, д. 3",
    phone: "+375 23 332-30-37",
    email: "info@dcrb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~y86y",
    eRegistrationLink: "https://dcrb.by/o-nas/podrazdeleniya/okpp.html?view=article&id=29&catid=15&ysclid=mq6c5wtz9l30973914",
    createdAt: new Date().toISOString()
  },
  {
    id: 40,
    name: "Хойникская ЦРБ - ОПК",
    address: "г. Хойники, ул. Мира, д. 1",
    phone: "+375 23 464-13-25",
    email: "mail@khoiniki-crb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~5T~n",
    eRegistrationLink: "https://khoiniki-crb.by//ysclid=mq6c799ww2888243320",
    createdAt: new Date().toISOString()
  },
  {
    id: 41,
    name: "Лунинецкая ЦРБ - ОПК",
    address: "г. Лунинец, ул. Максима Богдановича, д. 4",
    phone: "+375 16 476-27-82",
    email: "lncrb@lncrb.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~FQpu",
    eRegistrationLink: "https://lncrb.by/kontakty/vse-kontaktnye-nomera-telefonov?ysclid=mq6c9gw3zj347592647",
    createdAt: new Date().toISOString()
  },
  {
    id: 42,
    name: "Берёзовская ЦРБ - ОПК",
    address: "г. Берёза, ул. Ленина, д. 1",
    phone: "+375 16 433-00-69",
    email: "bereza_rtmo@crbbrz.by",
    workingHours: "Пн-Пт: 08:30 - 15:30",
    mapLink: "https://yandex.by/maps/-/CPd~F2Mp",
    eRegistrationLink: "http://www.crbbrz.by/",
    createdAt: new Date().toISOString()
  },
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
  notificationRecipients: [],
  smsTemplates: [
    {
      id: 1,
      centerId: 1,
      name: "Срочный призыв",
      text: "Внимание! Срочно требуется кровь вашей группы. Пожалуйста, придите в центр крови в ближайшее время.",
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ]
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

async function seedPostgresWithSeededState() {
  const data = seededState;

  // 1. Blood Centers
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

  // 2. Users
  for (const item of data.users) {
    await prisma.user.create({
      data: {
        id: item.id,
        email: item.email,
        passwordHash: item.passwordHash,
        role: item.role as any,
        centerId: item.centerId || null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        resetCode: item.resetCode || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        lastLogin: item.lastLogin ? new Date(item.lastLogin) : null,
      }
    });
  }

  // 3. Donors
  for (const item of data.donors) {
    await prisma.donor.create({
      data: {
        id: item.id,
        userId: item.userId,
        lastName: item.lastName,
        firstName: item.firstName,
        middleName: item.middleName || null,
        birthDate: new Date(item.birthDate),
        gender: item.gender as any,
        bloodGroup: item.bloodGroup as any,
        rhFactor: item.rhFactor as any,
        weight: item.weight,
        phone: item.phone,
        status: (item.status || 'active') as any,
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
        lastDonationType: item.lastDonationType ? (item.lastDonationType as any) : null,
        nextAvailableDate: item.nextAvailableDate ? new Date(item.nextAvailableDate) : null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }
    });
  }

  // 4. Donor Centers
  for (const item of data.donorCenters) {
    await prisma.donorCenter.create({
      data: {
        id: item.id,
        donorId: item.donorId,
        centerId: item.centerId,
        isPrimary: item.isPrimary !== undefined ? item.isPrimary : false,
        status: (item.status || 'pending') as any,
        rejectionReason: item.rejectionReason || null,
        resubmissionCount: item.resubmissionCount || 0,
        resubmittedAt: item.resubmittedAt ? new Date(item.resubmittedAt) : null,
        confirmedAt: item.confirmedAt ? new Date(item.confirmedAt) : null,
        confirmedById: item.confirmedById || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }
    });
  }

  // 5. Donations
  for (const item of data.donations) {
    await prisma.donation.create({
      data: {
        id: item.id,
        donorId: item.donorId,
        centerId: item.centerId,
        donationDate: new Date(item.donationDate),
        donationType: item.donationType as any,
        volumeMl: item.volumeMl || null,
        note: item.note || null,
        addedById: item.addedBy || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }
    });
  }

  // 6. Medical Notes
  for (const item of data.medicalNotes) {
    await prisma.medicalNote.create({
      data: {
        id: item.id,
        donorId: item.donorId,
        centerId: item.centerId,
        createdById: item.createdBy || 1,
        reason: item.reason,
        startDate: new Date(item.startDate),
        endDate: item.endDate ? new Date(item.endDate) : null,
        isActive: item.isActive !== undefined ? item.isActive : true,
        liftedAt: item.liftedAt ? new Date(item.liftedAt) : null,
        liftedById: item.liftedBy || null,
        liftNote: item.liftNote || null,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }
    });
  }

  // 7. News
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
        createdById: item.createdBy || null,
      }
    });
  }

  // 8. Notifications
  for (const item of data.notifications) {
    await prisma.notification.create({
      data: {
        id: item.id,
        centerId: item.centerId,
        sentById: item.sentBy || null,
        bloodGroups: JSON.stringify(item.bloodGroups),
        rhFactor: item.rhFactor as any,
        donationType: item.donationType as any,
        minDaysSinceDonation: item.minDaysSinceDonation || 0,
        excludeMedical: item.excludeMedical !== undefined ? item.excludeMedical : true,
        excludePause: item.excludePause !== undefined ? item.excludePause : true,
        channel: item.channel as any,
        messageText: item.messageText,
        recipientsCount: item.recipientsCount || 0,
        pushSent: item.pushSent || 0,
        smsSent: item.smsSent || 0,
        emailSent: item.emailSent || 0,
        status: item.status as any,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }
    });
  }

  // 9. Notification Recipients
  for (const item of data.notificationRecipients) {
    await prisma.notificationRecipient.create({
      data: {
        id: item.id,
        notificationId: item.notificationId,
        donorId: item.donorId,
        pushStatus: item.pushStatus as any,
        smsStatus: item.smsStatus as any,
        emailStatus: item.emailStatus as any,
        sentAt: item.sentAt ? new Date(item.sentAt) : new Date(),
      }
    });
  }

  // 10. SMS Templates
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

  // Reset core sequences
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
    } catch (e: any) {
      console.warn(`Could not reset sequence during auto-seed: ${e.message}`);
    }
  }
}

function checkPostgresActive(): boolean {
  if (!process.env.DATABASE_URL) return false;
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) return false;
    if (url.port && isNaN(Number(url.port))) return false;
    return true;
  } catch {
    return false;
  }
}

// Load state of store
export async function getDb(): Promise<DatabaseState> {
  const isPostgresActive = checkPostgresActive();

  if (isPostgresActive) {
    try {
      // Auto-seeds the database if empty
      const centerCount = await prisma.bloodCenter.count();
      if (centerCount === 0) {
        console.log('PostgreSQL database is empty. Auto-seeding from memory template...');
        await seedPostgresWithSeededState();
      }

      const [
        dbCenters,
        dbUsers,
        dbDonors,
        dbDonorCenters,
        dbDonations,
        dbMedicalNotes,
        dbNews,
        dbNotifications,
        dbNotificationRecipients,
        dbSmsTemplates
      ] = await Promise.all([
        prisma.bloodCenter.findMany(),
        prisma.user.findMany(),
        prisma.donor.findMany(),
        prisma.donorCenter.findMany(),
        prisma.donation.findMany(),
        prisma.medicalNote.findMany(),
        prisma.news.findMany(),
        prisma.notification.findMany(),
        prisma.notificationRecipient.findMany(),
        prisma.smsTemplate.findMany()
      ]);

      return {
        centers: dbCenters.map(m => ({
          id: m.id,
          name: m.name,
          address: m.address,
          phone: m.phone,
          email: m.email,
          workingHours: m.workingHours,
          mapLink: m.mapLink,
          eRegistrationLink: m.eRegistrationLink,
          createdAt: m.createdAt.toISOString()
        })),
        users: dbUsers.map(m => ({
          id: m.id,
          email: m.email,
          passwordHash: m.passwordHash,
          role: m.role as any,
          centerId: m.centerId,
          isActive: m.isActive,
          resetCode: m.resetCode || undefined,
          createdAt: m.createdAt.toISOString(),
          lastLogin: m.lastLogin ? m.lastLogin.toISOString() : null
        })),
        donors: dbDonors.map(m => ({
          id: m.id,
          userId: m.userId,
          lastName: m.lastName,
          firstName: m.firstName,
          middleName: m.middleName,
          birthDate: m.birthDate.toISOString().split('T')[0],
          gender: m.gender as any,
          bloodGroup: m.bloodGroup as any,
          rhFactor: m.rhFactor as any,
          weight: Number(m.weight),
          phone: m.phone,
          status: m.status as any,
          smsEnabled: m.smsEnabled,
          pushEnabled: m.pushEnabled,
          emailNotificationsEnabled: m.emailNotificationsEnabled,
          onesignalPlayerId: m.onesignalPlayerId,
          personalPause: m.personalPause,
          personalPauseUntil: m.personalPauseUntil ? m.personalPauseUntil.toISOString().split('T')[0] : null,
          personalPauseNote: m.personalPauseNote,
          donationsCount: m.donationsCount,
          bloodDonationsCount: m.bloodDonationsCount,
          lastDonationDate: m.lastDonationDate ? m.lastDonationDate.toISOString().split('T')[0] : null,
          lastDonationType: m.lastDonationType as any,
          nextAvailableDate: m.nextAvailableDate ? m.nextAvailableDate.toISOString().split('T')[0] : null,
          createdAt: m.createdAt.toISOString()
        })),
        donorCenters: dbDonorCenters.map(m => ({
          id: m.id,
          donorId: m.donorId,
          centerId: m.centerId,
          isPrimary: m.isPrimary,
          status: m.status as any,
          rejectionReason: m.rejectionReason,
          resubmissionCount: m.resubmissionCount,
          resubmittedAt: m.resubmittedAt ? m.resubmittedAt.toISOString() : null,
          confirmedAt: m.confirmedAt ? m.confirmedAt.toISOString() : null,
          confirmedById: m.confirmedById,
          createdAt: m.createdAt.toISOString()
        })),
        donations: dbDonations.map(m => ({
          id: m.id,
          donorId: m.donorId,
          centerId: m.centerId,
          donationDate: m.donationDate.toISOString().split('T')[0],
          donationType: m.donationType as any,
          volumeMl: m.volumeMl,
          note: m.note,
          addedBy: m.addedById,
          createdAt: m.createdAt.toISOString()
        })),
        medicalNotes: dbMedicalNotes.map(m => ({
          id: m.id,
          donorId: m.donorId,
          centerId: m.centerId,
          createdBy: m.createdById,
          reason: m.reason,
          startDate: m.startDate.toISOString().split('T')[0],
          endDate: m.endDate ? m.endDate.toISOString().split('T')[0] : null,
          isActive: m.isActive,
          liftedAt: m.liftedAt ? m.liftedAt.toISOString() : null,
          liftedBy: m.liftedById,
          liftNote: m.liftNote,
          createdAt: m.createdAt.toISOString()
        })),
        news: dbNews.map(m => ({
          id: m.id,
          centerId: m.centerId,
          title: m.title,
          content: m.content,
          isPublished: m.isPublished,
          publishedAt: m.publishedAt ? m.publishedAt.toISOString() : undefined,
          createdAt: m.createdAt.toISOString(),
          createdBy: m.createdById || 1
        })),
        notifications: dbNotifications.map(m => ({
          id: m.id,
          centerId: m.centerId,
          sentBy: m.sentById,
          bloodGroups: m.bloodGroups ? JSON.parse(m.bloodGroups) : [],
          rhFactor: m.rhFactor as any,
          donationType: m.donationType as any,
          minDaysSinceDonation: m.minDaysSinceDonation,
          excludeMedical: m.excludeMedical,
          excludePause: m.excludePause,
          channel: m.channel as any,
          messageText: m.messageText,
          recipientsCount: m.recipientsCount,
          pushSent: m.pushSent,
          smsSent: m.smsSent,
          emailSent: m.emailSent,
          status: m.status as any,
          createdAt: m.createdAt.toISOString()
        })),
        notificationRecipients: dbNotificationRecipients.map(m => ({
          id: m.id,
          notificationId: m.notificationId,
          donorId: m.donorId,
          pushStatus: m.pushStatus as any,
          smsStatus: m.smsStatus as any,
          emailStatus: m.emailStatus as any,
          sentAt: m.sentAt.toISOString()
        })),
        smsTemplates: dbSmsTemplates.map(m => ({
          id: m.id,
          centerId: m.centerId,
          name: m.name,
          text: m.text,
          isDefault: m.isDefault,
          createdAt: m.createdAt.toISOString()
        }))
      };
    } catch (e) {
      console.error('Failed to load from PostgreSQL, falling back to JSON storage...', e);
    }
  }

  // Fallback to local files
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

export async function saveDb(state: DatabaseState): Promise<void> {
  const isPostgresActive = checkPostgresActive();

  if (isPostgresActive) {
    try {
      // 1. Sync User table
      for (const user of state.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role as any,
            centerId: user.centerId,
            isActive: user.isActive,
            resetCode: user.resetCode || null,
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          },
          create: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role as any,
            centerId: user.centerId,
            isActive: user.isActive,
            resetCode: user.resetCode || null,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
          }
        });
      }

      // 2. Sync Donor table
      for (const donor of state.donors) {
        await prisma.donor.upsert({
          where: { id: donor.id },
          update: {
            userId: donor.userId,
            lastName: donor.lastName,
            firstName: donor.firstName,
            middleName: donor.middleName,
            birthDate: new Date(donor.birthDate),
            gender: donor.gender as any,
            bloodGroup: donor.bloodGroup as any,
            rhFactor: donor.rhFactor as any,
            weight: donor.weight,
            phone: donor.phone,
            status: donor.status as any,
            smsEnabled: donor.smsEnabled,
            pushEnabled: donor.pushEnabled,
            emailNotificationsEnabled: donor.emailNotificationsEnabled,
            onesignalPlayerId: donor.onesignalPlayerId,
            personalPause: donor.personalPause,
            personalPauseUntil: donor.personalPauseUntil ? new Date(donor.personalPauseUntil) : null,
            personalPauseNote: donor.personalPauseNote,
            donationsCount: donor.donationsCount,
            bloodDonationsCount: donor.bloodDonationsCount,
            lastDonationDate: donor.lastDonationDate ? new Date(donor.lastDonationDate) : null,
            lastDonationType: donor.lastDonationType as any,
            nextAvailableDate: donor.nextAvailableDate ? new Date(donor.nextAvailableDate) : null,
          },
          create: {
            id: donor.id,
            userId: donor.userId,
            lastName: donor.lastName,
            firstName: donor.firstName,
            middleName: donor.middleName,
            birthDate: new Date(donor.birthDate),
            gender: donor.gender as any,
            bloodGroup: donor.bloodGroup as any,
            rhFactor: donor.rhFactor as any,
            weight: donor.weight,
            phone: donor.phone,
            status: donor.status as any,
            smsEnabled: donor.smsEnabled,
            pushEnabled: donor.pushEnabled,
            emailNotificationsEnabled: donor.emailNotificationsEnabled,
            onesignalPlayerId: donor.onesignalPlayerId,
            personalPause: donor.personalPause,
            personalPauseUntil: donor.personalPauseUntil ? new Date(donor.personalPauseUntil) : null,
            personalPauseNote: donor.personalPauseNote,
            donationsCount: donor.donationsCount,
            bloodDonationsCount: donor.bloodDonationsCount,
            lastDonationDate: donor.lastDonationDate ? new Date(donor.lastDonationDate) : null,
            lastDonationType: donor.lastDonationType as any,
            nextAvailableDate: donor.nextAvailableDate ? new Date(donor.nextAvailableDate) : null,
            createdAt: donor.createdAt ? new Date(donor.createdAt) : new Date(),
          }
        });
      }

      // 3. Sync DonorCenter connections
      for (const dc of state.donorCenters) {
        await prisma.donorCenter.upsert({
          where: { donorId_centerId: { donorId: dc.donorId, centerId: dc.centerId } },
          update: {
            status: dc.status as any,
            isPrimary: dc.isPrimary,
            rejectionReason: dc.rejectionReason,
            resubmissionCount: dc.resubmissionCount,
            resubmittedAt: dc.resubmittedAt ? new Date(dc.resubmittedAt) : null,
            confirmedAt: dc.confirmedAt ? new Date(dc.confirmedAt) : null,
            confirmedById: dc.confirmedById,
          },
          create: {
            id: dc.id,
            donorId: dc.donorId,
            centerId: dc.centerId,
            status: dc.status as any,
            isPrimary: dc.isPrimary,
            rejectionReason: dc.rejectionReason,
            resubmissionCount: dc.resubmissionCount,
            resubmittedAt: dc.resubmittedAt ? new Date(dc.resubmittedAt) : null,
            confirmedAt: dc.confirmedAt ? new Date(dc.confirmedAt) : null,
            confirmedById: dc.confirmedById,
            createdAt: dc.createdAt ? new Date(dc.createdAt) : new Date(),
          }
        });
      }

      // 4. Create and Delete Donations
      const donationIds = state.donations.map(d => d.id);
      await prisma.donation.deleteMany({
        where: { id: { notIn: donationIds } }
      });
      for (const don of state.donations) {
        await prisma.donation.upsert({
          where: { id: don.id },
          update: {
            donorId: don.donorId,
            centerId: don.centerId,
            donationDate: new Date(don.donationDate),
            donationType: don.donationType as any,
            volumeMl: don.volumeMl,
            note: don.note,
            addedById: don.addedBy,
          },
          create: {
            id: don.id,
            donorId: don.donorId,
            centerId: don.centerId,
            donationDate: new Date(don.donationDate),
            donationType: don.donationType as any,
            volumeMl: don.volumeMl,
            note: don.note,
            addedById: don.addedBy,
            createdAt: don.createdAt ? new Date(don.createdAt) : new Date(),
          }
        });
      }

      // 5. Create and Delete Medical Notes
      const noteIds = state.medicalNotes.map(n => n.id);
      await prisma.medicalNote.deleteMany({
        where: { id: { notIn: noteIds } }
      });
      for (const note of state.medicalNotes) {
        await prisma.medicalNote.upsert({
          where: { id: note.id },
          update: {
            donorId: note.donorId,
            centerId: note.centerId,
            createdById: note.createdBy,
            reason: note.reason,
            startDate: new Date(note.startDate),
            endDate: note.endDate ? new Date(note.endDate) : null,
            isActive: note.isActive,
            liftedAt: note.liftedAt ? new Date(note.liftedAt) : null,
            liftedById: note.liftedBy,
            liftNote: note.liftNote,
          },
          create: {
            id: note.id,
            donorId: note.donorId,
            centerId: note.centerId,
            createdById: note.createdBy,
            reason: note.reason,
            startDate: new Date(note.startDate),
            endDate: note.endDate ? new Date(note.endDate) : null,
            isActive: note.isActive,
            liftedAt: note.liftedAt ? new Date(note.liftedAt) : null,
            liftedById: note.liftedBy,
            liftNote: note.liftNote,
            createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          }
        });
      }

      // 6. Sync News and Delete if removed
      const newsIds = state.news.map(n => n.id);
      await prisma.news.deleteMany({
        where: { id: { notIn: newsIds } }
      });
      for (const post of state.news) {
        await prisma.news.upsert({
          where: { id: post.id },
          update: {
            centerId: post.centerId,
            title: post.title,
            content: post.content,
            isPublished: post.isPublished,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
            createdById: post.createdBy
          },
          create: {
            id: post.id,
            centerId: post.centerId,
            title: post.title,
            content: post.content,
            isPublished: post.isPublished,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
            createdById: post.createdBy,
            createdAt: post.createdAt ? new Date(post.createdAt) : new Date()
          }
        });
      }

      // 7. Sync Notifications
      for (const n of state.notifications) {
        await prisma.notification.upsert({
          where: { id: n.id },
          update: {
            centerId: n.centerId,
            sentById: n.sentBy,
            bloodGroups: JSON.stringify(n.bloodGroups),
            rhFactor: n.rhFactor as any,
            donationType: n.donationType as any,
            minDaysSinceDonation: n.minDaysSinceDonation,
            excludeMedical: n.excludeMedical,
            excludePause: n.excludePause,
            channel: n.channel as any,
            messageText: n.messageText,
            recipientsCount: n.recipientsCount,
            pushSent: n.pushSent,
            smsSent: n.smsSent,
            emailSent: n.emailSent,
            status: n.status as any,
          },
          create: {
            id: n.id,
            centerId: n.centerId,
            sentById: n.sentBy,
            bloodGroups: JSON.stringify(n.bloodGroups),
            rhFactor: n.rhFactor as any,
            donationType: n.donationType as any,
            minDaysSinceDonation: n.minDaysSinceDonation,
            excludeMedical: n.excludeMedical,
            excludePause: n.excludePause,
            channel: n.channel as any,
            messageText: n.messageText,
            recipientsCount: n.recipientsCount,
            pushSent: n.pushSent,
            smsSent: n.smsSent,
            emailSent: n.emailSent,
            status: n.status as any,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
          }
        });
      }

      // 8. Sync Recipients
      for (const rec of state.notificationRecipients) {
        await prisma.notificationRecipient.upsert({
          where: { id: rec.id },
          update: {
            notificationId: rec.notificationId,
            donorId: rec.donorId,
            pushStatus: rec.pushStatus as any,
            smsStatus: rec.smsStatus as any,
            emailStatus: rec.emailStatus as any,
          },
          create: {
            id: rec.id,
            notificationId: rec.notificationId,
            donorId: rec.donorId,
            pushStatus: rec.pushStatus as any,
            smsStatus: rec.smsStatus as any,
            emailStatus: rec.emailStatus as any,
            sentAt: rec.sentAt ? new Date(rec.sentAt) : new Date(),
          }
        });
      }

      // 9. Sync SMS Templates
      for (const temp of state.smsTemplates) {
        await prisma.smsTemplate.upsert({
          where: { id: temp.id },
          update: {
            centerId: temp.centerId,
            name: temp.name,
            text: temp.text,
            isDefault: temp.isDefault,
          },
          create: {
            id: temp.id,
            centerId: temp.centerId,
            name: temp.name,
            text: temp.text,
            isDefault: temp.isDefault,
            createdAt: temp.createdAt ? new Date(temp.createdAt) : new Date()
          }
        });
      }

      console.log('PostgreSQL state fully synchronized.');
    } catch (e) {
      console.error('Failed to sync state to PostgreSQL database:', e);
    }
  }

  // Always write locally as secondary fallback / dual sync
  saveState(state);
}
