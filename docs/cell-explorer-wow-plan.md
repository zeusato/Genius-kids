# Làm mới "Khám Phá Tế Bào": lặn vào một thế giới đang sống

Ngày: 28/09/2026. Nhánh: `feat/cell-explorer-wow` (tag `cell-before-wow` = main trước khi làm).
Kế thừa: [cell-explorer-upgrade-plan.md](cell-explorer-upgrade-plan.md) (đợt 06/2026 đã đưa tế bào lên 3D thật, Phase 0–2).

## 1. Hiện trạng (đã xem trực tiếp trên dev server, 1280×800)

| Vấn đề | Biểu hiện |
| --- | --- |
| Đồ họa "khối cơ bản" | Nhân = quả cầu tím có chấm; lưới nội chất = một lò xo hồng quấn quanh nhân; ty thể = viên nang đỏ trơn; vi khuẩn = ba viên nang nâu lồng nhau. Không có chất liệu, không có ánh sáng môi trường, không có chuyển động sống. |
| Màng trong mờ gây "đục" | Nhìn xuyên màng fresnel thấy mọi thứ mờ, sai thứ tự vẽ; zoom vào nhân chỉ còn một mảng tím phẳng. |
| Nhãn chồng nhau | "Lưới Nội Chất" đè "Trung Thể", "Màng Tế Bào" bị header che. |
| Không có mục tiêu | Chỉ xoay + chạm + đọc panel chữ. Chưa có quiz, huy hiệu, thuyết minh, tour (Phase 3–5 của plan cũ còn bỏ ngỏ). |
| Trẻ 5–7 tuổi khó dùng | Panel toàn chữ, không đọc to, không có biểu tượng. |

So với Hệ Mặt Trời (đã có bloom, bầu trời thật, tour, quiz, cắt hành tinh), mục tế bào đang tụt một bậc.

## 2. Nghiên cứu: điều gì làm một trải nghiệm tế bào "wow"

| Tham chiếu | Bài học rút ra | Áp dụng |
| --- | --- | --- |
| *The Inner Life of the Cell* (XVIVO + Harvard, 2006) | Cảnh đáng nhớ nhất là protein vận động kinesin **đi bộ** trên vi ống chở túi hàng. Tế bào gây ấn tượng khi nó *đang làm việc*, không phải khi đứng yên. | Mọi bào quan đều chuyển động; túi hàng được "robot đi bộ" chở trên đường ray vi ống; chạm bào quan → xem nó làm việc. |
| *Cell Size and Scale* (Learn.Genetics, ĐH Utah) | Thanh trượt phóng từ hạt cà phê tới nguyên tử carbon là cách dạy tỉ lệ kinh điển. | Cảnh mở màn "lặn" từ mô gồm nhiều tế bào vào một tế bào + thước µm và độ phóng đại luôn hiện. |
| *Cellverse* (MIT CLEVR, VR) | Tính chân thực + tương tác giúp hiểu quan hệ không gian; có **nhiệm vụ** (chẩn đoán bệnh) thì khám phá có mục đích. | Trò "Truy tìm bào quan" chơi ngay trên mô hình 3D; hành trình protein có cốt truyện. |
| *Tinybop* (Plants, The Human Body — 4+) | Hình minh họa chân thực nhưng hợp tuổi, chạm/kéo trực tiếp, âm thanh vui; khám phá tự do cần động lực. | Nhãn có biểu tượng cho bé chưa đọc được, thuyết minh giọng Việt, tiến độ "Sổ tay khám phá". |
| three.js `MeshPhysicalMaterial` | Có sẵn iridescence (màng mỏng như bong bóng xà phòng), clearcoat, sheen. Transmission và Depth of Field tốn kém trên máy yếu. | Màng óng ánh + vật liệu "thạch" bóng ướt; hậu kỳ chỉ bloom + AO + vignette ở tier cao; không dùng DOF. |
| KHTN 6 (GDPT 2018) | Màng – chất tế bào – nhân; nhân sơ/nhân thực; động vật/thực vật (thành, lục lạp, không bào); sự lớn lên và sinh sản của tế bào (1 → 2 → 4); từ tế bào đến mô, cơ quan, cơ thể; thực hành kính hiển vi. | Cảnh mở màn mô → tế bào; thí nghiệm tưới nước, phân chia tế bào, vi khuẩn nhân đôi. |

