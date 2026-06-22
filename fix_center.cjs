const fs = require('fs');

let content = fs.readFileSync('src/components/CenterSection.tsx', 'utf8');

// The Center section has some forms and no `isSaving`. We'll just define `const [isSaving, setIsSaving] = useState(false);` 
// and attach it to buttons

if (!content.includes('const [isSaving, setIsSaving] = useState(false);')) {
  // Find where to insert it, e.g. next to const [notifHistory, setNotifHistory] = useState<Notification[]>([]);
  content = content.replace(
    /const \[notifHistory, setNotifHistory\] = useState<Notification\[\]>\(\[\]\);/g,
    'const [notifHistory, setNotifHistory] = useState<Notification[]>([]);\n  const [isSaving, setIsSaving] = useState(false);'
  );
}

// Just safely wrap basic catches
// Actually, creating donor in center: onCreateDonorSubmit
content = content.replace(/const onCreateDonorSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*try \{/g,
  'const onCreateDonorSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setIsSaving(true);\n    try {');
content = content.replace(/\} catch \(err: any\) \{\s*setCreationError\(err\.message \|\| 'Ошибка регистрации'\);\s*\}/g,
  "} catch (err: any) {\n      setCreationError(err.message || 'Ошибка регистрации');\n    } finally {\n      setIsSaving(false);\n    }");

// Adding Donation
content = content.replace(/const onAddDonation = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*setDonationSuccess\(''\);\s*setDonationError\(''\);\s*try \{/g,
  "const onAddDonation = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setDonationSuccess('');\n    setDonationError('');\n    setIsSaving(true);\n    try {");
content = content.replace(/\} catch \(err: any\) \{\s*setDonationError\(err\.message \|\| 'Ошибка'\);\s*\}/g,
  "} catch (err: any) {\n      setDonationError(err.message || 'Ошибка');\n    } finally {\n      setIsSaving(false);\n    }");

// Adding Note (Hold)
content = content.replace(/const onAddNote = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*setNoteSuccess\(''\);\s*setNoteError\(''\);\s*try \{/g,
  "const onAddNote = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setNoteSuccess('');\n    setNoteError('');\n    setIsSaving(true);\n    try {");
content = content.replace(/\} catch \(err: any\) \{\s*setNoteError\(err\.message \|\| 'Ошибка'\);\s*\}/g,
  "} catch (err: any) {\n      setNoteError(err.message || 'Ошибка');\n    } finally {\n      setIsSaving(false);\n    }");

// Profile Editing
content = content.replace(/const handleProfileSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*setEditSuccess\(''\);\s*setEditError\(''\);\s*try \{/g,
  "const handleProfileSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setEditSuccess('');\n    setEditError('');\n    setIsSaving(true);\n    try {");
content = content.replace(/\} catch \(err: any\) \{\s*setEditError\(err\.message \|\| 'ОШИБКА'\);\s*\}/g,
  "} catch (err: any) {\n      setEditError(err.message || 'ОШИБКА');\n    } finally {\n      setIsSaving(false);\n    }");


// Create News
content = content.replace(/const handleNewsSubmit = async \(e: React\.FormEvent\) => \{\s*e\.preventDefault\(\);\s*setNewsSuccess\(''\);\s*try \{/g,
  "const handleNewsSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setNewsSuccess('');\n    setIsSaving(true);\n    try {");
content = content.replace(/\} catch \(err: any\) \{\s*setNewsError\(err\.message \|\| 'ОШИБКА'\);\s*\}/g,
  "} catch (err: any) {\n      setNewsError(err.message || 'ОШИБКА');\n    } finally {\n      setIsSaving(false);\n    }");

// Add disabled to submit buttons
content = content.replace(/<button([^>]*)type="submit"([^>]*)>(.*?)<\/button>/gs, (m, p1, p2, text) => {
    if (text.includes('isSaving')) return m;
    let newClass = p1;
    if (!newClass.includes('disabled:opacity-50')) {
        newClass = newClass.replace('className="', 'className="disabled:opacity-50 disabled:cursor-not-allowed ');
    }
    let inner = text.trim();
    if (!inner.includes("t('")) inner = `'${inner}'`;
    return `<button${p1}type="submit" disabled={isSaving}${p2}>{isSaving ? 'Подождите...' : ${inner}}</button>`;
});

fs.writeFileSync('src/components/CenterSection.tsx', content);

