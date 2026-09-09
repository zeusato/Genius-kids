# Đại chiến rồng thần — kế hoạch làm lại trải nghiệm phiêu lưu

Ngày: 09/09/2026. Trạng thái: **Đã triển khai và kiểm tra bản chơi**.

## Kết quả triển khai

- Màn chơi phủ toàn màn hình; xúc xắc gọn ở góc, HUD/buff/âm thanh nổi, câu hỏi và kết quả trong modal có focus trap.
- Dũng sĩ trẻ cưỡi ngựa thay pháp sư: mô hình `knight.glb` khoảng 1.15 MB, 13 mesh, 13,404 tam giác, 6 clip; có bước chạy chân ngựa và chuyển động người cưỡi. Bản 2D cũng là dũng sĩ cưỡi ngựa.
- Hai camera Theo nhân vật / 3D tự do, thu phóng, Toàn cảnh và Về nhân vật; giữ lựa chọn camera theo hồ sơ.
- Năm đường đi riêng: rừng uốn lượn, quần đảo nối cầu, pha lê xoắn vào trung tâm, tuyết đường đèo tăng độ cao, thành rồng các sân liên tiếp. Chia 50 node theo chiều dài thực của đường; mọi cặp cách nhau tối thiểu 1.65 đơn vị so với đường kính tile 1.4. Không sửa tọa độ/ID trong bản lưu.
- 8 ảnh Flow thực tế (5 nền + 3 chân dung), khoảng 1.23 MB tổng cộng. Dùng file WebP nội bộ; nguồn ghi trong `public/dragon/art/README.md`.
- Hai MP3 Suno do Đại ca tải đã chuyển từ `public/` sang `public/dragon/audio/`, gắn vào các vùng, chuyển nhạc 1.2 giây, hạ âm lượng khi TTS và giữ vị trí khi pause/resume. Đã dùng 1/5 lượt tạo, 10/50 credit; không dùng thêm 40 credit còn lại.
- Hiệu ứng xúc xắc/bước chân/dịch chuyển tổng hợp, animation và hạt phép thuật trong cảnh. Instancing, một atlas cho 50 nhãn, giới hạn DPR, hạ chất lượng tự động; ngừng vòng render nền khi ẩn/tạm dừng, fallback 2D khi mất WebGL.
- Toàn bộ 412 kiểm thử đã qua, gồm kiểm thử mới về 5 bố cục không chồng node và điều phối âm thanh. TypeScript, production build và `git diff --check` đã qua. Kiểm tra trình duyệt: camera và mô hình cưỡi ngựa; modal tại 390 × 844; trả lời đúng +10; pause/resume; boss chuyển từ câu 1 sang câu 2; kết quả 220 điểm, 15/15 câu và +3 sao; fallback 2D và chuyển lại 3D. Chưa đo FPS trên điện thoại vật lý. Build còn cảnh báo chunk lớn/import hỗn hợp ở các phần khác của ứng dụng.

Phần dưới giữ lại định hướng ban đầu để đối chiếu. Các chi tiết thực thi thực tế ở trên có ưu tiên nếu khác kích thước/bố cục dự kiến.

Theo yêu cầu của Đại ca: bản đồ lớn và hấp dẫn hơn; bỏ cảm giác nhìn vuông góc từ trên xuống; xúc xắc nhỏ ở góc; câu hỏi xuất hiện trong modal; khai thác Google Flow cho hình ảnh và hiệu ứng. Tài liệu này thay thế định hướng trình bày trong `dragon-quest-remake-plan.md` (camera cố định toàn cảnh và panel bên cạnh). Luật chơi và dữ liệu chiến dịch tiếp tục theo bản hiện tại.

## 1. Kết quả cần đạt

Người chơi cảm thấy đang đưa một anh hùng nhỏ đi qua thế giới phép thuật: thấy cây, vách đá, cầu, cổng và rồng có kích thước, chiều sâu; mỗi lượt gieo tạo ra chuyển động và một sự kiện đáng chờ đợi.

