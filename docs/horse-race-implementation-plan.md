# Cờ Cá Ngựa 3D — kế hoạch triển khai

Ngày lập: 14/09/2026. Cập nhật: đã triển khai bản local theo lệnh của đại ca. Xem [báo cáo triển khai và kiểm thử](horse-race-implementation-report.md). Các phần dưới giữ lại mục tiêu ban đầu; hai ngưỡng thắng trước bot tham lam chưa đạt đủ, không được coi là đã nghiệm thu toàn bộ mức Khó.

Đại ca đã xác nhận luật **ra 6 mới xuất quân; ra 6 được thêm lượt**. Các quyết định còn lại dưới đây là cấu hình em đề xuất cho bản đầu, được ghi cụ thể để có thể kiểm tra và điều chỉnh trước khi viết engine.

## 1. Kết quả cần bàn giao

- Thêm **Cờ Cá Ngựa** vào danh mục trò chơi Genius Kids, mở được từ thẻ game và đường dẫn trực tiếp.
- Chơi theo lượt trên cùng một thiết bị, tổng cộng 2–4 người chơi gồm người thật và máy; luôn có chủ profile tham gia.
- Chủ profile lấy tên/avatar hiện tại. Bạn chơi thêm vào chỉ cần tên và avatar có sẵn, không tạo profile mới. Cho thêm/xóa bạn hoặc máy trước ván; tổng số ghế tự xác định số người chơi.
- Bàn cờ, xúc xắc và quân ngựa là vật thể 3D tương tác được. Phong cách đồ chơi trong khu vườn cổ tích, chất lượng hình ảnh tham chiếu Đại Chiến Rồng Thần.
- Bot có ba mức Dễ / Vừa / Khó, mặc định Vừa. Mức Khó phải đạt các bài kiểm tra chiến thuật và đánh giá thực chiến tại mục 6 trước khi được gọi là hoàn thiện.
- Tạm dừng, tự lưu và tiếp tục ván đúng profile. Chạy bot hoàn toàn trên thiết bị; chơi offline sau khi game và asset cần thiết đã được tải/cache thành công.
- Bản đầu dùng 4 ngựa/người. Chế độ 2 ngựa chơi nhanh, multiplayer qua mạng, thay người giữa ván và tiếp tục phân hạng sau người thắng đầu tiên để dành cho đợt sau.
- Không thêm câu hỏi học tập vào từng lượt: giữ nhịp chơi bàn cờ mà đại ca đã mô tả.

## 2. Khảo sát dự án và ảnh hưởng tích hợp

| Thành phần hiện có | Quan sát đã xác minh | Công việc dự kiến |
| --- | --- | --- |
| `src/components/hub/catalog.ts` | Danh mục hiện có 7 game; kiểu `GameId` và kiểm tra đường dẫn được khai báo tập trung | Thêm `horse-race`, tên/thẻ game và quy tắc xuất hiện theo lớp |
| `src/components/hub/catalog.test.ts` | Kiểm thử đang cố định 7 game; mầm non chỉ có Lật Thẻ và Giai Điệu | Cập nhật kỳ vọng và bảo đảm thẻ game, link trực tiếp, Back/Forward cùng một quy tắc |
| `games/GameLauncher.tsx` | Game được lazy load và có lớp xử lý lỗi khi mở | Thêm entry độc lập, mở thẳng màn chuẩn bị của cờ cá ngựa |
| `src/components/hub/HubArt.tsx` | Có ảnh responsive 400/800 px và hình đại diện riêng cho từng game | Thêm cover cờ cá ngựa, kiểm tra cắt ảnh trên các kích thước thẻ |
| `games/DragonQuest/adventure/WorldScene.tsx` | Có Three.js, React Three Fiber, GLB, animation, các mức chất lượng | Áp dụng kinh nghiệm tải asset, ánh sáng, animation và giới hạn chất lượng vào scene mới |
| `scripts/build-dragon-assets.mjs` | Có quy trình dựng mô hình đồ chơi bằng Three.js và xuất GLB có animation | Viết script riêng cho ngựa/bàn cờ, có thể tận dụng kỹ thuật dựng hình và xuất file |
| `types.ts`, `services/profileService.ts` | Profile và kết quả game có metadata riêng; migration có nhánh xây lại profile | Thêm dữ liệu cờ cá ngựa có version, bảo toàn dữ liệu khi migration |
| `src/contexts/StudentContext.tsx` | Ghi kết quả và cập nhật profile đi qua context | Thêm hành động hoàn thành ván chỉ ghi vào đúng chủ profile, chống ghi trùng |
| `services/achievementService.ts` | Nhánh `GAME_COMPLETE` hiện tăng `gameWins` cho mọi kết quả | Xử lý riêng kết quả `horse-race`: chỉ cộng thắng khi chủ profile là người thắng; giữ hành vi game cũ |
| `src/pages/GamePage.tsx` | Callback chung gắn hoàn thành với thưởng và quay ra menu | Dùng luồng hoàn thành riêng để giữ màn kết quả, ghi đúng người thắng và không thưởng nhầm |
| `vite.config.ts` | Base URL `/Genius-kids/`; precache GLB hiện chỉ có `dragon/*.glb` | Bổ sung cache có phạm vi cho asset game mới và kiểm tra bản production offline |

Đề xuất đưa game vào cả danh mục mầm non và tiểu học vì có thể chơi cùng người lớn; mầm non mặc định bot Dễ, các lớp còn lại mặc định Vừa. Đây là lựa chọn sản phẩm mới, cần thể hiện rõ trong kiểm thử catalog.

