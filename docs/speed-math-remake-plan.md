# Kế hoạch refactor Đua Tốc Độ — Đấu Trường Tia Chớp

Ngày: 09/09/2026. Trạng thái: Đại ca đã duyệt triển khai; bản Đấu Trường Tia Chớp đã tích hợp vào menu và route của Đua Tốc Độ. Phần dưới giữ định hướng thiết kế; kết quả triển khai thực tế ở mục 12.

## 1. Phạm vi và định hướng

**Đua Tốc Độ** trở thành một gameshow phản xạ kiến thức, có nhiều kiểu tương tác, combo, mục tiêu từng vòng và sân khấu thay đổi theo kết quả.

**Đường Đua Thần Tốc** là game xe riêng, làm sau theo yêu cầu của Đại ca. Kế hoạch này không thêm xe, đường đua, nitro hoặc cơ chế lái vào Đua Tốc Độ; không refactor `games/MathRacing/`.

Giữ tên Đua Tốc Độ trong menu; dùng **Đấu Trường Tia Chớp** làm chủ đề sân khấu. Người chơi hoàn thành ba vòng: chạm đáp án, nối cặp và xếp thứ tự. Các thao tác tác động trực tiếp lên vật thể câu đố; combo làm sân khấu bừng sáng và tạo cao trào ở vòng cuối. Bản đầu là chơi đơn với mục tiêu rõ, không thêm đối thủ giả hoặc multiplayer.

## 2. Hiện trạng đã kiểm tra

| Thành phần | Hiện tại | Việc cần xử lý |
| --- | --- | --- |
| `SpeedMathGame.tsx` | Một component chứa intro, 20 câu, đồng hồ, 3 mạng và kết quả | Tách luật vòng chơi, nội dung, giao diện và hiệu ứng |
| Câu hỏi | Toán, kiến thức, màu, hình, đồng hồ và gõ lại từ; random theo easy/medium/hard | Tạo đề theo kiểu tương tác và lớp/môn; chống lặp |
| Đồng hồ | Interval gọi hàm đóng trên state; Chơi lại gọi `nextQuestion()` ngay sau reset state | Có nguy cơ đọc số mạng/số câu cũ; engine nhận sự kiện và thời gian rõ ràng |
| Trả lời | Chưa có guard theo mã lượt | Chống chấm trùng do double click, Enter giữ phím hoặc hết giờ cùng lúc |
| Sinh đề | Shuffle bằng sort; quiz sort trực tiếp `q.options` của ngân hàng | RNG có seed, shuffle bản sao, dữ liệu nguồn không bị sửa |
| Hoàn tất | Chỉ gọi `onComplete` khi Thoát; Chơi lại không gửi kết quả ván vừa xong | Ghi kết quả lúc hoàn thành, không phụ thuộc nút thoát |
| Route trực tiếp | `/games/speed-math` dùng `onComplete={() => {}}`, difficulty easy | Thống nhất entry/config và ghi kết quả với menu |
| Metadata | `GamePage` ghi thời gian 0 và difficulty easy | Ghi thời gian hoạt động và cấu hình thật |
| Thành tích | `speed_math_king` dùng gameType `speed`, menu gửi `speed-math` | Chuẩn hóa nhận diện, giữ lịch sử và chống cộng lại thưởng |
| Nhạc | Có `timeAttack-Wonder in the Air.mp3`; route matcher dùng `speedmath` | Tận dụng nếu phù hợp, sửa nhận route và tránh phát lại mỗi câu |

Các rủi ro state là kết luận từ code, chưa phải lỗi runtime đã tái hiện trong bước lập kế hoạch.

## 3. Một lượt chơi

1. Chọn môn và nhịp độ; lớp học lấy từ hồ sơ, hiển thị rõ trước khi bắt đầu.
2. Vào sân khấu, thấy mục tiêu và ví dụ tương tác ngắn. Bắt đầu dùng được ngay; có thể bỏ qua hướng dẫn.
3. Chơi ba vòng, mỗi vòng khoảng **45 giây hoạt động**. Mỗi vòng giữ một cách điều khiển nhất quán.
4. Đúng: vật thể khóa đúng vị trí, tia sáng chạy về cột combo, âm thanh nối tiếp theo chuỗi. Câu mới nhận thao tác ngay.
5. Chuyển vòng trên cùng sân khấu: đổi nội dung, ánh sáng và mục tiêu. Vòng mới bắt đầu khi người chơi chủ động bấm; không mất giờ trong chuyển cảnh.
6. Kết quả gồm thành tích từng vòng, độ chính xác, chuỗi tốt nhất và câu cần ôn. Chơi lại tạo bộ đề mới; có luyện riêng từng kiểu tương tác.

