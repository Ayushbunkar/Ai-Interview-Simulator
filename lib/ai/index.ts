import { InterviewAIProvider } from "./interface";
import { GroqAIProvider } from "./groq-provider";
import { LocalDevAIProvider } from "./local-dev-provider";
import { getActiveGroqKey } from "../config/cloud-fallback";

let groqInstance: GroqAIProvider | null = null;
let localInstance: LocalDevAIProvider | null = null;

export function getAIProvider(): InterviewAIProvider {
  const activeKey = getActiveGroqKey();
  if (activeKey && activeKey.trim().length > 0) {
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
  const activeKey = getActiveGroqKey();
  return Boolean(activeKey && activeKey.trim().length > 0);
}
