// Siembra fechas de examen (examSlots) de ejemplo en Firestore usando el service account.
// Uso: node scripts/seed-slots.mjs
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!b64) {
  const env = readFileSync(path.join(root, '.env.local'), 'utf8');
  b64 = env.split('\n').find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_B64='))
    .slice('FIREBASE_SERVICE_ACCOUNT_B64='.length).trim();
}
const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Genera fechas próximas: escrito (teórico) en fines de semana; oral entre semana.
function nextDates(count, weekendOnly) {
  const out = [];
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    const isWeekend = day === 5 || day === 6 || day === 0; // Vie/Sab/Dom
    if (weekendOnly ? isWeekend : !isWeekend) out.push(new Date(d));
  }
  return out;
}

const slots = [];
for (const dt of nextDates(6, true)) {
  slots.push({ examType: 'teorico', dateTime: dt, capacity: 20, booked: 0, modality: 'Presencial / En línea' });
}
for (const dt of nextDates(6, false)) {
  slots.push({ examType: 'oral', dateTime: dt, capacity: 8, booked: 0, modality: 'Ante sinodales' });
}

const batch = db.batch();
for (const s of slots) {
  const ref = db.collection('examSlots').doc();
  batch.set(ref, { ...s, dateTime: Timestamp.fromDate(s.dateTime) });
}
await batch.commit();
console.log(`OK: ${slots.length} fechas sembradas (6 teóricas + 6 orales).`);
process.exit(0);
