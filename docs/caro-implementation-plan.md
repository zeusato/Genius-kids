# Cờ Ca-rô — kế hoạch triển khai

Ngày: 17/09/2026. Trạng thái: **đã triển khai gameplay, tích hợp Board games và kiểm thử**. Phần dưới giữ thiết kế ban đầu; tính năng thực tế, số đo và giới hạn kiểm thử nằm trong [báo cáo triển khai](caro-sudoku-implementation.md).

## 1. Phạm vi và các quyết định

Đại ca đã chốt hai chế độ: **hai người chơi với nhau** và **một người chơi với máy**. Luật thắng là **đúng 5 quân liên tiếp, không bị chặn cả hai đầu**. Bàn cờ giữ nguyên hướng; đồ họa và trải nghiệm chơi là ưu tiên.

Kế hoạch này hiểu chế độ hai người là **cùng một thiết bị**, phù hợp các board game hiện có. Phòng online, kết nối mạng và đồng bộ giữa thiết bị là phạm vi riêng nếu bổ sung sau.

| Nội dung | Phương án đề xuất cho bản đầu |
|---|---|
| Tên hiển thị | **Cờ Ca-rô**; dòng phụ **Góc giấy ô ly** |
| Vị trí | Trò chơi → Board games → Cờ Ca-rô |
| Đường dẫn | `/Genius-kids/game?play=caro` |
| Bàn | 15 × 15 ô, quân nằm **giữa ô**, tọa độ cố định |
| Quân | X đỏ đất, O xanh cổ vịt; luôn phân biệt được bằng hình |
| Chơi với người | Hai người cùng thiết bị; tên và avatar cho từng bên |
| Chơi với máy | Ba mức Dễ / Vừa / Khó; chọn cầm X hoặc O |
| Đi trước | X đi trước; chơi lại đổi người cầm X/O để luân phiên đi trước |
| Hỗ trợ | Luật minh họa ngắn, đánh dấu nước mới nhất, xem lại ván |
| Đi lại nước | Tùy chọn lúc tạo ván, mặc định tắt; quy tắc ở mục 5 |
| Thời gian | Không đếm ngược ép trẻ; chỉ ghi thời lượng ván |
| Lưu | Tự lưu ván dở theo hồ sơ; tiếp tục sau khi tải lại |
| Kết quả | Thắng/hòa/thua và lịch sử riêng; không phát sao/gacha, theo cách cờ vua hiện có |
| Độ tuổi | Đề xuất mở cho mọi hồ sơ, gồm mầm non chơi cùng người lớn; đồng bộ bộ lọc và đường dẫn trực tiếp |

Bản đầu tập trung một kích thước bàn, một bộ luật và một giao diện hoàn chỉnh. Chưa cần thêm bàn vô hạn, 3D, nhiều skin, luật Renju hoặc xếp hạng online.

## 2. Luật rõ ràng cho cả người và máy

