const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

content = content.replace('<p className="text-sm font-medium text-emerald-600/80 max-w-md">Все условия соблюдены</p>', '<p className="text-sm font-medium text-emerald-600/80 max-w-md ml-[22px]">Все условия соблюдены</p>');

fs.writeFileSync('src/components/DonorSection.tsx', content);
