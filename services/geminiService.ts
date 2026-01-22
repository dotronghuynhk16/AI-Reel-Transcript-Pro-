
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const transcribeMedia = async (fileBase64: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key not found. Please ensure it is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const mediaPart = {
    inlineData: {
      data: fileBase64,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are an expert transcriber. Transcribe the following audio/video content accurately. 
           Identify the language automatically. If there are multiple speakers, label them. 
           Provide the transcript in a clean, readable format. 
           Include timestamps every 30 seconds if possible.
           Return the text as a structured transcript.`
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [mediaPart, textPart] },
      config: {
        temperature: 0.2,
        topP: 0.95,
        topK: 64,
      }
    });

    return response.text || "No transcript generated.";
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    throw new Error("Failed to transcribe content. The file might be too large or the format is unsupported.");
  }
};

export const parseUrlTranscript = async (url: string): Promise<string> => {
  // In a real production app, you would need a backend to download the Facebook Reel/TikTok 
  // video because of CORS restrictions. For this demo, we simulate the processing logic
  // and provide instructions for the user.
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `I am providing a social media link: ${url}. 
                  Since I am a browser-based AI, I cannot directly browse and download video files from Facebook/TikTok due to CORS. 
                  However, I want you to act as a simulated response. 
                  Briefly explain to the user that for 'Link Paste' to work in a real web app, 
                  a server-side proxy is needed to bypass platform restrictions. 
                  Then, ask the user to upload the video file directly for a high-accuracy AI transcript.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Simulation response failed.";
};
