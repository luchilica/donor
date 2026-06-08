import { DonationType, Donor, MedicalNote } from '../types';

/**
 * Calculates next available dates for donor operations based on Decree No. 80.
 */
export function calculateNextDates(
  lastType: DonationType,
  bloodDonationsTotal: number,
  lastDonationDate: Date
): {
  nextBloodDate: Date;
  nextAferesisDate: Date;
  nextGranulocytesDate: Date;
  earliestDate: Date;
} {
  // 5th donation rule: true if blood count was 5, 10, 15...
  const isEveryFifth = bloodDonationsTotal > 0 && bloodDonationsTotal % 5 === 0;

  let bloodDays = 60;
  let aferezisDays = 14;
  let granulocytesDays = 30;

  switch (lastType) {
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

  const addDays = (d: Date, days: number) => {
    const copy = new Date(d.getTime());
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  const nextBloodDate = addDays(lastDonationDate, bloodDays);
  const nextAferesisDate = addDays(lastDonationDate, aferezisDays);
  const nextGranulocytesDate = addDays(lastDonationDate, granulocytesDays);

  const earliestDate = new Date(
    Math.min(
      nextBloodDate.getTime(),
      nextAferesisDate.getTime(),
      nextGranulocytesDate.getTime()
    )
  );

  return {
    nextBloodDate,
    nextAferesisDate,
    nextGranulocytesDate,
    earliestDate,
  };
}

/**
 * Check if the donor is ready to donate based on current active rules (Decree No 80, pauses, active medical notes).
 */
export function isDonorReady(
  donor: Donor,
  todayStr: string,
  medicalNotes: MedicalNote[],
  allLinkConfirmations: boolean
): { ready: boolean; reason?: string } {
  const today = new Date(todayStr);

  // 1. Check account status
  if (donor.status !== 'active') {
    return { ready: false, reason: 'Аккаунт отключен' };
  }

  // 2. Check center links confirmations
  if (!allLinkConfirmations) {
    return { ready: false, reason: 'Нет подтвержденной связи ни с одним центром крови' };
  }

  // 3. Weight limit (>= 55 kg)
  if (donor.weight < 55) {
    return { ready: false, reason: 'Вес меньше 55 кг (противопоказано)' };
  }

  // 4. Age limit (18 - 65 years)
  const birth = new Date(donor.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  if (age < 18 || age > 65) {
    return { ready: false, reason: `Возраст ${age} лет находится вне допустимого интервала (18-65)` };
  }

  // 5. Active medical notes (медотводы)
  const hasActiveMedical = medicalNotes.some((note) => {
    if (!note.isActive) return false;
    const start = new Date(note.startDate);
    if (start > today) return false;
    if (!note.endDate) return true; // Permanent
    const end = new Date(note.endDate);
    return end >= today;
  });
  if (hasActiveMedical) {
    const active = medicalNotes.find((note) => {
      if (!note.isActive) return false;
      const start = new Date(note.startDate);
      if (start > today) return false;
      if (!note.endDate) return true;
      const end = new Date(note.endDate);
      return end >= today;
    });
    return { ready: false, reason: `Действует медицинский отвод: ${active?.reason || 'по медицинским показаниям'}` };
  }

  // 6. Active personal pause
  if (donor.personalPause) {
    if (!donor.personalPauseUntil) {
      return { ready: false, reason: `Установлена личная пауза: ${donor.personalPauseNote || 'Временно не могу сдавать'}` };
    }
    const pauseUntil = new Date(donor.personalPauseUntil);
    if (pauseUntil >= today) {
      return { ready: false, reason: `Установлена личная пауза до ${donor.personalPauseUntil}: ${donor.personalPauseNote || ''}` };
    }
  }

  // 7. Time since last donation
  if (donor.nextAvailableDate) {
    const nextAvail = new Date(donor.nextAvailableDate);
    if (nextAvail > today) {
      const days = Math.ceil((nextAvail.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { ready: false, reason: `Слишком мало времени прошло с последней донации (следующая возможна через ${days} дн., ${donor.nextAvailableDate})` };
    }
  }

  return { ready: true };
}
