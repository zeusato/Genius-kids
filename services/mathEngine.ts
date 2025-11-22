import { Grade, Question, Topic, QuestionType } from '../types';
import { generateG2Units } from './generators/grade2/units';
import { generateG2Time } from './generators/grade2/time';
import { generateG2Geometry } from './generators/grade2/geometry';
import { generateG2Arithmetic } from './generators/grade2/arithmetic';
import { generateTypingGrade2 } from './generators/grade2/typing';
import { generateTypingGrade3 } from './generators/grade3/typing';
import { generateTypingGrade4 } from './generators/grade4/typing';
import { generateTypingGrade5 } from './generators/grade5/typing';
import { generateNumbers5 } from './generators/grade1/numbers5';
import { generateNumbers10 } from './generators/grade1/numbers10';
import { generateAddition10 } from './generators/grade1/addition10';
import { generateSubtraction10 } from './generators/grade1/subtraction10';
import { generateNumbers20 } from './generators/grade1/numbers20';
import { generateOperations20 } from './generators/grade1/operations20';
import { generateNumbers100 } from './generators/grade1/numbers100';
import { generateLength } from './generators/grade1/length';
import { generateTime } from './generators/grade1/time';
import { generateGeometry as generateG1Geometry } from './generators/grade1/geometry';
import { generateWordProblems as generateG1WordProblems } from './generators/grade1/wordProblems';
import { generateLargeNumbers } from './generators/grade4/largeNumbers';
import { generateAddSub } from './generators/grade4/additions';
import { generateMultiplication } from './generators/grade4/multiplications';
import { generateDivision } from './generators/grade4/divisions';
import { generateUnits } from './generators/grade4/units';
import { generateAngles } from './generators/grade4/angles';
import { generateLines } from './generators/grade4/lines';
import { generateFractions } from './generators/grade4/fractions';
import { generateStatistics } from './generators/grade4/statistics';
import { generateWordProblems } from './generators/grade4/wordProblems';
import { generateGeometryG4 } from './generators/grade4/geometry';
import { generateG3Numbers } from './generators/grade3/numbers';
import { generateG3Arithmetic } from './generators/grade3/arithmetic';
import { generateG3Multiplication } from './generators/grade3/multiplication';
import { generateG3Division } from './generators/grade3/division';
import { generateG3Geometry } from './generators/grade3/geometry';
import { generateG3Measurements } from './generators/grade3/measurements';
import { generateG3WordProblems } from './generators/grade3/wordProblems';
import { generateG5Numbers } from './generators/grade5/numbers';
import { generateG5DecimalOps } from './generators/grade5/decimalOps';
import { generateG5Ratios } from './generators/grade5/ratios';
import { generateG5Fractions } from './generators/grade5/fractions';
import { generateG5Geometry } from './generators/grade5/geometry';
import { generateG5Measurements } from './generators/grade5/measurements';
import { generateG5WordProblems } from './generators/grade5/wordProblems';

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

// Helper to create a "select wrong answer" question
// Takes 3 correct expressions/values and 1 wrong one
export const createSelectWrongQuestion = (
  correctAnswers: string[],  // 3 correct choices
  wrongAnswer: string,        // 1 wrong choice to select
  questionText: string,
  explanation: string
): Omit<Question, 'id' | 'topicId'> => {
  return {
    type: QuestionType.SelectWrong,
    questionText: `Chọn đáp án SAI: ${questionText}`,
    correctAnswer: wrongAnswer, // The "correct" choice is the wrong answer
    options: shuffleArray([...correctAnswers, wrongAnswer]),
    explanation
  };
};

// Helper to create a multiple select question
export const createMultipleSelectQuestion = (
  correctAnswers: string[],
  wrongAnswers: string[],
  questionText: string,
  explanation: string
): Omit<Question, 'id' | 'topicId'> => {
  const allOptions = shuffleArray([...correctAnswers, ...wrongAnswers]);
  return {
    type: QuestionType.MultipleSelect,
    questionText,
    correctAnswers,
    options: allOptions,
    explanation
  };
};

// --- Topic Registry ---

