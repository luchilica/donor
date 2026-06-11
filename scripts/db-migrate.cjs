const { execSync } = require('child_process');

let dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('No database connection string found, skipping migration.');
  process.exit(0);
}

try {
  if (process.env.VERCEL || process.env.GITHUB_ACTIONS || process.env.AIS_APPLET) {
    console.log('Running database setup/migration...');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl }
    });
    console.log('Database schema pushed successfully!');
  } else {
    console.log('Skipping db push in local development environment.');
  }
} catch (error) {
  console.error('Failed to run migration:', error.message);
  process.exit(0); // Don't fail the build, let it fallback to JSON
}
