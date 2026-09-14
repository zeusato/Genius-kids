# Cờ Cá Ngựa — bản triển khai local

Ngày kiểm tra: 14/09/2026. Bản này đã chơi được và tích hợp vào danh mục. **Chưa đạt toàn bộ ngưỡng nghiệm thu sức mạnh bot đã đặt trong plan.** Chưa đo trên iPad/Android tablet thật hoặc thử trực tiếp với trẻ.

## Đã triển khai

- 2–4 ghế trên cùng thiết bị; chủ hồ sơ, khách đặt tên/avatar, thêm máy, chọn màu và độ khó riêng. Thứ tự lượt đi theo màu quanh bàn, người bắt đầu được chọn ngẫu nhiên.
- Engine độc lập: 56 ô, 4 ngựa/người, ra 6 xuất quân và thêm lượt, chặn cả ngựa mình, đá đúng ô, vào cửa chính xác, leo chuồng và khóa đích 6–5–4–3.
- Bàn Three.js thực, ngựa đồ chơi có hình học, ánh sáng và bóng; xúc xắc sáu mặt; quân nhảy từng ô, ngựa bị đá quay về khu chờ; đánh dấu nước hợp lệ và nút chọn ngựa ngoài canvas.
- Ba mức máy chạy trong worker. Máy cân nhắc ngựa dẫn đầu, xuất quân dự phòng, nguy cơ bị đá, chặn đường, vào chuồng và hoàn thành. Khó mô phỏng khoảng 256 nhánh × tối đa 24 lượt; Vừa 64 × 8; Dễ chọn trong nhóm nước gần điểm cao nhất. Không điều chỉnh xúc xắc để tăng/giảm độ khó.
- Gieo bằng RNG mật mã với rejection sampling; RNG mô phỏng riêng. Máy không biết kết quả xúc xắc tương lai và không phân biệt đối thủ là trẻ hay máy.
- Pause, hướng dẫn, chuyền máy, hoạt ảnh nhanh, giảm chuyển động, đồ họa nhẹ, 2D dự phòng khi mất WebGL. Lưu ngay hành động trước hoạt ảnh, tiếp tục được sau reload.
- Snapshot và nhóm chơi theo profile; kiểm tra dữ liệu trước khôi phục. Chỉ ghi lịch sử vào chủ profile, chống trùng ID ván; khách thắng không cộng thắng cho chủ. Không phát tiền sao/gacha. Hồ sơ hiển thị số ván thắng và số ngựa về trung bình.
- Lazy load game/scene/worker. Hai cover tổng cộng khoảng 157 kB được precache để ảnh vẫn có ở lần offline đầu; concept không được precache. Dùng chung geometry, instancing cho ô và cây, render khi cần, DPR giới hạn 1–1.5.

## Kiểm thử

- TypeScript `--noEmit`: đạt.
- Vitest: **600/600 kiểm thử, 40 file đạt**. Bao gồm luật, 9.000 hành động ngẫu nhiên có seed trên bàn 2/3/4 người, dữ liệu hỏng, lưu thất bại/thử lại, ghi kết quả lặp, thắng của khách, tách và xóa dữ liệu profile.
- Bộ chiến thuật: **20 thế cờ khác nhau × 4 cách xoay màu = 80/80 đạt**, gồm ưu tiên thắng, hoàn thành, né nguy cơ bị đá, đá đối thủ ở cửa, chờ mặt tốt khi vào chuồng, gỡ ngựa chắn. Không coi bốn phép xoay là 80 thế cờ độc lập.
- Build production thành công, gồm worker riêng và service worker. Còn cảnh báo hiện có về chunk dùng chung lớn, import động/tĩnh và đường dẫn font; không phát sinh lỗi build.
- UI đã thử ở 1024×768, 768×1024, 1180×820 và 390×844. Đã xem bàn 3D, thêm bạn/máy, đặt tên, đổi độ khó, đá ngựa, thắng, reload giữa hoạt ảnh, tiếp tục ván, pause/cài đặt, mất WebGL → 2D giữ ván và mở từ danh mục production.
- Offline production: mở online, dừng máy chủ preview, tải lại ứng dụng, chọn lại profile QA, vào danh mục, mở game và tiếp tục đúng ván/lượt; bàn 3D và thao tác vẫn hoạt động. Thử này mô phỏng origin không truy cập được, không phải bật chế độ máy bay trên tablet. Qua lần thử đã sửa việc cover không được cache trước khi service worker điều khiển trang đầu tiên.
- Khi chạy đồng thời benchmark CPU và toàn bộ test, một test cũ của MathRacing bị quá 5 giây. Chạy lại sau khi benchmark kết thúc: toàn bộ test đạt, không sửa hoặc tăng timeout test đó.

