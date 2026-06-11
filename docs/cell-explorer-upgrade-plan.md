Both research claims are verified: the `cytoplasms` id inconsistency (line 121) and the wrong centrosome fact (line 118). I have everything I need. Here is the synthesized plan.

---

# Kế hoạch nâng cấp "Khám phá tế bào" lên chuẩn 3D như Hệ Mặt Trời

> Mục tiêu: đưa Cell Explorer từ 2D SVG phẳng → 3D thật (xoay/zoom/độ sâu, fly-to khi chọn bào quan, quiz + huy hiệu, thuyết minh tiếng Việt), tái dùng tối đa hạ tầng `solar/scene3d/`. Giữ nguyên view 2D làm fallback.

---

## 1. Chẩn đoán hiện trạng

**Đang có (giữ lại):**
- `CellBiologyPage.tsx`: 2 view — "lab" (3 thẻ chọn mẫu animal/plant/bacteria) + "microscope" (SVG 2D + lớp vignette). View "lab" **giữ nguyên**.
- `cellData.ts`: dữ liệu **rất tốt và giàu** — mỗi bào quan có `{summary, structure, function, location, analogy}` + `funFact` + `color`. Animal 7 / plant 7 / bacteria 8 bào quan, song ngữ Việt-Anh.
- `DetailPanel.tsx`: side/bottom sheet đọc `details + funFact` — **giữ nguyên 100%**, đây là cam kết "lớp 3D mới không phá vỡ text giàu sẵn có".
- `DNAHelix.tsx`, `CellCanvas.tsx`, `CellMembrane.tsx`, `Organelle.tsx`, `CellAssets.tsx` — **giữ làm path 2D fallback**.

**Điểm yếu cần sửa:**
- Mô hình tế bào **không phải 3D** — `CellMembrane.tsx` chỉ là blob CSS (morph border-radius), `CellCanvas.tsx` đặt ~17 SVG bằng absolute position. Phẳng, không xoay/zoom/độ sâu.
- **Thiếu hoàn toàn**: quiz, huy hiệu, thuyết minh audio.
- **2 lỗi dữ liệu đã xác minh trong `cellData.ts`:**
  - Dòng 121: id `'cytoplasms'` (có "s" thừa) — lệch với plant/bacteria dùng `'cytoplasm'`. → Chuẩn hóa thành `'cytoplasm'`.
  - Dòng 118: funFact trung thể **SAI khoa học** (xem mục 2).

---

## 2. Khoa học: bào quan cần THÊM / SỬA cho từng loại tế bào

### 2.1 Tế bào động vật (~20 µm, blob cầu mềm bất đối xứng — đúng với thẩm mỹ morph hiện tại)

**THÊM (đang thiếu):**
| Bào quan | Hình 3D | Số lượng hiển thị | Ghi chú nhí |
|---|---|---|---|
| **Màng tế bào** (`plasma_membrane`) | Lớp vỏ ngoài mỏng, trong mờ bọc toàn bộ blob; zoom gần = "tường bong bóng" (lớp phospholipid kép) | 1 (ranh giới ngoài) | Đang **thiếu & quan trọng** — đây là "cổng an ninh" quyết định ra/vào. Nhấn mạnh: **mềm dẻo** (khác thành cứng của thực vật). |
| **Ribôxôm** (`ribosome`) | Hạt 2 phần nhỏ xíu (như người tuyết tí hon); chấm li ti — vừa trôi tự do, vừa bám trên lưới nội chất hạt | 8-15 chấm | Đang **thiếu** — "nhà máy protein", giải thích vì sao ER hạt sần sùi. Nối được với bài học vi khuẩn (vi khuẩn cũng có ribôxôm). |

**SỬA lỗi:**
- **Trung thể (`centrosome`) — `cellData.ts:118` SAI:** câu "Tế bào thần kinh của người trưởng thành không có trung thể nên không thể phân chia" là **sai**. Nơron trưởng thành **vẫn có** trung thể, chỉ bị bất hoạt vai trò trung tâm tổ chức vi ống; chúng không phân chia vì đã **biệt hóa cuối (post-mitotic)**, không phải vì thiếu trung thể.
  → Thay bằng: *"Trung thể giúp chia đều DNA cho 2 tế bào con khi tế bào phân chia."*
