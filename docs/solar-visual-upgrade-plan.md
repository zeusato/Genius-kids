# Phương án nâng cấp hình ảnh "Khám Phá Hệ Mặt Trời" (đẹp hơn, wow hơn — nhưng đúng khoa học)

> Tổng hợp ngày 24/09/2026 từ audit đo đạc trên scene thật (renderer.info, tính góc chiếu sáng,
> mô phỏng Monte Carlo 20.000 đường bay, soi pixel texture, đọc mã nguồn three 0.181 /
> @react-three/postprocessing 3.0.4 / postprocessing 6.39). Kế thừa `docs/solar-system-upgrade-plan.md`.
>
> Backup trạng thái trước nâng cấp: nhánh `backup/solar-before-visual-upgrade`, tag `solar-before-visual-upgrade`
> (commit `2a4a82c`). Triển khai trên nhánh `feat/solar-visual-upgrade`.

---

## 1. Chẩn đoán đã kiểm chứng

| # | Vấn đề | Bằng chứng | Vị trí |
|---|---|---|---|
| 1 | **Tour bay xuyên lòng Mặt Trời** | Monte Carlo 20.000 lần theo đúng công thức CameraRig: Thủy→Kim 25%, Kim→Đất 19%, Đất→Hỏa 16%, Hỏa→Mộc 8% → ~54% lượt tour có ≥1 lần camera chui qua Mặt Trời (chớp sáng cả màn) | `scene3d/CameraRig.tsx` |
| 2 | **Nền sao ngốn VRAM + vỡ khối** | three đổi nền equirect → `WebGLCubeRenderTarget(image.height)` + mipmap: bản 4K ≈ 180MB VRAM, 2K ≈ 45MB; nhánh 4K chọn khi `innerWidth×dpr ≥ 1600` (hầu hết tablet). `stars_2k.webp` 14KB (0,05 bit/pixel), còn 1.264 màu, khối nén 16px bị phóng ~3,5× thành ô ~55px. Modal mở context thứ 2 với nền 2K nữa → nghi phạm context lost trên tablet rẻ | `scene3d/StarsBackground.tsx`, `scripts/convert-textures.mjs` |
| 3 | **Tier cao mất tone mapping + khử răng cưa** | `EffectComposer` tự đặt `gl.toneMapping = NoToneMapping`, `Effects.tsx` không thêm lại → đo được toneMapping=0 ở tier cao, tier thấp ACES → 2 tier lệch màu, tụt tier giữa chừng màu "nhảy". `multisampling={0}` + dpr 1 → răng cưa | `scene3d/Effects.tsx` |
| 4 | **Quỹ đạo quay ngược** | Đo trên scene: Trái Đất quay quanh Mặt Trời theo chiều kim đồng hồ nhìn từ cực Bắc (+Y) nhưng tự quay ngược chiều kim đồng hồ. Thực tế cả hai ngược chiều kim đồng hồ ⇒ Sao Kim (quay ngược thật) lại trông như quay thuận | PlanetMesh, MoonMesh, DwarfPlanetMesh, Comet, CustomPlanetMesh, AsteroidBelt |
| 5 | **Góc tới nơi hên xui** | Offset camera cố định (0.45, 0.4, 0.85), không xét hướng Mặt Trời ⇒ 50% lượt thấy dưới nửa đĩa sáng, 32% chỉ thấy lưỡi liềm <25% | CameraRig |
| 6 | **Hành tinh "phẳng"** | Ambient 0.15 sau mã hoá sRGB làm mặt đêm sáng ~25–30% mặt ngày; tắt thử ambient → lằn ranh ngày/đêm sắc nét | `scene3d/Scene3D.tsx` |
| 7 | **Chặng "Vành đai" đứng ở Sao Hỏa** | `asteroid-belt` không có trong registry → CameraRig bỏ qua bay | CameraRig, `data/solarTour.ts` |
| 8 | **Cao trào bị modal che** | Bay 3,4s (mục tiêu cũ ≤2s) rồi modal phủ kín; tablet dọc hành tinh còn khung 256px, vành Sao Thổ bị cắt; context WebGL thứ 2 | `pages/SolarSystemPage.tsx`, `solar/PlanetDetail.tsx` |
| 9 | **Chạm nhầm** | Menu "Chọn thiên thể" bị cột nút trái đè (cùng `z-50`); nhãn chồng nhau (tâm nhãn Sao Thổ bị nhãn Sao Mộc đè → chạm Sao Thổ ra Sao Mộc); nhãn không bị Mặt Trời che | SolarSystemPage, PlanetMesh |
| 10 | **Vượt ngân sách hình học** | 43 draw call, ~93k tam giác/frame (tổng 123k) vs ngân sách cũ <40 call / <60k. 44% tam giác là 1.500 viên đá (Dodecahedron 36 tam giác), 7 mặt trăng/Pluto vài pixel mà mỗi cái 2.976 tam giác | AsteroidBelt, MoonMesh |
| — | Còn lại từ audit trước | Khí quyển viền cứng (cường độ 0,27→1,0 rồi cắt phụt, không theo hướng Mặt Trời; dùng chung 4 nơi); Mặt Trời ảnh tĩnh; đuôi sao chổi hình nón; vành Sao Thổ không nhận sáng/không bóng | AtmosphereRim, Sun, Comet, PlanetRings |

