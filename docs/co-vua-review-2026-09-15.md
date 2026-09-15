# Review Cờ Vua — plan, triển khai và hướng nâng cấp

Ngày kiểm tra: 15/09/2026. Phạm vi: review module đã code và so với plan/Cờ Tướng; chưa sửa mã game, chưa ghép launcher/profile/PWA.

## Kết luận

**Chưa đủ điều kiện nghiệm thu hoặc ghép.** Move generation có nền tảng dùng tiếp được, nhưng đồ họa hiện là prototype, bố cục mobile làm mất khả năng chơi và có lỗi luật/search/persistence nằm ngoài bộ test hiện có. Cần sửa plan thành kế hoạch hoàn thiện có các tiêu chí đạt cụ thể, không chỉ bổ sung vài dòng vào launcher.

Đã chạy lại: **42/42 tests hiện có PASS**. Đã xem trực tiếp preview desktop và 390×844 bằng in-app browser. Đã chạy các ca tái hiện riêng trên mã hiện tại, không thay mã nguồn ứng dụng.

## 1. Đồ họa và trải nghiệm: cần làm lại phần trình bày

### P1 — Bàn bị cắt trên điện thoại

`games/CoVua/Board3D.tsx:95`: camera cố định bán kính 12, không tính aspect ratio hoặc vùng còn lại sau bảng điều khiển. Ở 390×844, hai biên bàn và nhiều quân nằm ngoài viewport. `co-vua.css:8`/panel mobile đặt đè lên bàn, che cả hàng quân gần người chơi. Đây là lỗi khả dụng, không chỉ sở thích màu sắc.

**Yêu cầu mới:** mọi ô a1–h8 và toàn bộ quân phải nằm trong vùng chơi ở preset mặc định; HUD không che ô có thể chạm. Camera fit theo bounding box, FOV và aspect; layout dành diện tích riêng cho bàn. Kiểm tra portrait/landscape/tablet và chuyển góc khi cầm Đen.

### P1 — Bộ quân chưa đạt Staunton đã cam kết

`Board3D.tsx:16–58`: ghép primitive, Xe không có châu mai, Tượng không có khe mũ, Mã là hai hộp. Cùng một chân đế/thân chóp khiến hình dáng các quân gần giống nhau. Màu sáng mất chi tiết, màu tối chìm vào nền. Bàn là ô BoxGeometry màu phẳng, khung không bo cạnh/vân gỗ/tọa độ. Chưa có cảnh/texture/ánh sáng môi trường như plan.

**Hướng mỹ thuật:** phòng cờ sáng, gỗ óc chó + quân maple/ivory, nhấn đồng trầm; ánh sáng studio ấm có chiều sâu. Giữ cảm giác gia đình của Kỳ Viên ở typography và controls, nhưng không sao chép tiểu cảnh vườn sang Cờ Vua.

- Làm bộ 6 mesh Staunton có silhouette rõ: Mã có cổ/mõm/tai/bờm, Tượng có khe mũ, Xe có châu mai, Hậu có vương miện, Vua có thập tự.
- Dùng geometry lathe có profile được thiết kế và chi tiết gộp, hoặc bộ mesh GLB có nguồn/giấy phép rõ. Mã dựng riêng; tránh ghép hộp làm bản cuối.
- Vật liệu sáng/tối có vân và roughness nhẹ; bo cạnh bàn, bóng tiếp xúc để quân đứng chắc trên mặt bàn. Cân ánh sáng để nhận diện quân ở kích thước điện thoại.
- Duyệt ảnh **gameplay thật** của đủ 12 quân trước khi làm toàn cảnh. Ảnh Flow đẹp không thay thế chất lượng mesh tương tác.

### P2 — Lobby và chuyển động thiếu so với plan

Lobby hiện chỉ là form tối ở giữa màn hình; ảnh Flow đã tạo không được sử dụng trong `CoVuaGame.tsx`. Thiếu lịch sử nước, khay quân đã ăn và nhận diện người chơi rõ như Cờ Tướng. Quân đổi ô tức thì; chưa có animation đi/ăn/nhập thành/phong cấp. 2D dùng Unicode theo font hệ thống, chỉ là SVG role img có onClick, không có điều khiển bàn phím.

