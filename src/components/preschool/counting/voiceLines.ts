import { COPY, EN } from './model';
import { LEARN_STORIES, STORY_FINISH_GUIDE } from './learnStories';

const instructions = [
    ...Object.values(COPY).map(item => item.guide),
    'Hai khay đã gộp lại. Chạm từng chiếc bánh để đếm nhé.',
    'Thỏ đã chỉ chỗ cần chọn. Cùng làm lại thật chậm nhé.',
    'Bắt đầu ở chấm xanh. Giữ tay và tô theo đường nét nhé.',
    'Giỏi lắm! Bé đã làm được rồi.',
    'Thử lại nhé. Bé có thể nghe lại hoặc nhờ Thỏ giúp.',
    'Hai bên có bằng nhau không? Chạm dấu bằng nhé.',
    ...['nhiều đồ vật hơn','ít đồ vật hơn','số lớn hơn','số nhỏ hơn','dài hơn','ngắn hơn','cao hơn','thấp hơn','to hơn','nhỏ hơn'].map(term => `Chạm bên ${term} nhé.`),
];
export const VOICE_LINES: Record<string, { file: string; lang: 'vi' | 'en' }> = Object.fromEntries([
    ...instructions.map((text, index) => [text, { file: `counting-guide-${index + 1}`, lang: 'vi' as const }]),
    ...EN.slice(1).map(text => [text, { file: `counting-en-${text}`, lang: 'en' as const }]),
    [COPY.learn.guide, { file: 'counting-learn-intro-v2', lang: 'vi' as const }],
    ...LEARN_STORIES.flatMap(story=>[
        [story.guide, {file:`counting-story-${story.id}`,lang:'vi' as const}],
        [`${story.complete} ${STORY_FINISH_GUIDE}`, {file:`counting-story-${story.id}-done`,lang:'vi' as const}],
    ]),
]);
