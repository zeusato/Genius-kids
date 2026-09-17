# Làng Mầm 0.2 — trạng thái triển khai

Cập nhật 17/09/2026. Module chơi riêng, tiến trình local, chưa ghép Genius Kids và chưa triển khai tài khoản/online. Đối chiếu [thiết kế](REVAMP_PLAN.md) và [kiểm chứng](VERIFICATION.md). Không coi nghiệm thu thiết bị thật và giữ chân người chơi là đã đạt.

## Chạy và kiểm tra

Chạy từng lệnh từ gốc repository, dùng dependency hiện có:

```powershell
node node_modules/vite/bin/vite.js --config modules/farm/vite.config.ts --configLoader runner
node node_modules/typescript/bin/tsc -p modules/farm/tsconfig.json
node node_modules/vitest/vitest.mjs run --config modules/farm/vitest.config.ts --configLoader runner
node node_modules/vite/bin/vite.js build --config modules/farm/vite.config.ts --configLoader runner
```

- Chơi: http://127.0.0.1:4328/ — DB `lang-mam-independent-lab-v1`, giữ tên để chuyển vườn cũ.
- Sân thử dev: `/?lab=qa` — DB `lang-mam-qa-only-v2`, nút Home 1/25 và tiến giờ. Home 25 có 29 công trình, 120 luống, 12 giống, 36 khu; tài sản fixture chỉ cấp vào DB QA.
- `/mobile-preview.html`: iframe 390 × 844, `/?lab=mobile`, DB QA mobile riêng. Không giả lập điện thoại thật. QA bị loại khỏi production build.
- `.build`, `.vite-cache`, `reports` là đầu ra/cache của module; không đụng host.

## Gameplay hiện có

| Hệ thống | Hành vi |
|---|---|
| Thao tác | Năm menu, giữ công cụ Gieo/Tưới/Thu; quét mỗi ô một lần, preview chi phí/sản lượng/ô bỏ qua; batch nguyên tử, revision và mã chống lặp |
| Bố trí | Chọn trên mesh, kéo nhà, nút xoay/xác nhận/hủy cạnh vật, kiểm footprint/cao độ/nước/vật cản, hoàn tác; giữ mẻ đang chạy khi chuyển |
| Camera | Pan/zoom, chuột phải/Q/E và nút xoay, focus nhà/khu; hai ngón pan/zoom/xoay hủy nét đang dở; Escape/pointer cancel/ra ngoài canvas không commit |
| Home | 25 cấp, 8→120 luống, 4→36 khu, 1→4 đội thợ; điều kiện chéo; chỉ cấp hoàn thành mở nội dung |
| Nội dung | Home + 28 nhà phụ; nhà phụ không vượt Home; 12 giống, catalog hàng hóa/công thức theo nghề và cấp |
| Công việc | Xây/nâng theo hạn, Home cuối 96 giờ; nâng chờ mẻ hiện tại, giữ phí/thợ; hủy lịch chưa chạy hoàn phí; hàng đợi hữu hạn, kho trạm đầy thì dừng |
| Phiếu | 5/10/30/60 phút, xem trước, áp một vụ/mẻ/nâng/khai phá; đã hết hạn không tiêu, dư không hoàn |
| Thế giới | Seed ngẫu nhiên, sáu họ, ba thế mạnh; 96 × 96, khu 16 × 16; bốn khu sở hữu và 24 × 24 sạch ban đầu; sông/hồ/suối/cao độ/dốc/cầu |
| Khai phá | Khu liền kề có đường tiếp cận; cây/đá/quặng có job và thưởng nhận một lần; kho đầy giữ tài nguyên; gom gỗ/đá lặp lại và trạm nguyên liệu hỗ trợ solo |
| Bờ nước | Cầu dùng ván/đá/xu trong năm phút; cảng bắt buộc một hàng bờ, ba hàng nước, xét bốn hướng; ao cá là nguồn thay thế |
| Kinh tế | Kho theo cấp, ghim dự trữ chống bán/giao nhầm; NPC giá cao/stock kỳ bốn giờ, không tích lũy kỳ bỏ lỡ; cứu trợ giống khi thực sự hết vốn |
| Mục tiêu | 25 chương, thành tựu, đơn NPC/đổi đơn; hợp đồng ba chặng từ Home 12, sản phẩm cao hơn từ 15 |
| Nghề/dự án | Ba nghề × ba bậc ở Home 10/18/25: tự làm và nộp hàng, giảm 5/10/15% thời gian mẻ mới; giữ cả ba nghề; ba dự án nhận decor/phiếu; sổ sản phẩm |
| Mini game | Nhớ nhịp câu cá tại cảng; ghép ống 3 × 3 kiểm đường chảy thật; thưởng giới hạn theo kỳ chợ |
| Hình ảnh | Mesh thật, sáu mốc nhà 1/5/10/15/20/25, cây năm giai đoạn, kit thiết bị/decor/bờ nước, chim/cối xay/bò; âm báo bật tùy chọn |
| Hiệu năng | Instancing ruộng/vật cản; gộp công trình theo vật liệu vẫn chọn đúng nhà; cache model/chunk; nhẹ và giảm chuyển động; mobile mặc định nhẹ |

