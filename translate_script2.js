import fs from 'fs';
import path from 'path';

function translateFile(filePath, strings, dict) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const s of strings) {
    // If the string is already wrapped in t(), skip it
    // Note: this is a simple replacement, so it will wrap any raw string
    const target1 = `"${s}"`;
    const target2 = `'${s}'`;
    
    // We only want to replace if it's NOT already preceded by t(
    // A quick hack is to replace it globally, then fix the ones that got double wrapped
    content = content.replaceAll(target1, `t("${s}")`);
    content = content.replaceAll(target2, `t('${s}')`);
    
    content = content.replaceAll(`t(t("${s}"))`, `t("${s}")`);
    content = content.replaceAll(`t(t('${s}'))`, `t('${s}')`);
    
    // Check if it was part of a template literal like >${s}<
    content = content.replaceAll(`>${s}<`, `>{t("${s}")}<`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return dict;
}

const guestStrings = [
  "Пароль должен быть не менее 6 символов",
  "пароль ненадёжный должен содержать буквы и цифры",
  "пароль не надёжный должны присутствовать цифры и буквы",
  "Ошибка входа",
  "Введите ваш e-mail",
  "Письмо отправлено",
  "масс" // For regError.includes('масс')
];

const donorStrings = [
  "«Ганаровы донар»", // Wait, this is already Belarusian? It means "Honorary donor". 
  "20+ безвозмездных сдач крови (или эквивалент в баллах) дают право на знак отличия «Почётный донор Республики Беларусь» и полный пакет гос. льгот.",
  "Доступно",
  "записей",
  "Цельная кровь",
  "Плазма",
  "Тромбоциты",
  "возмездно",
  "безвозмездно",
  "Центр крови",
  "Сохранить",
  "Сохранение...",
  "Сохранить изменения",
  "Обновление...",
  "Обновить пароль",
  "Дата *"
];

const newTranslations = {
  "Пароль должен быть не менее 6 символов": "Пароль павінен быць не менш за 6 сімвалаў",
  "пароль ненадёжный должен содержать буквы и цифры": "пароль ненадзейны павінен змяшчаць літары і лічбы",
  "пароль не надёжный должны присутствовать цифры и буквы": "пароль ненадзейны павінны прысутнічаць лічбы і літары",
  "Ошибка входа": "Памылка ўваходу",
  "Введите ваш e-mail": "Увядзіце ваш e-mail",
  "Письмо отправлено": "Ліст адпраўлены",
  "масс": "мас",
  "«Ганаровы донар»": "«Ганаровы донар»",
  "20+ безвозмездных сдач крови (или эквивалент в баллах) дают право на знак отличия «Почётный донор Республики Беларусь» и полный пакет гос. льгот.": "20+ бязвыплатных здач крыві (або эквівалент у балах) даюць права на знак адрознення «Ганаровы донар Рэспублікі Беларусь» і поўны пакет дзярж. ільгот.",
  "Доступно": "Даступна",
  "записей": "запісаў",
  "Цельная кровь": "Цэльная кроў",
  "Плазма": "Плазма",
  "Тромбоциты": "Трамбацыты",
  "возмездно": "платна",
  "безвозмездно": "бязвыплатна",
  "Центр крови": "Цэнтр крыві",
  "Сохранить": "Захаваць",
  "Сохранение...": "Захаванне...",
  "Сохранить изменения": "Захаваць змены",
  "Обновление...": "Абнаўленне...",
  "Обновить пароль": "Абнавіць пароль",
  "Дата *": "Дата *"
};

translateFile(path.join(process.cwd(), 'src/components/GuestSection.tsx'), guestStrings, newTranslations);
translateFile(path.join(process.cwd(), 'src/components/DonorSection.tsx'), donorStrings, newTranslations);

// Also fix some specific ones in DonorSection manually replacing
let ds = fs.readFileSync(path.join(process.cwd(), 'src/components/DonorSection.tsx'), 'utf8');
ds = ds.replaceAll('tickFormatter={(v) => `${v} мл`}', 'tickFormatter={(v) => `${v} ${t("мл")}`}');
ds = ds.replaceAll('data.volume} мл</span>', 'data.volume} {t("мл")}</span>');
ds = ds.replaceAll('volume} мл</td>', 'volume} {t("мл")}</td>');
ds = ds.replaceAll("? `Подтверждён: ${statusDate}`", "? `${t('Подтверждён:')} ${statusDate}`");
ds = ds.replaceAll(": `Подан: ${statusDate}`}", ": `${t('Подан:')} ${statusDate}`}");
fs.writeFileSync(path.join(process.cwd(), 'src/components/DonorSection.tsx'), ds, 'utf8');
newTranslations["мл"] = "мл";
newTranslations["Подтверждён:"] = "Пацверджаны:";
newTranslations["Подан:"] = "Пададзены:";

// Add to i18n
const i18nPath = path.join(process.cwd(), 'src/i18n.ts');
let i18nContent = fs.readFileSync(i18nPath, 'utf8');

const lines = i18nContent.split('\n');
const resultLines = [];
let insideDict = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export const BY_DICT: Record<string, string> = {')) {
    insideDict = true;
    resultLines.push(line);
    continue;
  }
  
  if (insideDict && line.trim() === '};') {
    for (const [key, value] of Object.entries(newTranslations)) {
      if (!i18nContent.includes(`"${key}":`) && !i18nContent.includes(`'${key}':`)) {
        resultLines.push(`  "${key}": "${value}",`);
      }
    }
    insideDict = false;
    resultLines.push(line);
    continue;
  }
  
  resultLines.push(line);
}

fs.writeFileSync(i18nPath, resultLines.join('\n'), 'utf8');
console.log('Done script 2');
