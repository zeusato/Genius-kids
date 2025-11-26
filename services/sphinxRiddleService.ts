import { RiddleData, RiddleDifficulty, RiddleCategory, SphinxProfile } from '@/types';
import vnRiddlesData from '@/riddle/data/vnRiddle.json';
import enRiddlesData from '@/riddle/data/enRiddle.json';

// Cast imported data to RiddleData[]
const vnRiddlesRaw = vnRiddlesData as RiddleData[];
const enRiddlesRaw = enRiddlesData as RiddleData[];

// Cache for loaded riddles
let vnRiddles: RiddleData[] | null = null;
let enRiddles: RiddleData[] | null = null;

// Get all riddles by category
export const getRiddlesByCategory = async (category: RiddleCategory): Promise<RiddleData[]> => {
    // Initialize caches on first call
    if (!vnRiddles) {
        vnRiddles = vnRiddlesRaw;
    }
    if (!enRiddles) {
        enRiddles = enRiddlesRaw;
    }

    if (category === RiddleCategory.VN_RIDDLE) {
        return vnRiddles;
    } else if (category === RiddleCategory.EN_RIDDLE) {
        return enRiddles;
    } else { // MIX
        return [...vnRiddles, ...enRiddles];
    }
};

// Filter riddles by difficulty and exclude answered ones
export const filterRiddles = (
    riddles: RiddleData[],
    difficulty: RiddleDifficulty,
    answeredIds: string[]
): RiddleData[] => {
    return riddles.filter(
        (riddle) => riddle.difficulty === difficulty && !answeredIds.includes(riddle.rID)
    );
};

// Get random riddle from pool
export const getRandomRiddle = (riddles: RiddleData[]): RiddleData | null => {
    if (riddles.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * riddles.length);
    return riddles[randomIndex];
};

// Flexible answer checking with partial matching
export const checkAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    // Normalize both answers: lowercase, trim, remove extra spaces
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');

    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);

    // Split correct answers by comma for multiple valid answers
    const correctVariants = normalizedCorrect.split(',').map(v => v.trim());

    // Check each variant
    for (const variant of correctVariants) {
        // 1. Exact match
        if (normalizedUser === variant) {
            return true;
        }

        // 2. Partial match: correct answer contains user answer (e.g., "chó" in "con chó")
        if (variant.includes(normalizedUser) && normalizedUser.length >= 2) {
            return true;
        }

        // 3. Reverse partial: user answer contains correct answer (user gave more detail)
        if (normalizedUser.includes(variant) && variant.length >= 2) {
            return true;
        }

        // 4. Word-level matching (filter out common stop words)
        const stopWords = ['con', 'cái', 'quả', 'the', 'a', 'an', 'củ', 'hoa', 'cây'];
        const getUserWords = () => normalizedUser.split(' ').filter(w => !stopWords.includes(w));
        const getCorrectWords = () => variant.split(' ').filter(w => !stopWords.includes(w));

        const userWords = getUserWords();
        const correctWords = getCorrectWords();

        // If at least one significant word matches
        if (userWords.some(uw => correctWords.includes(uw)) && userWords.length > 0) {
            return true;
        }
    }

    return false;
};

