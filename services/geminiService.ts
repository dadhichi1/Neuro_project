import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SessionLog, PatientProfile } from "../types";

// Ensure API Key is present
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateDailyPlan = async (history: SessionLog[], currentPain: number): Promise<string> => {
  const modelId = "gemini-3-pro-preview"; // Using Pro for deep reasoning on medical context

  const historyText = history.map(h => 
    `Date: ${h.date}, Completion: ${h.completionRate}%, Pain Start: ${h.painLevelStart}, Pain End: ${h.painLevelEnd}, Issues: ${h.flaggedIssues.join(', ')}`
  ).join('\n');

  const prompt = `
    You are an expert Neuro-Rehabilitation Physiotherapist. 
    Analyze the following patient history and current status to generate a personalized daily exercise plan.
    
    Patient History (Last 5 Sessions):
    ${historyText}

    Current Status Reported Today:
    Current Pain Level: ${currentPain}/10

    Task:
    1. Analyze the trend in pain and completion rates.
    2. Identify if the patient needs a "Push" day (progression) or a "Recovery" day.
    3. Generate a JSON object containing a rationale and a list of 3 exercises.

    Output Format (JSON Only):
    {
      "focus": "Brief focus title",
      "rationale": "Detailed reasoning explaining why these exercises were chosen based on the history.",
      "exercises": [
        {
          "name": "Exercise Name",
          "description": "Short execution instruction",
          "reps": "number",
          "sets": "number",
          "difficulty": "Low/Medium/High"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1024 } // Use thinking for clinical reasoning
      }
    });
    return response.text || "{}";
  } catch (error) {
    console.error("Plan generation error:", error);
    throw error;
  }
};

export const generateClinicianReport = async (logs: SessionLog[], transcript?: string): Promise<string> => {
  const modelId = "gemini-2.5-flash"; 

  const prompt = `
    Generate a concise clinical SOAP note summary (Subjective, Objective, Assessment, Plan) for a Physiotherapist based on the recent logs.
    
    Recent Logs:
    ${JSON.stringify(logs)}

    Additional Patient Comments (Transcript):
    ${transcript || "None"}

    Format as Markdown. Highlight specific areas of concern (red flags) and progress (green flags).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "No report generated.";
  } catch (error) {
    console.error("Report generation error:", error);
    return "Error generating report.";
  }
};

export const createPatientChat = (profile: PatientProfile, history: SessionLog[]): Chat => {
  const modelId = "gemini-3-pro-preview";

  const historyContext = history.map(h => 
    `- ${h.date}: Pain ${h.painLevelEnd}/10, Issues: ${h.flaggedIssues.join(', ')}. AI Note: ${h.aiNotes}`
  ).join('\n');

  const systemInstruction = `
    You are a compassionate Neuro-Rehab AI Assistant helping ${profile.name}.
    
    Patient Context:
    Injury: ${profile.injury}
    Phase: ${profile.currentPhase}
    Start Date: ${profile.startDate}
    
    Recent Session History:
    ${historyContext}

    Guidelines:
    1. Answer questions about their specific exercises, pain patterns, and progress using the context above.
    2. Be encouraging but realistic.
    3. If they ask about new medical symptoms (sharp pain, dizziness), strictly advise them to consult their human therapist.
    4. Keep answers concise and easy to read.
  `;

  return ai.chats.create({
    model: modelId,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });
};
