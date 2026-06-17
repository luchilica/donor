const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// Add bcrypt import
content = content.replace(/import crypto from 'crypto';/, "import crypto from 'crypto';\nimport bcrypt from 'bcryptjs';");

// Replace hashPassword
content = content.replace(/function hashPassword\(password: string\): string \{\n  return crypto\.createHash\('sha256'\)\.update\(password\)\.digest\('hex'\);\n\}/, 
`function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}`);

// Replace verifyPassword
content = content.replace(/function verifyPassword\(password: string, hash: string\): boolean \{\n  if \(hash === "\$2a\$12\$6\/p\.R99zLIDa7Z0Xn3V1WOkZ\.R4JWhh5K2\.S61\.27m\/zN0SgBqbyC" && password === "password123"\) \{\n    return true;\n  \}\n  const sha = crypto\.createHash\('sha256'\)\.update\(password\)\.digest\('hex'\);\n  return hash === sha \|\| hash === password;\n\}/,
`function verifyPassword(password: string, hash: string): boolean {
  if (hash === "$2a$12$6/p.R99zLIDa7Z0Xn3V1WOkZ.R4JWhh5K2.S61.27m/zN0SgBqbyC" && password === "password123") {
    return true;
  }
  if (hash.startsWith('$2')) {
    return bcrypt.compareSync(password, hash);
  }
  const sha = crypto.createHash('sha256').update(password).digest('hex');
  return hash === sha || hash === password;
}`);

// In CONFIRM OR REJECT PENDING RELATION
let resolveStr = `    if (status === 'confirmed') {
      link.confirmedAt = new Date().toISOString();
      link.confirmedById = confirmedById ? parseInt(confirmedById) : 2;
      link.rejectionReason = undefined;
      
      const donor = db.donors.find(d => d.id === link.donorId);
      if (donor && donor.emailNotificationsEnabled) {
          try {
              sendTransactionalEmail(donor.email, 'confirmed');
          } catch(e) {}
      }

    } else {
      link.rejectionReason = rejectionReason || 'Не указана';
      link.confirmedAt = null;
      link.confirmedById = null;
      
      const donor = db.donors.find(d => d.id === link.donorId);
      if (donor && donor.emailNotificationsEnabled) {
          try {
              sendTransactionalEmail(donor.email, 'rejected', { reason: link.rejectionReason });
          } catch(e) {}
      }
    }`;

content = content.replace(/    if \(status === 'confirmed'\) \{\n      link\.confirmedAt = new Date\(\)\.toISOString\(\);\n      link\.confirmedById = confirmedById \? parseInt\(confirmedById\) : 2;\n      link\.rejectionReason = undefined;\n    \} else \{\n      link\.rejectionReason = rejectionReason \|\| 'Не указана';\n      link\.confirmedAt = null;\n      link\.confirmedById = null;\n    \}/, resolveStr);

fs.writeFileSync('api/index.ts', content);
