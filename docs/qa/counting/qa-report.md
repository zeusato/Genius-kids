# Nghiệm thu Đảo số — 16/09/2026

## Cập nhật sau phản hồi của Đại ca

- Học đếm đã thay cảnh nhặt đồ chung bằng **10 kịch bản riêng**, giữ thành quả và chờ nút **Tập tô số**. Bộ counting hiện có **47/47 test PASS**. Chi tiết từng cảnh, kiểm thử trình duyệt và ảnh: [Nghiệm thu mười kịch bản](learning-stories.md).
- Đã bỏ bộ chọn Làm quen/Tự thử/Thử thách khỏi toàn bộ màn bắt đầu; phiên mới dùng trọn 1–10, không đọc lại lựa chọn phạm vi cũ. Phiên đang dở được giữ nguyên.
- So sánh trong phiên mới luôn có nhiều/ít, số lớn/nhỏ, dài/ngắn, cao/thấp, to/nhỏ và bằng nhau. Mô tả menu liệt kê đủ các dạng để dễ tìm.
- Đã sửa chiều so sánh cố định theo vị trí câu: qua các phiên có cả dài lẫn ngắn, cao lẫn thấp, to lẫn nhỏ.
- Bộ test counting sau sửa: **34/34 PASS**, bao gồm kiểm tra đủ hai chiều của từng dạng so sánh. Đã xem trực tiếp màn bắt đầu Phép cộng và So sánh, xác nhận không còn bộ chọn phạm vi.
- Phần bên dưới là biên bản nghiệm thu bản đầu; các mô tả ba mức ở đó là lịch sử và được thay thế bởi cập nhật này.

Phạm vi: làm lại cả năm hoạt động Số đếm theo mức hoàn thiện của trải nghiệm chữ cái, với hướng dẫn cho trẻ chưa biết đọc. Không thay thế hoặc đánh dấu hoàn thành các hạng mục alphabet còn tồn tại từ task trước.

## Kết quả triển khai

| Hoạt động | Nội dung hoàn thiện |
| --- | --- |
| Học đếm 1–10 | 10 cảnh WebP khác nhau; đếm từng vật, nghe số Việt/Anh, tập tô nét, sưu tầm sticker. |
| Đếm đồ vật | Thu hoạch táo/cam vào giỏ, khóa đáp án cho đến khi đếm đủ, sáu câu mỗi phiên. |
| Nghe và chọn số | Bến thuyền, nghe thử trước khi bắt đầu, chỉ mở đáp án sau audio `ended`, nghe lại. |
| Học phép cộng | Hai khay bánh, gộp và đếm tổng, phép cộng trong phạm vi 10, có khay trống. |
| So sánh | Số lượng, số lớn/nhỏ, dài/ngắn, cao/thấp, to/nhỏ, bằng nhau. Có mẫu minh họa đúng yêu cầu từng câu. |

Các bài luyện có ba mức, chọn riêng số hoặc cả dãy, chế độ ôn số cần luyện, trợ giúp sau hai lần sai. Thành thạo yêu cầu tối thiểu ba lần độc lập qua hai phiên, không đồng nhất hoàn thành có hỗ trợ với tự làm được.

31 MP3 mới đóng gói cùng ứng dụng: 21 hướng dẫn/phản hồi tiếng Việt và 10 tên số tiếng Anh. Tên số Việt dùng 10 MP3 sẵn có. Các lời dẫn chính không phụ thuộc giọng đọc cài trên máy hoặc proxy dev. Nhạc nền tạm tắt theo route, không ghi đè preference của người dùng.

## Kiểm thử tự động đã chạy

- Toàn bộ: `node node_modules/vitest/vitest.mjs run --maxWorkers=2` — **68 file, 921/921 test PASS** (41,86 giây). Sau lượt này chỉ sửa kiểu enum của fixture và bố cục hiển thị; không đổi model/reward/audio.
- Model: tất cả năm hoạt động × ba mức × 200 seed × lựa chọn toàn dãy/số 1/số 10; đáp án, phép cộng, các dạng so sánh, ưu tiên ôn.
- Persistence: checkpoint, resume, lưu lỗi/retry giữ nguyên phần thưởng, dedupe câu và kết quả, owner/phiên cũ, migration, mastery nhiều phiên, không bật thông báo đổi thẻ trùng khi chưa cấp sao đổi thẻ.
- Audio: `play()` không đồng nghĩa nghe xong; ended/error/timeout/cancel được phân biệt; callback cũ không mở đáp án; đầy đủ file số, cảnh, đồ vật và 31 lời dẫn local.
- Tracing: tô đủ các nét của cả 10 số, từ chối đi tắt ra ngoài khung nét.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — PASS.
- Production/PWA: `node node_modules/vite/bin/vite.js build` — PASS; 730 mục precache, gồm audio mới. Những cảnh báo font URL, CSS `-: TZ.`, dynamic import và chunk lớn đã có từ trước, không phải lỗi mới của Số đếm.