- Cảnh chơi phủ toàn bộ vùng nội dung và nằm sau HUD; lúc không có câu hỏi, ít nhất 85% diện tích màn hình dành cho thế giới.
- Xúc xắc nằm góc dưới phải, cụm khoảng 104–128 px trên desktop và 76–96 px trên mobile; vùng bấm tối thiểu 44 px.
- Câu hỏi chỉ chiếm chỗ khi gặp sự kiện. Modal dùng DOM để chữ rõ, hỗ trợ bàn phím và TTS.
- Hai chế độ camera chuyển trực tiếp trong ván: **Theo nhân vật** và **3D tự do góc chếch**. Có thêm Toàn cảnh, phóng/thu và Về nhân vật. Toàn cảnh cho xem đủ 50 ô ngay từ đầu; không che thông tin đường đi.
- Hình ảnh thống nhất: truyện phiêu lưu 3D cách điệu, hình khối tròn rõ, chất liệu có chi tiết vừa đủ, màu tươi có tương phản, ánh sáng ấm. Rồng oai nhưng thân thiện với trẻ.

## 2. Hiện trạng đã kiểm tra

Bản `d86c332` mở mặc định `adventure/DragonAdventure.tsx` từ `GamesMenu.tsx`; `DragonQuestGame.tsx` là bản cũ, không phải nơi chính để làm lại.

| Vị trí | Hiện trạng | Thay đổi dự kiến |
| --- | --- | --- |
| `DragonAdventure.tsx`, `dragon.css` | Cảnh và `RoundPanel` chia hai cột; nhiều khoảng trống dành cho mô tả | Tách màn chọn hành trình và màn chơi; màn chơi là canvas toàn vùng với HUD nổi |
| `World3D.tsx` / `Camera` | Camera orthographic cố định tại `[0,18,12]`, nhìn về tâm; zoom để chứa cả bàn | Camera góc chéo bám nhân vật, chuyển cảnh có mục đích, chế độ toàn cảnh riêng |
| `content.ts` / `createMap` | 50 ô bố trí thành lưới zíc zắc 10×5 | Tách tọa độ trình bày khỏi dữ liệu luật; đường liên tục uốn qua các cụm địa hình |
| `BoardTiles.tsx` | Ô hộp phẳng; nhãn atlas tốt về hiệu năng | Bệ đá có độ dày, mép vát, dấu khắc; số dễ đọc; giữ instancing/atlas |
| `RoundPanel.tsx` | Gộp gieo, gặp nhân vật, câu hỏi, dịch chuyển, kết quả, buff | Tách thành các lớp HUD/modal theo phase |
| `World2D.tsx` | Thu nhỏ toàn bộ bàn 50 ô | Bản 2.5D nhẹ cùng bố cục, camera/pan và thông tin tiến độ |

Camera hiện tại không thực sự 90°: góc hạ khoảng 56° so với mặt đất. Cảm giác nhìn từ trên xuống chủ yếu do góc cao, khung cảnh nhỏ, ép đủ 50 ô và các chi tiết cao bị thu nhỏ. Chỉ sửa góc camera sẽ chưa đủ.

## 3. Bố cục và camera

### Màn chọn hành trình

Thế giới vùng đất là nền chính. Thẻ chặng xuất hiện ở cạnh hoặc đáy theo thiết bị, có ảnh đại diện vùng và tiến độ. Vào chặng chuyển liền mạch từ toàn cảnh tới anh hùng tại ô 01. Các điều khiển AI/độ khó/chủ đề ở màn chuẩn bị đang có.

### Trong ván

- Góc trên trái: tạm dừng, tên vùng/chặng gọn. Không lặp lại hướng dẫn dài.
- Góc trên phải: ba tim, điểm và ba buff. Bấm buff mở mô tả ngắn.
- Góc dưới phải: xúc xắc và nút Gieo; thông báo kết quả ngay tại cụm.
- Góc dưới trái: nút Toàn cảnh/Về nhân vật và tiến độ Ô 18/50. Mini-map thu gọn có thể mở, không chiếm một panel thường trực.
- Chú giải chỉ mở khi cần. Thông tin nguồn đề AI/local chuyển về phần thông tin/cài đặt.
- Không cuộn cả trang để tìm nút gieo hay đáp án; áp dụng safe area và kiểm tra bàn phím ảo trên mobile.

