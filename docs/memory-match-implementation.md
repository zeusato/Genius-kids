# Lật Thẻ · Đảo Ký Ức — bản triển khai v2

Ngày 08/09/2026. Đã tích hợp vào **Games → Lật Thẻ · Đảo Ký Ức → Chơi ngay** tại local. Ưu tiên chất lượng chơi và bộ hình đồng nhất theo chỉ đạo mới; không phụ thuộc asset Solar System, xưởng hành tinh hoặc KidCoder.

## Trải nghiệm đã có

- 30 bài, 5 vùng × 6 bài. Bắt đầu 3 cặp; chiến dịch tối đa 12 cặp. Bài đầu dùng tập hình nhỏ, bài sau mở rộng tập hình; vùng thị trấn đi từ xe sang xe và công trình. Vùng hình học có bài ghép hình với bóng.
- Chơi nhanh chọn bất kỳ vùng nào, 3/4/6/8/10/12/15 cặp. Xem trước tắt/3/5/8 giây hoặc tự kết thúc. Bàn 15 cặp mở rộng thêm hình khi chủ đề không đủ 15 hình khác nhau; UI thông báo trước. Hình–bóng tối đa 12 cặp.
- 48 hình SVG mới: 12 động vật, 12 xe/công trình, 12 vật thể không gian, 12 hình học. Không dùng emoji làm mặt thẻ. Hình–bóng dùng cùng đường nét SVG với một màu tối.
- Mặt sau giống nhau trên toàn bàn, lật 280 ms. Cặp sai hiển thị tổng 1.120 ms từ lần chạm thứ hai, tương đương khoảng 840 ms sau lật; thư giãn là 1.820 ms. Cặp đúng xác nhận sau 470 ms và vẫn nằm tại ô cũ.
- Chế độ thư giãn: xem trước tự kết thúc, giữ cặp sai lâu hơn. Gợi ý làm sáng vị trí tương ứng, không tự lật/ghép và không trừ sao. Ván nhiều lượt thử có lựa chọn chơi lại với xem trước.
- Tùy chọn giảm chuyển động, đồng hồ, âm thanh. Âm thanh và nhạc nền trong ứng dụng đồng bộ thiết lập chung; giọng đọc hướng dẫn dùng tiện ích speech hiện có. Đồng hồ mặc định ẩn, không ảnh hưởng sao.
- Tạm dừng, tab ẩn và đổi hướng màn hình giữ nguyên ván. Bàn tạm dừng được che. Số cột nằm trong snapshot nên khôi phục không đổi hàng/cột. Chơi lại cùng seed giữ cả bố cục; bàn mới đổi seed.
- Nút thẻ có nhãn hàng/cột/trạng thái; tên hình chỉ xuất hiện khi lật. Mũi tên chọn ô, Enter/Space lật. Modal giữ focus; chế độ giảm chuyển động bỏ xoay thẻ.

## Hành trình và phần thưởng

Mỗi vùng có sáu phần trang trí cố định, được mở khi hoàn thành bài tương ứng. Cảnh không gian có tinh thể, trạm mái vòm, xe thám hiểm, đài quan sát và cổng quỹ đạo; thị trấn có trường học/tháp đồng hồ; vườn có cây, nhà, hoa và thuyền. Cảnh thưởng ở trang đảo và cuối vùng cho thấy tiến độ đã lưu.

Sổ khám phá ghi lại phần đã mở, bộ hình của các vùng đã chơi và ba cách phối màu trang trí, mở ở mốc 0/6/12 bài. Đây là lựa chọn phối màu trong cảnh dựng sẵn, chưa phải trình kéo thả xây đảo.

- Ba sao khi số lượt ≤ `floor(1,5 × số cặp)`, hai sao khi ≤ `2 × số cặp`, còn lại một sao.
- Điểm lịch sử = `round(1000 × số cặp / số lượt)`. Thời gian không quyết định sao.
- Mỗi bài chiến dịch chỉ cấp sao mới: 1 → 3 sao nhận thêm 2; chơi lại 3 sao không cộng tiếp. Tổng sao từ 30 bài tối đa 90, chưa tính thành tích chung.
- Thành tích chung được tính bằng dữ liệu thật, phần thưởng trình bày cùng bảng kết quả để không chồng hai modal. Bài 3–6 cặp ghi `easy`, 8–10 ghi `medium`, 12 ghi `hard`.
- Chơi nhanh lưu kỷ lục riêng, không tăng tiền sao, số ván thắng hoặc thành tích chung. Kỷ lục tách theo vùng/số cặp/luật/preview/thư giãn/có hay không gợi ý. Lịch sử giữ điểm, thời gian và metadata từ cùng một ván tốt nhất.

## Lưu và tương thích

`StudentProfile.memoryMatch` giữ tiến độ version 2. Draft và tùy chọn dùng key riêng theo ID học sinh: `memory-draft:<id>`, `memory-prefs:<id>`. Draft lưu deck, seed, số cột, phase, lựa chọn, cặp đã ghép, lượt thử, gợi ý, thời gian chơi và thời gian chờ còn lại. Các chuyển trạng thái được lưu ngay; đồng hồ được checkpoint mỗi 5 giây.

Reducer tự chặn chạm trùng, thẻ thứ ba khi đang xử lý và action sai session ID. Snapshot sai schema/tập hình/cặp/trạng thái bị từ chối; có thông báo và vẫn cho bắt đầu ván mới.

