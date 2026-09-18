# Chi phí xây mới và giới hạn công trình — 18/09/2026

Đại ca yêu cầu công trình chức năng cần vật liệu ngoài xu, có giới hạn xây; trang trí có thể chỉ dùng xu. Đã thực hiện trong module riêng.

## Quy tắc hiện hành

- Mỗi công trình chức năng tối đa **1 công trình mỗi loại**, giữ quy tắc một bản chính vốn có. Cấp Nhà chính mở khóa từng loại; không tự thêm quyền xây nhiều bản khi lên cấp. Công trình đang xây cũng tính vào 1/1.
- Xây mới trừ xu và vật liệu cùng lúc, sau kiểm cấp, hạn mức, chỗ đặt và đội thợ. Hóa đơn vật liệu được lưu trong job xây dựng. Thiếu bất kỳ điều kiện nào thì không trừ gì. Thời gian xây và giới hạn đội thợ giữ nguyên.
- Đồ trang trí chỉ tốn xu, có thể mua nhiều. Vẫn chịu giới hạn toàn cảnh 300 thực thể và vị trí hợp lệ. Di chuyển/đặt lại đồ cũ miễn phí.
- Nhà chính và kho ban đầu vẫn có sẵn, không thu phí hồi tố. Save không đổi schema/contentVersion; hóa đơn của job xây cũ vẫn giữ nguyên, không áp lại giá mới.
- Vật liệu đã ghim chỉ được bảo vệ khỏi bán/giao đơn, vẫn được dùng cho xây và nâng cấp như quy tắc nâng cấp hiện có.

## Chi phí

Nguồn chính: `src/core/construction.ts::buildPrice`. Xu giữ nguyên `ASSETS[id].price`; bảng sau là vật liệu thêm khi xây mới.

| Công trình | Vật liệu |
|---|---|
| Nhà chính / Kho hàng | Có sẵn lúc bắt đầu; giá catalog dự phòng 8 gỗ + 6 đá / 8 gỗ + 4 đá |
| Cối xay gió | 6 gỗ, 4 đá |
| Chuồng gà | 8 gỗ, 2 đá |
| Lò bánh | 6 gỗ, 10 đá |
| Xưởng gỗ | 10 gỗ, 4 đá |
| Trạm đá | 6 gỗ, 8 đá |
| Chuồng bò | 10 gỗ, 6 đá, 4 ván |
| Xưởng sữa | 6 gỗ, 8 đá, 4 ván |
| Trạm quặng | 10 gỗ, 8 đá, 4 ván |
| Lò luyện | 16 đá, 6 ván |
| Chuồng cừu | 12 gỗ, 6 đá, 6 ván |
| Xưởng dệt | 8 gỗ, 4 đá, 8 ván |
| Vườn cây ăn quả | 10 gỗ, 8 ván, 2 sắt |
| Trại ong | 8 gỗ, 6 ván, 2 sắt |
| Xưởng gốm | 16 đá, 8 ván, 3 sắt |
| Xưởng dụng cụ | 12 ván, 12 đá, 6 sắt |
| Xưởng ép | 10 ván, 8 gạch, 4 sắt |
| Nhà kính | 10 ván, 6 sắt, 8 kính |
| Ao nuôi cá | 20 đá, 10 gạch, 2 dụng cụ |
| Cầu cảng | 18 ván, 6 sắt, 2 dụng cụ |
| Nhà bếp | 14 gạch, 10 ván, 6 sắt |
| Xưởng mứt | 12 gạch, 6 sắt, 10 kính |
| Xưởng may | 14 ván, 12 gạch, 8 vải |
| Nhà hội chợ | 18 ván, 14 gạch, 10 vải |
| Xưởng kem | 16 gạch, 10 sắt, 10 kính |
| Vườn thảo mộc | 16 ván, 12 gạch, 3 dụng cụ |
| Xưởng nhuộm | 18 gạch, 10 sắt, 8 kính |
| Nhà trà | 20 ván, 16 gạch, 12 kính, 8 vải |

“Sắt” trong bảng là thỏi sắt, không phải quặng. Vật liệu chế biến phải có nguồn sản xuất mở ở cấp thấp hơn công trình cần xây; không bắt xưởng gỗ dùng ván hay lò luyện dùng sắt để tự xây chính nó. Giá là cân bằng ban đầu, chưa coi là đã nghiệm thu nhịp chơi dài hạn.

## Giao diện và kiểm tra

- `BuildChoice.tsx`: thumbnail, tên, số đã xây/giới hạn, cấp mở khóa; công trình chưa có hiện icon tài nguyên + có/cần, thiếu đỏ/đủ xanh. Đã đủ hạn mức thì bấm để xem công trình hiện có. Đồ trang trí chỉ hiện giá xu.
- `buildRequirements` dùng chung cho engine, menu và kiểm vị trí xem trước, tránh chỉ khóa bằng UI. Thẻ không đủ điều kiện bị khóa; đang hết đội thợ có nhãn ngắn.
- `construction.check.ts` kiểm chi phí mọi loại/nguồn nguyên liệu, thiếu vật liệu không trừ tiền, trừ chính xác và lưu hóa đơn, hạn mức kể cả đang xây, hoàn thành offline, hóa đơn cũ, di chuyển miễn phí, nhiều trang trí và khóa cấp/đội thợ.
- Bộ chơi solo được cập nhật để tự kiếm xu và sản xuất vật liệu trước khi xây bằng lệnh thật, không cấp tài nguyên lách luật. Kết quả cuối trong [VERIFICATION](VERIFICATION.md).
