
import { GoogleGenAI, Chat } from "@google/genai";

export const createChatSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const model = 'gemini-2.5-flash';
  return ai.chats.create({
    model: model,
    config: {
      systemInstruction: `You are an expert AI assistant for General Contractors. Your knowledge base includes the International Building Code (IBC) 2018, all relevant NFPA codes, and the 2018 National Electrical Code (NEC). Provide clear, accurate, and concise answers to questions regarding these codes. When citing a code, please reference the specific code section if possible. Do not provide legal advice, only information based on the codes.`,
    },
  });
};

export const generateProjectPlanFromTranscript = async (transcript: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    if (!transcript.trim()) {
        return "No transcript was provided to generate a plan.";
    }

    const model = 'gemini-2.5-flash';
    const prompt = `Based on the following transcript from a construction site walkthrough, generate a structured project plan. The plan should be a list of actionable tasks. Each task must be on a new line and start with a hyphen and a space (e.g., "- Task description").

    Transcript:
    "${transcript}"

    Generate the project plan below:
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating project plan:", error);
        return "Could not generate a project plan at this time.";
    }
};
