# Giai Điệu Vui Nhộn — Ban Nhạc Tí Hon

Ngày triển khai: 08/09/2026. Bản mới là mặc định tại Games → Giai Điệu Vui Nhộn; chưa commit hoặc triển khai lên hosting.

## Phạm vi đã làm

- 24 nhiệm vụ biên soạn, 4 chương, mỗi bài 3 câu. Biến thể seed phản chiếu toàn bộ motif, giữ cấu trúc câu nhạc. Bắt đầu 4 phím và 2 nốt; mở phím thứ năm, câu dài, nhịp nghỉ, hai âm gõ và chuỗi nửa nhịp. Chương cuối chuyển lần lượt giữa giai điệu và nhịp.
- Nghe và đáp lại không chấm tốc độ. Sai giữ nguyên câu, không mất lượt; nghe lại, nghe chậm cùng cao độ, nghe từng nhóm có khoảng nghỉ và đèn chỉ nốt kế tiếp. Hướng dẫn vẫn hoàn thành/mở bài tiếp theo. Không tính một lần nghe lại hoặc gián đoạn kỹ thuật là một câu trả lời sai.
- Gõ nhịp có nghe mẫu, đếm chuẩn bị 4 nhịp, dòng thời gian chỉ tiếng gõ và khoảng nghỉ. Từng lần chạm chỉ ghép tối đa một mục tiêu; tiếng thừa và thiếu đều ảnh hưởng kết quả. Cửa sổ tối đa ±180 ms, thu hẹp theo khoảng cách giữa hai mục tiêu. Không xác định được đồng hồ đầu ra thì chuyển sang luyện theo đèn, không chấm độ chính xác thời gian.
- Phòng sáng tác mở ngay: 8 ô, 5 cao độ, ô nghỉ, chọn/xóa nốt, tốc độ 60–120 BPM, phát/dừng và con trỏ. Sau 12 bài mở chuông; sau 18 bài mở trống/vỗ tay; sau 24 bài mở phím mềm và 16 ô. Bảng 16 ô chia hai trang, mỗi trang 8 ô; màn nhỏ cuộn ngang để giữ ô chạm tối thiểu 44 px.
- Đặt tên, hoàn tác 40 bước, xóa hàng, nhân bản, bản nháp tự giữ, mở/xóa bài; tối đa 12 bản nhạc mỗi hồ sơ. Thay bản đã lưu hoặc xóa bài đều có xác nhận. Khi tủ đầy phải chọn bài thay; không tự loại bài cũ. Không dùng microphone, không gửi bản nhạc ra ngoài.
- Sân khấu SVG riêng với Cáo, Gấu và Thỏ; chọn Đêm đầy sao, mở Khu vườn sáng sau 6 bài và Lễ hội âm nhạc sau 24 bài. Phím có màu/ký hiệu/tên nốt/số bàn phím; hỗ trợ giảm chuyển động. Bàn phím 1–5, Enter/Space; mỗi lần nhấn tạo một nốt, giữ phím không tự lặp.

## Âm thanh

`audio/voices.ts` tạo PCM tại sample rate của thiết bị cho ba âm sắc riêng: đàn gỗ (thành phần va chạm và họa âm tắt nhanh), chuông (họa âm ngân khác nhau), phím mềm (họa âm và dao động lệch tần nhẹ). Trống dùng đường cong hạ cao độ; vỗ tay dùng các cụm nhiễu ngắn đã làm dịu. Các tiếng này được tổng hợp từ mã nguồn của dự án, không cần thư viện/sample tải ngoài.

`AudioSession` chỉ tạo/resume AudioContext từ thao tác người dùng và chờ thành công. Buffer được chuẩn bị một lần, dùng lại cho nghe mẫu, nhập nốt, thử tiếng và sáng tác. Mỗi câu nghe mẫu/đáp lại dùng cùng âm sắc.

