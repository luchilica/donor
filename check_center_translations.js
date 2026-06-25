import fs from 'fs';
import path from 'path';

// Read CenterSection.tsx
const centerSectionCode = fs.readFileSync(path.join(process.cwd(), 'src/components/CenterSection.tsx'), 'utf-8');

// Read i18n.ts
const i18nCode = fs.readFileSync(path.join(process.cwd(), 'src/i18n.ts'), 'utf-8');

// Simple regex to extract t("...") or t('...')
const tRegex = /t\((['"])(.*?)\1\)/g;
let match;
const tKeys = new Set();
while ((match = tRegex.exec(centerSectionCode)) !== null) {
  tKeys.add(match[2]);
}

console.log(`Found ${tKeys.size} translation keys in t(...) expressions.`);

// Check how many of these keys are in i18nCode
const missingKeys = [];
for (const key of tKeys) {
  // Check if key is defined in translation
  // It should be like "key": "translation"
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const keyPattern = new RegExp(`"${escapedKey}"\\s*:`);
  if (!keyPattern.test(i18nCode)) {
    missingKeys.push(key);
  }
}

console.log(`Missing keys in i18n.ts (${missingKeys.length}):`);
console.log(missingKeys);

// Also look for JSX text (text between tags or in braces) containing Cyrillic characters
// We can find lines that have Cyrillic letters but do not contain t( or translate or similar.
const lines = centerSectionCode.split('\n');
const untranslatedLines = [];
lines.forEach((line, index) => {
  if (/[А-Яа-яЁё]/.test(line)) {
    // If it has cyrillic, but doesn't have t( or console.log or comments
    const trimmed = line.trim();
    if (!trimmed.includes('t(') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      untranslatedLines.push({ lineNum: index + 1, content: trimmed });
    }
  }
});

console.log(`\nLines with Cyrillic but potentially no t(...) wrapper (${untranslatedLines.length}):`);
untranslatedLines.slice(0, 50).forEach(u => console.log(`${u.lineNum}: ${u.content}`));
