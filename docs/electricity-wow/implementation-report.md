# Xưởng Ánh Sáng — báo cáo triển khai

Ngày 29/09/2026. Nhánh `codex/electricity-wow`, baseline `558a834c299b13573eb709e7fa5e428379299b49`. Route và tên trong sảnh giữ nguyên. Chưa deploy, chưa gỡ nguồn cũ. `.claude/settings.local.json` có sẵn được giữ nguyên.

## Phần đã triển khai

| Giai đoạn | Kết quả trong app |
| --- | --- |
| GĐ0 | Schema mạch version 1, netlist DC, các đảo floating, V/I/P có dấu, kiểm KCL/công suất, LED active set và fallback worker có revision; runtime bước 20 ms cho pin, nhiệt, bóng/LED hỏng, cầu chì, chuông. |
| GĐ1 | Bàn 3D và SVG dùng cùng model/controller; nối bằng kéo hoặc chọn hai cọc; kéo/xoay linh kiện, thuộc tính, dụng cụ đo, undo/redo, giới hạn bàn và router tránh linh kiện. Màn dọc dùng phép đổi tọa độ, không đổi mạch. |
| GĐ2 | Góc nhìn sơ đồ, soi dây 3D/SVG, hình cắt pin/bóng/LED/chuông/motor, so sánh hai mạch với dự đoán và vặn lỏng; 16 mẫu vật dẫn điện và cảnh an toàn. |
| GĐ3 | 13 bài có bước/bằng chứng, lời đọc tiếng Việt tùy thiết bị, âm thanh tổng hợp, đồ nghề gọn cho lớp 1–2, gợi ý/mạch tham khảo và nút làm lại. Tiến độ, huy hiệu và ledger sao theo owner. |
| GĐ4 | Năm lab: vật dẫn, pin chanh/khoai, nam châm điện, tĩnh điện và máy phát. Giá trị mẫu và giới hạn minh họa hiện trong UI. |
| GĐ5 | Nhà 3 tầng 3D/SVG, phép đo một giờ, so sánh thay 5 đèn trong lịch một ngày, đơn giá giả định; sáu tình huống an toàn, hành trình nguồn–truyền tải–phân phối–nhà và bù nguồn ban đêm. |
| GĐ6 | Đủ 12 nhiệm vụ, 12 ca thám tử. Adapter giữ đúng 15 đề cũ dưới nhãn luyện thêm, không thưởng sao. Tám bài cũ có đường sang nội dung thay thế. |

Sổ sáng chế dùng IndexedDB, giới hạn 12 mạch/hồ sơ, giữ dung lượng từng viên pin và linh kiện hỏng/lỏng. Có nháp theo hồ sơ/bài, phục hồi bước đang làm, xử lý bản lưu xung đột, xuất/nhập JSON, SVG thumbnail đúng topology và cache WebP tùy chọn. Lỗi ảnh không làm mất mạch. Tiến độ cũ được sao lưu nguyên văn, nhận vào tối đa một hồ sơ và không cộng sao cũ.

## Bằng chứng kiểm tra

- Baseline: 93 file / 1.319 test qua trước thay đổi.
- Full regression: **101 file / 1.459 test qua**. Các test mới bao phủ oracle số điện, topology, hỏng linh kiện, gesture cancel/đa con trỏ, cửa sổ evidence, mọi bài/nhiệm vụ điện, ba trường hợp sai cho từng bài, 12 ca sửa và 15 đề luyện cũ.
- Persistence: double callback/retry, owner đổi trong lúc chờ lock, quota, ledger 1→3→3, dữ liệu legacy hỏng, owner isolation, revision conflict và giữ pin/bóng hỏng khi mở lại.
- Build production thành công, worker và các cảnh 3D được tách chunk. Thumbnail encoder chỉ tải khi lưu. Service worker manifest bao gồm các chunk mới theo chính sách offline hiện có.
- Typecheck toàn repo còn lỗi có sẵn tại `modules/farm/src/ui/renderSnapshot.ts:26` (`object[]` không tương thích `Obstacle[]`); không sửa ngoài phạm vi điện. [Kết quả typecheck cuối](evidence/typecheck.txt), [tóm tắt validation](evidence/validation.txt).
- `git diff --check` không báo lỗi khoảng trắng.

Đã thực hiện qua UI trong trình duyệt Codex:

