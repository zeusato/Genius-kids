# MathGenius Kids 🎓

**MathGenius Kids** là ứng dụng web tương tác giúp trẻ em tiểu học (Lớp 1 - 5) học toán một cách vui vẻ và hiệu quả. Ứng dụng kết hợp các bài tập toán học với giao diện sinh động, hệ thống khen thưởng và theo dõi tiến độ.

![MathGenius Kids Banner](public/OG.png)

## ✨ Tính Năng Nổi Bật

### 🎯 **Trải Nghiệm Học Tập**
*   **📱 Progressive Web App (PWA):** 
    *   Cài đặt như ứng dụng native trên điện thoại/máy tính
    *   Hoạt động offline sau khi tải lần đầu
    *   Tự động kiểm tra và thông báo khi có phiên bản mới
    *   Splash screen đẹp mắt khi khởi động
*   **🔄 Điều hướng mượt mà:** 
    *   Nút Back/Forward của trình duyệt hoạt động
    *   Có thể bookmark các trang yêu thích
    *   Chuyển trang nhanh không loading lại toàn bộ app
*   **👤 Đa Hồ Sơ:** 
    *   Tạo hồ sơ riêng cho nhiều bé
    *   Mỗi bé có avatar, lịch sử học tập và thành tích riêng
    *   Dễ dàng chuyển đổi giữa các hồ sơ

### 📚 **Nội Dung Học Tập**
*   **Đa Dạng Chủ Đề:** 
    *   Toán lớp 1-5 với nội dung phù hợp từng cấp độ
    *   Bài tập Cộng, Trừ, Nhân, Chia, Phân số, Hình học, v.v.
    *   Bài tập ứng dụng thực tế
*   **Nhiều Dạng Câu Hỏi:**
    *   📋 Trắc nghiệm (chọn 1 đáp án)
    *   ☑️ Chọn nhiều đáp án đúng
    *   ✍️ Tự nhập kết quả
    *   ⌨️ Luyện gõ phím (kết hợp học toán và tin học)
*   **⌨️ Hỗ Trợ Gõ Tiếng Việt:** 
    *   Tích hợp hướng dẫn gõ Telex ngay trong bài tập
    *   Luyện tập gõ chữ Việt có dấu chính xác

### 🎮 **Trò Chơi Giáo Dục**
*   **Trò chơi toán học:** Học qua chơi với nhiều mini-game hấp dẫn
*   **Memory Match:** Rèn luyện trí nhớ kết hợp luyện tính
*   **Speed Math:** Thi đấu giải toán với thời gian
*   **Nhận thưởng:** Hoàn thành game nhận sao và ảnh sưu tập

### 🏆 **Động Lực & Khen Thưởng**
*   **Hệ Thống Sao:** Làm bài tốt nhận sao, tích sao mua avatar
*   **Album Sưu Tập:** Thu thập hình ảnh đẹp qua gacha sau mỗi bài
*   **Thống Kê Tiến Độ:** 
    *   Biểu đồ hiển thị kết quả theo thời gian
    *   Xem lại bài làm và đáp án đúng
    *   Theo dõi điểm số và thời gian hoàn thành
*   **Phản Hồi Tức Thì:**
    *   🔊 Âm thanh vui nhộn khi trả lời đúng/sai
    *   🎉 Lời khen ngợi động viên sau mỗi bài
    *   ⭐ Huy hiệu thành tích khi đạt điểm cao

### 🛍️ **Shop & Tùy Chỉnh**
*   **Cửa Hàng Avatar:** Mua avatar đẹp bằng sao kiếm được
*   **Đa Dạng Lựa Chọn:** Nhiều avatar cute và đáng yêu
*   **Thay Đổi Giao Diện:** Tùy chỉnh avatar theo sở thích

### 📊 **Tiện Ích Cho Phụ Huynh**
*   **Theo Dõi Tiến Độ:** Xem biểu đồ thống kê hiểu mức độ tiến bộ của bé
*   **Lịch Sử Chi Tiết:** Xem lại tất cả bài kiểm tra đã làm
*   **Xuất PDF:** 
    *   Tạo đề thi ra giấy để bé làm offline
    *   In bài tập về làm thêm tại nhà
*   **Quản Lý Hồ Sơ:** Tạo, sửa, xóa hồ sơ học sinh dễ dàng

## 🎯 Phù Hợp Với

✅ Học sinh tiểu học lớp 1-5  
✅ Phụ huynh muốn theo dõi con học  
✅ Giáo viên tạo đề thi nhanh  
✅ Bé muốn học toán vui vẻ  

## 🚀 Bắt Đầu Sử Dụng

### Người Dùng (Không cần cài code)
1. Truy cập: **[https://zeusato.github.io/Genius-kids/](https://zeusato.github.io/Genius-kids/)**
2. Nhấn "Tải App" để cài như ứng dụng (khuyên dùng!)
3. Tạo hồ sơ cho bé
4. Bắt đầu học toán! 🎉

### Developers (Chạy local)

Đảm bảo đã cài [Node.js](https://nodejs.org/)

```bash
# Clone repository
git clone https://github.com/zeusato/Genius-kids.git
cd Genius-kids

# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build
```

## 🛠️ Công Nghệ

*   **React 19** + TypeScript
*   **Vite** - Build tool siêu nhanh
*   **React Router** - Điều hướng mượt mà
*   **Tailwind CSS** - Giao diện đẹp
*   **PWA** với Workbox - App offline
*   **Recharts** - Biểu đồ thống kê
*   **jsPDF** - Xuất PDF
*   **Web Audio API** - Âm thanh tương tác

## 📂 Cấu Trúc Dự Án

```
src/
├── pages/              # Các trang chính
├── components/         # UI components
│   ├── study/          # Components học tập
│   └── shared/         # Components dùng chung
├── contexts/           # React Context (state global)
├── services/           # Logic nghiệp vụ
│   └── generators/     # Sinh câu hỏi toán
└── utils/              # Tiện ích (PDF, sound, v.v.)
```

## 🆕 Cập Nhật Gần Đây

### v2.0 - UI/UX Overhaul
*   ✅ Refactor toàn bộ routing với React Router
*   ✅ Browser back/forward button hoạt động
*   ✅ Code clean hơn (App.tsx giảm 81% dòng code)
*   ✅ Navigation mượt mà hơn
*   ✅ Có thể bookmark các trang

### Tính năng trước đó
*   ✅ Hệ thống PWA với auto-update
*   ✅ Luyện gõ Telex tích hợp
*   ✅ Album gacha sưu tập hình
*   ✅ Shop avatar với sao
*   ✅ Nhiều trò chơi giáo dục

## 🤝 Đóng Góp

Mọi đóng góp đều được hoan nghênh! Hãy:
*   🐛 Báo lỗi qua [Issues](https://github.com/zeusato/Genius-kids/issues)
*   💡 Đề xuất tính năng mới
*   🔧 Gửi Pull Request

## 📝 License

MIT License - Tự do sử dụng cho mục đích giáo dục.

---

*Được phát triển với ❤️ cho các bé yêu toán học.*

**Hãy cho ⭐ nếu bạn thấy hữu ích!**