Phần chơi khoảng **2 phút 15 giây**, toàn lượt khoảng 2–3 phút tùy thời gian xem giải thích. Đây là mục tiêu cần đo. Nhịp Thư thả có thể dùng 60 giây/vòng và mục tiêu thấp hơn; nhịp Thử thách dùng 45 giây/vòng. Độ khó nội dung theo lớp tách biệt với nhịp chơi.

## 4. Ba vòng tạo khác biệt

| Vòng | Thao tác | Ví dụ | Phản hồi |
| --- | --- | --- | --- |
| **Chớp đúng** | Chạm một trong bốn bảng đáp án cố định | Phép tính, nhận diện hình, đọc giờ, kiến thức ngắn | Bảng đúng phát sáng, năng lượng nối vào combo; câu tiếp sẵn sàng ngay |
| **Nối đúng** | Chạm một thẻ bên trái rồi một thẻ bên phải; kéo nối là tùy chọn | Phép tính ↔ kết quả; đồng hồ ↔ giờ; từ ↔ hình rõ nghĩa | Thẻ đúng thành cặp nhìn thấy được; hoàn tất bảng có hiệu ứng nhóm |
| **Xếp nhanh** | Chạm thẻ theo thứ tự; có Hoàn tác và Kiểm tra | Số nhỏ đến lớn; các giờ sớm đến muộn | Thẻ di chuyển vào ô có số thứ tự; người chơi trực tiếp xây lời giải |

**Nối đúng:** bản dễ 3 cặp, sau đó 4 cặp nếu đủ không gian. Hai nhóm có khung và nhãn rõ. Cặp đúng nằm lại tới hết bảng; không đảo vị trí thẻ còn lại dưới con trỏ. Ghép sai chỉ bỏ kết nối sai. Bảng phải có ánh xạ duy nhất; tránh hai phép tính cùng một kết quả khi mỗi thẻ chỉ nối được một lần. Tap–tap và bàn phím là cách chơi đầy đủ, không bắt kéo chính xác trên điện thoại.

**Xếp nhanh:** bắt đầu với 3–4 thẻ số hoặc giờ. Nguồn thẻ và ô đích tách rõ; ô rỗng vẫn thấy. Bấm thẻ đã xếp để trả lại hoặc Hoàn tác. Chỉ chấm khi Kiểm tra; sửa trước khi gửi không bị tính sai. Bảng có đáp án duy nhất.

Gõ lại từ hiện có chuyển thành bài luyện riêng, chọn chủ động. Bản mặc định không bất ngờ bật bàn phím giữa vòng đang dùng chạm. Dạng “chọn tất cả hình thỏa điều kiện” bổ sung sau khi ba vòng đầu đã tốt.

## 5. Điểm, combo và thời gian

- **Bỏ 3 mạng.** Sai không kết thúc ván; trẻ được chơi đủ các vòng.
- Đơn vị chấm là một câu Chớp đúng, một cặp Nối đúng hoặc một bảng Xếp nhanh. Mỗi đơn vị có ID và trọng số phù hợp độ phức tạp.
- Đúng lần đầu nhận điểm kiến thức. Chuỗi đúng có thưởng combo với trần; các mốc combo làm cột năng lượng, robot và âm thanh thay đổi rõ.
- Sai đứt combo; sửa đúng giúp hoàn thành mục tiêu nhưng không nhận lại điểm lần đầu. Mỗi lần đoán sai có mức trừ điểm nhỏ, điểm không âm, để bấm bừa không có lợi.
- Tốc độ thể hiện qua số thử thách hoàn thành trong vòng; **không có đồng hồ riêng từng câu**. Không cộng thời gian vô hạn kéo ván dài mãi.
- Điểm chính xác và điểm arcade lưu riêng. Huy chương yêu cầu cả lượng thử thách tối thiểu và tỷ lệ đúng lần đầu. Cân bằng tỷ trọng ba vòng để một dạng thao tác nhanh không lấn át các dạng còn lại.
- Pause, ẩn tab, chuyển vòng, hướng dẫn và giải thích không làm mất thời gian. Hết giờ chốt phần đã gửi; câu hoặc bảng chưa gửi không tự tính sai. Action và hết giờ sát nhau xử lý theo timestamp một lần.

