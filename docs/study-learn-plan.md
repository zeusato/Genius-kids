# Ôn Luyện · Học bài — Kế hoạch thi công

> Lập 02/10/2026. Hiện bấm một chủ đề trong Ôn Luyện là mở hộp chọn kỹ năng rồi vào làm bài ngay, trẻ chưa được học lại kiến thức trước khi làm.
> Mục tiêu: bấm chủ đề thì trẻ chọn **Học bài** (kiến thức + cách giải từng dạng bài) hoặc **Luyện tập** (luồng làm bài hiện có).
> Phần Học bài dạy theo cách English Garden đang làm ([english-book-experience.md](english-book-experience.md)): chia thành nhiều trang nhỏ, công thức tách riêng và tô màu, có ví dụ, có chỗ dễ nhầm, cuối bài có trang ghi nhớ. Thêm các phần riêng của môn Toán: các dạng bài, ví dụ mẫu giải từng bước, thao tác kéo/chạm và phần "Em thử".
> Quyết định của chủ dự án (02/10): **(1) Claude soạn nội dung thẳng vào repo, chủ dự án duyệt theo từng lớp · (2) làm Lớp 3 + Lớp 5 trước, rồi Lớp 4 → 1 → 2 · (3) Mầm non dẫn sang hoạt động có sẵn · (4) +1 sao cho mỗi bài học xong, chỉ thưởng một lần.**
> Nhánh `feat/study-learn`. Trước khi sửa, đặt tag `study-before-learn` trên `main`.

## 0. Cách dùng plan này (đọc trước mỗi phiên)

**Trạng thái 04/10/2026:** theo yêu cầu mới “kiểm tra lại phần cuối, hoàn thiện để xuất bản”, đã mở đủ sáu lớp trong `PUBLISHED_GRADES`, tổng 188 bài. Đã kiểm build production và luồng offline/lưu lỗi thật, đóng bốn mục nội dung ở phần 13. Chưa push/deploy. Bàn giao và bằng chứng: [docs/study-learn/README.md](study-learn/README.md). Trạng thái giữ nháp ngày 03/10 là lịch sử của lượt trước.

1. Mỗi phiên chỉ làm **một mục GĐx.y** (mục 8). Đọc mục 7 "Bẫy" trước khi sửa code.
2. Không tự đổi quyết định ở mục 1. Gặp chỗ plan chưa nói thì chọn phương án **giữ tương thích ngược**, rồi ghi vào mục 14 "Nhật ký lệch plan".
3. Xong mỗi mục, chạy **lệnh nghiệm thu** của mục đó. Mọi lệnh phải xanh mới được commit.
4. Commit tiếng Việt theo lối repo, ví dụ `Học bài GĐ1.2: khung đọc bài, lật trang, đọc to`. Dòng cuối là `Co-Authored-By` theo hướng dẫn phiên.
5. **Không push, không kích hoạt deploy.** Chủ dự án tự đẩy code và tự deploy. Yêu cầu ngày 04/10 cho phép chuẩn bị bản xuất bản: mở lớp và build production cục bộ để nghiệm thu.
6. Lệnh chung:
   - Test: `npx vitest run` (theo phạm vi: `npx vitest run services/study src/components/study`)
   - Kiểu: `npx tsc --noEmit`. Chỉ được còn lỗi có sẵn ở `modules/farm/src/ui/renderSnapshot.ts:26`.
   - Mẫu đề: `node scripts/study-dump.mjs <skillId|topicId> [n]`
   - Ảnh: `node scripts/study-shots.mjs` (mở rộng ở GĐ1.5)

## 1. Quyết định đã chốt

| # | Quyết định | Chi tiết thi công |
|---|---|---|
| D1 | Claude soạn nội dung | Viết bằng TypeScript trong `services/study/lessons/content/gN.ts`, bám chương trình Toán GDPT 2018 và cách phát biểu quy tắc thường gặp trong SGK hiện hành. Test kiểm chuẩn tự động (mục 6), sau đó một phiên rà soát độc lập cho mỗi lớp. Chủ dự án duyệt trước khi phát hành lớp đó. |
| D2 | Thứ tự lớp | GĐ3 Lớp 3 → GĐ4 Lớp 5 → GĐ5 Mầm non → GĐ6 cầu nối → GĐ7 Lớp 4 → GĐ8 Lớp 1 → GĐ9 Lớp 2. |
| D3 | Mầm non | "Học bài" mở các hoạt động Mầm non có sẵn (Đếm Số; Màu Sắc & Hình Dạng). Kỹ năng nào chưa có hoạt động thì viết bài ngắn kiểu "xem – nghe – chạm", tự đọc to (mục 2.5). |
| D4 | Thưởng | **+1 sao cho mỗi bài, chỉ một lần**, khi đã mở mọi trang trước "Em thử" **và** làm đúng ≥ 2/3 câu Em thử. Câu đúng sau gợi ý vẫn được tính. Học bài **không** đổi % thành thạo, hàng đợi ôn, lịch sử, chuỗi ngày hay "Ôn hôm nay". Không quay gacha. |
| D5 | Đơn vị bài học | **Một bài = một kỹ năng** (`SkillDef`), **chương = chủ đề** (`Topic`). Không thêm, không đổi id kỹ năng hay chủ đề. Kỹ năng ★ Nâng cao cũng có bài, chỉ hiện khi bật "Nâng cao". |
| D6 | Nội dung tĩnh, chạy offline | Không gọi AI lúc chạy. Nội dung mỗi lớp là một chunk JS tải lười, được PWA precache như mọi JS (`pwa/sw.ts`). |
| D7 | Ví dụ mẫu và Em thử | Ví dụ mẫu dùng **số cố định**, viết tay, giải từng bước, trình bày như SGK. Câu "Em thử" **sinh từ template sẵn có** của kỹ năng, nên luôn đúng và mỗi lần một số khác. |
| D8 | Ký hiệu | Giữ D1/D5 của [study-wow-plan.md](study-wow-plan.md): nhóm nghìn bằng khoảng trắng không ngắt (` `), dấu phẩy thập phân, `×` cho nhân, `:` cho chia, dùng `?`/`□` (không viết "Tìm x"), viết thường `l`/`ml`, dùng "trả lại", viết "thứ Hai". Phân số trong dữ liệu là `"a/b"`, hiển thị tử trên mẫu dưới qua `Md` + `remarkMathText` ([mathText.ts](../src/utils/mathText.ts)). Mọi chữ có số đều đi qua `Md`. |
| D9 | Giao diện | Trang chủ đề nằm trong `HubShell`. Trang bài học toàn màn hình giống `Player`, nền trang **vở ô li** nhạt dùng token `--hub-*`. Ưu tiên tablet ngang 1180×820, vẫn chạy tốt ở 768 và 390, không tràn ngang ở 320. |
| D10 | Phát hành dần | Chỉ chủ đề có bài học trong lớp **đã phát hành** (`PUBLISHED_GRADES`) mới mở Trang chủ đề. Chủ đề khác giữ hành vi cũ (mở thẳng hộp Luyện tập). Bản dev hiện cả lớp chưa phát hành, gắn nhãn "Bản nháp". |
| D11 | Tiến độ học lưu riêng | Lưu ở `StudentProfile.learn` (mới), **không** lưu trong `StudentProfile.study`, vì `readStudyProgress` bỏ mọi trường lạ (mục 7). Mỗi lần ghi đi qua một action của context, có kiểm chủ hồ sơ, theo mẫu `persistRiddle`. |
| D12 | Nhân vật "bạn Bi" | Trang Chỗ dễ nhầm luôn viết "Bạn Bi làm thế này…" để không chê trẻ. Bi chỉ là tên gọi, không cần ảnh mới. |

## 2. Trải nghiệm đích

### 2.1 Luồng

```
Ôn Luyện (trang chủ) ── bấm thẻ chủ đề ──► Trang chủ đề /study/topic/:topicId
                                              ├─ [Học bài]   ► /study/learn/:skillId?page=…  (bài đầu chưa học xong)
                                              ├─ [Luyện tập] ► hộp TopicSheet hiện có (kỹ năng, số câu, Luyện tập / Kiểm tra nhanh)
                                              └─ từng bài:  [Học] ► bài đó   ·   [Luyện] ► 10 câu kỹ năng đó (practiceSkill)
Bài học: Mở đầu → Em cần biết → (Dạng k → Ví dụ mẫu k)… → Chỗ dễ nhầm → Em thử → Ghi nhớ
          └─ Ghi nhớ: [Luyện kỹ năng này] · [Bài tiếp theo] · [Về chủ đề]
```

Chủ đề luyện gõ phím và chủ đề chưa có bài học giữ hành vi cũ (D10).

### 2.2 Trang chủ đề

```
┌────────────────────────────────────────────────────────────────────┐
│ ← Về Ôn Luyện                                    ⭐ 24 · Minh Anh   │
├────────────────────────────────────────────────────────────────────┤
│ [÷]  PHÉP CHIA · LỚP 3 · HK1                              ( 45% )  │
│      Bảng chia, chia có dư, giảm đi, gấp mấy lần                   │
│                                                                    │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐│
│ │ 📖 HỌC BÀI          Nên học trước│ │ ✏️ LUYỆN TẬP                   ││
│ │ Kiến thức và cách giải        │ │ Làm bài, chấm từng câu, có    ││
│ │ từng dạng bài                 │ │ gợi ý khi sai                 ││
│ │ Đã học 1/4 bài                │ │ Thành thạo 45%                ││
│ │ [ Học tiếp: Chia có dư  → ]   │ │ [ Luyện tập  → ]              ││
│ └───────────────────────────────┘ └───────────────────────────────┘│
│ CÁC BÀI TRONG CHỦ ĐỀ                                                │
│ 1  Bảng chia 3, 4, 6, 7, 8, 9        ✓ Đã học   80%   [Học] [Luyện] │
│ 2  Chia cho số có một chữ số…        5/11 trang 30%   [Học] [Luyện] │
│ 3  Giảm một số đi nhiều lần · ≈4 ph  Chưa học   —     [Học] [Luyện] │
│ 4  Số lớn gấp mấy lần số bé · ≈5 ph  Chưa học   —     [Học] [Luyện] │
│ ✦ Nâng cao (khi bật): …                                            │
└────────────────────────────────────────────────────────────────────┘
```

- Ở 390 px, hai thẻ xếp chồng lên nhau. Mỗi dòng bài chia hai tầng: tên bài ở trên; trạng thái và hai nút ở dưới.
- Nút "Học tiếp" mở bài đầu tiên đang đọc dở. Không có bài đọc dở thì mở bài chưa học đầu tiên. Đã học hết thì nút thành "Xem lại bài" và có nhãn "Đã học hết ✓".
- Nhãn gợi ý: chưa học bài nào và chưa luyện câu nào thì thẻ Học bài có nhãn "Nên học trước". Học hết rồi mà thành thạo < 80% thì thẻ Luyện tập có nhãn "Nên luyện thêm".
- "≈ n phút" ước theo số trang và số chữ của bài.

### 2.3 Trang bài học

Khung giống `Player`: thanh trên có nút ← (về trang chủ đề), tên bài, thanh tiến độ trang, 🔊 (đọc trang này) và ≡ (danh sách trang). Thân trang là tờ vở ô li. Cuối trang có nút Trang trước / Trang tiếp và số trang.

| Loại trang | Nội dung |
|---|---|
| **Mở đầu** | Tên bài, "Học xong bài này, em sẽ…", tình huống đời sống (`hook`), chip "Em cần nhớ" nối tới bài cần học trước (`needs`). |
| **Em cần biết** (1–3 trang) | Mỗi trang một ý: đoạn ngắn, khung **QUY TẮC** (câu phát biểu kiểu SGK + công thức tô màu `{Tên}`), hình từ svg kit, bảng, hoặc một thao tác tương tác (mục 3.4). |
| **Dạng k** | Tên dạng, **Dấu hiệu nhận biết** (đề cho gì, hỏi gì), **Cách làm** (các bước đánh số). |
| **Ví dụ mẫu · Dạng k** | Đề bài (+ hình). Lời giải **hiện từng bước** bằng nút "Xem bước tiếp" (Enter/Space), có link "Xem cả lời giải". Đáp số và Thử lại hiện ở cuối. Dạng tính toán thì phát lại bằng widget đặt tính. |
| **Chỗ dễ nhầm** (≤ 3 trang) | Hai thẻ "Bạn Bi làm thế này" và "Cách đúng". Lời mời "Em thử tìm chỗ sai trước nhé" và nút "Vì sao?" (`<details>`). |
| **Em thử** | 3 câu sinh từ template (mục 2.4). |
| **Ghi nhớ** | 2–5 dòng ghi nhớ. Lời giải câu hỏi đầu bài (`hook.answer`). Nút: Luyện kỹ năng này (10 câu) · Bài tiếp theo · Về chủ đề. |

```
┌────────────────────────────────────────────────────────────────────┐
│ ←  Bài 2 · Chia cho số có một chữ số          ▓▓▓▓▓░░░░ 6/11  🔊  ≡ │
├────────────────────────────────────────────────────────────────────┤
│ VÍ DỤ MẪU · DẠNG 3: PHÉP CHIA CÓ DƯ                                 │
│ ┌──────────────────────────────────┐  ┌──────────────────────────┐ │
│ │ Đề bài: 186 : 4 = ?               │  │   186 │ 4                 │ │
│ │ ① 18 chia 4 được 4, viết 4.       │  │    26 ├────              │ │
│ │   4 nhân 4 bằng 16; 18 trừ 16 = 2. │  │     2 │ 46                │ │
│ │ ② Hạ 6, được 26. 26 chia 4 …      │  │                           │ │
│ │ [ Xem bước tiếp · 2/3 ]           │  │  (widget phát lại bước)   │ │
│ └──────────────────────────────────┘  └──────────────────────────┘ │
│        [← Trang trước]          06 / 11          [Trang tiếp →]      │
└────────────────────────────────────────────────────────────────────┘
```