- **`cytoplasms` → `cytoplasm`** (chuẩn hóa id, dòng 121).

**Đã chính xác, chỉ tinh chỉnh 3D/số lượng:**
- Nhân: cầu lớn nhất (~6 µm, 10-20% thể tích), màng kép có lỗ nhân + nhân con; funfact "2 mét DNA" đúng. Giữ ở trung tâm, là tâm điểm fly-to.
- Ty thể: hình hạt đậu/xúc xích, gờ răng lược bên trong. Tăng từ 3 → **5-8** để truyền cảm giác "nhiều" (thật ra có hàng trăm — dùng cho wow factor).
- ER: mạng ống/tấm gấp quấn quanh nhân, liên tục với màng nhân. ER hạt = sần (ribôxôm bám).
- Golgi: chồng túi dẹt cong (như chồng bánh kếp), túi tiết nảy ra ở rìa. Đặt cạnh ER.
- Tiêu thể: cầu nhỏ trơn; funfact tự tiêu — diễn đạt nhẹ nhàng ("tái chế cả bộ phận cũ").

### 2.2 Tế bào thực vật (~50 µm, hộp chữ nhật bo góc — thành cứng cho hình cố định)

**THÊM:**
| Bào quan | Hình 3D | Ghi chú |
|---|---|---|
| **Màng tế bào** (`plasma_membrane`) | Lớp mỏng lót **bên trong** thành tế bào | Đang thiếu. Làm rõ điểm dễ nhầm: thực vật có **CẢ** thành (cứng, ngoài) **VÀ** màng (mỏng mềm, trong). Ưu tiên thấp hơn ribôxôm nếu giới hạn số. |
| **Ribôxôm** | (như động vật) | Đồng bộ bài học. |

**Layout bắt buộc:** **Không bào trung tâm** chiếm **80-90% thể tích** → phải to và ở giữa, **ép mọi bào quan (kể cả nhân) ra sát rìa**. Đây là quy tắc bố cục quyết định.
- Lục lạp: thấu kính xanh dẹt, bên trong có chồng đĩa (grana); 4-8 cái rải gần rìa (hướng sáng). Đề cập "hàng chục" trong tế bào thật.

### 2.3 Tế bào vi khuẩn (giữ nguyên data tốt sẵn)
- Đã có vỏ nhầy/capsule, thành, màng, vùng nhân (nucleoid), ribôxôm, roi (flagellum), pili — phù hợp cho cut-away "bóc vỏ" nhiều lớp.

---

## 3. Phương án render 3D

### 3.1 Verdict: **PROCEDURAL, KHÔNG tải model GLB**
Lý do (đã xác minh):
- Model "Animal Cell" miễn phí được khuyên nhiều nhất trên Sketchfab = **280.9k triangle** — riêng nó đã thổi bay ngân sách tablet đời thấp; lại là 1 mesh hàn dính nên **không thể** cho mỗi bào quan vị trí world riêng để fly-to/raycast nếu không re-author trong Blender.
- Các nguồn khác (CVallance, NIH 3D) đều CC-BY (cần attribution), high-poly, style xám/khoa học **lệch** với look hoạt hình tươi sáng của Solar, và tốn MB trên GitHub Pages (vừa cắt 9.7MB).
- Procedural thắng mọi mặt: cả tế bào ~13 loại bào quan từ sphere/capsule/torus/tube → **~30-60k tris**, **0 byte tải thêm** (geometry sinh runtime), recolor thẳng từ `cellData.color`, mỗi bào quan là 1 `Object3D` đăng ký fly-to y như `PlanetMesh`, look khớp Solar (cùng `meshStandardMaterial` + fresnel rim). Tế bào vốn là sơ đồ/cartoon ngay cả trong sách → không cần texture như hành tinh.

