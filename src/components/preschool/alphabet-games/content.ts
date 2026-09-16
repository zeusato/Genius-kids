import type { AlphabetActivity, AlphabetWord } from './types';

const raw: [string, string, string][] = [
    ['a','apple','quả táo'],['a','ant','con kiến'],['b','ball','quả bóng'],['b','banana','quả chuối'],['b','bear','con gấu'],
    ['c','cat','con mèo'],['c','car','ô tô'],['c','cake','bánh ngọt'],['d','dog','con chó'],['d','duck','con vịt'],
    ['e','elephant','con voi'],['e','egg','quả trứng'],['f','fish','con cá'],['f','frog','con ếch'],['g','goat','con dê'],['g','grape','quả nho'],
    ['h','hat','cái mũ'],['h','horse','con ngựa'],['i','ice-cream','kem'],['i','ice','viên đá'],['j','juice','nước ép'],['j','jellyfish','con sứa'],
    ['k','kite','cái diều'],['k','key','chìa khóa'],['l','lion','sư tử'],['l','leaf','chiếc lá'],['m','monkey','con khỉ'],['m','moon','mặt trăng'],
    ['n','nest','tổ chim'],['n','net','cái vợt'],['o','orange','quả cam'],['o','owl','con cú'],['p','pig','con heo'],['p','panda','gấu trúc'],
    ['q','queen','nữ hoàng'],['q','quilt','chăn ghép vải'],['r','rabbit','con thỏ'],['r','robot','rô-bốt'],['s','sun','mặt trời'],['s','star','ngôi sao'],
    ['t','tiger','con hổ'],['t','tree','cái cây'],['u','umbrella','cái ô'],['u','unicorn','kỳ lân'],['v','violin','đàn vĩ cầm'],['v','van','xe tải nhỏ'],
    ['w','watermelon','dưa hấu'],['w','whale','cá voi'],['x','xylophone','đàn mộc cầm'],['y','yo-yo','con quay yo-yo'],['y','yarn','cuộn len'],
    ['z','zebra','ngựa vằn'],['z','zipper','khóa kéo'],
];
export const ALPHABET_WORDS: AlphabetWord[] = raw.map(([letterId, id, wordVi]) => ({
    id, letterId, wordEn: id.replace('-', ' '), wordVi,
    art: `${import.meta.env.BASE_URL}preschool/alphabet-games/objects/${id}.webp`,
}));
export const LETTER_IDS = [...'abcdefghijklmnopqrstuvwxyz'];
export const WORDS_BY_LETTER = Object.fromEntries(LETTER_IDS.map(id => [id, ALPHABET_WORDS.filter(word => word.letterId === id)])) as Record<string, AlphabetWord[]>;
export const GAME_COPY: Record<AlphabetActivity, { title: string; eyebrow: string; intro: string; icon: string }> = {
    word: { title: 'Giỏ đồ khám phá', eyebrow: 'TÌM ĐỒ VẬT THEO CHỮ', intro: 'Chọn đồ vật có tên bắt đầu bằng chữ Cáo đưa ra, rồi đặt vào giỏ.', icon: '🧺' },
    match: { title: 'Bưu điện chữ cái', eyebrow: 'GHÉP CHỮ HOA – THƯỜNG', intro: 'Giao từng lá thư chữ hoa đến ngôi nhà có chữ thường tương ứng.', icon: '✉️' },
    pick: { title: 'Ga tàu âm thanh', eyebrow: 'NGHE VÀ TÌM CHỮ', intro: 'Nghe Cáo đọc tên chữ, chọn đúng vé để đưa bạn thú lên tàu.', icon: '🚂' },
};
export const SCENES: Record<AlphabetActivity, string[]> = {
    word: ['word-picnic', 'word-workshop', 'word-beach'], match: ['match-garden', 'match-riverside', 'match-snowy-village'], pick: ['pick-garden', 'pick-forest', 'pick-seaside'],
};
export const sceneUrl = (activity: AlphabetActivity, seed: number) => `${import.meta.env.BASE_URL}preschool/alphabet-games/scenes/${SCENES[activity][Math.abs(seed) % 3]}.webp`;
