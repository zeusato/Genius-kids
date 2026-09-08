# Mở rộng thị trấn và khả năng nâng cấp đồ họa

Ngày kiểm tra: 08/09/2026. Phạm vi: renderer thị trấn Three.js/React Three Fiber trong project; cảnh Hệ Mặt Trời vẫn chỉ hiển thị tóm tắt hành tinh.

## Đã triển khai

Danh mục tăng từ 8 lên **14 loại công trình**. Bổ sung bệnh viện (6 tầng), thư viện (4), chợ (2), trạm cứu hỏa (3), quán cà phê (3), điện gió (1). Mỗi loại dùng ba phong cách hiện có và có chi tiết nhận diện: biểu tượng y tế, sách/cột, quầy/mái che, cửa gara, bàn/cốc, tua-bin. Công trình mới dùng đầy đủ placement, nền, xoay, sao chép, undo, lưu và backup. Điện gió cấp 18 đơn vị điện cho mạng đường. Bệnh viện/cứu hỏa hiện là công trình tiêu thụ tiện ích; chưa mô phỏng bệnh tật, hỏa hoạn hay điều phối cứu hộ.

Xe có 6 mẫu: ô tô, taxi, xe buýt, xe tải, cứu thương, cứu hỏa. Thân, cabin, kính, bánh, đèn và thang được gom vào **2 instanced mesh**. Tuyến dựa trên đường khô nối nhà ở. Số xe đặt trong khoảng 0–24; 0 ẩn xe, công tắc chuyển động dừng xe và cư dân tại chỗ. Xe là minh họa, chưa có tránh va chạm, đèn giao thông hay nhiệm vụ vận tải.

Trong **Tùy chọn → Quy mô & đồ họa**:

| Thiết lập | Mặc định cho bản cũ | Khoảng cho phép |
|---|---:|---:|
| Cây tối đa | 1.000 | 0–5.000 |
| Ô đường tối đa | 4.096 | 0–4.096 |
| Xe minh họa tối đa | 8 | 0–24 |

Giới hạn là ngưỡng thêm mới, không phải lệnh tự sinh hoặc xóa đối tượng. Hạ giới hạn dưới số đã có giữ nguyên dữ liệu và chặn thêm. Tăng giới hạn rồi dùng cọ cây/vẽ đường. Đường có tối đa 4.096 ô vì lưới xây dựng là 64×64; nền công trình và nước/dốc làm diện tích dùng được nhỏ hơn. Số công trình vẫn giới hạn 200. Các cấu hình lưu theo thị trấn và tham gia undo/redo, nhập/xuất JSON. Đổi địa hình giữ cấu hình; sinh cây theo giới hạn, giữ ID hợp lệ.

## Ba mức hình ảnh

| Mức | Cây và đường | DPR tối đa | Bóng định hướng |
|---|---|---:|---:|
| Nhẹ | Một tán nón, đường đơn giản | 1 | Tắt |
| Cân bằng | Xen tán tròn/thông, vạch đường | 1,5 | 1.024² |
| Chi tiết | Ba lớp tán, vạch và viền đường | 2 | 2.048² |

DPR thực tế còn phụ thuộc màn hình. Renderer vẫn tự hạ xuống Nhẹ khi PerformanceMonitor báo suy giảm; có thông báo trong bảng cấu hình. Chọn lại mức chất lượng để thử lại. Đây chưa phải LOD theo khoảng cách: toàn cảnh đang dùng một mức cây tại một thời điểm. Hình học công trình giữ chi tiết như nhau giữa ba mức.

