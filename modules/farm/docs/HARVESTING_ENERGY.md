# Khai phá, năng lượng và gia đình — 18/09/2026

Yêu cầu mới của Đại ca thay thế khai phá bằng xu, timer dọn vật cản và “Thu gom vật liệu” trong tài liệu cũ. Đã triển khai local; chưa commit/push/deploy.

## Cơ chế

| Cấp | Nhà chính | Năng lượng | Dụng cụ thay thế | Phần thưởng chính |
|---|---:|---:|---:|---:|
| Nhỏ — 1 | 1 | 12 | 1 | 4–6 |
| Vừa — 2 | 5 | 25 | 2 | 9–12 |
| To — 3 | 12 | 45 | 3 | 17–22 |
| Lớn — 4 | 20 | 70 | 4 | 29–36 |

- Cây cho gỗ; đá cho đá + đất sét bằng cấp; quặng cho quặng sắt + đá bằng cấp. Quặng luôn cần ít nhất Home 4. Hình tăng kích thước theo cấp; menu ghi tên, cấp, khoảng thưởng và điều kiện.
- Năng lượng ban đầu 100; sức chứa `100 + 5 × (Home − 1)`, tối đa 220. Hoàn tất nâng Home cộng phần sức chứa mới vào năng lượng hiện có. Hồi 1 điểm/180.000 ms, giữ thời gian lẻ, dừng tích lũy lúc đầy; hỗ trợ offline, không thưởng khi đồng hồ lùi.
- Đủ dụng cụ theo cấp thì UI tự dùng dụng cụ thay năng lượng, thiếu thì dùng năng lượng. Không trừ xu/vật liệu khác; công cụ không vượt khóa Home. Engine hỗ trợ cả lựa chọn energy/tools có chủ đích, UI dùng auto.
- Giao dịch nhận hàng ngay, không timer hay bước thu lần hai. Lưu thành công mới phát hiệu ứng. Thiếu chỗ kho, năng lượng hoặc sai thế hệ mọc thì thất bại nguyên tử. Phần thưởng ngẫu nhiên theo seed/vị trí/generation, reload không đổi hoặc nhận hai lần.
- Bụi quả hồi 5–10 năng lượng, miễn phí, không tốn dụng cụ. Giới hạn sức chứa; khi đầy thì giữ bụi cho lần sau.
- Năm đợt/ngày theo đồng hồ game, cách 4 giờ 48 phút; mỗi đợt tối đa 1 tài nguyên cấp 1 + 1 bụi quả. Ban đầu có 1 bụi tính vào hạn mức. Offline chỉ bù ngày hiện tại, không cộng dồn nhiều ngày. Mọc ít hơn nếu hết ô hợp lệ.
- Chỉ mọc trên đất mở, khô, bằng, tiếp cận được, trống; tránh nhà/trang trí/ruộng, vùng khởi đầu 24×24, cầu/cảng và hành lang. Vành 8 ô quanh điểm mọc phải trống để không chặn đường. Tái dùng bản ghi tại ô đã dọn, tăng generation.
- Bố/mẹ khai phá cây/đá, mẹ/con trai/con gái hái quả. Nhân vật xuất hiện gần mục tiêu, chạy ngắn rồi chặt/cuốc/hái trong khoảng 1,9 giây; không trì hoãn nhận hàng. Vật liệu bay về kho, năng lượng bay về thanh năng lượng. Có bản giảm chuyển động.
- Bỏ UI thu gom trong Nhiệm vụ; từ chối lệnh gather/collect-gather/collect-obstacle cũ.

## Cân bằng và hiệu năng

100 năng lượng cho 8 lượt nhỏ, khoảng 32–48 đơn vị chính; một lượt nhỏ tương đương 36 phút hồi. Thanh 100 hồi đầy từ 0 trong 5 giờ. Năm bụi thêm tối đa 25–50 điểm/ngày. Tài nguyên lớn hiệu quả hơn nhưng cần tiến trình và nhiều năng lượng mỗi lần. Đây là mức khởi đầu cần chơi thử, chưa nghiệm thu cân bằng. Mô phỏng chỉ chứng minh có đường tiến triển hợp lệ, số ngày của bot không dự báo nhịp chơi người thật. NPC và chuỗi sản xuất vật liệu vẫn tồn tại.

Gia đình dùng 2 instanced draw, các bụi quả thêm 2 draw chung, không thêm ảnh nhân vật lớn. Nhân vật chỉ cập nhật ma trận khi có việc/thay vị trí; đường chạy tính ngoài vòng từng frame. Tính ô mọc một lần cho cả đợt bù, quét vùng tiếp cận được; tick nhỏ và bù cùng ngày cho cùng kết quả. Giữ các sửa ở [PERFORMANCE_2026-09-18](PERFORMANCE_2026-09-18.md).

## Bản lưu

Giữ schema 2/contentVersion 3 tương thích Supabase; thêm harvestingVersion 1, energy, regrowth. Không sửa SQL/OAuth. Validator nâng save cũ một lần: cấp năng lượng, nhận hàng các lượt dọn/thu gom đã trả phí, bảo lưu phần dung lượng kho nếu đầy, xóa job cũ. Local repository giữ bản gốc tại migration-original-harvesting-v1; nút xuất bản gốc dùng được. Cloud dùng cùng gateway/validator.

Mã: core/harvesting.ts, engine.ts, simulation.ts, validation.ts; ResourceAction/EnergyMeter, Family, BerryBushes, HarvestEffects. Sân thử riêng `?lab=qa&session=...` có nút **Thử khai phá**: Home 5, 45 năng lượng, 2 dụng cụ và 4 tài nguyên.

## Kiểm chứng

- 147 bài ngoài mô phỏng toàn tiến trình đạt, gồm 20 bài mới về chi phí, khóa cấp, phần thưởng/lặp lệnh, hồi năng lượng, quả/nhân vật, hạn mức/tick-bù, migration và lỗi lưu.
- Typecheck và build module đạt; kết quả cuối build host/mô phỏng ở VERIFICATION.md.
- Chrome QA: đá cấp 2 dùng 2 dụng cụ, năng lượng/xu giữ nguyên, nhận 12 đá + 2 đất sét; cây nhỏ dùng 12 năng lượng, thêm 6 gỗ; quả thêm 7 năng lượng (đồng hồ hồi vẫn chạy); quặng cấp 3 khóa Home 12. Nhiệm vụ không có thu gom; reload giữ 20 vật liệu/180 xu/năng lượng còn lại.
- Viewport 390×844: thanh năng lượng/kho/dock không chồng lấn; console không có lỗi. Không thay save production. Chưa nghiệm thu animation/FPS trên Android thật; viewport desktop không thay kiểm tra GPU/cảm ứng/bộ nhớ điện thoại.
