# Giai Điệu Vui Nhộn → Ban Nhạc Tí Hon

Ngày: 08/09/2026. Trạng thái: **đã triển khai bản remake trong project**. Chi tiết phạm vi thực tế và kiểm chứng nằm trong [sound-memory-implementation.md](./sound-memory-implementation.md). Các mục thử trên thiết bị vật lý và quan sát trẻ chơi vẫn cần thực hiện riêng.

Phạm vi: game SoundMemory trong Games. Kế hoạch dựa trên mã nguồn local; chưa nghe thử âm thanh trên thiết bị thật hoặc quan sát trẻ chơi ở lượt khảo sát này. Ưu tiên cảm giác chơi và chất lượng âm thanh, không ràng buộc vào asset cũ.

## 1. Hướng sản phẩm

Tên đề xuất: **Giai Điệu Vui Nhộn — Ban Nhạc Tí Hon**. Trẻ nghe một câu nhạc ngắn, đáp lại bằng các phím nhạc lớn, tập tiết tấu rồi dùng những gì vừa khám phá để tạo bản nhạc riêng. Mỗi chương mở thêm thành viên/âm sắc cho ban nhạc; cuối chương các thành viên cùng chơi một đoạn hòa tấu ngắn.

Điểm đáng quay lại là **được tạo và nghe lại âm nhạc của mình**. Phần thưởng trang trí hỗ trợ cảm giác sở hữu; trọng tâm vẫn là chạm thấy phản hồi, nghe thấy kết quả và muốn thử một cách chơi khác.

Mục tiêu thiết kế ban đầu: một nhiệm vụ khoảng 1–3 phút, mỗi câu nhạc 2–6 nốt. Không dùng chuỗi 10 nốt/9 nút làm cửa vào. Các con số là giả thuyết cần thử với trẻ, không phải chuẩn khả năng theo tuổi.

## 2. Những gì đã đọc từ bản hiện tại

| Hiện trạng | Tác động và cách xử lý trong remake |
|---|---|
| Dễ: 4 nút, 3–5 nốt, 5 câu; vừa: 6 nút, 4–6 nốt, 8 câu; khó: 9 nút cùng màu, 5–10 nốt, 10 câu | Cùng lúc tăng số nút, độ dài và giảm hỗ trợ. Tách từng trục, khởi đầu 3–4 phím/2 nốt; cho luyện tự chọn |
| Chuỗi chọn ngẫu nhiên độc lập, tất cả nốt dùng sine, cùng thời lượng 600 ms | Có cao độ nhưng chưa có chủ đích về câu nhạc, tiết tấu hoặc âm sắc. Dùng các motif ngắn được biên soạn và bộ biến thể có seed |
| `playSequence` chạy timeout cho cả âm thanh và đèn, cách nốt 800 ms | Có khoảng nghỉ rõ nhưng lịch phát gắn với callback giao diện. Cần lịch phát audio riêng trước khi thêm chấm nhịp |
| Trẻ chỉ cần nhập đúng thứ tự; chưa có dữ liệu thời điểm gõ | Hiện tại là nhớ chuỗi âm/vị trí, chưa phải game tiết tấu. Không chấm tốc độ ở chế độ nhớ giai điệu |
| Chơi sai chuyển câu sau 2 giây, thông báo “Sai rồi! Mất lượt” | Mất cơ hội sửa đoạn vừa nghe. Giữ câu, phản hồi nhẹ, cho nghe lại/chia đoạn/chơi chậm |
| `handleWrong` ở câu cuối gọi `prepareQuestion`; nhánh hết câu không tính `completionMedal` | Có đường đi kết thúc với huy chương null dù các câu trước đạt ngưỡng. Ví dụ đúng 4/5 rồi sai câu cuối đáng lẽ đạt bạc theo luật hiện tại |
| Chỉ gọi `onComplete` từ nút Thoát trong modal; Chơi lại reset trực tiếp | Ván vừa xong có thể chưa được ghi khi chơi lại hoặc tải lại. Commit kết quả ngay khi hoàn thành, điều hướng độc lập |
| Timeout 300 ms trong thao tác người chơi không nằm trong `timeoutsRef`; thiếu pause/visibility/session guard | Có callback chưa được quản lý và nguy cơ đèn cũ tắt nhầm nốt mới. Engine mới phải quản lý vòng đời toàn bộ sự kiện |
| `MemoryButton` là button trống, không tên truy cập hoặc ký hiệu | Bổ sung tên nốt, biểu tượng, ký hiệu bàn phím; giữ định danh khi tắt màu/chuyển động |
| Âm thanh đã tôn trọng mute chung; game dừng nhạc nền lúc vào, khôi phục khi ra | Giữ hành vi hợp lý này, bổ sung màn thử âm và xử lý mute/context bị suspend giữa bài |
| Callback chung ghi `difficulty: easy`, `durationSeconds: 0` | Adapter mới ghi đúng chế độ, độ khó, thời gian và hỗ trợ, giữ nguyên dữ liệu cũ |

