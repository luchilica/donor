const fs = require('fs');

let content = fs.readFileSync('src/components/DonorSection.tsx', 'utf8');

content = content.replace(/onConfirm: async \(\) => \{\s*try \{/g, 'onConfirm: async () => {\n        setIsSaving(true);\n        try {');

content = content.replace(/catch \((.*?)?\) \{\s*setEditError\((.*?)\);\s*\}\s*finally \{\s*setIsSaving\(false\);\s*closeConfirm\(\);\s*\}/g, 'catch ($1) {\n          setEditError($2);\n        } finally {\n          setIsSaving(false);\n          closeConfirm();\n        }');

// Re-apply for ones that didn't have finally block yet
content = content.replace(/catch \((.*?)?\) \{\s*setPauseSuccess\((.*?)\);\s*\}\s*closeConfirm\(\);/g, 'catch ($1) {\n          setPauseSuccess($2);\n        } finally {\n          setIsSaving(false);\n          closeConfirm();\n        }');

content = content.replace(/catch \((.*?)?\) \{\s*setNotifSuccess\((.*?)\);\s*\}\s*closeConfirm\(\);/g, 'catch ($1) {\n          setNotifSuccess($2);\n        } finally {\n          setIsSaving(false);\n          closeConfirm();\n        }');

content = content.replace(/catch \((.*?)\) \{\s*alert\((.*?)\);\s*\}\s*closeConfirm\(\);/g, 'catch ($1) {\n          alert($2);\n        } finally {\n          setIsSaving(false);\n          closeConfirm();\n        }');

content = content.replace(/catch \((.*?)?\) \{\s*setLinkError\((.*?)\);\s*\}\s*closeConfirm\(\);/g, 'catch ($1) {\n          setLinkError($2);\n        } finally {\n          setIsSaving(false);\n          closeConfirm();\n        }');

// Replace button classes
content = content.replace(/<button([^>]*)type="submit"([^>]*)>(.*?)<\/button>/gs, (m, p1, p2, text) => {
  if (text.includes('isSaving')) return m; // already done

  const disabledAttr = (p1+p2).includes('disabled') ? '' : ' disabled={isSaving || false}';
  let np1 = p1, np2 = p2;
  
  if (!np1.includes('disabled:opacity-50') && !np2.includes('disabled:opacity-50')) {
     if (p1.includes('className="')) {
         np1 = p1.replace('className="', 'className="disabled:opacity-50 disabled:cursor-not-allowed ');
     } else if (p2.includes('className="')) {
         np2 = p2.replace('className="', 'className="disabled:opacity-50 disabled:cursor-not-allowed ');
     }
  }

  // Handle text
  let innerText = text.trim();
  let loadingText = '...';
  if (innerText.includes('Сохранить изменения')) loadingText = 'Сохранение...';
  else if (innerText.includes('Установить медотвод')) loadingText = 'Применение...';
  else if (innerText.includes('Отправить заявку в центр')) loadingText = '<><Link size={16} /> Отправка...</>';
  else if (innerText.includes('Сохранить настройки')) loadingText = 'Сохранение...';
  else if (innerText.includes('Обновить пароль')) loadingText = 'Обновление...';

  // Format conditional rendering
  let finalInner = innerText.startsWith('{') ? innerText.substring(1, innerText.length - 1) : `'${innerText}'`;

  return `<button${disabledAttr}${np1}type="submit"${np2}>{isSaving ? ${loadingText.startsWith('<') ? `'Подождите...'` : `'${loadingText}'`} : ${finalInner}}</button>`;
});

fs.writeFileSync('src/components/DonorSection.tsx', content);
