import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { BloodCenter } from '../types';

// Supplementary widget under the center "Показатели" view. The parent already
// renders donor-registry stats (totals, readiness, blood-group & Rh charts), so
// this widget shows the one thing it doesn't: current blood stock per type, read
// straight from center.bloodNeeds (0–100% of norm). The earlier version expected
// response-rate / weekly-load metrics the backend never computes, so it always
// rendered zeros — those fake panels were removed.
interface CenterStatsDashboardProps {
  center: BloodCenter | null;
}

export const CenterStatsDashboard = ({ center }: CenterStatsDashboardProps) => {
  const { t } = useLanguage();

  const bloodNeeds = center?.bloodNeeds || {
    I_pos: 0, I_neg: 0, II_pos: 0, II_neg: 0,
    III_pos: 0, III_neg: 0, IV_pos: 0, IV_neg: 0
  };

  const bloodTypes = [
    { label: 'I+ Rh+', key: 'I_pos', value: bloodNeeds.I_pos },
    { label: 'I- Rh-', key: 'I_neg', value: bloodNeeds.I_neg },
    { label: 'II+ Rh+', key: 'II_pos', value: bloodNeeds.II_pos },
    { label: 'II- Rh-', key: 'II_neg', value: bloodNeeds.II_neg },
    { label: 'III+ Rh+', key: 'III_pos', value: bloodNeeds.III_pos },
    { label: 'III- Rh-', key: 'III_neg', value: bloodNeeds.III_neg },
    { label: 'IV+ Rh+', key: 'IV_pos', value: bloodNeeds.IV_pos },
    { label: 'IV- Rh-', key: 'IV_neg', value: bloodNeeds.IV_neg },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-slate-800 text-base">{t("Запасы крови")}</h3>
        <span className="text-xs text-slate-400">{t("% от нормы по группам")}</span>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {bloodTypes.map(type => {
          const level = Math.min(100, Math.max(0, type.value));
          let barColor = 'bg-emerald-500';
          if (level < 40) barColor = 'bg-gradient-to-t from-rose-500 to-red-600';
          else if (level < 80) barColor = 'bg-amber-400';

          return (
            <div key={type.key} className="flex flex-col items-center gap-1.5">
              <div className="w-full h-20 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200">
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${level}%` }}>
                  <div className={`w-full h-full ${barColor}`}></div>
                </div>
                <span className="absolute inset-x-0 top-1 text-center text-[10px] font-bold text-slate-500">{type.value}%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase truncate w-full">{type.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
