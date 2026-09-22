export type Level = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'B4' | 'C1' | 'C2' | 'C3' | 'K';

export type Pos =
  | 'pronoun'
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'article'
  | 'preposition'
  | 'conjunction'
  | 'determiner'
  | 'numeral'
  | 'punct'
  | 'interjection'
  | 'particle';

export type Role =
  | 'subject'
  | 'verb'
  | 'object'
  | 'complement'
  | 'det'
  | 'modifier'
  | 'adverbial'
  | 'prep'
  | 'prep-object'
  | 'particle'
  | 'expletive'
  | 'conj'
  | 'punct';

export type VerbFeature =
  | 'base'
  | 'present-1sg'
  | 'present-3sg'
  | 'present-other'
  | 'past'
  | 'ing'
  | 'aux-present-3sg'
  | 'aux-present-other'
  | 'aux-past'
  | 'aux-future';

export type Feature = VerbFeature | `${VerbFeature}-neg` | 'sg' | 'pl' | 'uncountable';

export type SentenceExercise = 'pos' | 'roles' | 'fill' | 'conjugate' | 'order' | 'listen';

export interface RoleSpan {
  clauseId: string; // c1, c2...
  role: 'subject' | 'verb' | 'object' | 'complement' | 'adverbial';
  tokenIndices: number[]; // 0-based, tăng dần, không trùng
}

export interface Token {
  text: string;
  pos: Pos;
  role: Role;
  lemma?: string; // dạng gốc — BẮT BUỘC cho verb & noun (be, go, teacher)
  feature?: Feature; // bắt buộc cho verb/noun
}

export interface Blank {
  tokenIndex: number;
  answer: string;
  alt?: string[];
  promptVi: string; // yêu cầu luôn hiện (vd: "Hoàn thành câu phủ định với to be.")
  hint: string; // chỉ hiện khi xin gợi ý
}

export interface Sentence {
  id: string; // "A1-s-0001"
  level: Level;
  topic: string;
  grammarPoint: string; // kỹ năng catalog (vd: be-affirmative, be-negative...)
  en: string;
  vi: string;
  tokens: Token[];
  roleSpans: RoleSpan[]; // bắt buộc có nếu exerciseTypes chứa 'roles'
  exerciseTypes: SentenceExercise[]; // whitelist dạng bài phù hợp
  orderAlternatives?: string[];
  blanks: Blank[];
  audioId?: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
  source: 'seed' | 'ai';
}

export interface VocabForms {
  plural?: string;
  thirdSg?: string;
  past?: string;
  ing?: string;
  irregular?: boolean;
}

export interface Vocab {
  id: string; // "A1-v-0001"
  level: Level;
  topic: string;
  en: string;
  vi: string;
  pos: Pos;
  ipa: string;
  forms?: VocabForms;
  exampleEn: string;
  exampleVi: string;
  image?: string; // emoji / asset key (BẮT BUỘC cho bậc K)
  audioId?: string;
  tags: string[];
  source: 'seed' | 'ai';
}

export interface TheoryFormula {
  label: string;
  pattern: string;
  example: string;
}

export interface TheorySection {
  heading: string;
  body: string;
  table?: { columns: string[]; rows: string[][] };
  exampleIds?: string[];
  interactive?: 'pronoun-swap' | 'conjugation-wheel' | 'sentence-builder' | 'tense-compare' | null;
}

export interface CommonMistake {
  wrong: string;
  right: string;
  why: string;
}

export interface TheoryPage {
  id: Level;
  title: string;
  level: Level;
  summary: string;
  formulas: TheoryFormula[];
  sections: TheorySection[];
  commonMistakes: CommonMistake[];
  tips: string[];
}

export interface PassageQuestion {
  id: string;
  type: 'mcq' | 'tf' | 'short';
  q: string;
  options?: string[]; // cho mcq
  answer: string;
  alt?: string[]; // chỉ short
  explain: string;
}

export interface PassageGlossaryItem {
  en: string;
  vi: string;
}

export interface Passage {
  id: string; // "C3-p-0001"
  level: 'C3';
  title: string;
  en: string; // đoạn 60–90 từ
  vi: string;
  wordCount: number;
  audioId?: string;
  questions: PassageQuestion[];
  glossary?: PassageGlossaryItem[];
  source: 'seed' | 'ai';
}

export interface Rewrite {
  id: string; // "C3-r-0001"
  level: 'C3';
  type: 'affirm-neg' | 'neg-affirm' | 'statement-question' | 'contraction' | 'synonym' | 'word-order';
  promptEn: string; // câu gốc
  promptVi: string; // yêu cầu luôn hiện
  answer: string; // đáp án chuẩn
  alt?: string[]; // đáp án chấp nhận thêm
  vi: string;
  hint?: string;
  source: 'seed' | 'ai';
}

export interface Phrase {
  id: string; // "K-ph-0001"
  level: 'K';
  en: string;
  vi: string;
  image: string;
  audioHint: string;
  audioId?: string;
  tags: string[];
  source: 'seed' | 'ai';
}
