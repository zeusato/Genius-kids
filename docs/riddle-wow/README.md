# Đố Vui Nhân Sư v2: báo cáo bàn giao

Thực hiện ngày 02/10/2026 trên nhánh `feat/riddle-wow`, tag mốc `riddle-before-wow`. Kế hoạch gốc: [../riddle-remake-plan.md](../riddle-remake-plan.md). Những chỗ làm khác plan được ghi ở mục 13 của plan.

## Đã làm

- **GĐ0, sửa nóng:** commit `4f34d51` chỉ đụng các file của bản cũ nên cherry-pick riêng lên `main` được. Sửa hai lỗi:
  - Mất sao thưởng do ghi hồ sơ hai lần.
  - `checkAnswer` chấm đúng cả mẩu 2 ký tự.
- **Nội dung:** kho mới có **885 câu** (565 tiếng Việt, 320 tiếng Anh) chia vào 8 cổng. Lấy từ 999 câu cũ, loại 312 câu và soạn thêm 199 câu: dễ cho lớp 1–2, đố chữ, đố mẹo, toán vui.
  - Mỗi câu có: đáp án, các cách gọi khác, câu gần đúng, 2 gợi ý, 3 đáp án nhiễu, manh mối (trích nguyên văn từ câu đố), lời giải thích, mức 1–3 và nguồn. Câu tiếng Anh có thêm bản dịch.
  - Danh sách câu bị loại và lý do ở [dropped.json](dropped.json). Quy chuẩn soạn ở [content-spec.md](content-spec.md).
- **Engine thuần (`src/riddle/engine`):**
  - Chuẩn hoá tiếng Việt: hoà/hòa, chuỗi NFD, từ địa phương, từ chỉ loại chung và từ chỉ loại mang nghĩa.
  - Chấm đáp án với 5 kết quả: đúng, đúng nhưng sai chính tả, cần gõ có dấu, gần đúng, sai. Không bao giờ khớp chuỗi con.
  - Ghép chữ, chọn câu thích ứng (xen cổng, câu ôn, câu đố hôm nay theo ngày) và reducer cho một chặng.
- **Lưu trữ:**
  - Tiến độ lưu ở `profile.riddle` qua `saveRiddle` → `persistRiddle`. Sao, thành tích và ảnh album được ghi trong cùng một lần, có chống ghi trùng.
  - Tiến độ cũ ở `sphinx_profile_<id>` được nhập vào ở lần ghi đầu, rồi xoá key cũ.
  - Chặng dở được lưu nháp, tải lại trang vẫn chơi tiếp. Xoá học sinh thì dọn cả nháp và key cũ.
- **Giao diện (`src/riddle/ui`):**
  - Sảnh Ốc đảo: cảnh SVG có parallax, Nhân Sư chào theo tên, thẻ Hành trình, Câu đố hôm nay, 8 cổng đá.
  - Màn chơi: cuộn giấy cói, tô sáng dòng đang đọc, 3 kiểu trả lời, gợi ý 3 bậc, màn "Soi manh mối", dấu ấn.
  - Màn tổng kết: đá cổng sáng dần, sao đếm lên, quà khi mở cổng.
  - Các chế độ khác: Sổ Đố, Đố hình (bóng, lỗ khoá, kẻ lạ), Đố cả nhà (Bé làm Nhân Sư, Thi đố 2–4 người), Cài đặt.
- **Dọn bản cũ:** xoá màn hình, service, ảnh Anubis, kho JSON cũ và hệ thống phạt.

## Kiểm chứng

- `npx vitest run src/riddle`: 35/35. Gồm test chạy trên kho thật: đạt quy chuẩn soạn, mọi đáp án được chấm đúng, không đáp án nhiễu nào bị chấm đúng, ghép chữ luôn ghép lại được đáp án.
- `npx vitest run` toàn repo: 2353/2354 qua. Test hỏng là perft độ sâu 4 của Cờ Vua, quá thời gian khi chạy chung; chạy riêng thì qua 24/24.
- `npx tsc --noEmit`: chỉ còn lỗi có sẵn ở `modules/farm/src/ui/renderSnapshot.ts`.
- `npm run build`: thành công. Chunk `RiddlePage` nặng 834 KB (gzip 200 KB), phần lớn là kho JSON, chỉ tải khi mở Đố Vui.
- Thử tay trên browser pane ở 1180×820 và 390×844:
  - Chơi trọn một chặng bằng cả 3 kiểu trả lời, có thử chọn sai, gợi ý và xem đáp án.
  - Sau chặng, hồ sơ có đúng **+3 sao** như màn tổng kết báo. Đố hình +2 sao, đã lưu.
  - Sổ Đố, Đố cả nhà và tiếp tục chặng dở chạy đúng. Không có lỗi console.

## Còn mở

- **Chưa có người duyệt tay từng câu.** Các lô do agent biên tập và được kiểm bằng máy. Nên đọc lướt, nhất là cổng Đất Việt (16 câu lịch sử, địa danh) và các câu đố chữ.
- **Hình đáp án** đang là emoji hệ thống. Bộ Fluent Emoji (D5) chưa được tải vì cần xin phép tải file ngoài.
- **Chưa thử trên thiết bị thật:** giọng đọc tiếng Việt trên Android/iPad, bàn phím ảo che ô gõ, và độ cuốn hút khi trẻ chơi thật.
- **Widget kéo thả dấu thanh** cho cổng Chữ Nghĩa và script chụp ảnh tự động chưa làm.
