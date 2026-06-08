import React, { useState } from 'react';
import { 
  Heart, Calendar, Award, ShieldAlert, Clock, AlertTriangle, 
  Settings, Check, Bell, RefreshCw, X, Plus, ExternalLink
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
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'history' | 'pause' | 'links' | 'settings'>('dashboard');
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
  const gameStatus = getGamificationStatus(donor.bloodDonationsCount);
  const homeCenter = centers.find(c => {
    const primaryLink = links.find(l => l.donorId === donor.id && l.isPrimary);
    return c.id === primaryLink?.centerId;
  });

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Side Profile Card & Inner Panel Menu */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative text-center">
          {/* Avatar simulation icon */}
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3 border border-red-100">
            {donor.firstName[0]}{donor.lastName[0]}
          </div>
          <h2 className="font-semibold text-slate-800 text-sm leading-tight">
            {donor.lastName} {donor.firstName} {donor.middleName}
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">В системе с {new Date(donor.createdAt).toLocaleDateString('ru-RU')}</p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
            <div className="bg-red-50/50 p-2 rounded-xl text-center">
              <span className="text-xs text-rose-500 block">Группа крови</span>
              <span className="font-bold text-red-700 text-sm">{formatBloodGroup(donor.bloodGroup)}</span>
            </div>
            <div className="bg-red-50/50 p-2 rounded-xl text-center">
              <span className="text-xs text-rose-500 block">Резус</span>
              <span className="font-bold text-red-700 text-sm">{formatRhFactor(donor.rhFactor)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-left text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Вес:</span>
              <span className="font-medium text-slate-800">{donor.weight} кг</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Рождение:</span>
              <span className="font-medium text-slate-800">{new Date(donor.birthDate).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Телефон:</span>
              <span className="font-medium text-slate-800">{donor.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Основной центр:</span>
              <span className="font-medium text-slate-800 truncate max-w-[120px]" title={homeCenter?.name}>
                {homeCenter ? homeCenter.name : 'Не привязан'}
              </span>
            </div>
          </div>
        </div>

        {/* Vertical menu navigation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex flex-col gap-1">
          {[
            { id: 'dashboard', label: 'Рабочий стол (Карта)', icon: Heart },
            { id: 'history', label: 'История донаций', icon: Calendar },
            { id: 'pause', label: 'Личная пауза', icon: Clock },
            { id: 'links', label: 'Мои центры привязки', icon: RefreshCw },
            { id: 'settings', label: 'Настройки оповещений', icon: Settings },
          ].map(it => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onClick={() => { setActiveMenu(it.id as any); }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left text-xs font-semibold transition Duration-100 ${activeMenu === it.id ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className="w-4 h-4 mr-2.5" />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Context panels dynamically switched */}
      <div className="md:col-span-3 space-y-6">

        {/* Dashboard Menu Section */}
        {activeMenu === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Health readiness badge indicator */}
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${readiness.ready ? 'bg-emerald-50 border-emerald-100 text-emerald-950' : 'bg-amber-50 border-amber-100 text-amber-950'}`}>
              <div className="space-y-1">
                <span className="uppercase text-[10px] tracking-wider font-bold text-slate-400 block mb-1">Ваш текущий статус готовности к сдаче</span>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full inline-block ${readiness.ready ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  <h3 className="font-bold text-lg">{readiness.ready ? 'Вы полностью готовы к сдаче цельной крови!' : 'Временно не допущены к сдаче'}</h3>
                </div>
                {!readiness.ready && (
                  <p className="text-xs font-light text-amber-900 pr-4 mt-2">
                    <strong>Причина:</strong> {readiness.reason}
                  </p>
                )}
              </div>
              {readiness.ready && (
                <button 
                  onClick={() => alert(`Ваш домашний центр: ${homeCenter?.name || 'не привязан'}. Пожалуйста, позвоните по номеру ${homeCenter?.phone || donor.phone} и запишитесь на удобный день!`)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-150 inline-flex items-center shadow-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Записаться на сдачу
                </button>
              )}
            </div>

            {/* Gamification progress card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Геймификация донорства</h3>
                  <p className="text-xs text-slate-500 leading-tight">Система мотивации — накапливайте кроводачи и повышайте ваш донорский ранг!</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${gameStatus.color}`}>
                  {gameStatus.title} ({donor.bloodDonationsCount} сд.)
                </span>
              </div>

              {/* Progress bar estimation slider */}
              {donor.bloodDonationsCount < gameStatus.nextAt && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>До нового ранга:</span>
                    <span>{donor.bloodDonationsCount} / {gameStatus.nextAt} кроводач</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${(donor.bloodDonationsCount / gameStatus.nextAt) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    *В зачет идут только донации цельной крови. 1 донация крови приравнивается к 4 донациям плазмы / тромбоцитов.
                  </p>
                </div>
              )}

              {/* Real benefits info alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50">
                  <Award className="w-4.5 h-4.5 text-indigo-700 mb-1" />
                  <h4 className="text-xs font-semibold text-indigo-950 mb-0.5">Временная нетрудоспособность (100%):</h4>
                  <p className="text-[11px] font-light text-indigo-900 leading-snug">
                    {donor.bloodDonationsCount >= 4 ? (
                      <span className="text-emerald-700 font-semibold flex items-center">✓ Право подтверждено! (4+ кроводачи за 12 мес.)</span>
                    ) : (
                      `Вам нужно совершить еще ${Math.max(0, 4 - donor.bloodDonationsCount)} донации в этом году, чтобы получить право на 100% оплату больничного`
                    )}
                  </p>
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100/50">
                  <Award className="w-4.5 h-4.5 text-amber-700 mb-1" />
                  <h4 className="text-xs font-semibold text-amber-950 mb-0.5">Почетный донор РБ:</h4>
                  <p className="text-[11px] font-light text-amber-900 leading-snug">
                    {donor.bloodDonationsCount >= 20 ? (
                      <span className="text-rose-700 font-bold flex items-center">✓ Вы кандидат на звание «Ганаровы донар»!</span>
                    ) : (
                      `Совершите еще ${20 - donor.bloodDonationsCount} кроводач (безвозмездно) за всё время до получения нагрудного знака отличия.`
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Next available dates per donation type in RBP */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base">Планируемые интервалы следующих сдач</h3>
              <p className="text-xs text-slate-500">Следующий возможный визит на станцию переливания рассчитывается в зависимости от истории предыдущей донации:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-rose-50/20 border border-slate-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Цельная кровь</span>
                  <span className="font-mono text-sm font-semibold text-slate-800">{donor.nextAvailableDate || 'Доступно сейчас'}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Интервал: 60 дн. (каждая 5-я — 90 дн.)</span>
                </div>
                <div className="p-3 bg-amber-50/20 border border-slate-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Плазма (Аферез)</span>
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'Доступно сейчас'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Интервал: 14 дней восстановление</span>
                </div>
                <div className="p-3 bg-blue-50/20 border border-slate-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Тромбоциты</span>
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {donor.lastDonationDate ? new Date(new Date(donor.lastDonationDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'Доступно сейчас'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Интервал: 14 дней восстановление</span>
                </div>
              </div>
            </div>

            {/* List of active medical notes (медотводы) if any */}
            {medicalNotes.some(m => m.isActive) && (
              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 space-y-2">
                <h4 className="font-semibold text-red-950 text-sm flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2 text-red-700" />
                  У вас есть активный медицинский отвод (медотвод):
                </h4>
                <div className="text-xs text-red-900 space-y-1">
                  {medicalNotes.filter(m => m.isActive).map(note => (
                    <div key={note.id} className="p-3 bg-white/50 border border-red-100/50 rounded-xl">
                      <p><strong>Причина отвода:</strong> {note.reason}</p>
                      <p className="mt-1">Срок действия: с {note.startDate} по {note.endDate || 'Постоянный отвод'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Donations history view */}
        {activeMenu === 'history' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base">История ваших донаций</h3>
                <p className="text-xs text-slate-500">Полный перечень медицинских донорских процедур в системе:</p>
              </div>
              <button 
                onClick={triggerRefresh}
                className="p-2 border border-slate-100 hover:bg-slate-50 rounded-lg text-slate-600 flex items-center text-xs font-semibold gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Обновить данные
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-medium">Дата донации</th>
                    <th className="pb-3 font-medium">Медицинский центр (Филиал)</th>
                    <th className="pb-3 font-medium">Тип заготовки</th>
                    <th className="pb-3 font-medium">Объем (мл)</th>
                    <th className="pb-3 font-medium">Примечания вожатого</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {donations.map(don => {
                    const centerName = centers.find(c => c.id === don.centerId)?.name || `Центр #${don.centerId}`;
                    return (
                      <tr key={don.id}>
                        <td className="py-3 font-mono font-medium">{don.donationDate}</td>
                        <td className="py-3 font-medium text-slate-800">{centerName}</td>
                        <td className="py-3">
                          <span className="bg-red-50 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                            {don.donationType === 'blood' ? 'Цельная кровь' : 
                             don.donationType === 'plasma' ? 'Плазма' :
                             don.donationType === 'platelets' ? 'Тромбоциты' : 'Гранулоциты'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-800 font-semibold">{don.volumeMl || '—'}</td>
                        <td className="py-3 text-slate-500 leading-snug">{don.note || '—'}</td>
                      </tr>
                    );
                  })}
                  {donations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-sm py-12 text-center text-slate-400">У вас пока нет зарегистрированных донаций. Обратитесь к медсестре центра переливания при следующем визите для занесения процедуры в базу!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Change personal pause settings */}
        {activeMenu === 'pause' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-xl space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Личная пауза донора</h3>
              <p className="text-xs text-slate-500">Если вы временно не можете сдавать кровь (отпуск, личные обстоятельства, простуда), установите паузу, чтобы центры не беспокоили вас напрасно.</p>
            </div>

            {pauseSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
                {pauseSuccess}
              </div>
            )}

            <form onSubmit={handlePauseSubmit} className="space-y-4">
              <label className="flex items-start text-xs text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={pauseForm.personalPause}
                  onChange={(e) => setPauseForm({ ...pauseForm, personalPause: e.target.checked })}
                  className="mr-3 rounded text-red-600 focus:ring-red-500 border-slate-300 mt-1"
                />
                <div>
                  <span className="font-semibold text-slate-800 text-sm block">Включить временную личную паузу</span>
                  <span className="text-slate-400">Вы будете автоматически исключены из всех массовых рассылок центров переливания РБ</span>
                </div>
              </label>

              {pauseForm.personalPause && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Действует до (дата):</label>
                    <input 
                      type="date"
                      value={pauseForm.personalPauseUntil}
                      onChange={(e) => setPauseForm({ ...pauseForm, personalPauseUntil: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block">*Если оставить пустым, пауза будет считаться бессрочной</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Причина (только для себя):</label>
                    <textarea 
                      value={pauseForm.personalPauseNote}
                      onChange={(e) => setPauseForm({ ...pauseForm, personalPauseNote: e.target.value })}
                      placeholder="Отпуск у коров, командировка..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <button 
                type="submit"
                className="bg-red-650 hover:bg-red-700 bg-red-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition duration-150 shadow-sm"
              >
                Сохранить параметры
              </button>
            </form>
          </div>
        )}

        {/* Association Link ties page */}
        {activeMenu === 'links' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Связи с медицинскими центрами крови РБ</h3>
                <p className="text-xs text-slate-500">Доноры в Беларуси могут быть зарегистрированы или привязаны к разным центрам для сдачи. Каждая привязка требует подтверждения уполномоченными координаторами центра переливания.</p>
              </div>

              <div className="space-y-3 pt-2">
                {links.map(link => {
                  const center = centers.find(c => c.id === link.centerId);
                  return (
                    <div key={link.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-800">{center ? center.name : `Центр #${link.centerId}`}</span>
                          {link.isPrimary && (
                            <span className="text-[9px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide">Домашний</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{center?.address}</p>
                        
                        {link.status === 'rejected' && link.rejectionReason && (
                          <div className="p-2.5 bg-red-50 text-red-900 border border-red-100 rounded-lg text-xs mt-3 leading-snug">
                            <strong>Причина отклонения врачом:</strong> {link.rejectionReason}
                            <div className="mt-2 text-right">
                              <button 
                                onClick={() => handleResubmit(link.centerId)}
                                className="text-xs font-bold text-red-700 hover:underline flex items-center justify-end ml-auto"
                              >
                                Исправить и отправить анкету повторно <RefreshCw className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>
                        )}
                        {link.status === 'pending' && (
                          <span className="text-[10px] text-slate-400 block mt-2">
                            *Заявка отправлена. Координатор рассмотрит ваши данные в течение 24 часов. {link.resubmissionCount > 0 && `(Повторная подача #${link.resubmissionCount})`}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${link.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : link.status === 'pending' ? 'bg-amber-55 text-amber-900 bg-amber-50 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {link.status === 'confirmed' ? 'Подтвержден' : link.status === 'pending' ? 'Ожидает одобрения' : 'Отклонен'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Request link with third party medical clinic */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 max-w-xl">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Связаться с дополнительной станцией</h3>
                <p className="text-xs text-slate-500">Добавьте новую станцию переливания (например, если переехали или хотите сдать кровь в соседнем регионе Кобрина, Барановичей или Полоцка).</p>
              </div>

              {linkError && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">{linkSuccess}</p>}

              <form onSubmit={handleCenterLink} className="space-y-4 flex flex-col sm:flex-row items-end gap-3">
                <div className="space-y-1 w-full sm:flex-1">
                  <label className="text-xs font-semibold text-slate-700 block">Медицинское учреждение:</label>
                  <select 
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Выбрать из списка --</option>
                    {centers.map(center => {
                      if (links.some(l => l.centerId === center.id)) return null; // already tied
                      return <option key={center.id} value={center.id}>{center.name}</option>;
                    })}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-950 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Отправить анкету
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Channels adjusters toggle page */}
        {activeMenu === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-xl space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Предпочитаемые каналы оповещений</h3>
                <p className="text-xs text-slate-500">При критических дефицитах крови центры будут отправлять экстренные вызовы. Выберите, где хотите их получать:</p>
              </div>

              {notifSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700">
                  {notifSuccess}
                </div>
              )}

              <form onSubmit={handleNotifSubmit} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifForm.pushEnabled}
                      onChange={(e) => setNotifForm({ ...notifForm, pushEnabled: e.target.checked })}
                      className="mr-3 rounded text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Браузерные всплывающие Push-оповещения</span>
                      <span className="text-slate-400">Появляются автоматически в углу вашего ПК или смартфона</span>
                    </div>
                  </label>

                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifForm.smsEnabled}
                      onChange={(e) => setNotifForm({ ...notifForm, smsEnabled: e.target.checked })}
                      className="mr-3 rounded text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Экстренные сотовые SMS-уведомления</span>
                      <span className="text-slate-400">Отправляются при нехватке на ваш сотовый номер: {donor.phone}</span>
                    </div>
                  </label>

                  <label className="flex items-center text-xs text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifForm.emailNotificationsEnabled}
                      onChange={(e) => setNotifForm({ ...notifForm, emailNotificationsEnabled: e.target.checked })}
                      className="mr-3 rounded text-red-600 focus:ring-red-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">Электронные транзакционные письма (E-mail)</span>
                      <span className="text-slate-400">Полные HTML-бланки новостей и уведомлений на вашу почту</span>
                    </div>
                  </label>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs text-slate-600 space-y-1">
                  <p><strong>Ваш OneSignal ID в системе:</strong></p>
                  <code className="font-mono bg-white border px-1.5 py-0.5 rounded text-red-700 inline-block mt-1 font-semibold select-all">
                    {donor.onesignalPlayerId || 'onesignal-temp-not-active-id'}
                  </code>
                  <p className="text-[10px] text-slate-400 mt-2">*Используется для отправки push-уведомлений на ваше устройство.</p>
                </div>

                <button 
                  type="submit"
                  className="bg-red-650 hover:bg-red-700 bg-red-600 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition duration-150 shadow-sm"
                >
                  Сохранить предпочтения
                </button>
              </form>
            </div>

            {/* Instruction on how to install to Mobile as PWA */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl max-w-xl space-y-4">
              <h4 className="font-bold text-sm text-rose-300">Инструкция по установке приложения на телефон (PWA)</h4>
              <div className="text-xs font-light text-slate-300 space-y-3 leading-relaxed">
                <div>
                  <p className="font-semibold text-white">Для устройств Apple iPhone (Safari):</p>
                  <p>1. Откройте сайт в Safari, нажмите кнопку «Поделиться» (иконка со стрелочкой из квадрата) на нижней панели.</p>
                  <p>2. Прокрутите меню и выберите «На экран „Домой“». Нажмите «Добавить».</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Для смартфонов на базе Android (Chrome):</p>
                  <p>1. Сайт покажет всплывающий баннер «Установить Донор-Алерт» или нажмите на три вертикальные точки в углу браузера.</p>
                  <p>2. Нажмите «Установить приложение» / «Добавить на главный экран».</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
