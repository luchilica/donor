import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../LanguageContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Activity, Users, Bell, FileText, Search, Plus, Calendar,
  Trash2, X, Check, Eye, ChevronRight, Send, HelpCircle, ShieldAlert,
  ArrowUp, ArrowDown, Edit3, Droplets, ChevronDown, Folder, FolderOpen
} from 'lucide-react';
import { 
  BloodCenter, Donor, DonorCenter, Donation, MedicalNote, 
  Notification, News, BloodGroup, RhFactor, DonationType, DonorStatus, formatBloodGroup, formatRhFactor 
} from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { CenterStatsDashboard } from './CenterStatsDashboard';

const formatDateHuman = (dateInput: any): string => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const CenterAccordionItem = ({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`mb-3.5 rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-slate-200 shadow-md' : 'border-slate-100/70 hover:border-slate-200 shadow-sm'}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-5 py-4 transition-all duration-300 ${isOpen ? 'bg-gradient-to-r from-red-50/20 to-white' : 'bg-white hover:bg-slate-50'}`}
      >
        <span className={`font-bold text-xs uppercase tracking-wider text-left transition-colors ${isOpen ? 'text-red-800' : 'text-slate-800'}`}>
          {title}
        </span>
        <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'bg-red-50 text-red-650 rotate-90' : 'bg-slate-50 text-slate-500'}`}>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="p-5 bg-white border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CenterSectionProps {
  center: BloodCenter;
  onRefresh: () => void;
  apiBase: string;
  token: string;
}

export default function CenterSection({ center, onRefresh, apiBase, token }: CenterSectionProps) {
  const { t } = useLanguage();

  const [activeMenu, setActiveMenu] = useState<'stats' | 'donors' | 'pending' | 'appointments' | 'notify' | 'news' | 'needs'>('stats');
  
  // Dashboard states
  const [appointments, setAppointments] = useState<any[]>([]);
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
  const [newsForm, setNewsForm] = useState({ title: '', content: '', isPublished: true, publishedAt: new Date().toISOString().split('T')[0] });
  const [newsStatusFilter, setNewsStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [newsDateFilter, setNewsDateFilter] = useState<string>('');

  // Needs state
  const [needsForm, setNeedsForm] = useState(
    center?.bloodNeeds || {
      I_pos: 100, I_neg: 100, II_pos: 100, II_neg: 100,
      III_pos: 100, III_neg: 100, IV_pos: 100, IV_neg: 100
    }
  );
  const [needsSaving, setNeedsSaving] = useState(false);
  const [needsSuccess, setNeedsSuccess] = useState(false);

  // Notifications state list
  const [notifHistory, setNotifHistory] = useState<Notification[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Donors query filters
  const [donorSearch, setDonorSearch] = useState('');
  const [filterBgs, setFilterBgs] = useState<BloodGroup[]>([]);
  const [filterRhs, setFilterRhs] = useState<RhFactor[]>([]);
  const [filterReadiness, setFilterReadiness] = useState<string>('all'); // all, ready, not_ready
  const [donorList, setDonorList] = useState<Donor[]>([]);
  const [donorSortField, setDonorSortField] = useState<'lastName' | 'bloodGroup' | 'lastDonation' | 'donationsCount'>('lastName');
  const [donorSortOrder, setDonorSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedDonorList = useMemo(() => {
    return [...donorList].sort((a, b) => {
      let comparison = 0;
      if (donorSortField === 'lastName') {
        comparison = a.lastName.localeCompare(b.lastName, 'ru');
      } else if (donorSortField === 'bloodGroup') {
        const bgOrder: Record<string, number> = { 'I_O': 1, 'II_A': 2, 'III_B': 3, 'IV_AB': 4 };
        const bgA = bgOrder[a.bloodGroup] || 0;
        const bgB = bgOrder[b.bloodGroup] || 0;
        if (bgA !== bgB) {
          comparison = bgA - bgB;
        } else {
          comparison = (a.rhFactor || '').localeCompare(b.rhFactor || '');
        }
      } else if (donorSortField === 'lastDonation') {
        if (!a.lastDonationDate && !b.lastDonationDate) comparison = 0;
        else if (!a.lastDonationDate) comparison = -1;
        else if (!b.lastDonationDate) comparison = 1;
        else comparison = new Date(a.lastDonationDate).getTime() - new Date(b.lastDonationDate).getTime();
      } else if (donorSortField === 'donationsCount') {
        comparison = (a.donationsCount || 0) - (b.donationsCount || 0);
      }

      return donorSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [donorList, donorSortField, donorSortOrder]);

  // Selected single donor profile detailed view
  const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null);
  const [donorCard, setDonorCard] = useState<{
    donor: Donor;
    link: DonorCenter;
    donations: Donation[];
    medicalNotes: MedicalNote[];
    readiness: { ready: boolean; reason?: string; pendingConfirmation?: boolean };
  } | null>(null);

  const [pendingDonorProfile, setPendingDonorProfile] = useState<{
    card: {
      donor: Donor;
      link: DonorCenter;
      donations: Donation[];
      medicalNotes: MedicalNote[];
      readiness: { ready: boolean; reason?: string; pendingConfirmation?: boolean };
    };
    linkId: number;
  } | null>(null);

  // New forms states inside profile card
  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    donationDate: new Date().toISOString().split('T')[0],
    donationType: 'blood' as DonationType,
    volumeMl: '450',
    isPaid: false,
    note: ''
  });

  const [showAddMedicalModal, setShowAddMedicalModal] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    reason: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isPermanent: false
  });

  const [showEditDonorModal, setShowEditDonorModal] = useState(false);
  const [editError, setEditError] = useState('');
  const [editDonorForm, setEditDonorForm] = useState({
    lastName: '', firstName: '', middleName: '', birthDate: '', gender: 'male' as 'male'|'female',
    bloodGroup: 'I_O' as BloodGroup, rhFactor: 'positive' as RhFactor, weight: '70', phone: '', email: '', status: 'active' as DonorStatus
  });

  // Manual Donor Registration from Center
  const [showManualRegModal, setShowManualRegModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male' as 'male'|'female',
    bloodGroup: 'I_O' as BloodGroup, rhFactor: 'positive' as RhFactor, weight: '70', phone: '+375', email: '', password: 'password123'
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

  const [isQuickAlertOpen, setIsQuickAlertOpen] = useState(false);
  const [isAlertsHistoryOpen, setIsAlertsHistoryOpen] = useState(false);

  // Alert templates state with local storage support
  const [templatesList, setTemplatesList] = useState<Array<{ id: string; name: string; text: string; isCustom?: boolean }>>(() => {
    const base = [
      { id: 'urgent_color', name: 'Дефицит крови', text: 'Донор-Алерт: Нашему центру крови СРОЧНО требуется пополнение дефицита цельной крови. Пожалуйста, придите на донацию в ближайшее время.' },
      { id: 'plasma_call', name: 'Аферез плазмы', text: 'Донор-Алерт: Просим доноров плазмы подойти для аппаратного плазмафереза в ближайшее время.' },
      { id: 'platelet_call', name: 'Аферез тромбоцитов', text: 'Донор-Алерт: Требуются доноры тромбоцитов. Просим вас подойти в центр крови в ближайшее время.' },
      { id: 'granulocyte_call', name: 'Дефицит гранулоцитов', text: 'Донор-Алерт: Объявлен экстренный сбор на дефицит гранулоцитов! Сдача клеток крови требуется в ближайшие время. ' }
    ];
    try {
      const saved = localStorage.getItem(`donor_alert_templates_${center?.id || 'default'}`);
      if (saved) {
        return [...base, ...JSON.parse(saved).map((t: any) => ({ ...t, isCustom: true }))];
      }
    } catch (e) {
      console.error(e);
    }
    return base;
  });

  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateText, setNewTemplateText] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [selectedTemplateGroups, setSelectedTemplateGroups] = useState<string[]>([]);
  const [isBaseTemplatesFolderOpen, setIsBaseTemplatesFolderOpen] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'success' | 'warning' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const requestConfirm = (options: Omit<typeof confirmConfig, 'isOpen'>) => {
    setConfirmConfig({ ...options, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

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

  const loadAppointments = async () => {
    try {
      const res = await fetch(`${apiBase}/appointments?centerId=${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
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

  const handleViewPendingProfile = async (donorId: number, linkId: number) => {
    try {
      const res = await fetch(`${apiBase}/center/donors/${donorId}?centerId=${center.id}`);
      if (res.ok) {
        const data = await res.json();
        setPendingDonorProfile({ card: data, linkId });
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
    } else if (activeMenu === 'appointments') {
      loadAppointments();
    }
  }, [activeMenu, donorSearch, filterBgs, filterRhs, filterReadiness]);

  useEffect(() => {
    if (activeMenu === 'notify') {
      updatePreviewCount();
    }
  }, [activeMenu, notifyForm]);

  // Handle Manual register submit
  const handleManualNameChange = (field: 'lastName' | 'firstName' | 'middleName', val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Zа-яА-ЯёЁіІўЎ\-]/g, '');
    setManualForm(prev => ({ ...prev, [field]: lettersOnly }));
  };

  const isBirthDateInvalid = () => {
    if (!manualForm.birthDate) return false;
    const bDate = new Date(manualForm.birthDate);
    const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 65);
    const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() - 18);
    return bDate < minDate || bDate > maxDate;
  };

  const isWeightInvalid = () => {
    if (!manualForm.weight) return false;
    return parseFloat(manualForm.weight) < 55;
  };

  const isEmailInvalid = () => {
    if (!manualForm.email) return false;
    return !/^.+@.+$/.test(manualForm.email);
  };

  const handleManualReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    if (!manualForm.lastName || !manualForm.firstName || !manualForm.email || !manualForm.phone) {
      setManualError('Заполните обязательные поля');
      return;
    }
    if (isBirthDateInvalid()) {
      setManualError('Возраст донора должен быть от 18 до 65 лет');
      return;
    }
    if (isWeightInvalid()) {
      setManualError('К донорству допускаются лица с массой тела не менее 55 кг');
      return;
    }
    if (isEmailInvalid()) {
      setManualError('Введите корректный e-mail');
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
  const handleConfirmPending = (linkId: number) => {
    requestConfirm({
      title: 'Одобрить заявку',
      message: 'Вы уверены, что хотите одобрить заявку донора на прикрепление к вашему центру крови?',
      variant: 'success',
      confirmText: 'Одобрить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/pending/${linkId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' })
          });
          if (res.ok) {
            loadPending();
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  // Reject pending application (submits cause reason text via modal)
  const handleRejectPendingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Укажите причину обязательно');
      return;
    }
    requestConfirm({
      title: 'Отклонить заявку?',
      message: 'Вы уверены, что хотите отклонить эту заявку? Донору будет направлено соответствующее извещение с указанной вами причиной.',
      variant: 'danger',
      confirmText: 'Отклонить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/pending/${rejectionModalLinkId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected', rejectionReason })
          });
          if (res.ok) {
            setRejectionModalLinkId(null);
            setRejectionReason('');
            loadPending();
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  // Add Donation Record past
  const handleAddDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId) return;
    requestConfirm({
      title: 'Сохранить донацию?',
      message: 'Вы уверены, что хотите добавить эту запись в реестр донаций донора?',
      variant: 'success',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/donors/${selectedDonorId}/donations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ centerId: center.id, addedBy: 2, ...donationForm })
          });
          if (res.ok) {
            setShowAddDonationModal(false);
            loadDonorCard(selectedDonorId);
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  // Add Medical note restriction
  const handleAddMedical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId) return;
    requestConfirm({
      title: 'Сохранить медотвод?',
      message: 'Вы уверены, что хотите добавить медицинский отвод данному донору?',
      variant: 'danger',
      confirmText: 'Сохранить',
      onConfirm: async () => {
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
            setShowAddMedicalModal(false);
            loadDonorCard(selectedDonorId);
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  const handleEditDonorNameChange = (field: 'lastName' | 'firstName' | 'middleName', val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Zа-яА-ЯёЁіІўЎ\-]/g, '');
    setEditDonorForm(prev => ({ ...prev, [field]: lettersOnly }));
  };

  const handleEditDonorPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+375')) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.startsWith('375')) {
        val = '+375' + digitsOnly.slice(3, 12);
      } else {
        val = '+375' + digitsOnly.slice(0, 9);
      }
    } else {
      const afterPrefix = val.slice(4).replace(/\D/g, '').slice(0, 9);
      val = '+375' + afterPrefix;
    }
    setEditDonorForm(prev => ({ ...prev, phone: val }));
  };

  const handleOpenEditDonor = () => {
    if (donorCard) {
      setEditDonorForm({
        lastName: donorCard.donor.lastName,
        firstName: donorCard.donor.firstName,
        middleName: donorCard.donor.middleName || '',
        birthDate: donorCard.donor.birthDate,
        gender: donorCard.donor.gender,
        bloodGroup: donorCard.donor.bloodGroup,
        rhFactor: donorCard.donor.rhFactor,
        weight: donorCard.donor.weight?.toString() || '',
        phone: donorCard.donor.phone,
        email: donorCard.donor.email || '',
        status: donorCard.donor.status
      });
      setShowEditDonorModal(true);
    }
  };

  const handleEditDonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonorId) return;

    setEditError('');

    // 1. Birth Date check: age between 18 and 65
    const birthDateObj = new Date(editDonorForm.birthDate);
    if (isNaN(birthDateObj.getTime())) {
      setEditError('Пожалуйста, введите корректную дату рождения');
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    if (age < 18 || age > 65) {
      setEditError('Возраст донора должен быть от 18 до 65 лет');
      return;
    }

    // 2. Email pattern check: *@* (at least 1 character before and after @)
    const emailRegex = /^.+@.+$/;
    if (!emailRegex.test(editDonorForm.email)) {
      setEditError('Укажите корректный e-mail в формате user@example.com (должен содержать символы до и после @)');
      return;
    }

    // 3. Weight check: not less than 55 kg
    const weightVal = parseFloat(editDonorForm.weight);
    if (isNaN(weightVal) || weightVal < 55) {
      setEditError('Минимальный вес донора для сдачи крови — 55 кг');
      return;
    }

    requestConfirm({
      title: 'Сохранить изменения?',
      message: 'Вы уверены, что хотите обновить данные донора?',
      variant: 'success',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/donors/${selectedDonorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editDonorForm)
          });
          
          if (res.ok) {
            setShowEditDonorModal(false);
            loadDonorCard(selectedDonorId);
            loadDonors();
          } else {
            const data = await res.json();
            setEditError(data.error || 'Произошла ошибка при сохранении');
          }
        } catch {
          setEditError('Произошла ошибка сети');
        }
        closeConfirm();
      }
    });
  };

  const handleLiftMedical = (noteId: number) => {
    if (!selectedDonorId) return;
    requestConfirm({
      title: 'Снять медотвод?',
      message: 'Вы уверены, что хотите досрочно снять медицинский отвод? Это действие позволит донору снова записываться на донации.',
      variant: 'warning',
      confirmText: 'Снять',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/medical-notes/${noteId}/lift`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liftNote: 'Снят досрочно лечащим врачом-трансфузиологом РНПЦ', liftedBy: 2 })
          });
          if (res.ok) {
            // alert('Медотвод снят!');
            loadDonorCard(selectedDonorId);
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  // Send campaign broadcasts alertor
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifySuccessMsg('');
    if (!notifyForm.messageText.trim()) {
      alert('Текст уведомления пуст!');
      return;
    }
    requestConfirm({
      title: 'Подтвердите отправку оповещения',
      message: `Потенциальное количество получателей: ${notifyPreviewCount}. Начать рассылку?`,
      variant: 'warning',
      confirmText: 'Отправить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/center/notify/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ centerId: center.id, sentBy: 2, ...notifyForm })
          });
          const data = await res.json();
          if (res.ok) {
            setNotifySuccessMsg(`Рассылка отправлена! Получателей: ${data.recipientsCount}. Подробности:\n- Push получено: ${data.pushSent}\n- Email направлено: ${data.emailSent}`);
            setNotifyForm({ ...notifyForm, messageText: '' });
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  const getUrgentColorText = (groups: string[]) => {
    const groupsText = groups.length > 0 
      ? (groups.length === 1 ? groups[0] : groups.slice(0, -1).join(', ') + ' и ' + groups[groups.length - 1])
      : '';
    const bloodSpace = groupsText ? ' ' + groupsText : '';
    return `Донор-Алерт: Нашему центру крови СРОЧНО требуется пополнение дефицита цельной крови${bloodSpace}. Пожалуйста, придите на донацию в ближайшее время.`;
  };

  const getPlasmaCallText = (groups: string[]) => {
    const groupsText = groups.length > 0 
      ? (groups.length === 1 ? groups[0] : groups.slice(0, -1).join(', ') + ' и ' + groups[groups.length - 1])
      : '';
    const bloodSpace = groupsText ? ' ' + groupsText : '';
    return `Донор-Алерт: Просим доноров плазмы${bloodSpace} подойти для аппаратного плазмафереза в ближайшее время.`;
  };

  const getPlateletCallText = (groups: string[]) => {
    const groupsText = groups.length > 0 
      ? (groups.length === 1 ? groups[0] : groups.slice(0, -1).join(', ') + ' и ' + groups[groups.length - 1])
      : '';
    const bloodSpace = groupsText ? ' ' + groupsText : '';
    return `Донор-Алерт: Требуются доноры тромбоцитов${bloodSpace}. Просим вас подойти в центр крови в ближайшее время.`;
  };

  const getGranulocyteCallText = (groups: string[]) => {
    const groupsText = groups.length > 0 
      ? (groups.length === 1 ? groups[0] : groups.slice(0, -1).join(', ') + ' и ' + groups[groups.length - 1])
      : '';
    const bloodSpace = groupsText ? ' ' + groupsText : '';
    return `Донор-Алерт: Объявлен экстренный сбор на дефицит гранулоцитов${bloodSpace}! Сдача клеток крови требуется в ближайшие время. `;
  };

  const getUpdatedTemplateText = (id: string, groups: string[]) => {
    if (id === 'urgent_color') return getUrgentColorText(groups);
    if (id === 'plasma_call') return getPlasmaCallText(groups);
    if (id === 'platelet_call') return getPlateletCallText(groups);
    if (id === 'granulocyte_call') return getGranulocyteCallText(groups);
    return '';
  };

  // Load alert template defaults quick
  const loadTemplateText = (text: string) => {
    setActiveTemplateId(null);
    setNotifyForm({
      ...notifyForm,
      messageText: text
    });
    setIsTemplatesMenuOpen(false);
  };

  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      setTemplateError(t('Введите название шаблона'));
      return;
    }
    if (!newTemplateText.trim()) {
      setTemplateError(t('Введите текст шаблона'));
      return;
    }

    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplateName.trim(),
      text: newTemplateText.trim(),
      isCustom: true
    };

    const updated = [...templatesList, newTemplate];
    setTemplatesList(updated);

    // Save customs to local storage
    try {
      const customsOnly = updated.filter(temp => temp.isCustom);
      localStorage.setItem(`donor_alert_templates_${center?.id || 'default'}`, JSON.stringify(customsOnly));
    } catch (err) {
      console.error(err);
    }

    setNewTemplateName('');
    setNewTemplateText('');
    setIsAddingTemplate(false);
    setTemplateError('');
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templatesList.filter(temp => temp.id !== id);
    setTemplatesList(updated);
    try {
      const customsOnly = updated.filter(temp => temp.isCustom);
      localStorage.setItem(`donor_alert_templates_${center?.id || 'default'}`, JSON.stringify(customsOnly));
    } catch (err) {
      console.error(err);
    }
  };

  // Manage regional news CRUD
  const handleNeedsSubmit = async () => {
    setNeedsSaving(true);
    try {
      const res = await fetch(`${apiBase}/centers/${center.id}/needs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bloodNeeds: needsForm })
      });
      if (!res.ok) throw new Error();
      setNeedsSuccess(true);
      setTimeout(() => setNeedsSuccess(false), 3000);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert("Ошибка при сохранении дефицитов");
    } finally {
      setNeedsSaving(false);
    }
  };

  const handleNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestConfirm({
      title: editingNews ? 'Сохранить публикацию?' : 'Опубликовать новость?',
      message: 'Вы уверены, что хотите сохранить изменения и опубликовать новость на портале?',
      variant: 'info',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        try {
          const method = editingNews ? 'PUT' : 'POST';
          const url = editingNews ? `${apiBase}/news/${editingNews.id}` : `${apiBase}/news`;
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ centerId: center.id, sentBy: 2, ...newsForm })
          });
          if (res.ok) {
            setShowNewsModal(false);
            setEditingNews(null);
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  const handleNewsDelete = (id: number) => {
    requestConfirm({
      title: 'Удалить новость?',
      message: 'Вы уверены, что хотите безвозвратно удалить эту новость?',
      variant: 'danger',
      confirmText: 'Удалить',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/news/${id}`, { method: 'DELETE' });
          if (res.ok) {
            refreshDashboard();
          }
        } catch {}
        closeConfirm();
      }
    });
  };

  const bloodSlices = [
    { id: 'I_O', label: 'I (O) – Первая', count: stats.bloodGroupStats.I_O, stroke: '#dc2626', bg: 'bg-red-600' },
    { id: 'II_A', label: 'II (A) – Вторая', count: stats.bloodGroupStats.II_A, stroke: '#b91c1c', bg: 'bg-red-700' },
    { id: 'III_B', label: 'III (B) – Третья', count: stats.bloodGroupStats.III_B, stroke: '#f87171', bg: 'bg-red-400' },
    { id: 'IV_AB', label: 'IV (AB) – Четвертая', count: stats.bloodGroupStats.IV_AB, stroke: '#fca5a5', bg: 'bg-red-300' }
  ];
  let currentAccum = 0;
  const pieData = bloodSlices.map(slice => {
    const pct = stats.totalDonors > 0 ? (slice.count / stats.totalDonors) * 100 : 0;
    const dasharray = `${pct} ${100 - pct}`;
    const dashoffset = 25 - currentAccum;
    const midPct = currentAccum + pct / 2;
    // Calculate angle; standard SVG offsets 3 o'clock initially, but we adjusted visually by an offset of 25 (top)
    const angle = (midPct / 100) * Math.PI * 2 - Math.PI / 2;
    const textX = 21 + Math.cos(angle) * 15.915;
    const textY = 21 + Math.sin(angle) * 15.915;
    
    currentAccum += pct;
    return { ...slice, pct: Math.round(pct), dasharray, dashoffset, textX, textY };
  });

  return (
    <div className="w-full space-y-6">
      
      {/* Clinic Header Metadata banner info */}
      <div className="bg-slate-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-bold text-slate-800 text-lg leading-tight">{center.name}</h2>
          <p className="text-xs text-slate-500 mt-1">{t("Адрес")}: {center.address}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t("Тел")}: {center.phone}</p>
        </div>

        <div className="flex border border-slate-200 bg-white p-1 rounded-xl self-start gap-1 flex-wrap">
          {[
            { id: 'stats', label: 'Показатели', icon: Activity },
            { id: 'donors', label: 'Доноры', icon: Users },
            { id: 'pending', label: 'Заявки', icon: HelpCircle },
            { id: 'appointments', label: 'Записи', icon: Calendar },
            { id: 'notify', label: 'Рассылка', icon: Bell },
            { id: 'news', label: 'Новости', icon: FileText },
            { id: 'needs', label: 'Дефициты', icon: Droplets }
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
      <AnimatePresence mode="wait">

      {/* MENU 1: DASHBOARD STATS */}
      {activeMenu === 'stats' && (
        <motion.div
          key="stats"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-red-100 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest mb-1">{t("всего доноров (активных)")}</span>
              <span className="text-3xl sm:text-4xl font-bold text-red-600 leading-none tracking-tight">{stats.totalDonors}</span>
              
              {/* Popover summary list on hover */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] text-[11px] font-medium leading-relaxed font-sans">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                Все зарегистрированные доноры, отслеживаемые данным центром.
              </div>
            </div>

            <div className="bg-white border border-emerald-100 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">{t("готовы сдать сейчас")}</span>
              <span className="text-3xl sm:text-4xl font-bold text-emerald-600 leading-none tracking-tight">{stats.readyCount}</span>

              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] text-[11px] font-medium leading-relaxed font-sans">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                Остальные — временно отстранены (сроки/медотводы).
              </div>
            </div>

            <div className="bg-white border border-amber-100 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">{t("ожидают подтверждения")}</span>
              <span className="text-3xl sm:text-4xl font-bold text-amber-500 leading-none tracking-tight">{stats.pendingCount}</span>

              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] text-[11px] font-medium leading-relaxed font-sans">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                Новые заявки от доноров на прикрепление к вашему центру.
              </div>
            </div>

            <div className="bg-white border border-blue-100 p-5 rounded-2xl flex flex-col justify-center items-center text-center relative group cursor-pointer hover:bg-slate-50 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">{t("рассылок в этом месяце")}</span>
              <span className="text-3xl sm:text-4xl font-bold text-blue-500 leading-none tracking-tight">{stats.notificationsThisMonth}</span>

              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] text-[11px] font-medium leading-relaxed font-sans">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                Количество отправленных SMS-оповещений.
              </div>
            </div>
          </div>

          {/* Stanning Interactive SVG Charts on blood and Rh factors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 1: Blood Groups */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base">{t("Распределение базы по группам крови")}</h3>
              <p className="text-sm text-slate-500">{t("Отображается отношение доноров по I, II, III, IV клиническим группам:")}</p>
              
              {/* Graphic custom interactive SVG */}
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-around pt-2">
                <svg className="w-36 h-36 shrink-0 border border-slate-50 rounded-full" viewBox="0 0 42 42">
                  {/* Base background circle */}
                  <circle r="15.915" cx="21" cy="21" fill="transparent" stroke="#fef2f2" strokeWidth="10"></circle>
                  
                  {/* Dynamic slices and percentages */}
                  {pieData.map((slice) => slice.pct > 0 && (
                    <g key={slice.id}>
                      <circle 
                        r="15.915" 
                        cx="21" 
                        cy="21" 
                        fill="transparent" 
                        stroke={slice.stroke} 
                        strokeWidth="10" 
                        strokeDasharray={slice.dasharray} 
                        strokeDashoffset={slice.dashoffset}
                      />
                      {slice.pct >= 5 && (
                        <text
                          x={slice.textX}
                          y={slice.textY}
                          fill="white"
                          fontSize="3.2"
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="central"
                          dy="0.1em"
                        >
                          {slice.pct}%
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                <div className="space-y-3 text-sm text-slate-700 w-full sm:w-auto overflow-hidden">
                  {pieData.map(slice => (
                    <div key={slice.id} className="flex items-center gap-2 whitespace-nowrap">
                      <span className={`w-3 h-3 rounded ${slice.bg} block shrink-0`}></span>
                      <span className="truncate"><strong>{slice.label}:</strong> {slice.count} дон.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 2: Rh factors */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base">{t("Резус-фактор доноров подразделения")}</h3>
              <p className="text-sm text-slate-500">{t("Отображается отношение доноров по Rh+ и Rh- клиническим группам:")}</p>
              
              <div className="space-y-4 pt-3 text-sm text-slate-700">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span><strong>{t("Rh+ (Положительный):")}</strong> {stats.rhStats.positive} доноров</span>
                    <span>{stats.totalDonors > 0 ? Math.round((stats.rhStats.positive / stats.totalDonors) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-red-50 h-3 rounded-full overflow-hidden border border-red-100">
                    <div 
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${stats.totalDonors > 0 ? (stats.rhStats.positive / stats.totalDonors) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span><strong>{t("Rh- (Отрицательный):")}</strong> {stats.rhStats.negative} доноров</span>
                    <span>{stats.totalDonors > 0 ? Math.round((stats.rhStats.negative / stats.totalDonors) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-red-50 h-3 rounded-full overflow-hidden border border-red-100">
                    <div 
                      className="bg-red-700 h-full rounded-full"
                      style={{ width: `${stats.totalDonors > 0 ? (stats.rhStats.negative / stats.totalDonors) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CenterStatsDashboard center={center} stats={stats} isLoading={false} />
        </motion.div>
      )}

      {/* MENU 2: DONORS DATABASE */}
      {activeMenu === 'donors' && (
        <motion.div
          key="donors"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Active single donor profile detailed view is open */}
          {selectedDonorId !== null && donorCard ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6 relative">
              <button 
                onClick={() => { setSelectedDonorId(null); setDonorCard(null); }}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                title={t("Закрыть")}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{t("Медицинская карта донора")}: {donorCard.donor.lastName} {donorCard.donor.firstName}</h3>
                </div>
              </div>

              {/* Sub actions block */}
              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={handleOpenEditDonor}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-1" /> Редактировать данные донора
                </button>
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

              {/* Collapsible Accordions for Donor Card details */}
              <div className="space-y-4 pt-2">
                
                <CenterAccordionItem title={t("Личные данные донора")} defaultOpen={false}>
                  <div className="divide-y divide-slate-100/80 text-xs text-slate-700/90 rounded-2xl p-4.5 bg-slate-50/40 border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("ФИО")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {donorCard.donor.lastName} {donorCard.donor.firstName} {donorCard.donor.middleName || ''}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Дата рождения")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {formatDateHuman(donorCard.donor.birthDate)} ({
                          (() => {
                            const birthDate = new Date(donorCard.donor.birthDate);
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                            return age;
                          })()
                        } лет)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Пол")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {donorCard.donor.gender === 'male' ? 'Мужской' : 'Женский'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Вес")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {donorCard.donor.weight} кг
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Группа и Резус-фактор")}</span>
                      <div className="flex gap-2">
                        <span className="bg-red-50 border border-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          {formatBloodGroup(donorCard.donor.bloodGroup)}
                        </span>
                        <span className="font-bold px-1 py-0.5 text-xs text-slate-800">
                          {formatRhFactor(donorCard.donor.rhFactor)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Телефон")}</span>
                      <span className="font-bold text-slate-800 text-right">{donorCard.donor.phone}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("E-mail / Личный ID")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {donorCard.donor.email || donorCard.donor.onesignalPlayerId || 'Не указан'}
                      </span>
                    </div>
                  </div>
                </CenterAccordionItem>

                <CenterAccordionItem title={`История процедур сдачи крови (${donorCard.donations.length})`}>
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="p-3 font-semibold text-slate-500">{t("Дата сдачи")}</th>
                          <th className="p-3 font-semibold text-slate-500">{t("Тип заготовки")}</th>
                          <th className="p-3 font-semibold text-slate-500">{t("Объем (мл)")}</th>
                          <th className="p-3 font-semibold text-slate-500">{t("Примечание")}</th>
                          <th className="p-3 font-semibold text-slate-500"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 dark:divide-slate-800">
                        {donorCard.donations.map(don => {
                          const donType = don.donationType || don.type;
                          const typeLabel = donType === 'blood' ? 'Кровь' : donType === 'plasma' ? 'Плазма' : donType === 'platelets' ? 'Тромбоциты' : donType;
                          const paidLabel = don.isPaid ? 'возмездно' : 'безвозмездно';
                          const volume = don.volumeMl || don.volume || '—';
                          
                          return (
                            <tr key={don.id}>
                              <td className="p-3 font-bold text-slate-800">{formatDateHuman(don.donationDate || don.date!)}</td>
                              <td className="p-3">
                                <span className="bg-red-50 text-red-600 px-2 py-1 rounded font-bold border border-red-100 uppercase text-[10px] tracking-wide inline-block">
                                  {typeLabel} <span className="opacity-70 lowercase">({paidLabel})</span>
                                </span>
                              </td>
                              <td className="p-3 font-bold">{volume}</td>
                              <td className="p-3 text-[10px] text-slate-500 italic max-w-[120px] truncate" title={don.note || ''}>{don.note || '—'}</td>
                              <td className="p-3 text-right">
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    requestConfirm({
                                      title: 'Удалить донацию?',
                                      message: 'Это действие необратимо. Запись будет навсегда удалена из истории донора.',
                                      variant: 'danger',
                                      confirmText: 'Удалить',
                                      onConfirm: async () => {
                                        try {
                                          const res = await fetch(`${apiBase}/donations/${don.id}`, { method: 'DELETE' });
                                          if (res.ok) {
                                            loadDonorCard(donorCard.donor.id);
                                            refreshDashboard();
                                          }
                                        } catch {}
                                        closeConfirm();
                                      }
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-semibold text-[10px] uppercase tracking-wider"
                                >
                                  Удалить
                                </button>
                            </td>
                          </tr>
                          );
                        })}
                        {donorCard.donations.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">{t("Нет записей о донациях.")}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CenterAccordionItem>

                <CenterAccordionItem title={`Медицинские отводы и ограничения (${donorCard.medicalNotes.length})`}>
                  <div className="space-y-2.5">
                    {donorCard.medicalNotes.map(note => (
                      <div key={note.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${note.isActive ? 'bg-red-50/55 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-800">{t("Причина")}: {note.reason}</p>
                          <p className="text-xs text-slate-500">{t("Период")}: {note.startDate ? formatDateHuman(note.startDate) : ''} – {note.endDate ? formatDateHuman(note.endDate) : t('Постоянный отвод')}</p>
                          {note.isActive ? (
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full mt-2 inline-block shadow-sm">{t("Активен")}</span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-full mt-2 inline-block">{t("Архивный (Снят)")}</span>
                          )}
                        </div>
                        {note.isActive && (
                          <button 
                            onClick={() => handleLiftMedical(note.id)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
                          >
                            Снять медотвод
                          </button>
                        )}
                      </div>
                    ))}
                    {donorCard.medicalNotes.length === 0 && (
                      <p className="text-sm text-slate-400 py-6 text-center">{t("У донора отсутствуют медотводы в истории.")}</p>
                    )}
                  </div>
                </CenterAccordionItem>

              </div>

            </div>
          ) : (
            /* Tabular active list filters and registry */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{t("Электронный реестр доноров филиала")}</h3>
                  <p className="text-xs text-slate-500">{t("В списке выводятся подтвержденные доноры, связавшие свои анкеты с вашим центром.")}</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={() => {
                      setManualForm({
                        lastName: '', firstName: '', middleName: '', birthDate: '1995-01-01', gender: 'male',
                        bloodGroup: 'I_O', rhFactor: 'positive', weight: '70', phone: '+375', email: '', password: 'password123'
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
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input 
                      type="text" 
                      placeholder={t("Быстрый поиск по фамилии или имени...")}
                      value={donorSearch}
                      onChange={(e) => setDonorSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:w-[420px] text-xs font-semibold">
                    <select 
                      value={filterReadiness} 
                      onChange={(e) => setFilterReadiness(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:border-red-500 focus:outline-none h-11 cursor-pointer"
                    >
                      <option value="all">{t("Все доноры")}</option>
                      <option value="ready">{t("Готовы к сдаче сейчас")}</option>
                      <option value="not_ready">{t("Временно ограничены")}</option>
                    </select>

                    <select 
                      value={donorSortField} 
                      onChange={(e) => setDonorSortField(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:border-red-500 focus:outline-none h-11 cursor-pointer text-slate-700 font-semibold"
                    >
                      <option value="lastName">{t("По Фамилии")}</option>
                      <option value="bloodGroup">{t("По Группе и Резусу")}</option>
                      <option value="lastDonation">{t("По Последней сдаче")}</option>
                      <option value="donationsCount">{t("По количеству сдач")}</option>
                    </select>
                  </div>
                </div>

                {/* Controls and filters in one line */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-medium text-slate-700 pt-2 border-t border-slate-200/60">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span>{t("Группы:")}</span>
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

                    <span className="ml-2">{t("Резус:")}</span>
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

                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDonorSortOrder('asc')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        donorSortOrder === 'asc' 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>{t("по возрастанию")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonorSortOrder('desc')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                        donorSortOrder === 'desc' 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>{t("по убыванию")}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Donor results */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3 font-semibold text-slate-500">{t("ФИО")}</th>
                      <th className="p-3 font-semibold text-slate-500">{t("Группа и Резус")}</th>
                      <th className="p-3 font-semibold text-slate-500">{t("Статус")}</th>
                      <th className="p-3 font-semibold text-slate-500">{t("Последняя сдача")}</th>
                      <th className="p-3 font-semibold text-slate-500">{t("Всего сд.")}</th>
                      <th className="p-3 font-semibold text-slate-500">{t("Действия")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650 text-slate-600 dark:divide-slate-800">
                    {sortedDonorList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-900 font-semibold">{item.lastName} {item.firstName} {item.middleName}</td>
                        <td className="p-3">
                          <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100 text-[10px] tracking-wide inline-block uppercase">
                            {formatBloodGroup(item.bloodGroup)} {formatRhFactor(item.rhFactor)}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.readiness?.ready ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wide">
                              Готов к сдаче
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wide cursor-help"
                              title={item.readiness?.reason || 'Имеет ограничения или отвод'}
                            >
                              Медотвод
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">{item.lastDonationDate ? formatDateHuman(item.lastDonationDate) : 'Ни разу'}</td>
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
                    {sortedDonorList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-sm py-12 text-center text-slate-400">{t("Свободные доноры по заданным фильтрам не найдены.")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* MENU 3: PENDING APPLICATIONS */}
      {activeMenu === 'pending' && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          {pendingDonorProfile !== null ? (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-150 shadow-sm space-y-6 relative">
              <button 
                onClick={() => setPendingDonorProfile(null)}
                className="absolute right-4 top-4 bg-slate-100 hover:bg-slate-200 text-slate-750 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                ← Вернуться к заявкам
              </button>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-b pb-4 border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{t("Анкета кандидата на подтверждение")}: {pendingDonorProfile.card.donor.lastName} {pendingDonorProfile.card.donor.firstName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{t("Отправлено")}: {pendingDonorProfile.card.link.resubmittedAt ? formatDateHuman(pendingDonorProfile.card.link.resubmittedAt) : formatDateHuman(pendingDonorProfile.card.link.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    pendingDonorProfile.card.readiness.ready 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {pendingDonorProfile.card.readiness.ready 
                      ? 'Готов к донации цельной крови' 
                      : 'Медотвод / Ограничение'}
                  </span>
                </div>
              </div>

              {/* Two Column Grid on analogy of "Личная информация" */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                {/* Left Column: Personal info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">{t("Личные данные анкеты")}</h4>
                  
                  <div className="divide-y divide-slate-100/80 text-xs text-slate-700/90 rounded-2xl border border-slate-150 p-4.5 bg-slate-50/40">
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("ФИО")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {pendingDonorProfile.card.donor.lastName} {pendingDonorProfile.card.donor.firstName} {pendingDonorProfile.card.donor.middleName || ''}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Дата рождения")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {formatDateHuman(pendingDonorProfile.card.donor.birthDate)} ({
                          (() => {
                            const birthDate = new Date(pendingDonorProfile.card.donor.birthDate);
                            const today = new Date();
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const m = today.getMonth() - birthDate.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                            return age;
                          })()
                        } лет)
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Пол")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {pendingDonorProfile.card.donor.gender === 'male' ? 'Мужской' : 'Женский'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Телефон")}</span>
                      <span className="font-bold text-slate-800 text-right">{pendingDonorProfile.card.donor.phone}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("E-mail / Личный идентификатор")}</span>
                      <span className="font-bold text-slate-800 text-right">
                        {pendingDonorProfile.card.donor.email || pendingDonorProfile.card.donor.onesignalPlayerId || 'Не указан'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Вес")}</span>
                      <span className="font-bold text-slate-800 text-right">{pendingDonorProfile.card.donor.weight} кг</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Группа / Резус")}</span>
                      <div className="flex gap-2">
                        <span className="bg-white border border-slate-150 text-red-600 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          {formatBloodGroup(pendingDonorProfile.card.donor.bloodGroup)}
                        </span>
                        <span className="text-slate-800 font-bold px-1 py-0.5 text-xs">
                          {formatRhFactor(pendingDonorProfile.card.donor.rhFactor)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("Уведомления")}</span>
                      <span className="font-semibold text-slate-650 text-right text-xs">
                        {pendingDonorProfile.card.donor.pushEnabled ? 'Push' : ''} {pendingDonorProfile.card.donor.emailNotificationsEnabled ? 'Email' : ''} 
                        {!pendingDonorProfile.card.donor.pushEnabled && !pendingDonorProfile.card.donor.emailNotificationsEnabled ? 'Отключены' : ''}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                      <span className="text-slate-500 font-medium font-sans">{t("В системе с")}</span>
                      <span className="font-bold text-slate-800 text-right font-mono">{formatDateHuman(pendingDonorProfile.card.donor.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Medical exclusions / Limitations & History */}
                <div className="space-y-6">
                  {/* Medical limitations */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">{t("Медицинские ограничения и отводы")} ({pendingDonorProfile.card.medicalNotes.length})</h4>
                    {pendingDonorProfile.card.medicalNotes.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {pendingDonorProfile.card.medicalNotes.map((note: any) => (
                          <div key={note.id} className="p-3.5 rounded-xl border border-red-150 bg-red-50/30 text-xs text-slate-700">
                            <p className="font-semibold text-red-800">{t("Причина")}: {note.reason}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Срок проведения отвода: с {formatDateHuman(note.startDate)} по {note.endDate ? formatDateHuman(note.endDate) : 'бессрочно'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-xs text-emerald-800 italic">
                        Противопоказания и временные ограничения отсутствуют.
                      </div>
                    )}
                  </div>

                  {/* History of Donations */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">{t("История предыдущих процедур")} ({pendingDonorProfile.card.donations.length})</h4>
                    {pendingDonorProfile.card.donations.length > 0 ? (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white text-xs max-h-48 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-150">
                            <tr>
                              <th className="p-3 border-r border-slate-100">{t("Дата")}</th>
                              <th className="p-3 border-r border-slate-100">{t("Заготовка")}</th>
                              <th className="p-3">{t("Объем")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {pendingDonorProfile.card.donations.map((don: any) => (
                              <tr key={don.id}>
                                <td className="p-3 border-r border-slate-100 font-bold text-slate-800">
                                  {formatDateHuman(don.donationDate || don.date)}
                                </td>
                                <td className="p-3 border-r border-slate-100 capitalize">
                                  {don.donationType === 'blood' ? 'кровь' : don.donationType === 'plasma' ? 'плазма' : 'тромбоциты'}
                                </td>
                                <td className="p-3 font-semibold text-slate-800">
                                  {don.volumeMl || don.volume || '—'} мл
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-400 italic">
                        История донаций в системе не найдена.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action operations button layout */}
              <div className="border-t border-slate-205 pt-6 flex flex-col sm:flex-row justify-end gap-3 border-slate-100">
                <button 
                  onClick={() => {
                    handleConfirmPending(pendingDonorProfile.linkId);
                    setPendingDonorProfile(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" /> Одобрить анкету кандидата
                </button>
                <button 
                  onClick={() => {
                    setRejectionModalLinkId(pendingDonorProfile.linkId);
                    setRejectionReason('');
                    setPendingDonorProfile(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" /> Отклонить обращение
                </button>
                <button 
                  onClick={() => setPendingDonorProfile(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-6 py-3 rounded-xl cursor-pointer transition-colors"
                >
                  Вернуться назад
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-slate-800 text-base">{t("Заявки доноров на подтверждение")}</h3>
                <p className="text-xs text-slate-500">{t("Здесь отображаются кандидаты, которые зарегистрировались самостоятельно или направили запрос на привязку к вашему центру.")}</p>
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
                        <p>{t("Дата отправки заявки")}: {item.link.resubmittedAt ? formatDateHuman(item.link.resubmittedAt) : formatDateHuman(item.link.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleViewPendingProfile(item.donor.id, item.link.id)}
                        className="bg-red-50 hover:bg-red-150 border border-red-200 text-red-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Посмотреть анкету
                      </button>
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
                  <p className="text-sm text-slate-500 py-12 text-center bg-white border border-slate-100 rounded-2xl">{t("Новые обращения в регистратуру отсутствуют.")}</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* MENU: APPOINTMENTS */}
      {activeMenu === 'appointments' && (
        <motion.div
          key="appointments"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div>
            <h3 className="font-bold text-slate-800 text-base">{t("Записи на донацию")}</h3>
            <p className="text-xs text-slate-500">{t("Здесь отображаются записи доноров в ваш центр крови на выбранные даты.")}</p>
          </div>
            
          <div className="space-y-8">
            {Object.entries(
              appointments.reduce((acc, a) => {
                if (!acc[a.appointmentDate]) acc[a.appointmentDate] = [];
                acc[a.appointmentDate].push(a);
                return acc;
              }, {} as Record<string, any[]>)
            ).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, dayAppts]: [string, any]) => (
              <div key={date} className="space-y-3.5">
                <h4 className="font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span>{new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{dayAppts.length} чел.</span>
                </h4>
                <div className="space-y-3.5">
                  {dayAppts.map(a => (
                    <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{a.donorName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                              a.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              a.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              a.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {a.status === 'pending' ? 'Ожидает' : a.status === 'confirmed' ? 'Подтверждена' : a.status === 'completed' ? 'Завершена' : a.status === 'cancelled' ? 'Отменена' : 'Неявка'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1 font-light flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{a.appointmentTime || '-'}</span>
                          <span>•</span>
                          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{a.donorBg}</span>
                          <span>•</span>
                          <span>{a.donationType === 'blood' ? 'Цельная кровь' : a.donationType === 'plasma' ? 'Плазма' : 'Тромбоциты'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {a.status === 'pending' && (
                          <button 
                            onClick={async () => {
                                await fetch(`${apiBase}/appointments/${a.id}`, {
                                    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'confirmed'})
                                });
                                loadAppointments();
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-xs transition-colors"
                          >
                            Подтвердить
                          </button>
                        )}
                        {(a.status === 'pending' || a.status === 'confirmed') && (
                          <button 
                            onClick={async () => {
                                await fetch(`${apiBase}/appointments/${a.id}`, {
                                    method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({status: 'completed'})
                                });
                                loadAppointments();
                                refreshDashboard();
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-xs transition-colors"
                          >
                            <Check className="w-4 h-4 mr-1" /> Завершена
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-sm py-12 text-center text-slate-400">Нет записей на донацию</div>
            )}
          </div>
        </motion.div>
      )}

      {/* MENU 4: ALERTOR SEND MASS EMAILS/PUSH/SMS */}
      {activeMenu === 'notify' && (
        <motion.div
          key="notify"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col gap-6 w-full"
        >
          {/* Form alert settings rules */}
          <div className={`w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 ${isQuickAlertOpen ? 'space-y-6' : ''}`}>
            <div 
              onClick={() => setIsQuickAlertOpen(!isQuickAlertOpen)} 
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{t("Быстрая рассылка оповещений о дефицитах")}</h3>
                <p className="text-sm text-slate-500 font-light mt-0.5">{t("Оперативная рассылка для закрытия дефицитов крови.")}</p>
              </div>
              <div className={`p-2 rounded-full transition-all duration-300 ${isQuickAlertOpen ? 'bg-red-50 text-red-600 rotate-90' : 'bg-slate-50 text-slate-400'}`}>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isQuickAlertOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className={isQuickAlertOpen ? "overflow-visible" : "overflow-hidden"}
                >
                  <div className="pt-6 border-t border-slate-100/50 space-y-6">
                    {notifySuccessMsg && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 leading-relaxed font-sans whitespace-pre-wrap">
                        {notifySuccessMsg}
                      </div>
                    )}

                    <form onSubmit={handleSendBroadcast} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Target blood selection */}
                        <div className="space-y-1.5 text-sm text-slate-700 font-semibold pb-3 sm:pb-0">
                          <label>{t("Группа крови:")}</label>
                          <div className="space-y-1 pt-1 font-medium">
                            {['I_O', 'II_A', 'III_B', 'IV_AB'].map(bg => (
                              <label key={bg} className="flex items-center text-sm font-semibold cursor-pointer">
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

                        <div className="space-y-3.5 text-sm">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700">{t("Резус-фактор:")}</label>
                            <select 
                              value={notifyForm.rhFactor} 
                              onChange={(e) => setNotifyForm({...notifyForm, rhFactor: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white font-medium"
                            >
                              <option value="both">{t("Любой резус-фактор (+/-)")}</option>
                              <option value="positive">{t("Только положительный (Rh+)")}</option>
                              <option value="negative">{t("Только отрицательный (Rh-)")}</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700">{t("Минимальный срок с последней сдачи (дней):")}</label>
                            <input 
                              type="number" 
                              value={notifyForm.minDaysSinceDonation}
                              onChange={(e) => setNotifyForm({...notifyForm, minDaysSinceDonation: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white font-medium"
                            />
                          </div>
                        </div>

                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <label className="flex items-start text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifyForm.excludeMedical}
                            onChange={(e) => setNotifyForm({...notifyForm, excludeMedical: e.target.checked})}
                            className="mt-0.5 mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block">{t("Исключить активные медотводы")}</span>
                            <span className="text-xs text-slate-400 block">{t("Система не побеспокоит доноров под запретом врача")}</span>
                          </div>
                        </label>

                        <label className="flex items-start text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifyForm.excludePause}
                            onChange={(e) => setNotifyForm({...notifyForm, excludePause: e.target.checked})}
                            className="mt-0.5 mr-2 rounded text-red-600 focus:ring-red-500 border-slate-300"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 text-sm block">{t("Учитывать личные паузы доноров")}</span>
                            <span className="text-xs text-slate-400 block">{t("Не отправлять тем, кто взял временную паузу")}</span>
                          </div>
                        </label>
                      </div>

                      <div className="space-y-1.5 pt-4 text-sm font-semibold">
                        <label>{t("Предпочтительный канал доставки рассылки:")}</label>
                        <div className="flex flex-wrap gap-4 pt-1 font-medium">
                          {[
                            { id: 'all', label: 'Оба канала (Push + Email)' },
                            { id: 'push', label: 'Только Push-уведомления' },
                            { id: 'email', label: 'Только письма на E-mail' }
                          ].map(chan => (
                            <label key={chan.id} className="flex items-center text-sm cursor-pointer font-semibold text-slate-700">
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

                      <div className="space-y-2 pt-4">
                        <div className="flex justify-between items-center text-sm relative">
                          <label className="font-semibold text-slate-700">{t("Текст извещения донорам:")}</label>
                          
                          {/* Dynamic Templates Menu Dropdown */}
                          <div className="relative flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNotifyForm({ ...notifyForm, messageText: '' });
                                setActiveTemplateId(null);
                                setSelectedTemplateGroups([]);
                              }}
                              className="bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              {t("Очистить")}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsTemplatesMenuOpen(!isTemplatesMenuOpen);
                                setIsAddingTemplate(false);
                                setTemplateError('');
                              }}
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              {t("Шаблоны")} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isTemplatesMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {isTemplatesMenuOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-2.5 space-y-2"
                                >
                                  <div className="flex justify-between items-center px-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                      {t("Доступные шаблоны")}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsTemplatesMenuOpen(false)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-red-650 hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  
                                  <div className={`${isAddingTemplate ? 'max-h-[140px]' : 'max-h-72'} overflow-y-auto custom-scrollbar space-y-0.5 pr-1 transition-all duration-200`}>
                                    {/* "Базовые шаблоны" folder item */}
                                    <div 
                                      onClick={() => setIsBaseTemplatesFolderOpen(!isBaseTemplatesFolderOpen)}
                                      className="flex justify-between items-center w-full h-8 text-left px-2 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-700 text-slate-700 cursor-pointer transition-colors group shrink-0"
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        {isBaseTemplatesFolderOpen ? (
                                          <FolderOpen className="w-4 h-4 text-red-650 shrink-0" />
                                        ) : (
                                          <Folder className="w-4 h-4 text-slate-400 group-hover:text-red-650 shrink-0" />
                                        )}
                                        <span className="truncate font-bold text-slate-800 group-hover:text-red-700">{t("Базовые шаблоны")}</span>
                                      </div>
                                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-400 group-hover:text-red-700 ${isBaseTemplatesFolderOpen ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Collapsible list of basic templates with identical spacing and heights */}
                                    {isBaseTemplatesFolderOpen && (
                                      <div className="pl-3 border-l border-slate-100 ml-3.5 space-y-0.5 transition-all">
                                        {templatesList.filter((t) => !t.isCustom).map((temp) => (
                                          <div 
                                            key={temp.id}
                                            onClick={() => {
                                              setActiveTemplateId(temp.id);
                                              const defaultGroups: string[] = [];
                                              setSelectedTemplateGroups(defaultGroups);
                                              
                                              let valText = '';
                                              if (temp.id === 'urgent_color') {
                                                valText = getUrgentColorText(defaultGroups);
                                              } else if (temp.id === 'plasma_call') {
                                                valText = getPlasmaCallText(defaultGroups);
                                              } else if (temp.id === 'platelet_call') {
                                                valText = getPlateletCallText(defaultGroups);
                                              } else if (temp.id === 'granulocyte_call') {
                                                valText = getGranulocyteCallText(defaultGroups);
                                              }

                                              setNotifyForm({
                                                ...notifyForm,
                                                messageText: valText
                                              });
                                              setIsTemplatesMenuOpen(false);
                                            }}
                                            className="flex justify-between items-center w-full h-8 text-left px-2 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-700 text-slate-700 cursor-pointer transition-colors group shrink-0"
                                          >
                                            <span className="truncate pr-2 font-bold text-slate-850 text-slate-800 group-hover:text-red-700">{temp.name}</span>
                                            <div className="w-6 h-6 flex items-center justify-center shrink-0"></div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Render custom templates */}
                                    {templatesList.filter((t) => t.isCustom).map((temp) => (
                                      <div 
                                        key={temp.id}
                                        onClick={() => {
                                          setActiveTemplateId(null);
                                          loadTemplateText(temp.text);
                                        }}
                                        className="flex justify-between items-center w-full h-8 text-left px-2 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-700 text-slate-700 cursor-pointer transition-colors group shrink-0"
                                      >
                                        <span className="truncate pr-2 font-bold text-slate-850 text-slate-800 group-hover:text-red-700">{temp.name}</span>
                                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteCustomTemplate(temp.id, e)}
                                            className="p-1 rounded-md text-slate-400 hover:text-red-650 hover:bg-red-50 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="border-t border-slate-100 pt-2">
                                    {!isAddingTemplate ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsAddingTemplate(true);
                                          setTemplateError('');
                                        }}
                                        className="w-full flex items-center justify-start gap-2 px-2 py-1.5 text-xs text-red-650 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-4 h-4 text-red-600" /> {t("Добавить")}
                                      </button>
                                    ) : (
                                      <div className="space-y-2 px-1 pb-1">
                                        <input
                                          type="text"
                                          placeholder={t("Название нового шаблона")}
                                          value={newTemplateName}
                                          onChange={(e) => {
                                            setNewTemplateName(e.target.value);
                                            setTemplateError('');
                                          }}
                                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-red-500 focus:outline-none"
                                        />
                                        <textarea
                                          placeholder={t("Текст нового шаблона")}
                                          value={newTemplateText}
                                          onChange={(e) => {
                                            setNewTemplateText(e.target.value);
                                            setTemplateError('');
                                          }}
                                          rows={3}
                                          className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-red-500 focus:outline-none"
                                        />
                                        {templateError && (
                                          <p className="text-[10px] text-red-600 font-medium leading-tight">{templateError}</p>
                                        )}
                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            onClick={handleSaveCustomTemplate}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-lg text-[10px] transition-colors cursor-pointer"
                                          >
                                            {t("Сохранить")}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsAddingTemplate(false);
                                              setNewTemplateName('');
                                              setNewTemplateText('');
                                              setTemplateError('');
                                            }}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2 rounded-lg text-[10px] transition-colors cursor-pointer"
                                          >
                                            {t("Отмена")}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        <textarea 
                          required
                          value={notifyForm.messageText}
                          onChange={(e) => setNotifyForm({...notifyForm, messageText: e.target.value.substring(0, 500)})}
                          placeholder={t("Донор-Алерт: Требуется срочное пополнение первой отрицательной...")}
                          rows={4}
                          className="w-full px-4 py-3 text-base border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none"
                        />

                         {/* Interactive Blood Group Builder for Basic Templates */}
                        {activeTemplateId && ['urgent_color', 'plasma_call', 'platelet_call', 'granulocyte_call'].includes(activeTemplateId) && (
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-3 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 block">
                                {activeTemplateId === 'urgent_color' && t("Выбрать группы крови относящиеся к дефициту:")}
                                {activeTemplateId === 'plasma_call' && t("Выбрать группы крови для срочного афереза плазмы:")}
                                {activeTemplateId === 'platelet_call' && t("Выбрать группы крови для срочного афереза тромбоцитов:")}
                                {activeTemplateId === 'granulocyte_call' && t("Выбрать группы крови относящиеся к дефициту гранулоцитов:")}
                              </span>
                              
                              <div className="relative group">
                                <select
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                      let newGroups;
                                      if (selectedTemplateGroups.includes(val)) {
                                        newGroups = selectedTemplateGroups.filter(g => g !== val);
                                      } else {
                                        newGroups = [...selectedTemplateGroups, val];
                                      }
                                      setSelectedTemplateGroups(newGroups);
                                      
                                      const newText = getUpdatedTemplateText(activeTemplateId, newGroups);
                                      setNotifyForm(prev => ({ ...prev, messageText: newText }));
                                      e.target.value = ""; // Reset dropdown selection
                                    }
                                  }}
                                  className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs rounded-xl pl-3 pr-8 py-1.5 font-bold outline-none focus:border-red-500 hover:border-slate-350 cursor-pointer shadow-xs transition-all"
                                  defaultValue=""
                                >
                                  <option value="" disabled>{t("Выбрать группу...")}</option>
                                  {['I(O) Rh+', 'I(O) Rh-', 'II(A) Rh+', 'II(A) Rh-', 'III(B) Rh+', 'III(B) Rh-', 'IV(AB) Rh+', 'IV(AB) Rh-'].map(g => (
                                    <option key={g} value={g}>
                                      {g} {selectedTemplateGroups.includes(g) ? "✓" : ""}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                            
                            {selectedTemplateGroups.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {selectedTemplateGroups.map((g) => (
                                  <span 
                                    key={g} 
                                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
                                  >
                                    {g}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newGroups = selectedTemplateGroups.filter(x => x !== g);
                                        setSelectedTemplateGroups(newGroups);
                                        const newText = getUpdatedTemplateText(activeTemplateId, newGroups);
                                        setNotifyForm(prev => ({ ...prev, messageText: newText }));
                                      }}
                                      className="text-red-400 hover:text-red-700 transition-colors cursor-pointer text-sm font-bold"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ))}
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTemplateGroups([]);
                                    const newText = getUpdatedTemplateText(activeTemplateId, []);
                                    setNotifyForm(prev => ({ ...prev, messageText: newText }));
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-red-600 font-bold underline ml-1.5 cursor-pointer"
                                >
                                  {t("Очистить все")}
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic">
                                {t("Группы не выбраны. Выберите одну или несколько групп из выпадающего списка, чтобы они автоматически появились в тексте шаблона.")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* LIVE RECIPIENT COUNT INDICATOR */}
                      <div className="p-4 bg-red-50/40 rounded-xl border border-red-100 flex justify-between items-center text-sm">
                        <span className="font-semibold text-red-850 text-red-800">
                          Рассылка будет отправлена строго:
                        </span>
                        <span className="bg-red-600 text-white font-mono font-bold text-sm px-4 py-1.5 rounded-full">
                          {notifyPreviewCount} подходящим донорам центра
                        </span>
                      </div>

                      <button 
                        type="submit" disabled={isSaving}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition duration-150 flex items-center justify-center gap-2.5 shadow-sm text-base"
                      >{isSaving ? 'Подождите...' : '<Send className="w-5.5 h-5.5" /> ОТПРАВИТЬ РАССЫЛКУ'}</button>

                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right sidebar: Alerts logs history */}
          <div className={`w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 ${isAlertsHistoryOpen ? 'space-y-4' : ''}`}>
            <div 
              onClick={() => setIsAlertsHistoryOpen(!isAlertsHistoryOpen)} 
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <div>
                <h3 className="font-bold text-slate-800 text-base">{t("Журнал отправленных алертов")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("История рассылок координатора с показателями доставленных уведомлений донорам:")}</p>
              </div>
              <div className={`p-2 rounded-full transition-all duration-300 ${isAlertsHistoryOpen ? 'bg-red-50 text-red-600 rotate-90' : 'bg-slate-50 text-slate-400'}`}>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isAlertsHistoryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                      {notifHistory.map(item => (
                        <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="text-[10px] uppercase font-semibold text-slate-400">
                              <span>{formatDateHuman(item.createdAt)}</span>
                            </div>
                            <p className="font-semibold text-slate-850 text-slate-800 italic leading-snug">« {item.messageText} »</p>
                          </div>
                          <div className="flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-200/60 pt-2.5 md:pt-0 md:pl-4 shrink-0 text-center">
                            <span className="px-3 py-1 bg-red-50 text-red-650 rounded-lg font-bold text-xs uppercase tracking-wide">
                              {item.channel === 'all' ? 'Push+E-mail' : (item.channel === 'push' ? 'Push' : 'E-mail')}
                            </span>
                          </div>
                        </div>
                      ))}
                      {notifHistory.length === 0 && (
                        <p className="text-xs text-slate-450 py-12 text-center text-slate-400">{t("В этом месяце рассылок дефицита не проводилось.")}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* MENU 5: NEWS CRUD */}
      {activeMenu === 'news' && (
        <motion.div
          key="news"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pl-2">
            <div className="flex-1 pr-4">
              <h3 className="font-bold text-slate-800 text-base">{t("Доска объявлений и новостей филиала")}</h3>
              <p className="text-xs text-slate-500 max-w-2xl">{t("Эти публикации видны всем гостям и донорам на общей публичной странице проекта.")}</p>
            </div>
            <button 
              onClick={() => {
                setEditingNews(null);
                setNewsForm({ title: '', content: '', isPublished: true, publishedAt: new Date().toISOString().split('T')[0] });
                setShowNewsModal(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center shrink-0 w-max"
            >
              <Plus className="w-4 h-4 mr-1" /> Опубликовать новость
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">{t("По статусу")}</label>
              <select
                value={newsStatusFilter}
                onChange={(e) => setNewsStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
              >
                <option value="all">{t("Все")}</option>
                <option value="published">{t("Опубликовано")}</option>
                <option value="unpublished">{t("Ещё не опубликована")}</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 pl-1">{t("По дате")}</label>
              <input
                type="date"
                min="2000-01-01"
                max="9999-12-31"
                value={newsDateFilter}
                onChange={(e) => {
                  let val = e.target.value;
                  const parts = val.split('-');
                  if (parts[0] && parts[0].length > 4) {
                    parts[0] = parts[0].slice(0, 4);
                    val = parts.join('-');
                  }
                  setNewsDateFilter(val);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
            </div>
            {newsDateFilter && (
              <div className="flex items-end pb-1 lg:flex-none">
                <button 
                  onClick={() => setNewsDateFilter('')}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl w-full sm:w-auto mt-2 sm:mt-0 lg:h-9"
                >
                  Сбросить дату
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {newsList.filter(item => {
              const nowIso = new Date().toISOString().split('T')[0];
              const itemDateIso = item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : '';
              const isActuallyPublished = itemDateIso && (itemDateIso <= nowIso);

              if (newsStatusFilter === 'published' && !isActuallyPublished) return false;
              if (newsStatusFilter === 'unpublished' && isActuallyPublished) return false;

              if (newsDateFilter && itemDateIso !== newsDateFilter) return false;

              return true;
            }).map(item => {
              const nowIso = new Date().toISOString().split('T')[0];
              const itemDateIso = item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : '';
              const isActuallyPublished = itemDateIso && itemDateIso <= nowIso;

              return (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-250 border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-500">{item.publishedAt ? formatDateHuman(item.publishedAt) : 'Проект'}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActuallyPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      {isActuallyPublished ? 'Опубликовано' : 'Ещё не опубликована'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap mb-6 truncate max-h-24">{item.content}</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      setEditingNews(item);
                      setNewsForm({ 
                        title: item.title, 
                        content: item.content, 
                        isPublished: true,
                        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                      });
                      setShowNewsModal(true);
                    }}
                    className="text-[13px] font-semibold text-slate-700 hover:underline"
                  >
                    Редактировать
                  </button>
                  <button 
                    onClick={() => handleNewsDelete(item.id)}
                    className="text-[13px] font-semibold text-red-600 hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </motion.div>
      )}

      {activeMenu === 'needs' && (
        <motion.div
          key="needs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t("Управление запасами крови (Донорский светофор)")}</h3>
              <p className="text-xs text-slate-500 mt-1">{t("Отрегулируйте уровень запасов для каждой группы крови и резус-фактора (100% - норма).")}</p>
            </div>
            <button
              onClick={handleNeedsSubmit}
              disabled={needsSaving}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {needsSaving ? 'Сохранение...' : (needsSuccess ? 'Сохранено!' : 'Сохранить изменения')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { id: 'I_pos', label: 'I (0)', rh: 'Rh+' },
              { id: 'I_neg', label: 'I (0)', rh: 'Rh-' },
              { id: 'II_pos', label: 'II (A)', rh: 'Rh+' },
              { id: 'II_neg', label: 'II (A)', rh: 'Rh-' },
              { id: 'III_pos', label: 'III (B)', rh: 'Rh+' },
              { id: 'III_neg', label: 'III (B)', rh: 'Rh-' },
              { id: 'IV_pos', label: 'IV (AB)', rh: 'Rh+' },
              { id: 'IV_neg', label: 'IV (AB)', rh: 'Rh-' }
            ].map(bg => {
              const val = needsForm[bg.id as keyof typeof needsForm] as number;
              let color = 'bg-emerald-500';
              let text = 'text-emerald-700';
              let borderColor = 'border-emerald-100';
              if (val < 30) { color = 'bg-red-600'; text = 'text-red-700'; borderColor = 'border-red-100'; }
              else if (val < 60) { color = 'bg-amber-400'; text = 'text-amber-700'; borderColor = 'border-amber-100'; }
              
              return (
                <div key={bg.id} className={`p-4 rounded-xl border ${borderColor} bg-white shadow-sm transition-colors`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-800 text-base">{bg.label}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${text} bg-white border border-slate-100 shadow-sm`}>{bg.rh}</span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative h-2 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div className={`absolute top-0 left-0 h-full ${color} transition-all duration-300`} style={{ width: `${val}%` }} />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={val}
                      onChange={(e) => setNeedsForm(prev => ({ ...prev, [bg.id]: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-transparent cursor-pointer"
                    />
                    <div className="flex justify-between items-center text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                      <span>{t("Критично")}</span>
                      <span className="font-bold text-slate-700">{val}%</span>
                      <span>{t("В норме")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* --- FLOATING DIALOGS & MODAL FORMS --- */}

      {/* REJECTION REASON INPUT FORM MODAL */}
      {rejectionModalLinkId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <h4 className="font-bold text-slate-800 text-sm mb-2">{t("Причина отклонения заявки")}</h4>
            <p className="text-xs text-slate-500 mb-4">{t("Укажите развернутую медицинскую или координационную причину отклонения. Донор увидит ее в своем профиле и сможет исправить анкету.")}</p>
            <form onSubmit={handleRejectPendingSubmit} className="space-y-4">
              <textarea 
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("Пример: В вашей выписке отсутствует подпись терапевта...")}
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
                  type="submit" disabled={isSaving} 
                  className="w-2/3 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl"
                >{isSaving ? 'Подождите...' : 'Отклонить заявку'}</button>
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
            <h4 className="font-bold text-slate-800 text-base mb-4">{t("Запись о совершенной донации")}</h4>
            <form onSubmit={handleAddDonation} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Дата процедуры:")}</label>
                <input 
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={donationForm.donationDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    const parts = val.split('-');
                    if (parts[0] && parts[0].length > 4) {
                      parts[0] = parts[0].slice(0, 4);
                      val = parts.join('-');
                    }
                    setDonationForm({ ...donationForm, donationDate: val });
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Тип заготовки:")}</label>
                <select 
                  required
                  value={donationForm.donationType}
                  onChange={(e) => setDonationForm({ ...donationForm, donationType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none bg-white font-medium"
                >
                  <option value="blood">{t("Цельная кровь (стандарт)")}</option>
                  <option value="plasma">{t("Плазма (Аферез)")}</option>
                  <option value="platelets">{t("Тромбоциты (Аферез)")}</option>
                  <option value="granulocytes">{t("Гранулоциты")}</option>
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Объем в мл (опционально):")}</label>
                <input 
                  type="number"
                  value={donationForm.volumeMl}
                  onChange={(e) => setDonationForm({ ...donationForm, volumeMl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-2 pb-1">
                <span>{t("Донация на платной основе?")}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={donationForm.isPaid} 
                    onChange={(e) => setDonationForm({ ...donationForm, isPaid: e.target.checked })} 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Внутренний комментарий:")}</label>
                <textarea 
                  value={donationForm.note}
                  onChange={(e) => setDonationForm({ ...donationForm, note: e.target.value })}
                  placeholder={t("Процедура без осложнений, самочувствие удовлетворительное")}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs">{isSaving ? 'Подождите...' : 'Записать в базу и пересчитать сроки'}</button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DONOR DETAILS MODAL */}
      {showEditDonorModal && (() => {
        const editDonorAgeError = (() => {
          if (!editDonorForm.birthDate) return null;
          const birthDateObj = new Date(editDonorForm.birthDate);
          if (isNaN(birthDateObj.getTime())) return 'Пожалуйста, введите корректную дату рождения';
          const today = new Date();
          let age = today.getFullYear() - birthDateObj.getFullYear();
          const m = today.getMonth() - birthDateObj.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
          }
          if (age < 18 || age > 65) {
            return `Возраст донора должен быть от 18 до 65 лет (сейчас: ${age < 0 ? 0 : age})`;
          }
          return null;
        })();

        const editDonorEmailError = (() => {
          if (!editDonorForm.email) return null;
          const emailRegex = /^.+@.+$/;
          if (!emailRegex.test(editDonorForm.email)) {
            return 'E-mail должен быть вида *@* (символы до и после @)';
          }
          return null;
        })();

        const editDonorWeightError = (() => {
          if (!editDonorForm.weight) return null;
          const w = parseFloat(editDonorForm.weight);
          if (isNaN(w) || w < 55) {
            return 'Минимальный вес должен быть не менее 55 кг';
          }
          return null;
        })();

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-fade">
              <button type="button" onClick={() => setShowEditDonorModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">✕</button>
              <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-8">{t("Редактировать данные донора")}</h3>
              
              {editError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold font-sans">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditDonorSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Фамилия <span className="text-red-500">*</span></label>
                    <input required type="text" value={editDonorForm.lastName} onChange={e => handleEditDonorNameChange('lastName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Имя <span className="text-red-500">*</span></label>
                    <input required type="text" value={editDonorForm.firstName} onChange={e => handleEditDonorNameChange('firstName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Отчество")}</label>
                    <input type="text" value={editDonorForm.middleName} onChange={e => handleEditDonorNameChange('middleName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="relative group/field">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Дата рождения <span className="text-red-500">*</span></span>
                    </label>
                    <input 
                      required 
                      type="date" 
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      value={editDonorForm.birthDate} 
                      onChange={e => {
                        let val = e.target.value;
                        const parts = val.split('-');
                        if (parts[0] && parts[0].length > 4) {
                          parts[0] = parts[0].slice(0, 4);
                          val = parts.join('-');
                        }
                        setEditDonorForm({...editDonorForm, birthDate: val});
                      }} 
                      className={`w-full text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none transition-colors ${
                        editDonorAgeError 
                          ? 'border-red-500 bg-red-50 focus:border-red-600 text-slate-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500'
                      }`} 
                    />
                    {editDonorAgeError && (
                      <p className="text-xs text-red-500 mt-1">{t("Возраст донора должен быть от 18 до 65 лет")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Пол")}</label>
                    <select value={editDonorForm.gender} onChange={e => setEditDonorForm({...editDonorForm, gender: e.target.value as 'male'|'female'})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500">
                      <option value="male">{t("Мужской")}</option>
                      <option value="female">{t("Женский")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Телефон <span className="text-red-500">*</span></label>
                    <input required type="tel" value={editDonorForm.phone} onChange={handleEditDonorPhoneChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500" />
                  </div>
                  <div className="relative group/field">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>E-mail <span className="text-red-500">*</span></span>
                    </label>
                    <input 
                      required 
                      type="email" 
                      value={editDonorForm.email} 
                      onChange={e => setEditDonorForm({...editDonorForm, email: e.target.value})} 
                      className={`w-full text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none transition-colors ${
                        editDonorEmailError 
                          ? 'border-red-500 bg-red-50 focus:border-red-600 text-slate-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500'
                      }`} 
                    />
                    {editDonorEmailError && (
                      <p className="text-xs text-red-500 mt-1">{t("Введите корректный почтовый ящик (с символом @)")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Дополнительный статус")}</label>
                    <select value={editDonorForm.status} onChange={e => setEditDonorForm({...editDonorForm, status: e.target.value as DonorStatus})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500">
                      <option value="active">{t("Активный")}</option>
                      <option value="inactive">{t("Неактивный")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="relative group/field">
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Вес (кг) <span className="text-red-500">*</span></span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="55" 
                      max="250" 
                      step="0.1" 
                      value={editDonorForm.weight} 
                      onChange={e => setEditDonorForm({...editDonorForm, weight: e.target.value})} 
                      className={`w-full text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none transition-colors ${
                        editDonorWeightError 
                          ? 'border-red-500 bg-red-50 focus:border-red-600 text-slate-800' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500'
                      }`} 
                    />
                    {editDonorWeightError && (
                      <p className="text-xs text-red-500 mt-1">{t("Минимальный вес — 55 кг.")}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Группа крови")}</label>
                    <select value={editDonorForm.bloodGroup} onChange={e => setEditDonorForm({...editDonorForm, bloodGroup: e.target.value as BloodGroup})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500">
                      <option value="I_O">I (O)</option>
                      <option value="II_A">II (A)</option>
                      <option value="III_B">III (B)</option>
                      <option value="IV_AB">IV (AB)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Резус-фактор")}</label>
                    <select value={editDonorForm.rhFactor} onChange={e => setEditDonorForm({...editDonorForm, rhFactor: e.target.value as RhFactor})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500">
                      <option value="positive">Rh+</option>
                      <option value="negative">Rh-</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100/60 mt-8 font-sans">
                  <button type="button" onClick={() => setShowEditDonorModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                    Отмена
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs hover:shadow-sm transition-all animate-fade">{isSaving ? 'Подождите...' : 'Сохранить изменения'}</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ADD MEDICAL RESTRICTION FORM MODAL */}
      {showAddMedicalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative">
            <button onClick={() => setShowAddMedicalModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-4">{t("Наложение медицинского отвода")}</h4>
            <form onSubmit={handleAddMedical} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Причина ограничения:")}</label>
                <textarea 
                  required
                  value={medicalForm.reason}
                  onChange={(e) => setMedicalForm({ ...medicalForm, reason: e.target.value })}
                  placeholder={t("Отклонение в клиническом анализе крови, ОРВИ, татуировка...")}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block">{t("Дата начала отвода:")}</label>
                <input 
                  type="date"
                  required
                  value={medicalForm.startDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    const parts = val.split('-');
                    if (parts[0] && parts[0].length > 4) {
                      parts[0] = parts[0].slice(0, 4);
                      val = parts.join('-');
                    }
                    setMedicalForm({ ...medicalForm, startDate: val });
                  }}
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
                  <strong>{t("Установить пожизненный (бессрочный)")}</strong>
                </label>
              </div>

              {!medicalForm.isPermanent && (
                <div className="space-y-1 text-xs">
                  <label className="font-semibold block">{t("Дата окончания ограничения:")}</label>
                  <input 
                    type="date"
                    required
                    value={medicalForm.endDate}
                    onChange={(e) => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setMedicalForm({ ...medicalForm, endDate: val });
                    }}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none"
                  />
                </div>
              )}

              <button type="submit" disabled={isSaving} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs">{isSaving ? 'Подождите...' : 'Накладывать медотвод'}</button>
            </form>
          </div>
        </div>
      )}

      {/* SHADCN-LIKE USER INPUT NEWS ADD DIALOG */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm relative border-0">
            <button onClick={() => setShowNewsModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-4">{t("Публикация новости на главную")}</h4>
            <form onSubmit={handleNewsSubmit} className="space-y-3.5">
              <div className="space-y-1 text-xs">
                <label className="font-semibold block text-slate-700">{t("Заголовок новости:")}</label>
                <input 
                  type="text"
                  required
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block text-slate-700">{t("Текст новости:")}</label>
                <textarea 
                  required
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold block text-slate-700">{t("Дата публикации:")}</label>
                <input 
                  type="date"
                  required
                  min="2000-01-01"
                  max="9999-12-31"
                  value={newsForm.publishedAt}
                  onChange={(e) => {
                    let val = e.target.value;
                    const parts = val.split('-');
                    if (parts[0] && parts[0].length > 4) {
                      parts[0] = parts[0].slice(0, 4);
                      val = parts.join('-');
                    }
                    setNewsForm({ ...newsForm, publishedAt: val });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all bg-slate-50 focus:bg-white"
                />
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors mt-2">{isSaving ? 'Подождите...' : 'Сохранить публикацию'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL REGISTER DONOR MODAL */}
      {showManualRegModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowManualRegModal(false)} className="absolute right-4 top-4 p-1.5 text-slate-400">✕</button>
            <h4 className="font-bold text-slate-800 text-base mb-2">{t("Занести донора в реестр переливания")}</h4>
            <p className="text-xs text-slate-500 mb-4">{t("Данное действие создаст учетную запись донора. Ему на e-mail будет выслана ссылка для входа и временный пароль.")}</p>
            
            {manualError && <p className="p-2 border border-red-100 rounded-lg bg-red-50 text-red-700 text-xs mt-1 mb-2.5">{manualError}</p>}
            
            <form onSubmit={handleManualReg} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Фамилия <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder={t("Иванов")} value={manualForm.lastName} onChange={(e) => handleManualNameChange('lastName', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Имя <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder={t("Иван")} value={manualForm.firstName} onChange={(e) => handleManualNameChange('firstName', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">{t("Отчество")}</label>
                <input type="text" placeholder={t("Сергеевич")} value={manualForm.middleName} onChange={(e) => handleManualNameChange('middleName', e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Дата рождения <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required 
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 65)).toISOString().split('T')[0]}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    value={manualForm.birthDate} 
                    onChange={(e) => {
                      let val = e.target.value;
                      const parts = val.split('-');
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join('-');
                      }
                      setManualForm({...manualForm, birthDate: val});
                    }} 
                    className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                      isBirthDateInvalid() 
                        ? 'border-red-500 bg-red-50 focus:border-red-600' 
                        : 'border-slate-200 focus:border-red-500'
                    }`}
                  />
                  {isBirthDateInvalid() && (
                    <p className="text-xs text-red-500 mt-1">{t("Возраст донора должен быть от 18 до 65 лет")}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Пол <span className="text-red-500">*</span></label>
                  <select value={manualForm.gender} onChange={(e) => setManualForm({...manualForm, gender: e.target.value as any})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white">
                    <option value="male">{t("Мужской")}</option>
                    <option value="female">{t("Женский")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Группа крови <span className="text-red-500">*</span></label>
                  <select value={manualForm.bloodGroup} onChange={(e) => setManualForm({...manualForm, bloodGroup: e.target.value as any})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white">
                    <option value="I_O">{t("I (O) - Первая")}</option>
                    <option value="II_A">{t("II (A) - Вторая")}</option>
                    <option value="III_B">{t("III (B) - Третья")}</option>
                    <option value="IV_AB">{t("IV (AB) - Четвертая")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Резус-фактор <span className="text-red-500">*</span></label>
                  <select value={manualForm.rhFactor} onChange={(e) => setManualForm({...manualForm, rhFactor: e.target.value as any})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:border-red-500 focus:outline-none bg-white">
                    <option value="positive">Rh +</option>
                    <option value="negative">Rh -</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Вес донора (кг) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  required 
                  min="55" 
                  max="200" 
                  value={manualForm.weight} 
                  onChange={(e) => setManualForm({...manualForm, weight: e.target.value})} 
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                    isWeightInvalid() 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : 'border-slate-200 focus:border-red-500'
                  }`}
                />
                {isWeightInvalid() && (
                  <p className="text-xs text-red-500 mt-1">{t("К донорству допускаются лица с массой тела не менее 55 кг")}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Номер телефона <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  required 
                  maxLength={13}
                  value={manualForm.phone} 
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
                    setManualForm({...manualForm, phone: inputVal.substring(0, 13)});
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
                  placeholder="test@mail.ru" 
                  value={manualForm.email} 
                  onChange={(e) => setManualForm({...manualForm, email: e.target.value})} 
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none transition-colors ${
                    isEmailInvalid() 
                      ? 'border-red-500 bg-red-50 focus:border-red-600' 
                      : 'border-slate-200 focus:border-red-500'
                  }`}
                />
                {isEmailInvalid() && manualForm.email.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">{t("Введите корректный e-mail")}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Временный пароль для входа <span className="text-red-500">*</span></label>
                <input type="text" required value={manualForm.password} onChange={(e) => setManualForm({...manualForm, password: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl font-mono focus:border-red-500 focus:outline-none text-red-700 bg-red-50" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full mt-4 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-medium py-3 rounded-xl transition duration-150 text-sm">{isSaving ? 'Подождите...' : 'Создать профиль донора (Подтвержден на месте)'}</button>
            </form>
          </div>
        </div>
      )}

      {pendingDonorProfile !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button 
              onClick={() => setPendingDonorProfile(null)} 
              className="absolute right-6 top-6 p-1.5 text-slate-400 hover:bg-slate-105 hover:text-slate-700 rounded-full transition-all cursor-pointer"
            >
              ✕
            </button>

            {/* Header section with profile name and status badge */}
            <div>
              <span className="inline-block bg-rose-50 text-rose-600 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full mb-2">
                Анкета кандидата на подтверждение
              </span>
              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                {pendingDonorProfile.card.donor.lastName} {pendingDonorProfile.card.donor.firstName} {pendingDonorProfile.card.donor.middleName || ''}
              </h3>
              <p className="text-xs text-slate-500 font-light mt-1">
                Дата регистрации: {formatDateHuman(pendingDonorProfile.card.donor.createdAt)}
              </p>
            </div>

            {/* Styled Personal Information Block */}
            <div className="space-y-4">
              <div className="divide-y divide-slate-100/80 text-xs text-slate-700/90 rounded-2xl p-4.5 bg-slate-50/40">
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("ФИО")}</span>
                  <span className="font-bold text-slate-800 text-right">
                    {pendingDonorProfile.card.donor.lastName} {pendingDonorProfile.card.donor.firstName} {pendingDonorProfile.card.donor.middleName || ''}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("Дата рождения")}</span>
                  <span className="font-bold text-slate-800 text-right">
                    {formatDateHuman(pendingDonorProfile.card.donor.birthDate)} ({
                      (() => {
                        const birthDate = new Date(pendingDonorProfile.card.donor.birthDate);
                        const today = new Date();
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                        return age;
                      })()
                    } лет)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("Пол")}</span>
                  <span className="font-bold text-slate-800 text-right">
                    {pendingDonorProfile.card.donor.gender === 'male' ? 'Мужской' : 'Женский'}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("Вес")}</span>
                  <span className="font-bold text-slate-800 text-right">
                    {pendingDonorProfile.card.donor.weight} кг
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("Группа и Резус-фактор")}</span>
                  <div className="flex gap-2">
                    <span className="bg-red-50 border border-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      {formatBloodGroup(pendingDonorProfile.card.donor.bloodGroup)}
                    </span>
                    <span className="font-bold px-1 py-0.5 text-xs text-slate-800">
                      {formatRhFactor(pendingDonorProfile.card.donor.rhFactor)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("Телефон")}</span>
                  <span className="font-bold text-slate-800 text-right">{pendingDonorProfile.card.donor.phone}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between py-2.5 gap-2">
                  <span className="text-slate-500 font-medium font-sans">{t("E-mail / Личный ID")}</span>
                  <span className="font-bold text-slate-800 text-right">
                    {pendingDonorProfile.card.donor.email || pendingDonorProfile.card.donor.onesignalPlayerId || 'Не указан'}
                  </span>
                </div>
              </div>
            </div>

            {/* Exclusions or Medical limitations */}
            {pendingDonorProfile.card.medicalNotes && pendingDonorProfile.card.medicalNotes.length > 0 && (
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <span className="block text-[10px] text-red-500 uppercase tracking-wider font-bold">{t("Медицинские ограничения и медотводы")} ({pendingDonorProfile.card.medicalNotes.length})</span>
                <div className="space-y-2">
                  {pendingDonorProfile.card.medicalNotes.map((note: any) => (
                    <div key={note.id} className="p-3.5 rounded-xl border border-red-150 bg-red-50/30 text-xs text-slate-700">
                      <p className="font-semibold text-red-800">{t("Причина")}: {note.reason}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Период: с {formatDateHuman(note.startDate)} по {note.endDate ? formatDateHuman(note.endDate) : 'бессрочно'}
                      </p>
                      {note.isActive && (
                        <span className="inline-block mt-1 bg-red-150 text-red-900 border border-red-200 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Действует в настоящий момент
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer controls inside modal */}
            <div className="border-t border-slate-200/80 pt-4 flex flex-col sm:flex-row justify-end gap-2.5">
              <button 
                onClick={() => {
                  handleConfirmPending(pendingDonorProfile.linkId);
                  setPendingDonorProfile(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" /> Одобрить анкету
              </button>
              <button 
                onClick={() => {
                  setRejectionModalLinkId(pendingDonorProfile.linkId);
                  setRejectionReason('');
                  setPendingDonorProfile(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" /> Отклонить
              </button>
              <button 
                onClick={() => setPendingDonorProfile(null)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-4.5 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
