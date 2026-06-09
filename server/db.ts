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
    phone: "+375 (236) 24-74-12",
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
    phone: "+375 (177) 15-51-11",
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