## 3. Hướng mỹ thuật: "thế giới thạch phát sáng"

- Bào quan bóng ướt như kẹo dẻo trong suốt, màu sách giáo khoa giữ nguyên theo `cellData` (nhân tím, ty thể đỏ, Golgi cam…). Viền sáng nhẹ, chi tiết bên trong nhìn xuyên qua (mào ty thể, grana lục lạp, chất nhiễm sắc).
- Màng tế bào óng ánh cầu vồng, **có chiều dày**, thở phập phồng. Ô cửa sổ cắt luôn quay về phía camera (giống mô hình tế bào bổ đôi trong ảnh bìa hub). Trên mặt cắt thấy được lớp phospholipid kép khi zoom sát.
- Nền là "đại dương" xanh thẫm có hạt lơ lửng, sương mù theo chiều sâu. Bloom làm sáng các điểm năng lượng (ATP, ribôxôm, vi ống).
- 0 byte asset tải thêm: mọi hình khối sinh bằng code (procedural), mọi vân bằng shader.

## 4. Trải nghiệm

1. **Phòng thí nghiệm** — chọn mẫu: tế bào động vật · lá cây · giọt nước (vi khuẩn), mỗi thẻ có hình minh họa và nguồn gốc gần gũi.
2. **Lặn vào** (~6 s, chạm để bỏ qua, lần đầu mỗi phiên): nhìn qua thị kính thấy **mô** gồm nhiều tế bào → camera lao vào tế bào ở giữa, độ phóng đại đếm lên, ô cửa màng mở ra. Thước đo µm và chế độ kính (quang học → điện tử) hiện suốt buổi.
3. **Khám phá tự do** — xoay, zoom, đi xuyên vào bên trong. Nhãn có biểu tượng, tự ẩn khi chồng nhau hoặc bị màng che. Chạm → camera bay tới, bào quan sáng lên, phần còn lại mờ đi, bào quan **biểu diễn công việc** (nhân tiễn ARN qua lỗ nhân, ty thể bắn tia ATP, Golgi gửi túi hàng, lục lạp nhả bọt oxy, roi vi khuẩn quay…). Thẻ thông tin mới: 1 câu ngắn + "so sánh vui" + nút nghe; "Xem thêm" mở phần chi tiết cũ; nút ‹ › duyệt lần lượt.
4. **Sổ tay khám phá** — đánh dấu bào quan đã xem (lưu theo hồ sơ), đủ bộ → mở khóa thử thách.
5. **Truy tìm** — giọng đọc: "Tìm giúp tớ *nhà máy điện* của tế bào!", nhãn ẩn đi, bé chạm đúng hình khối trên mô hình 3D. Sai không phạt: bào quan bị chạm tự giới thiệu rồi cho thử lại. Hoàn thành → huy hiệu loại tế bào (`cellBadges`) + 10 ⭐.
6. **Thí nghiệm** (mỗi loại một cái):
   - Thực vật: **Tưới nước** — kéo thanh nước, không bào teo/căng, màng co tách khỏi thành (co nguyên sinh) → hiểu vì sao cây héo.
   - Động vật: **Phân chia tế bào** — nhiễm sắc thể co xoắn, xếp hàng, tách về hai cực theo thoi phân bào, tế bào thắt lại thành hai; tua được bằng thanh trượt.
   - Vi khuẩn: **Nhân đôi** — dài ra, ADN nhân đôi, thắt giữa, tách đôi; bộ đếm 20 phút/lần → 1, 2, 4, 8… triệu.
7. **Hành trình protein** (động vật) — tour có thuyết minh bám theo một "gói hàng": nhân → ribôxôm trên lưới nội chất → Golgi → túi hàng đi trên vi ống → xuất ra khỏi màng.

Giọng đọc: tự đọc cho Mầm non/Lớp 1 (như chế độ Ôn Tập), các lớp khác bấm 🔊. Âm thanh tổng hợp bằng Web Audio (tái dùng `solar/sfx`).

## 5. Kiến trúc kỹ thuật