export const TOPICS: Topic[] = [
  // Grade 1
  { id: 'g1_numbers_5', title: 'Số phạm vi 5', grade: Grade.Grade1, description: 'Đếm, so sánh, sắp xếp 1-5' },
  { id: 'g1_numbers_10', title: 'Số phạm vi 10', grade: Grade.Grade1, description: 'Đếm, so sánh, tách số 0-10' },
  { id: 'g1_addition_10', title: 'Phép cộng phạm vi 10', grade: Grade.Grade1, description: 'Cộng bằng hình và số' },
  { id: 'g1_subtraction_10', title: 'Phép trừ phạm vi 10', grade: Grade.Grade1, description: 'Trừ bằng hình và số' },
  { id: 'g1_numbers_20', title: 'Số phạm vi 20', grade: Grade.Grade1, description: 'Đọc, viết, so sánh 11-20' },
  { id: 'g1_operations_20', title: 'Cộng trừ phạm vi 20', grade: Grade.Grade1, description: 'Cộng trừ có nhớ đơn giản' },
  { id: 'g1_numbers_100', title: 'Số phạm vi 100', grade: Grade.Grade1, description: 'Nhận biết số tròn chục' },
  { id: 'g1_length', title: 'Độ dài (cm)', grade: Grade.Grade1, description: 'Nhận biết, đo, so sánh' },
  { id: 'g1_time', title: 'Thời gian', grade: Grade.Grade1, description: 'Buổi trong ngày, ngày trong tuần' },
  { id: 'g1_geometry', title: 'Hình học trực quan', grade: Grade.Grade1, description: 'Nhận dạng hình cơ bản' },
  { id: 'g1_word_problems', title: 'Toán lời văn 1 bước', grade: Grade.Grade1, description: 'Thêm, bớt, tổng, còn lại' },

  // Grade 2
  { id: 'g2_add_sub_no_carry', title: 'Cộng trừ không nhớ (Phạm vi 100)', grade: Grade.Grade2, description: 'Phép tính đơn giản không cần nhớ' },
  { id: 'g2_add_sub_carry', title: 'Cộng trừ có nhớ (Phạm vi 100)', grade: Grade.Grade2, description: 'Phép tính cần mượn hoặc nhớ' },
  { id: 'g2_arithmetic_advanced', title: 'Toán đố & Tư duy số học', grade: Grade.Grade2, description: 'Tìm ẩn số, so sánh, toán lời văn' },
  { id: 'g2_units_measure', title: 'Đại lượng (Độ dài, Khối lượng, Dung tích)', grade: Grade.Grade2, description: 'Đổi đơn vị, xem cân, đo độ dài' },
  { id: 'g2_time_calendar', title: 'Thời gian & Lịch', grade: Grade.Grade2, description: 'Xem đồng hồ, đọc lịch ngày tháng' },
  { id: 'g2_geometry_basic', title: 'Hình học (Phẳng & Khối)', grade: Grade.Grade2, description: 'Nhận diện hình, đếm hình' },
  { id: 'g2_typing', title: 'Luyện gõ phím', grade: Grade.Grade2, description: 'Luyện gõ 10 ngón và chính tả' },

  // Grade 3
  { id: 'g3_numbers', title: 'Số và phép tính (1000-10000)', grade: Grade.Grade3, description: 'Đọc, viết, so sánh số 4 chữ số' },
  { id: 'g3_arithmetic', title: 'Cộng trừ (1000-10000)', grade: Grade.Grade3, description: 'Cộng trừ có nhớ, tính nhanh' },
  { id: 'g3_multiplication', title: 'Nhân (2-3 chữ số)', grade: Grade.Grade3, description: 'Nhân số lớn, tính nhanh' },
  { id: 'g3_division', title: 'Chia (2-3 chữ số)', grade: Grade.Grade3, description: 'Chia có dư, chia đều' },
  { id: 'g3_geometry', title: 'Hình học cơ bản', grade: Grade.Grade3, description: 'Đoạn thẳng, góc vuông, chu vi' },
  { id: 'g3_measurements', title: 'Đo lường', grade: Grade.Grade3, description: 'Độ dài, khối lượng, dung tích, thời gian' },
  { id: 'g3_word_problems', title: 'Toán lời văn', grade: Grade.Grade3, description: 'Bài toán 1-2 bước' },
  { id: 'g3_typing', title: 'Luyện gõ phím', grade: Grade.Grade3, description: 'Luyện gõ 10 ngón và chính tả' },

  // Grade 4
  { id: 'g4_large_numbers', title: 'Số lớn', grade: Grade.Grade4, description: 'Đọc, viết, so sánh, làm tròn số lớn' },
  { id: 'g4_add_sub', title: 'Cộng trừ số lớn', grade: Grade.Grade4, description: 'Tính, tìm x, so sánh, toán lời văn' },
  { id: 'g4_multiplication', title: 'Nhân số lớn', grade: Grade.Grade4, description: 'Nhân lớn, mẹo tính, tìm thừa số, toán lời văn' },
  { id: 'g4_division', title: 'Chia số lớn', grade: Grade.Grade4, description: 'Chia lớn, chia có dư, tìm số, toán lời văn' },
  { id: 'g4_units', title: 'Đơn vị đo đại lượng', grade: Grade.Grade4, description: 'Độ dài, Khối lượng, Thời gian, Diện tích' },
  { id: 'g4_angles', title: 'Góc', grade: Grade.Grade4, description: 'Nhận dạng, đo góc, so sánh góc' },
  { id: 'g4_lines', title: 'Đường thẳng', grade: Grade.Grade4, description: 'Song song, vuông góc' },
  { id: 'g4_geometry_2d', title: 'Hình học phẳng & Ghép hình', grade: Grade.Grade4, description: 'Chu vi, diện tích hình chữ nhật, hình vuông, hình ghép' },
  { id: 'g4_fractions', title: 'Phân số cơ bản', grade: Grade.Grade4, description: 'Nhận biết, viết, so sánh phân số' },
  { id: 'g4_statistics', title: 'Thống kê', grade: Grade.Grade4, description: 'Đọc biểu đồ, bảng số liệu' },
  { id: 'g4_word_problems', title: 'Toán lời văn', grade: Grade.Grade4, description: 'Bài toán 2-3 bước' },
  { id: 'g4_patterns', title: 'Tìm quy luật dãy số', grade: Grade.Grade4, description: 'Điền số còn thiếu vào vị trí bất kỳ' },
  { id: 'typing_practice', title: 'Tập đánh máy (Văn bản)', grade: Grade.Grade4, description: 'Luyện gõ 10 ngón và chính tả' },

  // Grade 5
  { id: 'g5_numbers', title: 'Số tự nhiên & Số thập phân', grade: Grade.Grade5, description: 'Đọc, viết, so sánh số lớn và số thập phân' },
  { id: 'g5_decimal_ops', title: 'Phép tính số thập phân', grade: Grade.Grade5, description: 'Cộng, trừ, nhân, chia số thập phân' },
  { id: 'g5_ratios', title: 'Tỉ số - Tỉ lệ - Phần trăm', grade: Grade.Grade5, description: 'Tỉ số, tỉ lệ thuận, phần trăm, giảm giá' },
  { id: 'g5_fractions', title: 'Phân số nâng cao', grade: Grade.Grade5, description: 'Quy đồng, phép tính, chuyển đổi' },
  { id: 'g5_geometry', title: 'Hình học nâng cao', grade: Grade.Grade5, description: 'Hình bình hành, hình tròn, thể tích' },
  { id: 'g5_measurements', title: 'Đo lường nâng cao', grade: Grade.Grade5, description: 'Đổi đơn vị, vận tốc, quãng đường' },
  { id: 'g5_word_problems', title: 'Toán lời văn nâng cao', grade: Grade.Grade5, description: 'Tổng-hiệu-tỉ, chuyển động, năng suất' },
  { id: 'g5_typing', title: 'Luyện gõ phím', grade: Grade.Grade5, description: 'Luyện gõ 10 ngón và chính tả' },
];

