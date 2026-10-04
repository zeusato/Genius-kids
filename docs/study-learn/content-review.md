# Mẫu rà soát nội dung — 03/10/2026

Mẫu 20 bài phân tầng theo lớp, chọn bằng seed 20261003. Đây là lượt tự rà soát sau biên soạn và kiểm tra độc lập bằng bộ kiểm chuẩn, chưa thay cho duyệt nội dung của chủ dự án.

## mn.shapes3d · Khối cầu, trụ, vuông, chữ nhật

- **goal**: nhận biết khối cầu, khối vuông, khối trụ, khối chữ nhật.

## mn.position · Trên – dưới, trước – sau, trái – phải

- **goal**: nói được vị trí của đồ vật và các bạn.

## mn.ordinal · Số thứ tự

- **goal**: đếm được vị trí: thứ nhất, thứ hai, thứ ba.

## g1.shapes3d · Khối lập phương, khối hộp chữ nhật

- **goal**: nhận biết khối lập phương và khối hộp chữ nhật.
- **nhan.problem**: Gọi tên khối trong hình.
- **nhan.answer**: Khối hộp chữ nhật.

## g1.numbers20 · Các số 11–20: chục và đơn vị, so sánh

- **goal**: đọc số đến 20 bằng chục và đơn vị.
- **doc.problem**: 1 chục và 7 đơn vị là số nào?
- **doc.answer**: 17: mười bảy.
- **ss.problem**: So sánh 13 và 18.
- **ss.answer**: 13 < 18.
- **mistake-0.right**: Số đúng là 17.

## g1.sub10 · Phép trừ trong phạm vi 10

- **goal**: trừ các số trong phạm vi 10.
- **tinh.problem**: Tính 8 − 3.
- **tinh.answer**: 8 − 3 = 5.
- **bot.problem**: Có 6 quả táo, ăn 2 quả. Còn mấy quả?
- **bot.answer**: Trả lời: 4 quả táo.

## g2.money · Tiền Việt Nam (100, 200, 500, 1000 đồng)

- **goal**: đếm tiền mệnh giá 100, 200, 500, 1000 đồng.
- **dem.problem**: Một tờ 500 đồng và hai tờ 200 đồng được bao nhiêu?
- **dem.answer**: Đáp số: 900 đồng.
- **tralai.problem**: Mua đồ giá 700 đồng, đưa 1000 đồng. Nhận lại bao nhiêu?
- **tralai.answer**: Đáp số: 300 đồng.

## g2.polyline · Đường gấp khúc, độ dài đường gấp khúc

- **goal**: nhận biết và tính độ dài đường gấp khúc.
- **dem.problem**: Đường gấp khúc ABCD có mấy đoạn?
- **dem.answer**: 3 đoạn.
- **dai.problem**: Các đoạn dài 6 cm, 8 cm, 5 cm. Tính độ dài đường gấp khúc.
- **dai.answer**: Đáp số: 19 cm.
- **mistake-0.right**: Phải cộng các đoạn của đường gấp khúc.

## g2.word_more_less · Bài toán về nhiều hơn, ít hơn

- **goal**: giải bài toán nhiều hơn, ít hơn.
- **hon.problem**: An có 28 nhãn vở. Bình nhiều hơn An 7 nhãn. Bình có bao nhiêu?
- **hon.answer**: Đáp số: 35 nhãn vở.
- **it.problem**: Mai có 42 viên bi. Lan ít hơn Mai 8 viên. Lan có bao nhiêu?
- **it.answer**: Đáp số: 34 viên bi.
- **mistake-0.right**: Phải xác định đang tìm số nhiều hay số ít.

## g3.area_cm2 · Diện tích: xăng-ti-mét vuông, hình chữ nhật, hình vuông

