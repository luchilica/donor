const { execSync } = require('child_process');

function fixUrl(urlStr) {
  if (!urlStr) return urlStr;
  try {
    const atIndex = urlStr.lastIndexOf('@');
    if (atIndex === -1) return urlStr;

    const schemaIndex = urlStr.indexOf('://');
    if (schemaIndex === -1) return urlStr;

    const protocol = urlStr.substring(0, schemaIndex + 3);
    const credentials = urlStr.substring(schemaIndex + 3, atIndex);
    const hostPart = urlStr.substring(atIndex);

    const colonIndex = credentials.indexOf(':');
    if (colonIndex === -1) return urlStr;

    const user = credentials.substring(0, colonIndex);
    const password = credentials.substring(colonIndex + 1);

    const encodedUser = encodeURIComponent(decodeURIComponent(user));
    const encodedPassword = encodeURIComponent(decodeURIComponent(password));

    return `${protocol}${encodedUser}:${encodedPassword}${hostPart}`;
  } catch {
    return urlStr;
  }
}

let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.POSTGRES_URL;

if (dbUrl) {
  dbUrl = fixUrl(dbUrl);
  // Remove pgbouncer for migration if present, as push needs non-pooling connection usually
  if (dbUrl.includes('pgbouncer=true')) {
    dbUrl = dbUrl.replace('pgbouncer=true', 'pgbouncer=false');
  }
}

if (!dbUrl) {
  console.log('No database connection string found, skipping migration.');
  process.exit(0);
}

try {
  console.log('Running database setup/migration...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });
  console.log('Database schema pushed successfully!');
} catch (error) {
  console.error('Failed to run migration:', error.message);
  process.exit(0); // Don't fail the build, let it fallback to JSON
}
