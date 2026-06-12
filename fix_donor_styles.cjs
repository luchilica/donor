const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

const replacements = [
  { p: /bg-\[#c23e2b\]/g, r: 'bg-red-600' },
  { p: /text-\[#c23e2b\]/g, r: 'text-red-600' },
  { p: /border-\[#c23e2b\]/g, r: 'border-red-600' },
  { p: /hover:bg-\[#a83321\]/g, r: 'hover:bg-red-700' },
  { p: /hover:text-\[#a83321\]/g, r: 'hover:text-red-700' },
  { p: /bg-\[#fdf1f0\]/g, r: 'bg-slate-100' }, // using slate-100 for active menus instead of red-50 to match center's "bg-slate-100" banner
  { p: /border-\[#fbd5d1\]/g, r: 'border-slate-200' },
  { p: /bg-\[#f8fafc\]/g, r: 'bg-slate-50' },
  { p: /hover:bg-\[#f1f5f9\]/g, r: 'hover:bg-slate-100' },
  { p: /text-\[#10b981\]/g, r: 'text-emerald-500' },
  { p: /border-\[#10b981\]/g, r: 'border-emerald-500' },
  { p: /rounded-\[1\.5rem\]/g, r: 'rounded-2xl' },
  { p: /rounded-\[1\.25rem\]/g, r: 'rounded-2xl' },
  { p: /rounded-\[1rem\]/g, r: 'rounded-xl' },
  { p: /rounded-\[0\.85rem\]/g, r: 'rounded-lg' },
  { p: /text-\[12px\]/g, r: 'text-xs' },
  { p: /text-\[13px\]/g, r: 'text-xs md:text-sm' },
  { p: /text-\[14px\]/g, r: 'text-sm' },
  { p: /text-\[14\.5px\]/g, r: 'text-sm' },
  { p: /text-\[15px\]/g, r: 'text-sm md:text-base' },
  { p: /text-\[17px\]/g, r: 'text-base font-bold text-slate-800' },
  { p: /text-\[1\.2rem\]/g, r: 'text-lg md:text-xl font-bold' },
  { p: /text-\[1\.4rem\]/g, r: 'text-xl md:text-2xl font-bold' },
  { p: /text-\[1\.8rem\]/g, r: 'text-3xl font-extrabold' },
  { p: /font-extrabold/g, r: 'font-bold' },
  { p: /shadow-\[.*?\]/g, r: 'shadow-sm' },
  { p: /w-\[5rem\] h-\[5rem\]/g, r: 'w-16 h-16' },
  { p: /w-\[1\.1rem\] h-\[1\.1rem\]/g, r: 'w-4 h-4' },
  { p: /text-\[#475569\]/g, r: 'text-slate-600' }
];

for (const rep of replacements) {
  content = content.replace(rep.p, rep.r);
}

// Adjust structure of menu items to match horizontal nav if needed, but styling is more important.
// Let's modify the profile menu section
content = content.replace(/className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition duration-150 \${isActive \? 'bg-slate-100 text-red-600 font-bold' : 'text-slate-600 font-bold hover:bg-slate-50'}`}/g, "className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition duration-150 ${isActive ? 'bg-red-600 text-white shadow-sm font-semibold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}");

fs.writeFileSync('src/components/DonorSection.tsx', content);
console.log('Styles replaced in DonorSection.tsx');
