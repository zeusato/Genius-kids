# Xưởng Hành Tinh — Plan (Planet Maker)

> Phân hệ mới của mục Khoa học: trẻ **tự tạo hành tinh**, nặn địa hình núi–sông–biển,
> trồng rừng, trang trí khí quyển/vành đai, đặt tên — rồi hành tinh của bé xuất hiện
> **ngay trong scene Hệ Mặt Trời chính**, bay quanh Mặt Trời cùng 8 hành tinh thật.
>
> Triết lý: constructionist learning — chiều ngược lại của "Cắt hành tinh"
> (mổ xẻ để hiểu → lắp ráp để hiểu sâu hơn).

## 1. Vì sao khả thi với stack hiện tại

| Nhu cầu | Giải pháp | Đã có sẵn |
|---|---|---|
| Nặn địa hình trên cầu | Icosphere ~10k đỉnh + dịch đỉnh theo bán kính (vertex displacement), brush falloff | three.js BufferGeometry |
| Núi/sông/biển | Tô màu **tự động theo độ cao** (vertex colors) + quả cầu nước trong mờ ở mực nước biển | pattern MembraneRim (cell) |
| Rừng rậm | InstancedMesh cây procedural (nón+trụ), rắc theo cọ, bám mặt đất | pattern Organelle3D count>1 |
| Zoom in/out, xoay | drei OrbitControls (pinch zoom + damping + min/max distance) | @react-three/drei |
| Lưu/mở | Ops-log (danh sách nét cọ) + snapshot nén vào localStorage theo profile | StudentProfile storage |
| Lời phê AI | Gemini viết nhận xét "kiểm định sự sống" từ chỉ số rule-based | services/geminiClient.ts |
| Đọc to, huy hiệu, SFX | speech.ts, solarBadges, sfx.ts | module solar |

**Không cần**: model GLB, texture tải về, physics engine, backend.

## 2. Thiết kế kỹ thuật

### 2.1 Địa hình
- `IcosahedronGeometry(1, 5)` ≈ 10.242 đỉnh / 20k tam giác — đủ chi tiết, tablet chạy mượt.
  Mỗi đỉnh lưu `elevation` (float, quanh 0) → vị trí = hướng đỉnh × (1 + elevation).
- **Brush**: raycast điểm chạm → với mỗi đỉnh trong bán kính cọ (đo theo góc trên cầu),
  `elevation += strength × falloff(d)` (falloff smoothstep). Throttle recompute normals
  theo vùng ảnh hưởng (không recompute toàn cầu mỗi move).
- **Màu tự động theo độ cao** (vertex colors, KHÔNG texture):
  - `< seaLevel` : lòng biển (xanh đậm dần theo độ sâu)
  - mép nước : cát vàng
  - thấp : xanh lá đồng bằng
  - cao : nâu núi đá
  - rất cao : tuyết trắng
  - Ngưỡng pha trộn mượt (lerp) để không bị vệt cứng.
- **Nước**: quả cầu thứ hai bán kính `1 + seaLevel`, material trong mờ + fresnel nhẹ.
  Slider "Mực nước biển" → cả đại dương dâng/rút realtime. Sông/hồ = trẻ khoét rãnh
  sâu dưới mực nước (không mô phỏng dòng chảy — đúng tầm tiểu học, không scope creep).

### 2.2 Công cụ (tool palette icon to, kid-first)
| Tool | Hành vi |
|---|---|
| 🏔️ Nâng đất | brush raise |
| 🕳️ Hạ đất | brush lower (khoét biển/sông/hố) |
| 🪄 Làm mượt | brush smooth (trung bình elevation lân cận) |
| 🌲 Rừng | rắc cây instanced trong vùng cọ (chỉ trên đất, không dưới nước) |
| 🌋 Núi lửa | stamp preset (nón + miệng lõm + đốm dung nham đỏ ở đỉnh) |
| 🧽 Xoá | xoá cây / san phẳng về 0 trong vùng cọ |
- Slider **cỡ cọ** + **lực cọ** (2 mức: nhẹ/mạnh là đủ cho trẻ).
- **Trang trí toàn cục**: màu khí quyển (AtmosphereRim), mây bật/tắt, vành đai bật/tắt
  (SaturnRings tái dùng, cho chỉnh màu), 0–2 mặt trăng, màu biển.
- Nút **🎲 Gieo hành tinh ngẫu nhiên**: simplex noise seed → có núi biển sẵn để trẻ
  sửa tiếp thay vì bắt đầu từ quả cầu trơn (giảm "trang giấy trắng").

### 2.3 Cử chỉ (học từ bài học module Cắt)
- **1 ngón kéo trên hành tinh + tool đang chọn** → nặn.
- **1 ngón kéo ngoài hành tinh** → xoay (OrbitControls rotate).
- **2 ngón pinch** → zoom (luôn luôn, mọi ngữ cảnh). Giới hạn zoom 1.3×R – 4×R.
- Desktop: hover hiện **vòng cọ preview** trên mặt đất (ring bám theo raycast).
- Nút 🔄 "Chỉ xoay" toggle cho trẻ nhỏ hay nặn nhầm (mode khoá nặn).

