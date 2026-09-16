# Nâng cấp ba hoạt động Bảng Chữ Cái — kế hoạch triển khai

Ngày lập: 16/09/2026. Chủ dự án: Đại ca. Người triển khai xưng em khi trao đổi.
Trạng thái: **CHỈ LẬP KẾ HOẠCH; chưa triển khai ba trò mới trong lượt này.**

Mục đích: tài liệu đủ cụ thể để tiếp tục với effort thấp hơn mà không phải thiết kế lại, đoán yêu cầu hoặc cắt phạm vi. Giảm effort bằng cách thực hiện từng phần nhỏ có kiểm chứng. Chất lượng được xác nhận bằng kết quả thực tế; tài liệu và số lượng test tự chúng không chứng minh giao diện tốt.

Đọc kèm **alphabet-activities-execution.md** trong thư mục này. File đó chứa trạng thái từng bước, bằng chứng, việc đang dở và lệnh tiếp tục. Đây là nguồn trạng thái; tài liệu này là nguồn phạm vi và tiêu chí.

Danh sách art có cấu trúc nằm trong **alphabet-activities-assets-plan.json**: 53 brief vật, 9 brief cảnh, mascot và đạo cụ. Tất cả đang planned; đây là đường dẫn dự kiến, chưa phải ảnh đã có. Dùng làm đầu vào lập manifest thực tế, không import thẳng vào runtime để giả có asset.

## 1. Phạm vi đã chốt

Nâng cấp ba mục của /preschool/alphabet:

| URL activity | Nhãn menu giữ để dễ tìm | Tên trò trong màn chơi | Kỹ năng |
|---|---|---|---|
| word | Tìm từ theo chữ cái | Giỏ đồ khám phá | Liên hệ chữ đầu của từ tiếng Anh với vật được minh họa |
| match | Ghép chữ hoa – thường | Bưu điện chữ cái | Ghép đúng hai dạng của cùng một chữ |
| pick | Nghe và chọn chữ | Ga tàu âm thanh | Nghe tên chữ tiếng Anh, tìm ký tự tương ứng |

Phải hoàn thành cả ba. Thứ tự xây sản phẩm: **Tìm từ → Ghép chữ → Nghe chữ** sau phần nền tảng chung.

Giữ các kết quả Đại ca đã yêu cầu trước đó:

- Học bảng chữ cái: 26 cảnh riêng, nhiệm vụ tương tác, chọn chữ thường, tập tô, rồi nhận sticker. Không thay bằng các màn mới.
- Trong khu vực alphabet, nhạc nền tiếp tục tạm tắt, không ghi đè sở thích bật/tắt nhạc của học sinh.
- Highlight kín đáo: tránh khung nét đứt lớn, lớp trắng che vật, vòng sáng nhấp nháy thường trực.
- Điều hướng về Bảng Chữ Cái nhất quán với PreschoolShell và browser Back.
- Chơi được bằng chuột, ngón tay; thao tác kéo có cách chạm chọn rồi chạm đích.
- Giữ phong cách đồ chơi thủ công của Cáo; các trò và các chặng có bối cảnh khác nhau.

Ngoài phạm vi lượt nâng cấp này: viết lại phần tập tô; thay hệ sao toàn ứng dụng; thay API phát âm toàn ứng dụng; nhận diện giọng nói; đánh giá chữ viết bằng AI; backend mới; video nền; chế độ nhiều người; deploy hoặc mua gói tài nguyên.

Google Flow được Đại ca cho phép dùng để hỗ trợ tài nguyên. Chỉ đọc/generate/export trong project đã có; không mua gói hoặc xóa tài nguyên khác. Nếu Flow không truy cập được, làm phần độc lập, ghi đúng hạng mục bị chặn; không âm thầm thay toàn bộ tài nguyên đã chốt bằng emoji.

## 2. Hiện trạng đã kiểm tra và rủi ro cụ thể

Đường dẫn trong tài liệu tính từ gốc repo D:/Quyetnm/Dev/mathgenius-kids.

| Mã hiện tại | Kết luận theo code | Hướng xử lý |
|---|---|---|
| src/pages/preschool/AlphabetPage.tsx | learn dùng AlphabetGarden; pick dùng ListenAndPick; match dùng MatchPairs 5 cặp; word dùng WordStartGame 10 câu | Thay đúng ba nhánh pick/match/word bằng entry mới; giữ learn |
| ListenAndPick.tsx | Mặc định 4 đáp án, 8 câu; thẻ chữ; chuyển câu bằng timeout | Trò nghe riêng cho alphabet; vòng đời câu và audio rõ ràng |
| CountingPage.tsx, ColorsPage.tsx | Cũng dùng ListenAndPick | Không sửa giao diện/luật mặc định của component dùng chung để phục vụ alphabet |
| MatchPairs.tsx | 10 thẻ trộn chung, chạm hai thẻ; vòng chọn lớn | Đổi sang thư chữ hoa và nhà chữ thường; đích có vị trí ổn định |
| WordStartGame.tsx | Trộn oneStart/allStart/oneNotStart ngay từ đầu; chạm vật vừa đọc vừa trả lời | Phân mức; tách nút nghe khỏi hành động chọn/đưa vào giỏ |
| services/wordBankService.ts | Kho từ có thể được mở rộng bằng Gemini khi có API key | Ba trò mới dùng kho được kiểm duyệt, ảnh và từ khớp nhau; không phụ thuộc sinh nội dung lúc trẻ chơi |
| usePreschoolReward.ts | Gọi processGameReward, ghi lịch sử/sao/gacha qua addGameResult; không có session ID ổn định | Adapter riêng cho phiên alphabet, cùng quy tắc thưởng hiện hữu và kiểm tra trùng |
| StudentContext.tsx | Có studentsRef, persistedRef và các complete* dùng adapter lưu trên snapshot mới nhất | Áp dụng mẫu này để tránh lưu progress rồi ghi thưởng bằng một profile cũ làm mất dữ liệu |
| profileService.ts | Migration cũ dựng lại profile; đã giữ alphabetGarden | Thêm trường progress mới vào cả nhánh migration cần thiết; test giữ dữ liệu cũ |
| SpeakButton.tsx, speech.ts | Audio bất đồng bộ; callback kết thúc chưa đủ để phân biệt nghe thành công với mọi loại fallback lỗi | Kiểm tra adapter audio trước khi dùng tín hiệu đó để mở câu nghe/chấm kết quả |
| alphabetGardenProgress.ts | Sticker chỉ xuất hiện sau nhiệm vụ, ghép chữ và tô đủ nét | Progress ba kỹ năng mới tách riêng; không giả lập hoàn thành khám phá/tập tô |
| Vite/PWA | base là /Genius-kids/; có precache và cơ chế download riêng | Asset phải qua BASE_URL; kiểm tra chính sách cache thực tế trước khi tuyên bố offline |

Đây là khảo sát code, chưa phải kết luận đã tái hiện mọi lỗi bằng browser. Working tree đang có nhiều thay đổi từ các lượt alphabet trước; không reset, clean hoặc ghi đè chúng. Không sửa .claude/settings.local.json.

Lượt làm trước có 62 test liên quan và build pass; đó là dữ kiện lịch sử, không thay cho baseline mới tại P00.

## 3. Trải nghiệm chung — quyết định để triển khai trực tiếp

