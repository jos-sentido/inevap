// Sube el video de bienvenida a Firebase Storage y lo conecta en config/welcome.
// Uso: node scripts/upload-welcome-video.mjs <ruta-al-mp4>
// Requiere FIREBASE_SERVICE_ACCOUNT_B64 (entorno o .env.local).
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
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
if (!b64) { console.error('Falta FIREBASE_SERVICE_ACCOUNT_B64 (entorno o .env.local).'); process.exit(1); }

const src = process.argv[2];
if (!src) { console.error('Uso: node scripts/upload-welcome-video.mjs <ruta-al-mp4>'); process.exit(1); }

const bucketName = process.env.STORAGE_BUCKET || 'inevap-portal.firebasestorage.app';
const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
initializeApp({ credential: cert(serviceAccount), storageBucket: bucketName });

const dest = 'public/welcome-video.mp4';
const token = crypto.randomUUID();
const bucket = getStorage().bucket();

await bucket.upload(src, {
  destination: dest,
  metadata: {
    contentType: 'video/mp4',
    cacheControl: 'public, max-age=86400',
    metadata: { firebaseStorageDownloadTokens: token },
  },
});

const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(dest)}?alt=media&token=${token}`;
await getFirestore().doc('config/welcome').set({ videoUrl: url, updatedAt: new Date() }, { merge: true });

console.log('OK. Video subido y conectado en config/welcome.');
console.log('videoUrl:', url);
process.exit(0);
