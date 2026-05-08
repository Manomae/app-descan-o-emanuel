import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MeditationSession {
  title: string;
  script: string;
  visualPrompt: string;
  durationSeconds: number;
}

export async function generateMeditationSession(topic: string, durationMinutes: number): Promise<MeditationSession> {
  const prompt = `Gere um roteiro de meditação guiada para o tema: "${topic}". 
  A sessão deve durar aproximadamente ${durationMinutes} minutos.
  Inclua um título, o roteiro completo falado e um prompt visual detalhado para um gerador de imagens de IA que capture o clima desta meditação.
  O prompt visual deve ser atmosférico e calmante. Tudo deve ser em Português do Brasil.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          visualPrompt: { type: Type.STRING },
        },
        required: ["title", "script", "visualPrompt"],
      },
    },
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    durationSeconds: durationMinutes * 60,
  };
}

export async function generateVoiceover(script: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Leia este roteiro de meditação em um ritmo suave, lento e calmante: ${script}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate voiceover");
  }

  // Convert base64 PCM to WAV
  const binary = atob(base64Audio);
  const dataSize = binary.length;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  /* RIFF identifier */
  view.setUint32(0, 0x52494646, false); // "RIFF"
  /* file length */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */
  view.setUint32(8, 0x57415645, false); // "WAVE"
  /* format chunk identifier */
  view.setUint32(12, 0x666d7420, false); // "fmt "
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, 24000, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, 24000 * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  view.setUint32(36, 0x64617461, false); // "data"
  /* data chunk length */
  view.setUint32(40, dataSize, true);

  const wavBuffer = new Uint8Array(44 + dataSize);
  wavBuffer.set(new Uint8Array(header), 0);
  for (let i = 0; i < dataSize; i++) {
    wavBuffer[44 + i] = binary.charCodeAt(i);
  }

  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function generateVisual(visualPrompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A calming, high-quality, atmospheric meditation background: ${visualPrompt}. 
          Abstract, soft colors, ethereal, photorealistic but dreamlike, ultra-wide 16:9 aspect ratio.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate visual");
}
