# Xưởng Cắt Giấy — báo cáo spike GĐ0

Ngày: 15/10/2026. Nhánh `feat/papercut-studio`. Phạm vi: các hạng mục 1–5 của “Việc tiếp theo” trong `docs/papercut-studio-plan.md` mục 17. Hạng mục 6 (đo trên tablet, quay video, duyệt hình) **chưa làm** vì cần thiết bị thật và người dùng.

## 1. Đã có

| Phần | File | Ghi chú |
|---|---|---|
| Hình học | `engine/geom.ts`, `engine/poly.ts` | Bọc clipper2-ts; lưới 0,001 mm; tự thử lại khi thư viện lỗi (mục 3) |
| Gấp | `engine/fold.ts` | `applyFold`, `foldStack`, `outline`, `layersAt`, `paperAreaIn`; gấp lõm/lồi/lật xấp |
| Cắt | `engine/cut.ts` | Một luật chung cho nét mở, khe, lỗ kín; mảnh vụn < 0,1 mm² không hiển thị; facets cập nhật tăng dần |
| Phát lại | `engine/recipe.ts`, `model.ts`, `engine/sheet.ts` | `applyOp`, `replay`; giấy vuông, chữ nhật, dải, tròn, lục giác |
| Hiển thị | `render/paperMesh.ts`, `render/maskTexture.ts`, `render/paperMaterial.ts` | Lưới 160², uốn trụ, mặt nạ 2048², hai mặt màu qua `gl_FrontFacing` |
| Bàn thử | `ui/DevBench.tsx`, route `/papercut?dev=1` | Không có trong menu. Thiếu `?dev=1` thì chuyển về `/crafts` |

Bàn thử có: kéo-gấp bằng chuột/cảm ứng (lõm hoặc lồi), bật về khi kéo dưới 1,2 cm, miết phẳng có hoạt ảnh, gấp nhanh (đôi dọc, đôi ngang, chéo), kéo cắt tự do, dập lỗ tròn, hoàn tác, mở một nếp, “Mở ra!” mở ngược từng nếp, bảng số đo. `window.__papercut` cho kiểm thử tự động.

## 2. Kiểm thử tự động

`npx vitest run src/papercut` (26 test, khoảng 6 s). Fuzz mặc định 150 chuỗi. Chạy `PAPERCUT_FUZZ=1000` cho mức GĐ0 (khoảng 70 s), `10000` cho GĐ1.

| Bất biến (plan 5.3) | Kết quả |
|---|---|
| Tổng diện tích facets = diện tích Sheet | Đạt. Sai số ≤ nửa ô lưới × (mép facet + mép Sheet); xấu nhất 0,05 cm² trên giấy bị cắt nát |
| Mở hết nếp → một facet, phép đồng nhất | Đạt |
| Phát lại recipe cho cùng Sheet | Đạt (so `toEqual` từng toạ độ) |
| Đối xứng D4 (gấp 3 nếp, cắt ngẫu nhiên 6 lần) | Đạt, lệch trung bình < 0,05 mm |
| Bông tuyết 6 cánh trên giấy lục giác | Đạt, lệch < 0,05 mm |
| Lưới hiển thị khớp engine (vị trí, độ cao lớp) | Đạt (`paperMesh.test.ts`) |

Fuzz 1 000 chuỗi: 10 492 thao tác, 4 621 nhát cắt, trung bình 5,9 ms/nhát. Clipper báo lỗi rồi được thử lại 100 lần; 8 phép trừ sai diện tích bị phát hiện và sửa bằng cách đổi lưới; 0 ca không sửa được.

## 3. Bẫy của clipper2-ts 2.0.1-18 (bản mới nhất trên npm)

