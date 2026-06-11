const { execSync } = require('child_process');

function getDirectUrl(urlStr) {
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
    
    let encodedUser = user;
    try { encodedUser = encodeURIComponent(decodeURIComponent(user)); }
    catch(e) { encodedUser = encodeURIComponent(user); }
    
    let encodedPassword = password;
    try { encodedPassword = encodeURIComponent(decodeURIComponent(password)); }
    catch(e) { encodedPassword = encodeURIComponent(password); }

    let url = `${protocol}${encodedUser}:${encodedPassword}${hostPart}`;
    
    // Convert Supabase transaction pooler port to session pooler port for migrations
    if (url.includes(':6543')) {
       url = url.replace(':6543', ':5432');
    }
    if (url.includes('pgbouncer=true')) {
       url = url.replace('pgbouncer=true', 'pgbouncer=false');
    }
    
    return url;
  } catch(e) {
    return urlStr;
  }
}

let dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('No database connection string found, skipping migration.');
  process.exit(0);
}

try {
  if (process.env.VERCEL || process.env.GITHUB_ACTIONS) {
    console.log('Running database setup/migration...');
    const directUrl = getDirectUrl(dbUrl);
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: directUrl },
      timeout: 30000
    });
    console.log('Database schema pushed successfully!');
  } else {
    console.log('Skipping db push in local development environment.');
  }
} catch (error) {
  console.error('Failed to run migration:', error.message);
  process.exit(0); // Don't fail the build, let it fallback to JSON
}
