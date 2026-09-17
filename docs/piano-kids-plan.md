# Phương án Piano Nhí

Ngày khảo sát và triển khai: 17/09/2026. Tính năng đã được triển khai; xem phạm vi thực tế, lệnh chạy và kết quả kiểm tra tại [piano-implementation.md](piano-implementation.md). Phần dưới giữ lại các quyết định thiết kế của phương án ban đầu. Đối tượng: trẻ mầm non và tiểu học, ưu tiên cảm ứng trên điện thoại/tablet và bàn phím máy tính.

Phạm vi cập nhật theo yêu cầu của Đại ca: **đúng 3 chế độ chính, ít nhất 20 bản nhạc dùng được miễn phí, nhiều âm sắc và giao diện 2D đẹp mắt, thân thiện với trẻ**. Các yêu cầu này thuộc bản đầu đầy đủ.

## 1. Đề xuất

Theo yêu cầu cuối cùng: **Piano Nhí thay ô Kid Coder ở sảnh chính**, đường dẫn nội bộ `/piano`; **Kid Coder chuyển vào Trò chơi**, đường dẫn `/game?play=coding`. Màn đầu piano có ba lựa chọn: **Làm quen với đàn**, **Tập theo bài nhạc**, **Chơi tự do**. Bộ chọn tiếng đàn dùng chung cho cả ba chế độ; đây là cài đặt âm sắc, không tạo thêm chế độ học.

Giá trị riêng của Piano Nhí là làm quen bàn phím, nghe cao độ và tự đàn được giai điệu. SoundMemory tiếp tục phụ trách nghe–nhớ, gõ nhịp và sáng tác theo ô. Có thể thêm lối đi giữa hai hoạt động sau khi Piano Nhí hoàn chỉnh.

Quyết định kỹ thuật đề xuất: React/CSS cho bàn phím, Web Audio API cho sampler piano và các âm sắc tổng hợp, dữ liệu nốt và tiến độ lưu trên máy. Bản đầu chưa cần backend, AI hoặc thư viện âm thanh mới.

## 2. Những gì dự án đã có

| Thành phần đã kiểm tra | Có thể tận dụng | Phần cần bổ sung |
| --- | --- | --- |
| `games/SoundMemory/audio/AudioSession.ts` | Khởi tạo/resume âm thanh, buffer dùng lại, scheduler theo audio clock, ánh xạ timestamp, dừng nguồn khi gián đoạn | Hiện chỉ phát mẫu tổng hợp hữu hạn; cần note-on/note-off, định danh từng lần nhấn và bộ sample piano |
| `games/SoundMemory/audio/voices.ts` | Kinh nghiệm tạo âm sắc và envelope | Chỉ có Đô/Rê/Mi/Sol/La, chưa có Fa/Si hoặc phím đen; tiếng `keys` là âm tổng hợp |
| `games/SoundMemory/audio/output.ts` | Gain, compressor và giới hạn đỉnh mềm | Nghe thử và chỉnh lại gain cho sample; không áp nguyên thông số mà chưa kiểm tra |
| `games/SoundMemory/studio/model.ts` | Cách lưu và kiểm tra thư viện sáng tác | Mô hình 5 cao độ/16 ô không biểu diễn được hợp âm và thời gian giữ phím tùy ý |
| `games/GameLauncher.tsx`, `src/components/hub/catalog.ts` | Game tải riêng, danh mục và xử lý URL | Thêm `piano`, hình đại diện và quyền truy cập mầm non ở cả `gamesFor` và `resolveEntry` |
| `src/contexts/StudentContext.tsx`, `types.ts`, `services/profileService.ts` | Hồ sơ, adapter lưu và cập nhật giao diện | Tiến độ piano riêng, migration giữ dữ liệu cũ, dọn dữ liệu khi xóa hồ sơ |
| `services/musicManager.ts` | Tắt nhạc nền khi vào hoạt động âm nhạc, phục hồi khi thoát | Piano cần tôn trọng mute toàn ứng dụng và có âm lượng riêng |
| `vite.config.ts`, `pwa/sw.ts`, `pwa/download.ts` | Manifest đã chứa mp3/ogg/wav; media được cache khi sử dụng hoặc tải offline đầy đủ | Kiểm tra bộ tiếng piano đã đủ trong cache; cài PWA không đồng nghĩa toàn bộ sample đã có |

