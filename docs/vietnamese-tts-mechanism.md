BÁO CÁO: Cơ Chế Text-to-Speech (TTS) Tiếng Việt trong mathgenius-kids

1. File/Module Chứa TTS Core API
   Đường dẫn chính: src/utils/speech.ts (345 dòng)
   Các hàm/hook public chính:

// ====== API CÓ TRỊ NHẤT ======

// Đọc một câu (tự động theo chuỗi 3 tầng: thiết bị → MP3 → Google)
export function speak(
text: string,
opts: SpeakOptions = {}
): boolean

// Interface tham số:
export interface SpeakOptions {
lang?: SpeechLang; // 'vi-VN' | 'en-US', mặc định 'vi-VN'
audioId?: string; // file MP3 cụ thể (chỉ Việt)
rate?: number; // tốc độ đọc, mặc định 0.8 (cho trẻ em)
pitch?: number; // cao độ giọng, mặc định 1.05 (tươi vui)
onEnd?: () => void;
onError?: () => void;
}

// Đọc chuỗi nhiều phần (Anh → Việt) — dùng cho mục mầm non
export function speakSequence(
parts: { text: string; lang?: SpeechLang }[],
opts?: { gapMs?: number; rate?: number; pitch?: number; onEnd?: () => void }
): void

// Dừng tất cả âm thanh đang phát
export function cancelSpeech(): void

// Kiểm tra giọng đã load xong (Chrome/Android tải bất đồng bộ)
export function voicesReady(): boolean

// Lắng nghe sự thay đổi giọng tải sẵn
export function onSpeechAvailabilityChanged(cb: () => void): () => void

// Kiểm tra khả năng đọc được (có giọng hoặc MP3)
export function canSpeak(lang?: SpeechLang, audioId?: string): boolean

// Wrapper tương thích ngược cho code cũ (Hệ Mặt Trời)
export function speakVietnamese(
text: string,
opts?: { audioId?: string; onEnd?: () => void; onError?: () => void }
): boolean

// Lấy giọng theo ngôn ngữ
export function getVoice(lang?: SpeechLang): SpeechSynthesisVoice | null

// Kiểm tra giọng tiếng Việt có sẵn không
export function hasVietnameseVoice(): boolean 2. File Docs Mô Tả Cơ Chế TTS
Đường dẫn: docs/vietnamese-tts-mechanism.md (182 dòng)

Nội dung chính:

Vì sao TTS khó (bẫy): Google chặn 403 từ trình duyệt, thiết bị Android/iPad thiếu giọng vi-VN, Chrome tự ngắt câu dài sau ~15s, endpoint Google chỉ nhận ~200 ký tự
Chuỗi 3 tầng ưu tiên (prioritization chain):
Web Speech API (thiết bị) — vi-VN / en-US, offline, chất lượng tốt
MP3 Built-in (public/audio/vi/<slug>.mp3) — tiền tạo, xương sống cho Mầm Non, offline (PWA cache)
Google Translate TTS — dùng khi không có MP3, qua proxy
Proxy dev: /api/tts (Vite), prod: VITE_TTS_PROXY (Cloudflare Worker) hoặc gọi thẳng Google
Slug rules: "Chữ A" → "chu-a" (loại dấu, đ→d, giữ [a-z0-9 -])
Cắt câu dài >180 ký tự thành nhiều đoạn
keepAlive 9s, hoãn 60ms sau cancel() để Chrome không "nuốt" câu
Offline support: Vite precache audio/\*_/_.mp3 3. Ví Dụ Sử Dụng (2 ví dụ cụ thể)
Ví dụ 1: ColoringActivity (src/components/preschool/ColoringActivity.tsx)
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { speak, speakSequence } from '@/src/utils/speech';

// Sử dụng SpeakButton (UI component):
<SpeakButton
text={instruction} // "Hãy tô quả bóng bay màu đỏ!"
lang="vi-VN"
autoPlay // tự đọc khi nội dung đổi
autoPlayKey={roundIdx} // khóa để biết khi nào đổi
size={26}
/>

// Gọi trực tiếp speak():
speak('Đẹp quá!', { lang: 'vi-VN' });

