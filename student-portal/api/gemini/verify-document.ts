import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAI, MODEL } from '../_lib/gemini';

// NOTA (Fase 2): migrar a recibir `storagePath` y descargar de Firebase Storage
// en el servidor, para evitar el límite de 4.5 MB de body de las funciones Vercel.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64Data, mimeType, expectedDocName } = (req.body || {}) as {
    base64Data: string;
    mimeType: string;
    expectedDocName: string;
  };

  try {
    const ai = getGenAI();
    const prompt = `Analiza este documento. El usuario dice que es: "${expectedDocName}".
    Tu tarea es verificar si el documento coincide visualmente con lo que se espera de un "${expectedDocName}" oficial en México.

    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "isValid": boolean,
      "reason": "breve explicación en español",
      "confidence": number
    }`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } },
          ],
        },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Document Verification Error:', error);
    return res.status(200).json({ isValid: false, reason: 'Error técnico.', confidence: 0 });
  }
}
