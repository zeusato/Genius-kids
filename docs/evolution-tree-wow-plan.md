# Làm lại "Cây Tiến Hóa": cây sự sống phát quang mọc xuyên thời gian

Ngày 28/09/2026. Nhánh làm việc: `feat/evolution-tree-wow`. Tag backup: `evo-before-wow` (đặt trên `main` trước khi sửa).
Route giữ nguyên: `/science/evolution` (catalog, test hub và App.tsx không đổi).
Tài liệu đi kèm: [evolution-tree-wow/data-spec.md](evolution-tree-wow/data-spec.md). Cấu trúc cây, thời gian, lớp phủ, hình ảnh và trò chơi đã chốt hết ở đó.

---

## 0. Đọc trước khi code

- **Quyết định ở mục 1 đã chốt.** Đừng tự đổi. Gặp mâu thuẫn thì ghi vào `data-spec.md › N. Câu hỏi mở` rồi hỏi người dùng.
- Mỗi giai đoạn (GĐ) có danh sách việc, **Định nghĩa hoàn thành (DoD)** và **effort khuyến nghị**. Làm xong một GĐ thì cập nhật bảng trạng thái (mục 12).
- Các "bẫy" ở mục 9 đều đã từng gây lỗi thật trong repo này (Hệ Mặt Trời, Tế bào, Xưởng hành tinh). Đọc hết trước GĐ1.
- Bố cục tham chiếu đã chạy trên dữ liệu thật: `docs/evolution-tree-wow/prototype-layout.mjs`, ảnh kết quả `sketch-v2.webp`. Engine TS phải cho **cùng kết quả**.

| GĐ | Nội dung | Effort khuyến nghị | Vì sao |
| --- | --- | --- | --- |
| 0 | Chép dữ liệu, engine thuần, test | medium | Mọi quyết định đã có trong data-spec; test bắt lỗi chép sai |
| 1 | Nền render (canvas, camera, cành, ngọn, vòng, nhãn, chọn) | medium, làm đúng checklist bẫy | Nhiều bẫy R3F/ANGLE, nhưng đã liệt kê sẵn |
| 2 | Mỹ thuật: shader, hình, hậu kỳ, mở màn | **high** | Cần mắt thẩm mỹ, đo fps, lặp nhiều vòng; spec không thể thay mắt nhìn |
| 3 | Thẻ, tìm kiếm, điều hướng, lớp phủ SGK | low → medium | UI thường, spec đầy đủ |
| 4 | Cỗ máy thời gian và hiệu ứng sự kiện | medium (khoảnh khắc thiên thạch: high) | Logic rõ, phần hiệu ứng cần tinh chỉnh |
| 5 | Ba trò chơi, sổ tay, huy hiệu | medium | Logic và dữ liệu đã có, có test |
| 6 | Kiểm thử, đo trên máy thật, dọn bản cũ | medium | Nếu phải tối ưu hiệu năng thì high |
| — | Review cuối mỗi GĐ (`/code-review`) | high | Lần review rẻ hơn lần sửa |

---

## 1. Quyết định đã chốt

1. **Cây phát sinh đúng.** Nhóm SGK không phải một nhánh thì thành lớp phủ tô màu, bật/tắt được. Cụ thể:
   - nhân thực mọc ra từ cổ khuẩn Asgard;
   - nấm đứng cạnh động vật;
   - sao biển cùng nhánh với động vật có xương sống;
   - bốn chân mọc từ cá vây thùy;
   - cá voi nằm trong nhóm guốc chẵn.
   Chi tiết: data-spec mục B–E, G.
2. **Hình sinh vật** dùng hình bóng PhyloPic (chỉ CC0/PDM/CC BY, có màn ghi nguồn). Vi khuẩn, cổ khuẩn và phương án dự phòng thì vẽ bằng code. **Không** tạo ~230 ảnh AI.
3. **Thêm nội dung**: node Người (ghim "Bạn ở đây" với avatar của bé), bọ ba thùy, cúc đá, khủng long bạo chúa, voi ma mút, kèm các nhánh cần để đặt chúng cho đúng. Tổng 251 node, 116 ngọn.
4. **Tông tối, phát quang**, khớp với 229 infographic và trang hiện tại.
5. **Công nghệ**: một cảnh R3F 2,5D, dựng lại toàn bộ trên hạ tầng của Tế bào và Hệ Mặt Trời. Trang DOM cũ giữ ở `?view=legacy` và cho máy không có WebGL2, xóa ở GĐ6.

## 2. Hiện trạng (đo 28/09/2026) và mục tiêu

| Hiện tại | Mục tiêu |
| --- | --- |
| "Mở rộng tất cả" tạo dải ~4.600 × 29.600 px. Thu nhỏ hết cỡ vẫn cao ~7 màn laptop. Bấm xong còn ra màn trống. | Cả cây nằm trọn trên **một màn** hình quạt, zoom ngữ nghĩa để xem chi tiết. |
| 232 node DOM, ~6.100 phần tử, 599 path SVG, 1.054 animation CSS chạy cùng lúc. | ≤ 10 draw call, ≤ 60k tam giác, ~10 shader program, 0 animation CSS trong cây, DOM < 300 phần tử. |
| Không có hình. `era` là chữ tự do (41 kiểu). Chỉ ~20 node có số năm. | 116 ngọn có hình bóng. Thời gian thật cho 75 điểm rẽ nhánh; bán kính cành = thời gian. |
| Drill-down làm mờ rồi đổi gốc sau 800 ms. | Bay camera liền mạch, đường dẫn tổ tiên, tìm kiếm, bản đồ nhỏ. |
| Thẻ toàn chữ, không đọc to, infographic bị giấu, màn dọc xoay ảnh 90°. | Thẻ dạng sheet không che cây, có 🔊 (tự đọc cho Lớp 1), infographic mở trong trình xem zoom được. |
| Không có mục tiêu. Cấu trúc cây dạy sai "họ hàng". | Ba trò chơi, sổ tay hạt giống, huy hiệu và ⭐. Cây đúng khoa học. |

## 3. Trải nghiệm

### 3.1 Năm khoảnh khắc "wow" (tiêu chí nghiệm thu của GĐ2 và GĐ4)
1. **Cây mọc** (mở màn ~15 s, chạm để bỏ qua, lần đầu mỗi phiên):
   - một đốm sáng trong vũng nước nguyên thủy vươn thành thân rồi tách nhánh;
   - bầu trời đổi từ màu gỉ sét sang xanh khi có ôxi;
   - kỷ Cambri bùng nổ tia sáng;
   - vành "hôm nay" rực lên, ghim "Bạn ở đây" bật ra.
2. **Dòng dõi**: chạm vào một ngọn thì một dòng sáng vàng chạy từ gốc tới ngọn qua mọi tổ tiên. Phần còn lại của cây mờ đi.
3. **Thiên thạch 66 triệu năm**: màn chớp sáng, sóng xung kích lan dọc vòng 66, cành khủng long và cúc đá hóa đá. Riêng cành Chim lóe vàng: "Chim chính là khủng long!"
4. **Thời gian thật**: bấm nút là cả cây co về sát vành trong 1,2 s. Bé thấy hơn 3 tỷ năm đầu gần như chỉ có vi sinh vật.
5. **Hologram**: trên máy tính, cây nghiêng nhẹ theo chuột. Hạt bụi sáng trôi ở nhiều lớp sâu khác nhau (thị sai), cành đung đưa nhẹ.

### 3.2 Luồng sử dụng
1. **Vào trang**: màn "Đang ươm cây sự sống…" (CSS) trong lúc biên dịch shader, sau đó chạy mở màn.
2. **Khám phá**:
   - kéo, cuộn và véo hai ngón để zoom kiểu bản đồ;
   - xa thì chỉ thấy các giới với biểu tượng lớn, gần thì thấy ngành/lớp, sát thì thấy hình và tên từng ngọn;
   - chạm node: camera bay tới, cành dòng dõi sáng lên, sheet mở ra;
   - chạm chỗ trống: đóng sheet và bỏ tô sáng.
