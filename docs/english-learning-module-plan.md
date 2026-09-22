# Module Học Tiếng Anh Tiểu Học — Kế hoạch & Yêu cầu sinh nội dung

> Trạng thái: **ĐÃ TRIỂN KHAI A1–C3 + K và luồng AI có duyệt (2026-09-23)**. Nội dung đã sửa theo review v4. Báo cáo triển khai và kiểm chứng: [english-implementation.md](english-implementation.md). Đối tượng: 2 bé lớp 3 & lớp 5 + 1 bé mẫu giáo.
> Nguyên tắc: hệ thống hoá kiến thức từ thấp → cao, offline-first (thư viện tĩnh) + làm giàu bằng AI.
> File này gói trọn: (1) thiết kế module, (2) schema dữ liệu, (3) **toàn bộ prompt để bảo Gemini sinh nội dung**.

---

## 0. Mục tiêu & phạm vi

- Công cụ giúp trẻ **nắm kiến thức tiếng Anh có hệ thống**, không phải kho bài tập rời rạc.
- Nội dung lõi: các **thì**, **đại từ nhân xưng**, **to be + hợp ngôi**, **mẫu câu**, **phân biệt thành phần câu** (subject/verb/noun/adjective…).
- Hai việc phải làm được:
  1. **Học lý thuyết** — mỗi hạng mục là một trang *one-page* đầy đủ, có ví dụ minh hoạ, có tương tác.
  2. **Luyện tập / kiểm tra** — theo 1 hoặc nhiều chủ đề, để mài kỹ năng.
- Không cần nội dung động: dựng **thư viện tĩnh** ban đầu, về sau **làm giàu bằng AI** (lưu local).
- Bản đầu phục vụ học ngữ pháp và cấu trúc câu; chưa tuyên bố là chương trình tiếng Anh toàn diện hay hệ thống đánh giá phát âm.
- **Định mức nội dung bắt buộc:** mỗi bậc ngữ pháp A1–C2 có ít nhất **200 mẫu câu và 100 từ vựng đã duyệt**, áp dụng ngay A1. C3/K dùng định mức riêng ở §8 theo dạng nội dung. Bắt đầu triển khai chức năng từ A1; việc chia phase/batch không giảm định mức nội dung. Placement, AI trong app và track K triển khai ở các phase sau.

---

## 1. Tích hợp vào hệ thống hiện có (tái sử dụng tối đa)

| Hạ tầng sẵn có | Dùng lại thế nào |
|---|---|
| Hub/catalog (`src/components/hub/catalog.ts`) | Thêm 1 mode `english` ("Tiếng Anh") song song `study` (Toán). |
| Router (`App.tsx`) | Thêm route `/english/*` → `EnglishPage` (giống `/study/*` → `StudyPage`). |
| Khung study (`TopicSelection`→`TestRunner`→`ResultScreen`) | Học lại pattern; engine bài tập tiếng Anh soi theo, render giàu hơn. |
| TTS trung tâm (`src/utils/speech.ts`) | `speak(text, {lang:'en-US'})` đọc câu tiếng Anh qua giọng thiết bị. |
| Reward/sao, achievements, gacha | Tái sử dụng chính sách tính thưởng và UI; thêm adapter hoàn tất phiên tiếng Anh, không đưa bài tiếng Anh vào `Question`/`addTestResult` của Toán. |
| Đa hồ sơ (`StudentProfile`/`currentStudent`) | Thêm `englishProgress` có version, lịch sử gọn và action lưu phiên gắn `studentId`; migration hồ sơ cũ mặc định tiến trình rỗng. |
| AI (`services/aiService.ts`, `geminiClient.ts`) | Đường làm giàu nội dung trong app (xem §7). |

> Mode `study` (Toán) **không bị đụng tới**. Tiếng Anh là track độc lập vì các dạng bài giàu tương tác hơn `Question` kiểu Toán.

- Cập nhật đồng bộ `ModeId`, catalog, điều hướng, hình đại diện mode và kiểm tra route. Khi có K, thêm lối vào tiếng Anh cho hồ sơ mẫu giáo trong `modesFor`, không chỉ thêm vào catalog tiểu học.
- Route con dự kiến: `/english`, `/english/learn/:level`, `/english/practice`, `/english/test`, `/english/result/:sessionId`. Tải lại route phải khôi phục phiên của đúng hồ sơ hoặc đưa về menu với thông báo rõ ràng.
- Tham khảo các action hoàn tất game mới trong `StudentContext` để lưu trước, cập nhật UI sau và kiểm tra chủ hồ sơ; không sao chép nguyên luồng `StudyPage` đang giữ đề trong React state.

---

## 2. Xương sống hệ thống: hệ màu loại từ / vai trò

Ý tưởng lõi: **mỗi câu được chú thích một lần** thành token mang `pos` + vai trò cục bộ `role`, đồng thời có `roleSpans` mô tả vai trò của cả cụm trong từng mệnh đề.
Từ dữ liệu đã duyệt → tạo ví dụ tô màu và những dạng bài được cho phép trong `exerciseTypes`. Không suy rằng câu bất kỳ đều phù hợp mọi dạng bài. Một **hệ màu nhất quán** dùng ở mọi nơi giúp trẻ hình thành *bộ khung tư duy về câu*.

**Bảng màu loại từ (đề xuất, theo ramp của design system):**

| Loại từ (pos) | Nhãn VN | Màu |
|---|---|---|
| pronoun | Đại từ | Blue |
| verb | Động từ | Coral |
| noun | Danh từ | Teal |
| adjective | Tính từ | Purple |
| article / determiner | Mạo từ / Từ hạn định | Amber |
| preposition | Giới từ | Green |
| adverb | Trạng từ | Pink |
| conjunction | Liên từ | Gray |
| numeral / particle / interjection | Số từ / Tiểu từ / Thán từ | Nhãn riêng, màu trung tính |
| punct | Dấu câu | Màu chữ thông thường |

**Vai trò cục bộ (`Token.role`):** subject · verb · object · complement · det · modifier · adverbial · prep · prep-object · particle · expletive · conj · punct. `prep-object` phân biệt danh từ sau giới từ với tân ngữ của động từ; không dùng token role để kết luận vai trò của cả cụm.

**Vai trò cụm (`roleSpans`):** subject · verb · object · complement · adverbial; mỗi span ghi `clauseId` và các `tokenIndices`. Ví dụ `The little cat is happy.`: `[0,1,2]` = chủ ngữ, `[3]` = động từ, `[4]` = bổ ngữ. Trong câu hỏi, nhóm động từ có thể không liền nhau.

Nguyên tắc hiển thị: **màu từ = pos**, **dải/ngoặc bên dưới = roleSpans**. Luôn kèm nhãn chữ; không dùng màu làm tín hiệu duy nhất. Trong bài kiểm tra phân loại, ẩn màu/nhãn đang là đáp án cho đến khi nộp.

Câu có cấu trúc chưa mô hình hoá chắc chắn vẫn dùng cho đọc/điền từ, nhưng bỏ `roles` khỏi `exerciseTypes`; không ép mọi câu vào sơ đồ S–V–O. A1 dùng dạng đầy đủ `I am`, `she is` khi phân tích; `isn't` được giữ một token động từ phủ định. Rút gọn gộp đại từ + động từ như `I'm`, `she's` chỉ xuất hiện trong `Rewrite`, ví dụ lý thuyết hoặc đáp án biến thể, chưa dùng làm token phân tích.

---

## 3. Lộ trình kiến thức — một thang 10 bậc + mẫu giáo

Một **thang duy nhất** (không chẻ theo lớp), có placement gợi ý điểm bắt đầu. A1…C3 là mã nội bộ, **không phải cấp độ CEFR**; UI ưu tiên tên chủ đề. Phạm vi mỗi bậc kế thừa kiến thức bậc trước và bổ sung điểm mới.

