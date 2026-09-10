# Kỹ Sư Máy Móc — Xưởng Sáng Chế

Ngày: 10/09/2026. Trạng thái: **đã triển khai bản chơi thử 6 nhiệm vụ**; 24 nhiệm vụ và xưởng tự do bên dưới vẫn là kế hoạch mở rộng. Chi tiết thực tế: [gears-workshop-mvp.md](./gears-workshop-mvp.md). Phạm vi: cả Lắp Bánh Răng và Đoán Chiều Quay. Kế hoạch dựa trên đọc mã nguồn; các mục tiêu trải nghiệm, thời lượng và hiệu năng dưới đây cần kiểm chứng khi làm bản chơi thử.

## 1. Hướng sản phẩm

Trẻ nhận một cỗ máy đang hỏng, đọc yêu cầu, lắp hoặc sửa bộ truyền động, dự đoán kết quả rồi chạy thử. Thành công tạo ra thay đổi nhìn thấy được: bơm đưa nước tới vườn, băng chuyền chở đồ chơi, cầu nâng cho thuyền qua, tháp đồng hồ hoạt động trở lại.

Tên hiển thị: **Kỹ Sư Máy Móc — Xưởng Sáng Chế**. Một xưởng chung gồm ba cách chơi:

- **Hành trình sửa máy:** 24 nhiệm vụ có chủ đích, chia 4 chương × 6 nhiệm vụ. Mỗi nhiệm vụ khoảng 2–5 phút là mục tiêu thiết kế, không phải thời hạn bắt buộc.
- **Thử tài kỹ sư:** đề có seed theo kỹ năng đã học, xen kẽ lắp máy, dự đoán chuyển động và tìm lỗi. Người chơi chọn mức; không tự đẩy lên mức Khó sau một lần thắng.
- **Xưởng tự do:** tự dựng máy, chạy thử, lưu bản thiết kế. Dùng cùng luật truyền động; không cộng sao chiến dịch vô hạn.

Giữ hai đường vào `gears-build` và `gears-guess`, dẫn đến hoạt động tương ứng trong xưởng mới để liên kết cũ vẫn có ý nghĩa.

## 2. Những điểm hiện tại cần xử lý

| Bằng chứng trong mã hiện tại | Hướng xử lý |
| --- | --- |
| Có engine thuần cho đồ thị, mô phỏng, chiều/tốc độ, đai thẳng/chéo và kẹt máy, cùng kiểm thử | Giữ và mở rộng lõi, dùng chung cho gameplay, gợi ý và kiểm chứng đề |
| Build chủ yếu nối một motor với một target; generator hiện để `targetMinSpeed` trống và `fixedGearIds` rỗng | Nhiệm vụ có công dụng, nhiều dạng mục tiêu và tiến trình học |
| Đặt linh kiện không hợp lệ hoặc nối đai quá xa có thể chỉ bị từ chối trong handler | Luôn báo nguyên nhân tại đúng vị trí, không mất linh kiện |
| Lắp thử đang mô phỏng cả vị trí kéo tạm; thắng suy từ bố cục hiển thị | Tách bản xem trước, bản thiết kế đã chốt và lần chạy thử; không trao thưởng từ hình kéo tạm |
| “Làm mới” sinh seed khác; “Tiếp theo” ở Build tự tăng difficulty | Tách Hoàn tác, Làm lại bài này, Đề khác, Chặng tiếp theo; giữ mức người chơi chọn |
| Đoán chiều dùng nút bấm vòng ↻ / ↺ / chưa chọn; chưa cho chọn trạng thái đứng yên | Lựa chọn tường minh; chỉ giới thiệu đứng yên/kẹt sau bài hướng dẫn tương ứng |
| Engine thắng trả boolean; giới hạn linh kiện/đai phần lớn nằm ở UI | Bộ kiểm tra luật trả checklist và nguyên nhân; engine kiểm tra cả tính hợp lệ, ngân sách và mục tiêu |
| Generator dùng lời giải tham khảo theo heuristic, có fallback ngân sách/chiều nếu không dựng được | Sinh từ lời giải hợp lệ đã kiểm chứng; không coi lời giải tham khảo là tối ưu toàn cục; fallback sang màn đã xác minh |

Nguồn: [GearsGamePage.tsx](D:/Quyetnm/Dev/mathgenius-kids/games/GearsGame/GearsGamePage.tsx), [GuessDirectionGame.tsx](D:/Quyetnm/Dev/mathgenius-kids/games/GearsGame/GuessDirectionGame.tsx), [levelgen.ts](D:/Quyetnm/Dev/mathgenius-kids/games/GearsGame/engine/levelgen.ts), [simulate.ts](D:/Quyetnm/Dev/mathgenius-kids/games/GearsGame/engine/simulate.ts), [goals.ts](D:/Quyetnm/Dev/mathgenius-kids/games/GearsGame/engine/goals.ts).

