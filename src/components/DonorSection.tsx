import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Calendar, Award, ShieldAlert, Clock, AlertTriangle, 
  Settings, Check, Bell, RefreshCw, X, Plus, ExternalLink,
  Home, User, Link, Pause, MapPin, Download
} from 'lucide-react';
import { Donor, DonorCenter, Donation, MedicalNote, BloodCenter, formatBloodGroup, formatRhFactor, getGamificationStatus } from '../types';

interface DonorSectionProps {
  donor: Donor;
  links: DonorCenter[];
  donations: Donation[];
  medicalNotes: MedicalNote[];
  readiness: { ready: boolean; reason?: string };
  centers: BloodCenter[];
  onRefresh: () => void;
  apiBase: string;
  token: string;
}

export default function DonorSection({ donor, links, donations, medicalNotes, readiness, centers, onRefresh, apiBase, token }: DonorSectionProps) {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'profile' | 'history' | 'links' | 'pause' | 'notifications' | 'account'>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // Set local pause states
  const [pauseForm, setPauseForm] = useState({
    personalPause: donor.personalPause,
    personalPauseUntil: donor.personalPauseUntil || '',
    personalPauseNote: donor.personalPauseNote || ''
  });
  const [pauseSuccess, setPauseSuccess] = useState('');

  // Notifications toggles
  const [notifForm, setNotifForm] = useState({
    smsEnabled: donor.smsEnabled,
    pushEnabled: donor.pushEnabled,
    emailNotificationsEnabled: donor.emailNotificationsEnabled
  });
  const [notifSuccess, setNotifSuccess] = useState('');

  // Additional link center state
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const triggerRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Submit pause changes
  const handlePauseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPauseSuccess('');
    try {
      const res = await fetch(`${apiBase}/donor/pause`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          donorId: donor.id,
          ...pauseForm
        })
      });
      if (res.ok) {
        setPauseSuccess('Настройки личной паузы успешно сохранены!');
        onRefresh();
      }
    } catch {
      setPauseSuccess('Не удалось сохранить изменения во внешнем сервисе');
    }
  };

  // Submit notifications settings
  const handleNotifSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess('');
    try {
      const res = await fetch(`${apiBase}/donor/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          donorId: donor.id,
          ...notifForm
        })
      });
      if (res.ok) {
        setNotifSuccess('Предпочтения каналов рассылок изменены!');
        onRefresh();
      }
    } catch {
      setNotifSuccess('Ошибка сохранения настроек');
    }
  };

  // Resubmit a rejected center application
  const handleResubmit = async (centerId: number) => {
    try {
      const res = await fetch(`${apiBase}/donor/resubmit/${centerId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ donorId: donor.id })
      });
      if (res.ok) {
        alert('Заявка успешно переподана в центр крови! Статус изменен на Ожидание.');
        onRefresh();
      }
    } catch (err) {
      alert('Ошибка при повторной отправке');
    }
  };

  // Send secondary link application
  const handleCenterLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    if (!selectedCenterId) {
      setLinkError('Пожалуйста, укажите медицинский центр');
      return;
    }

    try {
      const res = await fetch(`${apiBase}/donor/link-center`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          donorId: donor.id,
          centerId: parseInt(selectedCenterId)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      setLinkSuccess(data.message || 'Связь успешно добавлена!');
      setSelectedCenterId('');
      onRefresh();
    } catch (err: any) {
      setLinkError(err.message || 'Ошибка связи');
    }
  };

  // Calculate stats
  const calcAge = (birthDateString: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const bCounts = donor.bloodDonationsCount || 0;
  const pCounts = donor.plasmaDonationsCount || 0;
  const plCounts = donor.plateletsDonationsCount || 0;
  const totalDonations = bCounts + pCounts + plCounts;

  const bloodFree = donor.bloodFreeCount || 0;
  const compFree = donor.compFreeCount || 0;
  const bloodPaid = donor.bloodPaidCount || 0;
  const compPaid = donor.compPaidCount || 0;

  const gameStatus = getGamificationStatus(bloodFree, compFree, bloodPaid, compPaid);
  const homeCenter = centers.find(c => {
    const primaryLink = links.find(l => l.donorId === donor.id && l.isPrimary);
    return c.id === primaryLink?.centerId;
  });

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
      {/* Side Profile Card & Inner Panel Menu */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative text-center">
          {/* Avatar simulation icon */}
          <div className="w-20 h-20 bg-red-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4 tracking-tight shadow-sm select-none">
            {donor.firstName[0]}{donor.lastName[0]}
          </div>
          <h2 className="font-bold text-slate-800 text-lg leading-tight tracking-tight">
            {donor.lastName} {donor.firstName}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Донор с {new Date(donor.createdAt).toLocaleDateString('ru-RU')}</p>

          <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatBloodGroup(donor.bloodGroup)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">Группа</span>
            </div>
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatRhFactor(donor.rhFactor)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">Резус</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Вес:</span>
              <span className="text-slate-700 font-medium">{donor.weight || '—'} кг</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Возраст:</span>
              <span className="text-slate-700 font-medium">{calcAge(donor.birthDate)} лет</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Донаций:</span>
              <span className="text-slate-700 font-medium">{totalDonations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Статус:</span>
              <span className={readiness.ready ? 'text-emerald-500 font-bold' : 'text-red-600 font-bold'}>{readiness.ready ? 'Готов к сдаче' : 'Отвод'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1">
          {[
            { id: 'dashboard', label: 'Рабочий стол', icon: Home },
            { id: 'profile', label: 'Профиль', icon: User },
            { id: 'history', label: 'История сдач', icon: Calendar },
            { id: 'links', label: 'Мои центры', icon: Link },
            { id: 'pause', label: 'Пауза', icon: Pause },
            { id: 'notifications', label: 'Уведомления', icon: Bell },
            { id: 'account', label: 'Аккаунт', icon: Settings }
          ].map(it => {
            const Icon = it.icon;
            const isActive = activeMenu === it.id;
            return (
              <button
                key={it.id}
                onClick={() => { setActiveMenu(it.id as any); }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 ${isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-500 font-bold hover:bg-slate-50'}`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span className="text-sm leading-none">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-3">
        <AnimatePresence mode="wait">
          {/* Profile Details Page */}
          {activeMenu === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">Личная информация</h3>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4" /> {/* Or Edit icon, but using user/edit for simplicity */}
                  Редактировать
                </button>
              </div>

              <div className="divide-y divide-slate-100/80 text-sm">
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">ФИО</span>
                  <span className="font-bold text-slate-800 text-right">{donor.lastName} {donor.firstName} {donor.middleName}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Дата рождения</span>
                  <span className="font-bold text-slate-800 text-right">{new Date(donor.birthDate).toLocaleDateString('ru-RU')} ({calcAge(donor.birthDate)} лет)</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Пол</span>
                  <span className="font-bold text-slate-800 text-right">{donor.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Телефон</span>
                  <span className="font-bold text-slate-800 text-right">{donor.phone}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">E-mail</span>
                  <span className="font-bold text-slate-800 text-right">{donor.email}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Вес</span>
                  <span className="font-bold text-slate-800 text-right">{donor.weight} кг</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Группа / Резус</span>
                  <div className="flex gap-2">
                    <span className="bg-slate-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs">{formatBloodGroup(donor.bloodGroup)}</span>
                    <span className="text-slate-800 font-bold px-1 py-1 text-sm">{formatRhFactor(donor.rhFactor)}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Всего донаций</span>
                  <span className="font-bold text-slate-800 text-right">{totalDonations}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Донации крови</span>
                  <span className="font-bold text-slate-800 text-right">{bCounts}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Последняя сдача</span>
                  <span className="font-bold text-slate-800 text-right">
                    {donations.length > 0 ? new Date(Math.max(...donations.map(d => new Date(d.donationDate || d.date).getTime()))).toLocaleDateString('ru-RU') : 'Нет данных'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">В системе с</span>
                  <span className="font-bold text-slate-800 text-right">{new Date(donor.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dashboard Menu Section */}
        {activeMenu === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            
            {/* Stats 4-Grid matching the screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-center">
                <span className="text-3xl font-bold text-red-600 leading-none mb-1">{totalDonations}</span>
                <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">всего донаций</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-center">
                <span className="text-3xl font-bold text-emerald-500 leading-none mb-1">{bCounts}</span>
                <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">цельная кровь</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-center overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500 leading-none mb-1 tracking-tight">
                  {donations.length > 0 ? new Date(Math.max(...donations.map(d => new Date(d.donationDate || d.date).getTime()))).toLocaleDateString('ru-RU') : '—'}
                </span>
                <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">последняя сдача</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-center overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500 leading-none mb-1 font-sans tracking-tight">
                  {readiness.ready ? '✓' : (donor.nextAvailableDate ? new Date(donor.nextAvailableDate).toLocaleDateString('ru-RU') : '—')}
                </span>
                <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">следующая дата</span>
              </div>
            </div>

            {/* Gamification progress card */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Донорский ранг</h3>
                  <p className="text-sm text-slate-500 font-medium">Прогресс и доступные льготы</p>
                </div>
                <span className={`px-5 py-2 rounded-full text-[12px] font-bold border shadow-sm ${gameStatus.color}`}>
                  {gameStatus.title}
                </span>
              </div>

              {/* Progress bar estimation slider */}
              {gameStatus.currentPoints < gameStatus.nextAt && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-slate-800">До следующего ранга (баллы)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-500 leading-none">{gameStatus.currentPoints} / {gameStatus.nextAt}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-650 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(gameStatus.currentPoints / gameStatus.nextAt) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">1 балл = Компонент (возм); 2 балла = Кровь (возм) или Компонент (безвозм); 4 балла = Кровь (безвозм)</p>
                </div>
              )}

              {/* Real benefits info alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-700/20">
                  <h4 className="text-sm md:text-base font-bold text-blue-600 mb-2">✓ 100% больничный</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold">
                    4+ донации в год → листок нетрудоспособности из расчета 100%
                  </p>
                </div>

                <div className="bg-slate-100 p-5 rounded-xl border border-slate-200">
                  <h4 className="text-sm md:text-base font-bold text-slate-800 mb-2">«Ганаровы донар»</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold mb-4">
                    20+ безвозмездных сдач крови (или эквивалент) → знак отличия
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-600 font-medium">Прогресс (баллы)</span>
                      <span className="text-xs font-bold text-slate-800">{gameStatus.currentPoints}/80</span>
                    </div>
                    <div className="w-full bg-slate-300 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-650 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (gameStatus.currentPoints / 80) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next available dates per donation type in RBP */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">График восстановления</h3>
                <p className="text-sm text-slate-500 font-medium">Рекомендованные даты по нормативам Минздрава РБ</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Цельная кровь', date: donor.nextAvailableDate, interval: '60-90 дней', active: true },
                  { label: 'Плазма', date: donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null, interval: '14 дней', active: false },
                  { label: 'Тромбоциты', date: donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null, interval: '14 дней', active: false },
                ].map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all ${item.active ? 'bg-slate-100 border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <span className={`text-[10px] uppercase font-bold block mb-2 tracking-[0.15em] ${item.active ? 'text-red-600' : 'text-slate-400'}`}>{item.label}</span>
                    <span className="font-mono text-[16px] font-bold text-slate-800 block mb-1">{item.date ? new Date(item.date).toLocaleDateString('ru-RU') : 'Доступно'}</span>
                    <span className={`text-[11px] font-bold ${item.active ? 'text-red-600/60' : 'text-slate-400/80'}`}>{item.interval}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of active medical notes (медотводы) if any */}
            {medicalNotes.some(m => m.isActive) && (
              <div className="bg-red-50 p-6 md:p-8 rounded-2xl border border-red-200/60 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-800 text-lg tracking-tight">Важные ограничения</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {medicalNotes.filter(m => m.isActive).map(note => (
                    <div key={note.id} className="p-5 bg-white border border-red-200/50 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-red-700 tracking-widest block">Медотвод</span>
                        <p className="text-sm text-slate-800 font-bold leading-tight">{note.reason}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-xs text-red-700 font-bold flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          До {note.endDate ? new Date(note.endDate).toLocaleDateString('ru-RU') : 'бессрочно'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Donations history view */}
        {activeMenu === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">История донаций</h3>
                <p className="text-sm text-slate-500 mt-1">Все зарегистрированные процедуры</p>
              </div>
              <span className="bg-slate-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs">
                {donations.length} записей
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-5 py-4 font-bold">Дата</th>
                    <th className="px-5 py-4 font-bold">Тип</th>
                    <th className="px-5 py-4 font-bold">Центр</th>
                    <th className="px-5 py-4 font-bold">Объём</th>
                    <th className="px-5 py-4 font-bold">Примечание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                  {donations.map(don => {
                    const center = centers.find(c => c.id === don.centerId);
                    const donType = don.donationType || don.type;
                    const typeLabel = donType === 'blood' ? 'Цельная кровь' : donType === 'plasma' ? 'Плазма' : 'Тромбоциты';
                    const paidLabel = don.isPaid ? 'возмездно' : 'безвозмездно';
                    const volume = don.volumeMl || don.volume || '—';
                    return (
                      <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-700">{new Date(don.donationDate || don.date!).toLocaleDateString('ru-RU')}</td>
                        <td className="px-5 py-4">
                          <span className="bg-red-50 text-red-500 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100/50 inline-block">
                            {typeLabel} ({paidLabel})
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-600">{center?.shortName || center?.name || 'Центр крови'}</td>
                        <td className="px-5 py-4 font-bold text-red-600">{volume} мл</td>
                        <td className="px-5 py-4 text-xs text-slate-400 italic max-w-[200px] truncate" title={don.note || ''}>{don.note || '—'}</td>
                      </tr>
                    );
                  })}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic">
                        У вас пока нет зарегистрированных донаций.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </motion.div>
        )}

        {/* Change personal pause settings */}
        {activeMenu === 'pause' && (
          <motion.div 
            key="pause"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm max-w-xl space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">Личная пауза</h3>
                <p className="text-sm text-slate-500 mt-1">Временно исключает вас из всех рассылок. Никто не потревожит.</p>
              </div>

              {pauseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 font-medium">
                  {pauseSuccess}
                </div>
              )}

              <form onSubmit={handlePauseSubmit} className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-sm md:text-base font-bold text-red-600">Включить паузу</h4>
                    <p className="text-xs md:text-sm text-slate-500">Вы исчезнете из фильтров рассылки</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={pauseForm.personalPause} 
                      onChange={(e) => setPauseForm({...pauseForm, personalPause: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                {pauseForm.personalPause && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">Действует до (дата):</label>
                      <input 
                        type="date"
                        value={pauseForm.personalPauseUntil}
                        onChange={(e) => setPauseForm({ ...pauseForm, personalPauseUntil: e.target.value })}
                        className="w-full px-4 py-3 text-sm md:text-base border border-slate-200 rounded-lg focus:border-red-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 block font-medium">*Если оставить пустым, пауза будет считаться бессрочной</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">Причина (только для вас):</label>
                      <textarea 
                        value={pauseForm.personalPauseNote}
                        onChange={(e) => setPauseForm({ ...pauseForm, personalPauseNote: e.target.value })}
                        placeholder="Командировка, личные обстоятельства..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm md:text-base border border-slate-200 rounded-lg focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white text-sm md:text-base font-bold px-8 py-3 rounded-lg transition duration-150 shadow-sm flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Association Link ties page */}
        {activeMenu === 'links' && (
          <motion.div 
            key="links"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Мои центры переливания</h3>
                  <p className="text-sm text-slate-500 font-medium">Станции, к которым вы привязаны в системе</p>
                </div>
                <button 
                  onClick={() => { const el = document.getElementById('link-form'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start"
                >
                  <Plus className="w-4 h-4" /> Добавить центр
                </button>
              </div>

              <div className="space-y-5">
                {links.map(link => {
                  const center = centers.find(c => c.id === link.centerId);
                  const isConfirmed = link.status === 'confirmed';
                  return (
                    <div key={link.id} className={`p-6 rounded-2xl border transition-all duration-300 ${link.isPrimary ? 'bg-slate-100 border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100/80 hover:border-slate-300'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-base font-bold text-slate-800 tracking-tight">{center ? center.name : `Центр #${link.centerId}`}</h4>
                            {link.isPrimary && (
                              <span className="text-[9px] bg-red-600 text-white font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">домашний</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium bg-white/50 w-fit px-3 py-1 rounded-lg border border-white/50">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {center?.address}
                          </div>
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {isConfirmed ? `Подтверждён: ${new Date(link.updatedAt).toLocaleDateString('ru-RU')}` : `Подан: ${new Date(link.createdAt).toLocaleDateString('ru-RU')}`}
                          </div>
                        </div>

                        <div className="self-end sm:self-start">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${isConfirmed ? 'bg-white text-emerald-500 border-emerald-500/30 shadow-sm' : link.status === 'pending' ? 'bg-white text-amber-600 border-amber-600/30' : 'bg-white text-red-600 border-red-600/30 shadow-sm'}`}>
                            {isConfirmed && <Check className="w-4 h-4 stroke-[3px]" />}
                            {link.status === 'confirmed' ? 'Подтверждён' : link.status === 'pending' ? 'На модерации' : 'Отклонено'}
                          </div>
                        </div>
                      </div>
                      
                      {link.status === 'rejected' && link.rejectionReason && (
                        <div className="p-5 bg-red-50/50 text-red-900 border border-red-100 rounded-2xl text-xs md:text-sm mt-5 leading-relaxed font-medium shadow-inner">
                          <div className="flex gap-3">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                            <p><strong>Причина отклонения:</strong> {link.rejectionReason}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-red-100 flex justify-end">
                            <button 
                              onClick={() => handleResubmit(link.centerId)}
                              className="text-xs md:text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-2"
                            >
                              Отправить анкету повторно <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Request link form */}
            <div id="link-form" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8 max-w-2xl">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Привязать новый центр</h3>
                <p className="text-sm text-slate-500 font-medium">Станьте донором в другом учреждении</p>
              </div>

              {linkError && <p className="text-xs md:text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 font-medium leading-relaxed">{linkError}</p>}
              {linkSuccess && <p className="text-xs md:text-sm text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-medium leading-relaxed">{linkSuccess}</p>}

              <form onSubmit={handleCenterLink} className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Выберите учреждение:</label>
                  <select 
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-5 py-4 text-sm md:text-base border border-slate-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-50 transition-all focus:outline-none bg-slate-50/50 font-bold text-slate-700 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value=""> Список центров переливания </option>
                    {centers.map(center => {
                      if (links.some(l => l.centerId === center.id)) return null;
                      return <option key={center.id} value={center.id}>{center.name}</option>;
                    })}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm md:text-base px-10 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
                >
                  <Plus className="w-5 h-5" /> Отправить анкету
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Channels adjusters toggle page */}
        {activeMenu === 'notifications' && (
          <motion.div 
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Настройки оповещений</h3>
                <p className="text-sm text-slate-500 font-medium">Выберите удобные каналы связи для вызова на донацию</p>
              </div>

              {notifSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs md:text-sm text-emerald-700 font-bold flex items-center gap-3">
                  <Check className="w-4 h-4" />
                  {notifSuccess}
                </div>
              )}

              <form onSubmit={handleNotifSubmit} className="space-y-8">
                <div className="space-y-4">
                  {[
                    { id: 'push', title: 'Push-уведомления', desc: 'Всплывающие окна в браузере или приложении', enabled: notifForm.pushEnabled, toggle: (val: boolean) => setNotifForm({...notifForm, pushEnabled: val}) },
                    { id: 'sms', title: 'SMS-оповещения', desc: `Экстренные сообщения на номер ${donor.phone}`, enabled: notifForm.smsEnabled, toggle: (val: boolean) => setNotifForm({...notifForm, smsEnabled: val}) },
                    { id: 'email', title: 'Email-рассылки', desc: 'Письма с приглашениями и результатами анализов', enabled: notifForm.emailNotificationsEnabled, toggle: (val: boolean) => setNotifForm({...notifForm, emailNotificationsEnabled: val}) }
                  ].map((notif, idx) => (
                    <div key={notif.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 transition-hover hover:border-slate-200">
                      <div className="space-y-1 pr-4">
                        <h4 className="text-sm md:text-base font-bold text-red-600 tracking-tight">{notif.title}</h4>
                        <p className="text-xs md:text-sm text-slate-500 font-medium leading-tight">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={notif.enabled} onChange={(e) => notif.toggle(e.target.checked)} />
                        <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white text-sm md:text-base font-bold px-10 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2.5"
                  >
                    <Check className="w-[1.2rem] h-[1.2rem] stroke-[3px]" />
                    Обновить настройки
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Account Menu Section */}
        {activeMenu === 'account' && (
          <motion.div 
            key="account"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Безопасность аккаунта</h3>
                <p className="text-sm text-slate-500 font-medium">Управление доступом и паролями</p>
              </div>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Функция изменения пароля в демо-режиме!"); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Текущий пароль</label>
                    <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                  <div className="hidden md:block"></div>
                  <div className="space-y-2.5">
                    <label className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Новый пароль</label>
                    <input type="password" required placeholder="Минимум 8 символов" className="w-full px-5 py-4 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Повторите пароль</label>
                    <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 text-sm md:text-base bg-slate-50 border border-slate-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3">
                    <Check className="w-[1.2rem] h-[1.2rem] stroke-[3px]" />
                    Обновить пароль
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Установка приложения (PWA)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> iPhone / Safari
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Нажмите иконку <span className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-block font-bold">«Поделиться»</span>, затем выберите пункт <span className="text-slate-800 font-bold">«На экран Домой»</span> и нажмите <span className="text-red-600 font-bold">«Добавить»</span>.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Android / Chrome
                  </h4>
                  <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">Нажмите на значок <span className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-block font-bold">⋮</span> в строке браузера, выберите <span className="text-slate-800 font-bold">«Установить приложение»</span> или <span className="text-red-600 font-bold">«На главный экран»</span>.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
