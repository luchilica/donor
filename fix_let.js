import fs from 'fs';
import path from 'path';

let cs = fs.readFileSync(path.join(process.cwd(), 'src/components/CenterSection.tsx'), 'utf8');

cs = cs.replaceAll("{t('лет')})", "} {t('лет')})");

fs.writeFileSync(path.join(process.cwd(), 'src/components/CenterSection.tsx'), cs, 'utf8');
console.log('Fixed let)');
