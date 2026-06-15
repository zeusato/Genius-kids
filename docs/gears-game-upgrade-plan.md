# Phương án nâng cấp game "Kỹ Sư Máy Móc" (bánh răng)

> Tổng hợp ngày 15/06/2026 từ: audit đa tác nhân (5 chuyên gia phân tích song song theo các khía cạnh
> mô hình chiều quay · kiến trúc/state · bug & edge-case · animation · UX/sư phạm), **46 phát hiện → 30 đã
> được kiểm chứng đối nghịch trên code thật**, 2 bị bác bỏ có chứng minh. Phân tích trên stack hiện có
> (React 19 / framer-motion 12 / lucide).
>
> **Trạng thái: ĐÃ TRIỂN KHAI** — toàn bộ phương án dưới đây đã được thực hiện ở commit `9e859e7`
> (nhánh `refactor/gears-game`, đã merge vào `main`). Doc giữ lại cả phần chẩn đoán để tham chiếu về sau.

---

## 1. Bối cảnh

Game gồm **2 chế độ** dùng chung 1 engine:
- **LẮP (BUILD)** — kéo-thả bánh răng & dây đai để nối MOTOR → ĐÍCH sao cho ĐÍCH quay đúng chiều yêu cầu.
- **ĐOÁN CHIỀU (GUESS)** — dự đoán chiều quay của các bánh răng có dấu "?".

Trước nâng cấp, game nằm ở `src/pages/games/GearsGame` (các game khác ở `games/`), logic dồn trong
React component, mô phỏng kiểu polling `setInterval` 100ms, và nhiều lỗi hình học/animation khiến nó
*trông* sai/ngẫu nhiên.

> **Phát hiện quan trọng nhất (gây bất ngờ):** logic **chiều quay** (`calculateNetwork`) thực ra **ĐÚNG và
> TẤT ĐỊNH**. Giả thuyết "BFS phụ thuộc thứ tự nên chiều quay sai ngẫu nhiên" đã bị **bác bỏ có chứng minh**:
> vì vòng lặp neighbor không `break`, mọi cạnh ăn khớp luôn được kiểm tra từ đỉnh dequeue cuối → kết quả
> tô màu 2-coloring (mesh = ngược, belt = cùng) giống nhau với mọi thứ tự; vòng lẻ luôn kẹt tất định.
> ⇒ Cảm giác "logic tệ" đến từ các lỗi **xung quanh**, không phải thuật toán tô màu.

---

## 2. Chẩn đoán hiện trạng (30 phát hiện đã kiểm chứng)

### 2.1. Mô hình vật lý chiều quay & tốc độ
| Mức | Vấn đề | Vị trí (trước) |
|---|---|---|
| 🔴 Cao | **Không phát hiện quá-ràng-buộc tốc độ.** Gear tới từ 2 đường khác tỉ số chỉ kiểm chiều, không kiểm tốc độ → âm thầm lấy tốc độ đường BFS tới trước | `Physics.ts:55-99` |
| 🟡 TB | **`direction===0` nhập nhằng** "kẹt" với "chưa nối"; khi kẹt thì zero hoá **toàn bộ** bảng (kể cả cụm độc lập đúng) | `Physics.ts:32,61,87` |
| 🟢 Thấp | Belt chỉ mô hình open-belt (cùng chiều); không có belt chéo; `BeltData` thiếu cờ kind | `Physics.ts:12-16,90-93` |
| 🟢 Thấp | Belt tính tốc độ theo **răng** thay vì **bán kính puli** (sai khi răng ⊥ bán kính, vd anchor `teeth:11, r:34`) | `Physics.ts:93` |
| 🟡 TB | **`checkCollision` dung sai ±8px tuyệt đối** (không theo kích thước), lệch với generator (±3) → engine & generator bất đồng về "đã nối" | `Physics.ts:19-28` |

### 2.2. Hình học & hệ toạ độ
| Mức | Vấn đề | Vị trí (trước) |
|---|---|---|
| 🔴 Cao | **3 giá trị `CANVAS_HEIGHT`**: LevelGenerator=500, Build=400, Guess=450; canvas render `height:100%` → bánh răng dồn nửa trên | nhiều file |
| 🔴 Cao | **Ngưỡng xoá/trả gear ở y≈340/360 rơi GIỮA canvas** → trẻ kéo xuống giữa là xoá nhầm; thả nửa dưới bị từ chối | `GearsGamePage.tsx:98,126` |
| 🟡 TB | `resolveCollision` chỉ đẩy gear mới, **bỏ qua nước & biên**; đẩy vào sông → drop bị huỷ | `Physics.ts:106-139` |

