import { GoogleGenAI } from '@google/genai';

// gemini-2.5-flash es estable; se puede sobreescribir con GEMINI_MODEL.
export const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export type ChatMessage = { role: 'user' | 'model'; text: string };

export function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada en el servidor.');
  }
  return new GoogleGenAI({ apiKey });
}

export function toContents(history: ChatMessage[]) {
  return history.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
}