### Đính chính các ý tưởng bị loại
- ~~Tự xoay camera khi rảnh~~ — trái quy tắc "camera không bao giờ tự di chuyển ngoài thao tác của trẻ".
- ~~Sao nhấp nháy~~ — ngoài vũ trụ sao không lấp lánh (do khí quyển Trái Đất) → biến thành fun fact.
- ~~Vệt sao warp khi 🚀~~ — 🚀 tăng tốc *thời gian*, camera không bay → thay bằng vệt quỹ đạo dài ra.
- ~~God rays~~ — cần không khí để tán xạ; dùng vành nhật hoa (hiện tượng thật) thay thế.

## 2. Nguyên tắc
1. **Điện ảnh nhưng đúng khoa học** — mỗi hiệu ứng là hiện tượng thật (tối rìa Mặt Trời, bóng vành Sao Thổ, nhật hoa, cực quang) hoặc hiệu ứng máy ảnh ở mức nhẹ.
2. **Hành tinh là nhân vật chính lúc tới nơi** — không để modal cướp cao trào.
3. **Lấy lại ngân sách trước rồi mới tiêu** — mọi hiệu ứng mới gắn tier; tier thấp giữ bản rẻ.
4. Giữ các quy ước cũ: không setState trong vòng frame, asset qua `BASE_URL`, credit CC BY, màu Sao Hải Vương nhạt, `prefers-reduced-motion`.

## 3. Lộ trình

### GĐ0 — Sửa nền (~2 ngày)
- Tone mapping thống nhất **Khronos Neutral** cho cả 2 tier (giữ màu texture, chỉ nén vùng rất sáng → lõi Mặt Trời trắng-nóng); `multisampling={4}` cho composer.
- Đường bay mới: hàm thuần `planFlight()` — tween cố định ~1,8s ease-in-out, vòng cung trên mặt phẳng quỹ đạo khi đường thẳng đi gần Mặt Trời. Vitest Monte Carlo: 0% xuyên Mặt Trời.
- Góc tới nơi `heroPose()`: camera lệch ~50° so với hướng Mặt Trời (~80% đĩa sáng), Trái Đất ~70° (lộ đèn thành phố), luôn nhìn từ trên mặt phẳng quỹ đạo.
- Ambient 0.15 → ~0.04 + viền mờ mặt đêm.
- Đổi chiều quỹ đạo (6 file).
- Chặng vành đai có pose camera riêng trong vành đai.
- Menu `z-[60]`; ẩn nhãn hành tinh đang focus/nằm sau Mặt Trời; nhãn đè nhau thì nhãn xa nhường.
- Nền sao tạm: cầu lộn trong bám camera (bỏ bước cubemap).
- Lấy lại ngân sách: đá Icosahedron, mặt trăng/Pluto/nhân sao chổi cầu 16×12, gộp 10 đường quỹ đạo.
- Công cụ: `?seed=`, `?tier=low|high`, `?debug=perf`, hook `useReducedMotion`.

### GĐ1 — Bầu trời & ánh sáng (~2,5 ngày)
- Sao 2 lớp: Ngân Hà 1K đã tách sao + làm mờ + dither; `Points` sao thật từ Yale Bright Star Catalog (độ sáng→cỡ, B–V→màu), không nhấp nháy, quay về hệ toạ độ thiên hà cho khớp texture.
- Khí quyển v2 (tương thích 4 nơi dùng): mờ dần ra ngoài, chỉ sáng phía ngày, ửng cam hoàng hôn.
- Sao Thổ: bóng hành tinh lên vành + bóng vành lên hành tinh (giao tia trong shader).
- Quỹ đạo thành vệt màu hành tinh mờ dần phía sau; 🚀 vệt dài ra.
- Mặt Trăng có texture.