Workspace hiện có `.claude/settings.local.json` chưa được theo dõi bởi Git; không thuộc phạm vi kế hoạch này.

## 3. Hợp đồng luật chơi bản đầu

Một engine luật duy nhất phục vụ người chơi, bot, mô phỏng và hiển thị 3D/2D. Không suy ra nước đi hợp lệ từ vị trí mesh hoặc hình ảnh do AI tạo.

| Tình huống | Luật triển khai |
| --- | --- |
| Người chơi | 2–4 ghế, 4 ngựa mỗi ghế, màu riêng; ghế chưa thêm không tham gia lượt |
| Đi đầu | Bốc thăm người đi đầu khi bắt đầu ván; sau đó đi theo thứ tự ghế quanh bàn |
| Xúc xắc | Một viên, các mặt 1–6 có xác suất bằng nhau |
| Xuất quân — đã xác nhận | Ra 6 được chọn xuất một ngựa hoặc đi một ngựa đang có trên bàn. Xuất quân đặt ở ô xuất phát, không đi thêm 6 ô trong cùng hành động |
| Thêm lượt — đã xác nhận | Sau khi xử lý mặt 6, người đó được gieo tiếp. Đề xuất áp dụng cả khi không có nước đi hợp lệ; ván kết thúc thì không còn lượt thưởng |
| Đường chạy | Dùng 56 ô chung, bốn điểm xuất phát cách nhau 14 ô, cùng một chiều di chuyển. Mỗi quân có tiến độ riêng; ô cửa chuồng là ô cuối trong lộ trình 0–55 của màu đó |
| Đi quân | Đi đúng số điểm; chọn một quân trong danh sách nước đi hợp lệ. Nếu có nước đi thì phải chọn; nếu không có thì tự bỏ qua với thông báo ngắn |
| Chặn đường | Không nhảy qua bất kỳ quân nào, kể cả quân cùng màu. Không dừng chồng lên quân mình |
| Đá ngựa | Dừng đúng ô có quân đối thủ thì đưa quân đó về khu chờ, xóa tiến độ vòng chạy. Các ô chạy, gồm ô xuất phát, đều có thể bị đá |
| Ô xuất phát có quân | Có quân mình thì không được xuất thêm; có quân đối thủ thì xuất quân sẽ đá quân đó |
| Tới cửa chuồng | Phải tới đúng ô cửa chuồng; kết quả vượt quá cửa không hợp lệ, không dùng phần điểm dư để rẽ vào đích |
| Vào dãy đích | Ở cửa chuồng, mặt xúc xắc k cho phép vào ô đích k khi ô đó và các ô cần đi qua còn trống. Có thể vào thẳng ô 6 nếu hợp lệ |
| Leo đích | Đang ở ô k thì chỉ lên ô k+1 khi gieo đúng k+1; không nhảy bậc. Ví dụ ở ô 4 cần mặt 5 để lên ô 5, rồi mặt 6 để lên ô 6 |
| Hoàn thành ngựa | Lấp các vị trí cuối theo thứ tự 6, 5, 4, 3. Quân đạt vị trí hoàn thành của mình đứng yên, không di chuyển nữa |
| Ngựa trong dãy đích | Không thể bị đối thủ đá, vẫn không được chồng hoặc vượt ngựa mình |
| Kết thúc | Người đầu tiên hoàn thành đủ 4 ngựa thắng. Những người còn lại hiện tiến độ và trạng thái chưa về hết, không tự gán hạng 2–4 |
| Biến thể ngoài bản đầu | Không thêm thưởng lượt do đá/về đích, phạt ba lần 6 liên tiếp, nhảy cửa bằng mặt 1, ô an toàn trên đường chạy hoặc luật thầu mạ/sập hầm |

Trước khi dựng bàn hoàn chỉnh: vẽ sơ đồ ô có ID, ô xuất phát, ô cửa chuồng và dãy đích của cả bốn màu. Viết các ví dụ đi đúng/vượt cửa, chặn ở đường chạy/đích, xuất quân đá đối thủ và leo đích để kiểm tra sơ đồ. Luật về chuồng trên đây là lựa chọn cụ thể của game, không tuyên bố là bộ luật duy nhất của mọi nơi.

## 4. Trải nghiệm cùng chơi trên tablet

### Màn chuẩn bị

- Hiện bốn vị trí quanh hình bàn cờ hoặc trong lưới 2×2: chủ profile, các bạn/máy đã thêm và ghế trống.
- Ghế trống có hai hành động rõ ràng **Thêm bạn**, **Thêm máy**. Tổng người được tính từ ghế đang dùng; không cần bộ chọn số người riêng.
- Bạn mới có tên gợi ý để sửa ngay, tối đa 20 ký tự hiển thị; hỗ trợ tiếng Việt. Chuẩn hóa Unicode/khoảng trắng, tránh tên rỗng và tên trùng sau chuẩn hóa. ID ghế không phụ thuộc tên.
- Tên chủ profile dùng giới hạn hiện có của hệ thống, bố trí được cả tên dài; không sửa tên profile từ màn này.
- Chọn avatar đơn giản từ bộ có sẵn, chọn một màu chưa được dùng. Khi chỉ có hai người, gợi ý hai góc đối diện; không tự đổi màu các ghế đã chọn khi thêm/xóa ghế khác.
- Máy có tên dễ nhớ và mức Dễ/Vừa/Khó riêng cho từng ghế. Trong UI dùng chữ “Máy”, không yêu cầu nhập API key hay bật công tắc AI của ứng dụng.
- Bắt đầu khi có 2–4 ghế hợp lệ và đầy đủ tên. Lưu lựa chọn dưới profile để chơi lại; ván đang tiếp tục giữ cấu hình tại lúc bắt đầu.