Camera khởi đầu thử góc hạ 35–42° so với mặt đất, xoay chéo 25–35° so với trục đường, phối cảnh nhẹ (FOV khoảng 35–40°). Chọn thông số cuối bằng cảnh chạy thật trên desktop/mobile. Hai chế độ dưới đây là yêu cầu đã được Đại ca bổ sung ngày 09/09:

| Chế độ | Hành vi |
| --- | --- |
| Theo nhân vật (mặc định) | Tự bám hero và nhìn trước dọc đường; nội suy vị trí, không xoay giật theo từng bước; cho chỉnh khoảng cách |
| 3D tự do | Camera chếch nhìn thế giới; kéo để xoay/pan, cuộn hoặc pinch để zoom; giới hạn góc hạ khoảng 25–60° để không thành nhìn 90° hoặc lọt dưới địa hình; hero vẫn đánh dấu rõ |

Đổi chế độ không sửa session, gieo lại, tạo lại câu hỏi hoặc reset bước di chuyển. Lưu lựa chọn trong preferences của hồ sơ. Nút Về nhân vật căn target về hero, giữ chế độ hiện tại. Toàn cảnh tạm thu camera ra để thấy 50 ô và có hành động trở về góc trước; không ghi đè lựa chọn follow/free.

- Chơi thường: thấy khoảng 8–14 ô và một mốc cảnh phía trước; hero ở khoảng một phần ba dưới khung hình.
- Di chuyển: nội suy mềm, nhìn trước 1–2 ô; giữ trục ổn định, không xoay 180° khi đường đổi hướng.
- Gặp sự kiện: tiến gần nhẹ rồi mở modal; cây hoặc đá chắn hero sẽ mờ đi.
- Boss: một lần giới thiệu ngắn, camera đặt góc đấu giữa hero và rồng trong chế độ Theo nhân vật; ở 3D tự do, giữ góc đã chọn và cho nút xem cận cảnh. Vẫn dùng modal cho câu hỏi.
- Toàn cảnh: thu ra để nhìn 01–50, đánh dấu vị trí hiện tại/đích gieo; bấm Về nhân vật để trở lại.
- Trong chế độ Theo nhân vật, sau kéo xem có thể bấm Về nhân vật hoặc tự trở lại nhẹ khi gieo. Trong 3D tự do, tôn trọng góc người chơi chọn và không tự cướp camera khi gieo; hero ra ngoài khung thì chỉ hiện chỉ hướng/nút căn lại. Giảm chuyển động dùng chuyển vị trí trực tiếp/fade, tắt rung.

## 4. Bản đồ và thế giới

Vẫn là một tuyến 50 ô, không thêm chọn nhánh hoặc click ô để đi. Đường zíc zắc được uốn mềm và đặt lên địa hình có tầng: bậc đá, cầu, thác, đảo nhỏ và sân boss. Mỗi chặng bố trí 4–5 cụm cảnh để đường đi có các mốc dễ nhận biết.

Mọi vị trí 01–50 và loại sự kiện giữ nguyên theo seed; hệ thống mới chỉ quyết định vị trí hiển thị, độ cao, hướng quay và cảnh vật xung quanh. Số ô gần hero rõ; số xa giảm chi tiết. Ô dừng, ô đang đứng và hướng đi có dấu nhận diện bằng cả hình và màu.

| Vùng hiện có | Hướng hình ảnh | Chuyển động môi trường / mốc nổi bật |
| --- | --- | --- |
| Rừng Mầm Sáng | Cây cổ thụ, rễ cầu, rêu, nấm sáng, suối | Lá đung đưa, đom đóm, thác nhỏ; sân rồng trong thân cây |
| Quần đảo Gió | Đảo nổi, cầu dây, cối gió, cánh buồm | Mây trôi nhiều lớp, cờ và cánh buồm; cầu dẫn tới đảo boss |
| Hang Pha Lê | Vòm đá, tinh thể, hồ phản chiếu nhẹ | Tinh thể sáng theo nhịp, bụi sáng; lõi pha lê cạnh rồng |
| Đỉnh Tuyết | Vách băng, thông tuyết, lều và đèn ấm | Tuyết nhẹ, hơi thở, cực quang; cầu băng tới đỉnh |
| Thành Rồng | Cổng thành, tháp, cầu đá, vàng và đỏ ấm | Cờ bay, lửa đuốc; rồng đứng trong sân lâu đài |