## 3. Luật trẻ nhìn thấy và luật engine chấm phải trùng nhau

Mỗi nhiệm vụ mở bằng một phiếu yêu cầu ngắn, có hình và nút đọc tiếng Việt. Ví dụ: **“Sửa máy bơm: đầu ra quay ↻; dùng tối đa 2 bánh răng; không dùng dây đai.”**

| Luật | Cách thể hiện |
| --- | --- |
| Hai bánh răng ăn khớp quay ngược chiều nhau | Mũi tên lớn, một bài tương tác hai bánh răng |
| Đai thẳng giữ chiều; đai chéo đảo chiều | Hình dây rõ ràng và hai mũi tên trước khi xác nhận nối |
| Cỡ bánh răng ảnh hưởng tốc độ tương đối; cùng trục quay cùng tốc độ nếu loại linh kiện đó được hỗ trợ | Xem chậm, dấu mốc trên bánh, nhãn ×1 / ×2; số răng xuất hiện ở bài nâng cao |
| Chỉ linh kiện có đường truyền từ nguồn mới quay | Đường truyền được tô sáng; phần chưa nối có biểu tượng mất kết nối |
| Một cụm bị ép quay theo hai chiều mâu thuẫn sẽ kẹt | Dừng cụm và chỉ đường tạo mâu thuẫn, không chỉ tô đỏ cả bàn |
| Linh kiện cố định không được di chuyển; không đặt lên vùng cấm hoặc chồng nhau | Biểu tượng ghim, vùng cấm có họa tiết; vị trí thả hợp lệ được đánh dấu |
| Ngân sách chung tính cả bánh răng và đai; mỗi loại có số lượng riêng | Khay hiển thị còn bao nhiêu; tháo linh kiện hoàn trả kho |
| Đai chỉ nối hai cổng hợp lệ, không nối trùng hoặc vượt tầm | Xem trước đường dây; thông báo “Hai trục quá xa”, “Đã có dây nối” |
| Hoàn thành khi tất cả mục tiêu bắt buộc đúng trong một lần chạy thử | Checklist: Có truyền động / Đúng chiều / Đúng tốc độ nếu yêu cầu / Đủ đầu ra / Trong ngân sách / Không kẹt |

Trong chiến dịch, lắp lên các trục đánh dấu sẵn, với vị trí và cỡ linh kiện được thiết kế để có bài toán suy luận. Trẻ chọn linh kiện rồi chạm trục, hoặc kéo thả vào trục. Bản tự do mới cho đặt linh hoạt với hỗ trợ bắt dính chính xác. Cả hai dùng cùng chuẩn kết nối, tránh biến độ khó thành việc căn từng pixel.

Đai có cổng puli thể hiện rõ trên trục. Đai được bắc qua khe nước; không được xuyên tường máy. Các đường dây giao nhau không tự tạo kết nối. Không mở nhiều tầng truyền động khi hình ảnh chưa thể hiện rõ tầng nào thuộc trục nào.

## 4. Vòng chơi và cách hỗ trợ

**Nhận việc → xem mục tiêu → lắp/sửa → chạy thử → thấy nguyên nhân → điều chỉnh → máy hoạt động → nhiệm vụ tiếp theo.**

- Ba bài đầu dạy bằng thao tác thực tế: đặt một bánh răng, đổi chiều bằng bánh trung gian, nối đai. Mỗi lần chỉ giới thiệu một quy tắc.
- Khi lắp: hiện bóng linh kiện và liên kết dự kiến; nút Hoàn tác, Làm lại và Tháo luôn rõ. Thả sai giữ nguyên bản thiết kế cũ.
- Khi chạy thử: khóa chỉnh sửa; cho dừng, xem chậm và xem từng bước truyền động. Khi dừng, trở lại chỉnh sửa trên cùng thiết kế.
- Phản hồi cụ thể: “Bơm chưa nối với nguồn”, “Đích đang quay ↺, cần ↻”, “Nhánh bên trái làm cụm bị kẹt”. Chọn thông báo sẽ chỉ đúng vị trí.
- Gợi ý theo ba tầng: nhắc quy tắc → chỉ vùng cần xem → minh họa một bước. Không cấm thử nhiều lần và không trừ thành tích vì chạy thử.
- Lắp đúng: cỗ máy làm công việc thật trong hoạt cảnh ngắn, có thể bấm tiếp; lưu kết quả trước hoạt cảnh. Không bắt chờ xem hết.
- Đoán chuyển động: chọn bánh cần đoán rồi chọn ↻, ↺ hoặc “Đứng yên” khi dạng bài đã mở. Sau chốt, chạy luồng giải thích từ nguồn để trẻ thấy vì sao đúng/sai. Màn chẩn đoán phân biệt “chưa nối” và “kẹt”, dù cả hai đều đứng yên.

