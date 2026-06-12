const fs = require('fs');
let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

content = content.replace("Вы готовы к сдаче крови", "Вы готовы к донации!");
content = content.replace("Все показатели в норме. Вы можете записаться на процедуру в ваш центр.", "Все условия соблюдены");
content = content.replace("Записаться на сдачу", "Записаться");
content = content.replace(/<span className="uppercase text-\[10px\] tracking-\[0.15em\] font-bold text-slate-400 block">Статус готовности<\/span>/, "");

fs.writeFileSync('src/components/DonorSection.tsx', content);