Điểm/trọng số/mục tiêu cụ thể chốt sau prototype và mô phỏng bằng bộ đề có seed. Đo riêng tốc độ hoàn thành mỗi dạng và lớp; không coi một bảng sắp xếp tương đương một thao tác ghép.

## 6. Thao tác tức thì, phản hồi ổn định

- **Mọi nút và ô nhập nhận thao tác ngay khi hiện.** Không có chờ đọc, countdown mở khóa hoặc nút “đã đọc xong”.
- Đúng chuyển tiếp ngay; animation và âm thanh chạy song song, không remount cả bảng hoặc làm nhảy chiều cao.
- Sai hiển thị đáp án/giải thích ngắn ở vùng dành sẵn, giữ câu và cho Câu tiếp hoạt động ngay. Trong lúc xem lại, đồng hồ tạm dừng; không có thời gian chờ tối thiểu. Ghép sai giữ bảng để sửa trực tiếp; Giải thích chi tiết có thể mở để dừng đồng hồ.
- Guard theo mã lượt và thao tác để chống chấm trùng; không giải quyết double click bằng khóa toàn bộ input nửa giây.
- Đáp án cần đọc/chạm đứng yên. Chuyển động là phản hồi sau thao tác, không biến thành mục tiêu chạy trốn con trỏ.
- Nghe câu hỏi là tùy chọn. Khi nghe có thể dừng đồng hồ nhưng vẫn trả lời được; gửi đáp án dừng giọng đọc. TTS lỗi không ảnh hưởng chơi.
- Câu đếm có khung riêng cho từng nhóm, kể cả nhóm rỗng. Hình học/đồng hồ/số là component hoặc SVG rõ nét.
- Luyện gõ tôn trọng IME, Unicode NFC và dấu tiếng Việt; không submit khi đang chọn dấu. Input số dùng bàn phím số.

## 7. Sân khấu và bố cục

Vùng giải đố chiếm khoảng **65–75% màn hình**, đặt giữa một sân khấu có tiền cảnh, hậu cảnh và ánh sáng tạo chiều sâu. HUD gọn phía trên: vòng, thời gian, điểm. Combo ở cạnh hoặc dưới bảng. Không dành một nửa màn hình cho khu vực trang trí.

Robot dẫn chương trình **Tia** có silhouette và biểu cảm dễ nhận: vui, ngạc nhiên, cổ vũ. Không nói dài giữa câu hoặc che đáp án khi ăn mừng. Mỗi vòng hoàn thành thắp sáng thêm cột năng lượng; vòng cuối hoàn tất mục tiêu sân khấu.

Mobile ưu tiên câu đố, giữ hai nhóm ghép rõ ràng và cho các hàng thẻ xuống dòng có trật tự. Không thu nhỏ chữ để nhét toàn bộ bố cục desktop. Reduced motion giảm tia sáng, rung và mascot; giữ đầy đủ nhãn đúng/sai, không chớp toàn màn hình.

| Chủ đề | Hình ảnh | Thay đổi theo tiến bộ |
| --- | --- | --- |
| **Trạm Tia Chớp** — làm trước | Xanh ngọc, vàng ấm, mái vòm kính, cột năng lượng tròn | Các cột sáng dần, lõi trung tâm rực sáng khi hoàn thành |
| **Vườn Sắc Màu** | Cây phát sáng, cánh hoa, cầu vồng dịu | Các cụm hoa nở theo vòng, xuất hiện sinh vật nhỏ |
| **Đài Quan Sát Sao** | Đêm xanh tím, hành tinh nhỏ, kính thiên văn | Chòm sao nối sáng dần thành một bức trời sao |

Ba chủ đề dùng cùng luật; thay cảnh không đổi chỗ nút bất ngờ. Hoàn thiện Trạm Tia Chớp trước khi mở rộng chủ đề hoặc mở khóa theo tiến bộ.

## 8. Google Flow và âm thanh

Đại ca cho phép dùng Google Flow. Khi triển khai, kiểm tra lại project/tab và tạo lô mẫu cho Trạm Tia Chớp. Bước kế hoạch chưa tiêu lượt sinh ảnh.