**Bổ sung:** lobby có ảnh Flow và lựa chọn màu/đối thủ/mức; bàn + sidebar trên desktop, trạng thái và thanh công cụ riêng trên mobile; animation 220–350 ms sau khi commit, reduced-motion đặt ngay; nhập thành di chuyển cả Vua và Xe; en passant bỏ đúng tốt bị ăn. Bộ SVG 2D riêng có nhận diện thống nhất với 3D, aria-label/touch/keyboard đầy đủ.

### P2 — Chưa thực hiện tối ưu đã ghi trong plan

`Board3D.tsx:70–86,113`: 64 ô là mesh riêng, từng primitive của quân là mesh riêng; không có instancing hoặc geometry gộp. Canvas không đặt `frameloop='demand'`, nên vẫn render liên tục khi đứng yên. Đếm cấu trúc ban đầu khoảng 217 mesh gồm bàn/quân/khung, trước shadow pass; chưa phải số draw calls đo từ GPU.

**Yêu cầu:** gộp geometry mỗi loại quân, instancing, texture/mesh bàn gộp; render khi cần, giới hạn DPR; đo thật triangles/draw calls/FPS/idle thay vì ghi mục tiêu như kết quả. Giữ ngân sách plan ≤90k triangles, ≤80 draw calls.

## 2. Lỗi kỹ thuật phải sửa trước khi ghép

### P1 — Mất WebGL không chuyển sang 2D

Đã bấm nút DEV **Mất WebGL** trong preview: toàn bộ bàn biến mất, chỉ còn nền và bảng điều khiển; không xuất hiện SVG 2D. `Board3D.tsx` không lắng nghe `webglcontextlost`, còn React Error Boundary chỉ bắt lỗi render/lifecycle, không xử lý sự kiện context loss của canvas.

**Sửa:** bắt context loss, chuyển renderer sang 2D và giữ nguyên match/selection/lượt; kiểm thử bằng chính nút DEV, cả khi người chơi đi và khi bot đang nghĩ. Sửa báo cáo không nhầm việc bấm chọn 2D thủ công với fallback tự động.

### P1 — Search không hoàn nguyên khi hết thời gian

`bot.ts:80–81,109–110,122–123`: recursive search và null move không dùng `try/finally` để unmake. Đã instrument **trong bộ nhớ** một lần gọi negamax từ khai cuộc, deadline đã hết: STOP tại node 2048, nhưng 11 ô khác trạng thái ban đầu sau unwind. Ở nhánh Dễ (`bot.ts:159–162`) catch vẫn đánh giá thế đang lỗi rồi tiếp tục các nước gốc khác; như vậy điểm và lựa chọn sau timeout không đáng tin. Nhánh Vừa/Khó dừng vòng nên không nên khẳng định lỗi này tự làm đổi board UI.

**Sửa:** mọi make/null-move phải hoàn nguyên trong finally; abort chỉ trả vòng tìm đã hoàn tất. Bổ sung maxNodes/maxPly/qPly, không tăng depth khi bị chiếu vô hạn; test abort ở nhiều độ sâu. Tắt null-move/check extension trước, chỉ bật lại sau oracle và benchmark.

### P1 — Search không áp dụng đầy đủ luật kết thúc của game

`bot.ts:69–130`: không kiểm tra halfmove/lịch sử lặp/thiếu quân. TT key `posKey` không có ngữ cảnh halfmove/history; mate score cũng lưu/đọc trực tiếp theo ply. Quiescence có thể stand-pat mà chưa nhận ra stalemate. Các điều này trái §5 của plan dù game UI có phân xử hòa sau nước đi.

**Sửa:** adjudicator chung giữa engine/UI/search; lịch sử thật trong search; kiểm tra terminal trước eval/TT; tránh cache điểm phụ thuộc lịch sử, chuẩn hóa mate score theo ply. Không sao chép luật hòa/chiếu dai Cờ Tướng sang Cờ Vua.

### P1 — Bộ kiểm tra bản lưu chấp nhận dữ liệu hỏng và thắng giả

`engine.ts:311–323` chỉ kiểm tra một số trường và có đúng hai Vua. Các thử nghiệm đều trả **true**:

- Đổi mã một quân thành `99`.
- `players: [null, null]`.
- Ván khai cuộc chưa đi nước nào nhưng `phase='over', winner=0, reason='checkmate'`.
- `elapsed=-100`.
- Lịch sử giả `['a1h8']`, position keys giả.

