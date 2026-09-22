import type { StudentProfile } from "../../types";
import { calculateTestStars } from "../../services/rewardService";
import { initializeStats } from "../../services/achievementService";
import {
  SKILLS,
  emptyProgress,
  type EnglishSession,
  type EnglishProgress,
  type SessionSummary,
} from "./model";
import { requiredSkills } from "./catalog";
import { sourceId, exerciseLevel, isSentenceExercise } from "./model";
import { grade } from "./engine";
const DAY = 86400000;
export function localDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export function applyCompletion(
  profile: StudentProfile,
  session: EnglishSession,
  now = new Date(),
): { profile: StudentProfile; result: SessionSummary } {
  if (
    session.studentId !== profile.id ||
    session.status === "draft" ||
    !session.completedAt
  )
    throw new Error("Phiên học chưa nộp hoặc không thuộc hồ sơ này.");
  const progress: EnglishProgress = profile.englishProgress || emptyProgress();
  if (progress.ledger[session.id])
    return { profile, result: progress.ledger[session.id] };
  const cutoff = new Date(now.getTime() - 30 * DAY).toISOString();
  const minimum =
    progress.minimumAcceptedStartedAt > cutoff
      ? progress.minimumAcceptedStartedAt
      : cutoff;
  if (session.startedAt < minimum)
    throw new Error("Bài dở đã quá 30 ngày. Hãy bắt đầu bài mới.");
  const correct = session.exercises.map((e) => {
    const r = session.responses[e.id];
    return (
      !!r &&
      r.firstAnswer !== undefined &&
      r.hints === 0 &&
      grade(e, r.firstAnswer)
    );
  });
  const score = correct.filter(Boolean).length,
    total = session.exercises.length;
  const date = session.completedAt;
  const paidToday = Object.values(progress.ledger).filter(
    (r) =>
      localDay(r.date) === localDay(date) &&
      r.mode === session.mode &&
      !r.rewardLimited,
  );
  const eligible = session.mode !== "placement" && session.mode !== "review" && (
    session.mode === "test" ? total >= 10 : total >= 5 && score / total >= 0.6);
  const rewardLimited =
    !eligible || paidToday.length >= (session.mode === "test" ? 2 : 3);
  const stars = rewardLimited
    ? 0
    : session.mode === "test"
      ? calculateTestStars(score, total)
      : 1;
  const image =
    !rewardLimited && session.mode === "test"
      ? session.rewardDraw || null
      : null;
  const result: SessionSummary = {
    id: session.id,
    level: session.level,
    mode: session.mode,
    date,
    score,
    total,
    seconds: Math.round(session.elapsedSeconds),
    stars,
    image,
    rewardLimited,
  };
  const skills = { ...progress.skills };
  let reviewItems = [...progress.reviewItems];
  // Migrate old A1 keys once, without touching other subjects' progress.
  for (const key of Object.keys(skills)) if (!key.includes(':')) {
    skills['A1:'+key] ??= skills[key]; delete skills[key];
  }
  if (session.mode !== 'placement') session.exercises.forEach((e, i) => {
    const key = exerciseLevel(e)+':'+e.skill;
    const prev = skills[key] || { attempts:0, firstTryCorrect:0, lastAttemptAt:date, reviewStep:0 };
    skills[key] = {...prev, attempts:prev.attempts+1, firstTryCorrect:prev.firstTryCorrect+Number(correct[i]), lastAttemptAt:date, ...(!correct[i]?{lastWrongAt:date}:{})};
    const old = reviewItems.find(r=>r.sourceId===sourceId(e));
    const due = !!old && old.nextReviewAt<=session.startedAt;
    if (!correct[i] || (session.mode==='review' && due)) {
      const step = correct[i] ? Math.min((old?.step||0)+1,3) : 0;
      const nextReviewAt = new Date(new Date(date).getTime()+[1,3,7,14][step]*DAY).toISOString();
      reviewItems = reviewItems.filter(r=>r.sourceId!==sourceId(e));
      reviewItems.unshift({sourceId:sourceId(e),skill:e.skill,level:exerciseLevel(e),step,nextReviewAt,exercise:structuredClone(e)});
      skills[key] = {...skills[key]!,reviewStep:step,nextReviewAt};
    }
  });
  const qualifyingExams = { ...progress.qualifyingExams };
  let mastered = !!progress.masteryByLevel[session.level]?.mastered;
  const sourceIds = session.exercises.map(sourceId);
  const skillIds = [...new Set(session.exercises.map((e) => e.skill))];
  if (
    session.mode === "test" &&
    total >= 10 &&
    new Set(sourceIds).size === total &&
    session.level !== "K" && (session.levels || [session.level]).length === 1 &&
    requiredSkills[session.level].every((s) => skillIds.includes(s)) &&
    session.exercises.every((e) => isSentenceExercise(e) ? e.sentence.source === "seed" && ["fill", "order"].includes(e.kind) : e.source === "seed" && ["reading", "rewrite"].includes(e.kind))
  ) {
    const evidence = {
      id: session.id,
      score,
      total,
      date,
      sourceIds,
      skills: skillIds,
    };
    const last = [...(qualifyingExams[session.level] || []), evidence].slice(-2);
    qualifyingExams[session.level] = last;
    if (
      last.length === 2 &&
      last.every((e) => e.score / e.total >= 0.8) &&
      sourceIds.filter((id) => !last[0].sourceIds.includes(id)).length >=
        Math.ceil(total / 2)
    )
      mastered = true;
  }
  const ledger = Object.fromEntries(
    Object.entries(progress.ledger).filter(([, r]) => r.date >= minimum),
  );
  ledger[session.id] = result;
  const stats = profile.stats || initializeStats(profile);
  return {
    profile: {
      ...profile,
      stars: profile.stars + stars,
      ownedImageIds:
        image && !profile.ownedImageIds.includes(image.id)
          ? [...profile.ownedImageIds, image.id]
          : profile.ownedImageIds,
      stats: {
        ...stats,
        totalStarsEarned: stats.totalStarsEarned + stars,
        totalQuestions: stats.totalQuestions + total,
        totalTimeSeconds: stats.totalTimeSeconds + result.seconds,
      },
      englishProgress: {
        schemaVersion: 1,
        selectedLevel: session.mode === "placement" ? progress.selectedLevel : session.level,
        skills,
        masteryByLevel: {
          ...progress.masteryByLevel,
          ...(session.mode !== "placement" && (session.levels || [session.level]).length === 1 ? { [session.level]: { mastered, updatedAt: date } } : {}),
        },
        qualifyingExams,
        recentSessions: [result, ...progress.recentSessions].slice(0, 50),
        reviewItems: reviewItems.slice(0, 100),
        ledger,
        minimumAcceptedStartedAt: minimum,
      },
    },
    result,
  };
}
