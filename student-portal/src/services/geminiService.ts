import { Message } from '../types';

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const getAIResponse = async (history: Message[], licenciatura: string) => {
  try {
    const data = await postJSON<{ text: string }>('/api/gemini/memoria', { history, licenciatura });
    return data.text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'Lo siento, tuve un problema procesando tu solicitud.';
  }
};

export const getStudyTutorResponse = async (
  history: Message[],
  licenciatura: string,
  guideContent: string,
) => {
  try {
    const data = await postJSON<{ text: string }>('/api/gemini/tutor', {
      history,
      licenciatura,
      guideContent,
    });
    return data.text;
  } catch (error) {
    console.error('Study Tutor Error:', error);
    return 'Tuve un problema con mi conexión neuronal. ¿Podemos retomar la lección?';
  }
};

export const verifyDocumentWithAI = async (
  base64Data: string,
  mimeType: string,
  expectedDocName: string,
): Promise<{ isValid: boolean; reason: string; confidence: number }> => {
  try {
    return await postJSON('/api/gemini/verify-document', { base64Data, mimeType, expectedDocName });
  } catch (error) {
    console.error('Document Verification Error:', error);
    return { isValid: false, reason: 'Error técnico.', confidence: 0 };
  }
};
