import Groq from "groq-sdk";
import { z } from "zod";
import { InterviewAIProvider, AIContext, EvaluateAnswerParams, CandidateQuestionParams, GenerateFollowUpParams, GenerateReportParams } from "./interface";
import { AnswerEvaluation, ClarificationResponse, RubricScoreItem } from "../types";
import { TECHNICAL_ROUND_RUBRIC, BEHAVIORAL_ROUND_RUBRIC, calculateWeightedScore } from "../rubric";
import { executeAIRequest } from "../reliability/ai-request-manager";

const RubricItemSchema = z.union([
  z.object({
    name: z.string(),
    weight: z.number().optional().default(20),
    score: z.number().min(0).max(100),
    notes: z.string().optional().default(""),
  }),
  z.string().transform((str) => ({
    name: str.slice(0, 30),
    weight: 20,
    score: 75,
    notes: str,
  })),
]);

const EvaluationSchema = z.object({
  score: z.number().min(0).max(100).transform(s => Math.round(s)),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  feedback: z.string(),
  rubricScores: z.array(RubricItemSchema).default([]),
  isSatisfactory: z.boolean().default(true),
  expectedConcepts: z.array(z.string()).optional().default([]),
  demonstratedConcepts: z.array(z.string()).optional().default([]),
  missingConcepts: z.array(z.string()).optional().default([]),
  improvedAnswerOutline: z.string().optional().default(""),
  confidenceLevel: z.enum(["high", "medium", "low_insufficient_evidence"]).optional().default("high"),
  isVagueOrIncomplete: z.boolean().optional().default(false),
  clarificationPrompt: z.string().optional(),
});

const ClarificationSchema = z.object({
  message: z.string(),
  clarified: z.boolean(),
  preservesOriginalQuestion: z.boolean(),
});

const FollowUpSchema = z.object({
  followUpQuestion: z.string(),
});