- URL giữ trang hiện tại bằng `?page=<pageId>`. Phím ←/→ để lật trang. Esc về trang chủ đề.
- Khi lật trang thì đưa focus về tiêu đề và cuộn lên đầu, giống `BookReader`.
- Trang được tính là "đã xem" ngay khi mở, không có nút "Đánh dấu đã đọc".
- Đọc to: nút 🔊 đọc tiêu đề và chữ của trang qua `questionToSpeech`. Bài có `autoRead` (MN, L1) hoặc khi `prefs.tts` bật thì tự đọc mỗi lần sang trang. Ở trang ví dụ, mỗi bước mới hiện ra thì đọc bước đó.

### 2.4 Em thử, hoàn thành, thưởng

- Lấy 3 câu bằng `buildSession` với `picks` theo mức. Mức lấy từ `tryLevels`. Không có `tryLevels` thì lấy `forms[].level`, rồi bù bằng các mức của kỹ năng từ thấp đến cao cho đủ 3. Các câu được khử trùng.
- Cách chấm giống chế độ Luyện tập: sai lần đầu thì hiện gợi ý và loại lựa chọn đã chọn sai; sai lần hai thì hiện lời giải + `steps`. Mầm non: chạm là chấm, câu tự đọc.
- **Đạt** khi số câu đúng ≥ ⌈2/3 × số câu⌉ (3 câu thì cần 2). Khi đạt, gọi `saveLesson(owner, {kind:'try', …})`:
  - Đủ trang và lần đầu đạt thì hiện màn "Em đã học xong bài!" + **+1 ⭐** (confetti `study-confetti`).
  - Đã từng nhận sao thì chỉ hiện "Giỏi lắm!".
  - Thiếu trang thì hiện "Em còn n trang chưa xem" kèm link tới các trang đó.
- **Chưa đạt** thì hiện "Thử 3 câu khác" (tạo lại câu), "Xem lại ví dụ mẫu" (link tới trang ví dụ của dạng có câu sai) và "Đi tiếp". Thử lại không giới hạn số lần.
- Kết quả Em thử chỉ cập nhật `learn.lessons[skillId].best`. Không ghi vào `history`, `study`, thống kê bài làm hay hàng đợi ôn.

### 2.5 Mầm non

| Kỹ năng | "Học bài" mở |
|---|---|
| mn.count · Đếm đến 10 | `/preschool/counting?activity=learn`, `…count` |
| mn.numeral · Nhận biết số 0–10 | `/preschool/counting?activity=learn`, `…pick` |
| mn.more_less · Nhiều – ít – bằng nhau | `/preschool/counting?activity=compare` |
| mn.size · To – nhỏ, cao – thấp, dài – ngắn | `/preschool/counting?activity=compare` |
| mn.combine · Gộp – tách nhóm | `/preschool/counting?activity=add` (gộp) + **bài ngắn "Tách nhóm"** |
| mn.shapes2d · Hình tròn, vuông, tam giác, chữ nhật | `/preschool/colors?activity=shapes` |
| mn.colors · Màu sắc | `/preschool/colors?activity=learn`, `…pick` |
| mn.ordinal · Số thứ tự | **bài ngắn** |
| mn.pattern · Quy luật sắp xếp | **bài ngắn** |
| mn.shapes3d · Khối cầu, trụ, vuông, chữ nhật | **bài ngắn** |
| mn.position · Trên – dưới, trước – sau, trái – phải | **bài ngắn** |
| mn.daytime · Buổi trong ngày; hôm qua – hôm nay – ngày mai | **bài ngắn** |

- Thẻ hoạt động trên Trang chủ đề Mầm non dùng tên và ảnh có sẵn trong `PRESCHOOL_TOPICS`. Hoạt động không có trạng thái "đã học".
- Quay lại: hiện `usePreschoolActivity.back()` ([usePreschoolActivity.ts:30](../src/components/preschool/usePreschoolActivity.ts)) chỉ `navigate(-1)` khi `state.preschoolParent === location.pathname`. Mở từ Ôn Luyện thì trẻ sẽ rơi về menu Mầm non. Cần thêm `state.returnTo` (đường dẫn trang chủ đề) và `preschoolOwner`. Khi có `returnTo` và đúng chủ hồ sơ thì `back()` điều hướng về `returnTo`; không có thì giữ hành vi cũ.
- Bài ngắn MN: ≤ 4 trang, mỗi trang một hình lớn và một câu ≤ 12 từ, `autoRead: true`, không có trang Dạng/Ví dụ mẫu. Em thử có 3 câu. Thưởng theo D4.

### 2.6 Cầu nối học ↔ luyện (GĐ6)

- Thẻ chủ đề ở trang chủ thêm chip "📖 k/N bài". `TopicSheet` ghi "Đã học" và có link "Học" ở từng kỹ năng.
- `ResultView` thêm nút **"Học lại bài"** cho kỹ năng yếu nhất (đặt cạnh "Luyện tiếp kỹ năng yếu"). Mỗi dòng kỹ năng có nút "Học".
- `ReportView` thêm dấu "Đã học bài". Mục kỹ năng cần ôn thêm nút "Học lại".
- Thẻ "Ôn hôm nay": nếu kế hoạch có kỹ năng mới mà bài học chưa xong thì thêm dòng "Bài mới hôm nay: … · Học bài trước (≈ 4 phút)". Dòng này không chặn nút Bắt đầu.
- **Sổ tay công thức** `/study/rules`: gom mọi khối `rule` của lớp theo chủ đề, có ô tìm, in được (dùng lại cách in của `PrintView`).

## 3. Khung sư phạm và quy chuẩn biên soạn

### 3.1 Trình tự trang của một bài

`Mở đầu` → `Em cần biết` ×1–3 → (`Dạng k` → `Ví dụ mẫu k`) ×1–3 → `Chỗ dễ nhầm` ×0–3 (L3 trở lên ≥ 1) → `Em thử` → `Ghi nhớ`.
Bài thường có 8–13 trang. Tối đa 20 trang (giới hạn của bitmask, mục 5.3).

### 3.2 Giọng văn và độ dài

- Xưng "em". Câu ≤ 25 từ (L1–L2: ≤ 15). Đoạn ≤ 3 câu. Mỗi trang ≤ 4 khối.
- Số chữ tối đa mỗi trang: L1–L2 ≤ 40, L3 ≤ 70, L4–L5 ≤ 90 (không tính đề bài và lời giải của ví dụ).
- Câu quy tắc theo mẫu SGK, ví dụ "Muốn tìm số bị chia, ta lấy thương nhân với số chia." Mỗi quy tắc đi cùng ít nhất một ví dụ số.
- Tình huống dùng tên và đồ vật quen thuộc với trẻ Việt Nam, tiền đúng mệnh giá thật. Không dùng nhân vật có bản quyền.
- Không đưa nội dung vượt lớp vào bài cơ bản. Nội dung vượt lớp đặt trong kỹ năng ★ và gắn nhãn Nâng cao.

### 3.3 Trình bày lời giải

- Bài có lời văn (L2 trở lên) dùng `layout: 'solution'`: khung **Bài giải**, mỗi bước gồm câu lời giải (`say`) và phép tính kèm đơn vị trong ngoặc (`math`), cuối là "Đáp số: …".
- L1 dùng "Phép tính: … · Trả lời: …".
- Bài tính dùng `layout: 'calc'`: các bước tính theo đúng lời đọc của SGK, ví dụ "7 cộng 5 bằng 12, viết 2 nhớ 1".
- **Trừ có nhớ theo cách SGK**: "12 trừ 7 bằng 5, viết 5 nhớ 1; 2 thêm 1 bằng 3; 5 trừ 3 bằng 2, viết 2". Số nhớ được thêm vào hàng bên trái **của số trừ**. Không dùng cách "mượn" từ số bị trừ.
- Nhân đặt tính đọc thừa số dưới trước: "3 nhân 7 bằng 21, viết 1 nhớ 2".
- Chia đặt tính đọc theo nhịp chia – nhân – trừ – hạ.
- Có "Thử lại" khi SGK có thói quen thử lại: phép chia, tìm thành phần, tổng – hiệu, tổng – tỉ.

### 3.4 Thao tác (widget): khi nào dùng

Dùng khi trẻ hiểu nhanh hơn nhờ tự thay đổi số. Mỗi bài có tối đa 2 widget. Bộ widget:

| Widget | Dùng cho | Ghi chú |
|---|---|---|
| `explore` | Mọi hình trong svg kit cần đổi tham số: sơ đồ đoạn thẳng, đồng hồ, thanh/hình tròn phân số, lưới diện tích, trục số, hình tròn, góc, nhiệt kế, túi bóng, tiền | Chung một component: thanh trượt và nút −/+ điều khiển tham số của hàm svg kit, chú thích tính bằng hàm. Không phải vẽ hình mới. |
| `place-value` | Đọc, viết, phân tích số; so sánh; số thập phân; dời dấu phẩy khi ×/: 10, 100… | Đọc số bằng `readNumberVN`. Phần thập phân đọc "phẩy". |
| `column` | Đặt tính +, −, × (1 hoặc 2 chữ số), số thập phân | Phát lại từng bước, tô cột, ghi chữ số nhớ. |
| `long-division` | Đặt tính chia, có dư, thương có chữ số 0, số thập phân | Bố cục SGK (`short`: chỉ ghi số dư và chữ số hạ; `full`: ghi cả tích). |
| `unit-ladder` | Đổi đơn vị độ dài, khối lượng, dung tích, diện tích (×100), thể tích (×1000) | Có số đo hai tên đơn vị và cách viết dạng số thập phân. |

## 4. Kiến trúc và file

```
services/study/lessons/            ← MỚI, lõi thuần (không React)
  types.ts      Lesson, Block, KnowPage, Form, Worked, Mistake, WidgetSpec, LessonPage
  build.ts      hàm dựng nội dung: lesson, know, text, rule, pic, vis, table, note, widget, explore,
                form, worked, step, mistake; chuẩn hoá nhóm nghìn "12 345" → NBSP
  pages.ts      lessonPages(lesson) → LessonPage[] (id trang ổn định); tryIndex
  manifest.ts   LESSON_INDEX: Record<Grade, string[]>; PUBLISHED_GRADES; hasLesson; topicLessonIds; topicLearnable
  load.ts       loadLessonBook(grade) — import động content/gN.ts (mỗi lớp một chunk)
  progress.ts   LearnProgress: readLearn, applyLesson, persistLesson, lessonStatus, topicLearned
  lint.ts       mathLint, notationLint, lengthLint (test và overlay dev dùng chung)
  content/      mn.ts g1.ts … g5.ts — `export default { [skillId]: Lesson } satisfies LessonBook`
  *.test.ts     lint.test.ts, progress.test.ts, pages.test.ts, lessons.test.ts (mục 6)
services/study/registry.ts         + templateLevels(skillId): Level[]
services/generators/svg/           + mixedPiesSVG(whole, num, den) (GĐ4.1)
src/components/study/
  TopicSheet.tsx                   ← tách ra từ StudyHome.tsx (không đổi hành vi)
  learn/TopicPage.tsx              trang chủ đề
  learn/LessonReader.tsx           khung đọc: thanh trên, lật trang, danh sách trang, đọc to, phím tắt
  learn/blocks.tsx                 RuleBox, TextBlock, PicBlock, TableBlock, NoteBlock, WorkedSteps, MistakeCard
  learn/LessonTry.tsx              Em thử
  learn/widgets/{index,Explore,PlaceValue,ColumnArith,LongDivision,UnitLadder}.tsx + algo.ts (+ algo.test.ts)
  learn/learn.css
  player/Feedback.tsx              ← tách khối gợi ý / lời giải + nextItemState() khỏi Player.tsx
src/pages/StudyPage.tsx            + route topic/:topicId, learn/:skillId, rules
src/contexts/StudentContext.tsx    + saveLesson(owner, action)
types.ts                           + StudentProfile.learn?: LearnProgress
services/profileService.ts         migrateProfile giữ `learn`
```

## 5. Hợp đồng dữ liệu (đặt đúng tên)

### 5.1 Kiểu nội dung

