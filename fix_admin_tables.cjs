const fs = require('fs');
let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

// Table headers
content = content.replace(
  /<tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-855 text-\[10px\] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-wider">/g,
  '<tr className="bg-slate-50/50 border-b border-slate-100/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">'
);

// Table body
content = content.replace(
  /<tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">/g,
  '<tbody className="divide-y divide-slate-100/60 text-sm">'
);

// Table rows
content = content.replace(
  /<tr key=\{([^}]+)\} className="hover:bg-slate-50\/(50|55) dark:hover:bg-slate-900\/30">/g,
  '<tr key={$1} className="hover:bg-slate-50/50 transition-colors">'
);

// Cells
content = content.replace(
  /<td className="px-4 py-3 font-mono text-slate-400">/g,
  '<td className="px-4 py-4 text-slate-400">'
);
content = content.replace(
  /<td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">/g,
  '<td className="px-4 py-4 font-medium text-slate-900">'
);
content = content.replace(
  /<td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200([\s\S]*?)">/g,
  '<td className="px-4 py-4 font-medium text-slate-900$1">'
);
content = content.replace(
  /<td className="px-4 py-3">/g,
  '<td className="px-4 py-4">'
);
content = content.replace(
  /<td className="px-4 py-3 font-mono text-slate-[0-5]+([^>]*?)">/g,
  '<td className="px-4 py-4 text-slate-500$1">'
);
content = content.replace(
  /<td className="px-4 py-3 text-slate-500(.*?)">/g,
  '<td className="px-4 py-4 text-slate-500$1">'
);
content = content.replace(
  /<td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400 font-mono">/g,
  '<td className="px-4 py-4 font-bold text-red-600">'
);
content = content.replace(
  /<td className="px-4 py-3 text-center font-bold font-mono">/g,
  '<td className="px-4 py-4 text-center font-bold text-slate-900">'
);
content = content.replace(
  /<td className="px-4 py-3 text-right space-x-1">/g,
  '<td className="px-4 py-4 text-right space-x-2">'
);

// Action buttons in tables
content = content.replace(
  /className="inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"/g,
  'className="inline-flex p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"'
);
content = content.replace(
  /className="inline-flex p-1 hover:bg-rose-50 dark:hover:bg-rose-950\/40 rounded text-rose-600"/g,
  'className="inline-flex p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"'
);

// Specific User table badges
content = content.replace(
  /<span className=\{`px-2 py-0\.5 rounded-md text-\[10px\] font-bold \$\{\n                            user\.role === 'admin' \? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950\/25 dark:text-amber-400' :\n                            user\.role === 'center' \? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950\/25 dark:text-indigo-400' :\n                            'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950\/25 dark:text-emerald-400'\n                          \}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${user.role === "admin" ? "bg-amber-50 text-amber-700 border-amber-200" : user.role === "center" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>'
);
content = content.replace(
  /<span className=\{`inline-flex items-center gap-1 font-bold text-\[11px\] \$\{user.isActive \? 'text-emerald-600' : 'text-slate-400'\}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>'
);

// Donor table badges
content = content.replace(
  /<span className=\{`px-1\.5 py-0\.2 rounded text-\[10px\] font-bold \$\{\n                          donor\.status === 'active' \? 'bg-emerald-55\/10 text-emerald-600' : 'bg-slate-100 text-slate-550 dark:bg-slate-800'\n                        \}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${donor.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>'
);

// Donation badges
content = content.replace(
  /<span className="px-1\.5 py-0\.5 rounded text-\[10px\] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">/g,
  '<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-slate-50 text-slate-600 border-slate-200">'
);
content = content.replace(
  /<span className=\{`inline-flex items-center text-\[10px\] font-bold \$\{donation.isPaid \? 'text-amber-600' : 'text-emerald-600'\}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${donation.isPaid ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>'
);

// News badges
content = content.replace(
  /<span className=\{`px-1\.5 py-0\.2 rounded text-\[10px\] font-bold \$\{post.isPublished \? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950\/20' : 'bg-slate-100 text-slate-500'\}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${post.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>'
);

// Holds badges
content = content.replace(
  /<span className=\{`px-1\.5 py-0\.2 rounded text-\[10px\] font-bold \$\{note.isActive \? 'bg-rose-50 text-rose-700 dark:bg-rose-950\/20' : 'bg-slate-100 text-slate-500'\}`\}>/g,
  '<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${note.isActive ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>'
);

fs.writeFileSync('src/components/AdminSection.tsx', content);