## Chơi thật trên in-app browser

Hồ sơ dùng: **Kiểm thử chữ cái — Mầm non**. Không thay dữ liệu học sinh bằng script hay gọi hàm nội bộ của app; thao tác qua UI. Hồ sơ QA có thêm lịch sử, sao, sticker và quà do các phiên kiểm thử.

| Trường hợp | Kết quả quan sát |
| --- | --- |
| Đếm đồ vật | Hoàn thành 6/6. Sai hai lần → xuất hiện trợ giúp → chỉ đúng đáp án. Phiên có trợ giúp nhận 2 sao. |
| Resume đếm | Rời/tải lại ở câu 2 sau thu hoạch một vật → chọn lại hồ sơ → Chơi tiếp; giữ đúng câu, giỏ và vật đã nhặt. |
| Bản thu hoạch cuối | Táo/cam, không còn đồ vật không phù hợp với thu hoạch. Mức làm quen chỉ đưa đáp án trong phạm vi đã chọn. Rà lại sai/trợ giúp ở 390px. |
| Nghe chọn | Nghe thử chưa xong thì Chơi nào còn khóa. Mỗi câu khóa thuyền đến khi audio kết thúc. Hoàn thành 6/6, nhận 3 sao. |
| Phép cộng | Kiểm tra 0 + 3; đáp án khóa trước gộp. Gộp, đếm từng bánh, chọn tổng; hoàn thành 6/6, nhận 3 sao. |
| So sánh | Chơi đủ cả năm dạng và bằng nhau; hoàn thành hai phiên 6/6. Resume sau tải lại giữ đúng câu. Phản hồi dùng lời khen, không đọc nhầm số lượng của một phía. |
| Tập tô số 1 | Thu hoạch đủ một vật → khung nét. Kéo chuột theo nét hiển thị → hoàn thành độc lập, sticker và 3 sao được lưu. |
| Số 10 | Đếm đủ 10 vật, hai chữ số hiển thị đúng; Nghỉ/Tiếp tục; tải lại và resume vẫn vào khung tô. Dùng Enter ở Cùng người lớn → sticker được lưu, 0 sao độc lập. |
| Điều hướng | Nút về Số đếm, menu chữ cái và menu màu sắc hoạt động. Route học số/chữ tạm tắt nhạc; ra màu sắc khôi phục điều khiển preference. |

## Bố cục đã xem và đo

- 320px: menu và so sánh; 390px: so sánh, thu hoạch/trợ giúp; 768px: khám phá và khung tô; 1366px: menu; 844 × 390: khung tô số 10 ngang.
- Không có tràn ngang tại các màn đã đo (`scrollWidth === clientWidth`; scrollbar desktop chiếm 15px).
- Đã sửa demo menu bị grid đẩy ra ngoài khung; kiểm tra lại vị trí và ảnh desktop.
- Đã sửa so sánh to/nhỏ dùng tỷ lệ theo khung thay vì hai ảnh lớn cùng bị ép về một chiều rộng. Kiểm tra 320px: hai ảnh thực tế 98,31px và 54,84px.
- Không có ảnh hỏng trong menu/thu hoạch và các màn so sánh đã kiểm tra.
- Log có lỗi HMR tạm thời khi sửa StudentContext lúc đầu. Không có lỗi runtime mới trong các phiên QA cuối sau tải lại.

## Ảnh bằng chứng

- [Menu desktop](menu-1366.png)
- [Thu hoạch và trợ giúp trên điện thoại](count-help.png)
- [Bến thuyền](pick-desktop.png)
- [Tiệm bánh sau gộp](add-desktop.png)
- [So sánh 320px](compare-320.png)
- [Tập tô số 1 trên tablet](learn-768.png)
- [Tập tô số 10 ngang](learn-landscape.png)

`count-complete.png` và `pick-complete.png` là ảnh ở giai đoạn phần thưởng, có thể có overlay quà; không dùng chúng để chứng minh bố cục màn kết quả.

## Giới hạn của bằng chứng

- Viewport mobile là mô phỏng trong browser; chưa thử trên thiết bị cảm ứng vật lý. Nét tô được thử thật bằng chuột; đường hỗ trợ thử bằng bàn phím.
- Audio đã xác nhận vòng đời phát và cổng nghe bằng UI/test; không tuyên bố đã nghe/chấm chất giọng bằng tai người.
- Lỗi quota lưu trữ/retry và callback lỗi audio được mô phỏng ở unit test, không sửa storage trình duyệt để giả lập.
- Reduced motion có CSS tắt animation/transition và hiện trọn nét mẫu; chưa chuyển preference hệ điều hành trong QA này.
- Build precache thành công; chưa kiểm tra toàn bộ app trong chế độ máy bay hoặc triển khai lên hosting.

Kết luận: năm hoạt động đã triển khai và chạy qua các luồng chính, lỗi được tìm trong nghiệm thu đã sửa. Preview sẵn tại `/Genius-kids/preschool/counting`.