### 3.2 Công thức geometry rút gọn (primitives đã xác minh trên three 0.181 / drei 10.7)
- **Nhân**: sphere(1,48,32) màu `#A855F7` + nhân con (sphere nhỏ lệch tâm) + 24-40 lỗ nhân (torus tí hon, instanced 1 draw call, đặt theo Fibonacci-sphere) + vỏ fresnel BackSide (port `AtmosphereRim`). Thả `DNAHelix.tsx` vào khi chọn. **~9k tris**, là tâm điểm fly-to.
- **Ty thể**: `CapsuleGeometry(0.5, 1.1, 6, 16)` + 5-8 torus mỏng làm gờ răng lược, instanced. **~2.5k tris/cái**.
- **Lục lạp**: ellipsoid (sphere scale `{1.4,0.8,1.0}`) + grana (chồng `CylinderGeometry` dẹt, instanced). Chỉ tế bào thực vật.
- **Golgi**: 5-6 torus bán kính giảm dần (0.6→0.35) xếp chồng + vài cầu túi tiết. **~4k tris**.
- **ER**: 1 `TubeGeometry` theo `CatmullRomCurve3` xoắn quanh nhân; rắc ribôxôm dọc tube (lấy `curve.getPointAt(t)`). Parent vào group nhân để fly-to-nhân khung luôn cả ER.
- **Tiêu thể/peroxisome**: cầu nhỏ trong mờ (opacity 0.9) + lõi đậm, instanced per-color 1 draw call.
- **Ribôxôm**: chấm sphere cực nhỏ, instanced (pool dùng chung với ER).
- **Không bào** (thực vật): cầu trong mờ scale ~0.6 bán kính tế bào; drei `MeshTransmissionMaterial` (transmission 0.95, ior 1.2) hoặc rẻ hơn `meshStandardMaterial` opacity 0.18 + fresnel rim; `renderOrder` cao + `depthWrite=false`.
- **Roi (bacteria)**: TubeGeometry biến dạng sóng sin theo `clock.t`.

### 3.3 Màng & cut-away
- **Màng = vỏ cầu trong mờ**: port `AtmosphereRim.tsx` → `MembraneRim`, đổi blending Additive → Normal alpha thấp (look bong bóng xà phòng), giữ BackSide + `depthWrite=false`. Vỏ fresnel cho glow mà **không che nội thất**.
- **Cut-away/peel** = tween **opacity material**, KHÔNG cắt geometry. 1 nút lớn "Lớp vỏ": thực vật ẩn thành tế bào để nhìn vào; vi khuẩn bóc vỏ nhầy → thành → màng. Đây là thứ cuối cùng tạo cảm giác "độ sâu" mà view phẳng thiếu.

### 3.4 Ngân sách hiệu năng (target: tablet đời thấp)
- Tổng ~30-60k tris/tế bào, nhờ instancing → vài chục draw call.
- **KHÔNG postprocessing/Bloom** (Solar chỉ cần cho glow HDR của Mặt Trời). Bỏ hẳn lazy chunk Effects → tiết kiệm tải. Membrane fresnel đã cung cấp glow.
- Tier `low` (PerformanceMonitor onDecline): dpr=1, bỏ CytoplasmStreaming + Trails, hạ instance (ribôxôm 40→15, ER segments /2), giảm segment sphere, bỏ đèn fill thứ 2.

---

## 4. UX & tính năng (xếp theo impact/effort)

**Vòng lặp lõi (theo LearnGenetics "Inside a Cell" — khớp độ tuổi & phạm vi nhất):** Xoay cả tế bào → chạm bào quan → camera bay tới + nó sáng lên, phần còn lại mờ đi → panel + thuyết minh → (điểm khác biệt) **animation ngắn cho thấy bào quan ĐANG LÀM VIỆC** → mini-quiz để "thu thập". **Cho thấy chức năng, không chỉ cái tên.**