Hero và boss cần đủ lớn để thấy tư thế và biểu cảm. Tái dùng animation GLB hiện có, chỉnh silhouette, chất liệu, tỷ lệ và chuyển động theo bộ art mới. Đi bộ có nhịp chân, xoay theo đường, dừng có độ nảy nhỏ; rồng thở, chớp mắt, vẫy cánh và phản ứng theo kết quả.

## 5. Nhịp một lượt chơi

1. Bấm Gieo: xúc xắc lăn trong cụm ở góc khoảng 0,6–0,9 giây. Kết quả lấy từ engine rồi animation dừng đúng mặt; không rút số ngẫu nhiên lần nữa trong render.
2. Hiện số bước; đánh sáng các ô sắp đi và ô đích. Hero bước từng ô, có âm bước chân và bụi; camera theo.
3. Ô thường: trả quyền gieo nhanh. Ô có sự kiện: quái/tiên/cổng xuất hiện tại ô dừng, một nhịp giới thiệu ngắn.
4. Câu hỏi: modal xuất hiện trên cảnh đã giảm chuyển động. Gộp lời chào và câu hỏi để tránh bắt trẻ bấm hai lần chỉ để bắt đầu giải.
5. Đúng: spell/ánh sáng, nhân vật phản ứng, +điểm bay về HUD; nhận buff có khoảnh khắc riêng. Sai: phản ứng nhẹ, trừ tim đúng luật, giải thích rõ, nút Tiếp tục luôn đọc được.
6. Modal đóng: camera trở lại theo dõi, cụm Gieo bật lại. Dịch chuyển có hiệu ứng cổng và vệt bay tới ô đích, xử lý chuỗi cổng đúng engine.

Thời lượng trên là mục tiêu thiết kế. Animation không được tự ý đổi bước luật, rút RNG hoặc làm mất sự kiện nếu frame chậm. Thắng/thua và nhận thưởng vẫn do engine/progress quyết định.

## 6. Modal câu hỏi

- Desktop: rộng khoảng 640–760 px tùy nội dung, tối đa 90vw; mobile tối đa phần màn hình còn lại sau safe area, cuộn nội bộ khi cần.
- Header ngắn theo nhân vật/sự kiện; portrait có biểu cảm; câu hỏi và hình minh họa là trọng tâm.
- Lựa chọn 2×2, tự chuyển một cột với đáp án dài. Input không bị bàn phím che. Nút nghe lại và trạng thái đang đọc rõ.
- Feedback và đáp án đúng nằm trong cùng modal, không mở thêm modal chồng lên.
- Boss: số câu còn lại diễn đạt bằng các phong ấn, tim hero luôn thấy. Phong ấn giảm theo quy tắc cả đúng và sai đều tiêu thụ lượt; hiệu ứng không được khiến người chơi hiểu sai là mọi câu sai đều phải trả lời lại.
- Trong lúc hỏi/feedback, khóa gieo và tương tác bản đồ. Nền vẫn thấy nhưng giảm chuyển động/âm nhạc.
- Escape/nút tạm dừng đưa vào pause rồi tiếp tục đúng câu; click nền không bỏ qua thử thách. Focus được giữ trong modal và trở về nút Gieo khi kết thúc lượt.
- Đồng hồ thử thách bắt đầu sau khi modal sẵn sàng và TTS kết thúc hoặc người chơi chọn sẵn sàng. Chuyển cảnh, tab ẩn và pause không tiêu hao thời gian làm bài.

## 7. Sử dụng Google Flow

Đã mở được project **Game Assets** trong trình duyệt. Giao diện hiện có Image/Video, Nano Banana 2 ở chế độ Image và lựa chọn tỷ lệ. Chưa gửi lệnh tạo asset trong bước lập kế hoạch này.

### Cách phối hợp asset và 3D

Flow cung cấp ảnh/video cho art direction, nền xa, portrait, biểu cảm, icon vật phẩm, texture và cảnh mở đầu/boss. Địa hình có chiều sâu, đường đi, nhân vật chuyển động và vật thể tương tác tiếp tục được dựng/render bằng Three.js + GLB. Không giả định ảnh/video tạo ra từ Flow là mô hình 3D có rig hoặc asset có alpha.