## Sức mạnh máy: số đo thực tế

Mỗi nhóm 512 ván, seed gốc 391057 chưa dùng trong hiệu chỉnh, đổi ghế/màu/người bắt đầu. Cùng luật và giới hạn 3.500 lượt. Đối thủ “tham lam” luôn ưu tiên hoàn thành, vào chuồng, đá, rồi ngựa xa nhất. Mỗi máy tự tối ưu cho mình. Không ván nào vượt giới hạn.

| Đối thủ | Thắng | Tỷ lệ | Khoảng tin cậy Wilson 95% | Mục tiêu ban đầu |
|---|---:|---:|---:|---|
| 1 máy ngẫu nhiên | 447/512 | 87,30% | 84,14–89,91% | ≥70%: đạt |
| 1 máy tham lam | 274/512 | 53,52% | 49,19–57,79% | ≥55%, cận dưới >50%: chưa đạt |
| 3 máy tham lam | 157/512 | 30,66% | 26,83–34,79% | ≥35%, cận dưới >25%: chưa đạt tỷ lệ 35% |

Máy vượt rõ cách đi ngẫu nhiên và có lợi thế đo được so với mức 25% ở bàn bốn người. Dữ liệu đấu đôi chưa đủ để kết luận máy mạnh hơn baseline tham lam. Vì vậy không gọi mức Khó là đã hoàn tất nghiệm thu sức mạnh, hoặc bảo đảm thắng người chơi giỏi. Cần vòng hiệu chỉnh tiếp theo tập trung vào lựa chọn giữa phòng thủ và chạy đích; không tăng sức mạnh bằng xúc xắc thiên vị.

Raw reports: [ngẫu nhiên](horse-race-benchmark-random-2-512-391057.json), [tham lam đấu đôi](horse-race-benchmark-greedy-2-512-391057.json), [tham lam bốn người](horse-race-benchmark-greedy-4-512-391057.json).

Các thử nghiệm hiệu chỉnh ngắn trước đó không được dùng làm số đo nghiệm thu. Tăng chiều sâu mô phỏng không tự động làm máy mạnh hơn; bản cuối giữ mô phỏng ngắn kết hợp điểm chiến thuật để hạn chế nhiễu và độ trễ.

## Đồ họa và hiệu năng

- Cảnh bốn người ở trình duyệt desktop: **90 draw calls, 72.274 tam giác** khi đứng yên; nước đang chọn thêm vòng/số hiệu. Đã giảm từ khoảng 113 calls/97.618 tam giác bằng gom ô chuồng và giảm polygon ở chi tiết mắt/móng.
- P95 mỗi lần gọi `chooseMove` trong benchmark: 9,75 ms đấu đôi tham lam; 10,05 ms ngẫu nhiên; 11,48 ms bốn người. Đây là CPU desktop, có chạy các benchmark song song; không gồm khởi động worker, hoạt ảnh hay độ trễ touch và không đại diện tablet thật.
- Worker dừng tìm kiếm theo hạn 480 ms ở Khó / 160 ms ở Vừa; UI có timeout 2,2 giây và nước dự phòng hợp lệ. Phản hồi được đối chiếu ID ván, revision và token trước khi áp dụng.
- Phần riêng của game ở build: JS giao diện khoảng 28,4 kB, scene 12,1 kB, worker 7,0 kB, CSS 14,4 kB (chưa gzip). Phần React/Three dùng chung được tách riêng.
- Cover 800 px: 121.260 byte; cover 400 px: 35.836 byte. Concept tham khảo 272.940 byte không tải khi chơi.
- Không xuất GLB như dự kiến ban đầu: ngựa và bàn được dựng bằng geometry dùng chung ngay trong scene; tiết kiệm file/model loader, vẫn là vật thể 3D có ánh sáng và raycast. Flow dùng để tạo cover và tham khảo mỹ thuật; không dùng ảnh thay bàn tương tác.
- Chưa có số đo FPS, nhiệt máy, thời lượng pin và multi-touch trên tablet thật. Bố cục nhỏ có các nút chọn ngựa ngoài canvas, vì quân trên bàn nhỏ hơn vùng touch lý tưởng.