```ts
// services/study/lessons/types.ts
import type { Level } from '../types';

/** = Question.visual; vẽ bằng services/generators/svg (renderVisual). */
export interface VisualSpec { fn: string; args: unknown[] }

export type Block =
    | { t: 'text'; md: string }                                    // đoạn ngắn: Markdown, phân số "a/b"
    | { t: 'rule'; say: string; formula?: string; title?: string } // khung QUY TẮC; "{Tổng}" trong formula được tô màu
    | { t: 'pic'; visual: VisualSpec; caption?: string }
    | { t: 'table'; head: string[]; rows: string[][]; caption?: string }
    | { t: 'note'; md: string }                                    // "Lưu ý"
    | { t: 'widget'; widget: WidgetSpec };

export interface KnowPage { title: string; blocks: Block[] }

export interface WorkedStep { say: string; math?: string; visual?: VisualSpec }
export interface Worked {
    problem: string;
    visual?: VisualSpec;
    layout: 'solution' | 'calc';   // solution: khung "Bài giải"; calc: các bước tính
    steps: WorkedStep[];           // 1–6 bước, hiện dần
    answer: string;                // "Đáp số: …" / "Vậy …"
    check?: string;                // "Thử lại: …"
    replay?: ColumnSpec | DivisionSpec; // calc: phát lại bằng widget đặt tính
}

export interface Form {
    id: string;        // slug duy nhất trong bài, dùng làm id trang ("form-<id>", "ex-<id>")
    title: string;     // "Dạng 1: Biết tổng và tỉ số"
    cue: string;       // dấu hiệu nhận biết
    steps: string[];   // cách làm, 2–6 bước
    example: Worked;   // ví dụ mẫu (số cố định)
    level?: Level;     // mức template gần dạng này nhất → một câu Em thử
}

export interface Mistake { wrong: string; right: string; why: string }

export interface Lesson {
    skillId: string;
    v: number;                 // tăng khi đổi số/thứ tự trang → reset trang đã xem, KHÔNG thưởng lại
    goal: string;              // "Học xong bài này, em sẽ …" (chỉ ghi phần sau dấu …)
    hook?: { md: string; visual?: VisualSpec; answer?: string };
    needs?: string[];          // skillId nên học trước (được phép khác lớp)
    know: KnowPage[];          // 1–3
    forms: Form[];             // 1–3 (MN: 0)
    mistakes: Mistake[];       // 0–3 (L3 trở lên ≥ 1)
    remember: string[];        // 2–5
    tryLevels?: Level[];       // ghi đè mức của 3 câu Em thử
    autoRead?: boolean;        // MN, L1
}
export type LessonBook = Record<string, Lesson>;

export interface ExploreControl { label: string; min: number; max: number; step?: number; init: number; unit?: string }
export interface ExploreSpec<K extends string = string> {
    w: 'explore';
    title: string;
    controls: Record<K, ExploreControl>;
    valid?: (v: Record<K, number>) => string | null;   // null = hợp lệ; chuỗi = lời nhắc hiển thị
    visual: (v: Record<K, number>) => VisualSpec;
    caption: (v: Record<K, number>) => string;         // phải đúng toán — test quét bằng mathLint
    speak?: (v: Record<K, number>) => string;
}
export interface PlaceValueSpec { w: 'place-value'; int: number; dec?: 0 | 1 | 2 | 3; init: number; mode?: 'build' | 'compare' | 'shift'; other?: number }
export interface ColumnSpec { w: 'column'; op: '+' | '-' | '×'; a: number; b: number; editable?: boolean }
export interface DivisionSpec { w: 'long-division'; a: number; b: number; layout?: 'short' | 'full'; editable?: boolean }
export interface UnitLadderSpec { w: 'unit-ladder'; kind: 'length' | 'mass' | 'capacity' | 'area' | 'volume'; value: number; from: string; to: string; editable?: boolean }
export type WidgetSpec = ExploreSpec<any> | PlaceValueSpec | ColumnSpec | DivisionSpec | UnitLadderSpec;

export type LessonPageKind = 'intro' | 'know' | 'form' | 'example' | 'mistake' | 'try' | 'remember';
export interface LessonPage { id: string; kind: LessonPageKind; title: string; index?: number; formId?: string }
```

### 5.2 Trang

`lessonPages(lesson)` trả các trang theo thứ tự ở mục 3.1. Id trang lần lượt là `intro`, `know-0…`, `form-<id>`, `ex-<id>`, `mistake-0…`, `try`, `remember`. `tryIndex` là vị trí của trang `try`. Tiêu đề trang ≤ 60 ký tự.

### 5.3 Tiến độ và thưởng

```ts
// services/study/lessons/progress.ts
export interface LessonState {
    v: number;      // phiên bản nội dung lúc xem
    seen: number;   // bitmask chỉ số trang đã mở (≤ 20 trang)
    at: number;     // trang đang đọc (để "Học tiếp")
    best: number;   // số câu Em thử đúng cao nhất (0..3)
    done?: string;  // 'YYYY-MM-DD' lần đầu đạt
    star?: 1;       // đã nhận sao của bài này
}
export interface LearnProgress { version: 1; lessons: Record<string, LessonState> }
export type LessonAction =
    | { kind: 'visit'; skillId: string; v: number; page: number; pages: number }
    | { kind: 'leave'; skillId: string; v: number; page: number }
    | { kind: 'try'; skillId: string; v: number; correct: number; total: number; tryIndex: number };

export function readLearn(raw: unknown): LearnProgress;           // làm sạch: bỏ skill lạ, chặn số âm, sai kiểu
export function applyLesson(p: StudentProfile, a: LessonAction, today: string):
    { accepted: boolean; changed: boolean; profile: StudentProfile; earned: 0 | 1; completedNow: boolean };
export function persistLesson(profiles: StudentProfile[], owner: string, a: LessonAction, write: (p: StudentProfile[]) => void):
    { ok: boolean; profiles: StudentProfile[]; earned: 0 | 1; completedNow: boolean; unlocked: Achievement[] };
export const lessonStatus: (s: LessonState | undefined, pages: number) => 'new' | 'reading' | 'done';
```

- `v` khác phiên bản đang lưu thì đặt lại `seen` và `at`, giữ nguyên `best`, `done`, `star`.
- `visit` bật bit của trang. Chỉ ghi hồ sơ khi có bit mới. `leave` lưu `at`, gọi khi rời bài và khi `visibilitychange`.
- `try` hoàn thành khi mọi bit trong `[0, tryIndex)` đã bật **và** `correct ≥ ceil(total × 2/3)` với `total ≥ 1`. `completedNow` đúng ở lần đầu đạt.
- Thưởng: `earned = completedNow && !star`. Khi `earned` thì cộng `stars + 1`, `stats.totalStarsEarned + 1`, gọi `checkAchievements` (cộng thêm `rewards`, đưa thành tích mới vào hàng đợi), và đặt `star: 1`, `done: today` **trong cùng một lần ghi**.
- `StudentContext.saveLesson(owner, action)` theo mẫu `saveRiddle`. Chủ hồ sơ khác `currentStudentId` thì trả `{ ok: false }` và không đổi gì. Ghi lỗi (vd hết quota) thì cũng trả `ok: false` và không đổi gì. Giao diện hiện "Chưa lưu được, em thử lại nhé".

### 5.4 Bài mẫu đầy đủ (chuẩn chất lượng để soạn các bài khác)

```ts
// services/study/lessons/content/g5.ts (trích)
import { lesson, know, text, rule, pic, vis, widget, explore, form, worked, step, mistake } from '../build';
import type { LessonBook } from '../types';

const bars = (n: number) => ({ parts: Array(n).fill(1), labels: Array(n).fill('') });

export default {
    'g5.sum_diff_ratio': lesson('g5.sum_diff_ratio', {
        v: 1,
        goal: 'giải được bài toán tìm hai số khi biết tổng và tỉ số, hoặc biết hiệu và tỉ số của hai số đó.',
        hook: {
            md: 'Lớp em có 35 bạn. Số bạn nam bằng 2/3 số bạn nữ. Không cần điểm danh, làm sao biết lớp có bao nhiêu bạn nam?',
            answer: 'Tổng số phần: 2 + 3 = 5. Một phần: 35 : 5 = 7. Số bạn nam: 7 × 2 = 14 (bạn).',
        },
        needs: ['g5.ratio'],
        know: [
            know('Tỉ số và những phần bằng nhau',
                text('"Số bạn nam bằng 2/3 số bạn nữ" nghĩa là: số bạn nữ gồm **3 phần bằng nhau** thì số bạn nam gồm **2 phần** như thế.'),
                pic('segmentDiagramSVG', [{ label: 'Nam', ...bars(2) }, { label: 'Nữ', ...bars(3) }], 'Tổng: 35 bạn'),
                rule('Tử số chỉ số phần của đại lượng đứng trước chữ "bằng"; mẫu số chỉ số phần của đại lượng đứng sau.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi số phần và giá trị một phần',
                    controls: {
                        a: { label: 'Số phần của số bé', min: 1, max: 5, init: 2 },
                        b: { label: 'Số phần của số lớn', min: 2, max: 9, init: 3 },
                        k: { label: 'Giá trị một phần', min: 2, max: 20, init: 7 },
                    },
                    valid: v => (v.a < v.b ? null : 'Số bé phải có ít phần hơn số lớn.'),
                    visual: v => vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(v.a) }, { label: 'Số lớn', ...bars(v.b) }], `Tổng: ${v.k * (v.a + v.b)}`),
                    caption: v => `Tổng số phần: ${v.a} + ${v.b} = ${v.a + v.b}. Tổng: ${v.k} × ${v.a + v.b} = ${v.k * (v.a + v.b)}. Số bé: ${v.k} × ${v.a} = ${v.k * v.a}; số lớn: ${v.k} × ${v.b} = ${v.k * v.b}.`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'tong-ti', title: 'Dạng 1: Biết tổng và tỉ số', level: 3,
                cue: 'Đề cho **tổng** của hai số và **tỉ số** của chúng (hoặc "số này bằng a/b số kia").',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm tổng số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy tổng chia cho tổng số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Tổng của hai số là 96. Tỉ số của hai số là 3/5. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', ...bars(3) }, { label: 'Số lớn', ...bars(5) }], 'Tổng: 96'),
                    layout: 'solution',
                    steps: [
                        step('Tổng số phần bằng nhau là:', '3 + 5 = 8 (phần)'),
                        step('Giá trị một phần là:', '96 : 8 = 12'),
                        step('Số bé là:', '12 × 3 = 36'),
                        step('Số lớn là:', '96 − 36 = 60'),
                    ],
                    answer: 'Đáp số: Số bé: 36; Số lớn: 60.',
                    check: 'Thử lại: 36 + 60 = 96 và 36 : 60 = 3/5.',
                }),
            }),
            form({
                id: 'hieu-ti', title: 'Dạng 2: Biết hiệu và tỉ số', level: 3,
                cue: 'Đề cho **hiệu** của hai số (số này hơn số kia bao nhiêu) và **tỉ số**, kể cả cách nói "số lớn gấp n lần số bé".',
                steps: [
                    'Vẽ sơ đồ: số bé mấy phần, số lớn mấy phần.',
                    'Tìm hiệu số phần bằng nhau.',
                    'Tìm giá trị một phần: lấy hiệu chia cho hiệu số phần.',
                    'Tìm số bé, rồi tìm số lớn.',
                    'Viết đáp số và thử lại.',
                ],
                example: worked({
                    problem: 'Hiệu của hai số là 30. Số lớn gấp 4 lần số bé. Tìm hai số đó.',
                    visual: vis('segmentDiagramSVG', [{ label: 'Số bé', parts: [1], labels: ['?'] }, { label: 'Số lớn', parts: [1, 3], labels: ['', '30'] }]),
                    layout: 'solution',
                    steps: [
                        step('Số lớn gấp 4 lần số bé nên số bé là 1 phần, số lớn là 4 phần. Hiệu số phần bằng nhau là:', '4 − 1 = 3 (phần)'),
                        step('Giá trị một phần, cũng là số bé:', '30 : 3 = 10'),
                        step('Số lớn là:', '10 + 30 = 40'),
                    ],
                    answer: 'Đáp số: Số bé: 10; Số lớn: 40.',
                    check: 'Thử lại: 40 − 10 = 30 và 40 : 10 = 4.',
                }),
            }),
        ],
        mistakes: [
            mistake('Tổng là 96, tỉ số 3/5. Bạn Bi tính một phần: 96 : 3 = 32.',
                'Một phần: 96 : (3 + 5) = 12.',
                'Tổng 96 gồm cả 3 phần của số bé và 5 phần của số lớn, tất cả là 8 phần. Phải chia cho tổng số phần.'),
            mistake('Hiệu là 30, số lớn gấp 4 lần số bé. Bạn Bi tính: 30 : (4 + 1) = 6.',
                'Một phần: 30 : (4 − 1) = 10.',
                'Hiệu là phần số lớn hơn số bé, đúng bằng 4 − 1 = 3 phần.'),
            mistake('"Số bạn nam bằng 2/3 số bạn nữ", bạn Bi vẽ: nam 3 phần, nữ 2 phần.',
                'Nam 2 phần, nữ 3 phần.',
                'Tử số 2 ứng với đại lượng đứng trước chữ "bằng", tức là số bạn nam.'),
        ],
        remember: [
            'Luôn vẽ sơ đồ đoạn thẳng trước khi tính.',
            'Tổng – tỉ: một phần = tổng : tổng số phần.',
            'Hiệu – tỉ: một phần = hiệu : hiệu số phần.',
            '"Số lớn gấp n lần số bé": số bé 1 phần, số lớn n phần.',
            'Thử lại: cộng (hoặc trừ) hai số rồi kiểm tra tỉ số.',
        ],
    }),
} satisfies LessonBook;
```

Bài này có 12 trang: intro, know-0, know-1, form-tong-ti, ex-tong-ti, form-hieu-ti, ex-hieu-ti, mistake-0…2, try, remember. Em thử lấy 3 câu M3, vì kỹ năng chỉ có mức 3.

## 6. Kiểm chuẩn tự động

**`lint.ts`** (có `lint.test.ts` với ≥ 40 ca đúng/sai):

- `mathLint(text)`: tìm các chuỗi số và phép tính có dấu `=`, gồm số nguyên, số có nhóm NBSP, thập phân dấu phẩy, phân số `a/b`, hỗn số `a b/c`, các dấu `+ − - × : ( )`. Tính đúng bằng phân số hữu tỉ, kiểm mọi vế của chuỗi `a = b = c`.
  - Hiểu `a : b = q dư r`: kiểm `a = b × q + r` và `r < b`.
  - Phần đơn vị trong ngoặc như `(cm)`, `(phần)` là điểm dừng của biểu thức.
  - Bỏ qua chuỗi có chữ (giờ phút, tên đơn vị giữa phép tính), có `?`, `□`, `…`. Dấu `≈` được sai số ≤ 0,5 đơn vị của chữ số cuối.
  - Ca bắt buộc: `3 + 5 = 8 (phần)` · `(25 + 5) × 2 = 60 (cm)` · `96 − 36 = 60` · `9 × 2 × 3,14 = 56,52` · `1/12 + 1/24 = 3/24 = 1/8` · `2 1/4 = 9/4` · `12 345 + 1 = 12 346` · `186 : 4 = 46 dư 2` · `36 : 60 = 3/5`.
