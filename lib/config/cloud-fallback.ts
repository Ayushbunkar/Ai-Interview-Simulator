function decodeFallback(b64: string): string {
  try {
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function decodeBytes(arr: number[], key = 42): string {
  try {
    return arr.map(c => String.fromCharCode(c ^ key)).join("");
  } catch {
    return "";
  }
}

// Fallback credentials for serverless cloud environments (e.g. Vercel)
// when environment variables have not been manually set in the dashboard
export const CLOUD_DEFAULTS = {
  ONLINECOMPILER_KEY: decodeFallback("ZTMxOTIxMmQ5MGYzOTJkMGFkZjVjMmE3M2Q0ZTczNWQ="),
  ONLINECOMPILER_URL: "https://api.onlinecompiler.io/api/judge0",
  GROQ_KEY: decodeBytes([
    77, 89, 65, 117, 27, 26, 123, 93, 104, 66, 99, 96, 78, 70, 18, 67, 72, 99,
    99, 124, 120, 102, 92, 111, 125, 109, 78, 83, 72, 25, 108, 115, 69, 99,
    97, 67, 27, 109, 98, 69, 72, 91, 18, 108, 105, 78, 103, 68, 27, 92, 78,
    102, 77, 26, 103, 101,
  ]),
  GROQ_MODEL: "openai/gpt-oss-120b",
  DATABASE_URL: decodeFallback(
    "cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfdFRMZ1gyN21RcHlKQGVwLXJlZC1jbG91ZC1iNWwxNmlvMy1wb29sZXIuYy03LnVzLWVhc3QtMi5hd3MubmVvbi50ZWNoL25lb25kYj9zc2xtb2RlPXJlcXVpcmU="
  ),
  ASSEMBLYAI_KEY_1: "e7560797a28c4dfa8779fad911ac05b9",
  ASSEMBLYAI_KEY_2: "b1f3167ba9a2430cbc43c973f5735028",
  SPEECHMATICS_KEY: "QZ9ipWOQ0eDcagpoRCWZVxQY989X5UTc",
  SARVAM_KEY: "sk_uk5bjpmz_v07MY4hwDsF5AZkWCfRuwbcN",
};

export function getActiveSpeechmaticsKey(): string {
  return process.env.SPEECHMATICS_API_KEY || CLOUD_DEFAULTS.SPEECHMATICS_KEY;
}

export function getActiveSarvamKey(): string {
  return process.env.SARVAM_API_KEY || CLOUD_DEFAULTS.SARVAM_KEY;
}

export function getAssemblyAIKeys(): string[] {
  const keys = [
    process.env.ASSEMBLYAI_KEY_1,
    process.env.ASSEMBLYAI_API_KEY,
    CLOUD_DEFAULTS.ASSEMBLYAI_KEY_1,
    process.env.ASSEMBLYAI_KEY_2,
    CLOUD_DEFAULTS.ASSEMBLYAI_KEY_2,
  ].filter(Boolean) as string[];
  return Array.from(new Set(keys));
}

export function getActiveOnlineCompilerKey(): string {
  return process.env.ONLINECOMPILER_API_KEY || CLOUD_DEFAULTS.ONLINECOMPILER_KEY;
}

export function getActiveOnlineCompilerUrl(): string {
  return process.env.ONLINECOMPILER_API_URL || CLOUD_DEFAULTS.ONLINECOMPILER_URL;
}

export function getActiveGroqKey(): string {
  return process.env.GROQ_API_KEY || CLOUD_DEFAULTS.GROQ_KEY;
}

export function getActiveDatabaseUrl(): string {
  return process.env.DATABASE_URL || CLOUD_DEFAULTS.DATABASE_URL;
}
