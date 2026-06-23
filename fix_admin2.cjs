const fs = require('fs');
let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

// Container
content = content.replace(
  '<div className="max-w-7xl mx-auto px-4 py-6" id="admin-main-container">',
  '<div className="min-h-screen max-w-7xl mx-auto px-4 py-8" id="admin-main-container">'
);

// Header Panel
content = content.replace(
  /<div className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-6">/,
  '<div className="flex flex-row items-center justify-between pb-6 mb-8 border-b border-slate-100">'
);
content = content.replace(
  /<div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse-slow"><\/div>/,
  '<div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse-slow"></div>'
);
content = content.replace(
  /<h1 className="font-sans font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">/,
  '<h1 className="text-2xl font-bold tracking-tight text-slate-900">'
);
content = content.replace(
  /<p className="text-\[11px\] text-slate-450 dark:text-slate-500 font-mono mt-1">/,
  '<p className="text-sm font-medium text-slate-500 mt-1">'
);
content = content.replace(
  /className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition duration-150"/,
  'className="p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"'
);

// Tabs
content = content.replace(
  /<div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900\/60 p-1 rounded-xl mb-6 border border-slate-100 dark:border-slate-850">/,
  '<div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50/50 rounded-2xl mb-8 border border-slate-100">'
);
content = content.replace(
  /className={`flex items-center gap-2 px-3\.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 \${[\s\S]*?isActive([^}]+)}`}/,
  'className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${ isActive ? "bg-white text-red-600 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent" }`}'
);
content = content.replace(
  /<span className={`text-\[10px\] font-mono font-bold px-1\.5 py-0\.2 rounded-md \${isActive \? 'bg-rose-50 dark:bg-rose-950\/40 text-rose-600 dark:text-rose-450' : 'bg-slate-200\/50 dark:bg-slate-800 text-slate-500'}`}/g,
  '<span className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${isActive ? "bg-red-50 text-red-700" : "bg-slate-200/50 text-slate-600"}`}'
);

// Search & Actions
content = content.replace(
  /<input\s+type="text"[\s\S]*?className="w-full pl-8 pr-3 py-1\.5 bg-white dark:bg-slate-950 border border-slate-250\/70 dark:border-slate-800 rounded-lg text-xs focus:border-rose-500 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400\/90"\s*\/>/,
  '<input type="text" placeholder={t(\'Поиск...\')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none text-slate-800 placeholder-slate-400 transition-all shadow-sm" />'
);
content = content.replace(
  /className="flex items-center gap-1\.5 px-3 py-1\.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 shadow-xs"/,
  'className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 hover:bg-opacity-90 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"'
);

// Tables Container
content = content.replace(
  /<div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl shadow-xs overflow-hidden">/,
  '<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">'
);

// Modals Wrapper
content = content.replace(
  /<div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-5 rounded-xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-850 animate-fade-in">/g,
  '<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xl w-full max-w-md relative overflow-hidden">'
);
content = content.replace(
  /<div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-900">/g,
  '<div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">'
);
content = content.replace(
  /<h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">/g,
  '<h3 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">'
);
content = content.replace(
  /<PlusCircle className="w-4 h-4 text-rose-600" \/>/g,
  '<PlusCircle className="w-5 h-5 text-red-600" />'
);
content = content.replace(
  /<button onClick=\{\(\) => setIsAdding\(null\)\} className="text-slate-450 hover:text-slate-600">/g,
  '<button onClick={() => setIsAdding(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">'
);

// Form Labels & Inputs
content = content.replace(
  /<label className="block text-\[10px\] font-extrabold uppercase tracking-wide text-slate-450 mb-1">/g,
  '<label className="block text-xs font-semibold text-slate-600 mb-1.5">'
);
content = content.replace(
  /className="w-full px-3 py-1\.5 text-xs bg-slate-50\/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"/g,
  'className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"'
);
content = content.replace(
  /className="w-full px-3 py-1\.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-lg"/g,
  'className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"'
);
content = content.replace(
  /className="disabled:opacity-50 disabled:cursor-not-allowed w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3"/g,
  'className="disabled:opacity-50 disabled:cursor-not-allowed w-full py-3 bg-red-600 hover:bg-red-700 hover:bg-opacity-90 text-white rounded-xl text-sm font-semibold transition-all mt-6 shadow-sm"'
);

fs.writeFileSync('src/components/AdminSection.tsx', content);
