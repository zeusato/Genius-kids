import { Question, QuestionType } from '../../../types';
import { capitalize } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Create SVG for parallel lines
const createParallelLinesSVG = () => {
  return `
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid background -->
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="300" height="200" fill="url(#grid)" />
      
      <!-- Parallel lines -->
      <line x1="20" y1="60" x2="280" y2="60" stroke="#3b82f6" stroke-width="3" />
      <line x1="20" y1="140" x2="280" y2="140" stroke="#3b82f6" stroke-width="3" />
      
      <!-- Arrows -->
      <text x="240" y="55" font-size="14" fill="#3b82f6">→</text>
      <text x="240" y="135" font-size="14" fill="#3b82f6">→</text>
    </svg>
  `;
};

// Create SVG for perpendicular lines
const createPerpendicularLinesSVG = () => {
  return `
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid background -->
      <defs>
        <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="300" height="200" fill="url(#grid2)" />
      
      <!-- Perpendicular lines -->
      <line x1="20" y1="100" x2="280" y2="100" stroke="#3b82f6" stroke-width="3" />
      <line x1="150" y1="20" x2="150" y2="180" stroke="#ef4444" stroke-width="3" />
      
      <!-- Right angle marker -->
      <rect x="145" y="95" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.5" />
      
      <text x="230" y="95" font-size="14" fill="#3b82f6">→</text>
      <text x="155" y="40" font-size="14" fill="#ef4444">↑</text>
    </svg>
  `;
};

// Create SVG for mixed lines
const createMixedLinesSVG = () => {
  return `
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid background -->
      <defs>
        <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="300" height="200" fill="url(#grid3)" />
      
      <!-- Line 1 (horizontal) -->
      <line x1="20" y1="50" x2="280" y2="50" stroke="#3b82f6" stroke-width="3" />
      <!-- Line 2 (parallel to 1) -->
      <line x1="20" y1="110" x2="280" y2="110" stroke="#ef4444" stroke-width="3" />
      <!-- Line 3 (perpendicular) -->
      <line x1="150" y1="20" x2="150" y2="180" stroke="#10b981" stroke-width="3" />
      
      <rect x="145" y="45" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.5" />
    </svg>
  `;
};

export const generateLines = (): Omit<Question, 'id' | 'topicId'> => {
  const type = Math.random();

  // 1. Identify parallel lines - 40%
  if (type < 0.4) {
    return {
      type: QuestionType.SingleChoice,
      questionText: `Hai đường thẳng trong hình có đặc điểm gì?`,
      visualSvg: createParallelLinesSVG(),
      correctAnswer: 'Song song với nhau',
      options: shuffleArray(['Song song với nhau', 'Vuông góc với nhau', 'Cắt nhau', 'Trùng nhau']),
      explanation: `Hai đường thẳng không gặp nhau và luôn cách đều nhau nên song song.`
    };
  }

  // 2. Identify perpendicular lines - 40%
  else if (type < 0.8) {
    return {
      type: QuestionType.SingleChoice,
      questionText: `Đường thẳng màu xanh và đường thẳng màu đỏ có quan hệ gì?`,
      visualSvg: createPerpendicularLinesSVG(),
      correctAnswer: 'Vuông góc với nhau',
      options: shuffleArray(['Vuông góc với nhau', 'Song song với nhau', 'Trùng nhau', 'Cắt nhau tạo góc nhọn']),
      explanation: `Hai đường thẳng cắt nhau tạo thành góc vuông (90°) nên vuông góc.`
    };
  }

  // 3. Count pairs - 20%
  else {
    return {
      type: QuestionType.SingleChoice,
      questionText: `Trong hình có bao nhiêu cặp đường thẳng song song?`,
      visualSvg: createMixedLinesSVG(),
      correctAnswer: '1',
      options: shuffleArray(['0', '1', '2', '3']),
      explanation: `Chỉ có 2 đường ngang (xanh và đỏ) song song với nhau. Đường dọc (xanh lá) vuông góc với cả hai.`
    };
  }
};