1. Nối bóng đầu tiên trên 3D bằng chọn cọc, giữ trạng thái cọc qua nhiều frame, hoàn thành và chơi lại không tăng sao lần nữa (hồ sơ QA vẫn 11 sao).
2. Đổi thật/sơ đồ, gây mất WebGL thật bằng extension của canvas, chuyển SVG vẫn giữ mạch sáng, tiến độ và undo.
3. Lưu tên riêng, về sổ, mở lại đúng hai dây và trạng thái góc nhìn. Sau tải lại app và chọn lại hồ sơ, tiến độ vẫn còn.
4. Ở **390×844**: thêm bóng thứ hai và nối đủ bốn dây riêng về hai cực pin. Xoay **844×390** vẫn giữ đúng bốn endpoint; không tràn ngang.
5. Kéo bóng trên canvas từ hàng giữa lên trên: số đo giữ **1,42 V / 170,97 mA / 0,244 W**. Cắt một dây và kéo nối lại trực tiếp giữa cọc thành công.
6. So sánh: ban đầu nối tiếp **8,7%**, song song **32,5%** công suất định mức. Vặn lỏng bóng 1: nối tiếp cả hai **0%**, song song bóng 2 còn **34,0%**.
7. Nhà: tắt bốn đèn thừa/TV/quạt, giữ đèn học và tủ lạnh; công tơ kết thúc ở **0,09467 kWh**. Thay năm đèn trong lịch ngày bằng bàn phím cho **6,7552 kWh/ngày**, giảm **1,020 kWh/ngày**.
8. Các lỗi tìm được trong browser đã sửa: cọc 3D bị hủy khi render lại; canvas co còn 150 px trong bàn dọc; grid nhà tràn ngang; drawer đồ nghề và bảng thuộc tính mở đồng thời.
9. Production offline trên desktop: UI xác nhận đã lưu **1.746/1.746 tệp, 131,7 MB** của bản `20260929145752316-local`. Dừng Vite preview, tải lại app, chọn lại hồ sơ rồi mở Điện → Sổ sáng chế → mạch đã lưu thành công. Chunk bàn 3D vẫn tải từ cache, hai dây còn nguyên và bóng chạy ở **1,46 V / 174,96 mA / 0,255 W**. Đây là phép thử máy chủ local ngừng phục vụ, chưa phải ngắt mạng trên điện thoại thật. [Gói offline sẵn sàng](evidence/offline-ready.jpg) · [Mạch chạy khi máy chủ tắt](evidence/offline-production.jpg).

## Hiệu năng

Chạy lại bằng `node scripts/benchmark-electricity.mjs`. Có 100 warmup + 1.000 mẫu/fixture; oracle độc lập nằm trong test, benchmark không dùng làm oracle.

| Mạch | Median | p95 |
| --- | ---: | ---: |
| Bàn 12 linh kiện / 14 dây | 0,1146 ms | 0,3542 ms |
| 63 nút / 92 nhánh | 0,5427 ms | 0,7913 ms |

Máy: Intel i7-1195G7, Windows 10.0.26200, Node 22.18.0; đây là CPU timing của bundle engine, không phải benchmark Android. [Dữ liệu gốc](evidence/solver-metrics.json).

Cảnh editor trước bước gom cọc thành InstancedMesh đạt 60 fps trong browser dev tại 1280×720: 18 draw calls/8.026 tam giác với một bóng; bàn hai bóng ở 390×844 đạt 60 fps, p95 frame 17,2 ms, 29 draw calls/11.814 tam giác, DPR 1. Renderer có DPR tối đa 1,5, cọc/lỗ bàn/electron dùng instancing, ngừng frame khi tab ẩn, tự chuyển SVG nếu khung hình chậm kéo dài. GPU chưa được xác định; không suy từ CPU rằng máy đang dùng Iris Xe.

Sau gom cọc, đã lắp và đo cảnh **12 linh kiện / 14 dây** ngay trong editor: **60 fps, p95 frame 20,1 ms, 56 draw calls, 25.066 tam giác, DPR 1**. Đây là quan sát tương tác ngắn trên browser dev, chưa phải benchmark 30 giây trên thiết bị đích. [Dữ liệu renderer](evidence/renderer-metrics.json) · [Ảnh cảnh đo](evidence/bench-stress.jpg).

## Các cổng chưa được xác minh

- Android tầm thấp, iOS Safari, touch đa ngón và audio trên thiết bị thật. Kiểm kích thước viewport bằng chuột không thay thế các ca này.
- Đo rendering cảnh stress liên tục trên thiết bị đích, thử shader timeout và tải gói từ cold cache rồi ngắt mạng trên điện thoại thật. Phép thử desktop với máy chủ local đã tắt ở trên chỉ xác minh app và bàn 3D phục hồi từ cache đã tải đủ.
- Chưa quay clip tương tác; đã lưu ảnh ở các trạng thái chính. Chưa có phiên usability 15 phút với trẻ.
- Khóa Web Locks chỉ phối hợp các writer Điện. Writer môn khác chưa được chuyển sang cùng cơ chế nên chưa khẳng định an toàn đa tab toàn app.
- App hiện yêu cầu chọn lại học sinh sau reload; mạch/tiến độ lưu theo hồ sơ được phục hồi sau khi chọn lại. Dev server có cảnh báo base URL nếu mở `/Genius-kids` thiếu dấu `/` cuối; dùng `/Genius-kids/` khi mở từ đầu.

GĐ7 vì vậy **chưa đóng toàn bộ nghiệm thu thiết bị/phát hành**. Các giới hạn trên không được đánh dấu đạt chỉ từ unit test hoặc ảnh prototype.

## Ảnh từ app đang chạy

[Sảnh](evidence/lobby.jpg) · [Bàn ngày](evidence/bench-day.jpg) · [Bàn đêm](evidence/bench-night.jpg) · [Editor dọc](evidence/editor-phone.jpg) · [Editor ngang](evidence/editor-landscape.jpg) · [So sánh trên điện thoại](evidence/parallel-phone.jpg) · [Soi dây](evidence/wire-dive.jpg) · [Nhà 3D](evidence/house-3d.jpg) · [Nhà điện thoại](evidence/house-phone.jpg) · [Sổ sáng chế](evidence/notebook.jpg).
