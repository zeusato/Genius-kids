# Piano Nhí — bản triển khai 17/09/2026

## Vị trí và phạm vi

- Piano Nhí thay Kid Coder ở ô thứ năm của sảnh tiểu học; mầm non cũng truy cập được. Route `/piano` yêu cầu hồ sơ học sinh như các hoạt động khác.
- Kid Coder nằm trong Trò chơi, route `/game?play=coding`. Đường dẫn cũ `/coding` vẫn mở được và nút thoát trở về Trò chơi. Quyền truy cập và dữ liệu Kid Coder giữ nguyên.
- Ba chế độ: 10 bài làm quen, thư viện 24 bài tập và chơi tự do. Không yêu cầu hoàn thành bài học để mở chế độ khác.
- Sáu tiếng: piano acoustic, piano điện, organ, guitar, đàn gỗ, hộp nhạc. Piano dùng 9 sample MP3 (~534 KB); các tiếng còn lại tổng hợp trên thiết bị.
- Bàn đàn C4–C6 gồm 25 phím; hỗ trợ chuột, Pointer Events đa chạm, kéo ngón qua phím và bàn phím máy tính. Điện thoại cuộn ngang bàn đàn với phím trắng khoảng 50 px; nút mũi tên và tự đưa phím gợi ý vào vùng nhìn thấy khi đã nhả tay.
- Nghe câu/toàn bài, tốc độ 50/75/100%, lặp mẫu, chờ đúng cao độ, luyện giữ–nhả và hợp âm hai nốt. Tiến độ ghi theo câu; hoàn thành mọi câu mới đánh dấu cả bài. Đây là cách tập theo từng nốt, không chấm kỹ thuật piano thật hoặc độ chuẩn nhịp biểu diễn.
- Nhãn Đô/Rê/Mi hoặc C/D/E, ẩn tên nốt, tắt gợi ý, chỉnh âm lượng và tôn trọng mute toàn ứng dụng. Nhạc nền dừng trong phòng piano.
- Giao diện 2D, font Nunito có tiếng Việt, tông kem–xanh–gỗ. Bốn tranh màu nước trên giấy tạo bằng imagegen: phòng nhạc và ba chế độ với bạn Cáo; giữ SVG dự phòng khi ảnh chưa cache. Bố cục desktop/điện thoại dọc/ngang; hỗ trợ giảm chuyển động và điều khiển bàn phím.

## Mã nguồn và dữ liệu

| Phần | File |
| --- | --- |
| Trang và ba chế độ | `games/Piano/PianoGame.tsx`, `piano.css`, `PianoArt.tsx` |
| Input và bàn phím | `games/Piano/Keyboard.tsx` |
| Âm thanh, vòng đời nguồn, lịch nghe mẫu | `games/Piano/audio.ts` |
| Bước tập, tách câu, dựng mẫu | `games/Piano/engine.ts` |
| Bài học và 24 bản tập | `games/Piano/content/lessons.ts`, `songs.generated.json` |
| Lưu và chuẩn hóa tiến độ | `games/Piano/progress.ts`, `src/contexts/StudentContext.tsx` |
| Nguồn ký âm và mã kiểm tra | `games/Piano/content/sources/*.xml`, `manifest.json` |
| Sample và ghi công | `public/piano/audio/*.mp3`, `CREDITS.md` |
| Tranh minh họa và prompt | `public/piano/art/*.webp`, `docs/piano-art-prompts.md` |
| Kiểm tra | `games/Piano/piano.test.ts`, các test hub và cấu hình nhạc nền |

Tiến độ và tùy chọn nằm trong `StudentProfile.piano` của từng học sinh. Ghi xuống storage thành công rồi mới cập nhật hồ sơ trên giao diện; không cộng sao và không sửa lịch sử trò chơi. Lỗi lưu có nút thử lại và xác nhận khi dùng nút quay lại trong phòng nhạc. Reload khi còn phần chưa lưu có cảnh báo của trình duyệt. Xóa hồ sơ cũng xóa tiến độ piano.

Âm thanh chỉ mở sau thao tác người dùng. Engine quản lý từng lần nhấn bằng ID riêng, tối đa 24 nguồn kể cả đuôi âm. Đổi nhạc cụ, mute, thoát, chuyển tab, mất focus hoặc đổi thiết bị âm thanh đều ngắt nguồn và lịch nghe mẫu. Lịch mẫu theo audio clock; giảm tốc không đổi cao độ. Tải sample lỗi có thể thử lại hoặc dùng âm sắc tổng hợp.

## Nguồn nhạc

24 bài lấy từ *The Baby’s Opera* và *The Baby’s Bouquet*, bản số hóa Project Gutenberg. Xem [piano-song-sources.md](piano-song-sources.md). Dữ liệu giữ một lượt tuyến giai điệu đã chuyển soạn vào dải đàn; không dùng bản thu thương mại hoặc lời dịch hiện đại. Các phiên bản cổ có thể khác giai điệu quen thuộc ngày nay.

Gutenberg ghi các ấn bản thuộc public domain tại Hoa Kỳ. Hồ sơ này ghi đúng phạm vi nguồn, không khẳng định public domain toàn cầu. Piano là bộ Salamander của Alexander Holm, MP3 từ Tone.js Audio theo CC BY 3.0; phải giữ ghi công và liên kết giấy phép. Các âm sắc tổng hợp và minh họa SVG viết trong dự án.

Tái tạo dữ liệu:

```powershell
node scripts/fetch-piano-assets.mjs
./scripts/build-piano-songs.ps1
```