3. **Sheet sinh vật** (mục 7.2). Nút ‹ › duyệt các node anh em; nút "Hành trình về tổ tiên" có ở ngọn.
4. **Thanh công cụ**: 🔎 tìm kiếm · 📚 Nhóm theo SGK · ⏳ Cỗ máy thời gian · 🎮 Thử thách · 📓 Sổ tay · 🏠 xem toàn cây · ± zoom · ⓘ nguồn hình.
5. **Cỗ máy thời gian** (mục 7.4), **Trò chơi** (mục 7.6).

---

## 4. Kiến trúc file

```
src/pages/science/EvolutionTreePage.tsx        viết lại: trạng thái trang + ghép UI + <EvoScene3D/> (giữ tên export)
src/components/evolution/
  legacy/                                      EvolutionNode, EvolutionParticles, NodeDetailModal (chuyển nguyên)
    EvolutionTreeLegacy.tsx                    thân trang cũ, dùng cho ?view=legacy / không có WebGL2
  engine/                                      TS THUẦN, không import react/three, có test
    tree.ts        buildTree, pathToRoot, mrca, isAncestor, siblingsOf, leavesOf
    times.ts       resolveTimes (quy tắc F1: node rẽ nhánh, ngọn, nội suy chuỗi), displayTime(id)
    timeScale.ts   KNOTS, frac/maAtFrac (mix), ERA_BANDS, PERIODS, formatMa, cosmicDate, buildFracLUT
    layout.ts      LAYOUT, SECTOR_WEIGHT, layoutPolar, project, buildRibbon/updateRibbon, tipRadius, subtreeBounds
    lod.ts         LOD, labelPriority, placeLabels
    search.ts      normalizeVi, searchNodes
    games.ts       relativesAnswer, keyStep/keyTruth, journeyStops, pickRound
    *.test.ts
  scene/
    EvoScene3D.tsx      <Canvas> mount MỘT lần, tier, ShaderWarmup, PerformanceMonitor, context-lost, API
    params.ts           ?tier=low|high ?intro=0 ?debug=perf ?fx=0 ?t=<Ma> ?mix=0|1 ?view=legacy
    evoContext.tsx      context: tree, times, polar, projected (ref), stateTex, uniforms dùng chung
    Branches.tsx        1 mesh gộp mọi cành (ShaderMaterial riêng)
    Tips.tsx            ngọn: InstancedMesh quad + atlas
    Knots.tsx           nút rẽ nhánh: InstancedMesh quad
    EraRings.tsx        các vòng đại (1 quad + shader) + vành "hôm nay"
    Backdrop.tsx        nền trời + hạt Points nhiều lớp sâu
    Overlays.tsx        hào quang lớp phủ SGK (vẽ lại ribbon, dày ×6, mờ)
    Symbiosis.tsx       2 cung sáng ty thể / lục lạp (GĐ4)
    fx/                 IntroGrowth, ImpactFx (66 Ma), GreatDyingFx, FrostFx, OxygenSky, BurstFx
    CameraRig.tsx       CameraControls kiểu bản đồ, flyTo/fitAll, nghiêng hologram
    Labels.tsx          nhãn DOM (pool) + nhãn vòng đại + ghim "Bạn ở đây"
    picking.ts          lưới không gian CPU → chọn ngọn/cành
    Effects.tsx         lazy: Bloom + Vignette + ToneMapping Neutral (chép Effects của Tế bào)
    shaders/            branch.glsl.ts, tip.glsl.ts, rings.glsl.ts, particles.glsl.ts, noise.glsl.ts
  ui/
    TopBar.tsx          ← quay lại, đường dẫn tổ tiên (chip), 🔎
    SearchBox.tsx       ô tìm + danh sách kết quả
    NodeSheet.tsx       thẻ sinh vật (sheet phải khi màn ngang / dưới khi màn dọc)
    InfographicViewer.tsx  xem ảnh zoom/kéo, báo khi offline
    TimeMachine.tsx     thanh thời gian + sự kiện + lịch 1 năm + thời gian thật
    OverlayMenu.tsx     📚 chọn lớp phủ + chú giải
    MiniMap.tsx         bản đồ nhỏ (canvas 2D)
    Toolbar.tsx         cụm nút góc phải
    games/RelativesQuiz.tsx, games/MysteryKey.tsx, games/AncestorJourney.tsx
    EvoNotebook.tsx     sổ tay hạt giống + huy hiệu
    CreditsModal.tsx    nguồn hình
    LoadingVeil.tsx, ContextLostVeil.tsx
  notebookStore.ts      localStorage theo hồ sơ (mẫu của cell/notebookStore.ts)
src/data/evolution/
  types.ts (mở rộng), prokaryotes.ts, eukaryotes.ts (mới), protists.ts, plants.ts, fungi.ts, animals.ts,
  times.ts, kid.ts, overlays.ts, events.ts, games.ts, sectors.ts
scripts/build-evo-art.mjs  + scripts/evo-art/{chosen.json, overrides.json, cache/ (gitignore), contact-sheet.png}
public/evolution/          atlas.webp, atlas.json, credits.json, svg/<id>.svg
```

## 5. Engine (thuần, có test)

### 5.1 Kiểu dữ liệu (mở rộng `src/data/evolution/types.ts`)
```ts
export interface GalleryItem { label: string; englishLabel?: string; description?: string; infographicUrl?: string }
export interface EvolutionNode {
  // …các trường cũ giữ nguyên
  grade?: boolean;                               // nhóm gộp, không phải nhánh trọn vẹn (data-spec C4)
  gallery?: { title: string; items: GalleryItem[] };
  youAreHere?: boolean;                          // chỉ 'humans'
}
// times.ts
export type TimeConf = 'cao' | 'tb' | 'thap';
export interface SplitTime { ma: number; lo?: number; hi?: number; conf: TimeConf; show?: string; src: string }
export const SPLIT_TIMES: Record<string, SplitTime>;          // chép từ times.json › splits
export const EXTINCT: Record<string, { endMa: number; firstMa: number; show: string }>;
export const LEAF_FIRST: Record<string, { firstMa: number; show: string }>;
export const CHAIN_NOTES: Record<string, string>;             // data-spec F3
// sectors.ts
export type SectorId = 'bacteria' | 'archaea' | 'protist' | 'fungi' | 'plant' | 'animal' | 'trunk';
export const SECTOR_ROOTS: Record<string, SectorId>;          // data-spec J
export const TRUNK_IDS: ReadonlySet<string>;
export const SECTOR_COLOR: Record<SectorId, string>;
export const SECTOR_WEIGHT: Record<Exclude<SectorId, 'trunk'>, number>;
```

### 5.2 `tree.ts`
```ts
export interface FlatNode { i: number; id: string; data: EvolutionNode; parent: number; children: number[];
  depth: number; leafCount: number; sector: SectorId; isLeaf: boolean; extinct: boolean }
export interface EvoTree { nodes: FlatNode[]; byId: Map<string, number>; leaves: number[] } // DFS, gốc = 0
export function buildTree(root: EvolutionNode): EvoTree;
export function pathToRoot(t: EvoTree, i: number): number[];       // [i, cha, …, 0]
export function mrca(t: EvoTree, a: number, b: number): number;
export function isAncestor(t: EvoTree, anc: number, desc: number): boolean; // anc === desc → true
export function siblingsOf(t: EvoTree, i: number): number[];
export function leavesOf(t: EvoTree, i: number): number[];
```
Sector của node: node thuộc `TRUNK_IDS` là `'trunk'`. Các node khác đi ngược lên tổ tiên, gặp `SECTOR_ROOTS` đầu tiên thì lấy sector đó. Lưu ý: cây con `eukarya` nằm trong `archaea` nhưng mỗi phần có sector gốc riêng, còn `eukarya` là trunk.