### 3.1 Vào trò và chọn mức

- Menu gốc giữ bốn mục quen thuộc. Mỗi mục mới có hình riêng, mô tả một câu, progress riêng.
- Màn vào trò có tên, một minh họa thao tác ngắn, nút “Chơi nào”, nút nghe hướng dẫn và chọn ba mức: Làm quen / Tự thử / Thử thách.
- Mặc định lần đầu là Làm quen. Có thể chọn lại mức; không khóa trò hoặc khóa chữ do thiếu sticker.
- Có “Chọn chữ” cho phụ huynh/bé chủ động luyện một chữ. Chế độ này hỗ trợ đủ A–Z, kể cả X.
- Nút Back cố định thuộc shell. Không thêm ba nút thoát trùng nhau trong vùng chơi.
- Mỗi câu giữ một việc chính; không tự chuyển câu lúc âm thanh tên vật chưa phát xong.
- Không đồng hồ đếm ngược, không trừ sao đang sở hữu do trả lời sai.

### 3.2 Trạng thái và chuyển cảnh

State tối thiểu: intro → prompting → answering → feedback → transitioning → sessionComplete.
Thêm saving/error và paused khi cần; sự kiện phải chứa sessionId và roundId.

- Sau đúng: có phản ứng của vật/nhân vật và nghe lại từ/chữ phù hợp.
- Câu kế tiếp bắt đầu sau phản hồi. Mặc định hiệu ứng 500–900 ms; đợi audio kết thúc, có timeout an toàn khi dịch vụ audio lỗi. Timeout lỗi không được coi là phát âm thành công.
- Không có màn “Tiếp tục” thừa sau từng đáp án; màn kết thúc phiên có Chơi lại / Chữ hoặc chuyến mới / Về Bảng Chữ Cái.
- Khi chưa hoàn thành, quay về menu hoặc đổi hoạt động phải hủy audio, pointer capture, RAF và timer của màn cũ.
- document hidden: tạm dừng trình tự; trở lại phát lại câu hiện tại sau thao tác nếu trình duyệt yêu cầu.
- prefers-reduced-motion: phản hồi tĩnh vẫn giải thích được đúng/sai; không chờ animationend để hoàn thành.
- Bấm nhanh, double-click, pointerup cộng click, đổi profile trong lúc chờ đều không tạo hai kết quả.

### 3.3 Trợ giúp, mức khó và âm thanh

- Nghe lại không tính là sai và không tự mất điểm.
- Sai lần đầu: giữ câu, phản hồi nhẹ, cho thử lại. Sai hai lần: hiện nút “Cáo giúp bé”.
- Trợ giúp thực sự chỉ đáp án được ghi assisted; phản hồi khen không được giả là một lần tự làm đúng.
- Nút loa đặt cạnh vật là button riêng, không lồng button và không nổi bọt thành chọn vật.
- Tiếng Anh phát tên chữ hoặc từ; tiếng Việt phát hướng dẫn/nghĩa. Không đọc ký tự tiếng Anh bằng giọng Việt.
- Đây là học **tên chữ và chữ đầu của từ**, chưa phải chương trình phonics. Ví dụ X–xylophone hợp với chữ đầu; không nói rằng tên X hoặc âm /ks/ là âm đầu của xylophone.
- Trò nghe: trước khi bắt đầu có nút “Nghe thử”. Nếu audio không phát được, hiển thị Thử lại hoặc về menu, không lộ đáp án rồi vẫn tính “nghe đúng”.
- Không yêu cầu bật nhạc nền để nghe hướng dẫn. Xác minh hành vi âm thanh chung hiện tại, tôn trọng thiết lập của học sinh.
- Không hứa mọi tiếng Anh chạy offline trên thiết bị không có voice. Nếu thiếu audio offline, báo trạng thái và retry; chưa coi đây là đã kiểm chứng trên thiết bị thật.

## 4. Đặc tả từng trò

### 4.1 Giỏ đồ khám phá

Ba nơi chơi: vườn picnic, quầy đồ gỗ, bãi biển. Cảnh đổi theo phiên, tránh lặp ngay cảnh vừa chơi; không tải trước cả thư viện.

Luồng một câu:
1. Cáo giới thiệu chữ đích (ví dụ B), hiển thị B b và yêu cầu ngắn.
2. Vật xuất hiện trong các ô có khoảng trống; mỗi vật có nút nghe và tên tiếng Anh ngắn, chữ đầu rõ.
3. Bé kéo vật vào giỏ hoặc chạm chọn vật rồi chạm giỏ.
4. Đúng: vật nằm trong giỏ, Cáo phản ứng, nghe “Ball — quả bóng”; sai: vật trở về chỗ, chưa tăng số lượng.
5. Câu nhiều đáp án: vật đúng được giữ, badge “1/2” rõ; đủ số tự hoàn thành, không thêm nút Xong không cần thiết.

| Mức | Câu/phiên | Luật | Lựa chọn |
|---|---:|---|---|
| Làm quen | 6 | Tìm 1 vật có từ bắt đầu bằng chữ đích | 3 vật, 1 đáp án |
| Tự thử | 6 | Tìm 2 vật bắt đầu bằng chữ đích | 4 vật, 2 đáp án; chữ phải có ≥2 từ |
| Thử thách | 6 | Hai dạng theo thứ tự ổn định: chọn tất cả; tìm vật khác chữ đầu | Chọn tất cả: 2/4 hoặc 3/5; khác chữ: 2 cùng chữ + 1 khác |

- Câu “khác chữ” có hướng dẫn và biểu tượng riêng; không lẫn ngẫu nhiên câu phủ định vào Làm quen.
- Với tự chọn chữ X: chỉ có xylophone, dùng câu 1 đáp án; thông báo “Luyện với xylophone”, không bịa từ hoặc nhân đôi ảnh để đủ 2–3 đáp án.
- Phiên cấp cao chỉ chọn chữ có đủ dữ liệu; vẫn luyện X được qua chọn chữ và mức Làm quen.
- Danh sách đúng lấy từ chữ đầu đã chuẩn hóa của từ, không đoán từ asset ID hoặc màu.
- Nhiều đáp án: thứ tự đưa vào giỏ tự do; thả lại vật đã đúng không cộng thêm.
- Có thẻ nghĩa tiếng Việt sau nghe/đúng; bé không bắt buộc đọc được từ để thao tác.

Tiêu chí cảm giác chơi: có giỏ thật thay đổi nội dung, vật di chuyển đến giỏ, đếm khớp; không nghiệm thu một grid quiz chỉ thay nền và nhãn.

### 4.2 Bưu điện chữ cái

Ba nơi: phố vườn, làng ven suối, phố tuyết ấm áp.

Luồng:
1. Thư chữ hoa ở khay, các nhà mang chữ thường ở đích.
2. Bé chọn hoặc kéo thư đến nhà tương ứng.
3. Đúng: thư vào hộp, cửa mở, bạn thú nhận thư; nhà có dấu đã nhận, khay hết thư đó.
4. Sai: thư trở lại khay; nhà không đổi chữ và vị trí.
5. Hết khay: chuyến giao thư hoàn tất; sang bảng thứ hai rồi kết thúc phiên.