Script tải chỉ lấy 24 MusicXML đang dùng và 9 sample. Script chuyển soạn chạy offline từ XML đã lưu. SHA-256 phát hiện thay đổi bản nguồn; không tự cập nhật nội dung trong ứng dụng từ một dịch vụ bên ngoài.

## Kiểm tra đã thực hiện

- TypeScript `--noEmit` và Vite production/PWA build.
- Bộ test toàn dự án: 961 kiểm tra tại thời điểm triển khai. Lượt hai luồng qua 957 kiểm tra, 4 kiểm tra nặng cũ quá giới hạn 5 giây. Chạy lại 4 file đó và file piano với `--maxWorkers=2 --testTimeout=60000`: 124/124 qua. Không sửa luật hoặc test của các game cũ để né lỗi.
- Test piano bao phủ 24 nguồn và thời lượng, dải cao độ, không trùng tuyến nốt, giữ mọi nốt khi tách câu, hợp âm, lưu độc lập hồ sơ, lỗi quota/thử lại, hoàn thành không gợi ý theo mọi câu, lifecycle audio, giới hạn nguồn, mute, lịch trễ, tải sample lỗi và PCM của bốn âm sắc tổng hợp.
- Sau khi dọn nguồn xuống đúng 24 MusicXML, chạy lại Piano + hub + cấu hình nhạc: 44/44 qua. Production build chứa đủ 9 MP3 trong manifest PWA.
- Trình duyệt: tạo hồ sơ riêng `Piano QA`; mở Piano từ sảnh; bấm sai rồi hoàn thành bài học; đổi đủ sáu tiếng; tìm bài và nghe mẫu; chơi trọn ba câu của Sắc hoa oải hương; quay lại tiếp tục đúng câu và hiển thị hoàn thành; chơi tự do; mute; đóng hộp ghi công bằng Escape; mở/thoát Kid Coder từ Trò chơi.
- Kiểm tra bố cục desktop và viewport điện thoại 390×844, gồm cuộn bàn phím/dải nốt. Đây là kiểm tra trình duyệt bằng viewport; chưa thay thế thử đa chạm, độ trễ và chất lượng loa trên điện thoại/tablet thật.
- Tải lại ứng dụng và chọn lại hồ sơ kiểm tra vẫn giữ 2 bài đã hoàn thành; bố cục ngang 844×390 hiển thị bàn đàn và cuộn phần phím còn lại.
- Kiểm tra thêm bật tiếng sau mute và tăng âm lượng từ 0: bàn phím bật lại ngay, không cần đổi nhạc cụ hoặc chuyển màn hình. Có test hồi quy cho receiver của `fetch` trên trình duyệt.
- Bộ 4 tranh imagegen tạo 5 WebP (có bản nhỏ cho sảnh), tổng 446.648 byte. Đã kiểm tra ảnh tải được và nằm trọn trong khung ở desktop 1280 px lẫn điện thoại 390 px; khung desktop tỷ lệ 4:3, ảnh dùng `contain`, không bị phần nội dung bên dưới che. Prompt đầy đủ tại [piano-art-prompts.md](piano-art-prompts.md).

PWA dùng hạ tầng tải offline hiện có: sample nằm dưới base URL của ứng dụng, được cache khi dùng hoặc tải offline đầy đủ. Cài ứng dụng đơn thuần không bảo đảm đã tải toàn bộ sample. Phiên kiểm tra trình duyệt chạy trên dev server, không coi đó là nghiệm thu mất mạng thực tế.

Ghi âm/phát lại bài tự đàn và chấm nhịp biểu diễn không nằm trong bản này.

## Bàn phím và UniKey/EVKey

`keyboardInput.ts` ưu tiên `KeyboardEvent.code`, kể cả khi IME trả về `key="Process"` hoặc `keyCode=229`. Chỉ dùng mã phím legacy khi `code` trống/Unidentified; không suy đoán nốt từ chữ đã ghép như `â`.

Nếu bộ gõ chặn keydown nhưng keyup vật lý vẫn tới trình duyệt (ví dụ lần A thứ hai trong A–A), phục hồi một nốt ngắn 100 ms ở lần nhả. Nốt phục hồi có cờ riêng: được tập từng nốt nhưng không được dùng để chấm giữ phím hoặc ghép hợp âm. Nốt nhấn bình thường vẫn phát ngay ở keydown và ngân tới keyup. Giữ phím không tạo nốt lặp; shortcut, ô nhập chữ, hộp thoại và các keyup sót sau blur/reset không phát nốt ngoài ý muốn.

Không có cách suy ra chắc chắn một phím nếu bộ gõ hệ điều hành chặn cả tín hiệu nhấn lẫn nhả. Khi cần giữ phím/hợp âm chính xác hoặc vẫn bị thiếu nốt, chuyển UniKey/EVKey từ V sang E trong lúc đàn. Ứng dụng không tự thay đổi cấu hình bộ gõ hệ thống. Tham khảo [W3C UI Events — Composition](https://www.w3.org/TR/uievents/#events-composition-key-events).

Kiểm tra thay đổi: 14 test chuỗi sự kiện phím + 23 test piano qua (37/37), TypeScript và production/PWA build qua. Trên trình duyệt, A–A tiến đúng 2 nốt, không còn phím bị giữ; A lần ba hoàn thành bài, nghe mẫu sau đó vẫn chạy tới cuối. Các test IME là chuỗi sự kiện mô phỏng; không coi thao tác tự động của trình duyệt là kiểm chứng hook UniKey/EVKey thật.
