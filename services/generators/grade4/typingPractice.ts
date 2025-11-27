import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const TYPING_TEXTS = [
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

// Normalize Vietnamese text to NFC form (composed characters)
// This ensures diacritics are in the correct position for Vietnamese IME
const normalizeVietnamese = (text: string): string => {
    return text.normalize('NFC');
};

export const generateTypingPractice = (): Omit<Question, 'id' | 'topicId'> => {
    const rawText = TYPING_TEXTS[randomInt(0, TYPING_TEXTS.length - 1)];
    const text = normalizeVietnamese(rawText);

    return {
        type: QuestionType.Typing,
        questionText: "Hãy gõ lại chính xác đoạn văn bản dưới đây:",
        correctAnswer: text,
        explanation: `Luyện tập thường xuyên để gõ nhanh hơn nhé!`
    };
};