### 2.3. Kiến trúc & hiệu năng
| Mức | Vấn đề | Vị trí (trước) |
|---|---|---|
| 🔴 Cao | **`setInterval` 100ms tạo lại toàn bộ object gear 10 lần/giây** dù không đổi → phá bail-out React, churn CPU/GC, hao pin tablet | `GearsGamePage.tsx:50-64` |
| 🟡 TB | `calculateNetwork` **O(N²)/tick** — dựng lại adjacency mỗi tick thay vì 1 lần khi layout đổi | `Physics.ts:45-72` |
| 🟡 TB | **Nguồn sự thật lẫn state dẫn xuất** trong cùng `GearData` (x/y/teeth chung speed/direction); drag & sim cùng ghi `gears` → đua nhau | `Physics.ts:1-10` |
| 🟡 TB | Engine/render/tương tác **không tách**; luật thắng + nhịp mô phỏng nằm trong component; **2 quy ước motor** (Build seed 8 trong engine, Guess seed 5 ngoài engine nhưng bị ghi đè → code chết) | `GuessDirectionGame.tsx:33-69` |
| 🟡 TB | **Trùng lặp lớn** giữa 2 file mode (header, grid, water, belt-map, gear-label) | `GearsGamePage.tsx:166-271` |
| 🟢 Thấp | Nút **music/sound là state chết** (chỉ đổi màu, không audio nào đọc) | cả 2 file |

### 2.4. Animation & UX/sư phạm
| Mức | Vấn đề | Vị trí (trước) |
|---|---|---|
| 🟡 TB | **Bánh răng không ăn khớp thị giác** — mỗi gear quay pha độc lập, răng xuyên qua nhau (phá tiền đề game) | `Gear.tsx:59-96` |
| 🟡 TB | Tween `rotate:360*dir` **restart từ 0 mỗi recompute** → giật; không có góc liên tục | `Gear.tsx:60-68` |
| 🟡 TB | **Belt luôn chạy 1 chiều** (`Math.abs(speed)`) bất kể chiều quay — sai với game dạy *chiều* | `Belt.tsx:72-82` |
| 🟡 TB | **Kẹt máy không phản hồi** cho trẻ — chỉ `console.warn` vô hình | `Physics.ts:56-62` |
| 🟢 Thấp | Còn `console.log`/`warn`; level **không tất định** (`Math.random`/`Date.now`); `createMeshedGear` fallback hardcode `teeth:10` lệch bán kính | `LevelGenerator.ts` |

### 2.5. Hai giả thuyết bị BÁC BỎ (đã chứng minh)
- ❌ "Phát hiện kẹt vòng lẻ phụ thuộc thứ tự" — sai: cạnh đóng vòng luôn được kiểm từ đỉnh dequeue cuối ⇒ tất định.
- ❌ "Chiều quay phụ thuộc thứ tự, có thể chấm sai trong GUESS" — sai: chiều là order-independent; hơn nữa generator GUESS chỉ sinh chuỗi tuyến tính, không có vòng. (Chỉ **tốc độ** mới phụ thuộc đường đi — nhưng với radius ∝ teeth thì tỉ số luôn telescope = 1 quanh mọi vòng, nên thực tế không bao giờ xung đột tốc độ; jam thực sự đến từ **chiều** — vòng lẻ hoặc cặp vừa mesh vừa belt.)

---

## 3. Nguyên nhân gốc rễ
1. Không tách "layout người dùng dựng" khỏi "kết quả mô phỏng" → state lẫn lộn, đua nhau, render lại liên tục.
2. Mô phỏng kiểu **polling theo thời gian** thay vì reactive theo thay đổi topology.
3. Quan hệ ăn khớp **suy mờ từ khoảng cách pixel** thay vì là **cạnh đồ thị tường minh**.
4. Hằng số & quy ước **rải khắp nhiều file**, không một nguồn sự thật (3 CANVAS_HEIGHT, 2 motor speed, 3 cách quy đổi teeth↔radius).
5. **Render không phản ánh mô hình** (không pha ăn khớp, belt không biết chiều, không trạng thái "kẹt").

---

## 4. Kiến trúc đích — tách Engine · Render · Tương tác

