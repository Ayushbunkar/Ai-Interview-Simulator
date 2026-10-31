import { getActiveGroqKey } from "../config/cloud-fallback";
import Groq from "groq-sdk";

export interface SpeechEvaluationInput {
  transcript: string;
  question: string;
  modelAnswer: string;
  keyPoints: string[];
  audioDurationSeconds?: number;
  mode?: "initial" | "re-speak";
  previousScore?: number;
}

export interface SpeechEvaluationResult {
  overallScore: number; // 0 - 100
  articulationScore: number; // 0 - 100: Clarity, pronunciation precision, structured phrasing
  fluencyScore: number; // 0 - 100: Pacing, natural rhythm, filler minimization
  grammarScore: number; // 0 - 100: Technical syntax, subject-verb agreement, professional tone
  contentAccuracyScore: number; // 0 - 100: Conceptual coverage against model answer
  
  wordsPerMinute: number;
  pacingFeedback: string;
  fillerWordCount: number;
  fillerWordsFound: { word: string; count: number }[];
  
  coveredKeyPoints: string[];
  missedKeyPoints: string[];
  
  strengths: string[];
  areasToImprove: string[];
  deliveryCoaching: string;
  professionalSpokenPhrasing: string;
  
  mode: "initial" | "re-speak";
  scoreDelta?: number; // difference from previous attempt if re-speaking
}

const COMMON_FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
  "right",
  "literally",
  "so yeah",
];

const GRAMMAR_IMPROVEMENTS: { pattern: RegExp; correction: string; advice: string }[] = [
  {
    pattern: /\b(hashmap|arraylist|stack|queue|table|class|method)\s+(are|were)\b/i,
    correction: "A $1 is",
    advice: "Singular technical noun requires singular verb 'is' (e.g., 'A HashMap is optimal...').",
  },
  {
    pattern: /\b(more better|more faster|most best|more optimal)\b/i,
    correction: "better / more efficient",
    advice: "Avoid double comparatives (use 'better' or 'more efficient' instead of 'more better').",
  },
  {
    pattern: /\bwe\s+can\s+able\s+to\b/i,
    correction: "we can / we are able to",
    advice: "Redundant modal phrase; use either 'we can' or 'we are able to'.",
  },
  {
    pattern: /\b(very\s+fast|very\s+slow|very\s+big)\b/i,
    correction: "computationally optimal (O(1)) / computationally expensive (O(N^2))",
    advice: "Replace vague qualifiers like 'very fast' with precise asymptotic terms like 'O(1) logarithmic'.",
  },
  {
    pattern: /\bi\s+(am\s+having|have\s+did)\b/i,
    correction: "I have / I implemented",
    advice: "Use standard past simple or present perfect tense for professional delivery.",
  },
];

