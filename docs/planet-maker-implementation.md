# Xưởng Hành Tinh — triển khai mốc 0–4

Em cập nhật cho Đại ca ngày 07/09/2026. Kế hoạch gốc: [planet-maker-evolution-plan.md](planet-maker-evolution-plan.md).

## Chức năng đã triển khai

| Mốc | Kết quả trong mã nguồn |
|---|---|
| 0 — Nền lưu và kiến trúc | Đọc V1, giữ bản localStorage gốc và bản backup migration; IndexedDB với transaction, revision chống ghi đè từ tab cũ, báo đúng lỗi lưu; một Canvas thay nội dung giữa hành tinh và vùng |
| 1 — Nặn chính xác | Cỡ/lực cọ, san lấy mẫu, làm mượt theo hàng xóm, resample nét kéo theo khoảng cách; lịch sử chung theo thứ tự thao tác ở cả hai cảnh; hủy nét tạm khi có hai pointer/cancel; cập nhật vertex hoặc tile bị ảnh hưởng |
| 2 — Vùng riêng | Zoom và lớp mây chuyển cảnh; 5 preset cùng seed; worker sinh địa hình; 128×128 ô, 16 tile; sinh cảnh cỏ/cát/đá/tuyết; dấu mốc trên cầu và ảnh bản đồ thu nhỏ; bản đồ không phụ thuộc địa hình globe |
| 3 — Thị trấn | 8 loại công trình; preview, xác nhận, xoay, di chuyển, nhân bản, xóa; màu và 3 mẫu mái cho nhóm nhà; kiểm tra dốc/ngập/chồng lấn/đường; san nền và đặt nhà trong một lệnh; đường lưới và cổng kết nối |
| 4 — Phản hồi | Điện/nước theo từng mạng đường; cư dân theo nhà đủ tiện ích; 3 nhiệm vụ tùy chọn; thí nghiệm nước dâng có undo; cây và công trình instanced, xe minh họa giới hạn; xuất PNG và JSON, nhập bản sao có kiểm tra |

Các nhánh “Sau đó” của kế hoạch (hồ nhiều cao độ, sông, cầu, nhiều vùng, cấu kiện kiến trúc tùy ý, sinh vật, thời tiết, cloud/chia sẻ) vẫn là giai đoạn phát triển tiếp theo, chưa nằm trong bản mốc 0–4.

## Cách dùng

1. Chọn học sinh → Khoa học → Xưởng Hành Tinh. Bản hành tinh cũ được nạp và chuyển sang kho mới tự động.
2. Chọn **Tạo thị trấn**, chọn loại địa hình và mã seed. Những lần sau bấm **Thị trấn** hoặc **Ghé thăm**.
3. Trong **Địa hình**, chọn công cụ và kéo để nặn. San phẳng lấy cao độ ở điểm chạm đầu; đồi/hố/núi lửa đóng một dấu mỗi lần chạm. Nền nhà được bảo vệ.
4. Trong **Xây dựng**, chọn nhà, chạm đất để đặt preview, xoay nếu cần rồi xác nhận. Ô màu vàng là cổng. Vẽ đường đến ô này để nối công trình.
5. **Chọn nhà** mở thao tác đổi màu/mái, di chuyển/xoay, nhân bản và xóa. Nền cũ còn lại khi di chuyển hoặc xóa nhà; có thể nặn lại, hoặc hoàn tác cả lệnh.
6. **Thị trấn** hiển thị tài nguyên và nhiệm vụ. Nước dâng chỉ tác động bản đồ hiện tại. Bấm Hoàn tác để đảo ngược thí nghiệm.
7. **Ảnh & bản sao** xuất ảnh PNG hoặc dữ liệu JSON. Nhập bản sao yêu cầu xác nhận thay thế và tải bản hiện tại xuống trước.