### GĐ2 — Mặt Trời sống (~2 ngày)
- Bề mặt: tối rìa I = 1 − 0,6(1 − μ) + sôi bằng flow-map (mọi tier) + granule (tier cao).
- Vành nhật hoa: streamer trôi chậm + vòng lửa rìa, màu HDR cho bloom.
- Sao chổi: đuôi hạt tính 100% trên GPU (ion xanh thẳng + bụi vàng cong).
- Lens flare nhẹ cho tier cao.

### GĐ3 — Khoảnh khắc tới nơi (~2–3 ngày)
- Chế độ "Tới nơi" thay modal: hành tinh ~60% màn hình (`setFocalOffset`), thẻ kiểu TourCard + nút 📖 Chi tiết (modal cũ), 🎯 Thử thách, 🔊.
- Thuyết minh khớp hình: Sao Mộc xoay Vết Đỏ Lớn ra, Trái Đất xoay Việt Nam ra giữa + ghim "📍 Việt Nam mình ở đây", Sao Hỏa → Olympus Mons.
- Chặng vành đai: camera lướt giữa các viên đá. Tiếng "vút" khi bay.
- Intro 3 giây từ ngoài vào — chạm để bỏ qua, tắt khi reduced-motion, chỉ chạy một lần mỗi phiên.

### GĐ4 — Mở rộng
- "📅 Ngày đặc biệt, các hành tinh ở đâu?" — vị trí thật theo ngày (tham số quỹ đạo gần đúng JPL), là "ảnh chụp" tại ngày đó (chu kỳ nén làm lệch dần khi chạy tiếp).
- Chòm sao bật/tắt (dùng catalog GĐ1).
- Bão Mặt Trời → cực quang ở hai cực Trái Đất.
- Trái Đất biển lấp lánh + bóng mây.

## 4. Ngân sách (ước tính)
| | Trước | Sau GĐ0–1 | Sau GĐ3 |
|---|---|---|---|
| Tam giác (tối đa) | 123k | ~72k | ~75k |
| Draw call | 43 | ~35 | ~38 |
| VRAM texture (tablet, tier cao) | ~230MB | ~60MB | ~60MB |
| WebGL context khi xem hành tinh | 2 | 2 | 1 |

## 5. Nghiệm thu & kiểm chứng
- Vitest: `planFlight` Monte Carlo 0% xuyên Mặt Trời; `heroPose` cho 70–90% đĩa sáng ở mọi vị trí quỹ đạo; hướng quỹ đạo ngược chiều kim đồng hồ nhìn từ +Y.
- Screenshot cùng `?seed=` trước/sau cho: tổng cảnh, cận Mặt Trời, Trái Đất, Sao Thổ, chặng vành đai × tier cao/thấp.
- `?debug=perf` đọc renderer.info: ≤75k tam giác, ≤40 call.
- Hồi quy: Xưởng Hành Tinh (PlanetModel dùng AtmosphereRim + SaturnRings), Kích thước thật, Cắt hành tinh, modal Planet3D, view 2D (`?view=2d`).
- Chưa kiểm chứng được trong môi trường dev: hiệu năng tablet yếu thật, VRAM đo trên thiết bị.

---

## 6. Trạng thái triển khai (24/09/2026, nhánh `feat/solar-visual-upgrade`)

Đã làm **toàn bộ GĐ0–GĐ4** + nâng cấp "Cắt hành tinh". Kiểm chứng trên trình duyệt (Intel Iris Xe, pane 800×907, dpr 1):

| Hạng mục | Kết quả đo |
|---|---|
| Tam giác / draw call (tier cao, toàn hệ) | 123k → **~69k** / 43 → 49 (gồm các pass bloom + ToneMapping) |
| Tier thấp (`?tier=low`) | ~49k tam giác, 31 call, 60fps |
| Cận cảnh Mặt Trời | 33fps → **60fps** (flow-map lấy mẫu texture thay noise, prominence chỉ tính sát rìa) |
| VRAM nền trời | ~180MB (4K) / 45MB (2K) → **~3MB** (Ngân Hà 1K trên cầu + 9.096 điểm sao) |
| Vitest mới | `orbit.test.ts` (chiều quỹ đạo, góc tới nơi 70–90% sáng, Monte Carlo 0% xuyên Mặt Trời), `astro.test.ts` (Trái Đất ở 180° lúc xuân phân 2026), `cutawayHeat.test.ts` |

