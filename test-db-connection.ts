import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('Testing Prisma database connection...');
  console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'DEFINED (not printing for security)' : 'NOT DEFINED');
  
  let dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (dbUrl) {
    const match = dbUrl.match(/:([^:@]+)@/);
    if (match) {
      const pwd = match[1];
      const escapedPwd = encodeURIComponent(pwd);
      dbUrl = dbUrl.replace(':' + pwd + '@', ':' + escapedPwd + '@');
    }
    if (dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
  }

  const prismaOptions: any = {};
  if (dbUrl) {
    prismaOptions.datasources = {
      db: {
        url: dbUrl
      }
    };
  }

  const prisma = new PrismaClient(prismaOptions);

  try {
    const start = Date.now();
    console.log('Connecting to database...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`Connection successful! Took ${Date.now() - start}ms`);
    console.log('Query result:', result);
    
    console.log('Checking bloodCenter count...');
    const count = await prisma.bloodCenter.count();
    console.log('bloodCenter count:', count);
  } catch (error: any) {
    console.error('Database connection failed!');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Full Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
