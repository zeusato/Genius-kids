# Xưởng Lắp Ghép — CHECKPOINT (đọc file này đầu tiên)

> Mọi phiên (Claude hay model khác) **đọc file này trước**, rồi đọc [../brick-studio-plan.md](../brick-studio-plan.md) phần liên quan.
> Xong mỗi đoạn việc thì **cập nhật file này ngay**: việc đã xong, việc đang dở (file nào, dừng ở đâu), bước kế tiếp.
> Chủ dự án tự push/deploy. Không push, không chạy deploy, không gọi GitHub Actions.

## Bàn giao cuối đợt — 15/10/2026

**Đại ca yêu cầu đóng gói để push và nghỉ, mai làm tiếp. Đã dừng mở rộng tính năng. Đây là checkpoint phát triển, CHƯA nghiệm thu hoàn tất v1.** Chủ dự án tự push/deploy.

### Đã chốt trong đợt

- Tích hợp Xưởng Lắp Ghép vào Góc Thủ Công; giữ ảnh menu robot mới từ imagegen. Gồm code/data GĐ0–4 đã có trong workspace.
- Tách Editor và hàng đợi tự lưu: serialize revision, giữ chỉnh sửa đến trong lúc ghi, retry khi lỗi, không rời tủ nếu lưu thất bại, tải JSON dự phòng; thumbnail lỗi không làm mất bản lưu.
- Ngăn ghi đè bản lưu có mảnh/màu chưa hỗ trợ. Nhấc mảnh giữ nguyên bản gốc tới khi xác nhận vị trí mới; Esc hủy không xóa mảnh. Kiểm tra lại vị trí trước commit, giới hạn 4.000/cảnh báo 3.000 mảnh.
- Sửa race tải mảnh/kéo từ khay; cleanup pointer, coach bỏ qua/xem lại, Delete và Shift+R. Mẫu giáo mặc định Lắp nhanh tắt, hạn chế mảnh, không pan hai ngón.
- Tìm theo tên/mã, Vừa dùng, đọc tên mảnh/màu có hạn tần suất; cài đặt chất lượng/trợ giúp/ghi công. Vùng chạm màu 44 px. Sửa header HubShell che toolbar.
- Thêm profile.bricks, huy hiệu không cộng sao, số liệu 30 ngày chỉ lưu trên máy và tải JSON; xóa hồ sơ dọn models/thumbs.
- AO mức cao/vừa; chia sẻ một renderer phụ icon/PDF, cleanup geometry/material/context và job icon. Xoay 360 tự dừng, reduced motion.
- Không xuất BrickLink khi chưa có mapping; CSV không đoán mã. PDF hiển thị đủ tối đa 6 loại mảnh/bước, hủy khi đóng; từ chối hướng dẫn có mảnh lơ lửng.
- Lối vào guided GĐ5 được ẩn bằng điều kiện false, giữ code thử để tiếp tục. Không công bố là tính năng hoàn chỉnh.
- Fuzz phát hiện ô không gian rỗng không được xóa; đã sửa World.unindex.

### Kiểm chứng

- Bộ nền trước sửa: 65 test passed, 1 benchmark skipped.
- Bộ mở rộng sau sửa: 73 test passed, 1 benchmark skipped; riêng fuzz 100.000 vượt timeout 300 s (chạy ~422 s), **chưa đạt gate này**. Không phát hiện assertion sai ở lần đó; timeout vẫn là fail.
- Chế độ dài riêng: PowerShell `$env:BRICKS_STRESS='1'; npx vitest run src/bricks/engine/stress.test.ts`; mặc định chạy 2.000 thao tác. Kết quả chốt ghi bên dưới.
- Test mới: save queue overlap/retry, IndexedDB conflict/owner/stale thumbnail/cleanup, 200 undo/redo, huy hiệu, retention, phát lại 200 mô hình ngẫu nhiên có nối cạnh/lắp dưới, chặn export lơ lửng.
- Browser local 1180×820: Góc Thủ Công → Xưởng Lắp Ghép → sao chép robot → bỏ qua coach → vừa khung → settings → đổi tên/tự lưu → PDF 6 trang/11 mảnh/6 bước → tải thành công. Có shader warning; không thấy runtime error trong lần đọc log.
- Bằng chứng: C:/Users/admin/.codex/visualizations/2026/10/14/01a13aaf-1489-7143-a183-9457f1d8220f/bricks-checkpoint-export.png. PDF: C:/Users/admin/Downloads/QA đóng gói 15-10.pdf. Không đưa QA cá nhân vào git.
- Build production + PWA đã qua; build chốt sau CSS ghi bên dưới. Có warning về font Nunito/CSS utility/chunk lớn.
- tsc --noEmit còn lỗi có trước modules/farm/src/ui/renderSnapshot.ts:26 (object[] không khớp Obstacle[]). Không còn lỗi TS trong phần bricks. Không sửa farm ở đợt này.
- Chưa chạy full suite toàn repo; không coi targeted tests là toàn repo xanh.

