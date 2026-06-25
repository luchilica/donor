import fs from 'fs';
import path from 'path';

function translateFile(filePath, strings, dict) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const s of strings) {
    const target1 = `"${s}"`;
    const target2 = `'${s}'`;
    
    content = content.replaceAll(target1, `t("${s}")`);
    content = content.replaceAll(target2, `t('${s}')`);
    
    content = content.replaceAll(`t(t("${s}"))`, `t("${s}")`);
    content = content.replaceAll(`t(t('${s}'))`, `t('${s}')`);
    
    content = content.replaceAll(`>${s}<`, `>{t("${s}")}<`);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return dict;
}

const donorStrings = [
  "Нет данных",
  "Мужской",
  "Женский",
  "Рабочий стол",
  "Профиль",
  "История сдач",
  "Мои центры",
  "Пауза",
  "Уведомления",
  "Аккаунт",
  "100% больничный",
  "При систематической сдаче крови (4+ раза в год) гарантируется выплата пособия по временной нетрудоспособности в размере 100% среднего заработка.",
  "20+ безвозмездных сдач крови (или эквивалент в баллах) дают право на знак отличия «Почётный донор Республики Беларусь» и полный пакет гос. льгот.",
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  "Всплывающие окна в браузере или приложении",
  "Письма с приглашениями и результатами",
  "Кровь (безвозм)",
  "Кровь (возм) или Компонент (безвозм)",
  "Компонент (возм)",
  "балла",
  "балл"
];

const newTranslations = {
  "Нет данных": "Няма дадзеных",
  "Мужской": "Мужчынскі",
  "Женский": "Жаночы",
  "Рабочий стол": "Працоўны стол",
  "Профиль": "Профіль",
  "История сдач": "Гісторыя здач",
  "Мои центры": "Мае цэнтры",
  "Пауза": "Паўза",
  "Уведомления": "Апавяшчэнні",
  "Аккаунт": "Акаўнт",
  "100% больничный": "100% бальнічны",
  "При систематической сдаче крови (4+ раза в год) гарантируется выплата пособия по временной нетрудоспособности в размере 100% среднего заработка.": "Пры сістэматычнай здачы крыві (4+ разы на год) гарантуецца выплата дапамогі па часовай непрацаздольнасці ў памеры 100% сярэдняга заробку.",
  "20+ безвозмездных сдач крови (или эквивалент в баллах) дают право на знак отличия «Почётный донор Республики Беларусь» и полный пакет гос. льгот.": "20+ бязвыплатных здач крыві (або эквівалент у балах) даюць права на знак адрознення «Ганаровы донар Рэспублікі Беларусь» і поўны пакет дзярж. ільгот.",
  "Янв": "Сту", "Фев": "Лют", "Мар": "Сак", "Апр": "Кра", "Май": "Май", "Июн": "Чэр", 
  "Июл": "Ліп", "Авг": "Жні", "Сен": "Вер", "Окт": "Кас", "Ноя": "Ліс", "Дек": "Сне",
  "Всплывающие окна в браузере или приложении": "Усплывальныя вокны ў браўзеры ці праграме",
  "Письма с приглашениями и результатами": "Лісты з запрашэннямі і вынікамі",
  "Кровь (безвозм)": "Кроў (бязвыпл)",
  "Кровь (возм) или Компонент (безвозм)": "Кроў (платн) ці Кампанент (бязвыпл)",
  "Компонент (возм)": "Кампанент (платн)",
  "балла": "балы",
  "балл": "бал"
};

translateFile(path.join(process.cwd(), 'src/components/DonorSection.tsx'), donorStrings, newTranslations);

let ds = fs.readFileSync(path.join(process.cwd(), 'src/components/DonorSection.tsx'), 'utf8');
ds = ds.replaceAll('Центр #${link.centerId}`}', 'Центр #${link.centerId}`)}');
ds = ds.replaceAll('• 4 балла —', '• 4 {t("балла")} —');
ds = ds.replaceAll('• 2 балла —', '• 2 {t("балла")} —');
ds = ds.replaceAll('• 1 балл —', '• 1 {t("балл")} —');
fs.writeFileSync(path.join(process.cwd(), 'src/components/DonorSection.tsx'), ds, 'utf8');

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
console.log('Done script 3');
