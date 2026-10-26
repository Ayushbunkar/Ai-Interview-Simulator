import { InterviewAIProvider, AIContext, EvaluateAnswerParams, CandidateQuestionParams, GenerateFollowUpParams, GenerateReportParams } from "./interface";
import { AnswerEvaluation, ClarificationResponse, RubricScoreItem } from "../types";
import { TECHNICAL_ROUND_RUBRIC, BEHAVIORAL_ROUND_RUBRIC, calculateWeightedScore } from "../rubric";

export class LocalDevAIProvider implements InterviewAIProvider {
  name = "Local Development Engine (Offline / Deterministic)";

  isConfigured(): boolean {
    return true;
  }

  async evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation> {
    const { questionText, expectedAnswer, candidateAnswer, context } = params;
    const cleanAnswer = (candidateAnswer || "").trim().toLowerCase();

    // Empty or trivial answer check
    if (cleanAnswer.length < 5) {
      const rubric = (context.roundNumber === 4 ? BEHAVIORAL_ROUND_RUBRIC : TECHNICAL_ROUND_RUBRIC).map(r => ({
        name: r.name,
        weight: r.weight,
        score: 10,
        notes: "No substantive response provided.",
      }));

      return {
        score: 10,
        strengths: [],
        weaknesses: ["Answer was empty or too brief to evaluate."],
        feedback: "[Local Engine] Candidate provided negligible detail. Elaborate on core principles, trade-offs, and concrete examples.",
        rubricScores: rubric,
        isSatisfactory: false,
      };
    }

    // Extract keywords from expected answer
    const keywords = (expectedAnswer + " " + (params.rubricFocus || ""))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 4 && !["which", "where", "there", "their", "about", "could", "would", "should"].includes(w));

    const uniqueKeywords = Array.from(new Set(keywords));
    let matchedKeywords = 0;
    for (const kw of uniqueKeywords) {
      if (cleanAnswer.includes(kw)) {
        matchedKeywords++;
      }
    }

    const keywordRatio = uniqueKeywords.length > 0 ? matchedKeywords / uniqueKeywords.length : 0.5;
    const lengthScore = Math.min(100, Math.max(20, Math.round(cleanAnswer.length / 3))); // longer thoughtful answers score better
    const conceptScore = Math.min(100, Math.max(25, Math.round(keywordRatio * 110)));
    const baseScore = Math.min(95, Math.round((conceptScore * 0.7) + (lengthScore * 0.3)));

    const isBehavioral = context.roundNumber === 4;
    const rubricDefs = isBehavioral ? BEHAVIORAL_ROUND_RUBRIC : TECHNICAL_ROUND_RUBRIC;

    const rubricScores: RubricScoreItem[] = rubricDefs.map(def => {
      let itemScore = baseScore;
      let notes = "Good foundational understanding demonstrated.";

      if (def.name.includes("Correctness") || def.name.includes("Relevance")) {
        itemScore = Math.min(100, Math.max(20, conceptScore));
        notes = itemScore >= 70 ? "Relevant key concepts covered." : "Missing some technical accuracy or required concepts.";
      } else if (def.name.includes("Depth") || def.name.includes("Specificity")) {
        itemScore = Math.min(100, Math.max(20, Math.round(baseScore * 0.95)));
        notes = cleanAnswer.length > 250 ? "Includes concrete details and explanation." : "Could delve deeper into trade-offs or explicit scenarios.";
      } else if (def.name.includes("Complexity") || def.name.includes("Decision")) {
        itemScore = Math.min(100, Math.max(20, Math.round(baseScore * 0.9)));
        notes = "Considers constraints and computational/operational context.";
      } else if (def.name.includes("Communication")) {
        itemScore = Math.min(100, Math.max(40, lengthScore));
        notes = "Clear sentence structure and readable articulation.";
      }

      return {
        name: def.name,
        weight: def.weight,
        score: itemScore,
        notes,
      };
    });

    const finalScore = calculateWeightedScore(rubricScores);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (finalScore >= 65) {
      strengths.push("Identified primary concepts relevant to the problem.");
      if (cleanAnswer.length > 150) strengths.push("Articulated response with appropriate technical context.");
    } else {
      weaknesses.push("Missing foundational terminology and key mechanics.");
    }

    if (cleanAnswer.length < 100) {
      weaknesses.push("Response was concise; expand on reasoning and edge cases.");
    }

    let feedback = `[Local Development Engine Evaluation — configure GROQ_API_KEY for live LLM reasoning]\n\n`;
    if (finalScore >= 80) {
      feedback += `Strong response! You clearly understand the core principles behind ${questionText.slice(0, 40)}...`;
    } else if (finalScore >= 60) {
      feedback += `Good attempt. You captured the main idea, but interviewers at ${context.companyProfile} typically look for deeper architectural nuance and trade-off analysis.`;
    } else {
      feedback += `Needs improvement. Review the expected mechanics: ${expectedAnswer.slice(0, 150)}...`;
    }