Ảnh nền không vẽ sẵn bàn 50 ô, chữ hoặc HUD; số ô và tương tác được render riêng để vẫn khớp engine, sắc nét và thay đổi được. Vật thể đặt trong scene dùng texture đúng mục đích hoặc billboard có kiểm soát, không dán cả ảnh concept lên mặt phẳng rồi coi là bản đồ 3D.

### Lô mẫu cho Rừng Mầm Sáng

| Nhóm | Đầu ra mẫu | Cách dùng |
| --- | --- | --- |
| Art tổng thể | 1 key visual góc chéo | Khóa màu, ánh sáng, tỷ lệ nhân vật và cảnh |
| Môi trường | 1 nền xa 16:9, 1 bảng mẫu chất liệu rêu/đá/gỗ | Nền nhiều lớp và vật liệu cảnh |
| Nhân vật | Hero, tiên, quái, Rồng Mầm: mỗi nhân vật 1 mẫu chuẩn | Portrait và tham chiếu chỉnh mô hình; lấy mẫu đạt làm reference cho biểu cảm |
| Vật phẩm | Kiếm Thánh, Chén Thánh, Áo Choàng: 3 ảnh vuông | HUD, thông báo nhận buff, sổ rồng |
| Video | 1 đoạn giới thiệu boss 3–5 giây nếu phù hợp với tùy chọn Flow | Cảnh một lần, bỏ qua được; có ảnh poster và animation 3D thay thế |

Lô đầu gồm khoảng 10 ảnh chọn lọc và tối đa 1 video mẫu; số lần sinh phụ thuộc chất lượng. Tạo mẫu trước, chọn kết quả đồng nhất rồi mới mở rộng sang 5 vùng, 5 boss và biểu cảm. Không tạo hàng loạt các ảnh thiếu liên kết phong cách.

### Prompt và xử lý đầu ra

- Prompt chung: `Original stylized 3D fantasy adventure for children, readable rounded silhouettes, rich emerald and warm amber palette, tactile hand-painted materials, soft cinematic lighting, adventurous and welcoming mood, cohesive game art, no text, no UI, no watermark.`
- Key visual: thêm `three-quarter camera about 38 degrees above ground, hero near foreground, winding stone trail across elevated forest islands, wooden bridge and waterfall, dragon sanctuary in the distance, strong foreground/midground/background separation, no numbered board tiles`.
- Portrait: dùng cùng reference nhân vật, quy định hướng mặt, tỷ lệ và ánh sáng; `single character, full silhouette, plain contrasting background, generous padding, no cropped limbs`. Chọn biểu cảm neutral/happy/casting/hurt nhẹ từ mẫu chuẩn.
- Texture: sinh riêng chất liệu, kiểm tra đường nối và ánh sáng bị vẽ sẵn; chỉ dùng làm texture lặp khi đã đạt yêu cầu.
- Video: giữ thiết kế nhân vật theo ảnh chuẩn, một chuyển động dễ đọc, không chữ, không đổi hình dạng; kiểm tra nhịp đầu/cuối nếu dùng loop. Hiệu ứng phép thuật trong lượt chơi ưu tiên particle/shader thay vì tải video cho mỗi lần trả lời.
- Tải đầu ra qua giao diện Flow, ghi prompt/reference vào manifest; kiểm tra màu, tay/cánh, alpha thực, đường viền và tỷ lệ. Nếu không có alpha, xuất bản tách nền đã kiểm tra hoặc dùng portrait có nền thiết kế.
- Lưu bản đã tối ưu trong `public/dragon/art/`; manifest ghi phiên bản, kích thước, vùng dùng và fallback. Cắt/nén WebP, giới hạn texture theo thiết bị; nén video ngắn, có poster.

## 8. Hiệu ứng và âm thanh

Các lớp hiệu ứng có thứ tự ưu tiên: di chuyển → tới ô → mở câu hỏi → phản hồi → nhận thưởng. Mỗi chuyển trạng thái phát hiệu ứng một lần theo session/encounter/fx; render lại, resume và fallback không phát thưởng hoặc đòn đánh trùng.