| Mức | Bảng/phiên | Cặp/bảng | Chọn nội dung |
|---|---:|---:|---|
| Làm quen | 2 | 3 | Ưu tiên khác hình dễ phân biệt |
| Tự thử | 2 | 4 | Trộn chữ quen và chữ cần ôn |
| Thử thách | 2 | 5 | Có cặp dễ nhầm b/d, p/q, m/n, u/v khi đủ dữ liệu |

- Mỗi chữ có đúng một thư và một nhà; chữ hoa trên thư, chữ thường trên nhà.
- Màu nhà/thư không mã hóa đáp án. Có người nhận khác nhau nhưng không dùng hình giống nhau để ghép thay cho đọc chữ.
- Các nhóm chữ dễ nhầm là nội dung luyện thị giác, không mặc định bé đã sai các chữ đó.
- Chọn font chữ thường dễ đọc, a/g nhất quán với chữ hiện ở phần khám phá; không tự đổi dạng glyph giữa hai màn.
- Di động: xếp nhà thành lưới ổn định, khay thư gần đích; kiểm tra 5 cặp ở 320 px. Nếu cần cuộn, có cách chạm hai bước; không yêu cầu kéo xuyên cả trang.
- Kéo sai/ra ngoài/nhấc ngón trước đích: không mất thư. Kéo lại được.
- Tapping và dragging đi qua cùng một action ghép, không hai cách tính điểm.
- Sau ghép phát “A — a” bằng tên chữ tiếng Anh, không đọc dấu nối.

Tiêu chí cảm giác chơi: thư biến mất khỏi khay, nhà đúng nhận thư và mở cửa, tiến độ 3/3 hoặc 5/5 khớp; không nghiệm thu thẻ lật đổi icon thành phong bì.

### 4.3 Ga tàu âm thanh

Ba nơi: ga vườn, ga rừng, ga ven biển.

Luồng:
1. Nút nghe thử rồi Cáo đọc chữ đích; không hiện chữ đích trong tiêu đề, lời nhắc hay trang trí trước trả lời.
2. Bé chọn vé đúng rồi đưa vào khe vé bằng chạm hoặc kéo.
3. Đúng: vé được soát, một hành khách lên toa; sai: vé trở về chỗ, có thể nghe lại.
4. Mỗi phiên 6 lượt, tàu chở đủ 6 bạn rồi chạy ra khỏi ga trong đoạn kết ngắn có thể bỏ qua.

| Mức | Đáp án | Dạng chữ |
|---|---:|---|
| Làm quen | 2 | Chữ hoa |
| Tự thử | 3 | Chữ thường |
| Thử thách | 4 | Trộn hoa/thường giữa các lựa chọn; mỗi letter ID xuất hiện một lần |

- Không cho A và a cùng xuất hiện như hai đáp án độc lập nếu câu hỏi chỉ đọc tên A.
- Các vé có cùng kích thước/độ nổi bật, đáp án đúng đổi vị trí.
- Thao tác nghe lại không đổi mục tiêu hoặc shuffle lại vé.
- Không hiện preview chữ đích khi người dùng chưa nghe. Tên truy cập của nút vé mô tả chữ trên vé; không gắn “đáp án đúng”.
- Sau sai hai lần, trợ giúp được chọn rõ ràng; lúc chỉ đáp án ghi assisted, không tăng số lần nghe độc lập đúng.
- Khi đúng, số hành khách tăng đúng một. Câu hoàn tất sau xử lý action, không sau sự kiện animationend.
- Các hành khách dùng sprite động vật đã có trong thư viện vật (cat, dog, goat, pig, rabbit, lion); không cần tạo sáu bộ trùng nhau.
- Âm tàu ngắn và nhẹ, không che tên chữ. Không yêu cầu video có tiếng từ Flow để trò chạy.

Tiêu chí cảm giác chơi: nghe được câu, vé vào khe, hành khách lên tàu, sáu lượt cho sáu hành khách; không nghiệm thu các nút chữ đứng trên ảnh tàu tĩnh.

## 5. Nội dung và tài nguyên cần đủ trước khi nghiệm thu

### 5.1 Kho từ được kiểm duyệt: 53 mục

Một từ chính cho mọi chữ A–Z bám phần khám phá. Thêm một từ cho mỗi chữ trừ X, thêm bear và cake để có câu ba đáp án đúng. Tổng 26 + 25 + 2 = **53 từ/ảnh**. Kho này là phạm vi bắt buộc; mở rộng thêm là việc sau.

| Chữ | Từ chính — nghĩa Việt | Từ thêm — nghĩa Việt |
|---|---|---|
| A | apple — quả táo | ant — con kiến |
| B | ball — quả bóng | banana — quả chuối; bear — con gấu |
| C | cat — con mèo | car — ô tô; cake — bánh ngọt |
| D | dog — con chó | duck — con vịt |
| E | elephant — con voi | egg — quả trứng |
| F | fish — con cá | frog — con ếch |
| G | goat — con dê | grape — quả nho |
| H | hat — cái mũ | horse — con ngựa |
| I | ice cream — kem | ice — viên đá |
| J | juice — nước ép | jellyfish — con sứa |
| K | kite — cái diều | key — chìa khóa |
| L | lion — sư tử | leaf — chiếc lá |
| M | monkey — con khỉ | moon — mặt trăng |
| N | nest — tổ chim | net — cái vợt |
| O | orange — quả cam | owl — con cú |
| P | pig — con heo | panda — gấu trúc |
| Q | queen — nữ hoàng | quilt — chăn ghép vải |
| R | rabbit — con thỏ | robot — rô-bốt |
| S | sun — mặt trời | star — ngôi sao |
| T | tiger — con hổ | tree — cái cây |
| U | umbrella — cái ô | unicorn — kỳ lân |
| V | violin — đàn vĩ cầm | van — xe tải nhỏ |
| W | watermelon — dưa hấu | whale — cá voi |
| X | xylophone — đàn mộc cầm | Không thêm từ lạ chỉ để đủ số |
| Y | yo-yo — con quay yo-yo | yarn — cuộn len |
| Z | zebra — ngựa vằn | zipper — khóa kéo |

Quy tắc dữ liệu:

- WordEntry mới có id, letterId, wordEn, wordVi, artId, eligibleModes; speech đọc wordEn nguyên dạng.
- Chấp nhận khoảng trắng/dấu nối hợp lệ như ice cream/yo-yo; chữ đầu được normalize, không cắt chữ để “hợp” test.
- ID ổn định; không chứa tên file tạm hoặc URL Flow hết hạn.
- Q queen phải là nhân vật nữ hoàng, không chỉ vương miện. X xylophone phải là nhạc cụ, không nốt nhạc. N net là vợt phù hợp nghĩa. V violin đủ hình nhận biết.
- I ice và ice cream khác nhau rõ; cá/frog, goat/horse, van/car không được dùng chung minh họa.
- Từ có nhiều nghĩa chọn đúng một nghĩa, ảnh và lời đọc khớp.
- Không lấy cache Gemini cũ làm đáp án mặc định. Không xóa API key hay cache cũ của người dùng.
- Validate đủ 26 letter ID, đúng 53 từ, word ID duy nhất, chữ đầu khớp, asset tồn tại và mode có đủ đáp án.

### 5.2 Danh mục art