### Khi chơi

- Tablet ngang là bố cục chính; toàn bàn chiếm phần lớn diện tích. Tên và avatar gắn với đúng góc/màu, có chỉ báo tiến độ 0/4.
- Dải lượt ghi **Đến lượt Bông**, dùng màu kèm tên/biểu tượng; có thể phát âm báo chuyển lượt. Không phụ thuộc giọng đọc tên riêng để hiểu lượt.
- Nút gieo lớn, ngựa có vùng chạm rộng. Gieo xong, các quân hợp lệ sáng lên; chạm quân để xem đích/đường đi và thực hiện nước đi.
- Nếu vùng chạm hai ngựa gần nhau gây mơ hồ, hiện các lựa chọn quân tương ứng ở bảng điều khiển thay vì chọn đại quân gần nhất.
- Cũng có nút DOM cho từng quân hợp lệ để dùng bàn phím và hỗ trợ tiếp cận; scene không phải lối thao tác duy nhất.
- Mặc định các bé ngồi quanh cùng một bàn: giữ hướng bàn ổn định, chỉ chuyển chỉ báo lượt. Không tự xoay toàn bộ cảnh sau mỗi người.
- Có tùy chọn **Chuyền máy** trong cài đặt: hiện “Đến lượt…” và nút **Sẵn sàng** ở lượt người thật; không bắt bấm này trong chế độ đặt máy giữa bàn.
- Bot gieo/chọn quân tự động; UI thể hiện nước đi với cùng hoạt ảnh như người. Giữ nhịp khoảng 0,6–1 giây khi chuyển sang bot, có tốc độ nhanh trong cài đặt.
- Khóa thao tác gieo/chọn trùng trong khi đang giải quyết lượt. Chỉ báo giúp người chơi biết đến lượt ai; một tablet không thể xác thực bàn tay của từng bé.
- Không giới hạn thời gian suy nghĩ của người thật ở mặc định. Tạm dừng dừng cả bot, âm thanh và hoạt ảnh.

### Kết quả và chơi tiếp

- Nêu đúng người thắng bằng tên/avatar; từng ghế hiện số ngựa đã hoàn thành và số lần đá nếu hữu ích.
- Có **Chơi lại cùng nhóm**, **Đổi người chơi**, **Về danh sách trò chơi**.
- Chơi lại tạo ID ván mới và bốc thăm lại người đi đầu.
- Không dùng thứ hạng suy đoán cho các ghế chưa hoàn thành khi ván đã dừng ở người thắng đầu tiên.

## 5. Bot: thiết kế để có lựa chọn chiến thuật

### 5.1. Nguyên tắc bắt buộc

- Bot nhận trạng thái công khai của bàn, người đang đến lượt, mặt xúc xắc hiện tại và danh sách nước đi hợp lệ.
- Bot không nhận nguồn ngẫu nhiên thật, seed tạo xúc xắc thật hoặc kết quả tương lai. Đổi mức bot không làm đổi xúc xắc.
- Mọi nước bot chọn đều được engine chính kiểm tra lại; cùng một bộ luật với người chơi.
- Mỗi bot tối ưu cơ hội thắng của chính mình. Không có ưu tiên tấn công người thật, không liên minh ngầm giữa các máy.
- Ván thật tạo xúc xắc khi chấp nhận hành động gieo; lưu kết quả trước khi chạy hoạt ảnh. Bot tìm kiếm dùng nguồn ngẫu nhiên riêng; dừng hoặc tăng thời gian tìm kiếm không tiêu thụ xúc xắc của ván thật.
- Trong kiểm thử dùng nguồn xúc xắc có seed để tái hiện lỗi; bản chạy dùng lấy mẫu đồng đều, tránh sai lệch do phép chia dư.

### 5.2. Những điều bot phải cân nhắc

| Yếu tố | Hành vi mong muốn |
| --- | --- |
| Thắng ngay | Chọn nước kết thúc ván nếu có, không bỏ để đuổi đá một quân khác |
| Giữ tiến độ | Bảo vệ quân gần cửa/đích khi tổn thất do bị đá lớn |
| Đá ngựa | So giá trị tiến độ đối thủ bị mất với nguy cơ quân mình bị đá lại |
| Nguy cơ bị đá | Kiểm tra nước hợp lệ của từng đối thủ với các mặt xúc xắc, có xét quân chắn và lượt thưởng |
| Xuất thêm quân | Mở lựa chọn cho các lượt sau, giảm khả năng cả đội kẹt; không mặc định xuất mọi khi có 6 |
| Chặn đường | Cân nhắc cản đối thủ nhưng không tự khóa quân quan trọng của mình |
| Về đích | Cân nhắc vào thẳng vị trí cao, leo đích và giải phóng cửa chuồng |
| Đối thủ sắp thắng | Ưu tiên ngăn người có thể kết thúc trước lượt mình nếu có nước có ích |
| Bàn nhiều người | Tính cả những người sẽ đi trước lượt kế tiếp; không chỉ nhìn đối thủ ngồi ngay sau |
| Lượt 6 liên tiếp | Mô phỏng đúng việc vẫn là lượt của cùng người; không chuyển sang đối thủ sớm |

### 5.3. Thuật toán dự kiến

