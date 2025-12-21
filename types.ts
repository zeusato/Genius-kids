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
  difficulty?: string; // 'easy', 'medium', 'hard'
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

// ===== Sphinx Riddle System =====

export enum RiddleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum RiddleCategory {
  VN_RIDDLE = 'vn_riddle',
  EN_RIDDLE = 'en_riddle',
  MIX = 'mix',
}

export interface RiddleData {
  rID: string;
  category: 'vn_riddle' | 'en_riddle';
  difficulty: RiddleDifficulty;
  question: string;
  answer: string;
  answer_explain: string;
  note?: string;
}

export interface SphinxProfile {
  answeredRiddleIds: string[]; // Array of rID that user has answered correctly
  penaltyActive: boolean; // If true, next reward will be skipped
}

export interface SphinxReward {
  stars: number;
  cardWon: boolean;
  card?: {
    id: string;
    name: string;
    imagePath: string;
    rarity: Rarity;
  };
}

export enum PenaltyType {
  LOSE_STAR = 'lose_star',
  SKIP_NEXT_REWARD = 'skip_next_reward',
}

// ===== Achievement System =====

export interface UserStats {
  // General
  totalTests: number;
  totalQuestions: number;
  totalStarsEarned: number;
  totalTimeSeconds: number;

  // Streaks & Performance
  currentCorrectStreak: number;
  maxCorrectStreak: number;
  perfectTests: number; // 100% score

  // Topic Mastery (Map<topicId, count>)
  topicCorrectCount: Record<string, number>;

  // Games
  totalGamesPlayed: number;
  gameWins: Record<string, number>; // key: "gameType_difficulty" (e.g., "memory_easy")
  gameHighScores: Record<string, number>; // New field

  // Collection & Shop
  totalCards: number;
  legendaryCards: number;
  starsSpent: number;
  avatarsOwned: number;
  themesOwned: number;

  // Sphinx Riddle
  riddlesSolved: number;
  riddlesSolvedByCategory: Record<string, number>; // vn_riddle, en_riddle
  riddlesSolvedByDifficulty: Record<string, number>; // easy, medium, hard

  // Tell Me Why
  factsRead: number;
  factsReadByCategory: Record<string, number>;

  // Typing
  maxTypingScore: number;
}

export interface AchievementProgress {
  id: string;
  unlockedTiers: ('bronze' | 'silver' | 'gold')[];
  currentValue: number; // Snapshot for UI display
  unlockedAt: string; // ISO date
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
  sphinxProfile?: SphinxProfile; // Sphinx Riddle profile data
  stats?: UserStats; // Optional for migration
  achievements?: AchievementProgress[]; // Optional for migration
  // Book World data
  readingProgress?: ReadingProgress[];
  favoriteBookIds?: string[];
  libraryFilter?: LibraryFilter;
}

// ===== Book World System =====

export enum BookCategory {
  STORY = 'story',           // Sách truyện
  REFERENCE = 'reference',   // Sách tham khảo
  SCIENCE = 'science',       // Sách khoa học
}

export enum AgeGroup {
  PRESCHOOL_GRADE1 = 'preschool_grade1',  // Mầm non - Lớp 1
  GRADE_2 = 'grade_2',
  GRADE_3 = 'grade_3',
  GRADE_4 = 'grade_4',
  GRADE_5 = 'grade_5',
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  description: string;
  category: BookCategory;
  ageGroups: AgeGroup[];     // Có thể phù hợp nhiều độ tuổi
  totalPages: number;
}

export interface ReadingProgress {
  bookId: string;
  currentPage: number;
  lastReadAt: string;        // ISO date
  isCompleted: boolean;
}

export interface LibraryFilter {
  categories: BookCategory[];
  ageGroups: AgeGroup[];
  favoritesOnly: boolean;
}