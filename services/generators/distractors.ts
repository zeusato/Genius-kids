import { generatorRandom } from './random';
const randomInt = (min: number, max: number) => Math.floor(generatorRandom() * (max - min + 1)) + min;
const generateWrongAnswers = (correct: number, count: number, range = 10): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) { const value = correct + randomInt(-range, range); if (value !== correct && value >= 0) wrongs.add(value); }
    return [...wrongs].map(String);
};
export const generateWrongAnswersWithSameUnits = (
  correct: number,
  count: number,
  range: number = 100
): number[] => {
  // For answers < 10, use regular generation
  if (correct < 10) {
    return generateWrongAnswers(correct, count, Math.min(range, 5)).map(s => parseInt(s));
  }

  const unitDigit = correct % 10;
  const wrongs = new Set<number>();
  let attempts = 0;
  const maxAttempts = count * 50;

  while (wrongs.size < count && attempts < maxAttempts) {
    attempts++;
    // Generate offset as multiple of 10 to preserve unit digit
    const offsetMultiplier = randomInt(1, Math.max(1, Math.floor(range / 10)));
    const offset = offsetMultiplier * 10;
    const isNegative = generatorRandom() > 0.5;
    const val = correct + (isNegative ? -offset : offset);

    // Ensure: different, same unit digit, >= 0
    if (val !== correct && val >= 0 && val % 10 === unitDigit) {
      wrongs.add(val);
    }
  }

  // Fallback if not enough
  if (wrongs.size < count) {
    return generateWrongAnswers(correct, count, range).map(s => parseInt(s));
  }

  return Array.from(wrongs);
};


