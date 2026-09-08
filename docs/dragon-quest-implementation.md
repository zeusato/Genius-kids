# Đại chiến rồng thần — bản triển khai theo luật bàn cờ cũ

Cập nhật 08/09/2026. Đã sửa thiết kế chọn nhánh trước đó theo phản hồi của người dùng. Bản mới mở mặc định từ Games → Đại Chiến Rồng Thần; luật cũ được đối chiếu trực tiếp trong `games/DragonQuest/engine/`.

## Gameplay đã sửa

Toàn bộ 50 ô xuất hiện trên cùng bàn cờ ngay từ đầu, số 01–50 theo đường zíc zắc. Gieo xúc xắc 1–6 rồi tiến từng ô, chỉ ô dừng kích hoạt sự kiện. Ô thường gieo tiếp; quái vật hỏi một câu; nàng tiên hỏi một câu để nhận buff ngẫu nhiên; cạm bẫy dịch chuyển −8 đến +8 và xử lý tiếp ô đích; boss ở ô 50. Không chọn đường hoặc nhấn ô để di chuyển.

Dùng lại `generateMap`, `rollDice`, `calculateTeleport`, `getRandomBuff`, `calculateBossQuestions`, `addBuff` và hằng số engine cũ. Phân bố 19 quái vật / 9 buff / 7 dịch chuyển / 14 thường / 1 boss; ba máu; điểm đúng tương ứng 10/15/20. Sai quái vật/boss mất một máu, sai nàng tiên không mất máu. Kiếm Thánh giảm số câu boss tối đa hai; Chén Thánh hồi một máu tối đa ba lần; Áo Choàng Bay ngăn dịch chuyển lùi, không tiêu hao.

Boss có 5 trừ số kiếm, tối thiểu 3 câu. Đúng và sai đều tiêu thụ một câu; hết máu thì thua, còn máu khi hết câu thì thắng. Huy chương Vàng/Bạc/Đồng theo 3/2/1 máu. Sửa trường hợp dịch chuyển 0/đích không đổi để trả lượt gieo, tránh vòng lặp đứng yên.

## Đồ họa và UI

- Giữ 5 vùng/20 màn, mỗi màn dùng đủ bàn 50 ô. Camera 3D cố định toàn cảnh, không cắt mất những ô chưa đến. Ô đánh số, có màu và ký hiệu sự kiện cùng chú giải; ô đích đổi màu, ô hiện tại có vòng đánh dấu.
- Hero đi theo từng bước xúc xắc; hoạt ảnh idle/walk/cast/hit/celebrate; rồng boss, bạn đồng hành và tiên/quái vật tại sự kiện. Bảng câu hỏi dùng minh họa đúng nhân vật gặp, hiển thị HP, điểm, lượt gieo và buff đang sở hữu.
- 50 ô dùng một instanced mesh; nhãn dùng một canvas atlas + mesh chung. Cảnh vật instanced, GLB dùng chung khoảng 3.23 MB trước nén; ba chất lượng/DPR giới hạn, demand rendering, pause/ẩn tab, giảm chuyển động, hạ quality và fallback 2D khi lỗi WebGL. Bản 2D cũng hiển thị đủ 50 ô và dùng chung luật.
- DOM cho câu hỏi/bàn phím/TTS, đọc xong mới đếm giờ trong chế độ Thử thách. Chế độ mặc định không đếm ngược. Sai được xem đáp án rồi gieo tiếp; không tự hồi máu hoặc bắt giải lại ô vừa sai.

## Toggle AI và dữ liệu

Công tắc **Ra đề bằng AI** ở màn xuất phát. Ứng dụng tự tạo prompt và nhận danh sách cho 33 slot: 19 quái vật, 9 nàng tiên, 5 câu boss. Không có ô nhập prompt/JSON. Bộ kiểm tra tự tính đáp án, kiểm tra lớp/loại câu, slot trùng/thừa, nội dung không hợp lệ. Một lượt sửa phần thiếu, hạn chờ tổng 25 giây; bù local nếu lỗi. Nguồn `ai`/`mixed`/`local` được ghi đúng.