- **goal**: hiểu diện tích, đơn vị xăng-ti-mét vuông và tính được diện tích hình chữ nhật, hình vuông.
- **hook.answer**: Cần 8 × 5 = 40 (ô vuông), tức là diện tích tấm thiệp là 40 cm².
- **dem-o.problem**: Mỗi ô vuông có diện tích 1 cm². Hình tô màu có diện tích bao nhiêu xăng-ti-mét vuông?
- **dem-o.answer**: Diện tích hình tô màu là 6 cm².
- **cong-thuc.problem**: Tính diện tích hình chữ nhật có chiều dài 15 cm, chiều rộng 8 cm.
- **cong-thuc.answer**: Đáp số: 120 cm².
- **hai-buoc.problem**: Một hình chữ nhật có chiều rộng 5 cm, chiều dài gấp 3 lần chiều rộng. Tính diện tích hình chữ nhật đó.
- **hai-buoc.answer**: Đáp số: 75 cm².
- **mistake-0.right**: Diện tích: 15 × 8 = 120 (cm²).
- **mistake-1.right**: Diện tích là 120 cm².

## g3.div_1digit · Chia cho số có một chữ số, phép chia có dư

- **goal**: đặt tính và chia được số có hai, ba chữ số cho số có một chữ số, kể cả phép chia có dư.
- **hook.answer**: Mỗi bạn được: 96 : 4 = 24 (cái kẹo).
- **hai-chu-so.problem**: Đặt tính rồi tính: 92 : 2
- **hai-chu-so.answer**: Vậy 92 : 2 = 46.
- **hai-chu-so.check**: Thử lại: 46 × 2 = 92.
- **ba-chu-so.problem**: Đặt tính rồi tính: 948 : 4
- **ba-chu-so.answer**: Vậy 948 : 4 = 237.
- **ba-chu-so.check**: Thử lại: 237 × 4 = 948.
- **co-du.problem**: Đặt tính rồi tính: 186 : 4
- **co-du.answer**: Vậy 186 : 4 = 46 (dư 2).
- **co-du.check**: Thử lại: 46 × 4 + 2 = 186.
- **mistake-0.right**: 186 : 4 = 46 (dư 2).
- **mistake-1.right**: 812 : 4 = 203.

## g3.small_units · Mi-li-mét, gam, mi-li-lít

- **goal**: đổi được các đơn vị mi-li-mét, gam, mi-li-lít và giải bài toán có đơn vị đo.
- **hook.answer**: Hai chai: 500 × 2 = 1000 (ml). Vì 1 l = 1000 ml nên đúng bằng 1 lít.
- **doi.problem**: 9 m = ? mm
- **doi.answer**: Vậy 9 m = 9000 mm.
- **hai-ten.problem**: 3 l 158 ml = ? ml
- **hai-ten.answer**: Vậy 3 l 158 ml = 3158 ml.
- **loi-van.problem**: Bình có 1 l nước. Nam rót ra 400 ml. Hỏi bình còn lại bao nhiêu mi-li-lít nước?
- **loi-van.answer**: Đáp số: 600 ml.
- **mistake-0.right**: 3 m = 3000 mm.
- **mistake-1.right**: Đổi 1 l = 1000 ml rồi tính: 1000 − 400 = 600 (ml).

## g4.div10 · Chia cho 10, 100, 1000

- **goal**: chia số tròn chục, tròn trăm, tròn nghìn thuận tiện.
- **muoi.problem**: Tính 45 000 : 100.
- **muoi.answer**: 450.
- **tron.problem**: Tính 12 600 : 60.
- **tron.answer**: 210.
- **mistake-0.right**: Cùng bỏ hai chữ số 0: 7200 : 300 = 72 : 3 = 24.

## g4.expr · Biểu thức có dấu ngoặc

- **goal**: tính và so sánh biểu thức có dấu ngoặc.
- **tinh.problem**: Tính 80 − (12 + 8) × 3.
- **tinh.answer**: 20.
- **ss.problem**: So sánh (18 + 12) : 3 và 18 + 12 : 3.
- **ss.answer**: Vế trái bé hơn vế phải.
- **mistake-0.right**: Kết quả là 20.

## g4.frac_mul · Phép nhân phân số

- **goal**: nhân phân số và rút gọn kết quả.
- **hai.problem**: Tính 3/5 × 2/9.
- **hai.answer**: 2/15.
- **so.problem**: Tính 3 × 2/5.
- **so.answer**: 6/5.
- **mistake-0.right**: 2/3 × 3/4 = 6/12 = 1/2.

## g4.angle_types · Góc nhọn, góc vuông, góc tù, góc bẹt

- **goal**: phân biệt góc nhọn, vuông, tù, bẹt.
- **loai.problem**: Góc 60° là góc gì?
- **loai.answer**: Góc nhọn.
- **mistake-0.right**: Góc 180° là góc bẹt.

