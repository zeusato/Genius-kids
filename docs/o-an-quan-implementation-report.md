# Ô ăn quan — bản triển khai local

Ngày kiểm tra: 15/09/2026.

## Kết quả

Game đã vào danh mục chính, chơi cùng bạn trên một máy hoặc đấu máy Dễ/Vừa/Khó. Bàn và dân/quan là geometry 3D. Chạm một ô hoặc số đếm của ô để chọn; hai nút trái/phải xuất hiện ngay trên ô. Bảng dưới chỉ giữ thông tin lượt, góc nhìn và trạng thái lưu.

Sân có gạch so le, đình mái ngói và cửa gỗ, bậc thềm, đèn lồng, cây đa với rễ buông, tre/hàng rào, chậu hoa, chum nước, ghế và giỏ đan. Bàn gỗ có hốc thật, nhân vật áo màu và quan mũ cánh chuồn. Hai góc camera, zoom, đồ họa nhẹ và fallback 2D dùng chung luật.

Luật `family-v1`: 50 dân, 2 quan; 1 quan = 10 điểm. Hết cả hàng phải lấy 5 dân đã ăn để rải lại; không đủ thì kết thúc, không vay/đổi quan. Cuối ván thu dân hàng mình; các quân còn trong ô quan khi kết thúc sớm không tính cho ai. Có hòa và chặn thế cờ lặp.

Ván được commit trước animation, nên tải lại giữa chuỗi trở về trạng thái cuối lượt đã xác nhận. Bot chạy Web Worker, hủy khi pause/rời ván, kiểm tra ID và revision, có nước dự phòng khi lỗi/timeout. Kết quả idempotent theo ID ván, chỉ ghi chủ hồ sơ, không phát tiền sao.

## Kiểm chứng

### Điều chỉnh nhịp quan sát theo phản hồi Đại ca

- Mặc định bốc 1 giây, rải 0,65 giây/dân, ăn dân 1,7 giây, ăn quan 2,2 giây; rải lại 0,7 giây/ô, thu cuối ván 1 giây/ô.
- Mỗi bước đứng tại nguồn 15% thời gian, di chuyển trong 65%, nghỉ tại đích 20%. Chuỗi dài không tự tăng tốc.
- Giảm chuyển động chỉ bỏ chuyển động bay, giữ thời gian đọc từng bước. Chế độ nhanh tùy chọn dùng 65% thời gian thường; nút Xem nhanh vẫn cho bỏ qua chuỗi.
- Hướng dẫn nêu rõ ô nguồn/đích và dân còn chờ rải. Máy chờ 1 giây trước lượt tính tiếp theo ở nhịp thường.

### Kiểm tra bản triển khai

- Sửa lỗi máy treo lượt đầu khi chơi lại: `begin()` đặt `ready=false`, nhưng canvas 3D tái sử dụng chỉ báo ready khi mount. Scene nay nhận `matchId` và báo ready cho mỗi ván mới; listener mất WebGL có vòng đời riêng.
- Regression browser: DEV → Thử chơi lại với máy → chọn ô 3/trái → Xem nhanh → Chơi lại. Trước sửa máy đứng mãi ở lượt 1; sau sửa tự rải/ăn và chuyển lượt 2. Có thêm fixture Máy đi trước để kiểm tra khởi tạo và pause/resume mà không phụ thuộc bốc thăm.

- Toàn bộ suite hiện có: **45 file / 643 test qua**. Sau đó bổ sung và chạy riêng **2 test bot qua**; tổng 645 test đã được chạy thành công.
- Engine: 16 test, gồm 80 ván sinh bằng seed với hơn 1.000 lượt; bảo toàn 50 dân/2 quan ở cả từng event (tính quân trên tay), cùng kết quả giữa bản có/không event, rải vòng, bốc nối, ăn chuỗi, refill, thiếu dân, hòa và lặp.
- Persistence: 11 test, gồm hồ sơ tách biệt, kho bị từ chối, JSON hỏng/khác phiên bản, thắng/hòa/thua, không cộng sao, không ghi trùng và thử ghi lại.
- Bot: so với phép duyệt vét cạn ba lượt trên 30 thế cờ hợp lệ khác nhau; nước hợp lệ và giá trị tối ưu khớp, hoặc tìm được thắng ngay. Đây là kiểm tra thuật toán tìm kiếm, **chưa phải 30 bài chiến thuật do người chơi phân tích độc lập**.
- `tsc --noEmit`: qua. Loại `dist` và `node_modules` khỏi tsconfig để TypeScript không quét bundle đang được Vite thay thế.
- Build production + PWA: qua; preview chỉ phục vụ dev, không precache.
- Browser: chạm trực tiếp nhân vật/ô, chọn qua số trên board, chọn hướng cả hai hàng, góc nghiêng/thẳng, pause/resume, 2D, ăn chuỗi gồm quan, hòa 35–35, thiếu dân kết thúc 46–4 với 20 điểm giữa bàn không tính.
- Mất WebGL bằng extension thử nghiệm: chuyển 2D, giữ đúng bàn và điểm 57–0 sau chuỗi ăn.
- Viewport đã xem: 1024×768, 1180×820, 820×1180 và 390×844. Nút chọn hướng nằm trên board, không cần thanh chọn ô riêng.
- Production: tạo hồ sơ thử riêng `QA Ô ăn quan` trên cổng 4175; đi từ sảnh → danh mục → Ô ăn quan, máy Khó đi nước hợp lệ; tải lại lúc pause giữa rải khôi phục được ván lượt 3.
- Offline: sau khi service worker báo cache xong, tắt hẳn server 4175 và xác nhận cổng không còn lắng nghe. Mở lại ứng dụng từ cache, chọn hồ sơ, vào game, tiếp tục lượt 3; scene 3D và worker chạy, máy đi sang lượt 4. Không mô phỏng mất kết nối toàn hệ điều hành.

