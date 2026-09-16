# QA ba hoạt động Bảng Chữ Cái

> Review độc lập ngày 16/09/2026 phát hiện lỗi và thiếu nghiệm thu; xem `independent-review.md`. Báo cáo này giữ kết quả của lượt triển khai trước, không còn là bằng chứng kết luận toàn bộ kế hoạch DONE. Riêng khẳng định đã xác nhận fallback audio không đủ: R1 tái hiện thông báo lỗi vẫn cho chấm.

Ngày kiểm tra: 16/09/2026  
Baseline: `07a408106a5ee764d7ed28bd5ef7c2bf6ace8f28`  
Preview: `http://127.0.0.1:3001/Genius-kids/`  
Hồ sơ riêng: **Kiểm thử chữ cái — Mầm non**

## Kết quả chức năng

| Phần | Thao tác đã chạy trên preview | Kết quả |
|---|---|---|
| Giỏ đồ khám phá | Chọn riêng X, hoàn thành 6/6; chạm nút nghe trên thẻ khác; chọn xylophone rồi chạm giỏ | PASS; X không vô nghiệm; nút nghe giữ `aria-pressed=false`; lưu 3 sao |
| Bưu điện chữ cái | Mức Thử thách, hai bảng 5 cặp; kéo thư I vào nhà i; cố ý giao P sai rồi sửa; hoàn thành 10/10 | PASS; kéo và chạm cùng hoạt động; phản hồi sai đúng; lưu 3 sao |
| Hiệu ứng nhà | Giao một thư sau phản hồi của Đại ca | PASS; bỏ `rotateY`, cửa đứng yên, chỉ nhích 3 px + viền sáng + dấu tích |
| Ga tàu âm thanh | Mức Thử thách, chọn riêng A; sai hai lần, mở Cáo trợ giúp; hoàn thành 6/6 | PASS; vé đúng được đánh dấu; đủ 6 hành khách; lưu 2 sao |
| Trẻ chưa biết đọc | Xem thẻ menu và intro Match/Word; code gọi TTS khi mở intro và đổi vòng | PASS phần hình: thư A → nhà a, vật → giỏ chuyển động; TTS tự gọi và vẫn có nút nghe lại |
| Lưu tiến độ/thưởng | Hoàn thành cả ba trò và mở quà | PASS; sao/profile cập nhật; test unit xác nhận callback trùng không thưởng hai lần |
| Đếm Số | Mở `/preschool/counting?activity=learn` | PASS; h1 `Học đếm 1 đến 10` |
| Màu Sắc | Mở `/preschool/colors` | PASS; h1 `Một thế giới đầy sắc màu!` |
| Console | Đọc log sau toàn bộ luồng | PASS; không có error/warning runtime mới |

## Responsive và input

- Desktop bằng chuột: PASS trên viewport mặc định 880 × 880.
- Kéo/thả bằng pointer: PASS với thư I → nhà i.
- Mobile mô phỏng: PASS ở 390 × 844 và 320 × 800; không có tràn ngang, nhà và khay thư tự xuống dòng.
- `prefers-reduced-motion`: có CSS tắt animation cho intro, stage và hướng dẫn hình.
- Viewport đã reset về mặc định sau kiểm tra.
- Chưa có thiết bị iOS/Android vật lý trong phiên này; không tuyên bố đã test touch phần cứng.
- Công cụ browser không nghe được âm thanh đầu ra. Đã xác nhận đường gọi TTS, fallback và nút nghe; chất giọng/âm lượng thực tế cần nghe trên thiết bị đích.

## Tài nguyên

- 53/53 vật thể WebP đã xem trong `objects-contact-sheet.webp`.
- 9/9 bối cảnh WebP đã xem trong `scenes-contact-sheet.webp`.
- 1 mascot Cáo nền trong.
- Vật thể: 740.050 bytes; file lớn nhất 24.508 bytes.
- Bối cảnh: 440.588 bytes; file lớn nhất 60.846 bytes.
- Vật thể + bối cảnh: 1.180.638 bytes, đạt ngân sách 1,2 MB.
- Tổng cộng mascot: 1.240.168 bytes, thấp hơn ngân sách art tổng 7 MB.
- Nguồn chi tiết: `asset-report.json`; pipeline tái tạo: `scripts/prepare-alphabet-activities-art.mjs`.

## Kiểm thử và build

- `node node_modules/typescript/bin/tsc --noEmit`: PASS.
- 7 file liên quan: **84/84 PASS**.
- Toàn suite chạy song song: **883/886 PASS**, ba test nặng timeout, không có assertion sai.
- Chạy lại riêng ba file timeout với một worker: Dragon Quest + Math Racing **39/39 PASS**; Cờ vua perft **24/24 PASS**.
- `node node_modules/vite/bin/vite.js build`: PASS; PWA tạo `dist/sw.js`, precache 699 mục.
- Cảnh báo build tồn tại từ trước: hai URL font runtime, CSS `-: TZ.`, dynamic/static imports và chunk lớn. Không phát sinh từ ba hoạt động mới.

## Ảnh bằng chứng

- `after-word-intro-desktop.png`
- `after-menu-guides-desktop.png`
- `after-match-guided-intro.png`
- `after-word-desktop.png`
- `after-match-desktop.png`
- `after-match-fixed-effect-desktop.png`
- `after-pick-desktop.png`
- `after-menu-mobile-390.png`
- `after-intro-mobile-390.png`
- `after-match-mobile-390.png`
- `after-match-mobile-320.png`
- `objects-contact-sheet.webp`
- `scenes-contact-sheet.webp`
