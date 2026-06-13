// Kho từ tiếng Anh đơn giản cho mục Bảng chữ cái (game "chọn từ bắt đầu bằng chữ...").
// Mỗi từ kèm emoji minh hoạ. Có thể mở rộng thêm bằng Gemini (xem wordBankService).

export interface WordEntry {
    word: string;
    emoji: string;
}

export const BASE_WORD_BANK: Record<string, WordEntry[]> = {
    a: [{ word: 'apple', emoji: '🍎' }, { word: 'ant', emoji: '🐜' }, { word: 'airplane', emoji: '✈️' }, { word: 'avocado', emoji: '🥑' }, { word: 'arm', emoji: '💪' }],
    b: [{ word: 'ball', emoji: '⚽' }, { word: 'banana', emoji: '🍌' }, { word: 'bear', emoji: '🐻' }, { word: 'bee', emoji: '🐝' }, { word: 'book', emoji: '📖' }, { word: 'bus', emoji: '🚌' }],
    c: [{ word: 'cat', emoji: '🐱' }, { word: 'car', emoji: '🚗' }, { word: 'cake', emoji: '🍰' }, { word: 'cow', emoji: '🐄' }, { word: 'cup', emoji: '☕' }],
    d: [{ word: 'dog', emoji: '🐶' }, { word: 'duck', emoji: '🦆' }, { word: 'door', emoji: '🚪' }, { word: 'donut', emoji: '🍩' }, { word: 'drum', emoji: '🥁' }],
    e: [{ word: 'egg', emoji: '🥚' }, { word: 'elephant', emoji: '🐘' }, { word: 'eye', emoji: '👁️' }, { word: 'ear', emoji: '👂' }],
    f: [{ word: 'fish', emoji: '🐟' }, { word: 'frog', emoji: '🐸' }, { word: 'flower', emoji: '🌸' }, { word: 'fire', emoji: '🔥' }, { word: 'fox', emoji: '🦊' }],
    g: [{ word: 'goat', emoji: '🐐' }, { word: 'grape', emoji: '🍇' }, { word: 'gift', emoji: '🎁' }, { word: 'guitar', emoji: '🎸' }, { word: 'girl', emoji: '👧' }],
    h: [{ word: 'hat', emoji: '🎩' }, { word: 'horse', emoji: '🐴' }, { word: 'house', emoji: '🏠' }, { word: 'heart', emoji: '❤️' }, { word: 'hand', emoji: '✋' }],
    i: [{ word: 'ice', emoji: '🧊' }, { word: 'igloo', emoji: '🛖' }, { word: 'island', emoji: '🏝️' }],
    j: [{ word: 'juice', emoji: '🧃' }, { word: 'jam', emoji: '🍓' }, { word: 'jet', emoji: '🛩️' }, { word: 'jellyfish', emoji: '🪼' }],
    k: [{ word: 'key', emoji: '🔑' }, { word: 'kite', emoji: '🪁' }, { word: 'king', emoji: '🤴' }, { word: 'koala', emoji: '🐨' }],
    l: [{ word: 'lion', emoji: '🦁' }, { word: 'leaf', emoji: '🍃' }, { word: 'lemon', emoji: '🍋' }, { word: 'lamp', emoji: '💡' }],
    m: [{ word: 'monkey', emoji: '🐵' }, { word: 'moon', emoji: '🌙' }, { word: 'milk', emoji: '🥛' }, { word: 'mouse', emoji: '🐭' }, { word: 'map', emoji: '🗺️' }],
    n: [{ word: 'nest', emoji: '🪺' }, { word: 'nose', emoji: '👃' }, { word: 'net', emoji: '🥅' }, { word: 'nut', emoji: '🥜' }],
    o: [{ word: 'orange', emoji: '🍊' }, { word: 'owl', emoji: '🦉' }, { word: 'octopus', emoji: '🐙' }, { word: 'onion', emoji: '🧅' }],
    p: [{ word: 'pig', emoji: '🐷' }, { word: 'pizza', emoji: '🍕' }, { word: 'pen', emoji: '🖊️' }, { word: 'panda', emoji: '🐼' }, { word: 'pear', emoji: '🍐' }],
    q: [{ word: 'queen', emoji: '👑' }, { word: 'quilt', emoji: '🧵' }],
    r: [{ word: 'rabbit', emoji: '🐰' }, { word: 'rainbow', emoji: '🌈' }, { word: 'ring', emoji: '💍' }, { word: 'robot', emoji: '🤖' }, { word: 'rose', emoji: '🌹' }],
    s: [{ word: 'sun', emoji: '☀️' }, { word: 'star', emoji: '⭐' }, { word: 'snake', emoji: '🐍' }, { word: 'sock', emoji: '🧦' }, { word: 'ship', emoji: '🚢' }],
    t: [{ word: 'tiger', emoji: '🐯' }, { word: 'tree', emoji: '🌳' }, { word: 'train', emoji: '🚂' }, { word: 'turtle', emoji: '🐢' }, { word: 'tomato', emoji: '🍅' }],
    u: [{ word: 'umbrella', emoji: '☂️' }, { word: 'unicorn', emoji: '🦄' }],
    v: [{ word: 'violin', emoji: '🎻' }, { word: 'van', emoji: '🚐' }, { word: 'vase', emoji: '🏺' }],
    w: [{ word: 'watermelon', emoji: '🍉' }, { word: 'whale', emoji: '🐳' }, { word: 'window', emoji: '🪟' }, { word: 'wolf', emoji: '🐺' }],
    x: [{ word: 'xylophone', emoji: '🎼' }],
    y: [{ word: 'yoyo', emoji: '🪀' }, { word: 'yarn', emoji: '🧶' }],
    z: [{ word: 'zebra', emoji: '🦓' }, { word: 'zoo', emoji: '🦁' }],
};
