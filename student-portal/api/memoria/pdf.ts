import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getGenAI, MODEL, ChatMessage } from '../_lib/gemini.js';
import { verifyAuth } from '../_lib/auth.js';
import { adminDb, adminStorage } from '../_lib/firebaseAdmin.js';

// Normaliza a caracteres compatibles con WinAnsi (fuentes estándar de PDF).
function sanitize(s: string): string {
  return s
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/[^\x00-\xFF]/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { messages } = (req.body || {}) as { messages: ChatMessage[] };

  try {
    const db = adminDb();
    const u = (await db.doc(`users/${user.uid}`).get()).data() as any || {};
    const nombre = u.name || 'Alumno';
    const lic = u.licenciatura || 'Licenciatura';

    // 1) Compila la Memoria final en texto plano estructurado
    const ai = getGenAI();
    const sys = `A partir de la siguiente conversación, redacta la MEMORIA DESCRIPTIVA final del alumno ${nombre} para el Acuerdo 286, carrera ${lic}.
Devuelve SOLO texto plano (sin markdown). Estructura con estas tres secciones, cada encabezado en MAYÚSCULAS en su propia línea:
INTRODUCCIÓN
DESARROLLO DE LA EXPERIENCIA
CONCLUSIONES TÉCNICAS
Redacta en primera persona, tono profesional e institucional. Si falta información, redacta de forma general pero coherente.`;
    const transcript = (messages || [])
      .map((m) => `${m.role === 'user' ? 'Alumno' : 'Asesor'}: ${m.text}`)
      .join('\n');
    const resp = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: `Conversación entre el asesor y el alumno:\n\n${transcript}\n\nCon base en lo anterior, redacta ahora la Memoria Descriptiva final.` }] }],
      config: { systemInstruction: sys, temperature: 0.6 },
    });
    const texto = sanitize(resp.text || 'No fue posible compilar la memoria.');

    // 2) Genera el PDF
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const blue = rgb(0.17, 0.32, 0.6);
    const dark = rgb(0.12, 0.16, 0.22);
    const W = 612, H = 792, M = 72, maxW = W - M * 2;

    let page = pdf.addPage([W, H]);
    let y = H - M;

    const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
    const ensure = (h: number) => { if (y - h < M) newPage(); };

    const drawWrapped = (text: string, size: number, f = font, color = dark, lh = 1.4) => {
      const lineH = size * lh;
      for (const paragraph of text.split('\n')) {
        if (paragraph.trim() === '') { ensure(lineH); y -= lineH; continue; }
        const isHeading = /^[A-ZÁÉÍÓÚÑ ]{4,}$/.test(paragraph.trim());
        const useFont = isHeading ? bold : f;
        const useSize = isHeading ? size + 1 : size;
        const useColor = isHeading ? blue : color;
        if (isHeading) { ensure(lineH * 1.6); y -= lineH * 0.6; }
        const words = paragraph.split(/\s+/);
        let line = '';
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (useFont.widthOfTextAtSize(test, useSize) > maxW && line) {
            ensure(lineH); page.drawText(line, { x: M, y, size: useSize, font: useFont, color: useColor }); y -= lineH; line = word;
          } else { line = test; }
        }
        if (line) { ensure(lineH); page.drawText(line, { x: M, y, size: useSize, font: useFont, color: useColor }); y -= lineH; }
      }
    };

    // Encabezado institucional
    page.drawText('INEVAP', { x: M, y, size: 22, font: bold, color: blue }); y -= 16;
    page.drawText('Instituto de Evaluacion y Acreditacion Profesional', { x: M, y, size: 9, font, color: rgb(0.5, 0.55, 0.6) }); y -= 10;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.5, color: blue }); y -= 30;

    page.drawText('MEMORIA DESCRIPTIVA', { x: M, y, size: 18, font: bold, color: dark }); y -= 24;
    drawWrapped(sanitize(`Alumno: ${nombre}`), 11, bold);
    drawWrapped(sanitize(`Carrera: ${lic} — Acuerdo 286 SEP`), 11);
    drawWrapped(`Fecha: ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, 11);
    y -= 14;
    drawWrapped(texto, 11);

    const bytes = await pdf.save();

    // 3) Sube a Storage y guarda metadata
    const path = `users/${user.uid}/memoria/memoria-${Date.now()}.pdf`;
    const file = adminStorage().bucket().file(path);
    await file.save(Buffer.from(bytes), { contentType: 'application/pdf' });
    await db.doc(`users/${user.uid}/memoria/current`).set(
      { content: texto, pdfStoragePath: path, generatedAt: new Date() }, { merge: true },
    );
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 3600_000 });

    return res.status(200).json({ url });
  } catch (error) {
    console.error('memoria/pdf error', error);
    return res.status(500).json({ error: 'No se pudo generar el PDF de la memoria.' });
  }
}
