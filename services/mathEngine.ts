
import { Grade, Question, Topic, QuestionType } from '../types';

// --- Utility Functions ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Helper to generate plausible wrong answers
const generateWrongAnswers = (correct: number, count: number, range: number = 10): string[] => {
  const wrongs = new Set<number>();
  while (wrongs.size < count) {
    const offset = randomInt(-range, range);
    const val = correct + offset;
    if (val !== correct && val >= 0) {
      wrongs.add(val);
    }
  }
  return Array.from(wrongs).map(String);
};

// --- Topic Registry ---

export const TOPICS: Topic[] = [
  // Grade 2
  { id: 'g2_add_sub_no_carry', title: 'Cộng trừ không nhớ (Phạm vi 100)', grade: Grade.Grade2, description: 'Phép tính đơn giản không cần nhớ' },
  { id: 'g2_add_sub_carry', title: 'Cộng trừ có nhớ (Phạm vi 100)', grade: Grade.Grade2, description: 'Phép tính cần mượn hoặc nhớ' },
  { id: 'g2_units_mass_len', title: 'Đổi đơn vị (Kg, Dm, Cm)', grade: Grade.Grade2, description: 'Đổi đơn vị liền kề' },
  
  // Grade 3 (Adding typing here as well)
  { id: 'typing_practice', title: 'Tập đánh máy (Văn bản)', grade: Grade.Grade3, description: 'Luyện gõ 10 ngón và chính tả' },

  // Grade 4
  { id: 'g4_arithmetic_10000', title: 'Bốn phép tính (Phạm vi 10,000)', grade: Grade.Grade4, description: 'Cộng, Trừ, Nhân, Chia số lớn' },
  { id: 'g4_geometry_2d', title: 'Hình học phẳng & Ghép hình', grade: Grade.Grade4, description: 'Chu vi, diện tích hình chữ nhật, hình vuông, hình ghép' },
  { id: 'g4_units_complex', title: 'Quy đổi đơn vị tổng hợp', grade: Grade.Grade4, description: 'Độ dài, Khối lượng, Diện tích' },
  { id: 'g4_patterns', title: 'Tìm quy luật dãy số', grade: Grade.Grade4, description: 'Điền số còn thiếu vào vị trí bất kỳ' },
  { id: 'typing_practice', title: 'Tập đánh máy (Văn bản)', grade: Grade.Grade4, description: 'Luyện gõ 10 ngón và chính tả' },
  
  // Grade 5
  { id: 'typing_practice', title: 'Tập đánh máy (Văn bản)', grade: Grade.Grade5, description: 'Luyện gõ 10 ngón và chính tả' },
];

// --- Generators ---

