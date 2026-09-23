export interface QuestionAnswer {
  question: string;
  answers: { text: string; kind: 'yes' | 'no' | 'answer' }[];
}

// Only explicit question/answer notation is a dialogue. Slashes within a
// question (Am / Is / Are) and verb choices (do/does) remain untouched.
export function questionAnswers(text: string): QuestionAnswer[] | null {
  const pairs = text.trim().split(/(?<=[.!?])\s+\/\s+(?=[^?→]*\?\s*(?:→|[-–—]))/);
  const result: QuestionAnswer[] = [];
  for (const pair of pairs) {
    const match = pair.match(/^(.+?\?)\s*(?:→|[-–—])\s*(.+)$/s);
    if (!match) return null;
    const answers = match[2].replace(/^Trả lời:\s*/i, '').split(/\s+(?:\/|\|)\s+(?=(?:Yes,|No,|It is\b|They are\b))/i);
    result.push({
      question: match[1].trim(),
      answers: answers.map(answer => ({
        text: answer.trim(),
        kind: /^Yes,/i.test(answer) ? 'yes' : /^No,/i.test(answer) ? 'no' : 'answer',
      })),
    });
  }
  return result;
}
