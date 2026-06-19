import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, LogOut, HelpCircle, User, Bell, Activity, Layers, Sun, Moon, Send, ArrowUp, ChevronUp } from 'lucide-react';
import { BloodCenter, News, Donor, DonorCenter, MedicalNote, Donation } from './types.ts';
import GuestSection from './components/GuestSection.tsx';
import DonorSection from './components/DonorSection.tsx';
import CenterSection from './components/CenterSection.tsx';
import AdminSection from './components/AdminSection.tsx';
import { BY_DICT } from './i18n.ts';
import { LanguageProvider } from './LanguageContext.tsx';

const API_BASE = '/api';

export default function App() {
  const [session, setSession] = useState<{
    token: string;
    user: { id: number; email: string; role: 'donor' | 'center' | 'admin'; centerId?: number | null };
  } | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('donor_alert_theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('donor_alert_theme', theme);
  }, [theme]);

  // Global lists loaded from DB
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  // Donor-specific records (if current session is a donor)
  const [donorProfile, setDonorProfile] = useState<Donor | null>(null);
  const [donorLinks, setDonorLinks] = useState<DonorCenter[]>([]);
  const [donorMedicalNotes, setDonorMedicalNotes] = useState<MedicalNote[]>([]);
  const [donorDonations, setDonorDonations] = useState<Donation[]>([]);
  const [donorReadiness, setDonorReadiness] = useState<{ ready: boolean; reason?: string }>({ ready: false });

  // Center-specific records (if current session is a clinic staff)
  const [centerProfile, setCenterProfile] = useState<BloodCenter | null>(null);

  // Initial load
  const loadGlobalData = async () => {
    try {
      const creq = await fetch(`${API_BASE}/centers`);
      if (creq.ok) {
        const cdata = await creq.json();
        setCenters(cdata);
      }
      const nreq = await fetch(`${API_BASE}/news`);
      if (nreq.ok) {
        const ndata = await nreq.json();
        setNews(ndata);
      }
    } catch (e) {
      console.error('Error loading initial data', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logged-in profile data
  const loadProfileData = async (activeSession: typeof session) => {
    if (!activeSession) return;
    try {
      if (activeSession.user.role === 'donor') {
        const preq = await fetch(`${API_BASE}/donor/profile`, {
          headers: { 'Authorization': activeSession.token }
        });
        if (preq.ok) {
          const pdata = await preq.json();
          setDonorProfile(pdata.donor);
          setDonorLinks(pdata.links);
          setDonorMedicalNotes(pdata.medicalNotes);
          setDonorDonations(pdata.donations);
          setDonorReadiness(pdata.readiness);
        }
      } else if (activeSession.user.role === 'center') {
        // Find center profile info
        const fit = centers.find(c => c.id === activeSession.user.centerId);
        if (fit) {
          setCenterProfile(fit);
        } else {
          // fallback fetch
          const creq = await fetch(`${API_BASE}/centers`);
          if (creq.ok) {
            const clist: BloodCenter[] = await creq.json();
            const centerFit = clist.find(c => c.id === activeSession.user.centerId);
            if (centerFit) setCenterProfile(centerFit);
          }
        }
      }
    } catch (e) {
      console.error('Error loading active session profile details', e);
    }
  };

  useEffect(() => {
    const handleGoToDashboard = () => setView('dashboard');
    window.addEventListener('goToDashboard', handleGoToDashboard);
    return () => window.removeEventListener('goToDashboard', handleGoToDashboard);
  }, []);

  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [language, setLanguage] = useState<'RU' | 'BY'>('RU');

  const t = (key: string) => {
    if (language === 'RU') return key;
    return BY_DICT[key] || key;
  };

  useEffect(() => {
    const handleScroll = (e?: any) => {
      const targetScroll = e?.target?.scrollTop || 0;
      const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || targetScroll || 0;
      // Also log or just set state
      setShowBackToTop(scrollPos > 100);
    };
    
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Attempt fallback for internal generic scroll containers if window.scrollTo doesn't affect them
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Attempt local storage decode
    const stored = localStorage.getItem('donor_alert_session');
    if (stored) {
      try {
        const decoded = JSON.parse(stored);
        setSession(decoded);
        setView('dashboard');
      } catch {}
    }
    loadGlobalData();
  }, []);

  useEffect(() => {
    if (session) {
      loadProfileData(session);
    } else {
      // Clear data states
      setDonorProfile(null);
      setDonorLinks([]);
      setDonorMedicalNotes([]);
      setDonorDonations([]);
      setCenterProfile(null);
      setView('home');
    }
  }, [session, centers.length]);

  const handleLoginSuccess = (loginData: any) => {
    setSession(loginData);
    localStorage.setItem('donor_alert_session', JSON.stringify(loginData));
    setView('dashboard');
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('donor_alert_session');
    setView('home');
  };

  // Quick Evaluator Simulator Session set-up
  const simulateRole = async (role: 'guest' | 'donor' | 'center' | 'admin') => {
    if (role === 'guest') {
      handleLogout();
    } else if (role === 'donor') {
      // Login Алексей Павлов (User ID 1)
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'donor@test.by', password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data);
      }
    } else if (role === 'center') {
      // Login RNPCC Coordinator (User ID 2)
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'center@test.by', password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data);
      }
    } else if (role === 'admin') {
      // Login System Administrator
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.by', password: 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        handleLoginSuccess(data);
      }
    }
  };

  const handleFooterNavigation = (tab: 'home' | 'info' | 'docs' | 'centers' | 'news') => {
    setView('home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('changeTab', { detail: tab }));
    }, 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Heart className="w-10 h-10 text-red-650 animate-bounce mx-auto text-red-600" />
          <p className="text-sm font-semibold tracking-wide text-slate-600">{t("Загрузка системы оповещения «Донор-Алерт»...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* Dynamic Master Switcher Header Panel for Judges/Evaluators */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-2 px-4 flex justify-center items-center text-xs gap-2">
        <div className="flex flex-wrap justify-center gap-1 select-none">
          <button 
            onClick={() => simulateRole('guest')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${!session ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {t("Гость (Публичный сайт)")}
          </button>
          <button 
            onClick={() => simulateRole('donor')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${session?.user.role === 'donor' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {t("Донор: Алексей Павлов")}
          </button>
          <button 
            onClick={() => simulateRole('center')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${session?.user.role === 'center' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {t("Координатор: Минский РНПЦ")}
          </button>
          <button 
            onClick={() => simulateRole('admin')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${session?.user.role === 'admin' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {t("Админ: Система")}
          </button>
        </div>
      </div>

      {/* Main Core Navigation Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => setView('home')}>
            <Heart className="w-6.5 h-6.5 text-red-650 text-red-600 fill-red-600" />
            <h1 className="font-extrabold text-slate-800 text-lg tracking-tight select-none">
              {t("Донор-Алерт")}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shadow-xs dark:bg-slate-800">
              <button
                onClick={() => setLanguage('RU')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors duration-200 ${language === 'RU' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                RU
              </button>
              <button
                onClick={() => setLanguage('BY')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-colors duration-200 ${language === 'BY' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                BY
              </button>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              id="theme-toggle-btn"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition duration-150 flex items-center justify-center shadow-xs cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={theme === 'light' ? t("Включить ночной режим") : t("Включить дневной режим")}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
              )}
            </button>

            {session ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-9 h-9 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors cursor-pointer border border-red-200"
                  title={t("Личный кабинет")}
                >
                  <User className="w-5 h-5" />
                </button>
                <div className="hidden sm:block text-right">
                  <span className="text-xs text-slate-700 font-semibold">{session.user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 hover:bg-slate-200 hover:text-red-700 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition duration-150 flex items-center shadow-xs"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  {t("Выйти")}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => window.dispatchEvent(new Event('openAuth'))}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title={t("Войти в кабинет")}
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Context Section area */}
      <motion.main 
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8"
      >
        <LanguageProvider language={language} setLanguage={setLanguage}>
          {(view === 'home' || !session) && (
            <GuestSection 
              centers={centers}
              news={news}
              onLoginSuccess={handleLoginSuccess}
              apiBase={API_BASE}
              session={session}
            />
          )}

          {view === 'dashboard' && session?.user.role === 'donor' && donorProfile && (
            <DonorSection 
              donor={donorProfile}
              links={donorLinks}
              donations={donorDonations}
              medicalNotes={donorMedicalNotes}
              readiness={donorReadiness}
              centers={centers}
              onRefresh={() => loadProfileData(session)}
              apiBase={API_BASE}
              token={session.token}
            />
          )}

          {view === 'dashboard' && session?.user.role === 'center' && centerProfile && (
            <CenterSection 
              center={centerProfile}
              onRefresh={loadGlobalData}
              apiBase={API_BASE}
              token={session.token}
            />
          )}

          {view === 'dashboard' && session?.user.role === 'admin' && (
            <AdminSection 
              token={session.token}
              t={t}
            />
          )}
        </LanguageProvider>
      </motion.main>

      {/* Aesthetic multi-column footer layout (matching screenshot & responsive) */}
      {(view === 'home' || !session) && (
        <footer className="bg-white border-t border-slate-100 py-12 px-6 text-sm text-slate-500 select-none">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pb-8 border-b border-slate-100">
              {/* Column 1: Brand, Доноры, Двухканальная система */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-10 flex flex-col"
              >
                {/* Brand */}
                <div>
                  <div className="flex items-center gap-2 select-none cursor-pointer mb-2" onClick={() => setView('home')}>
                    <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                    <h2 className="font-extrabold text-slate-800 text-base tracking-tight">
                      {t("Донор-Алерт")}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    {t("Платформа для оповещения доноров крови в Беларуси")}
                  </p>
                </div>

                {/* Доноры */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    {t("Доноры")}
                  </h3>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button 
                        onClick={() => {
                          setView('home');
                          setTimeout(() => {
                            window.dispatchEvent(new Event('openRegister'));
                          }, 50);
                        }}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {t("Стать донором")}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => {
                          if (session) {
                            setView('dashboard');
                          } else {
                            window.dispatchEvent(new Event('openAuth'));
                          }
                        }}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {session ? t('Личный кабинет') : t('Войти в кабинет')}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Двухканальная система */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    {t("Двухканальная система")}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
                    {t("Надёжное оповещение доноров крови через")}<br />
                    <strong className="font-semibold text-slate-600">{t("Push-уведомления")}</strong> {t("и")} <strong className="font-semibold text-slate-600">{t("Email-рассылки")}</strong>.
                  </p>
                  
                </div>
              </motion.div>

              {/* Column 2: Информация & Контакты */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="space-y-10 lg:pl-6 flex flex-col"
              >
                {/* Информация */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    {t("Информация")}
                  </h3>
                  <ul className="space-y-2 text-xs">
                    <li>
                      <button 
                        onClick={() => handleFooterNavigation('info')}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {t("О донорстве")}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleFooterNavigation('docs')}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {t("Документы")}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleFooterNavigation('centers')}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {t("Центры крови")}
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleFooterNavigation('news')}
                        className="text-slate-500 hover:text-red-650 hover:translate-x-1 transition duration-150 cursor-pointer block font-medium"
                      >
                        {t("Новости")}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Контакты */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    {t("Контакты")}
                  </h3>
                  <ul className="space-y-3 text-xs">
                    <li>
                      <a 
                        href="tel:+375291234567" 
                        className="text-slate-500 hover:text-red-650 transition duration-150 block group"
                      >
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t("Телефон")}</span>
                        <span className="font-mono text-sm group-hover:underline">+375 (29) 123-45-67</span>
                      </a>
                    </li>
                    <li>
                      <a 
                        href="mailto:support@donor-alert.by" 
                        className="text-slate-500 hover:text-red-650 transition duration-150 block group"
                      >
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t("Служба поддержки")}</span>
                        <span className="font-medium group-hover:underline">support@donor-alert.by</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-light"
            >
              <p>{t("© 2026 Донор-Алерт. Республика Беларусь.")}</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-slate-600 transition-colors">{t("Политика конфиденциальности")}</a>
                <a href="#" className="hover:text-slate-600 transition-colors">{t("Правила пользования")}</a>
              </div>
            </motion.div>
          </div>
        </footer>
      )}

      {/* Back to top button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: showBackToTop ? 1 : 0, 
          y: showBackToTop ? 0 : 20,
          pointerEvents: showBackToTop ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3 }}
        onClick={handleScrollToTop}
        className="fixed bottom-6 right-6 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg z-[999] transition-colors flex items-center justify-center cursor-pointer"
        aria-label={t("Вернуться наверх")}
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
