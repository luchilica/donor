import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Calendar, Award, ShieldAlert, Clock, AlertTriangle, 
  Settings, Check, Bell, RefreshCw, X, Plus, ExternalLink,
  Home, User, Link, Pause, MapPin, Download, Mail, MessageSquare, Inbox,
  Eye, EyeOff
} from 'lucide-react';
import { Donor, DonorCenter, Donation, MedicalNote, BloodCenter, formatBloodGroup, formatRhFactor, getGamificationStatus } from '../types';
import { calculateNextDates } from '../utils/intervals';
import { ConfirmationModal } from './ConfirmationModal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DonorSectionProps {
  donor: Donor;
  links: DonorCenter[];
  donations: Donation[];
  medicalNotes: MedicalNote[];
  readiness: { ready: boolean; reason?: string; pendingConfirmation?: boolean };
  centers: BloodCenter[];
  onRefresh: () => void;
  apiBase: string;
  token: string;
}

export default function DonorSection({ donor, links, donations, medicalNotes, readiness, centers, onRefresh, apiBase, token }: DonorSectionProps) {
  const { t } = useLanguage();

  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'profile' | 'history' | 'links' | 'pause' | 'notifications' | 'account'>('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Set local pause states
  const [pauseForm, setPauseForm] = useState({
    personalPause: donor.personalPause,
    personalPauseUntil: donor.personalPauseUntil || '',
    personalPauseNote: donor.personalPauseNote || ''
  });
  const [pauseSuccess, setPauseSuccess] = useState('');

  // Notifications toggles
  const [notifForm, setNotifForm] = useState({
    pushEnabled: donor.pushEnabled,
    emailNotificationsEnabled: donor.emailNotificationsEnabled
  });
  const [notifSuccess, setNotifSuccess] = useState('');

  // Received notifications list states
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const unreadCount = notificationsHistory.filter(n => !n.isRead).length;

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

  const fetchNotificationsHistory = async () => {
    try {
      setLoadingNotifications(true);
      const res = await fetch(`${apiBase}/donor/notifications/${donor.id}`, {
        headers: { 'Authorization': token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationsHistory(data.notifications || []);
      }
    } catch (e) {
      console.error('Error fetching notifications history', e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetch(`${apiBase}/donor/notifications/read-all`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ donorId: donor.id })
      });
      // Update local state
      setNotificationsHistory(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Error marking as read', e);
    }
  };

  React.useEffect(() => {
    fetchNotificationsHistory();
  }, [donor.id]);

  React.useEffect(() => {
    if (activeMenu === 'notifications') {
      markAllAsRead();
    }
  }, [activeMenu]);

  // Additional link center state
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Security password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const getNewPasswordErrorStr = (val: string): string => {
    if (!val) return '';
    if (val.length < 6) return 'Пароль должен быть не менее 6 символов';
    const hasLetter = /[a-zA-Zа-яА-ЯёЁіІўЎ]/.test(val);
    const hasDigit = /\d/.test(val);
    if (!hasLetter || !hasDigit) {
      return 'пароль не надёжный должны присутствовать цифры и буквы';
    }
    return '';
  };

  const getRepeatPasswordErrorStr = (val: string): string => {
    if (!val) return '';
    if (val !== newPassword) {
      return 'Неверный пароль';
    }
    return '';
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Пароль должен быть не менее 6 символов');
      return;
    }
    const hasLetter = /[a-zA-Zа-яА-ЯёЁіІўЎ]/.test(newPassword);
    const hasDigit = /\d/.test(newPassword);
    if (!hasLetter || !hasDigit) {
      setPasswordError('пароль не надёжный должны присутствовать цифры и буквы');
      return;
    }

    if (repeatPassword !== newPassword) {
      setPasswordError('Неверный пароль');
      return;
    }

    requestConfirm({
      title: 'Обновить пароль?',
      message: 'Вы уверены, что хотите изменить пароль вашей учетной записи?',
      variant: 'warning',
      confirmText: 'Обновить',
      onConfirm: () => {
        setPasswordSuccess('Пароль успешно обновлен!');
        setCurrentPassword('');
        setNewPassword('');
        setRepeatPassword('');
        closeConfirm();
      }
    });
  };

  const formatBelarusPhone = (val: string): string => {
    if (!val) return '+375';
    const digits = val.replace(/\D/g, '');
    if (digits.startsWith('375')) {
      const remaining = digits.slice(3, 12);
      return '+375' + remaining;
    } else {
      return '+375' + digits.slice(0, 9);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+375')) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.startsWith('375')) {
        val = '+375' + digitsOnly.slice(3, 12);
      } else {
        val = '+375';
      }
    } else {
      const afterPrefix = val.slice(4).replace(/\D/g, '').slice(0, 9);
      val = '+375' + afterPrefix;
    }
    setProfileForm(prev => ({ ...prev, phone: val }));
  };

  const handleNameChange = (field: 'lastName' | 'firstName' | 'middleName', val: string) => {
    const lettersOnly = val.replace(/[^a-zA-Zа-яА-ЯёЁіІўЎ\-]/g, '');
    setProfileForm(prev => ({ ...prev, [field]: lettersOnly }));
  };

  const handleCancelEdit = () => {
    setProfileForm({
      lastName: donor.lastName,
      firstName: donor.firstName,
      middleName: donor.middleName || '',
      birthDate: donor.birthDate ? donor.birthDate.split('T')[0] : '',
      gender: donor.gender,
      phone: formatBelarusPhone(donor.phone),
      email: donor.email || '',
      weight: donor.weight,
      bloodGroup: donor.bloodGroup,
      rhFactor: donor.rhFactor
    });
    setEditError('');
    setEditSuccess('');
    setIsEditingProfile(false);
  };

  const handleStartEdit = () => {
    setProfileForm({
      lastName: donor.lastName,
      firstName: donor.firstName,
      middleName: donor.middleName || '',
      birthDate: donor.birthDate ? donor.birthDate.split('T')[0] : '',
      gender: donor.gender,
      phone: formatBelarusPhone(donor.phone),
      email: donor.email || '',
      weight: donor.weight,
      bloodGroup: donor.bloodGroup,
      rhFactor: donor.rhFactor
    });
    setEditError('');
    setEditSuccess('');
    setIsEditingProfile(true);
  };

  const [profileForm, setProfileForm] = useState({
    lastName: donor.lastName,
    firstName: donor.firstName,
    middleName: donor.middleName || '',
    birthDate: donor.birthDate ? donor.birthDate.split('T')[0] : '',
    gender: donor.gender,
    phone: formatBelarusPhone(donor.phone),
    email: donor.email || '',
    weight: donor.weight,
    bloodGroup: donor.bloodGroup,
    rhFactor: donor.rhFactor
  });
  const [editSuccess, setEditSuccess] = useState('');
  const [editError, setEditError] = useState('');

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
      centerId: 0,
      appointmentDate: '',
      appointmentTime: '10:00',
      donationType: 'blood'
  });
  const [appointmentSuccess, setAppointmentSuccess] = useState('');

  React.useEffect(() => {
    setProfileForm({
      lastName: donor.lastName,
      firstName: donor.firstName,
      middleName: donor.middleName || '',
      birthDate: donor.birthDate ? donor.birthDate.split('T')[0] : '',
      gender: donor.gender,
      phone: formatBelarusPhone(donor.phone),
      email: donor.email || '',
      weight: donor.weight,
      bloodGroup: donor.bloodGroup,
      rhFactor: donor.rhFactor
    });
  }, [donor.id, donor.lastName, donor.firstName, donor.middleName, donor.birthDate, donor.gender, donor.phone, donor.email, donor.weight, donor.bloodGroup, donor.rhFactor]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess('');
    setEditError('');
    if (profileForm.phone.length !== 13) {
      setEditError('Номер телефона должен содержать ровно 13 символов (например, +375XXXXXXXXX)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setEditError('E-mail должен быть в формате имя@домен (например, donor@example.com)');
      return;
    }

    requestConfirm({
      title: 'Сохранить изменения?',
      message: 'Вы уверены, что хотите обновить личные данные профиля?',
      variant: 'info',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const res = await fetch(`${apiBase}/donor/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({
              donorId: donor.id,
              ...profileForm
            })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Ошибка при сохранении профиля');
          }
          setEditSuccess('Профиль успешно сохранен и отправлен в центр крови для подтверждения!');
          setIsEditingProfile(false);
          onRefresh();
        } catch (err: any) {
          setEditError(err.message || 'Ошибка обновления профиля');
        } finally {
          setIsSaving(false);
          closeConfirm();
        }
      }
    });
  };

  const triggerRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // Submit pause changes
  const handlePauseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPauseSuccess('');
    requestConfirm({
      title: 'Сохранить настройки паузы?',
      message: 'Вы уверены, что хотите обновить статус вашей паузы? Во время активной паузы вы не будете получать приглашения на донацию.',
      variant: 'warning',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        setIsSaving(true);
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
        closeConfirm();
      }
    });
  };

  // Submit notifications settings
  const handleNotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess('');
    requestConfirm({
      title: 'Сохранить настройки уведомлений?',
      message: 'Текущие каналы для связи будут обновлены. Вы уверены?',
      variant: 'info',
      confirmText: 'Сохранить',
      onConfirm: async () => {
        setIsSaving(true);
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
        closeConfirm();
      }
    });
  };

  // Resubmit a rejected center application
  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.centerId || !appointmentForm.appointmentDate) return;

    if (donor.status !== 'active') {
        alert(t('Вы должны быть подтвержденным донором для записи'));
        return;
    }

    if (!readiness.ready) {
        alert(readiness.reason || t('Запись недоступна из-за действующего отвода или периода восстановления'));
        return;
    }

    const link = links.find(l => l.centerId === appointmentForm.centerId);
    if (!link || link.status !== 'confirmed') {
        alert(t('Вы должны быть прикреплены к выбранному центру крови'));
        return;
    }

    const apptTime = appointmentForm.appointmentTime || '10:00';
    if (apptTime < '09:00' || apptTime > '17:00') {
        alert(t('Запись возможна только в рабочее время с 09:00 до 17:00'));
        return;
    }

    try {
        const res = await fetch(`${apiBase}/appointments`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                donorId: donor.id,
                centerId: appointmentForm.centerId,
                appointmentDate: appointmentForm.appointmentDate,
                appointmentTime: appointmentForm.appointmentTime,
                donationType: appointmentForm.donationType
            })
        });
        if (res.ok) {
            setShowAppointmentModal(false);
            setAppointmentSuccess('Вы успешно записаны на донацию. Ждем вас!');
            setTimeout(() => setAppointmentSuccess(''), 5000);
        }
    } catch {}
  };

  const handleResubmit = (centerId: number) => {
    requestConfirm({
      title: 'Переподать заявку?',
      message: 'Вы уверены, что хотите снова отправить заявку на прикрепление к этому центру крови?',
      variant: 'info',
      confirmText: 'Отправить',
      onConfirm: async () => {
        setIsSaving(true);
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
            // alert('Заявка успешно переподана в центр крови! Статус изменен на Ожидание.');
            onRefresh();
          }
        } catch (err) {
          // alert('Ошибка при повторной отправке');
        }
        closeConfirm();
      }
    });
  };

  // Set center as primary (home)
  const handleSetPrimary = (centerId: number) => {
    requestConfirm({
      title: 'Сделать домашним центром?',
      message: 'Вы хотите установить этот центр крови как основной (домашний) для вашей донорской активности?',
      variant: 'info',
      confirmText: 'Установить',
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const res = await fetch(`${apiBase}/donor/set-primary-center`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': token
            },
            body: JSON.stringify({ donorId: donor.id, centerId })
          });
          if (res.ok) {
            onRefresh();
          } else {
            const data = await res.json();
          }
        } catch (err) {}
        closeConfirm();
      }
    });
  };

  // Send secondary link application
  const handleCenterLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    if (!selectedCenterId) {
      setLinkError('Пожалуйста, укажите медицинский центр');
      return;
    }

    requestConfirm({
      title: 'Отправить заявку?',
      message: 'Вы уверены, что хотите подать заявку на прикрепление к выбранному центру крови?',
      variant: 'info',
      confirmText: 'Отправить',
      onConfirm: async () => {
        setIsSaving(true);
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
        } finally {
          setIsSaving(false);
          closeConfirm();
        }
      }
    });
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
  const grCounts = donations.filter(d => (d.donationType || d.type) === 'granulocytes').length;
  const totalDonations = donor.donationsCount || 0;

  const bloodFree = donor.bloodFreeCount || 0;
  const compFree = donor.compFreeCount || 0;
  const bloodPaid = donor.bloodPaidCount || 0;
  const compPaid = donor.compPaidCount || 0;

  const totalFreeDonations = bloodFree + compFree;
  const totalPaidDonations = bloodPaid + compPaid;

  const gameStatus = getGamificationStatus(bloodFree, compFree, bloodPaid, compPaid);

  const last12MonthsData = React.useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const result: { name: string; count: number; volume: number }[] = [];
    
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const year = d.getFullYear() % 100;
      const label = `${months[mIndex]} '${year}`;
      
      let mCount = 0;
      let mVolume = 0;
      
      donations.forEach(don => {
        const donDateStr = don.donationDate || don.date;
        if (donDateStr) {
          const donDate = new Date(donDateStr);
          if (donDate.getMonth() === mIndex && donDate.getFullYear() === d.getFullYear()) {
            mCount++;
            mVolume += don.volumeMl || don.volume || 450;
          }
        }
      });

      result.push({
        name: label,
        count: mCount,
        volume: mVolume
      });
    }
    return result;
  }, [donations]);

  const homeCenter = centers.find(c => {
    const primaryLink = links.find(l => l.donorId === donor.id && l.isPrimary);
    return c.id === primaryLink?.centerId;
  });

  let nextBloodDate = null;
  let nextAferesisDate = null;
  let nextGranDate = null;
  let bloodDays = 60, aferezisDays = 14, granulocytesDays = 30;

  if (donor.lastDonationDate && donor.lastDonationType) {
    const datesInfo = calculateNextDates(donor.lastDonationType, bCounts, new Date(donor.lastDonationDate));
    nextBloodDate = datesInfo.nextBloodDate;
    nextAferesisDate = datesInfo.nextAferesisDate;
    nextGranDate = datesInfo.nextGranulocytesDate;

    const isEveryFifth = bCounts > 0 && bCounts % 5 === 0;
    switch (donor.lastDonationType) {
      case 'blood':
        bloodDays = isEveryFifth ? 90 : 60;
        aferezisDays = 30;
        granulocytesDays = isEveryFifth ? 60 : 30;
        break;
      case 'plasma':
      case 'platelets':
        bloodDays = 14;
        aferezisDays = 14;
        granulocytesDays = 14;
        break;
      case 'granulocytes':
        bloodDays = 30;
        aferezisDays = 30;
        granulocytesDays = 30;
        break;
    }
  }

  let recoveryProgress = 100;
  let recoveryDaysPassed = 0;
  let recoveryDaysTotal = 0;
  let recoveryDaysLeft = 0;

  if (!readiness.ready) {
    if (donor.lastDonationDate && donor.nextAvailableDate) {
      const lastDate = new Date(donor.lastDonationDate).getTime();
      const nextDate = new Date(donor.nextAvailableDate).getTime();
      const today = new Date().getTime();

      if (nextDate > lastDate) {
        recoveryDaysTotal = Math.ceil((nextDate - lastDate) / (1000 * 60 * 60 * 24));
        recoveryDaysPassed = Math.max(0, Math.ceil((today - lastDate) / (1000 * 60 * 60 * 24)));
        recoveryDaysLeft = Math.max(0, Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24)));
        recoveryProgress = Math.min(100, Math.max(0, (recoveryDaysPassed / recoveryDaysTotal) * 100));
      } else {
        recoveryProgress = 0;
      }
    } else {
      recoveryProgress = 0;
    }
  }

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
          <p className="text-xs text-slate-400 mt-1 font-medium">{t("Донор с")} {new Date(donor.createdAt).toLocaleDateString('ru-RU')}</p>

          <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatBloodGroup(donor.bloodGroup)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">{t("Группа")}</span>
            </div>
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatRhFactor(donor.rhFactor)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">{t("Резус")}</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">{t("Вес:")}</span>
              <span className="text-slate-700 font-medium">{donor.weight || '—'} кг</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">{t("Возраст:")}</span>
              <span className="text-slate-700 font-medium">{calcAge(donor.birthDate)} лет</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">{t("Донаций:")}</span>
              <span className="text-slate-700 font-medium">{totalDonations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">{t("Статус:")}</span>
              <span className={readiness.ready ? 'text-emerald-500 font-bold' : readiness.pendingConfirmation ? 'text-amber-500 font-bold' : 'text-red-700 font-bold'}>
                {readiness.ready ? 'Готов к сдаче' : readiness.pendingConfirmation ? 'На подтверждении' : 'Отвод'}
              </span>
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
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 relative ${isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-500 font-bold hover:bg-slate-50'}`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                <span className="text-sm leading-none">{it.label}</span>
                {it.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                )}
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
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">{t("Личная информация")}</h3>
                {!isEditingProfile && (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Редактировать
                  </button>
                )}
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold font-sans">
                  {editError}
                </div>
              )}
              {editSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold font-sans">
                  {editSuccess}
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Фамилия")}</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.lastName} 
                        onChange={e => handleNameChange('lastName', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Имя")}</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.firstName} 
                        onChange={e => handleNameChange('firstName', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Отчество")}</label>
                      <input 
                        type="text" 
                        value={profileForm.middleName} 
                        onChange={e => handleNameChange('middleName', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Дата рождения")}</label>
                      <input 
                        type="date" 
                        required
                        disabled
                        value={profileForm.birthDate} 
                        onChange={e => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed opacity-70 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Пол")}</label>
                      <select 
                        value={profileForm.gender} 
                        disabled
                        onChange={e => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed opacity-70 focus:outline-none"
                      >
                        <option value="male">{t("Мужской")}</option>
                        <option value="female">{t("Женский")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Телефон")}</label>
                      <input 
                        type="text" 
                        required
                        value={profileForm.phone} 
                        onChange={handlePhoneChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">E-mail</label>
                      <input 
                        type="email" 
                        required
                        value={profileForm.email} 
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Вес (кг)")}</label>
                      <input 
                        type="number" 
                        required
                        step="0.1"
                        value={profileForm.weight} 
                        onChange={e => setProfileForm({ ...profileForm, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Группа крови")}</label>
                      <select 
                        value={profileForm.bloodGroup} 
                        onChange={e => setProfileForm({ ...profileForm, bloodGroup: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      >
                        <option value="I_O">I (O)</option>
                        <option value="II_A">II (A)</option>
                        <option value="III_B">III (B)</option>
                        <option value="IV_AB">IV (AB)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{t("Резус-фактор")}</label>
                      <select 
                        value={profileForm.rhFactor} 
                        onChange={e => setProfileForm({ ...profileForm, rhFactor: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-red-500"
                      >
                        <option value="positive">Rh+</option>
                        <option value="negative">Rh-</option>
                      </select>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100/80 text-sm mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                      <span className="text-slate-400 font-medium font-sans">{t("Всего донаций (накапливается автоматически)")}</span>
                      <span className="font-bold text-slate-500 text-right">{totalDonations}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                      <span className="text-slate-400 font-medium font-sans">{t("Последняя сдача (вносится автоматически)")}</span>
                      <span className="font-bold text-slate-500 text-right font-mono">
                        {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString('ru-RU') : 'Нет данных'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between py-4 gap-2">
                      <span className="text-slate-400 font-medium font-sans">{t("В системе с")}</span>
                      <span className="font-bold text-slate-500 text-right font-mono">{new Date(donor.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100/60 font-sans">
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Отмена
                    </button>
                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs hover:shadow-sm transition-all animate-fade disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="divide-y divide-slate-100/80 text-xs text-slate-700/90">
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("ФИО")}</span>
                    <span className="font-bold text-slate-800 text-right">{donor.lastName} {donor.firstName} {donor.middleName || ''}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Дата рождения")}</span>
                    <span className="font-bold text-slate-800 text-right">{new Date(donor.birthDate).toLocaleDateString('ru-RU')} ({calcAge(donor.birthDate)} лет)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Пол")}</span>
                    <span className="font-bold text-slate-800 text-right">{donor.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Телефон")}</span>
                    <span className="font-bold text-slate-800 text-right">{donor.phone}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">E-mail</span>
                    <span className="font-bold text-slate-800 text-right">{donor.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Вес")}</span>
                    <span className="font-bold text-slate-800 text-right">{donor.weight} кг</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Группа / Резус")}</span>
                    <div className="flex gap-2">
                      <span className="bg-slate-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full text-[10px]">{formatBloodGroup(donor.bloodGroup)}</span>
                      <span className="text-slate-800 font-bold px-1 py-0.5 text-xs">{formatRhFactor(donor.rhFactor)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Всего донаций")}</span>
                    <span className="font-bold text-slate-800 text-right">{totalDonations}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("Последняя сдача")}</span>
                    <span className="font-bold text-slate-800 text-right font-mono">
                      {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString('ru-RU') : 'Нет данных'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between py-3 gap-2">
                    <span className="text-slate-500 font-medium font-sans">{t("В системе с")}</span>
                    <span className="font-bold text-slate-800 text-right font-mono">{new Date(donor.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              )}
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
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-center relative group cursor-pointer hover:bg-red-100/30 transition-all">
                <span className="text-3xl font-bold text-red-600 leading-none mb-1">{totalDonations}</span>
                <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">{t("всего донаций")}</span>
                
                {/* Popover summary list on hover */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 bg-slate-900 border border-slate-800 text-white rounded-xl p-3.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110] text-[12px] space-y-1.5 font-sans">
                  {/* Small arrow pin */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-2.5 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                  
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
                    Статистика по типам
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>{t("Цельная кровь:")}</span>
                    <span className="font-bold text-rose-300">{bCounts}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>{t("Плазма:")}</span>
                    <span className="font-bold text-rose-300">{pCounts}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>{t("Тромбоциты:")}</span>
                    <span className="font-bold text-rose-300">{plCounts}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-200">
                    <span>{t("Гранулоциты:")}</span>
                    <span className="font-bold text-rose-300">{grCounts}</span>
                  </div>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-center">
                <div className="space-y-2 font-sans">
                  <div className="flex justify-between items-center transition-colors">
                    <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">{t("безвозмездно")}</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-600 leading-none">{totalFreeDonations}</span>
                  </div>
                  <div className="flex justify-between items-center transition-colors">
                    <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">{t("возмездно")}</span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-600 leading-none">{totalPaidDonations}</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-center overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-500 leading-none mb-1 tracking-tight">
                  {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString('ru-RU') : '—'}
                </span>
                <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">{t("последняя сдача")}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-center overflow-hidden">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500 leading-none mb-1 font-sans tracking-tight">
                  {readiness.ready ? '—' : (donor.nextAvailableDate ? new Date(donor.nextAvailableDate).toLocaleDateString('ru-RU') : '—')}
                </span>
                <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">{t("следующая дата")}</span>
              </div>
            </div>

            {/* Preparation and Recovery Progress */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100/60 mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{t("Статус восстановления")}</h3>
                  <p className="text-xs md:text-sm text-slate-500 mt-0.5">{t("Процесс подготовки организма к следующей донации")}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold tracking-wide shadow-xs ${readiness.ready ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                    {readiness.ready ? 'Организм готов' : 'Идет восстановление'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 font-sans">
                <div className="flex justify-between items-end">
                   <div className="flex flex-col">
                     <span className="text-[13px] font-bold text-slate-800">{t("Уровень восстановления крови и железа")}</span>
                     {/* {!readiness.ready && recoveryDaysLeft > 0 && (
                         <span className="text-xs text-slate-500 mt-1.5 font-medium bg-slate-50 px-2.5 py-1 rounded-md self-start border border-slate-200/60 leading-none">До допуска: <strong className="text-slate-700">{recoveryDaysLeft} дней</strong></span>
                      )} */}
                   </div>
                   <div className="text-right">
                     <span className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none ${readiness.ready ? 'text-emerald-600' : 'text-amber-500'}`}>
                       <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>{Math.round(recoveryProgress)}</motion.span>%
                     </span>
                   </div>
                </div>
                
                <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden relative shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${recoveryProgress}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={`h-full rounded-full ${readiness.ready ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500 relative overflow-hidden'}`}
                  >
                     {!readiness.ready && recoveryProgress < 100 && (
                       <motion.div
                         animate={{ 
                           x: ["-100%", "200%"],
                         }}
                         transition={{
                           repeat: Infinity,
                           duration: 2.5,
                           ease: "linear"
                         }}
                         className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                       />
                     )}
                  </motion.div>
                </div>
                {readiness.reason && !readiness.ready && (
                  <div className="flex items-start gap-2.5 mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-700 leading-relaxed shadow-sm">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{readiness.reason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gamification progress card */}
            <div id="donor-rank-card" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
              
              {/* Header from screenshot */}
              <div className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100/60">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{t("Донорский ранг")}</h3>
                  <p className="text-xs md:text-sm text-slate-500 mt-0.5">{t("Прогресс и доступные льготы")}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold tracking-wide shadow-xs ${gameStatus.color}`}>
                    {gameStatus.title.charAt(0) + gameStatus.title.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Progress bar estimation slider */}
              {gameStatus.currentPoints < gameStatus.nextAt && (
                <div className="space-y-3 mt-5">
                  <div className="flex justify-between items-end">
                    <div className="relative group flex items-center gap-1.5 cursor-help">
                      <span className="text-[13px] font-bold text-slate-800">{t("До следующего ранга (баллы)")}</span>
                      <span className="text-slate-400 group-hover:text-slate-600 text-xs">ⓘ</span>
                      <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed normal-case font-normal text-left">
                        <strong className="block text-red-400 border-b border-white/10 pb-1 mb-1">{t("Расчет баллов донаций:")}</strong>
                        • 4 балла — Кровь (безвозм)<br/>
                        • 2 балла — Кровь (возм) или Компонент (безвозм)<br/>
                        • 1 балл — Компонент (возм)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800 leading-none">{gameStatus.currentPoints} / {gameStatus.nextAt}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(gameStatus.currentPoints / gameStatus.nextAt) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Real benefits info alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
                <div className={`relative group p-5 rounded-xl border transition-all cursor-help flex flex-col justify-between min-h-[140px] ${
                  totalDonations >= 4 
                    ? 'bg-blue-50 border-blue-100 hover:bg-blue-100/50 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-blue-600 flex items-center gap-1.5">
                      100% больничный
                      <span className="text-slate-400 group-hover:text-slate-600 text-xs">ⓘ</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{t("4+ донаций в год")}</p>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed normal-case font-normal border border-slate-800 animate-fade">
                    При систематической сдаче крови (4+ раза в год) гарантируется выплата пособия по временной нетрудоспособности в размере 100% среднего заработка.
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("Прогресс")}</span>
                      <span className="text-xs font-bold text-slate-800">{Math.min(4, totalDonations)}/4</span>
                    </div>
                    <div className="w-full bg-slate-100 border border-slate-200/50 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (totalDonations / 4) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className={`relative group p-5 rounded-xl border transition-all cursor-help flex flex-col justify-between min-h-[140px] ${
                  gameStatus.currentPoints >= 80 
                    ? 'bg-amber-50 border-amber-200 hover:bg-amber-100/50 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-amber-600 flex items-center gap-1.5">
                      «Ганаровы донар»
                      <span className="text-slate-400 group-hover:text-slate-600 text-xs">ⓘ</span>
                    </h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1">{t("Знак отличия и льготы")}</p>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 leading-relaxed normal-case font-normal border border-slate-800">
                    20+ безвозмездных сдач крови (или эквивалент в баллах) дают право на знак отличия «Почётный донор Республики Беларусь» и полный пакет гос. льгот.
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t("Прогресс")}</span>
                      <span className="text-xs font-bold text-slate-800">{gameStatus.currentPoints}/80</span>
                    </div>
                    <div className="w-full bg-slate-100 border border-slate-200/50 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (gameStatus.currentPoints / 80) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* График активности донаций за последний год */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">{t("Активность донаций за год")}</h3>
                <p className="text-sm text-slate-500 font-medium font-sans">{t("Объем сданных компонентов и динамика по месяцам")}</p>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={last12MonthsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8" 
                      fontSize={11}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickFormatter={(v) => `${v} мл`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as { name: string; count: number; volume: number };
                          return (
                            <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1">
                              <p className="font-semibold text-slate-400">{data.name}</p>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-300">{t("Объем:")}</span>
                                <span className="font-bold text-red-400">{data.volume} мл</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-300">{t("Донаций:")}</span>
                                <span className="font-bold text-red-500">{data.count}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#ef4444" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorVolume)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Next available dates per donation type in RBP */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">{t("График восстановления")}</h3>
                <p className="text-sm text-slate-500 font-medium">{t("Рекомендованные даты по нормативам Минздрава РБ")}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Цельная кровь', date: nextBloodDate ? nextBloodDate.toISOString().split('T')[0] : donor.nextAvailableDate, interval: `${bloodDays} дней` },
                  { label: 'Плазма / Тромбоциты', date: nextAferesisDate ? nextAferesisDate.toISOString().split('T')[0] : null, interval: `${aferezisDays} дней` },
                  { label: 'Гранулоциты', date: nextGranDate ? nextGranDate.toISOString().split('T')[0] : null, interval: `${granulocytesDays} дней` },
                ].map((item, idx) => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  const itemDateObj = item.date ? new Date(item.date) : null;
                  if (itemDateObj) {
                    itemDateObj.setHours(0, 0, 0, 0);
                  }
                  const isAvailable = !itemDateObj || itemDateObj <= now;

                  return (
                    <div 
                      key={idx} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[130px] ${
                        isAvailable 
                          ? 'bg-emerald-50/40 border-emerald-100/80 hover:bg-emerald-50/70 shadow-sm shadow-emerald-50' 
                          : 'bg-rose-50/40 border-rose-100/80 hover:bg-rose-50/70 shadow-sm shadow-rose-50'
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-bold block tracking-[0.14em] ${
                        isAvailable ? 'text-emerald-700/90' : 'text-rose-700/90'
                      }`}>
                        {item.label}
                      </span>
                      <div className="flex-1 flex items-center py-2">
                        <span className={`font-mono text-base font-bold block ${
                          isAvailable ? 'text-emerald-800' : 'text-rose-800'
                        }`}>
                          {isAvailable ? 'Доступно' : itemDateObj?.toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold ${
                        isAvailable ? 'text-emerald-600/70' : 'text-rose-600/70'
                      }`}>
                        {item.interval}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of active medical notes (медотводы) if any */}
            {medicalNotes.some(m => m.isActive) && (
              <div className="bg-red-50 p-6 md:p-8 rounded-2xl border border-red-200/60 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  </div>
                  <h4 className="font-bold text-red-800 text-lg tracking-tight">{t("Важные ограничения")}</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {medicalNotes.filter(m => m.isActive).map(note => (
                    <div key={note.id} className="p-5 bg-white border border-red-200/50 rounded-2xl shadow-sm flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-red-700 tracking-widest block">{t("Медотвод")}</span>
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
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">{t("История донаций")}</h3>
                <p className="text-sm text-slate-500 mt-1">{t("Все зарегистрированные процедуры")}</p>
              </div>
              <span className="bg-slate-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs">
                {donations.length} записей
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-5 py-4 font-bold">{t("Дата")}</th>
                    <th className="px-5 py-4 font-bold">{t("Тип")}</th>
                    <th className="px-5 py-4 font-bold">{t("Центр")}</th>
                    <th className="px-5 py-4 font-bold">{t("Объём")}</th>
                    <th className="px-5 py-4 font-bold">{t("Примечание")}</th>
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
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-xl tracking-tight">{t("Личная пауза")}</h3>
                <p className="text-sm text-slate-500 mt-1">{t("Временно исключает вас из всех рассылок. Никто не потревожит.")}</p>
              </div>

              {pauseSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700 font-medium">
                  {pauseSuccess}
                </div>
              )}

              <form onSubmit={handlePauseSubmit} className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-sm md:text-base font-bold text-red-600">{t("Включить паузу")}</h4>
                    <p className="text-xs md:text-sm text-slate-500">{t("Вы исчезнете из фильтров рассылки")}</p>
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
                      <label className="text-sm font-bold text-slate-800">{t("Действует до (дата):")}</label>
                      <input 
                        type="date"
                        value={pauseForm.personalPauseUntil}
                        onChange={(e) => {
                          let val = e.target.value;
                          const parts = val.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].slice(0, 4);
                            val = parts.join('-');
                          }
                          setPauseForm({ ...pauseForm, personalPauseUntil: val });
                        }}
                        className="w-full px-4 py-3 text-sm md:text-base border border-slate-200 rounded-lg focus:border-red-600 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 block font-medium">{t("*Если оставить пустым, пауза будет считаться бессрочной")}</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800">{t("Причина (только для вас):")}</label>
                      <textarea 
                        value={pauseForm.personalPauseNote}
                        onChange={(e) => setPauseForm({ ...pauseForm, personalPauseNote: e.target.value })}
                        placeholder={t("Командировка, личные обстоятельства...")}
                        rows={3}
                        className="w-full px-4 py-3 text-sm md:text-base border border-slate-200 rounded-lg focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button disabled={isSaving || false} 
                    type="submit"
                    className="disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-xl transition duration-150 shadow-xs"
                  >{isSaving ? '...' : 'Сохранить'}</button>
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
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">{t("Мои центры переливания")}</h3>
                  <p className="text-sm text-slate-500 font-medium">{t("Станции, к которым вы привязаны в системе")}</p>
                </div>
                <button 
                  onClick={() => { const el = document.getElementById('link-form'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start"
                >
                  <Plus className="w-4 h-4" /> Добавить центр
                </button>
              </div>

              <div className="space-y-4">
                {links.map(link => {
                  const center = centers.find(c => c.id === link.centerId);
                  const isConfirmed = link.status === 'confirmed';
                  
                  let statusDate = new Date(link.createdAt).toLocaleDateString('ru-RU');
                  if (isConfirmed && link.confirmedAt) {
                    statusDate = new Date(link.confirmedAt).toLocaleDateString('ru-RU');
                  } else if (link.resubmittedAt) {
                    statusDate = new Date(link.resubmittedAt).toLocaleDateString('ru-RU');
                  }
                  
                  return (
                    <div key={link.id} className={`p-4 rounded-xl border transition-all duration-300 ${link.isPrimary ? 'bg-red-50/20 border-red-100 shadow-sm' : 'bg-slate-50/55 border-slate-100/80 hover:border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-800 text-sm tracking-tight leading-none">{center ? center.name : `Центр #${link.centerId}`}</h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium leading-none">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{center?.address}</span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2 leading-none">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {isConfirmed 
                                ? `Подтверждён: ${statusDate}` 
                                : `Подан: ${statusDate}`}
                            </span>
                          </div>
                          
                          {isConfirmed && (
                            <div className="mt-2 relative inline-block group">
                              <button
                                disabled={!readiness.ready}
                                onClick={() => {
                                  if (!readiness.ready) return;
                                  setAppointmentForm({ ...appointmentForm, centerId: link.centerId });
                                  setShowAppointmentModal(true);
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                  readiness.ready 
                                    ? 'bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
                                }`}
                              >
                                Записаться на донацию
                              </button>
                              {!readiness.ready && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white text-[11px] leading-normal p-2.5 rounded-lg shadow-xl z-50 text-center font-normal">
                                  <span>Запись недоступна: {readiness.reason || 'действует медотвод или период восстановления'}</span>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center justify-center">
                          {link.isPrimary ? (
                            link.status === 'pending' ? (
                              <div className="flex flex-col gap-1.5 items-center justify-center">
                                <div className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                  <span>{t("Домашний")}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-50 text-amber-600 border-amber-100">
                                  <span>{t("На рассмотрении")}</span>
                                </div>
                              </div>
                            ) : link.status === 'rejected' ? (
                              <div className="flex flex-col gap-1.5 items-center justify-center">
                                <div className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                  <span>{t("Домашний")}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-rose-50 text-rose-600 border-rose-100">
                                  <span>{t("Отклонено")}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs">
                                <Heart className="w-3.5 h-3.5 fill-current" />
                                <span>{t("Домашний")}</span>
                              </div>
                            )
                          ) : (
                            link.status === 'pending' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-50 text-amber-600 border-amber-100">
                                <span>{t("На рассмотрении")}</span>
                              </div>
                            ) : link.status === 'rejected' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-rose-50 text-rose-600 border-rose-100">
                                <span>{t("Отклонено")}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(link.centerId)}
                                className="inline-flex items-center gap-1 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                              >
                                <span>{t("Сделать домашним")}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      
                      {link.status === 'rejected' && link.rejectionReason && (
                        <div className="p-5 bg-red-50/50 text-red-900 border border-red-100 rounded-2xl text-xs md:text-sm mt-5 leading-relaxed font-medium shadow-inner">
                          <div className="flex gap-3">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                            <p><strong>{t("Причина отклонения:")}</strong> {link.rejectionReason}</p>
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
            <div id="link-form" className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="space-y-1 font-sans">
                <h3 className="font-bold text-slate-800 text-lg tracking-tight leading-tight">{t("Привязать новый центр")}</h3>
                <p className="text-xs text-slate-500 font-medium">{t("Станьте донором в другом учреждении")}</p>
              </div>

              {linkError && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 font-medium leading-relaxed">{linkError}</p>}
              {linkSuccess && <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium leading-relaxed">{linkSuccess}</p>}

              <form onSubmit={handleCenterLink} className="space-y-4">
                <div>
                  <select 
                    value={selectedCenterId}
                    onChange={(e) => setSelectedCenterId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-50 transition-all focus:outline-none bg-slate-50/50 font-semibold text-slate-700 cursor-pointer shadow-xs"
                  >
                    <option value=""> Список центров переливания </option>
                    {centers.map(center => {
                      if (links.some(l => l.centerId === center.id)) return null;
                      return <option key={center.id} value={center.id}>{center.name}</option>;
                    })}
                  </select>
                </div>
                <button disabled={isSaving || false} 
                  type="submit"
                  className="disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-xs duration-200"
                >{isSaving ? '...' : <><Plus className="w-4 h-4" /> {t("Отправить анкету")}</>}</button>
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* LEFT / MAIN COLUMN: INBOX (HISTORY) */}
            <div className="lg:col-span-2 bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-base md:text-lg tracking-tight leading-tight">
                  Входящие уведомления и вызовы
                </h3>
                <p className="text-xs text-slate-500 font-medium">{t("История сообщений, направленных вам центрами крови")}</p>
              </div>

              {loadingNotifications ? (
                <div className="flex flex-col items-center justify-center py-6 space-y-2">
                  <RefreshCw className="w-6 h-6 text-red-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium font-sans">{t("Загрузка истории...")}</p>
                </div>
              ) : notificationsHistory.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-slate-500 font-semibold">{t("У вас пока нет активных уведомлений")}</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto px-4">{t("Когда центру крови понадобится ваша группа или редкий фенотип, вы увидите срочный запрос здесь.")}</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {notificationsHistory.map((notif: any) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl border transition-all space-y-1.5 shadow-sm relative ${
                        !notif.isRead 
                          ? 'border-red-100 bg-red-50/20 hover:bg-red-50/40' 
                          : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50/85'
                      }`}
                    >
                      {!notif.isRead && (
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full shadow-sm" />
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                            Вызов донора
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-tight">
                            {notif.centerName}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium font-sans shrink-0">
                          {new Date(notif.sentAt).toLocaleString('ru-RU', { 
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
                        {notif.messageText}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR COLUMN: NOTIFICATION SETTINGS */}
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-800 text-base md:text-lg tracking-tight leading-tight">{t("Каналы связи")}</h3>
                <p className="text-xs text-slate-500 font-medium">{t("Отметьте удобные каналы вызова")}</p>
              </div>

              {notifSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {notifSuccess}
                </div>
              )}

              <form onSubmit={handleNotifSubmit} className="space-y-4">
                <div className="space-y-2.5">
                  {[
                    { id: 'push', title: 'Push-уведомления', desc: 'Всплывающие окна в браузере или приложении', enabled: notifForm.pushEnabled, toggle: (val: boolean) => setNotifForm({...notifForm, pushEnabled: val}) },
                    { id: 'email', title: 'Email-рассылки', desc: 'Письма с приглашениями и результатами', enabled: notifForm.emailNotificationsEnabled, toggle: (val: boolean) => setNotifForm({...notifForm, emailNotificationsEnabled: val}) }
                  ].map((notif, idx) => (
                    <div key={notif.id} className="flex items-center justify-between p-3.5 md:p-4 bg-slate-50/50 rounded-xl border border-slate-100 transition-hover hover:border-slate-200">
                      <div className="space-y-1 pr-2">
                        <h4 className="text-sm md:text-base font-bold text-red-600 tracking-tight">{notif.title}</h4>
                        <p className="text-xs md:text-sm text-slate-500 font-medium leading-normal">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={notif.enabled} onChange={(e) => notif.toggle(e.target.checked)} />
                        <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[18px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 shadow-inner"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button disabled={isSaving || false} 
                    type="submit"
                    className="disabled:opacity-50 disabled:cursor-not-allowed w-full bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center justify-center"
                  >{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</button>
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
                <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">{t("Безопасность аккаунта")}</h3>
                <p className="text-sm text-slate-500 font-medium">{t("Управление доступом и паролями")}</p>
              </div>

              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-semibold">
                  {passwordSuccess}
                </div>
              )}

              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Текущий пароль")}</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        required 
                        placeholder="••••••••" 
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 placeholder:text-slate-300 font-mono" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block"></div>
                  
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Новый пароль")}</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        required 
                        placeholder={t("Минимум 6 символов")} 
                        value={newPassword}
                        onChange={e => {
                          const val = e.target.value;
                          setNewPassword(val);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        className={`w-full bg-slate-50 border rounded-xl pl-4 pr-11 py-2.5 text-xs font-bold focus:outline-none font-mono ${
                          getNewPasswordErrorStr(newPassword) ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-red-500'
                        } text-slate-800 placeholder:text-slate-300`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {getNewPasswordErrorStr(newPassword) && (
                      <p className="text-xs text-red-500 font-semibold mt-1 animate-fade">
                        {getNewPasswordErrorStr(newPassword)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t("Повторите пароль")}</label>
                    <div className="relative">
                      <input 
                        type={showRepeatPassword ? "text" : "password"} 
                        required 
                        placeholder="••••••••" 
                        value={repeatPassword}
                        onChange={e => {
                          const val = e.target.value;
                          setRepeatPassword(val);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        className={`w-full bg-slate-50 border rounded-xl pl-4 pr-11 py-2.5 text-xs font-bold focus:outline-none font-mono ${
                          getRepeatPasswordErrorStr(repeatPassword) ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-red-500'
                        } text-slate-800 placeholder:text-slate-300`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {getRepeatPasswordErrorStr(repeatPassword) && (
                      <p className="text-xs text-red-500 font-semibold mt-1 animate-fade">
                        {getRepeatPasswordErrorStr(repeatPassword)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 text-xs md:text-sm rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? 'Обновление...' : 'Обновить пароль'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Download className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base tracking-tight leading-tight">{t("Установка приложения")}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-bold text-slate-800 text-[11px] md:text-xs mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    iPhone / Safari
                  </h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">{t("Нажмите иконку «Поделиться», затем выберите пункт «На экран Домой» и нажмите «Добавить».")}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 hover:border-slate-200 transition-colors">
                  <h4 className="font-bold text-slate-800 text-[11px] md:text-xs mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    Android / Chrome
                  </h4>
                  <p className="text-[11px] md:text-xs text-slate-500 font-medium leading-relaxed">{t("Нажмите на значок ⋮ в строке браузера, выберите «Установить приложение» или «На главный экран».")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAppointmentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-100"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Запись на донацию</h3>
                    <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {appointmentSuccess && (
                      <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl">
                          {appointmentSuccess}
                      </div>
                  )}

                  <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Дата *</label>
                      <input 
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={appointmentForm.appointmentDate}
                        onChange={e => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Время</label>
                      <input 
                        type="time"
                        min="09:00"
                        max="17:00"
                        value={appointmentForm.appointmentTime}
                        onChange={e => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Доступное время для записи: с 09:00 до 17:00</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Тип донации</label>
                      <select 
                        value={appointmentForm.donationType}
                        onChange={e => setAppointmentForm({ ...appointmentForm, donationType: e.target.value as any })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="blood">Цельная кровь</option>
                        <option value="plasma">Плазма</option>
                        <option value="platelets">Тромбоциты</option>
                      </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-colors">
                        Записаться
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

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