| Nhóm | Số lượng tối thiểu | Đặc điểm |
|---|---:|---|
| Nền Giỏ đồ | 3 | picnic, workshop, beach; bố cục khác nhau |
| Nền Bưu điện | 3 | garden, riverside, snowy-village |
| Nền Ga tàu | 3 | garden, forest, seaside |
| Vật học từ | 53 | Mỗi từ một hình riêng, đọc được ở 64–96 px |
| Bộ mascot Cáo | 3 trạng thái | idle, chỉ dẫn, mừng; có thể tái dùng art phù hợp đã có sau kiểm tra |
| Đạo cụ tương tác | 3 bộ | giỏ, nhà/hộp thư/phong bì, đầu tàu/toa/khe vé; các phần cần chuyển động tách lớp |

- Chữ A–Z/a–z luôn render bằng DOM/SVG, không để Flow vẽ chữ để dùng làm đáp án.
- Nền Flow không chứa các vật là đáp án trong khu vực nhận tương tác; tránh “con mèo trong nền” bị trẻ nhầm là vật có thể kéo.
- Đạo cụ đơn giản có thể dựng SVG/CSS theo cùng chất liệu; tên tool không phải tiêu chí chất lượng. Nền và ảnh vật là tài nguyên Flow theo hướng đã chốt.
- 9 nền phải khác bố cục/bối cảnh, không tính đổi hue hoặc crop cùng ảnh là cảnh mới.
- Nền mỗi trò có focal point an toàn ở cả ngang/dọc; có crop mobile riêng khi cần. Cảnh đổi theo phiên/chặng, không đổi khi bé đang kéo.
- Không cần 26 nền mới cho mỗi trò: 26 nền khám phá cũ vẫn giữ riêng; ba trò luyện dùng tổng 9 cảnh và đủ 53 vật riêng.
- Không dùng video nền trong phiên đầu. Hoạt ảnh bằng lớp UI/sprite để không làm nặng tải hoặc lẫn âm thanh.

### 5.3 Quy trình Flow và kiểm soát chất lượng

Project đã được Đại ca cho phép: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5

1. Đọc skill browser trước khi điều khiển browser theo quy định môi trường. Dùng Flow qua UI được hỗ trợ.
2. Đối chiếu 26 cảnh hiện có ở public/preschool/garden/ để giữ phong cách. Lập ba mẫu bố cục thử, mỗi trò một mẫu.
3. Tạo pilot: 3 nền và 3 vật apple/ball/cat; đặt vào giao diện chạy thật để kiểm tra crop, tương phản, kích thước.
4. Sau khi pilot đạt tiêu chí, tạo theo lô 6–9 vật; không bắn 53 prompt trước khi biết style và crop đạt.
5. Export local, tạo WebP, đặt tên có nghĩa. Vật nên có alpha sạch; nếu Flow chỉ xuất nền trơn, xử lý nền và kiểm tra viền ở nền sáng/tối, không giả có transparency.
6. Lập contact sheet của mọi vật và từng bộ cảnh, xem bằng công cụ ảnh; đồng thời mở ảnh thật trong màn chơi.
7. Manifest ghi id, file, trò dùng, prompt, nguồn Flow/item nếu có, ngày tạo, kích thước, dung lượng, crop/focal point và trạng thái review.
8. Asset thiếu/sai phải regenerate hoặc sửa cho đạt rồi review lại. Placeholder chỉ dùng trong bước đang làm, không được tính P07/P10/P13 hoàn thành.

Prompt gốc để bắt đầu, điều chỉnh sau pilot:

> A handcrafted children's learning world matching the existing friendly fox alphabet garden. Soft felt, painted wood and clay textures, warm natural light, restrained cream and sage palette with terracotta accents. Clear silhouettes, calm composition, no text, no letters, no watermark. [SCENE OR OBJECT]. Keep the play area uncluttered and preserve a safe composition for portrait and landscape crops.

Bổ sung cho vật:

> A single recognizable [OBJECT], isolated, centered, entire silhouette visible, generous padding, soft front three-quarter view, no extra objects, no decorative lettering. Must be recognizable as a small draggable learning toy.

Bổ sung cho nền: ghi vùng tương tác cụ thể; không đặt mascot/vật nổi bật vào nơi sẽ bị UI che. Ánh sáng ba bộ tương đồng nhưng cảnh không trùng.

Ngân sách ban đầu: nền desktop ≤250 KB/file, vật ≤60 KB/file, tổng art mới ≤7 MB. Cảnh đầu + vật đang dùng ≤1.2 MB; lazy load các cảnh chưa dùng. Đây là ngưỡng phải đo và ghi bằng chứng; ưu tiên tối ưu trước, nếu cần điều chỉnh để giữ ảnh đẹp phải ghi lý do, không tự nâng ngưỡng để làm xanh checklist.

## 6. Kiến trúc dự kiến — giới hạn thay đổi

Tạo thư mục riêng src/components/preschool/alphabet-games/. Tên có thể chỉnh để phù hợp repo nhưng phải cập nhật file map và tracker, tránh các tên chỉ khác hoa/thường trên Windows.

| File/nhóm đề xuất | Trách nhiệm |
|---|---|
| types.ts | Activity ID, level, session/round/outcome; kiểu dữ liệu tối thiểu |
| content.ts | 53 từ, A–Z, nhóm dễ nhầm, cấu hình ba mức, manifest tham chiếu |
| assets.ts | BASE_URL, nguồn ảnh, kích thước, scene rotation |
| sequence.ts | Fisher–Yates có RNG truyền vào, chọn câu/chữ theo progress, đủ distractor |
| wordModel.ts, matchModel.ts, listenModel.ts | Luật thuần; action hợp lệ; không timer/audio/React trong engine |
| progress.ts | Schema v1, normalize, thống kê mỗi kỹ năng/chữ, đọc hồ sơ cũ |
| persistence.ts | Commit round/session trên snapshot mới nhất; dedupe và save failure |
| useAlphabetSession.ts | Vòng đời phiên, timer/RAF cleanup, owner/session guard |
| useToyDrag.ts | Pointer capture, threshold, tọa độ, drop target, hủy; click/tap tương đương |
| useAlphabetAudio.ts | Điều phối đọc/hủy; trạng thái success/error; không tự thay mute preference |
| AlphabetActivityFrame.tsx | Mở đầu, mức, chỉ dẫn, progress, kết thúc, retry lưu; không tạo router riêng |
| WordBasketGame.tsx | UI giỏ và ba mức |
| LetterPostGame.tsx | UI thư/nhà và ba mức |
| LetterTrainGame.tsx | UI vé/tàu và ba mức |
| alphabet-games.css | Style có prefix riêng, responsive/reduced-motion, không override toàn bộ button/svg |
| *.test.ts | Test hành vi engine/content/progress/persistence/audio lifecycle theo phạm vi thực tế |
| public/preschool/alphabet-games/ | scenes/, objects/, characters/ và manifest tài nguyên |
| scripts/prepare-alphabet-activities-art.mjs | Chuyển ảnh/resize, báo dung lượng; không ghi đè cảnh garden cũ |

