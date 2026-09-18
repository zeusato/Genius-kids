**Icon năng lượng 18/09:** Thay toàn bộ ký tự Unicode năng lượng trong HUD, nút khai phá, phần thưởng quả và hiệu ứng bay bằng EnergyIcon.tsx (SVG tia sét vàng, viền và mặt sáng vẽ riêng). Chỉnh kích thước desktop/mobile, thêm tên nút đầy đủ cho trình đọc màn hình. Typecheck module và diff check đạt; không đổi cơ chế hoặc save, chưa deploy.

**Gia đình tự sinh hoạt 18/09:** [FAMILY_LIFE](FAMILY_LIFE.md): bốn người tự tìm đường trong đất đã mở, ghé nhà/cây/đồ vật, nghỉ và vẫy chào; ưu tiên lệnh khai phá, không tác động kinh tế. Lưới đi tránh công trình/ruộng/nước/vách, nhận cầu đã xây. Giảm chuyển động tắt đi dạo. 26/26 kiểm tra liên quan, typecheck và build module đạt; chưa deploy hoặc đo Android thật.

**Mỹ thuật gia đình 18/09:** Đã thay mô hình hộp bằng hình bo mềm, mặt có mắt/mũi/má, bố mặc yếm + mũ rơm, mẹ mặc tạp dề + tóc búi, bé trai đội mũ và bé gái tóc hai bên. Rig vai/khuỷu/hông/gối riêng cho chạy và khai phá; gia đình đứng thành nhóm hai hàng. Cả bốn dùng 2 instanced draw, 14.496 tam giác, không thêm texture/model tải ngoài. Chrome đã xem cận cảnh, console không lỗi; typecheck, 20/20 test khai phá và build module đạt. Chưa deploy hoặc đo Android thật.

**Khai phá mới 18/09:** [HARVESTING_ENERGY](HARVESTING_ENERGY.md) là yêu cầu hiện hành: 4 cấp tài nguyên, năng lượng 100/+5 mỗi cấp, hồi 3 phút/điểm, nhận ngay, dụng cụ thay năng lượng, gia đình 4 người và bụi quả, mọc tối đa 5 tài nguyên + 5 bụi/ngày, bỏ thu gom. Save cũ chuyển một lần, giữ contentVersion 3 cho Supabase. Đã làm local; chưa deploy, chưa nghiệm thu Android thật.

**Cập nhật tài khoản 18/09:** [ACCOUNT_SYNC](ACCOUNT_SYNC.md) là nguồn hiện hành cho Auth và cloud save. Đã triển khai migration thật trên Supabase qua Chrome, 16 kiểm tra DB đạt và redirect local đã cấu hình. Custom SMTP/email thật chưa nghiệm thu. Market vẫn để sau.

**Google cập nhật 21 giờ 18/09:** đã tạo OAuth client **Lang Mam Web**, bật provider và kiểm đăng nhập thật trên GitHub Pages bằng tài khoản Owner `zeusato@gmail.com`; callback và giữ phiên sau reload đạt. Chưa chọn/upload vườn, chưa nghiệm thu hai thiết bị; Google còn Testing. Chi tiết tại [ACCOUNT_SYNC](ACCOUNT_SYNC.md). Kết quả typecheck/build và 17/17 bài Google + online trước đó không phải chạy lại trong lượt cấu hình này.

**Ghép app chính 18/09:** [HOST_INTEGRATION](HOST_INTEGRATION.md): mục Làng Mầm thứ hai trong Games, ảnh mới, route lazy `/games/farm`, bản lưu guest theo hồ sơ; reload giữ đúng vườn. Sân thử vẫn chạy riêng. Yêu cầu tích hợp mới thay thế phạm vi độc lập cũ.

**Hiệu năng Android/Chrome 18/09:** [PERFORMANCE_2026-09-18](PERFORMANCE_2026-09-18.md) là bàn giao mới nhất: world render reference ổn định, bỏ scenery dưới fog sâu, bỏ raycast khi pan, ảnh lossless giảm 34,8%, mặc định soft và lưu lựa chọn; light giữ cùng DPR cap 1,5. 128/128 test và build module/host đạt. Chưa deploy hoặc nghiệm thu FPS điện thoại thật.