Dữ liệu này được `loadDraft`/worker/persistResult tin tưởng. Một số loại có thể gây crash; thắng giả có thể được ghi thành kết quả. `applyMove` cũng không tự kiểm tra phase hoặc legality: gọi a1→a8 từ khai cuộc chấp nhận Xe đi xuyên quân và ăn Xe Đen.

**Sửa:** schema đầy đủ, kiểm tra players/ownerSide, số quân/vị trí Vua/nhập thành/EP/clock/revision và terminal. Replay từ initial FEN đã ghi kèm lịch sử hợp lệ; phân biệt fixture DEV và bản lưu game. `applyMove` phải từ chối nước sai và ván đã kết thúc.

### P1 — Lặp thế bị đếm sai vì EP không thể thực hiện

`engine.ts:228–230` đưa raw epSquare vào key, kể cả không bên nào có thể bắt qua đường. Ca tái hiện hợp lệ:

```text
e2e4
g8f6 g1f3 f6g8 f3g1
g8f6 g1f3 f6g8 f3g1
```

Thế sau e2e4 đã xuất hiện đủ ba lần với Đen tới lượt, nhưng mã trả `phase='play', reason=null` tại ply 9. Lần đầu có raw EP e3, hai lần sau null, dù không có nước EP hợp lệ ở cả ba lần.