Chuột: chọn công cụ Di chuyển để xoay, chuột phải để kéo bản đồ, cuộn để zoom. Có nút +, − và về giữa. Hai ngón dùng cho điều khiển cảnh; pointer thứ hai hủy nét nặn tạm. Ctrl/Cmd Z và Ctrl/Cmd Shift Z dùng lịch sử chung. Trên màn hình hẹp, bảng công cụ nằm dưới cảnh.

## Quy tắc mô phỏng

- Một vùng rộng 64×64 đơn vị xây dựng; mỗi ô xây dựng có 2×2 ô địa hình. Cao độ được nội suy theo đúng tam giác render.
- Tối đa 200 công trình và 1.000 cây. Công trình thường cần đất khô, chênh cao trong nền không quá 0,85. Nhà sát nhau dùng cùng cao độ tại nền chung; không tự thay nền của nhà bên cạnh.
- Đường đi theo ô 4 hướng. Chỉ đường khô mới nối mạng. Mỗi công trình có một cổng quay cùng hướng công trình.
- Một trạm điện cấp 12 đơn vị. Trạm nước có điện cấp 20 đơn vị. Nguồn không truyền qua mạng đường khác. Mạng cần đủ tổng công suất; khi thiếu, các công trình trong mạng được báo thiếu, không cấp phát theo thứ tự ngẫu nhiên.
- Một nhà đủ đường, điện, nước có 4 cư dân minh họa. Xe chỉ chạy theo đường trong các mạng có nhà ở, tối đa 8 xe; không có AI cá nhân, giao thông hay kinh tế chi tiết.
- Nhiệm vụ: 5 nhà nối đường; 3 nhà đủ điện/nước; trường và công viên cùng mạng với nhà ở. Sáng tạo tự do luôn mở.

## Lưu dữ liệu thực tế

Database `planet-maker-worlds`, IndexedDB version 2; tài liệu thế giới `schema: 2`.

| Store | Nội dung |
|---|---|
| `worlds` | Khóa studentId, revision, globe chính xác bằng typed arrays, thông tin hành tinh và preview V1 cho Hệ Mặt Trời |
| `regions` | Một vùng/studentId: tên, seed, preset, marker, ảnh thu nhỏ, mực nước, công trình, cây và ô đường |
| `tiles` | Khóa [studentId, tile], 16 tile cao độ Float32 và biome Uint8; tile 32×32 ô có biên 33×33 mẫu |
| `legacy` | Chuỗi V1 gốc, được ghi cùng transaction migration; localStorage gốc không bị xóa |
| `checkpoints` | Một bản commit trước gần nhất cho mỗi hồ sơ, thay thế trong transaction kế tiếp |

Mỗi lần lưu ghi header/metadata và các tile bẩn trong một giao dịch. Revision được kiểm tra trong cùng transaction. Mỗi page có hàng đợi save tuần tự; không chụp dữ liệu giữa nét cọ tạm. Lưu trước khi chuyển cảnh/rời Xưởng; beforeunload cảnh báo khi còn thay đổi. Không dùng sự kiện unload làm bảo đảm lưu dữ liệu.

Dữ liệu hỏng được chặn trước khi ghi. Màn hình phục hồi cho xuất dữ liệu thô và khôi phục checkpoint. Quota/lỗi ghi không báo “đã lưu”; khi xung đột tab, có thể xuất bản riêng rồi tải lại. Bản xuất mang dữ liệu chính xác, được kiểm tra định dạng/giới hạn khi nhập và gắn lại với hồ sơ đang chọn.

Undo vùng dùng diff cho các mảng và snapshot metadata, ngân sách ước tính 6 MiB; globe giữ tối đa 18 snapshot. Một timeline liên kết cả hai kho để undo theo thứ tự thao tác. Lịch sử undo trong phiên không được phục hồi khi tải lại; dữ liệu hiện tại và checkpoint được lưu bền.

## Mã nguồn

