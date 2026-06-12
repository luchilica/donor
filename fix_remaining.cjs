const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const replacements = [
  { p: /bg-\[#10b981\]/g, r: 'bg-emerald-500' },
  { p: /hover:bg-\[#059669\]/g, r: 'hover:bg-emerald-600' },
  { p: /bg-\[#f59e0b\]/g, r: 'bg-amber-500' },
  { p: /from-\[#c23e2b\]/g, r: 'from-red-600' },
  { p: /to-\[#e11d48\]/g, r: 'to-rose-600' },
  { p: /text-\[#075985\]/g, r: 'text-sky-800' },
  { p: /text-\[#059669\]/g, r: 'text-emerald-600' },
  { p: /text-\[#7f1d1d\]/g, r: 'text-red-900' },
  { p: /text-\[#991b1b\]/g, r: 'text-red-800' },
  { p: /text-\[#881337\]/g, r: 'text-rose-900' },
  { p: /bg-\[#fdf2f2\]/g, r: 'bg-red-50' },
  { p: /border-\[#fecaca\]\/60/g, r: 'border-red-200/60' },
  { p: /border-\[#fecaca\]\/50/g, r: 'border-red-200/50' },
  { p: /border-\[#fecaca\]/g, r: 'border-red-200' },
  { p: /text-\[#dc2626\]/g, r: 'text-red-600' },
  { p: /text-\[#b91c1c\]/g, r: 'text-red-700' },
  { p: /bg-\[#fef2f2\]/g, r: 'bg-red-50' },
  { p: /text-\[#64748b\]/g, r: 'text-slate-500' },
  { p: /text-\[#ef4444\]/g, r: 'text-red-500' },
];

for (const rep of replacements) {
  content = content.replace(rep.p, rep.r);
}

fs.writeFileSync('src/components/DonorSection.tsx', content);