### 5.3 `times.ts` và `timeScale.ts`
```ts
export const EARTH_MA = 4540;
export const KNOTS = [[4540,0],[4000,0.07],[2500,0.2],[538.8,0.42],[251.9,0.66],[66,0.84],[23,0.93],[0,1]] as const;
export function fracEras(ma: number): number;            // tuyến tính từng đoạn, kẹp [0,1]
export const fracLinear = (ma: number) => 1 - ma / EARTH_MA;
export function frac(ma: number, mix: number): number;   // (1-mix)*fracEras + mix*fracLinear
export function maAtFrac(f: number, mix: number): number; // mix 0 hoặc 1: công thức đóng; còn lại: chia đôi 40 vòng
export function buildFracLUT(mix: number, size = 2048): Float32Array; // f → ma, cho shader vòng đại
export const ERA_BANDS: { name: string; fromMa: number; toMa: number; color: string }[]; // data-spec F4
export const PERIODS: { name: string; fromMa: number; toMa: number }[];
export function periodName(ma: number): string;
export function formatMa(ma: number): string;            // data-spec F2
export function cosmicDate(ma: number): { day: number; month: number; hh: number; mm: number; text: string };
// times.ts
export interface NodeTimes { ma: Float64Array; endMa: Float64Array; approx: Uint8Array }
export function resolveTimes(t: EvoTree): NodeTimes;     // quy tắc F1; tham chiếu hàm assign trong prototype
export function displayTime(t: EvoTree, times: NodeTimes, i: number): string; // show > formatMa > "Rất xa xưa…"
```
- `cosmicDate`: ngày thứ `d = (1 − ma/4540)·365` kể từ 1/1 00:00, năm không nhuận.
- Test bắt buộc: 66 → "26/12 lúc 16:39", 0,3 → "31/12 lúc 23:25", 4540 → "1/1 lúc 00:00".

### 5.4 `layout.ts` (khớp `prototype-layout.mjs`)
```ts
export const LAYOUT = {
  R: 1000, SPAN_START: Math.PI + 0.035, SPAN_END: -0.035, SECTOR_GAP: 0.6 * Math.PI / 180,
  SAMPLES: 32, BEND: 0.45,          // góc đổi hết trong 45% đầu cành (smoothstep)
  W0: 1.2, W1: 2.2, TAPER: 1.15,    // nửa độ dày = W0 + W1·√leafCount; gốc cành dày hơn ×TAPER
  TIP_FRAC: 0.42, TIP_MAX: 22,      // bán kính ngọn = min(TIP_MAX, TIP_FRAC · R · góc-của-ngọn)
  ORGANIC: 0.006,                   // độ cong nhẹ (rad) cho cành dài > 150 đơn vị: A·sin(πs)·sin(9s+φ)
} as const;
export interface BranchPolar { node: number; theta: Float32Array; ma: Float32Array; w0: number; w1: number; dist0: number }
export interface PolarLayout { theta: Float32Array; leafSpan: Float32Array; branches: BranchPolar[] }
export function layoutPolar(t: EvoTree, times: NodeTimes): PolarLayout;
export type Orientation = 'landscape' | 'portrait';
export interface Projected { nodeXY: Float32Array; nodeFrac: Float32Array; samplesXY: Float32Array; samplesFrac: Float32Array }
export function project(p: PolarLayout, times: NodeTimes, mix: number, o: Orientation, out?: Projected): Projected;
export interface RibbonBuffers { position: Float32Array; side: Float32Array; s: Float32Array; frac: Float32Array;
  dist: Float32Array; branch: Float32Array; color: Float32Array; index: Uint32Array }
export function buildRibbon(t: EvoTree, p: PolarLayout, pr: Projected): RibbonBuffers;
export function updateRibbon(buf: RibbonBuffers, p: PolarLayout, pr: Projected): void; // chỉ position + frac
export function subtreeBounds(t: EvoTree, pr: Projected, i: number): [minX: number, minY: number, maxX: number, maxY: number];
```
- **Góc**: ngọn trải từ `SPAN_START` về `SPAN_END` theo thứ tự DFS. Mỗi ngọn chiếm góc tỉ lệ `SECTOR_WEIGHT`, chèn `SECTOR_GAP` khi đổi sector. Node trong có góc = trung điểm góc nhỏ nhất và lớn nhất của các con.
- **Mẫu cành** `k = 0..SAMPLES`, `s = k/SAMPLES`:
  - `θ(s) = θcha + (θcon − θcha)·smoothstep(min(1, s/BEND))`;
  - bán kính chuẩn hóa `f(s)` chạy tuyến tính từ `fracEras(ma_cha)` tới `fracEras(ma_con_end)`;
  - lưu `ma(s) = maAtFrac(f(s), 0)`.
  - Ở `mix` bất kỳ, `project` dùng `r = R·frac(ma(s), mix)`.
  - Mốc cuối: node trong dùng `ma` của nó, ngọn dùng `endMa` (0 hoặc lúc tuyệt chủng).
- **Ribbon**: mỗi mẫu 2 đỉnh ± pháp tuyến. Pháp tuyến tính từ sai phân của các mẫu kề nhau. Độ dày `lerp(w·TAPER, w, s)`. `dist` là quãng cộng dồn từ gốc (tính ở mix 0, giữ cố định).
- **Hướng**: cây LUÔN mọc từ dưới lên (gốc ở giữa đáy, quạt mở lên trên). Portrait giãn chiều đứng: `(x, y) → (x, 1,7·y)` (`PORTRAIT_STRETCH`) thành vòm elip lấp đầy màn cao — theo góp ý của người dùng 28/09 (bản xoay −90° bị bỏ vì cây nằm ngang).
- Morph "Thời gian thật" chạy mỗi frame trong 1,2 s: `project` + `updateRibbon` trên ~16k đỉnh (dưới 2 ms).
- **Test**:
  - mọi ngọn nằm ở `r = R·frac(endMa)`;
  - bán kính con ≥ cha;
  - hai ngọn liền nhau cách nhau ≥ 21 đơn vị;
  - thứ tự sector từ trái sang phải: bacteria, archaea, protist(amoebozoa), fungi, animal, plant, protist(sar), protist(flagellates);
  - portrait = landscape giãn chiều đứng ×1,7;
  - `project(mix=1)` cho ngọn còn sống ở `r = R`.

### 5.5 `lod.ts`
```ts
export const LOD = { DOT_PX: 5, ICON_PX: 14, NAME_PX: 26, BUDGET: { wide: 36, mid: 24, narrow: 16 } } as const;
// wide ≥ 1024 px, mid 640–1023, narrow < 640
export function labelPriority(n: FlatNode, ctx: { selected: number | null; youAreHere: number }): number;
//   đang chọn 200 · Người 95 · gốc sector + eukarya/plantae_simple/land_plants 100
//   node trong có leafCount ≥ 10: 60 + log2(leafCount) · node trong khác: 40 − depth/2 · ngọn: 20
//   ngọn chỉ được làm ứng viên khi bán kính ngọn trên màn ≥ NAME_PX/2 ; node approx −15
export interface LabelCand { i: number; x: number; y: number; w: number; h: number; prio: number }
export function placeLabels(c: LabelCand[], budget: number, vw: number, vh: number): { i: number; x: number; y: number; side: 'r' | 'l' | 't' | 'b' }[];
//   tham lam theo prio giảm dần; thử đặt phải → trái → trên → dưới; đệm 4 px; ngoài khung thì bỏ
```

### 5.6 `search.ts`
- `normalizeVi(s)`: NFD, bỏ dấu (`\p{M}`), đổi `đ→d`, chữ thường, gộp khoảng trắng.
- `searchNodes(t, q, limit = 8)`: tìm trong `label`, `englishLabel`, `KID[id].aliases`.
  - Điểm: trùng khớp 100 > đầu chuỗi 80 > đầu một từ 60 > chứa chuỗi 40.
  - Hòa điểm thì node nông hơn đứng trước.
- Test: "ca map" → cartilaginous_fish; "khung long" → dinosaurs đứng đầu; "nguoi" → humans; "E. coli" → ecoli_example.

### 5.7 `games.ts`
- `relativesAnswer(t, q)` trả id có `mrca` với `q.a` sâu hơn.
  - Test cả 22 câu ở data-spec L1: đáp án khớp, không câu nào hòa, không dùng node `grade` hoặc approx.
- `keyTruth(t, q, targetId)` = `isAncestor(q.truth, target)`. `keyStep(qid, yes)` trả `{q}` hoặc `{result}`.
  - Test: đi theo khóa với cả 18 bí ẩn đều tới đúng kết quả.
