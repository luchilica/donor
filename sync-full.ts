import fs from 'fs';
import { getDb, saveDb } from './server/db.js';

async function sync() {
  console.log('Fetching state from JSON...');
  const state = await getDb();

  console.log(`Syncing fully to PostgreSQL...`);
  
  await saveDb(state);

  console.log('Sync complete.');
  process.exit(0);
}

sync().catch(error => {
  console.error(error);
  process.exit(1);
});
