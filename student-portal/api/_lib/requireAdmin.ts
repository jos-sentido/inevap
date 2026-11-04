import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, AuthedUser } from './auth.js';

/** Devuelve el usuario admin autenticado, o responde 401/403 y devuelve null. */
export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<AuthedUser | null> {
  const user = await verifyAuth(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }
  if (!user.admin) {
    res.status(403).json({ error: 'Requiere permisos de administrador' });
    return null;
  }
  return user;
}
