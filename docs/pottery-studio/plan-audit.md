# Đối chiếu kế hoạch Xưởng Gốm — 14/10/2026

## Kết luận

Bản trước là **bản chơi xuyên suốt đã tích hợp**, chưa đủ bằng chứng để gọi là v1 hoàn chỉnh đạt nghiệm thu. Có các chức năng chính và kiểm thử dữ liệu, nhưng một số yêu cầu về tương tác, chất lượng hình ảnh và khả năng phục hồi mới làm ở mức cơ bản. GĐ0 và GĐ8 chưa qua các cổng chất lượng của kế hoạch.

Lần bàn giao trước đã nói quá rộng khi dùng “triển khai toàn bộ”. Số test toàn repository không chứng minh được lòng bình nhìn đúng hoặc trẻ có thể nặn bình dễ dàng. Cần phân biệt mã đã có, hành vi đã kiểm tra và tiêu chí phát hành đã đạt.

## Ma trận thực hiện

| Mốc | Bằng chứng hiện có | Phần thiếu hoặc chưa đủ |
| --- | --- | --- |
| GĐ0 — kiểm chứng lõi | Bàn xoay, profile, texture và vòng chơi chạy trên trình duyệt desktop | Không có spike trên tablet chuẩn; chưa có số đo phản hồi/P95 hay chơi thử trẻ em. Không đạt cổng GĐ0 theo plan. |
| GĐ1 — nền module | Route lazy, ownership theo account/student, model thuần, stage guards, IDB expected revision, save queue | Engine/controller/render còn tập trung trong các file lớn; đổi profile/tài khoản chỉ mới có kiểm thử scope và kiểm tra code, chưa E2E đầy đủ. |
| GĐ2 — nặn | Height, kéo bán kính, hold pinch theo thời gian, smooth, mở lòng, undo; stress 3.000 thao tác | Chưa có vùng bắt đỉnh 16–24 px; smooth vẫn phụ thuộc số pointermove; ngón thứ hai dừng thao tác nhưng chưa tự chuyển camera; chưa tính thể tích hoặc giới hạn độ cong riêng. Âm thanh/vệt ẩm/trợ giúp khi chạm giới hạn còn sơ lược. |
| GĐ3 — men và xưởng | 3 đất, 6 recipe, PBR, env map cục bộ, tier DPR/texture | Low tier trước audit vẫn dùng MeshPhysicalMaterial với clearcoat tắt. Không có bảng so sánh 6 men/3 dáng trên thiết bị thật. Lòng bình trước audit bị sáng phẳng và miệng quá dày; đã sửa bên dưới. |
| GĐ4 — trang trí | 16 màu, nhúng, brush/erase, 12 stamp, 6 band, journal có giới hạn, UV wrap | Chưa có bộ kiểm chứng đầy đủ seam/paint trace và replay worst-case. History dùng snapshot cả journal thay vì checkpoint raster tối ưu. Nét vẽ mặt trong chưa thuộc v1. |
| GĐ5 — nung | Lưu trước chuyển bước, preparing/firing/reveal/finished, seed, skip, PNG | Hoạt cảnh nung chủ yếu là overlay và ánh sáng; chưa đánh giá chất lượng/thời lượng với trẻ. Trước audit, commit chuẩn bị lỗi có thể vẫn làm đổi hình; đã sửa rollback. |
| GĐ6 — lưu và kệ | Scope, revision conflict, export/import, thumb revision guard, gallery, fork; test IDB | Checkpoint được ghi nhưng chưa có luồng phục hồi từ checkpoint khi bản chính hỏng. Gallery đọc toàn bộ journal trước khi rút metadata. Chưa mô phỏng quota và interrupted writes đầy đủ; chưa có nút tải revision mới khi conflict (hiện xuất/fork). |
| GĐ7 — nội dung | Đúng số lượng 3 bài/8 mẫu/12 nhiệm vụ/6 facts; thưởng hữu hạn | Hướng dẫn chủ yếu là chữ/checklist, thiếu minh họa cử chỉ và hình nhiệm vụ. Chấm dáng chỉ dùng sai số trung bình, chấm màu dùng độ cao phủ thay vì diện tích bề mặt 3D; phản hồi chưa đủ cụ thể theo miệng/bụng. |
| GĐ8 — phát hành | Build, typecheck có baseline, test, smoke desktop, bố cục hẹp | Chưa đo memory/20 phút/10 lần vào ra; chưa airplane-mode E2E; chưa test touch/stylus/Safari thật. Một số nút nhỏ hơn 48 px; chưa kiểm accessibility toàn bộ. Chưa đạt cổng phát hành. |

## Lỗi lòng bình và bản sửa trong audit này

### Nguyên nhân đã xác định

1. `innerRadius = outerRadius - 2 * thickness` làm miệng bị bóp nhỏ và vành dày quá mức trên các đoạn thẳng.
2. Mặt trong có mesh và winding đúng, nhưng dùng ánh sáng môi trường gần như đồng đều, không xét ánh sáng bị che trong khoang. Vì vậy nền lòng sáng như mặt nắp.
3. Camera nhìn quá ngang để người chơi thấy khoảng rỗng. Nút mở lòng lại nằm sau nhiều dụng cụ, dễ bị bỏ qua khi mới nặn.
4. Công cụ mở miệng đặt độ sâu tối đa lại ở mọi pointerdown; độ sâu đã chỉnh không được giữ qua lần chạm tiếp.
5. Test cũ kiểm topology/normals nhưng chưa raycast xuyên miệng tới đáy, chưa xác nhận mặt trong bằng FrontSide và chưa nghiệm thu thị giác về độ sâu.

