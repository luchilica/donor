import { execSync } from 'child_process';

function escapePassword(url: string) {
  if (!url) return url;
  const match = url.match(/:([^:@]+)@/);
  if (!match) return url;
  const pwd = match[1];
  const escapedPwd = encodeURIComponent(pwd);
  return url.replace(':' + pwd + '@', ':' + escapedPwd + '@');
}

const dbUrl = escapePassword(process.env.DATABASE_URL!);
const directUrl = escapePassword(process.env.DIRECT_URL!);

console.log("Running prisma db push with escaped URL and DIRECT_URL...");
execSync('npx prisma db push', {
  env: {
    ...process.env,
    DATABASE_URL: dbUrl,
    DIRECT_URL: directUrl
  },
  stdio: 'inherit'
});