### Việc đầu tiên ngày mai

1. Chạy/tối ưu fuzz 100.000 riêng, không song song build; thêm phủ dịch cụm/lift/move, mọi hướng và round-trip LDraw. Chưa coi fuzz hiện tại bao phủ hết tương tác.
2. QA Workbench/Editor: kéo/hủy/nhấc/undo, hai tab xung đột, WebGL loss, offline/quota, mẫu giáo, tablet dọc/màn hẹp. Focus trap/inert dialog chưa hoàn thiện. JSON dự phòng còn cần luồng import/recovery.
3. Renderer/UI: FPS đầu phiên để tự hạ chất lượng, vẽ đẹp khi nghỉ 300 ms, preview 3D nhấn giữ, nét viền, nhóm con/icon khay. Hiện chỉ chọn chất lượng theo thiết bị và thủ công; CHƯA đủ plan.
4. PDF: đổi góc khi bị che, thước khoảng cách cụm/đế gợi ý, đọc PDF 3 mẫu, giới hạn bộ nhớ mô hình lớn, hủy khi chụp. Xem PDF đã xuất để tinh chỉnh.
5. Có 10 mẫu nhưng chưa phải tất cả 20–60 mảnh (robot 11); cá/chậu hoa thay khủng long/rùa trong plan. Chưa duyệt mẫu cuối. Preschool list cần curate đủ ~30 mảnh.
6. Rà profile/metrics khi storage lỗi, số liệu move/paint/copy/delete/invalid/latency/quick. Đồng bộ Google hai máy thật chưa kiểm chứng.
7. Gate chủ dự án/thiết bị: duyệt 12 bảng mảnh + 6 cảnh + 10 mẫu; iPad Safari/Android touch/FPS 2.000 mảnh; PDF Safari; .ldr Studio/LeoCAD; sau đó mới nghiệm thu v1.
8. GĐ5–8 sau v1: guided persistence/reconcile undo/thưởng đúng một lần, symmetry/layers/multiselect/stage, joints/challenges. Chưa bật guided lại.

## Nhật ký các đợt trước (tham khảo lịch sử)

Các trạng thái GĐ0a/GĐ1 bên dưới là lịch sử; bàn giao phía trên là hiện tại. Plan: [../brick-studio-plan.md](../brick-studio-plan.md), D1–D13 chốt 14/10.

## Dữ liệu ngoài (tools/ldraw/, đã gitignore, không commit) — ĐÃ TẢI 14/10

| Thư mục | Nội dung |
|---|---|
| `tools/ldraw/lib/ldraw/` | thư viện LDraw (giải nén từ `complete.zip`, 146 MB, 37.250 file) |
| `tools/ldraw/shadow/LDCadShadowLibrary-main/` | shadow LDCad (CC BY-SA 4.0), 4.285 file |
| `tools/ldraw/rebrickable/*.csv.gz` | parts, colors, elements, inventory_parts, inventories, part_categories |
| `tools/ldraw/candidates.tsv`, `cand-ok.txt` | đầu ra tạm của `candidates.mjs` |

