# Gia đình tự sinh hoạt — 18/09/2026

Đại ca yêu cầu nhân vật tự di chuyển trong trại và ngẫu nhiên tương tác với công trình/vật thể. Đã làm local; chưa deploy. Tạo hình bo mềm, trang phục riêng và rig khớp ở đợt trước được giữ nguyên.

- Bốn người chọn đích riêng: đi dạo, ghé công trình và làm động tác gõ/thăm, cúi chăm cây/luống/bụi quả, ngắm vật trang trí, nghỉ cạnh ghế, vẫy chào người nhà khi đứng gần. Dừng 4–10 giây tại đích rồi chọn lượt mới; trẻ đi hơi nhanh hơn người lớn.
- Sinh hoạt chỉ là hình ảnh: không gửi lệnh game, không tự thu hoạch, tiêu năng lượng, nhận vật liệu hay đổi save.
- Lệnh khai phá của người chơi ưu tiên cao hơn: nhân vật liên quan xuất hiện cạnh mục tiêu như yêu cầu trước, làm việc; xong nghỉ ngắn rồi đi dạo từ khu vực đó. Không quay về hàng cố định trước nhà.
- Tìm đường trên ô đất mở và mặt cầu đã xây; chặn ruộng, footprint nhà/trang trí, cây đá chưa dọn, nước, đất chưa mở và bước cao độ quá 0,26. Lối đá đi được. Các đích đã được người khác chọn được tránh; nhân vật vẫn có thể đi ngang nhau trên đường.
- Khi bố trí thay đổi, cập nhật bản đồ đi và hủy đường cũ. Nếu ô đang đứng bị chiếm thì chuyển tới ô hợp lệ gần nhất. Không có ô hợp lệ thì ẩn nhân vật thay vì xuất hiện trong nhà/nước.
- Giảm chuyển động tắt đi dạo và cử chỉ tự động. Tab ẩn dừng cập nhật, trở lại không nhảy bù cả quãng đường theo thời gian vắng mặt. Đường đi/vị trí sinh hoạt là trạng thái tạm, không lưu vào kinh tế hoặc cloud save.

## Chi phí và kiểm chứng

Giữ 2 instanced draw cho bốn người, khoảng 14.496 tam giác. Cập nhật rig theo nhịp 30 Hz, màu instance chỉ ghi lúc khởi tạo; không có React setState trong vòng chuyển động. Lưới đi chỉ dựng lại khi bố trí/world thay đổi, không theo tick một giây. Mỗi lựa chọn đích dùng flood-fill giới hạn khoảng 600 ô; không tìm đường từng frame.

Mã chính: render/familyLife.ts (lưới, chọn đích, đường đi, thời gian chuyển động), render/Family.tsx (ưu tiên công việc, rig, cử chỉ). tests/family-life.check.ts có 6 kiểm tra: chặn vật thể/đất/nước, đường vòng và không đổi farm state, cầu, vách cao/đích đã giữ, chuyển động liên tục/nghỉ/đóng tab, thay bố trí/hết đất.

Typecheck module, 26/26 bài family-life + khai phá và build module đạt. Chrome QA riêng tại `?lab=qa&session=family-roaming` quan sát gia đình tách khỏi nhóm ban đầu; tài nguyên/xu/năng lượng không đổi khi chỉ sinh hoạt. Không sửa vườn production. FPS trong phiên điều khiển Chrome vẫn bị giãn frame; chưa nghiệm thu độ mượt Android thật.