**Sửa:** khóa lặp chỉ phân biệt EP nếu có bắt qua đường hợp lệ, gồm trường hợp tốt bị ghim. Theo [FIDE §9.2.3](https://handbook.fide.com/chapter/e012023), cùng thế phụ thuộc các nước có thể thực hiện, không phải mọi ký tự FEN giống nhau.

### P1 — UI đánh dấu đã ghi kết quả trước khi ghi thành công

`CoVuaGame.tsx:158`: đặt `recorded.current` rồi gọi `complete`, bỏ qua `{ok:false}` và không có retry. Wrapper ở dòng 54 truyền callback ghi rỗng vào `persistResult`, sau đó updateStudent; nên `ok` không phản ánh lần lưu profile thật. `saveDraft` ở dòng 93 cũng bị bỏ qua kết quả, trong khi dialog luôn thông báo đã lưu. Test persistence helper hiện có không kiểm tra luồng UI/wrapper này.

**Sửa:** dùng một completion action của StudentContext dựa trên snapshot mới nhất và `saveProfiles` thật; chỉ đánh dấu hoàn tất sau success; hiển thị lỗi + retry và giữ ended draft. Hook xóa profile bắt buộc gọi clearCoVuaData, không chỉ ghi là phần ghép tùy chọn.

### P1/P2 — Thiếu bảo vệ vòng đời và xin thua sai bên

- `CoVuaGame.tsx:222`: xin thua dùng `match.active`, không xác định người đang xin thua. Khi máy Đen đang tới lượt, người dùng có thể xin thua hộ Đen để Trắng thắng. Không có xác nhận.
- `interactive` và bot effect không phụ thuộc dialog; máy có thể đi khi đang mở Cài đặt/Rời ván. Không có visibilitychange/pagehide để pause/cancel.
- `fallback` dòng 138 gọi search 250 ms trên main thread, khiến giao diện bị chặn và không được xác minh lại như worker reply. Thay bằng nước hợp lệ đã chuẩn bị; worker controller nên dùng chung quy ước với Cờ Tướng.
- `draft` chỉ đọc lúc mount; về lobby sau một ván mới vẫn có thể giữ snapshot draft cũ. Cần cập nhật từ live state hoặc đọc lại khi về lobby.
- Chưa có luồng đề nghị/đồng ý hòa dù model/plan có; chưa có chuyền máy; chủ luôn cầm Trắng, thiếu lựa chọn màu đã hứa.
- Đồng hồ chỉ cộng lúc commit, bao gồm thời gian pause và cắt mỗi khoảng ở 120 giây; chưa phản ánh thời gian chơi thực.

## 3. Plan/report cần sửa

1. Bỏ trạng thái “chờ duyệt trước khi code”; chuyển thành “đã có prototype, đang hoàn thiện”. Chuyển các mục chưa làm thành acceptance gate rõ ràng.
2. Bỏ câu báo cáo “ghép chỉ vài dòng, KHÔNG có gì khác cần”. Cần ownerSide, completion action, cleanup, dữ liệu record và kiểm tra bundle/offline thật sau ghép.
3. Không tuyên bố “đã trên tầm người mới” từ 30 ván thắng random/greedy. Đây không phải mẫu người chơi.
4. Sửa benchmark: vòng tổng kết trong `scripts/benchmark-co-vua.ts` đang tính ván chưa xong là hòa; Wilson đang nhận thắng + nửa hòa. Tách W/D/L/unfinished, fixed-work + deadline thật, bộ khai cuộc khóa/đổi màu, bootstrap theo cặp cho match score; thêm baseline depth-4, bộ mate-in-2, đối đầu Khó–Vừa và Vừa–Dễ. Chốt mục tiêu trước khi nhìn kết quả.
5. Thống nhất luật bản sản phẩm: plan hiện tự hòa ở lần lặp 3/50 nước. Có thể giữ biến thể tự động thuận tiện cho trẻ nhưng phải đặt tên rulesVersion đúng và giải thích; đừng gọi là đầy đủ luật thi đấu FIDE. [FIDE §9.3](https://handbook.fide.com/chapter/e012023) quy định 50 nước qua yêu cầu hòa hợp lệ.
6. Bỏ mục “chiếu dai/đuổi bắt sẽ thêm” khỏi giới hạn Cờ Vua: không mang cơ chế xử thua chiếu dai/đuổi bắt của Cờ Tướng sang đây.
7. Build chung khi game chưa được import chưa kiểm tra bundle của game. Có entry build độc lập hoặc entry review riêng để đo worker/font/asset/chunk/precache thực. Preview DEV không dùng để khẳng định production/offline đã đạt.
8. Bổ sung test controller/UI: timeout unmake, abort Dễ, draw trong search, EP key, saved-state replay, lỗi ghi kết quả, resign trong lượt bot, modal/background pause, nhập thành/EP/phong cấp animation, keyboard 2D và context loss.

## 4. Đồng bộ với Cờ Tướng đến mức nào?

| Dùng cùng quy ước/khung | Giữ riêng |
| --- | --- |
| Owner id + ownerSide; players cố định theo màu | Bàn 64 ô vs 90 giao điểm, ký hiệu quân và nước đặc biệt |
| Lobby: đối thủ, màu, độ khó, tiếp tục ván | Bộ mesh Staunton và vật liệu/phòng cờ riêng |
| Header/controls/settings, pause, reduced motion, lỗi lưu/retry | Luật bí nước: Cờ Vua hòa, Cờ Tướng thua |
| Worker token/version/revision, cancel, fallback đã chuẩn bị | Adjudicator và lịch sử cần thiết của mỗi luật |
| Commit trước animation, completion idempotent theo match ID | Eval/search parameters/puzzle và benchmark riêng |
| Adapter profile + hook xóa + PWA host chung khi ghép | Không lấy báo cáo sức mạnh Cờ Tướng làm nghiệm thu Cờ Vua |

Cờ Tướng cũng chưa nghiệm thu tournament đầy đủ/thiết bị thật. Đồng bộ hợp đồng và trải nghiệm, không mặc định mọi phần của Cờ Tướng đã là chuẩn phát hành.

## 5. Thứ tự triển khai nâng cấp đề xuất

1. **Khóa các lỗi P1 bằng regression test**; sửa validation, search abort/draw/repetition, completion/resign/lifecycle. Giữ engine đang có thay vì viết lại toàn bộ.
2. **Duyệt bộ quân + một bàn gameplay thật**: desktop nghiêng, desktop thẳng, mobile portrait. Đủ quân nhận diện, không bị cắt/che. Đây là gate đồ họa, chưa ghép dự án.
3. **Hoàn thiện UI/animation/audio/2D** theo khung dùng chung; bật lựa chọn màu và các trạng thái còn thiếu.
4. **Đo và nghiệm thu**: perft/oracle/regression, worker budgets, benchmark đúng thống kê, build/offline riêng, thiết bị thật.
5. **Review cả hai game rồi mới ghép** launcher/profile/PWA; chạy kiểm tra toàn dự án sau ghép.

Điều kiện chấp nhận hình ảnh: quân Mã/Tượng/Xe/Hậu/Vua phân biệt được ở kích thước chơi thật; đủ 64 ô trong preset mặc định; không HUD che quân; ánh sáng giữ chi tiết cả hai màu; đi/ăn/nhập thành/phong cấp liền mạch; screenshot gameplay được duyệt, không dùng ảnh bìa thay thế.
