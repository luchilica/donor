import * as fs from 'fs';
import * as path from 'path';

const file = path.join(process.cwd(), 'database_store.json');
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

let donationIdCount = db.donations.length > 0 ? Math.max(...db.donations.map(d => d.id)) + 1 : 1;

db.donors.forEach(donor => {
  const existingDonations = db.donations.filter(d => d.donorId === donor.id);
  
  // ensure isPaid property exists if any
  existingDonations.forEach(d => {
    if (d.isPaid === undefined) {
      d.isPaid = Math.random() > 0.5; // randomize paid/unpaid
    }
  });

  // Check blood
  const existingBlood = existingDonations.filter(d => d.donationType === 'blood').length;
  const targetBlood = donor.bloodDonationsCount || 0;
  for (let i = existingBlood; i < targetBlood; i++) {
    db.donations.push({
      id: donationIdCount++,
      donorId: donor.id,
      centerId: 1,
      donationDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 2)).toISOString().split('T')[0], // random within last 2 years
      donationType: 'blood',
      isPaid: Math.random() > 0.5,
      volumeMl: 450,
      note: 'Сгенерированная донация для синхронизации истории',
      addedBy: 2,
      createdAt: new Date().toISOString()
    });
  }

  // Check plasma
  const existingPlasma = existingDonations.filter(d => d.donationType === 'plasma').length;
  const targetPlasma = donor.plasmaDonationsCount || 0;
  for (let i = existingPlasma; i < targetPlasma; i++) {
    db.donations.push({
      id: donationIdCount++,
      donorId: donor.id,
      centerId: 1,
      donationDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 2)).toISOString().split('T')[0],
      donationType: 'plasma',
      isPaid: Math.random() > 0.5,
      volumeMl: 600,
      note: 'Сгенерированная донация',
      addedBy: 2,
      createdAt: new Date().toISOString()
    });
  }
  
  // Check platelets
  const existingPlatelets = existingDonations.filter(d => d.donationType === 'platelets').length;
  const targetPlatelets = donor.plateletsDonationsCount || 0;
  for (let i = existingPlatelets; i < targetPlatelets; i++) {
    db.donations.push({
      id: donationIdCount++,
      donorId: donor.id,
      centerId: 1,
      donationDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 2)).toISOString().split('T')[0],
      donationType: 'platelets',
      isPaid: Math.random() > 0.5,
      volumeMl: 250,
      note: 'Сгенерированная донация',
      addedBy: 2,
      createdAt: new Date().toISOString()
    });
  }

  const finalDonations = db.donations.filter(d => d.donorId === donor.id);
  donor.donationsCount = finalDonations.length;
  donor.bloodDonationsCount = finalDonations.filter(d => d.donationType === 'blood').length;
  donor.plasmaDonationsCount = finalDonations.filter(d => d.donationType === 'plasma').length;
  donor.plateletsDonationsCount = finalDonations.filter(d => d.donationType === 'platelets').length;
  donor.bloodFreeCount = finalDonations.filter(d => d.donationType === 'blood' && !d.isPaid).length;
  donor.bloodPaidCount = finalDonations.filter(d => d.donationType === 'blood' && d.isPaid).length;
  donor.compFreeCount = finalDonations.filter(d => d.donationType !== 'blood' && !d.isPaid).length;
  donor.compPaidCount = finalDonations.filter(d => d.donationType !== 'blood' && d.isPaid).length;
});

// Sort donations by date descending
db.donations.sort((a, b) => new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime());

fs.writeFileSync(file, JSON.stringify(db, null, 2));
console.log('Database synced successfully. Added missing donations and recalculated stats.');
