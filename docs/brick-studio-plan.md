# Xưởng Lắp Ghép 3D — đánh giá khả thi và kế hoạch triển khai

> Lập 14/10/2026. Đã thi công GĐ0a–4 (chưa nghiệm thu v1); trạng thái hiện tại xem `docs/brick-studio/CHECKPOINT.md`. Các quyết định ở mục 2 **đã chốt ngày 14/10/2026**. Không tự đổi.
> Bốn yêu cầu gốc của chủ dự án: **(1) nhiều loại mảnh, (2) chi tiết tinh xảo và đẹp, (3) ghép nối trực quan, (4) điều khiển dễ dàng.** Mọi quyết định bên dưới phục vụ bốn yêu cầu này.
> Số hiệu năng ở mục 9 là **ước tính**, phải đo lại ở GĐ1 trên máy dev và trên tablet của nhà. Giấy phép ở mục 4.3 đã tra cứu ngày 14/10/2026 và phải đọc lại văn bản gốc trước GĐ0.

## 0. Cách dùng plan này

1. Mỗi phiên làm **một mục GĐx** ở mục 14. Đọc mục 17 "Bẫy" trước khi sửa code.
2. Không tự đổi các quyết định ở mục 2. Gặp chỗ plan chưa nói thì chọn phương án đơn giản hơn và ghi vào mục 20 "Nhật ký lệch plan".
3. Plan có **ba cổng duyệt**. Chưa qua cổng thì không làm bước sau:
   - **Cổng mảnh** (sau GĐ0a): duyệt bảng ảnh toàn bộ mảnh.
   - **Cổng hình ảnh** (giữa GĐ1): duyệt độ đẹp của cảnh 3D.
   - **Cổng chơi thử** (cuối GĐ1): chủ dự án tự thử thao tác theo kịch bản soạn sẵn (D9).
4. Xong mỗi GĐ, chạy lệnh nghiệm thu của GĐ đó. Lệnh nào cũng phải xanh mới được commit.
5. Commit tiếng Việt theo lối repo, ví dụ `Lắp Ghép GĐ0b: điểm nối, va chạm, tìm vị trí đặt`.

## 1. Kết luận khả thi

**Khả thi, mức khó: khó.** Tương đương làm lại Cờ Vua có bot. Bản v1 ước khoảng 17 phiên cùng 3 cổng duyệt (mục 15). Có hai điểm then chốt quyết định khả thi.

**Điểm then chốt 1: không tự vẽ mảnh, dùng thư viện LDraw.** LDraw là thư viện mở của cộng đồng, có hàng nghìn mảnh được đo theo mảnh thật, gồm cả ống dưới đáy, núm rỗng, khe, hoa văn in. Tự dựng hình bằng code chỉ làm nổi vài chục mảnh vuông vức. Dùng LDraw thì có hàng trăm mảnh tinh xảo ngay, và tên, mã của mảnh khớp sẵn với BrickLink và Rebrickable.

Cách dùng: một script chạy **lúc build** đọc thư viện LDraw, đổi mỗi mảnh sang một file hình học nhị phân gọn. Script cũng trích điểm nối (núm, lỗ, chốt) và hộp va chạm. App chạy offline, không tải gì lúc chạy.

**Điểm then chốt 2: ghép bằng điểm nối, không ghép bằng ô lưới.**
- Mỗi mảnh có danh sách **điểm nối**: núm (đực), lỗ nhận núm (cái), chốt, lỗ chốt, kèm vị trí và hướng.
- Hai mảnh nối nhau khi một điểm nối đực trùng một điểm nối cái.
- Toạ độ là **số nguyên LDU** (1 LDU = 0,4 mm). Hướng của mảnh là **một trong 24 phép xoay vuông góc**.

Hệ này bao trùm lưới thông thường như một trường hợp riêng. Nó còn xử lý được:
- mảnh có núm ở cạnh (SNOT, ke góc);
- tấm nhảy nửa núm (jumper);
- bánh xe cắm chốt.

Va chạm vẫn là phép so hộp vuông góc với số nguyên: chính xác và nhanh.

### 1.1 Bốn yêu cầu → cách đáp ứng

| Yêu cầu | v1 làm gì |
|---|---|
| **Nhiều loại mảnh** | Khoảng 250–300 mảnh trong 12 nhóm, chọn theo độ phổ biến trong bộ thật (dữ liệu Rebrickable). Có mảnh gắn cạnh, tấm nhảy, bánh xe, cửa, cây hoa, khoảng 30 mảnh in hoa văn (mắt, mặt cười, đồng hồ…). 18 màu thường cùng màu trong suốt, ngọc trai và kim loại. Thêm mảnh mới bằng một dòng trong danh sách rồi chạy lại script |
| **Tinh xảo, đẹp** | Hình học LDraw: ống đáy, núm rỗng, khe lưới, viền mái. Nhựa bóng (PBR + clearcoat), bóng che tại chỗ (AO) ở khe giữa các mảnh, bóng đổ mềm, ánh sáng phòng chụp. Có nét viền kiểu sách hướng dẫn (bật/tắt). Máy yếu thì tự hạ chất lượng khi đang xoay, dừng tay thì vẽ lại bản đẹp |
| **Ghép trực quan** | Bóng mờ xem trước hút vào điểm nối gần nhất. Núm sắp gắn sáng lên. Có đường rơi và bóng đổ để đoán độ sâu. Mảnh tự xoay đúng hướng theo mặt được chạm, kể cả mặt bên có núm. Nút **↻ chỉ lướt qua các hướng lắp được tại chỗ đó** |
| **Điều khiển dễ** | Một ngón xoay, hai ngón phóng. Chạm để xem trước, chạm lần nữa để lắp, hoặc kéo thả từ khay. Một máy trạng thái duy nhất nhận mọi chạm, nên không bao giờ "vừa kéo mảnh vừa xoay camera". Khay xếp theo nhóm có biểu tượng, có hàng "Vừa dùng". Có chế độ bé cho mẫu giáo |

### 1.2 Rủi ro và cách xử lý

| Rủi ro | Mức | Cách xử lý |
|---|---|---|
| Bé không đặt được mảnh đúng chỗ: ngón tay che mảnh, khó đoán độ sâu | **Cao** | Mục 7: bóng mờ, nam châm điểm nối, đường rơi, nhìn xuyên, chạm hai bước, lệch ngón. Có **cổng chơi thử** |
| Dữ liệu điểm nối sai hoặc thiếu với một số mảnh LDraw | **Cao** | Lấy từ ba nguồn: tham chiếu primitive núm, dữ liệu LDCad, bảng sửa tay. Có test tự động: mọi mảnh phải gắn được lên và xuống một gạch 2×4. Có cổng mảnh |
| Chậm khi mô hình lớn có nhiều chi tiết | TB–Cao | InstancedMesh, núm tách riêng và ẩn núm bị che, 3 mức chất lượng tự chọn, vẽ lại bản đẹp khi dừng tay, bản "vỏ" bỏ chi tiết đáy (mục 8, 9) |
| Dung lượng tải về | TB | Hình học nhị phân lượng tử hoá, tải theo nhóm khi mở nhóm lần đầu, ước khoảng 2–3 MB cho v1 (mục 9) |
| Mô hình trong app không lắp được ngoài đời | TB | Luật điểm nối bảo đảm lắp được, trừ độ chắc. Cảnh báo mảnh lơ lửng. Cảnh báo tổ hợp mảnh–màu không có thật |
| Mã mảnh hoặc màu sai, phụ huynh mua nhầm | TB | Mã lấy từ LDraw và Rebrickable, có test. File `.ldr` xuất ra mở bằng BrickLink Studio để đối chiếu |
| Giấy phép | TB | LDraw yêu cầu ghi công. Dữ liệu LDCad yêu cầu chia sẻ tương tự (share-alike) cho file điểm nối. Loại mảnh in hình nhân vật có bản quyền (mục 4.3) |
| Thương hiệu | Thấp | Không dùng chữ "LEGO". Không dùng primitive núm có logo. Không lấy mảnh in logo |

### 1.3 Chưa làm ở v1 (đã dự trù chỗ trong kiến trúc)

- **Khớp quay:** bản lề, bàn xoay, kẹp–thanh, tay cầm. Cần góc tự do nên làm ở GĐ7.
- **Technic:** trục, chốt nối dầm, bánh răng. Làm ở GĐ8 hoặc không làm.
- **Không làm:** minifig, mảnh dẻo hay dây, mô phỏng vật lý.

## 2. Quyết định (đã chốt 14/10/2026)

Chủ dự án trả lời 14/10/2026:
- **Tên:** "Xưởng Lắp Ghép".
- **Thiết bị:** iPad, tablet Android và laptop/PC. Không nhắm điện thoại.
- **Mua gạch thật:** chưa định, có thể không mua.
- **Khớp quay:** làm sau v1.
- **Lắp tự do:** không có sao.
- **Màu:** cho dùng mọi màu.
- **10 mô hình mẫu:** Claude dựng, chủ dự án duyệt.
- **Chơi thử:** chủ dự án tự thử, không có buổi cho các bé thử.
- **Giấy phép (D4):** đồng ý, miễn không mất tiền.

Các dòng D1–D13 bên dưới đã được sửa theo những câu trả lời này.

| # | Đề xuất | Lý do |
|---|---|---|
| D1 | **Module riêng "Xưởng Lắp Ghép"** (`/bricks`, `ModeId 'bricks'`, `src/bricks/`), ở sảnh của mọi lớp, kể cả Mầm non (chế độ bé). Nhãn `LẮP GHÉP & SÁNG TẠO`. Không dùng chữ LEGO ở bất cứ đâu. | Sáng tạo hợp mọi lứa tuổi. Tránh rủi ro thương hiệu. |
| D2 | **Hình học mảnh lấy từ thư viện LDraw**, đổi sang nhị phân lúc build bằng `scripts/bricks-parts.mjs`. Không tải LDraw lúc chạy. Có trang Ghi công liệt kê tác giả và giấy phép. | Cách duy nhất để vừa nhiều mảnh vừa tinh xảo mà khối lượng công việc vẫn trong tầm. |
| D3 | **Hệ điểm nối:** toạ độ nguyên theo LDU, 24 hướng vuông góc. v1 có hai kiểu nối: núm–lỗ (theo mọi hướng) và chốt–lỗ chốt (bánh xe). | Mở được mảnh gắn cạnh, tấm nhảy, bánh xe ngay ở v1. Khớp quay ở v2 chỉ cần thêm kiểu nối, không phải viết lại lõi. |
| D4 | **Dữ liệu điểm nối:** chính là tham chiếu primitive núm trong file LDraw, bổ sung bằng **thư viện shadow của LDCad (CC BY-SA 4.0)** cho lỗ nhận và chốt, cùng bảng sửa tay. File `connectors.json` sinh ra cũng theo CC BY-SA 4.0. | LDCad đã gắn nhãn điểm nối cho hàng nghìn mảnh. Tự suy luận toàn bộ sẽ sai nhiều. **Đã chốt 14/10:** chủ dự án đồng ý với điều kiện ghi công và share-alike. |
| D5 | **Bộ mảnh v1 khoảng 250–300 loại**, chọn theo độ phổ biến trong bộ thật. Chỉ lấy mảnh dùng được với kiểu nối của v1. Bỏ mảnh in hình nhân vật có bản quyền và mảnh in logo (mục 6). | Đa dạng thật nhưng còn duyệt được bằng mắt. |
| D6 | **Màu:** 18 màu thường, 6 màu trong suốt, 3 màu ngọc trai hoặc kim loại. Cho phép mọi tổ hợp mảnh–màu. Danh sách mua đánh dấu ⚠ tổ hợp không có thật và gợi ý màu thay. | Sáng tạo trước, thực tế sau. Gạch tương thích bán ở Việt Nam có bảng màu riêng. |
| D7 | **Tương tác:** một ngón kéo = xoay camera. Hai ngón = thu phóng và dời. Chạm = bóng mờ xem trước. Chạm lần nữa hoặc ✓ = lắp. Kéo từ khay rồi thả = lắp. Kéo bóng mờ = dời. ↻ = hướng lắp được tiếp theo. Có công tắc "Lắp nhanh". Dùng chuột thì di chuột hiện bóng, bấm là lắp. | Đúng hai cách chủ dự án yêu cầu: "chạm vào điểm" và "kéo vào vị trí". Chạm hai bước để bé nhỏ không đặt nhầm. |
| D8 | **Đẹp là yêu cầu bắt buộc.** Có 3 mức chất lượng tự chọn theo máy. Cảnh dừng thì luôn vẽ bản đẹp nhất. Có **cổng hình ảnh**: chủ dự án duyệt ảnh chụp cảnh mẫu trước khi làm giao diện. | Chủ dự án yêu cầu độ tinh xảo. Rủi ro "đẹp trên máy dev, xấu trên tablet" phải lộ ra sớm. |
| D9 | **Cổng chơi thử sau GĐ1: chủ dự án tự thử** theo kịch bản Claude soạn sẵn, trên iPad, tablet Android và laptop. Chủ dự án chốt sơ đồ cử chỉ rồi mới làm GĐ2. Vì không có bé nào thử trước, có ba cách bù: (1) chế độ bé chọn mặc định an toàn: chạm hai bước, nam châm rộng, Lắp nhanh tắt; (2) từ GĐ3 có **số liệu dùng thật** chỉ lưu trên máy (mục 12.1); (3) sau 1–2 tuần các bé dùng thật thì có một phiên chỉnh thông số. | Rủi ro lớn nhất là bé thấy khó dùng. Người lớn thử không phát hiện hết chỗ khó với bé mẫu giáo, nên phải đo khi bé dùng thật. |
| D10 | **Lưu IndexedDB `brick-studio-v1`, đồng bộ Google ngay từ v1** qua sidecar snapshot. Hồ sơ chỉ giữ thống kê nhẹ `profile.bricks`. | Chủ dự án yêu cầu đồng bộ. Mô hình rất nhỏ. |
| D11 | **Tài liệu lắp ghép v1:** bìa, 6 góc nhìn, kích thước thật, danh sách mảnh và **các bước lắp**. Xuất PDF và PNG.<br>Danh sách mảnh ưu tiên thông tin trẻ đọc được: ảnh mảnh to, kích thước, tên màu. Mã mảnh chỉ in nhỏ.<br>Trang Cách mua viết ngắn. File cho người lớn (BrickLink XML, Rebrickable CSV, LDraw `.ldr`) nằm trong mục "Cho người lớn", ưu tiên thấp. File `.ldr` vẫn phải có, vì dùng để kiểm tra dữ liệu.<br>Làm sau ở GĐ5: lắp theo hướng dẫn ngay trong app, tối ưu góc chụp từng bước. | Chủ dự án chốt 14/10: chưa chắc sẽ mua gạch. Tài liệu vẫn có ích khi các bé lắp lại bằng gạch sẵn có ở nhà, hoặc lắp lại mô hình của nhau trong app. Chỉ có danh sách mảnh và ảnh tổng thể thì không biết phần bên trong lắp trước hay sau, nên các bước lắp vẫn ở v1. |
| D12 | **Lắp tự do không có sao**, chỉ có huy hiệu. Sao chỉ cho "Lắp theo hướng dẫn" và thử thách, một lần mỗi mẫu. | Giống Tô Màu: không biến sáng tạo thành bài kiểm tra. |
| D13 | **Thiết bị đích:** iPad (Safari), tablet Android (Chrome), laptop/PC (chuột và phím). Ưu tiên **tablet ngang 1180×820**, chạy tốt ở 820×1180 và 1440×900. **Điện thoại không phải mục tiêu**: chỉ cần mở được và không vỡ giao diện, không kiểm thử thêm. Giao diện dùng `HubShell` và token `--hub-*`. | Chủ dự án chốt 14/10. Bẫy riêng của iPad (giới hạn bộ nhớ GPU và số WebGL context) phải đo thật ở GĐ1. |