- `journeyStops(t, leafId)`: tổ tiên ∩ `JOURNEY_STOPS`, theo thứ tự từ ngọn về gốc.
- `pickRound(bank, n, seed)`: bốc ngẫu nhiên có seed. RNG nằm ngoài component.

---

## 6. Cảnh R3F

### 6.1 `EvoScene3D.tsx` (chép khung của `cell/scene3d/CellScene3D.tsx`)
- `<Canvas>`:
  - `dpr` = high ? `[1, 1.75]` : `1`;
  - `frameloop` = `!ready || paused ? 'never' : 'always'`;
  - `camera` = `{ fov: 30, near: 1, far: 8000 }`;
  - `gl` = `{ antialias: true, powerPreference: 'high-performance', stencil: false }`;
  - `style` = `{ touchAction: 'none' }`.
- `onCreated`:
  - high: `gl.toneMapping = NoToneMapping`, low: `NeutralToneMapping`. Đặt **ngay tại đây**, không qua prop `gl`;
  - `gl.setClearColor('#04070f')`;
  - bắt sự kiện `webglcontextlost` → `onContextLost()`;
  - khi DEV: `window.__evoR3F = state`.
- `ShaderWarmup` giống Tế bào: `gl.compileAsync(scene, camera)` sau 2 frame. Khóa warm = `${tier}`. Trong lúc chưa xong thì trang hiện `LoadingVeil`. Atlas phải tải xong trước lượt biên dịch (Suspense).
- **`<Suspense>` bọc nội dung có tải texture** (bẫy Xưởng hành tinh).
- Tier: `FORCED_TIER ?? 'high'`. Nếu tụt fps thì `PerformanceMonitor onDecline → 'low'`. Monitor chỉ bật khi đã `ready` **và** trang đang hiển thị ≥ 4 s. Không bao giờ tự nâng tier lại.
- Không có WebGL2 (`!canvas.getContext('webgl2')`) hoặc có `?view=legacy` thì render `EvolutionTreeLegacy`.

**Ngân sách theo tier**
| | high | low |
| --- | --- | --- |
| dpr | 1–1,75 | 1 |
| Hậu kỳ | Bloom + Vignette + ToneMapping (lazy) | không (renderer Neutral) |
| Hạt nền | 1.600 | 500 |
| Cành | vỏ cây + nhựa sống + gió | màu + khối trụ, không noise, không nhựa |
| Ngọn | cầu giả khối + khúc xạ nhẹ | hình phẳng + viền sáng |
| Hologram | có (desktop) | không |
Toàn cảnh: ≤ 10 draw call **cho các vật thể trong cảnh** (không tính các pass của EffectComposer: bloom mipmap tự thêm ~12 pass), ≤ 60k tam giác, ~10 program. Đo bằng `?debug=perf` (tái dùng `solar/scene3d/PerfOverlay`). Muốn đếm riêng cảnh thì chạy thêm `?fx=0`.

### 6.2 `Branches.tsx`
- **Một** `THREE.Mesh`: BufferGeometry từ `buildRibbon`, `ShaderMaterial` với `transparent: true, depthWrite: false, depthTest: false`, `renderOrder = 10`.
- Attribute: `position, aSide(±1), aS, aFrac, aDist, aBranch, aColor` (màu sector sáng lên, lerp từ màu cha sang màu con theo `aS`).
- Uniform: `uTime, uNowFrac (1 = hôm nay), uFrontOn, uTier, uState (DataTexture RGBA8, rộng = số cành: R = độ phủ sáng dòng dõi 0..1, G = mờ, B = hóa đá, A = nhấp nháy)`.
- Fragment (giả mã):
```glsl
if (vFrac > uNowFrac + 0.0005) discard;                       // "tương lai" khi dùng cỗ máy thời gian
vec4 st = texelFetch(uState, ivec2(int(vBranch + 0.5), 0), 0);
float side = abs(vSide), aa = fwidth(vSide) * 1.5;
float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, side);           // khử răng cưa mép
float shade = sqrt(max(0.0, 1.0 - side * side));               // giả khối trụ
vec3 col = vColor * (0.35 + 0.75 * shade);
if (uTier > 0.5) {
  col *= 0.85 + 0.3 * vnoise(vec2(vDist * 0.08, vSide * 2.0));  // vỏ cây
  float p = fract((vDist - uTime * 60.0) / 140.0);              // nhựa sống chạy từ gốc ra ngọn
  col += vColor * smoothstep(0.0, 0.06, p) * (1.0 - smoothstep(0.06, 0.2, p)) * pow(shade, 3.0) * 0.9 * (1.0 - st.b);
}
col += vec3(1.0, 0.9, 0.7) * smoothstep(0.012, 0.0, abs(vFrac - uNowFrac)) * uFrontOn;   // mặt trước thời gian
vec3 stone = vec3(0.62, 0.64, 0.68) * (0.6 + 0.4 * shade) * (0.8 + 0.2 * step(0.93, vnoise(vec2(vDist * 0.3, vSide * 4.0))));
col = mix(col, stone, st.b);                                   // hóa đá
col = mix(col, vec3(1.0, 0.9, 0.55) * (0.6 + 0.8 * shade), st.r > vS ? 0.85 : 0.0); // dòng dõi phủ dần theo vS
col += vec3(1.0) * st.a * 0.5 * shade;                         // nhấp nháy
col *= 1.0 - 0.72 * st.g; alpha *= 1.0 - 0.45 * st.g;           // mờ
gl_FragColor = vec4(col, alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
```
- Vertex (tier cao) có gió: `pos += normal * sin(uTime*1.3 + aDist*0.01) * 0.6 * smoothstep(0.75, 1.0, aFrac)`. Pháp tuyến truyền qua attribute hoặc tính lại từ `aSide`.
- Giữ độ sáng ≤ ~1,2. Emissive > 1 cộng Neutral sẽ làm màu nhạt phấn (bẫy Hệ Mặt Trời). Để bloom (ngưỡng 0,8) lo phần lóe sáng.

### 6.3 `Tips.tsx` và `Knots.tsx`
- **Tips**: `InstancedMesh(PlaneGeometry(2,2))`, 116 instance. Attribute instance:
  - `iOffset(vec3)` (CPU ghi, xem "vị trí ngọn" bên dưới), `iSize, iColor(vec3), iIcon (chỉ số atlas, −1 = không có), iAspect`;
  - `iKind`: 0 cầu, 1 lá, 2 nấm/bào tử, 3 bong bóng, 4 hóa thạch;
  - `iPhase, iNode, iBornFrac`.
  - Gán `iKind` theo sector: động vật 0; thực vật 1 cho hậu duệ `land_plants`, 3 cho tảo; nấm 2 (mũ nấm cho `basidiomycota_simple`, bào tử cho số còn lại); protist, vi khuẩn, cổ khuẩn 3; đã tuyệt chủng thì luôn 4.
- Fragment cầu (giả mã):
  - `r2 = dot(uv,uv)`, bỏ nếu > 1 (khử răng cưa bằng `fwidth`);
  - `n = vec3(uv, sqrt(1 − r2))`, `fres = pow(1 − n.z, 2.5)`;
  - màu nền = `iColor·0.22`;
  - hình bóng: `texture(atlas, uvIcon(uv·0.8 + n.xy·0.05)).a` màu ngà `#fff7e6`, độ hiện `iconVis = smoothstep(ICON_PX−4, ICON_PX+4, iSize·uPxPerUnit·2)`;
  - cộng viền `iColor·fres·1.1` và điểm sáng specular mũ 40.
- Các kiểu khác:
  - lá: hình vesica (giao của 2 đường tròn lệch ngang, xoay 45°) + gân giữa;
  - nấm: nửa elip trên (mũ) + chân;
  - bong bóng: viền mảnh ở r ≈ 0,9 + lõi mờ, glyph lắc nhẹ;
  - hóa thạch: đĩa đá có noise, hình bóng khắc chìm (tối hơn, lệch 1 px để nổi khối).
