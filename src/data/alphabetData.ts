// Dữ liệu bảng chữ cái Tiếng Anh cho mục Mầm non.
// Mỗi chữ kèm 1 từ ví dụ (Anh + Việt) và emoji minh họa để bé liên tưởng.

export interface AlphabetLetter {
    id: string;        // 'a' .. 'z'
    upper: string;     // 'A'
    lower: string;     // 'a'
    exampleEn: string; // 'Apple'
    exampleVi: string; // 'Quả táo'
    emoji: string;     // 🍎
}

export const ALPHABET_DATA: AlphabetLetter[] = [
    { id: 'a', upper: 'A', lower: 'a', exampleEn: 'Apple', exampleVi: 'Quả táo', emoji: '🍎' },
    { id: 'b', upper: 'B', lower: 'b', exampleEn: 'Ball', exampleVi: 'Quả bóng', emoji: '⚽' },
    { id: 'c', upper: 'C', lower: 'c', exampleEn: 'Cat', exampleVi: 'Con mèo', emoji: '🐱' },
    { id: 'd', upper: 'D', lower: 'd', exampleEn: 'Dog', exampleVi: 'Con chó', emoji: '🐶' },
    { id: 'e', upper: 'E', lower: 'e', exampleEn: 'Elephant', exampleVi: 'Con voi', emoji: '🐘' },
    { id: 'f', upper: 'F', lower: 'f', exampleEn: 'Fish', exampleVi: 'Con cá', emoji: '🐟' },
    { id: 'g', upper: 'G', lower: 'g', exampleEn: 'Goat', exampleVi: 'Con dê', emoji: '🐐' },
    { id: 'h', upper: 'H', lower: 'h', exampleEn: 'Hat', exampleVi: 'Cái mũ', emoji: '🎩' },
    { id: 'i', upper: 'I', lower: 'i', exampleEn: 'Ice cream', exampleVi: 'Kem', emoji: '🍦' },
    { id: 'j', upper: 'J', lower: 'j', exampleEn: 'Juice', exampleVi: 'Nước ép', emoji: '🧃' },
    { id: 'k', upper: 'K', lower: 'k', exampleEn: 'Kite', exampleVi: 'Cái diều', emoji: '🪁' },
    { id: 'l', upper: 'L', lower: 'l', exampleEn: 'Lion', exampleVi: 'Sư tử', emoji: '🦁' },
    { id: 'm', upper: 'M', lower: 'm', exampleEn: 'Monkey', exampleVi: 'Con khỉ', emoji: '🐵' },
    { id: 'n', upper: 'N', lower: 'n', exampleEn: 'Nest', exampleVi: 'Cái tổ', emoji: '🪺' },
    { id: 'o', upper: 'O', lower: 'o', exampleEn: 'Orange', exampleVi: 'Quả cam', emoji: '🍊' },
    { id: 'p', upper: 'P', lower: 'p', exampleEn: 'Pig', exampleVi: 'Con heo', emoji: '🐷' },
    { id: 'q', upper: 'Q', lower: 'q', exampleEn: 'Queen', exampleVi: 'Nữ hoàng', emoji: '👑' },
    { id: 'r', upper: 'R', lower: 'r', exampleEn: 'Rabbit', exampleVi: 'Con thỏ', emoji: '🐰' },
    { id: 's', upper: 'S', lower: 's', exampleEn: 'Sun', exampleVi: 'Mặt trời', emoji: '☀️' },
    { id: 't', upper: 'T', lower: 't', exampleEn: 'Tiger', exampleVi: 'Con hổ', emoji: '🐯' },
    { id: 'u', upper: 'U', lower: 'u', exampleEn: 'Umbrella', exampleVi: 'Cái ô', emoji: '☂️' },
    { id: 'v', upper: 'V', lower: 'v', exampleEn: 'Violin', exampleVi: 'Đàn vĩ cầm', emoji: '🎻' },
    { id: 'w', upper: 'W', lower: 'w', exampleEn: 'Watermelon', exampleVi: 'Dưa hấu', emoji: '🍉' },
    { id: 'x', upper: 'X', lower: 'x', exampleEn: 'Xylophone', exampleVi: 'Đàn mộc cầm', emoji: '🎼' },
    { id: 'y', upper: 'Y', lower: 'y', exampleEn: 'Yo-yo', exampleVi: 'Con quay', emoji: '🪀' },
    { id: 'z', upper: 'Z', lower: 'z', exampleEn: 'Zebra', exampleVi: 'Ngựa vằn', emoji: '🦓' },
];
