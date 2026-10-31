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
  overallScore: number; // 0 - 100 (strictly weighted, capped on factual errors)
  contentAccuracyScore: number; // 0 - 100: Technical Accuracy against model answer
  grammarScore: number; // 0 - 100: Sentence structure, syntax, and phrasing
  articulationScore: number; // 0 - 100: Clarity, precision of technical vocabulary
  fluencyScore: number; // 0 - 100: Flow, pacing, lack of self-corrections/stumbles
  
  isFactuallyIncorrect: boolean;
  factualErrors: string[];
  verdict: "Critical Inaccuracy" | "Needs Major Work" | "Partially Competent" | "Strong Delivery" | "Interview Ready";
  
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
  scoreDelta?: number;
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
  const wordsPerMinute = wordCount > 0 ? Math.min(260, Math.max(30, rawWpm)) : 0;

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

  // Pacing analysis
  let pacingFeedback = "Ideal speaking pace (120–150 WPM).";
  let pacingScore = 90;
  if (wordsPerMinute < 85 && wordCount > 5) {
    pacingFeedback = "Pacing was too hesitant (<85 WPM). Increase cadence to sound confident.";
    pacingScore = Math.max(40, 90 - (85 - wordsPerMinute) * 1.2);
  } else if (wordsPerMinute > 170) {
    pacingFeedback = "Speaking too fast (>170 WPM). Slow down and enunciate key technical words.";
    pacingScore = Math.max(50, 90 - (wordsPerMinute - 170) * 0.8);
  } else if (wordCount === 0) {
    pacingFeedback = "No speech detected.";
    pacingScore = 0;
  }

  // Check keypoints deterministically
  const coveredKeyPoints: string[] = [];
  const missedKeyPoints: string[] = [];
  for (const kp of keyPoints) {
    const tokens = kp
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3);
    const matchedTokens = tokens.filter((tok) => lowerText.includes(tok));
    const coverageRatio = tokens.length > 0 ? matchedTokens.length / tokens.length : 0;
    if (coverageRatio >= 0.5) {
      coveredKeyPoints.push(kp);
    } else {
      missedKeyPoints.push(kp);
    }
  }

  // Default initial values for empty or ultra-short input
  if (wordCount < 4) {
    return {
      overallScore: 0,
      contentAccuracyScore: 0,
      grammarScore: 0,
      articulationScore: 0,
      fluencyScore: 0,
      isFactuallyIncorrect: true,
      factualErrors: ["No substantive answer spoken. Please explain the technical concept in full."],
      verdict: "Critical Inaccuracy",
      wordsPerMinute,
      pacingFeedback: "Answer was too brief to evaluate.",
      fillerWordCount: 0,
      fillerWordsFound: [],
      coveredKeyPoints: [],
      missedKeyPoints: keyPoints,
      strengths: [],
      areasToImprove: ["Speak a complete 2–4 sentence technical explanation."],
      deliveryCoaching: "Your microphone recording was empty or less than 4 words. Speak clearly into the microphone.",
      professionalSpokenPhrasing: `Ideal response: "${modelAnswer.slice(0, 160)}..."`,
      mode,
      scoreDelta: previousScore !== undefined ? 0 - previousScore : undefined,
    };
  }

  // -------------------------------------------------------------------------
  // 1. PRIMARY AI-POWERED STRICT BAR-RAISER EVALUATION (via Groq Llama 3.3 70B)
  // -------------------------------------------------------------------------
  const groqKey = getActiveGroqKey();
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const prompt = `You are an extremely strict Senior Technical Interview Bar-Raiser at a top-tier tech company (Google, Amazon, TCS Digital, Capgemini).
Evaluate this candidate's SPOKEN technical answer with absolute rigor.

CRITICAL INSTRUCTION ON STRICTNESS:
Real technical interviews DO NOT tolerate factual inaccuracies, confusing fundamental data structures (e.g. Stack vs Queue, Process vs Thread, ArrayList vs LinkedList), or broken, incoherent English.
Even if a candidate speaks smoothly, a factually wrong or confused answer MUST FAIL.

QUESTION: "${question}"
MODEL ANSWER: "${modelAnswer}"
REQUIRED KEY POINTS: ${JSON.stringify(keyPoints)}

CANDIDATE'S SPOKEN TRANSCRIPT:
"${cleanText}"

EVALUATION RUBRIC:
1. contentAccuracyScore (0-100, 50% WEIGHT OF INTERVIEW):
   - 0-25: Factually wrong, contradictory, confuses fundamental concepts (e.g., calling FCFS a stack or MEAN stack, calling SQL a NoSQL DB), or completely irrelevant.
   - 26-50: Vague, largely inaccurate, misses the essential core mechanism.
   - 51-70: Partially correct, gets the general idea but misses critical details or gives a weak definition.
   - 71-85: Technically correct, covers main points accurately.
   - 86-100: Comprehensive, exact terminology, crystal-clear technical logic.

2. isFactuallyIncorrect: boolean (true if the answer contains any conceptual error, contradiction, or wrong terminology).
3. factualErrors: array of strings detailing every specific factual mistake made (e.g. "Stated that FCFS uses a stack; FCFS is a scheduling algorithm that operates strictly on a FIFO Queue, not a Stack (LIFO).").

4. grammarScore (0-100, 20% WEIGHT):
   - Evaluate sentence structure, clarity, and subject-verb agreement.
   - Heavily penalize broken phrases (e.g. "is mean stack", "simply use stack", "this is also the point in the first come").

5. articulationScore (0-100, 15% WEIGHT):
   - Precision of technical vocabulary and structured enunciation.

6. fluencyScore (0-100, 15% WEIGHT):
   - Speech flow, self-corrections ("Sorry, we can use..."), repetitions, and hesitations.

7. overallScore (0-100):
   - Calculate: Math.round(contentAccuracyScore * 0.50 + grammarScore * 0.20 + articulationScore * 0.15 + fluencyScore * 0.15)
   - CRITICAL HARD CAP:
     * If contentAccuracyScore < 40: overallScore CANNOT EXCEED 35. (Factual errors are disqualifiers).
     * If contentAccuracyScore < 60: overallScore CANNOT EXCEED 55.

8. verdict:
   - "Critical Inaccuracy" (overallScore < 40)
   - "Needs Major Work" (overallScore 40-59)
   - "Partially Competent" (overallScore 60-74)
   - "Strong Delivery" (overallScore 75-84)
   - "Interview Ready" (overallScore 85+)

9. deliveryCoaching: Direct, candid, professional feedback explaining whether this answer passes an interview and why. If wrong, state the exact reason bluntly.

10. strengths: Array of 1-3 genuine strengths (empty if answer is completely wrong).
11. areasToImprove: Array of 2-4 concrete technical and communication improvements.

Return ONLY valid JSON matching this exact structure:
{
  "contentAccuracyScore": number,
  "isFactuallyIncorrect": boolean,
  "factualErrors": string[],
  "grammarScore": number,
  "articulationScore": number,
  "fluencyScore": number,
  "overallScore": number,
  "verdict": "Critical Inaccuracy" | "Needs Major Work" | "Partially Competent" | "Strong Delivery" | "Interview Ready",
  "deliveryCoaching": string,
  "strengths": string[],
  "areasToImprove": string[]
}`;

      const aiResponse = await Promise.race([
        groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 650,
        }),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("AI Timeout")), 6500)),
      ]);

      if (aiResponse && aiResponse.choices[0]?.message?.content) {
        const parsed = JSON.parse(aiResponse.choices[0].message.content);

        let contentAccuracyScore = Math.max(0, Math.min(100, Number(parsed.contentAccuracyScore) || 20));
        let grammarScore = Math.max(0, Math.min(100, Number(parsed.grammarScore) || 40));
        let articulationScore = Math.max(0, Math.min(100, Number(parsed.articulationScore) || 40));
        let fluencyScore = Math.max(0, Math.min(100, Number(parsed.fluencyScore) || 45));

        // Deduct extra for heavy filler words
        if (totalFillers > 2) {
          fluencyScore = Math.max(20, fluencyScore - totalFillers * 4);
        }

        // Apply Strict Hard Caps
        let overallScore = Math.round(
          contentAccuracyScore * 0.50 +
          grammarScore * 0.20 +
          articulationScore * 0.15 +
          fluencyScore * 0.15
        );

        const isFactuallyIncorrect = Boolean(parsed.isFactuallyIncorrect) || contentAccuracyScore < 40;
        const factualErrors: string[] = Array.isArray(parsed.factualErrors) ? parsed.factualErrors : [];

        if (isFactuallyIncorrect || contentAccuracyScore < 40) {
          overallScore = Math.min(35, overallScore);
        } else if (contentAccuracyScore < 60) {
          overallScore = Math.min(55, overallScore);
        }

        // Determine strict verdict
        let verdict: SpeechEvaluationResult["verdict"] = "Needs Major Work";
        if (overallScore < 40 || isFactuallyIncorrect) {
          verdict = "Critical Inaccuracy";
        } else if (overallScore < 60) {
          verdict = "Needs Major Work";
        } else if (overallScore < 75) {
          verdict = "Partially Competent";
        } else if (overallScore < 85) {
          verdict = "Strong Delivery";
        } else {
          verdict = "Interview Ready";
        }

        const scoreDelta = previousScore !== undefined ? overallScore - previousScore : undefined;

        return {
          overallScore,
          contentAccuracyScore,
          grammarScore,
          articulationScore,
          fluencyScore,
          isFactuallyIncorrect,
          factualErrors,
          verdict,
          wordsPerMinute,
          pacingFeedback,
          fillerWordCount: totalFillers,
          fillerWordsFound,
          coveredKeyPoints,
          missedKeyPoints,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
          areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove.slice(0, 4) : [],
          deliveryCoaching: parsed.deliveryCoaching || "Answer requires substantial technical refinement.",
          professionalSpokenPhrasing: `To answer like a Senior Engineer: "${modelAnswer.slice(0, 180)}..."`,
          mode,
          scoreDelta,
        };
      }
    } catch (err: any) {
      console.warn("Groq strict speech evaluation failed or timed out. Falling back to calibrated deterministic rubric:", err.message || err);
    }
  }

  // -------------------------------------------------------------------------
  // 2. STRICT DETERMINISTIC FALLBACK (Calibrated to fail wrong answers)
  // -------------------------------------------------------------------------
  const lowerQ = question.toLowerCase();
  let factualErrors: string[] = [];
  let isFactuallyIncorrect = false;

  // Detect glaring factual contradictions
  if (lowerQ.includes("fcfs") || lowerQ.includes("first come")) {
    if (lowerText.includes("stack") && !lowerText.includes("not stack")) {
      isFactuallyIncorrect = true;
      factualErrors.push("FCFS uses a FIFO Queue (First-In, First-Out), not a Stack (LIFO).");
    }
  }
  if (lowerQ.includes("lifo") && lowerText.includes("queue")) {
    isFactuallyIncorrect = true;
    factualErrors.push("LIFO (Last-In, First-Out) corresponds to a Stack, not a Queue.");
  }

  // Accuracy calculation based on keypoints
  const kpRatio = keyPoints.length > 0 ? coveredKeyPoints.length / keyPoints.length : 0;
  let contentAccuracyScore = Math.round(kpRatio * 85);
  if (isFactuallyIncorrect) {
    contentAccuracyScore = Math.min(20, contentAccuracyScore);
  }
  if (wordCount < 15) {
    contentAccuracyScore = Math.min(30, contentAccuracyScore);
  }

  // Detect broken English patterns
  let grammarScore = 80;
  const brokenPatterns = [
    /\bis\s+mean\b/i,
    /\bpoint\s+in\s+the\b/i,
    /\bwe\s+can\s+use\s+in\s+the\b/i,
    /\bsorry\b/i,
    /\bthat\s+queue\s+that\b/i,
    /\bmore\s+better\b/i,
    /\bwe\s+can\s+able\b/i,
  ];
  for (const pat of brokenPatterns) {
    if (pat.test(cleanText)) {
      grammarScore -= 15;
    }
  }
  grammarScore = Math.max(25, Math.min(95, grammarScore));

  // Articulation score
  let articulationScore = 65;
  if (wordCount < 15) articulationScore = 35;
  else if (wordCount < 25) articulationScore = 48;
  if (isFactuallyIncorrect) articulationScore = Math.min(35, articulationScore);

  // Fluency score (pacing - self-corrections - fillers)
  let fluencyScore = pacingScore;
  if (cleanText.toLowerCase().includes("sorry")) fluencyScore -= 20;
  fluencyScore = Math.max(25, Math.min(95, fluencyScore - totalFillers * 5));

  // Strict overall score
  let overallScore = Math.round(
    contentAccuracyScore * 0.50 +
    grammarScore * 0.20 +
    articulationScore * 0.15 +
    fluencyScore * 0.15
  );

  if (isFactuallyIncorrect || contentAccuracyScore < 40) {
    overallScore = Math.min(35, overallScore);
  } else if (contentAccuracyScore < 60) {
    overallScore = Math.min(55, overallScore);
  }

  let verdict: SpeechEvaluationResult["verdict"] = "Needs Major Work";
  if (overallScore < 40 || isFactuallyIncorrect) {
    verdict = "Critical Inaccuracy";
  } else if (overallScore < 60) {
    verdict = "Needs Major Work";
  } else if (overallScore < 75) {
    verdict = "Partially Competent";
  } else {
    verdict = "Strong Delivery";
  }

  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  if (coveredKeyPoints.length > 0) strengths.push(`Mentioned key concept: "${coveredKeyPoints[0]}"`);
  if (totalFillers === 0 && wordCount > 20) strengths.push("Spoke without verbal filler words.");

  if (isFactuallyIncorrect) {
    areasToImprove.push("Eliminate factual contradictions: " + (factualErrors[0] || "Review the definition."));
  }
  if (missedKeyPoints.length > 0) {
    areasToImprove.push(`Missing core interview points: "${missedKeyPoints[0]}"`);
  }
  if (grammarScore < 60) {
    areasToImprove.push("Structure answers in complete, grammatically sound sentences rather than fragmented thoughts.");
  }

  const deliveryCoaching = isFactuallyIncorrect
    ? `Critical technical mistake detected. In an engineering interview, confusing fundamental concepts like Stack and Queue leads to an immediate low rating. Review the correct model answer below and practice speaking it.`
    : contentAccuracyScore < 50
    ? `Your explanation was too vague and lacked technical depth. Focus on explaining the algorithm mechanism and trade-offs directly.`
    : `Good effort. Continue refining your phrasing for concise, authoritative delivery.`;

  const scoreDelta = previousScore !== undefined ? overallScore - previousScore : undefined;

  return {
    overallScore,
    contentAccuracyScore,
    grammarScore,
    articulationScore,
    fluencyScore,
    isFactuallyIncorrect,
    factualErrors,
    verdict,
    wordsPerMinute,
    pacingFeedback,
    fillerWordCount: totalFillers,
    fillerWordsFound,
    coveredKeyPoints,
    missedKeyPoints,
    strengths: strengths.slice(0, 3),
    areasToImprove: areasToImprove.slice(0, 4),
    deliveryCoaching,
    professionalSpokenPhrasing: `Ideal response: "${modelAnswer.slice(0, 160)}..."`,
    mode,
    scoreDelta,
  };
}
