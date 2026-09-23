import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Lightbulb,
  PencilLine,
  RotateCcw,
  Sprout,
  Star,
} from "lucide-react";
import { useStudent, useStudentActions } from "../contexts/StudentContext";
import { BookShell, BookCover, BookContents, BookReader, PracticeDesk } from './BookExperience';
import { VocabularyLab } from './VocabularyLab';
import { AudioButton, ColoredSentence } from './LessonParts';
import { isPreschool } from "../utils/grade";
import {
  cancelSpeech,
} from "../utils/speech";
import type { StudentProfile } from "../../types";
import { loadContent, type EnglishContent } from "./content";
import {
  answerText,
  checkResponse,
  correctAnswer,
  grade,
  joinTokens,
  submitSession,
} from "./engine";
import {
  getSession,
  saveSession,
  SessionConflict,
} from "./storage";
import {
  POS_NAMES,
  ROLE_NAMES,
  type Answer,
  type EnglishSession,
  type Exercise,
  type ExerciseKind,
  type Response,
  type SessionSummary,
} from "./model";
import { LEVEL_NAMES, isLevel, skillTitle } from './catalog';
import { ExtendedSetup, ExtraInput, Rulebook, OfflineNote, activityNames } from './ExtendedActivities';
import { isSentenceExercise, exerciseLevel } from './model';
import { ParentContent } from './ParentContent';
import './english.css';
import './book.css';

const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
const modeLabel = (mode: string) =>
  mode === "test" ? "Kiểm tra" : mode === "placement" ? "Tìm điểm bắt đầu" : mode === "review" ? "Ôn đến hạn" : "Luyện tập";
