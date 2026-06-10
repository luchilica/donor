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

  const gameStatus = getGamificationStatus(donor.bloodDonationsCount);
  const homeCenter = centers.find(c => {
    const primaryLink = links.find(l => l.donorId === donor.id && l.isPrimary);
    return c.id === primaryLink?.centerId;
  });

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Side Profile Card & Inner Panel Menu */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm relative text-center">
          {/* Avatar simulation icon */}
          <div className="w-[5rem] h-[5rem] bg-[#c23e2b] text-white rounded-[1.25rem] flex items-center justify-center font-extrabold text-[1.8rem] mx-auto mb-5 tracking-tight shadow-[0_8px_20px_rgba(194,62,43,0.15)] select-none">
            {donor.firstName[0]}{donor.lastName[0]}
          </div>
          <h2 className="font-extrabold text-slate-800 text-[1.2rem] leading-tight mb-1 tracking-tight">
            {donor.lastName} {donor.firstName}
          </h2>
          <p className="text-[13px] text-slate-400 font-medium">Статус: <span className={readiness.ready ? 'text-[#10b981]' : 'text-[#c23e2b]'}>{readiness.ready ? 'Активен' : 'Отвод'}</span></p>

          <div className="grid grid-cols-2 gap-3.5 mt-6 mb-2">
            <div className="bg-[#f8fafc] border border-slate-100 py-4 rounded-[1rem] flex flex-col items-center justify-center transition-colors hover:bg-[#f1f5f9]">
              <span className="font-extrabold text-[#c23e2b] text-[1.4rem] tracking-tighter leading-none">{formatBloodGroup(donor.bloodGroup)}</span>
              <span className="text-slate-400 text-[10px] font-extrabold uppercase mt-2 tracking-widest leading-none">Группа</span>
            </div>
            <div className="bg-[#f8fafc] border border-slate-100 py-4 rounded-[1rem] flex flex-col items-center justify-center transition-colors hover:bg-[#f1f5f9]">
              <span className="font-extrabold text-[#c23e2b] text-[1.4rem] tracking-tighter leading-none">{formatRhFactor(donor.rhFactor)}</span>
              <span className="text-slate-400 text-[10px] font-extrabold uppercase mt-2 tracking-widest leading-none">Резус</span>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-left text-[14px] border-t border-slate-50 pt-6">
            <div className="flex justify-between items-center group">
              <span className="font-bold text-[#64748b] group-hover:text-slate-800 transition-colors">Вес</span>
              <span className="font-extrabold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg">{donor.weight || 0} кг</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-bold text-[#64748b] group-hover:text-slate-800 transition-colors">Возраст</span>
              <span className="font-extrabold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg">{calcAge(donor.birthDate)} лет</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="font-bold text-[#64748b] group-hover:text-slate-800 transition-colors">Донаций</span>
              <span className="font-extrabold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg">{donor.bloodDonationsCount + donor.plasmaDonationsCount + donor.plateletsDonationsCount}</span>
            </div>
          </div>
        </div>

        {/* Vertical menu navigation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-1.5">
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
                className={`w-full flex items-center px-4 py-3 rounded-[0.85rem] text-left transition duration-150 ${isActive ? 'bg-[#fdf1f0] text-[#c23e2b] font-extrabold' : 'text-[#475569] font-bold hover:bg-slate-50'}`}
              >
                <Icon className={`w-[1.1rem] h-[1.1rem] mr-3 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span className="text-[14.5px] leading-none">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Context panels dynamically switched */}
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
            <div className="bg-white p-6 md:p-8 rounded-[1.25rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Личная информация</h3>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-[0.85rem] hover:bg-slate-50 transition-colors">
                  <User className="w-4 h-4" /> {/* Or Edit icon, but using user/edit for simplicity */}
                  Редактировать
                </button>
              </div>

              <div className="divide-y divide-slate-100/80 text-[14px]">
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
                    <span className="bg-[#fdf1f0] text-[#c23e2b] font-bold px-3 py-1 rounded-full text-xs">{formatBloodGroup(donor.bloodGroup)}</span>
                    <span className="text-slate-800 font-bold px-1 py-1 text-sm">{formatRhFactor(donor.rhFactor)}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Всего донаций</span>
                  <span className="font-bold text-slate-800 text-right">{donor.bloodDonationsCount + donor.plasmaDonationsCount + donor.plateletsDonationsCount}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Донации крови</span>
                  <span className="font-bold text-slate-800 text-right">{donor.bloodDonationsCount}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                  <span className="text-slate-500 font-medium">Последняя сдача</span>
                  <span className="font-bold text-slate-800 text-right">
                    {donations.length > 0 ? new Date(Math.max(...donations.map(d => new Date(d.date).getTime()))).toLocaleDateString('ru-RU') : 'Нет данных'}
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
            
            {/* Health readiness badge indicator */}
            <div className={`p-6 md:p-8 rounded-[1.5rem] border flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-500 ${readiness.ready ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-[#fff7ed] border-[#fed7aa]'}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${readiness.ready ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-[#f59e0b]'}`}></span>
                  <span className="uppercase text-[10px] tracking-[0.15em] font-extrabold text-slate-400 block">Статус готовности</span>
                </div>
                <h3 className={`font-extrabold text-xl md:text-2xl tracking-tight leading-tight ${readiness.ready ? 'text-[#064e3b]' : 'text-[#7c2d12]'}`}>
                  {readiness.ready ? 'Вы готовы к сдаче крови' : 'Временное отстранение'}
                </h3>
                {readiness.ready ? (
                  <p className="text-[14px] font-medium text-[#059669]/80 max-w-md">Все показатели в норме. Вы можете записаться на процедуру в ваш центр.</p>
                ) : (
                  <p className="text-[14px] font-medium text-[#c2410c] max-w-md">
                    <strong className="font-extrabold">Причина:</strong> {readiness.reason}
                  </p>
                )}
              </div>
              {readiness.ready && (
                <button 
                  onClick={() => alert(`Ваш домашний центр: ${homeCenter?.name || 'не привязан'}. Пожалуйста, позвоните по номеру ${homeCenter?.phone || donor.phone} и запишитесь на удобный день!`)}
                  className="bg-[#10b981] hover:bg-[#059669] hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-[14px] px-7 py-3.5 rounded-[1rem] transition-all duration-200 inline-flex items-center shadow-[0_4px_12px_rgba(16,185,129,0.2)] shrink-0"
                >
                  <Calendar className="w-[1.1rem] h-[1.1rem] mr-2.5" />
                  Записаться на сдачу
                </button>
              )}
            </div>

            {/* Gamification progress card */}
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Прогресс донорства</h3>
                  <p className="text-[14px] text-slate-500 font-medium">Ваш текущий ранг и путь к следующему уровню</p>
                </div>
                <span className={`px-5 py-2 rounded-full text-[11px] font-extrabold border uppercase tracking-[0.1em] shadow-sm ${gameStatus.color}`}>
                  {gameStatus.title}
                </span>
              </div>

              {/* Progress bar estimation slider */}
              {donor.bloodDonationsCount < gameStatus.nextAt && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">До цели осталось: {gameStatus.nextAt - donor.bloodDonationsCount}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[1.5rem] font-extrabold text-slate-800 leading-none">{donor.bloodDonationsCount}</span>
                      <span className="text-slate-400 text-sm font-bold ml-1">/ {gameStatus.nextAt}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-50 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-100">
                    <div 
                      className="bg-gradient-to-r from-[#c23e2b] to-[#e11d48] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(194,62,43,0.3)]"
                      style={{ width: `${(donor.bloodDonationsCount / gameStatus.nextAt) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-[#f8fafc] rounded-[1rem] border border-slate-100/50">
                    <AlertTriangle className="w-4 h-4 text-[#c23e2b] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wide">
                      В зачете только донации цельной крови. Официальные звания присваиваются Министерством Здравоохранения при достижении 20+ кроводач.
                    </p>
                  </div>
                </div>
              )}

              {/* Real benefits info alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="group bg-[#f0f9ff] p-6 rounded-[1.25rem] border border-[#bae6fd] transition-all hover:shadow-md hover:scale-[1.01]">
                  <Award className="w-6 h-6 text-[#0369a1] mb-3 transition-transform group-hover:scale-110" />
                  <h4 className="text-[15px] font-extrabold text-[#0c4a6e] mb-1.5">Больничный (100%):</h4>
                  <p className="text-[13px] font-medium text-[#075985] leading-relaxed">
                    {donor.bloodDonationsCount >= 4 ? (
                      <span className="text-[#059669] font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 stroke-[3px]" /> Льгота активирована
                      </span>
                    ) : (
                      `Необходимо еще ${Math.max(0, 4 - donor.bloodDonationsCount)} донации для оплаты в размере 100% среднего заработка.`
                    )}
                  </p>
                </div>

                <div className="group bg-[#fdf2f2] p-6 rounded-[1.25rem] border border-[#fecaca] transition-all hover:shadow-md hover:scale-[1.01]">
                  <Heart className="w-6 h-6 text-[#c23e2b] mb-3 transition-transform group-hover:scale-110" />
                  <h4 className="text-[15px] font-extrabold text-[#7f1d1d] mb-1.5">Почетный донор:</h4>
                  <p className="text-[13px] font-medium text-[#991b1b] leading-relaxed">
                    {donor.bloodDonationsCount >= 20 ? (
                      <span className="text-[#c23e2b] font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 stroke-[3px]" /> Звание подтверждено
                      </span>
                    ) : (
                      `До звания осталось ${20 - donor.bloodDonationsCount} кроводач. Дает право на ежегодные выплаты и льготный проезд.`
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Next available dates per donation type in RBP */}
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">График восстановления</h3>
                <p className="text-[14px] text-slate-500 font-medium">Рекомендованные даты по нормативам Минздрава РБ</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Цельная кровь', date: donor.nextAvailableDate, interval: '60-90 дней', active: true },
                  { label: 'Плазма', date: donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null, interval: '14 дней', active: false },
                  { label: 'Тромбоциты', date: donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null, interval: '14 дней', active: false },
                ].map((item, idx) => (
                  <div key={idx} className={`p-5 rounded-[1.25rem] border transition-all ${item.active ? 'bg-[#fdf1f0] border-[#fbd5d1] shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                    <span className={`text-[10px] uppercase font-extrabold block mb-2 tracking-[0.15em] ${item.active ? 'text-[#c23e2b]' : 'text-slate-400'}`}>{item.label}</span>
                    <span className="font-mono text-[16px] font-extrabold text-slate-800 block mb-1">{item.date ? new Date(item.date).toLocaleDateString('ru-RU') : 'Доступно'}</span>
                    <span className={`text-[11px] font-bold ${item.active ? 'text-[#c23e2b]/60' : 'text-slate-400/80'}`}>{item.interval}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of active medical notes (медотводы) if any */}
            {medicalNotes.some(m => m.isActive) && (
              <div className="bg-[#fef2f2] p-6 md:p-8 rounded-[1.5rem] border border-[#fecaca]/60 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-6 h-6 text-[#dc2626]" />
                  </div>
                  <h4 className="font-extrabold text-[#991b1b] text-lg tracking-tight">Важные ограничения</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {medicalNotes.filter(m => m.isActive).map(note => (
                    <div key={note.id} className="p-5 bg-white border border-[#fecaca]/50 rounded-[1.25rem] shadow-sm flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-extrabold text-[#b91c1c] tracking-widest block">Медотвод</span>
                        <p className="text-[14px] text-slate-800 font-bold leading-tight">{note.reason}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50">
                        <p className="text-[12px] text-[#b91c1c] font-extrabold flex items-center gap-2">
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
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">История донаций</h3>
                <p className="text-[14px] text-slate-500 mt-1">Все зарегистрированные процедуры</p>
              </div>
              <span className="bg-[#fdf1f0] text-[#c23e2b] font-bold px-3 py-1 rounded-full text-xs">
                {donations.length} записей
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-[1rem]">
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-5 py-4 font-extrabold">Дата</th>
                    <th className="px-5 py-4 font-extrabold">Тип</th>
                    <th className="px-5 py-4 font-extrabold">Центр</th>
                    <th className="px-5 py-4 font-extrabold">Объём</th>
                    <th className="px-5 py-4 font-extrabold">Примечание</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                  {donations.map(don => {
                    const center = centers.find(c => c.id === don.centerId);
                    return (
                      <tr key={don.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-700">{new Date(don.date).toLocaleDateString('ru-RU')}</td>
                        <td className="px-5 py-4">
                          <span className="bg-[#fef2f2] text-[#ef4444] px-2.5 py-1 rounded-full text-xs font-bold border border-red-100/50">
                            {don.type === 'blood' ? 'Цельная кровь' : don.type === 'plasma' ? 'Плазма' : 'Тромбоциты'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-600">{center?.shortName || 'Центр крови'}</td>
                        <td className="px-5 py-4 font-bold text-[#c23e2b]">{don.volume} мл</td>
                        <td className="px-5 py-4 text-xs text-slate-400 italic max-w-[200px] truncate">{don.note || '—'}</td>
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
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm max-w-xl space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Личная пауза</h3>
                <p className="text-[14px] text-slate-500 mt-1">Временно исключает вас из всех рассылок. Никто не потревожит.</p>
              </div>

              {pauseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-[0.85rem] text-sm text-emerald-700 font-medium">
                  {pauseSuccess}
                </div>
              )}

              <form onSubmit={handlePauseSubmit} className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-[15px] font-bold text-[#c23e2b]">Включить паузу</h4>
                    <p className="text-[13px] text-slate-500">Вы исчезнете из фильтров рассылки</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={pauseForm.personalPause} 
                      onChange={(e) => setPauseForm({...pauseForm, personalPause: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c23e2b]"></div>
                  </label>
                </div>

                {pauseForm.personalPause && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[14px] font-bold text-slate-800">Действует до (дата):</label>
                      <input 
                        type="date"
                        value={pauseForm.personalPauseUntil}
                        onChange={(e) => setPauseForm({ ...pauseForm, personalPauseUntil: e.target.value })}
                        className="w-full px-4 py-3 text-[15px] border border-slate-200 rounded-[0.85rem] focus:border-[#c23e2b] focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 block font-medium">*Если оставить пустым, пауза будет считаться бессрочной</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[14px] font-bold text-slate-800">Причина (только для вас):</label>
                      <textarea 
                        value={pauseForm.personalPauseNote}
                        onChange={(e) => setPauseForm({ ...pauseForm, personalPauseNote: e.target.value })}
                        placeholder="Командировка, личные обстоятельства..."
                        rows={3}
                        className="w-full px-4 py-3 text-[15px] border border-slate-200 rounded-[0.85rem] focus:border-[#c23e2b] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button 
                    type="submit"
                    className="bg-[#c23e2b] hover:bg-[#a83321] text-white text-[15px] font-bold px-8 py-3 rounded-[0.85rem] transition duration-150 shadow-sm flex items-center gap-2"
                  >
                    <Check className="w-[1.1rem] h-[1.1rem]" />
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
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Мои центры переливания</h3>
                  <p className="text-[14px] text-slate-500 font-medium">Станции, к которым вы привязаны в системе</p>
                </div>
                <button 
                  onClick={() => { const el = document.getElementById('link-form'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="bg-[#c23e2b] hover:bg-[#a83321] text-white font-bold text-[14px] px-6 py-3 rounded-[1rem] transition-all shadow-[0_4px_12px_rgba(194,62,43,0.15)] flex items-center gap-2 self-start"
                >
                  <Plus className="w-4 h-4" /> Добавить центр
                </button>
              </div>

              <div className="space-y-5">
                {links.map(link => {
                  const center = centers.find(c => c.id === link.centerId);
                  const isConfirmed = link.status === 'confirmed';
                  return (
                    <div key={link.id} className={`p-6 rounded-[1.5rem] border transition-all duration-300 ${link.isPrimary ? 'bg-[#fdf1f0] border-[#fbd5d1] shadow-sm' : 'bg-[#f8fafc] border-slate-100/80 hover:border-slate-300'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-5">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 text-[17px] tracking-tight">{center ? center.name : `Центр #${link.centerId}`}</h4>
                            {link.isPrimary && (
                              <span className="text-[9px] bg-[#c23e2b] text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">домашний</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium bg-white/50 w-fit px-3 py-1 rounded-lg border border-white/50">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {center?.address}
                          </div>
                          <div className="text-[11px] text-slate-400 font-extrabold uppercase tracking-[0.1em] mt-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {isConfirmed ? `Подтверждён: ${new Date(link.updatedAt).toLocaleDateString('ru-RU')}` : `Подан: ${new Date(link.createdAt).toLocaleDateString('ru-RU')}`}
                          </div>
                        </div>

                        <div className="self-end sm:self-start">
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-extrabold border transition-colors ${isConfirmed ? 'bg-white text-[#10b981] border-[#10b981]/30 shadow-sm' : link.status === 'pending' ? 'bg-white text-amber-600 border-amber-600/30' : 'bg-white text-red-600 border-red-600/30 shadow-sm'}`}>
                            {isConfirmed && <Check className="w-4 h-4 stroke-[3px]" />}
                            {link.status === 'confirmed' ? 'Подтверждён' : link.status === 'pending' ? 'На модерации' : 'Отклонено'}
                          </div>
                        </div>
                      </div>
                      
                      {link.status === 'rejected' && link.rejectionReason && (
                        <div className="p-5 bg-red-50/50 text-red-900 border border-red-100 rounded-[1.25rem] text-[13px] mt-5 leading-relaxed font-medium shadow-inner">
                          <div className="flex gap-3">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                            <p><strong>Причина отклонения:</strong> {link.rejectionReason}</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-red-100 flex justify-end">
                            <button 
                              onClick={() => handleResubmit(link.centerId)}
                              className="text-[13px] font-extrabold text-[#c23e2b] hover:text-[#a83321] transition-colors flex items-center gap-2"
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
            <div id="link-form" className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8 max-w-2xl">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Привязать новый центр</h3>
                <p className="text-[14px] text-slate-500 font-medium">Станьте донором в другом учреждении</p>
              </div>

              {linkError && <p className="text-[13px] text-red-600 bg-red-50 p-4 rounded-[1rem] border border-red-100 font-medium leading-relaxed">{linkError}</p>}
              {linkSuccess && <p className="text-[13px] text-emerald-700 bg-emerald-50 p-4 rounded-[1rem] border border-emerald-100 font-medium leading-relaxed">{linkSuccess}</p>}

              <form onSubmit={handleCenterLink} className="space-y-6">
                <div className="space-y-2.5">
                  <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Выберите учреждение:</label>
                  <select 
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-5 py-4 text-[15px] border border-slate-200 rounded-[1rem] focus:border-[#c23e2b] focus:ring-4 focus:ring-red-50 transition-all focus:outline-none bg-slate-50/50 font-bold text-slate-700 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="">-- Список центров переливания --</option>
                    {centers.map(center => {
                      if (links.some(l => l.centerId === center.id)) return null;
                      return <option key={center.id} value={center.id}>{center.name}</option>;
                    })}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[15px] px-10 py-4 rounded-[1rem] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_4px_12px_rgba(30,41,59,0.15)]"
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
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Настройки оповещений</h3>
                <p className="text-[14px] text-slate-500 font-medium">Выберите удобные каналы связи для вызова на донацию</p>
              </div>

              {notifSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-[1rem] text-[13px] text-emerald-700 font-bold flex items-center gap-3">
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
                    <div key={notif.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-[1.25rem] border border-slate-100 transition-hover hover:border-slate-200">
                      <div className="space-y-1 pr-4">
                        <h4 className="text-[15px] font-extrabold text-[#c23e2b] tracking-tight">{notif.title}</h4>
                        <p className="text-[13px] text-slate-500 font-medium leading-tight">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={notif.enabled} onChange={(e) => notif.toggle(e.target.checked)} />
                        <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c23e2b] shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-[1.25rem] border border-slate-100/80 shadow-inner group">
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase mb-2 tracking-widest leading-none">Системный идентификатор (OneSignal)</label>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <code className="text-[#c23e2b] text-[14px] font-mono font-bold tracking-tight bg-white px-3 py-1 rounded-md border border-slate-200 group-hover:border-[#c23e2b]/30 transition-colors">
                      {donor.onesignalPlayerId || 'not-assigned-yet'}
                    </code>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="bg-[#c23e2b] hover:bg-[#a83321] text-white text-[15px] font-bold px-10 py-4 rounded-[1rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_6px_20px_rgba(194,62,43,0.2)] flex items-center gap-2.5"
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
            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Безопасность аккаунта</h3>
                <p className="text-[14px] text-slate-500 font-medium">Управление доступом и паролями</p>
              </div>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Функция изменения пароля в демо-режиме!"); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Текущий пароль</label>
                    <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 text-[15px] bg-slate-50 border border-slate-200 rounded-[1rem] focus:border-[#c23e2b] focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                  <div className="hidden md:block"></div>
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Новый пароль</label>
                    <input type="password" required placeholder="Минимум 8 символов" className="w-full px-5 py-4 text-[15px] bg-slate-50 border border-slate-200 rounded-[1rem] focus:border-[#c23e2b] focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Повторите пароль</label>
                    <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 text-[15px] bg-slate-50 border border-slate-200 rounded-[1rem] focus:border-[#c23e2b] focus:ring-4 focus:ring-red-50 focus:outline-none transition-all placeholder:text-slate-300 font-mono" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <button type="submit" className="bg-[#c23e2b] hover:bg-[#a83321] text-white font-extrabold py-4 px-10 rounded-[1rem] shadow-[0_4px_12px_rgba(194,62,43,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3">
                    <Check className="w-[1.2rem] h-[1.2rem] stroke-[3px]" />
                    Обновить пароль
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#fdf1f0] rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-[#c23e2b]" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight leading-tight">Установка приложения (PWA)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-6 rounded-[1.25rem] border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-extrabold text-slate-800 text-[15px] mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> iPhone / Safari
                  </h4>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Нажмите иконку <span className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-block font-bold">«Поделиться»</span>, затем выберите пункт <span className="text-slate-800 font-bold">«На экран Домой»</span> и нажмите <span className="text-[#c23e2b] font-extrabold">«Добавить»</span>.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[1.25rem] border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-extrabold text-slate-800 text-[15px] mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Android / Chrome
                  </h4>
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed">Нажмите на значок <span className="bg-white px-2 py-0.5 rounded border border-slate-200 inline-block font-bold">⋮</span> в строке браузера, выберите <span className="text-slate-800 font-bold">«Установить приложение»</span> или <span className="text-[#c23e2b] font-extrabold">«На главный экран»</span>.</p>
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