## 3. Hiện trạng có thể dùng lại (đã kiểm trong code 14/10/2026)

**Thư viện có sẵn trong `package.json`:**
- `three` 0.181, `@react-three/fiber` 9, `drei` 10, `@react-three/postprocessing` 3 (có hiệu ứng N8AO cho bóng che tại chỗ), `camera-controls` 3.
- Chưa có thư viện PDF.

**Code tham khảo:**
- Ba game cờ 3D (`games/HorseRace`, `OAnQuan`, `PropertyTown`) dựng hình bằng code.
- `games/HorseRace/boardGesture.ts` tách "chạm" khỏi "xoay hoặc chụm" (ngưỡng 6 px, huỷ khi có ngón thứ hai). Mở rộng thành máy trạng thái ở mục 7.3.
- `games/shared/BoardCamera.tsx` dùng `OrbitControls`. Xưởng nên dùng `camera-controls`: có `setLookAt(..., true)` chuyển cảnh mượt và `fitToBox`.
- `src/coloring/progress/artworkRepo.ts` là mẫu repo IndexedDB. Có `revision` chống ghi đè giữa các tab, giới hạn số lượng, và ảnh thu nhỏ đến muộn không đè bản mới.

**Chỗ cần thêm:**
- `services/account/snapshot.ts` → `databaseSpecs()`: thêm một dòng cho DB của xưởng. Theo mẫu `planet-maker-worlds` và `electricity-notebook-v1`.
- `src/components/hub/catalog.ts`: thêm `'bricks'` vào `ModeId`, `modes` và danh sách Mầm non của `modesFor`.

**Ghi chú khác:**
- `src/coloring/preview.tsx` và `coloring-preview.html` là mẫu trang dev.
- Xưởng Tô Màu chưa đồng bộ tranh lên cloud (mục 14 plan Tô Màu). Adapter làm ở đây dùng lại được cho Tô Màu.

## 4. Nguồn mảnh: dây chuyền LDraw → app

### 4.1 Đầu vào (để ở `tools/ldraw/`, có trong gitignore, không vào bản build)

- Thư viện LDraw chính thức (`complete.zip` từ ldraw.org). Ghi số bản phát hành vào `parts.generated.json`.
- Thư viện shadow của LDCad (GitHub `RolandMelkert/LDCadShadowLibrary`), nếu D4 được chốt.
- Dữ liệu Rebrickable:
  - Bảng tải về: `parts`, `part_categories`, `colors`, `elements`, `inventory_parts`. Dùng để xếp hạng độ phổ biến và kiểm tra màu có thật.
  - API: lấy mã ngoài (BrickLink, LEGO, LDraw) của mảnh và màu. API cần khoá miễn phí. **Chủ dự án tự tạo khoá và đặt vào `.env.local` là `REBRICKABLE_KEY`.** Khoá chỉ dùng cho script, không bao giờ vào frontend.
  - Khoá là **tuỳ chọn**. Xếp hạng độ phổ biến và kiểm tra màu có thật chỉ cần các bảng tải về. Thiếu khoá thì PDF ghi mã LDraw (thường trùng mã khuôn) thay cho mã BrickLink, và bỏ file BrickLink XML.
- `docs/brick-studio/parts-v1.csv`: danh sách mảnh đã tuyển. Cột gồm `ldraw`, `key`, `nhóm`, `nhóm con`, `tên Việt`, `ghi chú`. Đây là nguồn sự thật duy nhất của bộ mảnh. Thêm mảnh = thêm dòng.

### 4.2 Script `scripts/bricks-parts.mjs` (chạy trên Node, có `--check`)

1. **Đọc và làm phẳng file LDraw:** đệ quy subfile, nhân ma trận, áp BFC (chiều mặt), gom tam giác và tứ giác. Giữ lại màu cố định của phần in. Màu 16 nghĩa là "màu chính của mảnh".
2. **Tách núm:** mỗi tham chiếu tới primitive núm (`stud.dat`, `stud2.dat`…) **không đưa vào lưới**. Thay vào đó ghi lại thành điểm nối đực, kèm kiểu núm (đặc hoặc rỗng) và ma trận đầy đủ. Núm sẽ vẽ bằng instancing chung (mục 8.2). Núm ở mặt bên cũng được bắt tự động theo cách này.
3. **Pháp tuyến mượt:** làm mượt theo đường điều kiện (type 5 line) của LDraw, tách cạnh theo đường cạnh (type 2). Đây là cách LDView và three.js LDrawLoader làm.
4. **Đường viền:** giữ đường cạnh và đường điều kiện vào một buffer riêng, dùng cho chế độ "Nét viền" và ảnh hướng dẫn.
5. **Điểm nối cái và chốt:** đọc từ shadow LDCad (`SNAP_CYL` có giới tính và bán kính). Nếu mảnh không có dữ liệu thì suy luận: đáy hở theo khung → lỗ nhận ở mọi vị trí núm của khung. Mảnh nào suy luận không chắc thì vào danh sách `needs-review`.
6. **Hộp va chạm tự động:**
   - Voxel hoá lưới tam giác ở độ phân giải 2 LDU.
   - Co vào 1 voxel làm dung sai, để hai mặt chỉ chạm nhau thì không tính là va.
   - Gộp tham lam thành tối đa 16 hộp vuông góc.
   - Kiểm tra bằng mắt trên bảng duyệt.
7. **LOD "vỏ":** bỏ các primitive ở mặt dưới (ống đáy, vách trong). Dùng khi máy yếu, hoặc khi đáy mảnh bị mảnh khác che.
8. **Nén:**
   - Toạ độ lượng tử hoá `Int16` theo LDU×4. Pháp tuyến mã hoá octahedral 2 byte.
   - Chỉ số `Uint16` hoặc `Uint32`.
   - Mỗi nhóm mảnh gói thành một file `public/bricks/parts/<nhóm>.bin`. Đuôi `.bin` đã có trong `globPatterns` (bẫy Tô Màu).
9. **Đầu ra:**
   - `src/bricks/catalog/parts.generated.json`: key, mã LDraw, mã BrickLink, mã LEGO, tên gốc, tên Việt, nhóm, hộp bao, điểm nối, hộp va chạm, số tam giác, tác giả, giấy phép.
   - `colors.generated.json`.
   - `availability.generated.json`.
   - `credits.generated.json`.
10. **Bảng duyệt (cổng mảnh):** `docs/brick-studio/sheets/<nhóm>.png`. Mỗi mảnh vẽ ở 2 góc (trên và dưới), có hộp va chạm vẽ đè và các điểm nối tô màu (đực xanh, cái cam, chốt tím).

### 4.3 Giấy phép (tra cứu 14/10/2026, phải đọc lại văn bản gốc trước GĐ0)

- **Thư viện LDraw:** phần lớn mảnh theo CC BY 4.0, một phần mảnh cũ theo CC BY 2.0, có mảnh theo CC0. Cả hai bản CC BY đều chỉ yêu cầu **ghi công**. Script ghi `!LICENSE` và tác giả của từng mảnh vào `credits.generated.json`. App có trang **Ghi công**.
- **Shadow LDCad:** CC BY-SA 4.0 theo bài đăng của tác giả. Chỉ file dữ liệu điểm nối suy ra (`connectors` trong `parts.generated.json`) chịu điều kiện share-alike. Đọc `LICENSE.md` của repo trước khi dùng.
- **Rebrickable:** chỉ dùng lúc build để xếp hạng và tra mã. Đọc điều khoản dữ liệu, ghi nguồn ở trang Ghi công.
- **Không lấy:**
  - Primitive núm có logo (`stud-logo*`).
  - Mảnh in logo thương hiệu.
  - Mảnh in hình nhân vật có bản quyền (Star Wars, Disney, Marvel, Ninjago…). Lọc theo danh mục và từ khoá ở bước tuyển chọn, rồi duyệt bằng mắt.

## 5. Hệ ghép nối

### 5.1 Toạ độ và hướng

| Đại lượng | Thực tế | LDU | 3D (three.js) |
|---|---|---|---|
| Bước núm | 8,0 mm | 20 | 1,0 |
| Tấm | 3,2 mm | 8 | 0,4 |
| Gạch = 3 tấm | 9,6 mm | 24 | 1,2 |

**Toạ độ:**
- Engine và dữ liệu dùng **đúng quy ước LDraw**: số nguyên LDU, trục Y hướng xuống.
- Renderer đổi sang three.js bằng **phép quay 180° quanh trục X** (`(x, y, z) → (x, −y, −z)`) rồi nhân 1/20. Đây là phép quay, không phải phép soi gương. Toàn bộ việc đổi trục nằm trong `engine/space.ts`.
- Vùng xây: `x, z ∈ [−640, 640)` (64×64 núm ≈ 51 cm). Chiều cao tối đa 1.536 LDU (≈ 61 cm).

**Hướng:**
- `o ∈ [0, 24)`: chỉ số vào bảng 24 ma trận xoay vuông góc (nhóm xoay của khối lập phương). Ma trận toàn số nguyên −1, 0, 1, nên mọi phép tính đều chính xác.

### 5.2 Định nghĩa mảnh (sinh ra, không viết tay)

```ts
type V3 = [number, number, number];             // LDU, toạ độ cục bộ của mảnh
interface Connector { kind: 'stud' | 'antistud' | 'pin' | 'pinhole'; pos: V3; axis: 0 | 1 | 2 | 3 | 4 | 5; hollow?: boolean }
                                                 // axis: ±X, ±Y, ±Z, hướng cắm vào
interface PartDef {
  key: string;            // khoá ổn định, KHÔNG BAO GIỜ đổi hay tái dùng
  ldraw: string; bricklink: string; lego?: string;
  nameVi: string; group: GroupId; sub: string;
  bbox: [V3, V3];
  boxes: [V3, V3][];      // hộp va chạm (min, max), ≤ 16
  conns: Connector[];
  orients: number[];      // các hướng khác nhau thật sự (mảnh đối xứng có ít hơn 24)
  tris: number; trisShell: number;
  bom?: { part: string; qty: number; color: 'self' | string }[];  // mảnh dạng bộ
}
```