- Combat đúng: hero tung spell, quái phản ứng rồi lùi; sai: khiên lóe, mất tim với rung rất nhẹ có thể tắt.
- Buff: vòng phép dưới chân, vật phẩm hiện rồi bay về đúng ô HUD; không che phần giải thích.
- Teleport: portal ở đầu/đích, vệt di chuyển và camera chuyển có định hướng; áo choàng tạo khiên khi chặn lùi.
- Boss: giới thiệu hình dáng lớn, thay đổi ánh sáng theo phase, phong ấn vỡ và thắng có cảnh ăn mừng ngắn.
- Âm thanh phân biệt gieo, bước chân, đúng/sai, buff, teleport và boss; âm vùng nhẹ. Tôn trọng bật/tắt âm hiện có, duck nhạc khi TTS và phục hồi chính xác.
- Reduced motion giữ đầy đủ thông tin bằng highlight/toast, không rung hoặc tự xoay camera; không có chớp sáng gắt.

### Kế hoạch nhạc Suno — tối đa 50 credit

Đại ca cho phép dùng tab Suno đang đăng nhập, ngân sách **50 credit**, **10 credit/lần tạo**, mỗi lần **2 track**, tối đa **5 lần tạo / 10 track ứng viên**. Đã kiểm tra giao diện Advanced, model đang chọn `v4.5-all`; để trống Lyrics cho instrumental. Chưa tạo nhạc ở bước kế hoạch. Ngân sách do Đại ca cung cấp; kiểm tra số dư/chi phí thực tế trong UI ngay trước khi tạo.

| Lượt | Chủ đề | Prompt âm nhạc dự kiến | Phân bổ |
| --- | --- | --- | --- |
| 1 | Khám phá rừng / nhạc chủ đề | Instrumental whimsical fantasy adventure, warm woodwinds, pizzicato strings, marimba, light hand percussion, 100–110 BPM, memorable original melody, no vocals/choir, steady dynamics, unobtrusive game background | 10 credit, 2 ứng viên; dùng rừng và theme chung |
| 2 | Đảo gió / đỉnh tuyết | Instrumental floating-island adventure, airy flute, celesta, harp, gentle strings, 90–105 BPM, spacious and wondrous, warm rather than sleepy, no vocals | 10 credit, 2 ứng viên; chọn biến thể phù hợp cho gió/tuyết sau nghe |
| 3 | Hang pha lê | Instrumental magical crystal cavern, glass mallets, soft plucks, subtle bass pulse, shimmering pads, 85–100 BPM, curious and playful, no eerie horror, no vocals | 10 credit, 2 ứng viên; khám phá hang và đoạn huyền bí |
| 4 | Thành Rồng | Instrumental royal fantasy castle adventure, playful brass, warm strings, light orchestral percussion, 105–115 BPM, courageous and welcoming, restrained dynamics, no vocals | 10 credit, 2 ứng viên; thành, menu chiến dịch và đoạn kết nếu phù hợp |
| 5 | Đấu boss | Instrumental child-friendly dragon boss battle, rhythmic strings, heroic brass motif, controlled orchestral drums, 120–130 BPM, exciting not frightening, clear repeating sections, no vocals/choir, no harsh distortion | 10 credit, 2 ứng viên; một bản boss chính và một ứng viên thay thế |

Cả hai track trong một lần là biến thể của cùng prompt, không đảm bảo sinh ra hai chức năng âm nhạc khác nhau. Nghe và chọn theo kết quả thực; gió/tuyết có thể dùng cùng track với ambience khác nếu chỉ một ứng viên đạt. Không hứa có 10 track hoàn thiện hoặc stem tách sẵn.

