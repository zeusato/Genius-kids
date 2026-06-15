# Cơ chế đọc tiếng Việt (TTS) — chuẩn cho Mầm Non & toàn app

> Tài liệu hoá phương thức đọc tiếng Việt đã chạy ổn định cho mục **Mầm Non** (và dùng chung toàn app).
> Đây là kiến thức "khổ sở mãi mới tìm ra" — ghi lại để không phải dò lại.
>
> File lõi: [`src/utils/speech.ts`](../src/utils/speech.ts). Các mảnh hạ tầng: [`vite.config.ts`](../vite.config.ts)
> (proxy dev), [`workers/tts-proxy.js`](../workers/tts-proxy.js) (proxy prod), [`scripts/generate-preschool-audio.mjs`](../scripts/generate-preschool-audio.mjs)
> (tiền tạo MP3), [`src/components/shared/SpeakButton.tsx`](../src/components/shared/SpeakButton.tsx) (UI), [`src/data/pregeneratedSlugs.json`](../src/data/pregeneratedSlugs.json).

---

## 1. Vì sao việc này KHÓ (các cái bẫy)

| Cái bẫy | Hậu quả |
|---|---|
| Gọi thẳng `translate.google.com/translate_tts` từ **trình duyệt** | Google chặn **403** (kiểm tra `Referer`/`User-Agent`) — không nghe được trên web |
| Host là **GitHub Pages (tĩnh)** | Không có server-side để proxy → không thể "giấu" lời gọi Google sau backend của mình |
| **Nhiều tablet Android/iPad KHÔNG có giọng `vi-VN`** trong Web Speech API | `speechSynthesis` im lặng với tiếng Việt — đúng đối tượng Mầm Non lại là máy hay thiếu giọng nhất |
| Chrome **"nuốt" utterance** đầu tiên ngay sau `cancel()`, và **tự ngắt** câu dài sau ~15s | Đọc cụt, mất câu |
| Endpoint `translate_tts` chỉ nhận **~200 ký tự/lần** | Câu dài bị cắt ngang |
| Base path prod là `/Genius-kids/` | Đường dẫn audio sai nếu hardcode `/audio/...` |

⇒ Không có một "API tiếng Việt" duy nhất nào chạy mọi nơi. **Giải pháp chuẩn là một CHUỖI 3 TẦNG ưu tiên**, cộng một **kho MP3 tiền tạo** làm xương sống cho Mầm Non.

---

## 2. Phương thức chuẩn — chuỗi 3 tầng ưu tiên

Mọi lời đọc đi qua `startChain()` trong `speech.ts` theo đúng thứ tự:

```
1) GIỌNG THIẾT BỊ (Web Speech API, vi-VN / en-US)
   → chất lượng tốt nhất, chạy offline, miễn phí.
   → nếu máy KHÔNG có giọng phù hợp ⇒ rớt xuống (2).

2) MP3 TIỀN TẠO  (public/audio/vi/<slug>.mp3)   ◀── XƯƠNG SỐNG cho Mầm Non
   → chỉ tiếng Việt; khớp khi slug nội dung ∈ pregeneratedSlugs.json HOẶC có opts.audioId.
   → đáng tin cậy + offline (PWA cache) ⇒ ưu tiên hơn Google trên prod.
   → nếu thiếu file (lỗi tải) ⇒ rớt xuống (3).

3) GOOGLE TRANSLATE TTS  (online)               ◀── chỉ cho nội dung ĐỘNG (không có MP3)
   → dev:  /api/tts        (proxy Vite)
   → prod: VITE_TTS_PROXY  (Cloudflare Worker) — nếu trống thì gọi thẳng Google (dễ 403).
   → tự cắt câu > ~180 ký tự thành nhiều đoạn, phát tuần tự.
```

> **Mấu chốt:** với Mầm Non, nội dung là **hữu hạn và biết trước** (chữ cái, màu, số, lệnh tô màu…) →
> **tiền tạo hết thành MP3** và ship kèm app. Nhờ vậy máy không có giọng `vi-VN` vẫn đọc được, **offline**,
> không phụ thuộc Google lúc chạy. Google chỉ còn dùng cho text **động** (vd câu trả lời "Tell Me Why").

---

## 3. Kho MP3 tiền tạo (phần quan trọng nhất cho Mầm Non)

### 3.1. Slug — quy tắc đặt tên file
`getAudioSlug(text)` (trùng nhau ở `speech.ts` và script) biến text → tên file an toàn:
```
"Chữ A"      → "chu-a"          // bỏ dấu, đ→d, chỉ giữ [a-z0-9 -], khoảng trắng→'-'
"màu đỏ"     → "mau-do"
"Quả táo"    → "qua-tao"
```
Quy tắc: `toLowerCase → NFD → bỏ dấu thanh (̀-ͯ) → đ/Đ→d → bỏ ký tự lạ → trim → space→'-'`.
File nằm ở `public/audio/vi/<slug>.mp3`. Lúc chạy mở bằng `new Audio(\`${import.meta.env.BASE_URL}audio/vi/${slug}.mp3\`)` (BASE_URL = `/Genius-kids/` trên prod).