### 5.3 Luật nối

Một vị trí đặt **hợp lệ** khi thoả cả hai điều kiện:

1. Mọi hộp va chạm của mảnh nằm trong vùng xây và **không giao có thể tích** với hộp của mảnh khác.
2. Có **ít nhất một cặp điểm nối khớp**: một bên đực, một bên cái, **cùng vị trí và cùng trục cắm**. Các cặp khớp là `stud↔antistud` và `pin↔pinhole`.

Mặt bàn là tấm nền ảo: có `stud` hướng lên ở mọi vị trí `x, z` chia hết cho 20, tại `y = 0`.

**Cài đặt:**
- **Bảng băm điểm nối tự do:** khoá là `(kiểu, x, y, z, trục)` → mảnh. Kiểm tra một cặp khớp là O(1). Núm đã bị cắm thì không vẽ, nhờ vậy ẩn được núm bị che.
- **Bảng băm không gian:** ô 40×48×40 LDU → danh sách mảnh có hộp chạm ô đó. Dùng cho va chạm và chọn điểm.

**Mảnh lơ lửng:** Sau mỗi lần tháo, duyệt đồ thị kết nối từ mặt bàn. Mảnh nào không còn đường nối về bàn thì có viền đỏ nhấp nháy, và thanh trên hiện "3 mảnh chưa được gắn". App không tự xoá. Khi xuất tài liệu thì cảnh báo nhưng vẫn cho xuất.

**Hệ quả:** Mọi mô hình hợp lệ đều lắp được ngoài đời. App không bảo đảm độ chắc. Ví dụ một tháp chỉ nối bằng một núm vẫn hợp lệ.

## 6. Bộ mảnh v1

### 6.1 Cách tuyển (GĐ0a, ra file `parts-v1.csv`)

1. Xếp hạng mảnh theo số bộ thật có chứa mảnh đó (`inventory_parts` của Rebrickable).
2. Lọc chỉ giữ mảnh có **toàn bộ** điểm nối thuộc kiểu của v1. Mảnh nào có kẹp, thanh hay bản lề thì để dành cho GĐ7.
3. Lấy những mảnh đứng đầu mỗi nhóm theo hạn mức ở bảng dưới, rồi thêm tay những mảnh làm "đẹp" mô hình của trẻ (mắt, hoa, cửa sổ).
4. Bỏ mảnh in bản quyền hoặc logo, minifig và phụ kiện minifig.
5. Đặt tên Việt ngắn, nói được bằng giọng đọc. Ví dụ: "Gạch 2×4", "Mái dốc 2×2", "Tấm nhảy 1×2", "Gạch núm cạnh 1×1".

### 6.2 Mười hai nhóm (hạn mức ước tính)

| Nhóm | ~Số mảnh | Ví dụ |
|---|---|---|
| Gạch | 30 | 1×1 → 2×10, 1×12, 1×16, gạch khúc gỗ, gạch xây có vân, gạch lưới |
| Tấm | 40 | 1×1 → 8×16, 16×16, tấm góc, tấm nêm trái/phải, tấm bo tròn góc |
| Tấm trơn | 45 | Vuông, tròn, phần tư tròn, góc. **Khoảng 30 tấm in:** mắt, mặt cười, đồng hồ, bàn phím, biển báo chung chung |
| Mái dốc | 35 | 30°/33°/45°/65°/75°, mái ngược, mái góc, mái lưới |
| Dốc cong & nêm | 25 | Dốc cong 2×1 → 6×1, nêm trái/phải |
| Tròn & nón | 25 | Gạch/tấm tròn 1×1, 2×2, 4×4, nón, mái vòm, đĩa |
| Vòm & cột | 15 | Vòm 1×3 → 1×8, vòm cao, gạch cong một phần tư, cột tròn |
| Cửa & cửa sổ | 25 | Khung + kính (dạng bộ), cửa ra vào, cửa chớp, hàng rào, lan can, tấm vách |
| Bánh xe | 15 | Tấm trục bánh, bánh + lốp 3 cỡ, kính chắn gió, chắn bùn |
| Cây & hoa | 15 | Thân hoa, hoa, lá, cây thông, cỏ, cà rốt, quả |
| Gắn cạnh & nhảy | 15 | Gạch núm cạnh 1×1 (1 mặt, 4 mặt), gạch đèn, ke góc, tấm nhảy, tấm có núm lệch |
| Trang trí | 15 | Lưới tản nhiệt, núm tròn, chụp đèn, chi tiết máy móc gắn bằng núm |

Chế độ bé thấy khoảng 30 mảnh trong 6 nhóm: Gạch, Tấm, Mái, Tròn, Cửa, Cây. Màu cũng rút gọn, chỉ 10 màu.

## 7. Tương tác

### 7.1 Bố cục màn lắp (tablet ngang 1180×820)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ←  Nhà của Bin ✎          ↶  ↷         ● Đã lưu     👁 Ngắm   📄 Xuất │ 56 px
├───────┬──────────────────────────────────────────────────────────────┤
│ 🧱 Lắp │                                                              │
│ 🖌 Sơn │                       khung 3D                               │
│ 🔨 Tháo│                 bóng mờ  [✓] [↻]                             │
│ ✋ Chọn│                                                              │
│ ───── │                                                              │
│ 🎯 Giữa│                                                              │
│ 🔄 360°│                                          Trên tay: [2×4 🟥]  │
│ ⬒ Góc │                                                              │
├───────┴──────────────────────────────────────────────────────────────┤
│ [🕘][Gạch][Tấm][Trơn][Mái][Cong][Tròn][Vòm][Cửa][Xe][Cây][Cạnh][✨] │ nhóm
│  (45°) (33°) (cong) (ngược) (góc)              🟥🟧🟨🟩🟦🟪⬜⬛ … ┃ ↻ │ nhóm con · màu
│ ▢  ▢  ▢  ▢  ▢  ▢  ▢  ▢  ▢  ▢  ▢  ▢  →                               │ 200 px
└──────────────────────────────────────────────────────────────────────┘
```

**Khay:**
- Hàng nhóm có biểu tượng. Tab 🕘 "Vừa dùng" đứng đầu.
- Hàng chip nhóm con, ví dụ trong Mái: 45°, 33°, cong, ngược, góc.
- Thẻ mảnh là hình 3D thu nhỏ **đúng màu đang chọn**.
- Nhấn giữ một thẻ thì mở cửa sổ xem mảnh xoay 3D, kèm tên, kích thước, giọng đọc. Đây là chỗ bé ngắm chi tiết tinh xảo.
- Màu chưa có thật với mảnh đang chọn hiện một chấm mờ. Bé vẫn chọn được.

**Thanh trái:** 4 chế độ (Lắp, Sơn, Tháo, Chọn) và các nút camera. Chọn một mảnh ở khay thì tự chuyển sang Lắp.

**Màn hình khác:** Ở 820×1180 (tablet dọc), thanh trái thành một hàng ngang nằm trên khay. Khay thu gọn được. Laptop 1440×900 dùng bố cục ngang. Điện thoại chỉ cần không vỡ giao diện (D13).

**Kích thước:** nút ≥ 56 px, thẻ mảnh ≥ 76 px, ô màu ≥ 44 px. Chế độ bé nhân 1,25.

### 7.2 Bảng cử chỉ

| Thao tác | Cảm ứng | Chuột / phím |
|---|---|---|
| Xoay camera | 1 ngón kéo (trên chỗ trống hoặc trên mảnh) | **Kéo chuột phải** (ở đâu cũng xoay, kể cả trên bóng mờ; không bao giờ lắp). Kéo chuột trái trên chỗ trống vẫn xoay như cũ |
| Thu phóng / dời | 2 ngón chụm / 2 ngón kéo | Lăn / kéo chuột giữa |
| Xem trước (Lắp) | Chạm một chỗ → bóng mờ hút vào điểm nối gần nhất | Di chuột → bóng mờ chạy theo |
| Lắp | Chạm vào bóng mờ hoặc nút ✓. Chạm hai lần liên tiếp cùng chỗ = lắp luôn | Bấm chuột trái |
| Dời bóng mờ | Kéo chính bóng mờ (vùng chạm nới thêm 24 px), hoặc kéo **tay nắm ✥** cạnh nút ✓ ↻ | Kéo bóng mờ / tay nắm bằng chuột trái |
| Xoay quanh trục đứng | **Hai ngón vặn** (vượt 10° mới xoay, để chụm không bị xoay nhầm). Chế độ bé: tắt | — |
| Vừa khung | **Chạm đúp chỗ trống** (≤ 320 ms, ≤ 24 px). Đang cầm mảnh thì chạm đúp trên bàn vẫn là dời bóng rồi lắp | Bấm đúp chỗ trống |
| Lòng bàn tay tì lên màn hình | Bỏ qua chạm có vùng tiếp xúc > 40 px (PointerEvent `width/height`) | — |
| Kéo thả từ khay | Nhấn thẻ, kéo vào khung, thả = lắp | Kéo thả |
| Đổi hướng | ↻ ở khay hoặc cạnh bóng mờ: **hướng lắp được tiếp theo tại chỗ này** | `R` (`Shift+R` lùi lại) |
| Lấy mẫu | Nút **Lấy mảnh giống thế này** trong bong bóng (chế độ Chọn): cầm đúng loại, màu và hướng của mảnh đó. Không gán hành động nào cho thao tác nhấn giữ trên khung 3D, vì trẻ hay vô tình nhấn giữ | `Alt` + bấm |
| Sơn / Tháo | Chạm mảnh ở chế độ tương ứng | Bấm |
| Chọn → bong bóng | Chạm mảnh ở chế độ Chọn | Bấm; `Delete` để tháo |
| Hoàn tác / làm lại | ↶ ↷ | `Ctrl+Z` / `Ctrl+Shift+Z` |
| Thả mảnh đang cầm | Chạm lại thẻ đang chọn, hoặc ✋ | `Esc` |

### 7.3 Máy trạng thái nhận chạm (`input/gesture.ts`, thuần TypeScript, có test)

Chỉ máy này được lắng nghe pointer trên khung 3D. `camera-controls` tắt bộ nghe riêng (`mouseButtons` và `touches` đặt `NONE`) và chỉ nhận lệnh `rotate`, `dolly`, `truck` từ máy trạng thái.

| Trạng thái | Sự kiện | Chuyển sang / kết quả |
|---|---|---|
| RẢNH | 1 ngón xuống trúng bóng mờ (hình chiếu + 24 px) | KÉO BÓNG |
| RẢNH | 1 ngón xuống chỗ khác | CHỜ |
| CHỜ | di > 8 px | XOAY CAMERA |
| CHỜ | nhấc tay, di ≤ 8 px (giữ lâu bao nhiêu cũng vẫn là chạm) | CHẠM → xử lý theo chế độ → RẢNH |
| bất kỳ | ngón thứ 2 xuống | CHỤM. Huỷ chạm hoặc kéo dở. Bóng mờ giữ vị trí hợp lệ cuối |
| CHỤM | còn 1 ngón | ở yên CHỤM tới khi nhấc hết tay (để camera không giật) |
| (khay) | nhấn thẻ, kéo ra khỏi khay > 12 px | KÉO TỪ KHAY. Bóng theo ngón, lệch lên 40 px (A/B ở GĐ1) |
| KÉO TỪ KHAY | nhấc tay | Hợp lệ → lắp. Không hợp lệ → huỷ, thẻ nảy về khay |
| KÉO BÓNG | nhấc tay | Hợp lệ → lắp. Không hợp lệ → về vị trí hợp lệ cuối |
| bất kỳ | `pointercancel`, mất focus, tab ẩn | RẢNH, huỷ mọi thao tác dở |

Khi CHẠM, xử lý theo chế độ:

| Chế độ | Trúng gì | Kết quả |
|---|---|---|
| Lắp | bóng mờ hợp lệ | lắp |
| Lắp | chỗ khác | dời bóng tới đó. Nếu bật **Lắp nhanh** và vị trí hợp lệ thì lắp luôn |
| Sơn | mảnh | đổi sang màu đang chọn |
| Tháo | mảnh | tháo, có hiệu ứng "bụp" |
| Chọn | mảnh / chỗ trống | chọn và hiện bong bóng / bỏ chọn |

**Bóng mờ hiện ngay khi chọn mảnh.** Bé chọn một mảnh ở khay thì bóng mờ xuất hiện liền, không đợi bé chạm vào khung. Vị trí là điểm lắp gần nhất quanh chỗ vừa lắp trước đó. Nếu chưa có mảnh nào thì đặt ở giữa bàn. Bé thấy ngay mảnh "đang cầm" nằm đâu: bấm ✓ là lắp, chạm chỗ khác là dời.

**Bong bóng** có các nút:
- **Lấy mảnh giống thế này:** cầm đúng loại, màu, hướng.
- **Nhấc:** cầm lên để dời. Huỷ thì mảnh trả về chỗ cũ.
- **Xoay:** chuyển sang hướng lắp được tiếp theo, tại chỗ.
- **Sơn màu này.**
- **Nhân bản:** cầm một bản sao trên tay.
- **Tháo.**

### 7.4 Tìm vị trí đặt (`engine/pick.ts`, `engine/place.ts`)

1. **Tia:** bắn tia từ camera qua điểm chạm. Khi kéo trên cảm ứng, điểm chạm được dời lên một đoạn lệch ngón.
2. **Chọn trúng:**
   - Duyệt các ô của bảng băm không gian dọc theo tia (DDA thô).
   - Với mỗi ô, thử tia với hộp va chạm của các mảnh trong ô. Lấy điểm trúng gần nhất: mảnh `Q`, điểm `p`, pháp tuyến `n` của mặt hộp.
   - Không trúng mảnh nào thì giao với mặt bàn.
3. **Mục tiêu:** các điểm nối **tự do** của `Q`, gần `p` (tối đa 16 điểm), có trục cắm song song `n`. Mặt bàn cho mục tiêu là các núm ảo quanh `p`.
4. **Ứng viên:**
   - Với mỗi mục tiêu `t`, mỗi điểm nối `h` cùng cặp của mảnh đang cầm, và mỗi hướng `o` trong `orients` khiến trục của `h` trùng trục của `t`: tính vị trí sao cho `h` trùng `t`.
   - Kiểm va chạm.
   - Đếm mọi cặp khớp phát sinh.
5. **Chấm điểm:** khoảng cách từ tâm hình chiếu của mảnh tới `p`, cộng phạt nếu khác hướng bé đang chọn, cộng phạt nếu đổi so với ứng viên cũ (chống giật, ngưỡng 0,25 núm). Lấy ứng viên hợp lệ tốt nhất.
6. **Mặt không có điểm nối** (mặt bên của gạch thường): **rơi**. Từ điểm `p + n × nửa cỡ mảnh`, bắn tia thẳng xuống, tìm mặt có núm hướng lên đầu tiên rồi chạy lại bước 3. Bé chạm vào thành tường thì mảnh rơi xuống đậu bên cạnh, giống thả vật.
7. **↻:** gom các ứng viên hợp lệ tại mục tiêu hiện tại theo **hướng khác nhau**. Xếp theo mức tự nhiên: giữ trục đứng trước, rồi đến xoay quanh trục cắm. Mỗi lần bấm sang hướng kế tiếp. Không có hướng nào khác thì rung nhẹ. Khi bé chạm vào mặt bên có núm của gạch núm cạnh, hướng của mảnh **tự** được suy ra. Bé không bao giờ phải xoay 3D bằng tay.
8. **Đầu ra:** `{ pos, o, valid, reason, joins[] }`. `reason` là một trong: `chạm mảnh khác`, `không có chỗ gắn`, `mặt trơn`, `ra ngoài vùng xây`.

### 7.5 Phản hồi

- **Bóng mờ hợp lệ:** màu mảnh, độ đục 55 %, viền trắng. Các điểm nối sắp khớp sáng xanh. Đây là cách cho bé "thấy" luật nối.
- **Bóng mờ không hợp lệ:** đỏ nhạt, có dấu ✕ và nhãn lý do ngắn.
- **Đường rơi:** đường đứt nét thẳng xuống bàn, cùng ô bóng đổ dưới chân.
- **Nhìn xuyên:** khi bóng mờ bị che, vẽ viền không kiểm tra độ sâu, độ đục 25 %.
- **Âm thanh và rung:**
  - Hút sang điểm nối mới: tiếng "tích", rung 8 ms (chỉ Android).
  - Lắp: tiếng "tách", mảnh rơi 0,3 đơn vị trong 120 ms, hơi bẹp.
  - Tháo: tiếng "bụp" và vài hạt văng.
  - Giảm chuyển động: tắt bẹp và hạt.

### 7.6 Camera

- `<CameraControls>` của drei. Tâm xoay ở tâm hộp bao mô hình.
- Góc nghiêng 8°–100°. Khi camera xuống dưới mặt bàn, bàn mờ còn 30 %, để gắn được mảnh treo dưới.
- Nút 🎯 **Giữa** (vừa khung), 🔄 **360°** (tự xoay 8 s, chạm là dừng), ⬒ **Góc** (Trước, Phải, Trên, Nghiêng; chuyển trong 400 ms).
- Không tự di camera sau khi lắp.

### 7.7 Lần đầu vào xưởng và chế độ bé

**Hướng dẫn lần đầu:** 3 bước có giọng đọc, bỏ qua được, xem lại bằng nút ?.
1. "Chọn một viên gạch nhé."
2. "Chạm lên bàn để đặt, chạm lần nữa để lắp."
3. "Kéo một ngón tay để xoay xem mô hình."

**Chế độ bé** tự bật khi `isPreschool(grade)`:
- Khoảng 30 mảnh và 10 màu.
- **Chỉ lắp từ dưới lên:** không treo dưới, không gắn cạnh. Camera không xuống dưới mặt bàn.
  - Từ lớp 1 trở lên thì không khoá, nhưng hai kiểu lắp kia chỉ xảy ra khi bé chủ động: treo dưới khi bé chạm vào mặt dưới của mảnh, gắn cạnh khi bé chạm vào mặt có núm cạnh.
  - Vì vậy lúc mới chơi, bé lớp nào cũng chỉ thấy lắp chồng từ dưới lên.
- Lắp nhanh **tắt** (chạm hai bước, theo D9). Chỉnh lại sau phiên chỉnh thông số theo số liệu dùng thật.
- Nam châm rộng hơn.
- Không có chế độ Chọn, không dời khung.
- Nút to hơn 25 %. Mọi gợi ý có giọng đọc.

## 8. Kết xuất và chất lượng hình

### 8.1 Vật liệu

| Loại màu | Vật liệu |
|---|---|
| Nhựa thường | `MeshPhysicalMaterial`: roughness 0,28, clearcoat 0,3, clearcoatRoughness 0,15. Mức Thấp dùng `MeshStandardMaterial` |
| Trong suốt | Độ đục 0,55, phản chiếu môi trường, `depthWrite` tắt, vẽ sau cùng. Mức Cao thử `transmission` (đo chi phí ở GĐ1) |
| Ngọc trai / kim loại | metalness 0,85, roughness 0,25 |
| Phần in | Tách thành lưới con theo màu cố định. Mỗi lưới con dùng chung ma trận instance với lưới màu chính |

**Ánh sáng:**
- Môi trường dùng `RoomEnvironment` qua PMREM, sinh tại chỗ, không tải mạng.
- Một đèn hướng có bóng mềm (PCFSoft), khung bóng ôm theo hộp bao mô hình.
- **Sân khấu tối** (nền `#1b222c`, bàn `#252e3a`) để mảnh màu nổi lên. Bàn có lưới mờ: vạch mảnh mỗi 1 núm, vạch đậm mỗi 8 núm, viền vùng xây.
- Đèn: key chéo trước-phải (bóng mềm, độ đậm bóng 0,45), fill lạnh bên trái, rim phía sau; môi trường 0,32. Tone mapping Neutral (cuối chuỗi EffectComposer ở Cao/Vừa, ở renderer ở Thấp).

