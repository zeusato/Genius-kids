# Đại Chiến Rồng Thần — nâng cấp đồ họa, giữ luật bàn cờ

Cập nhật 08/09/2026 theo yêu cầu sửa sai của người dùng. Thiết kế chọn nhánh 8–12 điểm trước đây đã bị loại bỏ. Nguồn luật là `games/DragonQuest/engine/{map,constants,mechanics,buffs,reducer}.ts`; bản nâng cấp dùng lại trực tiếp hàm sinh map, xúc xắc, dịch chuyển, buff và hằng số điểm/thời gian.

## Quy tắc bắt buộc

- Mọi màn có **50 ô hiện đầy đủ ngay từ đầu**, đánh số 01–50, nối theo đường zíc zắc. Không chọn nhánh hoặc nhấn ô để di chuyển.
- Xuất phát ở ô 01, chưa kích hoạt sự kiện tại đó. Gieo xúc xắc 1–6, nhân vật tiến từng ô, dừng ở ô 50 nếu vượt cuối.
- Chỉ xử lý sự kiện của ô dừng. Đi ngang quái vật, buff, cạm bẫy không kích hoạt chúng.
- Phân bố giống bản cũ: 19 quái vật, 9 nàng tiên/buff, 7 cạm bẫy dịch chuyển, 14 ô thường, 1 boss cuối.
- Ba máu ban đầu và tối đa. Quái vật: đúng +10 điểm, sai −1 máu. Nàng tiên: đúng +15 và buff ngẫu nhiên, sai không mất máu.
- Kiếm Thánh tối đa 2, mỗi kiếm giảm một câu boss. Chén Thánh hồi một máu, nhận tối đa 3 lần. Áo Choàng Bay miễn nhiễm dịch chuyển lùi, không tiêu hao.
- Cạm bẫy dịch chuyển ngẫu nhiên −8 đến +8, kẹp trong bàn. Xử lý tiếp ô đích, kể cả cạm bẫy khác hoặc boss. Dịch chuyển 0 hoặc không đổi vị trí trả lượt gieo để tránh vòng lặp đứng yên.
- Boss có `max(3, 5 − số kiếm)` câu. **Đúng và sai đều tính một câu đã trả lời**; đúng +20, sai −1 máu. Hết máu thua trước khi xét thắng. Còn máu khi hết câu thì thắng; 3/2/1 máu nhận huy chương Vàng/Bạc/Đồng.

## Đồ họa và trải nghiệm

Bàn 3D luôn giữ toàn cảnh, tất cả ô mang số và ký hiệu loại sự kiện. Hero đi từng bước theo xúc xắc; rồng, quái vật và nàng tiên có hoạt ảnh. Ô đích nổi màu và ô hiện tại có vòng đánh dấu. Giao diện bên cạnh hiển thị lượt gieo, ô hiện tại/ô đích, điểm và buff thụ động. Bản 2D dự phòng hiển thị cùng 50 ô và dùng chung engine.

Tái sử dụng GLB và instancing; 50 ô dùng một instanced mesh, toàn bộ nhãn ô dùng một texture atlas/mesh chung. Giới hạn DPR, ba mức đồ họa, demand rendering, giảm chuyển động, dừng khi pause hoặc ẩn tab, hạ quality và chuyển 2D khi WebGL lỗi.

Giữ năm vùng và 20 màn, mở khóa tuần tự, sổ rồng, màu áo choàng, lưu phần thưởng. Chiến dịch cộng 3 sao cho lần hoàn thành đầu tiên mỗi màn, tối đa 60 sao, tách khỏi huy chương theo máu. Điểm trận và mốc danh nghĩa 300 được ghi vào lịch sử; thống kê tự giải/trợ giúp nằm riêng. Điểm có thể vượt 300 do đi lùi rồi gặp lại sự kiện, đúng tính chất ngẫu nhiên bản cũ.

## AI

Công tắc **Ra đề bằng AI** ở màn bắt đầu. Ứng dụng tự sinh prompt từ lớp, nội dung, độ khó và các ô trên bàn. Chuẩn bị **33 câu**: 19 quái vật + 9 nàng tiên + tối đa 5 câu boss. Ô thường và dịch chuyển không cần câu riêng. Đi ngang không hỏi; đi lại ô cũ dùng câu đã gán, ghi lượt trả lời mới riêng.

Tắt AI không gọi mạng. Bật AI chỉ gọi khi bắt đầu ván; kiểm tra cấu trúc, phạm vi kiến thức và giải lại đáp án. Sửa phần thiếu một lần, tổng hạn chờ 25 giây, bù local nếu lỗi/thiếu. Không có ô nhập prompt/JSON. Snapshot giữ nguyên batch, map, xúc xắc, vị trí, lượt RNG, buff và từng lần gặp; tiếp tục ván không gọi AI lại.

## Kiểm chứng

- 407 test / 22 file đã qua, bao gồm engine cũ và 27 test bộ nâng cấp: đối chiếu phân bố/map cũ, xúc xắc và bước di chuyển, bỏ qua sự kiện đi ngang, HP/điểm/buff, cạm bẫy liên tiếp, boss đúng/sai, snapshot và 20 màn hoàn chỉnh.
- Tạo/kiểm tra 33 câu trên mọi tổ hợp 20 màn × 6 lớp × 4 chủ đề × 3 độ khó; AI hợp lệ, sai, sửa thiếu, hủy, timeout và phản hồi muộn; ghi lỗi/retry và trần 60 sao.
- Bản lưu đang chơi của thiết kế chọn nhánh không được tiếp tục: session hiện là version 3. Tiến độ các màn đã hoàn thành và lịch sử cũ được giữ.

Xem [báo cáo triển khai](dragon-quest-implementation.md) để biết kết quả kiểm tra giao diện và build. Bản cũ vẫn mở trong Cài đặt hoặc qua `VITE_DRAGON_V2=false`.