- `notationLint(text)`: lỗi khi gặp `÷`, `*`, `x`/`X` làm dấu nhân giữa hai số, `Tìm x`, dấu chấm thập phân (`3.5`), dấu chấm hoặc phẩy nhóm nghìn (`1.000`, `12,345` khi đứng ở vị trí nhóm), số ≥ 5 chữ số không nhóm, số 4 chữ số bị nhóm (`2 417`), gạch ngang `–` dùng làm dấu trừ giữa hai số, `lít` viết tắt `L`, chữ "thối tiền".
- `lengthLint(lesson, grade)`: kiểm giới hạn ở mục 3.2 và số lượng ở mục 5.1.

**`lessons.test.ts`** chạy cho mọi bài trong `content/*`:

1. `LESSON_INDEX` khớp key của content từng lớp. Mỗi `skillId` có trong `SKILL_MAP`, đúng lớp của file.
2. Lớp trong `PUBLISHED_GRADES` phải có bài cho **mọi** kỹ năng có template của lớp (cả ★). Mầm non: mọi kỹ năng có bài ngắn hoặc có dòng trong bảng nối hoạt động (2.5).
3. Cấu trúc và số lượng hợp lệ. Id dạng không trùng. Id trang không trùng. Số trang ≤ 20. `needs` trỏ tới kỹ năng có thật.
4. `form.level` và `tryLevels` ∈ `templateLevels(skillId)`. `buildSession` tạo đủ 3 câu khác nhau cho mỗi bài: chạy 20 lần với `withGeneratorRandom`, phải sinh được ít nhất 2 câu khác nhau mỗi lần.
5. Mọi `VisualSpec` có `isVisualFn(fn)`, và `renderVisual` trả SVG không rỗng, không có `NaN` hay `undefined`.
6. Mỗi `explore`: quét giá trị min/init/max của từng điều khiển cùng 30 bộ ngẫu nhiên hợp lệ. Hình phải vẽ được. `caption` phải qua `mathLint` + `notationLint` và không có `NaN`.
7. Widget khác: tham số trong miền hợp lệ (`b ≠ 0`, các hàng của `place-value` khớp `init`, đơn vị của `unit-ladder` cùng loại…).
8. `mathLint` + `notationLint` cho mọi chuỗi chữ, **trừ** `Mistake.wrong` (được phép cố ý sai), và đúng với cả caption của explore. `lengthLint` cho mọi bài.
9. `questionToSpeech(text của từng trang)` không còn ký tự thô (`/` giữa hai số, `×`, `:` giữa hai số).

**`progress.test.ts`**: làm sạch dữ liệu hỏng; `visit` bật bit; đổi `v` thì reset trang mà giữ sao; không đủ trang thì không hoàn thành; chỉ thưởng một lần dù gọi `try` nhiều lần hoặc đổi `v`; sai chủ hồ sơ; ghi lỗi; thành tích mở khoá; `migrateProfile` giữ `learn`.

**`algo.test.ts`** (GĐ2): các bước đặt tính, cộng lại, phải cho đúng kết quả số học trên 2000 cặp ngẫu nhiên mỗi phép, gồm số thập phân. Phép chia có dư phải có `r < b`.

## 7. Bẫy phải biết

- **`readStudyProgress` bỏ mọi trường lạ** ([progress.ts:29](../services/study/progress.ts)). Nếu để tiến độ học trong `study`, mỗi lần `savePrefs` hay `addTestResult(…, out.progress)` sẽ xoá mất. Vì vậy tiến độ học lưu ở `StudentProfile.learn` (D11).
- **`migrateProfile` liệt kê từng trường** khi chuyển hồ sơ dạng cũ ([profileService.ts:106](../services/profileService.ts)). Phải thêm `learn: oldProfile.learn` và có test.
- **Registry chỉ đủ template khi `services/mathEngine` đã được import** (`registerLegacy`). `LessonTry` chạy trong `StudyPage` nên đã có sẵn. Preview và test phải `import '…/services/mathEngine'` trước, như `study/preview.tsx` đang làm.
- **Đừng sửa hành vi `Player`** khi tách `Feedback`/`nextItemState`. Logic loại lựa chọn sai, nút Thử lại cho câu 2 lựa chọn và câu so sánh phải giữ nguyên. Chạy lại bộ ảnh Player cũ để đối chiếu.
- **Hook**: không gọi hook sau `return` sớm (`StudyPage` có `if (!student) return`). Không gọi `saveLesson` trong updater của `setState`.
- **Ghi hồ sơ quá dày**: `visit` chỉ ghi khi có bit mới. `at` chỉ lưu bằng `leave`. Không ghi ở mỗi lần render.
- **Nút Quay lại của hoạt động Mầm non** không biết trang gọi nó là Ôn Luyện (mục 2.5). Phải có `returnTo`, nếu không trẻ bị lạc sang menu Mầm non.
- **Cuộn trang chủ Ôn Luyện**: quay lại từ Trang chủ đề thì phải về đúng vị trí cũ. Lưu `scrollY` vào `sessionStorage` theo lớp, khôi phục sau lần vẽ đầu.
- **Hiển thị phân số**: chữ có `a/b` phải đi qua `Md`. Không render `{text}` trần. Ngày tháng (`27/1`) và đơn vị `km/giờ` đã được `mathText` bỏ qua, đừng tự viết regex khác.
- **TTS với số có nhóm**: dùng `questionToSpeech` để "12 345" được đọc thành một số. Không tự ghép chuỗi đọc.
- **Trừ có nhớ, nhân, chia phải đọc đúng kiểu SGK Việt Nam** (mục 3.3). Đừng dùng cách "mượn" của sách nước ngoài.
- **`segmentDiagramSVG` chỉ có nhãn theo từng đoạn**, không có nhãn kéo dài qua nhiều đoạn. Muốn ghi hiệu cho 3 phần thì gộp thành một đoạn dài 3 (xem bài mẫu).
- **Nội dung có hàm** (`explore.visual/caption`). Không đưa nội dung qua `JSON.stringify`, và không lưu nội dung vào hồ sơ. Hồ sơ chỉ lưu `LessonState`.
- **Chụp ảnh**: browser pane hay timeout khi bị ẩn. Dùng Chrome headless qua `scripts/study-shots.mjs` như đợt study-wow.
- **Test MathRacing hay chập chờn khi chạy cả bộ** (`games/MathRacing/cup/rivals.test.ts`). Chạy riêng để xác nhận trước khi kết luận lỗi.

## 8. Các giai đoạn

### GĐ0 — Nền móng (chưa có giao diện)
- **0.1** `types.ts`, `build.ts` (gồm chuẩn hoá NBSP), `pages.ts`, `manifest.ts`, `load.ts`; thêm `templateLevels` vào registry. Test `pages.test.ts`.
- **0.2** `lint.ts` + `lint.test.ts` (mục 6).
- **0.3** `progress.ts` + `progress.test.ts`; `types.ts` thêm `learn?`; `migrateProfile`; `StudentContext.saveLesson`.
- **0.4** Hai bài mẫu: `g5.sum_diff_ratio` (mục 5.4) và `g3.div_1digit` (dùng `long-division` ở dạng spec). Viết `lessons.test.ts` đủ các mục ở mục 6.
- Nghiệm thu: `npx vitest run services/study` xanh; `npx tsc --noEmit` chỉ còn lỗi farm.

### GĐ1 — Giao diện học
- **1.1** Tách `TopicSheet.tsx`. Viết `TopicPage` + route `/study/topic/:topicId`. `StudyHome` điều hướng theo D10, giữ cuộn. Nút [Luyện] gọi `practiceSkill`. Nút [Luyện tập] mở `TopicSheet`.
- **1.2** `LessonReader` + `blocks.tsx` + `learn.css`: trang intro/know/form/remember, `RuleBox` tô `{…}`, điều hướng (nút, phím, danh sách trang, `?page=`), thanh tiến độ, focus tiêu đề, ghi `visit`/`leave`, đọc to.
- **1.3** Trang ví dụ mẫu hiện từng bước (nút, Enter/Space, "Xem cả lời giải", đọc bước mới). Trang Chỗ dễ nhầm.
- **1.4** Tách `player/Feedback.tsx` + `nextItemState`. Viết `LessonTry`, màn hoàn thành + thưởng, trang Ghi nhớ (`hook.answer`, CTA).
- **1.5** Thêm case preview `topic`, `lesson-intro`, `lesson-know`, `lesson-form`, `lesson-example`, `lesson-mistake`, `lesson-try`, `lesson-done` vào `study-preview.html`. Chụp ảnh ở 1180×820, 768×1024, 390×844 và 320. Đo `scrollWidth ≤ innerWidth`. Không có lỗi console.
- Nghiệm thu: vitest toàn repo xanh (trừ test chập chờn đã biết, phải chạy riêng xác nhận), tsc, bộ ảnh.

### GĐ2 — Bộ thao tác
- **2.1** `Explore`: thanh trượt và nút −/+ (≥ 44 px), lời nhắc khi giá trị không hợp lệ, caption qua `Md`, nút nghe. Test quét (mục 6.6).
- **2.2** `PlaceValue`: chế độ build / compare / shift; đọc số nguyên và số thập phân. Thêm `readDecimalVN` vào `value.ts` nếu chưa có.
- **2.3** `ColumnArith` + `algo.ts`: +, − (nhớ kiểu SGK), × 1 chữ số, × 2 chữ số (tích riêng lùi 1 cột), số thập phân (+ − thẳng dấu phẩy; × nhân như số tự nhiên rồi đặt dấu phẩy). Mỗi bước tô cột và có lời đọc.
- **2.4** `LongDivision` + algo: bố cục `short`/`full`, có dư, thương có chữ số 0, số bị chia thập phân, chia cho số thập phân (hiện bước nhân cả hai số với 10, 100…). Chưa cần chia cho số có hai chữ số (để GĐ7).
- **2.5** `UnitLadder`: độ dài, khối lượng, dung tích, diện tích, thể tích; số đo hai tên đơn vị; viết dạng số thập phân.
- Nghiệm thu: `algo.test.ts`; ảnh từng widget ở 1180 và 390; điều khiển được bằng chạm và bằng bàn phím.

### GĐ3 — Nội dung Lớp 3 (39 bài, dàn bài ở mục 9.1)
- **3.1** g3_multiplication + g3_division (8 bài)
- **3.2** g3_expressions + g3_fractions + g3_word_problems (7)
- **3.3** g3_numbers + g3_arithmetic (7)
- **3.4** g3_geometry + g3_area + g3_measurements (10)
- **3.5** g3_time + g3_money + g3_statistics + g3_probability (7)
- **3.6** Rà soát độc lập: một phiên mới, effort high, theo mục 3 và 6. Đọc thử 5 bài trên preview, sửa, đưa `3` vào `PUBLISHED_GRADES`, chụp ảnh 3 bài tiêu biểu. **Chủ dự án duyệt.**
- Mỗi phiên nội dung: viết bài → `npx vitest run services/study/lessons` xanh → mở preview 1–2 bài vừa viết, chụp ảnh → ghi phát hiện vào mục 13 → commit `Học bài GĐ3.x: Lớp 3 — <chủ đề>`.

### GĐ4 — Nội dung Lớp 5 (37 bài, dàn bài ở mục 9.2)
- **4.1** g5_fractions + g5_parentheses (6), thêm `mixedPiesSVG`
- **4.2** g5_numbers + g5_decimal_ops (8)
- **4.3** g5_ratios + g5_word_problems (9)
- **4.4** g5_geometry + g5_measurements (9)
- **4.5** g5_time_ops + g5_statistics (5)
- **4.6** Rà soát độc lập, phát hành L5, **chủ dự án duyệt**.

### GĐ5 — Mầm non
- **5.1** Bảng nối ở mục 2.5, Trang chủ đề MN (thẻ hoạt động + bài ngắn), 6 bài ngắn (`mn.ordinal`, `mn.combine`, `mn.pattern`, `mn.shapes3d`, `mn.position`, `mn.daytime`). Thêm `state.returnTo` cho `usePreschoolActivity` (mục 2.5) và test: mở từ Ôn Luyện thì Quay lại về trang chủ đề; mở từ menu Mầm non thì giữ hành vi cũ. Phát hành MN.

### GĐ6 — Cầu nối học ↔ luyện (mục 2.6)
- **6.1** Chip trên thẻ chủ đề; trạng thái và link trong `TopicSheet`.
- **6.2** `ResultView` và `ReportView`.
- **6.3** Gợi ý "Bài mới hôm nay" trên thẻ Ôn hôm nay.
- **6.4** Sổ tay công thức `/study/rules` (tìm, in).

### GĐ7 — Lớp 4 (42 bài) · GĐ8 — Lớp 1 (32 bài) · GĐ9 — Lớp 2 (32 bài)
- Mỗi lớp mở đầu bằng **x.0 Dàn bài**: viết bảng như mục 9 vào cuối plan này để chủ dự án xem nhanh. Tiếp theo là 4–5 phiên nội dung, mỗi phiên 6–10 bài. Kết thúc bằng phiên rà soát độc lập và phát hành.
- Lớp 4 cần thêm: chia cho số có hai chữ số (ước lượng thương) trong `LongDivision`; explore đo góc (`angleShapeSVG` có thước đo góc).
- Lớp 1: ít chữ, nhiều hình, `autoRead`, câu ≤ 12 từ, lời giải dạng "Phép tính · Trả lời".

### GĐ10 — Rà soát tổng
- Chạy lại rà soát độc lập trên mẫu ngẫu nhiên 20 bài. Chụp bộ ảnh cuối. Cập nhật `docs/study-mode-architecture.md` và README. Viết báo cáo bàn giao `docs/study-learn/README.md`.

## 9. Dàn bài Lớp 3 và Lớp 5

Cột "Dạng" ghi kèm mức template dùng cho Em thử. Dàn bài được lập từ đề mẫu mà template đang sinh (đã chạy dump ngày 02/10). Dạng nào chưa có template riêng thì vẫn dạy, và ghi vào mục 13 để bổ sung template sau.

### 9.1 Lớp 3 — 14 chủ đề, 39 bài (★ = Nâng cao)

