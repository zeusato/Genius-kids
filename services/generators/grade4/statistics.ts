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

// Create simple bar chart SVG
const createBarChartSVG = (data: { label: string, value: number }[]) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = 50;
    const gap = 20;
    const chartHeight = 150;
    const scale = chartHeight / (maxValue + 5);

    let bars = '';
    data.forEach((d, i) => {
        const x = 30 + i * (barWidth + gap);
        const h = d.value * scale;
        const y = chartHeight - h + 20;

        bars += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#3b82f6" stroke="#1e40af" stroke-width="2" />
      <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="14" font-weight="bold">${d.value}</text>
      <text x="${x + barWidth / 2}" y="${chartHeight + 40}" text-anchor="middle" font-size="12">${d.label}</text>
    `;
    });

    return `
    <svg width="${30 + data.length * (barWidth + gap) + 20}" height="200" viewBox="0 0 ${30 + data.length * (barWidth + gap) + 20} 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Axes -->
      <line x1="25" y1="20" x2="25" y2="${chartHeight + 20}" stroke="#0f172a" stroke-width="2" />
      <line x1="20" y1="${chartHeight + 20}" x2="${30 + data.length * (barWidth + gap)}" y2="${chartHeight + 20}" stroke="#0f172a" stroke-width="2" />
      
      ${bars}
    </svg>
  `;
};

export const generateStatistics = (): Omit<Question, 'id' | 'topicId'> => {
    const categories = [
        { theme: 'Điểm số', items: ['Toán', 'Văn', 'Anh'] },
        { theme: 'Số học sinh', items: ['Lớp 4A', 'Lớp 4B', 'Lớp 4C'] },
        { theme: 'Số sách', items: ['Thứ 2', 'Thứ 3', 'Thứ 4'] }
    ];

    const cat = categories[randomInt(0, categories.length - 1)];
    const values = cat.items.map(() => randomInt(5, 25));
    const data = cat.items.map((item, i) => ({ label: item, value: values[i] }));

    const type = Math.random();

    // 1. Find maximum - 33%
    if (type < 0.33) {
        const maxValue = Math.max(...values);
        const maxIndex = values.indexOf(maxValue);
        const maxLabel = cat.items[maxIndex];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của mục nào là lớn nhất?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: maxLabel,
            options: shuffleArray(cat.items),
            explanation: `${maxLabel} có giá trị ${maxValue}, lớn nhất trong tất cả.`
        };
    }

    // 2. Find minimum - 33%
    else if (type < 0.66) {
        const minValue = Math.min(...values);
        const minIndex = values.indexOf(minValue);
        const minLabel = cat.items[minIndex];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của mục nào là nhỏ nhất?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: minLabel,
            options: shuffleArray(cat.items),
            explanation: `${minLabel} có giá trị ${minValue}, nhỏ nhất trong tấtcả.`
        };
    }

    // 3. Calculate difference - 34%
    else {
        const idx1 = 0;
        const idx2 = 1;
        const diff = Math.abs(values[idx1] - values[idx2]);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của ${cat.items[idx1]} hơn ${cat.items[idx2]} bao nhiêu?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: diff.toString(),
            options: shuffleArray([diff.toString(), (diff + 1).toString(), (diff - 1).toString(), (diff + 2).toString()]),
            explanation: `${cat.items[idx1]} có ${values[idx1]}, ${cat.items[idx2]} có ${values[idx2]}. Chênh lệch: ${Math.abs(values[idx1] - values[idx2])}.`
        };
    }
};
