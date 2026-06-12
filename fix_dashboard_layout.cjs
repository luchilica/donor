const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const targetRegex = /{\/\* Gamification progress card \*\/}[\s\S]*?{\/\* Real benefits info alerts \*\/}/;

const replacement = `{/* Stats 4-Grid matching the screenshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-center">
                <span className="text-3xl font-bold text-red-600 leading-none mb-1">{donor.bloodDonationsCount + donor.plasmaDonationsCount + donor.plateletsDonationsCount}</span>
                <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest">всего донаций</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex flex-col justify-center">
                <span className="text-3xl font-bold text-emerald-500 leading-none mb-1">{donor.bloodDonationsCount}</span>
                <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">цельная кровь</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex flex-col justify-center overflow-hidden">
                <span className="text-3xl font-bold text-amber-500 leading-none mb-1 truncate">
                  {donations.length > 0 ? new Date(Math.max(...donations.map(d => new Date(d.date).getTime()))).toLocaleDateString('ru-RU') : '—'}
                </span>
                <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest">последняя сдача</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex flex-col justify-center">
                <span className="text-3xl font-bold text-blue-500 leading-none mb-1 font-sans">
                  {readiness.ready ? '✓' : (donor.nextAvailableDate ? new Date(donor.nextAvailableDate).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'}) : '—')}
                </span>
                <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest">следующая дата</span>
              </div>
            </div>

            {/* Gamification progress card */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Донорский ранг</h3>
                  <p className="text-sm text-slate-500 font-medium">Прогресс и доступные льготы</p>
                </div>
                <span className={\`px-5 py-2 rounded-full text-[12px] font-bold border shadow-sm \${gameStatus.color.includes('amber') || gameStatus.title === 'СЕРЕБРЯНЫЙ' ? 'bg-white border-amber-400 text-amber-500' : gameStatus.color}\`}>
                  {gameStatus.title === 'НАЧИНАЮЩИЙ' ? 'Новичок' : gameStatus.title === 'ОПЫТНЫЙ' ? 'Серебряный' : gameStatus.title === 'ВЕТЕРАН' ? 'Золотой' : 'Почетный'}
                </span>
              </div>

              {/* Progress bar estimation slider */}
              {donor.bloodDonationsCount < gameStatus.nextAt && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-[13px] font-bold text-slate-800">До следующего ранга</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-500 leading-none">{donor.bloodDonationsCount} / {gameStatus.nextAt}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#c23e2b] h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: \`\${(donor.bloodDonationsCount / gameStatus.nextAt) * 100}%\` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Real benefits info alerts */}`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/DonorSection.tsx', content);
