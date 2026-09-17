# Piano Nhí — nguồn 24 bài nhạc

Ngày đối chiếu: 17/09/2026. Đã nhập 24 bản tập vào `games/Piano/content/songs.generated.json`; MusicXML gốc và SHA-256 lưu tại `games/Piano/content/sources/`. Chín sample piano nằm trong `public/piano/audio/`, kèm `CREDITS.md`.

## Mục tiêu

Ứng dụng có **24 giai điệu khác nhau**, mỗi bản gồm toàn tuyến giai điệu của một lượt ký âm, chia câu tối đa 8 nốt. Không tính các tên hoặc tông khác nhau của cùng một tuyến nốt thành nhiều bài.

## Nguồn đã mở kiểm tra

- **A — The Baby's Opera**, Walter Crane: [hồ sơ sách](https://www.gutenberg.org/ebooks/25418), [nội dung và bản nhạc](https://www.gutenberg.org/files/25418/25418-h/25418-h.htm). Hồ sơ ghi public domain tại Hoa Kỳ. Trang nội dung có bản nhạc hình ảnh, MIDI, PDF và MusicXML.
- **B — The Baby's Bouquet**, Walter Crane, phần nhạc Lucy Crane: [hồ sơ sách](https://www.gutenberg.org/ebooks/25432), [nội dung và bản nhạc](https://www.gutenberg.org/cache/epub/25432/pg25432-images.html). Hồ sơ ghi public domain tại Hoa Kỳ. Trang nội dung có bản nhạc hình ảnh, MIDI, PDF và MusicXML.

Số trang bên dưới là số in trong sách, không phải số trang trình duyệt. Các nhãn tiếng Việt là tên hiển thị đề xuất do dự án biên soạn, không phải bản dịch lời hát. Những tuyển tập cổ có thể dùng giai điệu khác phiên bản phổ biến ngày nay; phải nghe/đối chiếu từng bản khi nhập nốt.

## Danh sách 24 bài

| # | Tên trong nguồn | Nhãn tiếng Việt đề xuất | Nguồn / trang |
| --- | --- | --- | --- |
| 1 | Hot Cross Buns | Bánh thơm mới ra lò | B / 10–11 |
| 2 | London Bridge | Cây cầu London | B / 42 |
| 3 | Polly Put the Kettle On | Polly đun ấm trà | B / 9 |
| 4 | Sur le Pont d'Avignon | Nhảy múa trên cầu | B / 40–41 |
| 5 | Lucy Locket | Chiếc túi của Lucy | B / 25 |
| 6 | Schlaf, Kindlein, Schlaf | Ngủ ngoan bé nhỏ | B / 21 |
| 7 | Aiken Drum | Bạn nhạc công vui vẻ | B / 38 |
| 8 | Margery Daw | Bập bênh vui vẻ | B / 55 |
| 9 | The Three Little Kittens | Ba chú mèo con | B / 46 |
| 10 | Looby Light | Cùng múa vòng tròn | B / 54 |
| 11 | Girls and Boys | Các bạn ra chơi | A / 9 |
| 12 | The Mulberry Bush | Vòng quanh cây dâu | A / 10–11 |
| 13 | Oranges and Lemons | Cam vàng chanh xanh | A / 12 |
| 14 | Lavender's Blue | Sắc hoa oải hương | A / 17 |
| 15 | I Saw Three Ships | Ba chiếc thuyền nhỏ | A / 18–19 |
| 16 | Ding Dong Bell | Chuông ngân ding dong | A / 20 |
| 17 | Three Blind Mice | Giai điệu ba chú chuột | A / 22 |
| 18 | Dickory Dock | Chú chuột và đồng hồ | A / 23 |
| 19 | Ye Song of Sixpence | Bài ca sáu xu | A / 35 |
| 20 | Bo-Peep | Cô bé và đàn cừu | A / 36–37 |
| 21 | Baa! Baa! Black Sheep | Chú cừu đen | A / 38 |
| 22 | Jack & Jill | Jack và Jill | A / 52–53 |
| 23 | Hush-a-by Baby | Khúc ru bé ngủ | A / 55 |
| 24 | King Cole | Nhà vua yêu âm nhạc | A / 56 |