| # | Tính năng | Impact | Effort | Nguồn cảm hứng |
|---|---|---|---|---|
| 1 | **Xoay/zoom/orbit cả tế bào** (drei `CameraControls`: 1 ngón orbit, 2 ngón pinch/pan) | ★★★★★ | TB | mọi benchmark |
| 2 | **Tap → fly-to + highlight + isolate** (làm sáng cái chọn, mờ/giảm bão hòa phần còn lại); **hit-sphere vô hình 60px+** cho ngón tay trẻ | ★★★★★ | Thấp (copy `CameraRig`) | BioDigital |
| 3 | **Quiz + sao + huy hiệu** — copy `SolarQuiz`/`SolarCollection` gần như nguyên văn (xem mục 5). No-punishment retry. | ★★★★★ | Thấp | Labster |
| 4 | **Thuyết minh vi-VN** (`SpeakButton`, tự ẩn nếu máy không có giọng Việt) — đọc `summary + funFact`. **Thiết yếu cho nhóm 5-7 chưa đọc được**, không phải tùy chọn. | ★★★★ | Thấp | Google/Visible Body |
| 5 | **Cut-away/peel toggle** "Lớp vỏ" (tween opacity) | ★★★★ | TB | BioDigital X-ray |
| 6 | **Tham quan tế bào** (guided tour auto fly-to theo thứ tự kể chuyện + tự đọc) | ★★★ | TB | Arloon Processes |
| 7 | **So sánh Động vật vs Thực vật** (toggle A/B; bào quan riêng pulse/highlight) — data đã hỗ trợ | ★★★ | TB | curriculum |
| 8 | **True-scale overlay** (lineup tỷ lệ thật; nhấn "hàng trăm ty thể / hàng chục lục lạp") — port `TrueScaleOverlay` | ★★ | TB | — |
| 9 | **Build-a-cell** (đặt bào quan vào tế bào rỗng) — **bắt buộc có tap-to-place** (chạm khay → chạm vị trí) vì kéo-thả khó cho <11 tuổi; bắt đầu 3-4 bào quan lõi, mở khóa thêm cho 11-12 | ★★★★ | **Cao** | CellCraft/BioMan |

**Quy tắc UX trẻ em (NN/g):** touch target ≥60×60px, cách nhau ≥8-10px (→ dùng hit-sphere vô hình); cửa sổ phản hồi rộng rãi, sai chỉ mờ đi rồi thử lại (đã có trong `SolarQuiz`, dùng lại nguyên văn); phân tầng 5-7 / 8-10 / 11-12.

---

## 5. Kiến trúc & tái dùng

**Thư mục mới `src/components/cell/scene3d/`** — song song có chủ đích với `src/components/solar/scene3d/` để copy-adapt, không phát minh lại.

### 5.1 Cây component (1 Canvas duy nhất)
```
CellScene3D.tsx  (≙ Scene3D.tsx)
 └─ <Canvas dpr={quality==='high'?[1,1.5]:1} frameloop={paused?'never':'always'}
            camera={{fov:45, position:[0,3,9], near:0.1, far:100}}>
    ├─ <color background #0a0a1a />
    ├─ <ambientLight 0.55 />  (sáng hơn solar 0.15 để thấy nội thất)
    ├─ <pointLight [3,4,5] 0.8 /> + 1 đèn fill lạnh đối diện (độ sâu)
    ├─ <ClockTicker clock={clock} />     (Y HỆT Scene3D — priority -1, clamp delta)
    ├─ <Suspense>
    │   ├─ <CellBody data cutaway clip />        (vỏ màng trong mờ)
    │   ├─ cell.organelles.map(o => <Organelle3D ... registry />)
    │   ├─ <CytoplasmStreaming />  (chỉ tier high)
    │   └─ <Preload all />
    ├─ <CellCameraRig focusedId registry clock onFocusComplete apiRef home />
    └─ <PerformanceMonitor onDecline={()=>setQuality('low')} />
```
**KHÔNG có Effects/Bloom.**

