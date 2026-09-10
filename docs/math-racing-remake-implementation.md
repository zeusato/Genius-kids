# Đường Đua Thần Tốc — Cúp Sao Băng

Ngày triển khai: 10/09/2026. Đại ca yêu cầu em làm remake, nâng cấp hình ảnh/trải nghiệm, bảo đảm chọn độ khó hoạt động và sửa xe giật ở mép dưới màn hình.

Cập nhật tiếp theo: đã thay generator toán riêng bằng adapter gọi các generator học toán chung, tăng độ phân hóa cho lớp 1–5. Xem [ma trận nội dung và cơ chế kiểm chứng](math-racing-question-curriculum.md). Các số kiểm thử bên dưới ghi nhận giai đoạn remake trước cập nhật này.

## Tăng thời lượng lượt đua

### Đối thủ trả lời nhanh theo độ khó

Đối thủ tự suy nghĩ khi vào vùng câu hỏi, chọn một trong ba làn rồi dùng cùng chuyển động tăng tốc tối đa 0,75 giây tới trạm. Chấm theo làn thật: đúng nạp năng lượng, sai mất chuỗi và chịu giảm tốc; nitro dùng sau cổng như trước.

| Mức toán | Xác suất đúng theo tính cách | Khoảng suy nghĩ cơ bản / thời gian đọc câu |
| --- | --- | --- |
| Dễ | 52–60% | 55–84% |
| Trung bình | 70–78% | 30–59% |
| Khó | 84–92% | 16–37% |

Bông cẩn thận (+4 điểm phần trăm chính xác, nghĩ lâu hơn), Sóc hấp tấp (−4 điểm, nhanh hơn), Mít cân bằng. Mỗi câu có biến thiên độc lập; 18% lượt có thêm thời gian chần chừ. Không phản ứng dưới 1,1 giây. Câu phức tạp có thời gian đọc dài thì máy cũng cần thêm thời gian. Nhịp đua thay đổi thời gian đọc nhưng không thay đổi xác suất đúng; độ khó toán giới hạn độ thông minh.

Quyết định dùng seed theo câu và đối thủ, không đọc vị trí/đáp án/tốc độ trả lời của người chơi, không ép thắng thua hay dịch chuyển xe. Ván dở giữ trạng thái suy nghĩ/tăng tốc; snapshot cũ tự bắt đầu cơ chế khi vào câu hỏi. Luyện toán không có đối thủ. Garage mô tả hành vi máy theo mức đang chọn, HUD hiển thị mức đối thủ.

Kiểm chứng: 86 kiểm thử game đạt; 36.000 quyết định mô phỏng kiểm tra phân tầng chính xác và phản ứng; kiểm tra vượt người chơi chậm, người chơi nhanh thắng máy Khó, chấm đúng làn, nitro, pause/save/resume, snapshot cũ và chuyển động ổn định 30/60/144 Hz. Bản xem trước xác nhận đối thủ Khó tự vượt lên và thứ hạng cập nhật.

Cập nhật thao tác trả lời: thêm nút **Trả lời ngay** dưới ba đáp án và phím Enter. Sau khi chủ động chọn bằng chạm/phím số/mũi tên/vuốt, có thể chốt làn và lướt tới cổng trong tối đa 0,75 giây, không tốn nitro. Xe di chuyển liên tục trên vòng mô phỏng/render hiện có; không dịch chuyển tức thời. Đáp án khóa trong lúc tới cổng, chấm đúng/sai một lần tại cổng; nếu không bấm, thời gian suy nghĩ giữ nguyên. Trạng thái tăng tốc lưu và khôi phục cùng ván dở.

Kiểm chứng thao tác mới: 77 kiểm thử game đạt, gồm trả lời đúng/sai ở ba nhịp đua, chống bấm trùng/đổi đáp án sau khi chốt, thao tác sát cổng, chế độ chờ chọn, tạm dừng/khôi phục và chuyển động 30/60/120/144 Hz. TypeScript sạch. Trình duyệt đã xác nhận nút khóa khi chưa chọn, hiển thị đáp án chốt, khóa làn khi tăng tốc và ghi nhận câu trả lời.

Theo phản hồi lượt đua kết thúc quá sớm, các ván mới có 12–24 câu/chặng hành trình (lần lượt 12, 14, 16, 18; 16, 18, 20, 22; 20, 22, 24, 24), đua nhanh 18 câu và luyện toán 12 câu. Khoảng chuyển câu, thời gian đọc từng dạng bài và cơ chế chọn độ khó giữ nguyên. Garage và engine dùng chung hàm tính số câu.

