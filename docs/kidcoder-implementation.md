# KidCoder — Biệt đội Rover: bàn giao v2

Ngày 08/09/2026. Đã triển khai tại local, chưa commit hoặc phát hành. Vào **Lập Trình Nhí → Biệt đội Rover** từ màn chọn chế độ.

## Phạm vi đã triển khai

| Phần | Hành vi hiện tại |
|---|---|
| Hành trình | 40 nhiệm vụ, 5 chương × 8 bài; mở lần lượt, chơi lại bài đã qua, tổng kết sau bài cuối |
| Trái Đất | Chuỗi lệnh, quay tại chỗ, lập kế hoạch và sửa góc quay sai |
| Mặt Trăng | Quét mẫu trước mặt, nhiều mục tiêu, phát hiện mẫu bị bỏ quên |
| Sao Hỏa | Lặp 2–6 lần, nhận ra quy luật, sửa số lượt và lặp lồng |
| Trạm băng tưởng tượng | Nếu/Không thì, cảm biến đường đi/mẫu mới; cùng chương trình chạy trên 2–3 tình huống ở các bài tổng hợp |
| Khu nghiên cứu | Bật thiết bị, mở cổng liên kết, đẩy kiện hàng và lắp cầu qua khe |
| Trình soạn thảo | Chạm/thêm bằng bàn phím, kéo lệnh từ bảng, đổi thứ tự, kéo nhóm, chọn vị trí chèn, nhân bản, xóa, hoàn tác/làm lại |
| Quan sát chương trình | Chạy, tạm dừng, tiếp tục, từng bước, xem bước trước, về đầu; tốc độ 0,5×/1×/2×; tô đúng khối đang chạy hoặc gây lỗi |
| Đồ họa | Rover 3D với bánh xe, hướng nhìn, tia quét; bàn 2D dùng cùng trạng thái; ba mức chi tiết, giảm chuyển động và âm thanh phản hồi |
| Hướng dẫn | Mục tiêu đầu bài, đọc tiếng Việt qua tiện ích giọng nói có sẵn, ba tầng gợi ý, giải thích từng lệnh, phản hồi lỗi cụ thể |
| Luyện tập | Worker tạo biến thể có seed từ bài đã mở/học; xoay/phản chiếu bản đồ, có lời giải được kiểm chứng; fallback sau 2 giây |
| Tiến độ | Tự lưu bản nháp theo học sinh; lưu thành tích ngay khi thắng; thưởng phần huy hiệu mới; giữ lịch sử và sao v1 |
| Động lực chơi | Ba huy hiệu mỗi nhiệm vụ, mốc mở rover sau 8/16/24/32 bài, đổi rover và sổ khám phá theo chương |

Trẻ có thể thử lại mà giữ chương trình, chạy chậm để hiểu lỗi và cải thiện huy hiệu. Mở chương/rover dựa vào hoàn thành nhiệm vụ, không buộc đạt đủ ba huy hiệu. Không có điều kiện thắng theo thời gian, phạt sao vì dùng gợi ý hay phần thưởng ngẫu nhiên trong KidCoder v2. Chế độ luyện tập không phát sao để tránh lặp màn kiếm thưởng.

## Tái sử dụng và tối ưu

- Adapter lấy mô hình công trình và bộ vẽ instancing của Xưởng hành tinh, kết hợp texture hành tinh hiện có. Không tải nguyên cảnh thị trấn vào một nhiệm vụ.
- Góc nhìn cố định giúp giữ ý nghĩa trái/phải; camera tự căn bàn theo kích thước viewport. Hiệu ứng vào bài hiện là chuyển cảnh phóng/thu bằng CSS và bảng giới thiệu, chưa phải camera bay liên tục từ quả cầu xuống mặt đất.
- Cảnh 3D tải qua lazy import, vẽ theo nhu cầu; animation dùng ref trong renderer, không cập nhật React mỗi khung hình. Worker dừng khi rời màn; timer/âm thanh và tài nguyên dựng hình được thu hồi theo vòng đời.
- Chế độ Nhẹ dùng DPR 1, không shadow map; Cân bằng DPR tối đa 1,5, shadow 1024; Đẹp hơn DPR tối đa 2, shadow 2048. Có tự giảm chất lượng khi đủ mẫu khung hình chậm và chuyển sang 2D khi WebGL báo lỗi.
- Điện thoại có thanh Chạy/Từng bước cố định cùng nút Xem bàn chơi/Sửa lệnh. Danh sách lệnh tự cuộn trong vùng soạn thảo; kéo gần mép vùng tự cuộn liên tục.
- Không thêm dependency. Các bộ dựng Solar System/Planet Workshop được dùng qua import, không sửa luật chơi hoặc dữ liệu của hai phân hệ này.