| Bài (kỹ năng) | Dạng (mức Em thử) | Thao tác / hình | Dễ nhầm chính |
|---|---|---|---|
| **Phép nhân** · g3.mul_tables · Bảng nhân 3, 4, 6, 7, 8, 9 | D1 Tính theo bảng (M1) · D2 Tìm thừa số: 9 × ? = 81 (M2) · D3 "Mỗi… có…, n… có bao nhiêu?" (M2) | explore `countingSVG` (a được lấy b lần); bảng nhân | Nhầm nhân với cộng: 3 × 4 = 7 |
| g3.mul_1digit · Nhân số có hai, ba chữ số với số có một chữ số | D1 Số có hai chữ số (M1) · D2 Số có ba chữ số (M2) · D3 Đặt tính / bài toán (M3); nhớ không quá một lượt theo chuẩn lớp 3 | `column ×` | Quên cộng số nhớ: 47 × 3 = 121 |
| g3.times_more · Gấp một số lên nhiều lần | D1 Gấp a lên n lần (M2) · D2 Bài toán "gấp n lần" (M3) | explore `segmentDiagramSVG` | "Gấp lên 3 lần" khác "thêm 3" |
| ★ g3.mul_2digit · Nhân với số có hai chữ số | D1 Hai tích riêng (M2) | `column ×` hai chữ số | Tích riêng thứ hai không lùi sang trái |
| **Phép chia** · g3.div_tables · Bảng chia 3, 4, 6, 7, 8, 9 | D1 Tính theo bảng (M1) · D2 Tìm số chia: 60 : ? = 10 (M2) · D3 Chia đều thành nhóm (M2) | explore chia đều đồ vật; liên hệ bảng nhân | Dùng phép nhân để tìm số chia |
| g3.div_1digit · Chia cho số có một chữ số, phép chia có dư | D1 Chia hết, số có 2 chữ số (M1) · D2 Chia hết, số có 3 chữ số (M2) · D3 Có dư (M3) | `long-division` | Số dư ≥ số chia; sót chữ số 0 ở thương (812 : 4 = 203) |
| g3.times_less · Giảm một số đi nhiều lần | D1 Giảm a đi n lần (M2) · D2 Bài toán (M3) | explore segment | "Giảm đi 6 lần" khác "bớt đi 6" |
| g3.how_many_times · Số lớn gấp mấy lần số bé | D1 Gấp mấy lần (M2) · D2 Số bé bằng một phần mấy số lớn (M2) · D3 Bài toán (M3) | explore segment | Lấy hiệu thay vì thương: 36 − 9 |
| **Biểu thức số** · g3.expression · Thứ tự thực hiện | D1 Chỉ +, − (hoặc ×, :): trái → phải (M1) · D2 Có cả bốn phép: ×, : trước (M2) · D3 Có ngoặc (M3) | ví dụ mẫu tô phép tính làm trước | 53 − 8 × 3 tính từ trái = 135 |
| g3.missing · Tìm thừa số, số bị chia, số chia | D1 Thừa số · D2 Số bị chia · D3 Số chia (M2) | bảng tên thành phần phép tính | ? : 9 = 10 mà lấy 10 : 9 |
| **Một phần mấy** · g3.unit_fraction · 1/2 … 1/9 | D1 Nhận biết phần đã tô (M1) | explore `fractionPieSVG(1, n)`, `fractionBarSVG` | Các phần không bằng nhau |
| g3.fraction_of · Tìm một phần mấy của một số | D1 1/n của a (M2) · D2 Cho đi 1/n, hỏi còn lại (M3) | explore chia đều thành n phần | Lấy a × n; quên bước "còn lại" |
| ★ g3.fraction_ab · Phân số a/b | D1 Đọc phân số từ hình (M2) | explore `fractionBarSVG(a, b)` | Lấy số phần không tô làm tử số |
| **Các số đến 100 000** · g3.numbers10000 · Các số đến 10 000 | D1 Đọc · D2 Viết (M1) · D3 Hàng của chữ số · D4 Viết thành tổng (M2) | `place-value` 4 hàng | Đọc chữ số 0: 9309 là "chín nghìn ba trăm linh chín" |
| g3.numbers100000 · Các số đến 100 000 | như trên với 5 hàng (M1, M2) | `place-value` 5 hàng | Viết thiếu chữ số 0 |
| g3.compare · So sánh, sắp xếp | D1 Điền dấu (M1) · D2 Sắp xếp; số lớn nhất, bé nhất (M2) | `place-value` compare; explore `numberLineSVG` | So chữ số đầu khi hai số khác số chữ số: 5444 và 45 031 |
| g3.round · Làm tròn số | D1 Đến hàng chục, trăm · D2 Đến hàng nghìn, chục nghìn (M2) | explore `numberLineSVG` (hai mốc tròn) | Xét nhầm chữ số |
| g3.roman · Chữ số La Mã | D1 Đọc (M1) · D2 Viết (M2) | bảng I–XX | IIII thay cho IV |
| **Cộng, trừ, nhân, chia số lớn** · g3.addsub100000 | D1 Đặt tính cộng, trừ (M1–M2) · D2 Tính nhanh, tròn nghìn (M3) · D3 Bài toán hai bước (M3) | `column + −` | Không thẳng cột khi hai số khác số chữ số |
| g3.muldiv_big · Nhân, chia số nhiều chữ số với số có một chữ số | D1 Nhân (M1) · D2 Chia, thử lại (M2) | `column ×`, `long-division` | Quên nhớ sang hàng nghìn |
| **Bài toán hai bước** · g3.word_2step | D1 Chia đều rồi thêm/bớt (M2) · D2 Gấp lên rồi tính tổng (M3) · D3 Rút về đơn vị (M3) | tóm tắt; khung Bài giải | Dừng ở bước một |
| ★ g3.sum_diff · Tổng và hiệu | D1 Tìm số lớn, số bé (M3) | explore segment (tổng, hiệu) | Chia tổng cho 2 |
| **Hình học** · g3.midpoint · Điểm ở giữa, trung điểm | D1 Nhận biết (M1) · D2 Tính nửa đoạn (M2) | explore `midpointSVG(len, at)` | Ở giữa nhưng hai phần không bằng nhau |
| g3.circle · Tâm, bán kính, đường kính | D1 Gọi tên (M1) · D2 Đường kính ↔ bán kính (M2) | `circlePartsSVG`; explore `circleSVG(r)` | Đoạn không qua tâm không phải đường kính |
| g3.right_angle · Góc vuông, góc không vuông | D1 Kiểm tra bằng ê-ke (M1) | explore `angleShapeSVG(deg)` | Nhìn bằng mắt thay vì đặt ê-ke |
| g3.polygon · Tam giác, tứ giác: đỉnh, cạnh, góc | D1 Đếm (M1) · D2 Góc đỉnh A tạo bởi hai cạnh nào (M2) | `namedPolygonSVG` | Chọn cạnh không đi qua đỉnh góc |
| g3.rect_square · Hình chữ nhật, hình vuông | D1 Đặc điểm, Đúng/Sai (M1) | `rectSVG`, `squareSVG` | "Hình chữ nhật có 4 cạnh bằng nhau" |
| g3.solids · Khối lập phương, khối hộp chữ nhật | D1 Nhận dạng (M1) · D2 Mặt, đỉnh, cạnh (M2) | `solidSVG` | Quên mặt, cạnh bị khuất |
| **Chu vi & diện tích** · g3.perimeter | D1 Hình vuông, hình chữ nhật (M1) · D2 Tam giác, tứ giác (M2) · D3 Biết chu vi tìm cạnh; bài thực tế (M3) | explore `rectSVG(w, h)` | Lấy (dài + rộng) mà quên × 2 |
| g3.area_cm2 · Diện tích, cm² | D1 Đếm ô 1 cm² (M1) · D2 Công thức (M2) · D3 Bài toán hai bước (M3) | explore `gridAreaSVG(c, r)` đặt chu vi cạnh diện tích | Lẫn cm với cm²; lẫn chu vi với diện tích |
| **Đo lường** · g3.small_units · mm, g, ml | D1 Đổi đơn vị (M1) · D2 Hai tên đơn vị → một đơn vị (M2) · D3 Bài toán (M3) | `unit-ladder` | 3 m = 300 mm |
| g3.temperature · Nhiệt độ °C | D1 Đọc nhiệt kế · D2 So sánh (M1) | explore `thermometerSVG(t)` | Đọc nhầm vạch chia |
| **Thời gian** · g3.clock_minute | D1 Phút là bội của 5 (M1) · D2 Phút lẻ (M2) · D3 Cách đọc "kém" (M2) | explore `clockSVG(h, m)` + đọc to | Kim ngắn gần số 11 mà đọc 11 giờ |
| g3.month_year · Tháng – năm | D1 Số ngày trong tháng (M1) · D2 Tìm thứ của một ngày (M2) | `calendarMonthSVG`; mẹo nắm tay | Đếm qua tháng 30 ngày như tháng 31 ngày |
| g3.duration · Khoảng thời gian | D1 Thời gian kéo dài (M2) · D2 Giờ kết thúc (M3) | explore hai đồng hồ | 9 giờ 45 phút + 20 phút = 9 giờ 65 phút |
| **Tiền Việt Nam** · g3.money | D1 Đếm tiền (M1) · D2 Tiền trả lại (M2) · D3 Mua nhiều món rồi trả lại (M3) | explore `notesSVG` | Quên nhân số món trước khi trừ |
| **Bảng số liệu** · g3.data_table | D1 Đọc một số liệu (M1) · D2 Tổng, so sánh (M2) | bảng | Đọc nhầm hàng, cột |
| ★ g3.bar_chart · Biểu đồ cột | D1 Đọc cột (M2) | `barChartSVG` | Đọc sai vạch chia |
| **Khả năng xảy ra** · g3.chance | D1 Xúc xắc (M1) · D2 Hộp bóng (M2) | explore `bagSVG` | Lẫn "có thể" với "chắc chắn" |

### 9.2 Lớp 5 — 10 chủ đề, 37 bài

