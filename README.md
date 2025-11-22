# MathGenius Kids 🎓

**MathGenius Kids** là ứng dụng web tương tác giúp trẻ em tiểu học (Lớp 1 - 5) học toán một cách vui vẻ và hiệu quả. Ứng dụng kết hợp các bài tập toán học với giao diện sinh động, hệ thống khen thưởng và theo dõi tiến độ.

![MathGenius Kids Banner](public/OG.png)

## ✨ Tính Năng Nổi Bật

*   **👤 Hồ Sơ Học Sinh:** Tạo và quản lý hồ sơ cho nhiều bé, mỗi bé có avatar và lịch sử học tập riêng.
*   **📚 Đa Dạng Chủ Đề:** Bài tập được phân loại theo lớp (1-5) và chủ đề (Cộng, Trừ, Nhân, Chia, Hình học, v.v.).
*   **📝 Nhiều Dạng Câu Hỏi:**
    *   Trắc nghiệm (Chọn 1 đáp án).
    *   Chọn nhiều đáp án đúng.
    *   Tự nhập kết quả.
    *   Luyện gõ phím (kết hợp học toán và tin học).
*   **⌨️ Hỗ Trợ Gõ Tiếng Việt:** Tích hợp hướng dẫn và luyện gõ Telex.
*   **🏆 Hệ Thống Khen Thưởng:** Huy hiệu, điểm số và lời khen ngợi động viên bé sau mỗi bài kiểm tra.
*   **📊 Theo Dõi Tiến Độ:** Biểu đồ thống kê kết quả học tập giúp phụ huynh nắm bắt sự tiến bộ của trẻ.
*   **🖨️ Xuất PDF:** Tính năng tạo và in đề thi ra giấy để bé làm bài offline.

## 🛠️ Công Nghệ Sử Dụng

*   **Frontend:** [React](https://react.dev/) (v19), [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **PDF Generation:** [jsPDF](https://github.com/parallax/jsPDF)

## 🚀 Cài Đặt và Chạy Local

Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/) trên máy.

1.  **Clone repository:**
    ```bash
    git clone https://github.com/zeusato/Genius-kids.git
    cd Genius-kids
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Chạy ứng dụng (Development mode):**
    ```bash
    npm run dev
    ```
    Truy cập vào đường dẫn được hiển thị (thường là `http://localhost:5173`).

4.  **Build cho production:**
    ```bash
    npm run build
    ```

## 📂 Cấu Trúc Dự Án

*   `src/App.tsx`: Component chính chứa logic điều hướng và các màn hình.
*   `src/types.ts`: Định nghĩa các kiểu dữ liệu (TypeScript interfaces).
*   `src/services/mathEngine.ts`: Logic sinh câu hỏi toán học.
*   `src/utils/`: Các tiện ích hỗ trợ (xuất PDF, v.v.).

## 🤝 Đóng Góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo Pull Request hoặc mở Issue nếu bạn tìm thấy lỗi hoặc có ý tưởng mới.

---
*Được phát triển với ❤️ cho các bé yêu toán học.*