const kindLabel: Record<ExerciseKind, string> = {
  fill: "Điền từ",
  conjugate: "Chia động từ",
  order: "Xếp câu",
  pos: "Nhận biết từ loại",
  roles: "Tìm thành phần câu",
};
function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="en-notice en-error" role="alert">
      {children}
    </div>
  );
}
function Loading() {
  return (
    <div className="en-loading" role="status">
      <span />
      <span />
      <span />
      Đang mở trang sách…
    </div>
  );
}
function ExerciseInput({
  exercise,
  response,
  onAnswer,
  disabled,
  onAudioReady,
  onReplaceAudio,
}: {
  exercise: Exercise;
  response: Response;
  onAnswer: (answer: Answer) => void;
  disabled: boolean;
  onAudioReady: (ready: boolean) => void;
  onReplaceAudio: () => void;
}) {
  const [text, setText] = useState(typeof response.answer === "string" ? response.answer : "");
  if (!isSentenceExercise(exercise)) return <ExtraInput exercise={exercise} answer={response.answer} onAnswer={onAnswer} disabled={disabled} onAudioReady={onAudioReady} onReplaceAudio={onReplaceAudio}/>;
  const { sentence: s, kind, target } = exercise;
  const selected = Array.isArray(response.answer) ? response.answer : [];
  if (kind === "fill" || kind === "conjugate")
    return (
      <>
        <p className="en-question-instruction">{s.blanks[target].promptVi}{kind === "conjugate" && <> · Động từ gốc: <b lang="en">{s.tokens[s.blanks[target].tokenIndex].lemma}</b></>}</p>
        <div className="en-fill-sentence" lang="en">
          {s.tokens.map((token, i) =>
            i === s.blanks[target].tokenIndex ? (
              <input
                key={i}
                aria-label="Từ còn thiếu"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={text}
                disabled={disabled}
                placeholder="…"
                onChange={(e) => {
                  setText(e.target.value);
                  onAnswer(e.target.value);
                }}
              />
            ) : (
              <span key={i}>{token.text}</span>
            ),
          )}
        </div>
        <p className="en-translation">{s.vi}</p>
      </>
    );
  if (kind === "order") {
    const terminal=s.tokens.at(-1)?.pos === "punct" ? s.tokens.length-1 : -1;
    const words=selected.filter(i=>i!==terminal);
    const choose=(indices:number[])=>onAnswer(terminal>=0?[...indices,terminal]:indices);
    return (
      <>
        <p className="en-question-instruction">
          Chạm vào từng mảnh từ để xếp thành câu.
        </p>
        <p className="en-translation">{s.vi}</p>
        <div className="en-answer-tray" aria-label="Câu em đã xếp" lang="en">
          {words.length ? (
            words.map((index, i) => (
              <button
                type="button"
                key={index}
                disabled={disabled}
                aria-label={`Bỏ ${s.tokens[index].text} ở vị trí ${i + 1}`}
                onClick={() => choose(words.filter((n) => n !== index))}
              >
                {s.tokens[index].text}
              </button>
            ))
          ) : (
            <span>Những mảnh từ sẽ nằm ở đây…</span>
          )}
          {terminal>=0 && <span>{s.tokens[terminal].text}</span>}
        </div>
        <div className="en-token-bank" aria-label="Các mảnh từ" lang="en">
          {exercise.shuffledIndices.filter(i=>i!==terminal).map((index) => (
            <button
              type="button"
              key={index}
              disabled={disabled || selected.includes(index)}
              onClick={() => choose([...words, index])}
            >
              {s.tokens[index].text}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="en-text-link"
          disabled={disabled || !selected.length}
          onClick={() => onAnswer([])}
        >
          <RotateCcw size={15} /> Xếp lại
        </button>
      </>
    );
  }
  if (kind === "pos")
    return (
      <>
        <p className="en-question-instruction">
          Từ được gạch chân thuộc từ loại nào?
        </p>
        <p className="en-plain-sentence" lang="en">
          {s.tokens.map((t, i) => (
            <React.Fragment key={i}>
              {i > 0 && t.pos !== "punct" ? " " : ""}
              {i === target ? <u>{t.text}</u> : t.text}
            </React.Fragment>
          ))}
        </p>
        <label className="en-field">
          Từ loại của “{s.tokens[target].text}”
          <select
            value={typeof response.answer === "string" ? response.answer : ""}
            disabled={disabled}
            onChange={(e) => onAnswer(e.target.value)}
          >
            <option value="">Chọn từ loại…</option>
            {Object.entries(POS_NAMES)
              .filter(([key]) => key !== "punct")
              .map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
          </select>
        </label>
      </>
    );
  return (
    <>
      <p className="en-question-instruction">
        Chọn tất cả từ thuộc{" "}
        <strong>{ROLE_NAMES[s.roleSpans[target].role].toLowerCase()}</strong>
        {new Set(s.roleSpans.map((r) => r.clauseId)).size > 1
          ? ` của mệnh đề ${s.roleSpans[target].clauseId.replace("c", "")}`
          : ""}
        .
      </p>
      <div className="en-token-bank en-role-tokens" lang="en">
        {s.tokens.map((t, i) => (
          <button
            type="button"
            key={i}
            disabled={disabled || t.pos === "punct"}
            aria-pressed={selected.includes(i)}
            onClick={() =>
              onAnswer(
                selected.includes(i)
                  ? selected.filter((n) => n !== i)
                  : [...selected, i],
              )
            }
          >
            {t.text}
          </button>
        ))}
      </div>
      <p className="en-translation">{s.vi}</p>
      <p className="en-small">
        Một thành phần có thể gồm nhiều từ. Chạm lần nữa để bỏ chọn.
      </p>
    </>
  );
}
function Explanation({ exercise }: { exercise: Exercise }) {
  if (!isSentenceExercise(exercise)) return <div className="en-explanation"><h3>Đáp án: {exercise.answer}</h3><p>{exercise.explanation}</p>{exercise.passage && <p>{exercise.passage.vi}</p>}<Link className="en-text-link" to={`/english/learn/${exercise.level}`}>Mở lại bài học</Link></div>;
  const s = exercise.sentence;
  return (
    <div className="en-explanation">
      <ColoredSentence sentence={s} />
      <div className="en-explanation-caption">
        <p>{s.vi}</p>
        <AudioButton text={s.en} />
      </div>
      <p>
        {(exercise.kind === "fill" || exercise.kind === "conjugate")
          ? s.blanks[exercise.target].hint
          : exercise.kind === "pos"
            ? `“${s.tokens[exercise.target].text}” là ${POS_NAMES[s.tokens[exercise.target].pos].toLowerCase()}.`
            : exercise.kind === "roles"
              ? `${ROLE_NAMES[s.roleSpans[exercise.target].role]}: ${answerText(exercise, correctAnswer(exercise))}.`
              : "Đọc lại câu hoàn chỉnh và để ý vị trí chủ ngữ, động từ."}
      </p>
      <Link className="en-text-link" to={`/english/learn/${exercise.sentence.level}`}>
        Mở lại bài học <BookOpen size={16} />
      </Link>
    </div>
  );
}

function Runner({
  student,
  id,
  mode,
}: {
  student: StudentProfile;
  id: string;
  mode: EnglishSession["mode"];
}) {
  const navigate = useNavigate();
  const [audioReady, setAudioReady] = useState<Record<string, boolean>>({});
  const [session, setSession] = useState<EnglishSession | null>(null);
  const ref = useRef<EnglishSession | null>(null);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);
  const [clock, setClock] = useState(0);
  const queue = useRef(Promise.resolve());
  const failedCandidate = useRef<EnglishSession | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const failed = useRef(false);
  const alive = useRef(true);
  const activeSeconds = useRef(0);
  const baseSeconds = useRef(0);
  const refresh = useCallback(async () => {
    try {
      const s = await getSession(student.id, id);
      if (!alive.current) return;
      if (!s) throw new Error("Không tìm thấy bài trong hồ sơ này.");
      if (s.mode !== mode)
        throw new Error("Đường dẫn không khớp với bài đang học.");
      if (s.status !== "draft") {
        navigate(`/english/result/${id}`, { replace: true });
        return;
      }
      ref.current = s;
      failedCandidate.current = null;
      setReloadKey((k) => k + 1);
      baseSeconds.current = s.elapsedSeconds;
      activeSeconds.current = 0;
      setSession(s);
      setClock(s.elapsedSeconds);
      setConflict(false);
      setError("");
      failed.current = false;
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Không mở được bài.");
    }
  }, [student.id, id, mode, navigate]);
  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
      cancelSpeech();
    };
  }, [refresh]);
  const change = useCallback(
    (update: (s: EnglishSession) => EnglishSession) => {
      setPending((n) => n + 1);
      queue.current = queue.current
        .then(async () => {
          if (failed.current || !ref.current) return;
          const prev = ref.current;
          const next = update({
            ...prev,
            elapsedSeconds: baseSeconds.current + activeSeconds.current,
          });
          try {
            const saved = await saveSession(next, prev.revision);
            ref.current = saved;
            if (alive.current) {
              setSession(saved);
              setError("");
            }
          } catch (e) {
            failedCandidate.current = next;
            failed.current = true;
            if (alive.current) {
              setConflict(e instanceof SessionConflict);
              setError(
                e instanceof Error
                  ? e.message
                  : "Không lưu được bài. Hãy kiểm tra dung lượng và thử lại.",
              );
            }
          }
        })
        .finally(() => {
          if (alive.current) setPending((n) => Math.max(0, n - 1));
        });
      return queue.current;
    },
    [],
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (
        ref.current?.status === "draft" &&
        !document.hidden &&
        document.hasFocus()
      ) {
        activeSeconds.current++;
        setClock(baseSeconds.current + activeSeconds.current);
        if (activeSeconds.current % 15 === 0) void change((s) => s);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [change]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (failed.current || pending > 0) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);
  async function retrySave() {
    const candidate = failedCandidate.current;
    if (!candidate || !ref.current) return;
    setBusy(true);
    try {
      const saved = await saveSession(candidate, ref.current.revision);
      ref.current = saved;
      setSession(saved);
      failed.current = false;
      failedCandidate.current = null;
      setError("");
      if (saved.status === "submitted") navigate(`/english/result/${id}`);
    } catch (e) {
      setConflict(e instanceof SessionConflict);
      setError(e instanceof Error ? e.message : "Chưa lưu được bài.");
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    if (ref.current?.exercises.some(e => !isSentenceExercise(e) && e.audio && !ref.current?.responses[e.id]?.attempts)) { setError("Hãy nghe và trả lời các câu âm thanh trước khi nộp, hoặc quay về đổi dạng luyện."); return; }
    setBusy(true);
    await change((s) => submitSession(s));
    if (!failed.current) navigate(`/english/result/${id}`);
    else setBusy(false);
  }
  if (!session)
    return error ? (
      <ErrorNotice>
        {error} <Link to="/english">Về góc Tiếng Anh</Link>
      </ErrorNotice>
    ) : (
      <Loading />
    );
  const exercise = session.exercises[session.cursor];
  const response = session.responses[exercise.id] || {
    answer: exercise.kind === "order" || exercise.kind === "roles" ? [] : "",
    attempts: 0,
    hints: 0,
  };
  const practice = mode === "practice" || mode === "review";
  const checked = practice && response.attempts > 0;
  const answered = session.exercises.filter((e) => {
    const r = session.responses[e.id];
    return (
      r &&
      (practice
        ? r.attempts > 0
        : Array.isArray(r.answer)
          ? r.answer.length > 0
          : r.answer.trim().length > 0)
    );
  }).length;
  const disabled =
    busy || failed.current || (practice && response.correct === true);
  const updateResponse = (update: (r: Response) => Response) =>
    change((s) => ({
      ...s,
      responses: {
        ...s.responses,
        [exercise.id]: update(
          s.responses[exercise.id] || {
            answer:
              exercise.kind === "order" || exercise.kind === "roles" ? [] : "",
            attempts: 0,
            hints: 0,
          },
        ),
      },
    }));
  return (
    <div className="en-runner">
      <header className="en-runner-heading">
        <div>
          <span className="en-eyebrow">
            {modeLabel(mode).toUpperCase()} · {LEVEL_NAMES[session.level]}
          </span>
          <h1>Mỗi câu, một bước nhỏ.</h1>
        </div>
        <span className="en-clock">
          <Clock3 size={17} />
          {duration(clock)}
        </span>
      </header>
      <div className="en-session-progress">
        <progress
          value={answered}
          max={session.exercises.length}
          aria-label={`Đã làm ${answered} trên ${session.exercises.length} câu`}
        />
        <span>
          {answered}/{session.exercises.length} câu
        </span>
      </div>
      <nav className="en-question-nav" aria-label="Chuyển câu hỏi">
        {session.exercises.map((e, i) => (
          <button
            key={e.id}
            aria-label={`Câu ${i + 1}`}
            aria-current={i === session.cursor ? "step" : undefined}
            disabled={busy || failed.current}
            className={session.responses[e.id]?.attempts ? "is-answered" : ""}
            onClick={() => {
              cancelSpeech();
              void change((s) => ({ ...s, cursor: i }));
            }}
          >
            {i + 1}
          </button>
        ))}
      </nav>
      {error && (
        <ErrorNotice>
          {error}
          <button
            className="en-text-link"
            disabled={busy}
            onClick={() => {
              void (conflict ? refresh() : retrySave());
            }}
          >
            {conflict ? "Tải lại bài từ tab khác" : "Thử lưu lại câu đang làm"}
          </button>
          <span className="en-small">
            {conflict
              ? "Bản đã lưu ở tab kia sẽ được mở lại."
              : "Câu đang nhập vẫn ở đây để em thử lưu lại."}
          </span>
        </ErrorNotice>
      )}
      <article className="en-exercise">
        <div className="en-section-heading">
          <span className="en-eyebrow">
            CÂU {session.cursor + 1} / {session.exercises.length}
          </span>
          <span className="en-small">{activityNames[exercise.kind]}</span>
        </div>
        <ExerciseInput
          onReplaceAudio={() => { if (response.attempts || isSentenceExercise(exercise) || !exercise.vocab) return; cancelSpeech(); void change(s => ({...s, exercises:s.exercises.map(e => e.id===exercise.id ? {...exercise,kind:'meaning',skill:'vocab-meaning',audio:undefined,prompt:'Chọn từ tiếng Anh: '+exercise.vocab!.vi} : e),responses:{...s.responses,[exercise.id]:{answer:'',hints:0,attempts:0}}})); }}
          onAudioReady={(ready) => setAudioReady(old => ({...old,[exercise.id]:ready}))}
          key={`${exercise.id}:${reloadKey}`}
          exercise={exercise}
          response={response}
          disabled={disabled}
          onAnswer={(answer) => {
            void updateResponse((r) => ({ ...r, answer, correct: undefined }));
          }}
        />
        {practice && !checked && (
          <button
            className="en-hint-button"
            disabled={disabled || response.hints > 0}
            onClick={() => {
              void updateResponse((r) => ({ ...r, hints: r.hints + 1 }));
            }}
          >
            <Lightbulb size={17} /> Cần một gợi ý?
          </button>
        )}
        {practice && response.hints > 0 && (
          <div className="en-notice">
            {!isSentenceExercise(exercise) ? exercise.hint : exercise.kind === "fill" || exercise.kind === "conjugate"
              ? exercise.sentence.blanks[exercise.target].hint
              : exercise.kind === "roles"
                ? `${ROLE_NAMES[exercise.sentence.roleSpans[exercise.target].role]} có ${exercise.sentence.roleSpans[exercise.target].tokenIndices.length} từ.`
                : exercise.kind === "pos"
                  ? `Từ này thuộc nhóm ${POS_NAMES[exercise.sentence.tokens[exercise.target].pos].toLowerCase()}.`
                  : `Câu bắt đầu bằng “${exercise.sentence.tokens[0].text}”.`}
            <small> Câu này không tính điểm lần đầu.</small>
          </div>
        )}
        {checked && (
          <div
            className={`en-feedback ${response.correct ? "is-correct" : "is-try-again"}`}
            role="status"
          >
            <strong>
              {response.correct
                ? "Đúng rồi, em làm được rồi."
                : "Chưa đúng. Mình cùng xem lại nhé."}
            </strong>
            {!response.firstCorrect && response.correct && (
              <p>Đã sửa đúng. Điểm vẫn tính theo lần đầu.</p>
            )}
            <Explanation exercise={exercise} />
          </div>
        )}
        <footer className="en-exercise-footer">
          <span className="en-save-state" role="status">
            {pending
              ? "Đang lưu…"
              : failed.current
                ? "Chưa lưu được"
                : "Đã lưu trên thiết bị"}
          </span>
          {practice && !response.correct && (
            <button
              className="en-button"
              disabled={disabled || pending > 0 || (!isSentenceExercise(exercise) && !!exercise.audio && !audioReady[exercise.id])}
              onClick={() => {
                void updateResponse((r) => checkResponse(exercise, r));
              }}
            >
              {checked ? "Thử lại" : "Kiểm tra"}
              <Check size={17} />
            </button>
          )}
          {session.cursor < session.exercises.length - 1 && (
            <button
              className={
                response.correct || !practice ? "en-button" : "en-secondary"
              }
              disabled={busy || failed.current || pending > 0}
              onClick={() => {
                cancelSpeech();
                void change((s) => ({ ...s, cursor: s.cursor + 1 }));
              }}
            >
              Câu tiếp <ArrowRight size={17} />
            </button>
          )}
        </footer>
      </article>
      <div className="en-runner-bottom">
        <Link className="en-text-link" to="/english">
          <ArrowLeft size={16} /> Tạm dừng
        </Link>
        <button
          className="en-secondary"
          disabled={
            busy ||
            failed.current ||
            pending > 0 ||
            (practice && answered < session.exercises.length)
          }
          onClick={finish}
        >
          {busy
            ? "Đang lưu bài…"
            : mode === "test"
              ? `Nộp bài (${answered}/${session.exercises.length})`
              : "Hoàn thành buổi luyện"}
        </button>
      </div>
      {mode === "test" && (
        <p className="en-small">
          Câu chưa trả lời khi nộp bài được tính là chưa đúng.
        </p>
      )}
    </div>
  );
}
function Activity({
  student,
  content,
  mode,
}: {
  student: StudentProfile;
  content: EnglishContent | null;
  mode: EnglishSession["mode"];
}) {
  const [params] = useSearchParams();
  const id = params.get("session");
  return id ? (
    <Runner key={`${student.id}:${id}`} student={student} id={id} mode={mode} />
  ) : content ? (
    <ExtendedSetup key={content.level+mode} student={student} content={content} mode={mode} />
  ) : (
    <p className="en-empty">
      Chưa mở được nội dung. Em quay lại trang đầu và thử tải lại nhé.
    </p>
  );
}
function Result({ student }: { student: StudentProfile }) {
  const { sessionId = "" } = useParams();
  const { completeEnglish } = useStudentActions();
  const [session, setSession] = useState<EnglishSession | null>(null);
  const [result, setResult] = useState<SessionSummary | null>(
    student.englishProgress?.ledger[sessionId] ||
      student.englishProgress?.recentSessions.find((s) => s.id === sessionId) ||
      null,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const completing = useRef(false);
  const complete = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    setBusy(true);
    setError("");
    const r = await completeEnglish(student.id, sessionId);
    if (alive.current) {
      if (r.ok && r.result) setResult(r.result);
      else setError(r.error || "Chưa lưu được kết quả.");
      setBusy(false);
    }
    completing.current = false;
  }, [completeEnglish, student.id, sessionId]);
  useEffect(() => {
    alive.current = true;
    getSession(student.id, sessionId)
      .then((s) => {
        if (!alive.current) return;
        if (s) {
          setSession(s);
          if (s.status === "draft")
            setError("Bài này chưa nộp. Hãy quay lại bài đang làm.");
          else if (!result) void complete();
        } else if (!result) setError("Không tìm thấy kết quả trong hồ sơ này.");
      })
      .catch(() => {
        if (alive.current) setError("Chưa đọc được bài làm đã lưu.");
      });
    return () => {
      alive.current = false;
    };
  }, [student.id, sessionId, complete]);
  return (
    <div className="en-result">
      {error && (
        <ErrorNotice>
          {error}
          {session && session.status !== "draft" && (
            <button
              className="en-button"
              disabled={busy}
              onClick={() => void complete()}
            >
              Thử lưu lại
            </button>
          )}
          {session?.status === "draft" && (
            <Link
              className="en-text-link"
              to={`/english/${session.mode}?session=${sessionId}`}
            >
              Quay lại bài
            </Link>
          )}
        </ErrorNotice>
      )}
      {!result ? (
        busy ? (
          <Loading />
        ) : null
      ) : (
        <>
          <header className="en-result-heading">
            <span className="en-eyebrow">
              {modeLabel(result.mode).toUpperCase()} · {LEVEL_NAMES[result.level]} · ĐÃ LƯU
            </span>
            <div className="en-score">
              {result.score}
              <span>/{result.total}</span>
            </div>
            <h1>
              {result.score / result.total >= 0.8
                ? "Một bước tiến thật đẹp."
                : "Mỗi lần thử, em hiểu thêm."}
            </h1>
            <p>
              {result.mode === "practice"
                ? "Kết quả lần trả lời đầu tiên, không dùng gợi ý."
                : "Cùng xem lại những câu em đã làm nhé."}
            </p>
            <div className="en-result-meta">
              <span>
                <Star size={20} /> +{result.stars} sao
              </span>
              <span>
                <Clock3 size={19} />
                {duration(result.seconds)}
              </span>
            </div>
            {result.rewardLimited && (
              <p className="en-small">
                Kết quả vẫn được ghi nhận. Buổi này chưa đạt điều kiện thưởng
                hoặc đã đủ lượt thưởng hôm nay.
              </p>
            )}
            {result.image && (
              <div className="en-earned-card">
                <img src={result.image.imagePath} alt={result.image.name} />
                <div>
                  <span className="en-eyebrow">MÓN QUÀ BẤT NGỜ</span>
                  <strong>{result.image.name}</strong>
                  <p>Đã lưu vào bộ sưu tập của em.</p>
                </div>
              </div>
            )}
            <div className="en-result-actions">
              <Link className="en-button" to={`/english/practice?level=${result.level}`}>
                Luyện thêm một chút <ArrowRight size={17} />
              </Link>
              <Link className="en-text-link" to="/english">
                Về góc Tiếng Anh
              </Link>
            </div>
          </header>
          {result.mode === 'placement' && session && <div className="en-notice"><strong>Gợi ý điểm bắt đầu: {LEVEL_NAMES[exerciseLevel(session.exercises.find(e => !session.responses[e.id]?.firstCorrect) || session.exercises.at(-1)!)]}</strong><p>Đây là gợi ý từ 8 câu ngắn. Em vẫn có thể mở bất kỳ chủ đề nào.</p><Link className="en-text-link" to={'/english/learn/'+exerciseLevel(session.exercises.find(e => !session.responses[e.id]?.firstCorrect) || session.exercises.at(-1)!)}>Mở bài học →</Link></div>}
          <section>
            <h2>Cùng xem lại từng câu</h2>
            {session ? (
              session.exercises.map((e, i) => {
                const response = session.responses[e.id];
                const correct =
                  !!response &&
                  response.firstAnswer !== undefined &&
                  !response.hints &&
                  grade(e, response.firstAnswer);
                return (
                  <details className="en-review-row" key={e.id}>
                    <summary>
                      <span
                        className={
                          correct ? "en-review-correct" : "en-review-wrong"
                        }
                      >
                        {correct ? (
                          <Check size={17} />
                        ) : (
                          <PencilLine size={17} />
                        )}
                      </span>
                      <span>
                        Câu {i + 1} · {skillTitle(e.skill)}
                      </span>
                      <small>{correct ? "Đúng lần đầu" : "Cùng ôn lại"}</small>
                    </summary>
                    <div>
                      <p className="en-small">
                        Lần đầu:{" "}
                        {response?.firstAnswer !== undefined
                          ? answerText(e, response.firstAnswer) ||
                            "Chưa trả lời"
                          : "Chưa trả lời"}
                        {response?.hints ? " · Có dùng gợi ý" : ""}
                      </p>
                      <Explanation exercise={e} />
                    </div>
                  </details>
                );
              })
            ) : (
              <p className="en-empty">
                Điểm đã lưu trong hồ sơ. Chi tiết bài làm không còn trên thiết
                bị này.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function EnglishPage() {
  const { currentStudent } = useStudent();
  const { setStudent } = useStudentActions();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedLevel = location.pathname.match(/\/learn\/([^/]+)/)?.[1] || new URLSearchParams(location.search).get('level') || (currentStudent && isPreschool(currentStudent.grade) ? 'K' : 'A1');
  const activeLevel = isLevel(requestedLevel) ? requestedLevel : 'A1';
  const [content, setContent] = useState<EnglishContent | null>(null);
  const [contentError, setContentError] = useState("");
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let active = true;
    setContent(null); setContentError(""); setLoading(true);
    loadContent(activeLevel)
      .then((c) => {
        if (active) setContent(c);
      })
      .catch((e) => {
        if (active) setContentError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeLevel]);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  useEffect(() => {
    document.title = "Tiếng Anh · Genius Kids";
    cancelSpeech();
    return () => cancelSpeech();
  }, [location.pathname, location.search, currentStudent?.id]);
  if (!currentStudent) return null;
  return (
    <BookShell
      student={currentStudent}
      onProfile={() => navigate("/profile")}
      onLogout={() => {
        cancelSpeech();
        setStudent(null);
        navigate("/");
      }}
    >
      <main className="en-main" key={currentStudent.id}>
        {contentError && (
          <ErrorNotice>
            Chưa thể mở bài học. {contentError}
            <button
              className="en-text-link"
              onClick={() => window.location.reload()}
            >
              Tải lại
            </button>
          </ErrorNotice>
        )}
          <Routes>
            <Route path="contents" element={<BookContents student={currentStudent}/>}/>
            <Route path="workshop" element={<PracticeDesk student={currentStudent}/>}/>
            <Route path="vocabulary" element={content ? <VocabularyLab key={currentStudent.id+content.level} content={content} student={currentStudent}/> : <Loading/>}/>
            <Route
              index
              element={<BookCover student={currentStudent} />}
            />
            <Route
              path="learn/:level"
              element={
                content ? (
                  <BookReader key={currentStudent.id+content.level} content={content} student={currentStudent} />
                ) : loading ? (
                  <Loading />
                ) : null
              }
            />
            <Route
              path="practice"
              element={
                <Activity
                  student={currentStudent}
                  content={content}
                  mode="practice"
                />
              }
            />
            <Route
              path="test"
              element={
                <Activity
                  student={currentStudent}
                  content={content}
                  mode="test"
                />
              }
            />
            {(['review','placement'] as const).map(mode => <Route key={mode} path={mode} element={<Activity student={currentStudent} content={content} mode={mode}/>}/>)}
            <Route path="rulebook" element={<Rulebook/>}/><Route path="parent" element={<ParentContent key={currentStudent.id} student={currentStudent}/>}/>
            <Route
              path="result/:sessionId"
              element={
                <Result
                  key={`${currentStudent.id}:${location.pathname}`}
                  student={currentStudent}
                />
              }
            />
            <Route path="*" element={<Navigate to="/english" replace />} />
          </Routes>
        <footer className="en-footer">
          <Sprout size={16} />
          <span>Từng từ nhỏ. Từng bước tự tin.</span>
          <Link to="/mode">
            Sảnh khám phá <ArrowRight size={14} />
          </Link>
          {(!online || (content && location.pathname.includes("/learn/"))) && (
            <div className="book-footer-status" role="note" aria-label="Thông tin bài học và kết nối">
              {!online && <p>Đang ngoại tuyến. Có thể mở lại bài đã lưu trên thiết bị.</p>}
              {content && location.pathname.includes("/learn/") && <OfflineNote key={content.level} content={content}/>}
            </div>
          )}
        </footer>
      </main>
    </BookShell>
  );
}
