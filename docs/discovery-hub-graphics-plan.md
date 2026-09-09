# Nâng cấp màn chọn chế độ và menu trò chơi

Ngày: 09/09/2026. Trạng thái: **đã triển khai**. Nội dung dưới đây lưu lại kế hoạch thiết kế; kết quả thực tế và phạm vi kiểm tra nằm trong [báo cáo triển khai](discovery-hub-implementation.md).

## 1. Hướng thiết kế

**Sảnh khám phá → Bộ sưu tập trò chơi → Không gian riêng của từng game.**

Màn chọn chế độ tạo cảm giác mở một cuốn sách khám phá có những mô hình thu nhỏ. Menu game trình bày các trò chơi như bộ sưu tập ảnh bìa: nhìn hình là nhận ra hoạt động sắp chơi. Khung giao diện dùng chung nền kem, chữ xanh đậm, ánh sáng ấm và nút có độ nổi nhẹ; mỗi hoạt động giữ nhân vật, chất liệu và màu nhận diện riêng.

Ưu tiên diện tích cho các lựa chọn, tên dễ đọc và thao tác trực tiếp. Hình minh họa có chiều sâu bằng phối cảnh chếch, lớp trước/sau và bóng mềm; menu không cần thêm một cảnh WebGL hay video nền.

Phạm vi: `/mode`, `/game`, thành phần điều hướng dùng chung của hai màn và màn chọn hai hoạt động của Kỹ Sư Máy Móc đang nằm trong `GamesMenu`. Nội dung và luật chơi của các game nằm ngoài đợt này. Đường Đua Thần Tốc giữ là game xe riêng; Đua Tốc Độ giữ chủ đề Đấu Trường Tia Chớp.

## 2. Những điểm đã kiểm tra

Đã đọc mã nguồn, xem trực tiếp màn chọn chế độ, menu game và lobby Đua Tốc Độ trên dev server ở khoảng 1280 × 720. Đã mở dự án Game Assets trong Google Flow và thấy các ảnh Tia, sân khấu, dũng sĩ cưỡi ngựa, rồng và nhân vật rừng. Chưa tạo ảnh mới trong bước lập kế hoạch.

| Hiện trạng | Ảnh hưởng | Thay đổi đề xuất |
| --- | --- | --- |
| Hai màn dùng Comic Sans từ cấu hình Tailwind; các game mới đã khai báo Nunito | Chuyển từ menu vào game có cảm giác đổi sản phẩm | Dùng Nunito trong phạm vi hub, kiểm tra nguồn font thực tế và dấu tiếng Việt |
| Chọn chế độ có lời chào lớn, icon tròn lớn, nhiều nhãn nhỏ và hiệu ứng phóng to 105% | Tốn chiều cao, nội dung bị chia vụn, hover xô lệch thị giác | Lời chào gọn; mỗi thẻ có một cảnh minh họa, tên, một câu mô tả |
| Menu game rộng tối đa khoảng 896 px, xếp một cột; độ khó chiếm khối lớn đầu trang | 1280 × 720 chỉ thấy trọn một game và phần đầu game kế tiếp | Khung tối đa 1200 px, ba cột desktop, hai cột tablet, thẻ ngang trên điện thoại |
| Hầu hết game chỉ có icon/emoji lớn | Chưa giới thiệu được đảo ký ức, ban nhạc, robot Tia hay rồng | Ảnh bìa lấy từ hình ảnh thực của từng game |
| Bộ chọn độ khó chung có tác dụng khác nhau | Sound v2, Dragon v2 và Sudoku không dùng lựa chọn này; Memory dùng để đặt số cặp ban đầu, Speed/Racing nhận difficulty | Đưa thiết lập về đúng điểm vào từng game; giữ bộ chuyển đổi cho các bản cũ |
| Cửa hàng, hồ sơ, nhạc và âm thanh nằm ở các vị trí khác nhau | Trẻ phải tìm lại điều khiển khi đổi màn | Một header chung, vị trí và nhãn nhất quán |