Toàn bộ 24 bài trên đã nhập và phân mức. Bộ chuyển soạn giữ bè trên cùng ở khuông 1/voice 1, nối nốt buộc, giữ khoảng nghỉ, bỏ nốt hoa mỹ, chọn kết thúc thứ hai khi có ô nhịp thay thế và không lặp lại các đoạn có dấu nhắc lại. Dịch giọng/quãng vào C4–C6, giữ quan hệ cao độ và trường độ. Bản ghi nguồn mỗi bài có URL, tuyển tập, trang, SHA-256 và số bán âm chuyển giọng. Bài có 24–85 nốt; kiểm tra tự động xác nhận dải phím, thời lượng, nguồn không thay đổi và không trùng chuỗi cao độ tương đối. Phiên bản cổ có thể khác bản phổ biến hiện nay, đặc biệt Hot Cross Buns và Baa! Baa! Black Sheep.

## Cách dùng trong dự án

1. Chọn giai điệu từ đúng ấn bản cổ, tự nhập/chuyển soạn một tuyến giai điệu cho piano; bỏ phần đệm phức tạp, giữ nhịp, câu nhạc và cấu trúc nhận diện được. Tạo âm thanh nghe mẫu bằng engine của dự án.
2. Ghi riêng căn cứ quyền sử dụng của giai điệu, bản chuyển soạn/ký âm và sample nhạc cụ. Không coi file MIDI hoặc bản thu hiện đại là tự do chỉ vì bài gốc là đồng dao. Nếu dùng trực tiếp file số hóa, đọc và lưu điều kiện của đúng file/nguồn.
3. Gutenberg xác nhận public domain tại Hoa Kỳ; trước khi đưa vào ứng dụng, đối chiếu tác giả/ấn bản và phạm vi phát hành của dự án. Không suy rộng nhãn này thành một khẳng định public domain toàn cầu. Giữ nguồn và ngày kiểm tra trong `songSources.ts`.
4. Bản đầu dùng nhạc không lời và tiêu đề ngắn. Không cần nhập toàn bộ lời cổ, ảnh sách hoặc bản dịch có sẵn; phần minh họa và hướng dẫn tiếng Việt do dự án biên soạn riêng.
5. Mỗi bài gồm toàn tuyến giai điệu của một lượt bài, chia câu 4–8 nốt khi hợp lý, có mẫu toàn bài/từng câu, tốc độ 50/75/100% và tiến độ riêng. Bản nguồn dài được rút gọn có chủ đích và ghi rõ phiên bản; không chỉ lấy vài nốt mở đầu rồi tính là một bài hoàn chỉnh.
6. Dùng `melodyFamilyId` để loại trùng: thay lời, tên gọi, tông hoặc âm sắc không tạo thành một giai điệu mới. Nếu chọn các phiên bản dùng chung giai điệu của Twinkle/ABC/Baa Baa sau này, chỉ tính một họ giai điệu vào ngưỡng 20.
7. Nếu một bài không phù hợp sau kiểm tra, thay bằng bài khác có nguồn tương đương; ngưỡng cuối cùng vẫn là ít nhất 20 bài. Đồng dao Việt Nam được ưu tiên bổ sung khi xác định được nguồn giai điệu; không mặc định một bản phổ nhạc hiện đại là tự do vì lời đồng dao cổ.

## Hồ sơ tối thiểu cho mỗi bài khi nhập

`songId`, `melodyFamilyId`, `originalTitle`, `displayTitleVi`, `sourceUrl`, `sourceEdition`, `sourcePage`, `composerOrTradition`, `rightsBasis`, `rightsScope`, `arrangementBy`, `changes`, `verifiedAt`, `reviewStatus`.

Danh mục chơi chỉ lấy dữ liệu đã chuyển soạn trong `songs.generated.json`. Phần kiểm tra và giới hạn nghiệm thu thực tế được ghi trong [piano-implementation.md](piano-implementation.md). Nguồn ký âm được xác định public domain tại Hoa Kỳ; không tuyên bố một giấy phép public domain có hiệu lực toàn cầu. Sample piano dùng CC BY 3.0 và phải giữ ghi công Alexander Holm.