### 8.2 Hình học trên GPU

- **Thân mảnh:** mỗi loại mảnh một `InstancedMesh` có `instanceColor`. Ma trận instance thu nhỏ 0,2 % quanh tâm mảnh để lộ đường ghép giữa hai mảnh cùng màu.
- **Núm:** hai `InstancedMesh` chung cho núm đặc và núm rỗng. Núm có 16 cạnh, mép trên bo tròn, không có logo. **Núm đã bị cắm thì không vẽ.** Núm cạnh và núm của tấm nhảy dùng chung lưới, ma trận lấy từ điểm nối.
- **Viền** (bật/tắt, mặc định tắt ở xưởng, bật trong ảnh hướng dẫn): một lượt hậu kỳ dò cạnh trên bộ đệm pháp tuyến và độ sâu. Rẻ hơn nhiều so với vẽ đường LDraw cho hàng nghìn instance.
- **Chọn điểm** dùng engine ở mục 7.4, **không dùng** `Raycaster` trên tam giác.

### 8.3 Ba mức chất lượng

| Mức | Vật liệu | AO | Bóng | DPR | LOD |
|---|---|---|---|---|---|
| Cao | Physical | N8AO đủ độ phân giải | 2048 | ≤ 2 | đầy đủ |
| Vừa | Physical | N8AO nửa độ phân giải | 1024 | ≤ 1,5 | đầy đủ |
| Thấp | Standard | tắt | bóng tiếp xúc nướng sẵn | 1 | vỏ |

- **Tự chọn mức:** 3 giây đầu đo thời gian khung hình. Bé hoặc phụ huynh chỉnh được trong cài đặt của xưởng.
- **Vẽ lại bản đẹp khi dừng tay:** `frameloop="demand"`. Khi đang xoay thì vẽ ở mức hiện tại. Camera đứng yên 300 ms thì vẽ thêm một khung ở mức Cao. Máy yếu cũng thấy ảnh đẹp mỗi khi dừng lại.

### 8.4 Renderer phụ và mất context

**Renderer phụ:** chỉ có **một** `WebGLRenderer` phụ dùng chung, tạo khi cần và huỷ khi rời xưởng. Nó vẽ:
- hình thẻ mảnh ở khay, cache theo cặp `(mảnh, màu)`;
- ảnh thu nhỏ mô hình;
- toàn bộ ảnh trong tài liệu.

Mọi ảnh của renderer phụ vẽ ở mức Cao, có viền nếu cần.

**Mất WebGL context:**
- Hiện lớp phủ "Đang khôi phục 3D…", rồi dựng lại cảnh từ dữ liệu.
- Nếu thiết bị không có WebGL: Tủ Mô Hình vẫn xem được bằng ảnh thu nhỏ, và vẫn xuất được danh sách mảnh.

## 9. Tính toán và ngân sách (ước tính, đo ở GĐ0–1)

| Hạng mục | Ước tính | Cách đạt |
|---|---|---|
| Tam giác mỗi thân mảnh (không tính núm) | Gạch 2×4 đầy đủ ~600, vỏ ~120. Mảnh cong, tròn ~1.000–2.000 | Primitive 16 cạnh, không dùng bản 48 cạnh |
| Mô hình 2.000 mảnh, mức Cao | Thân ~1,2 triệu + núm lộ ~2.500 × 120 ≈ 1,5 triệu tam giác | Instancing. Mức Vừa và Thấp dùng vỏ khi đáy bị che |
| Lệnh vẽ | ≈ số loại mảnh đang dùng + lưới con phần in + 4 (thường < 80) | InstancedMesh theo loại |
| Chọn điểm + tìm vị trí | ≤ 16 mục tiêu × ≤ 32 điểm nối × ≤ 4 hướng ≈ 2.000 ứng viên, mỗi ứng viên vài phép so hộp → < 2 ms | Bảng băm điểm nối và bảng băm không gian |
| Tải về | ~300 mảnh × ~8 KB ≈ 2,4 MB, chia theo nhóm, tải lần đầu mở nhóm | Lượng tử hoá Int16 và octahedral |
| Bộ nhớ GPU | < 60 MB với 300 loại mảnh đã tải | Chỉ tải nhóm đã mở |
| Dữ liệu một mô hình 500 mảnh | ≈ 12 KB JSON, ảnh thu nhỏ WebP ≈ 8 KB | Mục 10 |

**Mục tiêu đo ở GĐ1** (đo trên tablet nhà, không chỉ trên máy dev):
- Mô hình 2.000 mảnh xoay ≥ 45 fps ở mức tự chọn.
- Chạm → bóng mờ ≤ 50 ms.
- Ảnh "bản đẹp khi dừng tay" hiện ≤ 400 ms sau khi dừng.

## 10. Dữ liệu, lưu, đồng bộ

### 10.1 Định dạng mô hình (`engine/model.ts`)

```ts
interface BrickModel {
  v: 1;
  ownerId: string; id: string;            // uuid
  name: string;                           // ≤ 40 ký tự
  created: number; updated: number; revision: number;
  parts: string[]; colors: string[];      // từ điển key dùng trong mô hình
  b: number[];                            // 6 số mỗi mảnh: partIdx, colorIdx, x, y, z (LDU), o (0–23), THEO THỨ TỰ LẮP
  view?: number[];                        // góc camera lần cuối
  stats: { count: number; size: [number, number, number] };
  idea?: string;
}
```