1. Tạo đầy đủ nước hợp lệ và xử lý trường hợp chỉ có một nước hoặc thắng ngay.
2. Chấm điểm chiến thuật cho từng trạng thái sau nước đi: ngựa hoàn thành, tiến độ còn lại, độ cơ động, nguy cơ mất tiến độ, lợi ích đá/chặn và tình thế đối thủ.
3. Ước lượng các đe dọa gần bằng cách xét các mặt xúc xắc và nước phản ứng hợp lệ. Có xét xác suất; không coi đối thủ luôn gieo được mặt tốt nhất.
4. Với Vừa/Khó, chạy nhiều lượt mô phỏng từ từng nước ứng viên, dùng xúc xắc giả lập riêng và chính sách đối thủ biết chơi. Đánh giá trung bình lợi ích dự kiến thay vì chỉ chọn quân đi xa nhất.
5. Mô phỏng giữ lợi ích riêng cho từng ghế; khi mô phỏng đến lượt ai, chính sách chọn vì lợi ích của ghế đó. Không gộp ba đối thủ thành một đội cùng chống bot.
6. Điểm cuối ưu tiên kết quả thắng/thua đã xác định; tại giới hạn độ sâu mới dùng hàm đánh giá thế cờ. Các giá trị và độ dài tìm kiếm được hiệu chỉnh bằng benchmark, không công bố chúng như xác suất thắng đã hiệu chuẩn.
7. Bắt đầu bằng Monte Carlo đánh giá các nước ứng viên; chỉ bổ sung cây tìm kiếm UCT nếu kết quả đo cho thấy cần. Thuật toán phức tạp hơn không tự động đồng nghĩa với chơi mạnh hơn.