Không mở rộng trực tiếp chỉ số nốt 0–4 của SoundMemory thành MIDI: cách đó có thể làm thay đổi ý nghĩa bài học và sáng tác đã lưu. Viết `PianoAudio` riêng; chỉ tách tiện ích thực sự dùng chung sau khi có kiểm tra hồi quy.

## 3. Trải nghiệm bản đầu

### Bàn đàn

- Màn hình tập trung vào bàn phím ở phía dưới, phía trên là tên bài, câu nhạc và nút nghe mẫu. Trang trí nhẹ bằng phòng nhạc ấm áp, hiệu ứng nhấn phím và nhân vật nhỏ.
- Dải nhạc cụ C4–C6: 25 phím gồm 15 trắng và 10 đen. Điện thoại dọc hiển thị một quãng tám với 8 phím trắng, có nút chuyển quãng; tablet/máy tính đủ rộng hiển thị toàn dải.
- Giữ bố cục đen–trắng đúng vị trí. Nhãn Đô–Rê–Mi–Fa–Sol–La–Si có thể đổi sang C–D–E; màu chỉ là dấu phụ, đi cùng tên và trạng thái phím.
- Bài nhập môn chỉ dùng các phím trắng trong một quãng tám, không bắt trẻ chuyển quãng giữa câu. Phím đen vẫn hiện trong bố cục; bài nâng cao mới hướng dẫn sử dụng.
- Hỗ trợ chuột, đa chạm và phím máy tính. Bấm nhiều phím tạo hợp âm; giữ và nhả có âm tắt tự nhiên. Chặn tự lặp `keydown`.
- Kích thước theo khả năng chạm thực tế: khoảng 40–48 px trở lên cho phím trắng ở màn nhỏ; phím đen phải được thử riêng. Không ép 25 phím vào điện thoại dọc. Nếu chật, hiển thị ít phím hơn hoặc dùng chế độ ngang.

### Ba chế độ chính

| Chế độ | Trẻ làm gì | Phạm vi bản đầu đầy đủ |
| --- | --- | --- |
| 1. Làm quen với đàn | Nhận biết nốt, vị trí phím, cao–thấp, dài–ngắn và thao tác đàn cơ bản | 10 bài ngắn, có minh họa và thực hành ngay |
| 2. Tập theo bài nhạc | Chọn bài, nghe mẫu, chơi từng câu theo đèn, ghép thành bài | Ít nhất 20 giai điệu khác nhau; danh sách nguồn dự tuyển gồm 24 bài |
| 3. Chơi tự do | Bấm đàn, đổi âm sắc, thử hợp âm, bật/tắt tên nốt và chuyển quãng | Mở ngay, không yêu cầu hoàn thành bài học |

**Chế độ 1 — Làm quen với đàn:** lộ trình 10 bài gồm (1) chạm để phát tiếng, (2) nhấn và nhả, (3) tìm Đô cạnh nhóm hai phím đen, (4) Đô–Rê–Mi, (5) Fa–Sol–La–Si, (6) âm cao và thấp, (7) nốt ngắn và dài, (8) khoảng nghỉ và nhịp đều, (9) đổi ngón/đánh hai nốt cùng lúc, (10) chơi câu nhạc đầu tiên. Mỗi bài khoảng 1–3 phút, hướng dẫn một việc mỗi lần. Minh họa số ngón 1–5 và tư thế thả lỏng khi phù hợp; thao tác trên màn hình không được chấm như kỹ thuật tay trên đàn thật.

**Chế độ 2 — Tập theo bài nhạc:** thư viện chia ba mức Khởi đầu / Quen tay / Thử sức, có thẻ minh họa, tên dễ đọc và nghe thử. Mỗi bài có nghe toàn bài, nghe từng câu, tốc độ 50/75/100%, tập câu lặp và ghép bài. Mặc định hiện đèn phím và dải nốt; có thể tắt gợi ý. Bản tập là một tuyến giai điệu dễ chơi, giữ cấu trúc nhận diện được của bài; không tính một câu trích vài nốt thành một bản nhạc hoàn chỉnh. Dùng nhịp và cao độ của đúng phiên bản đã ghi nguồn.

**Chế độ 3 — Chơi tự do:** vào là thấy bàn đàn; đổi tiếng, chỉnh âm lượng, bật tên nốt, đổi quãng và chơi nhiều phím. Không chấm điểm hay ngắt cuộc chơi bằng phần thưởng. Ghi/phát lại bản đàn vẫn là phần mở rộng sau bản đầu.

