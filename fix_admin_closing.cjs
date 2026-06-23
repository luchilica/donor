const fs = require('fs');
let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

// The original table wrapper is now <motion.div ...> so we need to close it with </motion.div>
// Let's find exactly the spot where it closes.
content = content.replace(
  /<\/table>\n\s*<\/div>\n\s*\)([\s\S]*?)<\/div>(?=\n\n\s*\{\/\* --- ADD SLIDE-OVER)/,
  '</table>\n          </div>\n        )}</motion.div>'
);

// We need to fix the first modal wrapper's closing tag
// And its corresponding </div> to </motion.div>
content = content.replace(
  /<\/form>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\)\}/,
  '</form>\n            )}\n          </motion.div>\n        </div>\n      )}'
);


// Now replace the second modal wrapper (editing entity)
content = content.replace(
  /<div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-5 rounded-xl w-full max-w-md shadow-2xl border border-rose-500\/10 animate-scale-up">/,
  '<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xl w-full max-w-md relative overflow-hidden">'
);
content = content.replace(
  /<h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2">/,
  '<h3 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">'
);
content = content.replace(
  /<button onClick=\{\(\) => setEditingEntity\(null\)\} className="text-slate-450 hover:text-slate-650">/g,
  '<button onClick={() => setEditingEntity(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">'
);

// And we must fix the second modal wrapper's closing tag
// I will find the end of the file return statement
content = content.replace(
  /<\/form>\n\s*<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\);\n\}\n/g,
  '</form>\n          </motion.div>\n        </div>\n      )}\n    </div>\n  );\n}\n'
);

// Some generic fixes for the editing form
content = content.replace(
  /className="w-full px-3 py-1\.5 text-xs bg-slate-50\/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg focus:border-rose-500 focus:outline-none"/g,
  'className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"'
);
content = content.replace(
  /className="w-full px-3 py-1\.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-lg"/g,
  'className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 focus:outline-none transition-all"'
);
content = content.replace(
  /className="disabled:opacity-50 w-full py-2 bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition duration-150 mt-3"/g,
  'className="disabled:opacity-50 w-full py-3 bg-red-600 hover:bg-red-700 hover:bg-opacity-90 text-white rounded-xl text-sm font-semibold transition-all mt-6 shadow-sm"'
);

fs.writeFileSync('src/components/AdminSection.tsx', content);