- Thứ tự `b` là thứ tự lắp. Nhờ vậy có sẵn dữ liệu cho "Xem quá trình lắp" và gợi ý thứ tự cho hướng dẫn từng bước.
  - Lắp: thêm vào cuối.
  - Tháo: xoá khỏi danh sách.
  - Sơn, xoay tại chỗ: giữ nguyên chỉ số.
  - Nhấc và dời: chuyển xuống cuối.
- Khớp quay ở v2 thêm trường `a?: Record<number, number>` (góc theo chỉ số mảnh). Định dạng v1 không phải đổi.
- Kiểm tra mỗi lần đọc: số nguyên, nằm trong vùng xây, không va chạm. Key mảnh lạ (mô hình làm trên bản app mới hơn) thì giữ nguyên dữ liệu, vẽ hộp xám và báo "cần cập nhật app". Không xoá.
- Giới hạn: 4.000 mảnh mỗi mô hình (báo nhẹ từ 3.000), 200 mô hình mỗi học sinh.

### 10.2 Kho và đồng bộ

**DB `brick-studio-v1`, version 1**, có hai store:
- `models`
- `thumbs` (`{ ownerId, id, revision, blob }`)

Cả hai dùng keyPath `['ownerId', 'id']` và index `ownerId`.

**Ghi:**
- `revision` chống ghi đè giữa các tab, như `saveArt`.
- **Tự lưu:**
  - 1,5 giây sau thay đổi cuối;
  - khi `visibilitychange` và `pagehide`;
  - khi rời xưởng.
- Lịch sử hoàn tác chỉ giữ trong bộ nhớ, tối đa 200 bước, lưu dạng lệnh.
- `profile.bricks` (< 2 KB): số mô hình, tổng số mảnh đã lắp, huy hiệu, các mẫu hướng dẫn đã xong.

**Thêm vào `databaseSpecs()` trong `services/account/snapshot.ts`:**

```ts
{ name: 'brick-studio-v1', version: 1, stores: ['models', 'thumbs'].map(name => ({ name, keyPath: ['ownerId', 'id'], owner: 'ownerId', index: 'ownerId' })) },
```

- Thêm test round trip vào `services/account/account.test.ts`: hai học sinh, có Blob, và chặn dữ liệu sai owner.
- Ngân sách: 3 bé × 60 mô hình × khoảng 20 KB ≈ 3,6 MB, trong trần 20 MiB của cả bundle. Phần xưởng vượt 6 MB thì tủ nhắc nhẹ.

## 11. Tài liệu lắp ghép

### 11.1 Nội dung PDF (A4 dọc)

1. **Bìa:** tên mô hình, "của <tên bé>", ngày, ảnh nghiêng lớn ở mức Cao. Kèm số mảnh, số loại mảnh, **kích thước thật** (D × R × C, cm).
2. **Sáu góc nhìn:** Trước, Sau, Trái, Phải, Trên, Nghiêng sau, lưới 2×3. Góc Trước có thước cm.
3. **Danh sách mảnh**, viết để trẻ đọc được (D11):
   - Xếp theo nhóm, rồi theo kích thước, rồi theo màu.
   - Mỗi dòng có:
     - **ảnh mảnh to**, đúng màu;
     - tên tiếng Việt kèm kích thước;
     - ô màu kèm tên màu tiếng Việt;
     - **số lượng** in to;
     - ô ☐ để đánh dấu khi tìm đủ mảnh;
     - mã mảnh và mã màu in nhỏ.
   - Tổng số mảnh ở cuối.
   - Dòng ⚠ đánh dấu tổ hợp không có thật, kèm gợi ý màu thay.
   - Mảnh dạng bộ được bung ra thành từng mảnh thật.
4. **Các bước lắp** (từ GĐ4, thuật toán ở mục 11.4). Mỗi trang 2–4 bước, tuỳ số mảnh trong bước.
5. **Cho người lớn** (nửa trang cuối):
   - Mẹo mua gạch tương thích theo kích thước và màu, mẹo đổi màu.
   - Nhắc rằng có thể xuất file BrickLink XML, Rebrickable CSV và LDraw từ nút Xuất của app.
6. **Ghi công** (LDraw, LDCad, Rebrickable). In chữ nhỏ ở trang cuối.

### 11.2 Cách dựng

1. Renderer phụ vẽ từng góc nhìn ở 1200×900, nền trong suốt, có viền.
2. Ghép trang trên canvas 2D cỡ 1240×1754 (A4, 150 dpi). Chữ vẽ bằng font của app, chờ `document.fonts.ready` trước khi vẽ. Dấu tiếng Việt hiển thị đúng.
3. Mỗi trang ra một JPEG chất lượng 0,88. **Trình ghi PDF tối giản tự viết** (`export/pdf.ts`, khoảng 100 dòng) đặt mỗi JPEG thành một trang, dùng image XObject `DCTDecode`. Không thêm dependency. Gặp lỗi trình đọc PDF thì mới cân nhắc `jspdf` tải lười.
4. Ước tính khoảng 300 KB mỗi trang. Mô hình vừa có khoảng 5 trang, ≈ 1,5 MB.
5. Đầu ra:
   - **Tải PDF**, hoặc **Chia sẻ** qua Web Share có file khi trình duyệt hỗ trợ.
   - **Lưu ảnh** PNG từng trang.

### 11.3 File cho người lớn

- **BrickLink XML:** `<INVENTORY><ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>3001</ITEMID><COLOR>5</COLOR><MINQTY>4</MINQTY></ITEM>…</INVENTORY>`. Phải dùng mã BrickLink, không dùng mã LDraw.
- **Rebrickable CSV:** `Part,Color,Quantity`.
- **LDraw `.ldr`:** `1 <màu LDraw> x y z <ma trận 3×3> <ldraw>.dat`. Engine đã dùng đúng toạ độ LDraw, nên chỉ cần ghi ra. Giữa các bước chèn `0 STEP`, nhờ vậy BrickLink Studio hoặc LPub3D làm được sách hướng dẫn chuyên nghiệp từ file này.

### 11.4 Hướng dẫn từng bước (bản cơ bản ở GĐ4, phần nâng cao ở GĐ5)

1. **Thứ tự (GĐ4):** sắp theo **đồ thị kết nối**, không cắt theo tầng chiều cao.
   - Tập "lắp được" gồm các mảnh nối với phần đã lắp hoặc với bàn.
   - Mỗi bước lấy các mảnh thấp nhất theo hướng trọng lực trong tập đó. Nếu bằng nhau thì ưu tiên mảnh lắp trước theo `b`.
   - Mảnh gắn cạnh hoặc treo dưới chỉ vào tập sau khi mảnh đỡ nó đã lắp.
   - Tối đa 6 mảnh mỗi bước (chế độ bé 3), chia theo cụm gần nhau.
   - **Ưu tiên thấp trước, nhưng chỉ trong tập đã lắp được.** Tức là vừa xét tầng y vừa xét kết nối, không chọn một trong hai. Vì vậy mái hiên không thể lên trước trụ đỡ nó: chừng nào trụ chưa lắp thì mái hiên chưa nối được vào gì, nên chưa vào tập lắp được.
   - **Kiểm tra đường cắm (sweep).** Ở mỗi bước, mảnh mới phải trượt được dọc trục cắm của nó (−trục của điểm nối đang dùng) từ ngoài vào, mà không va mảnh nào đã lắp.
     - Nếu bị chặn bởi mảnh B thì thêm ràng buộc "mảnh này trước B" rồi sắp lại theo thứ tự tô-pô.
     - Ví dụ: một viên gạch kẹp giữa sàn và mái hiên thấp, nối cả hai. Viên này lắp được ngay khi sàn có, và lại thấp hơn mái, nên luật "thấp trước" đã đưa nó lên trước. Kiểm tra đường cắm bắt nốt các ca mà chỉ xét y thì không thấy: mảnh treo dưới gầm mà đường cắm từ dưới lên đã bị chặn, hoặc mảnh gắn cạnh bị tường chắn.
     - Nếu sắp lại vẫn có vòng ràng buộc (hiếm), bước đó được ghi chú "lắp cụm này riêng rồi ghép vào". Cụm con được tách theo đồ thị kết nối.
   - **Nhiều cụm trên bàn** (ví dụ cổng có hai trụ rời, chưa có tấm nền): trên bàn mỗi trụ là một cụm hợp lệ riêng (D, mục 5.3). Ở bước nối hai cụm (thanh ngang), trang hướng dẫn in một **thước ô núm** ghi khoảng cách giữa hai trụ, kèm gợi ý "đặt hai trụ cách nhau N núm, hoặc dùng tấm nền A×B". Ngoài đời người lắp giữ đúng khoảng cách rồi úp thanh ngang lên. Danh sách mảnh có thêm một dòng tuỳ chọn: tấm nền vừa đủ phủ các cụm.
   - **Vì sao không cắt theo tầng y:**
     - Một mái dốc ngược treo dưới mái hiên có y thấp hơn mảnh đỡ nó. Cắt theo tầng thì mái này nằm ở bước trước khi có mảnh đỡ, tức là lơ lửng.
     - Tấm cao 1/3 gạch nên số tầng y rất nhiều, mà mỗi tầng lại có thể dồn vài chục mảnh vào một bước.
2. **Góc nhìn:**
   - **GĐ4:** cố định góc nghiêng trước-trái. Nếu dưới 50 % mảnh mới nhìn thấy được thì chuyển sang góc sau-phải.
   - **GĐ5:** chọn 1 trong 4 góc nghiêng, lấy góc thấy nhiều nhất các mảnh mới. Đo bằng render ID-buffer 256×192. Giữ góc cũ nếu vẫn thấy ≥ 60 %. Đổi góc thì vẽ biểu tượng "xoay mô hình".
3. **Hình bước (GĐ4):** mảnh mới có viền vàng. Khung góc trái liệt kê mảnh cần cho bước, kèm số lượng.
4. **Trong app (GĐ5):**
   - **Lắp theo hướng dẫn:** mở bất kỳ mô hình nào trong tủ, kể cả mô hình của anh chị em, rồi lắp lại từng bước.
     - Khay chỉ hiện mảnh cần cho bước hiện tại.
     - Bóng mờ gợi ý vị trí.
     - Engine so khớp loại, màu, vị trí và hướng, có tính đối xứng của mảnh.
   - **Xem quá trình lắp:** phát lại thứ tự `b` như phim tua nhanh.

## 12. Vòng chơi và phần thưởng

```
Ý tưởng → Lắp → Ngắm (360°, sân khấu) → Cất vào Tủ → Xuất tài liệu / lắp thật
                                              ↘ anh chị em "Lắp theo hướng dẫn"
```

- **Lắp tự do** không đúng không sai, không đếm giờ, không phạt.
- **Mô hình mẫu (v1, GĐ3):** 10 mô hình 20–60 mảnh: vịt, xe đua, tên lửa, khủng long, nhà, cây, rùa, thuyền, robot, lâu đài nhỏ. Kệ "Mẫu" trong Tủ.
  - Bé bấm **Lắp lại cho riêng em** thì app chép mẫu thành mô hình của bé, để bé sửa, thêm cánh, thêm bánh. Có thể dùng **Nổ tung** (xem dòng dưới) để nhìn cấu trúc bên trong.
  - Có mẫu sẵn thì bé không phải đứng trước một cái bàn trống mà không biết bắt đầu từ đâu.
  - Mẫu được dựng ngay trong xưởng: Claude dựng bằng script dữ liệu, hoặc chủ dự án tự lắp. Mọi mẫu phải qua bảng ảnh để chủ dự án duyệt.
- **Ý tưởng hôm nay:** mỗi ngày 3 gợi ý trong kho 40 chủ đề (con rùa, nhà có cửa sổ, tên lửa, xe kem…). Chạm vào gợi ý thì mở mô hình mới đặt sẵn tên.
- **Nổ tung (GĐ6, rẻ, kéo sớm lên GĐ3 được):** trong chế độ Ngắm có một thanh trượt. Kéo thanh thì các mảnh bay tách xa tâm mô hình, tầng cao tách nhiều hơn tầng thấp; thả ra thì các mảnh ráp lại. Bé thích hiệu ứng này, và nhờ nó hiểu được bên trong mô hình lắp ra sao. Chỉ đổi ma trận instance, không sửa dữ liệu mô hình.
- **Huy hiệu** (dùng hệ thành tích có sẵn): Viên gạch đầu tiên, 100 mảnh, Tháp cao 30 cm, 10 mô hình, Nhà sưu tầm (dùng đủ 12 nhóm), Lắp theo hướng dẫn lần đầu.
- **Sao:** +1⭐ lần đầu hoàn thành mỗi mẫu hướng dẫn hoặc thử thách. Không có sao cho lắp tự do.
- **Gắn với việc học**, không nói thành bài:
  - Kích thước thật (cm) → đo lường.
  - Danh sách mảnh → đếm và thống kê.
  - Xoay mô hình → tư duy không gian.
  - Chế độ đối xứng (GĐ6) → đối xứng trục.
  - Làm theo hướng dẫn → đọc hình kỹ thuật.