Nhà sử dụng kit procedural, chưa phải bộ GLB mỹ thuật đã duyệt riêng từng nghề. Sáu mốc có hình học thêm; cấp giữa có lợi ích gameplay và chi tiết. Xưởng mẫu xem mọi cấp/bốn phía. Concept raster là tham chiếu, không thay mesh.

## Save và chuyển đổi

Schema/contentVersion 2, `economy: local-unverified`. Engine thuần xử lý lệnh; adapter tuần tự hóa và ghi IndexedDB bằng compare-and-swap. Ghi lỗi không áp giao dịch lên UI; cửa sổ thua conflict phải tải bản mới. Không reset save hỏng hoặc tương lai.

V1 qua validator đóng băng `core/legacy/`, chuyển trong bộ nhớ. Lần ghi đầu giữ nguyên raw tại `migration-original-v1` trong cùng transaction; `previous` giữ bản trước mỗi lần ghi. Có nút xuất nguyên gốc. Giữ xu/kho/ID/vị trí/luống/cây và giao kèo mẻ cũ, kể cả XP. Quyền kế thừa chỉ mở recipe đã có ở v1. Home/kho thêm vào chỗ trống, cấp ít nhất bằng nhà cũ; đặc quyền kho/luống ngăn mất tài sản.

Không chặn offline ở 24 giờ. Đồng hồ lùi không hạ mốc đã tính. Job chụp đầu vào/đầu ra/thời gian/XP; nâng nhà/học nghề chỉ đổi job mới. Hàng đợi hữu hạn, không tự tạo thêm sản xuất khi nghỉ.

Import có xem trước/xác nhận và xuất bản hiện tại trước khi thay. IndexedDB không theo Git; chuyển máy bằng JSON. Localhost và 127.0.0.1 khác origin.

## Kiến trúc

- `core/content.ts`, `progression.ts`, `activities.ts`: catalog, Home nhập JSON, chi phí/chuỗi/mục tiêu/nghề.
- `core/engine.ts`, `simulation.ts`, `world.ts`: lệnh, deadlines, generator/đường tiếp cận. `copy.ts` chia sẻ mảng địa hình bất biến, biên adapter deep-copy.
- `validation.ts`, `adapters/local.ts`: kiểm dữ liệu, migration, CAS, backup.
- `Game.tsx`, `ui/`: giao diện, không sửa tiền/kho trực tiếp.
- `render/FarmWorld.tsx`: camera/gesture; `Buildings.tsx` ánh xạ tam giác→ID, `CropField.tsx` instance→ID; `models.ts` asset; `FarmScene.tsx` helper/gallery.
- `DevLab.tsx`: fixture riêng chỉ dev. Test `.check.ts` không trùng quy ước test host.

## Ranh giới chất lượng

Không sửa host routes/profile/account/package/config, không Supabase/service worker/chợ người chơi. Chưa có khởi động PWA offline; tiến trình offline được tính khi mở lại trang được máy chủ phục vụ.

Chức năng A–D và nhiều mục E đã hiện thực. **Chưa đóng nghiệm thu E:** cần cảm ứng/FPS điện thoại thật, duyệt mỹ thuật theo từng nghề, chơi nhiều ngày với người thật. Mô phỏng chứng minh có đường solo, không chứng minh nhịp đã hấp dẫn. Kịch bản tám luống/nâng tuần tự không tối ưu nhiều thợ/đơn/thưởng; mốc ngày là số đo chiến lược đó, không là lời hứa thời gian hoàn thành.

Tiếp tục chất lượng module trước F và ghép host.