Ví dụ màn đầu: nguồn và trục máy bơm cần quay cùng chiều, nhưng đang thiếu bộ truyền. Trẻ đặt một bánh trung gian vào trục giữa: hai lần đảo chiều làm bơm quay đúng. Khi chạy, nước lên bồn và tưới cây. Màn kế tiếp thay vị trí/chiều đích để buộc dùng quy tắc, không chỉ nhớ vị trí vừa đặt.

## 5. Độ khó và chương trình nhiệm vụ

Lớp học chỉ gợi ý điểm bắt đầu; vẫn cho chọn mức. Mỗi nhiệm vụ khai báo kỹ năng tiên quyết. Lớp 1–2 ưu tiên hình và chiều quay; lớp 3 thêm nhánh, ngân sách; lớp 4–5 có tốc độ tương đối, tỉ số và tối ưu thiết kế. Không dùng đồng hồ đếm ngược để làm khó bài lắp máy.

| Mức | Cấu trúc thử thách đề xuất |
| --- | --- |
| Dễ | Một nguồn, một đầu ra, 2–4 quyết định lắp; nhiều vị trí hỗ trợ, ít linh kiện gây nhiễu; ngân sách dư |
| Trung bình | 4–7 quyết định, đai thẳng/chéo, vùng cấm, tối đa hai đầu ra; phải chọn đường và chiều |
| Khó | 6–10 quyết định, nhiều nhánh, mục tiêu phối hợp, chẩn đoán lỗi; ngân sách sát một lời giải đã xác minh và linh kiện gây nhiễu có chủ đích |

Số trên là số quyết định cần làm, không phải chỉ tăng lượng bánh răng trang trí. Khó chỉ dùng kiến thức đã mở khóa, không tự đưa tỉ số số học vào bài của trẻ chưa học.

24 nhiệm vụ trong bốn chương:

1. **Xưởng đồ chơi:** ăn khớp, truyền động, đảo chiều; làm tàu đồ chơi và vòng quay hoạt động.
2. **Vườn gió:** đai thẳng/chéo, vượt khe nước; sửa bơm và quạt tưới cây.
3. **Bến cảng:** chia nhánh, hai đầu ra và tốc độ; vận hành băng chuyền, cầu nâng.
4. **Tháp đồng hồ:** tìm mâu thuẫn, sửa máy lắp sai, phối hợp nhiều yêu cầu; hoàn thiện công trình lớn.

Mỗi chương xen kẽ lắp mới, dự đoán và sửa lỗi. Cuối chương là một cỗ máy tổng hợp các quy tắc đã học. Bản sinh luyện tập thay đồ thị, linh kiện bị thiếu, chiều đích và vị trí lỗi; không chỉ đổi màu/nền. Mọi đề có lời giải hợp lệ, seed tái hiện được và kỹ năng được kiểm tra trước khi giao.

**Ràng buộc quan trọng của bài tốc độ:** với một chuỗi bánh đơn, giữ nguyên nguồn/đích thì đổi bánh trung gian không đổi tỉ số tốc độ cuối. Muốn trẻ thật sự điều chỉnh tốc độ, bài phải cho thay bánh đầu ra tại trục nhận hoặc bổ sung bộ bánh kép chung trục. Bản đầu chọn cách thay bánh đầu ra; bánh kép là mở rộng sau, cần loại kết nối đồng trục riêng. Không giao mục tiêu không thể thay đổi bằng linh kiện đang có.

## 6. Đồ họa và âm thanh

- Hướng mỹ thuật: xưởng đồ chơi ấm áp, mô hình có chiều sâu; gỗ sáng, đồng vàng, xanh ngọc, kem, điểm nhấn cam. Một robot phụ tá nhỏ làm người giao việc.
- Bàn lắp nhìn gần vuông góc để đọc chính xác răng, trục và dây. Nền xưởng và cỗ máy nhận chuyển động có thể dựng 3D; tránh góc xiên làm khó chọn linh kiện.
- Linh kiện có bề dày, mép vát, trục kim loại, bóng tiếp xúc nhẹ. Cỡ răng và vùng ăn khớp được dựng từ dữ liệu, không lấy ảnh làm nguồn hình học.
- Có màu vai trò kèm biểu tượng và nhãn: nguồn, đích, cố định, chưa nối, lỗi. Không dùng riêng màu để giải thích trạng thái.
- Khi thử máy, ánh sáng/chấm chuyển động chạy theo đường truyền; vật đích vận hành đồng bộ: nước chảy, băng chuyền chạy, cầu mở.
- Âm lắp “tách”, motor “rừ”, dây chuyển động, chuông hoàn thành nhẹ. Có tắt âm, giảm chuyển động, xem chậm; tránh rung/chớp khi lỗi.
- Một đồng hồ render cho cả hệ; dừng/resume giữ pha, không đổi góc bánh đột ngột. 2D và 3D lấy chung kết quả mô phỏng.
- Ảnh AI nếu dùng: concept xưởng, chân dung robot, huy hiệu, nền trang trí tách lớp. Bánh răng, đai, trục và bộ phận phải tương tác dựng bằng code để đúng cơ chế. Không phụ thuộc việc tạo ảnh để kiểm chứng gameplay.
- Trên điện thoại: khay dưới, vùng thao tác tối thiểu khoảng 44 px, chạm-chọn/chạm-đặt; bảng mục tiêu thu gọn được, không che trục. Có phóng to bàn và đưa về giữa. Không yêu cầu hover hoặc kéo thật chính xác.

