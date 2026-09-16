# Rà soát độc lập ba hoạt động alphabet — 16/09/2026

## Kết luận

**PARTIAL — chưa đạt nghiệm thu toàn bộ kế hoạch.** Có ba trò chạy được luồng cơ bản, tài nguyên và tích hợp lưu thưởng; tuy nhiên các gate về audio, khôi phục phiên, trợ giúp, chọn câu theo tiến độ và QA chưa đạt. Kết luận DONE trong lượt triển khai trước và lời bàn giao trước đó quá mức bằng chứng.

Phạm vi review: đối chiếu `docs/alphabet-activities-upgrade-plan.md` với code hiện tại, chạy test hiện có, probe logic bằng module thực, xem contact sheet và kiểm tra UI preview. Không sửa mã sản phẩm trong lượt review; chỉ thêm bằng chứng và sửa trạng thái tài liệu.

## Phát hiện theo ưu tiên

### R1 — P1: trò nghe cho chấm khi audio lỗi, và báo lỗi cả khi phát thành công

- Vị trí: `src/components/preschool/alphabet-games/LetterTrainGame.tsx:19`; `src/utils/speech.ts:255,274,298`.
- `hear()` gán `heard = speak(...)` ngay lập tức. Giá trị `true` chỉ cho biết đã lên lịch/khởi động một đường phát; lỗi bất đồng bộ không đặt lại `heard`.
- `speak()` gọi `onError` khi caller chỉ truyền `onError`, kể cả khi âm thanh kết thúc bình thường. Chuỗi bên dưới còn gộp kết thúc thành công và lỗi vào cùng callback. Đây là contract cũ đã được plan cảnh báo, nhưng trò mới vẫn dùng trực tiếp mà không có adapter phân biệt kết quả.
- Preview: vào menu → Nghe và chọn chữ → Chơi nào. Câu 1 có F/G/U/C; UI hiện “Cáo chưa đọc được. Bé chạm nút nghe lại nhé.” Chọn F → soát vé vẫn nhận “Vé này chưa đúng”, tức lỗi audio không ngăn chấm. Không thể suy ra đã nghe được hay chưa chỉ từ thông báo này.
- Probe riêng mô phỏng audio kết thúc thành công: `onError` vẫn được gọi. Mô phỏng fallback lỗi: `speak()` đã trả `true` trước khi lỗi xảy ra.
- Vi phạm §3.3, P04, P14, P15, L04. Cần trạng thái pending/success/error/cancel, chỉ chấm sau success của đúng câu; kiểm tra lỗi và nghe lại trước khi nghiệm thu.

### R2 — P1: không có checkpoint và không thể thử lưu lại phiên đã hoàn thành

- Vị trí: `AlphabetPracticeGame.tsx:23–29`, `AlphabetActivityFrame.tsx:37–38`, schema `progress.ts:3`.
- Chỉ tạo session và gọi lưu ở cuối phiên. Mỗi câu trước đó nằm trong React state/ref, không có draft/current round để resume. Refresh hoặc Back giữa phiên mất toàn bộ phần đang làm.
- Khi ghi lỗi, `finishing` đã khóa; UI chỉ có Chơi chuyến mới/Về Bảng Chữ Cái. Câu “về menu rồi thử lại” không cứu kết quả đã làm và không có thao tác retry lưu cùng session.
- Adapter trả lỗi mà không ghi đè snapshot là đúng, nhưng không thay thế được luồng phục hồi sản phẩm.
- Vi phạm §7.1–7.2, P03, C08/C09. Cần checkpoint theo owner/session/round, giữ completion payload và kết quả thưởng khi retry, nút Thử lưu lại, kiểm chứng reload/save failure.

### R3 — P2: chuyển câu cắt chuỗi phát âm tên và nghĩa

