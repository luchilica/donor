const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const targetRegex = /{\/\* Real benefits info alerts \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `{/* Real benefits info alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-700/20">
                  <h4 className="text-sm md:text-base font-bold text-blue-600 mb-2">✓ 100% больничный</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
                    4+ донации в год → листок нетрудоспособности 100% с 1-го дня
                  </p>
                </div>

                <div className="bg-slate-100 p-5 rounded-xl border border-slate-200">
                  <h4 className="text-sm md:text-base font-bold text-slate-800 mb-2">«Ганаровы донар»</h4>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium mb-4">
                    20+ безвозмездных сдач → нагрудный знак МЗ РБ + льготы
                  </p>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-600 font-medium">Прогресс</span>
                      <span className="text-xs font-bold text-slate-800">{donor.bloodDonationsCount}/20</span>
                    </div>
                    <div className="w-full bg-slate-300 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#c23e2b] h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: \`\${Math.min(100, (donor.bloodDonationsCount / 20) * 100)}%\` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/DonorSection.tsx', content);