Điểm tích hợp có chủ đích:
- AlphabetPage.tsx: nối nhánh word ở P06, match ở P11, pick ở P14 để từng trò thử được qua menu thật ngay khi xây; giữ các nhánh chưa nâng cấp. P16 hoàn thiện menu/progress chung. Key theo student ID để không mang state qua hồ sơ khác.
- catalog.ts: mô tả menu mới; nhãn chính ổn định.
- PreschoolShell.tsx: chỉ khi thêm ảnh/progress menu alphabet cần thiết; có prop/branch rõ, kiểm tra counting/colors.
- types.ts StudentProfile: alphabetPractice? riêng; không gộp nhầm alphabetGarden.
- services/profileService.ts: migration giữ alphabetPractice.
- StudentContext.tsx: action alphabet riêng theo mẫu completeSoundGame với studentsRef/persistedRef; thay đổi nhỏ, có test adapter.
- services/musicConfig.ts: dự kiến không cần đổi; regression xác nhận route vẫn yên tĩnh.

Không sao chép nguyên ba quiz cũ rồi thêm skin. Không viết một framework game tổng quát quá mức; chia sẻ drag/audio/session, giữ luật mỗi trò trong model riêng. Không thêm thư viện nặng nếu SVG/React hiện có đủ.

## 7. Progress, chọn câu và thưởng

### 7.1 Dữ liệu và kết nối phần học

alphabetPractice phiên bản 1 lưu theo profile:

- Mỗi activity × letter có số lần giải quyết câu, số lần tự đúng ngay, số lần cần trợ giúp, một lịch sử kết quả gần đây có giới hạn và lastPlayedAt.
- Mỗi hoạt động có lastSceneId và mức đã chọn.
- Phiên đang dở có sessionId, ownerId, activity, level, seed, round IDs, outcomes và câu hiện tại; draft có version, chỉ giữ dữ liệu cần thiết.
- Hoàn thành phiên ghi vào gameHistory với ID ổn định bắt nguồn từ owner + sessionId.
- Không ghi DOM/pointer coordinates, image base64 hoặc audio vào profile.
- Dữ liệu lỗi/thiếu trường được normalize; không xóa sticker, sao, history, avatar, grade hoặc sở thích cũ.

Gợi ý chọn nội dung:
- Chữ explored trong alphabetGarden được ưu tiên làm quen, nhưng không suy ra đã nghe/ghép/tìm từ thành thạo.
- Ưu tiên chữ sai/assisted gần đây; vẫn có chữ mới. Trọng số ban đầu: cần ôn 4, đã khám phá 2, còn lại 1.
- Một phiên 6 câu không lặp cùng chữ liên tiếp và tối đa 2 lần/chữ, trừ chế độ tự chọn một chữ.
- Session seed cố định; re-render không shuffle; chơi lại dùng seed mới.
- Fisher–Yates, RNG truyền vào test; không sort(() => Math.random() - .5).
- Với một pool ít chữ, nới hạn lặp có chủ đích trong model và kiểm thử; không vòng while vô hạn.
- Badge “Tự làm được” cho từng kỹ năng/chữ: ít nhất 3 kết quả tự đúng ở ≥2 phiên, hai kết quả gần nhất tự đúng. Nghe lại không làm mất độc lập; chỉ trợ giúp lộ đáp án mới là assisted. Đây là quy tắc sản phẩm, chưa phải đánh giá năng lực chuẩn hóa.
- Có “Ôn chữ cần luyện”; không gọi cả bảng chữ cái hoàn thành chỉ vì xem Z.
- Không bắt trẻ tập tô lại sau mỗi câu trong ba trò này.

### 7.2 Lưu và chống ghi đè

- Commit mỗi câu hoàn tất với ownerId/sessionId/roundId; bỏ qua cùng round ID lần hai.
- Commit vào snapshot mới nhất, cùng giao dịch với checkpoint. Không gọi updateStudent từ object capture cũ sau callback thưởng.
- Phiên đã thay/đóng hoặc profile khác: callback trễ không có quyền cập nhật phiên mới.
- Draft lỗi: báo nhẹ, cho bắt đầu phiên mới; giữ progress đã xác nhận.
- Lưu thất bại: không hiển thị “đã lưu”; giữ kết quả trong phiên, hiện Thử lưu lại. Retry không cộng hai lần.
- Reload: resume draft hợp lệ vào câu chưa hoàn tất, phát lại hướng dẫn; không chạy timer của phiên cũ.
- Reset/Chơi lại tạo session mới; hoàn thành session cũ không thể nhận thưởng lại vì double-click/refresh/back.
- Đổi profile: draft/progress độc lập. Profile bị xóa không bị callback tái tạo.
- Không thêm localStorage chung không namespace; nếu cần key ngoài profile phải có owner, version và dọn đúng khi xóa profile.

### 7.3 Sao và kết quả

- Giữ quy tắc processGameReward, medal, sao/gacha/achievement hiện hữu; không tự sửa giá trị thưởng.
- Nghe lại không giảm điểm; một câu sai rồi sửa vẫn được hoàn tất, nhưng không tính tự đúng ngay. Câu assisted không tính tự đúng.
- Word/Listen: maxScore = số câu. Match: maxScore = tổng số cặp hai bảng; cặp sai được gắn vào thư tương ứng, không trừ điểm tất cả cặp khác.
- gameType giữ tương thích lịch sử: preschool-alphabet cho pick/match, preschool-word cho word; metadata mới phân biệt activity/level/version.
- durationSeconds đo thực tế, loại thời gian paused; không giữ mặc định 0. difficulty ánh xạ ba mức rõ ràng.
- Chỉ thưởng khi phiên hoàn tất hợp lệ. Click nghe, xem demo, kéo ngoài đích không sinh sao.
- Dedupe trước khi random gacha và trước khi cộng sao; cùng phiên phải nhận cùng kết quả khi retry lưu.
- Giữ các side effect award trong một đường commit. Không vừa usePreschoolReward vừa gọi adapter mới để “chắc chắn”.
- Cần đọc processGameReward và pattern adapter trong repo trước khi viết; nếu gacha flow hiện tại không phù hợp, ghi thiết kế nối cụ thể trong tracker, giữ hành vi đã có và test tránh cộng thẻ/sao hai lần.

## 8. Thứ tự 19 công việc và điều kiện hoàn thành

Mỗi Pxx là một gói công việc để agent effort thấp thực hiện tuần tự. Không đánh DONE bằng cảm giác; phải có file, test/browser case hoặc ảnh liên quan. Khi đang chạy có thể làm liên tiếp nhiều gói đã đủ phụ thuộc, không hỏi Đại ca lại giữa từng gói.

### P00 — Chụp baseline và điểm tích hợp

Phụ thuộc: không.
- Đọc instruction repo, git status/diff; nhận diện thay đổi của lượt trước.
- Chạy test baseline có liên quan, tsc và build một lần; ghi commit/working tree/time, command, exit code, cảnh báo cũ.
- Mở menu alphabet và ba activity cũ ở desktop/mobile; ghi ảnh trước, URL thật và hành vi Back.
- Dùng hồ sơ kiểm thử riêng, ghi origin và profile ban đầu; không chơi/đổi lớp hồ sơ thật để test.
Đầu ra: baseline trong tracker, danh sách file sẽ chạm, lỗi cũ phân biệt với lỗi mới.
Gate: đủ bằng chứng baseline; nếu baseline fail ghi nguyên nhân và phạm vi, không bỏ qua âm thầm.

### P01 — Chốt data và hợp đồng phiên

