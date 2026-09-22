// Fix-list 12: a finite word bank makes the free-text adjective target explicit.
// These distractors differ in meaning; the prompt still asks the learner to
// choose, and does not pretend that all other English synonyms are incorrect.
const distractors = {
  cute: ['cold','tall'], tall: ['short','round'], round: ['square','long'],
  pink: ['green','blue'], slow: ['fast','heavy'], hot: ['cold','sweet'],
  big: ['small','long'], clean: ['dirty','old'], sweet: ['sour','cold'],
  new: ['old','heavy'], small: ['big','tall'], cold: ['hot','sweet'],
  pretty: ['heavy','hungry'], long: ['short','round'], neat: ['messy','noisy'],
  happy: ['sad','tired'], white: ['black','red'], purple: ['yellow','green'],
  gray: ['brown','blue'], sad: ['happy','hungry'], messy: ['neat','quiet'],
  heavy: ['light','small'], hard: ['soft','sweet'], soft: ['hard','cold'],
  smart: ['hungry','tall'], quiet: ['noisy','busy'], brave: ['tired','hungry'],
  friendly: ['noisy','tall'], hungry: ['thirsty','tired'], dirty: ['clean','new'],
  cool: ['hot','sweet'], kind: ['hungry','tall'], busy: ['quiet','clean'],
  old: ['new','young'], red: ['blue','yellow'], short: ['long','round'],
  funny: ['sad','hungry'], fast: ['slow','heavy'], green: ['red','blue'],
  sour: ['sweet','cold'], expensive: ['cheap','small'], colorful: ['heavy','small'],
  yellow: ['purple','blue'], fat: ['thin','tall'], bright: ['dark','round'],
  brown: ['green','pink'], fresh: ['rotten','cold'],
};

export function applyAdjectivePrompts(sentence) {
  if (sentence.level !== 'A3') return sentence;
  const result = structuredClone(sentence);
  for (const blank of result.blanks) {
    if (result.tokens[blank.tokenIndex].pos !== 'adjective') continue;
    const other = distractors[blank.answer];
    if (!other) throw new Error(`${result.id}: review adjective distractors for ${blank.answer}.`);
    const meaning = blank.hint.replace(/^tính từ:\s*/i, '');
    // Vary the answer position without random changes on regeneration.
    const choices = [...other];
    choices.splice(Number(result.id.slice(-4)) % 3, 0, blank.answer);
    blank.promptVi = `Chọn một từ trong nhóm (${choices.join(' / ')}) để điền nghĩa “${meaning}”.`;
  }
  return result;
}