## 7. Tiến độ và phần thưởng

Mỗi máy sửa xong được đặt trong xưởng, tạo bộ sưu tập hoạt động được. Mở khu vực mới, trang trí bàn và ngoại hình robot; không bán linh kiện mạnh hơn để vượt luật.

Mỗi bài có mục tiêu bắt buộc và thử thách thưởng ghi riêng trước khi chơi. Sao hoàn thành, sao tiết kiệm theo ngưỡng đã xác minh và sao nhiệm vụ phụ (nếu có) được mô tả cụ thể; không giấu điều kiện “đúng ngay lần đầu”. Chỉ cộng phần sao cải thiện, không thưởng lặp khi tải lại/chơi lại. Lưu thiết kế đang dở, số lần thử và tiến trình theo học sinh. Phải đọc phần tích hợp hồ sơ/achievement hiện tại trước khi chọn schema triển khai, giữ mọi lịch sử cũ.

## 8. Cách triển khai và nghiệm thu

1. **Chốt cơ chế bằng 6 nhiệm vụ mẫu:** hướng dẫn, đổi chiều, đai, lỗi kẹt, hai đầu ra và bài đổi tốc độ bằng bánh đầu ra. Viết validator dùng chung; lưu lời giải mẫu và ngân sách đã kiểm chứng. Đây là mốc quyết định trò chơi có rõ và thú vị hay không.
2. **Hoàn thiện thao tác và hình ảnh của sáu bài:** snap vào trục, undo/redo, chạy thử/dừng/xem chậm, chỉ lỗi, bàn xưởng đẹp, một cỗ máy có hoạt cảnh hoàn thành; chơi thử chuột và cảm ứng.
3. **Mở thành chiến dịch 24 bài:** đủ bốn chương, phần đoán/sửa lỗi, sinh luyện tập, xưởng tự do, tiến độ và thưởng.
4. **Tích hợp menu và kiểm chứng:** giữ đường vào cũ; kiểm tra đổi học sinh, đổi độ khó, thoát khi đang kéo/chạy, tải lại giữa bài và lỗi ghi dữ liệu.

Điều kiện chấp nhận:

- Trẻ thấy ngay mục tiêu, linh kiện được dùng và lý do chưa hoàn thành; làm được bài hướng dẫn mà không cần đọc một trang luật.
- Mỗi đề đều có lời giải thỏa toàn bộ điều kiện trong kho/ngân sách; không đưa đề dự phòng chưa chứng minh vào game.
- Nút Làm lại giữ đúng đề; Đề khác mới đổi seed; chọn khó thật sự đổi cấu trúc luật và không tự đổi sau khi thắng.
- Thao tác không hợp lệ không tiêu linh kiện; bỏ kéo không tạo trạng thái thắng; undo/redo khôi phục cả dây, kho và mục tiêu.
- Kiểm tra chiều, tỉ số, nhánh, đai, kẹt, ngắt nguồn; giải thích lỗi và hoạt cảnh phải khớp engine.
- Mục tiêu hiệu năng: 60 fps ở chế độ thường, tối thiểu 30 fps ở chế độ nhẹ trên thiết bị mục tiêu được thử; chưa coi là kết quả đo.
- Không phải chờ hoạt cảnh để được lưu hoặc tiếp tục; không mất thiết kế khi đổi kích thước màn hình hoặc tạm dừng.
- Nghiệm thu với người chơi nhỏ tuổi mới kết luận độ rõ và độ cuốn hút; kiểm thử kỹ thuật không thay thế bước này.

Không triển khai cả 24 bài trước khi sáu bài mẫu chứng minh được vòng chơi. Ưu tiên bản thử hoàn chỉnh có luật nhất quán, thao tác dễ và cỗ máy hoạt động thuyết phục.