// --- Generators ---

const generators: Record<string, () => Omit<Question, 'id' | 'topicId'>> = {
  // --- Grade 1 Generators ---
  'g1_numbers_5': generateNumbers5,
  'g1_numbers_10': generateNumbers10,
  'g1_addition_10': generateAddition10,
  'g1_subtraction_10': generateSubtraction10,
  'g1_numbers_20': generateNumbers20,
  'g1_operations_20': generateOperations20,
  'g1_numbers_100': generateNumbers100,
  'g1_length': generateLength,
  'g1_time': generateTime,
  'g1_geometry': generateG1Geometry,
  'g1_word_problems': generateG1WordProblems,

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

  'g2_units_measure': generateG2Units,
  'g2_arithmetic_advanced': generateG2Arithmetic,
  'g2_time_calendar': generateG2Time,
  'g2_geometry_basic': generateG2Geometry,
  'g2_typing': generateTypingGrade2,

  // --- Grade 3 Generators ---
  'g3_numbers': generateG3Numbers,
  'g3_arithmetic': generateG3Arithmetic,
  'g3_multiplication': generateG3Multiplication,
  'g3_division': generateG3Division,
  'g3_geometry': generateG3Geometry,
  'g3_measurements': generateG3Measurements,
  'g3_word_problems': generateG3WordProblems,
  'g3_typing': generateTypingGrade3,

  // --- Grade 5 Generators ---
  'g5_numbers': generateG5Numbers,
  'g5_decimal_ops': generateG5DecimalOps,
  'g5_ratios': generateG5Ratios,
  'g5_fractions': generateG5Fractions,
  'g5_geometry': generateG5Geometry,
  'g5_measurements': generateG5Measurements,
  'g5_word_problems': generateG5WordProblems,
  'g5_typing': generateTypingGrade5,

  // --- Grade 4 Generators ---
  'g4_large_numbers': generateLargeNumbers,
  'g4_add_sub': generateAddSub,
  'g4_multiplication': generateMultiplication,
  'g4_division': generateDivision,
  'g4_units': generateUnits,
  'g4_angles': generateAngles,
  'g4_lines': generateLines,
  'g4_fractions': generateFractions,
  'g4_statistics': generateStatistics,
  'g4_word_problems': generateWordProblems,
  'g4_geometry_2d': generateGeometryG4,


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
      "Đi một ngày đàng, học một sàng khôn.",
      "Ăn quả nhớ kẻ trồng cây.",
      "Uống nước nhớ nguồn.",
      "Gần mực thì đen, gần đèn thì sáng.",
      "Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.",
      "Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.",
      "Chị ngã em nâng.",
      "Máu chảy ruột mềm.",
      "Anh em như thể tay chân.",
      "Khôn ngoan đối đáp người ngoài, gà cùng một mẹ chớ hoài đá nhau.",
      "Nhiễu điều phủ lấy giá gương, người trong một nước phải thương nhau cùng.",
      "Thất bại là mẹ thành công.",
      "Cái nết đánh chết cái đẹp.",
      "Tốt gỗ hơn tốt nước sơn.",
      "Đói cho sạch, rách cho thơm.",
      "Giấy rách phải giữ lấy lề.",
      "Thương người như thể thương thân.",
      "Một con ngựa đau cả tàu bỏ cỏ.",
      "Có chí thì nên.",
      "Lửa thử vàng, gian nan thử sức.",
      "Nước chảy đá mòn.",
      "Kiến tha lâu cũng đầy tổ.",
      "Học, học nữa, học mãi.",
      "Tiên học lễ, hậu học văn.",
      "Muốn biết phải hỏi, muốn giỏi phải học.",
      "Dốt đến đâu học lâu cũng biết.",
      "Không thầy đố mày làm nên.",
      "Trọng thầy mới được làm thầy.",
      "Nhất tự vi sư, bán tự vi sư.",
      "Ăn vóc học hay.",
      "Văn hay chữ tốt."
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
  const seenQuestions = new Set<string>(); // Track question text to avoid duplicates

  topicIds.forEach(tid => {
    const generator = generators[tid];
    if (generator) {
      let added = 0;
      let attempts = 0;
      const maxAttempts = questionsPerTopic * 10; // Prevent infinite loop

      while (added < questionsPerTopic && attempts < maxAttempts) {
        attempts++;
        const baseQ = generator();

        // Create unique key for question (questionText + correctAnswer)
        const questionKey = `${baseQ.questionText}|${baseQ.correctAnswer}`;

        // Skip if duplicate question
        if (seenQuestions.has(questionKey)) {
          continue;
        }

        // Ensure options are unique for SingleChoice questions
        if (baseQ.type === QuestionType.SingleChoice && baseQ.options) {
          const uniqueOptions = Array.from(new Set(baseQ.options));

          // If we lost options due to duplicates, skip this question
          if (uniqueOptions.length < 4) {
            continue;
          }

          baseQ.options = uniqueOptions.slice(0, 4);
        }

        // Ensure options are unique for SelectWrong questions
        if (baseQ.type === QuestionType.SelectWrong && baseQ.options) {
          const uniqueOptions = Array.from(new Set(baseQ.options));

          // If we lost options due to duplicates, skip this question
          if (uniqueOptions.length < 4) {
            continue;
          }

          baseQ.options = uniqueOptions.slice(0, 4);
        }

        // Ensure options are unique for MultipleSelect questions
        if (baseQ.type === QuestionType.MultipleSelect && baseQ.options) {
          const uniqueOptions = Array.from(new Set(baseQ.options));

          // If we lost options due to duplicates, skip this question
          // Need at least sum of correct + wrong answers
          const minRequired = (baseQ.correctAnswers?.length || 0) + 2;
          if (uniqueOptions.length < minRequired) {
            continue;
          }

          baseQ.options = uniqueOptions;
        }

        seenQuestions.add(questionKey);
        questions.push({
          id: Math.random().toString(36).substring(7),
          topicId: tid,
          ...baseQ
        });
        added++;
      }
    }
  });

  // Trim to exact count and shuffle
  return shuffleArray(questions).slice(0, count);
};

export const getTopicsByGrade = (grade: Grade) => TOPICS.filter(t => t.grade === grade);