| Bài (kỹ năng) | Dạng (mức Em thử) | Thao tác / hình | Dễ nhầm chính |
|---|---|---|---|
| **Phân số** · g5.decimal_fraction · Phân số thập phân | D1 Viết thành phân số thập phân · D2 Đổi ra số thập phân (M1) | explore `fractionBarSVG(a, 10)` | Chỉ nhân mẫu số |
| g5.mixed_number · Hỗn số | D1 Phân số → hỗn số · D2 Hỗn số → phân số (M1) · D3 Cộng, trừ hỗn số (M2) | **`mixedPiesSVG` mới** | 6 1/8 = 7/8 |
| g5.frac_addsub · Cộng, trừ phân số khác mẫu | D1 Hai phân số (M1) · D2 Có số tự nhiên (M2) | explore hai thanh cùng mẫu chung | Cộng tử với tử, mẫu với mẫu |
| g5.frac_muldiv · Nhân, chia phân số | D1 Nhân · D2 Chia (M1) · D3 Phân số của một số (M2) | — | Đảo ngược phân số thứ nhất |
| g5.frac_compare · So sánh phân số | D1 Quy đồng rồi so sánh (M1) · D2 So với 1 (M2) | explore hai thanh | "Mẫu lớn hơn thì phân số lớn hơn" |
| **Số thập phân** · g5.decimal_read · Đọc, viết, hàng | D1 Đọc · D2 Viết (M1) · D3 Hàng của chữ số (M2) | `place-value` có phần thập phân | Lẫn hàng phần trăm với hàng trăm |
| g5.decimal_compare · So sánh, sắp xếp | D1 Điền dấu (M1) · D2 Sắp xếp (M2) | `place-value` compare | 7,19 > 7,3 vì 19 > 3 |
| g5.decimal_round · Làm tròn | D1 Đến hàng phần mười, phần trăm · D2 Đến số tự nhiên (M2) | explore `numberLineSVG` | Cắt bỏ chữ số mà không làm tròn lên |
| g5.measure_decimal · Số đo viết dạng số thập phân | D1 Độ dài · D2 Khối lượng (M2) | `unit-ladder` | 4 km 69 m = 4,69 km |
| **Phép tính với số thập phân** · g5.dec_addsub | D1 Hai số (M1) · D2 Ba số, trái → phải (M2) | `column + −` thập phân | Thẳng cột bên phải như số tự nhiên |
| g5.dec_mul · Nhân | D1 Số thập phân × số tự nhiên (M1) · D2 Số thập phân × số thập phân (M2) | `column ×` thập phân | Đặt dấu phẩy thẳng cột như phép cộng |
| g5.dec_div · Chia | D1 Số thập phân : số tự nhiên (M1) · D2 Chia cho số thập phân (M2) | `long-division` thập phân | Quên dời dấu phẩy ở số bị chia |
| g5.dec_shift · × và : với 10, 100, 1000; 0,1; 0,01 | D1 ×, : 10, 100, 1000 (M1) · D2 × 0,1; 0,01; 0,001 (M2) | `place-value` shift | Dời dấu phẩy sai chiều |
| **Biểu thức** · g5.expr · Có dấu ngoặc | D1 Tính giá trị (M2) · D2 So sánh hai biểu thức (M3) | ví dụ mẫu tô thứ tự tính | Bỏ qua ngoặc |
| **Tỉ số & phần trăm** · g5.ratio · Tỉ số | D1 Tỉ số của hai số (M1) · D2 Trong tình huống (M2) | explore segment | Đảo thứ tự hai số |
| g5.percent · Tỉ số phần trăm | D1 a là bao nhiêu % của b (M1) · D2 p% của một số (M2) · D3 Giảm giá (M3) | explore `gridAreaSVG(10, 10)` | 2 : 20 = 0,1 rồi viết 0,1% |
| g5.map_scale · Tỉ lệ bản đồ | D1 Bản đồ → thật (M2) · D2 Thật → bản đồ (M3) | — | Không đổi đơn vị |
| g5.sum_diff_ratio · Tổng (hiệu) và tỉ số | D1 Tổng – tỉ · D2 Hiệu – tỉ (M3) | explore segment | **bài mẫu mục 5.4** |
| ★ g5.interest · Lãi suất, tăng rồi giảm % | D1 Lãi sau một năm · D2 Tăng rồi giảm (M3) | — | Tăng 10% rồi giảm 10% về giá cũ |
| **Chuyển động đều** · g5.motion · Vận tốc, quãng đường, thời gian | D1 Tính quãng đường (M1) · D2 Tính vận tốc (M2) · D3 Có giờ khởi hành; tính thời gian (M3) | explore segment (t đoạn, mỗi đoạn v km) | Không đổi phút ra giờ |
| g5.motion_two · Gặp nhau, đuổi kịp | D1 Ngược chiều · D2 Cùng chiều (M3) | explore segment hai xe | Cộng vận tốc khi tính đuổi kịp |
| ★ g5.work_together · Làm chung một công việc | D1 (M3) | — | Cộng số ngày: 12 + 24 |
| ★ g5.stream · Chuyển động trên dòng nước | D1 Xuôi dòng · D2 Ngược dòng (M3) | — | Lẫn xuôi với ngược |
| **Hình học** · g5.triangle_area · Diện tích tam giác | D1 Tính diện tích (M1) · D2 Tìm chiều cao, đáy (M2) | explore `triangleSVG` | Quên chia 2 |
| g5.trapezoid_area · Diện tích hình thang | D1 Tính diện tích (M1) · D2 Tìm chiều cao (M2) | explore `trapezoidSVG` | Quên cộng hai đáy |
| g5.circle · Đường kính, chu vi, diện tích | D1 Chu vi (M1) · D2 Diện tích (M2) · D3 Bánh xe lăn (M3) | explore `circleSVG(r)` | Diện tích = d × d × 3,14 |
| g5.solid_area · Diện tích xung quanh, toàn phần | D1 Hình lập phương (M2) · D2 Hình hộp chữ nhật; hộp không nắp (M3) | `netsRowSVG`, `box3dSVG`, `cubeSVG` | Tính thừa nắp |
| g5.volume · Thể tích hình hộp chữ nhật, hình lập phương | D1 Tính thể tích (M1) · D2 Tìm chiều cao (M2) · D3 Bể nước ra lít (M3) | explore `box3dSVG(a, b, c)` | Đổi dm³ ra lít sai |
| g5.nets · Hình khai triển | D1 Nhận biết (M1) | `netsRowSVG` | Hai mặt chồng lên nhau |
| ★ g5.para_area · Diện tích hình bình hành | D1 (M2) | `parallelogramSVG` | Nhân với cạnh bên thay vì chiều cao |
| **Đơn vị đo diện tích, thể tích** · g5.area_units_big | D1 Đổi đơn vị (M1) · D2 Hai tên đơn vị → số thập phân (M2) | `unit-ladder` diện tích | Nhân 10 thay vì 100 |
| g5.volume_units · cm³, dm³, m³ | D1 Đổi đơn vị (M1) · D2 Hai tên đơn vị; lít (M2) | `unit-ladder` thể tích | 1 m³ = 100 dm³ |
| **Số đo thời gian** · g5.time_addsub | D1 Cộng (M1) · D2 Giờ đến nơi (M2) | — | Để nguyên 4 giờ 70 phút |
| g5.time_muldiv · Nhân, chia | D1 Nhân · D2 Chia, đổi giờ dư ra phút (M2) | — | Bỏ phần dư giờ |
| **Thống kê & xác suất** · g5.pie_chart · Biểu đồ quạt tròn | D1 Đọc % (M1) · D2 Từ % ra số lượng (M2) | `pieChartSVG` | Quên nhân với tổng số |
| g5.bar_read · Đọc biểu đồ cột | D1 Đọc cột (M1) · D2 Tổng, so sánh (M2) | `barChartSVG` | Đọc sai vạch chia |
| g5.chance_ratio · Tỉ số mô tả khả năng | D1 (M2) | — | Chia cho số lần không xuất hiện |

## 10. Kiểm thử và ảnh theo giai đoạn

| GĐ | Test mới | Ảnh |
|---|---|---|
| 0 | lint, pages, progress, lessons (2 bài mẫu) | — |
| 1 | (component test tuỳ chọn); hồi quy Player | Trang chủ đề, 6 loại trang, Em thử, hoàn thành; 4 kích thước |
| 2 | algo, quét explore | Từng widget ở 1180 và 390 |
| 3, 4, 7–9 | lessons.test phủ cả lớp | 3 bài tiêu biểu mỗi lớp |
| 5 | bảng nối MN | Trang chủ đề MN, 1 bài ngắn |
| 6 | (tuỳ chọn) | Kết quả, báo cáo, Ôn hôm nay, sổ tay (cả bản in) |
| 10 | toàn bộ | Bộ ảnh cuối |

## 11. Chia phiên và effort

| Phiên | Phạm vi | Effort |
|---|---|---|
| 1 | GĐ0.1–0.2 | medium |
| 2 | GĐ0.3–0.4 | high (bài mẫu là chuẩn cho mọi bài sau) |
| 3–5 | GĐ1.1 · GĐ1.2–1.3 · GĐ1.4–1.5 | medium |
| 6–8 | GĐ2.1–2.2 · GĐ2.3 · GĐ2.4–2.5 | medium / **high** (đặt tính chia) |
| 9–14 | GĐ3.1–3.6 | **high** |
| 15–20 | GĐ4.1–4.6 | **high** |
| 21 | GĐ5 | medium |
| 22–23 | GĐ6.1–6.2 · GĐ6.3–6.4 | medium |
| 24+ | GĐ7–9 (mỗi lớp 5–7 phiên) · GĐ10 | high |

Không chạy song song hai phiên nội dung của cùng một lớp, vì chúng cùng sửa `content/gN.ts` và `manifest.ts`. Phiên widget (GĐ2) và phiên nội dung có thể chạy xen nhau. Bài cần widget chưa xong thì tạm dùng `pic` tĩnh, ghi vào mục 13, rồi thay sau.

## 12. Ngoài phạm vi đợt này

- AI soạn bài lúc chạy; chat hỏi đáp riêng cho từng bài.
- Video, hoạt hình dài, giọng đọc thu sẵn cho bài học (dùng TTS hiện có).
- Đồng bộ tiến độ lên đám mây.
- Đổi kinh tế sao hay gacha ngoài D4.
- Sửa module Tiếng Anh.
- In riêng từng bài lý thuyết. Sổ tay công thức in được ở GĐ6.4 thay cho việc này.

## 13. Phát hiện khi soạn (template thiếu dạng / lời giải chưa tốt)

| Ngày | Kỹ năng | Vấn đề | Đề xuất | Trạng thái |
|---|---|---|---|---|
| 02/10 | g5.work_together | Lời giải chưa dùng mẫu chung nhỏ nhất và chưa rút gọn | Quy đồng, rút gọn rồi tìm thời gian | Đã sửa 04/10; kiểm số học 200 mẫu |
| 02/10 | g5.dec_div M1 | Có lúc ra câu không có số thập phân | M1 luôn có số bị chia thập phân | Đã sửa 04/10; kiểm 500 mẫu |
| 02/10 | g3.div_1digit | Chưa có template nhắm riêng dạng thương có chữ số 0 | Thêm nhánh M2 | Đã thêm 04/10; giữ dạng câu tương thích MathRacing |
| 02/10 | g3.times_less M3 | Đề gạo “giảm đi nhiều lần so với bao” khó hiểu | Chia bao gạo thành các phần bằng nhau, mang về một phần | Đã sửa 04/10 |

## 14. Nhật ký lệch plan

(ghi ngày · mục · lý do · quyết định)

- 02/10 · GĐ1.5 · Kiểm giao diện trên app thật (dev server, hồ sơ thử) thay cho case preview riêng; preview.tsx chỉ thêm onOpenTopic. Bổ sung case preview khi làm bộ ảnh cuối (GĐ10).
- 02/10 · GĐ3.1 · Giới hạn số bước ví dụ dạng tính (calc) nâng lên 8, vì nhân với số có hai chữ số cần 7 bước khớp widget.
- 02/10 · GĐ3.6 · Rà soát độc lập Lớp 3: sửa 3 lỗi sai (nhãn sơ đồ tổng – hiệu, tên bán kính OC, ngày – thứ) và các mục nên sửa; ví dụ nhân lớp 3 chỉ nhớ một lượt; Dạng 2 bài toán hai bước gộp "nhiều hơn / gấp" rồi tính cả hai (tối đa 3 dạng). Lớp 3 chưa đưa vào PUBLISHED_GRADES: chờ chủ dự án duyệt.
- 02/10 · GĐ4 · Đặt tính chia hỗ trợ số bị chia thập phân; trục số ghi nhãn bằng dấu phẩy thập phân; thêm mixedPiesSVG.

- 03/10 · GĐ6–10 · Chủ dự án yêu cầu hoàn tất toàn bộ phần còn lại, giữ bản nháp. Gộp các phiên nhỏ thành một lượt thực hiện; bảng dàn bài Lớp 4/1/2 được hoàn thiện cùng nội dung tại mục 15, không có vòng duyệt trung gian. Không thêm lớp vào `PUBLISHED_GRADES`, không build/push/deploy.
- 03/10 · GĐ5/GĐ10 · Sáu bài mầm non có hai trang kiến thức + Em thử + Ghi nhớ; bỏ intro để đạt tối đa 4 trang, tăng v=2. Bài vị trí bổ sung trước/sau/ở giữa. Hook còn trong dữ liệu nhưng không hiển thị riêng ở mầm non.
- 03/10 · GĐ10 · Lượt rà soát mẫu 20 bài là tự rà soát sau biên soạn, kết hợp bộ kiểm chuẩn độc lập với nội dung; chưa có người thứ hai duyệt sư phạm. Bằng chứng và giới hạn ghi ở báo cáo bàn giao. Duyệt/phát hành để lại theo yêu cầu giữ nháp.
- 03/10 · GĐ10 · Kiểm browser bằng context/route thật trong fixture DEV và hồ sơ Chromium tạm. Bổ sung hồi quy đổi hồ sơ, sao một lần, không ảnh hưởng lịch sử luyện và gacha. Giữ nguyên lỗi TypeScript nền của Làng Mầm.

- 04/10 · Chuẩn bị xuất bản · Theo yêu cầu mới, mở MN/1–5; build production cục bộ và kiểm service worker/offline. Sửa bốn mục template còn mở, nối nút học trong dòng kỹ năng mầm non, xử lý lỗi lưu thật và thử lại kết quả. Chưa push/deploy. 119 file / 3715 test đạt; giữ lỗi TypeScript nền farm như ngoại lệ nghiệm thu ban đầu.

## 15. Dàn bài Lớp 4, Lớp 1, Lớp 2 — bản nháp hoàn tất

Biên soạn 03/10/2026 theo catalog và mẫu template trong `docs/study-learn/samples/`. Ngày 04/10 đã mở sáu lớp cho bản production theo yêu cầu hoàn thiện để xuất bản.

### Lớp 4 — 42 bài