// Gọi speakSequence() (Anh → Việt):
speakSequence([
{ text: 'Red', lang: 'en-US' },
{ text: 'Đây là màu đỏ. Thử lại nhé!', lang: 'vi-VN' }
]);
Ví dụ 2: ListenAndPick (src/components/preschool/ListenAndPick.tsx)
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { speak } from '@/src/utils/speech';

// Đọc chuỗi: câu lệnh Việt + từ tiếng Anh
const questionParts = [
{ text: 'Hãy chọn chữ', lang: 'vi-VN' },
{ text: 'Apple', lang: 'en-US' },
];

<SpeakButton 
  parts={questionParts}
  autoPlay
  autoPlayKey={roundIdx}
  size={28}
/>

// Khi trả lời sai:
speak('Thử lại nhé!', { lang: 'vi-VN' }); 4. Cơ Chế Dừng/Hủy, Queue, Chọn Giọng, Xử Lý Khi Giọng Chưa Load
Tính năng Cách xử lý
Dừng đọc cancelSpeech() — vô hiệu hoá playToken, dừng audio/speechSynthesis, reset timer keepAlive
Queue (tuần tự) speakSequence() phát từng phần đợi onEnd, khoảng gap gapMs (mặc định 200ms) giữa phần
Chọn giọng getVoice(lang) tra cứu giọng theo locale; lang param trong speak() / SpeakButton
Giọng chưa load SpeakButton với autoPlay chờ voicesReady() rồi mới đọc, có fallback 600ms → vẫn đọc qua MP3/Google
Fallback chuỗi Nếu thiết bị không có giọng vi-VN → rớt sang MP3 (pregeneratedSlugs.json check) → rớt sang Google TTS
Capture token playToken được capture trước mỗi startChain(), check token trước thực hiện để tránh chồng tiếng
Cắt câu dài chunkText(text, 180) cắt câu > 180 ký tự theo ranh giới sentence/clause/word, phát tuần tự 5. Tích Hợp Với Hệ Thống Âm Thanh/Nhạc Nền
Kết luận: HIỆN TẠI CHƯA CÓ TÍCH HỢP TRỰ TIẾP giữa TTS và MusicManager

Các hệ thống hiện tại:
Hệ thống File Vai trò Tích hợp TTS?
TTS src/utils/speech.ts Đọc text (Việt/Anh) —
MusicManager services/musicManager.ts Nhạc nền background ❌ Không
SoundManager utils/sound.ts Âm thanh hiệu ứng (playCorrect, playWrong) ❌ Không
MusicContext src/contexts/MusicContext.tsx Context global quản lý nhạc/âm thanh ❌ Không
Hiện tượng quan sát:

Trong ColoringActivity.tsx và ListenAndPick.tsx, khi gọi speak() / speakSequence(), nhạc nền vẫn chạy bình thường
Không có logic tạm dừng nhạc khi đọc TTS, cũng không có volume ducking
SoundManager và TTS hoạt động độc lập — không chia sẻ playToken hay track state
Khuyến nghị để tích hợp (nếu cần):

// Cụ thể trong speech.ts, trước khi gọi speakSequence() hay speak(),
// có thể thêm:
import { musicManager } from '@/services/musicManager';

export function speak(text: string, opts: SpeakOptions = {}): boolean {
const wasMusicPlaying = musicManager.getMusicState().musicEnabled;

// Tạm dừng nhạc nền (tuỳ chọn)
if (opts.pauseMusic) {
musicManager.toggleMusic(); // hoặc thêm pauseMusic() method
}

const done = () => {
// Resume nhạc
if (opts.pauseMusic && wasMusicPlaying) {
musicManager.toggleMusic();
}
opts.onEnd?.();
};
// ... rest of speak()
}
Hiện tại: TTS không làm tạm dừng/mute nhạc nền tự động.

6. Kho MP3 Tiền Tạo (Pregeneratedm Audio)
   Đường dẫn:

Data file: src/data/pregeneratedSlugs.json (danh sách slug có MP3)
Audio files: public/audio/vi/\*.mp3 (khoảng hàng trăm file)
Quy tắc slug:

function getAudioSlug(text: string): string {
return text
.toLowerCase()
.normalize('NFD') // decompose diacritics
.replace(/[\u0300-\u036f]/g, '') // remove tone marks
.replace(/[đĐ]/g, 'd')
.replace(/[^a-z0-9\s-]/g, '') // chỉ giữ alphanumeric + space + hyphen
.trim()
.replace(/\s+/g, '-'); // space → hyphen
}
Ví dụ:

"Chữ A" → "chu-a" → load /Genius-kids/audio/vi/chu-a.mp3 (trên prod)
"màu đỏ" → "mau-do"
"Hãy tô ngôi sao màu đỏ!" → "hay-to-ngoi-sao-mau-do"
Script sinh MP3:

node scripts/generate-preschool-audio.mjs # tạo file còn thiếu
node scripts/generate-preschool-audio.mjs --force # tạo lại tất cả 7. Proxy TTS (Dev & Prod)
Dev (vite.config.ts):
/api/tts?ie=UTF-8&q=<text>&tl=vi&client=tw-ob
↓
Middleware Vite fetch Google kèm User-Agent: "Mozilla/5.0..."
↓
Trả audio/mpeg
Prod (workers/tts-proxy.js):
VITE_TTS_PROXY=https://genius-tts.<account>.workers.dev
↓
Cloudflare Worker fetch Google (với User-Agent + Referer)
↓
Trả audio/mpeg + CORS header
Setup Cloudflare Worker:

dash.cloudflare.com → Workers & Pages → Create Worker
Copy workers/tts-proxy.js → Deploy
GitHub repo → Settings → Secrets and variables → Actions → Variables → VITE_TTS_PROXY = URL Worker
Redeploy app (push → Actions)
TÓMING TẮT API PUBLIC CHO INTEGRATION VÀO DRAGONQUEST
Minimal Integration (đơn giản nhất):
import { speak, speakSequence, cancelSpeech } from '@/src/utils/speech';

// Đọc từng câu trong trò chơi:
speak('Bạn đã chiến thắng!', { lang: 'vi-VN' });

// Đọc chuỗi (nếu cần Anh → Việt):
speakSequence([
{ text: 'Victory!', lang: 'en-US' },
{ text: 'Bạn đã chiến thắng!', lang: 'vi-VN' },
]);

// Dừng ngay:
cancelSpeech();
Component-based (sử dụng UI):
import { SpeakButton } from '@/src/components/shared/SpeakButton';

<SpeakButton 
  text="Đã tìm thấy rồi!" 
  lang="vi-VN"
  size={28}
/>
Advanced (với MP3 custom):
speak('Lệnh tô màu', {
lang: 'vi-VN',
audioId: 'custom-voice-id', // tìm file `public/audio/vi/custom-voice-id.mp3`
rate: 0.8,
pitch: 1.05,
onEnd: () => console.log('Đọc xong'),
});
Các File Liên Quan Cần Biết
Đường dẫn (relative tới project root) Vai trò
src/utils/speech.ts CORE API — tất cả hàm TTS
docs/vietnamese-tts-mechanism.md Tài liệu chi tiết cơ chế
src/components/shared/SpeakButton.tsx Component UI button dùng chung
src/data/pregeneratedSlugs.json Danh sách slug có MP3 sẵn
public/audio/vi/\*.mp3 Kho MP3 tiền tạo
workers/tts-proxy.js Cloudflare Worker proxy Google TTS (prod)
vite.config.ts Proxy /api/tts dev + precache audio PWA
scripts/generate-preschool-audio.mjs Script tạo MP3 từ Google TTS
services/musicManager.ts Music background (chưa tích hợp TTS)
src/contexts/MusicContext.tsx Music context (chưa tích hợp TTS)
games/DragonQuest/DragonQuestGame.tsx Game DragonQuest (nơi bạn sẽ dùng TTS)
Tóm lại: TTS là hệ thống hoàn chỉnh, đã test trên Preschool. API rất đơn giản — chỉ cần speak(), speakSequence(), cancelSpeech(). Không có tích hợp tạm dừng nhạc nền tự động, nhưng hoàn toàn độc lập nên dùng được ngay.