Mã nguồn chính: `src/components/ModeSelectionScreen.tsx`, `src/pages/ModeSelectionPage.tsx`, `games/GamesMenu.tsx`, `src/pages/GamePage.tsx`, `tailwind.config.js`.

## 3. Màn chọn chế độ: Sảnh khám phá

### Bố cục

- Header cao khoảng 64–72 px: Genius Kids / tên màn, số sao, âm thanh, cửa hàng và hồ sơ. Đổi học sinh nằm trong menu hồ sơ, có nhãn rõ. Header dùng nền đặc đủ tương phản, không che nội dung khi cuộn.
- Lời chào khoảng 80–100 px: **“Hôm nay mình khám phá gì?”** và tên/lớp của học sinh. Trang trí nhỏ ở mép, không dành một nửa màn hình cho hero.
- Sáu thẻ chính theo lưới 3 × 2 trên desktop. Mỗi thẻ cao mục tiêu 210–225 px, ảnh chiếm khoảng một nửa; vùng chữ có nền rõ, tối đa một câu mô tả và mũi tên vào hoạt động.
- Thẻ là một vùng bấm duy nhất, dùng được bằng Tab và Enter. Tên luôn hiện, không đợi hover mới thấy nút.
- Giữ thứ tự ổn định; không tự đảo vị trí hay chạy carousel. Chưa thêm thanh tìm kiếm hoặc bộ lọc cho sáu lựa chọn.

| Chế độ | Nội dung hình bìa | Mô tả ngắn đề xuất |
| --- | --- | --- |
| Ôn Luyện | Bàn khám phá nhỏ, khối đếm, bàn tính và dụng cụ hình học | Luyện toán theo lớp của em |
| Trò Chơi (nhãn thay cho Games) | Bố cục nhỏ ghép từ thẻ nhớ, ban nhạc và Tia | Chọn một trò, khám phá một thế giới |
| Thư Viện | Cuốn sách mở thành một khu vườn nhỏ | Mở sách, khám phá điều mới |
| Sphinx Riddle · Đố vui Nhân sư | Nhân sư thân thiện trước cổng đố vui | Giải đố cùng Nhân sư |
| Lập Trình Nhí | Rover hiện có bên hành tinh và các khối lệnh | Lập trình rover đi thám hiểm |
| Khoa Học | Đài quan sát thu nhỏ với mô hình hành tinh và tinh thể | Khám phá vũ trụ và khoa học |

Mầm non giữ đúng sáu điểm vào hiện có: **Bảng Chữ Cái, Đếm Số, Màu Sắc & Hình Dạng, Trò Chơi, Thư Viện, Khoa Học**. Ba hoạt động làm quen đứng trước. Chữ cái, chữ số và hình cần chính xác được dựng bằng DOM/SVG; không giao việc tạo ký tự học tập cho ảnh AI.

## 4. Menu game: Bộ sưu tập trò chơi

### Bố cục và thông tin

- Cùng header với Sảnh khám phá; nút quay lại rõ nghĩa **“Về khám phá”**.
- Tiêu đề gọn **“Hôm nay em muốn chơi gì?”**, ngay sau đó là lưới bảy game.
- Desktop: ba cột, bìa 16:9, phần chữ bên dưới. Tên chính và tên chủ đề tách dòng để các tên dài không làm thẻ lệch nhau. Mô tả một câu, tối đa hai dòng; hàng hành động đặt cùng vị trí.
- Tablet: hai cột. Điện thoại: một cột thẻ ngang, hình khoảng 104–120 px bên trái, tên và mô tả bên phải. Ở chiều rộng 320 px, ưu tiên xuống dòng hơn cắt mất tên game.
- Thẻ có một hành động chính: **“Khám phá” / “Vào game”** dẫn vào lobby hiện có; game cần cấu hình mới mở bảng chuẩn bị gọn. Không tự bắt đầu tính giờ khi bấm ảnh bìa.
- Tiến độ nếu hiển thị phải lấy từ hồ sơ thật. Bản đầu có thể hiện số nhiệm vụ hoàn thành của Memory/Sound/Dragon khi adapter đã xác thực; không tạo phần trăm chung cho các game có luật khác nhau.
- Chưa thêm một khối “Tiếp tục” lớn ở đầu menu. Nếu bổ sung sau, chỉ hiện **“Có ván đang chơi”** khi draft đúng hồ sơ, đúng schema và có thể khôi phục; nút mở game để dùng luồng khôi phục của chính game đó. Lịch sử đã hoàn tất không được coi là ván dở.

