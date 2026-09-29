# Điện & Mạch điện — hồ sơ thiết kế và đặc tả triển khai

Ngày 29/09/2026. Bắt đầu từ [plan chính](../electricity-wow-plan.md), xem [bản trình bày thiết kế](design-review.html), rồi đọc ba phụ lục khi triển khai. Đây là tài liệu và bản thử nghiên cứu; module trong app chưa được nâng cấp theo toàn bộ đặc tả.

Trang trình bày đã được kiểm trực tiếp trong trình duyệt ở 1280×720: bốn ảnh chuyển đúng, nút chuyển đợt cập nhật nội dung, liên kết xem ảnh đưa focus về lựa chọn tương ứng và nút dùng được bằng Enter. Đã kiểm đường dẫn tài liệu/asset cục bộ và cú pháp JavaScript. Các kiểm này chỉ áp dụng trang hồ sơ thiết kế, không thay cho nghiệm thu mobile/editor của app mới.

## Đọc và triển khai

| Tài liệu | Nội dung và vai trò |
| --- | --- |
| [Plan chính](../electricity-wow-plan.md) | Hướng trải nghiệm, những khoảnh khắc “wow”, hai đợt phát hành, phụ thuộc và cổng nghiệm thu |
| [Engine và mô hình vật lý](research/engine-spec.md) | SI/dấu, netlist, solver, runtime theo thời gian, tham số linh kiện, oracle độc lập và giới hạn mô hình |
| [Nội dung và chương trình](research/content-spec.md) | Nguồn, ID ổn định, 13 bài, 16 mẫu vật, 12 nhiệm vụ, 12 ca lỗi, ngôi nhà, fixture đúng/sai |
| [Tương tác và tiến độ](research/interaction-progress-spec.md) | Bàn canonical 14×8, portrait 8×14, gesture, đi dây, trình bày nhánh song song, schema lưu, ledger thưởng, migration và SVG fallback |
| [Bản trình bày thiết kế](design-review.html) | Trang HTML để Đại ca xem hướng nâng cấp và các quyết định quan trọng; không phải giao diện sản phẩm đã triển khai |

Các phụ lục là hợp đồng triển khai: engine-spec quyết định vật lý, content-spec quyết định nội dung/ID, interaction-progress-spec quyết định thao tác và dữ liệu. Prototype hoặc ảnh cũ khác đặc tả thì sửa prototype/ảnh; không suy ra ngoại lệ trong code app.

## Hình ảnh và bằng chứng nghiên cứu

| File | Là gì / giới hạn |
| --- | --- |
| [Song song có hai nhánh rõ ràng](concept-parallel-clear.png) | Bố cục sửa theo góp ý Đại ca: mỗi bóng có hai dây riêng về hai cực pin; hai bóng dùng bốn dây, không nối chuyền bóng này sang bóng kia. Đây là hướng trình bày cho preset dạy học |
| [Bàn đồ chơi](concept-bench.webp), [so sánh ban đêm](concept-series-parallel-night.webp), [sơ đồ](concept-schematic.webp) | Ảnh ý tưởng từ prototype; các ảnh cũ có bố cục chưa theo quyết định bốn dây rõ nhánh phải tham chiếu ảnh sửa ở trên |
| [Thử vật dẫn](concept-conductor-test.webp), [soi dây](concept-wire-dive.webp) | Khảo sát hình ảnh; thí nghiệm vật dẫn, electron và lời giải thích khi triển khai phải theo tham số/giới hạn trong phụ lục |
| [Bài song song hiện tại](current-parallel-lesson7.webp), [lỗi bố cục điện thoại](current-phone-lesson6.webp) | Ảnh hiện trạng module cũ, dùng đối chiếu vấn đề cần sửa |
| [Prototype bàn](proto/bench.html) | **Các cảnh dựng sẵn**, khảo sát mô hình, ánh sáng, dây, sơ đồ và cutaway; chưa phải editor cho kéo linh kiện/nối dây, chưa chứng minh touch, lưu tiến độ hoặc hiệu năng máy thật |
| [Prototype solver](proto/mna-proto.mjs) | Bản thử phân tích nút với nguồn Norton và LED tuyến tính từng khúc; chạy các netlist khảo sát và in kết quả |
| [Runner kiểm solver](proto/mna-proto-check.mjs) | Assertion bằng công thức series/parallel/Kirchhoff độc lập, kiểm trực tiếp prototype; không thay cho test production/runtime/gesture |
| [Log solver cũ](research/solver-cases.txt) | **Transcript khảo sát, không phải oracle**. Không lấy log do solver tự in làm giá trị kỳ vọng duy nhất cho chính solver đó |

