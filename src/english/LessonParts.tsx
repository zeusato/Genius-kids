import React, {useState,useEffect} from 'react';
import {Volume2} from 'lucide-react';
import type {Sentence} from '../data/english/schema';
import {POS_NAMES,ROLE_NAMES} from './model';
import {joinTokens} from './engine';
import {canSpeak,speak,onSpeechAvailabilityChanged} from '../utils/speech';
export function AudioButton({ text }: { text: string }) {
  const [available, setAvailable] = useState(() => canSpeak("en-US"));
  const [error, setError] = useState(false);
  useEffect(
    () => onSpeechAvailabilityChanged(() => setAvailable(canSpeak("en-US"))),
    [],
  );
  return (
    <span className="en-audio">
      <button
        type="button"
        className="en-icon"
        aria-label={`Nghe: ${text}`}
        disabled={!available}
        title={
          available ? "Nghe tiếng Anh" : "Thiết bị chưa có giọng tiếng Anh"
        }
        onClick={() => {
          setError(false);
          if (
            !speak(text, {
              lang: "en-US",
              onEnd: () => {},
              onError: () => setError(true),
            })
          )
            setError(true);
        }}
      >
        <Volume2 size={18} />
      </button>
      {error && <small role="status">Chưa phát được âm thanh.</small>}
    </span>
  );
}
export function ColoredSentence({ sentence }: { sentence: Sentence }) {
  return (
    <div className="en-analysis">
      <div className="en-sentence" lang="en">
        {sentence.tokens.map((t, i) => (
          <span
            key={i}
            className={`en-word en-pos-${t.pos}`}
            title={POS_NAMES[t.pos]}
          >
            {t.text}
            <small>{t.pos === "punct" ? "" : POS_NAMES[t.pos]}</small>
          </span>
        ))}
      </div>
      <div className="en-role-groups" aria-label="Thành phần câu">
        {sentence.roleSpans.map((span, i) => (
          <span key={i}>
            <b lang="en">
              {joinTokens(
                span.tokenIndices.map((n) => sentence.tokens[n].text),
              )}
            </b>
            <small>{ROLE_NAMES[span.role]}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
export function PronounSwap() {
  const [pronoun, setPronoun] = useState("I");
  const be =
    pronoun === "I"
      ? "am"
      : ["He", "She", "It"].includes(pronoun)
        ? "is"
        : "are";
  return (
    <aside className="en-swap">
      <span className="en-eyebrow">THỬ ĐỔI MỘT TỪ</span>
      <h3>Đổi bạn, đổi cả “to be”</h3>
      <div className="en-options" aria-label="Chọn đại từ">
        {["I", "You", "He", "She", "It", "We", "They"].map((p) => (
          <button
            type="button"
            aria-pressed={pronoun === p}
            key={p}
            onClick={() => setPronoun(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="en-swap-sentence" lang="en" aria-live="polite">
        <span>{pronoun}</span> <strong>{be}</strong> happy.
      </p>
      <AudioButton text={`${pronoun} ${be} happy.`} />
      <p className="en-small">
        {pronoun} đi cùng <strong>{be}</strong>. Em thử chọn một đại từ khác
        nhé.
      </p>
    </aside>
  );
}
