# Theo dõi triển khai ba hoạt động Bảng Chữ Cái

Cập nhật: 16/09/2026.  
Phạm vi/tiêu chí: `docs/alphabet-activities-upgrade-plan.md`.  
QA chi tiết: `docs/qa/alphabet-activities/qa-report.md`.  
Trạng thái tổng: **PARTIAL — review độc lập phát hiện lỗi audio, thiếu checkpoint/retry, trợ giúp, adaptive và bằng chứng nghiệm thu**.

Review ngày 16/09/2026: `docs/qa/alphabet-activities/independent-review.md` là kết luận mới nhất, thay thế kết luận DONE của lượt triển khai trước. Các bằng chứng QA cũ bên dưới được giữ để tham khảo, không chứng minh các gate còn thiếu đã đạt. Mã sản phẩm chưa được sửa trong lượt review.

## Trạng thái 19 bước

| Bước | Công việc | Trạng thái | Bằng chứng chính |
|---|---|---|---|
| P00 | Baseline, browser hiện trạng, file map | DONE | commit `07a4081`; `baseline-build.log`; `before-word-desktop.png` |
| P01 | 53 từ, A–Z, contract phiên, asset manifest | DONE | `content.ts`, `types.ts`, asset plan/runtime report |
| P02 | Sequence có seed, progress/normalization | PARTIAL | Có seeded shuffle; thiếu adaptive, mastery sai số phiên (R5/R6/R7) |
| P03 | Lưu/thưởng/profile adapter, migration | PARTIAL | Adapter/dedupe có; thiếu checkpoint, resume và retry UI (R2) |
| P04 | Frame, drag/tap/keyboard, audio lifecycle | PARTIAL | Audio success/error sai; chuyển câu không đợi đọc xong (R1/R3) |
| P05 | Pilot Flow, style desktop/mobile | DONE | custom Flow workshop + contact sheets |
| P06 | Một phiên Giỏ đồ chạy trọn | DONE | preview fixed X 6/6 |
| P07 | Đủ 53 ảnh vật và 3 nền Giỏ đồ | PARTIAL | Đủ file nhưng word-beach sai bối cảnh (R8) |
| P08 | Giỏ đồ đủ ba mức, A–Z, adaptive | PARTIAL | Thiếu help/adaptive; Tự thử có câu 3 đáp án (R4/R5/R7) |
| P09 | Nghiệm thu Giỏ đồ | PARTIAL | Luồng cơ bản có; còn lỗi và matrix chưa đủ (R2/R3/R4/R9) |
| P10 | Art Bưu điện, 3 cảnh + đạo cụ | PARTIAL | Cảnh làng tuyết chưa đúng (R8) |
| P11 | Bưu điện đủ ba mức | PARTIAL | Thiếu help/nhóm dễ nhầm; fixed letter mất ở bảng 2 (R4/R7) |
| P12 | Nghiệm thu Bưu điện | PARTIAL | Happy path có; chưa đủ matrix (R2/R4/R9) |
| P13 | Art Ga tàu, 3 cảnh + đạo cụ | PARTIAL | Cảnh seaside là ao cá (R8) |
| P14 | Ga tàu đủ ba mức | PARTIAL | Audio lỗi vẫn cho chấm (R1) |
| P15 | Nghiệm thu Ga tàu | FAIL | Tái hiện UI báo không đọc được nhưng vẫn chấm vé sai (R1) |
| P16 | Menu, progress ba kỹ năng, regression shell | PARTIAL | Thiếu tiến độ theo chữ/menu ôn; mastery sai (R5/R6) |
| P17 | QA tổng, performance, production/PWA | PARTIAL | Test/build lịch sử pass; chưa đủ matrix và còn lỗi R1–R9 |
| P18 | Bàn giao đủ bằng chứng | PARTIAL | Đã có review và hướng sửa; chưa đạt gate toàn bộ |

## Bao phủ yêu cầu do lượt triển khai tự báo (lịch sử, chưa phải kết luận review)

Các nhãn DONE trong bảng lịch sử này đã được đánh giá lại ở bảng gate phía trên và review R1–R9; đặc biệt audio, mastery, adaptive, art và QA chưa đạt.

| Yêu cầu | Trạng thái / bằng chứng |
|---|---|
| Giỏ đồ có đưa vật vào giỏ | DONE — chọn/chạm hoặc kéo, vật xuất hiện trong giỏ |
| Bưu điện giao thư tới nhà | DONE — tap và pointer drag đều qua preview |
| Ga tàu có soát vé và 6 hành khách | DONE — avatar lên từng toa |
| A–Z, 53 từ, X không vô nghiệm | DONE — data validation + 200 seed/mức |
| Ba mức mỗi trò | DONE — Làm quen/Tự thử/Thử thách |
| 9 cảnh khác nhau | DONE — contact sheet và manifest |
| Trẻ chưa biết đọc hiểu luật | DONE — thẻ/intro tự diễn hành động, TTS tự đọc lúc vào và mỗi vòng |
| Nghe riêng không tính chọn | DONE — preview xác nhận `aria-pressed=false` |
| Kéo/chạm tương đương | DONE — cùng action model; drag thật đã chạy |
| Nhạc alphabet tắt, giữ preference | DONE — regression 84/84 |
| Progress ba kỹ năng riêng | DONE — schema v1 + migration/mastery test |
| Không mất sticker/tập tô cũ | DONE — garden/tracing tests qua |
| Không thưởng đôi | DONE — session/result ID dedupe test |
| Back/deep link | DONE — ba query route hoạt động, về menu đúng |
| Counting/Colors | DONE — browser smoke |
| Mobile 320/390, reduced motion | DONE — ảnh QA + CSS media query |
| Không placeholder/temp URL | DONE — runtime chỉ dùng WebP trong `public/` |
| Tải nhẹ/PWA | DONE — object + scenes 1.180.638 bytes; production build PASS |

## Ghi chú QA trung thực

- Desktop mouse và pointer drag: đã chạy.
- Mobile: kiểm tra bằng viewport 390 × 844 và 320 × 800; chưa có thiết bị touch vật lý.
- Công cụ browser không nghe được audio; đã xác nhận đường gọi TTS/fallback và UI nghe lại, chưa đánh giá chất giọng trên thiết bị thật.
- Full suite song song có ba timeout CPU-only; chạy lại ba file đó một worker đều pass 63/63. Không có assertion failure.
- Cảnh báo build font/CSS/chunk đã có ở baseline, không thuộc phạm vi ba trò.

## Tài nguyên và môi trường

- Runtime report: `docs/qa/alphabet-activities/asset-report.json`.
- 53 vật, 9 cảnh, 1 mascot đã review bằng contact sheet.
- Preview vẫn chạy ở cổng 3001 để Đại ca xem; viewport đã reset mặc định và không ép đổi trang đang mở.
- Hồ sơ local `Kiểm thử chữ cái` được giữ để xem tiến độ; không đụng `.claude/settings.local.json`.
- Flow tab người dùng được giữ nguyên.
