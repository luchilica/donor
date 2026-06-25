import fs from 'fs';
import path from 'path';

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walk(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const translations = {
  // AdminSection
  "АДМИНИСТРАТОР": "АДМІНІСТРАТАР",
  "МЕД.ЦЕНТР": "МЕД.ЦЭНТР",
  "ДОНОР": "ДОНАР",
  "Цельная кровь": "Цэльная кроў",
  "Плазма": "Плазма",
  "Тромбоциты": "Трамбацыты",
  "Ожидает": "Чакае",
  "Подтверждена": "Пацверджана",
  "Завершена": "Завершана",
  "Отменена": "Адменена",
  "Неявка": "няяўка",
  
  // CenterSection
  "Медицинские отводы и ограничения (": "Медыцынскія адводы і абмежаванні (",
  "Имеет ограничения или отвод": "Мае абмежаванні або адвод",
  "Ни разу": "Ні разу",
  "← Вернуться к заявкам": "← Вярнуцца да заявак",
  "Готов к донации цельной крови": "Гатовы да данацыі цэльнай крыві",
  "Медотвод / Ограничение": "Медадвод / Абмежаванне",
  "Мужской": "Мужчынскі",
  "Женский": "Жаночы",
  "Не указан": "Не пазначаны",
  "Отключены": "Адключаныя",
  "Срок проведения отвода: с ": "Тэрмін правядзення адводу: з ",
  " по ": " па ",
  "бессрочно": "бестэрмінова",
  "кровь": "кроў",
  "плазма": "плазма",
  "тромбоциты": "трамбацыты",
  "Повторная подача (": "Паўторная падача (",
  " чел.": " чал.",
  "Завершить донацию?": "Завяршыць данацыю?",
  "Вы уверены, что хотите отметить донацию донора ": "Вы ўпэўнены, што хочаце адзначыць данацыю донара ",
  " как завершенную?": " як завершаную?",
  "Завершить": "Завяршыць",
  "Отмена": "Адмена",
  "Отклонить запись?": "Адхіліць запіс?",
  "Вы уверены, что хотите отклонить запись донора ": "Вы ўпэўнены, што хочаце адхіліць запіс донара ",
  " на донацию?": " на данацыю?",
  "Отклонить": "Адхіліць",
  "Оба канала (Push + Email)": "Абодва каналы (Push + Email)",
  "Только Push-уведомления": "Толькі Push-апавяшчэнні",
  "Только письма на E-mail": "Толькі лісты на E-mail",
  " подходящим донорам центра": " прыдатным донарам цэнтра",
  "Проект": "Праект",
  "Опубликовано": "Апублікавана",
  "Ещё не опубликована": "Яшчэ не апублікавана",
  "Сохранение...": "Захаванне...",
  "Сохранено!": "Захавана!",
  "Сохранить изменения": "Захаваць змены",
  "Подождите...": "Пачакайце...",
  "Отклонить заявку": "Адхіліць заяўку",
  "Записать в базу и пересчитать сроки": "Запісаць у базу і пералічыць тэрміны",
  "Пожалуйста, введите корректную дату рождения": "Калі ласка, увядзіце карэктную дату нараджэння",
  "Возраст донора должен быть от 18 до 65 лет (сейчас: ": "Узрост донара павінен быць ад 18 да 65 гадоў (зараз: ",
  "E-mail должен быть вида *@* (символы до и после @)": "E-mail павінен быць выгляду *@* (сімвалы да і пасля @)",
  "Минимальный вес должен быть не менее 55 кг": "Мінімальная вага павінна быць не менш за 55 кг",
  "Накладывать медотвод": "Накладваць медадвод",
  "Сохранить публикацию": "Захаваць публікацыю",
  "Рабочий E-Mail (Логин) ": "Працоўны E-Mail (Лагін) ",
  "Создать профиль донора (Подтвержден на месте)": "Стварыць профіль донара (Пацверджаны на месцы)",
  "Дата регистрации: ": "Дата рэгістрацыі: ",
  "Период: с ": "Перыяд: з "
};

const files = walk(path.join(process.cwd(), 'src', 'components'));

for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [s, t] of Object.entries(translations)) {
    // Basic replacement for string literals, not perfect but sufficient for these cases
    const target1 = `"${s}"`;
    const target2 = `'${s}'`;
    
    if (content.includes(target1)) { content = content.replaceAll(target1, `t("${s}")`); changed = true; }
    if (content.includes(target2)) { content = content.replaceAll(target2, `t('${s}')`); changed = true; }
    if (content.includes(`>${s}<`)) { content = content.replaceAll(`>${s}<`, `>{t("${s}")}<`); changed = true; }
    
    // Fix double wrapping
    if (changed) {
      content = content.replaceAll(`t(t("${s}"))`, `t("${s}")`);
      content = content.replaceAll(`t(t('${s}'))`, `t('${s}')`);
      content = content.replaceAll(`>{t(t("${s}"))}<`, `>{t("${s}")}<`);
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Update i18n
const i18nPath = path.join(process.cwd(), 'src', 'i18n.ts');
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
    for (const [key, value] of Object.entries(translations)) {
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

console.log('Script 5 complete');
