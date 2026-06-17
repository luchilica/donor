const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf-8');

const cleanupCode = `
      // Clean up expired medical notes automatically
      const today = new Date().toISOString().split('T')[0];
      let notesChanged = false;
      cachedDb.medicalNotes.forEach(m => {
        if (m.isActive && m.endDate && m.endDate < today) {
          m.isActive = false;
          notesChanged = true;
        }
      });
      if (notesChanged) {
        saveDb(JSON.parse(JSON.stringify(cachedDb))).catch(console.error);
      }
`;

content = content.replace(/      return JSON\.parse\(JSON\.stringify\(cachedDb\)\);(\n    } catch \(e\))/g, cleanupCode + '\n      return JSON.parse(JSON.stringify(cachedDb));$1');
content = content.replace(/      return JSON\.parse\(JSON\.stringify\(cachedDb\)\);(\n    } catch \(e\) \{\n      console\.error\('Database file corrupt)/g, cleanupCode + '\n      return JSON.parse(JSON.stringify(cachedDb));$1');

fs.writeFileSync('server/db.ts', content);
