const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf-8');
content = content.replace(/const prev = cachedDb && cachedDb\.([a-zA-Z]+) && cachedDb\.([a-zA-Z]+)\.find/g, 'const prev = oldDb && oldDb.$1 && oldDb.$2.find');
fs.writeFileSync('server/db.ts', content);