### 3.2. Script sinh audio — `scripts/generate-preschool-audio.mjs`
Chạy **bằng Node** (không bị trình duyệt chặn) để gọi Google TTS sinh sẵn:
```bash
node scripts/generate-preschool-audio.mjs           # chỉ tạo file còn thiếu
node scripts/generate-preschool-audio.mjs --force   # tạo lại tất cả
```
Script:
1. Bundle `src/data/{alphabetData,colorsData,countingData}.ts` (qua esbuild) để đọc dữ liệu.
2. Liệt kê **mọi câu** cần đọc: `Chữ A` / `chữ A` / ví dụ (`Quả táo`), `màu đỏ` / `Đây là màu đỏ. Thử lại nhé!`,
   tên số, lệnh tô màu (`Hãy tô ngôi sao màu đỏ!`…), và các lệnh tĩnh (`Hãy chọn chữ`, `Thử lại nhé!`, `Đẹp quá!`…).
3. Tải từng MP3 (`translate.googleapis.com/translate_tts?...&client=gtx&tl=vi`, User-Agent giả trình duyệt, retry ×3, nghỉ 150ms).
4. Ghi `public/audio/vi/<slug>.mp3` + **cập nhật `src/data/pregeneratedSlugs.json`** (danh sách slug để runtime biết MP3 nào có sẵn).

> Endpoint Node dùng `client=gtx` trên `translate.googleapis.com` (server-side dễ thở hơn). Runtime/Worker dùng
> `client=tw-ob` trên `translate.google.com`. Cả hai đều không chính thức — chỉ gọi từ Node/Worker, **không** từ trình duyệt.

### 3.3. Thêm nội dung đọc mới cho Mầm Non — checklist
1. Thêm câu vào dữ liệu (`alphabetData`/`colorsData`/`countingData`) **hoặc** vào danh sách câu trong script (mục `texts.add(...)`).
2. `node scripts/generate-preschool-audio.mjs` → sinh MP3 + cập nhật `pregeneratedSlugs.json`.
3. Commit cả MP3 trong `public/audio/vi/` lẫn `pregeneratedSlugs.json`.
4. Xong — runtime tự khớp theo slug, không cần sửa code đọc.

### 3.4. Offline (PWA)
`vite.config.ts` workbox precache `'audio/**/*.mp3'` ⇒ sau lần tải đầu, MP3 nằm trong cache, đọc được **không cần mạng**.

---

## 4. Proxy Google TTS cho nội dung ĐỘNG

Chỉ cần khi text không có MP3 (vd câu trả lời sinh động). `playGoogleTTS()` chọn URL theo môi trường:

| Môi trường | URL | Cấu hình |
|---|---|---|
| **Dev** | `/api/tts?...` | Middleware trong `vite.config.ts` fetch Google kèm `User-Agent` giả → trả `audio/mpeg` (tránh 403) |
| **Prod (khuyến nghị)** | `${VITE_TTS_PROXY}?...` | **Cloudflare Worker** `workers/tts-proxy.js`, set qua biến `VITE_TTS_PROXY` |
| **Prod (không cấu hình)** | `https://translate.google.com/translate_tts?...` | Gọi thẳng — **hay 403**, chỉ là best-effort; app tự rớt xuống MP3/giọng thiết bị |

### 4.1. Triển khai Cloudflare Worker (prod)
1. dash.cloudflare.com → Workers & Pages → Create Worker → dán toàn bộ `workers/tts-proxy.js` → Deploy.
2. Lấy URL (vd `https://genius-tts.<account>.workers.dev`).
3. GitHub repo → Settings → Secrets and variables → Actions → tab **Variables** → `VITE_TTS_PROXY` = URL Worker.
4. Deploy lại. `deploy.yml` đã truyền `VITE_TTS_PROXY: ${{ vars.VITE_TTS_PROXY }}` vào bước build.

Worker fetch Google với `User-Agent` + `Referer: https://translate.google.com/`, trả `audio/mpeg` + `Cache-Control` + `Access-Control-Allow-Origin: *`. Nhận **đúng query string** như `/api/tts` ⇒ client không cần biết khác biệt.

### 4.2. Cắt câu dài
`chunkText(text, 180)` cắt theo ranh giới câu → mệnh đề → từ (không dùng lookbehind để tương thích Safari cũ).
Đoạn ĐẦU lỗi ⇒ `onError` để caller rớt xuống MP3; đoạn sau lỗi ⇒ bỏ qua, đọc tiếp.