| Kỹ năng | Dạng và mức Em thử | Hình / thao tác | Ghi nhớ chính |
|---|---|---|---|
| g4.read_write · Đọc, viết số đến lớp triệu | Dạng 1: Đọc số (M1) · Dạng 2: Viết số (M1) | Ví dụ từng bước | Đọc theo lớp, từ trái sang phải. Viết đủ chữ số 0 giữ chỗ. |
| g4.place_class · Hàng và lớp, giá trị của chữ số | Dạng 1: Hàng và giá trị (M2) · Dạng 2: Phân tích số (M1) | place-value | Mỗi lớp có ba hàng. Giá trị chữ số thay đổi theo hàng. |
| g4.compare · So sánh, sắp xếp số có nhiều chữ số | Dạng 1: Điền dấu (M1) · Dạng 2: Sắp xếp (M2) | Ví dụ từng bước | Đếm số chữ số trước. Cùng độ dài thì so từ trái sang phải. |
| g4.round · Làm tròn số đến hàng trăm nghìn | Dạng 1: Làm tròn đến hàng đã cho (M2) · Dạng 2: Làm tròn có nhớ (M2) | Ví dụ từng bước | Xét đúng chữ số ngay bên phải. Sau khi làm tròn, phần bên phải là các chữ số 0. |
| g4.even_odd · Số chẵn, số lẻ | Dạng 1: Chọn số chẵn, số lẻ (M1) · Dạng 2: Hai số cùng loại liên tiếp (M2) | Ví dụ từng bước | Xem hàng đơn vị. Hai số chẵn liên tiếp hoặc hai số lẻ liên tiếp hơn kém nhau 2. |
| g4.sequence · Dãy số theo quy luật | Dạng 1: Tăng hoặc giảm đều (M2) · Dạng 2: Nhân theo quy luật (M3) | Ví dụ từng bước | Kiểm tra quy luật trên nhiều cặp. Đọc kỹ chiều tăng hoặc giảm của dãy. |
| g4.addsub · Cộng, trừ số có nhiều chữ số | Dạng 1: Cộng (M1) · Dạng 2: Trừ và thử lại (M2) | column | Các chữ số cùng hàng thẳng cột. Thử lại phép trừ bằng phép cộng. |
| g4.properties_add · Tính chất giao hoán, kết hợp của phép cộng | Dạng 1: Tính nhanh (M2) · Dạng 2: So sánh tổng (M3) | Ví dụ từng bước | Đổi chỗ, nhóm số hạng để tính thuận tiện. Cùng một số hạng, so sánh phần còn lại. |
| g4.letter_expr · Biểu thức chứa chữ | Dạng 1: Biểu thức chứa một chữ (M2) · Dạng 2: Biểu thức chứa nhiều chữ (M2) | Ví dụ từng bước | Mỗi chữ thay bằng đúng số đã cho. Giữ nguyên dấu phép tính và dấu ngoặc. |
| g4.mul · Nhân với số có một, hai chữ số | Dạng 1: Nhân với số một chữ số (M1) · Dạng 2: Nhân với số hai chữ số (M2) | column | Nhân từ hàng đơn vị. Tích riêng hàng chục lùi sang trái một cột. |
| g4.mul10 · Nhân với 10, 100, 1000; nhân số tròn chục | Dạng 1: Nhân với 10, 100, 1000 (M1) · Dạng 2: Nhân số tròn chục (M2) | Ví dụ từng bước | Quy tắc thêm 0 dùng cho số tự nhiên. Đếm đủ chữ số 0. |
| g4.properties_mul · Tính chất của phép nhân | Dạng 1: Nhóm thừa số (M2) · Dạng 2: Thừa số chung (M3) | Ví dụ từng bước | Chỉ nhóm trong phép nhân khi giữ đủ thừa số. Nhân với từng số hạng của tổng. |
| g4.div · Chia cho số có một, hai chữ số | Dạng 1: Thương có chữ số 0 (M1) · Dạng 2: Chia cho số hai chữ số (M2) · Dạng 3: Điều chỉnh thương (M3) | long-division | Ước lượng chỉ là dự đoán, phải nhân thử. Số dư luôn bé hơn số chia. Thương nhân số chia cộng dư bằng số bị chia. |
| g4.div10 · Chia cho 10, 100, 1000 | Dạng 1: Chia cho 10, 100, 1000 (M1) · Dạng 2: Chia số tròn chục (M2) | Ví dụ từng bước | Chỉ bỏ chữ số 0 ở tận cùng. Bỏ bằng nhau ở cả hai số. |
| g4.expr · Biểu thức có dấu ngoặc | Dạng 1: Tính giá trị (M2) · Dạng 2: So sánh hai biểu thức (M3) | Ví dụ từng bước | Ngoặc trước, nhân chia trước cộng trừ. Nhân và chia cùng mức ưu tiên. |
| g4.divisibility ★ · Dấu hiệu chia hết cho 2, 3, 5, 9 | Dạng 1: Chia hết cho 2 và 5 (M2) · Dạng 2: Chia hết cho 3 và 9 (M2) | Ví dụ từng bước | 2, 5: xem chữ số tận cùng. 3, 9: xem tổng các chữ số. |
| g4.fraction_concept · Khái niệm phân số | Dạng 1: Viết phân số từ hình (M1) · Dạng 2: Đọc và gọi tên thành phần (M1) | fractionPieSVG, explore | Chia đơn vị thành các phần bằng nhau. Tử số ở trên, mẫu số ở dưới. |
| g4.fraction_equiv · Tính chất cơ bản, rút gọn phân số | Dạng 1: Tìm phân số bằng nhau (M1) · Dạng 2: Rút gọn (M2) | fractionBarSVG | Làm cùng phép tính ở tử và mẫu. Phân số tối giản không còn ước chung lớn hơn 1. |
| g4.fraction_common · Quy đồng mẫu số | Dạng 1: Dùng tích hai mẫu (M2) · Dạng 2: Một mẫu chia hết cho mẫu kia (M2) | Ví dụ từng bước | Giá trị phân số giữ nguyên. Chọn mẫu chung nhỏ giúp tính gọn. |
| g4.fraction_compare · So sánh phân số | Dạng 1: Cùng mẫu (M1) · Dạng 2: Khác mẫu (M2) | Ví dụ từng bước | Khác mẫu: quy đồng rồi so sánh. Cùng tử dương: mẫu lớn hơn thì phân số bé hơn. |
| g4.frac_addsub · Cộng, trừ phân số | Dạng 1: Cùng mẫu số (M1) · Dạng 2: Một mẫu là bội của mẫu kia (M2) | fractionBarSVG | Chỉ cộng, trừ tử khi cùng mẫu. Rút gọn kết quả nếu có thể. |
| g4.frac_mul · Phép nhân phân số | Dạng 1: Nhân hai phân số (M1) · Dạng 2: Nhân với số tự nhiên (M2) | Ví dụ từng bước | Nhân tử với tử, mẫu với mẫu. Không cần quy đồng khi nhân. |
| g4.frac_div · Phép chia phân số | Dạng 1: Chia hai phân số (M2) · Dạng 2: Chia cho số tự nhiên (M2) | Ví dụ từng bước | Giữ nguyên số bị chia. Không chia cho 0. |
| g4.fraction_of · Tìm phân số của một số | Dạng 1: Tìm một phần của số lượng (M2) · Dạng 2: Tìm số còn lại (M3) | segmentDiagramSVG | Chia theo mẫu rồi nhân theo tử. Hỏi còn lại thì cần thêm phép trừ. |
| g4.frac_addsub_any ★ · Cộng, trừ phân số khác mẫu số | Dạng 1: Cộng khác mẫu (M2) · Dạng 2: Trừ khác mẫu (M2) | Ví dụ từng bước | Cộng, trừ khác mẫu cần quy đồng. Kết quả có thể lớn hơn 1. |
| g4.angle_types · Góc nhọn, góc vuông, góc tù, góc bẹt | Dạng 1: Gọi tên góc (M1) | angleShapeSVG | Nhọn bé hơn vuông; tù lớn hơn vuông, bé hơn bẹt. Hai cạnh góc bẹt tạo thành một đường thẳng. |
| g4.angle_measure · Đo góc, đơn vị đo góc (độ) | Dạng 1: Đọc thước đo góc (M2) | explore | Tâm thước trùng đỉnh. Đọc từ vạch 0° trùng cạnh góc. |
| g4.angle_compare · So sánh các góc | Dạng 1: So sánh và sắp xếp (M2) | Ví dụ từng bước | So sánh bằng số đo. Không so sánh bằng độ dài cạnh. |
| g4.perp_parallel · Hai đường thẳng vuông góc, song song | Dạng 1: Kiểm tra vuông góc (M1) · Dạng 2: Các cặp cạnh song song (M2) | linePairSVG | Vuông góc: kiểm tra bằng ê-ke. Song song: kéo dài cũng không cắt nhau. |
| g4.para_rhombus_id · Hình bình hành, hình thoi | Dạng 1: Nhận dạng theo đặc điểm (M1) · Dạng 2: Đúng hay sai (M2) | parallelogramSVG | Bình hành: hai cặp cạnh đối song song và bằng nhau. Thoi: thêm điều kiện bốn cạnh bằng nhau. |
| g4.rect_word · Chu vi, diện tích hình chữ nhật, hình vuông | Dạng 1: Tìm cạnh từ chu vi (M2) · Dạng 2: Diện tích và sản lượng (M3) | rectSVG | Chu vi dùng đơn vị độ dài. Diện tích dùng đơn vị vuông. |
| g4.para_area ★ · Diện tích hình bình hành, hình thoi | Dạng 1: Diện tích hình bình hành (M2) · Dạng 2: Diện tích hình thoi (M2) | parallelogramSVG, rhombusSVG | Bình hành: đáy nhân chiều cao. Hình thoi: tích hai đường chéo chia 2. |
| g4.mass · Yến, tạ, tấn | Dạng 1: Đổi đơn vị (M1) · Dạng 2: Hai tên đơn vị (M2) | unit-ladder | Tấn → tạ → yến → kg: mỗi bước nhân 10. Cộng, trừ khi đã cùng đơn vị. |
| g4.area_units · Đề-xi-mét vuông, mét vuông, mi-li-mét vuông | Dạng 1: Một tên đơn vị (M1) · Dạng 2: Hai tên đơn vị (M2) | unit-ladder | Đơn vị diện tích có ký hiệu vuông. Mỗi bậc gấp 100, không phải 10. |
| g4.time_units · Giây, thế kỉ | Dạng 1: Đổi phút, giây (M1) · Dạng 2: Năm thuộc thế kỉ nào (M2) | Ví dụ từng bước | 1 phút có 60 giây. Thế kỉ đầu tiên bắt đầu từ năm 1. |
| g4.average · Số trung bình cộng | Dạng 1: Tìm trung bình cộng (M2) · Dạng 2: Tìm số còn thiếu (M3) | Ví dụ từng bước | Trung bình bằng tổng chia số số hạng. Tổng bằng trung bình nhân số số hạng. |
| g4.sum_diff · Tìm hai số khi biết tổng và hiệu | Dạng 1: Tìm số bé trước (M2) · Dạng 2: Bài toán thực tế (M3) | segmentDiagramSVG | Tổng trừ hiệu rồi chia 2: số bé. Thử lại cả tổng và hiệu. |
| g4.unit_rate · Bài toán liên quan đến rút về đơn vị | Dạng 1: Tìm giá trị nhiều phần (M2) · Dạng 2: Tìm số phần (M3) | Ví dụ từng bước | Bước đầu tìm một phần. Bước sau có thể nhân hoặc chia tùy câu hỏi. |
| g4.word_multi · Bài toán giải bằng hai, ba bước tính | Dạng 1: Tính tiền rồi tìm phần còn lại (M3) · Dạng 2: Tổng rồi chia đều (M3) | Ví dụ từng bước | Mỗi bước trả lời một câu hỏi nhỏ. Đọc lại câu hỏi cuối để tránh dừng sớm. |
| g4.data_series · Dãy số liệu thống kê | Dạng 1: Đọc, tìm lớn nhất (M1) · Dạng 2: Tổng và chênh lệch (M2) | Ví dụ từng bước | Giữ đúng thứ tự các đối tượng. Số liệu trùng nhau vẫn được tính riêng. |
| g4.bar_chart · Biểu đồ cột | Dạng 1: Đọc cột (M1) · Dạng 2: Tính từ biểu đồ (M2) · Dạng 3: Tính trung bình (M3) | barChartSVG | Luôn đọc đơn vị và vạch chia. Chỉ tính các cột đề hỏi. |
| g4.events · Số lần xuất hiện của một sự kiện | Dạng 1: Đếm số lần xuất hiện (M1) · Dạng 2: So sánh số lần (M2) | Ví dụ từng bước | Ghi đủ từng lượt thử. Kết quả trước không đảm bảo kết quả sau. |

### Lớp 1 — 32 bài

