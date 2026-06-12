const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const targetRegex = /return \(\s*<div className="w-full space-y-6">[\s\S]*?<div className="w-full">/;

const replacement = `return (
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
          <p className="text-xs text-slate-400 mt-1 font-medium">Донор с {new Date(donor.createdAt).toLocaleDateString('ru-RU')}</p>

          <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatBloodGroup(donor.bloodGroup)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">Группа</span>
            </div>
            <div className="bg-red-50 py-3 rounded-xl flex flex-col items-center justify-center">
              <span className="font-bold text-red-600 text-lg leading-none">{formatRhFactor(donor.rhFactor)}</span>
              <span className="text-slate-500 text-[10px] font-bold mt-1 leading-none">Резус</span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-left">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Вес:</span>
              <span className="text-slate-700 font-medium">{donor.weight || '—'} кг</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Возраст:</span>
              <span className="text-slate-700 font-medium">{calcAge(donor.birthDate)} лет</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Донаций:</span>
              <span className="text-slate-700 font-medium">{donor.bloodDonationsCount + donor.plasmaDonationsCount + donor.plateletsDonationsCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Статус:</span>
              <span className={readiness.ready ? 'text-emerald-500 font-bold' : 'text-red-600 font-bold'}>{readiness.ready ? 'Готов к сдаче' : 'Отвод'}</span>
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
                className={\`w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 \${isActive ? 'bg-red-50 text-red-600 font-bold' : 'text-slate-500 font-bold hover:bg-slate-50'}\`}
              >
                <Icon className={\`w-4 h-4 mr-3 \${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}\`} />
                <span className="text-sm leading-none">{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-3">`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/DonorSection.tsx', content);
