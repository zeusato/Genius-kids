# Cờ Tướng — kế hoạch triển khai chi tiết

Ngày lập: 15/09/2026. Cập nhật sau review: 15/09/2026. Trạng thái: **đã sửa đặc tả; chưa triển khai game.**

Bản sửa này chốt phạm vi luật bản đầu, dữ liệu chủ hồ sơ, tính đúng của bot và các điều kiện nghiệm thu. Các mốc §12 là thứ tự triển khai; chưa có số đo sức mạnh hoặc hiệu năng thực tế.

## 1. Quyết định đã chốt

- **Chế độ chơi:** 2 người trên cùng máy, hoặc người đấu máy. Chỉ 2 ghế (Đỏ / Đen).
- **Trí tuệ bot:** engine **thuần TypeScript** chạy trong Web Worker cho cả ba mức Dễ/Vừa/Khó ở bản phát hành đầu. Làm bot cơ bản đúng trước, bổ sung tối ưu sau khi qua kiểm thử. Tầng **"Đại sư" (WASM Pikafish)** là hạng mục tương lai, cần adapter và kiểm chứng tương thích luật.
- **Think-time bot:** ngân sách suy nghĩ **tăng dần theo độ khó** — mức cao được nghĩ lâu hơn; nâng thêm về sau chỉ là thay cấu hình, không đổi kiến trúc. UI chờ theo deadline của mức + biên an toàn.
- **Đồ họa:** phong cách **cổ điển nhưng ấm áp** — bàn gỗ/giấy tông ấm, quân đĩa khắc chữ Hán, sông–cung theo lối cổ, ánh sáng dịu thân thiện trẻ.
- **Chữ trên quân:** mặc định **chữ Hán truyền thống** (帥/將…); có **tùy chọn nhãn thuần Việt** (Tướng/Sĩ/Tượng/Mã/Xe/Pháo/Tốt) cho trẻ chưa quen chữ Hán. Bật/tắt được, lưu theo hồ sơ.
- **Trợ giúp: KHÔNG** hoàn tác (undo), **KHÔNG** gợi ý nước đi — giữ trải nghiệm cờ thật. Chỉ giữ đánh dấu ô đích hợp lệ của quân đang chọn và báo chiếu (phản hồi tương tác/luật, không phải gợi ý chiến thuật).
- **Nguyên tắc kỹ thuật kế thừa** (giống 3 board game hiện có): commit trạng thái *trước* animation (reload an toàn), ghi kết quả idempotent chỉ vào chủ hồ sơ, không phát sao/gacha, fallback 2D khi mất WebGL, chế độ giảm chuyển động và đồ họa nhẹ.
- **Màu quân và chủ hồ sơ:** `Side = 0` luôn là Đỏ, `Side = 1` luôn là Đen; Đỏ luôn đi trước. Chủ hồ sơ chọn được cả hai màu; `ownerSide` xác định kết quả của chủ hồ sơ.
- **Bộ luật bản đầu:** `rulesVersion: 'gk-xiangqi-v1'`. Có xử thua bên chiếu dai một phía theo quy tắc lặp cụ thể ở §3.2; chưa phân xử đuổi bắt theo đầy đủ WXF. Hiển thị phạm vi này trong phần Luật chơi.
- **Thứ tự làm:** luật + engine → bàn 2D chơi/lưu được → bot và benchmark → 3D/âm thanh/ảnh bìa → kiểm thử phát hành.

## 2. Hạ tầng tái sử dụng và phần phải điều chỉnh

| Thành phần nguồn | Dùng cho Cờ Tướng | Điều chỉnh bắt buộc |
|---|---|---|
| `games/OAnQuan/bot.worker.ts` | nhận yêu cầu, trả kết quả | Đổi dữ liệu, kiểm tra phiên bản luật và giao thức ở §5.3 |
| `games/OAnQuan/bot.ts` | iterative deepening, ngân sách, random có seed | Viết move-gen/search riêng; không sao chép toàn bộ `Match` và lịch sử tại mỗi nút |
| `games/HorseRace/HorseRaceGame.tsx` | token `id:revision:request`, hủy worker, kiểm tra nước | Timeout theo mức; fallback là nước hợp lệ có sẵn, không tìm kiếm đồng bộ |
| `games/*/BoardCamera.tsx` | FOV 39°, orbit, preset, fit bàn | Thêm hướng nhìn theo màu, lật bàn và kiểm tra ánh xạ tọa độ |
| `games/*/Board3D.tsx`, `Board2D.tsx`, `geometry.ts`, `scenery.ts` | vòng đời cảnh và giao diện dự phòng | Bàn giao điểm, chữ quân, lựa chọn chung giữa 2D/3D |
| `games/OAnQuan/persistence.ts` | key theo owner, validate, ghi một lần | Đổi giả định `winner === 0` thành `winner === ownerSide`; thêm kết quả chiếu dai |
| `games/OAnQuan/model.ts` | cấu trúc match/player/record | Tách màu, chủ hồ sơ, lịch sử và dữ liệu tìm kiếm theo §4 |
| catalog, launcher, `StudentContext`, trang hồ sơ | đăng ký và lưu kết quả | Danh sách tích hợp đầy đủ ở §8.1 |
| `scripts/benchmark-o-an-quan.ts` | seed, đổi bên, báo cáo JSON | Bổ sung quy trình thống kê ở §6; script nguồn chưa tính Wilson 95% |

Tái sử dụng theo pattern và API phù hợp; các tỷ lệ tái sử dụng chưa được đo nên không dùng để ước lượng tiến độ. Phần luật, search và hiển thị chữ quân cần được kiểm chứng riêng.

## 3. Luật Cờ Tướng — đặc tả engine

### 3.1 Bàn & quân

- Bàn 9 cột (file) × 10 hàng (rank), quân đặt trên **giao điểm**; tổng 90 điểm. Sông giữa hàng 4–5. Cung (palace) 3×3 mỗi bên với hai đường chéo.
- Tọa độ cố định: rank 0 là đáy phía Đỏ, rank 9 là đáy phía Đen; file 0–8 từ trái sang phải khi nhìn từ phía Đỏ. Đỏ tiến theo rank tăng, Đen tiến theo rank giảm. Lật bàn chỉ thay phép chiếu tọa độ lên màn hình.
- 7 loại quân mỗi bên (ký tự truyền thống khác nhau theo màu):
  - **Tướng** 帥/將 — trong cung, đi/ăn 1 ô dọc-ngang; **luật phi tướng**: hai Tướng không được đối mặt trực tiếp trên cùng cột không có quân chắn.
  - **Sĩ** 仕/士 — trong cung, đi chéo 1 ô.
  - **Tượng** 相/象 — đi chéo 2 ô, **không qua sông**, bị "cản mắt" (điểm giữa đường chéo có quân thì không đi được).
  - **Mã** 傌/馬 — đi chữ nhật (1 thẳng + 1 chéo), bị **"cản chân"** (ô kề theo hướng thẳng có quân thì bị chặn).
  - **Xe** 俥/車 — đi/ăn thẳng không giới hạn, không nhảy.
  - **Pháo** 炮/砲 — đi như Xe khi không ăn; **khi ăn phải có đúng 1 quân làm ngòi** giữa Pháo và mục tiêu.
  - **Tốt** 兵/卒 — tiến 1 ô; sau khi **qua sông** được đi ngang 1 ô; không lùi.