### 12.1 Số liệu dùng thật (từ GĐ3, chỉ lưu trên máy)

Không có buổi cho các bé chơi thử (D9). App tự đếm, cho từng học sinh, rồi gộp theo ngày:
- số lần lắp;
- số lần bóng mờ không hợp lệ, kèm lý do;
- số lần hoàn tác ngay sau khi lắp (dưới 3 giây, coi như đặt nhầm);
- thời gian từ lúc chọn mảnh tới lúc lắp;
- tỉ lệ dùng Lắp nhanh;
- số lần bấm ↻ trước khi lắp;
- số lần huỷ khi kéo từ khay.

Dữ liệu chỉ nằm trên máy, không đồng bộ lên cloud, không gửi lên server, chỉ giữ 30 ngày gần nhất. Phụ huynh xem được ở mục "Số liệu" trong cài đặt của xưởng, và có nút chép ra dạng JSON để gửi cho Claude.

Sau 1–2 tuần các bé dùng thật, có **một phiên chỉnh thông số** dựa trên số liệu này: bán kính nam châm, độ lệch ngón, mặc định Lắp nhanh, vùng chạm bóng mờ.

## 13. Kiến trúc đích

```
scripts/  bricks-parts.mjs (dây chuyền LDraw, mục 4.2) · bricks-bench.mjs
tools/ldraw/                                     (gitignore: LDraw, shadow LDCad, dữ liệu Rebrickable)
public/bricks/parts/<nhóm>.bin                   (hình học đã nén)
src/bricks/
  catalog/  parts.generated.json · colors.generated.json · availability.generated.json · credits.generated.json
            groups.ts · ideas.ts · loader.ts (tải .bin theo nhóm)
  engine/   space.ts · orient.ts (24 ma trận) · index.ts (băm điểm nối + không gian) · place.ts · pick.ts
            connect.ts (lơ lửng) · history.ts · model.ts · steps.ts (GĐ5)
  input/    gesture.ts
  render/   PartMeshes.tsx · StudLayer.tsx · Ghost.tsx · BrickScene.tsx · CameraRig.tsx · quality.ts · offscreen.ts
  export/   views.ts · bom.ts · pages.ts · pdf.ts · bricklink.ts · ldraw.ts
  progress/ modelRepo.ts · progress.ts · badges.ts
  ui/       BrickStudio.tsx · Workbench.tsx · Tray.tsx · PartViewer.tsx · ColorBar.tsx · ModeBar.tsx
            PieceBubble.tsx · Cabinet.tsx · ExportSheet.tsx · Coach.tsx · Credits.tsx · bricks.css
  preview.tsx
bricks-preview.html
docs/brick-studio/  parts-v1.csv · sheets/ · cover-prompt.md · ảnh nghiệm thu
```

`engine/`, `input/` và phần đọc file trong script là TypeScript/JS thuần, không import React hay three. Test chạy nhanh trên Node.

## 14. Thứ tự thi công

| GĐ | Nội dung | Nghiệm thu | Cỡ |
|---|---|---|---|
| **0a** | **Dây chuyền mảnh.** `bricks-parts.mjs` đủ các bước 1–10 ở mục 4.2. Tuyển `parts-v1.csv`. Sinh bảng duyệt | `node scripts/bricks-parts.mjs --check` xanh: mọi mảnh có ≥ 1 điểm nối, hộp va chạm nằm trong hộp bao, không có tam giác suy biến, có giấy phép. Danh sách `needs-review` rỗng hoặc đã xử lý. **CỔNG MẢNH: chủ dự án duyệt 12 bảng ảnh** | L |
| **0b** | **Lõi ghép nối.** `space`, `orient`, `index`, `place`, `pick`, `connect`, `history`, `model`. Script đo `bricks-bench.mjs` | `npx vitest run src/bricks` xanh. Các test bắt buộc:<br>• mọi mảnh × mọi hướng gắn được lên **và** xuống một gạch 2×4;<br>• gạch núm cạnh nhận mảnh ở mặt bên, tấm nhảy lệch đúng nửa núm, bánh xe cắm vào trục;<br>• fuzz 100.000 thao tác ngẫu nhiên mà chỉ mục luôn khớp với chỉ mục dựng lại từ đầu;<br>• hoàn tác/làm lại 200 bước;<br>• `.ldr` xuất ra rồi đọc lại cho đúng mô hình.<br>Ghi số đo vào mục 20 | M |
| **1** | **Spike tương tác và hình ảnh.** `bricks-preview.html`: cảnh đẹp (vật liệu, AO, bóng, 3 mức chất lượng, vẽ lại khi dừng tay), khoảng 40 mảnh từ 6 nhóm, máy trạng thái đủ cử chỉ, bóng mờ đầy đủ phản hồi, ↻ theo hướng hợp lệ, Lắp/Tháo, hoàn tác, âm thanh. Công tắc A/B: chạm 2 bước ↔ Lắp nhanh, lệch ngón 0 ↔ 40 px. Nút "Thêm 2.000 mảnh" | Test máy trạng thái bằng chuỗi pointer giả lập xanh. Đo fps trên máy dev và tablet nhà. **CỔNG HÌNH ẢNH:** 6 ảnh chụp cảnh mẫu (nhà, xe, con vật) ở mức Cao và Thấp, chủ dự án duyệt. **CỔNG CHƠI THỬ:** chủ dự án tự thử theo kịch bản Claude soạn sẵn, trên iPad, tablet Android và laptop. Kịch bản có 3 việc (tháp, nhà có cửa sổ, xe có bánh), làm cả ở chế độ thường và chế độ bé. Phiếu ghi: số lần đặt nhầm, số lần hoàn tác, chỗ lúng túng, fps đo được. Chủ dự án chốt sơ đồ cử chỉ, cập nhật mục 7 | L |
| 2 | **Xưởng hoàn chỉnh.** Bố cục 7.1, khay 12 nhóm + nhóm con + Vừa dùng + xem mảnh 3D, bảng màu (chấm màu có thật), 4 chế độ, bong bóng, lấy mẫu, camera, 360°, hướng dẫn lần đầu + TTS, chế độ bé, ba cỡ màn hình, giảm chuyển động, mất context, phím tắt, cài đặt chất lượng, trang Ghi công | Ảnh chụp ở 1180×820, 820×1180, 1440×900; ở 390×844 chỉ cần không vỡ giao diện. Mọi mảnh v1 lắp được trên app thật (kịch bản tự động qua engine, chụp ảnh lưới mảnh đã lắp). Chạm → bóng mờ ≤ 50 ms trên tablet | L |
| 3 | **Tủ Mô Hình, lưu, đồng bộ, sảnh.** `modelRepo`, giao diện Tủ (kệ, thẻ ảnh, tên, số mảnh, ngày; mở, đổi tên, nhân bản, xoá có xác nhận), ảnh thu nhỏ, sidecar snapshot + test, `ModeId 'bricks'`, thẻ sảnh, route `/bricks`, `profile.bricks`, huy hiệu, Ý tưởng hôm nay, **10 mô hình mẫu + "Lắp lại cho riêng em"** (Claude dựng bằng script, chủ dự án duyệt bảng ảnh), **số liệu dùng thật** (mục 12.1). Ảnh bìa: chủ dự án sinh theo `cover-prompt.md` (không logo, không chữ) | Tải lại giữa chừng không mất quá 1,5 s. Hai tab cùng mở thì báo xung đột, không ghi đè. `account.test.ts` xanh. Mô hình tạo trên máy A thấy trên máy B. `npm run build` xanh | M |
| 4 | **Tài liệu lắp ghép v1** (mục 11.1–11.3) **và các bước lắp bản cơ bản** (mục 11.4, phần GĐ4): sắp bước theo đồ thị kết nối, góc nhìn cố định, viền mảnh mới, khung liệt kê mảnh, `0 STEP` trong `.ldr` | PDF mở đúng trên Chrome, Edge, Safari iPad, dấu đúng. Test: tổng danh sách bằng số mảnh (tính cả mảnh dạng bộ). Mọi bước chỉ chứa mảnh lắp được; fuzz 200 mô hình ngẫu nhiên, mỗi mô hình có mảnh treo dưới và mảnh gắn cạnh. Test **phát lại các bước**: lắp lại từ bàn trống, đúng thứ tự các bước, phải ra đúng mô hình gốc và không có mảnh nào lơ lửng ở bất kỳ bước nào. Chủ dự án đọc PDF của 3 mô hình mẫu và xác nhận nhìn các bước là hiểu cách lắp. Mô hình thử chứa mọi mảnh: `.ldr` mở bằng Studio khớp ảnh trong app. BrickLink XML và Rebrickable CSV có test định dạng (không cần thử tải lên) | M |
| — | **Phát hành v1 sau GĐ4** | Mục 18 | — |
| 5 | **Hướng dẫn nâng cao:** chọn góc nhìn tối ưu cho từng bước, Lắp theo hướng dẫn trong app, Xem quá trình lắp, sao một lần mỗi mẫu | Bé lớp 3 lắp lại được mô hình của anh/chị trong app. Tỉ lệ mảnh mới nhìn thấy được ≥ 80 % trên 20 mô hình | M–L |
| 6 | **Sân khấu và tiện ích:** Nổ tung (nếu chưa kéo lên GĐ3), đối xứng (đặt một mảnh, app đặt thêm mảnh đối xứng; mảnh có phiên bản trái/phải thì tự đổi), Soi tầng, chọn nhiều + nhân bản cụm, Sân khấu (4 phông, chụp PNG), thêm mảnh theo góp ý | Đối xứng không bao giờ tạo va chạm. Nhân bản cụm giữ đúng liên kết | M–L |
| 7 | **Khớp quay:** kiểu nối bản lề, bàn xoay, kẹp–thanh. Trường góc `a`. Va chạm hộp xoay (SAT) cho mảnh không vuông góc. Thanh trượt góc nắc 15°. Thêm khoảng 60 mảnh (tay, cánh, lá cọ, cần cẩu…) | Fuzz va chạm SAT so với vét cạn. Bản lề 0–180° không xuyên mảnh | L |
| 8 | **Thử thách và bộ mẫu:** thêm 20 bộ mẫu ngoài 10 mẫu của v1 (dựng bằng script, chủ dự án duyệt ảnh), thử thách nhẹ có tính toán (tháp cao đúng 9,6 cm, dùng đúng 20 mảnh, nhà đối xứng) | Duyệt bảng ảnh 20 mẫu. Mọi mẫu lắp được và sinh đủ hướng dẫn | M |

## 15. Chia phiên và effort

| Phiên | Phạm vi | Effort |
|---|---|---|
| 1 | GĐ0a: đọc LDraw, làm phẳng, BFC, pháp tuyến, tách núm | **high** |
| 2 | GĐ0a: điểm nối (LDCad + suy luận), hộp va chạm, LOD, nén | **high** |
| 3 | GĐ0a: tuyển `parts-v1.csv`, mã Rebrickable/BrickLink, màu, bảng duyệt | **high** (sai mã là mua nhầm) |
| — | **Cổng mảnh** | — |
| 4–5 | GĐ0b: lõi ghép nối, fuzz, bench | **high** |
| 6–8 | GĐ1: renderer + chất lượng, máy trạng thái, bóng mờ, preview, đo | **high** |
| — | **Cổng hình ảnh + Cổng chơi thử** | — |
| 9–11 | GĐ2 | high / medium |
| 12–14 | GĐ3 (gồm 10 mô hình mẫu) | medium |
| 15–17 | GĐ4 (gồm các bước lắp cơ bản) | high |
| — | 1–2 tuần các bé dùng thật v1 | — |
| 18 | Chỉnh thông số theo số liệu dùng thật (mục 12.1) | medium |
| 19–20 | GĐ5 | high |
| 21–22 | GĐ6 | medium |
| 23–25 | GĐ7 | high |
| 26+ | GĐ8 | medium |

**v1 (GĐ0a–4) ≈ 17 phiên + 3 cổng duyệt.** Nếu buổi chơi thử cho thấy sơ đồ cử chỉ chưa ổn, cộng 1–2 phiên làm lại GĐ1.

## 16. Giao diện và khả năng tiếp cận

- Mọi nút có `aria-label` tiếng Việt. Bé chưa biết chữ vẫn dùng được nhờ biểu tượng và giọng đọc.
- Đọc tên mảnh và tên màu khi chọn, mỗi lần cách nhau ≥ 1,5 s, gọi `cancelSpeech` trước khi đọc (bẫy Tô Màu).
- `prefers-reduced-motion`: tắt bẹp, hạt và 360° tự chạy. Chuyển camera còn 150 ms.
- Không quảng cáo, không link ra ngoài trong giao diện của bé. Link BrickLink và Rebrickable chỉ có trong trang Cách mua của PDF.
- Không có thư viện công khai. Chia sẻ chỉ qua file do phụ huynh gửi.