### Bộ ảnh bìa game

| Game | Hình nhận diện | Nguồn / cách dựng |
| --- | --- | --- |
| Lật Thẻ · Đảo Ký Ức | Hòn đảo, cáo và hai thẻ ghép | Dùng cảnh `Island` và bộ `Picture` SVG hiện có; tạo bản bìa tĩnh, không mount cả game |
| Giai Điệu Vui Nhộn · Ban Nhạc Tí Hon | Cáo, gấu, thỏ trên sân khấu nhạc | Dùng `BandStage` SVG và nhân vật đang có |
| Đua Tốc Độ · Đấu Trường Tia Chớp | Tia, ánh sáng năng lượng và bảng câu đố | Ghép `public/speed-math/art/station.webp` và `tia.webp`; tên, ký hiệu câu đố dựng bằng mã |
| Đại Chiến Rồng Thần | Dũng sĩ cưỡi ngựa, rồng hộ vệ và rừng nổi | Dùng art Flow đã có; kiểm tra nhân vật khớp game thực tế, lấy khung cảnh game nếu cần |
| Đường Đua Thần Tốc | Xe và đường chạy đang có trong game | Dùng CarIcon hoặc ảnh game thực tế; giữ khác biệt rõ với Tia |
| Sudoku Logic | Bàn số, vài ô chọn và quân số | Dựng SVG/DOM với bảng số hợp lệ, không gen chữ số bằng Flow |
| Kỹ Sư Máy Móc | Bánh răng, dây đai và cơ cấu máy | Dùng hình chụp cảnh hiện có hoặc bản SVG tĩnh khớp trò chơi |

Mầm non tiếp tục chỉ thấy Lật Thẻ và Giai Điệu Vui Nhộn trong menu game. Hai thẻ được căn gọn, không kéo giãn ảnh thành banner khổng lồ.

### Độ khó và điểm vào game

- Memory v2: dùng thiết lập số cặp tại Chơi nhanh; giữ mặc định và tùy chọn hợp lệ của game. Chiến dịch dùng cấu hình nhiệm vụ.
- Sound v2, Dragon v2, Sudoku: vào màn chuẩn bị/sảnh của game, không thêm bộ chọn độ khó chung không có tác dụng.
- Speed: cấu hình tại lobby đang có; đảm bảo menu và route trực tiếp dùng cùng mặc định.
- Racing và Memory/Sound/Dragon phiên bản cũ: giữ bộ chuyển đổi difficulty; khi cần hỏi, hiện bảng chuẩn bị nhỏ sau khi chọn game, có lựa chọn mặc định và nút Bắt đầu.
- Kỹ Sư Máy Móc: làm mới hai thẻ Lắp Bánh Răng / Đoán Chiều Quay bằng cùng khung hiển thị, giữ nguyên hành vi mở game.

## 5. Hệ đồ họa và chuyển động