## g5.frac_compare · So sánh phân số

- **goal**: so sánh được hai phân số và so sánh phân số với 1.
- **hook.answer**: Quy đồng: 2/3 = 8/12, 3/4 = 9/12. Vì 8 < 9 nên 2/3 < 3/4: Bình ăn nhiều hơn.
- **khac-mau.problem**: Điền dấu >, <, =: 4/7 … 1/9
- **khac-mau.answer**: Vậy 4/7 > 1/9.
- **voi-1.problem**: Điền dấu >, <, =: 5/6 … 1
- **voi-1.answer**: Vậy 5/6 < 1.
- **mistake-0.right**: 4/7 > 1/9.

## g5.interest · Lãi suất, tăng rồi giảm phần trăm

- **goal**: tính được tiền lãi tiết kiệm và giá sau khi tăng rồi giảm phần trăm.
- **hook.answer**: Không. Tăng 10% được 110 000 đồng. Giảm 10% của 110 000 đồng là giảm 11 000 đồng, còn 99 000 đồng.
- **lai.problem**: Bác An gửi tiết kiệm 7 000 000 đồng với lãi suất 8% một năm. Sau 1 năm, bác nhận được cả tiền gửi và tiền lãi là bao nhiêu?
- **lai.answer**: Đáp số: 7 560 000 đồng.
- **tang-giam.problem**: Một món hàng giá 210 000 đồng, được tăng giá 10%, sau đó lại giảm 10% so với giá mới. Giá cuối cùng là bao nhiêu?
- **tang-giam.answer**: Đáp số: 207 900 đồng.
- **mistake-0.right**: Giá cuối cùng là 207 900 đồng.

## g5.decimal_compare · So sánh, sắp xếp số thập phân

- **goal**: so sánh và sắp xếp được các số thập phân.
- **hook.answer**: Cùng phần nguyên 2. Ở hàng phần mười, 7 > 6 nên 2,7 > 2,65: Lan nhảy xa hơn.
- **dien-dau.problem**: Điền dấu >, <, =: 10,5 … 4,8
- **dien-dau.answer**: Vậy 10,5 > 4,8.
- **sap-xep.problem**: Sắp xếp các số 7,19; 7,3; 7,1; 7,16 theo thứ tự từ lớn đến bé.
- **sap-xep.answer**: Thứ tự từ lớn đến bé: 7,3; 7,19; 7,16; 7,1.
- **mistake-0.right**: 7,3 > 7,19.

## g5.time_muldiv · Nhân, chia số đo thời gian

- **goal**: nhân, chia được số đo thời gian với một số.
- **hook.answer**: 35 phút × 4 = 140 phút, tức là 2 giờ 20 phút.
- **nhan.problem**: Tính: 2 giờ 25 phút × 3
- **nhan.answer**: Vậy 2 giờ 25 phút × 3 = 7 giờ 15 phút.
- **chia.problem**: Tính: 17 giờ 55 phút : 5
- **chia.answer**: Vậy 17 giờ 55 phút : 5 = 3 giờ 35 phút.
- **mistake-0.right**: Kết quả là 3 giờ 35 phút.

## Kết quả lượt rà soát

Đã đối chiếu mục tiêu, ví dụ, lời giải, ghi nhớ và hình của 20 bài trên. Các phép tính mẫu được kiểm lại; bộ kiểm chuẩn còn quét toàn bộ 188 bài và các tham số widget.

- Bài vị trí mầm non thiếu trước/sau so với tên kỹ năng: đã thêm hàng hướng về lá cờ, trước/sau/ở giữa và trái/phải theo người nhìn.
- Ngoài mẫu, phát hiện hình chữ nhật Lớp 1 dùng sai tên shape: đã sửa thành `rectangle`. Bảng hàng dời dấu phẩy có thể làm mất chữ số: đã chặn kết quả không đủ cột và thêm hồi quy.
- Lớp 1 đã kiểm câu tối đa 12 từ; các bài đều bật tự đọc to. Mầm non giữ tối đa 4 trang.
- Không phát hiện thêm sai số học trong các ví dụ được chọn sau sửa. Đây chưa phải xác nhận phù hợp sư phạm của giáo viên hay phê duyệt phát hành.