```
games/GearsGame/
├── engine/                  # THUẦN, không React, tất định, test được
│   ├── constants.ts         # NGUỒN SỰ THẬT DUY NHẤT: CANVAS 800×460, teeth↔radius, dung sai, MOTOR, màu
│   ├── types.ts             # GearSpec (nguồn sự thật) ⟂ GearRuntime (suy ra); BuildLevel/GuessLevel
│   ├── rng.ts               # mulberry32 có seed → level tái lập & test được
│   ├── graph.ts             # buildGraph: cạnh mesh (auto, sign -1) + belt (tường minh, +1/-1)
│   ├── simulate.ts          # tô màu 2-coloring + tốc độ tỉ số bán kính + validate-pass jam + pha răng
│   ├── goals.ts             # evaluateBuildGoal / gradeGuess (thuần)
│   ├── levelgen.ts          # generateBuildLevel / generateGuessLevel (seeded, cùng hệ toạ độ)
│   └── engine.test.ts       # 19 test (vitest)
├── components/              # RENDER thuần
│   ├── Gear.tsx             # quay liên tục bằng rAF + đồng hồ toàn cục + pha ăn khớp; dấu kẹt ⚠️
│   ├── Belt.tsx             # theo CHIỀU quay (dir); vẽ được belt chéo
│   ├── WaterZone.tsx        # vùng nước (giữ)
│   ├── GearCanvas.tsx       # board cố định scale-to-fit + tự đổi pointer→toạ độ design
│   ├── GearHeader.tsx       # header dùng chung (đã bỏ nút music/sound chết)
│   └── GearBits.tsx         # RoleBadge (MOTOR/ĐÍCH) + DifficultyPill dùng chung
├── GearsGamePage.tsx        # MODE LẮP — chỉ tương tác, useMemo(simulate) reactive
└── GuessDirectionGame.tsx   # MODE ĐOÁN — chỉ tương tác
```
Mỗi tầng chỉ phụ thuộc tầng dưới; **engine không biết React** ⇒ cùng input luôn cho cùng output (unit-test bằng bảng).
Entry point giữ tên cũ (`GearsGamePage`, `GuessDirectionGame`) vì `App.tsx` & `games/GamesMenu.tsx` import.

---

## 5. Thuật toán chiều quay + tốc độ + kẹt (bản đúng)

Tách hẳn **dựng đồ thị** → **tô màu** → **kiểm tra** (sửa lỗi cũ chỉ kiểm khi gặp lại đỉnh đã thăm, bỏ sót tốc độ):

```
1) buildGraph(layout):
   - cạnh ĂN KHỚP (mesh): tự suy từ hình học, sign = -1 (đảo chiều)
     ăn khớp ⇔ |khoảng cách tâm − (r1+r2)| ≤ max(MESH_TOL_MIN, MESH_TOL_RATIO·(r1+r2))   ← tương đối theo size
   - cạnh DÂY ĐAI (belt): tường minh; thẳng = +1 (cùng chiều), chéo = -1 (đảo)

2) Tô màu từ motor (BFS) trong cụm liên thông:
   - chiều con  = edge.sign × chiều cha            (parity / 2-coloring)
   - tốc độ con = tốc độ cha × (r_cha / r_con)      (theo BÁN KÍNH — mesh & belt đồng nhất)
   - pha con    = meshPhase(cha, con) nếu mesh, = pha cha nếu belt   (để răng khít)

3) VALIDATE-PASS qua MỌI cạnh trong cụm-motor:
   - lệch chiều           → xung đột (vd vòng LẺ; cặp vừa mesh vừa belt thẳng)
   - lệch tốc độ (|Δ|>ε)  → xung đột (quá-ràng-buộc)

4) Áp trạng thái:
   - có xung đột → CẢ CỤM nối motor = 'jammed' (kẹt cứng), KHÔNG đụng cụm độc lập (vẫn 'idle')
   - không      → cụm = 'driven' (chiều/tốc độ/pha đã tính); ngoài cụm = 'idle'
```
- **Trạng thái mỗi gear: `driven | idle | jammed`** — phân biệt rõ "đang quay / chưa nối / kẹt" (sửa lỗi `direction===0` nhập nhằng).
- Kẹt chỉ khoá đúng cụm nối motor; có icon ⚠️ trên gear đỏ + banner báo "hai bánh răng đỏ đang xung đột chiều quay" (sửa lỗi kẹt im lặng).
- `rotationDeg(runtime, t) = phaseDeg + dir × speed × DEG_PER_SPEED × t` — dùng ở renderer.

---

## 6. Hệ toạ độ & render

- **Một `CANVAS 800×460` duy nhất** (`constants.ts`). `GearCanvas` đặt board cố định 800×460 rồi **scale-to-fit + canh giữa**; toạ độ design (engine/levelgen) **luôn khớp** pixel hiển thị ⇒ hết lệch hệ toạ độ, vùng xoá nằm đúng đáy. `GearCanvas` cũng tự đổi `pointer → toạ độ design` nên mode chỉ làm việc trong 1 hệ.
- **Quay liên tục bằng rAF + đồng hồ TOÀN CỤC** (`CLOCK0` ở module Gear): mọi bánh răng dùng cùng mốc thời gian nên các bánh ăn khớp giữ đúng pha (răng khít). rAF ghi thẳng `transform` vào DOM (không re-render React) ⇒ mượt, không "giật reset".
- **Pha ăn khớp** `meshPhaseDeg`: tại điểm tiếp xúc, **răng của bánh này khớp khe của bánh kia**; vì tốc độ vành (ω·r) bằng nhau và ngược chiều nên khớp được giữ theo thời gian.
- **Belt theo chiều quay** (prop `dir`): hết lỗi belt luôn chạy 1 chiều; vẽ được cả belt **chéo**.
- Mũi tên chỉ chiều nằm ở **lớp tĩnh** (không quay theo gear) → tín hiệu "chiều" ổn định.