Tải lại nếu mất: xem lệnh trong lịch sử, nguồn: library.ldraw.org/library/updates/complete.zip · codeload.github.com/RolandMelkert/LDCadShadowLibrary/zip/refs/heads/main · cdn.rebrickable.com/media/downloads/<tên>.csv.gz. `REBRICKABLE_KEY` chưa có (tuỳ chọn).

## Code đã viết (scripts/bricks/)

| File | Việc | Trạng thái |
|---|---|---|
| `ldraw.mjs` | `Library`: chỉ mục file (parts/p/models + shadow), `parse`, `flatten(name, lite)` — làm phẳng đệ quy, BFC (định thức âm/INVERTNEXT/CW, file không chứng nhận → `dbl`), tách núm `stud.dat`/`stud2.dat` thành instance, thừa kế snap (bỏ khi co giãn trừ `scale`≠none, bỏ khi soi gương nếu `mirror=none`), áp shadow (CLEAR/INCL/CYL…, bung `grid`). Chế độ `lite` bỏ hình học ống đáy `stud3/4/6*` nhưng giữ snap | chạy tốt |
| `snap.mjs` | parse dòng SNAP_*, `classify` → stud/antistud (r6, R hoặc S)/pin/pinhole (r4)/technic/clip/hinge/generic; núm đực sau đoạn đế được dời gốc (`shift`). `toConnectors` → `{kind,pos,axis,len,group?,gender?}` | chạy tốt |
| `mesh.mjs` | `buildMesh`: bỏ tam giác suy biến, nhân đôi mặt `dbl`, hàn đỉnh 1/16 LDU, làm mượt theo cạnh không cứng (type 2) + góc < 70°, nhóm chỉ số theo màu (16 = màu chính đứng đầu). `packMesh`: Int16 (×8), pháp tuyến octahedral int8, Uint16/32 | chạy tốt |
| `collide.mjs` | `collisionBoxes`: voxel 2→4→8 LDU, lấp cột đứng, gộp tham lam, ≤ 24 hộp, cắt về hộp bao thật | chạy tốt |
| `candidates.mjs` | xếp hạng theo số bộ (inventory_parts), lọc nhóm Rebrickable, ghi chú MOVED/NO_V1_CONN/V2_CONN | chạy tốt (~1 phút) |
| `inspect.mjs`, `inspect-mesh.mjs` | công cụ xem nhanh một mảnh | |

Kết quả kiểm tay: 3001 → 8 núm + 8 lỗ, mặt trên pháp tuyến hướng −Y (ngoài) đúng; 87087 có núm cạnh; 4600 có 2 `pin`; 4624 có `pinhole`; 6141 núm dời đúng về y=0. Tấm 16×16 (91405) 16k mặt, bản lite 10k (gân dưới đáy) — cân nhắc bỏ hoặc chấp nhận.

## Phát hiện cần nhớ

- Nhiều mã phổ biến đã "~Moved to X" (3023→3023b, 3660→3660a, 3665→3665a, 43722→43722a…) → phải theo mã mới.
- Cửa/cửa sổ nối kính bằng `hinge` (SNAP_FGR) hoặc `generic`; lốp nối vành bằng `generic` (group, ví dụ `rim8_6`). v1: ghép sẵn thành **bộ** (kit) — tính phép đặt bằng khớp snap cùng loại.
- Bánh 6014b (lỗ khía cho chốt) không có snap → cần bảng sửa tay (overrides).

## GĐ0a — XONG phần máy (14/10), chờ CỔNG MẢNH

Quy trình tái tạo (theo thứ tự):
1. `node scripts/bricks/select.mjs` → nháp `docs/brick-studio/parts-v1.csv` (giữ dòng cũ, chỉ thêm mới).
2. `node scripts/bricks/curate-v1.mjs` → rà tay: DROP/MOVE/NAME + 34 tấm in + 4 bộ (kits.mjs) + 4600. Kết quả **297 mảnh**.
3. `node scripts/bricks-parts.mjs` → `public/bricks/catalog.json` (381 KB) + `public/bricks/parts/<nhóm>.bin` + `studs.bin` (tổng ~1,9 MB). `--check` chỉ kiểm.
4. `node scripts/bricks/sheets.mjs [nhóm]` → bảng duyệt `docs/brick-studio/sheets/<nhóm>.webp` (bộ vẽ phần mềm `raster.mjs` đọc lại đúng .bin → kiểm luôn định dạng).

