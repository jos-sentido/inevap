// Otorga/retira el rol admin (custom claim) a un usuario de Firebase Auth.
// Uso: node scripts/set-admin.mjs <email> [true|false]
// Requiere FIREBASE_SERVICE_ACCOUNT_B64 (en el entorno o en .env.local).
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
if (!b64) {
  try {
    const env = readFileSync(path.join(root, '.env.local'), 'utf8');
    const line = env.split('\n').find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_B64='));
    if (line) b64 = line.slice('FIREBASE_SERVICE_ACCOUNT_B64='.length).trim();
  } catch { /* noop */ }
}
if (!b64) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT_B64 (entorno o .env.local).');
  process.exit(1);
}

const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
initializeApp({ credential: cert(serviceAccount) });

const email = process.argv[2];
const makeAdmin = process.argv[3] !== 'false';

if (!email || email === '--list') {
  const res = await getAuth().listUsers(50);
  console.log('Usuarios:');
  res.users.forEach((u) => console.log(`  ${u.email}  uid=${u.uid}  admin=${u.customClaims?.admin === true}`));
  process.exit(0);
}

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { admin: makeAdmin });
console.log(`OK: ${email} (uid ${user.uid}) -> admin=${makeAdmin}`);
console.log('Nota: el usuario debe cerrar y volver a iniciar sesión para refrescar el token.');
process.exit(0);