Phụ thuộc: P00.
- Tạo types/content/schema, 53 từ theo bảng, level config và validation.
- Chốt outcome independent/assisted, seed/owner/session ID, score từng mode.
- Lập asset manifest đầy đủ (chưa có file để trạng thái missing, không giả complete).
Test: đủ 26 chữ/53 từ; word ID và letter hợp lệ; pool rare letter; câu có đúng tập đáp án.
Gate: data test pass; review thủ công nghĩa và chữ đầu, đặc biệt I/J/N/Q/V/X/Y/Z.

### P02 — Sequence và progress thuần

Phụ thuộc: P01.
- Chọn câu có seed, shuffle đều theo thuật toán; adaptive có giới hạn; normalize progress và badges.
- Test bằng seed tái lập: mọi chữ có thể xuất hiện, không lộ đáp án qua vị trí, giới hạn lặp, pool thiếu, không mutate input.
- Test profile cũ/trống/hỏng; independent/assisted; không tăng sticker hoặc mastery sai.
Gate: test hành vi pass, reviewer đọc được invariant trong test; không dùng snapshot lớn thay logic.

### P03 — Adapter lưu/thưởng an toàn

Phụ thuộc: P02.
- Kiểm tra dịch vụ thưởng; thêm alphabetPractice, migration, action context/adapter.
- Commit câu và checkpoint; hoàn tất phiên một lần, giữ luật sao/gacha hiện tại.
- Test callback trùng, snapshot mới, round/session cũ, profile switch/deleted, save fail/retry, draft reload, dữ liệu cũ.
Gate: test chống mất sao/sticker và ghi đôi pass; không thay kết quả của các game khác.

### P04 — Khung UI, drag và audio dùng chung

Phụ thuộc: P01–P03.
- Tạo Frame, intro/level/end/error, pointer drag, chạm thay thế, keyboard, audio lifecycle.
- Kéo có threshold ~8 px để phân biệt tap; pointercancel/lostcapture/reset/resize xử lý được.
- Tọa độ tính từ khung hiện tại, không hard-code theo ảnh 1376 px.
- Audio success/error và timer có owner/session guard; giảm chuyển động.
Gate: harness thử được mouse/touch tương đương, bàn phím; lỗi audio có đường retry; không hiện đáp án trò nghe để che lỗi.

### P05 — Pilot Flow và style chạy thật

Phụ thuộc: P04.
- Tạo 3 cảnh đại diện + apple/ball/cat; dựng contact sheet.
- Gắn vào frame thật, kiểm tra 320, 390, 768, 1366 px.
- Chốt palette, safe area, crop, kích thước vật, font, shadow/highlight.
Gate: không bị chữ che/vật cắt/đích khó tìm; có ảnh desktop/mobile và danh sách điều chỉnh. Pilot chưa là hoàn thành một trò.

### P06 — Giỏ đồ: một phiên cơ bản chạy trọn

Phụ thuộc: P05.
- WordModel và UI một đáp án; nghe riêng; drag và chạm giỏ; kết thúc/lưu/cho chơi lại.
- Nối activity=word vào entry mới ngay bước này; nhánh pick/match vẫn dùng bản cũ đến đúng bước của chúng.
- Dùng pilot A/B/C để tìm lỗi cơ chế, chưa tuyên bố đủ A–Z.
Gate: browser hoàn tất thật một phiên từ menu → chơi → thưởng → menu; kiểm tra sai/ra ngoài/drop trùng.

### P07 — Đủ kho art Giỏ đồ

Phụ thuộc: P06.
- Hoàn tất đủ 53 vật, 3 cảnh giỏ và mascot theo manifest; reuse art có sẵn chỉ khi đúng và ghi nguồn.
- Contact sheet xem tất cả; thay ảnh không phân biệt/không đúng nghĩa.
- Kiểm tra public paths, BASE_URL, dung lượng và lazy load.
Gate: manifest 53/53 vật + 3/3 nền word đã review; không missing/placeholder; contact sheet và report byte có thật.

### P08 — Giỏ đồ đủ mức và đủ chữ

Phụ thuộc: P07.
- Ba mức, chọn chữ A–Z, nhiều đáp án, câu khác chữ, X fallback đúng.
- Adaptive, retry/help, progress, phiên dở và âm thanh tên/nghĩa; không auto Gemini.
Gate: engine sinh được session hợp lệ qua mọi chữ/mức đủ điều kiện; ít nhất 200 seed/mức trong test, không câu vô nghiệm/trùng ID.

### P09 — Nghiệm thu Giỏ đồ

Phụ thuộc: P08.
- Chạy ma trận Q-W và Q-C bên dưới, check contact sheet trên UI.
- Thử nghe tên nhiều lần không chọn; drag/drop/tap/keyboard; end không double award.
Gate: lỗi trong phạm vi word đã sửa; có ảnh/trace chính, tests pass. Không bắt đầu postoffice để bỏ lại lỗi word.

### P10 — Art Bưu điện

Phụ thuộc: P09.
- 3 cảnh, bộ nhà/hộp thư/phong bì tách lớp; phối với mascot và vật/nhân vật chung.
- Chữ DOM/SVG, màu không tiết lộ ghép đúng.
Gate: 3/3 nền review, 5 nhà + khay thư đọc được ở 320 px, các trạng thái cửa mở/đóng và thư đã gửi phân biệt rõ.

### P11 — Bưu điện đủ mức

Phụ thuộc: P10.
- MatchModel: 3/4/5 cặp, hai bảng, seeded pair selection, cùng action cho kéo/chạm.
- Nối activity=match vào entry mới để thử đầy đủ qua menu/Back thật.
- Luật sai gắn theo thư; nhà nhận một lần; audio ghép, completion, persistence.
Gate: đủ A–Z và nhóm dễ nhầm; test pair bijection, wrong/drop duplicate/last-pair double-click, replay/owner guard.

### P12 — Nghiệm thu Bưu điện

Phụ thuộc: P11.
- Q-M + Q-C, hoàn tất cả phiên 5 cặp ×2 bằng thao tác thật.
- Kiểm tra font a/g, không ghép dựa theo màu, scroll/touch ở mobile.
Gate: toàn bộ case bắt buộc pass, ảnh trước/sau nhà nhận thư; word smoke vẫn pass.

### P13 — Art Ga tàu

Phụ thuộc: P12.
- 3 nền ga, đầu tàu/toa/khe vé có lớp chuyển động; 6 hành khách dùng sprite động vật đã review.
- Không có chữ đích cố định trên nền hoặc vé.
Gate: 3/3 cảnh review, tàu chứa được 6 hành khách trên mobile, intro/empty/full đều rõ.

### P14 — Ga tàu đủ mức

Phụ thuộc: P13.
- ListenModel/audio states; 2/3/4 lựa chọn, case theo mức; không trùng ID A/a.
- Nối activity=pick vào entry mới, giữ component ListenAndPick cũ cho counting/colors.
- Soát vé đúng mới thêm hành khách, nghe lại, trợ giúp có nhãn; audio lỗi dừng chấm.
- Kết phiên tàu rời ga, bỏ qua hiệu ứng không bỏ qua lưu.
Gate: test audio pending/error/replay/cancel và action duplicate; mọi A–Z đều đúng.

