# Báo cáo triển khai độc lập — 2026-09-15

## Trạng thái

Đã có bản chơi độc lập để duyệt đồ họa/trải nghiệm và kiểm tra tích hợp sau. Chưa ghép vào ứng dụng chính theo yêu cầu người dùng. **Chưa đánh dấu hoàn tất nghiệm thu sức mạnh M3 hoặc phát hành M5 của plan**, vì còn tournament đầy đủ và thiết bị thật.

## Đã triển khai

- Engine luật thuần TypeScript, bàn Int8Array, vị trí Tướng/hash cập nhật bằng make/unmake; lượt UI và lượt search cùng một bộ luật.
- Đỏ đi trước, chủ hồ sơ chọn màu bất kỳ; hai người hoặc bot. Phân xử chiếu bí, bí nước, nhận thua, đồng ý hòa, ba lần lặp và chiếu liên tục một phía.
- Bản lưu có version, rulesVersion, ownerSide, revision, đầy đủ lịch sử và canonical position keys. Tải lại bằng replay nước hợp lệ; từ chối dữ liệu sai chủ, sai board/history/check/terminal/version.
- Lưu ván độc lập, kết quả idempotent theo match ID, giữ draft đã kết thúc nếu ghi kết quả lỗi. Xóa dữ liệu theo owner chỉ trong namespace Cờ Tướng.
- Bot iterative negamax/alpha-beta; quiescence ăn quân và mọi nước thoát chiếu; có deadline/node/ply caps, giữ vòng tìm hoàn tất gần nhất. Ordering theo TT move, MVV/LVA, killer và history.
- Bảng TT chỉ giữ nước để sắp xếp, không cache điểm. Cách này tránh tái sử dụng sai điểm hòa/chiếu dai giữa các lịch sử khác nhau. Chưa bật null-move, LMR, aspiration hoặc WASM.
- Worker chạy độc lập UI; request ID + match ID + revision + rulesVersion, từ chối kết quả cũ, cancel khi pause/rời tab/new match, dự phòng bằng nước đã xác minh khi worker lỗi/timeout.
- Lobby Kỳ Viên, ảnh gốc tạo bằng Google Flow. Cảnh bàn gỗ 3D, mặt quân 14 loại, vườn/tre/bonsai/ấm trà, chuyển động đặt quân, bóng/ánh sáng; instanced pieces và garden geometry gộp.
- Bàn 2D dùng chung game state, nhãn Việt/Hán, dấu ô đi được/nước vừa đi/chiếu, xoay/lật/thu phóng, lịch sử và khay quân đã ăn.
- Âm thanh tổng hợp; reduced motion, đồ họa nhẹ, 2D fallback khi WebGL lỗi; pause, chuyền máy, dialog xác nhận nhận thua/hòa/đè ván đang chơi.
- Host Vite/PWA riêng, precache cả worker, lazy chunk 3D, ảnh/font và giấy phép. Có nút cập nhật sau khi phiên bản mới sẵn sàng, không tự reload đang chơi.

## Kiểm tra tự động

TypeScript strict riêng game: **PASS**. Vitest riêng game: **30 tests / 3 files PASS**.

| Nhóm | Bằng chứng |
| --- | --- |
| Move generation | Perft khởi đầu depth 1–4: 44 / 1,920 / 79,666 / 3,290,240; FEN và nguồn đối chứng lưu ở `fixtures/perft.json` |
| Luật quân | Chân Mã, mắt Tượng, sông, Pháo 0/1/2 ngòi, hai Tướng đối mặt, Tốt không lùi |
| Kết thúc | Chiếu bí thực mà không bắt Tướng, bí nước xử thua, chu kỳ Mã lặp từ khai cuộc; chu kỳ chiếu Xe hợp lệ cả Đỏ và Đen |
| Khôi phục | 10,000 make/unmake; input search không bị đổi sau abort; replay bản lưu và phát hiện sửa check/key/owner |
| Search | So sánh điểm depth 2 với full-width minimax trên 8 thế; TT ordering on/off cùng điểm; cùng board khác lịch sử nhận kết quả khác |
| Worker | Kết quả cũ, kết quả trùng, cancel, timeout, nước trả về sai đều có kiểm tra |
| Persistence | Owner Đen ghi đúng kết quả, ghi hai lần không nhân đôi, xóa đúng owner, lỗi quota giữ draft và retry được |

