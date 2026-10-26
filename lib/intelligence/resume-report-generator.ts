import {
  ResumeAssessmentDossier,
  InterviewBlueprint,
  CandidateProfileStructured,
} from "../types";

export interface GenerateResumeReportInput {
  blueprint?: InterviewBlueprint | null;
  profile?: CandidateProfileStructured | null;
  answers: Array<{
    roundNumber: number;
    questionText: string;
    answerText: string;
    evaluationScore?: number | null;
    strengths?: string | null;
    weaknesses?: string | null;
    feedback?: string | null;
  }>;
  codeSubmissions?: Array<{
    status: string;
    passedTests: number;
    totalTests: number;
    language: string;
    errorMessage?: string | null;
  }>;
  communicationIssues?: Array<{
    submittedSentence: string;
    identifiedIssue: string;
    correctedSentence: string;
  }>;
}

/**
 * Compiles the 12-point Resume-Specific Dossier based on actual questions asked and candidate answers.
 * STRICT RULE: Clearly distinguish demonstrated strength, demonstrated weakness, and unassessed skills.
 */
export function compileResumeAssessmentDossier(
  input: GenerateResumeReportInput
): ResumeAssessmentDossier {
  const blueprint = input.blueprint;
  const profile = input.profile;
  const answers = input.answers;
  const submissions = input.codeSubmissions || [];
  const commIssues = input.communicationIssues || [];

  // 1. Which technologies were found in the resume?
  const technologiesFound = blueprint?.primaryStack && blueprint.primaryStack.length > 0
    ? [...blueprint.primaryStack, ...blueprint.secondarySkills]
    : profile?.skills
    ? [
        ...profile.skills.programmingLanguages,
        ...profile.skills.frontend,
        ...profile.skills.backend,
        ...profile.skills.databases,
        ...profile.skills.aiMl,
        ...profile.skills.devops,
      ]
    : ["Java", "OOP", "SQL", "DSA"];

  // 2. Which technologies were deeply assessed?
  const assessedTechSet = new Set<string>();
  for (const ans of answers) {
    const qLower = ans.questionText.toLowerCase();
    for (const tech of technologiesFound) {
      if (qLower.includes(tech.toLowerCase())) {
        assessedTechSet.add(tech);
      }
    }
  }
  const technologiesDeeplyAssessed = Array.from(assessedTechSet);

  // 3. Which skills were demonstrated convincingly?
  const strongSkillsSet = new Set<string>();
  for (const ans of answers) {
    if ((ans.evaluationScore ?? 0) >= 75) {
      for (const tech of technologiesDeeplyAssessed) {
        if (ans.questionText.toLowerCase().includes(tech.toLowerCase())) {
          strongSkillsSet.add(tech);
        }
      }
    }
  }
  const skillsDemonstratedConvincingly = Array.from(strongSkillsSet);

  // 4. Which skills were only listed but not demonstrated?
  const weakOrOmittedSet = new Set<string>();
  for (const ans of answers) {
    if ((ans.evaluationScore ?? 0) < 60) {
      for (const tech of technologiesDeeplyAssessed) {
        if (ans.questionText.toLowerCase().includes(tech.toLowerCase())) {
          weakOrOmittedSet.add(tech);
        }
      }
    }
  }
  const skillsListedNotDemonstrated = Array.from(weakOrOmittedSet);

  // 5. Which project claims were explained with technical depth?
  const projectClaimsExplainedWithDepth: string[] = [];
  for (const ans of answers) {
    if (ans.roundNumber === 2 && (ans.evaluationScore ?? 0) >= 70) {
      projectClaimsExplainedWithDepth.push(
        `Verified: "${ans.questionText.slice(0, 60)}..." (Candidate scored ${ans.evaluationScore}/100)`
      );
    }
  }

  // 6. Which topics require improvement?
  const topicsRequiringImprovement: string[] = [];
  for (const ans of answers) {
    if ((ans.evaluationScore ?? 0) < 65) {
      topicsRequiringImprovement.push(
        `"${ans.questionText.slice(0, 50)}..." (Score: ${ans.evaluationScore}/100) — ${ans.feedback || "Conceptual gap"}`
      );
    }
  }

  // 7. Which coding patterns caused difficulties?
  const codingPatternsCausingDifficulty: string[] = [];
  for (const sub of submissions) {
    if (sub.status !== "accepted") {
      codingPatternsCausingDifficulty.push(
        `Compiler returned ${sub.status} (${sub.passedTests}/${sub.totalTests} tests passed). Discrepancy in edge cases or memory boundaries.`
      );
    }
  }
  if (codingPatternsCausingDifficulty.length === 0 && submissions.length > 0) {
    codingPatternsCausingDifficulty.push("No fatal compiler failures recorded. Algorithmic efficiency passed benchmarks.");
  }

  // 8. Which technical answers were incomplete or incorrect?
  const technicalAnswersIncompleteOrIncorrect = answers
    .filter(a => (a.evaluationScore ?? 0) < 60)
    .map(a => `Question: "${a.questionText}" | Answer: "${a.answerText.slice(0, 70)}..." | Score: ${a.evaluationScore}/100`);

  // 9. What English communication errors appeared in the submitted transcripts?
  const englishCommunicationErrors = commIssues.map(
    ci => `Sentence: "${ci.submittedSentence}" -> Correction: "${ci.correctedSentence}" (${ci.identifiedIssue})`
  );

  // 10. What should the candidate study first? (Prioritized study plan)
  const prioritizedStudyPlan = skillsListedNotDemonstrated.map((skill, index) => ({
    priority: index + 1,
    skill,
    reason: `Candidate claimed ${skill} in resume, but scored < 60 during technical probing.`,
    studyTopics: [
      `${skill} internal architecture & lifecycle`,
      `${skill} production debugging & error scenarios`,
      `${skill} performance trade-offs vs alternatives`,
    ],
  }));

  // 11. Which resume topics remain unassessed?
  const unassessedSet = new Set(technologiesFound);
  for (const assessed of technologiesDeeplyAssessed) {
    unassessedSet.delete(assessed);
  }
  const resumeTopicsRemainingUnassessed = Array.from(unassessedSet);

  // 12. Which follow-up interview should be taken next?
  let recommendedFollowUpInterview = "Technical Fundamentals Rehearsal";
  if (skillsListedNotDemonstrated.length > 0) {
    recommendedFollowUpInterview = `Targeted Revision Interview focusing on ${skillsListedNotDemonstrated.slice(0, 2).join(" & ")}`;
  } else if (submissions.some(s => s.status !== "accepted")) {
    recommendedFollowUpInterview = "Coding Room Drill focusing on edge case handling and data structure constraints";
  } else {
    recommendedFollowUpInterview = "Pressure Interview to test speed and composure under strict timing constraints";
  }

  return {
    technologiesFound,
    technologiesDeeplyAssessed,
    skillsDemonstratedConvincingly,
    skillsListedNotDemonstrated,
    projectClaimsExplainedWithDepth,
    topicsRequiringImprovement,
    codingPatternsCausingDifficulty,
    technicalAnswersIncompleteOrIncorrect,
    englishCommunicationErrors,
    prioritizedStudyPlan,
    resumeTopicsRemainingUnassessed,
    recommendedFollowUpInterview,
  };
}