### 5.2 Bảng tái dùng (reuse map)
| Có sẵn (solar) | Tái dùng cho cell |
|---|---|
| `scene3d/core.ts` (SimClock, createSimClock, supportsWebGL, BodyRegistry, BodyEntry, Scene3DApi) | **Copy nguyên văn** → `cell/scene3d/core.ts`. Domain-agnostic. Chỉ khác: thay `SHARED_SPHERE` đơn lẻ bằng **pool geometry keyed theo `geometryKind`**; **bỏ `texUrl`** (procedural, không texture). |
| `Scene3D.tsx` | Template `CellScene3D.tsx`. Giữ y hệt ClockTicker / frameloop / dpr / PerformanceMonitor / contextlost. **Bỏ lazy Effects/Bloom**. Đổi đèn sáng hơn. |
| `CameraRig.tsx` (fly-to `setLookAt(...).then(onFocusComplete)`, `timeScale=0` lúc bay, dolly zoom qua apiRef) | Copy → `CellCameraRig.tsx` gần nguyên văn. Đổi home `[0,3,9]` (thay vì `[0,30,62]`), min/maxDistance ~2..30. Giữ công thức `getWorldPosition` + `dist=max(radius*k, floor)`. |
| `PlanetMesh.tsx` (register/unregister registry, hit-sphere vô hình, `damp3` hover scale, Html label-button, mutate ref/frame) | **Tổ tiên trực tiếp của `Organelle3D.tsx`.** Thay sphere có texture bằng switch `geometryKind` + instancing. |
| `AtmosphereRim.tsx` (fresnel BackSide, depthWrite=false) | → `MembraneRim`. Đổi Additive → Normal alpha thấp (bong bóng). |
| `scale.ts` | Template `cellScale.ts`: `CELL_RADIUS` theo loại, `hitRadius()` (copy công thức `2.1*r` đã tune 48px+), HOME camera per cell. |
| `SolarQuiz.tsx` | Copy → `CellQuiz.tsx`. `PlanetData→CellType`, `SOLAR_QUIZ→CELL_QUIZ` (key `animal/plant/bacteria`), `solarBadges→cellBadges`. Logic y hệt. |
| `SolarCollection.tsx` | Copy → `CellCollection.tsx`. `total=3`. Tiêu đề hoàn thành: **"Nhà Sinh Học Tí Hon"**. |
| `SpeakButton.tsx` | Copy/tổng quát hóa. Feed `organelle.details.summary + funFact`. Không đổi logic. |
| `solarQuizData.ts` | Template `cellQuizData.ts`: cùng shape, `CELL_QUIZ` key theo loại (rút câu hỏi từ `funFact`/`function` sẵn có), `COLLECTIBLE_CELL_IDS=['animal','plant','bacteria']`, dùng lại `BADGE_STAR_REWARD`. |
| `SolarSystemPage.tsx` (clockRef + sceneApiRef + focusedId/selectedPlanet, handleSelect→fly-to→handleFocusComplete→open detail, fallback `supportsWebGL`/`?view=2d`, contextLost overlay) | Port state machine vào view "microscope" của `CellBiologyPage`. Thêm `focusedId + clockRef + sceneApiRef + cutaway toggle`. |
| `DetailPanel.tsx` | **GIỮ NGUYÊN.** Lớp 3D feed cùng object `Organelle`. |
| `DNAHelix/CellCanvas/CellMembrane/Organelle/CellAssets` (2D) | **Giữ làm path 2D fallback** (render khi `!supportsWebGL` hoặc `?view=2d`). DNAHelix vẫn hiện cạnh panel khi chọn nhân/nucleoid. |
| `StudentProfile.solarBadges?: string[]` (repo-root `types.ts`) | Thêm field anh em **`cellBadges?: string[]`** ngay sau `solarBadges?` (~dòng 239+1). `updateStudent` spread y hệt. |

### 5.3 `Organelle3D` data-driven + thay đổi `cellData.ts`
**Thêm enum + field 3D tùy chọn (additive — object cũ không có vẫn compile):**
```ts
export type GeometryKind =
  | 'sphere'     // nhân, nucleoid, tiêu thể, không bào, ribôxôm, trung thể
  | 'bean'       // ty thể (CapsuleGeometry)
  | 'disc'       // lục lạp (sphere scale dẹt)
  | 'golgiStack' // golgi (torus/disc xếp chồng)
  | 'tubes'      // ER (TubeGeometry quanh nhân)
  | 'flagellum'  // roi vi khuẩn (sin tube)
  | 'fibers'     // pili
  | 'shell';     // thành/màng/vỏ nhầy (concentric shell, ủy cho CellBody)

threeD?: {
  geometry: GeometryKind;
  position: [number, number, number]; // local, đơn vị = bán kính tế bào
  scale: number | [number, number, number];
  count?: number;        // số bản instance (ty thể, lục lạp, ribôxôm...)
  rotation?: [number, number, number];
};
```
`Organelle3D` switch trên `geometryKind`, instance N bản, wire click→fly-to, hiện Html label tiếng Việt (`organelle.name`). **Text giàu trong DetailPanel KHÔNG đụng tới** — chỉ THÊM field 3D.