### P15 — Nghiệm thu Ga tàu

Phụ thuộc: P14.
- Q-L + Q-C; kiểm tra 6 vé → 6 hành khách và 1 kết quả.
- Audio autoplay bị chặn, chậm/cancel, đọc sai ngôn ngữ; xác minh âm thanh thật khi công cụ/thiết bị hỗ trợ.
Gate: không tính câu nghe khi không nghe; không lộ đáp án; không audio màn cũ sau Back; word/match smoke pass.

### P16 — Nối menu và tiến bộ ba kỹ năng

Phụ thuộc: P09, P12, P15.
- Rà lại ba branch đã nối ở P06/P11/P14, thêm menu art/progress; hướng dẫn/Back thống nhất; bỏ mọi đường thử hoặc cờ tạm còn lại.
- Hiện tiến bộ nghe/ghép/tìm từ theo chữ và nút ôn nội dung cần luyện; không ghi đè vườn sticker.
- Giữ deep links cũ; profile isolation; alphabet nhạc tắt, ra ngoài theo tùy chọn cũ.
Gate: vào/ra được cả bốn mục; profile cũ đọc được; URLs/back/focus/scroll không vỡ; Đếm số/Màu sắc không đổi hành vi.

### P17 — Kiểm tra tổng thể và production

Phụ thuộc: P16.
- Chạy toàn bộ test liên quan, tsc, production build, audit assets, Q-R bên dưới.
- Kiểm tra production preview ở base /Genius-kids/, cache update/PWA và offline có điều kiện.
- Lưu ảnh trước/sau theo matrix, đo asset tải và lỗi console. Giảm tải/chỉnh responsive nếu vượt ngưỡng.
Gate: không lỗi mới trong phạm vi; không TODO/mock/missing art trên đường người dùng; giới hạn thiết bị thật được ghi đúng, không giả đã test.

### P18 — Bàn giao có thể kiểm tra

Phụ thuộc: P17.
- Cập nhật tracker tất cả bằng chứng, quyết định thay đổi, còn hạn chế thực tế; hoàn thiện manifest.
- Mở preview cho Đại ca nếu browser khả dụng, giữ tab Flow và tài nguyên người dùng.
- Tóm tắt ba trò, cách vào, validation, rủi ro còn lại; không deploy hoặc commit tự động nếu chưa nằm trong yêu cầu.
Gate: từng yêu cầu ở mục 1/4/5/7/9 có bằng chứng; mọi P00–P17 đủ điều kiện. Nếu còn hạng mục không đạt ghi PARTIAL, không “đã xong”.

## 9. Ma trận nghiệm thu bắt buộc

Mỗi dòng phải ghi PASS/FAIL/NOT RUN cùng bằng chứng trong tracker hoặc file QA được liên kết. NOT RUN không được đổi thành PASS vì đọc code thấy có vẻ đúng.

### Q-C — Chung cho từng trò

| ID | Thao tác/điều kiện | Kết quả cần thấy |
|---|---|---|
| C01 | Vào qua menu, hướng dẫn, chọn mức, bắt đầu | Hiểu mục tiêu; chỉ một audio hướng dẫn chính |
| C02 | Mouse drag đúng/sai/ra ngoài | Đúng mới tiến; sai trả về; không mất vật |
| C03 | Chạm chọn rồi chạm đích | Kết quả như kéo; nghe không chọn |
| C04 | Touch drag/pointercancel/ngón thứ hai | Không kẹt capture, không scroll kéo theo, không nhận hai lần |
| C05 | Tab + Enter/Space, focus | Chơi được qua đường chạm; focus thấy rõ, về đúng menu |
| C06 | Double-click/drop rồi click/callback cũ | Một kết quả/câu, một thưởng/phiên |
| C07 | Replay/Back/đổi mức/đổi activity khi feedback | Hủy timer và audio cũ; phiên mới sạch |
| C08 | Đổi profile, reload, draft hỏng | Hồ sơ riêng; resume đúng hoặc restart rõ; không mất lịch sử |
| C09 | Save fail → retry | Báo chưa lưu; retry không cộng đôi |
| C10 | Sai hai lần, dùng help, nghe lại | Giúp không giả độc lập; nghe lại không tính sai |
| C11 | 320×800, 390×844, 768×1024, 1366×768 | Không tràn ngang/đè chữ, vùng chơi và đích nhìn thấy |
| C12 | Landscape 844×390 | Nút thoát/nghe/đích không bị che; có thể cuộn ngoài vùng kéo |
| C13 | Reduced motion, 200% zoom, keyboard | Không thiếu phản hồi; thông tin không chỉ phụ thuộc màu |
| C14 | Mute preference và audio lỗi | Không tự bật nhạc/đổi preference; có retry, không giả nghe |
| C15 | Slow/missing image | Layout giữ chỗ, error fallback rõ; không vùng click vô hình; thiếu art vẫn là lỗi cần sửa |
| C16 | Complete → Back/refresh/Chơi lại nhanh | Thưởng cũ không lặp; ID mới chỉ khi có phiên mới |

Trong C04, browser viewport nhỏ không chứng minh đã test ngón tay trên máy thật. Nếu công cụ chỉ gửi mouse thì ghi mobile layout + mouse emulation; touch thật chưa kiểm tra phải ghi riêng. Không bắt Đại ca làm QA thay cho các kiểm tra agent có thể thực hiện.

### Q-W — Giỏ đồ

- W01: mỗi từ trong 53 mục có ảnh đúng, tiếng Anh/Việt đúng; toàn bộ 26 chữ có câu cơ bản.
- W02: nút nghe mỗi vật không gửi đáp án, không tăng progress hoặc score.
- W03: chọn nhiều đáp án theo mọi thứ tự, sai xen kẽ, bỏ/thả ngoài, thả lại vật đã vào giỏ.
- W04: câu khác chữ chỉ ở Thử thách, đúng tập đáp án, hướng dẫn khác đủ rõ.
- W05: chọn X ở từng mức không kẹt; mô tả ngoại lệ đúng; không xuất hiện từ sai chữ đầu.
- W06: I/ice cream, Y/yo-yo, Q/queen, X/xylophone nghe và nhận hình nhất quán.

### Q-M — Bưu điện

- M01: tất cả chữ uppercase/lowercase ghép đúng, sai khác chữ không được chấp nhận.
- M02: đúng một thư/nhà mỗi ID, vị trí không đổi khi chọn/sai.
- M03: màu không tiết lộ đáp án; a/g rõ và nhất quán.
- M04: nhà nhận một lần; hai bảng 5 cặp hoàn thành bằng mouse và đường chạm.
- M05: b/d, p/q, m/n, u/v vẫn phân biệt ở màn nhỏ.
- M06: gửi thư cuối hai lần, reset trong cửa mở, Back giữa hai bảng: không trùng thưởng.

### Q-L — Ga tàu

- L01: nghe tên chữ mục tiêu, mỗi level đúng case; mọi A–Z có thể là mục tiêu.
- L02: trước khi trả lời không có chữ đích bị lộ ngoài tập lựa chọn.
- L03: replay vẫn cùng chữ/vé; không chấm click nghe và không khóa vô hạn.
- L04: autoplay chặn, voice chưa sẵn sàng, fallback error, speech cancel: hướng dẫn thử lại; không tự tính đúng.
- L05: sáu câu đúng cho sáu hành khách; sai không thêm khách; bỏ qua tàu chạy vẫn giữ kết quả.
- L06: âm hiệu không lấn tên chữ; Back/đổi profile hủy giọng cũ; help không được tính nghe độc lập.

