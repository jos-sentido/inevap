import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGenAI, toContents, MODEL, ChatMessage } from '../_lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { history, licenciatura, guideContent } = (req.body || {}) as {
    history: ChatMessage[];
    licenciatura: string;
    guideContent: string;
  };

  try {
    const ai = getGenAI();
    const systemInstruction = `
      Eres el Tutor Inteligente de INEVAP especializado en ${licenciatura}.

      CONOCIMIENTO BASE (GUÍA DE ESTUDIO):
      ${guideContent || 'No hay una guía cargada para esta carrera aún. Por favor, informa al alumno que su asesor humano cargará el material pronto.'}

      TU OBJETIVO:
      1. Diagnosticar el estilo de aprendizaje del alumno (visual, auditivo, práctico).
      2. Enseñar los conceptos de la guía de forma personalizada.
      3. Mantener el interés mediante gamificación verbal, retos y preguntas de opción múltiple.
      4. Asegurarte de que el alumno esté listo para el examen EGA-286.

      REGLAS DE FORMATO:
      - RESPONDE ESTRICTAMENTE EN TEXTO PLANO.
      - PROHIBIDO EL USO DE MARKDOWN: No uses asteriscos (**), almohadillas (#), guiones de lista de markdown, etc.
      - Para estructurar la respuesta, usa saltos de línea y numeración simple (1., 2., 3.).
      - Sé empático pero riguroso con la terminología técnica.
      - Si el alumno no entiende, usa analogías.
      - Solo enseña temas presentes en la guía proporcionada.
    `;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: toContents(history || []),
      config: { systemInstruction, temperature: 0.8 },
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Study Tutor Error:', error);
    return res
      .status(200)
      .json({ text: 'Tuve un problema con mi conexión neuronal. ¿Podemos retomar la lección?' });
  }
}