- Scheduler chạy mỗi 20 ms, nhìn trước 120 ms và đặt thời điểm nguồn bằng đồng hồ AudioContext. Đèn theo `getOutputTimestamp()` khi có dữ liệu hợp lệ; giao diện không chịu trách nhiệm phát từng nốt bằng timeout.
- Nhập dùng thời điểm của pointer/keyboard event, ánh xạ sang đồng hồ đầu ra, có offset hiệu chỉnh. Hiệu chỉnh gồm 4 nhịp chuẩn bị + 8 lần gõ, cần ít nhất 6 mẫu hợp lệ và loại bỏ dữ liệu quá phân tán; có đặt lại và chỉnh tay ±250 ms. Đây không phải bảo đảm độ trễ đồng nhất cho mọi thiết bị.
- Giới hạn 16 nguồn đang được quản lý; envelope đầu/đuôi, fade khi dừng, compressor và mạch giới hạn đỉnh mềm. Dừng hủy scheduler/cue và gọi stop từng nguồn, thay vì chỉ giảm volume.
- Trễ lịch phát đáng kể, context suspend, chuyển tab, đổi thiết bị âm thanh, mở cài đặt hoặc mute giữa bài đều dừng câu. Chơi tiếp bắt đầu lại câu hiện tại/đếm nhịp, giữ các câu đã xong. Phòng sáng tác cũng dừng khi tab ẩn.
- Tôn trọng mute toàn ứng dụng; nhạc nền của route dừng khi vào game và khôi phục khi thoát. Có âm lượng riêng và nút thử cả ba nhạc cụ. Không dùng tiếng buzz phạt sai.
- Tắt tiếng cần chọn rõ “Nhìn và gõ”/“Nhìn và nhớ”; kết quả được đánh dấu luyện bằng hình. Biểu diễn sau kết quả có thể bỏ qua; điểm đã được lưu trước khi nghe phần này.

## Dữ liệu và phần thưởng

`StudentProfile.soundMemory` version 2 giữ tiến độ, best theo solo/guided/visual và tối đa 12 compositions. `GameResult.sound` chứa metadata nhất quán của một lượt, không trộn điểm của lượt tự chơi với thông tin lượt có hỗ trợ. Draft và cài đặt dùng khóa riêng theo studentId; xóa hồ sơ cũng dọn các khóa âm nhạc của hồ sơ đó.

24 nhiệm vụ × tối đa 3 sao = 72 sao cơ bản. Lượt sau chỉ nhận chênh lệch sao tốt hơn, lịch sử có một bản ghi mỗi nhiệm vụ và `starAwards` ghi ngày cải thiện. Thành tựu chung vẫn dùng dịch vụ hiện có, trình bày cùng màn kết quả. Chơi tự do/sáng tác không cộng tiền sao hoặc gián tiếp tăng bộ đếm thắng/thành tựu. Dữ liệu các game và lịch sử SoundMemory cũ được giữ.

Adapter ghi hồ sơ thành công trước khi công bố phần thưởng. Lỗi ghi không thay đổi snapshot hồ sơ; màn kết quả giữ nút thử lưu lại và cảnh báo khi rời kết quả chưa lưu. Snapshot chỉ có dữ liệu trò chơi, không lưu AudioContext/source/thời gian audio tuyệt đối. Phạm vi nhất quán là một cửa sổ đang ghi hồ sơ; chưa bổ sung khóa giao dịch đa cửa sổ cho toàn ứng dụng.

## Kiểm chứng

Các kiểm tra tự động bao phủ toàn bộ 24 nhiệm vụ/seed, thứ tự và nốt lặp, dừng/khôi phục, hỗ trợ, chấm nhịp/biên thời gian/tiếng thừa, PCM/cao độ/đuôi âm, scheduler và hủy nguồn, resume thất bại, giới hạn nguồn, ánh xạ thời gian, hiệu chỉnh, lưu lỗi/thử lại, cô lập hồ sơ, thưởng chênh lệch, dữ liệu cũ và giới hạn thư viện.

Đã kiểm tra trong trình duyệt của ứng dụng:

