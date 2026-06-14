import { execSync } from 'child_process';
import fs from 'fs';
import { prisma } from './server/db.js';

async function sync() {
  console.log('Loading database_store.json...');
  const state = JSON.parse(fs.readFileSync('database_store.json', 'utf8'));

  console.log(`Syncing ${state.donations.length} donations to PostgreSQL...`);
  
  for (const don of state.donations) {
    try {
      await prisma.donation.upsert({
        where: { id: don.id },
        update: {
          donorId: don.donorId,
          centerId: don.centerId,
          donationDate: new Date(don.donationDate),
          donationType: don.donationType as any,
          isPaid: don.isPaid,
          volumeMl: don.volumeMl,
          note: don.note,
          addedById: don.addedBy,
        },
        create: {
          id: don.id,
          donorId: don.donorId,
          centerId: don.centerId,
          donationDate: new Date(don.donationDate),
          donationType: don.donationType as any,
          isPaid: don.isPaid,
          volumeMl: don.volumeMl,
          note: don.note,
          addedById: don.addedBy,
          createdAt: don.createdAt ? new Date(don.createdAt) : new Date(),
        }
      });
    } catch (e) {
      console.error(`Failed to sync donation ${don.id}:`, e);
    }
  }
  console.log('Sync complete.');
  process.exit(0);
}

sync().catch(error => {
  console.error(error);
  process.exit(1);
});
