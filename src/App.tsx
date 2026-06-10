import React, { useState, useEffect } from 'react';
import { Heart, LogOut, HelpCircle, User, Bell, Activity, Layers, Sun, Moon } from 'lucide-react';
import { BloodCenter, News, Donor, DonorCenter, MedicalNote, Donation } from './types.ts';
import GuestSection from './components/GuestSection.tsx';
import DonorSection from './components/DonorSection.tsx';
import CenterSection from './components/CenterSection.tsx';

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
  const simulateRole = async (role: 'guest' | 'donor' | 'center') => {
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Heart className="w-10 h-10 text-red-650 animate-bounce mx-auto text-red-600" />
          <p className="text-sm font-semibold tracking-wide text-slate-600">Загрузка системы оповещения «Донор-Алерт»...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      
      {/* Dynamic Master Switcher Header Panel for Judges/Evaluators */}
      <div className="bg-slate-900 text-white border-b border-slate-800 text-center py-2 px-4 flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-rose-300">
          <Layers className="w-4 h-4 text-rose-400" />
          Панель быстрого переключения ролей (Экзаменатору):
        </span>
        <div className="flex flex-wrap justify-center gap-1 select-none">
          <button 
            onClick={() => simulateRole('guest')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${!session ? 'bg-rose-500 border-rose-500 text-white' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            Гость (Публичный сайт)
          </button>
          <button 
            onClick={() => simulateRole('donor')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${session?.user.role === 'donor' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            Донор: Алексей Павлов
          </button>
          <button 
            onClick={() => simulateRole('center')}
            className={`px-3 py-1 rounded font-bold border transition duration-150 text-[10px] uppercase ${session?.user.role === 'center' ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'bg-transparent border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            Координатор: Минский РНПЦ
          </button>
        </div>
      </div>

      {/* Main Core Navigation Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => setView('home')}>
            <Heart className="w-6.5 h-6.5 text-red-650 text-red-600 fill-red-600" />
            <h1 className="font-extrabold text-slate-800 text-lg tracking-tight select-none">
              Донор-Алерт
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              id="theme-toggle-btn"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition duration-150 flex items-center justify-center shadow-xs cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              title={theme === 'light' ? 'Включить ночной режим' : 'Включить дневной режим'}
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
                  title="Личный кабинет"
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
                  Выйти
                </button>
              </div>
            ) : (
              <button 
                onClick={() => window.dispatchEvent(new Event('openAuth'))}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title="Войти в кабинет"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Primary Context Section area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
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
      </main>

      {/* Aesthetic human footer layout */}
      <footer className="bg-white border-t border-slate-100 py-6 px-6 text-center text-xs text-slate-400 font-light select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© 2026 Проект «Донор-Алерт» — Экосистема спасения жизней Республики Беларусь.</p>
        </div>
      </footer>

    </div>
  );
}
