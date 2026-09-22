// Shared by the browser, importer and build gate. No filesystem or browser dependencies.
export const LEVELS = [
  "K",
  "A1",
  "A2",
  "A3",
  "B1",
  "B2",
  "B3",
  "B4",
  "C1",
  "C2",
  "C3",
];
export const POS = [
  "pronoun",
  "noun",
  "verb",
  "adjective",
  "adverb",
  "article",
  "preposition",
  "conjunction",
  "determiner",
  "numeral",
  "punct",
  "interjection",
  "particle",
];
export const ROLES = [
  "subject",
  "verb",
  "object",
  "complement",
  "det",
  "modifier",
  "adverbial",
  "prep",
  "prep-object",
  "particle",
  "expletive",
  "conj",
  "punct",
];
export const VERB_FEATURES = [
  "base",
  "present-1sg",
  "present-3sg",
  "present-other",
  "past",
  "ing",
  "aux-present-3sg",
  "aux-present-other",
  "aux-past",
  "aux-future",
];
export const FEATURES = [
  ...VERB_FEATURES,
  ...VERB_FEATURES.map((f) => `${f}-neg`),
  "sg",
  "pl",
  "uncountable",
];
export const KINDS = [
  "sentences",
  "vocab",
  "theory",
  "passages",
  "rewrites",
  "phrases",
];
export const TOPICS = {
  K: "kindergarten",
  A1: "to-be-pronouns",
  A2: "nouns-articles",
  A3: "adjectives-possessives",
  B1: "present-simple",
  B2: "present-continuous",
  B3: "past-simple",
  B4: "future-review",
  C1: "wh-questions",
  C2: "prepositions-conjunctions",
  C3: "reading-rewrite",
};
const str = (v) => typeof v === "string" && v.trim().length > 0;
const string = (v, p, e) => {
  if (!str(v)) e.push(`${p}: expected nonempty string`);
};
const bool = (v, p, e) => {
  if (typeof v !== "boolean") e.push(`${p}: expected boolean`);
};
const integer = (v, p, e) => {
  if (!Number.isInteger(v) || v < 0)
    e.push(`${p}: expected nonnegative integer`);
};
const choice = (values) => (v, p, e) => {
  if (!values.includes(v)) e.push(`${p}: expected ${values.join("|")}`);
};
const optional = (validator) =>
  Object.assign(
    (v, p, e) => {
      if (v !== undefined) validator(v, p, e);
    },
    { optional: true },
  );
const array =
  (validator, min = 0) =>
  (v, p, e) => {
    if (!Array.isArray(v)) {
      e.push(`${p}: expected array`);
      return;
    }
    if (v.length < min) e.push(`${p}: at least ${min} items required`);
    v.forEach((item, i) => validator(item, `${p}[${i}]`, e));
  };
const object = (shape) => (v, p, e) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    e.push(`${p}: expected object`);
    return;
  }
  for (const key of Object.keys(v))
      if (!Object.hasOwn(shape, key)) e.push(`${p}.${key}: unknown field`);
  for (const [key, validator] of Object.entries(shape)) {
    if (!(key in v) && !validator.optional)
      e.push(`${p}.${key}: missing field`);
    else validator(v[key], `${p}.${key}`, e);
  }
};
const strings = array(string);
const base = { id: string, level: choice(LEVELS) };
const source = choice(["seed", "ai"]);
const token = object({
  text: string,
  pos: choice(POS),
  role: choice(ROLES),
  lemma: optional(string),
  feature: optional(choice(FEATURES)),
});
const span = object({
  clauseId: string,
  role: choice(["subject", "verb", "object", "complement", "adverbial"]),
  tokenIndices: array(integer, 1),
});
const blank = object({
  tokenIndex: integer,
  answer: string,
  alt: optional(strings),
  promptVi: string,
  hint: string,
});
const question = object({
  id: string,
  type: choice(["mcq", "tf", "short"]),
  q: string,
  options: optional(array(string, 2)),
  answer: string,
  alt: optional(strings),
  explain: string,
});
const schemas = {
  sentences: object({
    ...base,
    topic: string,
    grammarPoint: string,
    en: string,
    vi: string,
    tokens: array(token, 2),
    roleSpans: array(span),
    exerciseTypes: array(
      choice(["pos", "roles", "fill", "conjugate", "order", "listen"]),
      1,
    ),
    orderAlternatives: optional(strings),
    blanks: array(blank),
    audioId: optional(string),
    difficulty: choice([1, 2, 3]),
    tags: strings,
    source,
  }),
  vocab: object({
    ...base,
    topic: string,
    en: string,
    vi: string,
    pos: choice(POS),
    ipa: string,
    forms: optional(
      object({
        plural: optional(string),
        thirdSg: optional(string),
        past: optional(string),
        ing: optional(string),
        irregular: optional(bool),
      }),
    ),
    exampleEn: string,
    exampleVi: string,
    image: optional(string),
    audioId: optional(string),
    tags: strings,
    source,
  }),
  theory: object({
    ...base,
    title: string,
    summary: string,
    formulas: array(
      object({ label: string, pattern: string, example: string }),
      1,
    ),
    sections: array(
      object({
        heading: string,
        body: string,
        table: optional(
          object({
            columns: array(string, 1),
            rows: array(array(string, 1), 1),
          }),
        ),
        exampleIds: optional(strings),
        interactive: optional(
          choice([
            null,
            "pronoun-swap",
            "conjugation-wheel",
            "sentence-builder",
            "tense-compare",
          ]),
        ),
      }),
      1,
    ),
    commonMistakes: array(
      object({ wrong: string, right: string, why: string }),
    ),
    tips: strings,
  }),
  passages: object({
    ...base,
    title: string,
    en: string,
    vi: string,
    wordCount: integer,
    audioId: optional(string),
    questions: array(question, 1),
    glossary: optional(array(object({ en: string, vi: string }))),
    source,
  }),
  rewrites: object({
    ...base,
    type: choice([
      "affirm-neg",
      "neg-affirm",
      "statement-question",
      "contraction",
      "synonym",
      "word-order",
    ]),
    promptEn: string,
    promptVi: string,
    answer: string,
    alt: optional(strings),
    vi: string,
    hint: optional(string),
    source,
  }),
  phrases: object({
    ...base,
    en: string,
    vi: string,
    image: string,
    audioHint: string,
    audioId: optional(string),
    tags: strings,
    source,
  }),
};
const norm = (s) =>
  s
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const join = (tokens) =>
  tokens
    .map((t) => t.text)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1");
