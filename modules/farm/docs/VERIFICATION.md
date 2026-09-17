# Kiểm chứng bản thử độc lập 0.1

> Kết quả lịch sử của bản thử 0.1. Đọc [bàn giao](README.md) để biết điểm tiếp tục; tài liệu này không chứng nhận các tính năng trong [REVAMP_PLAN](REVAMP_PLAN.md). Lượt gom tài liệu không thay code và không chạy lại các kiểm thử gameplay dưới đây.

Ngày 17/09/2026. Kiểm tra trên môi trường phát triển hiện tại; không phải chứng nhận hoàn thiện mỹ thuật hoặc hiệu năng điện thoại thật.

## Tự động

- Typecheck bằng cấu hình riêng: đạt.
- Typecheck từ repository gốc cũng đã chạy đạt khi thêm module; không sửa cấu hình gốc.
- 34 kiểm thử / 3 file: đạt. Phạm vi: chống nhận sản phẩm/thưởng lặp, trừ hạt/nguyên liệu, bán sai số lượng, công thức sai trạm, tưới một lần, chuyển giai đoạn cây, cấp/mở đất, xoay footprint, chồng lấn, thời gian khi quay lại và đồng hồ lùi, bản lưu hỏng, lỗi ghi, hai cửa sổ, mở lần đầu đồng thời, bản sao và model.
- Production build riêng: đạt; đầu ra `.build`. JS khoảng 1.19 MB trước gzip / 339 kB gzip; font khoảng 52 kB; CSS khoảng 21 kB trước gzip. Vite vẫn cảnh báo chunk JS lớn hơn 500 kB. Chưa tối ưu tách chunk hay đo bản đồ tải lớn.

## Trình duyệt

Đã thực hiện bằng giao diện bản local tại cổng 4328:

- Thu hoạch, gieo cà rốt, tưới; trừ đúng 5 xu và lưu vụ mới.
- Xay bột từ lúa mì; nhận thành phẩm sau hạn hoàn thành.
- Thu thêm cây, nhận mục tiêu lần đầu, lên cấp 2.
- Nâng lò bánh cấp 2; trừ 100 xu và thay model.
- Mua, xoay preview và đặt chậu cúc; trừ 15 xu.
- Tải lại: giữ 100 xu, 40 XP, lò bánh cấp 2, trạng thái các luống và chậu mới.
- Xưởng mẫu: mở và chuyển lò bánh đến cấp 3; model hiện đầy đủ trong cảnh xem riêng.
- Xem ảnh toàn cảnh desktop và khung iframe 390 × 844. Chữ tiếng Việt, model, menu và bảng thao tác hiển thị; bản responsive dùng bảng thao tác bên dưới bản đồ. Khung iframe không thay thế thử cảm ứng/GPU/mạng của thiết bị thật.

## Ranh giới đã kiểm tra

Không có import host, lời gọi Supabase/API, truy cập localStorage hồ sơ hoặc đăng ký service worker trong mã nguồn module. Không thay route/catalog, package/config, public hoặc dịch vụ của dự án chính trong lượt triển khai này. Thay đổi sẵn có ngoài `modules/farm` được giữ nguyên.

## Còn cần kiểm chứng ở các mốc sau

Mỹ thuật so với concept, animation vật nuôi đầy đủ, thao tác kéo thả, âm thanh/mini game, nhịp kinh tế nhiều ngày, thử người chơi, tải lớn và thiết bị di động thật. Login, cloud save, thăm vườn và chợ người chơi chưa triển khai. Không dùng bản local để khẳng định đã xử lý xung đột online hoặc chống sửa dữ liệu.

## Kiểm tra riêng lượt gom tài liệu bàn giao — 17/09/2026

- Tập trung 11 tệp trong `modules/farm/docs`: 9 Markdown, 1 JSON thiết kế và 1 PNG concept; mọi tệp đã có trong mục lục/thứ tự đọc.
- Tám tệp di chuyển được so SHA-256 trước/sau khi chuyển, nội dung giữ nguyên ở bước di chuyển; sau đó bổ sung nhãn tài liệu hiện hành/tham khảo và sửa liên kết.
- Kiểm 53 liên kết nội bộ của bộ docs và README module: không có liên kết hỏng. Không còn tài liệu `farm-*` nằm rải ở thư mục `docs` gốc.
- Ảnh concept đi cùng thư mục, xác nhận PNG 1536 × 1024; không phụ thuộc file tạm ở máy công ty.
- JSON thiết kế đọc được, vẫn đủ 25 mốc Home và 28 nhà phụ. Không chỉnh nội dung tiến trình trong lượt gom tài liệu.
- Có README bàn giao và AGENTS ở gốc module dẫn đến điểm đọc đầu tiên; ghi rõ trạng thái Git, cách chạy trên máy mới và save IndexedDB phải xuất/nhập riêng.
- Không thay source/config/dependency hoặc save trong lượt này; không chạy lại bộ test/build gameplay và không commit/push.