- `src/pages/PlanetMakerPage.tsx`: điểm vào route; `PlanetWorkshop.tsx` điều phối giao diện, cử chỉ, lưu và chuyển cảnh; `PlanetMakerPage.css` bố cục responsive.
- `src/components/planetmaker/engine/`: địa hình vùng, brush, công trình, đường, tài nguyên, diff history, lấy mẫu nét kéo và timeline.
- `persistence/repository.ts`: schema, adapter V1, IndexedDB, revision, checkpoint và backup.
- `rendering/RegionScene.tsx`: tile mesh, instanced công trình/cây/đường và xe; `thumbnail.ts`: bản đồ thu nhỏ.
- `workers/terrainWorker.ts`: sinh vùng có request ID và chuyển buffer đầu ra riêng.
- `terrainOps.ts`, `PlanetModel.tsx`: giữ globe subdivision 5; tìm đỉnh cọ qua lưới không gian, làm mượt hàng xóm, cập nhật position/color/normal theo phần thay đổi.
- `SolarSystemPage.tsx`: đọc preview header V2; `CustomPlanetMesh.tsx`: nhãn số công trình, không dựng thành phố trong cảnh Hệ Mặt Trời.

Không tăng subdivision globe. Region renderer dùng độ phân giải cố định và dữ liệu tọa độ độc lập; chưa triển khai chuyển LOD hình học động. Instancing gom theo nhóm hình học; terrain culling theo tile. Một vùng dữ liệu nhỏ được giữ trong RAM khi đổi cảnh, geometry của cảnh bị tháo được giải phóng; texture globe dùng chung được cache có giới hạn theo bộ tài sản hiện có.

## Kiểm chứng ngày 07/09/2026

- **199 test / 8 file** toàn project qua; trong đó **33 test** mới cho Xưởng: xác định theo seed, placement, foundation, di chuyển rồi nhân bản, đường/tiện ích, ngập, undo/redo, tile seam, backup, migration lặp, hai loader đồng thời, quota rollback, stale revision, checkpoint, tách hồ sơ, resample và timeline chung.
- TypeScript `--noEmit` qua. Vite production build và PWA precache hoàn tất. Build vẫn có cảnh báo chunk lớn và import động/tĩnh ở các module cũ ngoài Xưởng.
- Trình duyệt local: mở bản V1 của hồ sơ kiểm thử; tạo vùng Đồng cỏ seed 42; xây nhà, xoay/đặt trường, chặn preview chồng lấn; undo/redo; tải lại vẫn có công trình và thumbnail; undo tên hành tinh ngay trong cảnh vùng.
- Đưa nước vùng lên 6: UI báo 2 công trình ngập. Undo đưa về khô; lưu thành công.
- 20 chu kỳ **vùng → hành tinh → vùng** trên cảnh thử 2 công trình/173 cây: trước, sau 10 và sau 20 chu kỳ cùng **22 lượt vẽ, 28 geometry, 3 texture**. Đây là bộ đếm Three của cảnh thử, không phải bằng chứng FPS ở tải tối đa hoặc phép đo RAM đầy đủ.
- Viewport 390×844: scene phía trên, bảng công cụ bên dưới, preview/xác nhận truy cập được; DOM rộng đúng 390 px và chỉ có một Canvas. Đã trả viewport về mặc định sau kiểm tra.
- Xuất thực tế: PNG hợp lệ 950×720; JSON schema 2 chứa 16.641 mẫu cao độ và đúng 2 công trình. Kiểm tra nhập dữ liệu nằm trong test engine/repository; chưa tự động thao tác hộp chọn tệp của hệ điều hành.
- Phát hiện và sửa việc kiểm tra WebGL bị đánh giá lại mỗi render; chuyển sang lazy initializer. Luồng phục hồi 3D giữ được công trình đã lưu.