Cơ sở: [CS188 — Expectimax](https://inst.eecs.berkeley.edu/~cs188/textbook/games/expectimax.html) mô hình hóa yếu tố ngẫu nhiên bằng giá trị kỳ vọng; [CS188 — General Games](https://inst.eecs.berkeley.edu/~cs188/textbook/games/general.html) trình bày lợi ích riêng cho từng người chơi. Nghiên cứu [Monte Carlo Methods for the Game Kingdomino](https://arxiv.org/abs/1807.04458) so sánh đánh giá Monte Carlo và tìm kiếm cây trong một game bốn người; kết quả đó chỉ là tham khảo lựa chọn phương pháp, không chứng minh sức mạnh bot cờ cá ngựa.

### 5.4. Mức chơi và ngân sách

Các con số sau là ngân sách khởi điểm để đo và hiệu chỉnh, chưa phải kết quả đạt được.

| Mức | Cách chọn | Ngân sách khởi điểm |
| --- | --- | --- |
| Dễ | Luôn đi hợp lệ, nhận biết thắng ngay/về đích/đá cơ bản; lựa chọn đa dạng trong các nước tốt | Chấm điểm một bước, khoảng 20–40 ms tính toán |
| Vừa | Đánh giá nguy cơ + mô phỏng ngắn để cân bằng đá, xuất quân, giữ tiến độ | Tổng khoảng 64–128 rollout chia đều cho các nước; tối đa 12 hành động/rollout; khoảng 120–200 ms |
| Khó | Mô phỏng sâu hơn, xét phản ứng nhiều đối thủ, cản người sắp thắng và nguy cơ đá lại | Tổng khoảng 256–512 rollout; tối đa 24 hành động/rollout; khoảng 350–500 ms |

- “Hành động” trong giới hạn tìm kiếm bao gồm lượt đi/không đi sau một lần gieo; mặt 6 vẫn tính vào giới hạn dù chưa chuyển người. Tránh tìm kiếm vô hạn vì lượt thưởng.
- Công việc bot nằm trong Web Worker, có trần số nút và thời gian, chia thành từng lô nhỏ để hủy nhanh khi tạm dừng/thay ván.
- Mỗi yêu cầu mang `matchId`, `revision`, `turnId`, `requestId`; bỏ kết quả cũ hoặc kết quả của ván đã kết thúc. Tạm dừng hủy yêu cầu cũ, tiếp tục tính lại từ trạng thái đã lưu.
- Hết thời gian thì trả nước tốt nhất đã đánh giá. Nếu worker lỗi, dùng đánh giá chiến thuật cục bộ có giới hạn và thông báo nhẹ; không âm thầm đổi bot Khó thành chọn ngẫu nhiên.
- Nếu máy yếu không đáp ứng ngân sách, giảm số lượt mô phỏng và vẫn giữ thao tác/hoạt ảnh mượt. Ghi rõ cấu hình đã đo khi nghiệm thu.

## 6. Định nghĩa “bot đủ thông minh” và cách nghiệm thu

Không thể cam kết bot thắng mọi người trong trò có xúc xắc. Cam kết kỹ thuật là đúng luật, công bằng, thể hiện các quyết định chiến thuật quan trọng và đạt kết quả đo trước khi bàn giao.

### Bộ tình huống cố định

Tạo ít nhất 20 tình huống có lý do rõ ràng; xoay qua đủ bốn màu và cả bàn 2/3/4 người. Đánh dấu riêng các nước bắt buộc do luật/thắng ngay và các nước được ưu tiên về chiến thuật.

Các tình huống tiêu biểu: thắng ngay hay đá quân; đá quân ít tiến độ nhưng bị đá lại quân gần đích; xuất thêm ngựa để thoát kẹt; giữ cửa thay vì chặn ngựa mình; đối thủ ngồi cách một ghế sắp thắng; vào đích an toàn; ngựa chắn làm một đe dọa tưởng có trở thành không hợp lệ; mặt 6 dẫn đến thêm lượt; không có nước đi; chỉ một nước hợp lệ; leo đích cần đúng mặt.

- Mọi mức: 100% nước hợp lệ và 100% chọn nước thắng ngay khi có.
- Khó: đạt ít nhất 90% tình huống chiến thuật đã khóa đáp án/nhóm đáp án chấp nhận được; mọi sai lệch còn lại phải được giải thích và sửa nếu làm lộ lỗi đánh giá.
- Bộ đáp án chiến thuật được phân tích độc lập bằng luật hoặc mô phỏng sâu hơn, không lấy chính đầu ra bot để viết đáp án.

### Thi đấu tự động

| Đối sánh | Mục tiêu phát hành của bot Khó |
| --- | --- |
| Đấu 1–1 với bot chọn ngẫu nhiên trong nước hợp lệ | Tỷ lệ thắng ít nhất 70% |
| Đấu 1–1 với bot tham lam: thắng ngay → về đích → đá → tiến xa | Tỷ lệ thắng ít nhất 55%, cận dưới khoảng tin cậy 95% lớn hơn 50% |
| Bàn 4 người: một Khó và ba bot tham lam | Tỷ lệ về nhất ít nhất 35%, cận dưới khoảng tin cậy 95% lớn hơn 25% |
| Khó so với Vừa | Có cải thiện đo được trên tập ván độc lập; không gắn nhãn mạnh hơn chỉ vì tính lâu hơn |

- Ít nhất 512 ván cho mỗi đối sánh cuối, cân bằng ghế, màu và người đi trước. Tách seed dùng chỉnh bot với seed đánh giá cuối.
- Có cả bàn 3 người trong bài kiểm tra luật và thử chơi; không suy ra đúng từ kết quả 2 và 4 người.
- Xúc xắc trong benchmark có seed, độc lập với seed tìm kiếm. Có lịch đổi chỗ để kiểm soát lợi thế vị trí; không loại bỏ các ván bot thua hoặc gặp xúc xắc xấu.
- Báo số ván, tỷ lệ thắng, khoảng tin cậy, số lượt, thời gian chọn p50/p95, phiên bản bot và ngân sách tìm kiếm. Ván vượt trần mô phỏng được tính là chưa phân định và báo riêng, không tự chuyển thành thắng/thua.
- Dùng số nút cố định để tái hiện thuật toán, sau đó kiểm tra lại ngân sách thời gian thực tế trên thiết bị thử. Kết quả desktop không thay thế kết quả tablet.
- Nếu chưa đạt mục tiêu: phân tích các ván thua và chỉnh bot, không hạ ngưỡng để công bố đạt.
- Thử chơi với người thật là bước bổ sung để đánh giá nhịp và độ dễ hiểu; chưa có phiên thử thật thì ghi rõ, không suy từ benchmark rằng đã chứng minh phù hợp mọi bé.

## 7. Hình ảnh, 3D và quy trình Google Flow

### Hướng hình ảnh

- Một bộ bàn cờ đồ chơi cao cấp trong khu vườn nhỏ; gỗ sơn/nhựa mờ, cạnh bo, ánh sáng ấm, màu đội rõ ràng.
- Bàn có độ dày, ô đường chạy nổi vừa đủ, bốn khu chờ và bốn dãy đích. Cảnh phụ nằm ngoài đường chơi, không che quân hoặc số ô.
- Quân ngựa có hình dáng ngựa rõ, thân tròn, mắt thân thiện; bốn màu cùng ngôn ngữ tạo hình, thêm biểu tượng đội để không chỉ dựa vào màu.
- Camera góc chếch từ trên, tự căn để toàn bộ các ô quan trọng nằm trong màn hình; mặc định cố định hướng. Có zoom giới hạn và nút trở lại toàn bàn.
- Bộ hoạt ảnh: đứng chờ nhẹ, được chọn, nhảy từng ô, bị đá về khu chờ, vào đích, ăn mừng.
- Xúc xắc có mesh sáu mặt; hoạt ảnh luôn kết thúc đúng mặt đã được engine chốt. Không dùng mô phỏng vật lý làm nguồn xác định kết quả.

### Google Flow đã khảo sát

Trong trình duyệt của đại ca có project **Game Assets**, tại `https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5`. Giao diện ngày 14/09/2026 hiển thị chế độ tạo ảnh **Nano Banana 2**, tỷ lệ 16:9 và hai kết quả mỗi lần. Chưa bấm tạo ảnh và chưa thay đổi thiết lập.

Đại ca đã cho phép dùng Flow để tạo ảnh/asset phục vụ game. Khi triển khai, thao tác trên đúng project bằng inner browser, kiểm tra chế độ hiện có trước mỗi đợt; chỉ gửi prompt và reference của game cần thiết. Việc lập kế hoạch này không tiêu thụ lượt tạo ảnh.

| Asset | Cách tạo | Dùng vào đâu |
| --- | --- | --- |
| Hai concept tổng thể 16:9 | Flow, cùng bộ màu và phong cách | Chọn bố cục/ánh sáng làm chuẩn cho scene |
| Một thiết kế ngựa, góc 3/4 và góc bên | Flow, dùng reference nhất quán | Tham chiếu dựng mô hình; không giả định ảnh nhiều góc là mô hình có sẵn |
| Một ảnh cover | Flow, xuất WebP 800×450 và 400×225 | Thẻ trong danh mục game |
| Một nền màn chuẩn bị | Flow, ít chi tiết ở vùng chữ/nút | Không khí khu vườn, không ảnh hưởng độ rõ của tên và ghế |
| Texture gỗ/cỏ nếu thực sự cần | Flow; kiểm tra khả năng lặp và ánh sáng trong ảnh | Bề mặt cảnh, ưu tiên vật liệu đơn giản khi texture không cải thiện hình ảnh |
| Một mô hình ngựa có phần đổi màu | Dựng geometry và xuất GLB bằng script riêng | Dùng chung cho 16 ngựa, bốn vật liệu đội |
| Bàn cờ, ô, chuồng, cờ và xúc xắc | Dựng bằng Three.js/GLB, cùng dữ liệu sơ đồ engine | Các phần cần đúng hình học và tương tác |
| Hiệu ứng chọn quân, đường đi, bụi, pháo giấy | Dựng trong scene bằng mesh/particle nhẹ | Phản hồi nước đi và kết thúc |

Flow được dùng cho bitmap và tham chiếu mỹ thuật. Chưa có bằng chứng từ giao diện đã khảo sát rằng Flow xuất mô hình GLB; kế hoạch 3D không phụ thuộc giả định đó.

### Quy trình asset

1. Tạo hai concept, kiểm tra độ rõ của đường đi, quân và dãy đích; chọn một hướng nhất quán.
2. Tạo thiết kế ngựa và cover theo concept đã chọn; không đưa chữ tiếng Việt, số ô hay luật vào ảnh AI.
3. Dựng ngựa/bàn thật theo reference; ID ô, số đích, tên, biểu tượng tương tác được sinh từ code.
4. Kiểm tra một scene gồm đủ 16 ngựa trước khi làm chi tiết cảnh phụ; hình ảnh phải đứng vững ở kích thước tablet.
5. Nén/cắt ảnh, chuẩn hóa tên file và lưu manifest gồm nguồn, prompt, vai trò, kích thước và bản được chọn. Giữ source cần thiết để tái tạo, tránh đưa mọi ảnh thử vào gói phát hành.
6. Xem trực tiếp scene thực, không lấy ảnh concept làm bằng chứng bàn cờ cuối đã đạt chất lượng.

Prompt định hướng đầu tiên: “Premium miniature Vietnamese horse-race board game in a whimsical garden, four distinct red blue green yellow teams, rounded painted wooden toy horses, warm soft daylight, elevated three-quarter overhead camera, clearly visible playing surface, restrained scenery around the perimeter, no text, no labels, no UI.” Sơ đồ ô chính xác sẽ do code dựng, không giao cho prompt quyết định.

## 8. Kiến trúc dự kiến

```text
games/HorseRace/
  HorseRaceGame.tsx          # Entry, màn chuẩn bị/chơi/kết quả
  model.ts                  # State, player, horse, action, record có version
  rules.ts                  # Cấu hình luật đã chốt
  board.ts                  # ID đường chạy, start/entry/home và tọa độ
  engine.ts                 # Nước hợp lệ, áp dụng hành động, lượt, kết thúc
  rng.ts                    # Nguồn gieo thật; nguồn test được tiêm riêng
  bot/
    evaluate.ts             # Đánh giá chiến thuật
    search.ts               # Mô phỏng và ngân sách
    worker.ts               # Tìm kiếm ngoài main thread
    client.ts               # Hủy, timeout và kiểm tra revision
    fixtures.ts             # Tình huống chiến thuật chỉ dùng kiểm thử/dev
  state/
    useHorseRace.ts          # Điều phối engine và trình diễn
    persistence.ts          # Snapshot, validate, phục hồi
    progress.ts             # Ghi kết quả đúng profile, chống trùng
  components/
    Lobby.tsx
    PlayerSeat.tsx
    TurnPanel.tsx
    Results.tsx
    Guide.tsx
  scene/
    Board3D.tsx
    Horse.tsx
    Dice.tsx
    Camera.tsx
    Board2D.tsx
  audio.ts
  horse-race.css
  preview.tsx
  *.test.ts
public/horse-race/
  art/
  models/
scripts/
  build-horse-race-assets.mjs
  benchmark-horse-race.ts
docs/
  horse-race-implementation-plan.md
  horse-race-bot-benchmark.md
  horse-race-asset-manifest.md
```

Tên file có thể gộp khi hợp lý; các ranh giới quan trọng là luật thuần, bot, dữ liệu lưu, UI và scene. Không đưa Three.js/DOM vào engine hoặc worker.

State tối thiểu gồm `version`, `rulesVersion`, `matchId`, `ownerProfileId`, `players`, `horses`, `activeSeatId`, `dice`, `phase`, `revision`, `turnId`, `winnerId`, thời gian chơi và các số đếm kết quả. Người chơi dùng ID ổn định; loại người/máy không tạo luật riêng.

Engine phân biệt các bước **chờ gieo → có kết quả gieo → chờ chọn quân → giải quyết nước → chuyển/thưởng lượt → kết thúc**. UI có hoạt ảnh tương ứng nhưng không dựa hoàn toàn vào callback animation để tiến luật. Mỗi lệnh có ID/revision để không thực hiện hai lần khi render lại, chạm nhiều ngón hoặc worker trả chậm.

## 9. Lưu ván, profile và thưởng

- Mỗi profile có một ván đang dở, khóa theo `ownerProfileId` và `matchId`. Snapshot giữ cả khách, máy, độ khó, màu, luật, mặt xúc xắc đã gieo và trạng thái bàn.
- Tự lưu sau khi chốt kết quả gieo và sau mỗi hành động logic. Khôi phục ở bước ổn định gần nhất, không gieo lại hoặc đá lại quân vì hoạt ảnh đang dở.
- Nếu rời trang khi đang tính bot, hủy worker. Khi quay lại, tính lại nước từ snapshot có mặt xúc xắc đã lưu.
- Bấm Home, ẩn tab, khóa màn hình và đổi hướng tablet phải giữ ván đúng. Đổi profile không cho mang ván của profile trước sang.
- Snapshot có validator/version; dữ liệu hỏng được báo rõ và cho bắt đầu ván mới. Lỗi ghi storage hiển thị trạng thái chưa lưu, không thông báo đã lưu thành công.
- Profile lưu lịch sử kết quả của chủ profile, kèm tên/loại ghế khác như thông tin của ván. Khách và máy không được tạo thành hồ sơ học sinh hoặc nhận thành tích thay cho chủ.
- `GameResult.horseRace` dự kiến chứa winner, `hostWon`, số ngựa hoàn thành của từng ghế, mức máy, lượt, thời lượng và phiên bản luật/bot. `score/maxScore` biểu thị tiến độ của chủ 0–4/4, không biểu thị học lực; giao diện kết quả ưu tiên thắng/thua và tiến độ.
- Dùng ID ván chống ghi lịch sử hai lần. Chỉ đánh dấu đã ghi sau khi lưu profile thành công; lỗi ghi cho phép thử lại.
- Đề xuất bản đầu không phát sao tiền tệ hay ảnh gacha từ ván cờ; vẫn ghi lịch sử và số ván/thắng đúng. Nếu bổ sung thưởng sau, cần quy định riêng thay vì đi qua callback thưởng game cũ.
- Kiểm thử cả profile cũ cần migration và profile mới; bảo toàn stars, album, gameHistory và tiến độ các game khác.

## 10. Ngân sách hiệu năng và offline

Các ngưỡng dưới đây là mục tiêu đo, không phải bảo đảm trên tablet chưa thử.

| Hạng mục | Mục tiêu |
| --- | --- |
| Khung hình | Khoảng 60 fps ở mức Cân bằng trên tablet thử đủ khả năng; mức Nhẹ giữ tối thiểu khoảng 30 fps trong cảnh chuyển quân |
| Tính bot | Vừa khoảng 200 ms, Khó p95 không quá 600 ms trên thiết bị thử; animation suy nghĩ đo riêng |
| Main thread | Tính bot không tạo tác vụ dài làm đứng thao tác/hoạt ảnh |
| Asset vào game | Mục tiêu không quá 8 MB tải mới cho scene, ảnh và âm cần thiết, tách báo cáo phần JS dùng chung |
| Texture | Thường 512–1024 px, chỉ tăng khi có khác biệt rõ; ảnh cover 400/800 px |
| Scene | Dùng chung geometry/material, gom các ô/cảnh lặp; mục tiêu khoảng ≤100 draw calls và ≤100 nghìn tam giác ở cấu hình Cân bằng |

- Lazy load game mới và worker, không tải scene cờ cá ngựa từ trang danh mục chỉ để hiện cover.
- Giới hạn DPR, bóng đổ và particle theo chất lượng; dừng render/âm/bot khi ẩn hoặc pause. Hỗ trợ giảm chuyển động.
- Nếu WebGL không có hoặc mất context, chuyển Board2D dùng cùng engine và giữ ván, thay vì làm mất tiến độ. Bản 3D vẫn là trải nghiệm chính cần nghiệm thu.
- Cache model/ảnh/âm game mới theo phạm vi và phiên bản, tránh tự tải hết thư viện asset trên lần mở trang chủ.
- Kiểm tra offline bằng production build có service worker: mở game online để cache, tắt mạng, tải lại và chơi tiếp. Lần đầu chưa cache mà offline phải có thông báo đúng.
- Kiểm tra triển khai dưới `/Genius-kids/`, không dùng đường dẫn asset tuyệt đối bắt đầu tại `/` làm lỗi GitHub Pages.

## 11. Thứ tự thực hiện và điều kiện qua từng chặng

| Chặng | Việc chính | Đầu ra có thể kiểm tra | Điều kiện hoàn thành |
| --- | --- | --- | --- |
| 1. Chốt sơ đồ và luật | Định nghĩa 56 ô, bốn tuyến, dãy đích, các trường hợp chặn/đá/thêm lượt | Sơ đồ đánh số và ví dụ nước đi | Bốn màu đối xứng; mọi biến thể bản đầu rõ ràng |
| 2. Engine độc lập | State, nước hợp lệ, di chuyển, RNG, kết thúc; bàn dev đơn giản | Ván 2/3/4 người chạy tới kết thúc | Kiểm thử luật, bất biến và trạng thái lỗi đạt |
| 3. Bot và thước đo | Baseline ngẫu nhiên/tham lam, bot chiến thuật, mô phỏng, worker | Báo cáo chiến thuật và benchmark sơ bộ | Đúng luật, công bằng, không treo UI; có cơ sở đo sức mạnh |
| 4. Thiết kế và asset | Flow concept/reference/cover; dựng ngựa/bàn GLB | Scene có đủ 16 ngựa, xúc xắc, ánh sáng | Rõ toàn bàn, hình ngựa đẹp và chọn được bằng touch |
| 5. Hoàn thiện chơi cùng máy | Lobby, tên, màu, độ khó, chuyển lượt, pause, kết quả, âm thanh | Một ván hoàn chỉnh từ thêm người đến chơi lại | 1 người+máy, nhiều người+máy và toàn người đều chơi được |
| 6. Tích hợp hệ thống | Catalog, đường dẫn, profile, snapshot, thành tích, cache | Game mở từ danh mục, lưu/tiếp tục được | Không ghi nhầm profile/thắng/thưởng; link và offline đúng |
| 7. Hiệu chỉnh và nghiệm thu | Benchmark cuối, kiểm thử hồi quy, thử touch/3D/hiệu năng | Báo cáo bot, ảnh/video QA, kết quả build/test | Đạt các tiêu chí đã đặt; ghi riêng các giới hạn thiết bị chưa kiểm tra |

Engine và thước đo bot đi trước cảnh trang trí để các quyết định về luật/sức mạnh bot không bị trì hoãn đến cuối. Việc tạo Flow asset bắt đầu ở chặng 4, sau khi kế hoạch này được xem xét. Chưa có số liệu để hứa ngày hoàn thành chính xác; chặng 2–3 sẽ cho cơ sở ước lượng đáng tin cậy hơn.

## 12. Ma trận kiểm thử

### Luật và trạng thái

- Bốn màu × các mặt xúc xắc × quân ở khu chờ/đường chạy/cửa/đích; có và không có quân chắn.
- Xuất khi chưa có quân, đã có quân, start có đồng đội/đối thủ; không đi thêm sau xuất.
- Đá đúng khoảng cách, không nhảy quá quân chắn, không chồng quân mình.
- Đi qua điểm xuất phát của màu khác, tới cửa đúng tuyến, không rẽ nhầm cửa hoặc đi thêm vòng.
- Vào ô đích thấp/cao, leo từng bậc, không vượt quân trong chuồng; không di chuyển quân đã hoàn thành.
- Mặt 6 khi có nước/không có nước; nhiều lần 6; kết thúc trong lượt 6 không phát thêm lượt.
- Không ai đi được ở một lượt không đồng nghĩa ván hòa/kẹt; cấm suy diễn kết thúc sai.
- Tổng số quân luôn đúng, mỗi quân chỉ có một vị trí, state trước không bị sửa bởi search, winner chỉ xuất hiện khi đủ điều kiện.
- Dùng chuỗi hành động có seed để kiểm tra hàng nghìn state có thể đạt được và lưu chuỗi tái hiện khi có lỗi.

### Bot và bất đồng bộ

- Chọn hợp lệ, thắng ngay, đạt bộ chiến thuật, không truy cập RNG thật.
- Xoay màu/ghế trong cùng thế cờ không tạo thiên vị không giải thích được.
- Pause/thoát/đổi profile/đổi ván khi worker đang chạy; phản hồi cũ không được áp dụng.
- Worker timeout/lỗi hoặc khởi động chậm vẫn có hành vi kết thúc hữu hạn và hợp lệ.
- UI không chạy lượt bot hai lần dưới React Strict Mode hoặc khi component render lại.

### UI và lưu dữ liệu

- Mọi số ghế 2/3/4 và mọi số máy hợp lệ; thêm/xóa/đổi tên/đổi màu, tên dài/trống/trùng và tiếng Việt.
- Tên/avatar chủ profile chính xác; xóa khách không xóa profile; dữ liệu của người khác không nhận thưởng.
- Chạm kép, đa chạm, chọn ngựa sát nhau, bàn phím, màn xoay ngang/dọc, tên dài không che bàn/nút.
- Reload ở lúc gieo, chọn quân, chạy quân, đá, lượt bot và màn kết quả; vẫn giữ kết quả đã chốt.
- Ghi storage thất bại và thử lại; hoàn thành gọi lại không nhân đôi lịch sử/thành tích.
- Chủ thắng và chủ thua đều lưu đúng; không cộng gameWins khi thua.

### Hình ảnh, thiết bị và hồi quy

- Tablet 1024×768, 1180×820, 820×1180; màn nhỏ 390×844; desktop kiểm tra bố cục không kéo giãn vô lý.
- Hình ảnh đủ 16 quân, mọi ô/dãy đích thấy được; không bị menu che nước đi; tương phản bốn màu và biểu tượng rõ.
- Mất WebGL, giảm chuyển động, tắt âm, nền/foreground, chế độ tiết kiệm chất lượng và game offline.
- Thử Safari/iPadOS và Chrome/Android tablet thật nếu có thiết bị. Nếu chỉ có mô phỏng viewport/desktop, ghi rõ giới hạn đó trong báo cáo.
- Chạy kiểm thử tập trung khi phát triển, sau đó `npx tsc --noEmit`, `npm test`, `npm run build` khi tích hợp xong. Kiểm tra lại các game bị chạm đường dẫn/profile/âm thanh.
- Không triển khai lên hosting trong bước lập kế hoạch. Đầu ra triển khai tiếp theo là bản local có thể chơi và kiểm tra, cùng báo cáo những gì đã được xác minh.

## 13. Những quyết định đã chốt và mặc định đề xuất

**Đại ca đã chốt:** chơi chung tablet; khách tự đặt tên; thêm bạn/thêm máy để xác định số người; 3D theo chất lượng Đại Chiến Rồng Thần; bot có chiến thuật; được dùng Google Flow trong inner browser; lập kế hoạch trước; ra 6 mới xuất và ra 6 được thêm lượt.

**Mặc định em đề xuất trong kế hoạch:** 4 ngựa, tối đa 4 ghế, luật chặn cả quân mình, leo đích từng bậc, dừng ở người thắng đầu tiên, Vừa là mức máy mặc định ngoài mầm non, một phong cách khu vườn đồ chơi, không phát sao/gacha ở bản đầu, có 2D dự phòng và lưu ván theo chủ profile. Những điểm này có thể điều chỉnh bằng phản hồi trước triển khai; không được coi là đại ca đã xác nhận từng chi tiết.

**Chưa được chứng minh ở bước lập kế hoạch:** bot đạt tỷ lệ thắng mục tiêu; thời gian tính và tốc độ khung hình trên tablet thật; chất lượng ảnh Flow mới; chất lượng scene 3D hoàn thiện; khả năng chơi của trẻ qua phiên thử thực tế.