### 2.4 Lưu / Undo (quan trọng — làm từ Phase 1)
- **Ops-log**: mỗi nét cọ = `{tool, point(unit vec), radius, strength}` push vào mảng.
  - Undo = pop op + replay từ snapshot gần nhất (snapshot Float32→Int8 quantized mỗi 20 ops).
  - Lưu localStorage: `{name, seed, ops, snapshot, cosmetics, planetLayersChoice, createdAt}`
    theo profile — ~40–60KB/hành tinh, giới hạn 3 hành tinh/bé (kệ trưng bày).
- Replay ops khi mở lại → đúng nguyên trạng.

### 2.5 Kết nối hệ sinh thái (điểm ăn tiền)
1. **Hành tinh của bé bay trong Hệ Mặt Trời chính**: thêm 1 quỹ đạo (giữa Sao Hỏa và
   vành đai tiểu hành tinh — chỗ trống tự nhiên), label = tên bé đặt. Scene chính load
   snapshot mesh (KHÔNG editor). Trẻ mở app, thấy hành tinh mình giữa các hành tinh NASA.
2. **Kiểm định sự sống** (giáo dục lồng trong chơi): thanh trượt "khoảng cách tới Mặt Trời"
   khi lưu → tính rule-based: có nước lỏng? (khoảng cách vừa + có biển), có khí quyển?,
   có đất liền? → **điểm sự sống 0–100** + Bo (Gemini) viết 2 câu nhận xét dí dỏm kiểu
   "Hành tinh Bi-Bi gần Mặt Trời quá, biển sẽ sôi ùng ục mất!". Fallback template khi offline.
3. **Huy hiệu** (solarBadges mở rộng): "Kiến trúc sư vũ trụ" (hành tinh đầu tiên),
   "Người gieo sự sống" (điểm sự sống ≥ 80), "Chúa tể núi lửa" (≥ 5 núi lửa).
4. **Cắt được hành tinh của mình** (Phase 4): khi tạo, trẻ chọn bộ lõi (đá/băng/khí) →
   hành tinh của bé mở được trong module "Cắt hành tinh" với địa tầng đã chọn.

## 3. Lộ trình

| Phase | Nội dung | Ước lượng |
|---|---|---|
| **0. Spike** | Prototype icosphere sculpt + màu theo độ cao + OrbitControls; đo FPS tablet | 0.5 ngày |
| **1. Nặn cơ bản** | Editor page, 3 brush đất (nâng/hạ/mượt), auto-biome, cầu nước + slider mực nước, undo/ops-log, lưu 1 hành tinh, gieo ngẫu nhiên, đặt tên | 2–3 ngày |
| **2. Trang trí** | Cọ rừng (instanced), stamp núi lửa, khí quyển/mây/vành đai/mặt trăng, kệ 3 hành tinh, vòng cọ preview | 2 ngày |
| **3. Kết nối** | Hành tinh vào scene Hệ Mặt Trời chính, kiểm định sự sống + lời phê Gemini, huy hiệu, TTS, SFX nặn đất | 1.5–2 ngày |
| **4. Mở rộng** (tuỳ) | Chọn địa tầng lõi → cắt được trong module Cắt; xuất ảnh PNG kỷ niệm; 2D fallback (không WebGL → vẽ "bản đồ hành tinh" phẳng?) | 1–2 ngày |

Tổng Phase 0–3: **~6–7.5 ngày công**.

## 4. Rủi ro & đối sách

| Rủi ro | Đối sách |
|---|---|
| Xung đột cử chỉ nặn vs xoay trên touch | Quy tắc "chạm trên hành tinh = nặn, ngoài = xoay" + nút khoá 🔄; test thật với trẻ sớm (Phase 1) |
| Recompute normals 20k tris mỗi move chậm trên tablet yếu | Recompute theo vùng cọ; DPR cap 1.5; nếu vẫn chậm → hạ subdiv 4 (2.5k đỉnh) theo `quality` flag sẵn có |
| localStorage đầy | Quantize Int8 + giới hạn 3 hành tinh + nén ops |
| Trẻ phá menu/nặn lung tung mất hứng | Gieo ngẫu nhiên làm điểm bắt đầu, undo to rõ, nút "Làm lại từ đầu" có confirm |
| Scope creep (mô phỏng sông chảy, sinh vật, thời tiết…) | Chốt: nước = mực nước tĩnh; sinh vật = KHÔNG (chỉ cây); thời tiết = KHÔNG |

## 5. Cấu trúc file dự kiến

```
src/components/planetmaker/
  PlanetMakerPage.tsx        # page + tool palette + save/load UI
  scene3d/
    TerrainSphere.tsx        # icosphere + sculpt + vertex colors
    WaterSphere.tsx          # cầu nước fresnel
    ForestInstances.tsx      # cây instanced
    BrushCursor.tsx          # vòng cọ preview
    MakerCameraRig.tsx       # OrbitControls wrapper (clamp zoom)
    terrainOps.ts            # engine thuần: apply/undo ops, snapshot, biome color — TEST ĐƯỢC không cần GL
src/data/planetMakerData.ts  # presets, núi lửa stamp, rule kiểm định sự sống
docs/planet-maker-plan.md    # file này
```
(Engine thuần tách khỏi render — đúng quy ước 3 tầng như GearsGame/DragonQuest.)
