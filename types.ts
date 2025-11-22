
export enum Grade {
  Grade1 = 1,
  Grade2 = 2,
  Grade3 = 3,
  Grade4 = 4,
  Grade5 = 5
}

export interface StudentProfile {
  id: string;
  name: string;
  age: number;
  grade: Grade;
  avatarId: number;
  history: TestResult[];
}

export enum QuestionType {
  SingleChoice = 'single',
  MultipleSelect = 'multi',
  SelectWrong = 'wrong', // Select the wrong answer
  ManualInput = 'input',
  Typing = 'typing'
}

export interface Question {
  id: string;
  topicId: string;
  type: QuestionType;
  questionText: string;
  visualSvg?: string; // XML string for SVG rendering
  options?: string[]; // For multiple choice / select
  correctAnswer?: string; // For single choice / manual / select wrong
  correctAnswers?: string[]; // For multiple select
  userAnswer?: string | string[];
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  grade: Grade;
  description: string;
}

export interface TestResult {
  id: string;
  date: string; // ISO string
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  topicIds: string[];
  questions: Question[]; // Store full questions to review later
}

export interface TestConfig {
  topics: string[];
  durationMinutes: number;
  questionCount: number;
}