Đi ngang ô không hỏi; đi lại ô cũ dùng bộ đề đã gán với encounter mới. Gieo/dịch chuyển/tiếp tục không gọi AI thêm. Snapshot version 3 giữ map, batch, xúc xắc, vị trí, lượt RNG, buff và từng lần trả lời. Không tiếp tục snapshot thiết kế chọn nhánh version 2; có thông báo, giữ lịch sử/tiến độ màn đã hoàn thành.

Chiến dịch vẫn thưởng 3 sao lần đầu mỗi màn, tổng 60, chống cộng trùng; huy chương theo máu là kết quả trận riêng. Lịch sử ghi điểm trận và maxScore danh nghĩa 300 giống bản cũ; số câu tự giải/trợ giúp lưu riêng. Ghi hồ sơ thành công trước khi hiển thị đã nhận thưởng; có thử lại khi lưu lỗi. Bản cũ vẫn mở qua Cài đặt hoặc `VITE_DRAGON_V2=false`.

## Kiểm chứng bản sửa

- TypeScript `tsc --noEmit`: qua.
- Toàn bộ Vitest: **407 test / 22 file**. Gồm 27 test adventure và engine cũ; phân bố/map giống cũ, mọi giá trị xúc xắc, bước di chuyển/ô dừng, HP/buff/điểm, teleport/áo choàng, boss cả đúng và sai, revisit, pause/timeout/stale event, snapshot và 20 màn hoàn chỉnh.
- 33 slot hợp lệ trên 20 màn × 6 lớp × 4 chủ đề × 3 độ khó. AI hợp lệ/sai/sửa thiếu/hủy/timeout/phản hồi muộn; ghi lỗi/retry và trần thưởng.
- Trình duyệt: bàn 3D nhìn thấy đủ số 01–50; bật toggle AI fixture tạo đúng một request rồi vào ván với nguồn AI, có nút Gieo xúc xắc.

Fixture dev: `/Genius-kids/dragon-preview.html`, hồ sơ riêng; kết quả chiến dịch giữ trong bộ nhớ, không phải production entry. Chưa dùng khóa AI thật để nghiệm thu API nhà cung cấp. Chưa đo thiết bị di động vật lý hoặc thử chơi với trẻ; không suy ra hiệu quả học/giữ chân từ kiểm thử kỹ thuật.

Nguồn chi tiết: [luật và thiết kế](dragon-quest-remake-plan.md), [contract AI](dragon-quest-ai-question-template.md).

### Kiểm tra giao diện sau khi khôi phục luật

- Ván AI fixture: đúng một request; gieo 4 từ ô 01 tới ô 05 (cạm bẫy), tiến 2 tới ô 07 (cạm bẫy khác), lùi 1 tới ô 06 (nàng tiên). Đi ngang ô quái vật không mất máu/không mở câu hỏi.
- Trả lời đúng đồng hồ tại ô 06: +15 điểm, nhận Kiếm Thánh 1/2. Lưu/về bản đồ rồi tiếp tục giữ ô 06, điểm 15, một lượt gieo và kiếm; requests vẫn 1.
- Gây mất WebGL qua fixture: chuyển 2D giữ nguyên ván; đếm đủ 50 nhóm ô có nhãn. Gieo tiếp tới ô 11 kích hoạt quái vật.
- Đã xem trực tiếp desktop và 390×844; tăng kích thước số ô/camera để bàn tận dụng chiều rộng trên điện thoại. Không tràn ngang tại viewport 390. Cảnh sự kiện 3D đo 48 draw calls / 39.564 tam giác ở cấu hình fixture, p95 20,3 ms trên 69 mẫu hoạt động; chỉ là số đo máy phát triển.
- Production build đã qua, tạo service worker và precache; còn cảnh báo chunk lớn của ứng dụng.
- Đã trả lời sai câu hình tại ô quái vật trên 2D: mất đúng một tim, điểm giữ nguyên 15, được gieo lượt tiếp; không bắt thử lại, không hồi máu miễn phí.
- Lối vào Games → Đại Chiến Rồng Thần trên hồ sơ QA sẵn có mở bản bàn cờ mới; tiến độ 3 sao/chặng đã hoàn thành được giữ và có thể bắt đầu chặng kế tiếp.
