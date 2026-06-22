const fs = require('fs');

let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

content = content.replace(
  /const handleDeleteEntity = async \(entityName: string, id: number\) => \{\s*if \(!window.confirm\(t\('Вы уверены\?'\)\)\) return;\s*try \{/g,
  'const handleDeleteEntity = async (entityName: string, id: number) => {\n    if (!window.confirm(t(\'Вы уверены?\'))) return;\n    setIsSaving(true);\n    try {'
);

content = content.replace(
  /alert\(data\.error \|\| 'Deletion failed'\);\s*\}\s*\} catch \(err: any\) \{\s*alert\(err\.message \|\| 'Network error'\);\s*\}/g,
  "alert(data.error || 'Deletion failed');\n      }\n    } catch (err: any) {\n      alert(err.message || 'Network error');\n    } finally {\n      setIsSaving(false);\n    }"
);

content = content.replace(
  /const handleUpdateEntity = async \(entityName: string, entity: any\) => \{\s*try \{/g,
  "const handleUpdateEntity = async (entityName: string, entity: any) => {\n    setIsSaving(true);\n    try {"
);

content = content.replace(
  /alert\(data\.error \|\| 'Failed to save entity'\);\s*\}\s*\} catch \(err: any\) \{\s*alert\(err\.message \|\| 'Network error'\);\s*\}/g,
  "alert(data.error || 'Failed to save entity');\n      }\n    } catch (err: any) {\n      alert(err.message || 'Network error');\n    } finally {\n      setIsSaving(false);\n    }"
);

content = content.replace(/<button type="submit"([^>]*)>(.*?)<\/button>/gs, (m, p1, txt) => {
    if (txt.includes('isSaving')) return m;
    let newClass = p1;
    if (!newClass.includes('disabled:opacity-50')) {
        newClass = newClass.replace('className="', 'className="disabled:opacity-50 disabled:cursor-not-allowed ');
    }
    
    let inner = txt.trim().startsWith('{') ? txt.trim().substring(1, txt.trim().length - 1) : `'${txt.trim()}'`;
    // We already use t() around inner in the original file like {t('Создать')}
    return `<button type="submit" disabled={isSaving}${newClass}>{isSaving ? t('Загрузка...') : ${inner}}</button>`;
});

fs.writeFileSync('src/components/AdminSection.tsx', content);