| Chặng | Bậc | `topic` slug | Nội dung lõi |
|---|---|---|---|
| **A — Nền câu** | A1 | `to-be-pronouns` | Đại từ nhân xưng + to be (am/is/are), hợp ngôi, 3 dạng câu |
| | A2 | `nouns-articles` | Danh từ số ít/nhiều (-s/-es), a/an/the, there is/are |
| | A3 | `adjectives-possessives` | Tính từ + sở hữu (my/your…/'s), whose |
| **B — Các thì lõi** | B1 | `present-simple` | Hiện tại đơn: V+s/es, do/does, trạng từ tần suất |
| | B2 | `present-continuous` | Hiện tại tiếp diễn: be+V-ing, phân biệt với B1 |
| | B3 | `past-simple` | Quá khứ đơn: was/were, -ed + bất quy tắc, did |
| | B4 | `future-review` | Tương lai: will / be going to + ôn 4 thì |
| **C — Câu & đọc hiểu** | C1 | `wh-questions` | Wh-questions + trật tự câu hỏi |
| | C2 | `prepositions-conjunctions` | Giới từ + liên từ (and/but/or/because/so) |
| | C3 | `reading-rewrite` | Đọc hiểu đoạn ngắn + biến đổi câu, gồm một nhóm giữ nguyên nghĩa |
| **Mẫu giáo** | K | `kindergarten` | Chữ cái + âm, số, màu, con vật, gia đình, đồ ăn… (không ngữ pháp) |

**Cơ chế "hệ thống hoá":**
- **Placement nhẹ (Phase 2):** 5–8 câu để gợi ý điểm bắt đầu trong các bậc đã có nội dung; không cấp chứng nhận mastery hoặc kết luận chắc chắn về toàn bộ 10 bậc. Cho làm thêm/điều chỉnh bậc; khi mở thêm bậc phải mở rộng ngân hàng placement.
- **Mastery mềm:** mọi bậc đã phát hành đều chọn được, phụ huynh có thể chọn điểm bắt đầu. 80% là ngưỡng đánh dấu thành thạo và gợi ý bài tiếp theo, không khoá cứng. Bậc chưa phát hành ghi “Sắp có”, không giả làm khoá do học lực.
- **Điều kiện mastery:** hai bài kiểm tra gần nhất của cùng bậc đều đạt ≥80%, mỗi bài ≥10 câu nguồn khác nhau, bao phủ mọi kỹ năng bắt buộc trong catalog; giữa hai bài có ≥50% câu nguồn khác nhau. Luyện có gợi ý và placement không tính. Bài trộn nhiều bậc chỉ ghi tiến trình, không dùng cấp mastery.
- **Bản đồ kỹ năng:** hiện *chưa học / đang học / đã thạo / nên ôn*; một lần làm kém không xoá thành tích đã đạt.
- **Ôn ngắt quãng:** dùng số lượt làm, lần sai, lần ôn và `nextReviewAt` trong `englishProgress`, không dùng riêng `UserStats.topicCorrectCount` (§6.3).
- **Sổ luật**: gom mọi công thức một chỗ tra cứu, dùng chung hệ màu.

---

## 4. Hai chế độ (khớp yêu cầu)

### 4.1 Trang Lý thuyết (one-page) — `TheoryPage`
Mỗi bậc một trang cuộn, bố cục nhất quán:
- **Tóm tắt** 1–2 câu tiếng Việt.
- **Hộp công thức**: Khẳng định / Phủ định / Nghi vấn cho chủ đề thì/to be; chủ đề khác dùng mẫu cụm hoặc chiến lược phù hợp + ví dụ.
- **Các mục** (sections): giải thích tiếng Việt + **bảng** (vd bảng hợp ngôi to be) + **ví dụ tô màu** (đọc to được) + **widget tương tác** tuỳ chọn (`pronoun-swap`, `conjugation-wheel`, `sentence-builder`, `tense-compare`).
- **Lỗi thường gặp** (sai → đúng → vì sao).
- **Mẹo nhớ**.

### 4.2 Luyện tập / Kiểm tra đa chủ đề — engine bài tập
- Chọn 1..n bậc/chủ đề (giống `TopicSelection`) → engine bốc câu từ thư viện → chấm → sao (giống `TestRunner`/`ResultScreen`).
- 2 chế độ: **Luyện** (phản hồi ngay, gợi ý, không phạt) · **Kiểm tra** (tính giờ, chấm điểm).
- Phase 1: mặc định 10 câu/phiên, có tuỳ chọn 5/10/15 cho luyện; kiểm tra A1 10 câu. Kiểm tra có đồng hồ đếm thời gian đã dùng, chưa ép hạn giờ; nếu thêm giới hạn sau này phải cho chọn trước khi bắt đầu.
- Mỗi lần trả lời đầu tiên quyết định thống kê đúng/sai. Luyện được sửa đến đúng và xem giải thích nhưng không biến lần sai ban đầu thành đúng. Kiểm tra chỉ hiện đáp án/gợi ý sau nộp.
- Đề thiếu câu phù hợp: giảm số câu và báo trước, hoặc vô hiệu hoá kiểm tra mastery nếu dưới 10; không tự lặp câu để đủ số lượng.
- Mọi thao tác kéo thả có lựa chọn chạm/chọn và bàn phím tương đương; mục lý thuyết có điều hướng nhanh trên mobile.

---

## 5. Các dạng bài & nguồn dữ liệu

Nguồn chính là `Sentence`, `Vocab`, `Passage`, `Rewrite` và `Phrase` cho K:

| Dạng bài | Lấy từ | Cách sinh |
|---|---|---|
| Phân tích thành phần câu | `tokens[].pos` / `roleSpans` | Hỏi loại từ hoặc chọn cả cụm theo vai trò, chỉ dùng annotation đã duyệt |
| Điền từ còn thiếu | `blanks[]` | Khoét token theo `blanks`, nhập/chọn |
| Chia động từ | `blanks[]` + `tokens[].lemma/feature` | Khoét động từ, cho lemma + ngôi/thì |
| Sắp xếp chữ cái | `Vocab.en` | Xáo chữ cái một từ |
| Sắp xếp từ trong câu | `tokens[].text` + `orderAlternatives` | Xáo các token có định danh riêng; chấp nhận các trật tự đã duyệt dùng cùng bộ token |
| Đọc hiểu | `Passage` | Đoạn văn + câu hỏi con + TTS |
| Biến đổi câu | `Rewrite` | Tách yêu cầu đổi khẳng/phủ/hỏi khỏi yêu cầu giữ nguyên nghĩa; mỗi bài chỉ có một mục tiêu rõ ràng |
| Nối từ–nghĩa / từ–hình | `Vocab` | Ghép cặp |
| Nghe – chọn | TTS + `Vocab`/`Sentence` | Đọc to → chọn đáp án |

---

## 6. Hợp đồng dữ liệu và chấm bài

Đích triển khai tại `src/data/english/schema.ts`; đây là hợp đồng phiên bản 1, chưa phải mô tả chính xác file code sơ bộ hiện có. Khi code, enum runtime và TypeScript phải lấy từ một nguồn chung; thay đổi hợp đồng sau phát hành phải có migration/version.

```ts
export type Level = 'A1'|'A2'|'A3'|'B1'|'B2'|'B3'|'B4'|'C1'|'C2'|'C3'|'K'; // K = mẫu giáo

export type Pos  = 'pronoun'|'noun'|'verb'|'adjective'|'adverb'|'article'
                 |'preposition'|'conjunction'|'determiner'|'numeral'|'punct'|'interjection'|'particle';

export type Role = 'subject'|'verb'|'object'|'complement'|'det'|'modifier'
                 |'adverbial'|'prep'|'prep-object'|'particle'|'expletive'|'conj'|'punct';

export type VerbFeature = 'base'|'present-1sg'|'present-3sg'|'present-other'|'past'|'ing'
  |'aux-present-3sg'|'aux-present-other'|'aux-past'|'aux-future';
export type Feature = VerbFeature | `${VerbFeature}-neg` | 'sg'|'pl'|'uncountable';
export type SentenceExercise = 'pos'|'roles'|'fill'|'conjugate'|'order'|'listen';

export interface RoleSpan {
  clauseId: string;       // c1, c2...; phân biệt chủ ngữ/động từ của từng mệnh đề
  role: 'subject'|'verb'|'object'|'complement'|'adverbial';
  tokenIndices: number[]; // chỉ số 0-based, tăng dần, không trùng; có thể không liên tiếp
}

export interface Token {
  text: string;
  pos: Pos;
  role: Role;
  lemma?: string;    // dạng gốc — BẮT BUỘC cho verb & noun (be, go, teacher)
  feature?: Feature; // bắt buộc cho verb/noun; validator giới hạn theo pos và hình thái thực tế
}

export interface Sentence {
  id: string;             // "A1-s-0001"
  level: Level;
  topic: string;
  grammarPoint: string;   // điểm ngữ pháp câu minh hoạ
  en: string;
  vi: string;
  tokens: Token[];
  roleSpans: RoleSpan[]; // bắt buộc có nếu exerciseTypes chứa roles; ngược lại có thể []
  exerciseTypes: SentenceExercise[]; // whitelist dạng bài phù hợp, không tự bật mọi dạng
  orderAlternatives?: string[]; // chỉ các trật tự dùng cùng bộ token, không phải cách viết rút gọn
  blanks: { tokenIndex: number; answer: string; alt?: string[]; promptVi: string; hint: string }[];
  audioId?: string;       // asset key đã có trong manifest audio tiếng Anh
  difficulty: 1|2|3;
  tags: string[];
  source: 'seed'|'ai';
}

export interface Vocab {
  id: string;             // "A1-v-0001"
  level: Level;
  topic: string;
  en: string;
  vi: string;
  pos: Pos;
  ipa: string;
  forms?: { plural?: string; thirdSg?: string; past?: string; ing?: string; irregular?: boolean };
  exampleEn: string;
  exampleVi: string;
  image?: string;         // emoji / asset key (BẮT BUỘC cho bậc K)
  audioId?: string;       // đọc riêng en; exampleEn dùng TTS hoặc asset riêng khi có
  tags: string[];
  source: 'seed'|'ai';
}

export interface TheoryPage {
  id: Level;
  title: string;
  level: Level;
  summary: string;
  formulas: { label: string; pattern: string; example: string }[];
  sections: {
    heading: string;
    body: string;
    table?: { columns: string[]; rows: string[][] };
    exampleIds?: string[];
    interactive?: 'pronoun-swap'|'conjugation-wheel'|'sentence-builder'|'tense-compare'|null;
  }[];
  commonMistakes: { wrong: string; right: string; why: string }[];
  tips: string[];
}

// Chỉ dùng cho C3 (đọc hiểu)
export interface Passage {
  id: string;             // "C3-p-0001"
  level: 'C3';
  title: string;
  en: string;             // đoạn 60–90 từ
  vi: string;
  wordCount: number;
  audioId?: string;
  questions: {
    id: string;
    type: 'mcq'|'tf'|'short';
    q: string;
    options?: string[];   // cho mcq
    answer: string;
    alt?: string[];       // chỉ short; mcq phải khớp đúng một option, tf chỉ True/False
    explain: string;
  }[];
  glossary?: { en: string; vi: string }[];
  source: 'seed'|'ai';
}

// Chỉ dùng cho C3 (viết lại câu)
export interface Rewrite {
  id: string;             // "C3-r-0001"
  level: 'C3';
  type: 'affirm-neg'|'neg-affirm'|'statement-question'|'contraction'|'synonym'|'word-order';
  promptEn: string;       // câu gốc
  promptVi: string;       // yêu cầu luôn hiện, gồm từ/cụm gợi ý nếu cần giới hạn đáp án
  answer: string;         // đáp án chuẩn
  alt?: string[];         // đáp án chấp nhận thêm
  vi: string;
  hint?: string;          // gợi ý thêm chỉ khi luyện; không chứa yêu cầu thiết yếu bị ẩn lúc kiểm tra
  source: 'seed'|'ai';
}

export interface Phrase {
  id: string;
  level: 'K';
  en: string;
  vi: string;
  image: string;
  audioHint: string;
  audioId?: string;
  tags: string[];
  source: 'seed'|'ai';
}
```

**Enum bảng tra (dùng chung cho mọi prompt):**
- `pos`, `role`, `feature`: theo các type phía trên; `present-other` dùng cho you/we/they và động từ thường với I, không gọi nhầm tất cả là số nhiều. `base` dùng cho nguyên mẫu sau trợ động từ; `will` dùng `aux-future`.
- Hậu tố `-neg` chỉ dành cho token động từ rút gọn phủ định hợp lệ; không gắn vào động từ đứng riêng trước `not`. `not` là adverb/adverbial, nhưng thuộc nhóm động từ nếu nhóm có phủ định.
- Danh từ: `sg`, `pl`, `uncountable` theo cách dùng trong câu. Từ `fish` phải phân biệt cá đếm được với món cá; không ép danh từ không đếm được có dạng số nhiều.
- `grammarPoint` phải là skill ID có trong catalog của bậc. A1 gồm `be-affirmative`, `be-negative`, `be-question`, `be-short-answer`, `demonstratives`; mỗi câu có một điểm chính. Khi mở bậc mới, tạo catalog kỹ năng và quota trước khi sinh dữ liệu.
- `topic` phải khớp bảng §3; nguồn seed chỉ dùng `source:"seed"`. Metadata duyệt AI nằm trong envelope §7, không tự thêm key vào content.

### 6.1 Quy tắc annotation và sinh bài

- Token ghép lại phải tái tạo `en`, với khoảng trắng trước dấu câu được xử lý thống nhất. Dấu câu không là mục tiêu hỏi loại từ hoặc ô trống; MVP cố định dấu cuối câu khi xếp từ.
- `roleSpans` mô tả trọn cụm: mạo từ/tính từ nằm trong cụm danh từ; trợ động từ, phủ định và động từ chính cùng nhóm động từ. Các nhóm trong cùng mệnh đề không chồng nhau. Chỉ bật `roles` cho câu đã duyệt đầy đủ các thành phần cần hỏi.
- `there` tồn tại trong `there is/are`: quy ước pronoun/expletive; giai đoạn đầu không sinh bài hỏi vai trò của cấu trúc này. `which/whose` lấy pos theo cách dùng (determiner khi đi trước danh từ, pronoun khi đứng độc lập).
- Với `be going to + V`, `going` = verb/verb/ing, `to` = particle/particle, động từ sau = base; nhóm động từ bao gồm cả cụm. Giới từ nhiều từ như `in front of` phải được duyệt theo ngữ cảnh, không gắn mọi token thành preposition một cách máy móc.
- Một ô trống khoét một token; `alt` có thể nhiều từ khi thay đúng token đó, ví dụ `isn't` → `is not`. Cụm cần khoét nhiều token chưa thuộc schema v1; không lách bằng token chứa nhiều từ.
- `promptVi` là yêu cầu luôn hiện (ví dụ “Dùng tính từ sở hữu của I” hoặc “Hoàn thành câu phủ định”); `hint` chỉ hiện khi xin gợi ý lúc luyện. Không dùng hint bị ẩn làm ngữ cảnh duy nhất để xác định đáp án. Câu đa nghĩa không giới hạn được đáp án thì không dùng kiểm tra.
- Bài xếp câu dùng định danh theo vị trí token, xử lý được hai từ giống nhau; nghiệm được xét theo nội dung, không ép thứ tự định danh của các token giống nhau. Mỗi `orderAlternatives` phải giữ nguyên bộ từ và ý nghĩa yêu cầu.
- Đáp án nhiễu phải khác nhau và thực sự sai trong ngữ cảnh. Nếu không có đủ đáp án nhiễu tốt, chuyển sang nhập từ khi phù hợp hoặc bỏ item, không bịa lựa chọn.
- Bộ chọn đề cân bằng chủ đề/kỹ năng/độ khó và tránh cùng một câu nguồn xuất hiện dưới nhiều dạng trong một đề. Khi kiểm tra nhiều kỹ năng, quota lấy từ catalog; không lấy ngẫu nhiên thuần tuý rồi gọi đó là kiểm tra toàn bậc.
- Catalog xác định dạng exercise thực sự đo từng skill; không tính việc phân loại danh từ trong một câu là bằng chứng bé đã biết chia to be. Bài mastery A1 dùng điền từ/xếp câu đo 5 skill bắt buộc; phân loại từ/cụm dùng luyện và bài kiểm tra kỹ năng bổ sung, không thay quota ngữ pháp.
- Ví dụ lý thuyết có màu; bài luyện chỉ tô đáp án sau trả lời; bài kiểm tra không đọc toàn câu gốc qua TTS nếu việc đó làm lộ ô trống/trật tự cần tìm.
- Với xếp chữ, chỉ chọn từ đơn gồm chữ cái Latin; cụm từ, dấu cách, dấu nháy hoặc gạch nối chưa nằm trong dạng bài v1. Nối từ–hình tránh dùng chung emoji cho nhiều đáp án trong một lượt; dùng asset cụ thể nếu emoji gây mơ hồ.

### 6.2 Hợp đồng chấm đáp án

- Chấm offline bằng hàm thuần, cùng một kết quả dùng cho UI, lịch sử, mastery và reward; không gọi AI để quyết định đúng/sai trong bài kiểm tra.
- Với nhập từ/câu: Unicode NFC, trim, gộp khoảng trắng, chuẩn hoá dấu nháy cong thành `'`, không phân biệt hoa/thường. Có thể bỏ **một dấu kết thúc câu** `.?!` ở cuối; giữ dấu nháy và dấu câu bên trong. Viết hoa/dấu cuối câu được góp ý riêng, chưa là kỹ năng chấm điểm v1.
- So với `answer` hoặc `alt` đã duyệt. Không tự bỏ `not`, không fuzzy-match, không tự mở rộng mọi rút gọn (`he's` có thể là he is/he has), không chấp nhận từ gần nghĩa ngoài tập đáp án.
- Trắc nghiệm dùng ID lựa chọn; tf dùng giá trị boolean nội bộ ánh xạ từ `True`/`False`; bài phân loại dùng enum/nhóm token, không so nhãn tiếng Việt.
- `Passage.short` hỏi ngắn, giới hạn rõ câu trả lời (ví dụ “điền tên nơi chốn”); phải có các biến thể hợp lệ trong `alt`. Câu trả lời tự do không thể liệt kê đủ chỉ dùng tự luyện có đáp án mẫu, loại khỏi đề chấm điểm và mastery.
- `Rewrite` phải nêu rõ thao tác, từ gợi ý hoặc điểm cần thay. `affirm-neg`, `neg-affirm`, `statement-question` **không** gắn nhãn giữ nguyên nghĩa. `contraction`, `synonym`, `word-order` giữ nghĩa; alt phải đáp ứng đúng thao tác, không chấp nhận nguyên câu đầu vào nếu bài yêu cầu biến đổi.
- Mỗi exercise có một điểm, dù có nhiều thao tác; chỉ đạt khi toàn bộ đáp án đúng. Một câu hỏi con của Passage là một exercise. Phản hồi từng phần được hiển thị lúc luyện, chưa dùng điểm lẻ.
- Sau khi chấm, lưu `isCorrect` và điểm đã tính; không chấm lại bằng phép `===` trong achievement service của Toán.

### 6.3 Phiên học, tiến trình và phần thưởng

Các model runtime sau sẽ được định nghĩa khi triển khai, tách khỏi JSON nội dung:

| Model | Trường và quy tắc bắt buộc |
|---|---|
| `EnglishProgress` | `schemaVersion:1`, `contentVersion`, `selectedLevel`, `skills`, `masteryByLevel`, `recentSessions`, `reviewItems`; trường optional trên hồ sơ cũ, tạo mặc định khi cần |
| `SkillProgress` | `attempts`, `firstTryCorrect`, `lastAttemptAt`, `lastWrongAt?`, `reviewStep`, `nextReviewAt?`; key theo `level:grammarPoint`; phân biệt luyện/kiểm tra trong kết quả phiên |
| `EnglishSession` | UUID `sessionId`, `studentId`, `contentVersion`, mode, levels, danh sách exercise cố định, `startedAt`, `updatedAt`, thời gian hoạt động, trạng thái draft/completed, đáp án/lần đầu/gợi ý; refresh không bốc lại đề |
| `EnglishExercise` | `id`, dạng bài, `sourceId`, `sourceVersion`, `skillId`, prompt, dữ liệu render, đáp án chuẩn/biến thể, `scoringVersion`; lưu snapshot gọn để seed hoặc AI bị sửa/xoá không làm đổi phiên đang làm |
| `EnglishSessionResult` | `sessionId`, `studentId`, mode, levels, score, total, duration, per-skill summary, first-attempt results, ngày hoàn tất, `starsEarned`; không ép vào `TestResult` của Toán |

- `englishProgress` lưu cùng profile trong localStorage để tiến trình và sao được ghi bằng **một lần lưu profile**. Chỉ giữ tối đa 50 tóm tắt phiên và 100 mục ôn sai gần nhất; mỗi bậc giữ riêng hai bài kiểm tra gần nhất phục vụ mastery. Chi tiết/draft có snapshot lưu IndexedDB theo `studentId`; dọn khi xoá hồ sơ.
- Chống nộp trùng: trong profile giữ sổ nhận thưởng `sessionId → completedAt`, cùng `minimumAcceptedSessionStartedAt`. Chỉ nhận draft bắt đầu trong 30 ngày gần nhất; sau lưu thành công mới tăng mốc và dọn ID cũ hơn cửa sổ đó. Phiên trước mốc bị từ chối hoàn tất lại, không chỉ dựa vào danh sách 50 kết quả đang hiển thị.
- Action `completeEnglishSession(studentId, session)` dùng profile mới nhất, kiểm tra đúng chủ hồ sơ, kiểm tra sessionId đã ghi, tính kết quả + tiến trình + sao/gacha rồi lưu. UI chỉ báo nhận thưởng sau khi lưu thành công. Lỗi/quota storage giữ đáp án để thử lại; retry không quay gacha hay cộng sao lần nữa sau một lần lưu đã thành công. Khi chạy nhiều tab, dùng cơ chế khoá cùng origin cho toàn bộ đọc–sửa–ghi hoặc chỉ cho một tab ghi hồ sơ.
- Đổi hồ sơ phải dừng TTS, lưu/đóng draft cũ và không ghi kết quả của bé cũ sang bé mới. Draft tải lại theo owner và content snapshot; hoàn tất cũng phải kiểm tra owner.
- Phase 1: luyện thưởng 1 sao khi hoàn thành ≥5 câu và đúng lần đầu ≥60%; tối đa 3 phiên luyện có thưởng/ngày/hồ sơ (ngày địa phương). Kiểm tra dùng công thức hiện có của `rewardService`, chỉ thưởng khi đề ≥10 câu; tối đa 2 phiên kiểm tra có thưởng/ngày/hồ sơ. Phiên ngoài hạn vẫn ghi tiến trình. Placement không thưởng. Gacha dùng chính sách kiểm tra hiện có, cùng giới hạn và chống lặp với sao; luyện không gacha.
- Adapter thống kê nhận **kết quả đã chấm**. Cộng sao/thời gian/câu hỏi vào chỉ số chung theo chính sách rõ ràng; chỉ số tiếng Anh dùng namespace `english:*`. Thành tích riêng Toán không được mở bởi tiếng Anh. Không cộng cả `updatedProfile` từ rewardService lẫn `starsEarned` lần thứ hai.
- Ôn ngắt quãng khởi đầu đơn giản: sai hoặc dùng gợi ý → hẹn sau 1 ngày, đặt `reviewStep=0`; trả lời đúng lần đầu trong phiên ôn đến hạn → lần lượt hẹn sau 3, 7, 14 ngày, giữ 14 ngày ở các lần tiếp theo. Lặp bài nhiều lần trong ngày không tăng bước; thời điểm đến hạn lưu ISO UTC, UI hiện theo giờ địa phương. Phase 1 thu thập dữ liệu, Phase 3 mới mở hàng đợi ôn.

---

## 7. Lưu trữ & làm giàu nội dung (2 đường AI)

### 7.1 Đường A — seed tĩnh đã duyệt

- A1 phải có **≥200 câu, ≥100 từ và một trang lý thuyết** để nghiệm thu nội dung, tương tự định mức các bậc A2–C2. Có thể dùng batch nhỏ để thử pipeline/review trước, nhưng batch chưa đủ số lượng chỉ là dữ liệu một phần, không được ghi nhận hoàn thành thư viện.
- Mỗi batch là file JSON riêng trong thư mục staging ngoài thư viện runtime. Script import sẽ parse từng mảng → kiểm tra → merge object → kiểm trùng → ghi **một mảng JSON**. Không nối văn bản `[...][...]`. Chỉ định trước loại file, số lượng batch và khoảng ID; giữ báo cáo lỗi theo file/item/field.
- Nội dung được nạp theo manifest có `schemaVersion`, `contentVersion`, level, danh sách file, số lượng và trạng thái duyệt. File runtime:
  - A1–C2: `<LEVEL>.sentences.json`, `<LEVEL>.vocab.json`, `<LEVEL>.theory.json`.
  - C3: `C3.vocab.json`, `C3.theory.json`, `C3.passages.json`, `C3.rewrites.json`; không bắt buộc `C3.sentences.json`.
  - K: `K.vocab.json`, `K.phrases.json`; không bắt buộc theory/sentences kiểu ngữ pháp.
- Lý thuyết A1 biên soạn/duyệt thủ công; prompt §8.13 hỗ trợ bản nháp. Mọi `exampleIds` phải trỏ tới câu đã có trong manifest cùng bậc; widget chỉ bật khi implementation hỗ trợ.
- Duyệt **100% nội dung MVP**, gồm đáp án/alt, nhãn ngữ pháp, dịch, độ khó và bài sinh ra. Khi mở rộng: duyệt tất cả đáp án/annotation mới và mọi mẫu cấu trúc mới; có thể lấy mẫu cho phần văn phong câu lặp cấu trúc. Validator không chứng minh được ngữ pháp/ý nghĩa đúng.

### 7.2 Validator dùng chung từ Phase 1

- Lõi validator chạy được ở CLI và browser, không phụ thuộc `fs`; CLI chỉ là wrapper. Script sơ bộ hiện có chưa đạt hợp đồng này.
- Kiểm shape/kiểu dữ liệu/enum/key lạ của cả 6 loại Sentence, Vocab, TheoryPage, Passage, Rewrite, Phrase; null hoặc thiếu trường phải trả lỗi rõ, không crash. Loại file lạ hoặc manifest thiếu file bắt buộc phải fail, không báo PASS do bỏ qua.
- Kiểm ID duy nhất theo kind + level, filename/level/topic/skill khớp catalog; lemma/feature bắt buộc và đúng nhóm POS; token ghép khớp en; blank index nguyên và hợp lệ, answer khớp token, alt/hint/prompt đúng kiểu; role spans đúng chỉ số/mệnh đề; order alternative giữ đúng bộ token. Không khoét dấu câu.
- Kiểm tham chiếu theory, chiều rộng bảng, widget hỗ trợ, MCQ đúng 4 lựa chọn khác nhau và answer thuộc options, tf dùng chuỗi JSON "true"/"false" (chữ thường), short có phạm vi trả lời rõ, số từ/độ dài/glossary của Passage, ảnh K, asset audioId tồn tại. Quota/count kiểm theo manifest với định mức bắt buộc ≥200 câu/≥100 từ cho A1–C2. Batch nhỏ được kiểm tra riêng nhưng chưa đạt nghiệm thu tổng thư viện.
- `wordCount` được script tính lại theo từ tách bởi whitespace; từ có dấu nháy/gạch nối liền tính một từ. Không tin số đếm do AI tự báo.
- Seed lỗi cấu trúc/tham chiếu → chặn import/build với báo cáo; không âm thầm bỏ làm hụt thư viện. Bản AI lỗi → cách ly để sửa/xoá, không đưa vào engine. Trùng nội dung trong cùng level/kind là lỗi hoặc phải có giải trình duyệt; không âm thầm ghi đè ID.
- Test validator phải có case lỗi từ plan: `a apple` được bắt bằng fixture nội dung đã duyệt (không tuyên bố validator tổng quát hiểu mọi ngữ pháp), feature lạ, null item, sai blank index, thiếu exampleId, thiếu file, Passage/Rewrite/Phrase hỏng và batch merge trùng.

### 7.3 Đường B — AI trong app (Phase 4)

- Phụ huynh chủ động bấm tạo nội dung; gọi `geminiClient`, validate, lưu **bản nháp** vào IndexedDB. Không tự đưa đầu ra AI vào bài kiểm tra/mastery.
- Envelope lưu: `{ schemaVersion, id, kind, level, content, source:'ai', createdAt, model, promptVersion, reviewStatus:'draft'|'approved'|'rejected', reviewedAt? }`; `content` tuân schema §6, `content.source='ai'`, ID được app cấp namespace `ai-<uuid>`. Theory seed vẫn là nguồn chuẩn, chưa cho AI thay thế lý thuyết trong app.
- Chỉ merge bản approved vào thư viện luyện. Kiểm tra/placement/mastery chỉ lấy seed đã duyệt. ID seed không được bị AI ghi đè; có danh sách xem, duyệt, xoá nội dung AI và giới hạn số lượng/dung lượng lưu.
- Dedupe theo `kind + level + normalizedEn`; với Rewrite dùng `type + promptEn + yêu cầu biến đổi`, không dùng trường en không tồn tại. Vocab cùng từ ở bậc khác vẫn giữ để phục vụ ngữ cảnh. Không dedupe toàn thư viện chỉ theo en làm mất phân bố bậc.
- Có timeout/cancel và lỗi rõ ràng; yêu cầu thất bại không ảnh hưởng thư viện seed. Phiên đang học dùng snapshot nên xoá item AI không làm thay đáp án giữa phiên.

### 7.4 Offline và âm thanh

- Nội dung seed/route/assets được lazy-load theo bậc nhưng phải có manifest cache PWA. Hiện trạng cache build không đồng nghĩa thiết bị đã tải đủ: UI chỉ báo “Sẵn sàng offline” sau khi kiểm tra cache của bậc; kiểm thử bản production sau lần tải online đầu tiên.
- Dùng TTS trung tâm với `en-US`, chờ `voiceschanged`, hỗ trợ dừng/phát lại; ưu tiên giọng đúng locale khi có. Giọng có trong danh sách chưa bảo đảm phát được khi offline; phải kiểm tra trên thiết bị mục tiêu.
- Hiện MP3 fallback chỉ hỗ trợ tiếng Việt. Khi bổ sung audio tiếng Anh, phải mở rộng lookup/manifest trung tâm theo ngôn ngữ và `audioId`; dùng file đã đóng gói/cache cho các mục nghe bắt buộc. TTS online chỉ là fallback khi có mạng.
- Phase 1: nút đọc là hỗ trợ, bài học vẫn hoàn thành được khi không có âm thanh. Phase có bài nghe/K: kiểm tra khả năng phát trước khi bắt đầu; nếu audio thất bại giữa câu, cho thử lại hoặc thay câu cùng kỹ năng khi chưa trả lời, không chấm sai vì thiếu âm thanh. Không lấy bài nghe không phát được làm điều kiện mastery.
- Hình/nhãn thay thế giúp điều hướng khi âm thanh không khả dụng; không hiện nguyên đáp án rồi vẫn tính là bài kiểm tra nghe.

---

## 8. YÊU CẦU SINH NỘI DUNG — Prompt cho Gemini

### 8.0 Cách dùng
Mỗi lần sinh một loại file của một bậc: **dán `BLOCK 0 (CHUNG)` trước, rồi dán block của bậc cần gen**, kèm loại file, số lượng batch, khoảng ID và catalog kỹ năng. Với theory, dán thêm §8.13 và các câu seed tham chiếu; với C3 vocab dùng §8.11 C3-C.
`BLOCK 0` giữ schema + quy tắc bất biến (một nguồn sự thật). Block của bậc chỉ nói phạm vi + từ vựng + ví dụ mẫu.
Mặc định tối đa 50 object/lô, giảm xuống 10–20 khi Sentence có annotation dài; mỗi lô lưu file riêng để import theo §7.1. Số lượng trong block bậc là **định mức bắt buộc của thư viện hoàn chỉnh**, không phải mục tiêu tuỳ chọn cho tương lai. Chia batch chỉ để tránh cắt cụt đầu ra; phải tiếp tục đến đủ tổng số lượng, không bắt buộc xuất hết trong một lần.

---

### 8.1 BLOCK 0 — CHUNG (dán trước mọi bậc)

```text
VAI TRÒ: Bạn là chuyên gia biên soạn tiếng Anh tiểu học cho học sinh Việt Nam.
Bạn sinh dữ liệu học tập dạng JSON theo schema cố định dưới đây. CHỈ xuất JSON, không giải thích.

QUY TẮC XUẤT FILE:
- Chỉ sinh đúng loại file và khoảng ID được yêu cầu. Mỗi batch là một mảng JSON hợp lệ lưu file riêng; riêng TheoryPage là một object. Không trộn Sentence và Vocab trong cùng mảng.
- Mặc định tối đa 50 object/lô, có thể giảm theo yêu cầu. Ví dụ bên dưới minh hoạ nhiều loại object, KHÔNG phải cấu trúc file để sao chép nguyên khối.
- Không bao giờ cắt ngang một object. Không thêm/bớt key ngoài schema.
- id đánh số tăng dần, không trùng. Không trùng câu/từ. source = "seed".

SCHEMA:
Sentence = { id, level, topic, grammarPoint, en, vi,
  tokens:[{text, pos, role, lemma?, feature?}],
  roleSpans:[{clauseId, role, tokenIndices:[number]}],
  exerciseTypes:["pos"|"roles"|"fill"|"conjugate"|"order"|"listen"], orderAlternatives?:[string], audioId?,
  blanks:[{tokenIndex, answer, alt?, promptVi, hint}], difficulty:1|2|3, tags:[string], source:"seed" }
Vocab = { id, level, topic, en, vi, pos, ipa,
  forms?:{plural?,thirdSg?,past?,ing?,irregular?}, exampleEn, exampleVi, image?, audioId?, tags:[string], source:"seed" }

ENUM:
pos  ∈ {pronoun,noun,verb,adjective,adverb,article,preposition,conjunction,determiner,numeral,punct,interjection,particle}
role ∈ {subject,verb,object,complement,det,modifier,adverbial,prep,prep-object,particle,expletive,conj,punct}
feature(verb) ∈ {base,present-1sg,present-3sg,present-other,past,ing,aux-present-3sg,aux-present-other,aux-past,aux-future}
  (+ hậu tố "-neg" CHỈ khi token là động từ rút gọn phủ định hợp lệ, vd present-3sg-neg, aux-past-neg, aux-future-neg)
feature(noun) ∈ {sg,pl,uncountable}
roleSpans.role ∈ {subject,verb,object,complement,adverbial}

QUY TẮC TOKEN HOÁ (áp dụng mọi bậc):
- Mỗi từ = 1 token; dấu câu (. , ? ! : ;) = token riêng, pos & role = "punct"; dấu nháy trong từ không tách.
- Rút gọn phủ định giữ một token: isn't, aren't, don't, doesn't, didn't, won't (feature có "-neg"). Sentence không dùng I'm/he's/she's/it's/you're/we're/they're; dùng dạng đầy đủ để tách rõ đại từ và động từ. Rewrite được dùng các dạng rút gọn này.
- to be: lemma "be". Động từ thường: lemma là dạng nguyên mẫu (go, play...).
- Trợ động từ do/does/did/will = pos "verb", role "verb", lemma "do"/"will", feature "aux-..." đúng enum. Động từ chính sau do/does/did/will giữ base; động từ hữu hạn khác chia feature theo ngôi/thì, không gán I like = base.
- Sau to be nối với cụm danh/tính từ: toàn cụm là span complement; a/an/the → token role det, tính từ trước danh từ → modifier, danh từ chính → complement. Tính từ đứng độc lập sau be (happy trong I am happy) có token role complement. Be + V-ing thuộc nhóm động từ, không áp quy tắc bổ ngữ này.
- SAU động từ thường: danh từ chịu tác động → role "object".
- Danh từ sau giới từ → role "prep-object"; giới từ → role "prep". Chưa bật roles cho câu có cụm giới từ nếu chưa xác định chắc vai trò của cả cụm.
- Tính từ đứng trước danh từ → role "modifier"; danh từ chính đứng sau → subject/object/complement tuỳ vị trí.
- Từ để hỏi (wh-): what/who/which/whose là pronoun khi đứng độc lập, what/which/whose là determiner khi đi trước danh từ; where/when/why/how = adverb;
  role = vai nó thay thế (hỏi chủ ngữ→subject, hỏi bổ ngữ→complement, where/when/why/how→adverbial).
- "there" trong "there is/are": pos "pronoun", role "expletive"; danh từ theo sau gắn role subject theo quy ước thư viện; bỏ roles khỏi exerciseTypes cho cấu trúc này ở bản đầu.
- roleSpans ghi trọn cụm, clauseId c1/c2..., tokenIndices 0-based tăng dần không trùng. Nếu chưa chắc cấu trúc, để [] và không bật roles. Muốn bật roles phải có đầy đủ nhóm cần hỏi; không suy span chỉ từ token role.
- be going to + V: going = verb/verb/ing, to = particle/particle, V = verb/verb/base; không gán to chỉ nguyên mẫu thành giới từ nơi chốn.
- exerciseTypes chỉ bật dạng đã kiểm tra; orderAlternatives dùng đúng bộ token; không đưa rút gọn làm nghiệm xếp từ khác bộ token.

CHẤT LƯỢNG (áp dụng mọi bậc):
- vi = bản dịch tự nhiên, đúng nghĩa, đúng văn phong trẻ em.
- difficulty trải đều ~40% mức 1, ~35% mức 2, ~25% mức 3.
- blanks: khoét đúng điểm ngữ pháp; promptVi phải đủ xác định câu trả lời khi hint bị ẩn. alt CHỈ chứa đáp án đúng khi thay vào đúng ô; không chứa phương án nhiễu. Mạo từ xét âm đầu của từ, không chỉ chữ cái đầu. Hint ngắn gọn tiếng Việt.
- Vocab: ipa theo Anh-Mỹ thống nhất (dạng /.../); chỉ danh từ đếm được mới bắt buộc forms.plural; động từ thông thường ghi forms.thirdSg/past/ing (+ irregular:true nếu bất quy tắc); không ép modal/trợ động từ có forms không tồn tại.
  image = 1 emoji rõ nghĩa khi phù hợp, bắt buộc cho K; không tự bịa audioId. exampleEn hợp phạm vi bậc (được dùng kiến thức bậc trước). Nội dung K dùng mẫu giao tiếp ngắn, không áp bài phân tích ngữ pháp.

TỰ KIỂM trước khi trả về: (1) JSON parse được; (2) mọi pos/role/feature thuộc enum;
(3) KHÔNG dùng ngữ pháp ngoài phạm vi bậc; (4) đủ số lượng yêu cầu; (5) không trùng id/câu/từ.

>>> Chờ BLOCK của bậc cụ thể ngay sau đây để biết: level, topic, phạm vi ngữ pháp, danh sách CẤM, chủ đề từ vựng, và ví dụ mẫu. <<<
```

---

### 8.2 A1 — To be & Đại từ nhân xưng  (`to-be-pronouns`)

```text
BẬC A1 · topic "to-be-pronouns" · level "A1".
SỐ LƯỢNG BẮT BUỘC: A1.sentences.json ≥ 200 câu; A1.vocab.json ≥ 100 từ. Sinh theo batch riêng đến khi đủ tổng số lượng.
QUOTA A1: phủ đủ 7 đại từ, 3 dạng khẳng/phủ/hỏi và 5 skill catalog A1; mục tiêu 45 be-affirmative + 45 be-negative + 45 be-question + 20 be-short-answer + 45 demonstratives cho bộ 200 câu; không ép câu trả lời ngắn vượt số mẫu tự nhiên. Không tăng số lượng bằng câu trùng hoặc cấu trúc vượt bậc. 10 câu kiểm tra gồm ít nhất 2 câu/skill. Sinh đúng quota batch được giao; batch nhỏ không thay thế tổng định mức.

CHỈ DÙNG:
- Đại từ chủ ngữ: I, you, we, they, he, she, it (dùng đủ cả 7).
- to be hiện tại: am / is / are.
- 3 dạng câu: khẳng định · phủ định (am not/isn't/aren't) · nghi vấn (Am/Is/Are + S...?) + trả lời ngắn.
- this/that/these/those + it.
- Bổ ngữ đơn giản: a/an + danh từ (nghề nghiệp, đồ vật), tính từ cơ bản, quốc tịch, tuổi ("I am eight.").
CẤM: động từ thường làm vị ngữ; hiện tại tiếp diễn/quá khứ/tương lai; sở hữu cách phức tạp; mệnh đề quan hệ. To be ở đây chính là hiện tại đơn của be.

blanks ưu tiên: khoét chính động từ to be (luyện chia theo ngôi), hint = "to be · <đại từ>".
Vocab phủ chủ đề: nghề nghiệp, cảm xúc/ngoại hình, đồ vật lớp học, gia đình, quốc tịch.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"A1-s-0001","level":"A1","topic":"to-be-pronouns","grammarPoint":"be-affirmative","en":"I am happy.","vi":"Tôi vui.","tokens":[{"text":"I","pos":"pronoun","role":"subject"},{"text":"am","pos":"verb","role":"verb","lemma":"be","feature":"present-1sg"},{"text":"happy","pos":"adjective","role":"complement"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"am","hint":"to be · I","promptVi":"Hoàn thành câu khẳng định với to be."}],"difficulty":1,"tags":["affirmative","emotion"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"complement","tokenIndices":[2]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A1-s-0002","level":"A1","topic":"to-be-pronouns","grammarPoint":"be-negative","en":"She isn't a student.","vi":"Cô ấy không phải là học sinh.","tokens":[{"text":"She","pos":"pronoun","role":"subject"},{"text":"isn't","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg-neg"},{"text":"a","pos":"article","role":"det"},{"text":"student","pos":"noun","role":"complement","lemma":"student","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"isn't","alt":["is not"],"hint":"to be phủ định · she","promptVi":"Hoàn thành câu phủ định với to be."}],"difficulty":2,"tags":["negative","profession"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"complement","tokenIndices":[2,3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A1-v-0001","level":"A1","topic":"to-be-pronouns","en":"teacher","vi":"giáo viên","pos":"noun","ipa":"/ˈtiː.tʃər/","forms":{"plural":"teachers"},"exampleEn":"She is a teacher.","exampleVi":"Cô ấy là một giáo viên.","image":"🧑‍🏫","tags":["profession"],"source":"seed"}
{"id":"A1-v-0002","level":"A1","topic":"to-be-pronouns","en":"happy","vi":"vui vẻ","pos":"adjective","ipa":"/ˈhæp.i/","exampleEn":"I am happy.","exampleVi":"Tôi vui.","image":"😊","tags":["emotion"],"source":"seed"}
```

---

### 8.3 A2 — Danh từ & Mạo từ  (`nouns-articles`)

```text
BẬC A2 · topic "nouns-articles" · level "A2".
SỐ LƯỢNG: A2.sentences.json ≥ 200 câu; A2.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- Danh từ đếm được số ít/số nhiều: quy tắc -s/-es/-ies và một số bất quy tắc phổ biến (man→men, child→children...).
- Mạo từ a/an/the; this/these/that/those.
- there is / there are.
- Số đếm làm lượng từ ("three cats"); some/any ở mức đơn giản.
- Động từ CHÍNH vẫn chỉ là to be.
CẤM: động từ thường chia thì; các thì hành động.

blanks ưu tiên: khoét danh từ số nhiều (luyện -s/-es) HOẶC to be để luyện hợp ngôi (cats → are).
Vocab phủ chủ đề: con vật, đồ ăn/trái cây, đồ dùng lớp học, đồ chơi, phương tiện (danh từ đếm được).

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"A2-s-0001","level":"A2","topic":"nouns-articles","grammarPoint":"a-an","en":"It is an apple.","vi":"Nó là một quả táo.","tokens":[{"text":"It","pos":"pronoun","role":"subject"},{"text":"is","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg"},{"text":"an","pos":"article","role":"det"},{"text":"apple","pos":"noun","role":"complement","lemma":"apple","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":2,"answer":"an","hint":"Apple bắt đầu bằng âm nguyên âm.","promptVi":"Điền a hoặc an."}],"difficulty":1,"tags":["article"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"complement","tokenIndices":[2,3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A2-s-0002","level":"A2","topic":"nouns-articles","grammarPoint":"plural-agreement","en":"The cats are black.","vi":"Những con mèo màu đen.","tokens":[{"text":"The","pos":"article","role":"det"},{"text":"cats","pos":"noun","role":"subject","lemma":"cat","feature":"pl"},{"text":"are","pos":"verb","role":"verb","lemma":"be","feature":"present-other"},{"text":"black","pos":"adjective","role":"complement"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"cats","hint":"số nhiều của cat","promptVi":"Điền dạng số nhiều của cat."}],"difficulty":2,"tags":["plural"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0,1]},{"clauseId":"c1","role":"verb","tokenIndices":[2]},{"clauseId":"c1","role":"complement","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A2-v-0001","level":"A2","topic":"nouns-articles","en":"apple","vi":"quả táo","pos":"noun","ipa":"/ˈæp.əl/","forms":{"plural":"apples"},"exampleEn":"It is an apple.","exampleVi":"Nó là một quả táo.","image":"🍎","tags":["food"],"source":"seed"}
```

---

### 8.4 A3 — Tính từ & Sở hữu  (`adjectives-possessives`)

```text
BẬC A3 · topic "adjectives-possessives" · level "A3".
SỐ LƯỢNG: A3.sentences.json ≥ 200 câu; A3.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- Tính từ đứng trước danh từ (trật tự cơ bản: a big red ball) và sau to be.
- Tính từ sở hữu: my, your, his, her, its, our, their (pos "determiner", role "det").
- Sở hữu cách 's ("Nam's book"); whose.
- Động từ CHÍNH vẫn là to be.
CẤM: động từ thường chia thì.

blanks ưu tiên: khoét tính từ sở hữu (my/your/his/her...) hoặc tính từ mô tả.
Vocab phủ chủ đề: gia đình, bộ phận cơ thể, màu sắc, tính từ mô tả người/vật.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"A3-s-0001","level":"A3","topic":"adjectives-possessives","grammarPoint":"possessive-adjective","en":"This is my sister.","vi":"Đây là chị gái của tôi.","tokens":[{"text":"This","pos":"pronoun","role":"subject"},{"text":"is","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg"},{"text":"my","pos":"determiner","role":"det"},{"text":"sister","pos":"noun","role":"complement","lemma":"sister","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":2,"answer":"my","hint":"tính từ sở hữu của I","promptVi":"Điền tính từ sở hữu tương ứng với I."}],"difficulty":1,"tags":["possessive","family"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"complement","tokenIndices":[2,3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A3-s-0002","level":"A3","topic":"adjectives-possessives","grammarPoint":"possessive-adjective","en":"Her eyes are blue.","vi":"Đôi mắt của cô ấy màu xanh.","tokens":[{"text":"Her","pos":"determiner","role":"det"},{"text":"eyes","pos":"noun","role":"subject","lemma":"eye","feature":"pl"},{"text":"are","pos":"verb","role":"verb","lemma":"be","feature":"present-other"},{"text":"blue","pos":"adjective","role":"complement"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":0,"answer":"Her","hint":"tính từ sở hữu của she","promptVi":"Điền tính từ sở hữu tương ứng với she."}],"difficulty":2,"tags":["possessive","body"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0,1]},{"clauseId":"c1","role":"verb","tokenIndices":[2]},{"clauseId":"c1","role":"complement","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"A3-v-0001","level":"A3","topic":"adjectives-possessives","en":"sister","vi":"chị/em gái","pos":"noun","ipa":"/ˈsɪs.tər/","forms":{"plural":"sisters"},"exampleEn":"This is my sister.","exampleVi":"Đây là chị gái của tôi.","image":"👧","tags":["family"],"source":"seed"}
```

---

### 8.5 B1 — Hiện tại đơn  (`present-simple`)

```text
BẬC B1 · topic "present-simple" · level "B1".
SỐ LƯỢNG: B1.sentences.json ≥ 200 câu; B1.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- Động từ thường hiện tại đơn: base + s/es cho he/she/it (feature present-3sg / present-other).
- do/does trong phủ định & nghi vấn (don't/doesn't; Do/Does + S + V?).
- Trạng từ tần suất: always, usually, often, sometimes, never (role "adverbial").
- Tân ngữ sau động từ (role "object").
CẤM: hiện tại tiếp diễn; quá khứ; tương lai; hiện tại hoàn thành.

blanks ưu tiên: khoét động từ chính để luyện chia theo ngôi (play → plays); hint = "<lemma> → chia theo <đại từ> (hiện tại đơn)".
Vocab phủ chủ đề: động từ sinh hoạt (get up, go, eat, study, play, watch...), sở thích, buổi trong ngày, ngày trong tuần.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"B1-s-0001","level":"B1","topic":"present-simple","grammarPoint":"third-person-s","en":"She plays tennis.","vi":"Cô ấy chơi quần vợt.","tokens":[{"text":"She","pos":"pronoun","role":"subject"},{"text":"plays","pos":"verb","role":"verb","lemma":"play","feature":"present-3sg"},{"text":"tennis","pos":"noun","role":"object","lemma":"tennis","feature":"uncountable"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"plays","hint":"play → chia theo she (hiện tại đơn)","promptVi":"Chia play ở hiện tại đơn, câu khẳng định."}],"difficulty":1,"tags":["affirmative","hobby"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"object","tokenIndices":[2]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"B1-s-0002","level":"B1","topic":"present-simple","grammarPoint":"do-support-negative","en":"They don't like fish.","vi":"Họ không thích cá.","tokens":[{"text":"They","pos":"pronoun","role":"subject"},{"text":"don't","pos":"verb","role":"verb","lemma":"do","feature":"aux-present-other-neg"},{"text":"like","pos":"verb","role":"verb","lemma":"like","feature":"base"},{"text":"fish","pos":"noun","role":"object","lemma":"fish","feature":"uncountable"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"don't","alt":["do not"],"hint":"phủ định hiện tại đơn với they","promptVi":"Điền trợ động từ phủ định ở hiện tại đơn."}],"difficulty":2,"tags":["negative"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,2]},{"clauseId":"c1","role":"object","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"B1-v-0001","level":"B1","topic":"present-simple","en":"play","vi":"chơi","pos":"verb","ipa":"/pleɪ/","forms":{"thirdSg":"plays","past":"played","ing":"playing","irregular":false},"exampleEn":"She plays tennis.","exampleVi":"Cô ấy chơi quần vợt.","image":"🎾","tags":["action"],"source":"seed"}
```

---

### 8.6 B2 — Hiện tại tiếp diễn  (`present-continuous`)

```text
BẬC B2 · topic "present-continuous" · level "B2".
SỐ LƯỢNG: B2.sentences.json ≥ 200 câu; B2.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- am/is/are + V-ing (feature ing); quy tắc thêm -ing (run→running, make→making, sit→sitting).
- Khẳng/phủ/nghi vấn thì tiếp diễn.
- Trạng từ chỉ thời điểm: now, at the moment, right now.
- Có thể pha vài câu ĐỐI CHIẾU với hiện tại đơn (đánh tag "contrast").
CẤM: quá khứ; tương lai; hiện tại hoàn thành.

blanks ưu tiên: khoét V-ing (hint = "<lemma> → V-ing") HOẶC khoét to be trợ động (am/is/are).
Vocab phủ chủ đề: động từ hành động quan sát được, nơi chốn, hoạt động ngoài trời.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"B2-s-0001","level":"B2","topic":"present-continuous","grammarPoint":"be-ving","en":"He is reading a book.","vi":"Cậu ấy đang đọc một quyển sách.","tokens":[{"text":"He","pos":"pronoun","role":"subject"},{"text":"is","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg"},{"text":"reading","pos":"verb","role":"verb","lemma":"read","feature":"ing"},{"text":"a","pos":"article","role":"det"},{"text":"book","pos":"noun","role":"object","lemma":"book","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":2,"answer":"reading","hint":"read → V-ing","promptVi":"Chia read ở dạng V-ing."}],"difficulty":1,"tags":["affirmative"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,2]},{"clauseId":"c1","role":"object","tokenIndices":[3,4]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"B2-s-0002","level":"B2","topic":"present-continuous","grammarPoint":"be-ving-negative","en":"We aren't playing now.","vi":"Bây giờ chúng tôi không chơi.","tokens":[{"text":"We","pos":"pronoun","role":"subject"},{"text":"aren't","pos":"verb","role":"verb","lemma":"be","feature":"present-other-neg"},{"text":"playing","pos":"verb","role":"verb","lemma":"play","feature":"ing"},{"text":"now","pos":"adverb","role":"adverbial"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":2,"answer":"playing","hint":"play → V-ing","promptVi":"Chia play ở dạng V-ing."}],"difficulty":2,"tags":["negative"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,2]},{"clauseId":"c1","role":"adverbial","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"],"orderAlternatives":["Now we aren't playing."]}
{"id":"B2-v-0001","level":"B2","topic":"present-continuous","en":"read","vi":"đọc","pos":"verb","ipa":"/riːd/","forms":{"thirdSg":"reads","past":"read","ing":"reading","irregular":true},"exampleEn":"He is reading a book.","exampleVi":"Cậu ấy đang đọc sách.","image":"📖","tags":["action"],"source":"seed"}
```

---

### 8.7 B3 — Quá khứ đơn  (`past-simple`)

```text
BẬC B3 · topic "past-simple" · level "B3".
SỐ LƯỢNG: B3.sentences.json ≥ 200 câu; B3.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- was / were.
- Động từ có quy tắc thêm -ed (played, watched, studied) và bất quy tắc phổ biến (go→went, eat→ate, see→saw, have→had...).
- did/didn't trong phủ định & nghi vấn (động từ chính về base).
- Mốc thời gian quá khứ: yesterday, last night/week, ... ago.
CẤM: tương lai; hiện tại hoàn thành; quá khứ tiếp diễn.

blanks ưu tiên: khoét động từ quá khứ (hint = "<lemma> → quá khứ"); đảm bảo phủ đủ động từ bất quy tắc.
Vocab: tập trung BỘ ĐỘNG TỪ (ghi forms.past + irregular), kèm mốc thời gian quá khứ.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"B3-s-0001","level":"B3","topic":"past-simple","grammarPoint":"regular-ed","en":"I watched TV yesterday.","vi":"Hôm qua tôi đã xem tivi.","tokens":[{"text":"I","pos":"pronoun","role":"subject"},{"text":"watched","pos":"verb","role":"verb","lemma":"watch","feature":"past"},{"text":"TV","pos":"noun","role":"object","lemma":"tv","feature":"sg"},{"text":"yesterday","pos":"adverb","role":"adverbial"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"watched","hint":"watch → quá khứ","promptVi":"Chia watch ở quá khứ đơn."}],"difficulty":1,"tags":["affirmative","regular"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"object","tokenIndices":[2]},{"clauseId":"c1","role":"adverbial","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"],"orderAlternatives":["Yesterday I watched TV."]}
{"id":"B3-s-0002","level":"B3","topic":"past-simple","grammarPoint":"did-support-negative","en":"She didn't go to school.","vi":"Cô ấy đã không đi học.","tokens":[{"text":"She","pos":"pronoun","role":"subject"},{"text":"didn't","pos":"verb","role":"verb","lemma":"do","feature":"aux-past-neg"},{"text":"go","pos":"verb","role":"verb","lemma":"go","feature":"base"},{"text":"to","pos":"preposition","role":"prep"},{"text":"school","pos":"noun","role":"prep-object","lemma":"school","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"didn't","alt":["did not"],"hint":"phủ định quá khứ","promptVi":"Điền trợ động từ phủ định ở quá khứ đơn."}],"difficulty":2,"tags":["negative"],"source":"seed","roleSpans":[],"exerciseTypes":["pos","fill","order"]}
{"id":"B3-v-0001","level":"B3","topic":"past-simple","en":"go","vi":"đi","pos":"verb","ipa":"/ɡoʊ/","forms":{"thirdSg":"goes","past":"went","ing":"going","irregular":true},"exampleEn":"She went home.","exampleVi":"Cô ấy đã về nhà.","image":"🚶","tags":["action","irregular"],"source":"seed"}
```

---

### 8.8 B4 — Tương lai & Ôn 4 thì  (`future-review`)

```text
BẬC B4 · topic "future-review" · level "B4".
SỐ LƯỢNG: B4.sentences.json ≥ 200 câu; B4.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- will + V(base); won't.
- be going to + V(base).
- Mốc thời gian: tomorrow, next week/month, soon, tonight.
- PHA ÔN 4 thì đã học (present simple/continuous, past simple) — đánh tag "review" cho câu ôn.
CẤM: hiện tại hoàn thành; câu điều kiện; bị động.

blanks ưu tiên: khoét will/won't hoặc động từ base sau will.
Vocab phủ chủ đề: kế hoạch, thời tiết, dự định, hoạt động cuối tuần.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"B4-s-0001","level":"B4","topic":"future-review","grammarPoint":"will-affirmative","en":"I will help you.","vi":"Tôi sẽ giúp bạn.","tokens":[{"text":"I","pos":"pronoun","role":"subject"},{"text":"will","pos":"verb","role":"verb","lemma":"will","feature":"aux-future"},{"text":"help","pos":"verb","role":"verb","lemma":"help","feature":"base"},{"text":"you","pos":"pronoun","role":"object"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"will","hint":"trợ động từ tương lai","promptVi":"Dùng will để hoàn thành câu khẳng định."}],"difficulty":1,"tags":["future"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,2]},{"clauseId":"c1","role":"object","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"B4-s-0002","level":"B4","topic":"future-review","grammarPoint":"will-negative","en":"They won't come tomorrow.","vi":"Ngày mai họ sẽ không đến.","tokens":[{"text":"They","pos":"pronoun","role":"subject"},{"text":"won't","pos":"verb","role":"verb","lemma":"will","feature":"aux-future-neg"},{"text":"come","pos":"verb","role":"verb","lemma":"come","feature":"base"},{"text":"tomorrow","pos":"adverb","role":"adverbial"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":1,"answer":"won't","alt":["will not"],"hint":"phủ định tương lai","promptVi":"Dùng dạng phủ định của will."}],"difficulty":2,"tags":["future","negative"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"subject","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,2]},{"clauseId":"c1","role":"adverbial","tokenIndices":[3]}],"exerciseTypes":["pos","fill","order","roles"],"orderAlternatives":["Tomorrow they won't come."]}
{"id":"B4-v-0001","level":"B4","topic":"future-review","en":"tomorrow","vi":"ngày mai","pos":"adverb","ipa":"/təˈmɑːroʊ/","exampleEn":"They won't come tomorrow.","exampleVi":"Ngày mai họ sẽ không đến.","image":"📅","tags":["time"],"source":"seed"}
```

---

### 8.9 C1 — Câu hỏi Wh-  (`wh-questions`)

```text
BẬC C1 · topic "wh-questions" · level "C1".
SỐ LƯỢNG: C1.sentences.json ≥ 200 câu; C1.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- Từ để hỏi: what, where, when, who, why, how, which, whose, how many/much/old.
- Trật tự câu hỏi với các thì ĐÃ HỌC (present simple/continuous, past simple, to be).
- Có thể kèm câu trả lời mẫu (tách thành câu riêng, tag "answer").
CẤM: thì ngoài phạm vi đã học; câu hỏi gián tiếp.

Áp dụng quy tắc role wh- trong BLOCK 0. Câu hỏi kết thúc bằng token "?" (pos/role "punct").
blanks ưu tiên: khoét TỪ ĐỂ HỎI (hint = "hỏi về <nơi chốn/thời gian/lý do...>") hoặc trợ động từ.
Vocab phủ chủ đề: từ để hỏi + danh/động từ ngữ cảnh hỏi–đáp thường ngày.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"C1-s-0001","level":"C1","topic":"wh-questions","grammarPoint":"where-do","en":"Where do you live?","vi":"Bạn sống ở đâu?","tokens":[{"text":"Where","pos":"adverb","role":"adverbial"},{"text":"do","pos":"verb","role":"verb","lemma":"do","feature":"aux-present-other"},{"text":"you","pos":"pronoun","role":"subject"},{"text":"live","pos":"verb","role":"verb","lemma":"live","feature":"base"},{"text":"?","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":0,"answer":"Where","hint":"hỏi về nơi chốn","promptVi":"Điền từ để hỏi về nơi chốn."}],"difficulty":1,"tags":["question","where"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"adverbial","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1,3]},{"clauseId":"c1","role":"subject","tokenIndices":[2]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"C1-s-0002","level":"C1","topic":"wh-questions","grammarPoint":"what-be","en":"What is your name?","vi":"Tên bạn là gì?","tokens":[{"text":"What","pos":"pronoun","role":"complement"},{"text":"is","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg"},{"text":"your","pos":"determiner","role":"det"},{"text":"name","pos":"noun","role":"subject","lemma":"name","feature":"sg"},{"text":"?","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":0,"answer":"What","hint":"hỏi về sự vật/thông tin","promptVi":"Điền từ để hỏi tên người."}],"difficulty":1,"tags":["question","what"],"source":"seed","roleSpans":[{"clauseId":"c1","role":"complement","tokenIndices":[0]},{"clauseId":"c1","role":"verb","tokenIndices":[1]},{"clauseId":"c1","role":"subject","tokenIndices":[2,3]}],"exerciseTypes":["pos","fill","order","roles"]}
{"id":"C1-v-0001","level":"C1","topic":"wh-questions","en":"where","vi":"ở đâu","pos":"adverb","ipa":"/wer/","exampleEn":"Where do you live?","exampleVi":"Bạn sống ở đâu?","image":"📍","tags":["question-word"],"source":"seed"}
```

---

### 8.10 C2 — Giới từ & Liên từ  (`prepositions-conjunctions`)

```text
BẬC C2 · topic "prepositions-conjunctions" · level "C2".
SỐ LƯỢNG: C2.sentences.json ≥ 200 câu; C2.vocab.json ≥ 100 từ.

CHỈ DÙNG:
- Giới từ thời gian: in/on/at (in April, on Monday, at 7 o'clock).
- Giới từ nơi chốn: in/on/at/under/behind/next to/between/in front of/near.
- Liên từ: and, but, or, because, so.
- Các thì đã học.
CẤM: mệnh đề quan hệ; liên từ phụ thuộc phức tạp (although, unless...).

blanks ưu tiên: khoét giới từ (hint = "giới từ nơi chốn/thời gian") hoặc liên từ.
Vocab phủ chủ đề: nơi chốn, phương hướng, đồ vật trong nhà, mốc thời gian.

VÍ DỤ MẪU (tách theo loại file khi import):
{"id":"C2-s-0001","level":"C2","topic":"prepositions-conjunctions","grammarPoint":"preposition-place","en":"The cat is under the table.","vi":"Con mèo ở dưới cái bàn.","tokens":[{"text":"The","pos":"article","role":"det"},{"text":"cat","pos":"noun","role":"subject","lemma":"cat","feature":"sg"},{"text":"is","pos":"verb","role":"verb","lemma":"be","feature":"present-3sg"},{"text":"under","pos":"preposition","role":"prep"},{"text":"the","pos":"article","role":"det"},{"text":"table","pos":"noun","role":"prep-object","lemma":"table","feature":"sg"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":3,"answer":"under","hint":"giới từ nơi chốn: ở dưới","promptVi":"Điền giới từ mang nghĩa ở dưới."}],"difficulty":1,"tags":["preposition","place"],"source":"seed","roleSpans":[],"exerciseTypes":["pos","fill","order"]}
{"id":"C2-s-0002","level":"C2","topic":"prepositions-conjunctions","grammarPoint":"conjunction-but","en":"I like tea but she likes coffee.","vi":"Tôi thích trà nhưng cô ấy thích cà phê.","tokens":[{"text":"I","pos":"pronoun","role":"subject"},{"text":"like","pos":"verb","role":"verb","lemma":"like","feature":"present-other"},{"text":"tea","pos":"noun","role":"object","lemma":"tea","feature":"uncountable"},{"text":"but","pos":"conjunction","role":"conj"},{"text":"she","pos":"pronoun","role":"subject"},{"text":"likes","pos":"verb","role":"verb","lemma":"like","feature":"present-3sg"},{"text":"coffee","pos":"noun","role":"object","lemma":"coffee","feature":"uncountable"},{"text":".","pos":"punct","role":"punct"}],"blanks":[{"tokenIndex":3,"answer":"but","hint":"liên từ chỉ sự tương phản","promptVi":"Điền liên từ mang nghĩa nhưng."}],"difficulty":2,"tags":["conjunction"],"source":"seed","roleSpans":[],"exerciseTypes":["pos","fill","order"]}
{"id":"C2-v-0001","level":"C2","topic":"prepositions-conjunctions","en":"under","vi":"ở dưới","pos":"preposition","ipa":"/ˈʌn.dər/","exampleEn":"The cat is under the table.","exampleVi":"Con mèo ở dưới cái bàn.","image":"⬇️","tags":["place"],"source":"seed"}
```

---

### 8.11 C3 — Đọc hiểu & Viết lại câu  (`reading-rewrite`)

C3 có **4 file**: `C3.vocab.json`, `C3.theory.json`, `C3.passages.json`, `C3.rewrites.json`. Sinh riêng từng loại bằng C3-A/B/C và prompt theory §8.13; không bắt buộc sentences cho C3.

**Prompt C3-A — Đọc hiểu (`C3.passages.json`):**

```text
BẬC C3 · Đọc hiểu · level "C3".
SỐ LƯỢNG: C3.passages.json ≥ 40 đoạn, mỗi đoạn 3–5 câu hỏi. Sinh theo lô 10 đoạn/lần.
CHỈ xuất JSON theo schema Passage:
Passage = { id:"C3-p-0001", level:"C3", title, en, vi, wordCount, audioId?,
  questions:[{id, type:"mcq"|"tf"|"short", q, options?, answer, alt?, explain}], glossary?:[{en,vi}], source:"seed" }

YÊU CẦU:
- Đoạn 60–90 từ, chủ đề gần gũi trẻ tiểu học (gia đình, trường lớp, con vật, kỳ nghỉ, sở thích).
- Ngữ pháp trong đoạn KHÔNG vượt các thì đã học tới B4.
- Mỗi đoạn: ít nhất 1 câu mcq (4 options), 1 câu tf, 1 câu short. q & explain viết bằng tiếng Việt; answer bằng tiếng Anh; riêng tf dùng chuỗi JSON "true"/"false" (chữ thường, không phải boolean).
- glossary: 3–6 từ khó kèm nghĩa tiếng Việt.
- q phải trả lời được TỪ đoạn văn; explain nêu rõ chỗ suy ra. Short phải giới hạn dạng trả lời và có alt cho biến thể đúng; không dùng câu trả lời mở rộng tuỳ ý để chấm điểm. MCQ có đúng một đáp án đúng, tf chỉ dùng chuỗi "true"/"false".

VÍ DỤ MẪU:
{"id":"C3-p-0001","level":"C3","title":"My Weekend","en":"On Saturday, Mai gets up early. She helps her mother in the kitchen. In the afternoon, she plays badminton with her brother. They have a lot of fun. On Sunday, Mai visits her grandparents in the countryside. She loves the fresh air and the green fields. Her grandfather grows vegetables in a small garden. Mai waters the plants and takes some vegetables home.","vi":"Vào thứ Bảy, Mai dậy sớm. Cô bé giúp mẹ trong bếp. Buổi chiều, cô chơi cầu lông với anh trai. Họ rất vui. Chủ nhật, Mai về thăm ông bà ở quê. Cô thích không khí trong lành và những cánh đồng xanh. Ông của Mai trồng rau trong một khu vườn nhỏ. Mai tưới cây và mang một ít rau về nhà.","wordCount":63,"questions":[{"id":"C3-p-0001-q1","type":"mcq","q":"Sáng thứ Bảy Mai giúp ai?","options":["her brother","her mother","her grandparents","her teacher"],"answer":"her mother","explain":"Đoạn văn: 'She helps her mother in the kitchen.'"},{"id":"C3-p-0001-q2","type":"tf","q":"Mai chơi bóng đá vào buổi chiều thứ Bảy. Đúng hay sai?","answer":"false","explain":"Cô ấy chơi cầu lông (badminton), không phải bóng đá."},{"id":"C3-p-0001-q3","type":"short","q":"Chủ nhật Mai đến vùng nào? Điền cụm chỉ nơi chốn.","answer":"the countryside","explain":"Câu: 'On Sunday, Mai visits her grandparents in the countryside.'","alt":["countryside","in the countryside","to the countryside"]}],"glossary":[{"en":"countryside","vi":"vùng quê"},{"en":"fresh air","vi":"không khí trong lành"},{"en":"vegetables","vi":"rau củ"}],"source":"seed"}
```

**Prompt C3-B — Viết lại câu (`C3.rewrites.json`):**

```text
BẬC C3 · Viết lại câu · level "C3".
SỐ LƯỢNG: C3.rewrites.json ≥ 200 cặp. Sinh theo lô 50/lần.
CHỈ xuất JSON theo schema Rewrite:
Rewrite = { id:"C3-r-0001", level:"C3",
  type:"affirm-neg"|"neg-affirm"|"statement-question"|"contraction"|"synonym"|"word-order",
  promptEn, promptVi, answer, alt?, vi, hint?, source:"seed" }

YÊU CẦU:
- Phủ đủ 6 type theo quota. word-order chỉ đổi vị trí trạng ngữ hợp lệ và giữ nghĩa; không dùng bị động. contraction phải chỉ rõ dạng cần rút gọn/mở rộng; synonym phải chỉ rõ cụm cần thay hoặc từ gợi ý để giới hạn đáp án.
- Ngữ pháp không vượt B4. Câu ngắn, rõ.
- answer là đáp án chuẩn; alt liệt kê biến thể chấp nhận (vd rút gọn/đầy đủ: "is not"/"isn't").
- vi = nghĩa câu; promptVi = chỉ dẫn luôn hiện ("Chuyển sang phủ định", "Rút gọn is not", "Đặt câu hỏi Yes/No"...), hint = trợ giúp thêm lúc luyện. Alt phải đáp ứng đúng chỉ dẫn; không chấp nhận dạng đầy đủ nếu đề yêu cầu rút gọn.

VÍ DỤ MẪU:
{"id":"C3-r-0001","level":"C3","type":"affirm-neg","promptEn":"She is a doctor.","answer":"She isn't a doctor.","alt":["She is not a doctor."],"vi":"Cô ấy là bác sĩ. → phủ định","hint":"Chuyển sang câu phủ định (thêm not, rút gọn isn't).","source":"seed","promptVi":"Chuyển sang câu phủ định; chấp nhận dạng đầy đủ hoặc rút gọn."}
{"id":"C3-r-0002","level":"C3","type":"statement-question","promptEn":"They play football.","answer":"Do they play football?","alt":[],"vi":"Họ chơi bóng đá. → câu hỏi Yes/No","hint":"Đặt câu hỏi Yes/No với do.","source":"seed","promptVi":"Đặt câu hỏi Yes/No với do."}
{"id":"C3-r-0003","level":"C3","type":"synonym","promptEn":"The film is very good.","answer":"The film is great.","alt":[],"vi":"Bộ phim rất hay. → viết lại đồng nghĩa","hint":"Viết lại câu bằng cách thay 'very good' bằng 'great'; giữ nguyên các từ còn lại.","source":"seed","promptVi":"Viết lại câu bằng cách thay 'very good' bằng 'great'; giữ nguyên các từ còn lại."}
```

---

**Prompt C3-C — Từ vựng (`C3.vocab.json`):**

```text
BẬC C3 · topic "reading-rewrite" · level "C3".
SỐ LƯỢNG BẮT BUỘC: ≥100 từ/cụm từ; xuất đúng số lượng và khoảng ID của batch được giao, tiếp tục đến đủ tổng định mức.
Dùng schema Vocab của BLOCK 0. Chọn từ xuất hiện trong các Passage đã cung cấp,
ưu tiên gia đình, trường học, sở thích, kỳ nghỉ; không tạo một danh sách từ khó không liên quan.
exampleEn lấy hoặc phỏng theo câu trong Passage, ngữ pháp không vượt B4/C2.
Không dùng số lượng để ép thêm từ trùng. IPA theo Anh-Mỹ, nghĩa đúng ngữ cảnh.
Nếu en là cụm nhiều từ, engine không dùng item đó cho bài xếp chữ cái một từ.
```

### 8.12 K — Mẫu giáo  (`kindergarten`)

Track nhẹ, **không ngữ pháp**. Hai file: `K.vocab.json` (như thường, nhưng `image` BẮT BUỘC) và `K.phrases.json`.

**Prompt K-A — Từ vựng (`K.vocab.json`):**

```text
BẬC K (mẫu giáo) · topic "kindergarten" · level "K".
SỐ LƯỢNG: K.vocab.json ≥ 120 từ. Sinh theo lô 40/lần.
Dùng schema Vocab (BLOCK 0). image BẮT BUỘC (1 emoji rõ nghĩa hoặc asset key đã được cung cấp). ipa Anh-Mỹ chuẩn, chỉ là metadata, không hiển thị như yêu cầu học cho bé.
Chủ đề: bảng chữ cái A–Z (mỗi chữ 1 từ minh hoạ), số 1–10, màu sắc, con vật, gia đình, đồ ăn, bộ phận cơ thể, đồ chơi, hành động đơn giản.
- Với item bảng chữ cái: en chỉ là từ mẫu ("apple"), tags gồm "alphabet" và "letter-a"; UI suy chữ từ tag, exampleEn = "A is for apple.". Không đưa "A - apple" vào en để tránh sai TTS/xếp chữ. Dạy tên chữ và âm đầu là hai hoạt động riêng; không dùng TTS tên chữ để giả lập phonics.
- exampleEn phải là câu CỰC NGẮN (2–5 từ), thân thiện.

VÍ DỤ MẪU:
{"id":"K-v-0001","level":"K","topic":"kindergarten","en":"apple","vi":"quả táo","pos":"noun","ipa":"/ˈæp.əl/","forms":{"plural":"apples"},"exampleEn":"A is for apple.","exampleVi":"A là chữ của apple (quả táo).","image":"🍎","tags":["alphabet","food","letter-a"],"source":"seed"}
{"id":"K-v-0002","level":"K","topic":"kindergarten","en":"red","vi":"màu đỏ","pos":"adjective","ipa":"/red/","exampleEn":"It is red.","exampleVi":"Nó màu đỏ.","image":"🔴","tags":["color"],"source":"seed"}
{"id":"K-v-0003","level":"K","topic":"kindergarten","en":"dog","vi":"con chó","pos":"noun","ipa":"/dɔɡ/","forms":{"plural":"dogs"},"exampleEn":"I see a dog.","exampleVi":"Tôi thấy một con chó.","image":"🐶","tags":["animal"],"source":"seed"}
```

**Prompt K-B — Câu khung ngắn (`K.phrases.json`):**

```text
BẬC K (mẫu giáo) · Câu khung ngắn · level "K".
SỐ LƯỢNG: K.phrases.json ≥ 50 câu. Sinh theo lô 25/lần.
Schema Phrase = { id:"K-ph-0001", level:"K", en, vi, image, audioHint, audioId?, tags:[string], source:"seed" }
- en = câu/cụm 2–5 từ, cực dễ đọc ("It is red.", "I see a cat.", "a big dog").
- audioHint = phần cần đọc to (thường = en).
- image = 1 emoji minh hoạ.

VÍ DỤ MẪU:
{"id":"K-ph-0001","level":"K","en":"It is red.","vi":"Nó màu đỏ.","image":"🔴","audioHint":"It is red.","tags":["color"],"source":"seed"}
{"id":"K-ph-0002","level":"K","en":"I see a cat.","vi":"Tôi thấy một con mèo.","image":"🐱","audioHint":"I see a cat.","tags":["animal"],"source":"seed"}
```

> `Phrase` là loại dữ liệu chính thức ở §6; validator phải hỗ trợ ngay từ nền tảng, UI K triển khai ở Phase 4.

---

### 8.13 Prompt TheoryPage — áp dụng A1–C3

Chạy sau khi có tập câu đã duyệt của bậc (C3 nhận Passage/Rewrite thay thế). Cung cấp tên bậc, phạm vi §3/§8, catalog kỹ năng và danh sách câu kèm ID. Đầu ra là bản nháp để duyệt, không tự thay thế lý thuyết đang phát hành.

```text
NHIỆM VỤ: Viết một trang lý thuyết tiếng Anh cho trẻ tiểu học Việt Nam theo bậc được cung cấp.
CHỈ trả một object JSON TheoryPage, không mảng, không markdown fence.
Schema:
{ id:<LEVEL>, title, level:<LEVEL>, summary,
  formulas:[{label, pattern, example}],
  sections:[{heading, body, table?:{columns:[string],rows:[[string]]},
             exampleIds?:[string],
             interactive?:"pronoun-swap"|"conjugation-wheel"|"sentence-builder"|"tense-compare"|null}],
  commonMistakes:[{wrong,right,why}], tips:[string] }

QUY TẮC:
- Giải thích tiếng Việt đơn giản; thuật ngữ mới có nghĩa tiếng Việt và ví dụ gần gũi.
- Summary 1–2 câu; 3–6 sections ngắn, mỗi section có một mục tiêu; 3–5 lỗi thường gặp;
  2–4 mẹo nhớ. Tránh lặp cùng quy tắc ở mọi section và tránh quy tắc tuyệt đối sai.
- Formulas theo nội dung: thì/to be có khẳng/phủ/hỏi; danh từ/mạo từ có mẫu cụm phù hợp;
  C3 dùng chiến lược đọc/biến đổi câu, không ép thành ba công thức chia thì.
- exampleIds CHỈ dùng ID Sentence đã cung cấp thuộc đúng bậc; không tự bịa ID.
  C3 không có Sentence thì bỏ exampleIds, đặt ví dụ ngắn trong body/formulas.
- Table: số ô mỗi row phải bằng số columns. Body là plain text, không HTML.
- Interactive chỉ chọn từ danh sách widget đang được app hỗ trợ do người yêu cầu cung cấp.
  Nếu không được cung cấp widget phù hợp thì null hoặc bỏ field.
  MVP chỉ pronoun-swap của A1; cấu hình mẫu đổi ngôi được code/duyệt riêng,
  không suy mọi cách chia động từ từ văn bản tự do do AI sinh.
- A1 phải giải thích I→am, he/she/it→is, you/we/they→are; phủ định, đảo be khi hỏi,
  trả lời ngắn, this/that/these/those; phân biệt loại từ với vai trò của cả cụm.
- Không dùng mẫu sai làm đáp án đúng. Trong commonMistakes, wrong là ví dụ cố ý sai,
  right và why phải sửa đúng lỗi trọng tâm.
- Không thêm source/createdAt hoặc field ngoài schema TheoryPage.
```

---

## 9. Lộ trình build và điều kiện nghiệm thu

### Phase 1 — A1 hoàn chỉnh, từ dữ liệu đến lưu kết quả

1. **Nền tảng:** cập nhật schema/runtime enums, catalog skill A1, validator cho đủ 6 loại nội dung, import batch/manifest và fixture lỗi. Định nghĩa EnglishExercise, grader và version dữ liệu; chưa gen hàng nghìn câu.
2. **Nội dung:** biên soạn TheoryPage A1; sinh ≥200 câu + ≥100 từ theo nhiều batch, duyệt toàn bộ, kiểm tra quota và các đề mẫu. Có câu khẳng/phủ/hỏi, trả lời ngắn và demonstratives; không chỉ thay tên trong cùng một câu.
3. **Engine và lưu:** ba dạng điền từ/xếp câu/phân tích (pos và cụm), chọn đề cân bằng, practice/test, progress migration, draft/resume và hoàn tất phiên chống lặp. Cả luyện và kiểm tra được làm trong Phase 1; thu dữ liệu ôn từ đầu.
4. **UI:** mode/route, trang lý thuyết có mục lục, ví dụ tô màu và widget đổi ngôi A1, chọn bài, runner, giải thích/result, TTS, sao/gacha qua adapter, trạng thái lỗi/lưu/offline. MVP chỉ hiện A1 đang có nội dung; các bậc khác “Sắp có”.

**Chỉ hoàn tất Phase 1 khi:**
- Trẻ làm được toàn bộ vòng học → luyện → kiểm tra → xem lỗi → học lại; kết quả vẫn còn sau tải lại.
- Đề 10 câu bao phủ 5 skill A1, không lặp câu nguồn; có ít nhất hai bộ đề đáp ứng điều kiện mastery §3. Luyện có gợi ý không cấp mastery.
- Grader có test đáp án biến thể, nháy cong, hoa/thường, khoảng trắng, dấu câu cuối; `a apple`/thiếu not vẫn sai; nghiệm xếp câu khác đúng vẫn được nhận; token trùng và nhóm chủ ngữ nhiều từ hoạt động đúng.
- Validator bắt dữ liệu sai, tham chiếu hỏng và các loại file không được bỏ qua; import nhiều batch tạo JSON hợp lệ và báo ID trùng.
- Đổi hồ sơ giữa phiên không ghi nhầm; refresh không đổi đề; nộp hai lần/remount/retry không tăng sao hoặc gacha hai lần; storage lỗi không báo lưu thành công; hai tab không ghi đè tiến trình nhau.
- Kiểm tra không lộ đáp án qua màu/TTS/hint; thao tác hoạt động bằng touch, chuột và bàn phím ở 320/390px và desktop; không phụ thuộc kéo thả.
- Build production chạy offline sau tải trước A1; thiếu giọng tiếng Anh vẫn hoàn tất được bài; quay lại Toán và phần thưởng cũ hoạt động bình thường. Chạy typecheck, test liên quan và build, ghi lại lỗi nền nếu có.

### Phase 2 — Mở nền câu và hiện tại đơn

- A2, A3, B1 + lý thuyết tương ứng; bổ sung bài chia động từ, xếp chữ từ đơn, nối từ–nghĩa khi đủ nội dung.
- Bản đồ kỹ năng/mastery mềm và placement gợi ý cho các bậc đã phát hành; dữ liệu tiến trình dùng nền Phase 1.
- Tăng quy mô seed từng bậc sau khi quota, grader và review đạt; chưa cần engine suy diễn mọi cách chia động từ, ưu tiên forms/đáp án được duyệt.

### Phase 3 — Các thì tiếp theo, đọc và biến đổi câu

- B2–B4, C1–C2 **và C3**, đủ theory/vocab và Passage/Rewrite; bổ sung widget phù hợp, bảng động từ bất quy tắc.
- Đọc hiểu, biến đổi câu (tách rõ đổi dạng và giữ nghĩa), nghe–chọn có audio khả dụng, hàng đợi ôn ngắt quãng và sổ luật.
- Nghiệm thu riêng short answer/alt, câu hỏi đảo trật tự, nhiều mệnh đề và audio thất bại; không bật roles cho cấu trúc chưa được duyệt.

### Phase 4 — Track K và AI bổ sung

- K: từ–hình, nghe–chọn, cụm ngắn và hoạt động chữ cái phù hợp tuổi; tái sử dụng module alphabet/preschool hiện có khi hợp lý. Tên chữ và phonics dùng asset/quy tắc riêng được duyệt; không bắt bé mẫu giáo nhập câu hoặc học thuật ngữ ngữ pháp.
- AI trong app dùng validator đã có từ Phase 1, thêm hàng đợi duyệt/envelope/quản lý dung lượng; chỉ nội dung approved vào luyện, không vào mastery.
- Cá nhân hoá theo sở thích là bổ sung cuối cùng, không là điều kiện để các bài học seed hoạt động.

---

## 10. Quyết định đã chốt và checklist trước khi code

- [x] Bắt đầu A1; ≥200 câu/≥100 từ + một trang lý thuyết; nội dung A1 duyệt 100%. Giới hạn chức năng MVP không giảm số lượng nội dung đã yêu cầu.
- [x] Giữ `feature`, thêm `roleSpans`, whitelist dạng bài, prompt rõ ngữ cảnh và đáp án biến thể; phân biệt vai trò từ với cụm.
- [x] Chấm offline theo tập đáp án đã duyệt; không dùng AI làm giám khảo kiểm tra.
- [x] Mastery mềm; placement Phase 2; phụ huynh chọn bậc đã phát hành; không ép tuyến tính.
- [x] Validator/import/version/progress/chống thưởng lặp là nền Phase 1; AI trong app Phase 4.
- [x] Track K độc lập, tận dụng preschool hiện có; không buộc K theo lộ trình ngữ pháp.
- [ ] Khi có yêu cầu triển khai: đồng bộ `schema.ts` và validator sơ bộ với §6–7, bổ sung catalog và fixture; không coi code hiện có đã đạt kế hoạch này.
- [x] Tạo và duyệt đủ ≥200 câu/≥100 từ A1, lý thuyết và quota đề; chỉ nghiệm thu khi đạt cả chất lượng và số lượng.
- [x] Thực hiện Phase 1 theo thứ tự §9, lưu báo cáo nghiệm thu và các giới hạn thực tế của thiết bị/TTS.

**Phạm vi bản chỉnh kế hoạch này:** chỉ cập nhật tài liệu; chưa triển khai UI/engine, chưa sửa schema/validator code và chưa sinh seed để dùng trong app.

---

*Cập nhật lần cuối: 2026-09-22.*