// Load Sphinx Profile for a student
export const loadSphinxProfile = (studentId: string): SphinxProfile => {
    const key = `sphinx_profile_${studentId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error parsing Sphinx profile:', error);
        }
    }

    // Return default profile
    return {
        answeredRiddleIds: [],
        penaltyActive: false,
    };
};

// Save Sphinx Profile
export const saveSphinxProfile = (studentId: string, profile: SphinxProfile): void => {
    const key = `sphinx_profile_${studentId}`;
    localStorage.setItem(key, JSON.stringify(profile));
};

// Mark riddle as answered
export const markRiddleAsAnswered = (studentId: string, riddleId: string): void => {
    const profile = loadSphinxProfile(studentId);
    if (!profile.answeredRiddleIds.includes(riddleId)) {
        profile.answeredRiddleIds.push(riddleId);
        saveSphinxProfile(studentId, profile);
    }
};

// Set penalty
export const setPenalty = (studentId: string): void => {
    const profile = loadSphinxProfile(studentId);
    profile.penaltyActive = true;
    saveSphinxProfile(studentId, profile);
};

// Clear penalty (used when next reward is skipped)
export const clearPenalty = (studentId: string): void => {
    const profile = loadSphinxProfile(studentId);
    profile.penaltyActive = false;
    saveSphinxProfile(studentId, profile);
};

// Check if student has penalty active
export const hasPenalty = (studentId: string): boolean => {
    const profile = loadSphinxProfile(studentId);
    return profile.penaltyActive;
};

// Get statistics
export const getSphinxStats = (
    studentId: string,
    category: RiddleCategory,
    difficulty: RiddleDifficulty
): { total: number; answered: number; remaining: number } => {
    const profile = loadSphinxProfile(studentId);
    // This is async in real use, for now return placeholder
    // In real implementation, you'd load riddles and count
    return {
        total: 0,
        answered: profile.answeredRiddleIds.length,
        remaining: 0,
    };
};

// Dialogues for Sphinx
export const sphinxDialogues = {
    challenge: [
        "Dám thử sức với ta không, người trẻ tuổi?",
        "Ta có những câu đố khó nhằn đây!",
        "Hãy chứng minh trí tuệ của ngươi!",
        "Ngươi có đủ thông minh để vượt qua ta không?",
        "Ta sẽ thử thách ngươi bằng những câu đố của mình!",
        "Hãy chuẩn bị tinh thần, những câu đố của ta không dễ dàng!",
        "Ngươi tự tin lắm à? Hãy thử sức xem!",
        "Ta đang chờ đợi một đối thủ xứng tầm!",
        "Liệu ngươi có thể giải được câu đố của ta?",
        "Hãy cho ta thấy khả năng của ngươi!",
    ],
    invitation: [
        "Hãy lắng nghe câu đố của ta...",
        "Suy nghĩ thật kỹ trước khi trả lời nhé!",
        "Câu đố này sẽ thử thách trí tuệ của ngươi!",
        "Đây là câu hỏi dành cho ngươi...",
        "Ta muốn xem ngươi giải quyết câu này như thế nào!",
        "Hãy tập trung và suy nghĩ!",
        "Câu đố đang chờ lời giải của ngươi đây!",
        "Ngươi đã sẵn sàng chứ?",
        "Hãy để ta kiểm tra kiến thức của ngươi!",
        "Lời giải đáp của ngươi là gì?",
    ],
    success: [
        "Tuyệt vời! Ngươi đã trả lời đúng!",
        "Chính xác! Ta ấn tượng đấy!",
        "Xuất sắc! Ngươi thông minh thật!",
        "Đúng rồi! Ngươi làm ta ngạc nhiên!",
        "Tài giỏi lắm! Hãy nhận phần thưởng của ngươi!",
        "Hoàn hảo! Trí tuệ của ngươi không tầm thường!",
        "Đáp án chính xác! Ta phải khen ngợi ngươi!",
        "Giỏi lắm! Ngươi đã vượt qua thử thách!",
        "Tuyệt! Ngơi thật sự hiểu được câu đố!",
        "Ta bái phục! Ngươi quả là thông minh!",
    ],
    failure: [
        "Tiếc quá! Câu trả lời chưa chính xác!",
        "Sai rồi! Hãy cố gắng hơn lần sau!",
        "Chưa đúng! Ngươi cần học hỏi nhiều hơn!",
        "Thật đáng tiếc! Đó không phải đáp án đúng!",
        "Không chính xác! Ta sẽ phạt ngươi đây!",
        "Sai lầm! Hãy suy nghĩ kỹ hơn!",
        "Chưa phải! Ngươi cần luyện tập thêm!",
        "Không đúng! Lần sau hãy cẩn thận hơn!",
        "Tiếc quá! Ngươi đã trả lời sai!",
        "Chưa được! Hãy cố gắng thêm nhé!",
    ],
};

// Get random dialogue
export const getRandomDialogue = (type: 'challenge' | 'invitation' | 'success' | 'failure'): string => {
    const dialogues = sphinxDialogues[type];
    const randomIndex = Math.floor(Math.random() * dialogues.length);
    return dialogues[randomIndex];
};
