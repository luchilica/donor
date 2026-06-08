import React, { useState, useEffect } from 'react';
import { 
  Heart, Activity, FileText, Phone, MapPin, Calendar, 
  ChevronRight, LogIn, UserPlus, HelpCircle, Check, Search, Download
} from 'lucide-react';
import { BloodCenter, News, BloodGroup, RhFactor, Gender } from '../types';

interface GuestSectionProps {
  centers: BloodCenter[];
  news: News[];
  onLoginSuccess: (session: any) => void;
  apiBase: string;
}

export default function GuestSection({ centers, news, onLoginSuccess, apiBase }: GuestSectionProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'info' | 'docs' | 'centers' | 'news'>('home');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [centerSearch, setCenterSearch] = useState<string>('');

  // Auth States
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration States
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '1995-01-01',
    gender: 'male' as Gender,
    bloodGroup: 'II_A' as BloodGroup,
    rhFactor: 'positive' as RhFactor,
    weight: '70',
    phone: '+375 (',
    email: '',
    password: '',
    primaryCenterId: '',
    smsEnabled: true,
    pushEnabled: true,
    emailNotificationsEnabled: true,
    agreeTerms: false
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Stats from DB for landing page
  const [totalDonorsCount, setTotalDonorsCount] = useState(20);
  const [sentAlertsCount, setSentAlertsCount] = useState(15);

  useEffect(() => {
    // Fetch statistical estimates dynamically
    fetch(`${apiBase}/centers`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTotalDonorsCount(data.length * 3 + 12);
        }
      })
      .catch(() => {});
  }, [apiBase]);

  // Auth Action handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }
      onLoginSuccess(data);
      setShowAuthModal(null);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regStep === 1) {
      // Validate Step 1
      if (!regForm.lastName || !regForm.firstName || !regForm.birthDate || !regForm.phone || !regForm.email || !regForm.password) {
        setRegError('Пожалуйста, заполните необходимые личные данные');
        return;
      }
      if (!regForm.email.includes('@')) {
        setRegError('Введите корректный e-mail');
        return;
      }
      if (regForm.password.length < 6) {
        setRegError('Пароль должен быть длиной не менее 6 символов');
        return;
      }
      setRegStep(2);
      return;
    }

    // Step 2 Validation and submit
    if (!regForm.primaryCenterId) {
      setRegError('Пожалуйста, выберите ваш основной центр крови из списка');
      return;
    }
    if (!regForm.agreeTerms) {
      setRegError('Необходимо подтвердить согласие на обработку персональных данных');
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
      }

      alert(data.message || 'Регистрация успешна! Теперь вы можете войти в свой личный кабинет.');
      setLoginEmail(regForm.email);
      setLoginPassword(regForm.password);
      setShowAuthModal('login');
      // Reset registration form
      setRegStep(1);
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  // Filter centers
  const filteredCenters = centers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(centerSearch.toLowerCase()) || 
                          c.address.toLowerCase().includes(centerSearch.toLowerCase());
    
    if (regionFilter === 'all') return matchesSearch;
    if (regionFilter === 'minsk') return matchesSearch && (c.address.includes('Минск') || c.name.includes('Минск') || c.id === 1 || c.id === 31 || c.id === 32 || c.id === 33);
    if (regionFilter === 'brest') return matchesSearch && (c.address.includes('Брест') || c.name.includes('Брест') || c.id === 3 || (c.id >= 12 && c.id <= 14) || c.id === 41 || c.id === 42);
    if (regionFilter === 'vitebsk') return matchesSearch && (c.address.includes('Витебск') || c.name.includes('Витебск') || c.id === 2 || (c.id >= 15 && c.id <= 17));
    if (regionFilter === 'gomel') return matchesSearch && (c.address.includes('Гомель') || c.name.includes('Мозырь') || c.name.includes('Рогачев') || c.id === 4 || c.id === 5 || (c.id >= 18 && c.id <= 22) || (c.id >= 37 && c.id <= 40));
    if (regionFilter === 'grodno') return matchesSearch && (c.address.includes('Гродно') || c.name.includes('Гродно') || (c.id >= 23 && c.id <= 27));
    if (regionFilter === 'mogilev') return matchesSearch && (c.address.includes('Могилев') || c.name.includes('Бобруйск') || c.id === 6 || c.id === 7 || (c.id >= 28 && c.id <= 30));
    return matchesSearch;
  });

  return (
    <div className="w-full">
      {/* Hero Banner Section */}
      {activeTab === 'home' && (
        <div className="bg-gradient-to-r from-rose-800 to-red-600 text-white py-12 px-6 rounded-2xl mb-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none"></div>
          <div className="max-w-3xl relative z-10">
            <h1 className="text-3xl md:text-5xl font-light tracking-tight mb-4 leading-tight">
              Спаси жизнь — стань <strong className="font-semibold">донором крови</strong> в Беларуси
            </h1>
            <p className="text-lg text-rose-100 font-light mb-8 max-w-2xl">
              «Донор-Алерт» — современная экосистема оповещения доноров. Мы связываем региональные центры переливания крови РБ с донорами для мгновенного закрытия экстренных дефицитов.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => {
                  setRegStep(1);
                  setRegForm({
                    lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male',
                    bloodGroup: 'II_A', rhFactor: 'positive', weight: '70', phone: '+375 (', email: '', password: '',
                    primaryCenterId: '', smsEnabled: true, pushEnabled: true, emailNotificationsEnabled: true, agreeTerms: false
                  });
                  setShowAuthModal('register');
                }}
                className="bg-white text-red-700 hover:bg-rose-50 font-medium px-6 py-3 rounded-xl transition duration-150 shadow-sm flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Зарегистрироваться как донор
              </button>
              <button 
                onClick={() => setShowAuthModal('login')}
                className="bg-transparent hover:bg-white/10 text-white border border-white/40 font-medium px-6 py-3 rounded-xl transition duration-150 flex items-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Личный кабинет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Guest Navigation Tabs */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto whitespace-nowrap gap-1 pb-1">
        <button 
          onClick={() => setActiveTab('home')}
          className={`px-5 py-3 font-medium transition-colors border-b-2 text-sm ${activeTab === 'home' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Главная
        </button>
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-5 py-3 font-medium transition-colors border-b-2 text-sm ${activeTab === 'info' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Памятка донору
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-5 py-3 font-medium transition-colors border-b-2 text-sm ${activeTab === 'docs' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Необходимые документы
        </button>
        <button 
          onClick={() => setActiveTab('centers')}
          className={`px-5 py-3 font-medium transition-colors border-b-2 text-sm ${activeTab === 'centers' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Центры крови РБ ({centers.length})
        </button>
        <button 
          onClick={() => setActiveTab('news')}
          className={`px-5 py-3 font-medium transition-colors border-b-2 text-sm ${activeTab === 'news' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          Новости центров ({news.length})
        </button>
      </div>

      {/* Tab Context Contents */}

      {/* HOME TAB */}
      {activeTab === 'home' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main info cards */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                Как это работает?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">1</div>
                  <h3 className="font-medium text-slate-800 text-sm">Регистрация в базе</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Вы вносите свои медицинские и контактные данные, выбирая удобный центр переливания.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">2</div>
                  <h3 className="font-medium text-slate-800 text-sm">Мониторинг дефицита</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">При острой нехватке конкретной группы крови центр отправляет мгновенный сигнал.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">3</div>
                  <h3 className="font-medium text-slate-800 text-sm">Спасение жизни</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Система отправляет вам Push, SMS или Email. Вы знаете, что нужны именно сейчас, и совершаете донацию!</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="p-3 bg-red-50 text-red-600 rounded-xl inline-block mb-4">
                    <Activity className="w-6 h-6" />
                  </span>
                  <h3 className="font-semibold text-slate-800 text-base mb-2">Медицинский календарь</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Интервалы рассчитываются автоматически по постановлению Минздрава РБ № 80 с учетом Вашего пола, истории сдач и действия правила 5-й донации.
                  </p>
                </div>
                <button onClick={() => setActiveTab('info')} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center">
                  Узнать про интервалы <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="p-3 bg-red-50 text-red-600 rounded-xl inline-block mb-4">
                    <FileText className="w-6 h-6" />
                  </span>
                  <h3 className="font-semibold text-slate-800 text-base mb-2">Бланки и выписки</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Скачивайте актуальные медицинские бланки, анкету донора и образцы выписок перед визитом к врачу непосредственно из вашего кабинета.
                  </p>
                </div>
                <button onClick={() => setActiveTab('docs')} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center">
                  Посмотреть список <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar panel */}
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Тестовый доступ на конкурсе</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Для ознакомления со всем функционалом платформы вы можете войти под предзаполненными тестовыми ролями:
              </p>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-red-700 block mb-1">Кабинет центра крови:</span>
                  <p className="text-slate-600">Email: <span className="font-mono font-medium">center@test.by</span></p>
                  <p className="text-slate-600">Пароль: <span className="font-mono font-medium">password123</span></p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-blue-700 block mb-1">Кабинет Донора:</span>
                  <p className="text-slate-600">Email: <span className="font-mono font-medium">donor@test.by</span></p>
                  <p className="text-slate-600">Пароль: <span className="font-mono font-medium">password123</span></p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setLoginEmail('center@test.by');
                  setLoginPassword('password123');
                  setShowAuthModal('login');
                }}
                className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium py-2.5 rounded-xl transition duration-150"
              >
                Быстрый вход (Центр крови)
              </button>
            </div>

            {/* Quick Stats sidebar widget */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl">
              <h4 className="text-xs uppercase tracking-wider text-rose-300 font-semibold mb-4">Статистика системы</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-2xl font-light block">{totalDonorsCount}</span>
                  <span className="text-xs text-rose-100 font-light">Доноров крови в экосистеме</span>
                </div>
                <hr className="border-white/10" />
                <div>
                  <span className="text-2xl font-light block">42</span>
                  <span className="text-xs text-rose-100 font-light">Центров переливания по всей РБ</span>
                </div>
                <hr className="border-white/10" />
                <div>
                  <span className="text-2xl font-light block">100%</span>
                  <span className="text-xs text-rose-100 font-light">Соответствие законодательству РБ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INFO TAB */}
      {activeTab === 'info' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Памятка донору крови Республики Беларусь</h2>
            <p className="text-sm text-slate-500">Нормативы составлены на основании Закона РБ «О донорстве крови и ее компонентов» и Постановления Министерства здравоохранения № 80.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-l-4 border-red-500 pl-3">Кто может стать донором в нашей стране?</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong>Возрастной ценз:</strong> строго от 18 до 65 лет включительно.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong>Ограничение по весу:</strong> масса тела не должна быть менее 55 кг.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong>Гражданство:</strong> граждане РБ, а также постоянно проживающие иностранные граждане и лица без гражданства.
              </li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <strong>Состояние здоровья:</strong> отсутствие абсолютных хронических противопоказаний (гепатиты, туберкулез, диабет, онкологические заболевания).
              </li>
            </ul>
          </div>

          {/* Temporary Medical Restriction Intervals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-l-4 border-red-500 pl-3">Временные противопоказания и отводы:</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-medium">Причина отвода / Воздействие</th>
                    <th className="pb-2 font-medium">Минимальный срок отвода</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="py-2.5">Перенесенное ОРВИ / Ангина</td>
                    <td className="py-2.5 text-red-600 font-medium">15 дней после выздоровления</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Грипп, COVID-19, среднетяжелая пневмония</td>
                    <td className="py-2.5 text-red-600 font-medium">1 месяц после выздоровления</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Прием антибиотиков</td>
                    <td className="py-2.5 text-red-600 font-medium">10 дней после последнего приема</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Нанесение татуировок, пирсинг, перманентный макияж</td>
                    <td className="py-2.5 text-red-600 font-medium">6 месяцев с момента процедуры</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Хирургические вмешательства (операции)</td>
                    <td className="py-2.5 text-red-600 font-medium">6 месяцев со дня операции</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Употребление спиртных напитков и пива</td>
                    <td className="py-2.5 text-red-600 font-medium">48 часов перед кроводачей</td>
                  </tr>
                  <tr>
                    <td className="py-2.5">Курение сигарет / вейпов</td>
                    <td className="py-2.5 text-red-600 font-medium">2 часа до и после процедуры</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Intervals between donations */}
          <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100/50 space-y-3">
            <h4 className="font-semibold text-slate-800 text-base">Интервалы между донациями (Постановление № 80):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-white p-3 rounded-xl border border-red-100">
                <span className="font-semibold text-red-700 block text-sm mb-1">60 дней</span>
                Стандартный интервал после сдачи цельной крови до следующей сдачи крови.
              </div>
              <div className="bg-white p-3 rounded-xl border border-red-100">
                <span className="font-semibold text-red-700 block text-sm mb-1">90 дней!</span>
                <strong>Правило 5-й донации:</strong> После каждой 5-й кроводачи минимальный интервал увеличивается до 90 дней для восстановления суставов и депо железа.
              </div>
              <div className="bg-white p-3 rounded-xl border border-red-100">
                <span className="font-semibold text-red-700 block text-sm mb-1">14 дней</span>
                Срок восстановления после афереза плазмы или тромбоцитов.
              </div>
            </div>
          </div>

          {/* Benefits in BY */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-l-4 border-red-500 pl-3">Льготы и компенсации в Республике Беларусь:</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Освобождение от работы:</strong> Донору гарантируется предоставление освобождения от работы или учебы в день кроводачи с сохранением среднего заработка.</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Больничный 100%:</strong> При совершении 4+ кроводач (или 16 донаций компонентов) за 12 месяцев, больничный лист оплачивается в размере 100% с первого дня болезни.</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
                <span><strong>Знак почетного донора:</strong> Безвозмездная сдача крови 20 и более раз гарантирует награждение знаком «Ганаровы донар Рэспублiкi Беларусь» и пожизненные скидки 25% на платные медуслуги во всех госклиниках страны.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'docs' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Бланки и необходимые документы</h2>
            <p className="text-sm text-slate-500">Какие документы взять с собой на станцию переливания крови.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-800 border-b pb-2">Перечень личных документов</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">1. Паспорт гражданина Республики Беларусь</p>
                  <p className="text-xs text-slate-500">Удостоверение личности обязательно для входа на любой режимный объект</p>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Обязательно</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">2. Выписка из медицинской карты с печатью терапевта</p>
                  <p className="text-xs text-slate-500">Запрашивается по месту жительства донора (срок действия - 12 месяцев)</p>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Обязательно</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">3. Результат флюорографического исследования</p>
                  <p className="text-xs text-slate-500">Проходится раз в 12 месяцев по месту учебы, жительства или работы</p>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Обязательно</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-100">
                <div>
                  <p className="font-medium text-slate-800">4. Военный билет или приписное свидетельство</p>
                  <p className="text-xs text-slate-500">Предоставляется военнообязанными гражданами при первой регистрационной процедуре</p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">При наличии</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-base font-semibold text-slate-800 border-b pb-2">Скачать бланки заявлений (интерактивные PDF)</h3>
            <p className="text-xs text-slate-500">Заполните анкету заранее на компьютере или распечатайте пустой бланк, чтобы сэкономить до 20 минут в регистрационной очереди.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Файл "Карта-анкета донора РБ.pdf" успешно загружен на устройство!'); }}
                className="p-4 border border-slate-200 rounded-xl hover:border-red-300 transition duration-150 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Анкета донора крови РБ</p>
                    <p className="text-xs text-slate-500">Форма Минздрава, PDF 220KB</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-slate-400" />
              </a>

              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert('Файл "Заявление донора на компенсацию питания.pdf" успешно загружен на устройство!'); }}
                className="p-4 border border-slate-200 rounded-xl hover:border-red-300 transition duration-150 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Заявление на компенсацию</p>
                    <p className="text-xs text-slate-500">Безвозмездное питание, PDF 140KB</p>
                  </div>
                </div>
                <Download className="w-5 h-5 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* BLOOD CENTERS TAB */}
      {activeTab === 'centers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Адреса и контакты центров переливания</h2>
              <p className="text-sm text-slate-500">Все 42 действующих центра переливания крови Республики Беларусь по 6 областям.</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Поиск по названию или городу..."
                value={centerSearch}
                onChange={(e) => setCenterSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Oblast filter bar */}
          <div className="flex flex-wrap gap-2 border-b pb-4 border-slate-100">
            {[
              { id: 'all', label: 'Все области' },
              { id: 'minsk', label: 'Минск и обл.' },
              { id: 'brest', label: 'Брестская область' },
              { id: 'vitebsk', label: 'Витебская область' },
              { id: 'gomel', label: 'Гомельская область' },
              { id: 'grodno', label: 'Гродненская область' },
              { id: 'mogilev', label: 'Могилевская область' },
            ].map(reg => (
              <button
                key={reg.id}
                onClick={() => setRegionFilter(reg.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition duration-150 ${regionFilter === reg.id ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Grid list of centers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCenters.map(center => (
              <div key={center.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition duration-150 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Учреждение #{center.id}</span>
                    {center.eRegistrationLink && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                        Онлайн запись
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-3 text-red-950">{center.name}</h3>
                  <div className="space-y-2 text-xs text-slate-600 mb-6">
                    <p className="flex items-center">
                      <MapPin className="w-4 h-4 text-rose-500 mr-2 flex-shrink-0" />
                      {center.address}
                    </p>
                    <p className="flex items-center">
                      <Phone className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                      {center.phone}
                    </p>
                    {center.workingHours && (
                      <p className="flex items-center text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                        {center.workingHours}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <a 
                    href={center.mapLink || "https://yandex.by/maps"} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline flex items-center"
                  >
                    Посмотреть на карте
                  </a>
                  {center.eRegistrationLink ? (
                    <a 
                      href={center.eRegistrationLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs bg-red-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-red-700 transition duration-150 shadow-sm"
                    >
                      Записаться на сдачу
                    </a>
                  ) : (
                    <button 
                      onClick={() => alert(`Запись по телефону: ${center.phone}`)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-1.5 rounded-lg"
                    >
                      Регистратура
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredCenters.length === 0 && (
              <p className="text-sm text-slate-500 col-span-2 text-center py-12">Центры переливания не найдены. Попробуйте другой запрос.</p>
            )}
          </div>
        </div>
      )}

      {/* NEWS TAB */}
      {activeTab === 'news' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-800">Сводка новостей центров переливания</h2>
            <p className="text-sm text-slate-500">Свежая информация об акциях безвозмездных кроводач, выездах мобильных комплексов заготовки и дефицитах плазмы.</p>
          </div>

          {news.map(item => {
            const centerName = centers.find(c => c.id === item.centerId)?.name || 'Центр переливания крови';
            return (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{centerName}</span>
                  <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ru-RU') : 'Свежая новость'}</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-base">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            );
          })}
          {news.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-12">Извещения и новости отсутствуют.</p>
          )}
        </div>
      )}

      {/* MODAL DIALOG AUTH (LOGIN AND REGISTER ON TOP) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowAuthModal(null); setRegError(''); setLoginError(''); }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              Закрыть
            </button>

            {/* LOGIN PANEL */}
            {showAuthModal === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Вход в личный кабинет</h3>
                  <p className="text-xs text-slate-500 mt-1">Доступно для зарегистрированных доноров и сотрудников центров</p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Электронная почта (E-mail)</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="donor@test.by"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Пароль</label>
                  <input 
                    type="password" 
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="text-right">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (!loginEmail) {
                        alert('Сначала введите ваш e-mail в соответствующее поле!');
                      } else {
                        fetch(`${apiBase}/auth/forgot-password`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: loginEmail })
                        })
                        .then(r => r.json())
                        .then(d => alert(d.message || d.error));
                      }
                    }}
                    className="text-xs text-red-600 hover:underline hover:text-red-700"
                  >
                    Забыли пароль?
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition duration-150 flex items-center justify-center text-sm shadow-sm"
                >
                  {loginLoading ? 'Авторизация...' : 'Войти в кабинет'}
                </button>

                <div className="text-center pt-4 border-t border-slate-100 text-xs">
                  Нет учетной записи?{' '}
                  <button 
                    type="button"
                    onClick={() => { setShowAuthModal('register'); setRegStep(1); }}
                    className="text-red-600 hover:underline font-semibold"
                  >
                    Регистрация донора
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTRATION PANEL (STEP BY STEP) */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Регистрация нового донора</h3>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <span className={`w-6 h-1.5 rounded-full ${regStep === 1 ? 'bg-red-600' : 'bg-slate-200'}`}></span>
                    <span className={`w-6 h-1.5 rounded-full ${regStep === 2 ? 'bg-red-600' : 'bg-slate-200'}`}></span>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    {regError}
                  </div>
                )}

                {regStep === 1 ? (
                  /* STEP 1: PERSONAL DETAILS */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Фамилия <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={regForm.lastName}
                          onChange={(e) => setRegForm({...regForm, lastName: e.target.value})}
                          placeholder="Иванов"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Имя <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required
                          value={regForm.firstName}
                          onChange={(e) => setRegForm({...regForm, firstName: e.target.value})}
                          placeholder="Иван"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Отчество</label>
                      <input 
                        type="text" 
                        value={regForm.middleName}
                        onChange={(e) => setRegForm({...regForm, middleName: e.target.value})}
                        placeholder="Сергеевич"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Дата рождения (18-65 лет) <span className="text-red-500">*</span></label>
                        <input 
                          type="date" 
                          required
                          value={regForm.birthDate}
                          onChange={(e) => setRegForm({...regForm, birthDate: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Пол <span className="text-red-500">*</span></label>
                        <select 
                          value={regForm.gender} 
                          onChange={(e) => setRegForm({...regForm, gender: e.target.value as Gender})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                        >
                          <option value="male">Мужской</option>
                          <option value="female">Женский</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Номер телефона <span className="text-red-500">*</span></label>
                      <input 
                        type="tel" 
                        required
                        value={regForm.phone}
                        onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                        placeholder="+375 (XX) XXX-XX-XX"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Рабочий E-Mail (Логин) <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        required
                        value={regForm.email}
                        onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                        placeholder="test@mail.ru"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Придумайте надежный пароль <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                        placeholder="Минимум 6 символов"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full mt-4 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-medium py-3 rounded-xl transition duration-150 text-sm"
                    >
                      Далее к мед. параметрам
                    </button>
                  </div>
                ) : (
                  /* STEP 2: MEDICAL SETTINGS & REGIONAL CLINIC RELATION */
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Группа крови <span className="text-red-500">*</span></label>
                        <select 
                          value={regForm.bloodGroup} 
                          onChange={(e) => setRegForm({...regForm, bloodGroup: e.target.value as BloodGroup})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                        >
                          <option value="I_O">I (O) - Первая</option>
                          <option value="II_A">II (A) - Вторая</option>
                          <option value="III_B">III (B) - Третья</option>
                          <option value="IV_AB">IV (AB) - Четвертая</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Резус-фактор <span className="text-red-500">*</span></label>
                        <select 
                          value={regForm.rhFactor} 
                          onChange={(e) => setRegForm({...regForm, rhFactor: e.target.value as RhFactor})}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                        >
                          <option value="positive">Rh +</option>
                          <option value="negative">Rh -</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Ваш вес (кг) <span className="text-red-500">*</span></label>
                      <input 
                        type="number" 
                        required
                        min="50"
                        max="200"
                        value={regForm.weight}
                        onChange={(e) => setRegForm({...regForm, weight: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Домашний центр крови (где вы будете обслуживаться) <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={regForm.primaryCenterId} 
                        onChange={(e) => setRegForm({...regForm, primaryCenterId: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                      >
                        <option value="">-- Выберите центр переливания --</option>
                        {centers.map(center => (
                          <option key={center.id} value={center.id}>{center.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Checkboxes notification permissions */}
                    <div className="space-y-2.5 pt-2">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Предпочтительные каналы оповещений о дефиците:</p>
                      
                      <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={regForm.pushEnabled}
                          onChange={(e) => setRegForm({...regForm, pushEnabled: e.target.checked})}
                          className="mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        Браузерные всплывающие Push-уведомления
                      </label>

                      <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={regForm.smsEnabled}
                          onChange={(e) => setRegForm({...regForm, smsEnabled: e.target.checked})}
                          className="mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        Экстренные сотовые SMS-оповещения
                      </label>

                      <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={regForm.emailNotificationsEnabled}
                          onChange={(e) => setRegForm({...regForm, emailNotificationsEnabled: e.target.checked})}
                          className="mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        Информационные письма на E-mail
                      </label>
                    </div>

                    <hr className="border-slate-100 my-2" />

                    <label className="flex items-start text-xs text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        required
                        checked={regForm.agreeTerms}
                        onChange={(e) => setRegForm({...regForm, agreeTerms: e.target.checked})}
                        className="mr-2.5 mt-0.5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                      />
                      <span>Я даю согласие на безопасную обработку медицинских и персональных данных для нужд Минздрава РБ и центров крови.</span>
                    </label>

                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setRegStep(1)}
                        className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition duration-150"
                      >
                        Назад
                      </button>
                      <button 
                        type="submit"
                        disabled={regLoading}
                        className="w-2/3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-3 rounded-xl transition duration-150 shadow-sm"
                      >
                        {regLoading ? 'Отправка...' : 'Отправить анкету'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center pt-2 text-xs">
                  Уже зарегистрированы?{' '}
                  <button 
                    type="button"
                    onClick={() => { setShowAuthModal('login'); }}
                    className="text-red-700 hover:underline font-semibold"
                  >
                    Войти
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