### Đã sửa

- `engine/cavity.ts`: suy ra mặt trong bằng offset theo khoảng cách tới đường biên, thay phép trừ độ dày gấp đôi. Giữ aperture nhỏ nhưng không bị đóng khi cổ hẹp.
- `render/vesselGeometry.ts`: vòng miệng bo, thành trong riêng, chuyển tiếp bo vào đáy lòng, đáy ngoài kín. Không đặt đĩa tối giả lên miệng. Ngoài/vành/trong có miền material riêng; vẫn giữ UV ngoài và journal cũ.
- `render/cavityMaterial.ts`: giảm ánh sáng môi trường theo chiều sâu/aperture của khoang; direct light và bóng đổ vẫn dùng Three.js. Điều chỉnh ánh sáng chung và độ chính xác shadow camera.
- Camera mặc định nhìn xuống rõ hơn; thêm góc nhìn vào lòng. Nút **Mở lòng gốm** đặt đầu panel, có thanh chỉnh độ sâu/thành và trạng thái đất đặc/rỗng.
- Không reset độ sâu khi chạm lại công cụ mở miệng. Hoàn tác tiếp tục phục hồi trạng thái đặc/rỗng.
- Rollback hình và kỹ năng khi transaction chuyển bước thất bại. Mở lòng tự động khi chuyển bước không tự tính là kỹ năng người chơi đã thực hiện.
- Bổ sung regression: 8 profile, tia qua miệng tới đúng đáy; tia từ lòng ra thành; tia dưới đáy; mở/đổi sâu/đóng; độ dày theo pháp tuyến; ánh sáng lòng sâu so với bát thấp; rollback khi conflict.

Schema artwork không thay đổi. Các bản cũ vẫn đọc được; mặt trong và vành được dựng lại theo hình học mới, nên lòng sẽ rộng hơn so với renderer cũ. Mặt ngoài và tọa độ nét vẽ được giữ. Thumbnail cũ cập nhật khi mở và lưu lại tác phẩm.

### Kiểm chứng bản sửa

- `npm test -- src/pottery src/components/hub/catalog.test.ts`: **4 file, 52/52 test qua**.
- `npm run build`: thành công, gồm service worker. Typecheck chỉ còn lỗi baseline của `modules/farm/src/ui/renderSnapshot.ts:26`; không có lỗi pottery.
- Trình duyệt: mở lòng từ khối đặc, tải lại bản đã mở; tăng chiều cao/thắt cổ/phình bụng thành lọ hoa; xem vào lòng; giảm độ sâu để thấy đáy nâng lên; undo khôi phục lòng sâu; qua nung sơ sang men xanh/lòng kem vẫn đọc được độ sâu. Không có lỗi JavaScript trong lần smoke này.
- Đã xem cảnh trên khung hẹp và 1180×820; ảnh sau sửa: [cavity-after.jpg](cavity-after.jpg). Đây là bằng chứng thị giác desktop, không thay thế touch/GPU test trên tablet.
- Không dùng lại kết quả 3.767 test toàn repo trước đó làm số kiểm chứng cho bản sửa này. Workspace còn có phần lắp ghép đang được sửa song song nên lần này chỉ chạy bộ regression liên quan.

## Cơ sở tham khảo

- [Wheel Throwing in Cross Section — Ceramic Arts Network](https://ceramicartsnetwork.org/daily/article/wheel-throwing-in-cross-section/): mở lỗ trung tâm, chừa đáy, rồi mở và kéo thành. Dùng để kiểm tra thứ tự thao tác và hình cắt; game vẫn là mô phỏng trợ giúp, không dùng kích thước vật lý từ bài làm đơn vị trò chơi.
- [Skilled Opening — Joyce Michaud](https://ceramicartsnetwork.org/pottery-making-illustrated/pottery-making-illustrated-article/Skilled-Opening): khoảng rỗng, độ dày thành và đáy là các phần riêng cần được kiểm soát.
- [MeshStandardMaterial — Three.js](https://threejs.org/docs/pages/MeshStandardMaterial.html) và shader `aomap_fragment` trong Three 0.181.2 của repo: ambient occlusion giảm ánh sáng gián tiếp. Bản sửa dùng vertex exposure suy từ hình thay cho một texture AO cố định.

## Thứ tự còn cần hoàn thiện trước nghiệm thu v1

1. Nặn cốc/bát/lọ cổ hẹp từ đất bằng touch thật; điều chỉnh bắt đỉnh, smoothing theo thời gian, camera và trợ giúp.
2. Kiểm chứng nét vẽ seam/undo/rotating paint, 6 men trên 3 dáng; hoàn thiện hướng dẫn thao tác và chấm nhiệm vụ.
3. Phục hồi checkpoint, quota/conflict, đo gallery/journal lớn; kiểm tài khoản và hồ sơ qua giao diện.
4. Chốt vùng chạm, tier vật liệu; đo frame time/memory, thử offline và chơi thử trẻ em đúng checklist. Chỉ đánh dấu tiêu chí sau khi có bằng chứng tương ứng.