## Bot đối chứng

Seed `20260915`, 128 vị trí khác nhau, mỗi vị trí chơi cả hai phía: 256 ván mỗi đối thủ. Không điều chỉnh thuật toán theo kết quả benchmark này.

| Đối thủ | Thắng | Hòa | Thua | Điểm đối sánh | Hiệu số điểm TB |
| --- | ---: | ---: | ---: | ---: | ---: |
| Ngẫu nhiên | 220 | 10 | 26 | 87,89% | +22,51 |
| Tham lam | 190 | 9 | 57 | 75,98% | +11,19 |
| Vừa | 160 | 10 | 86 | 64,45% | +2,43 |

Không có ván vượt giới hạn 400 lượt. Điểm đối sánh = `(thắng + 0,5 × hòa) / số ván`; đạt mục tiêu ban đầu trước ngẫu nhiên (80%) và tham lam (60%).

Benchmark dùng ngân sách cố định: Khó 4.000 nút/độ sâu tối đa 6, Vừa 1.000 nút/độ sâu 3, không deadline. p50 tính một nước Khó 19–24 ms, p95 83–99 ms trên máy chạy Node này. Trong sản phẩm, Khó có deadline 480 ms, 80.000 nút/độ sâu tối đa 10; số benchmark không thay cho thời gian thực trên tablet. Xem ba báo cáo JSON và `scripts/benchmark-o-an-quan.ts` để tái hiện.

## Kích thước và giới hạn đã biết

- Hai ảnh bìa tổng 119.956 byte. Mesh, vân gỗ và tiếng rải tạo trong mã.
- Chunk UI Ô ăn quan khoảng 27,1 kB; scene 15,7 kB; worker 5,9 kB; CSS 21,7 kB, trước gzip. Three/R3F và engine/persistence chia sẻ qua các chunk khác nên đây không phải tổng tải mạng.
- Scene bàn mới đo trong dev: 33 draw calls, khoảng 128 nghìn tam giác ở lượt render báo bởi renderer. Thấp hơn ngân sách draw calls 100; cao hơn mục tiêu sơ bộ 100 nghìn tam giác. DPR giới hạn 1–1,5; render theo nhu cầu, đồ họa nhẹ tắt tiểu cảnh/bóng.
- Build còn cảnh báo sẵn có về chunk lớn, import tĩnh/động trộn và URL font dùng BASE_URL. Font có trong public; không phát sinh lỗi TypeScript/build.
- Trong QA, rebuild khi trang production cũ còn mở làm một dynamic import cũ 404. Sau kích hoạt service worker mới và trở về `/Genius-kids/`, game tải lại và ván lưu vẫn còn. Không rebuild trong lúc nghiệm thu offline.
- Chưa đo FPS, nhiệt/pin trên iPad/Safari hoặc Android/Chrome thật; chưa làm buổi thử 3–5 người mới chơi. Viewport giả lập không thay thế các phép đo này.
- Chưa có bộ bài chiến thuật phân tích thủ công hay kiểm tra từng điểm reload đặc biệt trong UI; kiểm thử engine/persistence và các luồng browser ở trên là phạm vi đã xác minh.

## File chính

- `games/OAnQuan/OAnQuanGame.tsx`: sảnh, vòng đời ván, bot, animation và màn kết quả.
- `games/OAnQuan/Board3D.tsx`, `Board2D.tsx`, `OnBoardChoice.tsx`: tương tác trên bàn.
- `games/OAnQuan/geometry.ts`, `scenery.ts`: bàn, nhân vật và sân đình.
- `games/OAnQuan/engine.ts`, `bot.ts`, `persistence.ts`: luật, tìm kiếm và hồ sơ.
- `docs/o-an-quan-assets.md`: nguồn ảnh Flow và mô tả asset.
- `o-an-quan-preview.html`: bản preview dev có fixtures để kiểm tra.

Không triển khai lên hosting trong lượt này.