const generators: Record<string, () => Omit<Question, 'id' | 'topicId'>> = {
  // --- Grade 2 Generators ---
  
  'g2_add_sub_no_carry': () => {
    const isAdd = Math.random() > 0.5;
    let a, b, ans;
    
    if (isAdd) {
      // a + b < 100, unit digits sum < 10
      const a_units = randomInt(0, 8);
      const b_units = randomInt(0, 9 - a_units);
      const a_tens = randomInt(1, 8);
      const b_tens = randomInt(0, 9 - a_tens);
      a = a_tens * 10 + a_units;
      b = b_tens * 10 + b_units;
      ans = a + b;
    } else {
      // a - b, no borrow. a_units >= b_units
      const a_tens = randomInt(2, 9);
      const b_tens = randomInt(1, a_tens);
      const a_units = randomInt(1, 9);
      const b_units = randomInt(0, a_units);
      a = a_tens * 10 + a_units;
      b = b_tens * 10 + b_units;
      ans = a - b;
    }

    return {
      type: QuestionType.SingleChoice,
      questionText: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      correctAnswer: ans.toString(),
      options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 5)]),
      explanation: `Thực hiện tính từ hàng đơn vị trước, sau đó đến hàng chục.`
    };
  },

  'g2_add_sub_carry': () => {
    const isAdd = Math.random() > 0.5;
    let a, b, ans;
    
    if (isAdd) {
      // a + b < 100, unit digits sum >= 10
      const a_units = randomInt(1, 9);
      const b_units = randomInt(10 - a_units, 9); // Ensure carry
      const a_tens = randomInt(1, 7);
      const b_tens = randomInt(0, 8 - a_tens); // Ensure sum < 100
      a = a_tens * 10 + a_units;
      b = b_tens * 10 + b_units;
      ans = a + b;
    } else {
      // a - b, borrow needed. a_units < b_units
      const a_tens = randomInt(2, 9);
      const b_tens = randomInt(1, a_tens - 1);
      const a_units = randomInt(0, 8);
      const b_units = randomInt(a_units + 1, 9); // Ensure borrow
      a = a_tens * 10 + a_units;
      b = b_tens * 10 + b_units;
      ans = a - b;
    }

    return {
      type: QuestionType.SingleChoice,
      questionText: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
      correctAnswer: ans.toString(),
      options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 10)]),
      explanation: isAdd ? `Hàng đơn vị cộng lại lớn hơn 10, nhớ 1 sang hàng chục.` : `Hàng đơn vị không trừ được, mượn 1 chục.`
    };
  },

  'g2_units_mass_len': () => {
    const types = [
      { from: 'dm', to: 'cm', factor: 10, name: 'độ dài' },
      { from: 'm', to: 'dm', factor: 10, name: 'độ dài' },
      { from: 'cm', to: 'mm', factor: 10, name: 'độ dài' },
    ];
    const type = types[randomInt(0, types.length - 1)];
    const isForward = Math.random() > 0.5; // dm -> cm or cm -> dm

    let val, result, text;
    if (isForward) {
      val = randomInt(1, 20);
      result = val * type.factor;
      text = `${val} ${type.from} = ... ${type.to}`;
    } else {
      result = randomInt(1, 20);
      val = result * type.factor;
      text = `${val} ${type.to} = ... ${type.from}`;
    }

    return {
      type: QuestionType.SingleChoice,
      questionText: text,
      correctAnswer: result.toString(),
      options: shuffleArray([result.toString(), ...generateWrongAnswers(result, 3, 10)]),
      explanation: `1 ${type.from} = ${type.factor} ${type.to}.`
    };
  },

  // --- Grade 4 Generators ---

  'g4_arithmetic_10000': () => {
    const op = randomInt(0, 3); // 0:+, 1:-, 2:*, 3:/
    let a=0, b=0, ans=0, symbol='';

    switch(op) {
      case 0: // Add
        a = randomInt(1000, 8000);
        b = randomInt(100, 9999 - a);
        ans = a + b;
        symbol = '+';
        break;
      case 1: // Sub
        a = randomInt(2000, 9999);
        b = randomInt(100, a - 100);
        ans = a - b;
        symbol = '-';
        break;
      case 2: // Mul (Keep simple enough for 20 mins context, e.g., 2-3 digits x 1 digit)
        a = randomInt(100, 999);
        b = randomInt(2, 9);
        ans = a * b;
        symbol = 'x';
        break;
      case 3: // Div (No remainder for simplicity in basic test)
        b = randomInt(2, 9);
        ans = randomInt(100, 1000);
        a = ans * b;
        symbol = ':';
        break;
    }

    return {
      type: QuestionType.SingleChoice,
      questionText: `Tính: ${a} ${symbol} ${b} = ?`,
      correctAnswer: ans.toString(),
      options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 50)]),
      explanation: `Thực hiện tính toán cẩn thận từ phải sang trái (với cộng/trừ/nhân) hoặc trái sang phải (với chia).`
    };
  },

  'g4_geometry_2d': () => {
    // 40% chance for Composite Shape (L-shape, joined rects), 60% basic
    const isComposite = Math.random() > 0.6;

    // Fix: Increased SVG width and viewBox to prevent text clipping
    // Fix: Shifted X coordinates to allow space for left-side labels

    if (isComposite) {
       // Generate two joined rectangles
       const hA = randomInt(4, 8); // Height of left part
       const wA = randomInt(3, 6); // Width of left part
       
       const hB = randomInt(2, hA - 1); // Height of right part (shorter)
       const wB = randomInt(3, 6); // Width of right part

       const isArea = Math.random() > 0.5;
       const area = (hA * wA) + (hB * wB);
       // Perimeter: 2*hA + 2*wA + 2*wB (Derived from bounding box logic)
       const perimeter = (hA * 2) + (wA * 2) + (wB * 2);
       const ans = isArea ? area : perimeter;

       const scale = 15;
       const startX = 50; // Shift right by 50px to fit left labels
       const startY = 200;

       // Path definition
       const path = `
         M ${startX} ${startY - (hA*scale)} 
         L ${startX + wA*scale} ${startY - (hA*scale)} 
         L ${startX + wA*scale} ${startY - (hB*scale)} 
         L ${startX + (wA+wB)*scale} ${startY - (hB*scale)} 
         L ${startX + (wA+wB)*scale} ${startY} 
         L ${startX} ${startY} 
         Z
       `;
       
       // Labels
       const labels = [
         { x: startX - 35, y: startY - (hA*scale)/2, text: `${hA}cm` }, // Left height
         { x: startX + (wA*scale)/2 - 10, y: startY - (hA*scale) - 5, text: `${wA}cm` }, // Top A width
         { x: startX + wA*scale + (wB*scale)/2 - 10, y: startY - (hB*scale) - 5, text: `${wB}cm` }, // Top B width
         { x: startX + (wA+wB)*scale + 5, y: startY - (hB*scale)/2, text: `${hB}cm` } // Right B height
       ];

       const svgContent = `
         <svg width="300" height="220" viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg">
           <path d="${path}" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" />
           ${labels.map(l => `<text x="${l.x}" y="${l.y}" font-family="sans-serif" font-size="14" fill="#0f172a">${l.text}</text>`).join('')}
         </svg>
       `;

       return {
         type: QuestionType.SingleChoice,
         questionText: `Hình vẽ bên dưới được tạo bởi hai hình chữ nhật ghép lại. Hình 1 cao ${hA}cm rộng ${wA}cm, hình 2 cao ${hB}cm rộng ${wB}cm. Tính ${isArea ? 'diện tích' : 'chu vi'} của toàn bộ hình?`,
         visualSvg: svgContent,
         correctAnswer: ans.toString(),
         options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 15)]),
         explanation: isArea 
           ? `Diện tích = Diện tích hình lớn (${hA}x${wA}) + Diện tích hình nhỏ (${hB}x${wB}) = ${hA*wA} + ${hB*wB} = ${area} cm²`
           : `Chu vi bao quanh hình = Tổng độ dài các cạnh bao quanh.`
       };

    } else {
      // Standard logic
      const isRect = Math.random() > 0.3;
      if (isRect) {
        const w = randomInt(5, 50);
        const h = randomInt(5, 50);
        const isArea = Math.random() > 0.5;
        
        const ans = isArea ? w * h : (w + h) * 2;
        const wrong1 = isArea ? (w + h) * 2 : w * h; 
        
        // Generate Simple SVG (Shifted x=40)
        const svgContent = `
           <svg width="300" height="150" viewBox="0 0 300 150">
             <rect x="40" y="20" width="180" height="100" fill="#fef3c7" stroke="#d97706" stroke-width="3" />
             <text x="120" y="145" font-family="sans-serif" font-size="14">${Math.max(w,h)}m</text>
             <text x="225" y="80" font-family="sans-serif" font-size="14">${Math.min(w,h)}m</text>
           </svg>
        `;

        return {
          type: QuestionType.SingleChoice,
          questionText: `Một hình chữ nhật có chiều dài ${Math.max(w,h)}m và chiều rộng ${Math.min(w,h)}m. ${isArea ? 'Diện tích' : 'Chu vi'} hình đó là bao nhiêu?`,
          visualSvg: svgContent,
          correctAnswer: ans.toString(),
          options: shuffleArray([
            ans.toString(), 
            wrong1.toString(), 
            (ans + randomInt(1, 10)).toString(), 
            (ans - randomInt(1, 10)).toString()
          ]),
          explanation: isArea ? `Diện tích = Dài x Rộng` : `Chu vi = (Dài + Rộng) x 2`
        };
      } else {
        // Square
        const side = randomInt(10, 100);
        const isArea = Math.random() > 0.5;
        const ans = isArea ? side * side : side * 4;
        
        const svgContent = `
           <svg width="250" height="180" viewBox="0 0 250 180">
             <rect x="40" y="25" width="100" height="100" fill="#dcfce7" stroke="#16a34a" stroke-width="3" />
             <text x="80" y="145" font-family="sans-serif" font-size="14">${side}m</text>
             <text x="145" y="80" font-family="sans-serif" font-size="14">${side}m</text>
           </svg>
        `;

        return {
          type: QuestionType.SingleChoice,
          questionText: `Một hình vuông có cạnh ${side}m. ${isArea ? 'Diện tích' : 'Chu vi'} là?`,
          visualSvg: svgContent,
          correctAnswer: ans.toString(),
          options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 20)]),
          explanation: isArea ? `Diện tích HV = Cạnh x Cạnh` : `Chu vi HV = Cạnh x 4`
        };
      }
    }
  },

  'g4_units_complex': () => {
     // e.g. 5m 2cm = ... cm
     const types = ['m', 'kg', 'm2'];
     const type = types[randomInt(0, 2)];
     
     let question = '', ans = 0, exp = '';

     if (type === 'm') {
       const m = randomInt(1, 50);
       const cm = randomInt(1, 99);
       ans = m * 100 + cm;
       question = `${m}m ${cm}cm = ... cm`;
       exp = `1m = 100cm. Vậy ${m}m = ${m*100}cm. Cộng thêm ${cm}cm.`;
     } else if (type === 'kg') {
       const kg = randomInt(1, 20);
       const g = randomInt(1, 999);
       ans = kg * 1000 + g;
       question = `${kg}kg ${g}g = ... g`;
       exp = `1kg = 1000g.`;
     } else { // m2
       const m2 = randomInt(1, 10);
       const dm2 = randomInt(1, 99);
       ans = m2 * 100 + dm2;
       question = `${m2}m² ${dm2}dm² = ... dm²`;
       exp = `1m² = 100dm².`;
     }

     return {
       type: QuestionType.SingleChoice,
       questionText: question,
       correctAnswer: ans.toString(),
       options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 100)]),
       explanation: exp
     };
  },

  'g4_patterns': () => {
    const start = randomInt(1, 50);
    const diff = randomInt(2, 15);
    const seq = [start, start + diff, start + diff * 2, start + diff * 3, start + diff * 4];
    
    const hiddenIndex = randomInt(0, 4);
    const correctAnswer = seq[hiddenIndex];
    
    const displaySeq = seq.map((val, idx) => idx === hiddenIndex ? '...' : val);
    
    return {
      type: QuestionType.ManualInput,
      questionText: `Điền số còn thiếu vào dãy số: ${displaySeq.join(', ')}`,
      correctAnswer: correctAnswer.toString(),
      explanation: `Dãy số tăng dần với khoảng cách là ${diff}.`
    };
  },

  'typing_practice': () => {
    const texts = [
      "Học thầy không tày học bạn.",
      "Có công mài sắt, có ngày nên kim.",
      "Con mèo mà trèo cây cau, hỏi thăm chú chuột đi đâu vắng nhà.",
      "Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.",
      "Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.",
      "Trên trời mây trắng như bông, ở giữa cánh đồng bông trắng như mây.",
      "Lá lành đùm lá rách.",
      "Cái cò đi đón cơn mưa, tối tăm mù mịt ai đưa cò về.",
      "Trăm hay không bằng tay quen.",
      "Đi một ngày đàng, học một sàng khôn."
    ];
    
    const text = texts[randomInt(0, texts.length - 1)];
    
    return {
      type: QuestionType.Typing,
      questionText: "Hãy gõ lại chính xác đoạn văn bản dưới đây:",
      correctAnswer: text,
      explanation: `Luyện tập thường xuyên để gõ nhanh hơn nhé!`
    };
  }
};

export const generateQuestions = (topicIds: string[], count: number): Question[] => {
  const questions: Question[] = [];
  const questionsPerTopic = Math.ceil(count / topicIds.length);

  topicIds.forEach(tid => {
    const generator = generators[tid];
    if (generator) {
      for (let i = 0; i < questionsPerTopic; i++) {
        const baseQ = generator();
        questions.push({
          id: Math.random().toString(36).substring(7),
          topicId: tid,
          ...baseQ
        });
      }
    }
  });

  // Trim to exact count and shuffle
  return shuffleArray(questions).slice(0, count);
};

export const getTopicsByGrade = (grade: Grade) => TOPICS.filter(t => t.grade === grade);
