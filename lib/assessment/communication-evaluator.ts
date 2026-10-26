import { CommunicationReport, CommunicationIssue } from "../types";

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
];

// Common grammatical and technical phrasing improvement patterns
interface GrammarRule {
  pattern: RegExp;
  identifiedIssue: string;
  reason: string;
  correctionBuilder: (match: RegExpMatchArray, fullSentence: string) => { corrected: string; interviewReady: string };
}

const GRAMMAR_RULES: GrammarRule[] = [
  {
    pattern: /\b(hashmap|hash map|arraylist|hashset|hash table|queue|stack)\s+(are|were)\b/i,
    identifiedIssue: "Subject-verb agreement mismatch with singular data structure noun.",
    reason: "A data structure type name in singular form requires a singular verb ('is' or 'was') or should be preceded by an article ('A HashMap is...').",
    correctionBuilder: (match, fullSentence) => {
      const ds = match[1];
      const verb = match[2].toLowerCase() === "are" ? "is" : "was";
      const corrected = fullSentence.replace(match[0], `A ${ds} ${verb}`);
      const interviewReady = `In software engineering, a ${ds} ${verb} preferred because it guarantees optimal lookup and insertion performance.`;
      return { corrected, interviewReady };
    },
  },
  {
    pattern: /\bit\s+(store|give|take|run|provide|contain|hold|work)\b(?!\s+(to|for|out|up))/i,
    identifiedIssue: "Subject-verb agreement error with singular third-person pronoun 'it'.",
    reason: "In present tense, third-person singular subjects ('it', 'this component') take verbs ending in '-s' or '-es' (e.g. 'it stores', 'it provides').",
    correctionBuilder: (match, fullSentence) => {
      const verb = match[1];
      const correctedVerb = verb.endsWith("e") ? `${verb}s` : `${verb}s`;
      const corrected = fullSentence.replace(match[0], `it ${correctedVerb}`);
      const interviewReady = fullSentence.replace(match[0], `it effectively ${correctedVerb}`);
      return { corrected, interviewReady };
    },
  },
  {
    pattern: /\b(more better|most best|more faster|more optimal|most optimal)\b/i,
    identifiedIssue: "Double comparative or redundant superlative modifier.",
    reason: "'Better' and 'faster' are already comparative. Modifiers like 'more' should not be prepended to them.",
    correctionBuilder: (match, fullSentence) => {
      const bad = match[1].toLowerCase();
      let replacement = "better";
      if (bad.includes("fast")) replacement = "faster";
      if (bad.includes("optimal")) replacement = "more efficient";
      const corrected = fullSentence.replace(match[0], replacement);
      const interviewReady = fullSentence.replace(match[0], `significantly ${replacement}`);
      return { corrected, interviewReady };
    },
  },
  {
    pattern: /\bwe\s+can\s+able\s+to\b/i,
    identifiedIssue: "Redundant modal phrase ('can able to').",
    reason: "'Can' and 'be able to' convey the same capability; using both simultaneously is redundant.",
    correctionBuilder: (match, fullSentence) => {
      const corrected = fullSentence.replace(match[0], "we can");
      const interviewReady = fullSentence.replace(match[0], "we are able to effectively");
      return { corrected, interviewReady };
    },
  },
  {
    pattern: /\bi\s+(am\s+having|have\s+did|done\s+this|seen\s+that)\b/i,
    identifiedIssue: "Tense consistency and auxiliary verb construction error.",
    reason: "State verbs like 'have' should not be used in continuous tense for possession, or past participles were used without proper auxiliary verbs.",
    correctionBuilder: (match, fullSentence) => {
      const corrected = fullSentence.replace(match[0], "I have completed this");
      const interviewReady = "In my practical engineering experience, I implemented this architecture.";
      return { corrected, interviewReady };
    },
  },
  {
    pattern: /\b(very\s+fast|very\s+big|very\s+slow|very\s+good)\b/i,
    identifiedIssue: "Vague non-technical qualifier ('very').",
    reason: "Technical interviews reward precise algorithmic terminology such as 'logarithmic time', 'constant space', or 'scalable throughput' over informal qualifiers.",
    correctionBuilder: (match, fullSentence) => {
      const term = match[1].toLowerCase();
      let replacement = "highly efficient";
      if (term.includes("slow")) replacement = "computationally expensive (O(N^2))";
      if (term.includes("big")) replacement = "extensive in memory footprint";
      const corrected = fullSentence.replace(match[0], replacement);
      const interviewReady = fullSentence.replace(match[0], `${replacement}`);
      return { corrected, interviewReady };
    },
  },
];

