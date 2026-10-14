# Xưởng Gốm kế hoạch sản phẩm và triển khai

Ngày lập: 14/10/2026. Trạng thái: kế hoạch đề xuất để triển khai; chưa xây module. Các mốc hiệu năng và thời lượng dưới đây là mục tiêu cần đo bằng prototype, không phải kết quả benchmark.

Xưởng Gốm là không gian sáng tạo 3D cho Genius Kids: bé biến một cục đất thành bình, bát hoặc cốc bằng tay, phủ men, vẽ trang trí, nung và đặt tác phẩm vào bộ sưu tập. Trải nghiệm cốt lõi là đất phản hồi ngay dưới ngón tay và thành phẩm giữ được dấu ấn của bé.

## 1. Các quyết định nền tảng

| Nội dung | Phương án triển khai |
|---|---|
| Vị trí | Module riêng tại `/pottery/*`, `ModeId: pottery`, thẻ sảnh cạnh Xưởng Tô Màu, dành cho mọi lớp. |
| Thiết bị | Ưu tiên tablet cảm ứng; hỗ trợ chuột và bút cảm ứng. “Dùng tay” là thao tác trên màn hình, chưa có nhận diện bàn tay bằng webcam. |
| Công nghệ | Three.js qua React Three Fiber, dùng phiên bản đang có trong repo. Một canvas 3D cho phiên làm gốm. |
| Cơ chế tạo hình | Biên dạng tròn xoay quanh trục đứng; có mặt ngoài, lòng trong, miệng và đáy. Thay đổi biên dạng theo vùng chạm. |
| Mức mô phỏng | Mô phỏng có trợ giúp: đất dẻo, giới hạn độ mỏng và độ cong; thao tác sai vẫn sửa được. Mô phỏng vật lý đất sét đầy đủ nằm ngoài v1. |
| Ba bước chính | **Nặn → Trang trí → Nung**. Làm khô và nung sơ nằm trong đoạn chuyển bước ngắn, có thể bỏ qua. |
| Vai trò bàn xoay | Tự quay khi nặn; dừng khi vẽ chi tiết; có chế độ quay chậm để vẽ dải hoa văn. |
| Sáng tạo và thử thách | Chơi tự do luôn mở, không chấm đẹp/xấu. Nhiệm vụ làm theo mẫu là lựa chọn thêm. |
| Thành phẩm | Lưu, đặt tên, xem 360°, trưng bày, chụp ảnh và tạo bản sao để sửa. |
| Dữ liệu v1 | Lưu tác phẩm trên thiết bị bằng IndexedDB, tách theo tài khoản và hồ sơ; xuất/nhập bản sao để chuyển máy. Tiến độ nhẹ theo hệ thống hồ sơ hiện có. |
| Điểm ưu tiên | Cảm giác nặn → lòng bình đúng → nét vẽ đúng → men đẹp → mở lò → nội dung mở rộng. |

### Tham khảo trò chơi và nghề gốm