Ván đã lưu dùng số câu cũ qua `lengthVersion`, tránh thay đổi đường đua giữa chừng. Luyện lại câu sai hỗ trợ chỉ số tới câu 24 và chỉ sinh lại bộ nguồn một lần. Khi một dạng bài ít biến thể hết câu chưa dùng (ví dụ dãy tròn chục lớp 1), generator chọn dạng khác cùng lớp/mức, không lặp câu hoặc hạ độ khó.

Kiểm chứng: 65 kiểm thử game đạt, gồm 7.200 câu ở độ dài 24 cho mọi lớp/mức, tính nhất quán của 10 câu đầu, hoàn thành chặng dài, nitro, luyện lại câu sau thứ 10 và đọc ván ngắn cũ. TypeScript sạch; giao diện đã xác nhận số câu 12/18/12 và ván đua nhanh thực tế có 18 câu.

## Phạm vi đã làm

- Điểm vào `math-racing` mở garage Cúp Sao Băng. Giữ bản cũ qua `edition=classic` hoặc `VITE_RACING_V2=false`; giữ điều kiện lớp học của hub.
- Kart 3D có tay đua, bánh xe, đổi làn, bóng tiếp xúc; đường cong qua thung lũng, bờ biển và thành phố. Hub dùng SVG riêng, scene 3D chỉ tải khi vào game. Có 3D tiết kiệm, Canvas 2D và giảm chuyển động.
- 12 chặng, ba ngoại hình kart, ba đối thủ máy, cổng toán, vật cản, tinh thể năng lượng, nitro, combo. Sai đáp án vẫn tiếp tục ván. Có hành trình, đua nhanh và luyện toán.
- Ba mức toán theo lớp 1–5, độc lập với ba nhịp đua. Garage mô tả rõ phạm vi toán và thời gian đọc. Lựa chọn được giữ khi bắt đầu/chơi lại; URL `level` hợp lệ ưu tiên hơn cấu hình đã lưu, URL không có `level` giữ lựa chọn trước.
- Điều khiển bàn phím, đáp án bằng nút lớn và vuốt; bố cục responsive; hướng dẫn, pause, tự pause khi rời tab, nghe câu hỏi và tùy chọn chờ đáp án. Nitro không rút ngắn thời gian đọc toán.
- Kết quả có độ chính xác, thứ hạng, thời gian hoạt động, combo và các câu cần ôn. Luyện lại đúng những câu đã sai theo seed cũ.
- Lưu theo hồ sơ, khôi phục ván dở, phát hiện snapshot hỏng, thử lại khi lỗi lưu. Kết quả idempotent; sao chặng chỉ cộng phần tăng thêm, tối đa 36 sao hành trình, thành tích thưởng riêng. Đua nhanh/luyện toán không cộng sao hành trình.

Asset được dựng trực tiếp bằng Three.js/Canvas/SVG, sử dụng thư viện và font/nhạc cục bộ có sẵn. Không gọi Flow hoặc tạo bitmap AI trong đợt này; hình khối trực tiếp giúp xe và vật thể khớp góc nhìn, không cần tách nền và không thêm tải ảnh lớn.

## Sửa giật xe ở cạnh dưới

Nguồn mã trước sửa cho thấy engine có một vòng requestAnimationFrame, renderer có vòng khác, xe lấy thẳng vị trí 60 Hz nhưng camera tự lerp vị trí và nhìn vào đích chưa nội suy. Sai lệch dễ thấy nhất ở xe gần camera. Đối thủ còn được vẽ tới phía sau camera và bánh xe/nitro có chi tiết chuyển động tần số cao.

- `motion.ts` dùng một đồng hồ: renderer chạy physics bước cố định trước, sau đó nội suy giữa hai bước. Camera và cả bốn xe dùng đúng cùng một frame. Bản 2D dùng chung driver này.
- Camera theo vị trí và điểm nhìn liên tục; bỏ độ trễ riêng và zoom FOV theo nitro. Lùi camera nhẹ để dành chỗ cho xe và điều khiển.
- Đối thủ mờ dần từ 1 đến 7 đơn vị phía sau người chơi, trước khi vào vùng sát camera; có fade ở biên xa. Không bật/tắt khi vừa ngang người chơi trong bản 2D.
- Bánh quay theo quãng đường, bỏ nan tương phản cao; vệt nitro ổn định. Pause/nghe giữ nguyên pose đang hiển thị; resume không bù thời gian đã dừng. Frame treo quá 600 ms tự pause.
- Giảm độ chia lưới cho cảnh vật và gộp mesh tĩnh. Không thay luật tính điểm, sinh toán hay lựa chọn độ khó để xử lý lỗi hình ảnh.

