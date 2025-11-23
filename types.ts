export enum Grade {
  Grade1 = 1,
  Grade2 = 2,
  Grade3 = 3,
  Grade4 = 4,
  Grade5 = 5
}

export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary'
}

export interface Avatar {
  id: string;
  name: string;
  imagePath: string; // path to avatar image or emoji
  isEmoji: boolean; // true if using emoji instead of image
  cost: number; // in stars
}

export interface Theme {
  id: string;
  name: string;
  thumbnailPath: string;
  cost: number; // in stars
  colors: {
    primary: string;
    secondary: string;
    background: string;
    buttonPrimary: string;
    buttonSecondary: string;
    accent: string;
  };
  soundPack?: string; // optional different sound set
}

export interface AlbumImage {
  id: string;
  collectionId: string;
  name: string;
  imagePath: string;
  rarity: Rarity;
}

export interface AlbumCollection {
  id: string;
  name: string;
  description: string;
  thumbnailPath: string;
  images: AlbumImage[];
}

export interface ShopDailyPhoto {
  imageId: string;
  rarity: Rarity;
  lastRefreshDate: string; // ISO date string (YYYY-MM-DD)
}

export interface GameResult {
  id: string;
  gameType: string; // 'memory', 'speed', etc.
  date: string; // ISO string
  score: number;
  maxScore: number;
  durationSeconds: number;
  starsEarned: number; // 1-3 based on medal
}

export interface StudentProfile {
  id: string;
  name: string;
  age: number;
  grade: Grade;
  avatarId: number; // deprecated, keep for migration
  currentAvatarId: string; // new avatar system
  currentThemeId: string;
  stars: number; // currency
  ownedAvatarIds: string[];
  ownedThemeIds: string[];
  ownedImageIds: string[];
  history: TestResult[];
  gameHistory: GameResult[];
  shopDailyPhotos: ShopDailyPhoto[];
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
  starsEarned: number; // new field
}

export interface TestConfig {
  topics: string[];
  durationMinutes: number;
  questionCount: number;
}