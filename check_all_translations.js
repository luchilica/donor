import fs from 'fs';
import path from 'path';

// Read all component files
const componentsDir = path.join(process.cwd(), 'src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Read i18n.ts
const i18nCode = fs.readFileSync(path.join(process.cwd(), 'src/i18n.ts'), 'utf-8');

const tKeys = new Set();
const tRegex = /t\((['"])(.*?)\1\)/g;

for (const file of files) {
  const code = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
  let match;
  while ((match = tRegex.exec(code)) !== null) {
    tKeys.add(match[2]);
  }
}

// Add App.tsx too
const appCode = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
let match;
while ((match = tRegex.exec(appCode)) !== null) {
  tKeys.add(match[2]);
}

const missingKeys = [];
for (const key of tKeys) {
  if (key === 'T' || key === '') continue;
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const keyPattern = new RegExp(`"${escapedKey}"\\s*:`);
  if (!keyPattern.test(i18nCode)) {
    missingKeys.push(key);
  }
}

console.log(`Total unique t(...) keys across components and App.tsx: ${tKeys.size}`);
console.log(`Missing keys in i18n.ts (${missingKeys.length}):`);
console.log(JSON.stringify(missingKeys, null, 2));