const bag = (s) =>
  (norm(s).match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) || [])
    .sort()
    .join("\u0000");
/** Validate one canonical file. Never throws on malformed imported JSON. */
export function validateContent(kind, data, options = {}) {
  const errors = [];
  if (!KINDS.includes(kind))
    return { valid: false, errors: [`Unsupported content type: ${kind}`] };
  const items = kind === "theory" ? [data] : data;
  if (!Array.isArray(items))
    return { valid: false, errors: [`${kind}: root must be an array`] };
  if (items.length === 0) errors.push(`${kind}: empty content`);
  const ids = new Set(),
    texts = new Set();
  items.forEach((item, index) => {
    const p = `${kind}[${index}]`;
    const before = errors.length;
    schemas[kind](item, p, errors);
    if (errors.length !== before) return; // Structural checks make dependent checks safe.
    const fail = (message) => errors.push(`${p} (${item.id}): ${message}`);
    if (ids.has(item.id)) fail("duplicate id");
    ids.add(item.id);
    if (options.level && item.level !== options.level)
      fail(`level must match file ${options.level}`);
    const prefix = {
      sentences: "s",
      vocab: "v",
      passages: "p",
      rewrites: "r",
      phrases: "ph",
    }[kind];
    if (
      kind === "theory"
        ? item.id !== item.level
        : options.allowAI && item.source === 'ai'
          ? !/^ai-[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item.id)
          : !new RegExp(`^${item.level}-${prefix}-\\d{4,}$`).test(item.id)
    )
      fail("invalid id prefix");
    if (["passages", "rewrites"].includes(kind) && item.level !== "C3")
      fail("requires C3");
    if (kind === "phrases" && item.level !== "K") fail("requires K");
    if (item.en) {
      const text = norm(item.en);
      if (texts.has(text)) fail("duplicate English text");
      texts.add(text);
    }
    if (
      ["sentences", "vocab"].includes(kind) &&
      item.topic !== TOPICS[item.level]
    )
      fail("topic does not match level catalog");
    if (kind === "sentences") {
      if (norm(join(item.tokens)) !== norm(item.en))
        fail("tokens do not reconstruct en");
      if (new Set(item.exerciseTypes).size !== item.exerciseTypes.length)
        fail("duplicate exerciseTypes");
      item.tokens.forEach((t, i) => {
        if (["verb", "noun"].includes(t.pos) && (!t.lemma || !t.feature))
          fail(`token ${i}: noun/verb needs lemma and feature`);
        if (
          t.pos === "noun" &&
          !["sg", "pl", "uncountable"].includes(t.feature)
        )
          fail(`token ${i}: invalid noun feature`);
        if (
          t.pos === "verb" &&
          ![...VERB_FEATURES, ...VERB_FEATURES.map((f) => `${f}-neg`)].includes(
            t.feature,
          )
        )
          fail(`token ${i}: invalid verb feature`);
      });
      const claimed = new Set();
      item.roleSpans.forEach((s) => {
        if (
          new Set(s.tokenIndices).size !== s.tokenIndices.length ||
          s.tokenIndices.some(
            (v, i, a) => v >= item.tokens.length || (i > 0 && v <= a[i - 1]),
          )
        )
          fail("role indices must be sorted, unique and in range");
        s.tokenIndices.forEach((i) => {
          if (claimed.has(i)) fail("overlapping role spans");
          claimed.add(i);
          if (item.tokens[i]?.pos === "punct")
            fail("role span includes punctuation");
        });
      });
      if (item.exerciseTypes.includes("roles") && !item.roleSpans.length)
        fail("roles needs roleSpans");
      if (
        item.exerciseTypes.some((t) => ["fill", "conjugate"].includes(t)) &&
        !item.blanks.length
      )
        fail("fill/conjugate needs blanks");
      const blankIndices = new Set();
      item.blanks.forEach((b) => {
        if (b.tokenIndex >= item.tokens.length)
          fail("blank index out of range");
        else if (norm(b.answer) !== norm(item.tokens[b.tokenIndex].text))
          fail("blank answer differs from token");
        if (blankIndices.has(b.tokenIndex)) fail("duplicate blank index");
        blankIndices.add(b.tokenIndex);
      });
      for (const alt of item.orderAlternatives || [])
        if (bag(alt) !== bag(item.en))
          fail("order alternative changes token multiset");
      if (item.level === "A1") {
        if (
          ![
            "be-affirmative",
            "be-negative",
            "be-question",
            "be-short-answer",
            "demonstratives",
          ].includes(item.grammarPoint)
        )
          fail("unknown A1 skill");
        if (item.topic !== "to-be-pronouns") fail("unknown A1 topic");
      }
    }
    if (kind === "vocab") {
      if (item.level === "K" && !item.image) fail("K vocabulary needs image");
      if (item.forms && item.pos !== "noun" && item.pos !== "verb")
        fail("forms require noun or verb");
      if (
        item.pos === "noun" &&
        item.forms &&
        ["thirdSg", "past", "ing"].some((k) => item.forms[k])
      )
        fail("noun cannot use verb forms");
      if (item.pos === "verb" && item.forms?.plural)
        fail("verb cannot use noun plural");
    }
    if (kind === "theory") {
      for (const s of item.sections) {
        if (s.table?.rows.some((row) => row.length !== s.table.columns.length))
          fail("table row width mismatch");
        for (const id of s.exampleIds || [])
          if (options.sentenceIds && !options.sentenceIds.includes(id))
            fail(`missing example ${id}`);
      }
    }
    if (kind === "passages") {
      const wordCount = item.en.trim().split(/\s+/).length;
      if (item.wordCount !== wordCount || wordCount < 60 || wordCount > 90)
        fail("wordCount must match 60–90 words");
      const questionIds = new Set();
      for (const q of item.questions) {
        if (questionIds.has(q.id)) fail("duplicate question id");
        questionIds.add(q.id);
        if (
          q.type === "mcq" &&
          (!q.options?.includes(q.answer) ||
            new Set(q.options).size !== q.options.length)
        )
          fail("MCQ needs unique options and matching answer");
        if (q.type === "tf" && !["true", "false"].includes(q.answer))
          fail("TF answer must be true/false");
        if (q.type !== "short" && q.alt)
          fail("only short questions support alt");
        if (q.type !== "mcq" && q.options) fail("only MCQ supports options");
      }
    }
  });
  return { valid: errors.length === 0, errors };
}

export function validateA1Bundle(bundle) {
  const errors = [];
  for (const kind of ["sentences", "vocab", "theory"])
    errors.push(
      ...validateContent(kind, bundle[kind], {
        level: "A1",
        sentenceIds: Array.isArray(bundle.sentences)
          ? bundle.sentences.map((s) => s?.id)
          : [],
      }).errors,
    );
  if ((bundle.sentences?.length || 0) < 200)
    errors.push("A1 requires at least 200 sentences");
  if ((bundle.vocab?.length || 0) < 100)
    errors.push("A1 requires at least 100 vocabulary entries");
  if (!errors.length)
    for (const skill of [
      "be-affirmative",
      "be-negative",
      "be-question",
      "be-short-answer",
      "demonstratives",
    ]) {
      const pool = bundle.sentences.filter(
        (s) =>
          s.grammarPoint === skill &&
          s.exerciseTypes.some((k) => ["fill", "order"].includes(k)),
      );
      if (pool.length < 4)
        errors.push(`${skill}: need at least four distinct exam sources`);
    }
  return { valid: !errors.length, errors };
}
