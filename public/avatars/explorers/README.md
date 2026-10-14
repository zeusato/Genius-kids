# Những người bạn khám phá

20 chân dung tạo mới bằng công cụ OpenAI image_gen tích hợp ngày 04/10/2026.
Phong cách: nhân vật 3D chất liệu đất sét mềm, màu ấm, nền kem, khăn xanh hoặc đất nung.

`avatar_01`–`avatar_20` giữ nguyên tên nhân vật, ID và giá 30 sao của bộ cũ.
Các hồ sơ và giao dịch đã có không cần chuyển đổi. Tất cả ảnh nay dùng `isEmoji: false`.

Ảnh triển khai: WebP 384 × 384, chất lượng 88, tổng khoảng 253 KB.
Chỉ thu nhỏ và mã hóa WebP từ ảnh gốc; không cắt hoặc sửa nội dung ảnh.
Ảnh gốc được giữ tại thư mục generated_images của Codex trên máy tạo.
Tên tệp gốc cùng toàn bộ prompt chung và từng nhân vật được lưu trong `prompts.json`.
Prompt hoàn chỉnh = `style` + `subjects[n].promptSuffix`.

Avatar được dùng chung ở màn chọn hồ sơ, hồ sơ cá nhân, cửa hàng và các trò chơi thông qua `services/avatarService.ts`.
