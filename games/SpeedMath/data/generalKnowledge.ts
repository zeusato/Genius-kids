import { EASY_QUESTIONS } from './questionsEasy';
import { MEDIUM_QUESTIONS } from './questionsMedium';
import { HARD_QUESTIONS } from './questionsHard';

export interface GeneralKnowledgeQuestion {
    id: string;
    level: 'easy' | 'medium' | 'hard';
    question: string;
    options: string[];
    answer: string;
    category: string;
}

export const GENERAL_KNOWLEDGE_DATA: GeneralKnowledgeQuestion[] = [
    ...EASY_QUESTIONS,
    ...MEDIUM_QUESTIONS,
    ...HARD_QUESTIONS
];