Giới hạn chương trình: 48 khối, hai tầng cấu trúc điều khiển, 256 thao tác thực thi có tính cả kiểm tra điều kiện/lượt lặp. Bộ giải có ngân sách thời gian và số trạng thái; dùng cùng luật di chuyển với gameplay, phân biệt hết ngân sách và vô nghiệm. Huy hiệu dựa trên ngân sách bài học, không tuyên bố chương trình ngắn nhất toàn cục.

## Lưu và tương thích

`StudentProfile.kidCoder` là trường tùy chọn, phiên bản 2. Thiếu trường này được hiểu là chưa có tiến độ chiến dịch; không đổi thành tích v1 thành kiến thức vòng lặp/điều kiện. Một nhiệm vụ có một bản ghi lịch sử `kidcoder-v2:<studentId>:<missionId>` và difficulty `v2:<missionId>`.

`completeKidCoder` lấy hồ sơ mới nhất, đánh giá chương trình, ghi snapshot bền vững rồi mới công bố cập nhật. Chơi lại chỉ trả phần huy hiệu chưa nhận; cải thiện lời giải không tăng lại số lần thắng. `starAwards` giữ ngày nhận từng phần thưởng, để sao kiếm hôm nay không bị gán về ngày thắng lần đầu. Thử ghi lỗi không đổi hồ sơ trong bộ nhớ; giao diện giữ kết quả để Thử lưu lại hoặc chủ động Rời bài, bỏ kết quả chưa lưu.

Bản nháp/tùy chọn dùng khóa riêng theo học sinh; giữ tối đa tám bản nháp gần nhất và ghi nốt khi rời màn. Trace chỉ nằm trong phiên chạy. Bảo đảm chống trùng áp dụng cho một cửa sổ ghi hồ sơ, chưa có transaction đồng thời giữa nhiều cửa sổ.

Đường quay lại v1 nằm ở cuối hành trình. Có thể đặt `VITE_KIDCODER_V2=false` khi build để mặc định mở bản cũ; giao diện vẫn có nút vào Biệt đội Rover. Không thay cấu hình môi trường trong lần triển khai này.

## Kiểm chứng

**Bộ tự động: 292 ca / 15 file đều qua**, trong đó KidCoder mới có 66 ca. Năm ca luyện tập lần lượt kiểm tra 1.000 seed/chương, tổng 5.000 seed.

- Cả 40 lời giải mẫu đạt mọi mục tiêu và ba huy hiệu; chương trình sửa lỗi ban đầu cần được sửa thật.
- Va chạm, quét mẫu, thiết bị/cổng, đẩy hộp/cầu, giới hạn chương trình và bộ giải; dữ liệu sai định dạng/có chu trình bị chặn trước đệ quy.
- Di chuyển nhóm, cấm thả nhóm vào chính hậu duệ, chỉ số đổi thứ tự, chèn/xóa ở nhánh Không thì.
- Chống thưởng trùng, cải thiện huy hiệu, ngày nhận thưởng, lỗi ghi rồi retry; giữ nguyên hồ sơ khác và vòng JSON/migrate với lịch sử v1.
- TypeScript và production build qua. Build còn cảnh báo chunk lớn và import tĩnh/động trùng ở những phần dùng chung của ứng dụng.

Kiểm tra trình duyệt bằng hồ sơ riêng do tác vụ tạo (đã xóa hồ sơ Kiểm thử Rover sau khi kiểm tra; giữ lại hồ sơ Khảo sát Xưởng có sẵn):