- Vị trí: `WordBasketGame.tsx:22,30`, `LetterPostGame.tsx:22,26`.
- Giỏ đồ phát tên tiếng Anh rồi nghĩa tiếng Việt nhưng chuyển sau đúng 800 ms. Câu mới gọi `speakSequence` sau 260 ms; hàm này hủy chuỗi cũ. Bất kỳ chuỗi tên/nghĩa dài hơn khoảng 1,06 giây sẽ bị ngắt khi câu mới bắt đầu.
- Bưu điện cũng chuyển bảng sau 900 ms mà không đợi đọc xong. Không có trạng thái paused khi document hidden trong ba trò.
- Vi phạm §3.1–3.2, P04, C07. Cần đợi phản hồi tối thiểu và audio settle của đúng round, xử lý timeout lỗi riêng, hủy/pause khi đổi trang.

### R4 — P2: hai trò Giỏ đồ/Bưu điện thiếu trợ giúp sau hai lần sai

- Vị trí: `WordBasketGame.tsx:18–29`, `LetterPostGame.tsx:19–23`.
- Chỉ Ga tàu có nút Cáo giúp bé. Hai trò còn lại tăng số sai, lặp thông báo bằng chữ, không có hành động chỉ đáp án; outcome luôn `assisted: false`.
- Hướng dẫn menu/intro bằng hình đã được thêm, nhưng chưa giải quyết khi trẻ không biết làm tiếp trong câu cụ thể.
- Vi phạm §3.3, P08/P11, C10. Cần trợ giúp bằng hình/giọng cho đúng vật/thư và ghi assisted.

### R5 — P2: chọn câu chưa dùng tiến độ; thiếu giao diện ôn chữ

- Vị trí: `sequence.ts:7–31`, `AlphabetPracticeGame.tsx:17`, `PreschoolShell.tsx:21–35`.
- Các builder chỉ nhận seed/level/fixed, không nhận progress hoặc explored. Câu được shuffle đều; chưa có trọng số chữ cần ôn, chữ đã khám phá hoặc nhóm dễ nhầm theo mức.
- Menu không hiện tiến bộ riêng ba kỹ năng; intro chỉ có tổng x/26, không có bản đồ theo chữ hay nút Ôn chữ cần luyện.
- `lastScene` được lưu nhưng `sceneUrl` chỉ lấy seed % 3, nên có thể lặp ngay cảnh trước.
- Vi phạm §7.1, P02/P08/P16. Dòng tracker “adaptive DONE” không được code hỗ trợ.

### R6 — P2: badge “tự làm được” được trao chỉ sau một phiên

- Vị trí: `progress.ts:19`.
- `mastered` kiểm tra ≥3 lần độc lập và hai lần gần nhất; không lưu/kiểm tra số phiên khác nhau.
- Probe: một session có ba câu A đúng độc lập đã trả `true`. Chế độ chọn riêng chữ cho phép lỗi này xảy ra qua luồng bình thường.
- Plan §7.1 yêu cầu ba lần ở ít nhất hai phiên. Cần giữ bằng chứng theo session và test một phiên chưa đủ.

### R7 — P2: mức chơi và lựa chọn luyện riêng chưa khớp đặc tả

- Vị trí: `sequence.ts:15,25–26`.
- Probe mức Tự thử, seed 0: câu C có ba đáp án car/cake/cat; plan quy định đúng hai vật trong bốn lựa chọn.
- Chọn luyện riêng A ở Bưu điện, seed 7, Thử thách: bảng 1 `[a,i,w,z,n]`, bảng 2 `[y,g,t,s,v]`. Chữ được chọn biến mất ở nửa sau phiên.
- Build Bưu điện chưa tạo nhóm b/d, p/q, m/n, u/v theo mức; mới đổi số cặp. Ngoại lệ X chạy được nhưng chưa có lời báo “Luyện với xylophone”.
- Vi phạm §3.1 và §4.1–4.2. Cần assertion nội dung theo mức, cố định target xuyên phiên, kiểm thử các nhóm dễ nhầm.

### R8 — P2: có chín file nền nhưng một số sai bối cảnh đã chốt