## Kiểm thử và cách tái hiện

Theo phản hồi tiếp theo của Đại ca, đoạn trống giữa câu đã rút từ 110 xuống 50 đơn vị đường: khoảng 2,17 giây ở Thư thả, 1,79 giây ở Vừa sức và 1,47 giây ở Thần tốc (chạy bình thường). Giữ nguyên vùng đọc 110 đơn vị và thời gian trả lời 10/8/6 giây, cộng thêm thời gian theo dạng toán như trước. Mỗi đoạn chuyển câu chỉ còn một vật thể: năng lượng và cọc tiêu luân phiên ở chặng có vật cản, không có cọc ngay lúc xuất phát, không va chạm vật thể trong vùng toán. Thông báo câu cũ ẩn khi câu mới hiện; đoạn về đích cũng rút ngắn. Kiểm thử đo chuyển câu đúng/sai/có nitro và xác nhận thời gian đọc không giảm.

Chạy từ gốc repo:

```text
node node_modules/vitest/vitest.mjs run --maxWorkers=2
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/vite/bin/vite.js build --logLevel warn
```

Các kiểm thử mới bao phủ 15 tổ hợp lớp/độ khó, 15.000 câu mẫu với phép tính kiểm tra độc lập, đáp án duy nhất, phạm vi toán và tính độc lập với nhịp đua; hoàn tất 12 chặng; nitro, pause, chờ lựa chọn, va chạm và khôi phục; lưu thất bại/thử lại, thưởng không trùng và cách ly hồ sơ.

Kiểm thử chuyển động kiểm tra vị trí liên tục ở 30/60/90/120/144 Hz, frame không đều, chiếu xe gần camera, pause/nghe/resume, đổi ván, fade liên tục và kết quả ván giống nhau qua các tần số render.

Lượt chạy toàn dự án sau thay đổi nhịp câu: 495 kiểm thử / 31 file đều đạt với hai worker. Sau đó, bộ lưu dữ liệu 6 kiểm thử đạt, gồm kiểm thử mới chuyển ván dở từ đường đua dài cũ sang đường ngắn: giữ cấu hình, nội dung toán, thời gian, năng lượng và trạng thái đồ vật; vẫn từ chối dữ liệu hỏng hoặc khác hồ sơ. Lượt chạy toàn dự án đồng thời với build trước đó bị timeout khi tranh tài nguyên; chạy giới hạn worker đã xác nhận lại mà không nới timeout hoặc sửa các phần không liên quan.

TypeScript và build production cuối cùng đều thành công. Build còn các cảnh báo sẵn có về import/chunk lớn và đường dẫn font public; đã xác nhận hai font Nunito được chép vào `dist/hub/fonts`. Trang preview không xuất hiện trong `dist`.

Trang DEV: `/Genius-kids/racing-preview.html`. Dùng hồ sơ trong bộ nhớ, không ghi lịch sử học sinh thật. Mở thanh DEV, chọn `traffic` rồi “Mở cảnh kiểm thử” và “Tiếp tục đua” để tái hiện vượt xe sát camera. Các cảnh `gate`, `result` và giả lập lỗi lưu phục vụ QA toán/kết quả. Trang này không nằm trong build/precaching sản phẩm.

Đã kiểm tra trong trình duyệt desktop và các kích thước màn hình mô phỏng, gồm garage, chạy đua, cấu hình Khó/Thư thả, giữ cấu hình khi chơi lại, kết quả, lưu lỗi/thử lại và cảnh traffic. Chỉ số fps là phép đo ngắn trên máy phát triển, không thay thế kiểm tra thiết bị thật. Chưa xác nhận hiệu năng điện thoại vật lý, bài stress liên tục 10 phút, offline lần đầu hoặc ngắt GPU thật giữa ván.

## Giới hạn so với thiết kế ban đầu

Garage tự xoay xe; chưa có kéo xoay tự do. Cảnh dùng hình khối procedural, chưa có bộ asset điện ảnh từ Flow. Hướng dẫn bằng bảng tương tác và gợi ý trong lượt đua. Chưa triển khai hướng dẫn lái riêng nhiều bước, hệ thống va chạm giữa các kart hay đua mạng. Chưa deploy trong đợt này.
