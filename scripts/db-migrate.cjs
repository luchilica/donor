const { execSync } = require('child_process');

function escapeDatabaseUrl(url) {
  if (!url) return url;
  const protoMatch = url.match(/^(postgres(?:ql)?:\/\/)(.*)$/);
  if (!protoMatch) return url;
  const proto = protoMatch[1];
  const rest = protoMatch[2];
  const lastAtIndex = rest.lastIndexOf('@');
  if (lastAtIndex === -1) return url;
  const credentials = rest.substring(0, lastAtIndex);
  const hostAndDb = rest.substring(lastAtIndex + 1);
  const firstColonIndex = credentials.indexOf(':');
  if (firstColonIndex === -1) return url;
  const user = credentials.substring(0, firstColonIndex);
  const password = credentials.substring(firstColonIndex + 1);
  const escapedPassword = encodeURIComponent(decodeURIComponent(password));
  return proto + user + ':' + escapedPassword + '@' + hostAndDb;
}

let dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
let directUrl = process.env.DIRECT_URL;

if (!dbUrl) {
  console.log('No database connection string found, skipping migration.');
  process.exit(0);
}

// Escape dbUrl and directUrl to handle password special characters (e.g., / or @)
const escapedDbUrl = escapeDatabaseUrl(dbUrl);
const escapedDirectUrl = directUrl ? escapeDatabaseUrl(directUrl) : undefined;

try {
  // Always run the migration if we have a connection string in AI Studio
  console.log('Running database setup/migration...');
  const envOverrides = { 
    ...process.env, 
    DATABASE_URL: escapedDbUrl
  };
  if (escapedDirectUrl) {
    envOverrides.DIRECT_URL = escapedDirectUrl;
  }
  
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: envOverrides
  });
  console.log('Database schema pushed successfully!');
} catch (error) {
  console.error('Failed to run migration:', error.message);
  process.exit(0); // Don't fail the build, let it fallback to JSON
}
