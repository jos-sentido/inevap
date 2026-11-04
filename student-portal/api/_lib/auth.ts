import type { VercelRequest } from '@vercel/node';
import { adminAuth } from './firebaseAdmin.js';

export interface AuthedUser {
  uid: string;
  email?: string;
  admin: boolean;
}

/** Verifica el ID token de Firebase del header Authorization: Bearer. */
export async function verifyAuth(req: VercelRequest): Promise<AuthedUser | null> {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(match[1]);
    return { uid: decoded.uid, email: decoded.email, admin: decoded.admin === true };
  } catch {
    return null;
  }
}
