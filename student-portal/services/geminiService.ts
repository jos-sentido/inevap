
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIResponse = async (history: Message[], licenciatura: string) => {
  try {
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
      model: 'gemini-3-flash-preview',
      contents: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lo siento, tuve un problema procesando tu solicitud.";
  }
};

export const getStudyTutorResponse = async (history: Message[], licenciatura: string, guideContent: string) => {
  try {
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
      model: 'gemini-3-flash-preview',
      contents: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Study Tutor Error:", error);
    return "Tuve un problema con mi conexión neuronal. ¿Podemos retomar la lección?";
  }
};

export const verifyDocumentWithAI = async (base64Data: string, mimeType: string, expectedDocName: string) => {
  try {
    const prompt = `Analiza este documento. El usuario dice que es: "${expectedDocName}". 
    Tu tarea es verificar si el documento coincide visualmente con lo que se espera de un "${expectedDocName}" oficial en México.
    
    Responde estrictamente en formato JSON con la siguiente estructura:
    {
      "isValid": boolean,
      "reason": "breve explicación en español",
      "confidence": number
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Document Verification Error:", error);
    return { isValid: false, reason: "Error técnico.", confidence: 0 };
  }
};
