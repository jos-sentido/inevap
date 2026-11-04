import { auth } from './firebase';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** POST a /api adjuntando el ID token de Firebase (si hay sesión). */
export async function authedPostJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/** GET a /api con el ID token de Firebase. */
export async function authedGetJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { ...(await authHeaders()) } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/** Petición con método arbitrario (p. ej. DELETE) y cuerpo JSON. */
export async function authedJSON<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}