1. **Treo vô hạn.** `doHorizontalClosed` lặp mãi ở `while (horz.vertexTop !== vertexMax)` với vài cấu hình cạnh ngang sau làm tròn (fuzz seq 33, 55). Cách xử lý ở `engine/clipperGuard.ts`: vá `ClipperBase.prototype` để giới hạn số lần gọi `updateEdgeIntoAEL` mỗi lượt quét (4 × số đỉnh + 1024). Vượt giới hạn thì ném lỗi, `execute()` của Clipper tự bắt và trả `false`, `poly.ts` thử lại ở lưới khác. Kết quả vẫn tất định.
2. **Trừ sai mà không báo.** `differenceD` đôi khi làm mất một đảo giấy (0,26 cm² ở seq 950, lưới 0,01 mm), trong khi `intersectD` với cùng dữ liệu vẫn đúng. Cách xử lý: `differenceKnown(a, b, removedArea)` kiểm tra bảo toàn diện tích; sai thì đổi lưới (4 → 5 → 3 chữ số).
3. `unionD(subject, fillRule)` dạng một tham số **bỏ qua** precision (rơi về 2 chữ số). Mọi phép đều đi qua `run()` trong `poly.ts`.

Kết luận: vẫn giữ clipper2-ts. Thư viện nhanh hơn polygon-clipping khoảng 9 lần, và cả ba lỗi đều có lớp bảo vệ được fuzz kiểm. Nếu ở GĐ1 (fuzz 10 000) còn ca “unresolved” thì cân nhắc vendor thư viện để sửa tận gốc.

## 4. Hiệu năng (máy bàn, Node 22; **chưa đo trên tablet**)

| Hạng mục | Đo được | Mục tiêu tablet |
|---|---|---|
| Nhát cắt 200 điểm qua 6 nếp (64 facet), gồm cập nhật facets | 41 ms (35 ms nếu dùng lưới 0,01 mm) | ≤ 30 ms |
| Nhát cắt điển hình (≤ 3 nếp) | 3–10 ms | — |
| Biến dạng lưới 160² trên CPU | 0,3–2 ms/khung | ≤ 2 ms |
| Vẽ lại mặt nạ 2048² | 0,1–1,5 ms | — |

Cắt qua 6 nếp **chưa đạt** mục tiêu tablet; có thể chậm hơn 2–3 lần trên máy thật. Đây là việc của GĐ1. Ba hướng xử lý: (a) gộp các facet cùng phép biến đổi trước khi giao; (b) lọc theo khung bao để bỏ facet không chạm nét cắt; (c) cho phép cắt chạy trong Web Worker, giao diện hiện vết cắt ngay rồi cập nhật sau.

Số fps trong ô trình duyệt của app không có ý nghĩa (khung bị hạn khi ô bị ẩn). Phải đo trên tablet thật.

## 5. Ảnh kiểm hình (`shots/`)

- `gd0-fold-bend.jpg`: vạt đang lật θ ≈ 110°, nếp uốn trụ mềm.
- `gd0-fold-backside.jpg`: vạt gần phẳng, mặt sau màu kem.
- `gd0-mouse-fold.jpg`: kéo góc bằng chuột, nhả tay thì giấy miết phẳng.
- `gd0-d4-open.jpg`: gấp 3 nếp (8 lớp), 3 nét cắt và 2 lỗ, mở ra thành hoa văn đối xứng D4.
- `gd0-hex-snowflake.jpg`: giấy lục giác gấp 3 nếp 60°, mở ra thành bông tuyết 6 trục.

## 6. Còn thiếu so với plan GĐ0

- [ ] Đo fps và thời gian cắt trên tablet chuẩn, quay video 20 s, **gửi người dùng duyệt hình** (cổng GĐ0).
- [ ] Chiếu đèn, vết nếp in lại, góc dư 4–8° sau khi mở, mảnh vụn rơi: thuộc GĐ3–GĐ4, chưa dựng trong spike.
- [ ] So mặt nạ raster với tam giác hoá facets khi phóng to (plan 6.1).
- [ ] Sơ đồ 2D mẫu (plan GĐ0 “một sơ đồ 2D mẫu”).