- Tạo hồ sơ QA riêng; hoàn thành 3 câu, cập nhật sao và mở bài tiếp theo; refresh giữa câu 2 vẫn giữ câu 1, bắt đầu nghe lại câu 2.
- Thử 3 nhạc cụ, nghe lại/chậm/hướng dẫn, nhập bằng chuột/số bàn phím/Enter. Hai lần Enter trên cùng nốt cho đúng hai sự kiện riêng; lần đầu chỉ tiến 1/2.
- Gõ đúng 4/4 mục tiêu theo dòng nhịp; không gõ cho kết quả 0/4. Tắt tiếng giữa demo dừng câu; lựa chọn luyện bằng hình hiển thị rõ.
- Tạo và phát bản nhạc, đặt tên/lưu, hoàn tác rồi ghi đè có xác nhận. Fixture cô lập kiểm tra 16 ô, đủ 3 hàng, 12 bài, chọn thay bài, xóa bài có xác nhận và kết quả lỗi ghi → thử lại chỉ có 3 sao/1 bản ghi.
- Desktop 1280×720, màn nhỏ 390×844; bảng sáng tác có ô 44×48 px và cuộn trong vùng soạn, không làm rộng trang. Giảm chuyển động có quy tắc CSS riêng, vẫn giữ đèn/chỉ nhịp.
- Kiểm tra đổi sân khấu Khu vườn/Lễ hội khi mở khóa và trạng thái khóa trên hồ sơ mới. Trang mới sau khi chốt mã không có lỗi runtime trong log. Hồ sơ QA và fixture tạm đã được dọn; hồ sơ có sẵn của Đại ca được giữ.

Đã render offline trong trình duyệt bằng **cùng mạch output thực tế** ở 48 kHz, 384.000 mẫu (8 giây):

| Mẫu kiểm tra | Peak tuyến tính | RMS | Đuôi âm cuối | NaN/Infinity |
|---|---:|---:|---:|---|
| Motif lần lượt qua 3 nhạc cụ | 0,3964 | 0,08976 | 0 | Không |
| Stress: nhân 16 nguồn cho mỗi nốt của motif | 0,8633 | 0,46635 | 0 | Không |

Stress này cố tình dày hơn cách giới hạn nguồn trong game; mạch giới hạn đỉnh vẫn giữ tín hiệu dưới 1. Các phép đo và thao tác trình duyệt xác minh tín hiệu/lịch phát, **không thay thế nghe đánh giá trên loa, tai nghe hoặc thiết bị vật lý**.

## Giới hạn và bước kiểm chứng ngoài môi trường hiện tại

- Chưa nghe đánh giá chủ quan trên loa/tai nghe của Đại ca; chưa chạy thiết bị Android, iPhone/Safari, Bluetooth thật hoặc khảo sát trẻ. Cần kiểm tra độ dễ phân biệt âm sắc, mức âm lượng, độ trễ cảm nhận và nhịp mặc định ở các thiết bị đó.
- Bản hiện tại dùng nhạc cụ tổng hợp, không dùng bản thu nhạc cụ thật. Có thể thay từng patch bằng sample đã được tuyển chọn sau vòng nghe thử, giữ nguyên lịch phát và cơ chế nhập.
- Phần thưởng hiện tại tập trung vào âm sắc, thành viên hiển thị, khả năng sáng tác và ba sân khấu. Retention cần được đo bằng quan sát chơi; không khẳng định đã được chứng minh.
- Công tắc `VITE_SOUND_V2=false` hoặc “Mở phiên bản cũ” để so sánh/rollback. Các giới hạn và lỗi lịch sử của luồng SoundMemory cũ vẫn thuộc bản cũ; bản mới không đi qua callback thưởng cũ.

## Lệnh kiểm tra

```powershell
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
```

Kết quả cuối: **TypeScript pass; 378 tests / 20 files pass**, trong đó **37 tests mới** thuộc SoundMemory; **build production + PWA pass**, `git diff --check` pass. Chunk SoundAdventure riêng khoảng 49,44 kB JS (16,85 kB gzip) và 20,77 kB CSS (5,20 kB gzip); không thêm thư viện runtime. Build còn các cảnh báo chunk lớn và static/dynamic import đã có ở các phân hệ khác.
