# Làng Mầm — module độc lập

> **Hiện trạng bản thử 0.1, không phải thiết kế đích.** Tài liệu này là nội dung README kỹ thuật trước khi gom docs. Đọc [bàn giao](README.md) và [kế hoạch hiện hành](REVAMP_PLAN.md) để tiếp tục; các tính năng nâng cấp trong kế hoạch chưa được triển khai vào bản thử.

Bản thử 0.1, 17/09/2026. Đại ca yêu cầu phát triển riêng để đánh giá trước khi ghép vào Genius Kids. Module hiện là một vòng chơi nhỏ có thể dùng thật và cảnh 3D để kiểm chứng. Đây chưa phải toàn bộ nội dung của bản thiết kế dài hạn, chưa phải bộ model mỹ thuật cuối.

## Kế hoạch nâng cấp tiếp theo

[Kế hoạch nông trại 1–25](REVAMP_PLAN.md) ghi thiết kế mới theo yêu cầu Đại ca: Home làm trung tâm, công trình tối đa cấp 25, nâng cấp có thể kéo dài nhiều ngày, bản đồ ngẫu nhiên rộng với khai phá vật cản nhận tài nguyên, thao tác nhiều ô/kéo thả/xoay camera, chính tuyến, kinh tế và tiến trình dài hạn. [Bảng tiến trình dự thảo](progression-draft.json) chứa mốc Home, điều kiện nhà phụ, thời gian và giới hạn đề xuất để kiểm tra trước khi thực hiện. Đây là **tài liệu kế hoạch**, chưa thay đổi gameplay hoặc bản lưu hiện tại; các số cân bằng cần chơi thử. Khi khác với các tài liệu nghiên cứu trước, dùng hướng thiết kế mới này cho đợt nâng cấp.

Bổ sung địa hình: hồ, sông/suối, vách đá, cao nguyên, cầu qua sông và cầu cảng đánh cá. Phương án bộ sinh map kết hợp các họ địa hình đã kiểm duyệt với seed riêng, kiểm đường tiếp cận, nguồn vật liệu khai phá và vị trí đặt cảng trước khi giao map cho người chơi; chi tiết ở mục 5.4–5.6 của kế hoạch.

## Chạy riêng

Từ thư mục gốc repository:

```powershell
node node_modules/vite/bin/vite.js --config modules/farm/vite.config.ts --configLoader runner
```

Mở **http://127.0.0.1:4328/**. Cổng cố định 4328, bind loopback, không lấy cổng 3000 của ứng dụng chính. Nếu cổng đã dùng, Vite báo lỗi thay vì tự chuyển cổng. Khung kiểm tra responsive 390 × 844: **http://127.0.0.1:4328/mobile-preview.html**. Đây là iframe phục vụ kiểm tra CSS, không giả lập GPU hoặc cảm ứng của điện thoại thật.

Tận dụng thư viện đang cài trong `node_modules` của repository; không cài/gỡ hoặc sửa phiên bản thư viện của hệ thống. Vite dùng config riêng, không nạp cấu hình/PWA/biến môi trường của ứng dụng chính. `--configLoader runner` tránh tạo config tạm trong thư mục dependency dùng chung. Package con cung cấp thêm các lệnh `dev`, `build`, `typecheck`, `test` nếu dùng npm từ thư mục này.

```powershell
node node_modules/typescript/bin/tsc -p modules/farm/tsconfig.json
node node_modules/vitest/vitest.mjs run --config modules/farm/vitest.config.ts --configLoader runner
node node_modules/vite/bin/vite.js build --config modules/farm/vite.config.ts --configLoader runner
```

Build xuất vào `modules/farm/.build`, cache ở `.vite-cache`, được ignore bằng file riêng của module. Không ghi vào `dist` hoặc `public` của dự án chính. Chưa có PWA của module; tiến trình khi đóng tab được tính khi mở lại, nhưng khởi động trang khi không có máy chủ phục vụ là công việc riêng cần làm sau.

## Ranh giới độc lập

