import { getDb } from './server/db.js';
console.log('DATABASE_URL:', process.env.DATABASE_URL);
getDb().then(db => {
    console.log('Donations length:', db.donations.length);
}).catch(console.error);