[Let's Create! Pottery 2 của Infinite Dreams](https://potterygame.com/) có vòng chơi tạo hình, trang trí, nhận yêu cầu và xây bộ sưu tập. Đây là nguồn tham khảo phù hợp với mô tả của đại ca. Xưởng Gốm lấy cảm hứng từ sự trực tiếp của thao tác và niềm vui hoàn thành tác phẩm; phát triển mỹ thuật, nội dung và giao diện riêng cho Genius Kids.

Quy trình giáo dục rút gọn dựa trên tạo hình, làm khô, nung sơ, tráng men, nung men và làm nguội. Trong game, hai khâu đầu sau tạo hình được gộp thành đoạn chuyển cảnh; thời gian lò được tăng tốc. Không đưa thời gian vài giây trong game thành kiến thức về thời gian nung thật. Tham khảo [Ceramic Process của Glendale Community College](https://glendale.edu/academics/academic-divisions/visual-performing-arts/ceramics/study-guides/ceramic-process.html).

## 2. Nền tảng hiện có và điểm tích hợp

Những đường dẫn trong mục này đã được đối chiếu với repo khi lập kế hoạch.

| Thành phần hiện có | Cách sử dụng |
|---|---|
| `package.json`, `package-lock.json` | Có React 19, Three.js 0.181.2, R3F 9.4.2, drei 10.7.7, Vitest, fake-indexeddb. Không cần thêm thư viện vật lý cho lõi. |
| `App.tsx` | Đăng ký route tải lười, đi qua `ProtectedRoute` như Xưởng Tô Màu. |
| `src/components/hub/catalog.ts` | Thêm `pottery` vào `ModeId`, danh mục và lựa chọn mầm non. |
| `src/components/hub/catalog.test.ts` | Cập nhật hợp đồng thứ tự thẻ và khả năng truy cập theo lớp. |
| `src/pages/ModeSelectionPage.tsx` | Điều hướng thẻ tới `/pottery`. |
| `src/components/hub/HubShell.tsx`, `HubArt.tsx` | Dùng vỏ sảnh, token hiện tại; thêm ảnh bìa cho thẻ. |
| `src/components/planetmaker/terrainOps.ts` | Tham khảo cách tách engine khỏi React/Three. Không dùng lại thuật toán địa hình cho gốm. |
| `src/components/planetmaker/persistence/repository.ts` | Tham khảo lưu phiên bản và bản sao phục hồi. |
| `src/coloring/progress/artworkRepo.ts` | Tham khảo kiểm tra revision khi lưu và ngăn ảnh thu nhỏ cũ ghi đè dữ liệu mới. |
| `services/rewardService.ts`, `src/coloring/progress/progress.ts` | Dùng pipeline thưởng hiện có, thêm khóa chống thưởng lặp. |
| `types.ts`, `src/contexts/StudentContext.tsx` | Tiến độ nhẹ và xóa dữ liệu tác phẩm khi xóa hồ sơ. |
| `src/contexts/AccountContext.tsx` | Xác định phạm vi tài khoản và xử lý chuyển tài khoản. |
| `pwa/sw.ts`, `pwa/download.ts`, `vite.config.ts` | Tài nguyên offline và đường dẫn theo `BASE_URL`. |
| `services/account/snapshot.ts` | Snapshot tài khoản có giới hạn 20 MiB; artwork dung lượng lớn không tự động đưa vào snapshot v1. |

Vite hiện đưa `glb`, `ktx2`, `bin`, ảnh và âm thanh thông dụng vào manifest offline; chưa liệt kê `hdr`/`exr`. Vì vậy môi trường phản chiếu v1 có thể dựng tại runtime bằng `RoomEnvironment` và PMREM. Nếu chọn HDR đóng gói, phải bổ sung manifest cùng kiểm tra tải offline.

## 3. Trải nghiệm từ đầu đến cuối

### Phiên chơi đầu tiên

1. Vào xưởng, nhìn thấy bàn xoay và cục đất; nút chính là **Bắt đầu nặn**. Chưa bắt chọn một danh sách vật liệu.
2. Gợi ý bằng bàn tay hoạt họa: **Kéo lên cho cao hơn**. Chỉ chuyển gợi ý khi bé làm được hoặc bấm bỏ qua.
3. Gợi ý **Chạm vào thân để thắt lại**; sau đó **Kéo ra cho bụng bình rộng hơn**.
4. Nút **Mở miệng** mở lòng bình tự động, sau đó bé có thể chỉnh độ rộng. Bé bỏ qua thì ứng dụng hỗ trợ trước khi trang trí.
5. Chọn **Trang trí**. Đất chuyển sang trạng thái khô/nung sơ trong 2–4 giây, có bỏ qua.
6. Bé chọn men, màu, dùng cọ hoặc con dấu. Có xem trước độ bóng sau nung.
7. Chọn **Nung tác phẩm**. Lò sáng dần, chuyển màu rồi làm nguội; tổng khoảng 8–12 giây, có bỏ qua.
8. Mở lò, tác phẩm xuất hiện trên bệ sáng mềm. Bé đặt tên hoặc giữ tên gợi ý, chụp ảnh, chọn **Đặt lên kệ**.

Mục tiêu: một bé mới dùng hoàn thành tác phẩm đầu trong khoảng 5–8 phút với ít lời hướng dẫn. Đây là giả thuyết để kiểm tra bằng chơi thử.

### Những lần quay lại

Xưởng hiển thị tác phẩm đang làm dở trên bàn, nút **Làm tiếp**, **Nặn tác phẩm mới**, và **Kệ gốm của bé**. Mẫu gợi ý nằm bên cạnh để khơi ý tưởng, không thay thế cục đất bằng một sản phẩm hoàn thiện ngay khi bắt đầu.

Vòng chơi mở rộng: sáng tạo tự do → thử một kỹ thuật → làm một yêu cầu → trưng bày tác phẩm → thử màu hoặc kiểu dáng khác. Không cần tiền ảo hay thời gian chờ để được nặn tiếp.

### Ba mức trợ giúp

| Mức | Mặc định theo lớp | Khác biệt |
|---|---|---|
| Làm quen | Mầm non | Vùng chạm rộng, đất thay đổi chậm, 8 màu nổi bật, tự mở lòng bình, gợi ý đọc to. |
| Sáng tạo | Lớp 1–2 | Toàn bộ công cụ cơ bản, 16 màu, mẫu gợi ý tùy chọn. |
| Khéo tay | Lớp 3–5 | Điều chỉnh cỡ cọ, độ đậm, độ sâu lòng bình và nhiệm vụ chi tiết hơn. |

Bé luôn đổi được mức trợ giúp; mức này không khóa quyền dùng màu, men hay chơi tự do.

## 4. Hợp đồng tương tác tạo hình

### Thao tác chính

| Ý định | Thao tác | Phản hồi |
|---|---|---|
| Cao hơn hoặc thấp hơn | Kéo vùng đỉnh/viền miệng lên hoặc xuống | Đế đứng yên; thân đổi chiều cao mềm, hạn chế phình bất ngờ. |
| Thắt một vùng | Chạm và giữ ở thân khi bàn quay | Vùng ngang tương ứng thu nhỏ dần, có vòng sáng chỉ vùng tác động. |
| Phình một vùng | Kéo từ thân ra xa trục bình | Bán kính tăng tại vùng đó; hai phía nhìn thấy thay đổi đối xứng. |
| Thắt nhanh có kiểm soát | Kéo từ thân về phía trục bình | Bán kính giảm theo khoảng kéo. |
| Mở miệng | Chọn công cụ Mở miệng, chạm đỉnh rồi kéo ngang | Xuất hiện lòng bình; vành giữ đủ dày. Có nút mở tự động. |
| Chỉnh độ sâu | Ở công cụ Mở miệng, kéo dọc hoặc dùng thanh Độ sâu | Lòng sâu hơn/nông hơn nhưng không xuyên đáy. |
| Làm mịn | Chọn miếng bọt biển rồi vuốt thân | Làm mềm nếp gấp gần cọ, giữ cổ và bụng ngoài vùng chạm. |
| Quay để xem | Chọn Xem hoặc kéo vùng nền | Xoay góc nhìn; thao tác trên đất không kích hoạt camera. |
| Hoàn tác | Nút mũi tên, Ctrl/Cmd+Z | Hoàn tác cả một lượt chạm/kéo. Có làm lại. |

Việc chạm giữ làm thắt vùng là chủ đích thiết kế. Khi bắt đầu kéo, hệ thống ngừng chế độ thắt theo thời gian và chuyển sang kéo theo vị trí; không cộng cả hai hiệu ứng khiến đất thay đổi quá nhanh.

### Phân giải cử chỉ

- `pointerdown`: chọn thao tác theo công cụ và vùng hit; ưu tiên viền miệng/đỉnh trước thân. Mở rộng vùng bắt đỉnh ra khoảng 16–24 px CSS để dễ chạm.
- Trên thân: đợi khoảng 120–180 ms và ngưỡng di chuyển 6–10 px CSS. Giữ đứng yên kích hoạt thắt; kéo vượt ngưỡng kích hoạt nắn bán kính. Thông số điều chỉnh qua chơi thử.
- Khóa loại thao tác đến `pointerup`; kéo xiên không nhảy giữa chỉnh cao và chỉnh bán kính.
- Chiều kéo được tính so với trục chiếu lên màn hình: kéo sang phải ở bên trái bình có nghĩa là đi vào, không phải luôn làm phình.
- Lưu mặt phẳng kéo tại thời điểm bắt đầu và dùng pointer capture; không phụ thuộc việc con trỏ còn chạm mesh sau biến dạng. Chặn biên độ ngoài vùng làm việc.
- Khi đang nặn, camera cố định ở góc thuận tay, ngẩng nhẹ để thấy miệng. Nút Xem cho phép kiểm tra 360° rồi trở lại góc nặn.
- Ngón thứ hai kết thúc giao dịch nặn hiện tại trước khi zoom/orbit; không vẽ hoặc bóp đất đồng thời. Vẽ chi tiết có chế độ khóa camera.
- `pointercancel`, mất focus, đổi màn hình hoặc đổi hồ sơ phải kết thúc giao dịch, ngừng âm thanh và bỏ pointer capture.
- Dùng `touch-action: none` chỉ trên vùng thao tác, giữ cuộn và khả năng truy cập của các panel còn lại.
- Áp lực bút là tăng cường tùy chọn; chuột và cảm ứng thường vẫn sử dụng đầy đủ chức năng.

### Cảm giác đất

Âm thanh ma sát tăng nhẹ theo mức biến dạng, tiếng mô-tơ bám tốc độ bàn quay. Dưới ngón tay có vùng tác động mềm và vệt ẩm; độ bóng của đất tăng vừa đủ để nhìn thấy sống, lõm. Chạm tới giới hạn thì vật liệu chậm lại, kèm gợi ý **Vùng này đã đủ mỏng rồi** nếu cần; không đột ngột gãy hoặc mất tác phẩm.

Không cần bàn tay 3D luôn xuất hiện, vì dễ che vùng đang nặn. Hướng dẫn dùng bàn tay minh họa ngắn; tương tác thật dùng dấu cọ nhỏ có thể nhìn lệch khỏi ngón tay.

## 5. Phạm vi phát hành

### Bản thử xuyên suốt

Một loại đất, nặn cao/thấp và thắt/phình, mở lòng bình, một men bóng, 8 màu, cọ tự do, hoàn tác, nung ngắn, lưu một bản nháp và xem thành phẩm 360°. Bản này là mốc chứng minh trọn vòng chơi; chưa phải v1 phát hành.

### V1 hoàn chỉnh

- Ba dáng tạo được tự do: bình, bát, cốc không quai; đĩa sâu vừa và chậu không lỗ được hỗ trợ trong giới hạn biên dạng.
- Ba màu thân đất: nâu ấm, kem, xám. Khác biệt chủ yếu ở hình ảnh; chưa dạy công thức phối đất.
- Sáu kiểu hoàn thiện: bóng, satin, lì, chấm hạt, loang nhẹ, men rạn mỹ thuật. Rạn là hoa văn trên lớp men, không phải tác phẩm bị vỡ.
- 16 màu, phủ toàn bộ hoặc nhúng theo độ cao, cọ tự do, dải vòng, tẩy nét, 12 con dấu và 6 dải hoa văn.
- Có xem trước sau nung, nung và làm nguội, mở lò, kệ tác phẩm, xuất PNG và xuất/nhập bản sao chỉnh sửa được.
- Ba bài hướng dẫn ngắn, 8 mẫu gợi ý, 12 nhiệm vụ tự chọn và 6 thẻ kiến thức một câu có đọc to.
- Tự lưu, sửa tiếp, hoàn tác/làm lại, tạo bản sao, phân tách hồ sơ, offline và chế độ giảm chuyển động.

### Sau V1

| Mở rộng | Giá trị | Phụ thuộc |
|---|---|---|
| Quai cốc, vòi ấm, nắp | Mở rộng loại vật | Hệ chi tiết gắn thêm, giao tuyến và UV riêng; không nằm trong biên dạng tròn xoay đơn. |
| Miệng lượn sóng, bóp lệch | Cá tính hình khối | Biên dạng theo cả chiều cao và góc, nâng lại kiểm tra va chạm thành. |
| Khắc, sgraffito, đắp nổi | Cảm giác thủ công sâu hơn | Height/normal map và công cụ lớp phủ. |
| Góc gốm Việt | Chủ đề men ngọc, lam, họa tiết dân gian | Nội dung và hình tham chiếu được đối chiếu nguồn, thiết kế riêng. |
| Đặt bình vào vườn hoặc Làng Mầm | Tác phẩm có nơi sử dụng | Hợp đồng asset, scale và lưu trữ giữa module. |
| Bộ sưu tập theo mùa, bộ ấm chén | Lý do quay lại | Hệ nhóm tác phẩm; không cần mạng xã hội. |
| Đồng bộ artwork qua tài khoản | Tiếp tục trên thiết bị khác | Kho blob riêng, quota và giải quyết xung đột; không nhét ảnh vào snapshot 20 MiB. |
| GLB hoặc AR | Xem ngoài xưởng | Bake vật liệu procedural sang chuẩn xuất, kiểm tra tương thích. |

Các tính năng như mô phỏng hóa học men, nứt/vỡ ngẫu nhiên, thị trường mua bán, feed công khai, AI chấm đẹp và nhận diện tay webcam chưa thuộc kế hoạch v1.

## 6. Hình ảnh và bố cục

Hướng đề xuất là xưởng thủ công ấm và sáng: gỗ sáng, đất nung, vải kem, điểm xanh ngọc; ánh nắng xiên nhẹ, bóng tiếp xúc rõ. Tác phẩm giữ vai trò trung tâm, khoảng 60–70% vùng làm việc. Đất cần thấy ẩm và dẻo; men cần phản chiếu có chiều sâu, tránh màu phẳng như nhựa.

Tablet ngang dùng khay công cụ bên cạnh bàn xoay. Tablet dọc và điện thoại dùng khay dưới theo ngữ cảnh; panel mở không che điểm chạm và miệng bình. Màn hẹp vẫn ưu tiên thao tác một ngón, không buộc cử chỉ đa điểm để hoàn thành.

Giao diện có ba nhãn bước **Nặn**, **Trang trí**, **Nung**, nút hoàn tác luôn cùng vị trí. Công cụ có icon và chữ; vùng chạm tối thiểu 48 px CSS. Màu hiển thị tên khi chọn để bé không phải phân biệt chỉ bằng sắc độ.

Trong GĐ0, dựng ba khung bố cục đơn giản cho cùng một hướng mỹ thuật: bàn nặn, bàn trang trí, bệ thành phẩm. Kiểm tra kích thước thao tác trước khi sản xuất asset. Đây là các màn của cùng trải nghiệm, không phải ba phong cách bắt buộc lựa chọn.

### Asset cần có

| Nhóm | Số lượng dự kiến | Cách làm |
|---|---|---|
| Bàn xoay, lò, bệ | 3 bộ | Mesh đơn giản có chủ đích hoặc GLB tối ưu. |
| Đạo cụ | 6–8 | Chén men, cọ, bọt biển, khăn, kệ; hạn chế cạnh tranh thị giác. |
| Chất liệu | 3 đất, 6 men | Texture nhỏ kết hợp tham số vật liệu/procedural có seed. |
| Họa tiết | 12 dấu, 6 dải | Vector hoặc raster trong suốt, nét rõ và giấy phép rõ. |
| Âm thanh | 6–8 | Quay, chạm đất, quét men, đóng/mở lò, nung, hoàn thành. |
| Bìa sảnh | 2 kích thước | Ảnh hoàn thiện, hỗ trợ biến thể nhỏ như `HubArt`. |

Ghi nguồn và quyền sử dụng trong `public/pottery/README.md`. Asset chạy offline phải đóng gói trong ứng dụng; không dựa vào URL preset từ CDN khi mở xưởng.

## 7. Engine tạo hình 3D

### Biểu diễn dữ liệu

Mỗi vật là biên dạng ngoài theo chiều cao, kèm dữ liệu khoang rỗng và bề dày. Model chuẩn có 64 mẫu theo chiều cao; tăng mật độ mesh khi render bằng nội suy có giới hạn. Chất lượng render thấp không làm mất độ chi tiết của bản lưu.

```ts
type ShapeDoc = {
  version: 1;
  height: number;
  outerRadius: number[]; // 64 mẫu, thứ tự từ đáy lên miệng
  wallThickness: number[];
  baseThickness: number;
  cavityDepth: number;   // 0 khi còn là cục đất đặc
  opening: number;       // điều khiển chuyển từ đỉnh kín sang miệng mở
};
```

Engine suy ra biên dạng trong từ biên dạng ngoài, độ dày và độ sâu; độ dày trong model là tham số, bộ validator còn phải kiểm tra khoảng cách thành theo hình học. Với sườn dốc, chỉ trừ một bán kính cố định sẽ không đảm bảo độ dày thật. Dùng giới hạn độ dốc/độ cong và kiểm tra khoảng cách các đoạn ngoài–trong; đẩy biên dạng về miền hợp lệ trước khi commit.

Đơn vị nặn là đơn vị game. Dự kiến chiều cao 0,5–3,5; bán kính ngoài 0,25–1,6; thành tối thiểu khoảng 0,06, đáy 0,08. Hiệu chỉnh ở GĐ0–2, gom vào `constraints.ts`. Không hiển thị cm khi chưa xác lập scale vật lý.

### Biến dạng

1. Chuyển vị trí ngón tay thành độ cao chuẩn hóa `s` trong khoảng 0–1.
2. Tạo cọ tác động lên các mẫu lân cận: `w = exp(-0.5 * ((s_i - s) / sigma)^2)`, cắt ngoài khoảng 3 sigma.
3. Kéo ngang cập nhật bán kính theo độ dịch con trỏ và `w`; chạm giữ cập nhật theo tốc độ × thời gian, không theo số sự kiện pointer.
4. Làm mịn 1–2 lượt trong vùng tác động, giữ các mốc ngoài vùng. Nội suy có giới hạn để không tạo cổ bị âm hoặc dao động giữa các mẫu.
5. Chỉnh chiều cao neo tại đáy. Khi đang là khối đặc, có thể dùng `r *= sqrt(h_old / h_new)` làm gợi ý giữ lượng đất; khi đã rỗng phải xét cả thành và khoang, không áp công thức khối đặc nguyên xi.
6. V1 ưu tiên phản hồi tại vùng chạm: chỉ bù lượng đất nhẹ có giới hạn, không tự co toàn bình để ép bảo toàn thể tích tuyệt đối. Thể tích vẫn được tính để ngăn kéo thành quá mỏng. Đây là trợ giúp game, không phải mô phỏng bảo toàn vật chất chính xác.
7. Chiếu về miền hợp lệ: bán kính hữu hạn, thành và đáy đủ dày, lòng không xuyên đáy, giới hạn dốc và cong, không tự cắt nhau.

Tách timestep tác động thành các bước nhỏ khi cần; clamp delta sau khi tab bị treo, không “bù” vài giây thành cú bóp mạnh lúc quay lại. Áp cùng trace 30/60/120 Hz phải cho hình dạng gần tương đương.

### Tạo mesh

Three.js có [LatheGeometry](https://threejs.org/docs/pages/LatheGeometry.html) cho vật tròn xoay quanh trục Y. Dùng nó để thử biên dạng, còn phần nặn liên tục dùng `BufferGeometry` có buffer tái sử dụng để cập nhật vertex và normal.

- Có các miền mặt ngoài, mặt trong, vành miệng, đáy ngoài và đáy lòng. Các biên khớp vị trí nhưng được tách UV/normal khi cần.
- Cục đất ban đầu đặc có nắp đỉnh. Lần mở lòng chuyển topology đúng một lần có kiểm soát; không để nắp kín và lòng rỗng vẽ chồng lên nhau. Khi undo mở lòng thì dựng lại topology tương ứng.
- Đầu mút tại trục dùng triangle fan riêng, tránh các tam giác suy biến từ cả vòng có bán kính bằng 0.
- Seam góc 0/2π có vertex trùng vị trí, normal được thống nhất; UV vẫn tách 0 và 1.
- Sau biến dạng, cập nhật normal và bounding volume để ánh sáng, raycast và frustum đúng. Kiểm tra winding của mặt trong; không lấy `DoubleSide` làm cách thay thế cho lòng bình thật.
- Không thay `key` của mesh, tạo geometry/material hoặc `setState` mỗi frame. Bộ điều khiển runtime dùng ref/store; React nhận trạng thái UI và snapshot ở biên thao tác.
- Khi nặn, cả vật và bàn quay trong cùng hệ trục. Đất tròn xoay cần vân, vệt ẩm hoặc dấu bàn xoay để người chơi thực sự thấy chuyển động.

Giới hạn của phương án này: mỗi lát cao có một bán kính ngoài nên chưa tạo được quai, vòi, khối vuông, khối lệch tâm hoặc thành gấp ngược. Các hình đó cần hệ bổ sung riêng.

## 8. Men và vẽ trực tiếp trên vật

### Mô hình trang trí

Tách ba lớp: **thân đất**, **lớp men nền**, **họa tiết màu**. V1 chọn một kiểu men cho mỗi tác phẩm; nhúng có thể để hở một phần thân. Nét cọ là màu trang trí theo lớp, không mô phỏng pha trộn hóa chất của nhiều men khác nhau.

| Kiểu men | Biểu hiện cần đạt |
|---|---|
| Bóng | Highlight rõ, phản xạ môi trường mềm, thấy độ cong thân. |
| Satin | Highlight rộng hơn, dịu hơn men bóng. |
| Lì | Tán xạ rộng, vẫn có độ nổi hình khối. |
| Chấm hạt | Các hạt nhỏ ổn định theo bề mặt, không nhấp nháy khi quay. |
| Loang nhẹ | Màu biến thiên mềm có seed, giữ màu bé đã chọn làm chủ đạo. |
| Rạn mỹ thuật | Mạng nét nhỏ trên lớp men; không tách mesh hoặc làm mất tác phẩm. |

High tier dùng `MeshPhysicalMaterial` với clearcoat có kiểm soát; low tier dùng `MeshStandardMaterial` và roughness/envMap tương đương về cảm nhận. Theo [tài liệu Three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html), clearcoat mô phỏng lớp phản chiếu phía trên và có chi phí theo pixel; chỉ bật hiệu ứng cần dùng. Men gốm thường dùng `metalness = 0`, không bật transmission chỉ để tạo độ bóng.

Màu nền và họa tiết dùng không gian màu sRGB; roughness, mask, normal là dữ liệu tuyến tính. Cố định ánh sáng xem trước và thành phẩm để màu không thay đổi bất ngờ giữa hai màn.

### UV và nét cọ

- Raycast lên mesh trả về surface và UV trong hệ tọa độ của vật đang quay. Không lấy góc con trỏ màn hình thay cho góc trên bề mặt.
- Sau khi kết thúc nặn, tạo UV ngoài theo góc và chiều dài cung dọc biên dạng; UV trong/vành/đáy ở miền riêng. Cố định atlas trong giai đoạn trang trí.
- Lưu nét dưới dạng tọa độ bề mặt, màu, kích thước, kiểu cọ và seed. Canvas 2D là lớp raster nội bộ để tạo texture trên vật 3D; không thay cảnh chơi bằng tranh 2D.
- Khi qua seam `u=0/1`, unwrap theo quãng đường góc ngắn, vẽ các bản sao mép và thêm padding giữa các island. Không nối đường từ 0,99 về 0,01 xuyên cả texture.
- Nội suy mẫu cọ theo khoảng cách bề mặt để kéo nhanh vẫn liên tục; xử lý co giãn kích thước dấu theo bán kính và chiều dài cung tại vị trí hit.
- Chạm ra nền ngắt đoạn nét; chạm lại mở đoạn mới. Không vẽ xuyên mặt sau hoặc nối tắt qua miệng/lòng khác miền.
- Cọ bên ngoài là công cụ chính. V1 mặt trong và vành có phủ màu riêng; vẽ chi tiết sâu trong lòng để sau nhằm giữ thao tác dễ hiểu.
- Tẩy chỉ tác động lên lớp họa tiết, để lộ men nền. Hoàn tác đổi men và hoàn tác nét là giao dịch riêng.
- Vẽ tự do mặc định dừng bàn. Chế độ dải vòng quay chậm; giữ cọ tạo vòng, rê dọc tạo dải xoắn. Lấy mẫu theo cả thời gian quay, kể cả khi con trỏ đứng yên.
- Dùng [CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html); chỉ upload khi dirty và gộp tối đa một lần mỗi frame. Cần đo chi phí upload vì thay vài pixel vẫn có thể upload cả texture.

Ngân sách ban đầu: texture tổng hợp 1024² cho tablet chuẩn, 512² cho low tier; 2048² chỉ dành cho xuất ảnh hoặc high tier sau khi đo. Nét vector giữ nguyên để tái dựng ở chất lượng cao hơn. Không giữ 50 ảnh full texture trong bộ nhớ để undo; dùng journal cộng checkpoint theo byte budget.

### Quay lại sửa hình

Từ Trang trí, nút **Sửa dáng** tạo một nhánh bản nháp mới và giữ nguyên bản đã trang trí. Trên bản mới, UV theo bề mặt được ánh xạ lại; UI nói rõ họa tiết có thể co giãn theo hình mới. Chuyển sang nhánh mới phải giữ được đường quay về bản gốc. Thành phẩm đã nung chỉ sửa qua **Tạo bản sao**, không sửa đè.

## 9. Nung và hoàn thiện

Nung là một đoạn chuyển hóa có chủ đích: phủ men còn đục → lò sáng → men đổi sang trạng thái hoàn thiện → làm nguội → mở lò. Có âm thanh nhỏ và ánh sáng ấm; giảm chuyển động thì dùng chuyển cảnh nhẹ, không bắt xoay camera hoặc xem particle.

Kết quả được tính trước từ `shape`, `clayId`, `glazeId`, `palette`, `decoration`, `seed` và `materialVersion`. Lưu seed và thông số trước khi phát animation; tải lại không đổi kết quả. V1 không có xác suất nổ, hỏng men hoặc mất đồ. Độ loang/rạn là sai khác mỹ thuật có kiểm soát và xem trước được.

```text
draft.shaping → draft.preparing → draft.decorating
                                      ↓
                                  firing → reveal → finished
                                      ↑
                         skip/resume dùng cùng kết quả đã lưu
```

Lưu trạng thái trước chuyển bước. Nếu đóng ứng dụng khi nung, mở lại đi tiếp tới kết quả đã tính; không yêu cầu chờ theo đồng hồ thật. Đặt lên kệ là thao tác idempotent theo artwork ID; mở màn hoàn thành nhiều lần không sinh nhiều món hoặc cộng sao nhiều lần.

Màn thành phẩm có xoay 360°, nghiêng nhìn lòng bình, ba phông chụp trung tính, tên và ngày làm. Cho chọn cắm một nhánh hoa trang trí hoặc để trống khi chụp; nhánh hoa là đạo cụ trình bày, không biến đổi dữ liệu gốm.

## 10. Nội dung và động lực quay lại

### Bộ nội dung ban đầu

| Nhóm | Nội dung |
|---|---|
| 3 bài kỹ thuật | Chiếc cốc đầu tiên; bình có cổ và bụng; vòng màu quanh bát. |
| 8 mẫu gợi ý | Cốc thẳng, bát ăn cơm, bát loe, bình cổ cao, bình bụng tròn, lọ hoa nhỏ, chậu cây, đĩa sâu. |
| 12 nhiệm vụ | 4 nhiệm vụ tạo dáng, 4 nhiệm vụ màu/họa tiết, 4 nhiệm vụ phối hợp. |
| 6 thẻ kiến thức | Đất mềm; bàn xoay tạo hình tròn; thành và đáy; đất cần khô; men biến đổi trong lò; chờ nguội trước khi lấy ra. |

Ví dụ nhiệm vụ: làm bát miệng rộng cho bạn Gấu; bình cao có cổ hẹp; cốc xanh có một vòng vàng; bộ đôi cùng màu nhưng khác dáng. Nhiệm vụ có hình minh họa và yêu cầu ngắn, đọc to được. Mẫu chỉ hiện như đường nét gợi ý bật/tắt, không kéo vật của bé về mẫu tự động.

### Đánh giá công bằng

Nhiệm vụ tạo hình so sánh profile sau khi lấy mẫu về cùng trục chuẩn hóa; chiều cao thật trong đơn vị game được chấm riêng nếu nhiệm vụ yêu cầu. So sánh độ rộng miệng, bụng, tỉ lệ cao/rộng và sai số trung bình có trọng số. Không so pixel screenshot vì ánh sáng/camera sẽ làm điểm thay đổi.

Yêu cầu màu đánh giá theo recipe và diện tích phủ ước lượng theo mặt 3D, không đếm thô số pixel UV bị méo. Bài đầu có dung sai rộng. Phản hồi cụ thể như **Miệng bát rộng thêm một chút là được**; luôn cho giữ tác phẩm dù chưa khớp mẫu.

Chơi tự do không có sao chất lượng. Thưởng theo mốc hữu hạn như tác phẩm đầu, thử đủ ba thao tác, hoàn thành bài hướng dẫn và từng nhiệm vụ lần đầu. Khóa thưởng gồm profile, loại mốc và ID nhiệm vụ; bấm nung lại, nhân bản hoặc nhập bản sao không sinh thưởng mới. Huy hiệu có thể là **Bàn tay khéo**, **Bạn của sắc men**, **Góc gốm nhỏ**.

## 11. Kiến trúc mã nguồn đề xuất

```text
src/pottery/
  model.ts
  engine/
    profile.ts             tạo và nội suy biên dạng
    sculpt.ts              thao tác nặn, timestep
    constraints.ts         giới hạn hình học
    cavity.ts              suy ra lòng và độ dày
    history.ts             giao dịch, undo/redo
    decoration.ts          lệnh trang trí và tọa độ bề mặt
    firing.ts              kết quả nung có seed
    challenges.ts          so khớp nhiệm vụ
    *.test.ts
  interaction/
    gestures.ts            phân giải ý định và pointer lifecycle
    surfaceMapping.ts      màn hình, world, local, UV
  render/
    StudioCanvas.tsx
    VesselMesh.tsx
    vesselGeometry.ts
    PotteryWheel.tsx
    WorkshopEnvironment.tsx
    glazeMaterials.ts
    paintTexture.ts
    KilnScene.tsx
    photoExport.ts
    quality.ts
  state/
    studioController.ts    state machine và runtime refs
    usePotteryStudio.ts
  persistence/
    repository.ts
    migrations.ts
    backup.ts
    ownership.ts
    *.test.ts
  content/
    clay.ts
    glazes.ts
    patterns.ts
    lessons.ts
    challenges.ts
    content.test.ts
  progress/
    progress.ts
    rewards.test.ts
  ui/
    PotteryPage.tsx
    Workshop.tsx
    ToolTray.tsx
    GlazePalette.tsx
    Gallery.tsx
    Reveal.tsx
    pottery.css
public/pottery/
  art/ textures/ models/ audio/ patterns/
  README.md
docs/pottery-studio/
  spike-report.md
  qa-checklist.md
  performance-report.md
```

Engine nhận/trả dữ liệu thuần, không import React, Three, DOM, audio hoặc IndexedDB. Geometry/texture chuyển dữ liệu engine sang hiển thị. Controller điều phối stage, thao tác và save; lớp UI chỉ gửi ý định. Worker chỉ thêm khi profile cho thấy tác vụ nặng như rebuild texture làm nghẽn; chưa đưa vòng nặn sang worker ngay từ đầu.

## 12. Lưu trữ và phục hồi

### Bản ghi tác phẩm

```ts
type ArtworkDoc = {
  schemaVersion: 1;
  accountScope: string;
  studentId: string;
  id: string;
  revision: number;
  name: string;
  stage: 'shaping' | 'preparing' | 'decorating' | 'firing' | 'reveal' | 'finished';
  shape: ShapeDoc;
  clayId: string;
  glazeId: string;
  decoration: DecorationDoc;
  seed: number;
  materialVersion: number;
  parentArtworkId?: string;
  createdAt: string;
  updatedAt: string;
};
```

`DecorationDoc` định nghĩa đầy đủ lệnh phủ, nhúng, cọ, vòng và dấu tại GĐ1; mỗi lệnh có version, surface, tọa độ và tham số có giới hạn. Schema không chứa đối tượng Three.js. Mesh, preview texture và ảnh thu nhỏ đều tái tạo được từ dữ liệu chuẩn.

IndexedDB `pottery-studio-v1` có `artworks`, `checkpoints`, `thumbnails`; khóa có `accountScope`, `studentId`, `artworkId`. Tài khoản lấy từ lớp Account hiện có, khách dùng scope riêng; các lớp tài khoản/hồ sơ sẵn sàng rồi mới mở bản nháp. Tất cả read, list, save, delete đều bắt buộc scope.

### Chính sách lưu

- Sau mỗi giao dịch nặn/vẽ, đưa bản mới vào hàng đợi lưu; debounce khoảng 500–1000 ms. Khi đổi bước, chờ transaction thành công rồi mới chuyển.
- Với nét kéo dài, checkpoint khoảng mỗi 2 giây; khi ứng dụng bị hệ điều hành đóng, chỉ cam kết phục hồi tới checkpoint đã hoàn tất. Không dựa duy nhất vào `beforeunload`.
- UI phân biệt **Đang lưu**, **Đã lưu trên máy** và **Chưa lưu được**. Không hiển thị đã lưu trước khi transaction hoàn thành.
- Ghi bằng expected revision trong một transaction. Hai tab cùng sửa thì phát hiện xung đột, cho giữ bản nhánh hoặc tải bản mới; không ghi đè im lặng.
- History nặn lưu profile trước/sau theo gesture, mục tiêu 50 thao tác. History vẽ dùng journal/checkpoint giới hạn khoảng 16 MiB RAM. Gộp checkpoint chỉ khi vẫn giữ được số bước undo đã hứa.
- Bản nháp có một checkpoint trước bước nung. Thumbnail được tạo sau, kiểm revision trước khi ghi; ảnh lỗi không làm hỏng artwork.
- Quota hoặc IndexedDB bị chặn: giữ phiên trong RAM, báo chưa lưu được và cho xuất bản sao. Không tự xóa tác phẩm đã hoàn thành để lấy chỗ.
- Khi xóa hồ sơ, dọn tất cả store của đúng scope. Khi đổi tài khoản, flush nếu có thể, hủy công việc async cũ và reset controller; callback cũ không được ghi vào scope mới.
- Khách chuyển sang tài khoản: nếu người dùng chọn nhập dữ liệu khách qua luồng hiện có, cần kèm nhánh chuyển/copy artwork với mapping profile rõ ràng. Nếu chưa triển khai nhập cùng luồng, giữ artwork khách riêng và cung cấp xuất/nhập trong xưởng; không tự gán lại chủ.

### Bản sao và đồng bộ

V1 lưu artwork trên thiết bị; thư viện có nhãn **Tác phẩm lưu trên máy này**. Tiến độ nhẹ gồm bài đã học, nhiệm vụ hoàn thành, huy hiệu; mục tác phẩm gần đây là tùy chọn cục bộ để tránh link trỏ vào artwork không có trên thiết bị khác.

Xuất một file JSON có định dạng và version riêng, chứa shape, recipe, nét vẽ và seed. Nhập kiểm schema, kích thước, số điểm, số lệnh, giá trị hữu hạn, ID asset cho phép; gán chủ hiện tại và ID mới, không tin scope từ file. Bản nhập không mang quyền nhận lại phần thưởng. Ảnh PNG là ảnh kỷ niệm, không thay bản sao chỉnh sửa được.

Không đăng ký toàn bộ kho artwork vào `databaseSpecs` trong v1. Khi làm đồng bộ riêng, thiết kế upload blob, quota, xung đột và xóa dữ liệu trước khi bật; không tăng giới hạn 20 MiB của toàn bộ hồ sơ chỉ để chứa ảnh gốm.

## 13. Hiệu năng và tương thích

### Ngân sách khởi điểm

| Chỉ số | Low tier | Tablet chuẩn hoặc high tier |
|---|---|---|
| Khung hình khi nặn | P95 frame time ≤ 33,3 ms | P95 frame time ≤ 20 ms, hướng tới 60 fps |
| Phản hồi từ chạm tới hình | P95 ≤ 100 ms | P95 ≤ 70 ms |
| Mesh tác phẩm | Khoảng 10–15 nghìn tam giác | Khoảng 25–40 nghìn tam giác |
| Texture vẽ | 512² | 1024²; 2048² chỉ khi đo đạt |
| DPR | 1–1,25 | 1,5; tối đa 2 sau khi đo |
| Toàn scene | Mục tiêu ≤ 60 draw calls, ≤ 60 nghìn tam giác | ≤ 100 draw calls, ≤ 120 nghìn tam giác |
| Postprocessing | Tắt | Tùy chọn rất nhẹ, không bắt buộc để men đẹp |
| Tài nguyên module | Mục tiêu tổng ≤ 12 MiB tải nén; phần cần chơi đầu ≤ 4 MiB | Cùng nội dung, thêm chất lượng theo khả năng |

Số tam giác phải tính cả thành trong, vành, đáy. Ví dụ 64 đoạn cao × 96 đoạn vòng × 2 tam giác × 2 mặt ≈ 24.576 tam giác trước vành/đáy. Không tính chỉ mặt ngoài rồi gọi đó là ngân sách toàn vật.

Kệ dùng ảnh thu nhỏ; chỉ vật đang chọn hoặc tối đa một nhóm nhỏ được dựng 3D. Không tạo một canvas riêng cho từng món. Khi bàn dừng và không có thao tác, render theo nhu cầu; khi tab ẩn thì dừng animation/audio. Tái sử dụng vật liệu và giải phóng GPU resource khi rời module, theo nguyên tắc trong [hướng dẫn hiệu năng R3F](https://r3f.docs.pmnd.rs/advanced/scaling-performance).

Theo dõi frame time, long task, `renderer.info`, bộ nhớ texture ước lượng và thời gian replay journal. Một texture RGBA 1024² đã khoảng 4 MiB trước mipmap; canvas, ảnh checkpoint và texture GPU có thể đồng thời giữ nhiều bản.

### Ma trận kiểm tra

Kiểm ít nhất: iPad/Safari cảm ứng, tablet Android/Chrome tầm trung, điện thoại Android 390×844, desktop Chrome/Edge dùng chuột. Bố cục thêm 1180×820, 820×1180 và 360 px chiều rộng. Báo cáo ghi model máy, OS, browser, DPR, tier và trace thao tác; desktop giả lập không thay thế đo tablet thật.

Thiết bị không tạo được WebGL2 nhận thông báo rõ và vẫn xem ảnh tác phẩm/xuất bản sao cũ nếu có. Lỗi `webglcontextlost` tạm dừng, giữ document trong RAM; khi context phục hồi dựng lại GPU từ model. Không dùng bản 2D thay thế rồi coi là đáp ứng phần nặn 3D.

## 14. Kế hoạch thực thi

Các mốc đi theo phụ thuộc; mỗi mốc hoàn thành phải có kết quả chơi/kiểm được. Ước lượng là ngày công phát triển tập trung cho một người đã quen repo, chưa gồm chờ phản hồi và sản xuất asset đặc biệt. Tổng khoảng **23–33 ngày công**, nên dự trù thêm 20–30% cho tinh chỉnh cảm giác nặn và thiết bị thật.

| Giai đoạn | Việc và đầu ra | Phụ thuộc | Nghiệm thu | Ngày công |
|---|---|---|---|---|
| GĐ0 Kiểm chứng lõi | Prototype bàn quay, 3 gesture, một profile rỗng, thử men và đường vẽ qua seam; bố cục 3 màn, báo cáo spike | Không | Kéo có phản hồi, nặn được cốc/bát/bình trên tablet; không lỗi lòng hay seam; xác định máy chuẩn | 1–2 |
| GĐ1 Nền module | Route dev, model, state machine, ownership, repository bản nháp, input controller | GĐ0 | Vào/ra an toàn, reload bản nháp, hai hồ sơ không lẫn, engine không phụ thuộc renderer | 2–3 |
| GĐ2 Nặn hoàn chỉnh | Height, radius, hold pinch, cavity, smooth, undo/redo, constraint và âm thanh | GĐ1 | Hoàn thành kịch bản nặn bằng chuột/chạm; 1000 thao tác giả lập không tạo hình bất hợp lệ | 3–4 |
| GĐ3 Xưởng và men | Asset bàn/lò, ánh sáng, đất ẩm/khô, sáu men, color preview, quality tier | GĐ2 | Thấy rõ khác biệt men trên ba dáng dưới cùng ánh sáng; không nhấp nháy hoặc rò mặt trong | 3–4 |
| GĐ4 Trang trí | Phủ, nhúng, cọ, dấu, vòng, tẩy, undo, atlas, export recipe | GĐ2 và GĐ3 | Nét qua seam liên tục; nét bám vật khi quay; tay đứng yên vẫn vẽ vòng; reload giữ đúng nét | 4–6 |
| GĐ5 Nung và thành phẩm | Stage preparing/firing/reveal, kết quả có seed, ảnh PNG, lưu hoàn tất | GĐ4 | Trọn vòng chơi; reload/skip giữa nung ra cùng vật; đặt kệ nhiều lần chỉ một bản | 2–3 |
| GĐ6 Kệ và bản sao | Gallery, tiếp tục, nhân bản sửa dáng, export/import, quota/conflict UX | GĐ5 | Phục hồi đúng hình/men/nét; file lỗi không phá kho; scope tài khoản và xóa hồ sơ đúng | 2–3 |
| GĐ7 Hướng dẫn và nhiệm vụ | 3 bài, 8 mẫu, 12 nhiệm vụ, 6 thẻ kiến thức, thưởng hữu hạn, mở thẻ sảnh | GĐ6 | Bé hoàn thành bài đầu; chấm theo dữ liệu; không thưởng lặp sau nhập/nhân bản/reload | 3–4 |
| GĐ8 Hoàn thiện phát hành | Mobile QA, offline, accessibility, memory/perf, tài liệu, build | GĐ7 | Đạt checklist bắt buộc, báo cáo thiết bị thật, build/test liên quan xanh | 3–4 |

### Các điểm dừng để đánh giá chất lượng

- **Sau GĐ0:** nếu nặn chưa dễ hiểu hoặc cần quá nhiều mode, sửa gesture trước khi làm trang trí. Giữ nguyên phạm vi thử để kiểm lại.
- **Sau GĐ2:** tạo được cốc, bát và bình từ cục đất, không dùng preset hoàn thiện; mesh và hoàn tác phải ổn định.
- **Sau GĐ5:** bản xuyên suốt có thể chơi từ đầu tới cuối. Dùng để kiểm thời lượng và niềm vui khi mở lò.
- **Sau GĐ8:** v1 có lưu/khôi phục, offline, phân tách hồ sơ và thiết bị thật đạt tiêu chí. Việc phát hành theo quy trình repository, tách khỏi công việc lập plan này.

### Hạng mục thực hiện đầu tiên

1. Tạo `model.ts`, `profile.ts`, `constraints.ts` và bộ trace thao tác mẫu.
2. Dựng `VesselMesh` có đáy, lòng, miệng đúng; chưa thêm toàn bộ đồ trang trí.
3. Làm thao tác kéo chiều cao, kéo bán kính, chạm giữ và pointer capture.
4. Dùng ba profile tham chiếu cốc/bát/bình để so normal và kiểm giới hạn.
5. Thử một men bóng và một nét cọ chạy qua seam trên vật đang quay.
6. Ghi số đo và video ngắn trên tablet; cập nhật thông số cọ, giới hạn hình và ngân sách trước GĐ1.

## 15. Kiểm thử và tiêu chí hoàn thành

### Kiểm thử tự động có giá trị

| Nhóm | Ca bắt buộc |
|---|---|
| Biên dạng | Trace kéo/ấn/cọ ngẫu nhiên vẫn hữu hạn, không xuyên đáy, không tự cắt thành; làm mịn không phá vùng ngoài cọ. |
| Timestep | Cùng thao tác ở 30/60/120 Hz có sai khác trong dung sai; quay lại tab không tạo cú bóp lớn. |
| Lịch sử | Undo/redo phục hồi shape và nét, bao gồm thao tác mở lòng và đổi men; pointercancel kết thúc đúng. |
| Geometry | Winding, seam normals, mặt trong/ngoài, cap ở trục và bounding volumes sau thay đổi; test mức Three không cần WebGL cho dữ liệu mesh. |
| Vẽ | UV wrap, đoạn bị ngắt, đứng yên trên bàn quay, không xuyên mặt sau; dấu đúng kích thước ở cổ và bụng. |
| Nung | Cùng seed/version ra cùng recipe; load stage trung gian đi tiếp an toàn, skip không thưởng hai lần. |
| Lưu | Round trip, migration, revision conflict, thumbnail cũ, lỗi quota, dữ liệu hỏng, tài khoản/hồ sơ khác, xóa đúng scope. |
| Nội dung | ID duy nhất, tham chiếu asset/men hợp lệ, nhiệm vụ có thể hoàn thành, phần thưởng có khóa lặp. |

Chạy Vitest cho engine, persistence với fake-indexeddb, rewards và catalog. Kiểm rendering và thao tác thật bằng trình duyệt; khi cần tự động hóa pointer/visual, chọn công cụ browser hiện có hoặc bổ sung bộ E2E có chủ đích ở GĐ8.

Lệnh dự kiến khi triển khai:

```bash
npm test -- src/pottery src/components/hub/catalog.test.ts
npx tsc --noEmit
npm run build
```

`vite build` không thay thế kiểm tra TypeScript. Ghi baseline nếu repo đã có lỗi type không liên quan; không báo toàn bộ typecheck xanh khi còn lỗi. Chạy toàn bộ `npm test` ở mốc tích hợp cuối; trong từng mốc chỉ chạy bộ liên quan và mở rộng khi có nguyên nhân.

### Checklist phát hành

- [ ] Từ cục đất tạo được bình cao, bát thấp và cốc; kéo ra làm phình được cả khi chạm bên trái lẫn bên phải.
- [ ] Giữ tay làm thắt, chuyển sang kéo không bị cộng lực hai lần; rời mesh vẫn kéo được có kiểm soát.
- [ ] Miệng, thành, lòng, đáy đúng ở mọi góc; không mesh lộn mặt hoặc hở seam.
- [ ] Men bóng/lì/satin khác nhau nhìn thấy được; palette gần với ảnh thành phẩm.
- [ ] Vẽ qua seam và xoay vật không đứt hoặc nhảy nét; tẩy/undo đúng lớp.
- [ ] Đóng ứng dụng giữa nặn, trang trí, nung đều phục hồi tới bản đã lưu; không mất cả tác phẩm.
- [ ] Hai tab, hai hồ sơ và hai tài khoản không ghi đè hoặc thấy nhầm artwork.
- [ ] PNG xuất đúng vật, nền và màu; bản sao nhập lại còn chỉnh được và không nhận thưởng lặp.
- [ ] Tải gói offline rồi ngắt mạng vẫn chơi trọn vòng, mở kệ và reload route dưới `/Genius-kids/`.
- [ ] Chạy 20 phút và vào/ra xưởng 10 lần không tích lũy canvas, geometry, texture hoặc audio loop.
- [ ] Touch, chuột, reduced motion, nút đọc to và giao diện hẹp dùng được.
- [ ] Không bật nút hoặc trưng asset placeholder cho tính năng chưa hoàn thành.
- [ ] Ít nhất 4/5 người chơi thử đúng nhóm tuổi hoàn thành bài đầu trong khoảng 8 phút sau một hướng dẫn ngắn; ghi rõ cỡ mẫu nhỏ và điểm vướng để sửa.

## 16. Rủi ro và cách xử lý

| Rủi ro | Phương án cụ thể |
|---|---|
| Nặn giống kéo thanh số, thiếu cảm giác tay | Chỉnh falloff, damping, độ ẩm, âm thanh và vùng highlight; đánh giá trên tablet ngay GĐ0. |
| Bé không biết cách làm phình sau khi thắt | Hướng dẫn kéo ra đối xứng theo trục, có thao tác minh họa; không giấu trong menu nâng cao. |
| Đất bị bóp sập hoặc thành cắt nhau | Giới hạn hình học, cọ có bề rộng tối thiểu và kiểm khoảng cách thành. |
| Vẽ sai do bàn quay/camera | Dừng bàn mặc định khi vẽ, khóa gesture và dùng local surface mapping. |
| Men trông như nhựa | Điều chỉnh envMap, roughness và micro-normal trước khi thêm hiệu ứng hậu kỳ. |
| Texture upload làm giật | Gộp dirty update, giảm texture/DPR, đo bằng stroke trace; chỉ chuyển render-target painting nếu CanvasTexture vượt ngân sách. |
| Sửa shape làm hỏng tranh | Giữ bản gốc, sửa trong bản sao, thông báo họa tiết co giãn. |
| Sưu tập phình bộ nhớ | Thumbnail thay canvas, tải từng vật, journal có giới hạn và xuất bản sao; không tự xóa đồ. |
| Lưu máy bị hiểu nhầm là đã đồng bộ | Gắn trạng thái lưu trên máy ở kệ; không dùng trạng thái tài khoản để báo artwork đã lên cloud. |
| Phạm vi phình sang mô phỏng nghề gốm đầy đủ | Giữ phạm vi v1 ở vật tròn xoay và sáu men; chi tiết gắn thêm và hóa học để nhánh sau. |

## 17. Nhật ký quyết định khi triển khai

### 2026-10-14 — triển khai v1

Đã tích hợp toàn bộ vòng chơi, dữ liệu cục bộ, bộ nội dung và phần thưởng tại `src/pottery/`. Ảnh bìa được tạo bằng ImageGen theo yêu cầu. Xem [bản bàn giao và kiểm chứng](pottery-studio/README.md) để phân biệt tính năng đã triển khai, kiểm thử tự động/trình duyệt đã chạy và các mục còn cần thiết bị thật hoặc người chơi. Checklist phát hành bên trên không được tự đánh dấu cho những phép thử chưa thực hiện.

**Đính chính sau audit:** đây là bản chơi xuyên suốt, chưa đạt nghiệm thu v1. [Ma trận đối chiếu từng giai đoạn](pottery-studio/plan-audit.md) ghi các phần làm sơ lược/chưa làm, cùng bản sửa hình học và hiển thị lòng bình theo phản hồi người dùng. Không dùng số test toàn repository để thay thế kiểm chứng cảm giác nặn và chất lượng thị giác.

Khi có số đo hoặc chơi thử, cập nhật các giá trị cọ, mesh, texture, thiết bị chuẩn và thời lượng ở đúng mục. Ghi ngắn quyết định thay đổi, lý do và kiểm chứng. Các mục mở rộng không tự động trở thành điều kiện phát hành v1.

Trọng tâm của bản đầu là người chơi thấy **mình thực sự nặn được một món đồ**, thích ngắm lớp men của nó, và tìm lại được tác phẩm vào lần mở xưởng tiếp theo.
