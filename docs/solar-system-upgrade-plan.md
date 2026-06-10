# Phương án nâng cấp "Khám Phá Hệ Mặt Trời" theo dữ liệu NASA

> Tổng hợp ngày 10/06/2026 từ: NSSDC Planetary Fact Sheet, science.nasa.gov, NASA SVS, USGS Astrogeology,
> benchmark UX (NASA Eyes on the Solar System, Solar System Scope, Professor Astro Cat, Star Walk Kids),
> và phân tích kiến trúc react-three-fiber trên stack hiện có (three 0.181 / r3f 9.4 / drei 10.7).

---

## 1. Chẩn đoán hiện trạng

| Vấn đề | Vị trí | Mức độ |
|---|---|---|
| View chính là **3D giả** (CSS div + SVG ellipse, tilt 0.4) dù three.js/r3f/drei đã cài sẵn | `src/components/solar/SolarSystem.tsx` | Kiến trúc |
| `setState` mỗi frame trong rAF → **React re-render toàn bộ cây ở 60fps** (200 div asteroid + 8 hành tinh + SVG) | `SolarSystem.tsx:49` | Hiệu năng nghiêm trọng |
| Label tên hành tinh dùng `group-hover` nhưng không có class `group` ở cha → **không bao giờ hiển thị** | `Planet.tsx:52` | Bug UI |
| Sao Thủy chỉ 12px — trẻ 6 tuổi **không thể chạm trúng** (chuẩn NN/g cho trẻ em: ~2cm ≈ 48–60px) | `Planet.tsx` | UX trẻ em |
| Zoom chỉ có nút bấm; không pinch/wheel dù `react-zoom-pan-pinch` đã cài (không dùng) | `SolarSystemPage.tsx` | UX |
| 9 file GLB ~9.7MB chất lượng lệch nhau (uranus 0.05MB vs earth 2.31MB), chỉ dùng trong modal | `src/assets/models/` | Tải trang |
| Tốc độ quỹ đạo phía ngoài sai tỷ lệ Kepler; kích thước/khoảng cách px không theo một luật nén nhất quán | `solarData.ts` | Khoa học |
| Dữ liệu lỗi thời/sai so với NASA (chi tiết mục 3) | `solarData.ts` | Nội dung |
| Vành đai Saturn vẽ bằng `border` div xoay `rotateX(70deg)` | `Planet.tsx:36-49` | Thẩm mỹ |

---

## 2. Dữ liệu NASA chuẩn (nguồn: NSSDC Planetary Fact Sheet + science.nasa.gov, 6/2026)

| Hành tinh | Đường kính (km) | Khoảng cách (AU / triệu km) | Chu kỳ quỹ đạo (ngày) | Tự quay (giờ) | Nghiêng trục | Mặt trăng* | Vành đai |
|---|---|---|---|---|---|---|---|
| Sao Thủy | 4.879 | 0,387 / 57,9 | 88 | 1.407,6 | 0,03° | 0 | — |
| Sao Kim | 12.104 | 0,723 / 108,2 | 224,7 | **−5.832,5 (ngược)** | 177,4° | 0 | — |
| Trái Đất | 12.756 | 1,000 / 149,6 | 365,2 | 23,9 | 23,4° | 1 | — |
| Sao Hỏa | 6.792 | 1,524 / 228,0 | 687 | 24,6 | 25,2° | 2 | — |
| Sao Mộc | 142.984 | 5,204 / 778,5 | 4.331 | 9,9 | 3,1° | **101** (IAU 3/2026; 115 đã biết 4/2026) | Có (mờ) |
| Sao Thổ | 120.536 | 9,573 / 1.432 | 10.747 | 10,7 | 26,7° | **274** (NASA; 285 đã biết 3/2026) | Có (rực rỡ) |
| Sao Thiên Vương | 51.118 | 19,165 / 2.867 | 30.589 | **−17,2 (ngược)** | **97,8°** (lăn nghiêng) | 29 (8/2025, JWST) | Có (13 vành mờ) |
| Sao Hải Vương | 49.528 | 30,181 / 4.515 | 59.800 | 16,1 | 28,3° | 16 | Có (5 vành mờ) |