# Làng Mầm — trạng thái triển khai

**Polish cảnh và giao diện 18/09:** [bờ nước mềm](FINAL_POLISH_2026-09-18.md), vát bờ thấp, khoảng cách tới contour cho dải cát ướt/nước nông, gợn nhẹ, normals chung. QA thu gọn mặc định trên điện thoại và không che dock; summary trong popup truy cập được bằng bàn phím. Không đổi save/kinh tế/world logic.

**Chi phí xây mới 18/09:** công trình chức năng dùng xu và vật liệu, hạn mức 1 mỗi loại tính cả đang xây; trang trí chỉ xu. [Bảng giá và quy tắc](CONSTRUCTION_COSTS.md). Menu hiện icon có/cần và 0/1–1/1, kiểm điều kiện trong cả engine và preview. Không thay giá các công trình/job đã có.

**Kho hàng gọn 18/09:** `ui/Inventory.tsx` thay các dòng có nhiều nút bằng ô hình/tên/số lượng. Chỉ vật phẩm được chọn mới hiện số lượng bán, tổng xu và giữ lại; bán thành công trở về kho. Phần phụ dùng details đóng mặc định; có tìm hàng và trạng thái kho trống.

**Chim cảnh 18/09:** bay vào/lượn/bay ra trong 26–32 giây rồi nghỉ 80–140 giây; lần đầu chờ 15 giây. Hướng ghé thay đổi. Ẩn khi giảm chuyển động, thời gian trang nền không làm nhảy hoạt cảnh. Không có dữ liệu gameplay cần lưu.

**Bộ cây mới nhất 18/09:** [24 giống](CROPS_24.md), thêm 12 rau/củ/quả/hoa/gia vị; nghệ tây 24 giờ tại Home 25. Có model phát triển, thumbnail và icon sản phẩm riêng; schema 2/content 3, tự chuyển kho cũ và giữ tiến trình. Các ghi chép “12 giống” ở những đợt trước là lịch sử.

**UI tài nguyên đã chốt 18/09:** nâng cấp chỉ hiện icon + có/cần, thiếu đỏ/đủ xanh; không dựng bảng thống kê. Nút và xác nhận kiểm đủ chi phí. Cây/đá/quặng dùng đúng tên variant trong menu chọn, hover và khai phá. Component: `UpgradeResources.tsx`, `ResourceIcon.tsx`; tên chung: `core/scenery.ts::obstacleName`.

**Hòa trộn cảnh 18/09:** [bản sửa sprite](foliage-blending-2026-09-18.md) giữ alpha ở mép cây/đá/cây thấp, thay bóng đĩa bằng bóng tiếp đất mềm và dùng bạch dương v2. Vẫn cố định góc nhìn, không thay save.

**Bổ sung menu ảnh 18/09:** xây dựng/trang trí có thumbnail đúng model và cấp; 12 giống có ảnh trưởng thành, giá/thời gian/sản lượng. Gieo và đổi giống dùng popup ảnh. Renderer thumbnail tạm, tải theo vùng nhìn và cache PNG; giữ nguyên gameplay/save.

**Cập nhật mới nhất 18/09:** đọc [CONTEXTUAL_PLAY_AND_ROADS](CONTEXTUAL_PLAY_AND_ROADS.md). Đã bỏ sidebar/toolbar cố định, thêm menu tại vật thể, cửa sổ có tranh, kéo liềm và hàng bay về kho sau lưu thành công, texture đất, chim ảnh và đường tự nối 16 hướng. Mô tả bảng bên/toolbar phía dưới là lịch sử, không phải UI hiện tại.

**Đợt tiếp 18/09:** [kiến trúc và sương khám phá](ARCHITECTURE_AND_EXPLORATION.md) cập nhật mẫu xưởng, tỷ lệ nhìn, 7 vùng nền, 3 ảnh cây thấp, sương theo khu sở hữu và sân thử tách khởi đầu/trưng bày. Hiện 75 test đạt. Đây là trạng thái mới hơn phần địa hình v2 bên dưới.

