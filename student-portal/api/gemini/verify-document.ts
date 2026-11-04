import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAI, MODEL } from '../_lib/gemini';
import { verifyAuth } from '../_lib/auth';
import { adminDb, adminStorage } from '../_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ error: 'No autorizado' });

  const { storagePath, docId, mimeType, expectedDocName } = (req.body || {}) as {
    storagePath: string;
    docId: string;
    mimeType: string;
    expectedDocName: string;
  };

  if (!storagePath || !docId) return res.status(400).json({ error: 'Faltan datos del documento' });
  // El alumno solo puede verificar documentos bajo su propio espacio.
  if (!storagePath.startsWith(`users/${user.uid}/`)) {
    return res.status(403).json({ error: 'Ruta no permitida' });
  }

  try {
    const [buffer] = await adminStorage().bucket().file(storagePath).download();
    const base64Data = buffer.toString('base64');

    const prompt = `Analiza este documento. El usuario dice que es: "${expectedDocName}".
    Tu tarea es verificar si el documento coincide visualmente con lo que se espera de un "${expectedDocName}" oficial en México.

    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "isValid": boolean,
      "reason": "breve explicación en español",
      "confidence": number
    }`;

    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { parts: [{ text: prompt }, { inlineData: { data: base64Data, mimeType } }] },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const result = JSON.parse(response.text || '{}');

    await adminDb().doc(`users/${user.uid}/documents/${docId}`).set(
      {
        status: result.isValid ? 'valid' : 'invalid',
        verification: {
          isValid: !!result.isValid,
          reason: result.reason || '',
          confidence: result.confidence ?? 0,
          model: MODEL,
          verifiedAt: new Date(),
        },
      },
      { merge: true },
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Document Verification Error:', error);
    return res.status(200).json({ isValid: false, reason: 'Error técnico al verificar.', confidence: 0 });
  }
}