---

## 7. Lộ trình triển khai (đã hoàn tất ✓)

| GĐ | Nội dung | Trạng thái |
|---|---|---|
| **0 — Quick wins** | 1 `constants.ts`; thống nhất CANVAS; sửa ngưỡng xoá/trả; belt đúng chiều; bỏ `console.*`; bỏ nút music chết | ✅ |
| **1 — Engine thuần** | tách `engine/`; `simulate(layout, motor)` thuần (motor là tham số); + **19 unit test** | ✅ |
| **2 — Đồ thị tường minh** | `Connection` mesh/belt; dung sai **tương đối**; validate-pass jam theo cụm; belt theo bán kính + hỗ trợ chéo | ✅ |
| **3 — Recompute reactive** | bỏ `setInterval`; `useMemo(simulate)` theo `[layout, belts]`; tách nguồn sự thật khỏi dẫn xuất | ✅ |
| **4 — Render đúng** | rAF góc liên tục + pha ăn khớp; belt theo chiều; hiển thị kẹt; mũi tên ngoài nhóm quay | ✅ |
| **5 — Gộp 2 mode** | `GearCanvas`/`GearHeader`/`GearBits` dùng chung; Build/Guess chỉ còn tương tác | ✅ |
| **6 — Level-gen tất định** | RNG có seed; sửa không gian toạ độ; `createMeshedGear` nhất quán teeth↔radius | ✅ |
| **+ Thêm** | belt chéo chơi được (toggle Thẳng/Chéo ở BUILD, hard tự sinh ở GUESS); a11y (aria-label, nút đoán to hơn) | ✅ |

---

## 8. Kiểm thử

- **`npm test`** (vitest) chạy `engine/engine.test.ts` — **19/19 pass**: chiều quay xen kẽ + tốc độ theo răng;
  belt thẳng cùng chiều / belt chéo đảo chiều; kẹt vòng lẻ + mesh+belt mâu thuẫn + kẹt chỉ trong cụm-motor;
  bánh cô lập idle; `rotationDeg`; `areMeshing`; goals; levelgen tất định + chuỗi EASY nối thông motor→target trên 6 seed.
- **`tsc --noEmit`**: sạch (exit 0).
- **Verify trực tiếp trên app**: render cả 2 mode; đặt gear (tap) → lan truyền chuyển động (gear mới thành `driven`,
  có mũi tên chiều); kéo-di-chuyển; kéo xuống đáy → xoá; luồng ĐOÁN→Kiểm tra→chấm điểm→lật đáp án. Không lỗi console.
- **Lưu ý preview**: trình xem chạy **tab ẩn** → `requestAnimationFrame` bị throttle (bánh răng đứng yên trong
  preview là **bình thường**); đã verify thay thế bằng test + toán xoay. Trên trình duyệt thật (tab hiển thị) bánh răng quay đầy đủ.

---

## 9. Việc còn lại (ưu tiên thấp)
1. Trùng lặp nhỏ còn sót: thanh trạng thái/độ khó giữa 2 mode (đã gộp phần lớn qua `GearBits`).
2. A11y nâng cao: điều hướng bàn phím cho thao tác đặt/kéo gear (hiện tối ưu cho chạm/chuột).
3. Belt trong BUILD chưa chặn nối xuyên nước/qua bánh khác (hiện chỉ báo **kẹt** khi mâu thuẫn chiều — vẫn mang tính dạy học).
4. `targetMinSpeed` đã có trong type nhưng chưa level nào dùng (chỗ mở rộng puzzle "đủ nhanh mới thắng").

---

## 10. Rủi ro / lưu ý bảo trì
1. **Đừng tái phạm**: `setInterval` polling; nhiều `CANVAS_HEIGHT`; dung sai ăn khớp tuyệt đối ±px; nhét speed/direction vào `GearSpec`.
2. Mọi hằng số mới phải vào `constants.ts` (một nguồn sự thật) — đặc biệt quan hệ `teeth↔radius` (giữ radius ∝ teeth để tỉ số mesh/belt nhất quán).
3. Pha ăn khớp răng là phần tinh vi nhất (`meshPhaseDeg`); nếu chỉnh hình học răng trong `Gear.tsx` phải giữ quy ước "răng ở nửa sau mỗi bước" để công thức pha còn đúng — nhưng sai pha chỉ là **thẩm mỹ**, không ảnh hưởng tính đúng của chiều/tốc độ/kẹt.
4. Engine thuần & tất định: thêm tính năng nên kèm test bảng trong `engine.test.ts`.
