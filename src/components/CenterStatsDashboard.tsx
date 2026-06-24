import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, AlertCircle, BarChart3, PieChart } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { BloodCenter } from '../types';

interface CenterStatsDashboardProps {
  center: BloodCenter | null;
  stats: {
    responseRate?: string;
    avgResponseTime?: string;
    suspensionBreakdown?: { label: string; value: number; color: string }[];
    weeklyLoad?: { day: string; load: number; color: string }[];
    tip?: string;
  } | null;
  isLoading: boolean;
}

const StatSkeleton = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
    <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
    <div className="h-16 bg-slate-50 rounded-lg"></div>
  </div>
);

export const CenterStatsDashboard = ({ center, stats, isLoading }: CenterStatsDashboardProps) => {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {/* 1. Inventory Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-red-200 transition-all cursor-default">
        <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-red-500" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">{t("Запасы крови")}</h3>
        </div>
        <div className="grid grid-cols-4 gap-2 flex-grow">
          {bloodTypes.map(type => {
            const level = type.value;
            let barColor = 'bg-emerald-500';
            let gradient = '';
            if (level < 40) { barColor = 'bg-red-600'; gradient = 'bg-gradient-to-t from-rose-500 to-red-600'; }
            else if (level < 80) barColor = 'bg-amber-400';
            
            return (
              <div key={type.key} className="flex flex-col items-center gap-1">
                <div className="w-full h-12 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200">
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: `${Math.min(100, Math.max(0, level))}%` }}>
                    <div className={`w-full h-full ${level < 40 ? gradient : barColor}`}></div>
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-600 text-center uppercase truncate w-full">{type.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 2. Conversion/Alerts */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-indigo-200 transition-all cursor-default">
        <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">{t("Эффективность оповещений")}</h3>
        </div>
        <div className="flex flex-col gap-3 flex-grow">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-500">{t("Response rate")}</span>
            <div className="text-lg font-bold text-slate-900">{stats?.responseRate || '0%'}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-500">{t("Avg time")}</span>
            <div className="text-lg font-bold text-slate-900">{stats?.avgResponseTime || '0'}<span className='text-[10px] ml-1 text-slate-400'>{t("ч")}</span></div>
          </div>
        </div>
      </motion.div>
      
      {/* 3. Suspensions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-slate-300 transition-all cursor-default">
        <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">{t("Медотводы")}</h3>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full flex overflow-hidden mb-4">
          {(stats?.suspensionBreakdown || []).map((item, i) => (
            <div key={i} className={`${item.color} h-full`} style={{ width: `${item.value}%` }}></div>
          ))}
        </div>
        <div className="text-[10px] space-y-1 mt-auto">
          {(stats?.suspensionBreakdown || []).map((item, i) => (
             <div key={i} className="flex justify-between items-center text-slate-600">
               <span className='flex items-center gap-1.5'><div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>{item.label}</span>
               <span className="font-bold text-slate-900">{item.value}%</span>
             </div>
          ))}
        </div>
      </motion.div>

      {/* 4. Planner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-1 hover:border-slate-300 transition-all cursor-default">
        <h3 className="text-base font-bold text-slate-800 tracking-tight mb-4">{t("Планер загрузки")}</h3>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {(stats?.weeklyLoad || []).map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-400 font-semibold uppercase">{day.day}</span>
              <div className={`w-full text-center text-[9px] font-bold p-1 rounded ${day.color}`}>{day.load}%</div>
            </div>
          ))}
        </div>
        <div className="mt-auto p-2 bg-slate-50 text-slate-600 text-[10px] rounded-lg border border-slate-100 flex gap-2 items-center">
          <AlertCircle className="w-3 h-3 shrink-0 text-indigo-500" />
          <span>{stats?.tip || t("Данные обновляются")}</span>
        </div>
      </motion.div>
    </div>
  );
};
