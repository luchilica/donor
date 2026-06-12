const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const targetRegex = /<div className="space-y-2">[\s\S]*?<\/h3>/;

const replacement = `<div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={\`w-2.5 h-2.5 rounded-full inline-block \${readiness.ready ? 'bg-emerald-500 shadow-sm' : 'bg-amber-500'}\`}></span>
                  <h3 className={\`font-bold text-xl md:text-xl tracking-tight leading-tight \${readiness.ready ? 'text-emerald-700' : 'text-amber-800'}\`}>
                    {readiness.ready ? 'Вы готовы к донации!' : 'Временное отстранение'}
                  </h3>
                </div>`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/components/DonorSection.tsx', content);