| Asset đầu tiên | Đầu ra cần chọn | Mục đích |
| --- | --- | --- |
| Key visual | 1 ảnh | Chốt màu, chất liệu và bố cục sân khấu |
| Nền sân khấu rộng | 1 ảnh | Hậu cảnh có khoảng trống cho bảng câu đố, không chữ/đáp án |
| Robot Tia | 1 mẫu chuẩn + 2 biểu cảm | Dẫn chương trình/cổ vũ/thành công; dùng cùng reference |
| Bộ tham chiếu đạo cụ | 1 ảnh | Cột năng lượng, đèn, khung bảng để dựng thành phần cần tương tác |

Lô đầu mục tiêu **6 ảnh đạt yêu cầu**; số lần tạo phụ thuộc kết quả. Chọn mẫu nhất quán trước khi mở rộng hai chủ đề. Có thể cắt portrait/thumbnail từ ảnh đạt khi phù hợp.

Prompt nền tảng:

> Original children's knowledge arcade game show, playful rounded science-fantasy stage, turquoise and warm amber palette, friendly small robot host, handcrafted tactile materials, soft cinematic lighting, rich depth, clear silhouettes, welcoming and energetic, no text, no numbers, no UI, no logos.

Nền thêm yêu cầu: `wide frontal three-quarter view, curved glass dome, energy columns at the sides, unobstructed calm central area reserved for interactive puzzle boards, layered foreground and background, no robot, no puzzle content`.

Mascot thêm: `single original rounded robot, expressive face, full silhouette, plain contrasting background, generous padding, consistent design, encouraging expression`.

- Flow cung cấp background, portrait và reference. Bảng câu hỏi, chữ, thẻ, dây nối và hiệu ứng dựng bằng DOM/SVG/CSS để sắc nét và đúng hành động.
- Không giả định ảnh có alpha, texture lặp hoặc mô hình 3D. Kiểm tra viền/crop/nền trước khi tích hợp.
- Lưu `public/speed-math/art/` với manifest nguồn/prompt/reference/kích thước/fallback; tối ưu WebP, tải chủ đề đang dùng. Bản đầu chưa cần video.
- Nghe thử nhạc SpeedMath hiện có, dùng tiếp nếu phù hợp. SFX cho chọn thẻ, ghép đúng, hoàn tất bảng, combo và hết vòng; chuỗi đúng nối thành cụm âm thanh ngắn có tiết tấu.
- Nhạc không khởi động lại theo câu, duck khi đọc đề, tôn trọng điều khiển nhạc/SFX riêng. Chưa cần lượt Suno mới ở bước kế hoạch.

## 9. Kiến trúc và tương thích

| Phần dự kiến | Trách nhiệm |
| --- | --- |
| `SpeedMathGame.tsx` | Entry tương thích; lobby, vòng chơi và kết quả |
| `arcade/model.ts`, `engine.ts`, `scoring.ts` | Session, round, clock, action IDs, submit, combo, pause và kết thúc |
| `arcade/questions.ts`, `content.ts` | Adapter ngân hàng cũ, metadata môn/lớp, generator ghép/xếp, seed và chống lặp |
| `ChoiceRound.tsx`, `MatchRound.tsx`, `OrderRound.tsx` | Tương tác riêng từng dạng, bàn phím/touch và feedback |
| `Stage.tsx`, `GameHUD.tsx`, `RoundTransition.tsx` | Nền, mascot, hiệu ứng sự kiện, bố cục ổn định |
| `progress.ts`, `useArcadeAudio.ts` | Lưu theo hồ sơ và điều phối âm thanh |
| Entry preview DEV | Fixture từng vòng, sai, giải thích, typing, combo, hết giờ và kết quả |

`speedMathEngine.ts` còn được DragonQuest cũ import. Giữ export tương thích, adapter mới dùng trong SpeedMath; không xóa/đổi hành vi dùng chung ngoài phần cần thiết. Đề tạo trước vòng; không gọi AI trong đường xử lý thao tác.

Engine có một nguồn thời gian hoạt động độc lập render. Mã lượt/bảng/thẻ tạo một lần; trạng thái phân biệt choice/match/order/typing. UI gửi action, engine quyết định kết quả và phát event cho audio/animation một lần.

Rà soát metadata ngân hàng theo lớp: easy/medium/hard hiện tại không tự động tương đương khối lớp. Câu kiến thức có nhiều đáp án hợp lý chỉnh hoặc loại khỏi phần tính điểm. Ghép/xếp có generator và kiểm tra lời giải duy nhất riêng.

