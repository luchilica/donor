const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const targetRegex = /return \(\s*<div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8">[\s\S]*?<div className="md:col-span-3">/;

const replacement = `return (
    <div className="w-full space-y-6">
      {/* Header Info Banner like CenterSection */}
      <div className="bg-slate-100 p-6 rounded-2xl flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm select-none shrink-0 border-2 border-white">
            {donor.firstName[0]}{donor.lastName[0]}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Профиль донора</span>
            <h2 className="font-bold text-slate-800 text-lg leading-tight">{donor.lastName} {donor.firstName} {donor.middleName || ''}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Группа: {formatBloodGroup(donor.bloodGroup)} {formatRhFactor(donor.rhFactor)} | 
              Статус: <strong className={readiness.ready ? 'text-emerald-500' : 'text-red-600'}>{readiness.ready ? 'Активен' : 'Отвод'}</strong> | 
              Донаций: {donor.bloodDonationsCount + donor.plasmaDonationsCount + donor.plateletsDonationsCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap border border-slate-200 bg-white p-1 rounded-xl gap-1 shrink-0 self-start lg:self-auto">
          {[
            { id: 'dashboard', label: 'Главная', icon: Home },
            { id: 'profile', label: 'Профиль', icon: User },
            { id: 'history', label: 'Донации', icon: Calendar },
            { id: 'links', label: 'Центры', icon: Link },
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
                className={\`flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold transition \${isActive ? 'bg-red-600 text-white shadow-sm' : 'text-slate-650 hover:bg-slate-50 text-slate-600'}\`}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/DonorSection.tsx', content);