Nguồn và danh sách 24 bài dự tuyển nằm trong [piano-song-sources.md](piano-song-sources.md). Ngưỡng nghiệm thu là **ít nhất 20 bài hoàn chỉnh đã kiểm tra nguồn và nhập nốt**, không phải 20 tên trong danh sách dự kiến. Không đếm các tên khác nhau của cùng một giai điệu thành nhiều bài.

Mặc định **chờ đúng nốt**: trẻ nhấn sai thì nghe nốt đã bấm, phím cần chơi tiếp tục được gợi ý; không mất mạng, không hết giờ. Nghe lại hoặc bật gợi ý không làm mất quyền hoàn thành bài.

Bản đầu ghi nhận câu/bài đã hoàn thành và mức hỗ trợ. Thành tích hiển thị bằng dấu hoàn thành hoặc sticker trong Piano Nhí; chưa thêm tiền sao chung. Nếu bổ sung tiền sao sau này, chỉ thưởng cột mốc/chênh lệch thành tích và chống ghi lặp theo adapter hiện có.

### Thiết kế 2D — Phòng nhạc trong vườn

- Hướng hình ảnh: phòng nhạc như tranh truyện, đàn màu kem và gỗ sáng, cây nhỏ bên cửa sổ, một bạn thú hướng dẫn. Phối xanh ngọc, vàng mật ong, cam đào và tím nhạt; chữ xanh đậm có độ tương phản rõ.
- Màn chọn có đúng ba thẻ lớn: **Khám phá phím đàn**, **Chơi một bài nhạc**, **Đàn theo ý mình**. Mỗi thẻ có một hình minh họa riêng; mô tả chỉ một câu và một nút hành động.
- Màn đàn dùng phần lớn vùng thao tác cho nhạc cụ và dải nốt. Thanh trên gọn: quay lại, tên chế độ/bài và âm lượng; bộ chọn 6 tiếng dạng thẻ có hình nhạc cụ. Cài đặt ít dùng nằm trong bảng mở thêm.
- Vỏ đàn, bóng đổ mềm, mép phím và chuyển động lún tạo chiều sâu bằng CSS/SVG. Nhãn nốt rõ; phím cần chơi có viền và ký hiệu, phím đang nhấn có trạng thái riêng. Hiệu ứng tia sáng ngắn đặt trên phím vừa đàn, không che mục tiêu tiếp theo.
- Nhân vật có phản hồi nhỏ khi hoàn thành câu; màn chơi tự do giữ chuyển động nhẹ. Có chế độ giảm chuyển động, điều khiển bằng bàn phím và trạng thái focus dễ thấy.
- Thẻ bài hát dùng hệ minh họa nhất quán với chủ đề: chuông, cừu, thuyền, đồng hồ, cây cầu. Nhãn tiếng Việt do dự án biên soạn đi cùng tên gốc; không tự dùng lời dịch bài hát chưa rõ nguồn.
- Giao diện điện thoại dọc ưu tiên nút lớn và phím đủ rộng; chuyển ngang mở thêm phím. Bài vượt dải đang nhìn phải chọn vùng đàn phù hợp trước câu, tránh tự cuộn bàn phím khi trẻ đang giữ nốt.
- Thiết kế cần duyệt bằng ảnh chụp màn hình desktop, điện thoại dọc/ngang và thử chạm thực tế. Các trạng thái đang tải, tắt tiếng, chơi đúng, cần thử lại và hoàn thành cũng phải cùng phong cách.

## 4. Lựa chọn âm thanh

| Phương án | Ưu điểm | Chi phí và giới hạn | Đánh giá |
| --- | --- | --- | --- |
| Tổng hợp bằng oscillator/PCM như SoundMemory | Nhẹ, không phải tải sample | Cần nhiều công chỉnh âm sắc; tiếng hiện tại chưa giống piano acoustic | Phù hợp dựng thử thao tác |
| Sample piano + các âm sắc tổng hợp qua Web Audio API | Tiếng piano thuyết phục hơn; các tiếng còn lại nhẹ; kiểm soát tải, giữ–nhả và vòng đời nguồn | Cần chuẩn bị sample, các bộ tạo tiếng và quản lý nguồn | **Chọn cho bản dùng thật** |
| Sample piano + Tone.js Sampler | Có sẵn mapping nốt và attack/release | Thêm dependency và lớp quản lý audio cần phối hợp với ứng dụng | Cân nhắc khi phát triển nhiều nhạc cụ hoặc sequencer phức tạp |