- Tạo tuần tự, nghe 2 kết quả trước lượt tiếp theo; lưu sổ lượt/prompt/track URL/credit còn lại. Lần thất bại có trừ credit vẫn tính vào ngân sách; không tự thử lại ngoài 5 lần, không dùng Extend/Remaster/Stem tốn thêm credit, không mua gói.
- Nếu một chủ đề không đạt, cân đối lượt chưa dùng để sửa và tái sử dụng nhạc chủ đề cho vùng còn lại. Trần là 50 credit, không bắt buộc tiêu hết.
- Yêu cầu đoạn nhạc có nhịp ổn định và ít cao trào đột ngột; mục tiêu đoạn dùng trong game khoảng 60–120 giây lấy từ track đã sinh. Không giả định Suno tạo loop khớp chính xác hoặc tuân thủ BPM tuyệt đối.
- Sau tải từ UI, nghe hết, chọn điểm loop/crossfade, chỉnh mức âm lượng cảm nhận giữa các track và xuất MP3/Ogg phù hợp. Giữ metadata nguồn/prompt và file gốc để chỉnh lại.
- Không tiêu một lượt chỉ để làm tiếng gieo/đúng/sai 1 giây; dùng sound engine có sẵn hoặc âm tổng hợp ngắn cho SFX. Nhạc thắng dùng đoạn cadence đã chọn từ chủ đề hoàng gia hoặc jingle ngắn bằng sound engine.
- Audio director dự kiến ánh xạ vùng → nhạc khám phá, boss → nhạc chiến đấu, question/TTS → giảm âm lượng, pause/ẩn tab → dừng/giảm theo cài đặt. Crossfade khoảng 0,8–1,5 giây, giữ track xuyên suốt các lượt để không phát lại intro liên tục.
- Chuyển question/feedback không chạy chồng hai bài toàn âm lượng; phục hồi mức trước ducking. Âm nhạc và SFX có công tắc riêng, quyền autoplay theo tương tác của người chơi.
- Track tải theo vùng/phase, chỉ prefetch bài boss gần cuối; không đưa cả 10 ứng viên vào bundle/precache. Kiểm tra cảm giác nghe cùng TTS tiếng Việt và loa điện thoại, không chỉ nghe nhạc riêng.

## 9. Phạm vi code

| Nhóm | Công việc |
| --- | --- |
| `DragonAdventure.tsx` | Điều phối phiên chơi; render lobby hoặc gameplay fullscreen; giữ AI, autosave, progress và reward hiện có |
| HUD | Tách `AdventureHUD`, `DiceDock`, `BuffBar`, điều khiển camera; bỏ panel cố định khi chơi |
| Modal | Tách `EncounterModal`, `ResultModal`, tái dùng `QuestionView`; điều phối pause/focus/TTS theo một lớp modal |
| Cảnh | Tách camera, path layout, biome props, actors và effects khỏi `World3D.tsx`; tách CSS lobby/play để tránh ghi đè chồng nhau |
| Tọa độ | Tạo `worldLayout` ánh xạ node id → x/y/z/heading; scene 3D và 2D dùng chung bố trí. Snapshot version 3 tiếp tục đọc được; không thay id/thứ tự/slot/RNG để đổi góc nhìn |
| Assets | Registry cho từng vùng, tải theo vùng và dự phòng. Nâng mô hình hiện có theo reference đã chọn |
| Âm thanh | Mở rộng `musicConfig.ts`/`musicManager.ts` hoặc adapter tương thích thành audio director theo vùng/phase; manifest nhạc Suno và SFX, crossfade/ducking/pause, tránh hai bộ phát cạnh tranh |
| Kiểm thử | Mở rộng fixture preview cho roll/combat/buff/teleport/boss/resume/WebGL; test hành vi modal/timing có thể gây mất lượt |

Giữ 50 ô, phân bố, điểm/máu, công thức buff/boss, 20 màn/5 vùng, AI batch, lưu ván và chống cộng thưởng trùng. Kế hoạch không bổ sung hệ thống nhánh, tiền tệ hoặc chỉ số sức mạnh mới.

## 10. Hiệu năng và tải asset

- Mục tiêu cần đo: desktop khoảng 60 FPS khi di chuyển; mobile tầm trung duy trì ít nhất 30 FPS. Chốt thiết bị tham chiếu khi nghiệm thu.
- Ngân sách khởi điểm: dưới khoảng 120 draw calls và 150 nghìn tam giác ở chất lượng balanced; ảnh/texture của vùng đầu khoảng 8 MB tải nén, tổng gói chơi vùng đầu khoảng 15 MB không gồm video. Đây là trần thiết kế, không phải số đã đo.
- Giữ instanced tiles/props, atlas nhãn; mesh khuất dùng LOD/culling, cap DPR, reuse vật liệu; texture 1K mobile/2K desktop theo vật thể.
- Tải vùng đang chơi trước, chuẩn bị vùng kế tiếp khi nhàn; không tải video hoặc cả 5 vùng trước khi Gieo được.
- Chỉnh quy tắc PWA precache cho art mới: tránh glob ảnh gom toàn bộ asset lớn vào lần cài; dùng cache theo vùng/có giới hạn và poster nhẹ.
- Timeout/error ở asset phải có fallback cụ thể. Chuyển 2D giữ nguyên câu hỏi, điểm, vị trí và trạng thái pause; gameplay không phụ thuộc tải video thành công.

