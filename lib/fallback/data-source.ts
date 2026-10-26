import backendApi from "@/data/questions/backend_api.json";
import behavioral from "@/data/questions/behavioral.json";
import dbmsSql from "@/data/questions/dbms_sql.json";
import dsaConcepts from "@/data/questions/dsa_concepts.json";
import javaOop from "@/data/questions/java_oop.json";
import networks from "@/data/questions/networks.json";
import osQuestions from "@/data/questions/os.json";
import systemDesign from "@/data/questions/system_design.json";

import easyCoding from "@/data/coding/easy.json";
import mediumCoding from "@/data/coding/medium.json";
import hardCoding from "@/data/coding/hard.json";

export interface QuestionData {
  id: string;
  category: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  companyTags: string[];
  questionText: string;
  expectedAnswer: string;
  explanation: string;
  followUps: string[];
  rubricFocus?: string;
}

export interface CodingProblemData {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  topicTags: string[];
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCodeJava: string;
  starterCodePython: string;
  starterCodeCpp: string;
  referenceSolutionJava?: string;
  referenceSolutionPython?: string;
  referenceSolutionCpp?: string;
  timeComplexity: string;
  spaceComplexity: string;
  hints: string[];
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    explanation?: string;
  }[];
}

export const STATIC_QUESTIONS: QuestionData[] = [
  ...backendApi,
  ...behavioral,
  ...dbmsSql,
  ...dsaConcepts,
  ...javaOop,
  ...networks,
  ...osQuestions,
  ...systemDesign,
] as any[];

export const STATIC_CODING_PROBLEMS: CodingProblemData[] = [
  ...easyCoding,
  ...mediumCoding,
  ...hardCoding,
] as any[];