Kết quả được ghi ngay khi xác nhận cặp cuối. Adapter `persistMemory` ghi snapshot hồ sơ trước khi cập nhật React hoặc công bố thưởng. Ghi lỗi giữ kết quả và cho thử lại; khôi phục kết quả đã lưu không trả thưởng lần nữa. `starAwards` ghi delta theo ngày cải thiện; không làm tăng lại thống kê số ván thắng.

Giữ nguyên lịch sử/sao của phiên bản cũ và dữ liệu KidCoder. V2 không gọi callback thưởng/gacha cũ trong `GamePage`. Có **Mở phiên bản cũ** ở cuối trang đảo; `VITE_MEMORY_V2=false` đưa mục Memory về v1 lúc build.

## Kiểm tra đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| Vitest toàn dự án | 341 test / 17 file qua; Memory có 49 test mới |
| Sinh bàn có seed | 6.500 cấu hình/seed được kiểm tra đủ cặp, ID riêng và tính tái hiện |
| Chiến dịch | Chạy engine hoàn tất cả 30 bài, cả hình–bóng; kiểm tra unlock và trần thưởng |
| State/timer | Chạm trùng, thẻ thứ ba, action cũ, preview tự/manual, pause giữa hai thẻ, cặp cuối chờ xác nhận, restore số cột |
| Lưu/thưởng | Ghi lỗi/retry, không đụng hồ sơ khác, cải thiện đúng ngày, giữ lịch sử v1, chơi nhanh không farm thành tích |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --pretty false` qua |
| Production | Vite build và tạo service worker thành công; còn cảnh báo chunk lớn/import động trùng import tĩnh của các module chung, không có lỗi build |
| Browser thật trên desktop | Đi qua Games trong ứng dụng, hoàn thành một bài, tải lại, thấy 3 sao và 1/30 bài; không có lỗi console trong luồng đã kiểm tra |
| Responsive | Xem desktop, 768×1024, 390×844, 360×640; bàn 30 thẻ ở 390 px khoảng 64 px/thẻ, không tràn ngang; viewport nhỏ hơn giữ nút và cho cuộn khi cần |
| Thao tác browser | Bàn phím, che bàn khi pause, thẻ ngửa còn nguyên sau reload, preview manual, giảm chuyển động với transform `none`, hình–bóng 12 cặp |
| Lỗi ghi trong UI | Fixture riêng mô phỏng quota: giữ kết quả, nút thử lại; tải lại khi ghi được chỉ nhận delta sao còn thiếu |
| Mỹ thuật | Xem bảng đủ bộ 48 hình, bàn nhỏ/30 thẻ, bóng hình và cảnh vùng; sửa lại đường cong giọt nước, tách mascot khỏi công trình trên đảo |

Hồ sơ thử và fixture phục vụ browser QA được dọn sau kiểm tra; không thay dữ liệu học tập của hồ sơ hiện có.

## Hiệu năng và cấu trúc

Giao diện tải bằng `React.lazy` khi mở Memory. Không thêm dependency. Không import renderer WebGL vào đồ họa game. SVG mặt trước dựng sẵn cùng bàn, các thẻ được `memo`; timer không thay ảnh hoặc thứ tự lưới.

Bundle production riêng của Memory: JavaScript khoảng **56,72 kB / 17,99 kB gzip**, CSS **23,19 kB / 5,79 kB gzip**. Đây là kích thước hai chunk riêng, không phải tổng tải ứng dụng; engine/progress và các thư viện dùng chung nằm trong các chunk chung.

Các file chính:

- `games/MemoryMatch/MemoryAdventure.tsx`: hành trình, tùy chọn, chơi nhanh, điều phối ván và kết quả.
- `engine/`: dữ liệu, reducer, kiểm tra snapshot, scoring và test.
- `content/catalog.ts`: 48 ID hình, 5 vùng, 30 bài và phần thưởng.
- `components/`: SVG Picture/Island, nút thẻ và modal.
- `session/`: timer, pause/checkpoint và âm thanh.
- `progress/`: tiến độ, adapter ghi bền vững, draft và test.
- `games/GamesMenu.tsx`, `src/contexts/StudentContext.tsx`, `types.ts`, `services/profileService.ts`: tích hợp vào ứng dụng.

## Phạm vi cần đo tiếp

Các phép thử viewport dùng trình duyệt desktop, chưa thay thế thử cảm ứng trên điện thoại/tablet vật lý, Safari hoặc screen reader thực. Chưa đo FPS/thời gian phản hồi trên máy yếu, chưa xác nhận reload offline toàn ứng dụng và chưa thử chơi với trẻ. Không kết luận khả năng giữ chân chỉ từ test kỹ thuật.

Tiến độ lưu trên thiết bị; chưa có transaction phối hợp nhiều cửa sổ cùng ghi một hồ sơ. Kỷ lục trong cùng preset vẫn chịu ảnh hưởng khác biệt giữa seed, không phải đánh giá năng lực trí nhớ chuẩn hóa. Thử quan sát 5–8 trẻ như kế hoạch là bước tiếp theo để chỉnh độ khó, thời gian giữ cặp sai, kích thước chữ và mức hấp dẫn của phần thưởng.

Đảo kéo thả, bộ thẻ tự tạo, ghép kiến thức và hai người luân phiên thuộc phạm vi sau v2.