```
src/components/cell/
  scene3d/
    params.ts        ?tier=low|high · ?debug=perf · ?intro=0 · ?seed=  (như solar/sceneParams)
    noise.ts         RNG có seed + simplex 3D (JS) cho hình khối tĩnh
    shell.ts         hình vỏ "hướng tâm" r(d): cầu / siêu elip (hộp bo, que) + sóng màng — CÙNG
                     một công thức ở JS và GLSL → mặt cắt khớp tuyệt đối với vỏ đang phập phồng
    materials.ts     vật liệu hữu cơ (Physical chỉ khi cờ `physical` + tier cao, còn lại Standard) + tiêm
                     shader: dim, highlight, vỏ hướng tâm, cửa sổ cắt, neo instance, jelly, wobble,
                     hoa văn mặt cắt (band) và mặt vỏ (surface); `useDisposable` dọn GPU khi đổi mẫu
    ShellLayer.tsx   vỏ 2 mặt + dải mặt cắt (tính CPU, raycast được) + protein neo trên vỏ + useCutWindow
    Stage.tsx        ánh sáng, Environment (Lightformer — không tải HDR), nền vòm gradient, sương mù
    Cytosol.tsx      hạt lơ lửng (Points shader, GPU thuần)
    Effects.tsx      lazy: Bloom + Vignette + ToneMapping Neutral (chỉ tier cao, KHÔNG N8AO)
    CellCameraRig    CameraControls + bay theo log-khoảng cách, cảnh lặn, khung hình chừa thẻ, homeScale
    CellLabels.tsx   nhãn Html + chống chồng (thử lệch lên/xuống/trái/phải) + ẩn khi bị màng che
    WorkFx.tsx       hạt "bào quan đang làm việc" khi thẻ mở (ARN, ATP, bọt ôxi, rác bị hút…)
    Tissue.tsx       mô nhiều tế bào cho cảnh lặn (instanced, luôn mount để biên dịch sẵn)
    organelles/*     mỗi bào quan một component; hình học thuần tách riêng (erGeometry.ts, placement.ts)
    cells/*          AnimalCell / PlantCell / BacteriumCell (+ nhân đôi) ; layouts.ts = hằng số bố cục
    experiments/*    Mitosis.tsx (tưới nước nằm trong PlantCell, nhân đôi trong BacteriumCell)
  ui/*               LabScreen + SpecimenArt, MicroscopeHud, OrganelleCard + DnaRibbon, FindGameOverlay +
                     useFindGame, CellNotebook, WateringPanel, TimelinePanel (phân chia / nhân đôi)
  notebookStore.ts   sổ tay khám phá (localStorage theo hồ sơ)
src/data/            cellData (thêm emoji/short/kid), cellStory, cellQuizData, mitosisStages, fissionStages
```

Quyết định không hiển nhiên:
- **Vỏ hướng tâm**: mọi vỏ (màng, thành, vỏ nhầy, màng nhân) là mặt cầu đơn vị được shader đẩy ra bán kính `r(d)·(1+δ(d,t))`. Cửa sổ = loại fragment có hướng (chuẩn hóa theo nửa kích thước) nằm trong nón quanh hướng camera. Dải mặt cắt tính trên CPU mỗi frame bằng đúng công thức đó → không cần stencil, không hở.
- **Sóng màng** là tổng vài hàm sin (không phải simplex) để JS và GLSL cho kết quả giống hệt nhau.
- Canvas vẫn **mount một lần** (bài học context-lost của đợt trước); đổi tế bào chỉ đổi cây con.
- Mọi chuyển động qua ref/uniform trong `useFrame`, không setState theo frame.
- Tier thấp: dpr 1, `MeshStandardMaterial`, không hậu kỳ, giảm số instance và phân đoạn.

Ngân sách: tier cao ≲ 300k tam giác, ≲ 60 draw call; tier thấp ≲ 120k.

## 6. Nội dung khoa học cần giữ đúng

- Kích thước thật dùng cho thước đo: tế bào động vật ~20 µm, tế bào lá ~50 µm, vi khuẩn E. coli ~2 × 0,8 µm. Các lớp màng, ribôxôm, trung tử được **phóng to có chủ ý** để nhìn thấy (ghi chú ở chân trang như mục Cắt hành tinh).
- Kính hiển vi quang học phóng đại hữu ích tối đa khoảng ×1.500–2.000; ribôxôm chỉ thấy bằng kính hiển vi điện tử.
- E. coli nhân đôi ~20 phút/lần khi điều kiện lý tưởng; động cơ roi quay khoảng 100 vòng/giây (có loài nhanh hơn nhiều).
- Nhiễm sắc thể: người có 46; mô phỏng vẽ 4 cặp cho dễ nhìn (ghi rõ trong thẻ).
- Giữ các sửa lỗi của đợt trước (funfact trung thể, id `cytoplasm`).