- Nền mặc định kem `#FAF8F0`, bề mặt sáng `#FFFCF3`, chữ xanh đậm `#244D45`, nhấn xanh `#337760`, vàng ấm `#E7B85B`. Đây là palette đề xuất; kiểm tra tương phản trước khi triển khai.
- Nunito cho tiêu đề và nội dung. Kiểm tra font thực sự được tải; nếu đóng gói thêm thì dùng WOFF2 có đủ tiếng Việt, `font-display: swap`. Có fallback hệ thống đọc được ngay.
- Bo góc 20–24 px, viền mảnh và bóng mềm, hạn chế gradient trên chữ. Màu riêng của hoạt động chủ yếu nằm ở ảnh bìa và nhãn nhỏ.
- Hover/focus: nâng thẻ tối đa 3 px, đổi bóng trong khoảng 160–200 ms. Bấm: lún nhẹ 1 px. Tránh phóng to cả thẻ làm cảm giác chồng nhau.
- Chuyển màn fade ngắn khoảng 150–180 ms, nội dung và nút nhận thao tác ngay khi xuất hiện. Không khóa bấm để đợi animation hoặc nhạc.
- Không tự phát nhạc xem trước từng game, không lặp hạt sáng trên toàn menu. Hiệu ứng chọn dùng thiết lập âm thanh chung; đổi màn không bật lại tiếng người dùng đã tắt.
- Giảm chuyển động: bỏ nâng/trượt và trang trí chuyển động, giữ trạng thái focus rõ.
- Theme đã mua vẫn có tác dụng: ánh xạ accent và nền phụ vào theme hiện có, giữ vùng chữ đủ tương phản. CSS giới hạn trong `.discovery-hub`, không đổi font/palette toàn ứng dụng trong đợt này.

## 6. Kế hoạch asset trong Google Flow

Ưu tiên tận dụng art đang có. **Bốn ảnh mới dự kiến** phục vụ Ôn Luyện, Thư Viện, Nhân sư và Khoa Học. Một ảnh sảnh rộng là tùy chọn sau khi thử bố cục; chỉ tạo nếu thật sự cải thiện phần đầu trang.

Art direction chung: mô hình thu nhỏ có chất liệu đồ chơi, phối cảnh chếch 3/4, ánh sáng ban ngày ấm, xanh ngọc/kem/vàng, hình khối dễ nhận ra, ít chi tiết vụn. Có thể đặt mỗi cảnh trong một khung cửa sổ cong để đồng bộ với các game mới. Giữ chủ thể trong 60% vùng trung tâm để cắt ảnh ngang và ảnh gần vuông trên điện thoại.

Prompt nền dùng chung:

> Original premium children's learning app cover illustration, tactile miniature diorama, three-quarter view, rounded sculptural forms, warm soft daylight, cream and sage teal palette with restrained honey gold accents, clear friendly silhouettes, layered depth, uncluttered composition. Main subject fully visible in the central 60 percent, safe to crop to square, wide 16:9. No interface, no text, no letters, no numerals, no logos, no watermark.

Phần chủ thể theo ảnh:

| Tên file dự kiến | Bổ sung vào prompt |
| --- | --- |
| `study.webp` | A curious learning desk with an abacus, tactile counting blocks and simple geometric solids; no written equations |
| `library.webp` | An open storybook unfolding into a tiny welcoming garden and reading pavilion, paper-like trees and a warm reading lantern |
| `riddle.webp` | A friendly young sphinx guardian beside a small sandstone puzzle gate, welcoming expression, no frightening features |
| `science.webp` | A miniature science observatory with an orrery of stylized planets, a telescope and colorful crystals, inviting discovery |
| `hub-panorama.webp` — tùy chọn | A tranquil discovery garden with a reading pavilion and distant observatory concentrated on the right; broad quiet space on the left |

Quy trình: thử một ảnh để kiểm tra phong cách → kiểm tra crop ở thẻ desktop/điện thoại → tạo ba ảnh cùng bộ → chọn từng ảnh → xuất file cục bộ → nén WebP và ghi manifest nguồn/prompt. Không dùng ảnh có chữ AI sai, nhân vật lệch tạo hình hoặc signed URL của Flow làm URL chạy game.

Asset hub dự kiến nằm tại `public/hub/art/`, có README nguồn. Bìa game tận dụng nguồn hiện có hoặc tạo thumbnail cùng thư mục. Mục tiêu bìa khoảng 60–100 KiB ở bản desktop, nhỏ hơn cho mobile; chỉ tải ảnh đang cần, đặt sẵn kích thước và lazy-load phần dưới màn hình. Mục tiêu ảnh cho viewport đầu ≤ 500 KiB, cần đo khi triển khai. Ảnh lỗi vẫn giữ tên, nền màu và nút hoạt động.