**Lưu và thưởng:** record có version, grade/topic/difficulty, dạng vòng, số đã gửi, đúng lần đầu, điểm arcade, combo và thời gian. Điểm mới có bucket riêng, không so trực tiếp với high score 200 điểm cũ. Giữ lịch sử và score/maxScore rõ nghĩa. Sao vẫn 1/2/3 theo huy chương; ngưỡng cụ thể chốt sau đo prototype. Ghi khi hoàn tất, idempotent theo session; route/menu cùng một chủ sở hữu ghi kết quả, parent không cộng lần nữa. Alias `speed`/`speed-math` được đọc tương thích, không cấp lại thưởng cũ. Rà soát `game_win` đang tăng cho mọi GAME_COMPLETE mà không thay luật các game khác ngoài ý muốn. Nháp giữ cả cặp/thẻ đã làm, resume ở pause, không chạy bù khi tab đóng.

## 10. Hiệu năng và triển khai

Ưu tiên **DOM/SVG và nền nhiều lớp**; chỉ thêm 3D nếu lợi ích rõ. Không cần WebGL để render một bảng ghép cặp. Nút chạm khoảng 44 px trở lên, focus rõ, không chỉ dựa vào kéo thả hoặc màu sắc.

Mục tiêu cần đo: phản hồi ở frame tiếp theo, animation 60 FPS desktop/ít nhất 30 FPS mobile tham chiếu; art nén sân khấu đầu khoảng 3 MB trở xuống. Asset lỗi vẫn chơi được. Vite PWA hiện gom WebP/PNG; loại trừ art lớn khỏi precache toàn app, cache theo chủ đề có giới hạn.

| Giai đoạn | Kết quả review được | Điều kiện chuyển bước |
| --- | --- | --- |
| 1. Ba vòng chơi thử | Ba dạng với đề thật, timer/combo/điểm, art tạm | Chơi trọn lượt; thao tác khác nhau rõ; không chờ input |
| 2. Sân khấu hoàn chỉnh | Trạm Tia Chớp, Tia, lô Flow mẫu, SFX, chuyển vòng | Desktop/mobile rõ và mượt; art phục vụ nội dung |
| 3. Tích hợp | Lớp/môn, menu/route, nháp, thưởng, thành tích, luyện riêng | Reload/Chơi lại không mất hoặc trùng; Dragon/MathRacing không bị ảnh hưởng |
| 4. Nội dung/chủ đề | Cân bằng từng dạng, chống lặp, hai sân khấu còn lại | Đề hợp lớp, cảnh thay đổi theo tiến bộ, thao tác ổn định |
| 5. Nghiệm thu | Test, TypeScript/build, responsive/IME/touch và hiệu năng | Đạt các tiêu chí dưới đây |

## 11. Tiêu chí nghiệm thu

- Đúng game Đua Tốc Độ; Đường Đua Thần Tốc để làm sau.
- Ba kiểu thao tác thực chất khác nhau, không chỉ đổi nền giữa các câu chọn đáp án.
- Nút/input dùng ngay khi hiện; TTS và hiệu ứng không khóa trả lời, không giật bảng.
- Ghép rõ hai nhóm, giữ vị trí thẻ; xếp có ô đích và Hoàn tác; touch/bàn phím đều dùng được.
- Một đơn vị chấm một lần; spam click, giữ Enter, action bảng cũ/hết giờ không tạo điểm trùng.
- Sai không loại khỏi ván, phản hồi rõ; đoán bừa không hiệu quả hơn giải đúng.
- Pause/ẩn tab/TTS/giải thích/resume giữ đồng hồ và phần đã làm, không xóa input.
- Generator không sửa ngân hàng; ghép/xếp có lời giải duy nhất, đủ nội dung hợp cấu hình, tránh lặp.
- Hoàn tất/refresh/Chơi lại/route trực tiếp ghi đúng một lần và đúng hồ sơ; sao/lịch sử cũ còn nguyên.
- Desktop 1366×768, tablet ngang/dọc, mobile 390×844 và 360×640, bàn phím ảo, reduced motion và asset lỗi vẫn chơi được.
- Test timing/scoring/action IDs/lưu thưởng; regression phần SpeedQuestion mà Dragon dùng; TypeScript và production build.