## 7. Lộ trình

| Giai đoạn | Nội dung | Trạng thái (28/09/2026) |
| --- | --- | --- |
| GĐ1 Nền tảng đồ họa | params, noise, shell, materials, Stage, Cytosol, Effects, camera, nhãn | ✅ |
| GĐ2 Tế bào động vật | màng + protein, nhân (lỗ nhân, chất nhiễm sắc, nhân con), lưới nội chất hạt/trơn + ribôxôm, Golgi + túi, ty thể có mào, tiêu thể, trung thể 9×3 + vi ống + túi hàng | ✅ (túi hàng chạy trên vi ống, chưa có "chân" kinesin) |
| GĐ3 Thực vật + vi khuẩn | thành xenlulôzơ, không bào nước, lục lạp có grana chảy vòng quanh; vỏ nhầy/thành peptidoglycan/màng, vùng nhân ADN vòng, plasmid, roi xoắn quay, lông | ✅ |
| GĐ4 Trải nghiệm | phòng thí nghiệm mới, lặn vào mô + HUD kính hiển vi, thẻ bào quan + thuyết minh, bào quan làm việc, sổ tay | ✅ |
| GĐ5 Chơi & thí nghiệm | Truy tìm + huy hiệu, tưới nước, phân chia tế bào, vi khuẩn nhân đôi | ✅ — **hành trình protein** để đợt sau |
| GĐ6 Kiểm thử | test hình học/nội dung/hồi quy, build production | ✅ 34 test; ⏳ đo fps trên tablet thật + điện thoại dọc |

## 8. Bài học triển khai (đo trên Intel Iris Xe, ANGLE/D3D11)

- **Biên dịch shader là nút thắt lớn nhất**, không phải số tam giác. Lần đầu vào (chưa có shader cache của Chrome) ~50 program; nếu vừa vẽ vừa biên dịch thì GPU process nghẽn → ~2 s mới ra một khung hình. Cách xử lý đã làm:
  - `ShaderWarmup` gọi `gl.compileAsync` (KHR_parallel_shader_compile) và **không vẽ frame nào** (`frameloop='never'`) tới khi xong; trang hiện màn "Đang chỉnh tiêu cự" bằng CSS.
  - Mô của cảnh lặn luôn mount (ẩn) để biên dịch cùng lượt; thí nghiệm đổi `warmKey` → biên dịch nền biến thể mới.
  - `MeshPhysicalMaterial` chỉ cho bề mặt chính (màng động vật, nhân, không bào, vỏ nhầy) qua cờ `physical`.
  - Bỏ N8AO: shader AO có vòng lặp, D3D11 unroll → mỗi pass ~2 s.
  - Vật liệu phải `transparent` ngay từ đầu nếu sẽ mờ dần (đổi opaque→transparent = đổi `#define OPAQUE` = biên dịch lại).
  - Tier cao đặt `gl.toneMapping = NoToneMapping` ngay trong `onCreated` (khóa cache program có toneMapping).
- **Đo trong browser pane**: kiểm `document.visibilityState` trước. Cửa sổ bị che → trình duyệt bóp ~0,5 khung/giây; số đo khi đó vô nghĩa, và `PerformanceMonitor` sẽ hạ tier oan → đã cho monitor tạm nghỉ khi trang ẩn.
- **Keyframe dùng `transform`** đè lên `-translate-x-1/2` của Tailwind → bảng lệch khỏi tâm; dùng thuộc tính `translate`/`scale` riêng.
- **Vật thể thò ra ngoài màng** (phụ huynh phát hiện): ống lưới nội chất trơn đi ngẫu nhiên không giới hạn. Nay có `bounds` + test hồi quy `organelles/containment.test.ts`.

## 9. Việc tiếp theo đề xuất

1. Hành trình protein (tour thuyết minh bám theo "gói hàng" nhân → ribôxôm → lưới nội chất → Golgi → vi ống → màng).
2. "Chân" kinesin bước đi dưới túi hàng khi zoom sát vi ống.
3. So sánh động vật ↔ thực vật đặt cạnh nhau; thêm tế bào đặc biệt (hồng cầu, nơron, tế bào cơ).
4. Đo trên tablet Android giá rẻ và điện thoại dọc; tinh chỉnh vị trí nhãn trên màn hẹp.