- Thở: `scale 1 + 0.03·sin(uTime·1.7 + iPhase)`.
- **Vị trí ngọn**:
  - bình thường: đặt ở mẫu cuối của cành;
  - khi cỗ máy thời gian chạy, CPU tính lại mỗi khi `uNow` đổi: vị trí = điểm trên polyline của cành tại `f = min(fEnd, uNowFrac)` (tìm nhị phân trên các mẫu, nội suy) rồi ghi vào `iOffset`. 116 lần tìm mỗi frame, rẻ. Nhờ vậy sinh vật "cưỡi" trên mặt trước thời gian và bé thấy được **ai đang sống vào lúc đó**;
  - cành chưa "sinh" (`fStart = frac` của cha > `uNowFrac`) thì `iBornFrac > uNowFrac`, ẩn bằng `scale = 0`.
- **Người**: vòng vàng nhấp nháy. Ghim DOM ở `Labels.tsx`: `getAvatarById(currentStudent.currentAvatarId)` từ `services/avatarService`, có `isEmoji` thì hiện chữ, không thì `<img>`.
- **Knots**: InstancedMesh quad, 135 node trong, bán kính `2 + 0.8·√leafCount`. Node approx chỉ bằng 60% kích thước và mờ hơn. Node đang chọn có vòng xung.

### 6.4 `EraRings.tsx`
- Một quad phủ hộp bao của quạt ×1,15.
- Fragment:
  - đổi điểm thế giới → tọa độ cực chuẩn (bỏ xoay portrait qua `uOrient`);
  - ngoài dải góc thì chỉ vẽ nền rất mờ;
  - `ma = texture(uFracLUT, vec2(r / R, 0.5)).r`. LUT là `DataTexture(Float32Array(2048), RedFormat, FloatType, NearestFilter)`, tạo lại **mỗi frame chỉ khi đang morph**;
  - màu dải = `ERA_BANDS`, vân "vòng gỗ" mờ `sin(r·0.35)`;
  - đường ranh các đại sáng hơn, **vòng 66 Ma màu đỏ** #f87171;
  - vành "hôm nay" (r ≥ R) có quầng ấm như bình minh;
  - khi cỗ máy chạy, phần có `ma < uNow` bị ẩn.
- Tên vòng (DOM, trong `Labels.tsx`) đặt dọc mép trái của quạt ở giữa mỗi dải.

### 6.5 `Backdrop.tsx`
- Mặt phẳng trời ở z = −400: gradient, sáng ở tâm đáy.
  - `uSkyTint`: trước 2400 Ma màu gỉ sét #3a1e14, sau 2000 Ma xanh đêm #0a1428, nội suy ở giữa;
  - `uFrost` (Trái Đất quả cầu tuyết) phủ noise trắng lên nền và vòng.
- Hạt `Points`: rải trong dải quạt, z ∈ [−120, 40] để có thị sai, cỡ 1,5–4 px, màu theo dải đại (lấy từ LUT). Trôi chậm và lấp lánh trong vertex shader.

### 6.6 `CameraRig.tsx`
```ts
import CameraControlsImpl from 'camera-controls';   // v3.1.2, drei đã kéo vào; thêm vào dependencies của package.json
const A = CameraControlsImpl.ACTION;
c.mouseButtons.left = A.TRUCK; c.mouseButtons.right = A.TRUCK; c.mouseButtons.wheel = A.DOLLY; c.mouseButtons.middle = A.NONE;
c.touches.one = A.TOUCH_TRUCK; c.touches.two = A.TOUCH_DOLLY_TRUCK; c.touches.three = A.NONE;
c.dollyToCursor = true; c.azimuthRotateSpeed = 0; c.polarRotateSpeed = 0;
c.minDistance = 25; c.maxDistance = fitDistance * 1.25; c.smoothTime = 0.35; c.draggingSmoothTime = 0.12;
c.setBoundary(new THREE.Box3(fanMin, fanMax));      // hộp bao quạt + 10%; boundaryEnclosesCamera = false
```
- `fitDistance`: khoảng cách để hộp bao quạt (landscape 2R×R, portrait R×2R) vừa khung, fov 30, cộng lề 8%.
- `flyTo(id)`:
  - `fitToBox(subtreeBounds ∪ vị trí node, true, padding)`;
  - padding chừa chỗ sheet: phải 400 px khi màn ngang ≥ 1024, dưới 46% chiều cao khi màn dọc;
  - `playWhoosh()`.
  - Nhớ quy ước `setFocalOffset`: Y dương đẩy mục tiêu LÊN, X dương đẩy sang TRÁI.
- Hologram (desktop, tier cao, không có reduced-motion): **xoay group chứa cây**, không xoay camera. `rotation.x/y` tối đa 0,03/0,04 rad theo chuột, giảm chấn. Trên máy cảm ứng chỉ lắc nhẹ khi đứng yên.

### 6.7 `picking.ts`
- Lưới đều trên thế giới, ô = 2% R, chứa điểm ngọn, knot và các mẫu cành.
- Con trỏ → tia → **đổi tia sang hệ tọa độ local của group cây** (vì group có thể đang nghiêng hologram) → giao mặt z = 0 → tìm gần nhất trong bán kính màn hình `max(22 px, bán kính ngọn trên màn)`. Thứ tự ưu tiên: ngọn > knot > cành. Cành trả về node con của cành đó.
- Phân biệt chạm với kéo bằng `shared/sceneClickGuard.ts`.
- **Không raycast mesh**, và không dùng `onPointerMissed` cho chọn node.

### 6.8 `Labels.tsx`
- Pool 48 phần tử DOM (tối đa 36 nhãn node + 6 nhãn vòng đại + ghim "Bạn ở đây" + dự phòng), đặt tuyệt đối trên canvas, **cập nhật vị trí qua ref trong `useFrame`**.
- Tập nhãn hiển thị tính lại ≤ 4 lần/giây bằng `placeLabels`. `setState` chỉ khi tập đó đổi.
- Chữ dùng font Nunito (`public/hub/fonts`, có bộ chữ Việt), nền pill mờ, hai hàng: tên + tên khoa học nhỏ (chỉ khi zoom gần).

### 6.9 Hiệu ứng (`fx/`)
| fx | Kích hoạt | Làm gì |
| --- | --- | --- |
| IntroGrowth | vào trang lần đầu mỗi phiên (`sessionStorage.evoIntroSeen`), trừ khi `?intro=0` hoặc reduced-motion | 0–1,2 s: vũng sáng dần. 1,2–13,2 s: `uNowFrac` 0→1 **tuyến tính theo bán kính** (easeInOut), camera lùi từ 12% `fitDistance` ra `fitDistance`, đọc chú thích sự kiện (mục I data-spec). 13,2–15 s: vành sáng, ghim "Bạn ở đây". Chạm = nhảy tới cuối trong 0,4 s. |
| ImpactFx | `uNow` đi xuống qua 66 (lúc chạy hoặc kéo), hoặc trong mở màn | Quad chớp cộng màu (alpha 0→0,8→0 trong 0,6 s). Cung sóng xung kích sáng chạy dọc vòng 66 trong 1,2 s. Rung camera 0,4 s (bỏ nếu reduced-motion). `st.b` của trex/ornithischia/sauropods/ammonites 0→1 trong 1,2 s. Cành `birds` nhấp nháy vàng + thẻ "Chim chính là khủng long!". Gọi `playImpact()`. |
| GreatDyingFx | qua 251,9 | Nền đỏ tối trong 1 s. Trilobites hóa đá. |
| FrostFx | `uNow` trong [635, 717] | `uFrost` tăng/giảm dần ở hai mép khoảng. |
| OxygenSky | `uNow` trong [2000, 2400] | Nội suy `uSkyTint`. |
| BurstFx | qua 538,8 | Tia sáng bắn từ các knot có `ma` trong [500, 545]. |
| Symbiosis | qua 1800/1600, hoặc nút trong thẻ eukarya/archaeplastida | Cung Bezier bậc 2 nét đứt phát sáng, chạy từ `from` tới `to` + chip nhãn (data-spec H). |
Mỗi sự kiện chỉ chạy **một lần mỗi lượt đi qua** (lưu trạng thái đã qua theo chiều thời gian).

---

## 7. Giao diện

### 7.1 Bố cục
- **Ngang**:
  - TopBar ở trên;
  - Toolbar dọc ở góc phải dưới;
  - MiniMap 160×90 ở trái dưới (khi rộng ≥ 900 px);
  - TimeMachine là nút viên thuốc ở giữa đáy;
  - sheet rộng 400 px bên phải.