\* Số mặt trăng thay đổi liên tục — **lưu thành data có nhãn "tính đến tháng/năm", không hardcode vào text UI.**

- Mặt Trời: đường kính ~1,39 triệu km, bề mặt ~5.500°C, lõi ~15 triệu °C, tự quay ~25 ngày (xích đạo).
- Vành đai tiểu hành tinh: **2,2–3,2 AU** (giữa Sao Hỏa 1,52 AU và Sao Mộc 5,20 AU), Ceres ~940 km chiếm ~25% khối lượng vành đai.
- **Màu sắc thật (quan trọng cho UI):**
  - **Sao Hải Vương KHÔNG xanh thẫm** — nghiên cứu Irwin et al. 2024 (Oxford/MNRAS, NASA công nhận) tái xử lý ảnh Voyager 2: màu thật là **xanh nhạt pha lục, gần giống Sao Thiên Vương** (chỉ hơi xanh hơn). Gợi ý: `#8FBDD3` (Neptune) vs `#ACD8D8` (Uranus). Màu hiện tại `#304FFE` phải sửa.
  - Sao Kim ánh sáng khả kiến: **trắng kem vàng nhạt** (mây H₂SO₄), không cam. Gợi ý `#E8DCC3`.
  - Sao Mộc: tông kem/nâu nhạt dịu (`#D8C9A3`/`#A8754F`), nhạt hơn ảnh Juno đã tăng bão hòa.
  - Sao Thổ: vàng bơ nhạt `#DCC49A`; Sao Hỏa: đỏ cam gỉ sắt `#C1623F`; Sao Thủy: xám nâu `#8C8A87`.
- Ghi chú quy ước: app đang dùng đường kính **trung bình thể tích** (Earth 12.742), bảng NSSDC dùng **xích đạo** (12.756) — chọn 1 quy ước và ghi chú, cả hai đều là số NASA.

### 2.1. Lỗi dữ liệu phải sửa trong `solarData.ts`

| Mức | Vị trí | Hiện tại | Sửa thành (theo NASA) |
|---|---|---|---|
| 🔴 Cao | Jupiter facts | "hơn 79 mặt trăng" | "hơn 100 mặt trăng đã được công nhận (115 đã biết, tính đến 2026) — và vẫn đang tăng!" |
| 🟠 TB | Neptune màu + mô tả | `#304FFE`, "xanh thẫm bí ẩn" | Xanh nhạt `#8FBDD3`; biến thành fun fact: "Ảnh cũ của NASA làm Sao Hải Vương trông xanh đậm hơn thực tế!" |
| 🟠 TB | Saturn facts | "vành đai dày khoảng 1km" | "phần chính chỉ dày khoảng **10 mét**" (Cassini/NASA) — còn ấn tượng hơn |
| 🟡 Thấp | Asteroid belt | "Ceres chiếm 1/3 khối lượng" | "khoảng **1/4** (25%)" |
| 🟡 Thấp | Asteroid belt | "bằng 4% khối lượng Mặt Trăng" | "khoảng 3%" hoặc an toàn: "nhỏ hơn nhiều so với Mặt Trăng" |
| 🟡 Thấp | Earth | "70% là nước" | "71%" (khớp NASA chính xác) |
| ➕ Thêm | Saturn facts | — | "Sao Thổ có 274 mặt trăng — nhiều nhất hệ Mặt Trời!" |

Các số liệu còn lại (nhiệt độ, khoảng cách, đường kính, trọng lực, các fact về Sun/Mercury/Venus/Mars/Uranus) **đã được kiểm chứng đúng** với NASA — giữ nguyên.

---

## 3. Phương án UI/UX (đúc kết từ benchmark)

