# Kinh tế 0.2 — bằng chứng đường chơi solo

17/09/2026. Nguồn: tests/progression-playthrough.check.ts, [JSON theo mọi mốc](solo-progression-v2.json). Dùng lệnh game thật, không cấp tiền/vật liệu/cấp và không tiêu phiếu sau khởi tạo. Cả ba thế mạnh có nguồn đủ lên 25; không bắt buộc trading hay thắng mini game.

## Kịch bản và số đo

Một phiên mỗi ngày, ngân sách 5/15/30 phút; mỗi lệnh hai giây. Giữ tám luống, thu theo batch, kiếm tiền từ cà rốt, tự gom/craft, xếp mẻ trong giới hạn queue/kho trạm, nâng từng nhà tuần tự. Khi thời gian chờ vượt phần phiên còn lại, quay lại ngày sau. Không dùng phần thưởng nhiệm vụ trong chặng đo Home, không tận dụng nhiều đội thợ đồng thời, NPC buy hay chiến lược kiếm xu tối ưu.

Các cột H là **ngày mô phỏng của chiến lược này**, không phải số ngày được thiết kế để mọi người chơi phải chờ.

| Biome | Phút/ngày | H3 | H10 | H15 | H20 | H25 | Lệnh |
|---|---:|---:|---:|---:|---:|---:|---:|
| forest | 5 | 3 | 79 | 260 | 665 | 1419 | 26790 |
| forest | 15 | 1 | 34 | 118 | 314 | 665 | 28868 |
| forest | 30 | 0 | 22 | 72 | 190 | 407 | 29344 |
| ore | 5 | 3 | 81 | 258 | 666 | 1426 | 27296 |
| ore | 15 | 1 | 33 | 116 | 313 | 660 | 29350 |
| ore | 30 | 0 | 22 | 71 | 189 | 404 | 29826 |
| stone | 5 | 3 | 78 | 261 | 672 | 1449 | 27143 |
| stone | 15 | 1 | 35 | 119 | 315 | 670 | 29182 |
| stone | 30 | 0 | 22 | 73 | 193 | 411 | 29678 |

## Kết luận có thể rút ra

- Có đường tiến triển hợp lệ không mua hàng người chơi, không boost, không gán tài sản; snapshot hợp lệ mỗi mốc. Một lượt 15 phút ở forest còn tự làm và nhận đủ 25 chương sau phép đo Home.
- Biome yếu vẫn có nguồn tài nguyên lặp lại. Kho, nguyên liệu tiền thân, quyền nhà, timer và điều kiện chéo không khóa đường solo này.
- Kết quả ban đầu cho thấy nhà phụ lặp quá nhiều chi phí vật liệu theo cấp; đã giảm chi phí nhà phụ từ cấp 4 trong progression.ts, giữ giá Home và timer. Mô phỏng được chạy lại với bảng mới.
- Thời gian cuối game còn dài trong chiến lược bảo thủ này. Chưa đủ bằng chứng gọi kinh tế là cân bằng/hấp dẫn. Không dùng số liệu này để tuyên bố mục tiêu giữ chân hay doanh thu.

## Các phép đo còn cần để đóng nghiệm thu

So sánh người chơi chủ động mở thêm ruộng, dùng nhiều đội thợ/đơn hàng và hàng đợi; tách thời gian thao tác/chờ hữu ích; ghi nơi người thật không hiểu hoặc muốn bỏ cuộc. Thử 2 giờ/3 ngày/7 ngày bằng scheduler đã có trong regression, nhưng độ vui nhiều ngày vẫn cần người chơi. Không tăng nội dung online để che vấn đề nhịp local.