---

## 5. Web Speech API — các "quirk" đã xử lý (đừng gỡ)
- **`keepAlive` mỗi 9s** (`pause()`+`resume()`): Chrome tự ngắt câu dài sau ~15s.
- **Hoãn 60ms sau `cancel()`** trước khi `speak()`: nếu không Chrome "nuốt" utterance đầu tiên.
- **`chunkText(180)`** cũng áp cho Web Speech: tránh utterance quá dài bị bỏ.
- **`voiceschanged` bất đồng bộ**: Chrome/Android tải danh sách giọng muộn → `SpeakButton` autoPlay **chờ** `voicesReady()` rồi mới đọc, có lưới an toàn 600ms.
- **Mặc định trẻ em**: `rate 0.8` (chậm), `pitch 1.05` (tươi vui). `speakVietnamese()` (legacy/Hệ Mặt Trời) giữ `rate 0.95`.
- **Token huỷ** (`playToken`): mọi lời đọc capture token; `cancelSpeech()` tăng token để vô hiệu hoá audio/utterance đang chạy → không chồng tiếng.

---

## 6. Dùng trong UI

### 6.1. `<SpeakButton>` (nút loa dùng chung)
```tsx
// Đọc một câu (tự khớp MP3 theo slug, fallback giọng thiết bị / Google):
<SpeakButton text="màu đỏ" />

// Đọc chuỗi nhiều phần — KIỂU MẦM NON (Anh → Việt), vd trang Chữ cái:
<SpeakButton parts={[
  { text: 'A',        lang: 'en-US' },
  { text: 'Apple',    lang: 'en-US' },
  { text: 'Quả táo',  lang: 'vi-VN' },
]} autoPlay autoPlayKey={cardIndex} />

// Ép dùng MP3 cụ thể khi text khác slug:
<SpeakButton text="..." audioId="thu-lai-nhe" />
```
- `text` → `speak()`; `parts` → `speakSequence()` (đọc tuần tự, mỗi phần đi qua đủ chuỗi 3 tầng).
- `autoPlay` + `autoPlayKey`: tự đọc khi nội dung đổi (đổi thẻ/câu).

### 6.2. Gọi trực tiếp
```ts
import { speak, speakSequence, cancelSpeech } from '@/src/utils/speech';

speak('Đây là màu đỏ. Thử lại nhé!');                 // 1 câu
speakSequence([{ text: 'A', lang: 'en-US' },          // chuỗi Anh→Việt
               { text: 'chữ A', lang: 'vi-VN' }]);
cancelSpeech();                                        // dừng mọi thứ đang đọc
```

---

## 7. Sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| Prod **không đọc** câu động (Tell Me Why…), dev thì được | Chưa set `VITE_TTS_PROXY` → gọi thẳng Google bị 403. Dựng Cloudflare Worker (mục 4.1). |
| Mầm Non **im lặng** trên 1 tablet cụ thể | Máy không có giọng `vi-VN` **và** thiếu MP3 cho câu đó → chạy lại script tiền tạo, đảm bảo slug có trong `pregeneratedSlugs.json`. |
| MP3 **404** trên prod | Quên `import.meta.env.BASE_URL` ở đường dẫn, hoặc chưa commit file trong `public/audio/vi/`. |
| Câu **đầu** bị nuốt / câu **dài** bị ngắt | Đừng gỡ hoãn 60ms, `keepAlive` 9s, `chunkText`. |
| Đọc **chồng tiếng** | Luôn để `cancelSpeech()` chạy trước (đã có sẵn trong `speak`/`speakSequence`). |
| iOS không phát audio | Web Audio cần **cử chỉ người dùng** lần đầu — `SpeakButton` đọc khi bấm nên ok; tránh autoplay TTS ngay khi load mà chưa có tương tác. |

---

## 8. Bản đồ file
| File | Vai trò |
|---|---|
| `src/utils/speech.ts` | Lõi: `speak` / `speakSequence` / `cancelSpeech`, chuỗi 3 tầng, slug, chunk, keepAlive |
| `src/data/pregeneratedSlugs.json` | Danh sách slug có MP3 sẵn (runtime tra cứu) |
| `public/audio/vi/*.mp3` | Kho audio tiền tạo (PWA cache offline) |
| `scripts/generate-preschool-audio.mjs` | Sinh MP3 + cập nhật `pregeneratedSlugs.json` |
| `vite.config.ts` | Proxy `/api/tts` cho dev + precache `audio/**/*.mp3` |
| `workers/tts-proxy.js` | Cloudflare Worker proxy Google TTS cho prod |
| `.github/workflows/deploy.yml` | Truyền `VITE_TTS_PROXY` vào build |
| `src/components/shared/SpeakButton.tsx` | Nút loa dùng chung (text / parts / audioId / autoPlay) |