Web Audio hỗ trợ phát buffer, điều khiển gain và lịch theo audio clock. `latencyHint: 'interactive'` là yêu cầu ưu tiên, không phải cam kết độ trễ trên mọi thiết bị. Tone.js Sampler có mapping cao độ/MIDI và đổi cao độ từ sample gần nhất. Nguồn: [Web Audio API](https://www.w3.org/TR/webaudio/), [Tone.js Sampler](https://tonejs.github.io/docs/15.1.22/classes/Sampler.html).

Nguồn sample ứng viên: [Salamander Grand Piano của Alexander Holm](https://github.com/sfzinstruments/SalamanderGrandPiano). Repository hiện ghi CC BY 3.0. Khi chuẩn bị asset cần giữ nguồn, tác giả, license và ghi rõ việc cắt/chuyển định dạng; khóa phiên bản nguồn. Chưa tải hoặc đánh giá chất lượng sample trong lượt khảo sát này.

Đề xuất thử khoảng 9 sample gốc cách nhau 3 bán âm phủ C4–C6, một mức lực ban đầu; nốt ở giữa dùng sample gần nhất. Chọn sample đã chỉnh cao độ, trim khoảng lặng đầu và fade đuôi sau khi nghe thử. Không đưa toàn bộ bộ đàn gốc vào ứng dụng.

Ngân sách dự kiến: 2–5 MB audio tải xuống, PCM giải mã khoảng 10–25 MB tùy mono/stereo và độ dài. Đây là mục tiêu, cần đo sau khi chọn và mã hóa sample. Tải bộ tiếng khi vào Piano Nhí; chỉ báo sẵn sàng khi nốt trong dải chơi đã có. Tải lỗi có trạng thái và nút thử lại.

### Sáu âm sắc ngay trong bản đầu

| Tiếng đàn | Đặc điểm nghe mong muốn | Cách tạo dự kiến |
| --- | --- | --- |
| Piano | Tiếng gõ rõ, thân âm ấm, đuôi tắt tự nhiên | Sample acoustic piano |
| Piano điện | Êm, tròn và hơi ngân | Tổng hợp/FM và envelope riêng |
| Organ | Âm kéo dài ổn định khi giữ phím | Cộng họa âm, nhả phím có release ngắn |
| Guitar | Tiếng gảy dây, tắt dần | Mô hình dây gảy hoặc PCM tạo sẵn, nghe thử để chọn |
| Đàn gỗ | Tiếng gõ gọn, vui và rõ cao độ | Tổng hợp có thành phần va chạm và họa âm tắt nhanh |
| Hộp nhạc | Trong, leng keng và đuôi ngân | Tổng hợp họa âm dạng chuông, kiểm soát phần âm cao |

Sáu tiếng có engine/envelope khác nhau và đều mở ngay trong cả ba chế độ. Giữ cùng cao độ nốt để trẻ nhận ra một giai điệu qua nhiều nhạc cụ. Cân âm lượng cảm nhận giữa các tiếng; organ không được duy trì âm sau khi đã nhả. Nghe mẫu bài học bằng chính âm sắc đang chọn.

Piano dùng sample; năm tiếng còn lại là âm sắc mô phỏng do dự án tạo. Tái dùng ý tưởng từ SoundMemory nhưng mở rộng đủ 25 cao độ, không kéo một âm ngắn duy nhất đi khắp dải. Ngân sách 2–5 MB phía trên áp cho sample piano; đo riêng bộ nhớ buffer của từng tiếng và chỉ tạo/tải khi cần.

Đổi tiếng dừng/fade nốt cũ và phần nghe mẫu trước khi kích hoạt tiếng mới; tiến độ câu vẫn giữ nguyên. `instrumentId` lưu vào cài đặt theo hồ sơ, không làm thay đổi dữ liệu bài nhạc. Mỗi instrument định nghĩa attack, decay, sustain, release và mức gain phù hợp.

## 5. Thiết kế kỹ thuật cần giữ

- `PianoAudio.noteOn(midi, velocity)` trả `voiceId`; `noteOff(voiceId)` chỉ nhả đúng lần nhấn đó. Cùng cao độ từ hai ngón/thiết bị nhập không được nhả nhầm nhau.
- `setInstrument(instrumentId)` chuyển giữa 6 bộ tiếng trong cùng phiên audio; có trạng thái sẵn sàng/lỗi riêng. Mỗi voice giữ tham chiếu instrument lúc tạo để cleanup chính xác.
- Một AudioContext trong phiên piano, buffer giải mã dùng lại; mỗi lần đánh tạo source riêng. Âm thanh bắt đầu từ xử lý input, không chờ React render và không đợi fetch/decode sau từng lần bấm.
- Trần nguồn dự kiến 24, ưu tiên thu hồi nốt đã nhả; fade khi thu hồi. Theo dõi cả nguồn đang tắt dần để bấm nhanh không làm số nguồn thực tăng vô hạn.
- Theo dõi `pointerId → voiceId`; dọn khi `pointerup`, `pointercancel`, mất capture, blur, ẩn tab, mở hộp thoại, chuyển quãng hoặc thoát game. Chỉ đặt `touch-action: none` trên vùng đàn. [Pointer Events](https://www.w3.org/TR/pointerevents3/) mô tả vòng đời pointer và hủy chuỗi sự kiện.
- Nếu hỗ trợ vuốt qua phím, phải hit-test theo tọa độ khi pointer đang được capture; không chỉ dựa vào `pointerenter`. Có thể để thao tác vuốt sang đợt sau.
- Nút bắt đầu/thử tiếng thực hiện unlock/resume từ thao tác người dùng. Nếu context chưa chạy, không tự nhận đầu vào như đã phát tiếng.
- Phát mẫu và replay theo audio clock; đèn theo thời gian đang nghe. Giảm BPM thay đổi lịch nốt và trường độ, giữ nguyên cao độ.
- Mute dừng các nguồn đang phát và xóa trạng thái phím. Rời màn rồi quay lại không còn nốt kẹt hoặc scheduler cũ.
- Không tự đọc tên nốt bằng TTS mỗi khi bấm: dễ chồng lên tiếng đàn. Nếu có đọc hướng dẫn, phát giữa các lượt.
- Mọi asset dùng `import.meta.env.BASE_URL` do dự án đặt base `/Genius-kids/`.
- Offline chỉ được thông báo sẵn sàng sau khi kiểm tra đủ asset; thử lại sau khi đóng/mở ứng dụng trong trạng thái mất mạng.

## 6. Cấu trúc dự kiến

```text
games/Piano/
  PianoGame.tsx
  piano.css
  components/PianoKeyboard.tsx
  components/LessonPanel.tsx
  components/InstrumentPicker.tsx
  components/SongLibrary.tsx
  audio/PianoAudio.ts
  audio/instruments.ts
  audio/synthVoices.ts
  audio/sampleManifest.ts
  input/keyboardInput.ts
  engine/lesson.ts
  content/lessons.ts
  content/songs.ts
  content/songSources.ts
  progress/progress.ts
  model.ts
public/piano/audio/
  ...sample đã tối ưu...
  LICENSE.txt
  CREDITS.md
```

Tích hợp thêm ở `GameLauncher.tsx`, `hub/catalog.ts`, `hub/HubArt.tsx`, `types.ts`, `StudentContext.tsx`, `profileService.ts` và kiểm tra menu. Luồng `/game?play=piano` sử dụng route game có sẵn nên không cần tạo thêm page route trong `App.tsx`.

Tiến độ dự kiến trong `StudentProfile.piano` có `version`, lesson/song ID, câu đã hoàn thành, chế độ hỗ trợ và ngày cập nhật. Cài đặt riêng theo studentId. Adapter phải lưu thành công trước khi báo đã lưu, giữ snapshot cũ khi ghi lỗi và có đường thử lại.

`Song` cần `id`, `melodyFamilyId`, tên gốc, nhãn tiếng Việt, mức khó, tempo, nhịp, các câu và sự kiện nốt theo beat. `SongSource` giữ edition, trang/URL, thông tin tác giả/nguồn truyền thống, căn cứ quyền sử dụng của phiên bản, ngày kiểm tra và các thay đổi do dự án biên soạn. Tách dữ liệu nhạc khỏi âm sắc và giao diện. Đếm bài theo giai điệu riêng, không theo số biến thể hoặc tốc độ.

Đợt sau ghi bản đàn bằng sự kiện nốt: `{ midi, startMs, durationMs, velocity }`, có ID cho từng lần nhấn. Đây là bản ghi thao tác để phát lại, không phải thu microphone. Không nhét dữ liệu này vào mô hình composition 16 ô của SoundMemory.

## 7. Các đợt và công sức dự kiến

Ước lượng cho một lập trình viên, chưa phải thời hạn cam kết. Giả định tận dụng giao diện dự án, có thiết bị thử và bộ sample thích hợp.

| Đợt | Kết quả | Công sức ước lượng |
| --- | --- | --- |
| A — Đàn chơi được | Keyboard responsive, sample piano, giữ/nhả, hợp âm, input, mute và thoát sạch | 1–2 ngày công |
| B — Ba chế độ và thiết kế | Phòng nhạc 2D, 10 bài làm quen, chơi tự do, khung tập theo mẫu, bộ chọn đủ 6 âm sắc | Thêm 2–3 ngày công |
| C — Hoàn thiện bản đầu | Kiểm tra nguồn và nhập ít nhất 20 bài, chia câu/xếp mức khó, nghe đối chiếu, lưu hồ sơ, menu, offline và thử thiết bị | Thêm 3–5 ngày công |
| D — Mở rộng | Ghi/phát lại bản đàn, chấm nhịp và hiệu chỉnh độ trễ | Thêm 2–4 ngày công tùy phạm vi |

Tổng A+B+C khoảng **6–10 ngày công**, thay cho ước lượng 3–5 ngày của phạm vi nhỏ trước đây. Chuẩn bị tối thiểu 20 bản nhạc, tinh chỉnh 6 âm sắc và kiểm tra giao diện là các phần tăng thêm. Đây là ước lượng lập kế hoạch, phụ thuộc độ phù hợp của các bản nhạc nguồn và kết quả thử thiết bị. Đo chất lượng âm thanh và thao tác trên ít nhất một điện thoại trước khi nhân rộng bài học.

Để sau: pedal sustain, nhiều lớp lực đánh, 61/88 phím, MIDI ngoài, khuông nhạc đầy đủ, xuất file audio, đánh giá tiếng đàn qua microphone và bàn đàn 3D.

## 8. Tiêu chí kiểm chứng khi triển khai

1. Chuột/cảm ứng/bàn phím đều đánh được nốt; đa chạm, nhả ngoài vùng, hủy pointer, đổi quãng và chuyển tab không gây kẹt tiếng. Thử nốt lặp nhanh và hai đầu vào cùng cao độ.
2. Đủ 25 cao độ đúng thứ tự; hợp âm không vỡ tiếng; nhả phím tắt mượt; không tải hoặc giải mã trên mỗi lần nhấn. Đo thời gian xử lý input, nghe thử độ phản hồi; không dùng phép đo JavaScript để khẳng định độ trễ từ ngón tay đến loa.
3. Bài học xử lý đúng nốt lặp, gợi ý, nghe mẫu và input thừa. Đầu vào trước khi bắt đầu câu hoặc tiếng do mẫu phát không được tính là thao tác của trẻ.
4. Hai hồ sơ không lẫn tiến độ; dữ liệu cũ còn nguyên; lỗi lưu/quota có thể thử lại; xóa hồ sơ dọn phần piano.
5. Build production với base `/Genius-kids/`; mở từ menu và URL trực tiếp; cho phép mầm non ở cả hai đường; kiểm tra bộ asset và tải lại offline.
6. Unit test có trọng tâm cho voice lifecycle, lesson engine và persistence; chạy kiểm tra hồi quy SoundMemory và hub khi chạm phần chung. Kiểm tra Chrome desktop/Android và Safari iPhone/iPad trên thiết bị thật khi có; nếu thiếu thiết bị phải ghi rõ phần chưa xác minh.
7. Màn chọn có đúng 3 chế độ; cả ba dùng được 6 âm sắc. Đổi tiếng khi đang giữ phím, nghe mẫu hoặc mute không kẹt nốt, phát chồng hay mất tiến độ.
8. Thư viện có ít nhất 20 giai điệu khác nhau đã hoàn chỉnh, mỗi bài đủ nguồn, dữ liệu nốt, câu nhạc, mức khó và bản nghe mẫu. Nghe đối chiếu nguồn; kiểm tra tổng trường độ, nốt trong dải và không đếm tên khác của cùng giai điệu thành bài mới.
9. Mười bài làm quen có hướng dẫn và hoạt động thực hành; ảnh chụp các cỡ màn hình không tràn nội dung, che phím hoặc làm khó việc chạm phím đen.

Khuyến nghị triển khai A → B → C để hoàn thành phạm vi đã bổ sung; D là mở rộng sau. Bản thử ít bài ở A/B không được coi là đã hoàn thành yêu cầu thư viện tối thiểu 20 bài.