### File chính
- Mới: `scene3d/sceneParams.ts` (seed/tier/debug/intro/reduced-motion), `orbit.ts` (quỹ đạo CCW, `heroPose`, `planFlight`, `beltPose`), `astro.ts` (vị trí thật JPL + địa danh), `planetSurface.ts` (viền đêm + bóng vành), `LabelDeclutter.tsx`, `FeatureSpotlight.tsx`, `SolarStorm.tsx`, `PerfOverlay.tsx`, `glslNoise.ts`, `solar/ArrivalCard.tsx`, `scripts/build-sky.mjs` (+ `npm run sky`).
- Viết lại: `Sun`, `StarsBackground`, `AtmosphereRim`, `PlanetRings`, `EarthSurface`, `Comet`, `OrbitLines` (→ `OrbitTrails`), `CameraRig`, `Scene3D`, `Effects`, `AsteroidBelt`, `MoonMesh`, `DwarfPlanetMesh`.
- Asset: `public/sky/{stars.bin,constellations.json,sky-meta.json}`, `textures/{milkyway,moon,earth_ocean}.webp`; đã gỡ `stars_2k/4k.webp`. PWA precache thêm `.bin`.

### Bẫy đã gặp khi làm (đừng tái phạm)
- Ảnh Ngân Hà của Solar System Scope dùng hệ **thiên hà**, u = 0,5 − l/360 và **LẬT DỌC** (bắc thiên hà ở dưới) — dò tự động trong `build-sky.mjs` (đỉnh 227 vs ≤12), không đoán.
- CDS (cdsarc) chặn bot → tải BSC5 từ mirror Harvard TDC.
- `setFocalOffset` của camera-controls: Y dương đẩy mục tiêu LÊN, X dương đẩy sang TRÁI (đo thực tế).
- Tone mapping Neutral + phát sáng > 1 → màu bị khử bão hoà thành phấn nhạt (ruột Mặt Trời trong Cắt hành tinh) — giữ emissive vừa phải.
- `StarsBackground` phải co theo `camera.far` (modal far=100, Cắt hành tinh far=50) — không thì mất cả bầu trời.
- `PointsMaterial` không có `map` vẽ hạt vuông.

## 7. Nâng cấp "Cắt hành tinh"
- Mặt cắt vá `onBeforeCompile`: **đường ranh tối giữa các lớp** (đọc ra từng vỏ lồng nhau), **viền sáng mép vết cắt**.
- **Phát sáng theo NHIỆT ĐỘ THẬT** của lớp (đọc từ `temperature` trong `planetLayersData`) chứ không theo loại chất liệu: manti Trái Đất (~3.700°C, đá rắn) chỉ âm ỉ, lõi ~5.000°C rực, có dòng đối lưu trôi chậm; lớp lạnh không phát sáng.
- **Sóng sáng** chạy từ vỏ vào lõi khi mở múi / sau nhát chém; **tia lửa** bắn ra dọc vết chém.
- Lớp đang chọn **nổi lên** khỏi mặt cắt (nhô vào khoảng trống của múi) + rực nhẹ theo nhịp.
- Nền sao thật, quầng khí quyển mỏng, tone mapping Neutral đồng bộ với scene chính.
- **Bầu khí quyển bị cắt cùng hành tinh** (feedback 24/09): trước đó vỏ khí không bị khoét → nhìn qua múi thấy "ruột" vỏ khí sáng rực + lớp khí lơ lửng trên chỗ đã bổ. Giờ:
  - `AtmosphereRim` nhận `clippingPlanes` (cùng 2 mặt phẳng dao) và tính quầng theo **độ dày quang học** (giao tia với cầu khí, cắt phần sau hành tinh, 1 − e^(−k·d)) — đúng ở mọi góc, không cần giả định hành tinh che phần giữa. Áp dụng cho cả scene chính/modal/Kích thước thật/Xưởng.
  - `CutawayBody.atmosphere` (Trái Đất, Sao Kim, Sao Hỏa — `heightFrac` đã phóng to): mặt cắt dải khí trong mờ trên 2 vách, mật độ giảm theo hàm mũ (thang độ cao), gợn khí trôi nhẹ; chạm chọn được, có thẻ + fun fact; bóc lớp đầu tiên thì khí quyển "bay" mất trước. Hành tinh khí khổng lồ không cần — lớp khí ngoài cùng đã nằm trong `layers`.