## 17. Bẫy

- **Chỉ một chỗ nhận pointer.** Nếu để `camera-controls` tự nghe sự kiện, kéo bóng mờ sẽ xoay luôn camera.
- **`touch-action: none`** trên canvas và khay. Trên iOS chặn thêm `gesturestart`. Đặt `-webkit-touch-callout: none` và `user-select: none` để nhấn giữ không hiện menu.
- **Kéo từ khay đi qua ranh giới DOM:** dùng `setPointerCapture` ở phần tử bắt đầu, hoặc nghe `pointermove` ở `document` trong lúc kéo.
- **`navigator.vibrate` không có trên iOS.** Kiểm tra trước khi gọi.
- **Đổi trục LDraw → three.js là phép quay 180° quanh X**, không phải đảo dấu một trục. Đảo một trục là soi gương: mảnh trái thành mảnh phải và mặt bị lật trong ra ngoài. Mọi chuyển đổi chỉ nằm trong `space.ts`.
- **BFC của LDraw:** subfile có ma trận định thức âm, hoặc có `INVERTNEXT`, thì đảo chiều mặt. Làm sai là mặt bị khuyết khi bật culling.
- **Primitive dùng chung cho mặt cầu và mặt nón** làm pháp tuyến mượt sai. Chỉ làm mượt theo đường điều kiện. Mảnh nào lỗi thì đánh dấu trong `parts-v1.csv` để làm mượt theo góc.
- **InstancedMesh:**
  - Tạo `instanceColor` ngay từ đầu.
  - Đặt `frustumCulled = false` hoặc tính lại bounding sphere.
  - Cấp dung lượng gấp đôi rồi đặt `count`. Không tạo lại lưới mỗi lần lắp.
  - Lưới con phần in dùng **chung** buffer ma trận với lưới màu chính.
- **`frameloop="demand"`:** gọi `invalidate()` sau mọi thay đổi, trong lúc camera chuyển cảnh, và cho khung "bản đẹp khi dừng tay".
- **N8AO và bóng mờ trong suốt:** vẽ bóng mờ, viền và đường rơi **sau** lượt AO, nếu không AO sẽ làm bẩn bóng mờ.
- **`<Environment preset>` của drei tải HDR từ CDN**, nên hỏng khi offline. Dùng `RoomEnvironment`.
- **Safari giới hạn số WebGL context.** Chỉ có một renderer phụ. Khi rời xưởng: `dispose()`, `forceContextLoss()`, kích thước canvas về 0.
- **Hai mặt chỉ chạm nhau không phải va chạm.** Hộp va chạm phải co vào dung sai. So sánh bằng `<`, không dùng `<=`.
- **Mã LDraw ≠ mã BrickLink** ở nhiều mảnh (hậu tố `b`, mảnh in, mảnh đổi khuôn). Lấy qua API Rebrickable, có test.
- **Khoá Rebrickable** chỉ nằm trong `.env.local` cho script. Không có tiền tố `VITE_`, không bao giờ vào bundle.
- **Snapshot phải liệt kê đủ mọi store của DB**, cùng version với `modelRepo`. Bên nào mở trước sẽ tạo DB. Nếu thiếu store, `onupgradeneeded` của bên kia không chạy nữa.
- **Đổi tài khoản khi đang lắp:** `AccountProvider` gỡ app trước khi thay kho. Tự lưu theo nhịp 1,5 s và khi `pagehide`. Không trông vào lần lưu lúc unmount.
- **Thương hiệu:**
  - Prompt ảnh bìa phải cấm logo và chữ.
  - Không viết "LEGO" trong `catalog.ts`, `index.html`, manifest PWA và mô tả.
  - Bỏ `stud-logo*`.
- **Bẫy cũ của repo:**
  - `Grade.Preschool = 0` là falsy, dùng `isPreschool`.
  - `.discovery-hub button { font: inherit }` xoá kiểu chữ của nút. Dùng selector `.bk-root .bk-btn`.
  - Đi thẳng URL `/bricks` có thể mất học sinh đang chọn.
  - Tab ẩn thì dừng `useFrame` và 360°. Không đo fps khi tab đang ẩn.

## 18. Tiêu chí nghiệm thu cuối (v1, sau GĐ4)

1. Chủ dự án đã duyệt 12 bảng mảnh và 6 ảnh cảnh mẫu.
2. Chủ dự án tự thử theo kịch bản, sau phần hướng dẫn lần đầu, lắp được nhà có cửa sổ và xe có bánh ở cả chế độ thường lẫn chế độ bé, trên iPad, tablet Android và laptop. Mục tiêu "bé tự lắp được" đo bằng số liệu dùng thật (mục 12.1) sau khi phát hành.
3. Không có trạng thái va chạm nào xảy ra được: fuzz 100.000 thao tác xanh. Mảnh không nối chỉ xuất hiện sau thao tác tháo, và luôn được đánh dấu.
4. Mô hình 2.000 mảnh xoay ≥ 45 fps ở mức tự chọn, đo trên **cả iPad và tablet Android** của nhà. Chạm → bóng mờ ≤ 50 ms.
5. Thoát hoặc tải lại mất tối đa 1,5 s thao tác. Hoàn tác và làm lại 200 bước đúng.
6. Mô hình làm trên máy A thấy trên máy B sau khi đăng nhập cùng tài khoản Google.
7. PDF có dấu tiếng Việt đúng. Tổng danh sách mảnh bằng số mảnh. Phát lại các bước lắp ra đúng mô hình gốc và không bước nào có mảnh lơ lửng. File `.ldr` mở bằng Studio hoặc LeoCAD khớp ảnh trong app. Chủ dự án đọc PDF của 3 mô hình mẫu và xác nhận nhìn các bước là hiểu.
8. Có 10 mô hình mẫu đã được duyệt. Bấm "Lắp lại cho riêng em" thì có một bản sao trong tủ của bé.
9. Trang Ghi công đủ tác giả và giấy phép.
10. `npx vitest run` và `npm run build` xanh.

## 19. Ngoài phạm vi đợt này

- Technic đầy đủ (dầm, trục, bánh răng chạy được). Chỉ cân nhắc sau GĐ8.
- Minifig. Mảnh dẻo hoặc dây. Mô phỏng vật lý.
- Lắp chung qua mạng. Thư viện mô hình công khai.
- AI dựng mô hình theo lời bé nói.
- Ước tính giá tiền.
- Nhập file `.ldr` hoặc `.io` từ ngoài vào. Engine đọc được `.ldr`, nhưng giao diện nhập để sau.
- Xem bằng AR (WebXR). Ý tưởng "wow" cho sau v2.

## 20. Nhật ký lệch plan

(ghi ngày · mục · lý do · quyết định)

- 14/10 · toàn bộ · Chủ dự án nhấn mạnh 4 yêu cầu (đa dạng, tinh xảo, ghép trực quan, điều khiển dễ) · Bỏ phương án đầu (lưới ô + 47 mảnh tự dựng hình). Chuyển sang dây chuyền LDraw + hệ điểm nối 24 hướng.
- 14/10 · D11, 7.2–7.7, 11.4, 12, 14 · Đối chiếu với một bản phương án khác (Gemini) do chủ dự án gửi.
  - **Nhận 6 điểm:**
    - đưa các bước lắp vào v1;
    - thêm 10 mô hình mẫu để bé lắp lại cho riêng mình;
    - thêm hiệu ứng Nổ tung;
    - bỏ thao tác nhấn giữ trên khung 3D;
    - bóng mờ hiện ngay khi chọn mảnh;
    - chế độ bé chỉ lắp từ dưới lên.
  - **Không nhận:**
    - Lưới ô với 30–50 mảnh: trái với yêu cầu đa dạng và tinh xảo.
    - Đặt mảnh sát mặt bên mà không cần núm nối: ngoài đời mảnh sẽ rơi.
    - Cắt bước theo tầng y: mảnh treo dưới sẽ lơ lửng.
    - Lưu màu bằng mã hex: không đổi được sang mã màu thật.
    - Thêm bảng mới trên server: đã có snapshot đồng bộ.
    - jsPDF với font mặc định: lỗi dấu tiếng Việt.
    - Zustand + zundo: repo không dùng, lịch sử lưu dạng lệnh nhẹ hơn.
    - Chụp ảnh thu nhỏ bằng `toDataURL` trên canvas chính: phải bật `preserveDrawingBuffer`, làm chậm cả cảnh.
- 14/10 · D4, 4.1 · Chủ dự án chốt:
  - Đồng ý dùng LDraw (CC BY) và shadow LDCad (CC BY-SA), có ghi công. Điều kiện: không phát sinh chi phí.
  - Khoá Rebrickable tên `REBRICKABLE_KEY`, chỉ nằm trong `.env.local`, chỉ script dùng.
  - Script danh mục là lệnh chạy tay, không gắn vào `prebuild` hay `predeploy`, nên CI không cần khoá.
- 14/10 · mục 2 · Chủ dự án chốt 8 câu còn lại (tóm tắt ở đầu mục 2). Thay đổi kéo theo:
  - Không làm cho điện thoại.
  - PDF ưu tiên thông tin trẻ đọc được, file mua hàng đưa vào mục "Cho người lớn".
  - Khoá Rebrickable thành tuỳ chọn.
  - Không có buổi các bé chơi thử, thay bằng chủ dự án tự thử cộng số liệu dùng thật (mục 12.1) và một phiên chỉnh thông số sau v1.
  - Nghiệm thu các bước lắp bằng test phát lại, không đòi lắp bằng gạch thật.
- 14/10 · 4.2, 13 · Catalog nằm ở `public/bricks/catalog.json` + `public/bricks/parts/<nhóm>.bin`, tải bằng fetch lúc chạy (thay vì `src/bricks/catalog/*.generated.json`), để JS chunk nhỏ và được service worker cache. Bảng duyệt là `.webp`.
- 14/10 · 5.3 · Mặt bàn là **chỗ đỡ**, không phải tấm nền giới hạn. Mảnh vẫn bám lưới núm ảo của bàn khi đặt trực tiếp lên bàn. Mảnh thò xuống dưới mặt bàn (ví dụ bánh xe gắn vào tấm trục đang nằm trên bàn) được phép nếu nối vào một cụm: **cả cụm tự nâng lên** (`Check.lift`), giống lắp bánh thì xe kênh lên. "Lơ lửng" = cụm không chạm bàn.
- 14/10 · 5.3 · Ngưỡng va chạm 2,5 LDU (không phải 1): hộp voxel 2 LDU có thể phình tới 2 LDU ở mặt cong; va chạm thật giữa các mảnh luôn ≥ 4 LDU. Hộp va chạm được khoét thể tích núm/chốt và lòng lỗ của chính mảnh; núm đâm thân mảnh khác được kiểm riêng.
- 14/10 · 6 · Bỏ 29119/29120 (shadow chỉ có lỗ nhận ở khía bên, không có ở đáy). Bộ mảnh v1: 295 mảnh (gồm 34 tấm in, 4 bộ ghép).
- 14/10 · 6 · Bỏ 33051 (quả táo: chỉ có chốt nghiêng). Bộ mảnh v1: **294 mảnh**.
- 15/10 · 0.3 · Chủ dự án đóng gói GĐ0a–4 khi **chưa qua cổng nào** (mảnh, hình ảnh, chơi thử), và cho tạm gác việc duyệt để chuẩn hoá lệch plan trước. Ba cổng vẫn **bắt buộc trước nghiệm thu v1** (mục 18). Nếu cổng chơi thử đổi sơ đồ cử chỉ thì làm lại phần GĐ2 liên quan.
- 15/10 · D1, 3 · Xưởng nằm trong **Góc Thủ Công**: `CraftId 'bricks'`, thẻ trong `CRAFT_CATALOG`, route `/bricks`. Không thêm `ModeId` riêng ở sảnh. Mầm non vào qua Góc Thủ Công (đã có trong danh sách sảnh Mầm non).
- 15/10 · D1, 16 · Phần Ghi công trong xưởng không nhắc tên thương hiệu và không có link ra ngoài. Chỉ ghi tên nguồn dữ liệu và giấy phép.
- 15/10 · 4.2 · Nhóm dữ liệu sinh ra:
  - Toạ độ lưu Int16 = LDU×8 (`posScale` 8), không phải ×4.
  - Hộp va chạm tối đa 96 hộp/mảnh (voxel 2 LDU), không phải 16.
  - Không xuất buffer đường viền LDraw. Viền mảnh mới trong ảnh hướng dẫn vẽ bằng mặt sau phóng to (`render/shooter.ts`). Lượt viền hậu kỳ ở xưởng (mục 8.2) vẫn chưa làm.
  - Ghi công gom theo thư viện (`catalog.credits`: tác giả, số file theo giấy phép), không có file `credits.generated.json` riêng.