Perft dùng số tham chiếu do tác giả Wukong công bố, không lấy kết quả của engine này làm đáp án: [bảng perft tác giả](https://talkchess.com/viewtopic.php?t=76430), đối chiếu [jqxq](https://github.com/liujh168/jqxq). Oracle search kiểm tra thuật toán alpha-beta với minimax độc lập; vẫn dùng chung movegen và adjudicator, nên không thay thế perft/test luật.

Không chạy hoặc thay đổi test/build toàn dự án đang có AI khác làm Cờ Vua; báo cáo này chỉ xác nhận phạm vi standalone.

## Trình duyệt và offline

Đã thao tác trong in-app browser trên Windows:

- Bấm quân và đi nước trên 3D; 2D/lật bàn đúng tọa độ; ăn quân cập nhật board, tray và lịch sử.
- Đồng ý hòa bởi hai người, màn hình kết thúc và số ván đã chơi cập nhật.
- Reload tiếp tục đúng lịch sử; người chơi cầm Đen, bot Khó tự đi trước và đáp nước sau lượt người chơi.
- Pause/continue ngay trên bàn mobile, đổi nhãn tiếng Việt, chuyển 2D/3D, màn hình 390×844 và desktop; kiểm tra bố cục ngang 844×390.
- Với bản build ở port 4318: tải online, reload, **tắt process server**, reload lại rồi mở ván/đi a3→a4. Worker vẫn đáp b9→c7; mở lại cảnh 3D được. Không có console error trong lượt kiểm tra. Đây là kiểm tra origin server không còn phục vụ, chưa phải thử chế độ máy bay trên điện thoại thật.
- Bản build cuối phục vụ riêng ở port 4319. Dev dùng port 4317 để tránh chờ vòng đời cache mỗi lần sửa.
- Đã tạo build tiếp theo trên cùng port 4319: giao diện báo có bản mới, bấm **Lưu ván & cập nhật** reload thành công; ván lưu vẫn có nút Tiếp tục và mở lại được.

## Hiệu năng ghi nhận

Thiết bị chạy đo: Windows, Intel Core i7-1195G7 @2.90 GHz, Node v22.18.0. Số liệu là mẫu trên máy phát triển, không phải cam kết trên điện thoại.

- Cảnh 3D khởi đầu đo từ renderer: khoảng **17,960 triangles, 22 draw calls**; render theo nhu cầu, chỉ liên tục trong chuyển động hoặc tương tác camera.
- Font chữ Hán subset: 7.94 KB. Ảnh lobby WebP: 188.16 KB.
- Build Vite thành công. Main JS 247.32 KB (gzip 78.28 KB), 3D chunk 909.33 KB (gzip 250.80 KB), worker 9.19 KB, CSS 24.63 KB (gzip 6.29 KB), workbox-window 5.76 KB. 3D chunk có cảnh báo >500 KB vì chứa Three/R3F; đã lazy load khỏi lobby.
- PWA cuối: **21 precache entries, 1,457.64 KiB**. Assets cover catalog chưa dùng được giữ trong source, không ép tải vào game standalone.

Đo deadline 12 thế/mức trong `latency.json`:

| Mức | p50 | p95 | Vòng đầu chưa hoàn tất |
| --- | ---: | ---: | ---: |
| Dễ | 60.04 ms | 60.11 ms | 1/12 |
| Vừa | 350.02 ms | 350.04 ms | 0/12 |
| Khó | 741.48 ms | 1,200.05 ms | 0/12 |

Trường hợp chưa hoàn tất vòng đầu vẫn trả một nước hợp lệ đã chuẩn bị. Các thời gian trên chỉ tính search, không gồm khởi động worker/replay/message/animation. Chưa đo p95 toàn chuỗi trên Android/iOS thật.

## Benchmark sức mạnh: chưa nghiệm thu đầy đủ

`fixtures/benchmark-starts.json`: đã khóa 200 khai cuộc có đầy đủ lịch sử, seed 20260915. Report lưu SHA256 fixture và mã search/luật để truy vết. Không dùng 200 thế này để chỉnh trọng số eval trong đợt này.

Đã chạy **functional smoke** 4 khai cuộc × 2 màu × 2 baseline = 16 ván, fixed 2,000 nodes/depth ≤4, giới hạn 160 ply:

| Đối thủ | Thắng | Hòa | Thua | Chưa kết thúc |
| --- | ---: | ---: | ---: | ---: |
| Random | 8 | 0 | 0 | 0 |
| Greedy vật chất một ply | 8 | 0 | 0 | 0 |

Kết quả smoke chỉ chứng minh chơi hết ván và thông luồng. **Không dùng các tỷ lệ 8/8 để tuyên bố đạt ngưỡng sức mạnh**, và khoảng bootstrap của mẫu rất nhỏ không đủ để nghiệm thu. `--acceptance` đã có runner 400 ván/cặp với ngân sách chuẩn và 600 ply; chưa chạy toàn suite. Chưa có bằng chứng phân tầng Khó>Vừa>Dễ theo cận dưới CI, đối đầu depth-3 toàn bộ, hoặc tournament cùng deadline thực.

## Các mục giữ lại cho review/ghép/phát hành

1. Chạy và tinh chỉnh đến khi đạt tournament §6, thử người thật; không gắn Elo hoặc tuyên bố thách thức người có kinh nghiệm trước bước này.
2. Đo FPS, bộ nhớ, worker latency và cảm giác chạm/âm thanh/offline trên iPhone/iPad/Android thật. Viewport desktop chỉ xác minh bố cục.
3. Ghép launcher/catalog/StudentContext/profile history/xóa profile bằng adapter chung; loại host PWA standalone khỏi host chính. Rồi chạy toàn bộ test/build/PWA của dự án sau khi hai game được review cùng nhau.
4. Không đưa luật đuổi bắt WXF hoặc engine WASM vào bản luật v1. Khi thêm phải nâng rulesVersion và xử lý bản lưu cũ.

Tất cả mã/tài nguyên/báo cáo của đợt này nằm trong `games/CoTuong/`; plan đã review ở `docs/co-tuong-implementation-plan.md` được giữ nguyên.