Hai vấn đề về huy chương/lưu là kết luận theo luồng code; lỗi do thao tác nhanh hoặc thiết bị cần tái hiện bằng kiểm thử, chưa được coi là đã chứng minh bằng browser ở bước lập kế hoạch.

Nguồn local: [SoundMemoryGame.tsx](D:/Quyetnm/Dev/mathgenius-kids/games/SoundMemory/SoundMemoryGame.tsx), [soundEngine.ts](D:/Quyetnm/Dev/mathgenius-kids/games/SoundMemory/soundEngine.ts), [MemoryButton.tsx](D:/Quyetnm/Dev/mathgenius-kids/games/SoundMemory/MemoryButton.tsx), [sound.ts](D:/Quyetnm/Dev/mathgenius-kids/utils/sound.ts), [musicManager.ts](D:/Quyetnm/Dev/mathgenius-kids/services/musicManager.ts), [GamePage.tsx](D:/Quyetnm/Dev/mathgenius-kids/src/pages/GamePage.tsx).

## 3. Ba cách chơi

### A. Nghe rồi đáp lại — trục chính của hành trình

- Trước bài đầu có khoảng thử phím tự do, chưa chấm gì. Nhấn phím là nghe nốt và thấy nhân vật phản ứng.
- Một nhạc cụ giai điệu có 4 phím lớn ban đầu, sau đó 5 phím Đô–Rê–Mi–Sol–La. Các phím cùng âm sắc trong một bài để không trộn thử thách nhận nốt với nhận nhạc cụ.
- Bạn nhạc công chơi câu 2–6 nốt. Trẻ đáp lại theo thứ tự; không ép đúng tempo. Điện thoại dùng hàng phím rộng hoặc lưới ổn định, không bố trí chín ô giống nhau.
- Cho nghe lại cả câu, nghe chậm hoặc chia thành cụm hai/ba nốt. Nhịp chậm giữ nguyên cao độ. Việc nghe lại không tự trừ sao.
- Khi sai: giữ câu nhạc, chỉ rõ đã nhớ tới đâu; lần thử tiếp theo bắt đầu lại câu. Không tự tính phần đúng trước lỗi là một câu độc lập hoàn thành.
- Với hai lần thử còn khó, đề xuất “Cùng chơi từng đoạn”; người chơi tự chọn. Chế độ có đèn dẫn từng nốt được ghi là có trợ giúp.
- Mỗi bài có ba câu ngắn và một đoạn kết do ban nhạc chơi lại từ câu vừa hoàn thành. Đoạn kết có thể bỏ qua; thao tác bỏ qua không ảnh hưởng lưu.

Ví dụ motif khởi đầu: `Đô–Mi`, `Đô–Mi–Đô`, `Mi–Sol–Mi`. Biến thể phải giữ cấu trúc của bài; không đổi tên/background rồi coi là kỹ năng mới.

### B. Gõ theo nhịp — học tiết tấu riêng

