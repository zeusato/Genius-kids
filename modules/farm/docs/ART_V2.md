# Concept và kit 3D v2

**Cập nhật mới nhất 18/09:** đọc [CONTEXTUAL_PLAY_AND_ROADS](CONTEXTUAL_PLAY_AND_ROADS.md). Đã bỏ sidebar/toolbar cố định, thêm menu tại vật thể, cửa sổ có tranh, kéo liềm và hàng bay về kho sau lưu thành công, texture đất, chim ảnh và đường tự nối 16 hướng. Mô tả bảng bên/toolbar phía dưới là lịch sử, không phải UI hiện tại.

**Đợt kiến trúc/cảnh quan tiếp theo 18/09:** đã bỏ mẫu nhà chung cho 26 công trình, sửa phụ kiện ba mẫu cũ, thêm cây thấp và sương. Xem [ARCHITECTURE_AND_EXPLORATION](ARCHITECTURE_AND_EXPLORATION.md) và bảng mẫu chạy ở `?lab=architecture`; không dùng ảnh trưng bày QA làm hình bắt đầu chơi.

**Cập nhật 18/09:** camera đã khóa góc, hướng hiện hành là hybrid 2.5D. Cây/đá tài nguyên dùng 14 sprite imagegen một góc; công trình hiện vẫn là mesh. Vật thể sprite được xoay phải có đủ bốn ảnh, không xoay tấm phẳng một ảnh. Xem [bàn giao địa hình](TERRAIN_V2_IMPLEMENTATION.md) và [quy ước tài nguyên](../src/assets/terrain/README.md). Nội dung 17/09 bên dưới là lịch sử kit công trình đang giữ.

17/09/2026. [Concept mới](farm-world-concept-v2.png) được tạo bằng công cụ imagegen tích hợp trong lượt triển khai. Bản cục bộ được giữ cùng module, không phụ thuộc thư mục ảnh sinh của máy.

Brief của lượt tạo ảnh (tóm tắt nội dung, không phải bản chép nguyên văn prompt): một nông trại 3D ấm áp và trưởng thành, gỗ/đá/ngói có chất liệu, Home tăng từ nhà nhỏ tới điền trang theo sáu mốc, kho và khu sản xuất rõ chức năng, ruộng khác loại, đường đi, bờ hồ/cảng, cầu/sông và đá tài nguyên; ánh sáng mềm, màu tiết chế. Ảnh tham chiếu để định hướng tỉ lệ và cảnh quan, không phải screenshot và không đưa lên một tấm phẳng thay model.

Game dùng mesh dựng bằng code tại `src/render/models.ts`, có cache, gộp vật liệu, sáu mốc cấp và cây năm trạng thái. Cối xay, lò bánh, chuồng, mỏ, vườn cây, ong, ao/cảng có họ hình khác nhau; các xưởng còn dùng chung kit kiến trúc và thêm thiết bị nghề. Chưa xem việc dùng chung kit là đã hoàn tất nghiệm thu nhận diện mỹ thuật từng nghề.

Ảnh scene thực tế trong [screenshots](screenshots/home-25.png); xưởng mẫu trong game cho chọn nhà/cấp/cây/giai đoạn và xoay đủ phía. Không dùng ảnh concept làm bằng chứng chất lượng asset hoặc hiệu năng.

Đợt tiếp theo cần đối chiếu từng silhouette ở bốn góc, độ đọc thiết bị ở zoom xa, hoạt ảnh nghề, và thiết bị mobile thật. Bộ prompt v1 vẫn được giữ ở [farm-3d-art-prompts](farm-3d-art-prompts.md).