**Cập nhật 18/09/2026:** đã có [địa hình v2 và sprite tài nguyên](TERRAIN_V2_IMPLEMENTATION.md): camera cố định pan/zoom, một mẫu thung lũng, 7 cây + 7 đá/quặng, sửa luật tiếp cận. World v1 giữ nguyên save; v2 dùng cho vườn mới/QA. Phần dưới ghi nền gameplay 0.2, các chi tiết camera/hình ảnh đã được cập nhật ở bảng.

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
- Sân thử dev: `/?lab=qa` — DB `lang-mam-qa-only-v2`, nút Home 1/25 và tiến giờ. Home 25 có 29 công trình, 120 luống, 24 giống, 36 khu; tài sản fixture chỉ cấp vào DB QA.
- `/mobile-preview.html`: iframe 390 × 844, `/?lab=mobile`, DB QA mobile riêng. Không giả lập điện thoại thật. QA bị loại khỏi production build.
- `.build`, `.vite-cache`, `reports` là đầu ra/cache của module; không đụng host.

## Gameplay hiện có

| Hệ thống | Hành vi |
|---|---|
| Thao tác | Năm menu, giữ công cụ Gieo/Tưới/Thu; quét mỗi ô một lần, preview chi phí/sản lượng/ô bỏ qua; batch nguyên tử, revision và mã chống lặp |
| Bố trí | Chọn trên mesh, kéo nhà, nút xoay/xác nhận/hủy cạnh vật, kiểm footprint/cao độ/nước/vật cản, hoàn tác; giữ mẻ đang chạy khi chuyển |
| Camera | Góc cố định, pan/zoom, focus Home/khu/hồ/rừng/cao nguyên; hai ngón pan/zoom hủy nét đang dở; Escape/pointer cancel/ra ngoài canvas không commit |
| Home | 25 cấp, 8→120 luống, 4→36 khu, 1→4 đội thợ; điều kiện chéo; chỉ cấp hoàn thành mở nội dung |
| Nội dung | Home + 28 nhà phụ; nhà phụ không vượt Home; 24 giống, catalog hàng hóa/công thức theo nghề và cấp |
| Công việc | Xây/nâng theo hạn, Home cuối 96 giờ; nâng chờ mẻ hiện tại, giữ phí/thợ; hủy lịch chưa chạy hoàn phí; hàng đợi hữu hạn, kho trạm đầy thì dừng |
| Phiếu | 5/10/30/60 phút, xem trước, áp một vụ/mẻ/nâng/khai phá; đã hết hạn không tiêu, dư không hoàn |
| Thế giới | Seed ngẫu nhiên, sáu họ, ba thế mạnh; 96 × 96, khu 16 × 16; bốn khu sở hữu và 24 × 24 sạch ban đầu; sông/hồ/suối/cao độ/dốc/cầu |
| Khai phá | Khu liền kề có đường tiếp cận; cây/đá/quặng có job và thưởng nhận một lần; kho đầy giữ tài nguyên; gom gỗ/đá lặp lại và trạm nguyên liệu hỗ trợ solo |
| Bờ nước | Cầu dùng ván/đá/xu trong năm phút; cảng bắt buộc một hàng bờ, ba hàng nước, xét bốn hướng; ao cá là nguồn thay thế |
| Kinh tế | Kho theo cấp, ghim dự trữ chống bán/giao nhầm; NPC giá cao/stock kỳ bốn giờ, không tích lũy kỳ bỏ lỡ; cứu trợ giống khi thực sự hết vốn |
| Mục tiêu | 25 chương, thành tựu, đơn NPC/đổi đơn; hợp đồng ba chặng từ Home 12, sản phẩm cao hơn từ 15 |
| Nghề/dự án | Ba nghề × ba bậc ở Home 10/18/25: tự làm và nộp hàng, giảm 5/10/15% thời gian mẻ mới; giữ cả ba nghề; ba dự án nhận decor/phiếu; sổ sản phẩm |
| Mini game | Nhớ nhịp câu cá tại cảng; ghép ống 3 × 3 kiểm đường chảy thật; thưởng giới hạn theo kỳ chợ |
| Hình ảnh | Hybrid: đất/nước/công trình/cây mùa vụ là mesh; 14 tài nguyên tự nhiên là sprite cố định. Nhà sáu mốc 1/5/10/15/20/25, cây mùa vụ năm giai đoạn; âm báo bật tùy chọn |
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