Instancing giảm số lượt gửi lệnh vẽ nhưng không loại bỏ chi phí xử lý tam giác và pixel. Cơ chế dùng chung hình học và hạ DPR phù hợp với hướng dẫn [React Three Fiber về hiệu năng](https://r3f.docs.pmnd.rs/advanced/scaling-performance). Bóng cần dựng thêm từ góc nhìn nguồn sáng, nên tăng chất lượng bóng có chi phí riêng theo [Three.js Shadows](https://threejs.org/manual/en/shadows.html).

## Số liệu tính trực tiếp từ mã nguồn

Chạy lại bằng:

```powershell
node scripts/planet-graphics-budget.cjs
```

Script dùng chính `buildingInstances`, `vehicleParts`, `environmentInstances`, `shapeGeometry`; không tải mô hình mạng. Giả định 200 công trình hỗn hợp **một tầng**, 48 cư dân, không có preview; cộng toàn bộ geometry không culling, không tính lượt bóng. Những mật độ dưới đây là tổng các thành phần độc lập, **không phải bản đồ hợp lệ chứa đồng thời mọi giới hạn**. Đặc biệt 4.096 ô đường sẽ chiếm toàn bộ lưới và không còn chỗ đặt nhà.

| Cây / ô đường / xe | Mức | Tam giác cây + đường | Tổng tam giác một lượt dựng chính |
|---|---|---:|---:|
| 1.000 / 300 / 8 | Nhẹ | 35.600 | 222.926 |
| 1.000 / 300 / 8 | Cân bằng | 134.316 | 321.642 |
| 1.000 / 300 / 8 | Chi tiết | 373.404 | 560.730 |
| 5.000 / 4.096 / 24 | Nhẹ | 209.152 | 402.094 |
| 5.000 / 4.096 / 24 | Cân bằng | 702.584 | 895.526 |
| 5.000 / 4.096 / 24 | Chi tiết | 1.892.520 | 2.085.462 |

Các thành phần cố định của phép tính: terrain 32.768 tam giác, 200 nhà hỗn hợp và dấu cổng 146.288, 48 cư dân 5.568; 8 xe 2.688 hoặc 24 xe 8.304. Tăng tầng nhà sẽ tăng số cửa sổ/chi tiết và làm tổng cao hơn bảng. Cây/đường được gom vào 2–3 batch, công trình vào tối đa 5 loại hình học, xe 2 batch.

Ở cùng kích thước CSS, DPR 2 tạo **1,78 lần số pixel** so với DPR 1,5; đây là tỷ lệ diện tích buffer, không phải tỷ lệ FPS. Shadow map 2.048² có **4 lần texel** so với 1.024². Nếu chỉ quy đổi một lớp sâu 4 byte/texel thì lần lượt khoảng 16 MiB và 4 MiB; đây là ước lượng một buffer, chưa bao gồm render target khác hoặc bộ nhớ thực tế của driver.

Trên bản chạy local với 8 công trình, 173 cây, 45 ô đường, 24 xe ở Chi tiết, bộ đếm Three báo **30 lượt vẽ, 100.118 tam giác, 32 geometry, 3 texture** tại góc camera kiểm tra. Không dùng số này để suy ra FPS tối đa, RAM/GPU tổng hay hiệu năng tablet. Chưa chạy bài đo p95 frame time 60 giây trên bộ thiết bị mục tiêu.

## Hướng nâng tiếp theo

1. **Ưu tiên LOD cây theo khoảng cách và chia batch theo tile.** Tán tròn hiện có 168 tam giác, nón 20; nhiều cây Chi tiết là thành phần tăng nhanh nhất. Xa camera chuyển về nón/impostor, gần mới dùng tán nhiều lớp. Cần kiểm tra chuyển mức không nhấp nháy và không tái tạo buffer liên tục.
2. **Nâng chất liệu có chọn lọc.** Dùng atlas màu/normal nhỏ cho mái, tường và mặt đường; giữ vật liệu dùng chung, không tạo texture riêng cho từng nhà. Sau đó thay vài công trình nổi bật bằng glTF có nhiều mức chi tiết, đảm bảo footprint và cổng vẫn khớp engine.
3. **Tăng chất lượng địa hình theo vùng camera.** Nâng cả bản đồ từ 128² lên 256² làm số tam giác nền tăng từ 32.768 lên 131.072 (4 lần), kéo theo mẫu cao độ và thời gian brush. Chỉ nên làm sau khi có LOD/tile theo khoảng cách và benchmark cọ/undo; chưa áp dụng trong lần này.
4. **Hiệu ứng hậu kỳ để sau.** SSAO nhẹ hoặc viền tiếp xúc có thể làm công trình rõ hơn; phản chiếu thời gian thực, nhiều đèn có bóng và DOF tăng chi phí pixel/lượt dựng, cần đo riêng trước khi bật mặc định. Không cần chuyển engine chỉ để thêm các chi tiết hiện tại.

Khuyến nghị hiện tại: giữ **Cân bằng** mặc định và khoảng 1.000 cây cho quá trình xây dựng; Chi tiết phù hợp để ngắm/chụp trên thiết bị đủ mạnh. 5.000 cây là trần kỹ thuật đã kiểm tra dữ liệu, chưa phải cam kết tốc độ. Trước khi nâng thêm, cần đo p50/p95 frame time, input latency, bộ nhớ, và 20 chu kỳ chuyển cảnh ở bản đồ có bố trí hợp lệ với 200 nhà nhiều tầng, nhiều đường/cây.

## Kiểm chứng

226 test / 11 file toàn project qua; TypeScript và production build/PWA qua. Test mới phủ công trình, điện gió, giới hạn qua một nét kéo, hạ giới hạn không xóa dữ liệu, undo cấu hình ở bản lưu cũ, tách bản sao, validate/import/export, giới hạn và đường đi xe, số lượng hình học theo chất lượng. Build vẫn có cảnh báo chunk lớn của project.

Trình duyệt: danh mục 14 loại; preview bệnh viện 3 tầng; ba mức/giới hạn hiện đúng; thử hạ giới hạn cây xuống 100 và đường xuống 40 vẫn giữ 173 cây/45 ô đường, tăng lên 24 xe; Chi tiết hiện tán nhiều lớp và viền đường; đã undo các thay đổi cấu hình và lưu lại hồ sơ kiểm thử.