Ảnh khảo sát ban đầu chụp bằng Chrome headless qua CDP/SwiftShader ở 1280×800; không dùng số khung hình của môi trường này làm lời cam kết cho tablet hay điện thoại.

## Mở bản trình bày và cảnh thử qua Vite

Từ thư mục gốc repo, chạy `npm run dev` nếu chưa có dev server. Dùng cổng Vite thực tế; với cổng 3000:

- [Bản trình bày thiết kế](http://127.0.0.1:3000/Genius-kids/docs/electricity-wow/design-review.html).
- [So sánh nối tiếp/song song ban đêm](http://127.0.0.1:3000/Genius-kids/docs/electricity-wow/proto/bench.html?scene=compare&night=1).
- [Bàn đồ chơi](http://127.0.0.1:3000/Genius-kids/docs/electricity-wow/proto/bench.html?scene=main).
- [Sơ đồ](http://127.0.0.1:3000/Genius-kids/docs/electricity-wow/proto/bench.html?scene=main&view=schem).
- [Soi dây](http://127.0.0.1:3000/Genius-kids/docs/electricity-wow/proto/bench.html?scene=dive).

Không cần sao chép sang `.tmp-*`. `bench.html` nạp three r181 và postprocessing 6.39 từ jsDelivr qua importmap, nên cảnh thử cần HTTP và mạng cho các thư viện đó. Đây là phụ thuộc của prototype; không quyết định chính sách asset/offline của bản app.

Tham số scene thử:

| Tham số | Tác dụng |
| --- | --- |
| `scene=main\|compare\|tester\|dive` | Bàn, so sánh, vật dẫn, soi dây |
| `view=life\|schem` | Đồ chơi/sơ đồ, chỉ áp dụng scene `main` |
| `night=1` | Tắt đèn phòng |
| `fx=0` | Tắt composer (bloom và tone mapping) |
| `t=<giây>` | Cố định thời gian khung hình để chụp |
| `drift=0` | Tắt chuyển động trôi trong scene `dive` |
| `bt=`, `bi=`, `pool=1` | Chỉnh ngưỡng/cường độ bloom, bật quầng thử nghiệm |

## Chạy lại kiểm chứng số

Chạy từ thư mục gốc repo:

```powershell
node docs/electricity-wow/proto/mna-proto.mjs
node docs/electricity-wow/proto/mna-proto-check.mjs
```

Lệnh đầu in bảng khảo sát. Lệnh sau phải kết thúc thành công và in các ca PASS; assertion thất bại là lỗi cần kiểm tra, không cập nhật log để khiến kiểm chứng “xanh”. Khi bắt đầu GĐ0, viết các test của engine thật và simulation/evidence theo phụ lục; các cam kết kéo/thả, chuyển hồ sơ, mất context và chống thưởng lặp vẫn cần kiểm riêng.

Kết quả kiểm ngày 29/09/2026: **21/21 ca PASS**, và `node --check` qua cho runner. Hai ca bổ sung kiểm độc lập đúng bố cục cảnh dạy học: song song có bốn dây riêng về nguồn, nối tiếp có ba dây. Kết quả này xác minh số học của prototype trong các ca đã liệt kê, không xác nhận editor, lưu dữ liệu hay toàn bộ engine sản phẩm đã hoàn thành.