- **Dọc**:
  - quạt giãn chiều đứng (vẫn mọc lên);
  - Toolbar ngang ở đáy;
  - sheet từ dưới lên, cao 46%, kéo lên được tới 85%;
  - không có MiniMap.
- `compact` khi < 640 px: rút gọn TopBar.

### 7.2 `NodeSheet.tsx` (thứ tự khối)
1. Hình lớn (`public/evolution/svg/<id>.svg`), tên, tên khoa học, chip bậc phân loại:
   - root: Gốc · domain: Lãnh giới · kingdom: Giới · phylum: Ngành · class: Lớp · order: Bộ · family: Họ · genus: Chi · species: Loài · clade: Nhánh · branch: Nhóm · superorder: Liên bộ · suborder: Phân bộ;
   - kèm thang KHTN 6 "Giới → Ngành → Lớp → Bộ → Họ → Chi → Loài", tô bậc hiện tại.
2. Chip thời gian `displayTime`. Thanh "thời gian thật" tuyến tính 4,54 tỷ năm → nay có chấm vị trí. Node tuyệt chủng có huy hiệu xám "Đã tuyệt chủng · {show}".
3. `KID[id].line` + `SpeakButton`. `autoPlay` khi Lớp ≤ 1 (giống Tế bào).
4. `traits` dạng chip. `grade` → khối ghi chú vàng nhạt "Nhóm gộp:" + ghi chú.
5. Họ hàng gần nhất (`siblingsOf`, chip bấm được) · "N nhóm con".
6. `gallery` (nếu có) dạng lưới thẻ nhỏ, bấm mở infographic.
7. Infographic: ảnh thu nhỏ lười tải qua `getInfographicUrl` (giữ cách đổi .png → .jpeg khi lỗi) → mở `InfographicViewer`. Offline hoặc lỗi thì hiện "Cần mạng để xem ảnh này".
8. "Theo SGK, nhóm này thuộc: …" (các lớp phủ chứa node).
9. Liên kết sang Tế bào: sector vi khuẩn → `/science/cell-biology?cell=bacteria`, thực vật (land_plants) → `?cell=plant`, động vật → `?cell=animal`.
10. Nút: ‹ › anh em · "Hành trình về tổ tiên" (chỉ ở ngọn) · ✕.

`markSeen(id)` khi sheet đã mở ≥ 1,2 s.

### 7.3 Tìm kiếm, đường dẫn, bản đồ nhỏ, lớp phủ
- **SearchBox**: tối đa 8 kết quả (hình + tên + gợi ý đường dẫn 2 cấp). Enter hoặc chạm → `flyTo` + chọn.
- **Đường dẫn**: chip từ gốc tới node đang chọn. Dài hơn 4 chip thì hiện "🌳 › … › 3 tổ tiên gần nhất › node". Chạm chip → bay tới.
- **MiniMap**: canvas 2D vẽ sẵn một lần các polyline 1 px theo màu sector, khung nhìn cập nhật 10 Hz. Chạm hoặc kéo để dời camera.
- **OverlayMenu**: danh sách lớp phủ.
  - Chọn một nhóm: `setOverlay(id)` → hào quang màu nhóm quanh các cây con thành viên, phần khác mờ đi.
  - Thẻ chú giải: description · "Vì sao đây không phải một nhánh?" (`why`) · infographic (nếu có).
  - `system` (3 lãnh giới, 5 giới) thì tô nhiều màu, chú giải từng phần.

### 7.4 `TimeMachine.tsx`
- Bấm nút viên thuốc để mở. Thanh trượt tô màu theo `ERA_BANDS`, **vị trí trên thanh = `frac(ma, mix)`** nên khớp với bán kính cây. Có biểu tượng sự kiện phía trên.
- Nhãn núm: `formatMa`, hoặc `cosmicDate(ma).text` khi bật "📅 Lịch 1 năm".
- Nút:
  - ▶/⏸: chạy tới hôm nay trong 30 s, tốc độ đều theo bán kính;
  - ⏮: về 4,54 tỷ năm;
  - "📏 Thời gian thật": gọi `setScaleMix`;
  - ✕: quét về 0 trong 1,5 s rồi đóng.
- Vị trí núm cập nhật bằng rAF đọc `api.getNow()`, **không setState theo frame**.
- Khi đang chạy, node chưa sinh không chạm được.

### 7.5 Sổ tay và huy hiệu (`notebookStore.ts`, `EvoNotebook.tsx`)
- Key `evo_notebook_v1_${studentId ?? 'guest'}` → `{ seen: string[]; keySolved: string[]; journeys: string[] }`.
- Huy hiệu (`StudentProfile.evoBadges?: string[]`, thêm vào `types.ts` cạnh `cellBadges`), mỗi huy hiệu **+10 ⭐** qua `updateStudent`:
  - `bacteria`: đã xem 10 ngọn trong sector;
  - `archaea`: 7 ngọn;
  - `protist`: 8;
  - `plant`: 8;
  - `fungi`: 8;
  - `animal`: 20;
  - `relatives`: đúng ≥ 6/8 trong một lượt;
  - `key`: giải 6 bí ẩn;
  - `journey`: đi hết một hành trình.
- Mỗi huy hiệu chỉ trao một lần. Mẫu code: `CellBiologyPage.tsx` (khối `onAward`).

### 7.6 Trò chơi
- **Ai là họ hàng gần nhất?** Thẻ trên cùng: "Họ hàng gần nhất của **A** là ai?" và hai thẻ lựa chọn (hình + tên).
  - Chọn xong, camera `fitToBox` bao 3 ngọn, tô dòng dõi từ A tới `mrca` đúng (vàng) và tới `mrca` sai (xám).
  - Hiện "Tổ tiên chung sống {displayTime(mrca)}" + chuyện thú vị, đọc to.
  - Một lượt 8 câu. Đúng thì `playSuccess()`.
- **Đoán xem tớ là ai?** Hình bóng tối của bí ẩn và câu "Tớ là ai?". Thẻ câu hỏi có nút Có/Không.
  - Mỗi câu trả lời: camera bay tới `flyYes` hoặc `flyNo` (null thì đứng yên) và tô sáng.
  - Sai thì nhắc nhẹ rồi cho chọn lại.
  - Tới kết quả thì lật hình sáng lên + đọc tên.
- **Hành trình về tổ tiên**: đi từ ngọn qua `journeyStops`, mỗi chặng 2,2 s, dòng sáng chạy vào phía gốc, đọc câu `JOURNEY`.
  - Tới LUCA thì lùi toàn cảnh: "Mọi sinh vật đều là họ hàng!"
  - Có nút Tiếp / Dừng.
  - Gợi ý sẵn: Người, Chim sẻ, Cá mập, Nấm mỡ, Cây lúa, E. coli.

### 7.7 Chữ giao diện (tiếng Việt, dùng nguyên văn)
- Màn chờ: "Đang ươm cây sự sống…"
- Nút mở màn: "Chạm để bỏ qua"
- Chú thích góc: "Kéo để di chuyển · Véo hoặc cuộn để phóng to · Chạm vào sinh vật để xem"
- Nút toàn cảnh: "Cả cây sự sống"
- Nút cỗ máy: "⏳ Cỗ máy thời gian". Nhãn núm khi ở 0: "Hôm nay"
- Nút "📏 Thời gian thật", chú thích bật: "Thời gian đúng tỉ lệ: hơn 3 tỷ năm đầu gần như chỉ có vi sinh vật!"
- Lớp phủ: "📚 Nhóm theo SGK"
- Ghim: "Bạn ở đây"
- Nguồn hình: "Hình bóng sinh vật: PhyloPic (CC0 · CC BY). Vi sinh vật vẽ bằng code. Xem nguồn"

---

## 8. Tích hợp với app