- Bằng chứng: `scenes-contact-sheet.webp`, `public/preschool/alphabet-games/scenes/manifest.json`.
- `word-beach` là cánh đồng có mặt trời; `match-snowy-village` là lâu đài nữ hoàng không có tuyết; `pick-seaside` là ao cá. Các ảnh khác nhau và nhỏ gọn, nhưng không đủ để xác nhận ba bộ bối cảnh như đặc tả.
- Phần lớn là tái dùng cảnh học chữ có vật/nhân vật lớn trong nền. Cần review lại khả năng gây nhầm vật tương tác thay vì coi đủ file là đạt art gate.
- Vi phạm §4/5.2, P07/P10/P13. Cần tài nguyên đúng cảnh hoặc thay đổi phạm vi được ghi nhận rõ; đổi tên file không giải quyết yêu cầu hình ảnh.

### R9 — P2: QA/tracker DONE không có đủ bằng chứng theo matrix

- Bộ test mới có 16 test; không có test audio lifecycle, React interactions, pointercancel, checkpoint/resume hoặc save retry. Test “corrupt values” chỉ kiểm tra null; “reviewed entries” kiểm tra số lượng/chuỗi, không xác nhận ảnh đã review.
- QA cũ ghi mobile 320/390, desktop 880; chưa có bằng chứng đầy đủ 768/1366/landscape, zoom 200%, keyboard end-to-end, lỗi ảnh, audio blocked, production offline/update. Counting/Colors chỉ smoke learn/menu, chưa phải hai trò pick cần regression.
- Danh sách QA có 11 screenshot giao diện, trong khi plan yêu cầu ít nhất 24 ảnh có trạng thái/viewport cụ thể.
- Không phủ nhận các test/build cũ đã chạy. Tuy nhiên chúng không chứng minh các gate chưa kiểm tra, đặc biệt khi R1 đã tái hiện.
- Vi phạm P17/P18 và quy tắc PASS/FAIL/NOT RUN của §9. Cần ghi từng case và bằng chứng, sửa lỗi trước khi mở lại nghiệm thu.

## Kiểm tra đã chạy trong review

| Kiểm tra | Kết quả |
|---|---|
| Vitest `alphabetGames.test.ts` hiện có | 16/16 PASS; cần quyền chạy ngoài sandbox vì Vite ghi cache bị EPERM |
| `node node_modules/typescript/bin/tsc --noEmit` | PASS, exit 0 |
| `node docs/qa/alphabet-activities/review-probes.mjs` | Tái hiện R1, R6, hai ví dụ R7; chạy module TS thật trong VM, mock thiết bị audio; không ghi hồ sơ |
| Browser menu → Ga tàu → câu đầu báo audio lỗi → chọn F → soát vé | Vẫn chấm sai; xác nhận R1 qua UI |
| Contact sheet 9 nền | Xác nhận R8 bằng xem ảnh |
| Full suite / production build mới | NOT RUN; không sửa source sản phẩm và đã có kết quả lịch sử, ưu tiên kiểm chứng các lỗ hổng chưa được test |

Preview được trả về menu ban đầu. Không hoàn thành phiên/trao sao trong review; không sửa hồ sơ hoặc thao tác Flow.

## Thứ tự cần xử lý trước nghiệm thu lại

1. R1 + R3: adapter audio và vòng đời câu; thêm kiểm thử thành công/lỗi/hủy/chậm.
2. R2: checkpoint, owner/session guard, retry lưu cùng kết quả; test reload, save lỗi, callback cũ.
3. R4 + R6 + R7: trợ giúp, badge đúng quy tắc, mức và target cố định.
4. R5: chọn chữ cần ôn, hiển thị tiến độ theo kỹ năng/chữ, tránh lặp cảnh.
5. R8: bối cảnh đúng yêu cầu và phản hồi hình ảnh; giữ phần sửa nhà đứng thẳng theo yêu cầu mới của Đại ca.
6. R9: chạy đầy đủ matrix với bằng chứng thực tế rồi mới đổi từng gate sang DONE.

Các điểm cần kiểm chứng thêm, chưa gán lỗi đã tái hiện: đổi profile ngay trong callback feedback (entry chưa key theo student và owner lấy tại finish), đa chạm/pointercancel/drop+click, save retry có giữ nguyên quà ngẫu nhiên, PWA offline với thiếu voice. Không coi NOT RUN là PASS.
