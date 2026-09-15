# Phố Nhỏ Tỉ Phú — bản triển khai hiện hành

Ngày 15/09/2026. Thay thế bộ luật trong bản nghiên cứu ban đầu.

## Luật đã chốt với Đại ca

- 2–4 người trên cùng màn hình; ghế người hoặc máy dễ/vừa/khó. Mỗi người 1.500 xu, qua Bắt đầu nhận 200 xu.
- Hai xúc xắc; số kép được gieo thêm; ba lần kép liên tiếp trong cùng lượt vào tù. Ra tù bằng 50 xu hoặc thử số kép, tối đa ba lần thử.
- Mua hoặc bỏ qua đất chưa có chủ; tự trả thuê khi đến đất người khác. Không đấu giá, trao đổi tự do, thế chấp hoặc phiếu giữ lại.
- Có đất là được mở rộng từ cấp 0 lên cấp 1. Cấp 2 cần đủ ba công trình cùng nhóm. Chỉ một lần nâng cấp, tăng một cấp, trong mỗi lượt; số kép và thẻ gieo thêm không làm mới giới hạn. Xây tùy chọn trước khi gieo.
- Màu nền đất và ô đường là màu chủ sở hữu. Dải màu mảnh là nhóm công trình. Panel hiển thị ba tên công trình và số lượng đang sở hữu.
- Không đủ tiền mặt trả nợ thì phá sản. Tiền còn lại và tài sản chuyển cho chủ nợ; nếu nợ ngân hàng, tài sản trở lại chưa có chủ và bỏ cấp xây. Người cuối cùng còn lại thắng.
- Không có giới hạn vòng hoặc bộ luật so tổng tài sản sau 8/12 vòng như bản thử cũ.

## Bàn và đồ họa

- 32 ô đường riêng bao quanh các lô công trình; 18 loại kiến trúc, ba trạng thái mỗi loại. Những chức năng đặc trưng có mô hình thực: bể bơi, sân bóng, nhà kính, nông trại, vòng quay, sân khấu, rạp phim, phòng khám...
- Nâng cấp mở rộng footprint, đổi mái, thêm phòng kính/cánh nhà/giàn che/khán đài/cầu trượt/tàu lượn. Mô hình thay đổi ở đúng sự kiện xây, kèm hiệu ứng mở rộng nhẹ và vòng sáng.
- Cổng xuất phát xoay 45 độ, hướng ra ngoài. Bốn nhân vật có vị trí riêng rải theo hình cung trong ô góc; vị trí dùng chung cho đứng và nội suy di chuyển để tránh nhảy vị trí.
- Hai góc sự kiện: Rương kỳ diệu (Chuyện khu phố) và Hộp bất ngờ (Cơ hội). Giữ riêng góc Bắt đầu và Nhà tù.
- 20 tranh Flow riêng, WebP 400×280, tổng 142.408 byte; thẻ lật công khai, màu viền phân biệt quà/thử thách/bất ngờ. Không chứa thông tin phải giấu người ngồi cùng.
- Có camera intro 10,8 giây, cận cảnh khi chọn công trình, tạm dừng, giảm chuyển động, đồ họa nhẹ và 2D khi WebGL lỗi.

## Hai bộ thẻ, tổng 20 sự kiện

| Chuyện khu phố | Hiệu ứng |
|---|---|
| Hội chợ cuối tuần | +100 xu |
| Đơn hàng hàng xóm | +150 xu |
| Khu vườn xanh | −100 xu |
| Biển hiệu mới | −100 xu |
| Cả phố cùng vui | Mỗi người chưa phá sản +50 xu |
| Ngân hàng hoàn phí | +50 xu |
| Phí ngân hàng | −200 xu |
| Tài trợ khu phố | +150 xu |
| Xe giao hàng hỏng | −100 xu |
| Sinh nhật vui vẻ | +100 xu |

| Cơ hội | Hiệu ứng |
|---|---|
| Về quảng trường | Về Bắt đầu, +200 xu |
| Khám phá cửa tiệm | Tiến đến cửa tiệm chưa có chủ gần nhất; nếu không còn, +50 xu |
| Quên chiếc mũ | Lùi ba ô |
| Món quà bất ngờ | +100 xu |
| Chiếc xe cần sửa | −150 xu |
| Vào tù | Đến Nhà tù, không nhận GO |
| Xúc xắc may mắn | Thêm một lần gieo, cộng dồn với số kép; không thêm lượt xây |
| Chuyến xe tốc hành | Tiến ba ô |
| Đến kỳ đóng thuế | −250 xu |
| Chậu hoa bị vỡ | −50 xu |

Thẻ di chuyển xử lý ô đến nhưng không rút chuỗi thẻ sự kiện. Hai bộ được xáo lại khi hết, mỗi bộ gồm mười sự kiện riêng. Máy không đọc thứ tự bộ bài hoặc RNG của ván.

## Kiểm tra và giới hạn

- TypeScript kiểm tra không lỗi. Bộ kiểm thử toàn dự án: 50 file / 683 bài qua; sau đó bổ sung kiểm tra đủ 20 sự kiện, phần Cờ Tỉ Phú có 20 bài qua.
- Kiểm tra giao diện desktop 1440×950 và viewport điện thoại 390×844, ảnh thẻ nạp được và nút nhận nằm trong màn hình.
- Toàn cảnh bốn màu ở máy thử: khoảng 58 FPS, 119 draw calls, 178.582 triangles. Đây là số đo một cảnh trên máy hiện tại, không phải chứng nhận hiệu năng điện thoại.
- Mô phỏng luật mới tại co-ti-phu-benchmark-v2.json: 100 ván mỗi cấu hình 2/3/4 người, thông tin công khai, máy cùng độ khó. Không có trạng thái tiền hoặc bộ bài sai. Có 4/100 ván bốn người chưa kết thúc khi đạt giới hạn mô phỏng 6.000 hành động; luật chơi thực tế không ép kết thúc. Độ dài ván và cân bằng kinh tế vẫn cần quan sát thêm với người chơi thật. Không dùng kết quả 60.000 ván của luật V1 để khẳng định cân bằng V2.
- Bản lưu dùng property-town-v2 theo hồ sơ; dữ liệu sai hoặc từ bộ luật cũ bị từ chối, không tự diễn giải theo luật mới. Lưu kết quả có idempotency và không cộng sao.

## Điểm vào

- Game Hub: Cờ Tỉ Phú / Phố Nhỏ Tỉ Phú.
- Preview: http://127.0.0.1:3001/Genius-kids/co-ti-phu-preview.html
- DEV có tình huống bốn nhân vật xuất phát, bốn màu đất, ba cấp kiến trúc, thử xây, nhà tù, máy đi trước và chọn từng thẻ.
- Nguồn mỹ thuật: co-ti-phu-assets.md.
Kiểm tra cuối: production build thành công, gói JS đã chứa camera dọc 2.4 và sương 120–210; máy đi trước tự xử lý đến revision 5 rồi chuyển lượt cho người. Về sảnh/tiếp tục giữ nguyên revision, tiền và tài sản. Thử mất WebGL chuyển sang 2D giữ nguyên ván, có thể bật lại 3D trong cài đặt. Panel mobile giữ nút gieo/toàn cảnh dễ bấm; danh sách nhóm màu mở khi chạm.