## 7. Cách triển khai

### Bước 1 — Chốt bố cục và bộ ảnh

- Dựng mẫu hai màn bằng dữ liệu hiện có, kiểm tra desktop và điện thoại.
- Hoàn thiện bìa tái sử dụng, tạo bốn ảnh Flow còn thiếu theo cùng art direction.
- Chốt thang chữ, kích thước thẻ, crop từng ảnh và các theme đang có.

### Bước 2 — Tích hợp giao diện và điều hướng

- Tạo `src/components/hub/`: `HubShell`, `HubHeader`, `ModeCard`, `GameCard`, `hub.css`.
- Tách dữ liệu tên/mô tả/ảnh/điều kiện lớp thành catalog; giữ ID mode/game và route hiện có.
- `ModeSelectionScreen` hiển thị catalog theo lớp; `GamesMenu` tách phần danh mục khỏi nhánh khởi chạy game.
- Tái sử dụng MusicControls và dữ liệu hồ sơ hiện tại. Thay vị trí điều khiển không tạo thêm một music manager.
- Lazy-load các game sau khi chọn; menu chỉ tải ảnh bìa, không dựng scene 3D, audio engine hay logic gameplay của cả bảy game.
- Tích hợp thiết lập trước khi vào game theo bảng ở mục 4. Giữ cờ VITE_*_V2, callback kết quả của game cũ và cơ chế lưu/thưởng riêng của game mới.

### Bước 3 — Kiểm tra và hoàn thiện

- Kiểm tra layout 320/390/768/1280/1440 px, tên học sinh dài, tên game dài và phóng to chữ.
- Kiểm tra mọi điểm vào của hồ sơ tiểu học và mầm non; trình tự bàn phím khớp trình tự nhìn thấy. Mục tiêu chạm tối thiểu 44 px.
- Mở game → quay lại menu giữ vị trí cuộn, trả focus về thẻ vừa mở; back của trình duyệt có hành vi nhất quán.
- Xác minh các lựa chọn difficulty thực sự đến đúng game; menu và route trực tiếp không tạo cấu hình mâu thuẫn.
- Xác minh mute, giảm chuyển động, theme, mất ảnh/mất mạng và trạng thái tải game.
- Không ghi lại tiến độ hoặc cộng sao khi mở/đóng menu. Không gọi thêm callback thưởng cũ cho các game mới đã tự lưu.
- Chạy typecheck, build và các test có liên quan đến catalog/phân quyền lớp/launch adapter; smoke test luồng chơi và quay lại. Không cần thêm test chỉ để khẳng định màu hoặc class CSS.

## 8. Tiêu chí nghiệm thu

1. Ở 1280 × 720, màn chế độ hiển thị đủ sáu điểm vào với tên và vùng bấm rõ; menu game hiển thị trọn hàng đầu gồm ba game và phần đầu hàng tiếp theo. Đây là mục tiêu thiết kế, chưa phải kết quả đã đo của bản mới.
2. Ở 390 px và 320 px, không cuộn ngang trang, không cắt mất tên hay che nút bằng header/điều khiển nhạc.
3. Nhìn ảnh bìa phân biệt được Tia, rồng/dũng sĩ, ban nhạc, đảo ký ức, xe đua, Sudoku và máy móc.
4. Bộ ảnh, thang chữ, khung thẻ và điều khiển hai màn thống nhất với nhau; chuyển vào game mới vẫn giữ cảm giác liền mạch.
5. Điều hướng đáp ứng ngay, không modal chớp tắt và không khoảng chờ chặn thao tác do trang trí.
6. Bộ lọc theo lớp, dữ liệu học sinh, theme, mute, chế độ cũ, tiến độ và phần thưởng tiếp tục đúng.

Kết quả triển khai: hai màn đã dùng chung bộ giao diện mới, có bốn ảnh Flow mới và thumbnail tái sử dụng từ các game. Xem [báo cáo triển khai](discovery-hub-implementation.md) để đối chiếu những kiểm tra đã thực hiện.
