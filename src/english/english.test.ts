import { beforeEach, describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { Sentence } from "../data/english/schema";
import type { StudentProfile } from "../../types";
import {
  createSession,
  correctAnswer,
  grade,
  checkResponse,
  normalizeAnswer,
  scoreSession,
  submitSession,
} from "./engine";
import {
  SKILLS,
  type SentenceExercise as Exercise,
  sourceId,
  type EnglishSession,
  emptyProgress,
} from "./model";
import { applyCompletion } from "./progress";
import {
  clearEnglishData,
  getSession,
  listSessions,
  saveSession,
  SessionConflict,
} from "./storage";
import { completeEnglish } from "./completion";
import { KINDS, validateContent, validateA1Bundle } from "./validation.mjs";
vi.mock("../../services/achievementService", () => ({
  initializeStats: () => ({
    totalStarsEarned: 0,
    totalQuestions: 0,
    totalTimeSeconds: 0,
    totalTests: 0,
    perfectTests: 0,
  }),
}));
vi.mock("../../services/albumService", () => ({
  shouldReceiveImage: vi.fn(() => true),
  gachaImage: vi.fn(() => ({
    image: {
      id: "fox-card",
      collectionId: "test",
      name: "Fox",
      imagePath: "fox.webp",
      rarity: "common",
    },
  })),
}));

const sentence: Sentence = {
  id: "A1-s-0001",
  level: "A1",
  topic: "to-be-pronouns",
  grammarPoint: "be-affirmative",
  en: "My little cat is happy.",
  vi: "Mèo con của tôi vui vẻ.",
  tokens: [
    { text: "My", pos: "determiner", role: "det" },
    { text: "little", pos: "adjective", role: "modifier" },
    { text: "cat", pos: "noun", role: "subject", lemma: "cat", feature: "sg" },
    {
      text: "is",
      pos: "verb",
      role: "verb",
      lemma: "be",
      feature: "present-3sg",
    },
    { text: "happy", pos: "adjective", role: "complement" },
    { text: ".", pos: "punct", role: "punct" },
  ],
  roleSpans: [
    { clauseId: "c1", role: "subject", tokenIndices: [0, 1, 2] },
    { clauseId: "c1", role: "verb", tokenIndices: [3] },
    { clauseId: "c1", role: "complement", tokenIndices: [4] },
  ],
  exerciseTypes: ["fill", "order", "pos", "roles"],
  blanks: [
    {
      tokenIndex: 3,
      answer: "is",
      alt: ["isn't"],
      promptVi: "Điền từ.",
      hint: "Số ít.",
    },
  ],
  difficulty: 1,
  tags: [],
  source: "seed",
};
const fixture = (kind: Exercise["kind"] = "fill", s = sentence): Exercise => ({
  id: "e1",
  kind,
  skill: "be-affirmative",
  sentence: structuredClone(s),
  target: kind === "pos" ? 2 : 0,
  shuffledIndices: [5, 3, 1, 4, 0, 2],
});
const pool = SKILLS.flatMap((skill, i) =>
  Array.from({ length: 12 }, (_, j) => ({
    ...structuredClone(sentence),
    id: `A1-s-${String(i * 12 + j + 1).padStart(4, "0")}`,
    grammarPoint: skill,
    en: sentence.en,
  })),
);
const profile = (id = "english-test-owner"): StudentProfile =>
  ({
    id,
    name: "Test",
    stars: 0,
    ownedImageIds: [],
    history: [],
    gameHistory: [],
    grade: 2,
    currentAvatarId: "avatar_01",
    stats: {
      totalStarsEarned: 0,
      totalQuestions: 0,
      totalTimeSeconds: 0,
      totalTests: 0,
      perfectTests: 0,
    },
  }) as unknown as StudentProfile;
function completed(
  owner = "english-test-owner",
  mode: "practice" | "test" = "test",
  correct = 10,
  count = 10,
  previous: string[] = [],
): EnglishSession {
  let s = createSession(
    pool,
    owner,
    "1-fixture",
    mode,
    count,
    "mixed",
    previous,
  );
  s.exercises.forEach((e, i) => {
    s.responses[e.id] = checkResponse(e, {
      answer: i < correct ? correctAnswer(e) : "",
      hints: 0,
      attempts: 0,
    });
  });
  return submitSession(s);
}
describe("English grading and first attempt", () => {
  it("normalizes Unicode apostrophe, whitespace, case and one terminal punctuation only", () => {
    expect(normalizeAnswer("  Isn’t   HERE? ")).toBe("isn't here");
    expect(normalizeAnswer("fine!!")).toBe("fine!");
    expect(grade(fixture(), " ISN’T  ")).toBe(true);
    expect(grade(fixture(), "are")).toBe(false);
    const e = fixture();
    e.sentence.blanks[0].answer = "is not";
    e.sentence.blanks[0].alt = [];
    expect(grade(e, "is")).toBe(false);
    expect(grade(e, "isn't")).toBe(false);
    expect(grade(e, "IS NOT.")).toBe(true);
    e.sentence.blanks[0].answer = "an apple";
    expect(grade(e, "a apple")).toBe(false);
  });
  it("accepts only complete role groups, unordered, without duplicate indices", () => {
    const e = fixture("roles");
    expect(grade(e, [2, 0, 1])).toBe(true);
    expect(grade(e, [2])).toBe(false);
    expect(grade(e, [0, 0, 2])).toBe(false);
  });
  it("checks POS by enum", () => {
    expect(grade(fixture("pos"), "noun")).toBe(true);
    expect(grade(fixture("pos"), "Danh từ")).toBe(false);
  });
  it("requires all order tiles once, supports approved order alternatives", () => {
    const e = fixture("order");
    expect(grade(e, [0, 1, 2, 3, 4, 5])).toBe(true);
    expect(grade(e, [0, 1, 2, 3, 4, 4])).toBe(false);
    e.sentence.orderAlternatives = ["Happy is my little cat."];
    expect(grade(e, [4, 3, 0, 1, 2, 5])).toBe(true);
    e.sentence.orderAlternatives = [];
    expect(grade(e, [4, 3, 0, 1, 2, 5])).toBe(false);
    e.sentence.tokens[4].text = "cat";
    e.sentence.en = "My little cat is cat.";
    expect(grade(e, [0, 1, 4, 3, 2, 5])).toBe(true);
  });
  it("does not replace first attempt when retrying or using hints", () => {
    const e = fixture();
    const first = checkResponse(e, { answer: "are", attempts: 0, hints: 0 });
    const retry = checkResponse(e, { ...first, answer: "is" });
    expect(retry.correct).toBe(true);
    expect(retry.firstCorrect).toBe(false);
    expect(retry.firstAnswer).toBe("are");
    expect(
      checkResponse(e, { answer: "is", attempts: 0, hints: 1 }).firstCorrect,
    ).toBe(false);
  });
});
describe("Session composition", () => {
  it("balances five skills without duplicates and gives fresh sources in the next exam", () => {
    const first = createSession(pool, "owner", "v1", "test", 10);
    expect(new Set(first.exercises.map(sourceId)).size).toBe(10);
    for (const skill of SKILLS)
      expect(first.exercises.filter((e) => e.skill === skill)).toHaveLength(2);
    expect(
      first.exercises.every((e) => ["fill", "order"].includes(e.kind)),
    ).toBe(true);
    const previous = first.exercises.map(sourceId);
    const next = createSession(
      pool,
      "owner",
      "v1",
      "test",
      10,
      "mixed",
      previous,
    );
    expect(next.exercises.every((e) => !previous.includes(sourceId(e)))).toBe(
      true,
    );
  });
  it("honors exercise whitelist and does not fabricate a missing skill", () => {
    expect(
      createSession(
        pool.map((s) => ({ ...s, exerciseTypes: ["order"] })),
        "a",
        "v1",
        "test",
        10,
      ).exercises.every((e) => e.kind === "order"),
    ).toBe(true);
    expect(() =>
      createSession(
        pool.filter((s) => s.grammarPoint !== SKILLS[0]),
        "a",
        "v1",
        "test",
        10,
      ),
    ).toThrow();
  });
  it("snapshots data and counts unanswered questions as wrong", () => {
    const s = createSession(pool, "a", "v1", "test", 10);
    s.exercises[0].sentence.en = "Modified snapshot";
    expect(pool.some((p) => p.en === "Modified snapshot")).toBe(false);
    expect(scoreSession(submitSession(s))).toBe(0);
    const submitted = submitSession(s);
    expect(submitSession(submitted)).toBe(submitted);
  });
});
describe("Validator", () => {
  it.each(KINDS)("handles malformed %s input without crashing", (kind) => {
    for (const value of [
      null,
      [],
      [null],
      {},
      "x",
      [{ id: "x", unexpected: true }],
    ])
      expect(validateContent(kind, value).valid).toBe(false);
  });
  it("validates all published A1 assets with quotas", () => {
    const bundle = Object.fromEntries(
      ["sentences", "vocab", "theory"].map((k) => [
        k,
        JSON.parse(
          fs.readFileSync(
            path.resolve("src/data/english", `A1.${k}.json`),
            "utf8",
          ),
        ),
      ]),
    );
    expect(validateA1Bundle(bundle).errors).toEqual([]);
    for (const kind of ['fill', 'order', 'pos', 'roles'] as const) {
      const practice = createSession(bundle.sentences, 'owner', 'v1', 'practice', 15, kind);
      expect(practice.exercises).toHaveLength(15);
      expect(practice.exercises.every(e => e.kind === kind && e.sentence.exerciseTypes.includes(kind))).toBe(true);
    }
  });
  it("rejects enum, field, index, overlaps, missing metadata and changed order multiset", () => {
    expect(
      validateContent("sentences", [sentence], { level: "A1" }).valid,
    ).toBe(true);
    const cases = [
      (s: any) => (s.extra = 1),
      (s: any) => (s.tokens[0].pos = "wrong"),
      (s: any) => delete s.tokens[2].lemma,
      (s: any) => (s.blanks[0].tokenIndex = 0.5),
      (s: any) => (s.blanks[0].tokenIndex = 99),
      (s: any) => (s.roleSpans[0].tokenIndices = [2, 1]),
      (s: any) => (s.roleSpans[1].tokenIndices = [2, 3]),
      (s: any) => (s.orderAlternatives = ["My little cat is not happy."]),
      (s: any) => (s.en = "Wrong sentence."),
    ];
    for (const mutate of cases) {
      const s = structuredClone(sentence);
      mutate(s);
      expect(validateContent("sentences", [s]).valid).toBe(false);
    }
    expect(validateContent("sentences", [sentence, sentence]).valid).toBe(
      false,
    );
    expect(
      validateContent("sentences", [sentence], { level: "A2" }).valid,
    ).toBe(false);
  });
  it("checks theory refs, null sections, vocab forms, K images, passages and rewrites", () => {
    const theory = {
      id: "A1",
      level: "A1",
      title: "t",
      summary: "s",
      formulas: [{ label: "a", pattern: "b", example: "c" }],
      sections: [{ heading: "a", body: "b", exampleIds: ["missing"] }],
      commonMistakes: [],
      tips: [],
    };
    expect(
      validateContent("theory", theory, { sentenceIds: [] }).errors.join(),
    ).toContain("missing example");
    expect(
      validateContent("theory", { ...theory, sections: [null] }).valid,
    ).toBe(false);
    const vocab = {
      id: "K-v-0001",
      level: "K",
      topic: "kindergarten",
      en: "cat",
      vi: "mèo",
      pos: "noun",
      ipa: "/kæt/",
      exampleEn: "a cat",
      exampleVi: "một con mèo",
      tags: [],
      source: "seed",
    };
    expect(validateContent("vocab", [vocab]).valid).toBe(false);
    expect(validateContent("vocab", [{ ...vocab, image: "🐱" }]).valid).toBe(
      true,
    );
    expect(
      validateContent("vocab", [
        { ...vocab, image: "🐱", forms: { past: "x" } },
      ]).valid,
    ).toBe(false);
    const passage = {
      id: "C3-p-0001",
      level: "C3",
      title: "a",
      en: Array(60).fill("word").join(" "),
      vi: "b",
      wordCount: 60,
      questions: [
        {
          id: "q1",
          type: "mcq",
          q: "a",
          options: ["a", "b"],
          answer: "a",
          explain: "b",
        },
      ],
      source: "seed",
    };
    expect(validateContent("passages", [passage]).valid).toBe(true);
    expect(
      validateContent("passages", [{ ...passage, wordCount: 61 }]).valid,
    ).toBe(false);
    expect(
      validateContent("passages", [
        { ...passage, questions: [{ ...passage.questions[0], answer: "c" }] },
      ]).valid,
    ).toBe(false);
    expect(
      validateContent("rewrites", [
        {
          id: "C3-r-0001",
          level: "C3",
          type: "affirm-neg",
          promptEn: "I am happy.",
          promptVi: "Đổi câu.",
          answer: "I am not happy.",
          vi: "Tôi không vui.",
          source: "seed",
        },
      ]).valid,
    ).toBe(true);
    expect(
      validateContent("phrases", [
        {
          id: "K-ph-0001",
          level: "K",
          en: "Hello",
          vi: "Xin chào",
          image: "👋",
          audioHint: "hello",
          tags: [],
          source: "seed",
        },
      ]).valid,
    ).toBe(true);
  });
  it("merges batches and refuses duplicate IDs or overwriting output", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "english-import-test-"));
    try {
      const a = path.join(dir, "a.json"),
        b = path.join(dir, "b.json"),
        out = path.join(dir, "merged.json");
      fs.writeFileSync(a, JSON.stringify([sentence]));
      fs.writeFileSync(
        b,
        JSON.stringify([
          {
            ...sentence,
            id: "A1-s-0002",
            en: "My little cat is sad.",
            tokens: sentence.tokens.map((t, i) =>
              i === 4 ? { ...t, text: "sad" } : t,
            ),
          },
        ]),
      );
      execFileSync(
        process.execPath,
        ["scripts/english-content.mjs", "merge", "sentences", "A1", out, a, b],
        { stdio: "pipe" },
      );
      expect(JSON.parse(fs.readFileSync(out, "utf8"))).toHaveLength(2);
      expect(() =>
        execFileSync(
          process.execPath,
          [
            "scripts/english-content.mjs",
            "merge",
            "sentences",
            "A1",
            out,
            a,
            b,
          ],
          { stdio: "pipe" },
        ),
      ).toThrow();
      expect(() =>
        execFileSync(
          process.execPath,
          [
            "scripts/english-content.mjs",
            "merge",
            "sentences",
            "A1",
            path.join(dir, "duplicate.json"),
            a,
            a,
          ],
          { stdio: "pipe" },
        ),
      ).toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
describe("Progress, mastery and rewards", () => {
  it("awards once, caps paid tests at two per local day, leaves math stats unchanged", () => {
    let p = profile();
    const s = completed();
    const first = applyCompletion(p, s);
    expect(first.result.stars).toBe(5);
    p = first.profile;
    expect(applyCompletion(p, s).profile).toBe(p);
    expect(p.stats?.totalTests).toBe(0);
    p = applyCompletion(p, completed()).profile;
    const third = applyCompletion(p, completed());
    expect(third.result.stars).toBe(0);
    expect(third.result.rewardLimited).toBe(true);
  });
  it("caps practice at three, ignores hints and does not earn mastery", () => {
    let p = profile();
    for (let i = 0; i < 3; i++)
      p = applyCompletion(p, completed(p.id, "practice", 5, 5)).profile;
    expect(p.stars).toBe(3);
    expect(
      applyCompletion(p, completed(p.id, "practice", 5, 5)).result.stars,
    ).toBe(0);
    expect(p.englishProgress?.masteryByLevel.A1?.mastered).toBe(false);
    const s = completed(p.id, "practice", 5, 5);
    Object.values(s.responses).forEach((r) => (r.hints = 1));
    expect(applyCompletion(profile(), s).result.score).toBe(0);
  });
  it("requires two passing balanced exams with at least 50% new sources", () => {
    const s1 = completed();
    let p = applyCompletion(profile(), s1).profile;
    expect(p.englishProgress?.masteryByLevel.A1?.mastered).toBe(false);
    const same = { ...s1, id: crypto.randomUUID() };
    p = applyCompletion(p, same).profile;
    expect(p.englishProgress?.masteryByLevel.A1?.mastered).toBe(false);
    p = applyCompletion(
      p,
      completed(
        p.id,
        "test",
        8,
        10,
        s1.exercises.map(sourceId),
      ),
    ).profile;
    expect(p.englishProgress?.masteryByLevel.A1?.mastered).toBe(true);
  });
  it("rejects wrong owner, old drafts and preserves last two exam evidence beyond recent list", () => {
    const s = completed();
    expect(() => applyCompletion(profile("another"), s)).toThrow();
    s.startedAt = "2020-01-01T00:00:00.000Z";
    expect(() => applyCompletion(profile(), s)).toThrow(/30/);
    const p = profile();
    p.englishProgress = emptyProgress();
    p.englishProgress.minimumAcceptedStartedAt = "2099-01-01T00:00:00.000Z";
    expect(() => applyCompletion(p, completed())).toThrow();
  });
});
describe("IndexedDB persistence and atomic completion", () => {
  beforeEach(async () => {
    await clearEnglishData("english-test-owner");
    vi.clearAllMocks();
    let chain = Promise.resolve();
    vi.stubGlobal("navigator", {
      locks: {
        request: (_name: string, fn: () => Promise<any>) => {
          const next = chain.then(fn);
          chain = next.catch(() => {});
          return next;
        },
      },
    });
  });
  it("restores identical snapshots after source changes; owner-scoped, CAS rejects stale tabs", async () => {
    const s = createSession(pool, "english-test-owner", "v1", "test", 10);
    const saved = await saveSession(s, null);
    expect(await getSession("wrong", s.id)).toBeUndefined();
    expect(await getSession(s.studentId, s.id)).toEqual(saved);
    await saveSession({ ...saved, cursor: 2 }, saved.revision);
    await expect(
      saveSession({ ...saved, cursor: 3 }, saved.revision),
    ).rejects.toBeInstanceOf(SessionConflict);
    expect((await getSession(s.studentId, s.id))?.cursor).toBe(2);
    await clearEnglishData(s.studentId);
    expect(await listSessions(s.studentId)).toHaveLength(0);
  });
  it("double submit awards one card and stars, preserving other profiles", async () => {
    const s = completed();
    await saveSession(s, null);
    let profiles = [profile(), profile("other")];
    const write = vi.fn((next: StudentProfile[]) => (profiles = next));
    const deps = {
      readProfiles: () => profiles,
      writeProfiles: write,
      onSaved: vi.fn(),
      isOwner: () => true,
    };
    const results = await Promise.all([
      completeEnglish(s.studentId, s.id, deps),
      completeEnglish(s.studentId, s.id, deps),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(profiles[0].stars).toBe(5);
    expect(profiles[0].ownedImageIds).toEqual(["fox-card"]);
    expect(profiles[1].stars).toBe(0);
  });
  it("storage failure leaves profile untouched and retries same draw", async () => {
    const s = completed();
    await saveSession(s, null);
    let profiles = [profile()];
    const onSaved = vi.fn();
    let fails = true;
    const deps = {
      readProfiles: () => profiles,
      writeProfiles: (next: StudentProfile[]) => {
        if (fails) throw new Error("Quota exceeded");
        profiles = next;
      },
      onSaved,
      isOwner: () => true,
    };
    expect((await completeEnglish(s.studentId, s.id, deps)).ok).toBe(false);
    expect(profiles[0].stars).toBe(0);
    expect(onSaved).not.toHaveBeenCalled();
    expect((await getSession(s.studentId, s.id))?.rewardDraw?.id).toBe(
      "fox-card",
    );
    fails = false;
    expect((await completeEnglish(s.studentId, s.id, deps)).ok).toBe(true);
    expect(profiles[0].stars).toBe(5);
    const album = await import("../../services/albumService");
    expect(album.gachaImage).toHaveBeenCalledTimes(1);
  });
  it("profile switch while asynchronous draft work is pending prevents rewards", async () => {
    const s = completed();
    await saveSession(s, null);
    const write = vi.fn();
    let checks = 0;
    const result = await completeEnglish(s.studentId, s.id, {
      readProfiles: () => [profile()],
      writeProfiles: write,
      onSaved: vi.fn(),
      isOwner: () => ++checks === 1,
    });
    expect(result.ok).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
  it("refuses unsafe multi-tab completion if Web Locks is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    const write = vi.fn();
    expect(
      (
        await completeEnglish("a", "b", {
          readProfiles: () => [],
          writeProfiles: write,
          onSaved: vi.fn(),
          isOwner: () => true,
        })
      ).ok,
    ).toBe(false);
    expect(write).not.toHaveBeenCalled();
  });
});
