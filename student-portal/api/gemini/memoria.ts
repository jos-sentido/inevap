import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAI, toContents, MODEL, ChatMessage } from '../_lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history, licenciatura } = (req.body || {}) as {
    history: ChatMessage[];
    licenciatura: string;
  };

  try {
    const ai = getGenAI();
    const systemInstruction = `
      Eres un Arquitecto de Carreras y Asesor Senior de INEVAP.
      Tu objetivo es entrevistar al alumno para ayudarle a redactar su "Memoria Descriptiva" para el Acuerdo 286.

      Licenciatura seleccionada: ${licenciatura}.

      Instrucciones:
      1. Sé profesional, institucional y motivador.
      2. Pregunta sobre su experiencia laboral específica relacionada con ${licenciatura}.
      3. Extrae hitos, responsabilidades y conocimientos técnicos.
      4. Al final, debes ofrecer un borrador estructurado de la Memoria Descriptiva que incluya: Introducción, Desarrollo de Experiencia y Conclusiones Técnicas.

      IMPORTANTE: RESPONDE ÚNICAMENTE EN TEXTO PLANO. No utilices formato Markdown (sin **, #, *, o listas de Markdown). Usa mayúsculas o espacios para dar énfasis si es necesario.
    `;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: toContents(history || []),
      config: { systemInstruction, temperature: 0.7 },
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res
      .status(200)
      .json({ text: 'Lo siento, tuve un problema procesando tu solicitud.' });
  }
}