- **Route**: `App.tsx` giữ lazy import `EvolutionTreePage`. `/science/evolution` không đổi. Test `hub/catalog.test.ts` phải xanh.
- **Hồ sơ**: `useStudent()`, `useStudentActions().updateStudent` (`@/src/contexts/StudentContext`). `Grade` lấy từ `@/types`.
- **Giọng đọc**:
  - `speak(text, { lang: 'vi-VN', rate: 0.92 })` và `cancelSpeech()` từ `@/src/utils/speech`, hủy khi đóng sheet hoặc rời trang;
  - nút đọc dùng `SpeakButton` (`src/components/shared/SpeakButton.tsx`).
- **Âm thanh**:
  - `playBlip` khi chọn, `playWhoosh` khi bay, `playSuccess` khi đúng (từ `src/components/solar/sfx.ts`, đã tự kiểm `soundEnabled`);
  - **thêm `playImpact()`** vào sfx.ts: tiếng ồn qua lọc thông thấp + sóng sin 45→30 Hz trong 1,2 s;
  - nhạc nền tự vào track SCIENCE vì route có chữ 'science'.
- **Liên kết Tế bào**: sửa nhỏ `CellBiologyPage.tsx`. Đọc `new URLSearchParams(location.search).get('cell')` ∈ {animal, plant, bacteria} → chọn sẵn mẫu, bỏ qua phòng thí nghiệm.
- **Tài sản runtime**: đi qua `import.meta.env.BASE_URL` (deploy tại `/Genius-kids/`). `public/evolution/*` tự vào manifest PWA (webp/json/svg nằm trong `globPatterns`), tải theo gói "nội dung offline". Infographic trên Supabase chỉ xem được khi online.
- **Ghi nguồn**: chân sheet luôn có dòng nguồn hình ở mục 7.7. `CreditsModal` liệt kê `credits.json`, nhóm theo giấy phép. CC BY phải có tác giả + link giấy phép + ghi "đã đổi màu, tô sáng".
- **Dev**: `window.__evoR3F`, `window.__evoApi`. URL `?tier= ?intro=0 ?debug=perf ?fx=0 ?t=66 ?mix=1 ?view=legacy`.

## 9. Bẫy đã biết (checklist trước khi báo xong GĐ1, GĐ2, GĐ4)

1. **Biên dịch shader là nút thắt lớn nhất trên ANGLE/D3D11.** Luôn `compileAsync` với `frameloop='never'` tới khi xong. Giữ ~10 program. Không vòng lặp động trong GLSL. **Không dùng N8AO, không DOF.**
2. Material nào sẽ mờ dần thì phải `transparent` từ đầu. Đổi opaque ↔ transparent là biên dịch lại.
3. Tone mapping:
   - tier cao: renderer `NoToneMapping` (đặt trong `onCreated`) + `<ToneMapping mode={8}>` cuối EffectComposer;
   - tier thấp: renderer Neutral;
   - ShaderMaterial phải có `#include <tonemapping_fragment>` và `<colorspace_fragment>`.
4. Emissive > 1 cộng Neutral làm màu nhạt phấn. Giữ sáng ≤ ~1,2, để bloom lo phần lóe.
5. `<Suspense>` bên trong Canvas quanh mọi thứ có tải texture, nếu không cả cảnh trắng xóa.
6. Canvas **mount một lần**. Đổi chế độ (cỗ máy, trò chơi, lớp phủ) chỉ đổi uniform/state, không remount. Có `ContextLostVeil` ("Chạm để tải lại").
7. Không setState theo frame. Mọi chuyển động qua ref/uniform trong `useFrame`. Nhãn chỉ setState khi tập nhãn đổi (≤ 4 Hz).
8. `PerformanceMonitor` chỉ đo khi trang hiển thị và đã ổn định ≥ 4 s. Trang bị che thì trình duyệt bóp fps xuống, dễ hạ tier oan.
9. Đo fps trong browser pane không tin được. Ngày 28/09 pane báo `visibilityState = 'visible'` mà trang gần trống vẫn chỉ 1–2 khung/giây. Luôn đo đối chứng một trang nhẹ trước. Số thật lấy trên máy người dùng.
10. `setFocalOffset`: Y dương đẩy mục tiêu LÊN, X dương đẩy sang TRÁI.
11. Keyframe CSS dùng `transform` sẽ đè `-translate-x-1/2` của Tailwind. Dùng thuộc tính `translate`/`scale` riêng.
12. Gesture trên div bọc canvas **không `setPointerCapture`**, nếu không sẽ mất click của R3F.
13. Test trong pane:
    - cần hồ sơ học sinh; chọn hồ sơ là state trong bộ nhớ nên sau khi reload phải bấm chọn lại qua UI;
    - HMR trong pane không chạy, phải reload;
    - lỗi "Context Lost" còn sót từ tab cũ thì `location.reload()` là hết.
14. three r181 chỉ chạy WebGL2, nên kiểm `getContext('webgl2')` (hàm `supportsWebGL()` của Tế bào chấp nhận cả webgl1).
15. PhyloPic: `filter_license_*=false` là **loại bỏ**, và luôn tự kiểm URL giấy phép (data-spec K1).

---

## 10. Lộ trình chi tiết

### GĐ0 — Dữ liệu và engine (medium)
1. `git switch -c feat/evolution-tree-wow` rồi `git tag evo-before-wow main`.
2. Áp dụng data-spec C1–C4 vào `src/data/evolution/*.ts`, thêm `eukaryotes.ts`, thêm 42 node mới (D) và các sửa đổi (E).
3. Tạo `times.ts` (chép từ `times.json` + `CHAIN_NOTES`), `sectors.ts`, `overlays.ts`, `events.ts`, `games.ts` (L1, L2, `JOURNEY_STOPS`, `JOURNEY`, `SYMBIOSES`).
4. Tạo `kid.ts`: đủ 251 id theo hướng dẫn M, kèm `aliases`.
5. Viết engine (mục 5) và test:
   - `data.test.ts`: dựng lại dàn ý từ dữ liệu TS và so với `target-tree.txt` (trùng từng dòng), id duy nhất, 251/116, ngọn nào cũng có trong `KID`;
   - `times.test.ts`: chuyển logic từ `check-times.mjs`;
   - `timeScale.test.ts`, `layout.test.ts`, `search.test.ts`, `games.test.ts` (như mục 5).
6. Trang cũ (legacy) vẫn phải hiển thị được cây mới mà không lỗi.

**DoD**: `npm test` xanh (kể cả test cũ), `npm run build` qua, legacy mở được, không có id nào "treo".

### GĐ1 — Nền render (medium, bám checklist mục 9)
1. Chuyển file cũ vào `legacy/`, tạo `EvolutionTreeLegacy`, viết lại `EvolutionTreePage` (khung + fallback).
2. `EvoScene3D` (warmup, tier, context-lost, API), `CameraRig`.
3. `Branches` bản cơ bản: màu, độ dày, khử răng cưa, `uNowFrac`, `uState`. `Knots`, `Tips` bản chấm tròn. `EraRings` bản dải màu.
4. `picking`, `Labels` + LOD, `NodeSheet` tạm (tên + thời gian), TopBar + Toolbar tối thiểu.
5. Portrait và landscape, `resize` tính lại (`project` + fit).

**DoD**:
- mở trang là thấy trọn cây ở 1280×800 và 390×844;
- zoom/pan mượt;
- chạm ngọn thì bay tới và mở sheet;
- `?debug=perf` ≤ 10 draw call; console sạch;
- không còn animation CSS trong cây (`document.getAnimations().length` chỉ đếm UI);
- có ảnh chụp chứng minh.

### GĐ2 — Mỹ thuật (high)
1. `scripts/build-evo-art.mjs` (data-spec K1–K3) → atlas, svg, credits, contact-sheet. **Người dùng duyệt contact-sheet**, ghi `overrides.json` nếu cần đổi hình.
2. Shader cành đầy đủ (vỏ, nhựa sống, gió, hóa đá, dòng dõi phủ dần). Shader ngọn 5 kiểu + atlas + LOD icon.
3. `Backdrop` (trời + hạt nhiều lớp), `Effects`, hologram, cong tự nhiên cho cành dài.
4. `IntroGrowth`.

**DoD**:
- ảnh chụp 3 mức zoom + 4 khung mở màn, người dùng duyệt "wow";
- tier thấp vẫn rõ;
- trên Iris Xe 1280×800 tier cao ≥ 50 fps khi đứng yên và ≥ 40 fps khi kéo (đo đúng cách, bẫy 9);
- lần đầu vào (chưa có cache shader) ra hình ≤ 3 s sau màn chờ.