- Không thêm route, menu/card game, import hoặc provider vào hệ thống hiện tại.
- Không đọc/ghi hồ sơ học sinh, sao học tập, tài khoản hoặc database đang dùng.
- Không import mã từ `src`, `services`, `games` hay `public` của ứng dụng chính.
- Không kết nối Supabase, không gọi API, không telemetry; không đăng ký service worker.
- Dữ liệu dùng IndexedDB riêng **`lang-mam-independent-lab-v1`**, object store `snapshots`; origin ở cổng 4328 cũng tách với cổng 3000.
- Font Nunito được chép riêng cùng giấy phép OFL vào `assets/fonts`. Model được tạo trong `src/render/models.ts`, không phụ thuộc tải tài nguyên từ xa.
- Test dùng `.check.ts` và config riêng, không được Vitest mặc định của dự án chính tự tìm theo mẫu `*.test.*`/`*.spec.*`. Root TypeScript có thể vẫn quét mã nguồn con do `include` rộng; mã trong module phải giữ typecheck hợp lệ.

## Có thể thử ngay

1. Thu hoạch quà đầu vườn; gieo, tưới một lần mỗi vụ, chờ cây lớn, thu và bán cho cửa hàng NPC.
2. Bốn cây: lúa mì, cà rốt, ngô, bí đỏ, mỗi cây có năm trạng thái nhìn thấy được. Ngô/bí mở ở cấp 2/3; cây quà ban đầu có thể thu trước khi mở giống.
3. Cối xay, lò bánh và chuồng bò; chuỗi lúa mì → bột → bánh, ngô → sữa, bột + bí + sữa → bánh bí đỏ. Nguyên liệu trừ khi bắt đầu, thành phẩm chỉ nhận một lần. Vật nuôi có chuyển động nghỉ/ăn đơn giản.
4. Công trình có ba cấp ngoại hình, nâng cấp giảm thời gian mẻ mới và lò cấp 2 mở bánh bí đỏ. Mẻ đang chạy giữ nguyên hạn hoàn thành.
5. Mua tám loại decor; chọn vị trí bằng chạm đất hoặc mũi tên, xoay 90°, xem ô chiếm chỗ, xác nhận rồi mới trừ tiền. Chuyển công trình đang sản xuất không làm mất mẻ hàng. Đặt đè lên cây/nhà hoặc ngoài đất bị từ chối.
6. Thêm luống, hai lần mở đất, XP và cấp, sáu mục tiêu có thưởng một lần, chuỗi đơn NPC, bảng tổng kết thành tích.
7. Tự lưu sau mỗi giao dịch; checkpoint thời gian; cộng tiến trình hữu hạn khi quay lại, cây/hàng chín không mất. Có xuất/nhập bản sao JSON và xác nhận trước khi thay thế.
8. Nút **Mẫu 3D** mở xưởng mẫu: đổi loại nhà/cấp và cây/giai đoạn, xoay camera để xem model. Mọi thao tác ở xưởng không sửa tiến trình game.

Nhịp 35–120 giây/vụ phục vụ thử nhanh, chưa cân bằng kinh tế dài hạn. Một công trình xử lý một mẻ tại một thời điểm; chưa có hàng chờ nhiều mẻ. Camera chơi cố định góc nhìn, có pan/zoom; di chuyển đồ theo chọn vị trí và xác nhận, chưa kéo thả trực tiếp. Chưa có undo vị trí, cất decor, âm thanh, mini game, NPC có hình/animation, đủ 12 loại cây hoặc toàn bộ danh mục công trình trong thiết kế dài hạn.

## Cấu trúc và điểm nối sau này

```text
modules/farm/
  index.html, mobile-preview.html  trang thử riêng
  vite.config.ts, tsconfig.json   cấu hình riêng
  assets/fonts/                  font cục bộ và giấy phép
  src/core/catalog.ts            cây, hàng hóa, công thức, công trình, mục tiêu
  src/core/types.ts              trạng thái, lệnh và hợp đồng adapter
  src/core/engine.ts             kiểm tra + áp dụng một giao dịch thuần
  src/core/validation.ts         kiểm tra bản lưu và định dạng bản sao
  src/adapters/local.ts          lưu nguyên tử, revision, thời gian và phiên chơi
  src/render/models.ts          model, vật liệu, bộ phận chuyển động và cache
  src/render/FarmScene.tsx       cảnh chơi, lựa chọn vị trí, xưởng mẫu
  src/ui/useFarm.ts              vòng đời phiên và phản hồi thao tác
  src/FarmApp.tsx, farm.css      giao diện riêng
  src/index.ts                  API để tích hợp khi được yêu cầu
  tests/*.check.ts               luật, tiền/kho, persistence, hợp đồng model
```

