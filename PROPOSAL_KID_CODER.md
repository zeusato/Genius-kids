# Feature Proposal: Lập Trình Nhí (Kid Coder)

## 1. Giới thiệu (Concept)
**Lập Trình Nhí** là một mini-game giáo dục giúp trẻ em làm quen với tư duy lập trình (computational thinking) thông qua việc điều khiển nhân vật (Robot/Phi hành gia) di chuyển trên lưới để đạt mục tiêu.

**Cảm hứng:** Lightbot, Scratch Jr, Code.org.

## 2. Tại sao nên làm? (Value Proposition)
- **Phù hợp với MathGenius Kids:** Bổ sung hoàn hảo cho Toán học. Lập trình là ứng dụng thực tế của Logic và Toán.
- **Rèn luyện tư duy:**
  - **Tuần tự (Sequencing):** Sắp xếp lệnh theo thứ tự đúng.
  - **Vòng lặp (Loops):** Nhận ra quy luật lặp lại.
  - **Gỡ lỗi (Debugging):** Tìm sai sót khi Robot không đi đúng.
## 3. Cấu trúc chương trình học (Curriculum)
Chương trình được chia thành 4 Cấp độ (Level), mỗi Cấp độ gồm nhiều Bài học (Lesson) tập trung vào một kỹ năng cụ thể. Người dùng sẽ thấy rõ tiến trình học tập của mình.

### Level 1: Tập sự (Novice) - Kỹ năng Tuần tự
*Mục tiêu: Hiểu rằng Robot thực hiện lệnh theo thứ tự từ trên xuống dưới.*
- **Lesson 1.1:** Đi thẳng 1 bước.
- **Lesson 1.2:** Đi thẳng nhiều bước.
- **Lesson 1.3:** Đi thẳng và thu thập vật phẩm.

### Level 2: Khám phá (Explorer) - Kỹ năng Định hướng
*Mục tiêu: Phân biệt trái/phải và thay đổi hướng đi của Robot.*
- **Lesson 2.1:** Rẽ trái.
- **Lesson 2.2:** Rẽ phải.
- **Lesson 2.3:** Kết hợp Đi thẳng và Rẽ.
- **Lesson 2.4:** Quay đầu (Rẽ 2 lần).

### Level 3: Thử thách (Challenger) - Tư duy Giải thuật
*Mục tiêu: Giải quyết vấn đề trong môi trường có ràng buộc (vật cản).*
- **Lesson 3.1:** Tránh vật cản đơn giản.
- **Lesson 3.2:** Mê cung dích dắc.
- **Lesson 3.3:** Tìm đường đi duy nhất.

### Level 4: Kiến tạo (Creator) - Tối ưu hóa
*Mục tiêu: Tìm ra giải pháp ngắn gọn và hiệu quả nhất.*
- **Lesson 4.1:** Giới hạn số bước đi (Ví dụ: Chỉ được dùng 5 lệnh).
- **Lesson 4.2:** Thu thập nhiều vật phẩm theo lộ trình tối ưu.
- **Lesson 4.3:** (Tương lai) Sử dụng Vòng lặp để rút gọn code.

## 4. Giao diện & Gameplay (UI/UX)

### Màn hình chính
- **Khu vực bản đồ (Game Board):** Lưới ô vuông (5x5 hoặc lớn hơn). Có chướng ngại vật, điểm xuất phát, đích đến, và vật phẩm cần thu thập.
- **Khu vực lệnh (Command Palette):** Các khối lệnh kéo thả:
  - ⬆️ Đi thẳng
  - ⬅️ Quay trái
  - ➡️ Quay phải
  - 💡 Bật đèn/Thu thập
  - 🔁 Lặp lại (cho level cao)
- **Khu vực chương trình (Main Program):** Nơi trẻ kéo các khối lệnh vào để tạo chuỗi hành động.
- **Nút Chạy (Run):** Bấm để Robot thực thi chuỗi lệnh.

### Luồng chơi
1. Bé quan sát bản đồ.
2. Bé suy nghĩ đường đi cho Robot.
3. Bé chọn các mũi tên/lệnh và xếp vào hàng.
4. Bấm "Chạy". Robot di chuyển từng bước.
5. **Thắng:** Robot đến đích. **Thua:** Robot đâm tường hoặc đi sai.

## 4. Kế hoạch triển khai (Implementation)

### Giai đoạn 1: Core & Generator (Quan trọng)
Thay vì làm cứng level, ta sẽ xây dựng **`KidCoderGenerator`** service ngay từ đầu:
- **Input:** Độ khó (Easy, Medium, Hard).
- **Output:** Một cấu trúc Map hợp lệ (JSON).
- **Thuật toán sinh map:**
  1. Tạo lưới trống (Grid).
  2. Chọn điểm xuất phát (Start) và đích (End) ngẫu nhiên.
  3. Dùng thuật toán tìm đường (A* hoặc BFS) để tạo một "lời giải mẫu" (Golden Path).
  4. Thêm chướng ngại vật (Obstacles) vào các ô không thuộc Golden Path.
  5. (Nâng cao) Thêm các điểm phụ (Stars) trên đường đi để buộc người chơi tối ưu hóa.
  6. **Kiểm tra:** Đảm bảo map luôn giải được và độ dài chuỗi lệnh phù hợp với độ khó.

### Giai đoạn 2: UI & Game Loop
- Xây dựng giao diện kéo thả mượt mà.
- Hiệu ứng Robot di chuyển từng bước.
- Hệ thống chấm điểm dựa trên số lượng lệnh sử dụng (càng ít càng tốt).

## 5. Đánh giá độ khó kỹ thuật
- **Trung bình.**
- Thách thức nằm ở thuật toán sinh map sao cho "không quá dễ" (đường thẳng tuột) và "không quá khó" (mê cung rối rắm).
- Cần tinh chỉnh tham số sinh (tỷ lệ vật cản, số lần rẽ ngoặt).

---
**Kết luận:** Đây là tính năng "đinh" (killer feature) giúp nâng tầm ứng dụng từ "Game Toán học" thành "Game Tư duy & Khoa học", tăng giá trị giáo dục lên rất nhiều.