- 15/10 · 13 · Bố cục code khác cây thư mục ở mục 13:
  - `space/index/connect` gộp trong `engine/world.ts`.
  - Đổi LDraw → three.js nằm ở `render/BrickCanvas.tsx` (`LDRAW_TO_WORLD`).
  - Renderer tách thành `loader/materials/modelMeshes/BrickCanvas/icons/shooter`.
  - UI gồm `BrickStudio`, `Editor`, `Workbench` (khay, thanh chế độ, bong bóng, coach đều ở trong Workbench) và `ExportSheet`.
  - Đo bằng `engine/bench.test.ts` (`BENCH=1`), không có `scripts/bricks-bench.mjs`.
- 15/10 · 14 GĐ0b · Test "mọi mảnh × mọi hướng" dùng đế **gạch 1×1**, không dùng 2×4. Lý do: đĩa 2×2 chỉ có lỗ ở tâm nên không ngồi được giữa 4 núm của gạch 2×4, đúng như ngoài đời. Ba ca bị chặn vì va chạm có thật được ghi trong test:
  - 3957a: núm đế nằm trong thân.
  - 3633: hàng rào nằm úp, cắm vào miệng lỗ mặt trong.
  - 60212: chắn bùn lật ngược.
- 15/10 · 14 GĐ0b · Gate fuzz 100.000 thao tác: `BRICKS_STRESS=1` trên `engine/stress.test.ts`.
  - Thao tác gồm: lắp mọi hướng, tia chéo, lắp dưới có nâng cụm, dời, tháo, sơn, hoàn tác/làm lại.
  - Kiểm: chỉ mục khớp bản dựng lại, không chồng lấn, mã hoá/giải mã giữ nguyên.
  - Mảnh lơ lửng mới chỉ được xuất hiện khi lắp vào cụm vốn đã lơ lửng sau một lần tháo.
  - Bản mặc định chạy 2.000 thao tác.
- 15/10 · 14 GĐ0b, 19 · Engine có bộ đọc `.ldr` (`export/files.ts` `fromLdraw`), chỉ dùng cho test round-trip. Chưa có giao diện nhập file.
- 15/10 · 11.3 · Chưa có khoá Rebrickable, nên **không xuất BrickLink XML** (đúng mục 4.1). CSV Rebrickable chỉ bật khi mọi dòng có mã. Không đoán mã.
- 15/10 · 12 · Mô hình mẫu:
  - Cá và chậu hoa thay cho khủng long và rùa.
  - Một số mẫu dưới 20 mảnh (tên lửa 10, robot 11), test hiện cho phép 8–80 mảnh. **Chưa đạt 20–60.** Nâng cỡ mẫu khi chủ dự án duyệt bảng mẫu.
- 15/10 · 12 · Huy hiệu lưu trong `profile.bricks` của xưởng (5 huy hiệu, không cộng sao), không đi qua hệ thành tích chung. Huy hiệu "Lắp theo hướng dẫn lần đầu" chờ GĐ5.
- 15/10 · 12, 14 · Kéo sớm lên v1: Nổ tung (thanh trượt) và Xem quá trình lắp (▶). Code "Lắp theo hướng dẫn" (GĐ5) đã có nhưng **ẩn** cho tới GĐ5.
- 15/10 · 7.2 · Chủ dự án: chuột phải kéo = xoay camera (trước là dời khung); chuột giữa kéo = dời khung; chuột trái giữ nguyên. Menu chuột phải bị chặn trên khung 3D.
- 15/10 · 7.2, 7.3 · Cảm ứng (chủ dự án duyệt 4 mục): lọc lòng bàn tay (> 40 px), tay nắm ✥ trên bóng mờ, chạm đúp chỗ trống = vừa khung, hai ngón vặn = xoay quanh trục đứng (tắt ở chế độ bé). Còn đề xuất chưa làm: nút xoay ◀ ▶ 45° cho chế độ bé; ghi số liệu "định chạm mà thành xoay" để chỉnh TAP_SLOP/lệch ngón. Chưa kiểm trên iPad/tablet thật.
- 15/10 · 8.1 · Chủ dự án: bóng đổ quá mạnh, nền trắng làm mất khối → sân khấu tối + bố trí đèn mới (mục 8.1). Nguyên nhân gốc ảnh cháy sáng: EffectComposer tắt tone mapping của renderer, mức Cao/Vừa không có tone mapping; đã thêm `<ToneMapping>` Neutral. AO giảm 1,1 → 0,75. Ảnh PDF và icon khay vẫn nền sáng (renderer phụ riêng).
- 15/10 · 8.3 · ~~"Vẽ đẹp khi dừng tay" bằng đổi DPR~~ — **đã bỏ** (chủ dự án báo nhoè + bóng mờ khi xoay: đổi DPR làm canvas và bộ đệm EffectComposer cấp phát lại). DPR cố định theo mức: Cao ≤ 2, Vừa ≤ 1,5, Thấp 1; máy yếu thì hạ mức. Tự chọn mức: đo 3 s sau khi mở (bỏ qua khi tab ẩn), Cao < 40 fps → Vừa, Vừa < 28 fps → Thấp, tối đa 2 lần; chỉ khi chưa ai chọn tay.
- 15/10 · 7.5 · Hiệu ứng lắp: bản sao sáng của mảnh rơi 6 LDU trong 120 ms rồi tan (mảnh thật đã ở đúng chỗ ngay). Tháo: 10 hạt cùng màu văng ra. Giảm chuyển động: tắt cả hai.
- 15/10 · 7.1 · Nhóm con của khay suy từ tên Việt/cờ in (`content/groups.ts`), vì catalog chưa có cột nhóm con (pipeline cần `tools/ldraw`). Cửa sổ xem mảnh: ảnh xoay 16 khung vẽ bằng renderer phụ dùng chung, không mở WebGL context mới. Mở bằng nhấn giữ 500 ms hoặc chuột phải lên thẻ.
- 15/10 · 7.1 · Chủ dự án: bảng màu chiếm chỗ của khay mảnh → **thanh màu gọn**: nút màu đang chọn + 4 màu vừa dùng; bảng đủ màu bật lên phía trên khay khi bấm (chạm ra ngoài hoặc Esc thì đóng).
- 15/10 · 6.2, 7.7 · Chế độ bé: 30 mảnh đúng 6 nhóm (Gạch, Tấm, Mái, Tròn, Cửa, Cây) trong `PRESCHOOL_PARTS`; bỏ 3 mã cũ không còn trong catalog. Nam châm × 1,6; mọi gợi ý (toast) có giọng đọc; nút/ô màu to hơn 25 %; camera không xuống dưới bàn (85°).
- 15/10 · 7.6 · Nút ⬒ đổi góc lần lượt Nghiêng → Trước → Phải → Trên. Bàn mờ 30 % khi camera xuống dưới mặt bàn.
- 15/10 · 8.4 · Không có WebGL: khung báo không hiển thị được 3D, vẫn tải danh sách mảnh (CSV). Khôi phục context: dựng lại lưới mô hình.
- 15/10 · 11 · PDF: góc Trước có thước cm; mỗi bước giữ góc cũ nếu còn thấy ≥ 50 % mảnh mới (đo bằng bộ đệm ID 256×192), không thì đổi sang góc nghiêng sau và in "↻ Xoay mô hình"; bước nối hai cụm rời in khoảng cách (núm) và gợi ý tấm nền; chế độ bé 3 mảnh/bước; nút Chia sẻ (Web Share có file) khi trình duyệt hỗ trợ.
- 15/10 · 12 · 10 mẫu nâng lên **20–30 mảnh** (thêm bối cảnh: ao, bãi cỏ, bệ phóng, mặt biển; chậu tròn 4×4…); test siết về 20–60. Ảnh mẫu và bảng duyệt chụp lại trên sân khấu tối.
- 15/10 · 4.2 · Pipeline: `--check` đỏ khi file LDraw thiếu `!LICENSE`; ghi `docs/brick-studio/needs-review.txt` (lưới rút gọn, không lỗ nhận, không núm, hộp va chạm chạm trần). Chưa chạy lại được trên máy này (thiếu `tools/ldraw`).
- 15/10 · 10.2, 12.1 · Tủ: mở lại bản sao dự phòng (.json) thành mô hình mới; nhắc khi phần xưởng > 6 MB. Số liệu thêm `rotateBeforePlace` và `nearTap` (định chạm mà thành xoay). Mọi hộp thoại có focus trap, Esc, nền `inert`.
- 15/10 · 4.2, 8.2 · **Lỗi núm "trong suốt"** (có từ GĐ0a, nền tối làm lộ rõ): `stud.dat` tham chiếu vách núm bằng ma trận định thức âm, đoạn làm phẳng núm trong `bricks-parts.mjs` không đảo chiều mặt → vách quay vào trong, bị cắt mặt sau. Đã vá pipeline (đảo thứ tự đỉnh khi det < 0) và vá lúc nạp (`fixStudWalls`, không đổi gì nếu dữ liệu đúng). Thêm bóng che nướng sẵn ở chân núm (`shadeStudBase`, vật liệu `Materials.stud`). Đèn chính nâng lên ~65° để mặt trên sáng hơn mặt đứng.
- 15/10 · 7.2 · Chủ dự án làm rõ: **chuột phải bấm = xoay mảnh đang cầm** (như R / ↻), kéo chuột phải vẫn xoay camera. ↻ lướt hướng theo thứ tự 0° → 90° → 180° → 270° rồi mới tới hướng nằm nghiêng; sửa lỗi cũ tìm hướng hiện tại bằng cả vị trí (xoay 90° lệch tâm nửa núm → luôn nhảy về đầu danh sách).
- 15/10 · 7.1 · Chủ dự án: khay chiếm 1/3 màn hình → **khay 2 hàng ~160 px**: [tìm + nhóm + nhóm con ngay sau nhóm đang chọn] và [thẻ mảnh 86×100 | màu | xoay]; ẩn thanh cuộn, lăn chuột cuộn ngang. Nhãn thẻ bỏ tiền tố trùng tên nhóm ("Gạch 2×4" → "2×4" trong nhóm Gạch; nhóm lẫn loại, Vừa dùng, tìm kiếm giữ tên đầy đủ).
- 15/10 · 7.4 · **Chọn tầng khi tia lọt khe** (góp ý chủ dự án): trước đây chỉ "leo lên" khi tầng chạm không còn chỗ nào hợp lệ, nên mảnh dài bị engine tự XOAY rồi nhét vào tầng trống bên dưới. Luật mới: ở tầng chạm không có chỗ hợp lệ đúng hướng đang cầm, hoặc chỗ đó bị che sát phía trên (< 6 LDU, không đủ để ấn xuống núm) → đậu lên mặt cao nhất dưới chân mảnh, giữ hướng; chỉ khi không được mới dùng hướng khác ở tầng thấp. Đặt cạnh mảnh khác cùng mặt vẫn như cũ. Test 3 ca (rãnh 2 tầng, mảnh nhỏ vừa khe, dưới mái cao). Mẫu xe đua giờ giữ đúng thân dọc (trước bị xoay ngang) — ảnh chụp lại.
- 15/10 · 6.2 · **Nhóm mới "Tấm nền"** (yêu cầu chủ dự án), đứng đầu khay: tấm 8×8 (41539), 8×16 (92438), 16×16 (91405), đế mỏng 32×32 (3811). Máy chưa có `tools/ldraw` nên hình học dựng theo thủ tục bằng `scripts/bricks/baseplates.mjs` (khối tấm + núm dùng chung, `procedural: true`) và nối vào catalog; mã thật nên BOM/.ldr đúng. Các dòng đã có trong `parts-v1.csv` + nhóm `base` trong `select.mjs` → lần chạy pipeline đầy đủ sẽ thay bằng hình LDraw thật. Chế độ bé có 8×8 và 16×16. Đế 32×32 có lỗ nhận ở đáy (để bám lưới bàn) nên engine cho phép đặt nó lên núm — ngoài đời đế mỏng đáy phẳng không làm vậy được; chấp nhận.
- 15/10 · 7.4 · Hiệu năng mảnh lớn: tấm 32×32 có 2.048 điểm nối → mỗi lần rê chuột ~5,7 s. Mảnh > 64 điểm nối mỗi loại chỉ xét 16 mục tiêu gần chỗ chạm và, với mỗi mục tiêu + hướng, 6 điểm nối làm tâm mảnh rơi gần chỗ chạm → 32×32: ~32 ms, 16×16: ~9 ms. Mảnh thường giữ nguyên thuật toán (10 mẫu dựng ra giống hệt trước).
- 15/10 · 14 GĐ3 · Ảnh bìa sinh bằng ImageGen theo `public/bricks/cover-art.md`, không dùng `docs/brick-studio/cover-prompt.md`.