`execute(state, command)` không biết React, trình duyệt, đăng nhập hoặc mạng. UI gửi `FarmCommand` qua `FarmSession.execute`; có thể truyền `openSession` cho `FarmApp` để thay adapter mà không viết lại các bảng thao tác. `FarmRepository` phục vụ lưu local; giao dịch IndexedDB so revision hiện tại với revision kỳ vọng, đồng thời giữ bản trước trong `previous`. Lỗi ghi không được áp dụng vào trạng thái đang chơi. Hai cửa sổ cùng sửa sẽ yêu cầu tải lại, không tự hợp nhất kho/tiền. Một giao dịch lỗi không tiêu bất kỳ tài nguyên nào.

Bản lưu sai schema, ID, số lượng, thời gian hoặc tọa độ bị từ chối, không tự tạo vườn trắng thay thế. Bản `previous` là bản ghi gần nhất trước lần lưu, chưa có giao diện duyệt lịch sử/phục hồi bản bị hỏng. Xuất JSON là đường sao lưu do người chơi chủ động sử dụng.

## Login/server làm sau có trở ngại gì?

Không cản trở việc hoàn thiện gameplay, nội dung và mỹ thuật. Khi thực hiện online, cần một đợt công việc riêng:

1. **Danh tính:** adapter Auth và ánh xạ account/profile → farm; ID hồ sơ cục bộ không được coi là danh tính xác thực.
2. **Tiền/hàng:** xây server gateway nhận lệnh, kiểm tra quyền, giá/công thức, thời gian, revision và khóa giao dịch. Không dùng adapter gửi toàn bộ snapshot client để ghi đè tiền/kho trên server.
3. **Giao dịch:** vẫn chỉ online theo yêu cầu Đại ca; cần giữ hàng rao bán, mua/đổi nguyên tử, mã lệnh chống lặp và hoàn tiền/hàng. Không có hàng đợi chợ offline.
4. **Thăm vườn:** công bố bản cảnh được phép xem, chỉ chứa loại model, vị trí, cấp/trạng thái và decor. Không công bố bản lưu riêng hoặc thông tin học tập.
5. **Chuyển thiết bị/offline:** mốc giờ server, quyền ghi/phiên thiết bị, revision và cách tiếp nhận hành động offline. Phần local hiện tại giải quyết việc lưu trên một trình duyệt, không tự giải quyết toàn bộ đồng bộ nhiều thiết bị.
6. **Chuyển dữ liệu thử lên online:** cần chốt chính sách nhập trước khi phát hành. Hiện `economy: local-unverified` là nhãn mô tả, không phải biện pháp chống gian lận. Người dùng có thể sửa bản local; không tự đưa số xu/hàng này vào nền kinh tế giao dịch. Không tự xóa hoặc đặt lại tiến trình khi liên kết tài khoản.

Những việc này được hoãn, không giả lập đăng nhập hoặc hứa chợ đã sẵn sàng. Bộ schema online cụ thể và cơ chế duyệt hành động offline sẽ được thiết kế/kiểm thử trước khi bật tài khoản và giao dịch.

## Trước khi ghép hệ thống

Đại ca xem bản riêng và chất lượng model trước. Sau đó hoàn thiện nội dung/mini game/âm thanh, bộ asset chính thức, đo hiệu năng trên thiết bị thật, thử phiên dài và phục hồi dữ liệu. Chỉ tích hợp router/menu/hồ sơ khi có yêu cầu tiếp theo. Bản module hiện không thay đổi cách chạy hoặc phát hành ứng dụng chính.