### Q-R — Không làm hỏng phần khác và sản xuất

- R01: learn A/B và một chữ có kéo (M hoặc R), ghép chữ → tô → sticker vẫn chạy; không mất 26 nền.
- R02: tổng các test gardenActivities, alphabetGardenProgress, letterTracing, musicConfig/musicManager vẫn pass.
- R03: Counting pick và Colors pick có đúng nội dung/luật cũ; MatchPairs dùng ở nơi khác nếu có không bị sửa ngầm.
- R04: Back header/breadcrumb/browser, deep link pick/match/word/learn, activity không hợp lệ và hồ sơ chưa chọn.
- R05: profile migration mới/cũ, sao/gacha/history/achievements không bị xóa/cộng lại.
- R06: ảnh ở production /Genius-kids/ không 404; không dùng đường dẫn tuyệt đối từ Temp/Flow.
- R07: tải đầu ≤1.2 MB art, tổng art ≤7 MB; không request toàn bộ 53 ảnh khi vào menu.
- R08: build/PWA update tải asset đúng; kiểm tra offline với asset đã cache và voice thiết bị khi có. Ghi giới hạn thực tế.
- R09: console không lỗi mới do ba trò, không state update từ unmount hay ảnh thiếu.
- R10: full test suite khi đụng StudentContext/profile/reward; ghi lỗi cũ nếu có, sửa lỗi mới do thay đổi.

Ảnh tối thiểu: mỗi trò 3 trạng thái (đầu, giữa với phản hồi, kết thúc) × 2 viewport (390, 1366) = 18 ảnh; thêm ảnh 320 và landscape cho mỗi trò = 6 ảnh. Tổng ít nhất 24 ảnh có thể kiểm tra. Chụp thêm trạng thái lỗi khi cần, không dùng 24 ảnh gần như giống nhau. Ảnh không thay test tương tác hay nghe thực tế.

## 10. Lệnh kiểm tra và bằng chứng

Chạy từ gốc repo. Node có sẵn; npm/npx shim đã có vấn đề ở phiên trước, dùng trực tiếp CLI Node nếu còn lỗi.

~~~
node node_modules/vitest/vitest.mjs run src/components/preschool/alphabet-games
node node_modules/vitest/vitest.mjs run src/components/preschool/gardenActivities.test.ts src/components/preschool/alphabetGardenProgress.test.ts src/components/preschool/letterTracing.test.ts services/musicConfig.test.ts services/musicManager.test.ts services/profileService.test.ts
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
~~~

Khi sửa StudentContext/profile/reward, sau focused tests chạy full suite một lần ở gate tích hợp:
~~~
node node_modules/vitest/vitest.mjs run
~~~

Preview production nếu cần, dùng một port còn trống và server riêng để không cắt preview của Đại ca:
~~~
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173
~~~

Chạy test phù hợp mỗi gói; chỉ mở rộng/chạy lại khi có thay đổi, failure hoặc mối lo chưa giải quyết. Không benchmark/test lặp để “đủ effort”. Nếu sandbox chặn cache Vite/Vitest, dùng cơ chế quyền đúng của môi trường, không tự đổi policy.

Bằng chứng lưu ở docs/qa/alphabet-activities/ khi bắt đầu triển khai, gồm baseline, contact sheets, screenshots và báo cáo test/asset. Không cần check-in log máy dài; ghi command, thời điểm, số pass/fail, exit code, artifact có thể mở. Không ghi secrets/profile người dùng vào bằng chứng.

## 11. Cách tiếp tục với effort thấp hơn

1. Lượt đầu đọc file này và alphabet-activities-execution.md, kiểm tra instruction mới và git status. Các lượt tiếp theo đọc tracker trước rồi đúng đặc tả/gate của bước đang làm; không khảo sát lại cả repo khi không có thay đổi liên quan.
2. Chọn bước đầu tiên chưa DONE mà dependencies đã đạt; tiếp tục từ việc còn dở, không viết lại plan.
3. Đọc đúng file cần cho bước, làm phần bounded, chạy đúng test/QA ở gate.
4. Sửa lỗi phát hiện, ghi bằng chứng và cập nhật trạng thái sau khi đạt.
5. Tiếp tục bước sau khi còn khả năng; không dừng hỏi xác nhận từng Pxx đã được yêu cầu triển khai.
6. Khi cần kết thúc một lượt, ghi NEXT ACTION thật cụ thể: file, hàm/UI, case đang fail, lệnh/click tiếp theo. Không chỉ viết “tiếp tục polish”.
7. Việc dễ làm không thay cho việc quan trọng đang khó. Asset bị chặn không cho phép đóng bước art là DONE; có thể làm độc lập phần engine và ghi PARTIAL.
8. Nếu yêu cầu/nguồn code thay đổi, ghi decision log với lý do và ảnh hưởng lên phạm vi/test; không cắt số cảnh/chữ/mode để vừa thời gian.
9. Chỉ hỏi Đại ca khi thiếu thông tin thực sự ảnh hưởng sản phẩm hoặc cần quyền mới; quyết định thường nhật đã được plan bao phủ thì tự làm.
10. Không tự tạo agent/task mới, automation, đổi model hay đổi effort. Kế hoạch này là tài liệu bàn giao trong cùng repo.

Những cách hoàn thành không được chấp nhận:
- Chỉ nâng A/B/C, để các chữ còn lại quiz cũ rồi báo đủ A–Z.
- Đổi nền/nhãn nhưng tương tác vẫn là grid cũ, không có giỏ nhận đồ/thư tới nhà/vé và hành khách.
- Dùng chung một nền cho mọi trò hoặc đổi màu một nền để tính đủ 9.
- Đếm test pass thay cho review ảnh, nội dung từ hoặc thao tác thật.
- Gọi hàm hoàn thành/đặt localStorage để tạo bằng chứng browser thay vì chơi qua UI.
- Hạ assertion, tắt test hoặc đánh NOT RUN thành PASS để chốt.
- Cho audio error đi qua như đã nghe; phát âm tiếng Việt chữ tiếng Anh để “có tiếng”.
- Mất dữ liệu cũ, có trao sao/gacha hai lần, hoặc làm hỏng Đếm số/Màu sắc.
- Còn ảnh tạm/emoji thay tài nguyên đã chốt, TODO trên luồng chính nhưng ghi hoàn thành.
- Tự đổi scope, tự deploy, hoặc xóa thay đổi trước đó để làm sạch git.

Lệnh bàn giao ngắn để Đại ca dùng:

> Triển khai kế hoạch trong docs/alphabet-activities-upgrade-plan.md. Đọc docs/alphabet-activities-execution.md, tiếp tục bước đầu tiên chưa DONE và đã đủ phụ thuộc. Làm tuần tự đến khi đủ ba trò, cập nhật bằng chứng sau mỗi gate; không cắt phạm vi, không đánh xong bằng placeholder, không hỏi lại những phần đã được chốt. Dùng Flow tạo tài nguyên theo manifest và giữ nguyên phần khám phá/tập tô hiện có.