- Đã chơi qua chương Trái Đất, mở Mặt Trăng và rover Trăng Bạc; đổi rover, quét một/nhiều mẫu, khởi tạo Khảo sát tự do.
- Đã thử kéo đổi thứ tự, lỗi va chạm và tô đúng khối, hoàn tác, từng bước/xem bước trước, chuyển 3D/2D, chơi lại không cộng thưởng cũ, tải lại rồi chọn hồ sơ để tiếp tục.
- Fixture tạm dùng chính `ProgramEditor` và `useExecution`: soạn Lặp 4 lần chứa Nếu có mẫu thì Quét, chạy đạt ba tình huống của `ice-08`; thử giới hạn tầng thứ ba, thêm bằng Enter và hoàn tác. Fixture đã dọn, không tạo đường mở khóa dành cho QA trong sản phẩm.
- Viewport máy tính 1280×720, điện thoại 390×844 và tablet 768×1024: không tràn ngang; vùng Chạy/Từng bước nằm trong màn hình. Đây là mô phỏng viewport, không phải thử cảm ứng trên thiết bị thật.
- Trong lúc sửa các module context/types qua HMR đã có lỗi context và quay về trang chọn hồ sơ; đã tải sạch lại để tiếp tục kiểm tra. Không tính những lần cập nhật mã trực tiếp đó là một phiên QA sạch. Cần dùng URL có base path đầy đủ `/Genius-kids/` khi mở ứng dụng trên Vite.

Số đo minh họa trên trình duyệt local, bài đầu chương Trái Đất, mức Cân bằng: khoảng **22 draw calls, 1.818 tam giác, 22 geometry, 2 texture**, p95 khung hình mẫu khoảng **17,9 ms**. Đây là snapshot từ `renderer.info`/animation, chưa đo đầy đủ tổng shadow pass, bộ nhớ GPU hoặc bài nặng trên Android. Chunk riêng ở build cuối: trang KidCoder khoảng 83,94 KB raw/26,94 KB gzip (gồm đường v1), renderer 3D 8,3 KB, Worker 16,8 KB; thư viện R3F dùng chung vẫn là chunk lớn. Không diễn giải các số này thành tổng chi phí tải cả ứng dụng.

Lệnh tái kiểm tra:

```powershell
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
```

## Phần cần kiểm chứng hoặc mở rộng tiếp

M0–M4 đã có phần triển khai tương ứng. M5 hoàn tất kiểm tra kỹ thuật tại local; nghiệm thu thiết bị thật, quan sát trẻ chơi và phát hành chưa thực hiện.

1. Thử cảm ứng trên tablet Android thật và máy GPU tích hợp: kéo nhóm dài, chuyển cảnh liên tục, bài nặng, FPS/p95 và lỗi WebGL. Luồng fallback có trong code, chưa ép mất WebGL context trong đợt kiểm tra trình duyệt này.
2. Quan sát trẻ 6–11 tuổi chơi 12 bài đầu: tỷ lệ tự hoàn thành, thời điểm cần người lớn giúp, hiểu trái/phải và vòng lặp, nơi bỏ cuộc. Thời lượng 3–8 phút/bài và khả năng giữ chân là mục tiêu, chưa phải kết quả nghiên cứu người dùng.
3. Năm rover hiện là các phối màu/tên trên cùng bộ hình, sổ khám phá hiện tổng hợp kiến thức lập trình theo chương. Có thể bổ sung dáng rover khác nhau và nội dung khám phá riêng cho từng bài sau thử chơi.
4. Chưa có bài kiểm tra nhanh để vượt phần nhập môn, zoom camera thủ công hoặc luồng xuất/nhập hồ sơ toàn ứng dụng mới. Đã kiểm tra schema qua JSON/migrate; không tuyên bố đã thử một giao diện sao lưu hồ sơ vốn chưa có.
5. V2.1: nhiệm vụ từ bản chụp thị trấn cá nhân, trình tạo bài, hàm do trẻ đặt tên, nhiều rover phối hợp. Các phần này giữ ngoài phạm vi v2 theo kế hoạch ban đầu.

Tham chiếu: [kế hoạch thiết kế](D:/Quyetnm/Dev/mathgenius-kids/docs/kidcoder-remake-plan.md). Mã chính nằm trong `games/KidCoder/{engine,content,editor,session,rendering,generation,progress}` và `KidCoderAdventure.tsx`; tích hợp qua trang KidCoder, StudentContext, profileService và kiểu hồ sơ.
