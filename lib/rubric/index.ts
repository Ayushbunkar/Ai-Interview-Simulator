import { RubricScoreItem } from "../types";

export interface RubricDefinition {
  name: string;
  weight: number; // Percentage, e.g. 35
  description: string;
}

export const TECHNICAL_ROUND_RUBRIC: RubricDefinition[] = [
  { name: "Correctness", weight: 35, description: "Accuracy of core concept, syntax, mechanics, and terminology." },
  { name: "Reasoning", weight: 25, description: "Logical clarity, step-by-step rationale, and foundational justification." },
  { name: "Depth & Trade-offs", weight: 20, description: "Understanding pros/cons, alternatives, and production implications." },
  { name: "Complexity & Edge Cases", weight: 10, description: "Awareness of time/space overhead, limits, nulls, and boundary conditions." },
  { name: "Communication", weight: 10, description: "Structured phrasing, clarity, conciseness, and professional articulation." },
];

export const CODING_ROUND_RUBRIC: RubricDefinition[] = [
  { name: "Functional Correctness", weight: 50, description: "Passing unit tests, edge cases, and expected outputs without bugs." },
  { name: "Algorithm Choice", weight: 20, description: "Selecting appropriate data structures and algorithmic paradigm (e.g. hash map vs binary search)." },
  { name: "Complexity Analysis", weight: 15, description: "Optimal Big-O time and space complexity with clear justification." },
  { name: "Edge Cases & Safety", weight: 10, description: "Handling empty inputs, single element, large numbers, duplicates, and constraints." },
  { name: "Readability & Clean Code", weight: 5, description: "Descriptive naming, modular structure, clean comments, and idiomatic style." },
];

export const BEHAVIORAL_ROUND_RUBRIC: RubricDefinition[] = [
  { name: "Relevance", weight: 20, description: "Directly addressing the question and interviewer prompt." },
  { name: "Specificity (STAR)", weight: 20, description: "Concrete Situation, Task, Action, and Result rather than vague generalities." },
  { name: "Ownership & Initiative", weight: 20, description: "Clear role definition ('I decided', 'I built') rather than passive detachment." },
  { name: "Decision-making", weight: 15, description: "Demonstrating sound engineering or professional judgment under constraints." },
  { name: "Evidence of Impact", weight: 15, description: "Measurable or observable outcome, metrics, lessons learned, and reflection." },
  { name: "Communication", weight: 10, description: "Composed, structured, empathetic, and professional presentation." },
];

export function calculateWeightedScore(scores: RubricScoreItem[]): number {
  if (!scores || scores.length === 0) return 0;
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  const weightedSum = scores.reduce((sum, item) => sum + (item.score * item.weight), 0);
  return Math.round(weightedSum / totalWeight);
}