Lệnh kiểm tra khi npm launcher trên máy chưa hoạt động:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000 --strictPort
```

## Cải tiến xây dựng — 07/09/2026

- Đặt, di chuyển và nhân bản dùng mô hình xem trước kéo thả, bắt theo ô lưới. Camera khóa trong lúc kéo; thả trên bảng công cụ/ngoài bản đồ, mất focus hoặc hủy pointer sẽ trả lại vị trí trước. Chỉ ghi công trình sau xác nhận; vị trí ngập, dốc, chồng lấn vẫn bị chặn.
- Mái nhọn dùng geometry mái hai dốc có kích thước chữ nhật. Toàn bộ chi tiết được dựng theo tọa độ cục bộ rồi xoay cùng thân nhà, tránh lệch mái khi đổi hướng.
- Nhà ở tối đa **6 tầng**, trường học **4 tầng**, đài thiên văn **3 tầng**. Công viên, nông trại, trạm nước, điện mặt trời và bãi đáp giữ **1 tầng**. Chỉnh được trước và sau khi xây; cửa sổ/viền tầng lặp theo tầng, nhu cầu điện nước tăng tương ứng; mỗi tầng nhà đủ tiện ích chứa 4 cư dân.
- Ba phong cách **Cổ điển / Hiện đại / Sinh thái** cho cả 8 loại: thêm cửa sổ, ban công, bồn cây, mái, biển trường, kính thiên văn, ghế/cây/đài phun, nhà kho/luống cây, tháp nước, pin và đèn bãi đáp. Preview dùng chung mẫu hình học với công trình thật.
- Cư dân đi bộ có chuyển động chân, đi trên mạng đường khô nối nhà ở. Giới hạn 48 người minh họa, gom vào 3 instanced mesh; cập nhật lộ trình khi đường/công trình/mực nước thay đổi. Công tắc chuyển động dừng cư dân và xe. Đây là chuyển động minh họa, chưa mô phỏng lịch sinh hoạt từng người.
- `floors` và `style` là trường tùy chọn trong schema 2; bản lưu cũ mặc định 1 tầng/Cổ điển. Lưu, nhập/xuất, di chuyển, nhân bản và undo/redo giữ các thuộc tính này; validator chặn giá trị vượt giới hạn.
- Mã mới: `BuildingAppearance.tsx`, `rendering/architecture.ts`, `Instances.tsx`, `BuildingPreview.tsx`, `Pedestrians.tsx`, `engine/traffic.ts`.
- Kiểm thử cập nhật: **211 test / 9 file** qua, gồm **45 test cho Xưởng**. Bổ sung kiểm tra giới hạn tầng, dữ liệu cũ, tiện ích, undo/redo, lưu và nhập/xuất nhà 6 tầng, căn mái ở 4 góc, khác biệt phong cách và đường đi cư dân.
- Trình duyệt local: kéo preview từ chồng lấn sang vị trí hợp lệ, camera giữ nguyên; thả trên bảng công cụ trả về vị trí trước; xem nhà 6 tầng Sinh thái và xoay mái; cư dân di chuyển trên đường. Chưa xác nhận cử chỉ cảm ứng trên thiết bị vật lý.
- Viewport 390×844: kéo được preview sang vị trí hợp lệ; các lựa chọn tầng/kiến trúc/mái và nút xác nhận truy cập được, không tràn ngang, một Canvas. Đã trả viewport về mặc định. TypeScript và production build qua sau các sửa tương tác cuối; console trình duyệt không có lỗi JavaScript. Cảnh báo chunk lớn của build vẫn còn.

## Phần nghiệm thu còn cần thiết bị/người dùng

Chức năng mốc 0–4 đã có, nhưng chưa chứng nhận đủ toàn bộ tiêu chí nghiệm thu trong bản nghiên cứu. Chưa đo p95 frame time/input latency 60 giây ở cảnh chuẩn 200 nhà/1.000 cây/300 đường; chưa thử tablet vật lý và pinch nhiều ngón trên màn hình cảm ứng; chưa khảo sát trẻ sử dụng. Việc 20 chu kỳ ổn định bộ đếm không thay cho phép đo RAM/GPU đầy đủ. Những mục này cần được ghi kết quả theo model máy và trình duyệt trước khi công bố hỗ trợ thiết bị hoặc đạt ngân sách FPS.