**Sửa data đồng thời:** (1) `cytoplasms`→`cytoplasm`; (2) funFact trung thể (mục 2.1); (3) thêm object `plasma_membrane` + `ribosome` cho animal & plant; (4) gắn `threeD` cho mọi bào quan.

---

## 6. Lộ trình theo phase

> Mỗi phase đều giữ view 2D hoạt động (fallback an toàn). Effort ước tính ngày-người.

| Phase | Nội dung | Effort | Rủi ro |
|---|---|---|---|
| **0 — Nền tảng** | Copy `core.ts`→cell (bỏ texUrl, thêm geometry pool); thêm `cellBadges?` vào `types.ts`; **sửa 2 lỗi data** (`cytoplasms`, funfact trung thể); thêm enum `GeometryKind` + field `threeD?` vào `cellData.ts`. | **0.5-1 ngày** | Rất thấp (additive, không phá UI). |
| **1 — Scene 3D cơ bản** | `CellScene3D` + `CellBody` (màng fresnel) + `MembraneRim` + `Organelle3D` (switch geometry, instancing) + `cellScale.ts`. Render được animal cell 3D xoay/zoom. Gate `supportsWebGL` + `?view=2d` fallback về CellCanvas. | **2-3 ngày** | TB — tinh chỉnh look procedural cho khớp Solar; quản ngân sách tris. |
| **2 — Tương tác lõi** | `CellCameraRig` fly-to + hit-sphere vô hình + isolate (sáng/mờ) + Html label. Wire vào DetailPanel sẵn có. Hoàn thiện công thức 3D cho plant (không bào trung tâm ép layout) + bacteria. | **2-3 ngày** | TB — bố cục thực vật (không bào ép rìa) cần canh kỹ. |
| **3 — Giáo dục** | `CellQuiz` + `CellCollection` + `cellQuizData.ts` + `SpeakButton` (thuyết minh). Award `cellBadges` + sao qua `updateStudent`. | **1.5-2 ngày** | Thấp (copy gần nguyên văn). |
| **4 — Độ sâu & tham quan** | Cut-away/peel toggle (tween opacity) + Guided tour auto-narration + So sánh Animal/Plant. | **2-3 ngày** | TB. |
| **5 — Mở rộng (tùy chọn)** | True-scale overlay; **Build-a-cell** (tap-to-place trước, drag là enhancement); pro-mode peroxisome/cytoskeleton. | **3-5 ngày** | Cao — build-a-cell là mode sâu nhất, làm sau khi lõi ổn. |

**Tổng lõi (Phase 0-3) ≈ 6-9 ngày** để đạt chuẩn chất lượng Solar (3D thật + fly-to + quiz/badge/narration). Phase 4-5 nâng cao thêm.

---

**File liên quan (đường dẫn tuyệt đối):**
- Sửa data: `D:\Quyetnm\Dev\mathgenius-kids\src\data\cellData.ts` (dòng 118 funfact trung thể, dòng 121 id `cytoplasms`)
- Thêm field badge: `D:\Quyetnm\Dev\mathgenius-kids\types.ts` (sau `solarBadges?`)
- Copy nền tảng từ: `D:\Quyetnm\Dev\mathgenius-kids\src\components\solar\scene3d\` (core.ts, Scene3D.tsx, CameraRig.tsx, PlanetMesh.tsx, AtmosphereRim.tsx, scale.ts)
- Tạo mới: `D:\Quyetnm\Dev\mathgenius-kids\src\components\cell\scene3d\` (CellScene3D, CellCameraRig, Organelle3D, CellBody, MembraneRim, core.ts, cellScale.ts) + `CellQuiz.tsx`, `CellCollection.tsx`, `cellQuizData.ts`
- Orchestration: `D:\Quyetnm\Dev\mathgenius-kids\src\pages\science\CellBiologyPage.tsx` (port state machine từ `SolarSystemPage.tsx`)
- Giữ nguyên: `D:\Quyetnm\Dev\mathgenius-kids\src\components\cell\DetailPanel.tsx` + path 2D fallback