| Kỹ năng | Dạng và mức Em thử | Hình / thao tác | Ghi nhớ chính |
|---|---|---|---|
| g1.count5 · Đếm, đọc, viết số 0–5 | Dạng 1: Đếm đồ vật (M1) | countingSVG | Mỗi vật đếm một lần. Không có vật: số 0. |
| g1.compare5 · So sánh các số trong phạm vi 5 | Dạng 1: Điền dấu (M1) · Dạng 2: Hai nhóm bằng nhau (M2) | groupsSVG | Đầu nhọn quay về số bé. Bằng nhau dùng dấu =. |
| g1.order5 · Thứ tự các số, điền dãy số | Dạng 1: Điền số thiếu (M1) · Dạng 2: Xếp từ bé đến lớn (M2) | numberLineSVG | Đếm xuôi thêm 1. Đếm ngược bớt 1. |
| g1.count10 · Đếm, đọc, viết số 0–10 | Dạng 1: Đếm và viết số (M1) | countingSVG | Đếm cả hai hàng. Mười viết là 10. |
| g1.compare10 · So sánh, số lớn nhất, bé nhất | Dạng 1: So sánh (M1) · Dạng 2: Tìm số lớn nhất, bé nhất (M2) | numberLineSVG | Đọc đúng yêu cầu lớn nhất hay bé nhất. Số 10 lớn hơn các số từ 0 đến 9. |
| g1.split10 · Mấy và mấy (tách – gộp số) | Dạng 1: Tìm phần còn thiếu (M1) · Dạng 2: Gộp hai phần (M2) | groupsSVG | Tách không làm mất vật nào. Gộp là lấy tất cả hai nhóm. |
| g1.numbers20 · Các số 11–20: chục và đơn vị, so sánh | Dạng 1: Đọc, viết số (M1) · Dạng 2: So sánh (M2) | tensOnesSVG | Chục đứng trước, đơn vị đứng sau. 20 có 2 chục và 0 đơn vị. |
| g1.numbers100 · Số đến 100: đọc, viết, chục – đơn vị | Dạng 1: Viết số (M1) · Dạng 2: Đọc số (M2) | tensOnesSVG | Số tròn chục tận cùng bằng 0. 100 là một trăm. |
| g1.compare100 · So sánh, sắp xếp các số trong phạm vi 100 | Dạng 1: Điền dấu (M1) · Dạng 2: Sắp xếp (M2) | tensOnesSVG | Chục trước, đơn vị sau. 100 lớn hơn mọi số có hai chữ số. |
| g1.neighbors100 · Số liền trước, số liền sau | Dạng 1: Số liền trước (M1) · Dạng 2: Số liền sau (M1) | numberLineSVG | Liền trước bé hơn 1. Liền sau lớn hơn 1. |
| g1.add10 · Phép cộng trong phạm vi 10 | Dạng 1: Tính tổng (M1) · Dạng 2: Thêm đồ vật (M2) | groupsSVG | Thêm, gộp: dùng phép cộng. Cộng với 0 giữ nguyên số đó. |
| g1.add10_missing · Tìm số trong phép cộng | Dạng 1: Ô trống phía sau (M2) · Dạng 2: Ô trống phía trước (M2) | numberLineSVG | Tìm phần còn thiếu. Thay số vào để kiểm tra. |
| g1.add10_compare · So sánh tổng | Dạng 1: Tổng và một số (M2) · Dạng 2: Hai tổng (M3) | groupsSVG | Tính đủ mỗi bên. Kết quả bằng nhau dùng dấu =. |
| g1.sub10 · Phép trừ trong phạm vi 10 | Dạng 1: Tính hiệu (M1) · Dạng 2: Bớt đồ vật (M2) | crossedSVG | Bớt đi dùng phép trừ. Một số trừ chính nó bằng 0. |
| g1.sub10_missing · Tìm số trong phép trừ | Dạng 1: Tìm số bớt (M2) · Dạng 2: Tìm số ban đầu (M2) | crossedSVG | Tìm số đầu: gộp hai phần. Tìm số bớt: xem đã mất bao nhiêu. |
| g1.chain10 · Tính có hai dấu phép tính | Dạng 1: Cộng rồi trừ (M2) · Dạng 2: Hai phép trừ (M3) | numberLineSVG | Bắt đầu từ bên trái. Giữ dấu phép tính còn lại. |
| g1.write_eq · Viết phép tính theo tranh | Dạng 1: Tranh gộp nhóm (M2) · Dạng 2: Tranh bớt đi (M3) | crossedSVG | Quan sát điều đang xảy ra. Phép tính phải đúng với câu chuyện. |
| g1.addsub100 · Cộng, trừ không nhớ trong phạm vi 100 | Dạng 1: Cộng không nhớ (M1) · Dạng 2: Trừ không nhớ (M2) · Dạng 3: Cộng, trừ số tròn chục (M3) | column | Đơn vị trước, chục sau. Viết thẳng hàng. |
| g1.addsub20 · Cộng, trừ không qua 10 trong phạm vi 20 | Dạng 1: Cộng (M1) · Dạng 2: Trừ (M2) | tensOnesSVG | Tính phần đơn vị. Nhớ giữ một chục. |
| g1.carry20 ★ · Cộng, trừ qua 10 trong phạm vi 20 | Dạng 1: Cộng qua 10 (M2) · Dạng 2: Trừ qua 10 (M2) | groupsSVG | Mốc 10 giúp tính nhanh. Dùng đủ các phần đã tách. |
| g1.shapes2d · Hình vuông, tròn, tam giác, chữ nhật | Dạng 1: Tìm hình (M1) · Dạng 2: Đếm hình (M2) | shapesRowSVG, shapeSVG | Nhìn đường bao để nhận hình. Xoay hình không đổi tên hình. |
| g1.shapes3d · Khối lập phương, khối hộp chữ nhật | Dạng 1: Gọi tên khối (M1) | solidSVG | Xúc xắc: khối lập phương. Hộp giày: khối hộp chữ nhật. |
| g1.position · Vị trí: trên, dưới, trái, phải, trước, sau, ở giữa | Dạng 1: Trên, dưới, trái, phải (M1) · Dạng 2: Trước, sau, ở giữa (M2) | positionSceneSVG | Luôn chọn vật làm mốc. Nhìn đúng phía được yêu cầu. |
| g1.length_cm · Đo độ dài bằng thước (cm) | Dạng 1: Đọc thước (M1) · Dạng 2: Đo đoạn thẳng (M2) | rulerSVG | Đặt đúng vạch 0. Ghi đơn vị cm. |
| g1.length_compare · Dài hơn, ngắn hơn | Dạng 1: So độ dài (M1) | sizePairSVG | So từ cùng một đầu. Số đo lớn hơn thì dài hơn. |
| g1.length_ops · Cộng, trừ số đo độ dài (cm) | Dạng 1: Cộng độ dài (M2) · Dạng 2: Bớt độ dài (M2) | polylineSVG | Cùng đơn vị mới tính. Đừng quên cm. |
| g1.clock · Xem giờ đúng | Dạng 1: Đọc giờ (M1) · Dạng 2: Chọn đồng hồ (M2) | clockSVG | Kim ngắn cho biết giờ. Giờ đúng: kim dài chỉ 12. |
| g1.weekday · Các ngày trong tuần | Dạng 1: Ngày mai (M1) · Dạng 2: Hôm qua (M2) | calendarDaySVG | Một tuần có 7 ngày. Sau Chủ nhật là thứ Hai. |
| g1.calendar_day · Xem lịch tờ hằng ngày | Dạng 1: Đọc tờ lịch (M1) | calendarDaySVG | Thứ khác với ngày. Đọc cả tháng khi trả lời. |
| g1.daytime · Các buổi trong ngày | Dạng 1: Chọn buổi phù hợp (M1) | dayPartSVG | Sau sáng là trưa, rồi chiều. Sau chiều là tối. |
| g1.word10 · Bài toán thêm, bớt trong phạm vi 10 | Dạng 1: Thêm vào (M2) · Dạng 2: Bớt đi (M3) | groupsSVG | Tìm điều đề hỏi. Trả lời kèm tên đồ vật. |
| g1.word100 · Bài toán có lời văn trong phạm vi 100 | Dạng 1: Tìm tất cả (M2) · Dạng 2: Tìm còn lại (M3) | tensOnesSVG | Chọn phép tính theo câu chuyện. Đọc lại câu hỏi trước khi trả lời. |

### Lớp 2 — 32 bài

| Kỹ năng | Dạng và mức Em thử | Hình / thao tác | Ghi nhớ chính |
|---|---|---|---|
| g2.addsub20 · Phép cộng, phép trừ (qua 10) trong phạm vi 20 | Dạng 1: Cộng qua 10 (M1) · Dạng 2: Trừ qua 10 (M2) | groupsSVG | Tách số nhưng dùng đủ các phần. Dùng phép cộng để thử lại phép trừ. |
| g2.addsub100_nc · Cộng, trừ không nhớ trong phạm vi 100 | Dạng 1: Cộng (M1) · Dạng 2: Trừ (M2) | column | Đặt tính thẳng hàng. Bắt đầu từ đơn vị. |
| g2.addsub100_c · Cộng, trừ có nhớ trong phạm vi 100 | Dạng 1: Cộng có nhớ (M1) · Dạng 2: Trừ có nhớ (M2) | column | Không bỏ quên số nhớ. Thử lại phép trừ bằng phép cộng. |
| g2.chain · Tính có hai dấu phép tính | Dạng 1: Cộng rồi trừ (M2) · Dạng 2: Trừ rồi cộng (M2) | Ví dụ từng bước | Cộng, trừ cùng mức ưu tiên. Tính từ trái sang phải. |
| g2.terms · Số hạng – tổng, số bị trừ – số trừ – hiệu | Dạng 1: Gọi tên trong phép cộng (M1) · Dạng 2: Gọi tên trong phép trừ (M1) | Ví dụ từng bước | Cộng: số hạng, số hạng, tổng. Trừ: số bị trừ, số trừ, hiệu. |
| g2.missing · Tìm số hạng, số bị trừ, số trừ | Dạng 1: Số hạng (M2) · Dạng 2: Số bị trừ (M2) · Dạng 3: Số trừ (M2) | Ví dụ từng bước | Gọi tên ô trống trước khi chọn phép tính. Thay số tìm được để thử lại. |
| g2.compare_expr · Điền dấu >, <, = | Dạng 1: Điền dấu (M2) | Ví dụ từng bước | Tính đủ hai bên. Dấu = khi hai kết quả bằng nhau. |
| g2.word_more_less · Bài toán về nhiều hơn, ít hơn | Dạng 1: Nhiều hơn (M2) · Dạng 2: Ít hơn (M3) | Ví dụ từng bước | Đọc xem ai nhiều, ai ít. Ghi lời giải và đơn vị. |
| g2.mul_meaning · Phép nhân: thừa số, tích | Dạng 1: Viết tổng thành tích (M1) · Dạng 2: Các nhóm bằng nhau (M2) | groupsSVG | Mỗi nhóm phải bằng nhau. Phép nhân gồm thừa số và tích. |
| g2.mul_table · Bảng nhân 2, bảng nhân 5 | Dạng 1: Tính theo bảng (M1) · Dạng 2: Bài toán nhóm đều (M2) | Ví dụ từng bước | Bảng nhân 2 tăng từng 2. Bảng nhân 5 có tích tận cùng 0 hoặc 5. |
| g2.mul_table34 ★ · Bảng nhân 3, bảng nhân 4 | Dạng 1: Tính tích (M1) · Dạng 2: Bài toán (M2) | Ví dụ từng bước | Nhân 3: đếm thêm 3. Nhân 4: đếm thêm 4. |
| g2.div_meaning · Phép chia: số bị chia, số chia, thương | Dạng 1: Tìm số mỗi nhóm (M1) · Dạng 2: Tìm số nhóm (M2) | groupsSVG | Chia đều: mỗi nhóm bằng nhau. Đọc kỹ đang hỏi số nhóm hay số mỗi nhóm. |
| g2.div_table · Bảng chia 2, bảng chia 5 | Dạng 1: Tính thương (M1) · Dạng 2: Chia đều (M2) | Ví dụ từng bước | Dùng bảng nhân để nhớ bảng chia. Thương nhân số chia bằng số bị chia. |
| g2.div_table34 ★ · Bảng chia 3, 4; tìm số bị chia | Dạng 1: Tính thương (M1) · Dạng 2: Tìm số bị chia (M2) | Ví dụ từng bước | Bảng nhân giúp nhớ bảng chia. Tìm số bị chia bằng phép nhân. |
| g2.kg · Ki-lô-gam: nặng hơn, nhẹ hơn | Dạng 1: Đọc và so sánh cân (M1) · Dạng 2: Tính khối lượng (M2) | balanceSVG | kg là ki-lô-gam. So sánh khối lượng, không chỉ nhìn kích thước. |
| g2.liter · Lít | Dạng 1: Gộp lượng nước (M1) · Dạng 2: Lượng còn lại (M2) | bigEmojiSVG | Lít viết là l. Bình cao hơn chưa chắc chứa nhiều hơn. |
| g2.length · Đề-xi-mét, mét, ki-lô-mét | Dạng 1: Đổi đơn vị (M1) · Dạng 2: Ước lượng độ dài (M2) | rulerSVG | dm, m, km đo độ dài khác nhau. Đổi cùng đơn vị trước khi so sánh. |
| g2.clock · Xem đồng hồ (kim phút chỉ số 3, số 6) | Dạng 1: Giờ 15 phút (M1) · Dạng 2: Giờ rưỡi (M2) | clockSVG | Kim phút chỉ 3: 15 phút. Kim phút chỉ 6: 30 phút. |
| g2.hours_day · Ngày – giờ, giờ – phút | Dạng 1: Đọc giờ chiều, tối (M1) · Dạng 2: Đổi giờ ra phút (M2) | Ví dụ từng bước | Một ngày có 24 giờ. Một giờ có 60 phút. |
| g2.calendar_month · Ngày – tháng, xem lịch tháng | Dạng 1: Tìm thứ của một ngày (M1) · Dạng 2: Cùng thứ tuần sau (M2) | calendarMonthSVG | Dò đúng cột thứ. Cùng thứ hai tuần liên tiếp cách 7 ngày. |
| g2.points_lines · Điểm, đoạn thẳng, đường thẳng, đường cong, ba điểm thẳng hàng | Dạng 1: Gọi tên đường (M1) · Dạng 2: Điểm thẳng hàng (M2) | linesSVG | Đoạn thẳng có hai đầu mút. Kiểm tra thẳng hàng bằng thước. |
| g2.polyline · Đường gấp khúc, độ dài đường gấp khúc | Dạng 1: Đếm đoạn thẳng (M1) · Dạng 2: Tính độ dài (M2) | polylineSVG | Đếm đủ từng đoạn. Cộng độ dài, không cộng số đỉnh. |
| g2.quadrilateral · Hình tứ giác | Dạng 1: Nhận biết tứ giác (M1) · Dạng 2: Đếm tứ giác (M2) | polygonsRowSVG | Tứ giác có bốn cạnh. Xoay hình không thay đổi số cạnh. |
| g2.shapes3d · Khối trụ, khối cầu | Dạng 1: Gọi tên khối (M1) | solidSVG | Quả bóng có dạng khối cầu. Lon sữa có dạng khối trụ. |
| g2.numbers1000 · Số đến 1000: trăm – chục – đơn vị, số tròn trăm | Dạng 1: Đọc và viết số (M1) · Dạng 2: Phân tích số (M2) | place-value | Viết đủ chữ số từng hàng. 10 trăm là 1000. |
| g2.compare1000 · So sánh, sắp xếp các số đến 1000 | Dạng 1: Điền dấu (M1) · Dạng 2: Sắp xếp (M2) | Ví dụ từng bước | Trăm trước, chục sau. Bằng cả ba hàng thì hai số bằng nhau. |
| g2.addsub1000 · Cộng, trừ trong phạm vi 1000 | Dạng 1: Cộng (M1) · Dạng 2: Trừ (M2) · Dạng 3: Bài toán (M3) | column | Viết thẳng ba hàng. Kiểm tra số nhớ ở từng bước. |
| g2.money · Tiền Việt Nam (100, 200, 500, 1000 đồng) | Dạng 1: Đếm tiền (M1) · Dạng 2: Tiền trả lại (M2) | notesSVG | Đếm giá trị, không chỉ đếm số tờ. Tiền trả lại bằng tiền đưa trừ tiền mua. |
| g2.money_big ★ · Tiền Việt Nam đến 50 000 đồng | Dạng 1: Tổng số tiền (M2) · Dạng 2: Tiền trả lại (M2) | notesSVG | Đọc đủ các chữ số 0. Thử cộng tiền mua và tiền trả lại. |
| g2.tally · Thu thập, kiểm đếm số liệu | Dạng 1: Đọc vạch kiểm đếm (M1) · Dạng 2: Tổng số đã đếm (M2) | tallySVG | Mỗi vật chỉ ghi một lần. Một nhóm gạch đủ biểu diễn 5. |
| g2.pictograph · Biểu đồ tranh | Dạng 1: Đọc một hàng (M1) · Dạng 2: So sánh hai hàng (M2) | pictographSVG | Đọc chú thích trước. Dò đúng hàng của đối tượng. |
| g2.chance · Chắc chắn, có thể, không thể | Dạng 1: Chắc chắn hoặc không thể (M1) · Dạng 2: Có thể (M2) | bagSVG | Chắc chắn khác với có thể. Không có trong túi thì không thể lấy được. |