- Bắt đầu với một mặt trống, sau đó hai âm trống/vỗ tay. Mẫu 4–8 lần gõ, tốc độ khởi điểm 70–100 BPM.
- Có đếm vào bốn nhịp, vạch nhịp lớn, các chấm thể hiện thời điểm cần gõ. Bài đầu chỉ dùng phách đều; thêm khoảng nghỉ rồi mới đến hai lần gõ gần nhau.
- Chế độ này chấm thời điểm gõ. Luật cao độ của phần A không tự động áp vào phần B.
- Trẻ được nghe lại mẫu và tập với nhịp chậm. Tắt tiếng có thể chuyển sang “Nhìn và gõ”; kết quả được ghi là luyện thị giác, không gắn nhãn nghe nhạc.
- Mỗi lần gõ chỉ ghép với một mục tiêu, xử lý nốt thừa/nốt thiếu rõ ràng. Gõ liên tục không được tính là đúng mọi nhịp.
- Mốc thử ban đầu cho phách đơn: dung sai khoảng ±180 ms ở 80 BPM, cần đo rồi chỉnh. Với các nốt gần nhau, cửa sổ không chồng lên nhau. Đây không phải cam kết độ chính xác trên mọi thiết bị.

### C. Phòng sáng tác — lý do quay lại

- Mở ngay bản đơn giản: một dòng giai điệu tám ô; chạm ô để đặt nốt, chạm lại để đổi/xóa. Có nút nghe/dừng rõ ràng và con trỏ chạy theo nhạc.
- Mở dần tối đa 16 bước với ba dòng: giai điệu, trống trầm, vỗ tay/shaker. Đây là sequencer đơn giản; không yêu cầu biết ký âm.
- Chọn âm sắc của dòng giai điệu: tiếng gỗ, chuông, phím mềm. Giới hạn nốt và tốc độ để trẻ dễ tạo câu nghe có cấu trúc.
- Có hoàn tác, xóa dòng, làm bản sao và đặt tên ngắn hoặc chọn tên có sẵn. Thử ý tưởng mới luôn có đường quay lại.
- Lưu tối đa 12 bản/phiên bản sáng tác mỗi hồ sơ ở bản đầu, cảnh báo trước khi thay bản cũ. Lưu danh sách nốt/nhịp/nhạc cụ, không thu micro hoặc ghi file âm thanh liên tục.
- “Biểu diễn bản của em” đưa đoạn nhạc lên sân khấu. Không chấm hay/dở; sáng tác tự do không sinh sao vô hạn.

## 4. Nội dung 24 nhiệm vụ

| Chương | Sáu bài có chủ đích | Nội dung mở thêm |
|---|---|---|
| 1. Chào những nốt nhạc | 1: thử phím + hai nốt; 2: lặp một nốt; 3: ba nốt đi lên; 4: motif A–B–A; 5: hai cụm ngắn; 6: biểu diễn ba câu đã học | Thành viên chơi giai điệu, âm sắc tiếng gỗ, phối cảnh sân khấu đầu |
| 2. Câu nhạc trò chuyện | 7: cao/thấp trong bộ quen; 8: thêm phím thứ năm; 9: motif A–A–B; 10: câu hỏi/câu đáp; 11: câu 5–6 nốt; 12: hòa tấu giai điệu | Âm sắc chuông, thêm trang trí và bản mẫu để sáng tác |
| 3. Đội trống nhí | 13: bốn phách đều; 14: một khoảng nghỉ; 15: hai âm xen kẽ; 16: tám phách; 17: một mẫu có cặp gõ gần; 18: hòa tấu trống | Thành viên trống, hai dòng bộ gõ trong phòng sáng tác |
| 4. Buổi diễn của em | 19: giai điệu quen với ban nhạc; 20: đối đáp trống; 21: nghe–nhớ một câu mới; 22: nối hai đoạn tiết tấu; 23: ba phần ngắn luân phiên; 24: biểu diễn + chọn mở phòng sáng tác | Sân khấu cuối, âm sắc phím mềm và sequencer 16 bước |

Mỗi nhiệm vụ khai báo mode, tập phím, motif, biến thể seed, tốc độ, số câu, các mức trợ giúp và ngưỡng kết quả. Ở chương cuối, giai điệu và tiết tấu đi thành các phần nối tiếp; chưa bắt trẻ đồng thời nhớ dài, phân biệt nhạc cụ và gõ đúng từng mili giây.

Luyện tự do cho chọn bộ phím, độ dài, tempo và hỗ trợ. Có nút “Chơi tiếp” theo ván dở hoặc nhiệm vụ kế tiếp; không cần chọn độ khó ở menu chung để bắt đầu hành trình.