### Nguyên tắc tỷ lệ — bài học từ NASA Eyes & Solar System Scope
Tỷ lệ thật không thể hiển thị (Jupiter:Mercury = 29,3:1 đường kính; Neptune:Mercury = 78:1 khoảng cách).
Chiến lược 2 lớp:
1. **Mặc định "orrery thân thiện"**: tỷ lệ NÉN theo một luật power-law nhất quán (mục 4.2) — thứ tự và cảm giác "xa hơn = chậm hơn, to hơn" luôn đúng.
2. **Nút "Kích thước thật 🌍"** — khoảnh khắc dạy học 30 giây: Jupiter phình to bằng 11 Trái Đất, Mặt Trời nuốt màn hình, các hành tinh ngoài bay khỏi viewport kèm caption "Nếu đúng tỉ lệ, Sao Hải Vương sẽ nằm ở... tận nhà hàng xóm!" rồi nút to quay về.
3. Thêm dòng nhỏ trong app: "Kích thước và tốc độ đã được điều chỉnh để dễ quan sát" (tránh thắc mắc từ giáo viên/phụ huynh).

### Tính năng xếp hạng theo tác động / công sức

| # | Tính năng | Tác động | Công sức |
|---|---|---|---|
| 1 | **Label tiếng Việt luôn hiển thị** (sửa bug `group`, label = vùng chạm — pattern NASA Eyes) | Rất cao | Vài giờ |
| 2 | **Vùng chạm ≥48–60px** cho mọi hành tinh (hit sphere vô hình) | Cao (điều kiện tiên quyết) | 1–2 ngày |
| 3 | **Camera fly-to khi chọn hành tinh** (≤2s, ease, pattern đặc trưng NASA Eyes) | Cao | 2–4 ngày |
| 4 | **Điều khiển thời gian**: ⏸ / 🐢 / 🐇 / 🚀 (pause, 1x, 5x, 20x) — dạy chu kỳ quỹ đạo trực quan | Cao | 1–3 ngày |
| 5 | **Đọc to tiếng Việt** (Web Speech API vi-VN + fallback ~9 MP3) — mở khóa nhóm 5–7 tuổi chưa đọc thạo | Cao | 3–5 ngày |
| 6 | **Quiz + huy hiệu "Thu thập đủ 8 hành tinh"** (tái dùng hạ tầng quiz sẵn có; vòng lặp Professor Astro Cat: fact → 1-3 câu hỏi → sticker) | Rất cao | 1–2 tuần |
| 7 | **Nút "Kích thước thật"** (mục trên) | Cao | ~1 tuần |
| 8 | **Tour "Du hành Hệ Mặt Trời"**: 8 chương 30–60s, fly-to → đọc fact → 1 câu quiz → chạm để tiếp | Cao | 1–2 tuần (sau #3,4,5) |
| 9 | **So sánh với Trái Đất** ("Sao Mộc = 11 Trái Đất") trong mọi thẻ thông tin | TB-cao | ~1 tuần |
| 10 | **Mặt Trăng** (trẻ thấy hằng đêm) → sau đó Galilean moons, Titan | TB | ~1 tuần |
| 11 | **Sao Diêm Vương + hành tinh lùn** ("vì sao bị giáng cấp?" — bài học phân loại khoa học) + sao chổi quỹ đạo dẹt | TB | 1–2 ngày |
| 12 | Nhạc nền + hiệu ứng âm thanh chạm | Thấp-TB | 1–2 ngày |

### Quy tắc UX trẻ em (5–12) áp dụng xuyên suốt
- Tách 2 chế độ trình bày: **5–8 tuổi** (audio-first, label 1–3 từ, không cuộn) và **9–12 tuổi** (đoạn mô tả hiện tại đã chuẩn độ dài).
- Chỉ chạm đơn; nút zoom giữ song song với pinch; nút quay lại to, luôn hiện; không thao tác phá hủy.
- Tôn trọng `prefers-reduced-motion`; camera không bao giờ tự di chuyển ngoài thao tác của trẻ; luôn có nút pause.
- Phần thưởng: sticker/sparkle/âm thanh tích cực, sai thì "thử lại nhé!" — **không** streak, không timer, không phạt.
- Font: ≥18px thân bài, ≥24px tiêu đề, tránh weight mỏng (dấu tiếng Việt bị nhòe).
- Cổng phụ huynh/giáo viên (giữ nút 3 giây): cài đặt, kết quả quiz, chế độ chiếu lớp học.

---

## 4. Kiến trúc kỹ thuật: thay CSS orrery bằng 3D thật (1 Canvas R3F)

### 4.1. Cây component
```
SolarSystemPage (chrome DOM: nút back, dropdown, MusicControls, modal — giữ nguyên React)
└─ <Canvas dpr={[1,1.5]} frameloop={detailOpen ? 'never' : 'always'}
          camera={{fov:45, position:[0,30,62]}} gl={{antialias:true, stencil:false}}>
   ├─ <color attach="background" args={['#030615']} />   // bỏ <img> galaxy.png full-screen
   ├─ SimClockProvider        // ref {t, timeScale} — KHÔNG BAO GIỜ là React state
   ├─ <Sun/>                  // meshBasic HDR toneMapped=false + sprite glow additive + pointLight decay=0
   ├─ <Planet/> × 8           // 1 SphereGeometry(1,48,32) DÙNG CHUNG, scale theo bảng 4.2
   │   ├─ hit sphere vô hình (visible=false vẫn raycast được — vùng chạm to, 0 draw call)
   │   ├─ <AtmosphereRim/>    // shader fresnel ~10 dòng (Earth/Venus/Mars/Neptune) — "wow rẻ nhất"
   │   ├─ <Clouds/> (Earth), <Rings/> (Saturn: RingGeometry + remap UV + texture alpha strip)
   │   └─ <Html> label tiếng Việt (DOM → dấu tiếng Việt nét)
   ├─ <OrbitLines/>           // 8 lineLoop, geometry vòng tròn 128 điểm dùng chung
   ├─ <AsteroidBelt/>         // 2 × InstancedMesh 750 instance, matrix ghi 1 lần, xoay GROUP
   ├─ <Stars count={2500}/>   // drei, 1 draw call (hoặc texture nền 8k_stars_milky_way)
   ├─ <Effects/>              // React.lazy: Bloom — CHỈ tier cao
   ├─ <CameraRig/>            // drei CameraControls: pinch/wheel/orbit + fly-to setLookAt (Promise)
   └─ <PerformanceMonitor onDecline={dropTier}/>  // tự hạ: dpr 1.5→1, tắt bloom, 1500→600 asteroid
```
- **Xóa hẳn** state machine pan/zoom DOM trong `SolarSystemPage.tsx` (handleMouse*/handleTouch*/zoomLevel/viewOffset) — CameraControls đảm nhận toàn bộ cử chỉ. Nút +/− cũ nối vào `controls.dolly(±8, true)`.
- Chọn hành tinh → `await controls.setLookAt(...)` (~1,5s) → `timeScale = 0` (hành tinh không trôi) → mở PlanetDetail; đóng → khôi phục.
- **Sphere + texture thay GLB** cho main view: 9 GLB (~9.7MB, chất lượng lệch) → 8 texture KTX2 (~1.5–2MB), ánh sáng đồng nhất. GLB giữ tạm trong modal đến P5 rồi xóa.

### 4.2. Công thức tỷ lệ (nén power-law, dẫn xuất từ số NASA — đây là "theo dữ liệu NASA" đúng nghĩa)
```
Khoảng cách:  d = 9.4 × AU^0.48      (scene units)
Bán kính:     r = 0.007 × D_km^0.45
Mặt Trời:     R = 2.5 (cố định — nếu theo công thức sẽ nuốt quỹ đạo Sao Thủy)
Chu kỳ scene: T = 16s × (chu_kỳ_năm)^0.6   // Kepler nén — thứ tự & cảm giác đúng
Tự quay:      S = 8s × (|giờ|/24)^0.5 × sign  // Venus/Uranus quay NGƯỢC, Uranus nghiêng 97.8°
```

| Thiên thể | AU | d (units) | r hiển thị | r vùng chạm | T quỹ đạo (1x) |
|---|---|---|---|---|---|
| Sao Thủy | 0,387 | 5,96 | 0,32 | 1,0 (~62px) | 6,8s |
| Sao Kim | 0,723 | 8,04 | 0,48 | 1,0 | 12,0s |
| Trái Đất | 1,000 | 9,40 | 0,49 | 1,0 | 16,0s |
| Sao Hỏa | 1,524 | 11,51 | 0,37 | 1,0 | 23,4s |
| Vành đai | ~2,7 | 15,14 | — | torus | — |
| Sao Mộc | 5,204 | 20,75 | 1,45 | 2,2 | 70,6s |
| Sao Thổ | 9,573 | 27,75 | 1,33 | 2,6 (phủ vành) | 121,8s |
| Sao T.Vương | 19,19 | 38,82 | 0,92 | 1,8 | 228,4s |
| Sao H.Vương | 30,07 | 48,15 | 0,91 | 1,8 | 342,2s |

Kiểm tra: quỹ đạo trong cùng = 2,38 × R_sun (✓ ≥2x); ngoài cùng 48,15 < 50 (✓ camera mặc định bao trọn); Sao Thủy chỉ ~10px hình ảnh nhưng vùng chạm ~62px (✓ chuẩn trẻ em).
- Quỹ đạo elip: chỉ làm cho **Sao Thủy** (e=0,206 — điểm dạy học "quỹ đạo dẹt, Mặt Trời lệch tâm"); 7 hành tinh còn lại tròn (e<0,1, khác biệt dưới 1px). Bỏ độ nghiêng quỹ đạo (≤7°, chỉ gây nhiễu).
- Nghiêng trục áp vào MESH: Earth 23,4°, Mars 25,2°, Saturn 26,7° (vành nghiêng theo), **Uranus 97,8° lăn nghiêng** — khoảnh khắc thị giác đắt giá.

### 4.3. Ngân sách hiệu năng (tablet Android 2GB là chuẩn đo)
| Kỹ thuật | Chi tiết | Lợi ích |
|---|---|---|
| **Không setState mỗi frame** | useFrame ghi thẳng `group.position`/`rotation` qua ref; React render ~0 lần/giây khi idle | Hết 60 lần reconcile + 200 style recalc/giây |
| Asteroid belt = InstancedMesh | 1.500 instance dodecahedron, matrix ghi 1 lần, xoay group; tier thấp: 600 | 200 div → 1 draw call |
| dpr [1, 1.5] + PerformanceMonitor | Tự hạ tier khi tụt fps | −44% fragment vs dpr 2; ổn định 30fps+ máy yếu |
| KTX2 (ETC1S): 2K gas giants, 1K nhỏ, 512 Uranus/Neptune | ~1,5–2MB mạng, ~6–8MB VRAM (PNG giải nén sẽ là ~45MB) | Tải route ≤2,5MB |
| `frameloop='never'` khi mở modal | GPU nghỉ hoàn toàn lúc trẻ đọc fact (phần lớn session) | Tránh 2 WebGL context sống cùng lúc — vector crash chính trên tablet 2GB |
| Draw call <40 (thực tế ~28), <60k tam giác | Geometry sphere + vòng tròn dùng chung | Trong giới hạn Mali-G52/PowerVR |
| 1 pointLight + ambient, **không shadow map** | Ranh giới ngày/đêm từ ánh sáng thường chính là "bóng" trẻ cần | Tiết kiệm 2–4ms/frame |
| Xử lý `webglcontextlost` | Overlay "Chạm để tải lại" | Không crash-trắng-màn |

### 4.4. Hiệu ứng hình ảnh (xếp theo wow/chi phí)
1. **Fresnel rim atmosphere** (Earth/Venus/Mars/Neptune): shader ~10 dòng, +4 draw call — gần như miễn phí, mọi tier.
2. **Vành Saturn thật**: RingGeometry 96 seg + remap UV radial + texture alpha strip 1024×64 — thay border-div; nghiêng 26,7° theo hành tinh.
3. **Sun glow**: sprite additive (mọi tier) + Bloom postprocessing `luminanceThreshold=1` (chỉ tier cao, lazy chunk — máy yếu không tải).
4. **Earth ngày/đêm + mây**: shader mix dayMap/nightMap theo `dot(normal, sunDir)` + sphere mây 1.015 quay chậm — chi tiết trẻ chỉ tay vào đầu tiên; tier thấp bỏ lớp mây.

### 4.5. Dependency
- **Thêm duy nhất**: `@react-three/postprocessing@^3` (~50–70KB gz, chỉ trong lazy chunk tier cao); promote `maath` (đã là transitive dep của drei, 0KB).
- **Không thêm**: gsap, leva, zustand, physics, lamina. Gỡ `react-zoom-pan-pinch` nếu không trang nào khác dùng.

---

## 5. Kế hoạch asset (nguồn NASA + giấy phép)

| Asset | Nguồn | Giấy phép | Xử lý |
|---|---|---|---|
| Texture 8 hành tinh + Sun + ring Saturn (alpha 8192×500) | Solar System Scope `solarsystemscope.com/textures/` (dẫn xuất ảnh NASA Messenger/Viking/Cassini) — URL pattern `…/download/2k_earth_daymap.jpg` đã verify sống | **CC BY 4.0** | → WebP/KTX2: 2K gas giants (~150–250KB), 1K đá, 512 Uranus/Neptune |
| Earth ngày (Blue Marble NG) | `eoimages.gsfc.nasa.gov/...73909/world.topo.bathy.200412.3x5400x2700.jpg` (verify sống) | Public domain (credit NASA Earth Observatory) | 2048×1024 WebP |
| Earth đêm (Black Marble 2016) | `eoimages.gsfc.nasa.gov/...144898/BlackMarble_2016_01deg.jpg` | Public domain | 1024×512 |
| Mây Earth | `eoimages.gsfc.nasa.gov/...57747/cloud_combined_2048.jpg` | Public domain | 1024×512 alpha |
| Mặt Trăng (khi thêm) | NASA SVS CGI Moon Kit `svs.gsfc.nasa.gov/4720/` | Public domain (credit NASA SVS) | 4K TIFF → 1K WebP |
| Nền sao | SSS `8k_stars_milky_way.jpg` (CC BY 4.0) hoặc NASA SVS Deep Star Maps 2020 `svs.gsfc.nasa.gov/4851/` (EXR → cần tone-map) hoặc ESO panorama (CC BY 4.0, credit "ESO/S. Brunier" phải hiển thị rõ) | như trên | 4096×2048 WebP q70 ≤900KB; bản 2048 cho màn nhỏ |
| GLB NASA chính chủ (tham khảo) | `science.nasa.gov/resource/<planet>-3d-model/` (VTAD, public domain) — verify sống nhưng 0.17–12.9MB/file | Public domain | KHÔNG dùng trực tiếp — quá nặng; sphere+texture tốt hơn |

**Ngân sách**: route solar-system tải lần đầu ≤2,5MB (gồm JS); toàn bộ section cache PWA ≤6MB.
**Bắt buộc**: thêm màn "Nguồn hình ảnh / Image credits": *NASA, NASA/GSFC Scientific Visualization Studio, USGS Astrogeology, Solar System Scope (CC BY 4.0), ESO/S. Brunier (nếu dùng)*. Không dùng logo NASA, không ngụ ý NASA bảo trợ app.
**Bonus**: `public/infographic/` đang 14,4MB PNG → WebP tiết kiệm ~70%.

---

## 6. Lộ trình triển khai

### Track A — Quick wins (làm ngay, độc lập với 3D, ~2–4 ngày)
1. Sửa bug label `group` + label luôn hiển thị (vài giờ).
2. Sửa toàn bộ dữ liệu sai/cũ theo mục 2.1; tách `moons_count` + `as_of` thành field riêng (nửa ngày).
3. Đổi màu Neptune/Venus/Jupiter theo màu NASA thật (mục 2) (1 giờ).
4. Vùng chạm ≥48px quanh planet div hiện tại (nửa ngày).
5. Nút thời gian ⏸/🐢/🐇/🚀 trên view CSS hiện tại (1 ngày — chỉ là 1 hệ số nhân).

### Track B — Nâng cấp 3D thật (P0→P5, ~9–10,5 ngày dev)
| Phase | Nội dung | Effort | Rủi ro chính |
|---|---|---|---|
| **P0** | Mở rộng `solarData.ts` (au, diameterKm, periodYears, rotationHours, axialTiltDeg, eccentricity — giữ nguyên string tiếng Việt); `scale.ts` + unit test bảng 4.2; pipeline texture KTX2; cài deps | 1d | Transcoder basis phải đi qua `import.meta.env.BASE_URL` (`/Genius-kids/`) — footgun GitHub Pages kinh điển |
| **P1** | Scene 3D tĩnh sau flag `?view=3d` (view cũ nguyên vẹn); Sun + 8 Planet + OrbitLines + Stars | 2–3d | **Test trên tablet rẻ thật ngay phase này**, không để cuối |
| **P2** | Chuyển động + tương tác: SimClock, quỹ đạo + tự quay, hit sphere, CameraControls + fly-to; xóa pan/zoom DOM cũ | 2d | Diff rủi ro nhất — gỡ handler bọc cả page; `touch-action: none` chống pull-to-refresh |
| **P3** | Asteroid belt instanced, vành Saturn thật, fresnel atmosphere, label `<Html>` | 1,5d | Thứ tự render transparent (ring/glow/atmosphere): kỷ luật `renderOrder` + `depthWrite=false` |
| **P4** | Earth ngày/đêm + mây, Bloom lazy, PerformanceMonitor tiers, overlay contextlost | 1,5–2d | EffectComposer tắt MSAA — không bao giờ kết hợp dpr 1.0 + bloom |
| **P5** | Bật mặc định 3D; port modal PlanetDetail sang sphere+texture; **xóa 9,7MB GLB**; gỡ galaxy.png, react-zoom-pan-pinch; cập nhật PWA glob (webp/ktx2/wasm); credit màn hình | 1d | Giữ CSS view làm fallback khi WebGL fail thêm 1 release |

### Track C — Tính năng giáo dục (sau Track B, theo thứ tự mục 3)
Quiz + huy hiệu → Đọc to tiếng Việt → "Kích thước thật" → Tour du hành → Mặt Trăng → Pluto/sao chổi → So sánh Trái Đất.

---

## 7. Rủi ro tổng hợp
1. Base path `/Genius-kids/`: mọi asset runtime (KTX2, wasm) qua `import.meta.env.BASE_URL`; deploy preview gh-pages trước khi merge.
2. 2 WebGL context (main + modal) đến P5 — giảm nhẹ bằng `frameloop='never'`; giải quyết triệt để khi merge modal ở P5.
3. GPU đời cũ (PowerVR/Mali cũ): blending additive sprite lớn có thể chậm — verify trên thiết bị thật ≥1 lần mỗi phase.
4. Attribution CC BY 4.0 phải hiển thị trong UI, không chỉ trong repo.
5. framer-motion modal + canvas sống cùng lúc gây tranh chấp main-thread — đã xử lý bằng frameloop='never'.
6. Số mặt trăng biến động: thiết kế thành data có nhãn thời điểm, cập nhật mỗi học kỳ.