Tham chiếu [Gomocup — Detail Information](https://gomocup.org/detail-information/) có bộ luật Caro 15 × 15: đúng năm quân không bị chặn cả hai đầu; sáu quân không thắng. Đây là nguồn đối chiếu điều kiện thắng, không phải tuyên bố ứng dụng tuân thủ mọi điều lệ thi đấu.

Đề xuất `rulesVersion = 'gk-caro-v1'`:

1. X và O luân phiên đặt đúng một quân vào ô trống. Không di chuyển, ăn quân hoặc bỏ lượt.
2. Sau nước vừa đặt, xét bốn trục: ngang, dọc, chéo xuống, chéo lên. Đếm **toàn bộ chuỗi liên tục** cùng loại chứa quân vừa đặt ở mỗi trục.
3. Chuỗi thắng có độ dài **đúng 5** và hai ô liền kề ở hai đầu **không đồng thời là quân đối phương**. Chuỗi sáu hoặc dài hơn không được cắt ra một đoạn năm để tính thắng.
4. **Quy ước mép bàn đề xuất:** mép ngoài không phải quân đối phương, do đó không được tính là một đầu bị đối phương chặn. Quy ước này được ghi trong Luật chơi và fixture; nguồn tham chiếu trên không giải thích riêng tình huống mép bàn.
5. Một nước có thể tạo nhiều trục: chỉ cần một trục hợp lệ là thắng, kể cả trục khác có sáu quân hoặc bị chặn. Lưu tất cả các chuỗi thắng hợp lệ để tô sáng chính xác.
6. Xét thắng trước; nếu không thắng và bàn đầy thì hòa. Không tự kết luận hòa khi còn ô trống.
7. Nhận thua cần xác nhận, chỉ áp dụng khi ván còn chơi. Hai người có thể đề nghị hòa; người còn lại bấm đồng ý mới kết thúc.
8. Khi ván kết thúc, khóa thao tác đặt quân. Xem lại và chơi lại vẫn dùng được; ván mới có mã riêng.

Ví dụ trong hướng dẫn, dấu `·` là ô trống và `|` là mép bàn:

| Chuỗi | Kết quả cho X |
|---|---|
| `·XXXXX·` | Thắng |
| `OXXXXX·` | Thắng |
| `OXXXXXO` | Chưa thắng |
| `·XXXXXX·` | Chưa thắng |
| `|XXXXXO` | Thắng theo quy ước mép bàn đề xuất |

Nước tạo chuỗi bị chặn hoặc sáu quân vẫn hợp lệ, chỉ không kết thúc ván. Có phản hồi giải thích ngắn khi trẻ thắc mắc; không tự nối chuỗi sai để báo thắng.

## 3. Mỹ thuật và tài nguyên imagegen

**Hướng hình ảnh: một tờ giấy ô ly đẹp trên bàn học cạnh khu vườn.** Cảm giác giấy, bút chì màu và gỗ mờ; màu ấm, chi tiết có chừng mực. Bàn cờ là phần nổi bật nhất trên màn hình.

| Thành phần | Thiết kế |
|---|---|
| Nền | Kem giấy `#FAF6EB`, vân rất nhẹ, lá ở góc ngoài vùng chơi |
| Bàn | Nhìn thẳng từ trên xuống, hình vuông, mặt giấy sáng hơn nền; đường ô rõ và đều |
| X | Nét bút đỏ đất đậm `#A84936`, hai nét chéo rõ |
| O | Nét bút xanh cổ vịt đậm `#216B66`, vòng khép kín rõ |
| Chữ | Màu mực `#243F3C`; dùng font hiện có hỗ trợ đầy đủ tiếng Việt |
| Ô đang chọn | Viền rõ + quân xem trước; khác nước đã đặt cả nét lẫn trạng thái |
| Nước mới nhất | Dấu nhỏ ở góc ô, không dùng sáng nhấp nháy liên tục |
| Thắng | Năm ô sáng lên và đường nối mảnh; vẫn nhìn rõ từng quân |
| Chuyển động | Nét X/O được vẽ trong khoảng 120–180 ms; phản hồi lượt nhẹ, không lật bàn |

**Imagegen built-in** tạo hai ảnh mẫu riêng: ảnh bìa và nền chơi với trung tâm trống. Tài nguyên và prompt đặt ở `docs/caro/`; chỉ đưa bản tối ưu được chọn sang thư mục game khi triển khai. Ảnh bìa dùng cho menu/chọn chế độ; ảnh nền dùng làm cảnh ngoài bàn. Ảnh bìa là minh họa, không dùng làm dữ liệu một thế cờ hợp lệ.

Lưới 15 × 15, X/O, đường thắng, vùng bấm, focus và chữ sẽ dựng bằng HTML/SVG/CSS để tọa độ chính xác, sắc nét ở mọi kích thước. Không nhúng chữ, nút hay bàn có thể tương tác vào ảnh AI.

**Chống che/cắt hình:** card có vùng ảnh riêng theo đúng tỷ lệ; chữ và nút nằm bên dưới. Dùng `contain` cho bìa có chủ thể toàn vẹn; chỉ dùng `cover` với nền trang trí đã kiểm tra vùng an toàn. Ở màn chơi, nền giảm chi tiết hoặc ẩn trên điện thoại để dành diện tích cho bàn. Không đặt nhân vật, bảng điểm hay thông báo lên các ô cờ.

Tài nguyên xuất WebP theo kích thước sử dụng, ảnh bìa có bản nhỏ cho menu. Ngân sách ban đầu tổng hai ảnh runtime dưới 500 KiB. Hai bản WebP mẫu đã xuất và kiểm tra trực quan: bìa 1200 × 800, 133.394 byte; nền 1536 × 1024, 43.974 byte; tổng khoảng **173 KiB**, chưa gồm thumbnail bổ sung. PNG gốc nằm trong hồ sơ thiết kế, không đưa vào bundle runtime. Ảnh lỗi vẫn chơi được bằng nền CSS và quân vector.

## 4. Luồng màn hình

**A. Card trong Board games**

Ảnh bìa thấy trọn bàn giấy, tên Cờ Ca-rô, mô tả ngắn “Nối năm quân, cùng tìm nước hay”, nhãn “1–2 người · X & O”. Quay lại phải về đúng Board games và giữ vị trí cuộn/focus của card.

**B. Chuẩn bị ván**

Hai lựa chọn lớn “Chơi cùng bạn” / “Chơi với máy”. Chơi cùng bạn chọn tên/avatar hai bên; chủ hồ sơ hiện tại + một người khách. Chơi với máy chọn độ khó và quân của mình. Một nút chính “Bắt đầu”; nếu có bản lưu hợp lệ, “Chơi tiếp” nổi bật hơn “Ván mới”. Các tùy chọn phụ như đi lại nước và âm thanh nằm gọn, không tạo nhiều bước bắt buộc.

Lần đầu có ba thẻ luật có thể bỏ qua: đặt vào ô trống → nối đúng năm → hai đầu bị chặn chưa thắng. Mỗi thẻ có ví dụ X/O bằng vector. Đây là hướng dẫn trong hai chế độ, không thêm chế độ thứ ba.

**C. Trong ván**

- Thanh trên: “Về Board games”, tên game, luật và âm thanh.
- Hai bảng tên có ký hiệu X/O, người tới lượt được nhấn rõ bằng cả chữ và viền.
- Bàn chiếm phần lớn diện tích còn lại; bảng phụ thu gọn vào menu trên điện thoại.
- Thanh dưới: lượt hiện tại, ô đang chọn, xác nhận nếu dùng cảm ứng, đi lại nếu đã bật; nhận thua trong menu phụ.
- Máy suy nghĩ: chữ nhẹ “Máy đang nghĩ…” ở bảng tên; người chơi vẫn mở luật, tắt tiếng hoặc rời game được.
- Không có camera orbit, đổi hướng nhìn, nút xoay hay tự xoay khi chuyển người.

**D. Kết quả**

Đầu tiên giữ nguyên bàn và làm rõ chuỗi thắng, rồi hiện tấm kết quả gọn không che toàn bộ bàn. Tên người thắng, số lượt và lý do kết thúc; thông điệp nhẹ nhàng khi thua/hòa. Hành động “Chơi lại”, “Xem lại ván”, “Về Board games”. Chơi lại giữ đối thủ/độ khó, đổi người đi trước; cập nhật rõ ai cầm X/O.

**E. Xem lại**

Tiến/lùi từng nước và về đầu/cuối. Không tính lại thành một kết quả mới, không khởi chạy bot. Bảng chỉ báo nước số bao nhiêu, quân nào vừa đặt; đường thắng chỉ xuất hiện ở trạng thái kết thúc tương ứng.

## 5. Trải nghiệm thao tác và phản hồi

| Thiết bị/tình huống | Cách xử lý |
|---|---|
| Chuột | Hover hiện quân mờ tại ô trống; click đặt một lần; có thể bật xác nhận nếu muốn |
| Cảm ứng | Chạm để chọn, nút **Đặt X / Đặt O** riêng để xác nhận; chạm ô khác đổi lựa chọn |
| Bàn 15 × 15 trên điện thoại | Ở chiều rộng khoảng 360 px, ô chỉ khoảng 22 px sau lề. Cung cấp phóng to/thu nhỏ và pan trong vùng bàn; không giả định mọi ô có vùng chạm 44 px khi thu toàn bàn |
| Phóng to | Tăng ô lên tối thiểu khoảng 44 px ở mức zoom phù hợp; có “Xem toàn bàn”; không tự di chuyển góc nhìn theo lượt |
| Kéo hoặc pinch | Chỉ thay viewport; không đặt quân khi kết thúc gesture; ô đang chọn và tọa độ được giữ chính xác |
| Bàn phím | Mũi tên chuyển ô, Enter/Space đặt hoặc xác nhận, Escape bỏ chọn; không dùng chữ A/S/D nên tránh xung đột gõ tiếng Việt |
| Nhiều pointer/double click | Chỉ một hành động cho mỗi lượt/revision; bỏ qua thao tác lặp và không chuyển hai nước từ một cú chạm |
| Chuyển tab, modal, đổi hồ sơ | Dừng nhận nước và hủy công việc bot đang chờ; khi quay lại xác định lại lượt từ match hiện tại |
| Giảm chuyển động | Hiện quân ngay, bỏ hiệu ứng vẽ/hoa giấy; giữ viền và thông tin lượt |

Nút điều khiển ngoài bàn có mục tiêu chạm tối thiểu 44 × 44 CSS px. Bàn có focus rõ, một điểm Tab vào bàn rồi dùng mũi tên (không bắt Tab qua 225 ô). Mỗi ô đọc được hàng/cột/trạng thái; thông báo lượt và kết quả qua live region ngắn. Chỉ bắt phím khi focus thuộc game, tránh can thiệp ô nhập tên hoặc hộp thoại. Không chặn khả năng zoom trang của trình duyệt.

**Đi lại nếu đã bật:**

- Hai người: đề nghị bỏ nước vừa đặt; người còn lại xác nhận. Hủy đề nghị giữ nguyên ván. Đây là thao tác đồng thuận trên một máy, không phải xác thực danh tính.
- Đấu máy: quay về ngay trước nước gần nhất của người chơi, bỏ cả nước trả lời của máy nếu đã có; nếu bot đang nghĩ thì hủy trước. Không xóa nước mở đầu của máy khi người chưa đi nước nào.
- Chỉ đi lại khi ván còn chơi; `revision` vẫn tăng để mọi trả lời bot cũ hết hiệu lực. Xóa preview, đường thắng và trạng thái tạm theo bàn mới.
- Lưu cờ `assisted` và số lần đi lại trong bản ghi để mô tả ván chính xác. Gợi ý chiến thuật trực tiếp chưa đưa vào bản đầu.

**Âm thanh:** tiếng bút/đặt quân rất ngắn, tín hiệu lượt nhẹ, câu nhạc kết thúc êm; dùng tài nguyên có nguồn rõ hoặc tự tổng hợp. Có tắt tiếng, tôn trọng cài đặt chung, không bật âm thanh trước tương tác. Nhạc nền không lấn phản hồi đặt quân; khi rời game khôi phục đúng nhạc của menu. Haptic chỉ tăng cường nếu thiết bị hỗ trợ, không là điều kiện để hiểu lượt.

## 6. Máy chơi: ba mức có khác biệt thực tế

Engine luật viết riêng bằng TypeScript; bot chạy trong Web Worker. Một hàm phân xử dùng chung cho trận thật, search, xem lại và xác thực bản lưu.

| Mức | Hành vi mục tiêu | Ngân sách tính toán khởi điểm |
|---|---|---|
| Dễ — Làm quen | Biết lấy nước thắng ngay và chặn một đe dọa thắng trực tiếp; các nước khác chọn biến thiên trong nhóm hợp lý, nhìn ngắn | Tối đa khoảng 100 ms |
| Vừa — Thử sức | Ưu tiên tấn công/phòng thủ, biết tạo và phá chuỗi mở, xét thêm nước đáp trả | Khoảng 350 ms |
| Khó — Đấu trí | Tìm sâu tăng dần, ưu tiên nước ép và nhiều mối đe dọa đồng thời | Khoảng 900 ms |

Các con số là ngân sách đề xuất để benchmark trên thiết bị thật; không phải cam kết số đo hoặc sức mạnh đã đạt. Thời gian hiển thị có thể thêm khoảng nghỉ nhẹ 200–400 ms để trẻ kịp thấy nước vừa đi; không đánh đổi độ phản hồi lấy animation dài.

Quy trình chọn nước:

1. Kiểm tra nước thắng tức thì trên mọi ô trống bằng đúng luật Caro. Nếu có, ưu tiên thắng.
2. Kiểm tra nguy cơ đối thủ thắng ngay và các nước ngăn được nó. Không gọi một đe dọa hai đầu là “chặn được” khi đặt một quân vẫn để đối thủ thắng ở đầu kia.
3. Với phần tìm kiếm thông thường, ưu tiên ô trống trong vùng lân cận quân đã có, xếp hạng theo tấn công/phòng thủ; nước chiến thuật bắt buộc ở hai bước trên không bị cắt bởi giới hạn ứng viên.
4. Vừa/Khó dùng alpha-beta tìm sâu tăng dần trong hạn thời gian, sắp nước theo mức đe dọa và cache vị trí có giới hạn bộ nhớ. Mẫu chuỗi phải xét chặn hai đầu, sát mép và chuỗi quá năm.
5. Trả kết quả của vòng tìm kiếm hoàn tất cuối cùng; nếu hết hạn trước đó thì trả nước hợp lệ đã chuẩn bị. Không chạy tìm kiếm sâu đồng bộ trên UI khi Worker hỏng.

Request/reply chứa `requestId`, `matchId`, `revision`, `rulesVersion` và bên tới lượt. Trước khi áp dụng phải kiểm tra lại tất cả thông tin và ô còn trống. Hủy khi đi lại, tạo ván, đổi hồ sơ, rời trang hoặc tạm dừng. Timeout có biên an toàn, fallback hợp lệ, không làm ván đứng mãi. Random dùng seed để tái hiện lỗi và benchmark.

Không quảng cáo bot “bất bại”. Nghiệm thu bằng fixture chiến thuật và đấu đối chứng cùng seed/khai cuộc, đổi X/O; điều chỉnh cấu hình nếu ba mức chưa có khác biệt quan sát được.

## 7. Kiến trúc và lưu dữ liệu

Các nền tảng đã xác minh trong repo: catalog Board games, GameLauncher lazy load, BoardGamesBack, bot-controller và persistence của CoVua/CoTuong, callback hoàn thành theo chủ hồ sơ trong StudentContext. Tái sử dụng các pattern này, viết mới luật và bàn Caro; không kéo theo module xoay bàn/3D.

```text
games/Caro/
  Entry.tsx                 # kết nối hồ sơ, onExit, callback hoàn thành
  CaroGame.tsx              # setup / play / result / replay
  model.ts                  # Match, Player, Rules, Record
  engine.ts                 # đặt quân, phân xử, kiểm tra bản lưu
  Board2D.tsx               # lưới, X/O, selection, focus, viewport
  board-input.ts            # pointer/keyboard/zoom, chống đặt nhầm
  bot.ts / bot.worker.ts    # đánh giá, tìm nước, deadline
  bot-controller.ts         # hủy, timeout, loại reply cũ
  persistence.ts            # draft và preferences theo owner
  profile-adapter.ts        # commit kết quả một lần
  audio.ts / caro.css
  assets/art/               # WebP được chọn từ tài nguyên mẫu
  tests/                    # engine, bot, controller, persistence
```

`Match` tối thiểu: version, rulesVersion, id, owner, ownerSide, players theo X/O, mode, level, boardSize, moves, board, activeSide, phase, winner, winningLines, endReason, revision, elapsed, endedAt, undoEnabled, assisted. X/O không thay nghĩa theo người cầm. Khi chơi lại đổi ghế phải cập nhật `ownerSide`; thắng của chủ hồ sơ không suy ra từ X.

Board JSON là mảng 225 phần tử; dữ liệu search có thể dùng typed array. Danh sách nước là nguồn để dựng lại bàn và kiểm tra: đúng lượt, ô hợp lệ, không trùng ô, không có nước sau khi kết thúc; so khớp board/activeSide/winner. Không tin kết quả hoặc winningLines đọc thẳng từ localStorage.

Draft và cài đặt dùng khóa `caro:<owner>:...`. Lưu trạng thái đã commit trước animation, sau mỗi nước và khi pagehide; thời lượng chỉ tăng khi ván đang hoạt động. Khi đọc bản lưu sai/hỏng/khác phiên bản, báo nhẹ và cho tạo ván mới, không crash. Nếu lưu bị chặn/quota đầy vẫn cho chơi, báo một lần rằng chưa lưu được; không hiển thị trạng thái “đã lưu” giả.

Kết quả vào `gameHistory` qua adapter riêng, idempotent theo `match.id`, kiểm tra owner còn là hồ sơ hiện tại. Đề xuất thêm `GameResult.caro?: CaroRecord` để lưu mode, mức máy, ownerSide, lý do, assisted và nước đi cần cho replay. Giới hạn dữ liệu replay chi tiết 50 ván gần nhất mỗi hồ sơ, vẫn giữ kết quả tổng hợp của ván cũ. Xóa hồ sơ phải dọn draft/prefs tương ứng. Người khách không bị ghi thành hồ sơ học sinh thứ hai.

Màn kết quả chỉ xác nhận đã lưu khi adapter thành công; retry dùng cùng match.id. Ghi lịch sử và stats qua một lần lưu profile để tránh ghi trùng hoặc mất thống kê khi refresh.

## 8. Điểm tích hợp cụ thể

| File/vùng | Công việc khi triển khai |
|---|---|
| `src/components/hub/catalog.ts` | Thêm GameId `caro`, card vào BOARD_GAME_CATALOG; cập nhật `boardGamesFor` và `resolveEntry` đồng bộ cho hồ sơ mầm non |
| `src/components/hub/catalog.test.ts` | Card, deep link, grade gate, parent Board games |
| `src/components/hub/HubArt.tsx`, `hub.css` | Ảnh bìa riêng, kích thước/safe area; không làm đổi bố cục ảnh game khác |
| `games/GameLauncher.tsx` | Lazy import `Caro/Entry`; nhận onBack chung |
| `games/GamesMenu.tsx` | Kiểm tra Back/Forward, tiêu đề, giữ focus và vị trí card; chỉ sửa nếu logic tổng quát chưa bao phủ |
| `games/shared/BoardGamesBack.tsx` | Tái sử dụng nút về danh sách |
| `src/contexts/StudentContext.tsx` | `completeCaro`, xóa dữ liệu Caro khi xóa hồ sơ, chặn completion từ hồ sơ cũ |
| `types.ts`, đọc/ghi hồ sơ | Kiểu record tùy chọn, dữ liệu hồ sơ cũ vẫn đọc được; kiểm tra import/export không mất record |
| Nhạc và hiển thị thống kê | Kiểm tra lifecycle nhạc của game và nhãn Cờ Ca-rô trong lịch sử; không thêm route pathname âm nhạc giả vì game dùng query `play` |
| PWA/build | Worker URL hoạt động dưới BASE_URL, assets không 404; chơi offline sau khi tài nguyên đã được cache và kiểm chứng thực tế |

Không cần thêm mode cấp trang chủ hoặc route riêng thay thế Piano. Cờ Ca-rô là một game con của Board games.

## 9. Mốc thực hiện và điều kiện hoàn thành

| Mốc | Sản phẩm xem được | Điều kiện qua mốc |
|---|---|---|
| M0 — Mỹ thuật và bố cục | Bìa, nền, màn setup + bàn tĩnh desktop/mobile với chữ và X/O thật | Bàn rõ, ảnh không bị cắt/che, vùng điều khiển thuận tay |
| M1 — Hai người chơi | Luật hoàn chỉnh, luân phiên lượt, thắng/hòa, chơi lại, hướng dẫn | Fixture luật pass; double click không đặt hai quân; không xoay bàn |
| M2 — Máy chơi | Ba mức, chọn X/O, trạng thái suy nghĩ, hủy/timeout | Qua bộ thế bắt buộc; không đơ UI hoặc áp dụng reply cũ |
| M3 — Hoàn thiện thao tác | Cảm ứng chọn/xác nhận, zoom/pan, bàn phím, âm thanh và chuyển động | Thử thật trên chuột/cảm ứng; giảm chuyển động và tắt tiếng đúng |
| M4 — Hồ sơ và lịch sử | Tự lưu, tiếp tục, đi lại theo tùy chọn, replay, commit kết quả | Reload/đổi hồ sơ/lỗi lưu không sai ván hoặc ghi trùng |
| M5 — Ghép vào Board games | Card, deep link, build/PWA và báo cáo QA | Các test liên quan, typecheck/build, QA nhiều kích thước đạt |

M0–M5 đã có phần triển khai trong dự án. Bằng chứng kiểm thử phần mềm và giao diện được ghi trong báo cáo; kiểm thử cảm ứng trên thiết bị thật và chế độ offline thực tế chưa nằm trong bằng chứng nghiệm thu hiện tại.

## 10. Bộ nghiệm thu

**Luật:** thắng ở bốn trục và hai chiều; đầu trống/đầu đối thủ; bị chặn hai đầu; chuỗi 6–7; sát mép/góc; một nước tạo nhiều trục; nối hai đoạn thành sáu; ô trùng/ngoài bàn/sai lượt; thắng ở nước cuối bàn đầy; hòa bàn đầy; nhận thua/thỏa thuận hòa; lệnh đến sau kết thúc. Tất cả áp dụng cho cả X và O. Property checks: số quân khớp lịch sử, không ghi đè, replay dựng lại đúng board, không nối qua mép hàng.

**Bot:** tối thiểu 30 thế có đáp án hoặc tập nước hợp lệ chấp nhận được, gồm thắng ngay, chặn thắng duy nhất, đe dọa kép, bẫy chuỗi 6, chặn hai đầu, mép bàn, gần đầy, thế đã kết thúc. Dễ cũng phải qua các thế thắng/chặn một nước cơ bản. Controller test Worker lỗi, timeout, reply sai phiên bản/sai ô, stale sau đi lại/rời game/đổi hồ sơ; mỗi request chỉ áp dụng tối đa một nước. Benchmark ít nhất 50 cặp ván cho mỗi cặp mức trên cùng tập khai cuộc/seed, đảo bên; báo thắng/hòa/thua và thời gian p50/p95, không coi benchmark là chứng minh tối ưu.

**Trải nghiệm:** 360 × 800, 390 × 844, 768 × 1024, 1366 × 768; kiểm tra thêm cửa sổ thấp và điện thoại ngang. Lưới không méo, X/O không mờ, ô cuối nhìn/bấm được, zoom giữ đúng tọa độ, pan không đặt quân, thanh xác nhận không che bàn. Chơi hết ván bằng bàn phím, âm thanh tắt được, focus trở lại đúng nơi sau dialog. Ảnh bìa hiển thị trọn chủ thể, font Việt không lỗi dấu.

**Dữ liệu và tích hợp:** chơi dở → reload → cùng bàn/cùng lượt; lưu trong lúc máy đang nghĩ → tiếp tục đúng một nước máy; chủ hồ sơ cầm O vẫn tính đúng kết quả; callback hoàn thành lặp vẫn một record; đổi/xóa hồ sơ không ghi nhầm; record hỏng/quota đầy có đường tiếp tục; Back/Forward và link trực tiếp cùng luật truy cập; replay không tăng số trận; không mất trạng thái các game cũ.

**Hiệu năng mục tiêu cần đo:** phản hồi chọn/đặt quân trong 100 ms trên thiết bị tham chiếu; animation không chặn input hợp lệ; bot suy nghĩ không gây tác vụ dài trên main thread; bản runtime không mang theo PNG gốc. Chốt mức Dễ/Vừa/Khó và ngân sách ảnh theo số đo sau M2–M3.

## 11. Tài nguyên bàn giao ở giai đoạn kế hoạch

- Kế hoạch này.
- `caro/art/cover-v1.png`, `caro/art/cover-v1.webp`: ảnh bìa mẫu toàn vẹn, bản gốc và bản tối ưu.
- `caro/art/backdrop-v1.png`, `caro/art/backdrop-v1.webp`: nền trang trí trống giữa, bản gốc và bản tối ưu.
- `caro/art/manifest.json`: kích thước, dung lượng, mục đích, vùng an toàn, nguồn công cụ.
- `caro/art-prompts.md`: prompt chính xác đã dùng và ghi chú kiểm tra.

Hai bản WebP đã được dùng trong game. Xem [báo cáo triển khai](caro-sudoku-implementation.md) và [benchmark](caro-benchmark.json) để đối chiếu kết quả thực tế.
