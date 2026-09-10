# Bộ đề Đường Đua Thần Tốc theo lớp và độ khó

Đại ca phản hồi bộ đề ban đầu quá dễ. Bản đầu dùng generator riêng có seed, không phải danh sách câu cố định, nhưng phạm vi lớp 3–5 bị thu hẹp quá nhiều. Bản mới gọi trực tiếp 19 generator đang dùng trong hệ thống học toán (`services/generators/`), qua adapter ở `games/MathRacing/cup/questions.ts`.

## Phân tầng nội dung

| Lớp | Dễ | Trung bình | Khó |
| --- | --- | --- | --- |
| 1 | Cộng/trừ trong 10, bỏ phép với 0 hoặc quá tầm thường | Cộng/trừ qua 10 trong phạm vi 20 | Tìm số trong phép tính; dãy tròn chục đến 100 |
| 2 | Hai chữ số, không nhớ | Cộng/trừ có nhớ trong 100 | Tìm số hạng/số trừ; thừa số và số bị chia, bảng 2–5 |
| 3 | Nhân/chia số hai chữ số | Cộng/trừ đến 10.000; nhân số ba chữ số | Tìm thành phần; tổng ba số; chu vi hình chữ nhật |
| 4 | Nhân nhẩm 25/50/125; trung bình hai số | Phân số khác mẫu; trung bình 3–4 số | Biểu thức có ngoặc và nhân/chia; nhân hai phân số; suy số từ trung bình |
| 5 | Cộng/trừ số thập phân, phân số | Thập phân nhân/chia số tự nhiên; tìm tỉ số phần trăm | Nhân/chia hai số thập phân; bài toán giảm giá |

Ví dụ đã kiểm tra trên UI: lớp 2 Khó có `64 - ? = 18`; lớp 5 Khó có `19,3 × 7,9 = ?` và bài giảm 10% một món hàng 225 000 đồng. Garage hiển thị một câu ví dụ được sinh theo mức đang chọn, để thấy sự khác biệt trước khi chơi.

## Cách tích hợp

- Gọi đúng hàm generator học toán, không sao chép một ngân hàng câu. Từng câu lưu topic và seed nguồn để tái hiện; kiểm thử gọi lại hàm gốc với seed đó và đối chiếu nội dung/đáp án.
- Các generator được dùng nhận randomness qua `services/generators/random.ts`. Mặc định vẫn dùng `Math.random`; adapter chỉ đặt nguồn có seed trong lời gọi đồng bộ và khôi phục bằng `finally`, không ghi đè `Math.random` toàn cục.
- Helper đáp án nhiễu dùng chung được chuyển sang `services/generators/distractors.ts`; `mathEngine.ts` re-export API cũ. Điều này tránh kéo toàn bộ engine/AI vào adapter.
- Mỗi ván dùng seed mới; các dạng bài được xáo theo vòng để đủ loại trong chặng ngắn. Không lặp nguyên câu trong một ván. Phần biến đổi tìm số chỉ che một toán hạng của phép tính sinh từ generator gốc, giữ quan hệ toán đúng.
- Chỉ dùng câu một đáp án hoặc nhập số có nội dung tự đủ. Bài nhiều lựa chọn, chọn đáp án sai và bài cần hình vẽ để hiểu không được đưa vào ba làn đua. Bài chu vi đã có đủ kích thước trong lời đề.
- Chuẩn hóa phân số tương đương, loại lựa chọn trùng về giá trị, giữ đúng ba đáp án. Số lớn dùng khoảng trắng hàng nghìn; số thập phân dùng dấu phẩy. Đáp án số/chữ, đơn vị và phân số được hỗ trợ ở engine, cổng 3D, 2D, HUD và kết quả.
- Mỗi dạng có thêm 0–7 giây đọc/giải phù hợp độ phức tạp. Nhịp đua vẫn độc lập với độ khó; khoảng chuyển câu ngắn 1,5–2,2 giây không đổi.
- Session mới có `questionVersion: 2`. Ván cũ và luyện lại câu sai giữ generator cũ để không đổi câu đã lưu; ván mới dùng curriculum chung. Giữ lịch sử, sao và chống cộng thưởng trùng.

## Kiểm chứng

`engine.test.ts` kiểm tra 15.000 câu ở 15 tổ hợp lớp/mức: phép tính đối chứng độc lập, tìm số, phân số, thập phân, trung bình, chu vi và phần trăm; ba đáp án khác nhau về giá trị; seed tái hiện; không trùng câu; nhịp đua không đổi nội dung.

`curriculum.test.ts` kiểm tra mức Dễ/Trung bình thực sự khác ở nhớ/mượn, phạm vi số, dạng bài bắt buộc của mỗi lớp; gọi lại generator nguồn; khôi phục randomness khi lỗi/nested call; đọc phiên bản cũ và luyện đúng câu cũ. Bộ kiểm thử generator chung cũng được chạy để phát hiện ảnh hưởng đến phần học toán.

Kiểm tra UI bằng `/Genius-kids/racing-preview.html`: trong thanh DEV chọn Lớp, Độ khó và cảnh `garage` hoặc `gate`, rồi “Mở cảnh kiểm thử”. Trang dùng hồ sơ trong bộ nhớ. Chọn độ khó trong garage là cấu hình cho ván mới; lựa chọn Độ khó ở thanh DEV dành riêng cho các fixture kiểm thử.

Kết quả xác nhận ngày 10/09/2026: toàn bộ 501 kiểm thử trong 32 file đạt; sau chỉnh bộ lọc cuối cùng, chạy lại 31 kiểm thử curriculum/engine đều đạt. TypeScript và build production thành công. Build còn cảnh báo có sẵn về URL font được resolve lúc chạy, import tĩnh/động trùng và kích thước chunk. UI đã xác nhận cấu hình lớp/mức, ví dụ trong garage, bài giảm giá và đáp án nhiều chữ số trên bản xem trước.
