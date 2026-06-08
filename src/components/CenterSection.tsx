import React, { useState, useEffect } from 'react';
import { 
  Heart, Activity, Users, Bell, FileText, Search, Plus, 
  Trash2, X, Check, Eye, ChevronRight, Send, HelpCircle, ShieldAlert
} from 'lucide-react';
import { 
  BloodCenter, Donor, DonorCenter, Donation, MedicalNote, 
  Notification, News, BloodGroup, RhFactor, DonationType, formatBloodGroup, formatRhFactor 
} from '../types';

interface CenterSectionProps {
  center: BloodCenter;
  onRefresh: () => void;
  apiBase: string;
  token: string;
}

export default function CenterSection({ center, onRefresh, apiBase, token }: CenterSectionProps) {
  const [activeMenu, setActiveMenu] = useState<'stats' | 'donors' | 'pending' | 'notify' | 'news'>('stats');
  
  // Dashboard states
  const [stats, setStats] = useState({
    totalDonors: 0,
    readyCount: 0,
    pendingCount: 0,
    notificationsThisMonth: 0,
    bloodGroupStats: { I_O: 0, II_A: 0, III_B: 0, IV_AB: 0 },
    rhStats: { positive: 0, negative: 0 }
  });

  // News State list
  const [newsList, setNewsList] = useState<News[]>([]);
  const [showNewsModal, setShowNewsModal] = useState<boolean>(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [newsForm, setNewsForm] = useState({ title: '', content: '', isPublished: true });

  // Notifications state list
  const [notifHistory, setNotifHistory] = useState<Notification[]>([]);

  // Donors query filters
  const [donorSearch, setDonorSearch] = useState('');
  const [filterBgs, setFilterBgs] = useState<BloodGroup[]>([]);
  const [filterRhs, setFilterRhs] = useState<RhFactor[]>([]);
  const [filterReadiness, setFilterReadiness] = useState<string>('all'); // all, ready, not_ready
  const [donorList, setDonorList] = useState<Donor[]>([]);

  // Selected single donor profile detailed view
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null);
  const [donorCard, setDonorCard] = useState<{
    donor: Donor;
    link: DonorCenter;
    donations: Donation[];
    medicalNotes: MedicalNote[];
    readiness: { ready: boolean; reason?: string };
  } | null>(null);

  // New forms states inside profile card
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donationDate: new Date().toISOString().split('T')[0],
    donationType: 'blood' as DonationType,
    volumeMl: '450',
    note: ''
  });

  const [showAddMedicalModal, setShowAddMedicalModal] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    reason: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isPermanent: false
  });

  // Manual Donor Registration from Center
  const [showManualRegModal, setShowManualRegModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male' as 'male'|'female',
    bloodGroup: 'I_O' as BloodGroup, rhFactor: 'positive' as RhFactor, weight: '70', phone: '+375 (', email: '', password: 'password123'
  });
  const [manualError, setManualError] = useState('');

  // Pending Confirmations applications list
  const [pendingTies, setPendingTies] = useState<any[]>([]);
  const [rejectionModalLinkId, setRejectionModalLinkId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Sended Alertor notifications console states
  const [notifyForm, setNotifyForm] = useState({
    bloodGroups: [] as BloodGroup[],
    rhFactor: 'both',
    donationType: 'any',
    minDaysSinceDonation: '60',
    excludeMedical: true,
    excludePause: true,
    channel: 'all',
    messageText: ''
  });
  const [notifyPreviewCount, setNotifyPreviewCount] = useState<number>(0);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState('');

  // --- API CALL HANDLERS ---

  const refreshDashboard = async () => {
    try {
      const res = await fetch(`${apiBase}/center/stats/${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}

    try {
      const res = await fetch(`${apiBase}/center/notifications?centerId=${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifHistory(data);
      }
    } catch {}

    try {
      const res = await fetch(`${apiBase}/news`);
      if (res.ok) {
        const data = await res.json();
        // filter news of this center
        setNewsList(data.filter((n: any) => n.centerId === center.id));
      }
    } catch {}
  };

  const loadDonors = async () => {
    try {
      const bgsStr = filterBgs.join(',');
      const rhsStr = filterRhs.join(',');
      const url = `${apiBase}/center/donors?centerId=${center.id}&search=${donorSearch}&bloodGroups=${bgsStr}&rhFactors=${rhsStr}&readiness=${filterReadiness}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDonorList(data);
      }
    } catch {}
  };

  const loadPending = async () => {
    try {
      const res = await fetch(`${apiBase}/center/pending?centerId=${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setPendingTies(data);
      }
    } catch {}
  };

  const loadDonorCard = async (donorId: number) => {
    try {
      const res = await fetch(`${apiBase}/center/donors/${donorId}?centerId=${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setDonorCard(data);
        setSelectedDonorId(donorId);
      }
    } catch {}
  };

  // Recount preview target count live upon alert rules changes
  const updatePreviewCount = async () => {
    try {
      const res = await fetch(`${apiBase}/center/notify/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId: center.id, ...notifyForm })
      });
      if (res.ok) {
        const data = await res.json();
        setNotifyPreviewCount(data.count);
      }
    } catch {}
  };

  useEffect(() => {
    refreshDashboard();
  }, [center.id]);

  useEffect(() => {
    if (activeMenu === 'donors') {
      loadDonors();
    } else if (activeMenu === 'pending') {
      loadPending();
    }
  }, [activeMenu, donorSearch, filterBgs, filterRhs, filterReadiness]);

  useEffect(() => {
    if (activeMenu === 'notify') {
      updatePreviewCount();
    }
  }, [activeMenu, notifyForm]);

  // Handle Manual register submit
  const handleManualReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    if (!manualForm.lastName || !manualForm.firstName || !manualForm.email || !manualForm.phone) {
      setManualError('Заполните обязательные поля');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/center/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId: center.id, ...manualForm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Донор успешно занесен в электронную картотеку!');
      setShowManualRegModal(false);
      loadDonors();
      refreshDashboard();
    } catch (err: any) {
      setManualError(err.message);
    }
  };

  // Confirm pending application
  const handleConfirmPending = async (linkId: number) => {
    try {
      const res = await fetch(`${apiBase}/center/pending/${linkId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' })
      });
      if (res.ok) {
        alert('Заявка донора успешно одобрена и подтверждена!');
        loadPending();
        refreshDashboard();
      }
    } catch {}
  };

  // Reject pending application (submits cause reason text via modal)
  const handleRejectPendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Укажите причину обязательно');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/center/pending/${rejectionModalLinkId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason })
      });
      if (res.ok) {
        alert('Заявка отклонена. Донору выслано извещение.');
        setRejectionModalLinkId(null);
        setRejectionReason('');
        loadPending();
        refreshDashboard();
      }
    } catch {}
  };

  // Add Donation Record past
  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId) return;
    try {
      const res = await fetch(`${apiBase}/center/donors/${selectedDonorId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId: center.id, addedBy: 2, ...donationForm })
      });
      if (res.ok) {
        alert('Процедура занесена в реестр донаций донора!');
        setShowAddDonationModal(false);
        loadDonorCard(selectedDonorId);
        refreshDashboard();
      }
    } catch {}
  };

  // Add Medical note restriction
  const handleAddMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId) return;
    try {
      const res = await fetch(`${apiBase}/center/donors/${selectedDonorId}/medical-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId: center.id,
          reason: medicalForm.reason,
          startDate: medicalForm.startDate,
          endDate: medicalForm.isPermanent ? '' : medicalForm.endDate,
          createdBy: 2
        })
      });
      if (res.ok) {
        alert('Медицинский отвод донора активен!');
        setShowAddMedicalModal(false);
        loadDonorCard(selectedDonorId);
      }
    } catch {}
  };

  // Lift medical note handily
  const handleLiftMedical = async (noteId: number) => {
    if (!selectedDonorId) return;
    try {
      const res = await fetch(`${apiBase}/center/medical-notes/${noteId}/lift`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liftNote: 'Снят досрочно лечащим врачом-трансфузиологом РНПЦ', liftedBy: 2 })
      });
      if (res.ok) {
        alert('Медотвод снят!');
        loadDonorCard(selectedDonorId);
      }
    } catch {}
  };

  // Send campaign broadcasts alertor
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifySuccessMsg('');
    if (!notifyForm.messageText.trim()) {
      alert('Текст уведомления пуст!');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/center/notify/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId: center.id, sentBy: 2, ...notifyForm })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifySuccessMsg(`Рассылка отправлена! Получателей: ${data.recipientsCount}. Подробности:\n- Push получено: ${data.pushSent}\n- SMS оформлено: ${data.smsSent}\n- Email направлено: ${data.emailSent}`);
        setNotifyForm({ ...notifyForm, messageText: '' });
        refreshDashboard();
      }
    } catch {}
  };

  // Load alert template defaults quick
  const loadTemplate = (type: string) => {
    if (type === 'urgent_color') {
      setNotifyForm({
        ...notifyForm,
        messageText: 'Донор-Алерт: Нашему центру крови СРОЧНО требуется пополнение дефицита цельной крови II(A) Rh+ и I(O) Rh+. Пожалуйста, зайдите в личный кабинет.'
      });
    } else if (type === 'plasma_call') {
      setNotifyForm({
        ...notifyForm,
        messageText: 'Донор-Алерт: Просим доноров плазмы подойти для аппаратного плазмафереза в утренние часы. Контактная регистратура: ' + center.phone
      });
    }
  };

  // Manage regional news CRUD
  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingNews ? 'PUT' : 'POST';
      const url = editingNews ? `${apiBase}/news/${editingNews.id}` : `${apiBase}/news`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerId: center.id, sentBy: 2, ...newsForm })
      });
      if (res.ok) {
        alert(editingNews ? 'Новость отредактирована' : 'Новость опубликована!');
        setShowNewsModal(false);
        setEditingNews(null);
        refreshDashboard();
      }
    } catch {}
  };

  const handleNewsDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите безвозвратно удалить эту новость?')) return;
    try {
      const res = await fetch(`${apiBase}/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshDashboard();
      }
    } catch {}
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Clinic Header Metadata banner info */}
      <div className="bg-slate-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Авторизован филиал РБ</span>
          <h2 className="font-bold text-slate-800 text-lg leading-tight">{center.name}</h2>
          <p className="text-xs text-slate-500 mt-1">Клиника: {center.address} | Тел: {center.phone}</p>
        </div>

        <div className="flex border border-slate-200 bg-white p-1 rounded-xl self-start gap-1">
          {[
            { id: 'stats', label: 'Показатели', icon: Activity },
            { id: 'donors', label: 'Доноры', icon: Users },
            { id: 'pending', label: 'Заявки', icon: HelpCircle },
            { id: 'notify', label: 'Рассылка', icon: Bell },
            { id: 'news', label: 'Новости', icon: FileText }
          ].map(menu => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.id}
                onClick={() => { setActiveMenu(menu.id as any); setSelectedDonorId(null); setDonorCard(null); }}
                className={`flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition ${activeMenu === menu.id ? 'bg-red-600 text-white shadow-sm' : 'text-slate-650 hover:bg-slate-50 text-slate-600'}`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {menu.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menus Context content sections */}

      {/* MENU 1: DASHBOARD STATS */}
      {activeMenu === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Всего доноров (активных)</span>
              <span className="text-3xl font-light text-slate-800">{stats.totalDonors}</span>
            </div>
            <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Готовы сдать сейчас</span>
              <span className="text-3xl font-light text-emerald-800">{stats.readyCount}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Остальные — сроки/медотводы</span>
            </div>
            <div className="bg-amber-50/20 p-5 rounded-2xl border border-amber-100/50 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ожидают подтверждения</span>
              <span className="text-3xl font-light text-amber-800">{stats.pendingCount}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Новые заявки доноров</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Рассылок в этом месяце</span>
              <span className="text-3xl font-light text-slate-800">{stats.notificationsThisMonth}</span>
            </div>
          </div>

          {/* Stanning Interactive SVG Charts on blood and Rh factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 1: Blood Groups */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Распределение базы по группам крови</h3>
              <p className="text-xs text-slate-500">Отображается отношение доноров по I, II, III, IV клиническим группам:</p>
              
              {/* Graphic custom interactive SVG */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-around pt-2">
                <svg className="w-36 h-36 border border-slate-50 rounded-full" viewBox="0 0 40 40">
                  {/* Just basic SVG slices based on counts for visually pristine representations */}
                  <circle r="15.915" cx="20" cy="20" fill="transparent" stroke="#E2E8F0" strokeWidth="6"></circle>
                  
                  {/* I_O slice (orange, e.g. 5 donors = 25%) */}
                  <circle r="15.915" cx="20" cy="20" fill="transparent" stroke="#E11D48" strokeWidth="6" strokeDasharray="30 70" strokeDashoffset="25"></circle>
                  
                  {/* II_A slice (red, e.g. 8 donors = 40%) */}
                  <circle r="15.915" cx="20" cy="20" fill="transparent" stroke="#9F1239" strokeWidth="6" strokeDasharray="40 60" strokeDashoffset="95"></circle>

                  {/* III_B slice (amber, e.g. 4 donors = 20%) */}
                  <circle r="15.915" cx="20" cy="20" fill="transparent" stroke="#F59E0B" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="55"></circle>

                  {/* IV_AB slice (slate, e.g. 3 donors = 15%) */}
                  <circle r="15.915" cx="20" cy="20" fill="transparent" stroke="#64748B" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="35"></circle>
                </svg>

                <div className="space-y-2.5 text-xs text-slate-700 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-800 block"></span>
                    <span><strong>II (A) — Вторая:</strong> {stats.bloodGroupStats.II_A} дон. ({stats.totalDonors > 0 ? Math.round((stats.bloodGroupStats.II_A/stats.totalDonors)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-650 block bg-rose-600"></span>
                    <span><strong>I (O) — Первая:</strong> {stats.bloodGroupStats.I_O} дон. ({stats.totalDonors > 0 ? Math.round((stats.bloodGroupStats.I_O/stats.totalDonors)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500 block"></span>
                    <span><strong>III (B) — Третья:</strong> {stats.bloodGroupStats.III_B} дон. ({stats.totalDonors > 0 ? Math.round((stats.bloodGroupStats.III_B/stats.totalDonors)*100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-slate-500 block"></span>
                    <span><strong>IV (AB) — Четвертая:</strong> {stats.bloodGroupStats.IV_AB} дон. ({stats.totalDonors > 0 ? Math.round((stats.bloodGroupStats.IV_AB/stats.totalDonors)*100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Rh factors */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Резус-фактор доноров подразделения</h3>
              <p className="text-xs text-slate-500">Доноры с резус-отрицательным фактором (Rh-) являются особо дефицитным ресурсом:</p>
              
              <div className="space-y-4 pt-3 text-xs text-slate-700">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span><strong>Rh+ (Положительный):</strong> {stats.rhStats.positive} доноров</span>
                    <span>{stats.totalDonors > 0 ? Math.round((stats.rhStats.positive / stats.totalDonors) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-700 h-full rounded-full"
                      style={{ width: `${stats.totalDonors > 0 ? (stats.rhStats.positive / stats.totalDonors) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span><strong>Rh- (Отрицательный):</strong> {stats.rhStats.negative} доноров</span>
                    <span>{stats.totalDonors > 0 ? Math.round((stats.rhStats.negative / stats.totalDonors) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${stats.totalDonors > 0 ? (stats.rhStats.negative / stats.totalDonors) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENU 2: DONORS DATABASE */}
      {activeMenu === 'donors' && (
        <div className="space-y-6">
          {/* Active single donor profile detailed view is open */}
          {selectedDonorId !== null && donorCard ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6 relative">
              <button 
                onClick={() => { setSelectedDonorId(null); setDonorCard(null); }}
                className="absolute right-4 top-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                ← Вернуться в реестр
              </button>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Медицинская карта донора: {donorCard.donor.lastName} {donorCard.donor.firstName}</h3>
                  <p className="text-xs text-slate-500">Телефоны: {donorCard.donor.phone} | Электронная почта: {donorCard.donor.emailNotificationsEnabled ? donorCard.donor.onesignalPlayerId : 'не указана/отключена'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold ${donorCard.readiness.ready ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                    {donorCard.readiness.ready ? 'Готов к донации цельной крови' : 'Медотвод/Ограничение'}
                  </span>
                </div>
              </div>

              {/* Sub actions block */}
              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={() => setShowAddDonationModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Добавить запись о донации
                </button>
                <button 
                  onClick={() => setShowAddMedicalModal(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center"
                >
                  <ShieldAlert className="w-4 h-4 mr-1" /> Добавить медотвод
                </button>
              </div>

              {/* Grid donor card specifics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Columns left: History list of donations */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">История процедур сдачи крови ({donorCard.donations.length}):</h4>
                  <div className="border rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b">
                          <th className="p-3 font-medium">Дата сдачи</th>
                          <th className="p-3 font-medium">Тип заготовки</th>
                          <th className="p-3 font-medium">Объем (мл)</th>
                          <th className="p-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-600">
                        {donorCard.donations.map(don => (
                          <tr key={don.id}>
                            <td className="p-3 font-mono">{don.donationDate}</td>
                            <td className="p-3 uppercase font-semibold text-red-700">{don.donationType}</td>
                            <td className="p-3">{don.volumeMl || '—'}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={async () => {
                                  if (!confirm('Удалить эту запись?')) return;
                                  const res = await fetch(`${apiBase}/donations/${don.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    alert('Запись удалена!');
                                    loadDonorCard(donorCard.donor.id);
                                    refreshDashboard();
                                  }
                                }}
                                className="text-red-650 hover:text-red-700 font-semibold text-[10px]"
                              >
                                Удалить
                              </button>
                            </td>
                          </tr>
                        ))}
                        {donorCard.donations.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">Нет записей о донациях.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Columns right: Medical restrictions (Медотводы) list */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Медицинские отводы и ограничения:</h4>
                  <div className="space-y-2.5">
                    {donorCard.medicalNotes.map(note => (
                      <div key={note.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${note.isActive ? 'bg-red-50/55 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Причина: {note.reason}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Период: {note.startDate} — {note.endDate || 'Постоянный отвод'}</p>
                          {note.isActive ? (
                            <span className="text-[9px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full mt-2 inline-block">Активен</span>
                          ) : (
                            <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full mt-2 inline-block">Архивный (Снят)</span>
                          )}
                        </div>
                        {note.isActive && (
                          <button 
                            onClick={() => handleLiftMedical(note.id)}
                            className="bg-white hover:bg-slate-100 text-slate-800 border text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          >
                            Снять медотвод
                          </button>
                        )}
                      </div>
                    ))}
                    {donorCard.medicalNotes.length === 0 && (
                      <p className="text-xs text-slate-400 py-6 text-center">У донора отсутствуют медотводы в истории.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Tabular active list filters and registry */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Электронный реестр доноров филиала</h3>
                  <p className="text-xs text-slate-500">В списке выводятся подтвержденные доноры, связавшие свои анкеты с вашим центром.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => {
                      setManualForm({
                        lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male',
                        bloodGroup: 'I_O', rhFactor: 'positive', weight: '70', phone: '+375 (', email: '', password: 'password123'
                      });
                      setShowManualRegModal(true);
                    }}
                    className="bg-red-650 hover:bg-red-700 bg-red-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Занести нового донора
                  </button>
                </div>
              </div>

              {/* Query filter box */}
              <div className="bg-slate-50 p-4 rounded-2xl border flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input 
                      type="text" 
                      placeholder="Быстрый поиск по фамилии или имени..."
                      value={donorSearch}
                      onChange={(e) => setDonorSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:w-48 text-xs font-semibold">
                    <select 
                      value={filterReadiness} 
                      onChange={(e) => setFilterReadiness(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:border-red-500 focus:outline-none h-11"
                    >
                      <option value="all">Все доноры</option>
                      <option value="ready">Готовы к сдаче сейчас</option>
                      <option value="not_ready">Временно ограничены</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700 pt-2 border-t border-slate-200/60 items-center">
                  <span>Область группы:</span>
                  <div className="flex gap-2">
                    {['I_O', 'II_A', 'III_B', 'IV_AB'].map(bg => (
                      <label key={bg} className="flex items-center text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={filterBgs.includes(bg as any)}
                          onChange={(e) => {
                            if (e.target.checked) setFilterBgs([...filterBgs, bg as any]);
                            else setFilterBgs(filterBgs.filter(b => b !== bg));
                          }}
                          className="mr-1 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        {formatBloodGroup(bg as any)}
                      </label>
                    ))}
                  </div>

                  <span className="ml-2">Резус:</span>
                  <div className="flex gap-2">
                    {['positive', 'negative'].map(rh => (
                      <label key={rh} className="flex items-center text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={filterRhs.includes(rh as any)}
                          onChange={(e) => {
                            if (e.target.checked) setFilterRhs([...filterRhs, rh as any]);
                            else setFilterRhs(filterRhs.filter(r => r !== rh));
                          }}
                          className="mr-1 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        {rh === 'positive' ? 'Rh+' : 'Rh-'}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Donor results */}
              <div className="border rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="p-3 font-medium">ФИО</th>
                      <th className="p-3 font-medium">Группа и Резус</th>
                      <th className="p-3 font-medium">Последняя сдача</th>
                      <th className="p-3 font-medium">Тип</th>
                      <th className="p-3 font-medium">Всего сд.</th>
                      <th className="p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-650 text-slate-600">
                    {donorList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-900 font-semibold">{item.lastName} {item.firstName} {item.middleName}</td>
                        <td className="p-3">
                          <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                            {formatBloodGroup(item.bloodGroup)} {formatRhFactor(item.rhFactor)}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{item.lastDonationDate || 'Ни разу'}</td>
                        <td className="p-3 uppercase text-[10px] tracking-wider font-semibold text-slate-400">{item.lastDonationType || '—'}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.donationsCount}</td>
                        <td className="p-3">
                          <button 
                            onClick={() => loadDonorCard(item.id)}
                            className="p-1 text-red-600 hover:text-red-700 font-semibold text-[11px] inline-flex items-center"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Карта донора
                          </button>
                        </td>
                      </tr>
                    ))}
                    {donorList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-sm py-12 text-center text-slate-400">Свободные доноры по заданным фильтрам не найдены.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MENU 3: PENDING APPLICATIONS */}
      {activeMenu === 'pending' && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Заявки доноров на подтверждение</h3>
            <p className="text-xs text-slate-500">Здесь отображаются кандидаты, которые зарегистрировались самостоятельно или направили запрос на привязку к вашему центру.</p>
          </div>

          <div className="space-y-3.5">
            {pendingTies.map(item => (
              <div key={item.link.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{item.donor.lastName} {item.donor.firstName} {item.donor.middleName}</h4>
                    {item.link.resubmissionCount > 0 && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Повторная подача ({item.link.resubmissionCount})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 font-light">
                    <p>Медицинские: <strong className="font-semibold text-red-700">{formatBloodGroup(item.donor.bloodGroup)} {formatRhFactor(item.donor.rhFactor)}</strong> (Вес: {item.donor.weight} кг, ДР: {new Date(item.donor.birthDate).toLocaleDateString('ru-RU')})</p>
                    <p>Связь: Телефон — {item.donor.phone} | Дата отправки заявки: {item.link.resubmittedAt ? new Date(item.link.resubmittedAt).toLocaleDateString('ru-RU') : new Date(item.link.createdAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleConfirmPending(item.link.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-xs"
                  >
                    <Check className="w-4 h-4 mr-1" /> Одобрить анкету
                  </button>
                  <button 
                    onClick={() => { setRejectionModalLinkId(item.link.id); setRejectionReason(''); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" /> Отклонить
                  </button>
                </div>
              </div>
            ))}
            {pendingTies.length === 0 && (
              <p className="text-sm text-slate-500 py-12 text-center bg-white border rounded-2xl">Новые обращения в регистратуру отсутствуют.</p>
            )}
          </div>
        </div>
      )}

      {/* MENU 4: ALERTOR SEND MASS EMAILS/PUSH/SMS */}
      {activeMenu === 'notify' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form alert settings rules */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Сверхманевренный АЛЕРТОР оповещений доноров</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">Таргетированная рассылка для закрытия оперативных дефицитов крови.</p>
            </div>

            {notifySuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed font-sans whitespace-pre-wrap">
                {notifySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Target blood selection */}
                <div className="space-y-1.5 text-xs text-slate-700 font-semibold border-b sm:border-b-0 pb-3 sm:pb-0">
                  <label>Группа крови (целевой дефицит):</label>
                  <div className="space-y-1 pt-1 font-medium">
                    {['I_O', 'II_A', 'III_B', 'IV_AB'].map(bg => (
                      <label key={bg} className="flex items-center text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={notifyForm.bloodGroups.includes(bg as any)}
                          onChange={(e) => {
                            if (e.target.checked) setNotifyForm({ ...notifyForm, bloodGroups: [...notifyForm.bloodGroups, bg as any] });
                            else setNotifyForm({ ...notifyForm, bloodGroups: notifyForm.bloodGroups.filter(b => b !== bg) });
                          }}
                          className="mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        {formatBloodGroup(bg as any)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Резус-фактор:</label>
                    <select 
                      value={notifyForm.rhFactor} 
                      onChange={(e) => setNotifyForm({...notifyForm, rhFactor: e.target.value})}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="both">Любой резус-фактор (+/-)</option>
                      <option value="positive">Только положительный (Rh+)</option>
                      <option value="negative">Только отрицательный (Rh-)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Минимальный срок с последней сдачи (дней):</label>
                    <input 
                      type="number" 
                      value={notifyForm.minDaysSinceDonation}
                      onChange={(e) => setNotifyForm({...notifyForm, minDaysSinceDonation: e.target.value})}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <label className="flex items-start text-xs text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifyForm.excludeMedical}
                    onChange={(e) => setNotifyForm({...notifyForm, excludeMedical: e.target.checked})}
                    className="mr-2 rounded text-red-605 text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">Исключить активные медотводы</span>
                    <span className="text-[10px] text-slate-450 block text-slate-400">Система не побеспокоит доноров под запретом врача</span>
                  </div>
                </label>

                <label className="flex items-start text-xs text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifyForm.excludePause}
                    onChange={(e) => setNotifyForm({...notifyForm, excludePause: e.target.checked})}
                    className="mr-2 rounded text-red-605 text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">Учитывать личные паузы доноров</span>
                    <span className="text-[10px] text-slate-450 block text-slate-400">Не отправлять тем, кто взял каникулы по учебе/отпуску</span>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5 border-t pt-4 text-xs font-semibold">
                <label>Предпочтительный канал доставки рассылки:</label>
                <div className="flex flex-wrap gap-4 pt-1 font-medium">
                  {[
                    { id: 'all', label: 'Все три канала (Push + SMS + Email)' },
                    { id: 'push_sms', label: 'Push + SMS' },
                    { id: 'push', label: 'Только Push-уведомления' },
                    { id: 'sms', label: 'Только сотовые SMS' },
                    { id: 'email', label: 'Только письма на E-mail' }
                  ].map(chan => (
                    <label key={chan.id} className="flex items-center text-xs cursor-pointer font-semibold text-slate-700">
                      <input 
                        type="radio" 
                        name="chanRadios" 
                        checked={notifyForm.channel === chan.id}
                        onChange={() => setNotifyForm({...notifyForm, channel: chan.id})}
                        className="mr-1.5 text-red-600 focus:ring-red-500"
                      />
                      {chan.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-slate-700">Текст извещения донорам (до 160 симв. для SMS):</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => loadTemplate('urgent_color')} className="text-red-700 hover:underline font-semibold text-[10px]">Шаблон: Дефицит крови</button>
                    <button type="button" onClick={() => loadTemplate('plasma_call')} className="text-[10px] text-slate-500 hover:underline">Шаблон: Аферез плазмы</button>
                  </div>
                </div>
                <textarea 
                  required
                  value={notifyForm.messageText}
                  onChange={(e) => setNotifyForm({...notifyForm, messageText: e.target.value.substring(0, 500)})}
                  placeholder="Донор-Алерт: Требуется срочное пополнение первой отрицательной..."
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* LIVE RECIPIENT COUNT INDICATOR */}
              <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-red-850 text-red-800">
                  Рассылка будет отправлена строго:
                </span>
                <span className="bg-red-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full">
                  {notifyPreviewCount} подходящим донорам РНПЦ
                </span>
              </div>

              <button 
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <Send className="w-5 h-5" /> ОТПРАВИТЬ СИГНАЛ БЕДСТВИЯ
              </button>

            </form>
          </div>

          {/* Right sidebar: Alerts logs history */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Журнал отправленных алертов</h3>
            <p className="text-xs text-slate-500">История рассылок координатора с показателями доставленных уведомлений донорам:</p>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {notifHistory.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 border rounded-xl space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-slate-400">
                    <span>Телеметрия #{item.id}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <p className="font-semibold text-slate-850 text-slate-800 italic leading-snug">« {item.messageText} »</p>
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 text-center text-[10px] gap-1 font-semibold text-slate-500">
                    <div>
                      <span className="block text-red-700 font-bold">{item.pushSent} / {item.recipientsCount}</span>
                      <span>Push</span>
                    </div>
                    <div>
                      <span className="block text-red-700 font-bold">{item.smsSent} / {item.recipientsCount}</span>
                      <span>SMS</span>
                    </div>
                    <div>
                      <span className="block text-red-700 font-bold">{item.emailSent} / {item.recipientsCount}</span>
                      <span>Email</span>
                    </div>
                  </div>
                </div>
              ))}
              {notifHistory.length === 0 && (
                <p className="text-xs text-slate-450 py-12 text-center text-slate-400">В этом месяце рассылок дефицита не проводилось.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENU 5: NEWS CRUD */}
      {activeMenu === 'news' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Доска объявлений и новостей филиала</h3>
              <p className="text-xs text-slate-500">Эти публикации видны всем гостям и донорам на общей публичной странице проекта.</p>
            </div>
            <button 
              onClick={() => {
                setEditingNews(null);
                setNewsForm({ title: '', content: '', isPublished: true });
                setShowNewsModal(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Опубликовать новость
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsList.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-250 border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span>Новость #{item.id}</span>
                    <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ru-RU') : 'Проект'}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap mb-6 truncate max-h-24">{item.content}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-650'}`}>
                    {item.isPublished ? 'Опубликовано' : 'Черновик'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingNews(item);
                        setNewsForm({ title: item.title, content: item.content, isPublished: item.isPublished });
                        setShowNewsModal(true);
                      }}
                      className="text-xs font-semibold text-slate-700 hover:underline"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => handleNewsDelete(item.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FLOATING DIALOGS & MODAL FORMS --- */}

      {/* REJECTION REASON INPUT FORM MODAL */}
      {rejectionModalLinkId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Причина отклонения заявки</h4>
            <p className="text-xs text-slate-500 mb-4">Укажите развернутую медицинскую или координационную причину отклонения. Донор увидит ее в своем профиле и сможет исправить анкету.</p>
            <form onSubmit={handleRejectPendingSubmit} className="space-y-4">
              <textarea 
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Пример: В вашей выписке отсутствует подпись терапевта..."
                rows={3}
                className="w-full px-3 py-2 text-xs border rounded-xl focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setRejectionModalLinkId(null)}
                  className="w-1/3 bg-slate-150 bg-slate-100 text-xs font-semibold rounded-xl"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="w-2/3 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl"
                >
                  Отклонить заявку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DONATION FOR DONOR CARD PANEL */}
      {showAddDonationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowAddDonationModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-4">Запись о совершенной донации</h4>
            <form onSubmit={handleAddDonation} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Дата процедуры:</label>
                <input 
                  type="date"
                  required
                  value={donationForm.donationDate}
                  onChange={(e) => setDonationForm({ ...donationForm, donationDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Тип заготовки:</label>
                <select 
                  required
                  value={donationForm.donationType}
                  onChange={(e) => setDonationForm({ ...donationForm, donationType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white font-medium"
                >
                  <option value="blood">Цельная кровь (стандарт)</option>
                  <option value="plasma">Плазма (Аферез)</option>
                  <option value="platelets">Тромбоциты (Аферез)</option>
                  <option value="granulocytes">Гранулоциты</option>
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Объем в мл (опционально):</label>
                <input 
                  type="number"
                  value={donationForm.volumeMl}
                  onChange={(e) => setDonationForm({ ...donationForm, volumeMl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Внутренний комментарий:</label>
                <textarea 
                  value={donationForm.note}
                  onChange={(e) => setDonationForm({ ...donationForm, note: e.target.value })}
                  placeholder="Процедура без осложнений, самочувствие удовлетворительное"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs">
                Записать в базу и пересчитать сроки
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEDICAL RESTRICTION FORM MODAL */}
      {showAddMedicalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowAddMedicalModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-4">Наложение медицинского отвода</h4>
            <form onSubmit={handleAddMedical} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Причина ограничения:</label>
                <textarea 
                  required
                  value={medicalForm.reason}
                  onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                  placeholder="Отклонение в клиническом анализе крови, ОРВИ, татуировка..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Дата начала отвода:</label>
                <input 
                  type="date"
                  required
                  value={medicalForm.startDate}
                  onChange={(e) => setMedicalForm({ ...medicalForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 cursor-pointer">
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    checked={medicalForm.isPermanent}
                    onChange={(e) => setMedicalForm({ ...medicalForm, isPermanent: e.target.checked })}
                    className="mr-2 rounded text-red-650"
                  />
                  <strong>Установить пожизненный (бессрочный)</strong>
                </label>
              </div>

              {!medicalForm.isPermanent && (
                <div className="space-y-1 text-xs">
                  <label className="font-semibold block">Дата окончания ограничения:</label>
                  <input 
                    type="date"
                    required
                    value={medicalForm.endDate}
                    onChange={(e) => setMedicalForm({ ...medicalForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
              )}

              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">
                Накладывать медотвод
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHADCN-LIKE USER INPUT NEWS ADD DIALOG */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowNewsModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-4">Публикация новости на главную</h4>
            <form onSubmit={handleNewsSubmit} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Заголовок новости:</label>
                <input 
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Текст новости:</label>
                <textarea 
                  required
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <label className="flex items-center text-xs font-semibold cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newsForm.isPublished}
                  onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
                  className="mr-2"
                />
                Опубликовать сразу
              </label>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs">
                Сохранить публикацию
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL REGISTER DONOR MODAL */}
      {showManualRegModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowManualRegModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-2">Занести донора в реестр переливания</h4>
            <p className="text-xs text-slate-500 mb-4">Данное действие создаст учетную запись донора. Ему на e-mail будет выслана ссылка для входа и временный пароль.</p>
            
            {manualError && <p className="p-2 border border-red-100 rounded-lg bg-red-50 text-red-700 text-xs mt-1 mb-2.5">{manualError}</p>}
            
            <form onSubmit={handleManualReg} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Фамилия <span className="text-red-500">*</span></label>
                  <input type="text" required value={manualForm.lastName} onChange={(e) => setManualForm({...manualForm, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Имя <span className="text-red-500">*</span></label>
                  <input type="text" required value={manualForm.firstName} onChange={(e) => setManualForm({...manualForm, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold">Отчество</label>
                <input type="text" value={manualForm.middleName} onChange={(e) => setManualForm({...manualForm, middleName: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-normal" />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Дата рождения <span className="text-red-500">*</span></label>
                  <input type="date" required value={manualForm.birthDate} onChange={(e) => setManualForm({...manualForm, birthDate: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Пол <span className="text-red-500">*</span></label>
                  <select value={manualForm.gender} onChange={(e) => setManualForm({...manualForm, gender: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl bg-white">
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="col-span-2 space-y-1 text-xs">
                  <label className="font-semibold">Группа крови <span className="text-red-500">*</span></label>
                  <select value={manualForm.bloodGroup} onChange={(e) => setManualForm({...manualForm, bloodGroup: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl bg-white font-medium">
                    <option value="I_O">I (O) — Первая</option>
                    <option value="II_A">II (A) — Вторая</option>
                    <option value="III_B">III (B) — Третья</option>
                    <option value="IV_AB">IV (AB) — Четвертая</option>
                  </select>
                </div>
                <div className="space-y-1 text-xs">
                  <label className="font-semibold">Резус <span className="text-red-500">*</span></label>
                  <select value={manualForm.rhFactor} onChange={(e) => setManualForm({...manualForm, rhFactor: e.target.value as any})} className="w-full px-3 py-2 border rounded-xl bg-white font-medium">
                    <option value="positive">Rh+</option>
                    <option value="negative">Rh-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold">Вес донора в кг <span className="text-red-500">*</span></label>
                <input type="number" required value={manualForm.weight} onChange={(e) => setManualForm({...manualForm, weight: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-medium" />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold">Номер мобильного телефона <span className="text-red-500">*</span></label>
                <input type="text" required value={manualForm.phone} onChange={(e) => setManualForm({...manualForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-medium" />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold">Рабочий E-Mail <span className="text-red-500">*</span></label>
                <input type="email" required value={manualForm.email} onChange={(e) => setManualForm({...manualForm, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-slate-800" />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold">Временный пароль для входа:</label>
                <input type="text" required value={manualForm.password} onChange={(e) => setManualForm({...manualForm, password: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-mono text-xs font-semibold text-red-700 bg-red-50" />
              </div>

              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl hover:shadow duration-150 text-xs">
                Создать профиль донора (Подтвержден на месте)
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