    return {
      score: finalScore,
      strengths,
      weaknesses,
      feedback,
      rubricScores,
      isSatisfactory: finalScore >= 60,
    };
  }

  async answerCandidateQuestion(params: CandidateQuestionParams): Promise<ClarificationResponse> {
    const { currentQuestionText, candidateQuestion, context } = params;
    const lower = candidateQuestion.toLowerCase();

    let msg = `[Interviewer Clarification]\nRegarding the question: "${currentQuestionText}"\n\n`;

    if (lower.includes("constraint") || lower.includes("limit") || lower.includes("range")) {
      msg += `You can assume standard production constraints: inputs fit within standard 32-bit/64-bit integer ranges, and data volume is within typical memory capacity unless specified. Focus on the optimal algorithmic approach.`;
    } else if (lower.includes("null") || lower.includes("empty") || lower.includes("negative")) {
      msg += `Yes, handling edge cases such as null/empty references and boundary values is expected in your design.`;
    } else if (lower.includes("format") || lower.includes("expect") || lower.includes("looking for")) {
      msg += `I am looking for your technical understanding, step-by-step reasoning, and any production trade-offs you would make in a real ${context.targetRole} role.`;
    } else {
      msg += `That's a valid question. Focus on explaining your thought process, how you would approach the design, and any assumptions you make. Please proceed with your answer when ready.`;
    }

    return {
      message: msg,
      clarified: true,
      preservesOriginalQuestion: true,
    };
  }

  async generateFollowUp(params: GenerateFollowUpParams): Promise<{ followUpQuestion: string }> {
    const { currentQuestionText, candidateAnswer } = params;
    if (candidateAnswer.length > 200) {
      return {
        followUpQuestion: `Interesting point. How would your approach change if this system needed to scale to handle 10x higher concurrent load or distributed state?`,
      };
    }
    return {
      followUpQuestion: `Could you give a concrete real-world example or edge case where this approach might fail or perform sub-optimally?`,
    };
  }

  async generateFinalReport(params: GenerateReportParams) {
    const { answers, context } = params;
    const avgScore = answers.length > 0
      ? Math.round(answers.reduce((acc, a) => acc + (a.evaluationScore || 50), 0) / answers.length)
      : 50;

    let readinessLevel: "Strong Hire" | "Hire" | "Needs Practice" | "Major Revisions Needed" = "Needs Practice";
    if (avgScore >= 85) readinessLevel = "Strong Hire";
    else if (avgScore >= 70) readinessLevel = "Hire";
    else if (avgScore >= 50) readinessLevel = "Needs Practice";
    else readinessLevel = "Major Revisions Needed";

    return {
      technicalStrengths: [
        "Consistent conceptual foundation in computer science basics.",
        "Ability to structure answers with logical flow.",
        `Familiarity with core requirements for ${context.companyProfile} roles.`,
      ],
      areasForImprovement: [
        "Include more concrete metrics and production trade-offs in technical explanations.",
        "Practice strict time and space complexity Big-O derivations for coding challenges.",
        "Structure behavioral answers strictly around the STAR framework (Situation, Task, Action, Result).",
      ],
      communicationAssessment:
        "Communicates with clarity and maintains professional composure throughout the interview rounds. Focus on concise introductory summaries before delving into implementation details.",
      codingAssessmentSummary:
        "Coding challenges demonstrated problem breakdown skills. Prioritize edge-case validation and unit testing prior to submission.",
      sevenDayPlan: [
        { day: 1, focus: "Core Fundamentals & OOP", tasks: ["Review Java Memory Model & Garbage Collection", "Practice 5 Easy LeetCode array questions"] },
        { day: 2, focus: "Data Structures & Complexity", tasks: ["Deep dive into HashMaps & Tree Traversals", "Practice 2 Medium Two-Pointer problems"] },
        { day: 3, focus: "DBMS & Transactions", tasks: ["Review SQL Joins, Indexing B-Trees, and ACID properties", "Write complex multi-table queries"] },
        { day: 4, focus: "Operating Systems & Concurrency", tasks: ["Review Process vs Thread, Deadlocks, Mutex vs Semaphore", "Thread synchronization coding"] },
        { day: 5, focus: "Computer Networks & APIs", tasks: ["TCP 3-way handshake, HTTP status codes, REST vs gRPC", "Design idempotent REST endpoints"] },
        { day: 6, focus: "System Design & Architecture", tasks: ["High-level design of a scalable URL shortener or Rate Limiter", "Cache invalidation strategies"] },
        { day: 7, focus: "Mock Interview & Behavioral", tasks: ["Draft 5 STAR stories for conflict, deadline, and failure", "Take a timed 60-minute mock interview"] },
      ],
      readinessLevel,
      readinessSummary: `Based on your interview session for ${context.targetRole} (${context.companyProfile}), your overall readiness is rated as "${readinessLevel}" with an average performance index of ${avgScore}/100. Follow the 7-day revision plan to close knowledge gaps.`,
    };
  }

  async testConnection() {
    return {
      success: true,
      message: "Local Development Engine is active and ready (Offline mode, zero API dependency).",
    };
  }
}