export class GroqAIProvider implements InterviewAIProvider {
  name = "Groq Cloud AI";
  private client: Groq | null = null;
  private model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new Groq({ apiKey });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  private getGroqClient(): Groq {
    if (!this.client) {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }

  async evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation> {
    const groq = this.getGroqClient();
    const { questionText, expectedAnswer, candidateAnswer, context } = params;

    const isBehavioral = context.roundNumber === 4;
    const rubric = isBehavioral ? BEHAVIORAL_ROUND_RUBRIC : TECHNICAL_ROUND_RUBRIC;

    const systemPrompt = `You are a calibrated, senior technical interviewer for ${context.companyProfile} interviewing for the role of ${context.targetRole} (${context.difficulty} level).
Mode: ${context.mode} interview.
Candidate resume/project context: ${context.resumeText || "None provided"}.

Rubric weights to evaluate:
${rubric.map(r => `- ${r.name} (${r.weight}%): ${r.description}`).join("\n")}

Respond ONLY with valid JSON conforming to this schema:
{
  "score": number (0-100 overall weighted score),
  "strengths": string[],
  "weaknesses": string[],
  "feedback": string (concise, professional, actionable interview feedback),
  "expectedConcepts": string[] (core technical concepts required for a thorough answer),
  "demonstratedConcepts": string[] (concepts candidate actually demonstrated correctly),
  "missingConcepts": string[] (crucial concepts missing or incorrect in candidate response),
  "improvedAnswerOutline": string (concise bulleted outline of how an optimal senior candidate would answer and why it is better),
  "confidenceLevel": "high" | "medium" | "low_insufficient_evidence" (use low if answer is too short or ambiguous to evaluate),
  "isVagueOrIncomplete": boolean (true if answer is overly brief, hand-waving, or missing core mechanics),
  "clarificationPrompt": string (if isVagueOrIncomplete is true, a professional question asking candidate to elaborate on missing concepts),
  "rubricScores": [
    { "name": string, "weight": number, "score": number, "notes": string }
  ],
  "isSatisfactory": boolean (true if candidate demonstrated sufficient competency, >= 60)
}`;

    const userPrompt = `Question Asked:
${questionText}

Target Expected Answer / Benchmarks:
${expectedAnswer}

Candidate's Answer:
${candidateAnswer || "(No answer provided)"}

Evaluate the candidate rigorously based on factual correctness, engineering trade-offs, and clear communication.`;

    const actionId = `eval:${context.sessionId}:round:${context.roundNumber}`;

    return executeAIRequest(
      async (signal) => {
        const response = await groq.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          },
          { signal }
        );

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        return EvaluationSchema.parse(parsed);
      },
      {
        timeoutMs: 15000,
        maxRetries: 1, // Max 1 transient retry
        actionId,
        serviceName: "groq_eval",
      }
    );
  }

  async answerCandidateQuestion(params: CandidateQuestionParams): Promise<ClarificationResponse> {
    const groq = this.getGroqClient();
    const { currentQuestionText, candidateQuestion, context } = params;

    const systemPrompt = `You are a professional technical interviewer at ${context.companyProfile}.
The candidate has interrupted or asked a question while contemplating the interview question.
Mode: ${context.mode} interview.

SPECIFIC INTENT HANDLING:
1. REPEAT: If the candidate asks to repeat the question ("Can you repeat that?"), restate the original question verbatim and clearly.
2. REPHRASE: If the candidate asks to rephrase ("Can you explain it differently?"), restate the problem using simpler, alternate terms or an intuitive metaphor.
3. CLARIFY: If the candidate asks about scale, types, edge cases, nullability, or constraints, clarify them directly and realistically.
4. HINT: If the candidate asks for a hint:
   - In "practice" mode: Provide a gentle, directional hint pointing them toward the appropriate algorithmic technique or architectural pattern without revealing the solution.
   - In "strict" or "realistic" mode: Politely remind them: "In this mode, I cannot provide direct hints, but consider the expected time complexity and core data structure properties."
5. CONTRADICTIONS: Never accuse the candidate of dishonesty. If there is a discrepancy, treat it as an item requiring collaborative clarification.
6. DO NOT solve the problem or write code for the candidate.
7. Always ensure the original interview question remains active.

Respond ONLY with JSON:
{
  "message": string (your spoken interviewer reply to candidate),
  "clarified": true,
  "preservesOriginalQuestion": true
}`;

    const userPrompt = `Original Interview Question: "${currentQuestionText}"
Candidate asked: "${candidateQuestion}"`;

    const actionId = `clarify:${context.sessionId}:${Date.now()}`;

    return executeAIRequest(
      async (signal) => {
        const res = await groq.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          },
          { signal }
        );

        const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
        return ClarificationSchema.parse(parsed);
      },
      {
        timeoutMs: 12000,
        maxRetries: 1,
        actionId,
        serviceName: "groq_clarify",
      }
    );
  }

  async generateFollowUp(params: GenerateFollowUpParams): Promise<{ followUpQuestion: string }> {
    const groq = this.getGroqClient();
    const { currentQuestionText, candidateAnswer, evaluation, context } = params;

    const systemPrompt = `You are an interviewer at ${context.companyProfile}.
The candidate has answered the question. Generate ONE concise, realistic follow-up question that probes deeper into:
- An edge case or scaling bottleneck
- A trade-off mentioned in their answer
- A project architecture consequence

Respond ONLY with JSON:
{
  "followUpQuestion": string
}`;

    const userPrompt = `Question: "${currentQuestionText}"
Candidate Answer: "${candidateAnswer}"
Candidate Score: ${evaluation.score}
Generate a sharp, realistic follow-up question.`;

    const actionId = `followup:${context.sessionId}:${Date.now()}`;

    return executeAIRequest(
      async (signal) => {
        const res = await groq.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
          },
          { signal }
        );

        const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
        return FollowUpSchema.parse(parsed);
      },
      {
        timeoutMs: 12000,
        maxRetries: 1,
        actionId,
        serviceName: "groq_followup",
      }
    );
  }

  async generateFinalReport(params: GenerateReportParams) {
    const groq = this.getGroqClient();
    const { answers, context } = params;

    const systemPrompt = `You are the lead engineering hiring bar raiser at ${context.companyProfile}.
Synthesize the candidate's recorded interview session into a comprehensive, transparent final performance report.

Return JSON in this format:
{
  "technicalStrengths": string[],
  "areasForImprovement": string[],
  "communicationAssessment": string,
  "codingAssessmentSummary": string,
  "sevenDayPlan": [
    { "day": 1, "focus": string, "tasks": string[] },
    { "day": 2, "focus": string, "tasks": string[] },
    { "day": 3, "focus": string, "tasks": string[] },
    { "day": 4, "focus": string, "tasks": string[] },
    { "day": 5, "focus": string, "tasks": string[] },
    { "day": 6, "focus": string, "tasks": string[] },
    { "day": 7, "focus": string, "tasks": string[] }
  ],
  "readinessLevel": "Strong Hire" | "Hire" | "Needs Practice" | "Major Revisions Needed",
  "readinessSummary": string
}`;

    const userPrompt = `Role: ${context.targetRole}
Company Profile: ${context.companyProfile}
Recorded Answers Summary:
${JSON.stringify(answers.map(a => ({ round: a.roundNumber, q: a.questionText.slice(0, 80), score: a.evaluationScore, fb: a.feedback })), null, 2)}
Coding Submissions:
${JSON.stringify(params.codingSubmissions || [], null, 2)}`;

    const actionId = `report:${context.sessionId}`;

    return executeAIRequest(
      async (signal) => {
        const res = await groq.chat.completions.create(
          {
            model: this.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          },
          { signal }
        );

        return JSON.parse(res.choices[0]?.message?.content || "{}");
      },
      {
        timeoutMs: 25000,
        maxRetries: 1,
        actionId,
        serviceName: "groq_report",
      }
    );
  }

  async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: "GROQ_API_KEY is not configured.",
      };
    }

    try {
      const groq = this.getGroqClient();
      const res = await groq.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Reply with the single word: OK" }],
        max_tokens: 5,
      });

      const reply = res.choices[0]?.message?.content?.trim();
      return {
        success: true,
        message: `Successfully connected to Groq! (Model: ${this.model})`,
        model: this.model,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: `Groq connection failed: ${(err as Error)?.message || "Unknown error"}`,
      };
    }
  }
}
