# Nâng cấp chế độ "Ôn Tập" (Study) — engine, UI/UX, nội dung, SVG, TTS

> Tổng hợp 16/06/2026. **Trạng thái: ĐÃ TRIỂN KHAI.** Nâng cấp toàn diện chế độ làm
> toán trắc nghiệm theo cấp lớp ở `src/pages/StudyPage.tsx` + `src/components/study/*`
> + `services/mathEngine.ts` + `services/generators/**`.

## 1. Bối cảnh
Chế độ Ôn Tập trước nâng cấp: 1 chế độ làm bài duy nhất (giống "Kiểm tra"), chưa có TTS,
SVG hình vẽ thô (vẽ cố định không theo số đo, dễ tràn khung, có chỗ hack), và thiếu nhiều
mảng kiến thức cốt lõi so với chương trình GDPT 2018.

## 2. Hạ tầng dùng chung (mới)
- **`src/utils/questionSpeech.ts`** — `questionToSpeech(text)`: bỏ Markdown/KaTeX, đổi ký hiệu
  toán → văn nói (5 cộng 3 bằng mấy; a/b → "a phần b"), giữ dấu "?" cuối câu lời văn. Có test.
- **`services/generators/svg/`** — BỘ SVG DÙNG CHUNG. `style.ts` (palette, typography, `svgWrap`
  với viewBox + scale-to-fit + đổ bóng + max-width 100%, `fitScale`, `label`). `index.ts` xuất:
  `rectSVG/squareSVG/parallelogramSVG/rhombusSVG/trapezoidSVG/triangleSVG/circleSVG/box3dSVG/
  cubeSVG/angleSVG`, `clockSVG`, `fractionBarSVG/fractionPieSVG`, `numberLineSVG`, `baseTenSVG`,
  `barChartSVG/pieChartSVG`, `moneySVG`, `countingSVG`, `shapeSVG/shapesGridSVG`. **Tất cả tỉ lệ
  đúng theo số đo, có nhãn, an toàn viewBox.**

## 3. UI/UX (TopicSelection / TestRunner / StudyPage)
- **Hai chế độ**: **Luyện tập** (báo đúng/sai + giải thích NGAY mỗi câu, không tính giờ) và
  **Kiểm tra** (tính giờ, chấm khi nộp). Chọn ở `TopicSelection`; `TestResult.mode` lưu lại.
- **QoL**: xác nhận khi Thoát, cảnh báo "sắp hết giờ" (≤30s), nút Câu trước/Câu sau (điều hướng
  hai chiều), câu Typing không còn buộc gõ đúng tuyệt đối mới qua, responsive 375px.
- **TTS đọc đề (Lớp 1 + Mầm non)**: toggle "Đọc đề cho bé nghe" ở `TopicSelection` (chỉ hiện khi
  `grade ≤ 1`, mặc định BẬT, lưu `localStorage` `mathgenius_tts_autoread`). Khi bật: `SpeakButton`
  `autoPlay`+`autoPlayKey={currentIndex}` tự đọc `questionToSpeech(questionText)` mỗi câu + nút loa
  nghe lại; `cancelSpeech()` khi rời màn. Dùng cơ chế `src/utils/speech.ts` (docs/vietnamese-tts-mechanism.md).

## 4. Nội dung bổ sung theo chuẩn GDPT 2018 (audit-driven)
Generator mới + đăng ký `TOPICS`/`generators` trong `services/mathEngine.ts`:
- **Mầm non** (mới có Ôn Tập): `mn_counting` (đếm ≤10, chọn số lớn/bé nhất), `mn_shapes`, `mn_colors`.
- **Lớp 1**: `g1_clock` (xem đồng hồ giờ đúng). Sửa 2 bug có sẵn (g1_geometry, g1_numbers_20: shuffle-rồi-slice làm mất đáp án đúng).
- **Lớp 2**: `g2_numbers_1000` (số đến 1000), `g2_multiplication` (bảng nhân 2-5), `g2_division`
  (bảng chia 2-5), `g2_money` (tiền VN).
- **Lớp 3**: `g3_fractions` (một phần mấy), `g3_area` (chu vi & diện tích HCN/vuông), `g3_statistics`
  (biểu đồ cột), `g3_money`.
- **Lớp 4**: `g4_divisibility` (dấu hiệu chia hết 2,3,5,9), `g4_average` (trung bình cộng),
  `g4_para_rhombus` (diện tích bình hành & thoi), `g4_fraction_ops` (so sánh/±khác mẫu/nhân phân số).
- **Lớp 5**: `g5_statistics` (biểu đồ cột + hình quạt), `g5_time_ops` (cộng/trừ/đổi/nhân số đo thời gian).

## 5. Refactor SVG (WS-E)
Các generator hình vẽ chuyển sang dùng SVG kit, giữ tên export cho `mathEngine` (visualRequest):
`grade5/geometry` (sửa hộp/tam giác/thang không tỉ lệ + bỏ hack), `grade4/{geometry,fractions,statistics,angles}`,
`grade2/time` (đồng hồ), `grade1/geometry`. `mathEngine` visualRequest (draw_fraction/draw_angle) cũng dùng kit.

## 6. Kiểm thử
- `npm test`: **159 pass**. Có:
  - `src/utils/questionSpeech.test.ts` (chuẩn hoá đọc).
  - `services/generators/svg/svg.test.ts` (mọi hàm kit + 7 generator refactor × 200 lần: SVG hợp lệ, không NaN).
  - `services/generators/content.test.ts` (MỌI chủ đề × 30 lần: options đúng 4 & chứa đáp án đúng,
    MultipleSelect/ManualInput hợp lệ, không NaN/undefined — đã bắt được 2 bug có sẵn).
- `tsc --noEmit`: 0 lỗi. `npm run build`: exit 0.
- Preview: Lớp 1 đồng hồ tự đọc đề (TTS) + clock SVG đẹp; Luyện tập hiện đúng/sai + giải thích;
  xác nhận thoát; tiền VN Lớp 2 đúng; responsive 375px; 0 console error.