## 5. Chấm kết quả và động lực

- Hoàn thành đủ câu bằng chơi độc lập hoặc hướng dẫn đều mở bài kế tiếp và nhận một sao cơ bản. Không khóa toàn bộ nội dung vì thiếu phản xạ đúng nhịp.
- Giai điệu: hai sao khi tự hoàn thành tất cả câu ở các lần thử thành công mà không có đèn dẫn; ba sao khi các câu đều đúng ngay lần thử độc lập đầu và chưa dùng đèn dẫn. Nghe lại/nghe chậm được phép; lưu metadata để so kỷ lục đúng chế độ.
- Tiết tấu: đề xuất hai/ba sao theo tỷ lệ hit 70%/90% sau khi hiệu chỉnh timing. Tỷ lệ tính `hit / (mục tiêu + lần gõ thừa)`; một nốt không nhận nhiều hit. Guided/visual practice có bảng thành tích riêng; không dùng làm bằng chứng phân biệt âm hoặc nhịp thuần thính giác.
- Sao chiến dịch cấp theo phần tăng mới của mỗi mission, tối đa 72 sao cho 24 bài; thành tích chung nếu có tính riêng. Chơi lại không farm currency/win count. Luyện tự do và sáng tác không cấp sao toàn ứng dụng.
- Phần thưởng nên nghe được: đổi tiếng gỗ thành tiếng chuông, có thêm thành viên trống hoặc nghe toàn ban cùng diễn. Trang phục và đèn sân khấu là lớp phụ.
- Không thêm combo áp lực, mất mạng, streak bị mất khi nghỉ hoặc gacha. Trẻ có thể dừng sau một bài, tiếp tục sau mà không mất công.

## 6. Giao diện và mỹ thuật

Sân khấu đồ chơi nhỏ, nhân vật có động tác gảy/gõ rõ, ánh sáng ấm và nhạc cụ có chất liệu riêng. Minh họa có thể vẽ mới hoàn toàn; chỉ tái sử dụng asset khi phù hợp phong cách. Không ép gắn bối cảnh hành tinh vào game âm nhạc.

Bố cục chơi: hàng trên là nhạc công/tiến độ; giữa là các nốt của câu dưới dạng chấm trung tính khi đang nhớ; dưới là phím chơi lớn. Khi trình diễn mẫu, phím sáng và nhạc công chuyển động cùng một lịch thời gian. Trong phần input, đáp án không nằm sẵn trên timeline trừ khi người chơi bật hướng dẫn.

Màu, biểu tượng và tên nốt cùng xác định mỗi phím. Giữ thứ tự phím suốt ván; xoay màn hình thì pause trước khi bố cục lại. Mục tiêu vùng chạm ≥64 px trên bố cục chính, tối thiểu 44 px cho nút phụ. Có bộ phím bàn phím 1–5; phím Space dành cho trống ở màn tiết tấu.

Trên điện thoại, sequencer cho cuộn theo ô nhịp hoặc chia trang tám bước; không ép ba dòng × 16 ô chật vào một màn. Có nút tiến/lùi đoạn thay cho thao tác kéo quá chính xác. Giảm chuyển động giữ dấu sáng/vạch nhịp, bỏ nhún và phóng to.

## 7. Âm thanh là hạng mục kỹ thuật ưu tiên