Lệch plan (đã ghi mục 20 plan khi cần): catalog nằm ở `public/bricks/catalog.json` (fetch lúc chạy) thay vì `src/bricks/catalog/*.generated.json`; bảng duyệt là `.webp`; nhóm `tile` 64 mảnh (30 thường + 34 in).

Định dạng `catalog.json` (engine/renderer phải theo):
- `posScale` 8: vị trí Int16 / 8 = LDU. Toạ độ LDraw (Y xuống).
- `parts[key]`: `name, group, ldraw, rb, print?, kit?, lite?, faces, bbox[[min],[max]], mesh{vc,i32,pos[byteOff,len],nrm[..],idx[..],groups[{color,start,count}]}, boxes[[x0,y0,z0,x1,y1,z1]], conns[{k:'s'|'a'|'p'|'h', p:[x,y,z], a:[ax,ay,az]}], studs[{k:'s'|'h', m:[x,y,z,a..i], c}], bom[{ldraw,color:'self'|mã,qty}], colors: string[]|null` (màu có thật; null = không rõ).
- Màu nhóm `16` = màu bé chọn; mã khác = màu cố định trong `fixedColors[mã]{hex,alpha,material}`.
- `studs.s|h.mesh` = lưới núm dùng instancing; `palette[]` 27 màu `{key,ldraw,rb,nameVi,nameEn,kind,hex,alpha,material}`; `preschoolColors`; `credits`.
- Điểm nối: gốc `p` = chân núm / miệng lỗ, `a` = trục cắm (−Y cục bộ của snap). **Khớp** khi đực–cái cùng `p` và cùng `a`: s↔a, p↔h.

Sửa quan trọng trong lượt GĐ0b (đã build lại catalog):
- `snap.mjs` `cylEnds`: chuẩn hoá theo `caps` — đực: chân ở đầu A; cái `one`/`B` → miệng ở A; `A` → miệng ở B (ngược hướng); `none` → 2 miệng. (Tấm trơn tròn 98138 có caps=A.)
- `collide.mjs`: luôn voxel 2 LDU (≤ 96 hộp, quá thì gộp); thay lấp-cột bằng **loang từ ngoài** (khoang hở dưới đáy giữ rỗng); **khoét** thể tích núm/chốt và lòng lỗ của chính mảnh (bán kính r+2,5).
- Bỏ 29119, 29120 (dữ liệu lỗ nhận sai) → **295 mảnh**. catalog.json ~614 KB.

## GĐ0b — XONG (14/10)

`src/bricks/engine/` (TypeScript thuần, không React/three):
- `types.ts` kiểu catalog + `Piece`.
- `orient.ts` 24 ma trận (chỉ số 0 = đơn vị, THỨ TỰ CỐ ĐỊNH vì dữ liệu lưu chỉ số), `YAW[0..3]` xoay quanh trục đứng, `rotBox`.
- `parts.ts` `preparePart` → `oriented(o)` (conns/boxes/bbox đã xoay, cache) + `symClass` (mảnh in: không đối xứng).
- `world.ts` `World`: băm không gian (ô 80) + băm điểm nối theo họ S (s/a) và P (p/h); `check()` = vùng xây, hộp chồng hộp (TOL 2,5), núm đâm thân (trừ chỗ có lỗ khớp), ≥1 cặp khớp (mặt bàn = núm ảo tại (20i+10, 0, 20k+10)); **lift**: mảnh thò dưới mặt bàn được nếu nối vào cụm và cả cụm nâng lên được → trả `lift {ids, dy}`; `add/remove/shift` (giữ thứ tự lắp), `component`, `canShift`, `floating()` (cụm không chạm bàn), `isCovered` (ẩn núm bị che).
- `pick.ts` tia vs hộp bao → hộp con, + mặt bàn y=0 → `Hit {kind, id?, point, normal, t}`.
- `place.ts` `suggest(world, part, prefO, hit, opt)` → `{best, options, target}`; mặt không có điểm nối song song → bắn tia rơi xuống; `bottomUpOnly` cho chế độ bé; `wantOptions` cho nút ↻.
- `history.ts` lệnh add/remove (chèn lại đúng thứ tự)/color/shift/batch; `place(...lift)`; `move`.
- `model.ts` `BrickModel` v1 (6 số/mảnh), `encodeWorld`, `decodeInto` (mảnh lạ bỏ qua + báo), `validateModel`.
- Test: `engine.test.ts` 13 test (gồm fuzz 400 thao tác, 295 mảnh × gắn lên/xuống gạch 1×1, núm cạnh, bánh xe nâng cụm). `scripts/bricks/pipeline.test.mjs` 12 test.
- Đo (`BENCH=1 … bench.test.ts`, máy dev): 2.000 mảnh — chọn điểm 0,10 ms, gợi ý 1,85 ms, lơ lửng 10 ms.