export function evaluateCandidateCommunication(candidateTranscripts: string[]): CommunicationReport {
  if (!candidateTranscripts || candidateTranscripts.length === 0) {
    return {
      overallScore: 80,
      grammarScore: 80,
      clarityScore: 80,
      technicalExplanationScore: 80,
      repeatedMistakes: [],
      issues: [],
      fillerWordCount: 0,
      disclaimer: "No transcripts recorded yet.",
    };
  }

  const allText = candidateTranscripts.join(" ");
  const sentences = allText
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  let fillerWordCount = 0;
  for (const word of FILLER_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = allText.match(regex);
    if (matches) {
      fillerWordCount += matches.length;
    }
  }

  const issues: CommunicationIssue[] = [];
  const repeatedMistakesSet = new Set<string>();

  for (const sentence of sentences) {
    for (const rule of GRAMMAR_RULES) {
      const match = sentence.match(rule.pattern);
      if (match) {
        repeatedMistakesSet.add(rule.identifiedIssue);
        const { corrected, interviewReady } = rule.correctionBuilder(match, sentence);
        issues.push({
          submittedSentence: sentence,
          identifiedIssue: rule.identifiedIssue,
          correctedSentence: corrected,
          reason: rule.reason,
          improvedInterviewVersion: interviewReady,
        });
        break; // Only report one primary issue per sentence to avoid overwhelming feedback
      }
    }
  }

  // Calculate scores calibrated to transcript size
  const totalSentences = Math.max(1, sentences.length);
  const issuesPerSentence = issues.length / totalSentences;
  const fillersPerSentence = fillerWordCount / totalSentences;

  const grammarScore = Math.max(45, Math.min(98, Math.round(96 - issuesPerSentence * 35)));
  const clarityScore = Math.max(50, Math.min(98, Math.round(95 - fillersPerSentence * 8 - (issues.length > 3 ? 10 : 0))));
  const technicalExplanationScore = Math.max(50, Math.min(95, Math.round(88 - issuesPerSentence * 15)));

  const overallScore = Math.round((grammarScore * 0.4) + (clarityScore * 0.3) + (technicalExplanationScore * 0.3));

  return {
    overallScore,
    grammarScore,
    clarityScore,
    technicalExplanationScore,
    repeatedMistakes: Array.from(repeatedMistakesSet),
    issues: issues.slice(0, 8), // Provide top relevant issues
    fillerWordCount,
    disclaimer:
      "Communication assessment is performed strictly on submitted text transcripts. Accents, voice pitch, regional dialects, and speech pace are not measured or penalized. Certain technical acronyms or proper nouns may reflect speech recognition approximations rather than candidate intent.",
  };
}

/**
 * Evaluates a single answer transcript for immediate formative coaching in Practice Mode.
 * Returns null if no major issues were identified to keep conversation fluid.
 */
export function evaluateSingleTurnCommunication(transcript: string): CommunicationIssue | null {
  if (!transcript || transcript.trim().length < 15) return null;

  for (const rule of GRAMMAR_RULES) {
    const match = transcript.match(rule.pattern);
    if (match) {
      const { corrected, interviewReady } = rule.correctionBuilder(match, transcript);
      return {
        submittedSentence: transcript,
        identifiedIssue: rule.identifiedIssue,
        correctedSentence: corrected,
        reason: rule.reason,
        improvedInterviewVersion: interviewReady,
      };
    }
  }
  return null;
}