### GĐ3 — Thẻ và điều hướng (low–medium)
- `NodeSheet` đầy đủ (7.2), `InfographicViewer`, `SearchBox`, đường dẫn, `MiniMap`, `OverlayMenu` + `Overlays.tsx`, ‹ ›.
- Bàn phím: mũi tên để đi sang anh em hoặc lên/xuống cha con, Enter mở, Esc đóng.
- `CreditsModal`, liên kết Tế bào (+ sửa `CellBiologyPage`), sổ tay đánh dấu đã xem.

**DoD**: làm được mọi thao tác bằng cả cảm ứng và bàn phím; sheet dọc kéo được; infographic báo đúng khi offline; tìm "cá mập", "khủng long", "người" ra đúng.

### GĐ4 — Cỗ máy thời gian (medium; hiệu ứng thiên thạch: high)
- `TimeMachine`, `setNow/play/setScaleMix`, sự kiện + chú thích + đọc to, `fx/*` (mục 6.9), `Symbiosis`, lịch 1 năm, `playImpact`.

**DoD**:
- kéo 4,54 tỷ năm → nay mượt;
- mỗi sự kiện chạy một lần mỗi lượt đi qua;
- morph "Thời gian thật" 1,2 s không giật;
- ảnh/clip khoảnh khắc 66 Ma được người dùng duyệt;
- test `cosmicDate` xanh.

### GĐ5 — Chơi (medium)
- `RelativesQuiz`, `MysteryKey`, `AncestorJourney`, `EvoNotebook`, huy hiệu + ⭐ (`evoBadges`), âm thanh + đọc to.

**DoD**: chơi trọn cả ba trò; huy hiệu chỉ trao một lần; ⭐ cộng đúng; `games.test.ts` xanh.

### GĐ6 — Hoàn thiện (medium)
- Toàn bộ test + `npm run build`. Người dùng đo trên tablet Android rẻ và điện thoại dọc.
- Xóa `legacy/` và `?view=legacy` sau một bản phát hành ổn định.
- Cập nhật bảng trạng thái, memory `evolution-tree-wow-plan`, ghi bài học vào mục 13.

## 11. Rủi ro và cách đỡ

| Rủi ro | Cách đỡ |
| --- | --- |
| Số liệu thời gian vi sinh vật sai số lớn | `conf: 'thap'` không hiện số, chỉ hiện câu định tính; bố cục vẫn dùng số để đẹp |
| PhyloPic thiếu hình hoặc hình xấu cho vài nhóm | Chuỗi tên dự phòng → glyph code; duyệt contact-sheet; `overrides.json` |
| Nhãn chồng nhau ở màn nhỏ | Ngân sách nhãn theo bề rộng + LOD + ưu tiên; màn dọc xoay quạt |
| Cây phát sinh mới khác SGK làm bé hoặc phụ huynh bối rối | Lớp phủ "Nhóm theo SGK" + câu "Vì sao…"; thẻ ghi rõ "theo nghiên cứu mới" |
| Phình phạm vi | Bản phát hành đầu = GĐ0–3 + mở màn; GĐ4–5 làm đợt hai |
| Máy yếu | Tier thấp tự hạ (không tự nâng lại), `?tier=low`, legacy khi không có WebGL2 |

## 12. Bảng trạng thái

| GĐ | Trạng thái | Ghi chú |
| --- | --- | --- |
| Plan + spec dữ liệu | ✅ 28/09/2026 | Đã kiểm: cây đích 251/116, thời gian 75 điểm rẽ, bố cục tham chiếu, API PhyloPic |
| GĐ0 Dữ liệu và engine | ✅ 28/09 | 251 node/116 ngọn, 24 test engine; restructure bằng script một lần (đã xóa) |
| GĐ1 Nền render | ✅ 28/09 | cảnh R3F: 6 draw call cho vật thể, shader biên dịch ~230 ms |
| GĐ2 Mỹ thuật | ✅ 28/09 (cần người dùng duyệt thêm) | atlas 117 ô (95 PhyloPic + 22 glyph, 145 KB), nhựa sống, gió, hóa đá, bloom, hologram, cây mọc |
| GĐ3 Thẻ và điều hướng | ✅ 28/09 | sheet, tìm kiếm, đường dẫn, lớp phủ SGK, bàn phím, liên kết Tế bào (?cell=) — **chưa có MiniMap** |
| GĐ4 Cỗ máy thời gian | ✅ 28/09 | thanh kéo, sự kiện + hiệu ứng (thiên thạch, đại tuyệt chủng, băng giá, ôxi), lịch 1 năm, thời gian thật — **cung ty thể/lục lạp mới là nhấp nháy, chưa vẽ cung** |
| GĐ5 Chơi | ✅ 28/09 | 3 trò chơi + sổ tay + 9 huy hiệu (evoBadges, +10 ⭐) |
| GĐ6 Hoàn thiện | ⏳ | build production qua; cần đo fps trên tablet/điện thoại thật; xóa legacy/ sau 1 bản phát hành |

## 13. Bài học triển khai
- **Ribbon cành bị loại mặt sau**: 16.000 tam giác vẫn "được vẽ" (renderer.info đếm đủ) nhưng không hiện gì. Thứ tự đỉnh của ribbon nhìn từ camera là chiều kim đồng hồ → phải `side: DoubleSide`.
- **Màn dọc**: bản đầu xoay quạt −90° (gốc bên trái) → người dùng thấy cây "nằm ngang", mất ẩn dụ cây mọc lên. Nay màn dọc giữ cây mọc từ dưới lên, **kéo giãn chiều đứng ×1,7** (`PORTRAIT_STRETCH` trong layout.ts); shader vòng đại chia lại `y / 1.7`.
- **Đọc to bị cắt** (góp ý người dùng): hành trình cố định 4,2 s/chặng làm câu dài bị ngắt. Nay chuyển chặng khi `speak` báo `onEnd` (+1 s); máy không có giọng thì chờ theo độ dài câu; hẹn giờ an toàn vì Chrome đôi khi không báo onend. Chú thích sự kiện chỉ đọc khi không có câu nào đang đọc; mở màn không đọc từng mốc.
- Quầng vành "hôm nay" phải tính theo pixel (`fwidth`), không theo đơn vị thế giới — zoom gần thì dải 35 đơn vị thành mảng vàng lớn.
- Cành ngọn nhìn xa chỉ còn < 1 px → vertex shader nới tối thiểu `0.8 / uPxPerUnit` (attribute `aHalfW`).
- Thêm `camera-controls` lần đầu làm Vite tối ưu dependency rồi **tải lại trang** (mất hồ sơ đang chọn trong pane) — đã khai báo trong package.json.
- PhyloPic: SVG có viewBox lớn → sharp báo vượt giới hạn pixel ở density 300; tính density theo kích thước; loại hình "đặc kín" (SVG có nền).
- Test chạy chung đôi khi hỏng vì quá thời gian (DragonQuest, MathRacing, CoTuong, CoVua) — chạy riêng đều xanh, không liên quan.

## Nguồn khoa học chính
- LUCA ~4,2 tỷ năm: Moody và cs. 2024, *Nature Ecology & Evolution* — https://www.nature.com/articles/s41559-024-02461-1
- Mốc nhân thực 2,7 tỷ năm bị bác do nhiễm bẩn mẫu: French và cs. 2015 (tin Max Planck) — https://www.mpg.de/9256248/eukaryotes-evolution
- Nhân thực mọc ra từ cổ khuẩn Asgard: Eme và cs. 2023, *Nature*; Williams và cs. 2020, *Nature Ecology & Evolution*.
- Thời gian rẽ nhánh: TimeTree 5 (Kumar và cs. 2022) cùng các mốc hóa thạch ghi trong `times.json`.
- Hình bóng: PhyloPic — https://www.phylopic.org/articles/image-usage · API v2 — http://api-docs.phylopic.org/v2/
- Mô hình tham khảo: OneZoom (zoom liền mạch cả cây sự sống) — https://www.onezoom.org/