Lệnh test: `node node_modules/vitest/vitest.mjs run src/bricks scripts/bricks`

## GĐ1 — ĐANG LÀM (14/10)

Đã có (chạy được ở `http://localhost:3000/Genius-kids/bricks-preview.html`; `?demo=1` tự dựng cảnh mẫu, `?be=1` chế độ bé, `?q=low|mid|high`):
- `src/bricks/render/loader.ts` (PartLibrary: fetch catalog + .bin theo nhóm, giải mã → BufferGeometry), `materials.ts` (nhựa Physical/Standard, trong suốt, ánh kim, màu cố định, vật liệu bóng mờ), `modelMeshes.ts` (InstancedMesh theo (mảnh, nhóm vật liệu), nhóm màu cố định tách lưới, núm instancing + ẩn núm bị che; `buildSingle` cho bóng mờ), `BrickCanvas.tsx` (Canvas demand, RoomEnvironment, bóng mềm, Grid bàn, CameraControls TẮT input — điều khiển qua `CanvasApi`; LDraw→three = quay 180° quanh X, chia 20).
- `src/bricks/input/gesture.ts` + 7 test.
- `src/bricks/ui/Workbench.tsx` (4 chế độ, khay chữ, bảng 27 màu, bóng mờ + ✓/↻ nổi, đường rơi, núm sáng, mảnh lơ lửng phủ đỏ, kéo từ khay, phím tắt, A/B Lắp nhanh/lệch ngón/chất lượng, "Thêm 2.000 mảnh", đo fps 360°), `sound.ts`, `bricks.css`, `src/bricks/demo.ts`, `src/bricks/preview.tsx`, `bricks-preview.html`.
- Sửa engine trong lượt này: `place.ts` chỉ nhận điểm nối mở ra phía mặt được chạm (trước đây chạm mặt trên tấm lại gắn treo dưới đáy); `pick.ts` tia lọt vào chỗ khoét sâu > 6 LDU thì dùng mặt hộp bao. Test: 32 đạt.

Kiểm bằng mắt: khung Browser của app hay bị ẩn (document.hidden → R3F không vẽ). Dùng Chrome headless hồ sơ tạm:
`"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --user-data-dir=<scratchpad>/chromeN --enable-webgl --ignore-gpu-blocklist --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1180,820 --virtual-time-budget=45000 --screenshot=<scratchpad>/x.png "http://localhost:3000/Genius-kids/bricks-preview.html?demo=1"` (đôi khi ra canvas trống → chạy lại với hồ sơ mới).

Thêm (lượt 2): `place.ts` **"leo lên"** — chạm mặt ngửa mà mọi chỗ vướng → thử mặt núm cao nhất dưới vùng chân mảnh (tấm mái thả giữa 4 cột giờ lên đầu cột). `render/icons.ts` hình thẻ 3D trong khay (1 renderer phụ, vẽ mỗi khung 1 hình, cache (mảnh, màu)). `CanvasApi.angle()`. Demo dựng đủ 32 mảnh (nhà + xe 4 bánh). Chụp: `bash scripts/bricks/shot.sh <out.png> [query]` (headless đôi khi trống → chạy lại).