### 3.2 Kết thúc ván

**Phạm vi:** `gk-xiangqi-v1` là bộ luật ứng dụng có giới hạn được công bố rõ. Tham chiếu [World Xiangqi Rules 2018 của WXF](https://www.wxf-xiangqi.org/images/wxf-rules/2018_World_XiangQi_Rules_English2018.pdf): chiếu dai một phía có thể bị xử thua. Quy trình tự động dưới đây là đặc tả của bản đầu; chưa tuyên bố thực hiện đầy đủ phân xử WXF.

- Nước đi hợp lệ là nước **không để Tướng mình bị chiếu** sau khi đi, gồm phi tướng. Không sinh nước ăn Tướng; ván kết thúc bằng phân xử thế cờ. Tách kiểm tra bị tấn công khỏi lọc nước hợp lệ để tránh gọi đệ quy lẫn nhau.
- **Chiếu bí:** bên tới lượt bị chiếu và không có nước hợp lệ → bên đó thua, `reason: 'checkmate'`.
- **Bí nước:** bên tới lượt không bị chiếu nhưng không có nước hợp lệ → bên đó thua, `reason: 'stalemate'`.
- **Nhận thua:** người chơi xác nhận bên nhận thua → bên còn lại thắng, `reason: 'resign'`.
- **Thỏa thuận hòa:** chỉ ở chế độ hai người; phải có thao tác chấp nhận của đối thủ. Gửi đề nghị không kết thúc ván; từ chối hoặc tải lại trang thì hủy đề nghị, giữ nguyên bàn. Chấp nhận → `winner: null`, `reason: 'agreement'`.

**Quy tắc lặp áp dụng ngay bản đầu:**

1. Hai thế giống nhau khi **bàn quân và bên tới lượt** giống nhau. `positions[0]` là thế khai cuộc, mỗi nước hoàn tất nối thêm một vị trí. Dùng chuỗi mã hóa bàn không mất thông tin để xác nhận bằng nhau; Zobrist chỉ phục vụ tăng tốc search.
2. Sau một nước, nếu vị trí hiện tại xuất hiện ít nhất ba lần, lấy **ba chỉ số xuất hiện gần nhất `a < b < c`**. Xét toàn bộ các nước `history[a]` tới `history[c - 1]`, tức hai lần quay lại vị trí đó; không yêu cầu hai đoạn có cùng độ dài.
3. Với mỗi bên, xác định bên đó có đi ít nhất một nước và **mọi nước của bên đó trong đoạn xét đều chiếu Tướng đối phương** hay không. `gaveCheck` được tính từ bàn sau nước đi, không tin cờ do UI/worker tự khai.
4. Nếu **chỉ một bên** thỏa điều kiện trên: bên đó thua, `reason: 'perpetual-check'`. Nếu cả hai bên hoặc không bên nào thỏa: hòa, `reason: 'repetition'`.
5. Xử tự động tại lần xuất hiện thứ ba. Hiển thị bên thua và lý do rõ ràng. Nước kết thúc do chiếu dai vẫn là nước di chuyển hợp lệ; không âm thầm loại khỏi danh sách ô đích rồi làm sai kiểm tra bí nước.

**Thứ tự phân xử sau nước đi:** áp dụng nước và đổi lượt → tính chiếu, nước hợp lệ → chiếu bí/bí nước → luật lặp → tiếp tục ván. `adjudicatePosition` dùng chung cho game và bot, trả cùng kết quả trên cùng bàn và lịch sử. Nhận thua/thỏa thuận hòa chỉ nhận khi ván còn chơi; mọi lệnh tới sau khi kết thúc bị bỏ qua.

**Để giai đoạn sau:** phân xử đuổi bắt và các ngoại lệ theo toàn bộ WXF 2018. Không giản lược phần này thành một kiểm tra “quân không được bảo vệ”. Khi bổ sung phải có bộ thế tham chiếu, tăng `rulesVersion` và chính sách đọc bản lưu cũ. Bản đầu không tự hòa theo số nước không ăn quân; giới hạn độ dài của benchmark không phải luật kết thúc ván thật.

### 3.3 Biểu diễn trong mã

- Bàn: mảng phẳng `Int8Array(90)`, index = `rank*9 + file`. Mã quân: `0` trống; `1..7` lần lượt Tướng/Sĩ/Tượng/Mã/Xe/Pháo/Tốt Đỏ; mã âm tương ứng quân Đen. Bản JSON dùng `number[]`.
- Danh sách quân (piece list) và vị trí hai Tướng là dữ liệu dẫn xuất để tăng tốc; phải khớp bàn sau mọi thao tác đi/thử nước/khôi phục.
- `Move = { from, to }`; lịch sử lưu nước có cấu trúc cùng bên đi và trạng thái chiếu. Ký hiệu tọa độ để hiển thị có thể suy ra từ dữ liệu này.
- Thế khai cuộc cố định: hàng đáy mỗi bên Xe–Mã–Tượng–Sĩ–Tướng–Sĩ–Tượng–Mã–Xe; Pháo ở file 1/7, rank 2/7; Tốt ở file 0/2/4/6/8, rank 3/6. Đỏ tới lượt.
- **Perft** đếm chuỗi nước di chuyển hợp lệ theo độ sâu, tách khỏi tự động xử lặp/nhận thua/thỏa thuận hòa. Đối chiếu trên đúng thế khai cuộc này:

  | depth | nodes (tham chiếu) |
  |---:|---:|
  | 1 | 44 |
  | 2 | 1.920 |
  | 3 | 79.666 |
  | 4 | 3.290.240 |

  Depth 1–3 chạy CI; depth 4 bắt buộc chạy trước phát hành và khi đổi move-gen. Lưu fixture bàn, nguồn/phiên bản engine đối chứng và kết quả trong repo khi làm M1. Nếu lệch, in `perft divide` (số nút theo từng nước gốc) để khoanh vùng; phải giải thích và sửa trước khi chuyển mốc. Perft không thay thế test kết thúc ván hoặc luật lặp.

## 4. Data model (`games/CoTuong/model.ts`)

```ts
export type Side = 0 | 1; // 0 = Đỏ, 1 = Đen; không phải số ghế của chủ hồ sơ
export type Level = 'easy' | 'medium' | 'hard';
export type EndReason = 'checkmate' | 'stalemate' | 'perpetual-check'
  | 'repetition' | 'resign' | 'agreement';
export interface Player {
  id: string;
  name: string;
  avatar: string;
  kind: 'human' | 'bot';
  level: Level;
}
export interface Move { from: number; to: number }
export interface PlyRecord extends Move {
  side: Side;
  gaveCheck: boolean;
}
export interface Match {
  version: 1;
  rulesVersion: 'gk-xiangqi-v1';
  id: string;
  owner: string;
  ownerSide: Side;
  players: [Player, Player]; // luôn index theo màu: [Đỏ, Đen]
  board: number[]; // 90 ô theo mã quân ở §3.3
  active: Side;
  phase: 'play' | 'over';
  winner: Side | null;
  reason: EndReason | null;
  revision: number; // tăng sau nước đi hoặc lệnh kết thúc, không tăng theo timer
  ply: number; // số nửa nước đã hoàn tất
  elapsed: number; // ms chơi, không tính lúc pause/ẩn trang
  endedAt: string | null; // ISO timestamp, cố định tại lần kết thúc đầu tiên
  history: PlyRecord[];
  positions: string[]; // chuỗi bàn + lượt; gồm thế khai cuộc ở index 0
}
export interface GameRecord {
  version: 1;
  rulesVersion: 'gk-xiangqi-v1';
  ownerSide: Side;
  hostResult: 'win' | 'draw' | 'loss';
  players: [Player, Player];
  winner: Side | null;
  reason: EndReason;
  plies: number;
}
```

### 4.1 Bất biến và kiểm tra bản lưu

- Khởi tạo `active = 0`, `ply = 0`; bỏ trường `first`. `players[ownerSide].id === owner`, chủ hồ sơ là người; hai player có id khác nhau. Chỉ có người–người hoặc người–bot. Đổi màu tại lobby tạo cách xếp `players` tương ứng; không đổi màu giữa ván.
- `history.length === ply`, `positions.length === ply + 1`; vị trí cuối khớp bàn và lượt hiện tại. `inCheck`, danh sách nước hợp lệ và danh sách quân được tính lại; không lưu thêm một bản có thể bị lệch.
- Với ván từ khai cuộc, `active === ply % 2`; nhận thua/thỏa thuận hòa không đổi lượt hoặc tăng `ply`. `revision` có thể lớn hơn `ply` do lệnh kết thúc, không dùng hai trường này thay cho nhau.
- Luôn còn đúng một Tướng mỗi bên; mã quân/địa chỉ hợp lệ; số lượng từng loại không vượt khai cuộc. Nước ăn làm giảm đúng một quân đối phương, nước thường giữ nguyên số quân.
- `validateMatch(state, owner)` kiểm tra owner/version/shape trước, rồi replay từ khai cuộc khi tải bản lưu để xác nhận từng nước hợp lệ, `gaveCheck`, `positions`, bàn cuối và kết quả. Không replay toàn lịch sử ở mỗi nút search. Fixture thế cờ riêng dùng `SearchPosition`, không giả làm bản lưu ván từ khai cuộc.
- Ván đang chơi có `winner = reason = endedAt = null`. Ván đã kết thúc có reason/timestamp hợp lệ; chỉ repetition/agreement có `winner: null`. Không chấp nhận lịch sử tiếp tục đi sau khi engine đã phân xử kết thúc.
- Sai owner, JSON hỏng, sai luật hoặc dữ liệu không nhất quán: báo không đọc được bản lưu, cho bắt đầu ván mới; không âm thầm đổi luật hoặc tự ghi kết quả từ dữ liệu lỗi.

### 4.2 Lưu ván và kết quả

- Dùng key `co-tuong:<owner>:draft-v1`, `party`, `prefs`. Commit nước hợp lệ và phân xử kết thúc một lần → tăng `revision` → lưu → animation. Tải lại giữa animation hiển thị trạng thái đã commit, không đi lại nước đó.
- `hostResult = winner === null ? 'draw' : winner === ownerSide ? 'win' : 'loss'`. `persistResult` ghi theo `match.id`, chỉ cập nhật owner; tăng `stats.gameWins['co-tuong']` chỉ khi `hostResult === 'win'`.
- `GameResult.coTuong` chứa `GameRecord`. Dữ liệu tổng hợp dùng `score` 1/0.5/0 tương ứng thắng/hòa/thua, `maxScore: 1`, `starsEarned: 0`, `date: endedAt`; trang hồ sơ hiển thị thắng/hòa/thua theo record.
- Ván kết thúc vẫn giữ draft để thử ghi lại nếu lưu hồ sơ thất bại. Hai callback hoàn tất hoặc tải lại trang không tăng thống kê hai lần; chỉ báo đã lưu khi thao tác lưu thành công. Không xóa draft chưa ghi kết quả mà không có thao tác bỏ ván rõ ràng.
- Bộ test phải chạy với owner cầm Đỏ **và Đen**, ở cả hai chế độ; xác nhận hồ sơ của đối thủ không thay đổi.

## 5. Engine bot — thiết kế search (`games/CoTuong/bot.ts`)

### 5.1 Kiến trúc và điều kiện đúng

- **SearchPosition riêng:** bàn typed array, danh sách quân, vị trí Tướng, bên tới lượt, khóa và lịch sử cần cho phân xử. Chuyển từ `Match` một lần khi bắt đầu tìm; không mang tên/avatar/timer/JSON persistence vào mỗi nút.
- **make/unmake:** thử nước rồi khôi phục bằng stack; bàn, quân bị ăn, lượt, khóa, piece list và lịch sử chiếu/lặp phải trở về chính xác trạng thái cũ, kể cả khi hết giờ hoặc có lỗi. Đây là thao tác nội bộ của bot, không tạo nút undo cho người chơi. Có test round-trip cho từng loại nước và abort.
- **Negamax alpha-beta + iterative deepening:** ngân sách gồm `timeMs`, `maxNodes`, `maxDepth`, `maxPly`. Worker tự tạo deadline bằng đồng hồ monotonic; kiểm tra ngân sách cả ở search thường, quiescence và vòng sinh/sắp nước. `maxNodes` tính cả quiescence.
- Luôn chuẩn bị một nước gốc hợp lệ. Chỉ thay kết quả cuối bằng kết quả của **vòng độ sâu đã hoàn tất**; vòng bị ngắt không ghi điểm/cận như kết quả đầy đủ. Nếu chưa xong depth 1, trả nước dự phòng hợp lệ và `completedDepth: 0`.
- **Terminal trước đánh giá:** dùng §3.2 với cả lịch sử ván thật và nhánh đang tìm. Chiếu bí, bí nước, chiếu dai là thắng/thua theo bên; chỉ hòa thực sự mới trả 0. Không mặc định mọi thế lặp là hòa. Điểm thắng/thua ưu tiên thắng sớm, thua muộn và lớn hơn mọi điểm eval thông thường.
- **Quiescence:** khi không bị chiếu, cho phép đánh giá tại chỗ (stand-pat), rồi xét nước ăn hợp lệ. Khi **đang bị chiếu**, cấm stand-pat và phải xét **mọi nước thoát chiếu**, gồm chặn/chạy Tướng không ăn quân. Hết nước thoát mới là chiếu bí. Kiểm tra bí nước trước stand-pat.
- Khởi đầu dùng quiescence ăn quân + thoát chiếu; mở rộng sang nước chiếu không ăn chỉ sau benchmark, tối đa 2 ply đầu của quiescence. Có trần tổng `maxPly = 64` và tối đa 8 ply quiescence; nếu chạm trần khi chưa thể đánh giá an toàn do đang bị chiếu, hủy vòng tìm hiện tại và giữ kết quả vòng trước, không suy thành chiếu bí.
- **TT (bảng nhớ thế cờ):** Zobrist seed cố định, khóa 64 bit hoặc hai `uint32`; dung lượng có trần, mục tiêu tổng ≤16 MiB. Mỗi entry dùng cho điểm có `key`, ngữ cảnh luật/lịch sử, `depth`, `score`, `bound` (exact/lower/upper), `bestMove`; chuẩn hóa điểm chiếu bí theo ply khi lưu/đọc.
- Bàn giống nhau nhưng lịch sử khác có thể khác kết quả chiếu dai. Giai đoạn đầu TT chỉ hỗ trợ **xếp nước**. Chỉ bật tái sử dụng `score/bound` khi xác nhận cùng ngữ cảnh phân xử và cấu hình eval; nếu không chứng minh tương thích thì bỏ cutoff, vẫn được thử `bestMove` sau kiểm tra hợp lệ. Test cùng bàn/lượt nhưng khác lịch sử, cả TT bật/tắt, phải cho kết quả đúng như oracle duyệt nông.
- **Ordering:** nước TT hợp lệ → ăn quân ưu tiên giá trị mục tiêu/chi phí quân ăn → killer/history cho nước còn lại. Đánh giá khởi đầu: Xe 900, Pháo 450, Mã 400, Tượng/Sĩ 200, Tốt 100; thêm ô đứng, cơ động, an toàn Tướng và Tốt qua sông. Mọi thay đổi trọng số được ghi trong cấu hình benchmark.
- **Tối ưu sau:** null-move, check extension, LMR/aspiration chỉ bật sau bản cơ bản đã qua oracle và benchmark. Null-move cấm khi bị chiếu, tàn cuộc ít quân hoặc vừa null-move; nước giả không đi vào lịch sử ván hay gây kết quả lặp giả. Check extension luôn chịu trần độ sâu tổng và deadline.

### 5.2 Phân tầng độ khó

Ngân sách ban đầu là cấu hình để đo, không phải cam kết độ sâu hay trình độ người chơi. Dừng ngay khi chạm bất kỳ giới hạn nào.

| Mức | `timeMs` | `maxDepth` | `maxNodes` | Cách chọn |
|---|---:|---:|---:|---|
| Dễ | 60 | 3 | 10.000 | Eval đơn giản; random có seed trong nhóm nước gần tốt nhất của vòng đã hoàn tất |
| Vừa | 350 | 6 | 80.000 | Eval đầy đủ, chọn nước tốt nhất tìm được |
| Khó | 1.200 | 12 | 300.000 | Eval đầy đủ, tìm sâu hơn trong ngân sách |

- Mức Dễ không cố ý chọn nước tự chiếu/phi tướng hoặc kết thúc thua do chiếu dai nếu đã xác định được lựa chọn tránh thua. Ngưỡng chọn gần tốt nhất phải nằm trong cấu hình và được ghi vào báo cáo.
- Có thể nâng Khó tới 2.000 ms bằng cấu hình; cập nhật cả timeout UI và chạy lại đo độ trễ. Không thêm thời gian chờ giả để mức Khó trông như đang nghĩ lâu.
- Các mức dùng cùng luật và cùng kiểm tra tính hợp lệ. Không quảng bá độ sâu đạt được hoặc “thách thức người chơi khá” trước khi có số đo và buổi thử thực tế.
- Sổ khai cuộc nhỏ là tùy chọn sau; nước trong sổ phải qua kiểm tra hợp lệ và phân xử chiếu dai. Bộ benchmark cố định cách bật/tắt sổ để so sánh công bằng.

### 5.3 Worker và vòng đời UI

- Tạo worker module qua `new Worker(new URL('./bot.worker.ts', import.meta.url), {type: 'module'})`. Một worker dùng trong ván; `dispose` khi rời ván/đổi hồ sơ. Khi pause/ẩn trang hoặc timeout, terminate để hủy ngay; resume tạo worker mới nếu cần. Cache mất khi terminate không ảnh hưởng tính đúng.
- Request: `{ requestId, matchId, revision, rulesVersion, state, level, limits, seed }`. Reply: `{ requestId, matchId, revision, rulesVersion, move, completedDepth, nodes, elapsedMs, stoppedBy }`; `stoppedBy` phân biệt time/nodes/depth. Lỗi trả riêng, không giả thành nước hợp lệ.
- Token dùng `id:revision:++request`; chỉ cho một yêu cầu đang chờ. Chỉ chấp nhận reply đúng token/phiên bản luật, vẫn ở đúng ván/lượt bot, chưa pause/kết thúc và nước nằm trong danh sách hợp lệ hiện tại. Đánh dấu settled trước commit để timeout và reply không cùng áp dụng hai nước.
- Timeout tính từ lúc gửi yêu cầu: `max(2200, timeMs + 800)` ms, bao gồm biên khởi động/truyền dữ liệu. Worker lỗi, quá hạn hoặc trả nước sai → terminate và dùng một nước từ danh sách hợp lệ **đã chuẩn bị cho đúng revision**. Không gọi `chooseMove` đồng bộ trên giao diện. Nếu không còn đúng revision thì bỏ kết quả; nếu không có nước thì chạy phân xử kết thúc.
- Pause/ẩn trang/rời ván/đổi hồ sơ hủy token, timer và worker; chờ animation hoặc hộp thoại thao tác hoàn tất trước khi bắt đầu lượt bot. Reload khi máy đang nghĩ khởi động một yêu cầu mới từ draft, không phát lại nước cũ. UI hiển thị “Máy đang nghĩ” và ghi nhận fallback để chẩn đoán.

### 5.4 Nhánh Pikafish tương lai

Giữ giao thức tìm nước độc lập với engine. Adapter phải chuyển cả bàn, lượt và lịch sử cần thiết sang FEN/UCI theo phiên bản engine được chọn, rồi chuyển nước trả về `Move`. Kiểm tra khác biệt giữa luật lặp của engine ngoài và `gk-xiangqi-v1`; game vẫn có quyền phân xử cuối. Không coi việc nhận `{state}`/trả `{move}` là đã đủ tương thích. Chốt phiên bản, yêu cầu phân phối, kích thước JS/WASM/NNUE, khởi động/hủy và chính sách offline trước khi thêm tầng này.

## 6. Nghiệm thu sức mạnh bot & benchmark

### 6.1 Bộ dữ liệu và điều kiện chạy

- `scripts/benchmark-co-tuong.ts` xuất JSON; lưu cấu hình, rulesVersion, seed, revision mã nguồn/engine đối chứng, phiên bản runtime, thiết bị, số nút và độ sâu thực đạt. Perft và test luật phải qua trước khi đo sức mạnh.
- Trước tinh chỉnh M3, khóa một bộ **200 khai cuộc hợp lệ có lịch sử**, độc lập với bộ dùng chỉnh eval; mỗi khai cuộc đấu hai ván đổi bên → **400 ván cho mỗi cặp đối đầu**. Lưu hẳn fixture và seed trong repo; không chỉ ghi tên thế cờ hoặc thay fixture sau khi xem kết quả.
- Baseline được đóng băng cùng fixture: random đều trên nước hợp lệ; greedy ăn quân/đánh giá vật chất một ply với ưu tiên kết quả terminal; negamax depth-3 eval vật chất, không quiescence/TT/pruning, không deadline. Tất cả dùng cùng luật bản đầu.
- Bộ chiến thuật riêng ≥60 thế: tối thiểu 20 mate-in-1, 20 mate-in-2, 20 thế phòng thủ/ăn quân/lặp. Có đáp án được kiểm chứng, nguồn và định nghĩa độ sâu theo ply; nếu có nhiều nước giải thì chấp nhận mọi nước trong tập đáp án. Thế cần lịch sử phải mang lịch sử đó. Các thế buộc đúng dùng làm test, không tùy chỉnh đáp án để khớp bot.

### 6.2 Đo sức mạnh và thống kê

- Chạy tái lập với `timeMs: Infinity`, seed và giới hạn nodes/depth cố định ở §5.2; kết quả này đo bản thuật toán dưới ngân sách cố định. Chạy thêm cùng fixture với deadline thực trên thiết bị được ghi tên để xác nhận mức Khó trong ứng dụng.
- Mỗi ván benchmark tối đa 600 ply kể cả khai cuộc. Chưa kết thúc thì ghi `unfinished`, không chuyển thành hòa và không loại khỏi báo cáo. Báo riêng `wins/draws/losses/unfinished`; tỷ lệ hoàn tất phải đạt ≥99% mới dùng bộ chạy để nghiệm thu sức mạnh. Chưa có ván hoàn tất thì tỷ lệ thắng/điểm là `null`, bộ chạy không đạt nghiệm thu.
- Báo `winRate = W / (W + D + L)` và `matchScore = (W + 0.5D) / (W + D + L)`. `unfinished` có tỷ lệ riêng trên toàn bộ số ván. Không dùng công thức Wilson nhị thức bằng cách coi một ván hòa là nửa lần thắng.
- Vì hai ván đổi bên cùng xuất phát một thế có liên hệ, dùng **bootstrap theo cặp khai cuộc** (seed cố định, 10.000 lần lấy mẫu) cho khoảng tin cậy 95% của các tỷ lệ/điểm. Script Ô Ăn Quan hiện là mẫu chạy và xuất JSON; phần thống kê này cần viết thêm.
- Mục tiêu khóa trước chạy: Khó có winRate ≥95% trước random, ≥80% trước greedy, ≥55% trước depth-3; Khó thắng được tất cả fixture mate-in-1 của bộ nghiệm thu. Khó–Vừa và Vừa–Dễ có cận dưới khoảng tin cậy 95% của matchScore **>0,5**. Báo cả điểm ước lượng và khoảng tin cậy, không suy các tỷ lệ này thành Elo.
- Không đạt thì ghi rõ fail, điều chỉnh thuật toán và chạy lại cùng bộ nghiệm thu. Nếu phải đổi mục tiêu hoặc fixture, lập phiên bản benchmark mới và giữ báo cáo cũ; không hạ ngưỡng để hợp thức hóa kết quả. Buổi thử người thật là điều kiện trước khi công bố khả năng thách thức người chơi.

### 6.3 Độ trễ và thiết bị

- Đo riêng p50/p95 thời gian trong `chooseMove`, thời gian từ gửi request tới nhận reply, khởi động worker lạnh, nodes/giây, độ sâu hoàn tất và tỷ lệ fallback; tối thiểu 100 vị trí đại diện/mức/thiết bị.
- Mục tiêu search p95 ≤ `timeMs + 50 ms`; lượt bot phải giải quyết trong watchdog ở §5.3. Kiểm tra cả main-thread long task để phát hiện việc sinh nước/fallback gây đơ giao diện.
- Báo cáo desktop và ít nhất một Android hoặc iPad thật khi kiểm tra phát hành nếu có thiết bị. Resize viewport/giả lập không thay cho số đo phần cứng; thiếu thiết bị nào thì nêu rõ giới hạn xác minh, không ghi đã đạt trên thiết bị đó.

## 7. Đồ họa & assets

### 7.1 Cảnh 3D dựng bằng code (không dùng ảnh Flow làm bàn)

- `geometry.ts`: bàn gỗ phẳng + lưới đường kẻ + sông (chữ 楚河漢界) + cung (đường chéo) vẽ bằng **canvas texture** trong mã; quân là **đĩa trụ** (cylinder) mặt vát, chữ Hán render bằng canvas texture đặt lên mặt trên.
- `scenery.ts`: khung bàn gỗ tông ấm, chân bàn, ánh sáng `RoomEnvironment` + bóng tiếp xúc; vài chi tiết ấm áp (đèn/khay quân) tiết chế để không che bàn. Đo tam giác/draw call của cảnh thực tế theo §11.
- **Chữ trên quân (đổi được):** mặc định Hán truyền thống; font/path cần đủ **18 glyph**: `帥仕相傌俥炮兵將士象馬車砲卒楚河漢界`, gồm 14 chữ quân và 4 chữ sông. Mục tiêu font subset ≤10 KiB, đo sau khi xuất; nếu vượt, ghi kích thước và cân nhắc path thay thế. Chọn font có quyền phân phối phù hợp, lưu nguồn/giấy phép cùng asset.
- Tùy chọn nhãn Việt (Tướng/Sĩ/Tượng/Mã/Xe/Pháo/Tốt) dùng font Latin đã có. Đỏ vẽ mực đỏ, Đen mực đen trên nền đĩa gỗ kem; nhãn Việt phải đọc được ở viewport 390 px. Chế độ chữ lưu theo owner, đổi tức thì không thay đổi ván. Vân gỗ vẽ canvas, không tải texture mạng.
- Đợi font cần thiết tải xong trước khi tạo texture chữ và tạo lại texture khi đổi nhãn. Font lỗi/mất cache dùng nhãn Việt hoặc path dự phòng, không để quân trống chữ. Giải phóng texture/material khi thay hoặc rời cảnh.
- Camera: `BoardCamera` FOV 39°, preset **Thẳng** và **Nghiêng**; orbit + zoom giới hạn; có **lật bàn**. Khởi đầu nhìn từ phía `ownerSide`, sau đó dùng lựa chọn lưu theo hồ sơ. Chuyền máy ở chế độ hai người chỉ lật cách nhìn theo cấu hình, không đổi `Side`, `ownerSide` hoặc kết quả.
- `Board2D.tsx`: SVG dùng chung luật, lựa chọn và tọa độ với 3D; là giao diện chơi đầu tiên ở M2, đồng thời là dự phòng khi mất WebGL. Nhãn Hán/Việt, lật bàn và báo chiếu đều hoạt động ở cả hai chế độ.

### 7.2 Asset Flow (đã được phép dùng Flow đang mở)

Pipeline giống các game: **Flow sinh ảnh → xuất qua `pageAssets` → Sharp → WebP responsive**, lưu `public/co-tuong/art/`:
- `cover.webp` 800×450 (~90 kB) + `cover-sm.webp` 400×225 (~27 kB) — dùng ở catalog/lobby.
- Tùy chọn 1 ảnh **tham chiếu hướng mỹ thuật** (bàn+quân cổ điển ấm) để căn màu/chất liệu khi dựng geometry — **không** đưa vào bundle game.
- Kiểm tra với PWA hiện tại: `pwa/download.ts:isCoreAsset` xếp JS/CSS/WOFF vào core, kể cả chunk lazy-load; ảnh bìa thuộc gói tài nguyên tải chủ động. Font subset vì vậy ảnh hưởng tải core, không được mặc định “lazy-load là không tải khi cập nhật”. Kiểm tra manifest, không đóng gói ảnh tham chiếu vào `public`/output; ghi prompt + media ID vào `docs/co-tuong-assets.md`.
- Chỉ báo game sẵn sàng offline sau khi tài nguyên cần thiết đã cache; thử mở game từ hub sau khi tắt mạng, cả nhãn Hán/Việt và worker. Nhánh WASM tương lai phải có chính sách tải và cache riêng cho JS/WASM/NNUE trước khi tích hợp.

**Prompt bìa (nháp, cổ điển-ấm):**
> Premium miniature Vietnamese Chinese chess (Cờ Tướng / Xiangqi) board game, warm honey wood board with hand-painted grid, a gentle river band across the middle, two palaces with diagonal lines, round wooden playing discs carved with elegant Chinese chess characters in deep red and ink black, cozy warm morning light, soft shadows, handcrafted bevels and subtle wood grain, inviting friendly atmosphere for children yet traditional and tasteful, clear three-quarter overhead view, whole board visible, cinematic toy photography, sage cream and terracotta accents, landscape 16:9, no UI, no extra text besides the characters on the discs.

*(Ký tự trên quân do Flow vẽ chỉ là tham chiếu mỹ thuật; chữ thật trong game render bằng mã để luôn sắc nét và đúng.)*

## 8. Cấu trúc file và tích hợp ứng dụng

```
games/CoTuong/
  model.ts            data types, hằng số, tên hiển thị
  board.ts            hằng bàn, mã quân, index helpers, cung/sông, position key
  position.ts         SearchPosition, make/unmake, piece list, khóa Zobrist
  position.test.ts    round-trip, khôi phục sau abort, bất biến bàn/lịch sử/khóa
  movegen.ts          kiểm tra bị tấn công, sinh/lọc nước hợp lệ trên Position
  movegen.test.ts     perft và luật di chuyển từng quân
  rules.ts            adjudicatePosition, lặp và chiếu dai theo rulesVersion
  rules.test.ts       các chu kỳ lặp, terminal priority, cùng bàn khác lịch sử
  engine.ts           applyMove, điều phối kết thúc ván, validate/replay
  engine.test.ts      commit, tính nhất quán ván và validate bản lưu
  bot.ts              chooseMove: negamax, quiescence, TT/ordering theo giai đoạn
  bot.worker.ts       giao thức worker, search budgets, thống kê
  bot.test.ts         oracle duyệt nông, chiến thuật, deadline và TT
  bot-controller.ts   token, watchdog, kiểm tra reply, fallback/cancel
  bot-controller.test.ts stale/duplicate/illegal reply, pause/timeout/reload
  persistence.ts      draft/party/prefs + persistResult idempotent
  persistence.test.ts owner Đỏ/Đen, lưu lỗi, hoàn tất trùng, hồ sơ tách biệt
  geometry.ts         bàn, quân đĩa, chữ Hán (canvas texture)
  scenery.ts          khung bàn, ánh sáng, chi tiết ấm
  BoardCamera.tsx     preset Thẳng/Nghiêng + orbit + lật bàn
  Board3D.tsx         canvas R3F, raycast chọn quân, đánh dấu nước hợp lệ, chiếu
  Board2D.tsx         SVG chơi được từ M2, dùng lại làm fallback
  CoTuongGame.tsx     lobby (2 ghế người/máy, chọn màu/mức), vòng đời ván, bot, animation, kết quả
  co-tuong.css        layout toàn màn hình + hộp thao tác nổi (theo HorseRace)
  preview.tsx         fixtures DEV
  fixtures/           perft, chiến thuật, luật lặp có lịch sử, nguồn đối chứng
scripts/benchmark-co-tuong.ts
scripts/fixtures/co-tuong/ benchmark đã khóa: khai cuộc, seed, cấu hình baseline
public/co-tuong/art/  cover.webp, cover-sm.webp
public/co-tuong/fonts/ subset nếu chọn nhúng font; kèm nguồn và giấy phép
docs/co-tuong-assets.md, docs/co-tuong-implementation-report.md (khi xong)
co-tuong-preview.html (gốc repo, chỉ DEV)
```

Chiều phụ thuộc: `model/board` → `position` → `movegen` → `rules` → `engine` hoặc `bot` (mũi tên nghĩa là lớp sau được dùng lớp trước). `position` chỉ áp dụng/khôi phục trạng thái vật lý; lớp gọi tính `gaveCheck` bằng `movegen` rồi cập nhật lịch sử trước khi phân xử. `movegen` không gọi ngược `rules` hoặc `engine`; `rules` không phụ thuộc `Match`/UI. Có thể gộp file nhỏ nếu vẫn giữ ranh giới này và test tương ứng.

### 8.1 Danh sách tích hợp bắt buộc

- `src/components/hub/catalog.ts`: thêm `'co-tuong'` vào `GameId`, `GAME_CATALOG`, art/title/description và kiểm tra truy cập. **Không cho mầm non**, ở cả `gamesFor` và `resolveEntry`; test truy cập trực tiếp URL.
- `src/components/hub/HubArt.tsx`: ảnh bìa responsive, kích thước cố định, asset base path đúng.
- `games/GameLauncher.tsx`: lazy-load game, truyền đúng profile/onExit; game dùng luồng lưu board game, không đi qua callback phát thưởng chung.
- `types.ts`: thêm `coTuong?: import('./games/CoTuong/model').GameRecord` vào `GameResult`.
- `src/contexts/StudentContext.tsx`: action `completeCoTuong(owner, match)` theo cơ chế snapshot hiện có để chống hai callback ghi trùng; đăng ký `clearCoTuongData(owner)` khi xóa hồ sơ, dọn draft/party/prefs đúng owner.
- `src/components/UserProfileScreen.tsx`: tên “Cờ Tướng”, số thắng/hòa/thua theo `hostResult`; không hiển thị dưới dạng điểm học tập hoặc số sao trung bình. Kiểm tra lịch sử và thống kê vẫn đọc được với profile cũ chưa có dữ liệu game.
- Kiểm tra các luồng sao lưu/khôi phục hồ sơ đang có: giữ `GameResult.coTuong`; draft thuộc localStorage theo owner, không hứa xuất draft nếu luồng hiện tại chỉ xuất profile. Test khả năng đọc lại record được xuất/nhập.
- Preview chỉ DEV và không vào manifest production. Kiểm tra build/PWA gồm worker, font, bìa cần thiết; thống kê bundle theo §11. Không tạo achievement/sao/gacha riêng trong phạm vi bản đầu.

## 9. UX & trải nghiệm

- Layout toàn viewport theo Dragon Quest/HorseRace: bàn và hộp thao tác nổi, nút Thẳng/Nghiêng, lật bàn, chuyền máy, pause, trạng thái lưu. Màn chuẩn bị chọn màu cho chủ hồ sơ, đối thủ người/máy và mức; vào lại cho tiếp tục draft hoặc chủ động bỏ ván cũ.
- Chọn quân ở lượt người → hiện **các ô đi hợp lệ** → chọn đích. Chặn nhập khi animation, pause, chuyền máy, hộp thoại hoặc lượt máy; kiểm tra lại revision/lượt khi commit. Pointer tách chạm khỏi kéo (>6 px); raycast đúng cả sau lật bàn.
- Báo **chiếu** rõ ràng (viền Tướng + âm thanh Web Audio); màn kết quả phân biệt chiếu bí, bí nước, thua do chiếu dai, đầu hàng, hòa lặp và hòa thỏa thuận. Chỉ phát âm thanh sau tương tác người dùng và tôn trọng chế độ tắt tiếng.
- Phần Luật chơi ghi ngắn: “Chiếu dai một phía bị xử thua khi thế cờ lặp đủ ba lần. Bản này chưa phân xử đuổi bắt theo đầy đủ luật WXF.” Không gọi luật bản đầu là WXF đầy đủ; phần hướng dẫn luật không thêm gợi ý chiến thuật.
- **KHÔNG hoàn tác (undo), KHÔNG gợi ý nước đi** (đã chốt) — giữ trải nghiệm cờ thật. Vẫn giữ: đánh dấu **ô đích hợp lệ của quân đang chọn** (phản hồi tương tác cơ bản, như "đánh dấu nước hợp lệ" của HorseRace) và **báo chiếu** (phản hồi luật). Đây không phải gợi ý chiến thuật.
- **Nút đổi chữ quân:** chuyển giữa chữ Hán truyền thống (mặc định) ↔ nhãn thuần Việt; lưu theo hồ sơ, không đổi trạng thái ván.
- Giảm chuyển động, đồ họa nhẹ (tắt bóng/tiểu cảnh), fallback 2D — như chuẩn dự án.

## 10. Kiểm thử (phạm vi cam kết)

| Nhóm | Trường hợp bắt buộc và điều kiện đạt |
|---|---|
| Move-gen | Perft khai cuộc depth 1–3 CI, depth 4 trước phát hành/khi sửa move-gen; từng quân, cản chân/mắt, Pháo 0/1/2 ngòi, giới hạn cung/sông, mở đường phi tướng, quân bị ghim, không ăn Tướng |
| Kết thúc | Chiếu bí; bí nước là thua; đầu hàng; hòa có chấp nhận; không nhận nước/lệnh kết thúc thứ hai |
| Lặp | Lần xuất hiện thứ hai chưa kết thúc; thứ ba tính cả khai cuộc; cùng bàn khác lượt không trùng; một bên chiếu mọi nước bị thua; hai bên cùng chiếu hòa; không bên nào chiếu mọi nước hòa; các chu kỳ độ dài khác nhau; reload giữa chu kỳ vẫn xử đúng |
| Search | Thoát chiếu chỉ bằng chặn/chạy Tướng không ăn quân; mate-in-1/2; tránh phi tướng/chiếu dai; terminal giống game; cùng bàn khác lịch sử; TT bật/tắt so oracle; timeout ngay ở root/quiescence; trả vòng hoàn tất trước |
| Khôi phục search | ≥10.000 nước thử có seed qua nhiều ván; make/unmake khôi phục nguyên bàn/lượt/lịch sử/khóa/piece list; nước ăn giảm đúng một quân; abort không làm biến dạng đầu vào |
| Controller | Reply cũ, trùng, sai move/phiên bản; timeout đua với reply; worker lỗi; pause/ẩn tab/rời game/đổi profile; resume tạo đúng một yêu cầu; fallback không gọi search trên main thread |
| Persistence | Owner Đỏ/Đen × người/người hoặc người/bot × thắng/thua/hòa; sai owner/version/JSON/lịch sử; ghi lỗi rồi retry; reload ván over; hai completion callback chỉ ghi một kết quả; xóa đúng dữ liệu owner, không phát sao |
| Tích hợp | Catalog, deep link, chặn mầm non, ảnh hub, lịch sử hồ sơ, xuất/nhập record, profile cũ, kết quả không qua luồng thưởng |

- **Browser:** 1024×768, 820×1180, 1180×820, 390×844; 2D và 3D đều chọn đúng giao điểm sau lật bàn, kéo camera không đi quân, chữ Việt/Hán đọc được, thiếu font có dự phòng. Kiểm tra pause/resume, reload giữa animation/lượt bot, đổi hồ sơ, mất WebGL giữ ván, tắt mạng mở từ hub sau tải offline đầy đủ.
- **Kiểm tra dự án:** TypeScript `--noEmit`, Vitest toàn dự án và build production/PWA đạt; chạy benchmark theo §6 và lưu báo cáo. Test perft/oracle phải độc lập với logic đang kiểm chứng, không tự sinh đáp án từ chính hàm được test.
- **Giới hạn báo cáo:** FPS/nhiệt/pin chỉ kết luận trên phần cứng thực đã đo; ghi riêng thiết bị chưa có. Buổi thử người thật cần cho tuyên bố sức mạnh. Phân xử đuổi bắt đầy đủ và WASM thuộc giai đoạn sau.

## 11. Hiệu năng & budget

- Cảnh 3D mục tiêu **≤60.000 tam giác, ≤60 draw calls**; đo ở góc có đủ 32 quân. DPR 1–1.5, render theo nhu cầu; giải phóng tài nguyên khi rời cảnh.
- Ghi kích thước raw/gzip của phần tăng thêm so với build trước game: UI/scene, worker, font, bìa; tách thư viện dùng chung để không tính hai lần. Font mục tiêu ≤10 KiB; bìa theo §7.2. Chưa ấn định số KiB engine khi chưa build được.
- Core PWA hiện gồm JS/CSS/font, nên ghi riêng số byte tăng của cập nhật core và gói media; kiểm tra tải lại không đưa preview/tham chiếu vào manifest. Không đưa WASM/NNUE vào bản đầu.
- TT tổng ≤16 MiB gồm key/entry/ngữ cảnh, có giới hạn số entry và chính sách thay thế. Theo dõi bộ nhớ qua nhiều lượt và khi rời game; không sao chép cả lịch sử vào từng entry mà không tính chi phí.
- Deadline 60/350/1.200 ms (Khó tối đa 2.000 ms nếu đổi cấu hình), watchdog `max(2200, timeMs + 800)` ms; main thread chỉ kiểm tra/commit nước dự phòng có sẵn. Báo độ sâu, nodes và p50/p95 đo được; không cam kết trước 7–10 ply hay 120k nút.

## 12. Phân kỳ (milestones)

| Mốc | Công việc | Điều kiện chuyển mốc |
|---|---|---|
| **M1 — Luật và engine** | Model ownerSide, move-gen, position/make-unmake, phân xử lặp/chiếu dai, replay/validate, perft | Perft depth 1–4 và test luật/khôi phục đạt; fixture và nguồn đối chứng được lưu |
| **M2 — Chơi 2D và lưu ván** | Lobby chọn màu, hai người, Board2D/lật bàn, pause, kết quả, persistence, StudentContext/hồ sơ/launcher, preview | Chơi hết ván và reload được; owner Đen ghi đúng kết quả; ghi trùng/lưu lỗi/xóa profile đạt; đường vào DEV phục vụ test trước khi bật catalog phát hành |
| **M3 — Bot và kiểm chứng** | Khóa fixture/baseline; negamax + quiescence đúng; worker/controller; Dễ/Vừa/Khó; thêm TT/ordering và tối ưu từng bước | Oracle, timeout/cancel và benchmark §6 đạt. Nếu chưa đạt sức mạnh, ghi blocker và tiếp tục tinh chỉnh trước khi gắn nhãn đã nghiệm thu |
| **M4 — 3D và hoàn thiện** | Board3D, camera, nhãn Hán/Việt, âm thanh, giảm chuyển động, fallback2D, bìa Flow/HubArt, bật catalog khi game đủ chức năng | Trải nghiệm 2D/3D thống nhất, lật bàn chọn đúng, nhãn đọc được, kích thước asset/cảnh được đo |
| **M5 — Kiểm tra phát hành** | Toàn bộ §10, benchmark với deadline thực, build/PWA/offline và báo cáo | Không còn lỗi luật/lưu ván/worker; kiểm tra dự án đạt; báo cáo đủ bằng chứng, giới hạn thiết bị và các mục chưa đạt |

**Giai đoạn sau:** phân xử WXF 2018 đầy đủ với bộ thế tham chiếu và phiên bản luật mới; tối ưu search nâng cao đã qua kiểm chứng; adapter Pikafish với kiểm tra luật, bộ nhớ, tải/offline. Không lấy việc thêm WASM làm điều kiện hoàn thành bản đầu.

## 13. Rủi ro

- **Cao — luật và search:** phân xử lặp phụ thuộc lịch sử, quiescence khi bị chiếu, TT và khôi phục sau abort có thể làm bot sai dù perft đúng. Chặn bằng oracle, fixture lịch sử và từng bước bật tối ưu.
- **Cao — sức mạnh bot:** ngân sách TS chưa chứng minh trình độ; benchmark cố định và thử thực tế quyết định kết luận. Không suy từ mức tái sử dụng hoặc số ply mục tiêu.
- **Trung bình — persistence/tích hợp:** nhầm ownerSide, callback trùng, bản lưu khác luật và phần hồ sơ bị bỏ sót. Làm từ M2 với ma trận kiểm thử §10.
- **Trung bình — thiết bị/đồ họa:** CJK tải lỗi, nhãn Việt nhỏ, bộ nhớ worker và raycast sau lật bàn cần đo thật; giữ đường chơi 2D và nước dự phòng hợp lệ.
- **Giới hạn sản phẩm đã công bố:** bản đầu chưa có phân xử đuổi bắt đầy đủ; tất cả tầng bot/UI/persistence phải ghi cùng `gk-xiangqi-v1`. Khi chuyển bộ luật cần kế hoạch tương thích bản lưu.

## 14. Tóm tắt thay đổi sau review

1. Thêm `ownerSide`, bỏ `first`, quy định kết quả và kiểm thử chủ hồ sơ cầm Đen.
2. Thay “mọi lặp ba lần đều hòa” bằng quy tắc chiếu dai một phía xử thua, định nghĩa rõ lịch sử/khóa và phiên bản luật ứng dụng.
3. Bổ sung điều kiện đúng của quiescence, TT, make/unmake, abort và worker; bỏ fallback search đồng bộ trên UI.
4. Khóa quy trình nghiệm thu trước tinh chỉnh; tách sức mạnh cố định, deadline thực và tuyên bố trình độ người chơi.
5. Bổ sung tích hợp hồ sơ, lịch sử, xóa dữ liệu, ảnh hub và PWA; sửa font từ 14 thành đủ 18 glyph, thêm lật bàn.
6. Đưa bản chơi 2D và persistence lên M2; hoàn thiện 3D sau bot cơ bản đã được kiểm chứng. Giữ các quyết định đã có: không undo/gợi ý, chữ Hán mặc định có nhãn Việt, think-time tăng theo mức.

Khi bắt đầu triển khai, đi theo **M1 → M2 → M3 → M4 → M5**. Báo cáo cuối phải phân biệt phần đã kiểm chứng, chưa đạt và chưa có điều kiện đo; mọi ngưỡng trong plan hiện là tiêu chí nghiệm thu, chưa phải kết quả.
