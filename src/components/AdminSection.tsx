import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  MapPin, 
  Activity, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  AlertTriangle,
  RefreshCw,
  Sliders,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { User, BloodCenter, Donor, Donation, MedicalNote } from '../types';

interface AdminSectionProps {
  token: string;
  t: (key: string) => string;
}

type AdminTab = 'users' | 'centers' | 'donors' | 'donations' | 'news' | 'holds';

export default function AdminSection({ token, t }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [medicalNotes, setMedicalNotes] = useState<MedicalNote[]>([]);
  const [news, setNews] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal controls
  const [editingEntity, setEditingEntity] = useState<{ type: AdminTab; data: any } | null>(null);
  const [isAdding, setIsAdding] = useState<AdminTab | null>(null);

  // New forms states (fully controlled)
  const [newUser, setNewUser] = useState({ 
    email: '', 
    password: '', 
    role: 'donor' as any, 
    isActive: true, 
    centerId: '' 
  });
  
  const [newCenter, setNewCenter] = useState({ 
    name: '', 
    address: '', 
    phone: '', 
    email: '', 
    workingHours: '', 
    mapLink: '', 
    eRegistrationLink: '' 
  });

  const [newDonor, setNewDonor] = useState({
    userId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    gender: 'male' as any,
    bloodGroup: 'I_O' as any,
    rhFactor: 'positive' as any,
    weight: 70,
    phone: '',
    status: 'active' as any,
    donationsCount: 0,
    bloodDonationsCount: 0,
    personalPause: false
  });

  const [newDonation, setNewDonation] = useState({ 
    donorId: '', 
    centerId: '', 
    donationDate: new Date().toISOString().split('T')[0], 
    donationType: 'blood', 
    isPaid: false, 
    volumeMl: 450, 
    note: '' 
  });

  const [newNews, setNewNews] = useState({ 
    centerId: '', 
    title: '', 
    content: '', 
    isPublished: true 
  });

  const [newHold, setNewHold] = useState({ 
    donorId: '', 
    centerId: '',
    reason: '', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: '', 
    isActive: true 
  });

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/all-data', {
        headers: { 'Authorization': token }
      });
      if (!res.ok) {
        throw new Error(t('Не удалось загрузить системные данные'));
      }
      const data = await res.json();
      setUsers(data.users || []);
      setCenters(data.centers || []);
      setDonors(data.donors || []);
      setDonations(data.donations || []);
      setMedicalNotes(data.medicalNotes || []);
      setNews(data.news || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDeleteEntity = async (entityName: string, id: number) => {
    if (!window.confirm(t('Вы уверены, что хотите удалить эту запись?'))) return;
    try {
      const res = await fetch('/api/admin/delete-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ entityName, id })
      });
      if (res.ok) {
        showSuccess(t('Запись удалена'));
        loadAllData();
      } else {
        const data = await res.json();
        alert(data.error || 'Deletion failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleUpdateEntity = async (entityName: string, entity: any) => {
    try {
      const res = await fetch('/api/admin/update-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ entityName, entity })
      });
      if (res.ok) {
        showSuccess(t('Данные синхронизированы в базе данных'));
        setEditingEntity(null);
        setIsAdding(null);
        loadAllData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save entity');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  // Create Submissions
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) return alert(t('Заполните логин и пароль'));
    handleUpdateEntity('users', {
      email: newUser.email.toLowerCase().trim(),
      password: newUser.password,
      role: newUser.role,
      centerId: newUser.centerId ? parseInt(newUser.centerId) : null,
      isActive: newUser.isActive,
      createdAt: new Date().toISOString()
    });
  };

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCenter.name || !newCenter.address || !newCenter.phone) return alert(t('Название, адрес и телефон обязательны'));
    handleUpdateEntity('centers', { ...newCenter, createdAt: new Date().toISOString() });
  };

  const handleCreateDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonor.lastName || !newDonor.firstName || !newDonor.phone || !newDonor.userId) {
      return alert(t('Укажите ID аккаунта пользователя, ФИО и телефон'));
    }
    handleUpdateEntity('donors', {
      ...newDonor,
      userId: parseInt(newDonor.userId),
      weight: parseFloat(String(newDonor.weight)) || 70,
      donationsCount: parseInt(String(newDonor.donationsCount)) || 0,
      bloodDonationsCount: parseInt(String(newDonor.bloodDonationsCount)) || 0,
      createdAt: new Date().toISOString()
    });
  };

  const handleCreateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.donorId || !newDonation.centerId) return alert(t('Выберите донора и медицинский центр'));
    handleUpdateEntity('donations', {
      donorId: parseInt(newDonation.donorId),
      centerId: parseInt(newDonation.centerId),
      donationDate: newDonation.donationDate,
      donationType: newDonation.donationType,
      isPaid: newDonation.isPaid,
      volumeMl: parseInt(String(newDonation.volumeMl)) || 450,
      note: newDonation.note,
      createdAt: new Date().toISOString()
    });
  };

  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return alert(t('Заполните заголовок и содержание'));
    handleUpdateEntity('news', {
      centerId: newNews.centerId ? parseInt(newNews.centerId) : 1,
      title: newNews.title,
      content: newNews.content,
      isPublished: newNews.isPublished,
      publishedAt: newNews.isPublished ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    });
  };

  const handleCreateHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHold.donorId || !newHold.reason || !newHold.centerId) return alert(t('Заполните обязательные поля'));
    handleUpdateEntity('medicalNotes', {
      donorId: parseInt(newHold.donorId),
      centerId: parseInt(newHold.centerId),
      createdBy: 99,
      reason: newHold.reason,
      startDate: newHold.startDate,
      endDate: newHold.endDate || null,
      isActive: newHold.isActive,
      createdAt: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mb-3" />
        <span className="text-slate-500 text-xs font-mono">{t('Синхронизация таблиц...')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" id="admin-main-container">
      
      {/* Header Panel */}
      <div className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse-slow"></div>
          <div>
            <h1 className="font-sans font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">
              {t('Системный администратор')}
            </h1>
            <p className="text-[11px] text-slate-450 dark:text-slate-500 font-mono mt-1">
              {t('Прямой доступ к реляционной базе данных')}
            </p>
          </div>
        </div>

        <button 
          onClick={loadAllData}
          title={t('Обновить данные')}
          className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition duration-150"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-rose-50/70 border border-rose-100 text-rose-700 text-xs py-2 px-3 rounded-xl mb-4 flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50/70 border border-emerald-100 text-emerald-700 text-[11px] py-1.5 px-3 rounded-lg mb-4 flex items-center gap-2 font-mono">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs list (Sleek counters, Swiss style) */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900/60 p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-850">
        {[
          { tabId: 'users', label: t('Пользователи'), count: users.length, icon: Users },
          { tabId: 'centers', label: t('Центры крови'), count: centers.length, icon: MapPin },
          { tabId: 'donors', label: t('Доноры'), count: donors.length, icon: Activity },
          { tabId: 'donations', label: t('Донации'), count: donations.length, icon: Calendar },
          { tabId: 'news', label: t('Новости'), count: news.length, icon: FileText },
          { tabId: 'holds', label: t('Медотводы'), count: medicalNotes.length, icon: AlertTriangle }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.tabId;
          return (
            <button
              key={item.tabId}
              onClick={() => { setActiveTab(item.tabId as AdminTab); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${isActive ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500'}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Core Table Actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder={t('Поиск...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-250/70 dark:border-slate-800 rounded-lg text-xs focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400/90"
          />
        </div>

        <button 
          onClick={() => setIsAdding(activeTab)} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('Добавить')}</span>
        </button>
      </div>

      {/* CORE DATA TABLES */}
      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl shadow-xs overflow-hidden">
        
        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('E-mail')}</th>
                  <th className="px-4 py-3">{t('Роль')}</th>
                  <th className="px-4 py-3">{t('Активен')}</th>
                  <th className="px-4 py-3">{t('Центр')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {users
                  .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(user => {
                    const center = centers.find(c => c.id === user.centerId);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="px-4 py-3 font-mono text-slate-400">#{user.id}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            user.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/25 dark:text-amber-400' :
                            user.role === 'center' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/25 dark:text-indigo-400' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400'
                          }`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${user.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {user.isActive ? t('Активен') : t('Лок')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 max-w-xs truncate">
                          {user.role === 'center' ? (center ? center.name : `Center #${user.centerId}`) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button 
                            onClick={() => setEditingEntity({ type: 'users', data: user })}
                            className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntity('users', user.id)}
                            className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- CENTERS TAB --- */}
        {activeTab === 'centers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('Название')}</th>
                  <th className="px-4 py-3">{t('Адрес')}</th>
                  <th className="px-4 py-3">{t('Телефон')}</th>
                  <th className="px-4 py-3">{t('E-mail')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {centers
                  .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.address.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(center => (
                    <tr key={center.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-mono text-slate-400">#{center.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{center.name}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{center.address}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{center.phone}</td>
                      <td className="px-4 py-3 text-slate-500">{center.email || '-'}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button 
                          onClick={() => setEditingEntity({ type: 'centers', data: center })}
                          className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEntity('centers', center.id)}
                          className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- DONORS TAB --- */}
        {activeTab === 'donors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('ФИО')}</th>
                  <th className="px-4 py-3">{t('Группа & Rh')}</th>
                  <th className="px-4 py-3">{t('Телефон')}</th>
                  <th className="px-4 py-3">{t('Донации')}</th>
                  <th className="px-4 py-3">{t('Вес')}</th>
                  <th className="px-4 py-3">{t('Статус')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {donors
                  .filter(d => `${d.lastName} ${d.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery))
                  .map(donor => (
                    <tr key={donor.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-mono text-slate-400">#{donor.id} (User: #{donor.userId})</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {donor.lastName} {donor.firstName}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {donor.bloodGroup.replace('I_O','O(I)').replace('II_A','A(II)').replace('III_B','B(III)').replace('IV_AB','AB(IV)')}{' '}
                        {donor.rhFactor === 'positive' ? 'Rh+' : 'Rh-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{donor.phone}</td>
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        {donor.donationsCount || 0} <span className="text-slate-400 font-normal">({donor.bloodDonationsCount || 0})</span>
                      </td>
                      <td className="px-4 py-3 font-mono">{donor.weight} кг</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          donor.status === 'active' ? 'bg-emerald-55/10 text-emerald-600' : 'bg-slate-100 text-slate-550 dark:bg-slate-800'
                        }`}>
                          {donor.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button 
                          onClick={() => setEditingEntity({ type: 'donors', data: donor })}
                          className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEntity('donors', donor.id)}
                          className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- DONATIONS TAB --- */}
        {activeTab === 'donations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('Донор')}</th>
                  <th className="px-4 py-3">{t('Центр забора')}</th>
                  <th className="px-4 py-3">{t('Дата')}</th>
                  <th className="px-4 py-3">{t('Тип')}</th>
                  <th className="px-4 py-3 font-mono">Ml</th>
                  <th className="px-4 py-3">{t('Компенсация')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {donations
                  .sort((a,b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime())
                  .map(donation => {
                    const donor = donors.find(d => d.id === donation.donorId);
                    const center = centers.find(c => c.id === donation.centerId);
                    return (
                      <tr key={donation.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="px-4 py-3 font-mono text-slate-400">#{donation.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {donor ? `${donor.lastName} ${donor.firstName[0]}.` : `Donor #${donation.donorId}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">
                          {center ? center.name : `Center #${donation.centerId}`}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">{donation.donationDate}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {donation.donationType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold font-mono">{donation.volumeMl}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[10px] font-bold ${donation.isPaid ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {donation.isPaid ? t('Платная') : t('Безвозд')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <button 
                            onClick={() => setEditingEntity({ type: 'donations', data: donation })}
                            className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEntity('donations', donation.id)}
                            className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- NEWS TAB --- */}
        {activeTab === 'news' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('Заголовок')}</th>
                  <th className="px-4 py-3">{t('Медицинский центр')}</th>
                  <th className="px-4 py-3">{t('Статус')}</th>
                  <th className="px-4 py-3 font-mono">{t('Дата')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {news.map(post => {
                  const center = centers.find(c => c.id === post.centerId);
                  return (
                    <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-mono text-slate-400">#{post.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200 max-w-sm truncate">{post.title}</td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">
                        {center ? center.name : t('Глобальная')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${post.isPublished ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-slate-100 text-slate-500'}`}>
                          {post.isPublished ? t('Опубл') : t('Черновик')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button 
                          onClick={() => setEditingEntity({ type: 'news', data: post })}
                          className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEntity('news', post.id)}
                          className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- HOLDS / ACTIONS TAB --- */}
        {activeTab === 'holds' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">{t('Донор')}</th>
                  <th className="px-4 py-3">{t('Причина')}</th>
                  <th className="px-4 py-3 font-mono">{t('Начало')}</th>
                  <th className="px-4 py-3 font-mono">{t('Конец')}</th>
                  <th className="px-4 py-3">{t('Статус')}</th>
                  <th className="px-4 py-3 text-right">{t('Правка')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {medicalNotes.map(note => {
                  const donor = donors.find(d => d.id === note.donorId);
                  return (
                    <tr key={note.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 font-mono text-slate-400">#{note.id}</td>
                      <td className="px-4 py-3 font-semibold">
                        {donor ? `${donor.lastName} ${donor.firstName}` : `Donor #${note.donorId}`}
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-sm">{note.reason}</td>
                      <td className="px-4 py-3 font-mono text-slate-505 text-[11px]">{note.startDate}</td>
                      <td className="px-4 py-3 font-mono text-slate-505 text-[11px]">{note.endDate || t('Бессрочно')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${note.isActive ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' : 'bg-slate-100 text-slate-500'}`}>
                          {note.isActive ? t('Активен') : t('Снят')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button 
                          onClick={() => setEditingEntity({ type: 'holds', data: note })}
                          className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEntity('medicalNotes', note.id)}
                          className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD SLIDE-OVER/MODAL FORMS (COMPACT, LIGHTWEIGHT) --- */}
      
      {/* Add Entity Modal container */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-5 rounded-xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-850 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-900">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-rose-600" />
                <span>{t('Добавить новую запись')} : {isAdding.toUpperCase()}</span>
              </h3>
              <button onClick={() => setIsAdding(null)} className="text-slate-450 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {/* 1. Add User Form */}
            {isAdding === 'users' && (
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('E-mail адрес')}</label>
                  <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="user@domain.by" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Классический пароль')}</label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Уровень доступа')}</label>
                  <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="donor">{t('Донор')}</option>
                    <option value="center">{t('Координатор клиники')}</option>
                    <option value="admin">{t('Системный администратор')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Связать с центром забора ID')}</label>
                  <select value={newUser.centerId} onChange={e => setNewUser({...newUser, centerId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">{t('Не связано (Все центры / Глобальный)')}</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input id="add-user-act" type="checkbox" checked={newUser.isActive} onChange={e => setNewUser({...newUser, isActive: e.target.checked})} className="rounded text-rose-650" />
                  <label htmlFor="add-user-act" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('Разрешить вход в личный аккаунт')}</label>
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Создать аккаунт')}</button>
              </form>
            )}

            {/* 2. Add Center Form */}
            {isAdding === 'centers' && (
              <form onSubmit={handleCreateCenter} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Полное наименование')}</label>
                  <input required type="text" value={newCenter.name} onChange={e => setNewCenter({...newCenter, name: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="РНПЦ трансфузиологии" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Юридический адрес')}</label>
                  <input required type="text" value={newCenter.address} onChange={e => setNewCenter({...newCenter, address: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="г. Минск, Долгиновский тракт" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Телефон регистратуры')}</label>
                  <input required type="text" value={newCenter.phone} onChange={e => setNewCenter({...newCenter, phone: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="+375 (...)" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('E-mail службы клиники')} ({t('необязательно')})</label>
                  <input type="email" value={newCenter.email} onChange={e => setNewCenter({...newCenter, email: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Рабочие часы')}</label>
                  <input type="text" value={newCenter.workingHours} onChange={e => setNewCenter({...newCenter, workingHours: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="Пн-Пт: 08:00 - 15:00" />
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Зарегистрировать клинику')}</button>
              </form>
            )}

            {/* 3. Add Donor Form */}
            {isAdding === 'donors' && (
              <form onSubmit={handleCreateDonor} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Привязать к аккаунту пользователя')}</label>
                  <select required value={newDonor.userId} onChange={e => setNewDonor({...newDonor, userId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Выберите аккаунт')} --</option>
                    {users.filter(u => u.role === 'donor').map(u => (
                      <option key={u.id} value={u.id}>{u.email} (#{u.id})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Фамилия')}</label>
                    <input required type="text" value={newDonor.lastName} onChange={e => setNewDonor({...newDonor, lastName: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Имя')}</label>
                    <input required type="text" value={newDonor.firstName} onChange={e => setNewDonor({...newDonor, firstName: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Телефон владельца')}</label>
                  <input required type="text" value={newDonor.phone} onChange={e => setNewDonor({...newDonor, phone: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="+375 (...)" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Группа крови')}</label>
                    <select value={newDonor.bloodGroup} onChange={e => setNewDonor({...newDonor, bloodGroup: e.target.value as any})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-905 rounded-lg">
                      <option value="I_O">O (I)</option>
                      <option value="II_A">A (II)</option>
                      <option value="III_B">B (III)</option>
                      <option value="IV_AB">AB (IV)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Резус-фактор')}</label>
                    <select value={newDonor.rhFactor} onChange={e => setNewDonor({...newDonor, rhFactor: e.target.value as any})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-905 rounded-lg">
                      <option value="positive">Rh+</option>
                      <option value="negative">Rh-</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Вес донора (кг)')}</label>
                    <input required type="number" value={newDonor.weight} onChange={e => setNewDonor({...newDonor, weight: parseInt(e.target.value) || 70})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата рождения')}</label>
                    <input required type="date" value={newDonor.birthDate} onChange={e => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setNewDonor({...newDonor, birthDate: val});
                    }} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 font-mono" />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Создать карточку донора')}</button>
              </form>
            )}

            {/* 4. Add Donation Form */}
            {isAdding === 'donations' && (
              <form onSubmit={handleCreateDonation} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Донор')}</label>
                  <select required value={newDonation.donorId} onChange={e => setNewDonation({...newDonation, donorId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Выберите донора')} --</option>
                    {donors.map(d => (
                      <option key={d.id} value={d.id}>[{d.bloodGroup.replace('I_O','O').replace('II_A','A')}] {d.lastName} {d.firstName} (#{d.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Медицинский центр')}</label>
                  <select required value={newDonation.centerId} onChange={e => setNewDonation({...newDonation, centerId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Выберите центр')} --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата забора')}</label>
                    <input required type="date" value={newDonation.donationDate} onChange={e => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setNewDonation({...newDonation, donationDate: val});
                    }} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono text-slate-550" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Объем (мл)')}</label>
                    <input required type="number" value={newDonation.volumeMl} onChange={e => setNewDonation({...newDonation, volumeMl: parseInt(e.target.value) || 450})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Тип забора')}</label>
                    <select value={newDonation.donationType} onChange={e => setNewDonation({...newDonation, donationType: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      <option value="blood">{t('Цельная кровь')}</option>
                      <option value="plasma">{t('Плазма')}</option>
                      <option value="platelets">{t('Тромбоциты')}</option>
                      <option value="granulocytes">{t('Гранулоциты')}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input id="add-don-p" type="checkbox" checked={newDonation.isPaid} onChange={e => setNewDonation({...newDonation, isPaid: e.target.checked})} className="rounded text-rose-650 font-bold" />
                    <label htmlFor="add-don-p" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('За плату (компенс)')}</label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Примечание/Комментарий')}</label>
                  <input type="text" value={newDonation.note} onChange={e => setNewDonation({...newDonation, note: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="Стандартный сеанс" />
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Зафиксировать донацию')}</button>
              </form>
            )}

            {/* 5. Add News Form */}
            {isAdding === 'news' && (
              <form onSubmit={handleCreateNews} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Заголовок новости / Срочной сводки')}</label>
                  <input required type="text" value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Основное содержание новости')}</label>
                  <textarea required rows={4} value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Привязать к медицинскому центру')}</label>
                  <select value={newNews.centerId} onChange={e => setNewNews({...newNews, centerId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Глобальная новость')} --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input id="add-news-p" type="checkbox" checked={newNews.isPublished} onChange={e => setNewNews({...newNews, isPublished: e.target.checked})} className="rounded text-rose-650" />
                  <label htmlFor="add-news-p" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('Опубликовать немедленно')}</label>
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Создать публикацию')}</button>
              </form>
            )}

            {/* 6. Add Medical Note Hold Form */}
            {isAdding === 'holds' && (
              <form onSubmit={handleCreateHold} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Донор')}</label>
                  <select required value={newHold.donorId} onChange={e => setNewHold({...newHold, donorId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Выберите донора')} --</option>
                    {donors.map(d => (
                      <option key={d.id} value={d.id}>{d.lastName} {d.firstName} (#{d.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Медицинский центр назначения')}</label>
                  <select required value={newHold.centerId} onChange={e => setNewHold({...newHold, centerId: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                    <option value="">-- {t('Выберите центр')} --</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Причина отстранения')}</label>
                  <input required type="text" value={newHold.reason} onChange={e => setNewHold({...newHold, reason: e.target.value})} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg" placeholder="Временная ОРВИ, татуировка..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата начала')}</label>
                    <input required type="date" value={newHold.startDate} onChange={e => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setNewHold({...newHold, startDate: val});
                    }} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-550 font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Окончание отвода')}</label>
                    <input type="date" value={newHold.endDate} onChange={e => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setNewHold({...newHold, endDate: val});
                    }} className="w-full px-3 py-1.5 text-xs bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-rose-550 font-mono" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input id="add-hold-act" type="checkbox" checked={newHold.isActive} onChange={e => setNewHold({...newHold, isActive: e.target.checked})} className="rounded text-rose-650" />
                  <label htmlFor="add-hold-act" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('Зафиксировать в качестве активного')}</label>
                </div>
                <button type="submit" className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3">{t('Наложить медотвод')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- FLOATING GENERAL DIRECT_EDIT ENTITY PANEL --- */}
      {editingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/45 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-5 rounded-xl w-full max-w-md shadow-2xl border border-rose-500/10 animate-scale-up">
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-900">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>{t('Редактирование')} : {editingEntity.type.toUpperCase()} #{editingEntity.data.id}</span>
              </h3>
              <button onClick={() => setEditingEntity(null)} className="text-slate-450 hover:text-slate-650"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3.5 py-1">
              
              {/* --- 1. USER DETAIL EDIT --- */}
              {editingEntity.type === 'users' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('E-mail адрес')}</label>
                    <input type="email" value={editingEntity.data.email} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, email: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Сбросить пароль')} ({t('напр. новый пароль')})</label>
                    <input type="password" placeholder={t('Оставьте пустым, чтобы не менять')} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, password: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Права доступа')}</label>
                    <select value={editingEntity.data.role} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, role: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      <option value="donor">{t('Донор')}</option>
                      <option value="center">{t('Координатор клиники')}</option>
                      <option value="admin">{t('Глобальный администратор')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Привязать к медицинскому центру ID')}</label>
                    <select value={editingEntity.data.centerId || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, centerId: e.target.value ? parseInt(e.target.value) : null } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      <option value="">{t('Не привязан ни к какому центру')}</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input id="edit-user-act" type="checkbox" checked={editingEntity.data.isActive} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, isActive: e.target.checked } })} className="rounded text-rose-600" />
                    <label htmlFor="edit-user-act" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('Этот аккаунт активен (Разрешить вход)')}</label>
                  </div>
                </div>
              )}

              {/* --- 2. CENTER DETAIL EDIT --- */}
              {editingEntity.type === 'centers' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Название медицинского центра')}</label>
                    <input type="text" value={editingEntity.data.name} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, name: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Адрес клиники')}</label>
                    <input type="text" value={editingEntity.data.address} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, address: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Телефон регистратуры')}</label>
                    <input type="text" value={editingEntity.data.phone} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, phone: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('E-mail службы клиники')}</label>
                    <input type="email" value={editingEntity.data.email || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, email: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Время приёма доноров')}</label>
                    <input type="text" value={editingEntity.data.workingHours || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, workingHours: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Ссылка на Картах')}</label>
                    <input type="text" value={editingEntity.data.mapLink || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, mapLink: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-[11px]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Ссылка на электронную запись')}</label>
                    <input type="text" value={editingEntity.data.eRegistrationLink || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, eRegistrationLink: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-[11px]" />
                  </div>
                </div>
              )}

              {/* --- 3. DONOR PROFILE EDIT (COMPREHENSIVE) --- */}
              {editingEntity.type === 'donors' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Фамилия')}</label>
                      <input type="text" value={editingEntity.data.lastName} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, lastName: e.target.value } })} className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Имя')}</label>
                      <input type="text" value={editingEntity.data.firstName} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, firstName: e.target.value } })} className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-semibold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Отчество')}</label>
                      <input type="text" value={editingEntity.data.middleName || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, middleName: e.target.value } })} className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Телефон владельца')}</label>
                      <input type="text" value={editingEntity.data.phone} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, phone: e.target.value } })} className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Группа крови')}</label>
                      <select value={editingEntity.data.bloodGroup} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, bloodGroup: e.target.value as any } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900">
                        <option value="I_O">O (I)</option>
                        <option value="II_A">A (II)</option>
                        <option value="III_B">B (III)</option>
                        <option value="IV_AB">AB (IV)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Резус-фактор')}</label>
                      <select value={editingEntity.data.rhFactor} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, rhFactor: e.target.value as any } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900">
                        <option value="positive">Rh+</option>
                        <option value="negative">Rh-</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Привязанный User ID')}</label>
                      <select value={editingEntity.data.userId} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, userId: parseInt(e.target.value) || 0 } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900">
                        {users.map(u => <option key={u.id} value={u.id}>{u.email} (#{u.id})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Пол')}</label>
                      <select value={editingEntity.data.gender} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, gender: e.target.value as any } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900">
                        <option value="male">{t('Мужской')}</option>
                        <option value="female">{t('Женский')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Вес')} (кг)</label>
                      <input type="number" value={editingEntity.data.weight} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, weight: parseFloat(e.target.value) || 60 } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900 font-mono text-[11px]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Всего донаций')}</label>
                      <input type="number" value={editingEntity.data.donationsCount} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, donationsCount: parseInt(e.target.value) || 0 } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900 font-mono text-[11px]" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Из них крови')}</label>
                      <input type="number" value={editingEntity.data.bloodDonationsCount} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, bloodDonationsCount: parseInt(e.target.value) || 0 } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900 font-mono text-[11px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата рождения')}</label>
                      <input type="date" value={editingEntity.data.birthDate} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, birthDate: e.target.value } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900 text-[11px] font-mono text-slate-550" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Статус активности')}</label>
                      <select value={editingEntity.data.status} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, status: e.target.value as any } })} className="w-full px-2 py-1 bg-slate-50 border rounded-lg dark:bg-slate-900">
                        <option value="active">{t('АКТИВНЫЙ')}</option>
                        <option value="inactive">{t('ПРИОСТАНОВЛЕН')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input id="edit-don-pause" type="checkbox" checked={editingEntity.data.personalPause} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, personalPause: e.target.checked } })} className="rounded text-rose-600" />
                    <label htmlFor="edit-don-pause" className="text-xs font-semibold text-rose-600">{t('Личная пауза донора (Заблокировать запросы)')}</label>
                  </div>
                </div>
              )}

              {/* --- 4. DONATION DIRECT EDIT --- */}
              {editingEntity.type === 'donations' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Донор')}</label>
                    <select value={editingEntity.data.donorId} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, donorId: parseInt(e.target.value) } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs">
                      {donors.map(d => (
                        <option key={d.id} value={d.id}>[{d.lastName}] {d.firstName} (#{d.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Медицинский центр')}</label>
                    <select value={editingEntity.data.centerId} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, centerId: parseInt(e.target.value) } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата забора')}</label>
                      <input type="date" value={editingEntity.data.donationDate} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, donationDate: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Объем забора (мл)')}</label>
                      <input type="number" value={editingEntity.data.volumeMl} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, volumeMl: parseInt(e.target.value) || 450 } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg font-mono text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Тип забора')}</label>
                      <select value={editingEntity.data.donationType} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, donationType: e.target.value as any } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                        <option value="blood">{t('Цельная кровь')}</option>
                        <option value="plasma">{t('Плазма')}</option>
                        <option value="platelets">{t('Тромбоциты')}</option>
                        <option value="granulocytes">{t('Гранулоциты')}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <input id="edit-don-is-paid" type="checkbox" checked={editingEntity.data.isPaid} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, isPaid: e.target.checked } })} className="rounded text-rose-650" />
                      <label htmlFor="edit-don-is-paid" className="text-xs font-semibold text-slate-600 dark:text-slate-350">{t('За плату (оплачена)')}</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Служебное примечание')}</label>
                    <input type="text" value={editingEntity.data.note || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, note: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                </div>
              )}

              {/* --- 5. NEWS DIRECT EDIT --- */}
              {editingEntity.type === 'news' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Заголовок статьи')}</label>
                    <input type="text" value={editingEntity.data.title} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, title: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Текстовое тело новости')}</label>
                    <textarea rows={5} value={editingEntity.data.content} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, content: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Опубликовано медицинским центром')}</label>
                    <select value={editingEntity.data.centerId || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, centerId: e.target.value ? parseInt(e.target.value) : null } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      <option value="">-- {t('Глобальная новость')} --</option>
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-1 font-semibold">
                    <input id="edit-news-is-pub" type="checkbox" checked={editingEntity.data.isPublished} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, isPublished: e.target.checked } })} className="rounded text-rose-600" />
                    <label htmlFor="edit-news-is-pub" className="text-xs text-slate-650">{t('Отображать в мобильной ленте доноров')}</label>
                  </div>
                </div>
              )}

              {/* --- 6. MEDICAL HOLDS DIRECT EDIT --- */}
              {editingEntity.type === 'holds' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Донор')}</label>
                    <select value={editingEntity.data.donorId} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, donorId: parseInt(e.target.value) } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs">
                      {donors.map(d => (
                        <option key={d.id} value={d.id}>{d.lastName} {d.firstName} (#{d.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Клиника')}</label>
                    <select value={editingEntity.data.centerId || 1} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, centerId: parseInt(e.target.value) } })} className="w-full px-3 py-1.5 bg-slate-5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg">
                      {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Официальный диагноз/причина')}</label>
                    <input type="text" value={editingEntity.data.reason} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, reason: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Дата наложения')}</label>
                      <input type="date" value={editingEntity.data.startDate} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, startDate: e.target.value } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-450 mb-1">{t('Медотвод действует до')}</label>
                      <input type="date" value={editingEntity.data.endDate || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, endDate: e.target.value ? e.target.value : null } })} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-rose-600 text-xs font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 font-semibold">
                    <input id="edit-hold-is-act" type="checkbox" checked={editingEntity.data.isActive} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, isActive: e.target.checked } })} className="rounded text-rose-600" />
                    <label htmlFor="edit-hold-is-act" className="text-xs text-slate-650">{t('Отвод является действующим в текущий момент')}</label>
                  </div>
                </div>
              )}

            </div>

            <div className="mt-5 flex justify-end gap-2 border-t pt-3 border-slate-100 dark:border-slate-900">
              <button 
                onClick={() => setEditingEntity(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 hover:text-slate-800 dark:text-slate-350 rounded-lg font-bold text-xs transition duration-150"
              >
                {t('Отмена')}
              </button>
              <button 
                onClick={() => handleUpdateEntity(editingEntity.type === 'holds' ? 'medicalNotes' : editingEntity.type, editingEntity.data)}
                className="px-4 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg font-bold text-xs shadow-xs transition duration-150"
              >
                {t('Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
