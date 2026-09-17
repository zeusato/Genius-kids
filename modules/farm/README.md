# Làng Mầm — module nông trại độc lập

**Đọc [bộ tài liệu và bàn giao](docs/README.md) trước khi tiếp tục công việc.** Toàn bộ yêu cầu đã chốt, thiết kế hiện hành, trạng thái code, kết quả kiểm tra, concept và thứ tự đọc đều nằm trong `docs/`.

- [Thiết kế nâng cấp Home 1–25 và thế giới nông trại](docs/REVAMP_PLAN.md)
- [Bản thử hiện tại và kiến trúc](docs/CURRENT_STATE.md)
- [Kết quả kiểm chứng bản thử](docs/VERIFICATION.md)

Chạy từ gốc repository:

```powershell
node node_modules/vite/bin/vite.js --config modules/farm/vite.config.ts --configLoader runner
```

Mở **http://127.0.0.1:4328/**. Module dùng dependency ở repo cha, config/cache/build và IndexedDB riêng; chưa tích hợp Genius Kids hoặc Supabase. Kế hoạch mới chưa được triển khai. Hướng dẫn chuyển máy, mang code và xuất bản lưu nằm trong tài liệu bàn giao.
