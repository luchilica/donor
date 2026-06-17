const fs = require('fs');
let content = fs.readFileSync('server/db.ts', 'utf-8');

// General fix for anything that is NOT donorCenters
content = content.replace(/\|\| \(x\.donorId === [a-zA-Z]+\.donorId && x\.centerId === [a-zA-Z]+\.centerId\)/g, function(match, offset, str) {
  // If it's dc.donorId and dc.centerId, we keep it, else remove.
  if (match.includes('dc.donorId')) return match; // Keep for donorCenters
  return '';
});

fs.writeFileSync('server/db.ts', content);
