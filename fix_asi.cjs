const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf-8');
content = content.replace(/return  \n\s*prisma\.user\.upsert/g, 'return prisma.user.upsert');
fs.writeFileSync('server/db.ts', content);
