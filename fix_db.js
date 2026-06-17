const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf-8');

content = content.replace(/return cachedDb;(\n)/g, 'return JSON.parse(JSON.stringify(cachedDb));$1');
content = content.replace(/return cachedDb!;(\n)/g, 'return JSON.parse(JSON.stringify(cachedDb));$1');
content = content.replace(/cachedDb = state; \/\/ Update memory cache instantly so all subsequent reads are lightning fast!(\n)/, '');

const loops = [
  { list: 'users', idVar: 'user' },
  { list: 'donors', idVar: 'donor' },
  { list: 'donorCenters', idVar: 'dc' },
  { list: 'donations', idVar: 'don' },
  { list: 'medicalNotes', idVar: 'note' },
  { list: 'news', idVar: 'n' },
  { list: 'notifications', idVar: 'notif' },
  { list: 'notificationRecipients', idVar: 'rec' },
  { list: 'smsTemplates', idVar: 'm' }
];

for (const rep of loops) {
  let regex = new RegExp(`await Promise\\.all\\(state\\.${rep.list}\\.map\\(${rep.idVar} =>([\\s\\S]*?)\\)\\);`);
  if (content.match(regex)) {
     content = content.replace(regex, `await Promise.all(state.${rep.list}.map(async ${rep.idVar} => {
        const prev = cachedDb && cachedDb.${rep.list} && cachedDb.${rep.list}.find(x => x.id === ${rep.idVar}.id || (x.donorId === ${rep.idVar}.donorId && x.centerId === ${rep.idVar}.centerId));
        if (prev && JSON.stringify(prev) === JSON.stringify(${rep.idVar})) return;
        $1
      }));`);
  } else {
     regex = new RegExp(`for \\(const ${rep.idVar} of state\\.${rep.list}\\) \\{([\\s\\S]*?)\\n      \\}`);
     content = content.replace(regex, `for (const ${rep.idVar} of state.${rep.list}) {
        const prev = cachedDb && cachedDb.${rep.list} && cachedDb.${rep.list}.find(x => x.id === ${rep.idVar}.id || (x.donorId === ${rep.idVar}.donorId && x.centerId === ${rep.idVar}.centerId));
        if (prev && JSON.stringify(prev) === JSON.stringify(${rep.idVar})) continue;
$1
      }`);
  }
}

// Ensure cachedDb is set to state at the end
content = content.replace(
  /if \(!isPostgresActive\) \{\n      fs\.writeFileSync\(STORE_PATH, JSON\.stringify\(state, null, 2\)\);\n    \}/, 
  `if (!isPostgresActive) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2));
    }
    cachedDb = JSON.parse(JSON.stringify(state));`
);

fs.writeFileSync('server/db.ts', content);
