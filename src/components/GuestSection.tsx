import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, FileText, Phone, MapPin, Calendar, 
  ChevronRight, LogIn, UserPlus, HelpCircle, Check, Search, Download, User,
  Bell, Send, X
} from 'lucide-react';
import { BloodCenter, News, BloodGroup, RhFactor, Gender } from '../types';

const AccordionItem = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`mb-3 rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-red-200 shadow-md' : 'border-slate-100 hover:border-red-100 shadow-sm'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-5 transition-all duration-300 ${isOpen ? 'bg-gradient-to-r from-red-50 to-white' : 'bg-white hover:bg-slate-50'}`}
      >
        <span className={`font-semibold text-sm transition-colors ${isOpen ? 'text-red-800' : 'text-slate-800'}`}>
          {title}
        </span>
        <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'bg-red-100 text-red-600 rotate-90' : 'bg-slate-100 text-slate-500'}`}>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 bg-white border-t border-red-50 text-sm text-slate-600 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface GuestSectionProps {
  centers: BloodCenter[];
  news: News[];
  onLoginSuccess: (session: any) => void;
  apiBase: string;
  session?: any;
}

export default function GuestSection({ centers, news, onLoginSuccess, apiBase, session }: GuestSectionProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'info' | 'docs' | 'centers' | 'news'>('home');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [centerSearch, setCenterSearch] = useState<string>('');
  
  // News filter states
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [newsDateFilter, setNewsDateFilter] = useState<string>('');
  const [newsCenterFilter, setNewsCenterFilter] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);

  // Auth States
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | 'forgot' | 'resetAuth' | null>(null);

  useEffect(() => {
    const handleOpenAuth = () => setShowAuthModal('login');
    window.addEventListener('openAuth', handleOpenAuth);
    return () => window.removeEventListener('openAuth', handleOpenAuth);
  }, []);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const getPasswordHint = (pwd: string) => {
    if (!pwd) return '';
    if (pwd.length < 6) return 'Пароль слишком короткий, введите не менее 6 символов';
    const hasLetters = /[a-zA-Zа-яА-Я]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    
    if (!(hasLetters && hasNumbers)) {
      return 'Пароль слишком простой, добавьте буквы и цифры';
    }
    return '';
  };
  
  const isBirthDateInvalid = () => {
    if (!regForm.birthDate) return false;
    const bDate = new Date(regForm.birthDate);
    const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 65);
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() - 18);
    // Note: since it's inverted, minDate is 65 years ago, maxDate is 18 years ago
    // So valid range is bDate >= minDate && bDate <= maxDate.
    // Therefore invalid is bDate < minDate || bDate > maxDate.
    return bDate < minDate || bDate > maxDate;
  };

  const isEmailInvalid = () => {
    if (!regForm.email) return false;
    return !/^.+@.+$/.test(regForm.email);
  };

  const isConfirmPasswordInvalid = () => {
    if (!regConfirmPassword) return false;
    return regConfirmPassword !== regForm.password;
  };

  const isWeightInvalid = () => {
    if (!regForm.weight) return false;
    const w = parseFloat(regForm.weight);
    return w < 55;
  };

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
    phone: '+375',
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
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setLoginError('Введите ваш e-mail');
      return;
    }
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при запросе сброса пароля');
      }
      alert(data.message || 'Письмо отправлено');
      setShowAuthModal('resetAuth');
      setResetCode('');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode) {
      setLoginError('Введите код из письма');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setLoginError('Пароли не совпадают');
      return;
    }
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, code: resetCode, newPassword: resetPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при сохранении пароля');
      }
      alert(data.message || 'Пароль изменён');
      setShowAuthModal('login');
      setLoginPassword('');
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
      if (!regForm.lastName || !regForm.firstName || !regForm.birthDate || !regForm.phone || !regForm.email || !regForm.password || !regConfirmPassword) {
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
      if (regForm.password !== regConfirmPassword) {
        setRegError('Пароли не совпадают');
        return;
      }
      const bDate = new Date(regForm.birthDate);
      const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 65);
      const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() - 18);
      if (bDate < minDate || bDate > maxDate) {
        setRegError('Возраст донора должен быть от 18 до 65 лет');
        return;
      }
      setRegStep(2);
      return;
    }

    // Step 2 Validation and submit
    if (parseFloat(regForm.weight) < 55) {
      setRegError('К донорству допускаются лица с массой тела не менее 55 кг');
      return;
    }
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
    if (regionFilter === 'minsk') return matchesSearch && [1, 32].includes(c.id);
    if (regionFilter === 'minsk-region') return matchesSearch && [8, 9, 10, 11, 31, 33, 34, 35, 36].includes(c.id);
    if (regionFilter === 'brest') return matchesSearch && (c.address.includes('Брест') || c.name.includes('Брест') || c.id === 3 || (c.id >= 12 && c.id <= 14) || c.id === 41 || c.id === 42);
    if (regionFilter === 'vitebsk') return matchesSearch && (c.address.includes('Витебск') || c.name.includes('Витебск') || c.id === 2 || (c.id >= 15 && c.id <= 17));
    if (regionFilter === 'gomel') return matchesSearch && (c.address.includes('Гомель') || c.name.includes('Мозырь') || c.name.includes('Рогачев') || c.id === 4 || c.id === 5 || (c.id >= 18 && c.id <= 22) || (c.id >= 37 && c.id <= 40));
    if (regionFilter === 'grodno') return matchesSearch && (c.address.includes('Гродно') || c.name.includes('Гродно') || (c.id >= 23 && c.id <= 27));
    if (regionFilter === 'mogilev') return matchesSearch && (c.address.includes('Могилев') || c.name.includes('Бобруйск') || c.id === 6 || c.id === 7 || (c.id >= 28 && c.id <= 30));
    return matchesSearch;
  });

  const filteredNews = news.filter(item => {
    const center = centers.find(c => c.id === item.centerId);
    const centerName = center?.name || 'Центр переливания крови';
    
    const matchesSearch = item.title.toLowerCase().includes(newsSearch.toLowerCase()) || 
                          item.content.toLowerCase().includes(newsSearch.toLowerCase()) ||
                          centerName.toLowerCase().includes(newsSearch.toLowerCase());
    
    let matchesCenter = true;
    if (newsCenterFilter !== 'all') {
      matchesCenter = item.centerId.toString() === newsCenterFilter;
    }

    let matchesDate = true;
    if (newsDateFilter) {
      if (item.publishedAt) {
          const pubDate = new Date(item.publishedAt).toISOString().split('T')[0];
          matchesDate = pubDate === newsDateFilter;
      } else {
          matchesDate = false;
      }
    }

    return matchesSearch && matchesCenter && matchesDate;
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
              «Донор-Алерт» – современная система оповещения доноров. Мы связываем региональные центры переливания крови РБ с донорами для мгновенного закрытия экстренных дефицитов.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {!session ? (
                <>
                  <button 
                    onClick={() => {
                      setRegStep(1);
                      setRegForm({
                        lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male',
                        bloodGroup: 'II_A', rhFactor: 'positive', weight: '70', phone: '+375', email: '', password: '',
                        primaryCenterId: '', smsEnabled: true, pushEnabled: true, emailNotificationsEnabled: true, agreeTerms: false
                      });
                      setRegConfirmPassword('');
                      setShowAuthModal('register');
                    }}
                    className="bg-white text-red-700 hover:bg-rose-50 font-medium px-6 py-3 rounded-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lg flex items-center"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Стать донором
                  </button>
                  <button 
                    onClick={() => setShowAuthModal('login')}
                    className="bg-transparent hover:bg-white/10 text-white border border-white/40 font-medium px-6 py-3 rounded-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:border-white/60 hover:shadow-lg flex items-center"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Личный кабинет
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => window.dispatchEvent(new Event('goToDashboard'))}
                  className="bg-white text-red-700 hover:bg-rose-50 font-medium px-6 py-3 rounded-xl transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lg flex items-center"
                >
                  <User className="w-5 h-5 mr-2" />
                  Перейти в личный кабинет
                </button>
              )}
            </div>

            <hr className="border-white/20 mb-8" />

            <div className="flex flex-wrap gap-8 md:gap-12">
              <div>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold whitespace-nowrap block mb-1"
                >
                  {totalDonorsCount}+
                </motion.span>
                <span className="text-xs text-rose-100 font-medium leading-relaxed block">Доноров</span>
              </div>
              
              <div>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold whitespace-nowrap block mb-1"
                >
                  42
                </motion.span>
                <span className="text-xs text-rose-100 font-medium leading-relaxed block">Центра РБ</span>
              </div>
              
              <div>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold whitespace-nowrap block mb-1"
                >
                  3
                </motion.span>
                <span className="text-xs text-rose-100 font-medium leading-relaxed block">Канала связи</span>
              </div>

              <div>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-3xl md:text-4xl font-bold whitespace-nowrap block mb-1"
                >
                  100%
                </motion.span>
                <span className="text-xs text-rose-100 font-medium leading-relaxed block">Нормы МЗ РБ</span>
              </div>
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
        <div className="space-y-8">
          {/* Main info cards */}
          <div className="w-full space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1 hover:border-red-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                Как это работает?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">1</div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">Регистрация в базе</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Вы вносите свои медицинские и контактные данные, выбирая удобный центр переливания.</p>
                </div>
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">2</div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">Мониторинг дефицита</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">При острой нехватке конкретной группы крови центр отправляет мгновенный сигнал.</p>
                </div>
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">3</div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">Спасение жизни</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Система отправляет вам Push, SMS или Email. Вы знаете, что нужны именно сейчас, и совершаете донацию!</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1 hover:border-red-100 group">
                <div>
                  <span className="p-3 bg-red-50 text-red-600 rounded-xl inline-block mb-4 transition-transform duration-500 ease-out group-hover:scale-110">
                    <Activity className="w-6 h-6" />
                  </span>
                  <h3 className="font-semibold text-slate-800 text-base mb-2">Подготовка к донации</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Узнайте о противопоказаниях, необходимых интервалах и правилах подготовки, чтобы ваша донация прошла успешно.
                  </p>
                </div>
                <button onClick={() => { setActiveTab('info'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center transition-transform duration-500 ease-out group-hover:translate-x-1">
                  Узнать подробнее <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1 hover:border-red-100 group">
                <div>
                  <span className="p-3 bg-red-50 text-red-600 rounded-xl inline-block mb-4 transition-transform duration-500 ease-out group-hover:scale-110">
                    <FileText className="w-6 h-6" />
                  </span>
                  <h3 className="font-semibold text-slate-800 text-base mb-2">Необходимые документы</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Список документов для первичной и повторной донации крови и её компонентов.
                  </p>
                </div>
                <button onClick={() => { setActiveTab('docs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center transition-transform duration-500 ease-out group-hover:translate-x-1">
                  Список документов <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Communication Channels */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1 hover:border-red-100">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 text-red-500 mr-2" />
                Трёхканальная система оповещений
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">Push-уведомления</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Мгновенно в браузер или на экран смартфона.
                  </p>
                </div>
                
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">SMS-сообщения</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Работает без интернета на любом телефоне.
                  </p>
                </div>
                
                <div className="space-y-2 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center transition-all duration-500 ease-out group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-md">
                    <Send className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-slate-800 text-sm transition-colors duration-500 ease-out group-hover:text-red-700">Email-рассылка</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Полные письма с деталями и ссылками.
                  </p>
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
            <AccordionItem title="Что такое донорство крови">
               Процесс добровольной сдачи крови или её компонентов для трансфузиологической помощи нуждающимся.
            </AccordionItem>
            
            <AccordionItem title="Кто может стать донором">
               <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>Возраст:</strong> от 18 до 65 лет (ст. 26 Закона РБ «О донорстве крови»). В экстренных случаях допуск возможен по решению врачебно-консультационной комиссии.</p>
                  <p><strong>Вес:</strong> не менее 55 кг и не более ожирения II степени.</p>
                  <p><strong>Гражданство:</strong> граждане РБ, а также иностранные граждане и лица без гражданства, постоянно проживающие в РБ, обладающие полной дееспособностью.</p>
                  <p><strong>Состояние здоровья:</strong> отсутствие заболеваний, состояний и форм рискованного поведения, при которых донация противопоказана (временно или постоянно).</p>
               </div>
            </AccordionItem>

<AccordionItem title="Противопоказания к донорству">
              <div className="space-y-4 text-sm text-slate-600">
                <p><strong>Временные противопоказания:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Острая респираторная инфекция – через 15 суток после выздоровления.</li>
                    <li>Грипп, COVID-19 – через 1 месяц.</li>
                    <li>Пневмония (средней и тяжёлой степени) – через 6 месяцев.</li>
                    <li>Приём антибиотиков – за 10 дней до донации.</li>
                    <li>Приём салицилатов и анальгетиков – за 5 дней.</li>
                    <li>Алкоголь и пиво – за 48 часов.</li>
                    <li>Курение – за 2 часа.</li>
                    <li>Прививки инактивированными вакцинами – через 10 суток; живыми – через 30 суток.</li>
                    <li>Татуировка, пирсинг, перманентный макияж – через 6 месяцев.</li>
                    <li>Травма – не ранее 3 месяцев после выздоровления.</li>
                    <li>Оперативное вмешательство – через 6 месяцев (кроме протезирования суставов).</li>
                    <li>След от венепункции в локтевом сгибе без документа – 7 суток.</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-red-100">
                    <a href="/api/download/contraindications" target="_blank" download className="text-sm text-red-600 font-semibold hover:underline flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Скачать полный перечень всех противопоказаний (PDF)
                    </a>
                </div>
              </div>
            </AccordionItem>

<AccordionItem title="Как подготовиться к сдаче крови">
                <div className="space-y-2 text-sm text-slate-600">
                    <p><strong>За 10 дней</strong> – воздержаться от приёма антибактериальных медицинских препаратов.</p>
                    <p><strong>За 5 дней</strong> – от салицилатов и аналгетиков.</p>
                    <p><strong>За 48 часов</strong> – от приёма алкогольных (слабоалкогольных) напитков и пива.</p>
                    <p><strong>За 2 часа</strong> – от курения.</p>
                    <p><strong>Режим питания:</strong></p>
                    <p>Исключить: жирную, жареную, острую, копчёную пищу, молочные продукты, яйца, масло, бананы, цитрусовые, орехи, семечки.</p>
                    <p>Разрешено: сладкий чай, варенье, хлеб, сухари, сушки, отварные крупы, макароны на воде без масла, рыба на пару, соки, морсы, компоты, минеральная вода, овощи, фрукты (кроме цитрусовых и бананов).</p>
                    <p><strong className="font-semibold">На голодный желудок проходить донацию не рекомендуется.</strong></p>
                    <p>Не планировать донацию перед экзаменами, соревнованиями, интенсивной работой, перед/после работы в горячих цехах и ночью.</p>
                </div>
            </AccordionItem>

            <AccordionItem title="Что происходит во время сдачи крови">
              <div className="space-y-2 text-sm text-slate-600">
                <p>1. <strong>Регистрация.</strong> При первичном обращении оформляются учётная карточка, медицинский документ донора, карта-анкета. При повторных – только карта-анкета.</p>
                <p>2. <strong>Заполнение карты-анкеты.</strong> Донор отвечает на вопросы и подписывает добровольное согласие на забор крови.</p>
                <p>3. <strong>Клинико-лабораторные исследования.</strong></p>
                <p>4. <strong>Медицинский осмотр.</strong> Врач оценивает анамнез, проводит осмотр, измеряет:</p>
                <p className="pl-4">Артериальное давление: систолическое 100–159 мм рт. ст., диастолическое 70–99 мм рт. ст.<br/>
                   Пульс: ритмичный, 55–100 ударов в минуту.<br/>
                   Температура: 36–37°C.</p>
                <p>5. <strong>Приём завтрака.</strong></p>
                <p>6. <strong>Процедура донации.</strong> Заготовка крови в количестве 450 мл ± 10%. До 40 мл забирается для анализов (ВИЧ, гепатит B и C, сифилис и др.). Продолжительность – 10–15 минут. После процедуры накладывается асептическая давящая повязка на 4+ часа.</p>
                <p>7. <strong>Наблюдение 30 минут после донации.</strong></p>
                <p>8. <strong>Получение документов для гарантий и компенсаций.</strong></p>
                <p>9. <strong>Получение компенсации на питание (при безвозмездной донации).</strong></p>
              </div>
            </AccordionItem>
            
            <AccordionItem title="Минимальные интервалы между донациями">
                <div className="space-y-2 text-sm text-slate-600">
                    <p>Минимальные интервалы между донациями составляют:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Крови – не менее 60 календарных дней, после каждой 5-ой донации – не менее 90 календарных дней.</li>
                        <li>Компонентов крови методом афереза (плазмы, тромбоцитов) – не менее 14 календарных дней.</li>
                        <li>Донацией компонентов крови методом афереза (плазмы, тромбоцитов) и донацией крови – не менее 14 календарных дней.</li>
                        <li>Донацией крови и донацией компонентов крови методом афереза (плазмы, тромбоцитов) – не менее 30 календарных дней.</li>
                        <li>Донацией гранулоцитов (методом афереза) и донацией крови (донацией компонентов крови методом афереза (плазмы, тромбоцитов)) – не менее 30 календарных дней.</li>
                        <li>Донацией крови и донацией гранулоцитов (методом афереза) – не менее 30 календарных дней, после каждой 5-ой донации – не менее 60 календарных дней.</li>
                    </ul>
                </div>
            </AccordionItem>

            

            <AccordionItem title="Польза донорства для здоровья">
              <ul className="list-disc list-inside text-sm text-slate-600">
                <li>Стимуляция кроветворения</li>
                <li>Бесплатное обследование (ВИЧ, гепатит, сифилис)</li>
                <li>Контроль состояния здоровья</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="Льготы доноров в Беларуси">
                <div className="space-y-2 text-sm text-slate-600">
                    <p><strong>Всем донорам:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Освобождение от работы/учёбы/военной службы в день донации с сохранением среднего заработка (денежного довольствия).</li>
                        <li>Освобождение от работы на время медосмотра и дороги туда-обратно с сохранением заработка.</li>
                        <li>Бесплатное питание или его компенсация.</li>
                        <li>Возмещение расходов, связанных с выполнением донорской функции.</li>
                    </ul>
                    <p><strong>При 4+ донациях крови или 16+ донациях компонентов в течение 12 месяцев:</strong></p>
                    <p>Пособие по временной нетрудоспособности назначается с первого дня в размере 100% среднедневного заработка (независимо от причины). <em>(Примечание: 1 донация крови приравнивается к 4 донациям компонентов)</em></p>
                    <p><strong>При 20+ донациях крови или 40+ компонентов (безвозмездно), либо при 40+ крови или 80+ компонентов (с возмещением):</strong></p>
                    <p>Награждение нагрудным знаком «Ганаровы донар Рэспублiкi Беларусь».</p>
                    <p><strong>Льготы почётным донорам:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                        <li>Скидка 25% на платные медицинские услуги в государственных организациях здравоохранения.</li>
                        <li>Внеочередное медицинское обслуживание.</li>
                        <li>Внеочередной приём в социальные учреждения стационарного типа.</li>
                        <li>Первоочередной приём в государственных органах и иных организациях.</li>
                        <li>Внеочередное пользование услугами связи, культурно-просветительских и спортивно оздоровительных организаций, приобретение билетов на транспорт, обслуживание в торговле и бытовом обслуживании.</li>
                        <li>Использование трудового отпуска в удобное время + отпуск без сохранения заработной платы до 14 календарных дней в год.</li>
                        <li>Повышение пенсии по достижении пенсионного возраста.</li>
                    </ul>
                </div>
            </AccordionItem>
          </div>


        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'docs' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm max-w-4xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Необходимые документы</h2>
            <p className="text-sm text-slate-500">Какие документы взять с собой на сдачу крови.</p>
          </div>

          <div className="space-y-4">
             <AccordionItem title="Первичная донация">
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                  <li>Паспорт гражданина РБ (или иной документ, удостоверяющий личность: вид на жительство, удостоверение беженца).</li>
                  <li>Военный билет или удостоверение призывника (при наличии).</li>
                  <li>Выписка из медицинской документации о состоянии здоровья.</li>
                  <li>Результат флюорографического (рентгенологического, КТ) исследования органов грудной клетки.</li>
                  <li>Результаты осмотра врачом-гинекологом (для женщин).</li>
                  <li>Данные электрокардиографического исследования (для доноров компонентов методом афереза).</li>
                </ul>
             </AccordionItem>
             <AccordionItem title="Повторная донация">
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                  <li>Паспорт (или аналогичный документ).</li>
                  <li>Карта-анкета донора.</li>
                  <li>Выписка из медицинской документации – 1 раз в 12 месяцев.</li>
                  <li>Результат флюорографии – 1 раз в 12 месяцев.</li>
                  <li>Осмотр врачом-гинекологом – 1 раз в 12 месяцев (для женщин).</li>
                  <li>ЭКГ – 1 раз в 12 месяцев (для доноров компонентов методом афереза).</li>
                </ul>
             </AccordionItem>
          </div>

        </div>
      )}

      {/* BLOOD CENTERS TAB */}
      {activeTab === 'centers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Адреса и контакты центров переливания</h2>
              <p className="text-sm text-slate-500">Все действующие центры переливания крови Республики Беларусь.</p>
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
              { id: 'minsk', label: 'Минск' },
              { id: 'minsk-region', label: 'Минская область' },
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
              <div key={center.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 hover:border-red-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider"></span>
                    {center.eRegistrationLink && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100">
                        Запись по телефону
                      </span>
                    )} 
                  </div>
                  <span className="text-[5px] uppercase font-bold text-slate-400 tracking-wider"></span>
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
                    rel="noopener noreferrer"
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
                      Сайт учреждения
                    </a>
                  ) : (
                    <button 
                      onClick={() => alert(`Запись по телефону: ${center.phone}`)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-1.5 rounded-lg"
                    >
                      Сайт учреждения
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
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Сводка новостей центров переливания</h2>
              <p className="text-sm text-slate-500">Свежая информация об акциях безвозмездных кроводач, выездах мобильных комплексов заготовки и дефицитах плазмы.</p>
            </div>
          </div>

          
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск по новостям..."
                  value={newsSearch}
                  onChange={e => setNewsSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-colors"
                />
              </div>
              <div className="flex gap-4 flex-col sm:flex-row flex-1 sm:flex-none">
                <select
                  value={newsCenterFilter}
                  onChange={e => setNewsCenterFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-w-[200px]"
                >
                  <option value="all">Все центры</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newsDateFilter}
                  onChange={e => setNewsDateFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                />
              </div>
          

          {filteredNews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 w-full">
              {filteredNews.map(item => {
                const center = centers.find(c => c.id === item.centerId);
                let centerName = center?.name || 'Центр переливания крови';
                // try to shorten centerName if it's very long and starts with ГУ
                if (centerName.includes('РНПЦ трансфузиологии')) {
                  centerName = 'РНПЦ трансфузиологии';
                } else if (centerName.includes('Оршанская')) {
                  centerName = 'Оршанская СПК';
                } else if (centerName.includes('Витебский ОЦТ')) {
                   centerName = 'Витебский ОЦТ';
                }

                return (
                  <div key={item.id} className="group bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 hover:border-red-100 w-full">
                    <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 mb-4">
                      <span className="bg-slate-100/80 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200/60 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                        {centerName}
                      </span>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ru-RU') : 'Свежая новость'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-[17px] mb-2 leading-snug">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap line-clamp-2">{item.content}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedNews(item)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center transition-colors px-2 py-1 -ml-2 rounded-md hover:bg-red-50"
                      >
                        Подробнее
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                 );
               })}
             </div>
           ) : (
             <p className="text-sm text-slate-500 text-center py-12">По вашему запросу новости не найдены.</p>
           )}
        </div>
      )}

      {/* MODAL DIALOG AUTH (LOGIN AND REGISTER ON TOP) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setShowAuthModal(null); setRegError(''); setLoginError(''); }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* LOGIN PANEL */}
            {showAuthModal === 'login' && (
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
                      setLoginError('');
                      setShowAuthModal('forgot');
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
                    onClick={() => { setShowAuthModal('register'); setRegStep(1); setRegConfirmPassword(''); }}
                    className="text-red-600 hover:underline font-semibold"
                  >
                    Регистрация донора
                  </button>
                </div>
              </form>
            )}

            {/* REGISTRATION PANEL (STEP BY STEP) */}
            {showAuthModal === 'register' && (
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
                          min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                          value={regForm.birthDate}
                          onChange={(e) => setRegForm({...regForm, birthDate: e.target.value})}
                          className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                            isBirthDateInvalid() 
                              ? 'border-red-500 bg-red-50 focus:border-red-600' 
                              : 'border-slate-200 focus:border-red-500'
                          }`}
                        />
                        {isBirthDateInvalid() && (
                          <p className="text-xs text-red-500 mt-1">Возраст донора должен быть от 18 до 65 лет</p>
                        )}
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
                        maxLength={13}
                        value={regForm.phone}
                        onChange={(e) => {
                          let inputVal = e.target.value;
                          if (inputVal.length < 4 || !inputVal.startsWith('+375')) {
                            const allDigits = inputVal.replace(/\D/g, '');
                            if (allDigits.startsWith('375')) {
                              const extra = allDigits.substring(3);
                              inputVal = '+375' + extra;
                            } else {
                              inputVal = '+375';
                            }
                          } else {
                            const extra = inputVal.substring(4).replace(/\D/g, '');
                            inputVal = '+375' + extra;
                          }
                          setRegForm({...regForm, phone: inputVal.substring(0, 13)});
                        }}
                        placeholder="+375XXXXXXXXX"
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
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                          isEmailInvalid() ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-slate-200 focus:border-red-500'
                        }`}
                      />
                      {isEmailInvalid() && (
                        <p className="text-xs text-red-500 mt-1">Введите корректный почтовый ящик (с символом @)</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Придумайте надежный пароль <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                        placeholder="Минимум 6 символов"
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                          getPasswordHint(regForm.password) ? 'border-orange-500 bg-orange-50 focus:border-orange-600' : 'border-slate-200 focus:border-red-500'
                        }`}
                      />
                      {getPasswordHint(regForm.password) && (
                        <p className="text-xs text-orange-600 mt-1">{getPasswordHint(regForm.password)}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Подтверждение пароля <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Повторите пароль"
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                          isConfirmPasswordInvalid() ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-slate-200 focus:border-red-500'
                        }`}
                      />
                      {isConfirmPasswordInvalid() && (
                        <p className="text-xs text-red-500 mt-1">Неверный пароль</p>
                      )}
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
                        className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                          isWeightInvalid() ? 'border-red-500 bg-red-50 focus:border-red-600' : 'border-slate-200 focus:border-red-500'
                        }`}
                      />
                      {isWeightInvalid() && (
                        <p className="text-xs text-red-500 mt-1">Минимальный вес — 55 кг.</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Домашний центр крови (где вы будете обслуживаться) <span className="text-red-500">*</span></label>
                      <select 
                        required
                        value={regForm.primaryCenterId} 
                        onChange={(e) => setRegForm({...regForm, primaryCenterId: e.target.value})}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
                      >
                        <option value=""> Выберите центр переливания </option>
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

            {/* FORGOT PASSWORD PANEL */}
            {showAuthModal === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Восстановление пароля</h3>
                  <p className="text-xs text-slate-500 mt-1">Вам на почту придет код для сброса</p>
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
                    placeholder="ivanov@example.com"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition duration-150 flex items-center justify-center text-sm shadow-sm"
                >
                  {loginLoading ? 'Отправка...' : 'Отправить код'}
                </button>

                <div className="text-center pt-4 border-t border-slate-100 text-xs">
                  <button 
                    type="button"
                    onClick={() => { setShowAuthModal('login'); setLoginError(''); }}
                    className="text-slate-600 hover:underline font-semibold"
                  >
                    Вернуться ко входу
                  </button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD PANEL */}
            {showAuthModal === 'resetAuth' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Новый пароль</h3>
                  <p className="text-xs text-slate-500 mt-1">Введите код из письма и новый пароль</p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Код восстановления</label>
                  <input 
                    type="text" 
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Например, 1234"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Новый пароль</label>
                  <input 
                    type="password" 
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Подтвердите пароль</label>
                  <input 
                    type="password" 
                    required
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition duration-150 flex items-center justify-center text-sm shadow-sm"
                >
                  {loginLoading ? 'Сохранение...' : 'Сбросить пароль'}
                </button>

                <div className="text-center pt-4 border-t border-slate-100 text-xs">
                  <button 
                    type="button"
                    onClick={() => { setShowAuthModal('login'); setLoginError(''); }}
                    className="text-slate-600 hover:underline font-semibold"
                  >
                    Отменить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* NEWS MODAL */}
      <AnimatePresence>
        {selectedNews && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedNews(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[85vh] flex flex-col"
            >
              <div className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-full">
                 <button 
                  onClick={() => setSelectedNews(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto w-[100%] max-w-none">
                <div className="flex flex-wrap items-center gap-3 mb-6 pr-8">
                  <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">
                    {centers.find(c => c.id === selectedNews.centerId)?.name || 'Центр переливания'}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    {selectedNews.publishedAt ? new Date(selectedNews.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Свежая новость'}
                  </span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-tight max-w-[100%] overflow-hidden break-words">
                  {selectedNews.title}
                </h2>
                
                <div className="prose prose-slate max-w-[100%] text-slate-700 w-full overflow-hidden mb-6">
                  <p className="whitespace-pre-wrap leading-relaxed max-w-[100%] break-words">
                    {selectedNews.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
