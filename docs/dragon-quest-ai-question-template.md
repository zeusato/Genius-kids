# Dragon Quest — tự tạo câu hỏi AI cho bàn 50 ô

Cập nhật 08/09/2026. Contract đang chạy: `games/DragonQuest/adventure/ai.ts`, `questions.ts`, `content.ts`. Gameplay tuân thủ [luật bàn cờ](dragon-quest-remake-plan.md).

## Luồng người chơi

Ở màn xuất phát, bật/tắt **Ra đề bằng AI**, chọn nội dung và độ khó. Lớp lấy từ hồ sơ. Bấm **Lên đường** mới gọi sinh câu hỏi. Người dùng không nhập prompt hoặc JSON. Ứng dụng dùng cấu hình kết nối AI có sẵn; chưa kết nối thì có thể mở cài đặt hoặc chơi với câu hỏi local.

Trong lúc chuẩn bị có Hủy và Chơi ngay với câu hỏi có sẵn. Bắt đầu ván khi đã gán đủ câu hợp lệ; kết quả đến muộn không thay câu trong ván.

## Gán câu vào bàn

Map do engine cũ sinh, gồm 50 ô và toàn bộ ô hiện ngay từ đầu. Danh sách slot gồm một câu cho mỗi ô quái vật (19), một câu cho mỗi ô nàng tiên (9), năm câu boss ở ô 50: tổng 33. Kiếm Thánh có thể giảm số câu boss thực tế xuống 3–4; vẫn chuẩn bị đủ năm câu từ đầu. Ô thường/dịch chuyển không tạo slot.

Slot ID là `tile-{index}:{bossPhase}`, index 0–49. Prompt nhận slotId, taskKind, context/nodeId, tileNumber 1–50 và bossPhase. Khi gieo xúc xắc, chỉ ô dừng kích hoạt câu hỏi đã gán. Đi ngang không hỏi. Dịch chuyển về ô đã gặp tái sử dụng câu hỏi với một encounter mới để chống sự kiện trả lời cũ/trùng.

AI không quyết định map, số bước, loại ô, buff, điểm, luật boss hay phần thưởng.

## Request và kiểm tra

`promptVersion: 2`; JSON phản hồi `schemaVersion: 1`:

```json
{"schemaVersion":1,"questions":[{"slotId":"tile-7:0","leadIn":"Nàng tiên đang chờ câu trả lời của em.","task":{"kind":"arithmetic","a":23,"b":14,"op":"add","target":"result"},"correctAnswer":"37"}]}
```

Ví dụ chỉ minh họa một phần phản hồi; request thực tế liệt kê chính xác các slot cần điền. Task hợp lệ gồm arithmetic, count, clock, shape, color, fact. Facts lấy từ danh sách đã biên soạn theo lớp. Ứng dụng tự dựng câu, hình, đáp án và lời giải từ task để chúng nhất quán.

- Không gửi tên, ID hay lịch sử học sinh trong prompt.
- Kiểm tra đúng slot, không thiếu/thừa/trùng ID; đúng loại task và phạm vi lớp/độ khó; giải lại đáp án.
- Từ chối HTML, URL, số liệu trong lời dẫn và trường không hợp lệ. Lời dẫn không dùng làm mã/thao tác.
- Không lặp task số học/đếm/đồng hồ; tập hữu hạn hình/màu/fact được lặp khi cần.
- Tối đa 12.000 output token, một lượt sửa các slot thiếu, tổng thời gian chuẩn bị tối đa 25 giây. Tôn trọng AbortSignal cả ở bước tìm model/gọi API.
- Phần lỗi được điền local cùng loại/lớp. Nguồn ghi đúng `ai`, `mixed` hoặc `local`.

## Lưu và tái hiện

Snapshot version 3 giữ batch đã kiểm tra, hash, seed, map, vị trí, xúc xắc, bộ đếm RNG, lượt gieo, buff, từng encounter và trạng thái câu hỏi. Không gọi AI khi gieo, dừng ở ô, tạm dừng, tải lại hay tiếp tục ván.

Fixture dev tại `/Genius-kids/dragon-preview.html` mô phỏng AI đúng, sai, lỗi, chậm; không cần khóa thật. Kiểm thử API thật vẫn cần kết nối AI được cấu hình trong hồ sơ.
