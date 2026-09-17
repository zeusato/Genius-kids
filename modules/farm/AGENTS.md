# Làm việc trong module farm

- Gọi người dùng là **Đại ca**, xưng **em**.
- Trước khi tiếp tục ở một phiên mới, đọc `docs/README.md` và toàn bộ tài liệu theo thứ tự trong đó. Tệp này là điểm bàn giao, chứa quy tắc ưu tiên khi tài liệu cũ và mới khác nhau.
- Phân biệt bản thử đã triển khai với thiết kế `docs/REVAMP_PLAN.md`; không báo các tính năng mới là đã có chỉ vì thấy chúng trong tài liệu/JSON.
- Giữ module độc lập theo phạm vi đã chốt; không tự ghép route/menu/profile, bật server/Auth/Supabase hoặc sửa package/config của ứng dụng chính.
- Bảo toàn save và thay đổi có trước; cập nhật trạng thái bàn giao/kiểm chứng sau mỗi đợt thực hiện. Làm theo chỉ dẫn mới của Đại ca khi phạm vi được thay đổi.
