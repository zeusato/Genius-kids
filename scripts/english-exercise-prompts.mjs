// Prompt policy for the reviewed A2/B2/B3/B4 generators. Lemmas are task
// inputs, including unchanged forms; inflection rules belong in hints.
function sentenceForm(sentence) {
  if (sentence.tokens.at(-1)?.text === '?') return 'nghi vấn';
  return sentence.tokens.some(t => t.text === 'not' || /n't$/i.test(t.text))
    ? 'phủ định' : 'khẳng định';
}

function verbPrompt(sentence, blank) {
  const token = sentence.tokens[blank.tokenIndex];
  if (token.pos !== 'verb' || !token.lemma) throw new Error(`${sentence.id}: review the new blank before generating its prompt.`);
  const form = sentenceForm(sentence);
  const feature = token.feature || '';
  const contracted = feature.endsWith('-neg');
  const goingTo = sentence.tokens.some((t, i) => t.text === 'going' && sentence.tokens[i + 1]?.text === 'to');
  let tense;
  if (sentence.level === 'B2' || sentence.grammarPoint === 'review-present-continuous') tense = 'hiện tại tiếp diễn';
  else if (sentence.level === 'B3' || sentence.grammarPoint === 'review-past-simple') tense = 'quá khứ đơn';
  else if (sentence.grammarPoint === 'review-present-simple') tense = 'hiện tại đơn';
  else if (sentence.level === 'B4') tense = 'tương lai đơn';
  else throw new Error(`${sentence.id}: unknown prompt context.`);

  if (token.lemma === 'will' || token.lemma === 'do' && feature.startsWith('aux-')) {
    if (contracted) return `Điền trợ động từ phủ định ở thì ${tense}.`;
    const existingNegation = sentence.tokens[blank.tokenIndex + 1]?.text === 'not'
      ? ' Chỉ điền một từ; từ phủ định đã có trong câu.' : '';
    return `Điền trợ động từ phù hợp cho câu ${form} ở thì ${tense}.${existingNegation}`;
  }
  if (token.lemma === 'be' && feature !== 'base') {
    if (contracted) return `Điền dạng phủ định của be để hoàn thành câu ở thì ${tense}.`;
    if (goingTo) return `Điền dạng hiện tại phù hợp của be trong câu ${form} diễn tả dự định tương lai.`;
    const existingNegation = sentence.tokens[blank.tokenIndex + 1]?.text === 'not'
      ? ' Chỉ điền một từ; từ phủ định đã có trong câu.' : '';
    return `Chia động từ be để hoàn thành câu ${form} ở thì ${tense}.${existingNegation}`;
  }
  if (goingTo) return `Chia động từ ${token.lemma} để hoàn thành câu ${form} diễn tả dự định tương lai.`;
  return `Chia động từ ${token.lemma} để hoàn thành câu ${form} ở thì ${tense}.`;
}

const NEG_EXPANSIONS = {
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "didn't": 'did not',
  "won't": 'will not',
};

export function applyExercisePrompts(sentence) {
  if (!['A2', 'B2', 'B3', 'B4'].includes(sentence.level)) return sentence;
  const result = structuredClone(sentence);
  for (const blank of result.blanks) {
    const previousPrompt = blank.promptVi;
    if (result.level === 'A2') {
      if (['A2-s-0147', 'A2-s-0148'].includes(result.id)) {
        // Replace the copy-There exercise with subject–verb agreement.
        if (result.tokens[0]?.text !== 'There' || result.tokens[1]?.lemma !== 'be')
          throw new Error(`${result.id}: re-review the existential blank.`);
        blank.tokenIndex = 1;
        blank.answer = result.tokens[1].text;
        delete blank.alt;
        blank.promptVi = 'Điền dạng hiện tại phù hợp của be để diễn tả sự tồn tại.';
      } else if (result.id === 'A2-s-0198') {
        blank.promptVi = 'Điền mạo từ phù hợp khi nói về toàn bộ nhóm táo đỏ trên cái cây kia mà cả người nói và người nghe đều biết.';
      } else if (['A2-s-0019', 'A2-s-0024', 'A2-s-0025'].includes(result.id)) {
        blank.promptVi = 'Điền mạo từ a hoặc an vào chỗ trống.';
      } else {
        const token = result.tokens[blank.tokenIndex];
        if (token.pos === 'noun' && token.feature === 'pl')
          blank.promptVi = `Điền dạng số nhiều của ${token.lemma}.`;
      }
    } else if (!result.tags.some(tag => ['contrast', 'short-answer-context'].includes(tag))) blank.promptVi = verbPrompt(result, blank);

    const expanded = NEG_EXPANSIONS[blank.answer.toLowerCase()];
    if (expanded) {
      const alts = blank.alt || [];
      if (!alts.some(a => a.toLowerCase() === expanded)) {
        blank.alt = [...alts, expanded];
      }
    }

    // Retain useful spelling explanations without displaying them as questions.
    // Idempotent: cleaned prompts contain none of these instructional patterns.
    if (previousPrompt !== blank.promptVi && /gấp đôi|nhân đôi|bỏ e|giữ nguyên|thêm -?(?:ed|ing)|\(-es|\(-ies|âm câm|phiên âm/i.test(previousPrompt)
      && !blank.hint.includes(previousPrompt))
      blank.hint = `${blank.hint} ${previousPrompt}`;
  }
  return result;
}