Mở hoặc resume AudioContext từ nút thử âm của người chơi; chờ việc mở audio thành công rồi mới phát câu. Có nghe thử, âm lượng, mute và trạng thái tải. Sample ngắn nên decode thành buffer trước ván; nốt tổng hợp là lựa chọn cho prototype. [MDN: Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

Lập lịch nốt theo đồng hồ audio, dùng bộ lập lịch nhìn trước một khoảng ngắn; vòng callback chỉ bổ sung lịch, không quyết định chính xác thời điểm mỗi tiếng vang. Giao diện đọc cùng timeline. [MDN: creating and sequencing audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)

Khi đo tiết tấu, quy đổi dấu thời gian input sang đồng hồ phát có kiểm tra khả năng hỗ trợ. `getOutputTimestamp()` cung cấp cặp thời gian audio/performance để hỗ trợ việc này; không tự suy ra rằng đã bù mọi độ trễ thiết bị. Nếu timing không đáng tin cậy, chuyển phần đó sang luyện có dẫn nhịp, không gán lỗi cho trẻ. [MDN: getOutputTimestamp](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp)

Các quyết định cần làm trong prototype:

- Hai âm sắc đầu phải nghe dễ chịu trên loa điện thoại, phân biệt nốt ở âm lượng vừa. Âm lượng tương đối cân giữa nhạc cụ, có attack/release ngắn và giới hạn số tiếng đồng thời để giảm tiếng bật/cắt đột ngột.
- Âm trả lời phát ngay từ `pointerdown` hoặc `keydown`; chặn đường click phát trùng và key repeat của phím đang giữ. Hai lần chạm tách rời cùng phím vẫn hợp lệ vì motif có nốt lặp. Bài có chấm điểm dùng một luồng input, xử lý đa chạm rõ ràng.
- Nhạc nền chung nhường cho bài nghe; âm báo đúng/sai không đè lên nốt tiếp theo. Chờ tiếng cuối tắt hoặc fade ngắn trước feedback.
- Theo dõi các nguồn âm đang chạy/đã lên lịch để dừng khi pause/reset/thoát. Không chỉ hủy timeout hoặc chỉ làm im bus trong khi các note-on vẫn có thể phát tiếp.
- Tắt tiếng hoặc audio bị ngắt giữa lượt thì pause; resume cho nghe lại câu và đếm vào. Chuyển loa/tai nghe yêu cầu kiểm tra lại timing của bài nhịp. Hiệu chỉnh tùy chọn, có thể bỏ qua để chơi nghe–nhớ/luyện thị giác.
- Ưu tiên Web Audio có sẵn; chỉ thêm thư viện khi prototype chứng minh giảm đáng kể độ phức tạp. Không cần renderer 3D cho phím nhạc.

## 8. Engine, lưu và tích hợp

```text
games/SoundMemory/
  SoundAdventure.tsx          Điều phối màn/chương/chế độ
  content/                    24 mission, motif, instruments, sample manifest
  engine/                     Reducer thuần, matching nốt/nhịp, scoring
  audio/                      Audio session, scheduler, voice pool, timing map
  session/                    Pause, checkpoint, vòng đời input/audio
  studio/                     Grid nốt, undo, playback, bản sáng tác
  components/                 Stage, pads, timeline, settings, results
  progress/                   Migration, draft, completion có chống trùng
```

Luồng: `ready → audio-ready → demo → input → feedback → câu tiếp / retry → saving → result`. Composer là mode riêng, không chạy luật chấm câu. Pause bọc các phase và vô hiệu hóa input/nguồn âm của phiên trước.

Draft ghi seed, mission/content version, phrase index, mode, câu đã hoàn thành, số lần nghe lại/thử/hướng dẫn và thời gian chơi. Không ghi AudioNode hoặc thời gian tuyệt đối của AudioContext. Sau reload, giữ những câu đã xong; câu đang nghe/gõ bắt đầu lại từ bước nghe mẫu/đếm vào để không phát đoạn nhạc bị cắt giữa chừng.

Lưu kết quả trước khi hiện thưởng, thử ghi lại cùng completion ID khi gặp lỗi. Nút Chơi lại/Thoát không phải tác nhân duy nhất lưu điểm. StudentContext có adapter riêng; không vừa gọi callback gacha cũ vừa cộng sao mới.

Giữ lịch sử `sound-memory` cũ; schema v2 có mission/mode/mistakes/replays/assistance/tempo/timingQuality và duration thật. Kỷ lục tách nghe–nhớ, tiết tấu, hỗ trợ thị giác và preset. Không sửa hồi tố các bản ghi cũ vốn thiếu độ khó/thời gian.

Có thể học lại cách quản lý reward/draft từ MemoryMatch, nhưng dữ liệu và rule của âm nhạc độc lập. Giữ đường mở bản cũ trong giai đoạn chuyển đổi. Phạm vi ban đầu là một cửa sổ đang ghi mỗi hồ sơ, chưa phải lưu đồng bộ nhiều thiết bị.

## 9. Thứ tự triển khai

| Mốc | Công việc | Điều kiện hoàn tất |
|---|---|---|
| M0 — thử cảm giác | Bốn phím, hai âm sắc, sáu motif, nghe/đáp/retry và ba case hồi quy kết quả cũ | Nghe thử được trên loa thường; chạm không phát trùng; demo/input đổi lượt rõ |
| M1 — vòng chơi hoàn chỉnh | Sáu nhiệm vụ đầu, nhân vật, trợ giúp, pause/draft, lưu thưởng, keyboard/mobile | Một phiên từ vào game đến nhận thưởng và khôi phục hoạt động đủ |
| M2 — âm nhạc sâu hơn | Sáu bài giai điệu kế, sáu bài nhịp, scheduler và kiểm tra độ trễ | Nhịp/chấm đúng trên thiết bị thử; trường hợp audio không sẵn sàng không âm thầm làm trẻ thua |
| M3 — sáng tác và buổi diễn | Sequencer 8→16 bước, ba dòng, lưu bản nhạc, sáu bài cuối và phần thưởng ban nhạc | Trẻ tạo/nghe lại được đoạn riêng; nội dung 24 bài có mục tiêu và biến thể đã duyệt |
| M4 — kiểm tra và hiệu chỉnh | Hồi quy dữ liệu, thiết bị, âm thanh, accessibility, thử với trẻ | Có báo cáo kết quả/giới hạn; không chỉ dựa vào build hoặc screenshot |

Ưu tiên M0/M1 trước khi sản xuất đủ bài. Chất lượng tiếng đàn, nhịp nghe–đáp và phản hồi khi sai là các quyết định cần chốt bằng prototype; tăng nội dung sau đó.

## 10. Nghiệm thu

- **Luật:** đúng/sai câu đầu/cuối, chuỗi có nốt lặp, input nhanh, nhấn giữ, đa chạm, callback phiên cũ, retry không đổi đáp án hoặc đếm sai số câu.
- **Audio:** autoplay bị chặn, suspend/resume, mute giữa demo, đổi nguồn ra, pause đang có nốt lên lịch, thoát không còn âm. Kiểm tra nghe thật, không dùng screenshot làm bằng chứng âm thanh đúng.
- **Nhịp:** input ở biên cửa sổ, nốt thừa/thiếu, cửa sổ sát nhau, lệch offset cố định, tempo khác nhau và timestamp không khả dụng. Dữ liệu mô phỏng phải có expected result riêng.
- **Lưu:** hoàn thành rồi chơi lại/thoát/reload vẫn có kết quả; retry ghi không nhân thưởng; hồ sơ khác và lịch sử cũ giữ nguyên; bản sáng tác hỗ trợ undo và khôi phục.
- **Thiết bị:** desktop, Android tầm trung, iPhone/iPad Safari; thử loa tích hợp và ít nhất một tai nghe Bluetooth. Ghi độ trễ quan sát được, không hứa một cửa sổ chấm đúng cho mọi máy.
- **UI:** 360×640, 390×844, 768×1024 và desktop; phím không đổi vị trí giữa câu; chế độ giảm chuyển động, keyboard, tên truy cập và phòng sáng tác cuộn được.
- **Build:** TypeScript, test phù hợp và production build; sample/các mode tải riêng, đường dẫn `/Genius-kids/`, kiểm tra offline sau cache. Đặt ngân sách âm thanh sau khi chọn sample; không preload cả thư viện nhạc nền.
- **Thử với trẻ:** quan sát 5–8 trẻ cùng người phụ trách: hiểu cách chơi sau câu đầu không, nghe lại có chủ động không, lỗi nào làm bỏ cuộc, có muốn biểu diễn hoặc mở lại bản đã sáng tác không. So cùng độ dài câu và hỗ trợ với bản cũ. Khả năng quay lại cần quan sát qua nhiều ngày, chưa thể khẳng định từ một buổi thử.

## 11. Để sau v2

Nhận diện hát/gõ qua micro, song tấu online, nhập MIDI, tự tải bài hát, xuất video biểu diễn và học ký âm chuyên sâu. Chúng không cần thiết để kiểm chứng vòng chơi nghe–đáp–sáng tác của bản đầu.