## 11. Thứ tự triển khai và điều kiện hoàn thành

| Giai đoạn | Kết quả review được | Điều kiện chuyển bước |
| --- | --- | --- |
| 1. Bố cục và camera | Một chặng rừng với cảnh lớn, camera góc chéo, DiceDock và modal dùng đề thật | Chơi được trọn roll → move → question → feedback; desktop/mobile không cần cuộn trang để thao tác |
| 2. Art và nhạc mẫu | Lô mẫu Flow rừng/hero/tiên/quái/rồng/buff; lượt Suno đầu tạo theme rừng; registry và asset tối ưu | Các asset dùng cùng reference, đã gắn thật vào cảnh/modal; nhạc nghe cùng TTS không lấn lời |
| 3. Một chặng hoàn chỉnh | Cầu/suối/địa hình, actors, mọi loại sự kiện và trận boss có camera/VFX/SFX | Một ván rừng hoàn chỉnh đủ hấp dẫn, timing chính xác, FPS và bộ nhớ nằm trong ngân sách |
| 4. Mở rộng 5 vùng | Mỗi vùng có silhouette, mốc cảnh, boss và ambience riêng; 20 chặng tiếp tục dùng luật hiện có | Không chỉ đổi màu cùng một đảo; fallback/tải theo vùng đã kiểm tra |
| 5. Nghiệm thu | Luồng thật từ Games, regression, responsive, pause/resume và WebGL loss | Không trắng trang; không mất lượt/tim/đề; lưu ván và thưởng đúng; kiểm tra bàn phím, TTS, touch và reduced motion |

Ưu tiên làm Rừng Mầm Sáng thành một chặng hoàn chỉnh trước khi nhân rộng, vì bố cục/camera mới quyết định loại asset, kích thước và lượng chi tiết thực sự cần. Không bắt đầu bằng tạo hàng loạt hình rồi ghép vào layout cũ.

## 12. Checklist nghiệm thu

- Mặc định thấy thế giới lớn, hero và mốc cảnh dễ nhận ra; có đủ foreground/midground/background.
- Nút Gieo nhỏ đúng góc; camera không giấu hero sau HUD hoặc cây; toàn cảnh vẫn cho xem 50 ô.
- Chuyển Theo nhân vật/3D tự do trong khi đứng, di chuyển, pause/resume và sau modal: góc mượt, không mất trạng thái, chế độ tự do không bị camera tự giành điều khiển.
- Ô đi qua không mở câu hỏi; ô dừng mở đúng modal; teleport liên tiếp và chặn lùi hoạt động đúng.
- Double click Gieo/đáp án không tạo thêm lượt; pause/tab ẩn/resume không chạy nhảy animation hoặc mất thời gian giải.
- Gặp boss, trả lời đúng/sai, hết máu, thắng, chơi lại và nhận thưởng đều giữ đúng luật.
- Desktop 1366×768, tablet ngang/dọc, mobile 390×844 và 360×640: đáp án không bị che, không tràn ngang, nút đạt kích thước chạm.
- AI bật/tắt, timeout/local fallback và resume không tái tạo đề ngoài ý muốn.
- Asset lỗi, mạng chậm, WebGL loss và reduced motion vẫn chơi được; không có video bắt buộc.
- Suno không quá 5 lần/50 credit; nhạc không lời, loop nghe không bị giật, boss chuyển nhạc đúng, TTS vẫn rõ, bật/tắt âm và pause/resume không tạo hai track chồng nhau.
- Chạy bộ test liên quan, TypeScript, production build; đo scene nặng nhất và kiểm tra một ván trên thiết bị mobile thực trước khi tuyên bố đạt hiệu năng mobile.