Còn của GĐ1 (không chặn): mái dốc trái trông nhạt (kiểm phản chiếu/clearcoat ở góc gần); tự chọn mức chất lượng theo fps + "vẽ đẹp khi dừng tay" chưa làm (đang chọn tay). Cổng hình ảnh + cổng chơi thử: CHỜ CHỦ DỰ ÁN.

## GĐ3 — PHẦN LÕI XONG (14/10), đã thử trong app thật

- `src/bricks/progress/modelRepo.ts`: IndexedDB `brick-studio-v1` (`models`, `thumbs`, khoá [ownerId,id], index ownerId), revision chống ghi đè, giới hạn 200 mô hình, `saveThumb` không đè bản mới, `newModel`.
- `services/account/snapshot.ts`: thêm `brick-studio-v1` (đủ 2 store) + round trip trong `account.test.ts` (11/11 đạt).
- `src/bricks/ui/BrickStudio.tsx`: Tủ Mô Hình (tạo, mở, đổi tên, nhân bản, xoá có xác nhận, Ý tưởng hôm nay) + `Editor` tự lưu (1,5 s, visibilitychange/pagehide, khi quay lại tủ; ảnh thu nhỏ ≤ 10 s/lần và khi rời) ; `content/ideas.ts` 40 ý tưởng, 3/ngày cố định.
- `Workbench`: nhận `initial` (decodeInto, báo mảnh lạ), `header`, `control` (world + thumbnail qua `CanvasApi.snapshot`).
- `src/bricks/ui/BricksPage.tsx` + route `/bricks/*` trong `App.tsx`; `CraftId 'bricks'` + thẻ trong `CRAFT_CATALOG` (Góc Thủ Công, do phiên Xưởng Gốm tạo — các file sảnh có thay đổi chưa commit của phiên đó, đừng hoàn tác) ; `HubArt` ảnh `public/bricks/cover.webp` (+ `-sm`) chụp từ chính renderer (`?demo=1&shot=1`).
- Đã thử trong khung Browser: chọn hồ sơ thử "Thử Lắp Ghép" (chỉ ở trình duyệt dev) → Góc Thủ Công → Xưởng Lắp Ghép → ý tưởng "Con cá" → lắp 1 gạch → IndexedDB rev 3, tủ có ảnh thu nhỏ, mở lại đúng.
- `CanvasApi.fit` tự tính khoảng cách (fitToBox của camera-controls làm mất góc nghiêng).

- **10 mô hình mẫu** `src/bricks/content/samples.ts` (DSL thả mảnh `d(part, màu, x, z, yaw)` + `t.wheels()`), test `samples.test.ts` (mọi mảnh đặt được, không lơ lửng, 8–80 mảnh). Ảnh: `public/bricks/samples/<id>.webp` (chụp `?demo=1&sample=<id>&shot=1`), bảng duyệt `docs/brick-studio/samples-v1.webp`. Kệ "Mẫu để lắp lại" trong tủ → `sampleModel` → lưu → mở. Đã thử trong app (Tên lửa, 10 mảnh).
- Sửa engine: `pick.ts` tia lọt lỗ xuyên tâm (gạch tròn) vẫn tính chạm mặt hộp bao. Bỏ mảnh 33051 (quả táo: chỉ có chốt nghiêng) → 294 mảnh.
- `scripts/bricks/shot.sh` không còn tự xoá hồ sơ tạm (lệnh rm bị chặn) — tham số 5 = thư mục hồ sơ, đặt trong scratchpad.

## GĐ4 — XONG (15/10)

