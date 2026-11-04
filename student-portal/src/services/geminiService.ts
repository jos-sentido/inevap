import { Message } from '../types';
import { authedPostJSON } from '../lib/api';

export const getAIResponse = async (history: Message[], licenciatura: string) => {
  try {
    const data = await authedPostJSON<{ text: string }>('/api/gemini/memoria', { history, licenciatura });
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
    const data = await authedPostJSON<{ text: string }>('/api/gemini/tutor', {
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
  storagePath: string,
  docId: string,
  mimeType: string,
  expectedDocName: string,
): Promise<{ isValid: boolean; reason: string; confidence: number }> => {
  try {
    return await authedPostJSON('/api/gemini/verify-document', {
      storagePath,
      docId,
      mimeType,
      expectedDocName,
    });
  } catch (error) {
    console.error('Document Verification Error:', error);
    return { isValid: false, reason: 'Error técnico.', confidence: 0 };
  }
};
