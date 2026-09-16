# Học đếm: mười kịch bản riêng — 16/09/2026

Yêu cầu của Đại ca: thay kịch bản nhặt đồ chung bằng một trò chơi riêng cho từng số; đếm xong phải chờ bé bấm nút mới sang tập tô.

## Nội dung đã triển khai

| Số | Kịch bản | Thao tác và kết quả |
| --- | --- | --- |
| 1 | Đánh thức mặt trời | Kéo đám mây sang phải, lộ một mặt trời. Thanh kéo hỗ trợ bàn phím. |
| 2 | Hai bông hoa khát nước | Cầm bình tưới rồi tưới từng bông; nụ nở thành hoa. |
| 3 | Bữa tiệc bóng bay | Chọc vỡ ba quả bóng; giữ dấu đếm ở vị trí bóng đã vỡ. |
| 4 | Bốn chiếc lá bí mật | Tìm lá trên các cành; lá đã đếm đổi màu và mang số. |
| 5 | Bữa sáng của đàn cá | Cầm hộp thức ăn, cho từng bạn cá ăn; cá phản hồi bằng chuyển động và trái tim. |
| 6 | Sáu chú gà chào đời | Lần gõ đầu làm nứt trứng, lần hai gà nở và mới tăng số đếm. |
| 7 | Nối chòm sao | Chạm ngôi sao đang sáng theo thứ tự; các đoạn nối hình thành chòm sao. |
| 8 | Tòa tháp tám tầng | Chuyển từng khối gỗ lên tháp; giữ số thứ tự các tầng. |
| 9 | Xưởng vẽ cánh bướm | Chọn một trong ba màu rồi tô từng bạn bướm; lưu màu riêng từng con. |
| 10 | Mười chuyến bay nhỏ | Giữ tên lửa 650 ms để nạp và phóng; nhả sớm hủy, bàn phím Enter cũng thao tác được. |

Mỗi cảnh có bố cục, đồ vật SVG và phản hồi riêng. Bình tưới/hộp thức ăn có hình minh họa; các bước có hướng dẫn tiếng Việt được đọc tự động và nút nghe lại. Thêm 21 MP3 local (20 lời dẫn đầu/cuối cảnh, một lời giới thiệu mới), đưa vào PWA precache. Ảnh sẵn có theo từng số tiếp tục dùng ở trang tập tô.

Đếm đủ chỉ hiện thành quả và nút **Tập tô số N**. Không có timer tự sang trang. Nút chuyển mới đặt `learningStep: trace`; lượt học và phần thưởng chỉ hoàn tất sau bước tập tô. Phiên cũ có nét tô dở được mở tiếp đúng khung; phiên chỉ vừa đếm đủ dừng ở thành quả. Nứt trứng, các vật đã đếm, màu bướm và bước học được lưu trong checkpoint.

## Kiểm thử

- Bộ test counting: **47/47 PASS**; bổ sung cả mười số, hai lần gõ trứng, thứ tự sao, chống đếm trùng, màu không hợp lệ, checkpoint, phiên cũ và cổng sang tập tô.
- TypeScript `--noEmit`: PASS.
- Production/PWA build: PASS, 751 mục precache. Các cảnh báo font URL/CSS/chunk/import đã ghi ở biên bản trước vẫn tồn tại.
- Chơi qua UI đủ mười cảnh bằng hồ sơ **Kiểm thử chữ cái — Mầm non**; tất cả dừng ở thành quả và hiện nút tập tô. Không chỉnh storage hoặc gọi hàm nội bộ của trang để tạo tiến độ.
- Số 2: tải lại, chọn lại hồ sơ và Chơi tiếp giữ hai bông hoa đã nở, chưa sang tô. Bấm nút mở đúng khung số 2.
- Số 10: nhấp nhanh không phóng; giữ thật bằng chuột phóng được; Enter phóng được. Bấm nút mở khung số 10; đường hoàn thành có hỗ trợ vẫn ghi nhận riêng.
- Số 6: sau một lần gõ, trứng nứt và bộ đếm chưa tăng; sau lần hai mới có gà và tăng đếm.
- Số 7: sao tiếp theo bị khóa đến khi sao trước hoàn tất. Số 9: ba màu được lưu độc lập.
- Đã xem ở desktop/tablet, 390 px và 320 px; các màn mobile đã đo không tràn ngang. Vùng bấm nhỏ nhất ở 320 px rộng 44 px.

## Ảnh bằng chứng

[Số 1](story-1.png), [số 2 và nút tập tô](story-2-ready.png), [số 3](story-3.png), [số 4](story-4.png), [số 5](story-5.png), [số 6](story-6.png), [số 7](story-7.png), [số 8](story-8.png), [số 9 ở 320 px](story-9-320.png), [số 10](story-10.png).

Một số ảnh toàn trang ghi lại header cố định ở vị trí cuộn lúc chụp. Mobile là viewport mô phỏng, chưa thử cảm ứng trên thiết bị vật lý. Audio đã kiểm tra file và vòng đời phát; không tuyên bố thẩm âm bằng tai người. Reduced motion có CSS nhưng chưa đổi preference hệ điều hành để nghiệm thu trực quan.