- Pipeline: `bom` của catalog có `name` (tiêu đề LDraw), `nameVi` (mảnh phụ của bộ, khai trong `kits.mjs` `baseVi`/`nameVi`), `m` (ma trận mảnh phụ trong bộ).
- `src/bricks/export/bom.ts` (`buildBom`: bung bộ, gom (mảnh, màu), ⚠ tổ hợp không có thật + gợi ý màu gần nhất có thật; `realSize` cm), `steps.ts` (`buildSteps`: kết nối + thấp trước + sweep, ≤6/bước, cờ `hard`), `files.ts` (`toLdraw` có `0 STEP` + bung bộ; `toBricklinkXml` — CHÚ Ý mã màu là Rebrickable, đã ghi chú trong file; `toRebrickableCsv`), `pdf.ts` (trình ghi PDF ảnh JPEG tự viết), `pages.ts` (`buildDocument`: bìa, 6 góc nhìn, danh sách mảnh 10 dòng/trang, các bước 4/trang có khung mảnh cần, trang Cho người lớn + Ghi công).
- `src/bricks/render/shooter.ts` renderer phụ chụp góc/bước, khung cố định theo toàn mô hình, mảnh mới **viền vàng** (mặt sau phóng to ~3 LDU, bỏ qua kính).
- `src/bricks/ui/ExportSheet.tsx` + nút "Xuất" trên thanh của Editor (lưu trước khi xuất): tiến độ, xem trước trang, Tải PDF, Lưu ảnh từng trang, mục "Cho người lớn" (.ldr, XML, CSV).
- Test `export.test.ts` (7): tổng BOM, bung bộ, phát lại các bước, "mái hiên không lên trước trụ", LDraw, XML/CSV, cấu trúc xref PDF.
- Kiểm bằng mắt: `?demo=1&sample=nha&page=N` (BUDGET=180000 cho shot.sh vì dựng tài liệu bằng swiftshader chậm). Đã xem trang 1, 3, 4, 5.

## Đang dở

- GĐ2 còn: bong bóng chế độ Chọn (Nhấc/Xoay/Nhân bản/Tháo), hướng dẫn lần đầu + TTS, tự chọn mức chất lượng, kiểm 820×1180.
- `profile.bricks` (thống kê nhẹ, huy hiệu) — chưa làm.
- GĐ5 (lắp theo hướng dẫn trong app, xem quá trình lắp), GĐ6 (Nổ tung, đối xứng, soi tầng, sân khấu).
- GĐ2 còn: bong bóng chế độ Chọn (Nhấc/Xoay/Nhân bản/Tháo), hướng dẫn lần đầu + TTS, tự chọn mức chất lượng, kiểm 820×1180.

## Bước kế tiếp

1. **GĐ1** `bricks-preview.html` + `src/bricks/preview.tsx`: renderer R3F (instanced thân + núm, ẩn núm bị che, vật liệu, RoomEnvironment, bóng, N8AO, 3 mức chất lượng, vẽ lại khi dừng tay), bóng mờ (xanh/đỏ, nhìn xuyên, đường rơi, núm sáng), máy trạng thái `input/gesture.ts` + test, camera `camera-controls` điều khiển bằng API, khay tối giản ~40 mảnh, Lắp/Tháo, hoàn tác, âm thanh, A/B (Lắp nhanh, lệch ngón), nút "Thêm 2.000 mảnh".
2. Cổng mảnh: chủ dự án xem `docs/brick-studio/sheets/*.webp` (cần chạy lại `sheets.mjs` vì catalog đã đổi).

## Nhật ký đoạn việc

| Ngày | Đoạn | Kết quả | Commit |
|---|---|---|---|
| 14/10 | Plan + chốt quyết định | `docs/brick-studio-plan.md` | chưa commit |
| 14/10 | Tải dữ liệu ngoài, bộ đọc LDraw/snap/mesh/collide, danh sách ứng viên | `scripts/bricks/*` | chưa commit |


## Kết quả chốt gói 15/10

- Chạy chốt: `npx vitest run src/bricks/engine/stress.test.ts src/bricks/progress src/bricks/export` → **5 files / 16 tests passed**, gồm fuzz 2.000 thao tác (~7,8 s).
- `npm run build` sau sửa CSS cuối → **exit 0**, production + PWA thành công.
- `git diff --check` → sạch (chỉ cảnh báo chuyển LF/CRLF).
- Giữ lỗi tsc module farm và gate fuzz 100.000 ở danh sách chưa xong. Gói hiện tại để lưu tiến độ, không tuyên bố v1 hoàn tất.
