# Kiểm chứng Làng Mầm 0.2

17/09/2026, kiểm trên module thật. Fixture chỉ dùng DB QA riêng, không đụng vườn của Đại ca.

## Tự động

Typecheck module/host và production build đạt. Bộ test gồm regression v1, engine v2, persistence, raw migration, model, thế giới, hoạt động và chơi solo. Kết quả cuối ghi tại cuối tài liệu sau chạy lại.

**Lần chạy cuối: 64/64 test, 7/7 file đạt**, 77,40 giây. Typecheck module/host đạt; build 0.2 đạt, JS 1.262 MB / 365 kB gzip, CSS 15,24 kB / 4,01 kB gzip và font 13,10 kB. Cảnh báo chunk >500 kB vẫn còn.

- 6.000 seed: kích thước, giá trị terrain, vùng sạch/bờ cảng và đủ sáu họ. 120 seed kiểm hai bờ cầu khô và đủ 36 khu tiếp cận sau xây cầu.
- Batch nguyên tử, ô lặp/thiếu hạt/revision cũ, receipt qua reload, kho đầy, reserve, move/undo giữ job, hủy lịch/hàng đợi hoàn phí.
- Đồng hồ lùi, nâng bốn ngày sau bảy ngày vắng, mẻ→nâng→mẻ chờ, không nhận lặp, phiếu sau deadline không bị tiêu.
- Mở đồng thời, cửa sổ stale không ghi đè, quota không đổi UI, import/revision, dữ liệu hỏng/tương lai không reset, raw v1 giữ nguyên sau nhiều lần lưu, XP mẻ cũ và quyền recipe kế thừa.
- Ống tưới kiểm đường chảy/thưởng kỳ; nghề đòi tự sản xuất; dự án nhận decor một lần.
- Model hữu hạn/clone hoạt ảnh độc lập; 12 cây × năm giai đoạn, sáu mốc nhà. Không thay kiểm thẩm mỹ.

## Chơi solo

`tests/progression-playthrough.check.ts`: **3 biome × lịch 5/15/30 phút/ngày**, dùng lệnh thật, không gán tiền/hàng/cấp sau tạo mới, không giao dịch người chơi hay dùng phiếu. Lên Home 25; một lượt còn tự làm và nhận đủ 25 chương. Validate snapshot mỗi mốc.

Mỗi lệnh hai giây; hết phiên chuyển ngày, thu batch và dùng hàng đợi hữu hạn. Tám luống, nâng từng nhà tuần tự, tự gom/craft vật liệu, kiếm xu từ cây. Chưa mô phỏng tối ưu nhiều thợ, nhiều phiên/ngày hoặc hành vi thật. [Dữ liệu](solo-progression-v2.json), [phân tích](ECONOMY_VERIFICATION.md).

## Trình duyệt

- Quét thu sáu luống quà: 17 hàng; quét gieo tám ô lúa mì: trừ 24 xu; công cụ giữ nguyên.
- Chọn trên mesh đã gộp vẫn đúng nhà; xoay camera, xoay nhà/xác nhận, chuyển vị trí mới, hoàn tác thành công, tiền/kho giữ nguyên.
- Nút cạnh vật và toast nằm trên thanh công cụ/dock. Năm menu riêng. Mobile panel dưới bản đồ, đóng bảng hiện đủ công cụ.
- QA Home 25: 29 nhà, 120 luống, 12 giống, 36 khu. Minimap cùng terrain nước/cao độ/cầu.
- Hai cửa sổ chung DB báo conflict đúng; QA mobile tách DB để thử song song. Các lỗi HMR trong lúc ghi nguồn được kiểm lại bằng tải bản ổn định, không đồng nhất với lỗi release.
- Bản production đã được phục vụ riêng tại cổng 4329 và mở bằng trình duyệt: khởi tạo Home 1, đầy đủ menu/cảnh, không có debug/QA, log lỗi rỗng. Bundle được kiểm không chứa mã DB/nút QA. Dev server chờ ghi file ổn định 150 ms để tránh HMR đọc file đang ghi dở trên Windows.
- Sau sửa guard điểm thả, click thu hoạch qua canvas vẫn thành công. Thả trên UI overlay hủy nét thay vì commit qua thanh công cụ.

Ảnh thật: [Home 1](screenshots/home-1.png), [Home 25](screenshots/home-25.png), [bản đồ](screenshots/world-map.png), [mobile](screenshots/mobile-390.png). [Concept v2](farm-world-concept-v2.png) không phải screenshot.

## Hiệu năng và giới hạn

Windows, browser nhúng Codex, desktop 1280 × 720. CPU môi trường báo `Intel64 Family 6 Model 140 Stepping 2`; truy vấn GPU bị từ chối, không gán số đo cho GPU cụ thể. Bộ đo hiển thị trong QA, lấy mẫu ba giây sau dựng model.

- Home 25, một cửa sổ/ánh sáng mềm: **60 FPS, p95 17 ms, 107 calls, khoảng 402 nghìn tam giác** tại góc đo. Khi đổi góc/di chuyển có mẫu 57 FPS, p95 19 ms.
- Trước tối ưu: khoảng 342 calls/609 nghìn tam giác. Instancing/gộp công trình và bỏ bevel thừa giảm tải. Góc/cửa sổ khác nhau nên đây không là benchmark kiểm soát tuyệt đối.
- Khung mobile 390 × 844 trên cùng máy, trước tối ưu cuối, nhiều cửa sổ cùng vẽ: mẫu 38 FPS, p95 29 ms. **Không phải hiệu năng điện thoại thật.**
- Sau tối ưu cuối, khung mobile cùng desktop đang mở: mẫu 48 FPS, p95 24 ms, 107 calls, khoảng 401 nghìn tam giác. Ảnh mobile đã lưu ứng với lần kiểm này.
- Có đồ họa nhẹ (không bóng, DPR 1), giảm chuyển động/demand rendering, mobile mặc định nhẹ.

Chưa thử cảm ứng hai ngón/GPU điện thoại thật, chưa chạy nhiều giờ liên tục, chưa có người chơi nhiều ngày. Chưa chứng nhận toàn bộ E. Build còn cảnh báo bundle Three/React lớn; cần đo cold start trên thiết bị/mạng mục tiêu.

## Phạm vi

Chỉ đổi `modules/farm/`, giữ `.claude/settings.local.json` có trước. Không commit/push/deploy hoặc mở server public. Không đổi host/account/online.