## Chạy và tái hiện

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node node_modules/esbuild/bin/esbuild scripts/benchmark-horse-race.ts --bundle --platform=node --format=esm --outfile=.horse-benchmark.mjs
node .horse-benchmark.mjs 512 greedy 4 391057 256
```

Dev fixture: `/Genius-kids/horse-race-preview.html`. Production: chọn profile → Trò Chơi → Cờ Cá Ngựa. Fixture chỉ lưu trạng thái thử riêng, callback hoàn thành không ghi vào profile thật. Không đưa fixture vào build/PWA.

Nguồn asset và kích thước nằm trong `public/horse-race/art/manifest.json`. Thay đổi chưa được deploy lên hosting.

## Bản góc nghiêng trước (đã thay thế)

Camera hạ từ khoảng 54° xuống 39° so với mặt bàn, lệch ngang khoảng 18°. Viền bàn dày hơn, có vân gỗ, nẹp và chân; chuồng có tháp, mái, cờ và hàng rào; cây được bố trí theo cụm với bụi hoa. Ô đi có viền mảnh để dễ đọc ở góc nghiêng. Tháp phía trước thấp hơn để hạn chế che quân/đường đi.

Mô hình chuồng dùng geometry gộp theo màu. Cảnh đang chọn hai nước ở tablet giả lập 1024×768 đo được 86 draw calls / 93.822 tam giác, không tràn ngang. Đã kiểm tra thao tác đá ngựa và chuyển lượt ở góc mới; TypeScript và build đạt. Đây vẫn là kiểm tra viewport desktop, chưa phải FPS trên tablet thật.


## Sửa tỉ lệ bàn và chiều chạy, nâng vật liệu

- Camera trực giao nhìn chính diện, nghiêng 23,6° từ trên xuống (66,4° so với mặt bàn), bỏ xoay ngang. Khối bàn vẫn vuông 17,4 × 17,4; khung chiếu dùng đúng kích thước canvas và thu phóng đồng nhất. Chiều sâu bị thu ngắn khoảng 8,4% theo góc nhìn tự nhiên, không kéo giãn một trục để bù. Các cạnh đối diện song song, hết dáng hình bình hành xiên.
- Đường đi hiển thị ngược kim đồng hồ cho cả bốn màu; mũi tên và hướng đầu ngựa lấy từ cùng đường đi. Ngựa nhìn theo đoạn tiếp theo khi đứng ở góc, quay vào tâm khi vào chuồng. Bàn 2D và vị trí nhãn người chơi dùng cùng bố trí.
- Đổi bố trí hình học, giữ nguyên chỉ số ô, tiến độ tương đối, màu người chơi, cửa chuồng và logic va chạm. Vì vậy ván đang lưu vẫn hợp lệ, không phải xóa hay chuyển phiên bản dữ liệu; thuật toán bot và các benchmark ở trên không thay đổi. Màu xanh dương hiện ở góc dưới trái, vàng ở góc trên phải.
- Ngựa có đế ba tầng, mõm và tai tròn, yên, bờm, đuôi cong và lớp sơn bóng. Thêm ánh sáng môi trường được dựng tại máy, bóng tiếp xúc, ô cờ bóng nhẹ, mũi tên khắc nổi trên ô, mặt bàn có nền phân vùng/họa tiết và viền gỗ dịu màu. Cây chuyển thành cụm ở bốn góc, tránh che đường đi. Texture đều tạo bằng code, không phát sinh tải ảnh/HDR bên ngoài.
- Cảnh bốn người sau nước đá: **96 draw calls / 116.836 tam giác**; scene bundle khoảng **21,8 kB** trước gzip, dùng chung Three. Bóng chính 2048 px ở chế độ thường; chế độ nhẹ bỏ bóng chính và cảnh vườn. Vẫn render theo nhu cầu khi có thay đổi.
- Kiểm tra tự động: **47 test cờ cá ngựa đạt**, gồm 7 test mới cho chiều chạy, góc quay, cửa chuồng, vị trí nhãn và tỉ lệ camera ở bốn kích thước canvas. Kiểm tra TypeScript và build production đạt.
- Trình duyệt: đã chạm trực tiếp quân trên canvas để đá ngựa qua khúc rẽ và chuyển lượt; kiểm tra ngang 1024 × 768, dọc 820 × 1180 không tràn ngang; chuyển 3D → đồ họa nhẹ → 2D → 3D giữ nguyên ván. Nước cuối vào ô 3 hoàn thành 4/4 và đọc lại kết quả từ ván lưu thành công. Chế độ nhẹ đo được 92 calls / 107.940 tam giác, không có lỗi dựng hình. Chưa đo FPS/độ nóng trên tablet thật.


## Bàn toàn màn hình và lựa chọn góc nhìn

- Màn chơi phủ toàn bộ viewport theo cách bố trí của Dragon Quest: cảnh 3D làm nền toàn trang, thanh nút và nhãn người chơi nổi trên cảnh, xúc xắc/lựa chọn quân/trạng thái lưu gom trong một hộp thao tác. Hộp nằm bên phải trên màn ngang và xuống dưới trên màn dọc; trang không phải cuộn khi đang chơi. Màn chuẩn bị vẫn giữ bố cục riêng.
- Thêm hai nút **Thẳng / Nghiêng** ngay trong hộp, có trạng thái aria-pressed và vùng chạm tối thiểu 44 px. Thẳng là camera 3D nhìn vuông góc từ trên; Nghiêng giữ độ nghiêng 23,6° từ trên xuống. Lưu lựa chọn theo hồ sơ; không đổi lượt hay trạng thái quân khi đổi góc. Bàn 2D dự phòng vẫn có trong cài đặt.
- ResizeObserver đo vùng không bị hộp điều khiển che. Camera dùng một hệ số zoom và dịch khung chiếu để bàn nằm trọn vùng đó, trong khi canvas vẫn phủ toàn màn hình. SVG dự phòng dùng cùng vùng hiển thị. Không thêm yêu cầu tải asset.
- Kiểm tra trình duyệt ở 1024 × 768, 820 × 1180 và 390 × 844: canvas bằng viewport, trang không tràn/ngầm cuộn; hộp bình thường không tràn nội dung. Đổi góc, tải lại và tiếp tục ván giữ lựa chọn; chạm quân trực tiếp sau khi đổi góc vẫn đá ngựa và chuyển lượt đúng.
- **50 test cờ cá ngựa đạt**, gồm kiểm tra hai góc camera tránh hộp điều khiển, góc thẳng vuông chính xác và đổi khung chiếu khi xoay màn hình. TypeScript và build production đạt. Kiểm tra mất WebGL vẫn giữ ván và khung bàn 2D; hộp kết quả trên tablet dọc hiển thị đủ các nút chơi lại/đổi người/thoát, không tràn nội dung.


## Camera xoay tự do — 15/09/2026

- Thay camera chỉ có hai vị trí cố định bằng OrbitControls trên cùng OrthographicCamera và scene Three.js. Kéo một ngón/chuột để xoay quanh bàn không giới hạn phương ngang; nâng/hạ góc nhìn từ trên xuống tới khoảng 12,6° trên mặt bàn. Cuộn chuột hoặc chụm hai ngón để thu phóng từ 0,65× đến 2,4×; không cho camera chui dưới mặt đất.
- Thẳng/Nghiêng là các nút trở về góc và mức zoom mặc định, chuyển động 0,55 giây; nhấn lại cùng nút cũng hoạt động. Thao tác tay ngắt chuyển động trở về ngay. Chế độ giảm chuyển động bỏ nội suy và quán tính; thay cài đặt này không đặt lại góc đang xem.
- Resize chỉ thay khung chiếu/độ vừa khung; giữ hướng camera và mức phóng đại tương đối. Fit tám đỉnh khối bàn ở góc hiện tại bằng một hệ số zoom, không thay tỉ lệ x/y/z của mô hình. Các chuồng dùng cùng chiều cao ở mọi phía, bỏ giảm chiều cao theo phía trước/sau của góc cũ. Nhãn người chơi được chiếu từ vị trí góc chuồng ra màn hình và theo camera.
- Bộ nhận diện pointer tách chạm khỏi kéo quá 6 px, kéo đi rồi trở về điểm đầu, nhiều ngón và pointercancel. Chỉ chạm hợp lệ mới raycast chọn quân; các nút chọn quân bên hộp vẫn dùng được.
- Kiểm tra trực tiếp trên trình duyệt: kéo từ trên cao xuống góc thấp, xoay qua phía đối diện, phóng to 1,333×, đặt lại Thẳng/Nghiêng; scene UUID và camera UUID không đổi khi xoay/chuyển preset. Kéo ngay trên quân số 1 rồi trở về điểm bắt đầu không đi quân; sau khi xoay tự do, chạm quân số 1 vẫn đá ngựa và chuyển sang lượt Bông, giữ camera.
- Đổi viewport ngang 1024×768 sang dọc 820×1180 giữ hướng/zoom. Kiểm tra thêm 390×844: trang bằng viewport, hộp thao tác cao 242 px không tràn nội dung. Bật/tắt giảm chuyển động giữ góc. Chuyển 3D → 2D giữ lượt; trở lại 3D dùng preset đã chọn. Đây là thử chuột và viewport desktop; chưa thử pinch trực tiếp trên phần cứng tablet.
- TypeScript đạt; **56/56 test cờ cá ngựa đạt** (thêm kiểm tra fit toàn bộ khối bàn ở 16 phương ngang × 3 góc cao/thấp × 2 viewport, bảo toàn camera khi đổi khung chiếu và bốn tình huống gesture). Build production đạt, 26,23 giây; còn cảnh báo chunk lớn hiện có.


## Phối cảnh ổn định và hướng thanh chắn — 15/09/2026

- Thay camera trực giao bằng PerspectiveCamera FOV 39°, cùng kiểu chiếu và FOV với Dragon Quest. Bản trước vẫn có khối bàn vuông nhưng không có hiệu ứng gần lớn/xa nhỏ; còn tự fit zoom theo đường bao sau mỗi lần xoay, tạo cảm giác hình khối thay đổi. Bản hiện tại chỉ tính khoảng cách vừa khung khi kích thước vùng chơi đổi. Kéo xoay không thay khoảng cách, FOV, zoom hoặc tỉ lệ mô hình. Bánh xe/pinch thực hiện dolly, tức thay khoảng cách camera.
- Vừa khung theo khối cầu bao quanh bàn, độc lập hướng nhìn. Thẳng nhìn từ trên, Nghiêng có góc chéo; giới hạn góc thấp nhất 25,2° trên mặt bàn như Dragon Quest để đường đi không quá bẹt. Mở rộng mặt đất để góc thấp không lộ mép một tấm nền nhỏ. Đây là thay đổi phép chiếu/điều khiển, không ép ảnh nhìn nghiêng thành hình vuông trên màn hình.
- Đo từ bounding box và matrixWorld của mesh bàn đang render: bốn cạnh 17,4; bốn góc 90°; world scale [1,1,1]. Trình duyệt ở 1200×850: camera giữ khoảng cách 43,9576 và FOV 39 khi xoay qua góc thấp và mặt đối diện. Thu phóng bằng bánh xe đến 1,197× đổi khoảng cách thành 36,7339, giữ FOV 39.
- Hướng mũi tên là hướng mặt mở của chuồng và đầu ngựa, không phải trục dài thanh ngang. Hướng này lấy từ TRACK[STARTS[color]] → TRACK[STARTS[color]+1]: đỏ +Z, xanh dương +X, xanh lá −Z, vàng −X. Mô hình chuồng mở theo local +Z, cùng trục trước của ngựa; xoay chuồng và ngựa đang chờ lần lượt 0°, +90°, 180°, −90°. Thanh ngang ở phía sau và vuông góc hướng đi ra. Màu, ô xuất phát, vị trí quân và luật không đổi.
- Thay các kiểm tra giả định phép chiếu trực giao bằng kiểm tra phối cảnh: tỉ lệ vuông/tròn ở góc thẳng trên bốn viewport, gần lớn/xa nhỏ, vừa khung ở 32 hướng ngang × 4 góc cao × 4 viewport mà không thay khoảng cách, và chiếu/raycast về đúng ô sau xoay/zoom/dịch tâm chiếu. **55/55 test, 6 file đạt**; TypeScript đạt; build cuối sau sửa hướng chuồng và đầu ngựa đạt, 21,52 giây (còn cảnh báo chunk lớn hiện có).
- QA cuối: kéo đi/về ngay trên quân hợp lệ không đi nhầm; sau xoay và thu phóng phối cảnh, chạm quân số 1 đá ngựa rồi chuyển đúng sang lượt Bông, giữ camera. Đổi 1200×850 sang 820×1180 giữ góc nhìn và mức dolly 1,197×; trang bằng viewport, hộp thao tác không tràn. Đã trả viewport về kích thước trình duyệt và giữ tab thử để kiểm tra trực tiếp.
- Đối chiếu hướng cuối ở cả góc Thẳng và Nghiêng: mặt mở chuồng và đầu tất cả ngựa đang chờ cùng hướng mũi tên của đội. Chuồng đỏ mở xuống, xanh dương mở phải, xanh lá mở lên, vàng mở trái ở góc nhìn trên; đầu ngựa cùng hướng tương ứng. 55 test hiện có và build sau lần sửa này đều đạt.
