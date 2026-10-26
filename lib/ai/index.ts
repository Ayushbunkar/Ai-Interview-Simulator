import { InterviewAIProvider } from "./interface";
import { GroqAIProvider } from "./groq-provider";
import { LocalDevAIProvider } from "./local-dev-provider";

let groqInstance: GroqAIProvider | null = null;
let localInstance: LocalDevAIProvider | null = null;

export function getAIProvider(): InterviewAIProvider {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) {
    if (!groqInstance) {
      groqInstance = new GroqAIProvider();
    }
    return groqInstance;
  }

  if (!localInstance) {
    localInstance = new LocalDevAIProvider();
  }
  return localInstance;
}

export function isLiveAIConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
}