export async function evaluateSpokenAnswer(
  input: SpeechEvaluationInput
): Promise<SpeechEvaluationResult> {
  const {
    transcript,
    question,
    modelAnswer,
    keyPoints,
    audioDurationSeconds = 15,
    mode = "initial",
    previousScore,
  } = input;

  const cleanText = (transcript || "").trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Calculate Words Per Minute
  const safeDuration = Math.max(3, audioDurationSeconds);
  const minutes = safeDuration / 60;
  const rawWpm = Math.round(wordCount / minutes);
  const wordsPerMinute = wordCount > 0 ? Math.min(260, Math.max(40, rawWpm)) : 0;

  // Pacing analysis
  let pacingFeedback = "Ideal speaking pace (120–150 WPM).";
  let pacingScore = 95;
  if (wordsPerMinute < 90 && wordCount > 5) {
    pacingFeedback = "Pacing was somewhat slow (<90 WPM). Increase rhythm slightly for confident delivery.";
    pacingScore = Math.max(60, 95 - (90 - wordsPerMinute) * 0.8);
  } else if (wordsPerMinute > 165) {
    pacingFeedback = "Pacing was quite fast (>165 WPM). Slow down and enunciate key syllables clearly.";
    pacingScore = Math.max(65, 95 - (wordsPerMinute - 165) * 0.6);
  } else if (wordCount === 0) {
    pacingFeedback = "No speech detected.";
    pacingScore = 40;
  }

  // Filler words detection
  const lowerText = ` ${cleanText.toLowerCase()} `;
  const fillerWordsFound: { word: string; count: number }[] = [];
  let totalFillers = 0;

  for (const filler of COMMON_FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      fillerWordsFound.push({ word: filler, count: matches.length });
      totalFillers += matches.length;
    }
  }

  // Grammar & Professional phrasing score
  let grammarScore = 95;
  const grammarNotes: string[] = [];
  for (const rule of GRAMMAR_IMPROVEMENTS) {
    if (rule.pattern.test(cleanText)) {
      grammarScore -= 8;
      grammarNotes.push(rule.advice);
    }
  }
  grammarScore = Math.max(50, Math.min(98, grammarScore));

  // Content Accuracy & Key Point coverage
  const coveredKeyPoints: string[] = [];
  const missedKeyPoints: string[] = [];

  for (const kp of keyPoints) {
    const tokens = kp
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 3);
    const matchedTokens = tokens.filter(tok => lowerText.includes(tok));
    const coverageRatio = tokens.length > 0 ? matchedTokens.length / tokens.length : 0;
    
    if (coverageRatio >= 0.4 || lowerText.includes(kp.toLowerCase().slice(0, 15))) {
      coveredKeyPoints.push(kp);
    } else {
      missedKeyPoints.push(kp);
    }
  }

  const kpRatio = keyPoints.length > 0 ? coveredKeyPoints.length / keyPoints.length : 0.7;
  let contentAccuracyScore = Math.round(50 + kpRatio * 45);
  if (wordCount < 10) contentAccuracyScore = Math.min(contentAccuracyScore, 45);

  // Fluency score (pacing + filler penalty)
  const fillerPenalty = Math.min(30, totalFillers * 4);
  const fluencyScore = Math.round(Math.max(45, Math.min(98, pacingScore - fillerPenalty)));

  // Articulation score (length, complexity, structure, clarity)
  let articulationScore = 85;
  if (wordCount < 15) articulationScore = 55;
  else if (wordCount < 30) articulationScore = 72;
  else if (wordCount >= 40) articulationScore = 90;
  if (totalFillers > 3) articulationScore -= 8;
  articulationScore = Math.max(45, Math.min(98, articulationScore));

  // If re-speaking model answer, bonus for precision
  if (mode === "re-speak") {
    articulationScore = Math.min(99, articulationScore + 6);
    contentAccuracyScore = Math.min(99, contentAccuracyScore + 10);
  }

  // Overall Score
  const overallScore = Math.round(
    articulationScore * 0.3 +
    fluencyScore * 0.25 +
    grammarScore * 0.2 +
    contentAccuracyScore * 0.25
  );

  // Strengths and coaching
  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  if (pacingScore >= 85) strengths.push(`Consistent and calm speaking tempo (~${wordsPerMinute} WPM).`);
  if (totalFillers === 0 && wordCount > 15) strengths.push("Clean spoken delivery with zero filler words ('um', 'basically').");
  if (coveredKeyPoints.length > 0) strengths.push(`Effectively articulated key concept: "${coveredKeyPoints[0]}"`);
  if (wordCount >= 30) strengths.push("Thorough technical answer with structured sentences.");

  if (totalFillers > 0) {
    areasToImprove.push(`Cut down filler words (${totalFillers} detected: ${fillerWordsFound.map(f => `"${f.word}" (${f.count})`).join(", ")}). Use brief silent pauses instead.`);
  }
  if (missedKeyPoints.length > 0) {
    areasToImprove.push(`Incorporate high-scoring keywords: "${missedKeyPoints[0]}"`);
  }
  if (grammarNotes.length > 0) {
    areasToImprove.push(grammarNotes[0]);
  }
  if (wordsPerMinute > 165) {
    areasToImprove.push("Slow down your rate of speech by 15-20% to project more technical authority.");
  }

  // Spoken phrasing recommendations
  const professionalSpokenPhrasing = `To answer directly: "${modelAnswer.slice(0, 160)}..."`;
  const deliveryCoaching = totalFillers > 1
    ? `Great technical intuition! To elevate this to top-tier SDE standard, pause silently for 1 second instead of saying "${fillerWordsFound[0]?.word || "um"}", and start with a definitive definition sentence.`
    : `Excellent, crisp articulation. Your speech pace of ${wordsPerMinute} WPM reflects high confidence and technical command.`;

  const scoreDelta = previousScore !== undefined ? overallScore - previousScore : undefined;

  // Try AI-enhanced insights if Groq is available
  try {
    const groqKey = getActiveGroqKey();
    if (groqKey && cleanText.length > 20) {
      const groq = new Groq({ apiKey: groqKey });
      const prompt = `You are a Principal Software Engineering Speech & Interview Coach.
Evaluate this fresher candidate's SPOKEN technical answer to:
Question: "${question}"
Candidate Spoken Transcript: "${cleanText}"
Ideal Model Answer: "${modelAnswer}"

Return ONLY valid JSON matching this schema:
{
  "articulationCritique": "1-2 sentences on voice clarity, enunciation, and spoken delivery tone",
  "additionalStrength": "Specific technical talking point they explained well",
  "additionalImprovement": "Specific technical concept or phrasing that would score higher"
}`;

      const aiResponse = await Promise.race([
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 250,
        }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2800)),
      ]);

      if (aiResponse && aiResponse.choices[0]?.message?.content) {
        const parsed = JSON.parse(aiResponse.choices[0].message.content);
        if (parsed.additionalStrength && strengths.length < 3) strengths.push(parsed.additionalStrength);
        if (parsed.additionalImprovement && areasToImprove.length < 3) areasToImprove.push(parsed.additionalImprovement);
      }
    }
  } catch {
    // Non-blocking fallback to our deterministic rubric
  }

  return {
    overallScore,
    articulationScore,
    fluencyScore,
    grammarScore,
    contentAccuracyScore,
    wordsPerMinute,
    pacingFeedback,
    fillerWordCount: totalFillers,
    fillerWordsFound,
    coveredKeyPoints,
    missedKeyPoints,
    strengths: strengths.slice(0, 3),
    areasToImprove: areasToImprove.slice(0, 3),
    deliveryCoaching,
    professionalSpokenPhrasing,
    mode,
    scoreDelta,
  };
}