## 12. Bản đã triển khai — 09/09/2026

- Ba vòng Chớp đúng / Nối đúng / Xếp nhanh, 45 hoặc 60 giây hoạt động mỗi vòng. Luyện riêng từng vòng và luyện gõ tiếng Việt. Nội dung có seed, lấy lớp từ hồ sơ; câu hỏi dùng nguồn local tuyển chọn và generator riêng.
- Điểm mỗi vòng tối đa 200. Huy chương 1/2/3 sao yêu cầu mỗi vòng đạt ít nhất 30/60/100 điểm và độ chính xác 60/80/90%. Trả lời sai trừ 2 điểm, không mất mạng; luyện riêng không nhận sao của cúp. Ngưỡng hiện tại là cấu hình v1, cần tiếp tục đánh giá qua việc trẻ chơi thực tế.
- Ba nền Flow và một robot Tia được chọn từ tám ảnh tạo bằng Nano Banana 2. Tổng art khoảng 354 KiB; tải từng nền, PWA cache theo nhu cầu. Nguồn và prompt nằm trong `public/speed-math/art/README.md`. Bản này dùng một pose Tia, chuyển động nhẹ và lời cổ vũ; không có video hoặc bộ biểu cảm raster riêng.
- Cột năng lượng / hoa / sao thay đổi theo điểm từng vòng; phản hồi đúng có tia sáng nhỏ, không che nút. Nhạc SpeedMath có sẵn, SFX Web Audio theo combo, điều khiển độc lập nhạc/hiệu ứng, giảm âm nhạc khi đọc đề. Không tạo nhạc Suno mới.
- Engine, nội dung, tiến trình, bảng tương tác, hình minh họa và âm thanh nằm trong `games/SpeedMath/arcade/`; wrapper `SpeedMathGame.tsx` nối StudentContext và MusicContext. Giữ nguyên engine SpeedQuestion cũ đang được DragonQuest dùng và toàn bộ MathRacing.
- Ghi kết quả ngay khi hoàn tất với mã session; lưu lỗi có Thử lại, Chơi lại không cộng trùng. Bucket kỷ lục mới tách khỏi điểm cũ. Nháp giữ cặp, thứ tự thẻ, từ đang nhập, thời gian và cấu hình theo từng hồ sơ.
- `speed-preview.html` là entry DEV, có fixture chọn/nối/xếp/gõ/kết quả và giả lập lỗi lưu. Kết quả preview chỉ nằm trong bộ nhớ, không thay hồ sơ thật.
- Đã mở bản tích hợp từ menu Games bằng hồ sơ có sẵn và xác nhận game nhận đúng lớp. Nhạc và các ảnh dùng đường dẫn có base `/Genius-kids/`.
- Đã kiểm tra trong browser: chọn đáp án, ghép đủ ba cặp, pause/resume giữ cặp, xếp/hoàn tác/chấm, nhập tiếng Việt rồi Enter, lỗi lưu → thử lại → Chơi lại không thêm thưởng lần hai; desktop và viewport 390×844 / 360×640 không tràn ngang ở các cảnh kiểm tra.
- Kiểm thử tự động: timing, action cũ/trùng, score cap, ghép/xếp/typing, tính duy nhất của đáp án qua 5 lớp và 5 chủ đề, nháp lỗi, quota lỗi, sai hồ sơ và lưu idempotent. TypeScript, bộ test và build production đều đã chạy. Không coi kiểm thử viewport là kiểm chứng bàn phím ảo hay IME trên thiết bị thật; chưa đo FPS trên máy yếu.

Ngân hàng local là bộ câu ngắn cho trò chơi phản xạ, không tuyên bố bao phủ toàn bộ chương trình từng lớp. Các câu tuyển chọn được xáo theo seed và chỉ lặp sau khi hết nhóm nội dung; các phép tính, nhóm đếm và bảng ghép/xếp được sinh theo cấu hình.

Kết quả kiểm thử cuối: **446/446 test, 27/27 file qua** với `vitest run --maxWorkers=1`, gồm 14 test mới của arcade. Một số lượt chạy đồng thời trước đó bị timeout worker/test Dragon khi máy bận; chạy tuần tự đã qua toàn bộ mà không nới timeout hoặc thay bài test cũ. Đồng hồ có kiểm tra timestamp mili giây lẻ; rollback lưu lỗi không làm mất thưởng thành tích.
