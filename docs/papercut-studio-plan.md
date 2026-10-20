# Xưởng Cắt Giấy — kế hoạch sản phẩm và triển khai

Ngày lập: 15/10/2026. Trạng thái: **GĐ0 đang làm.** Engine gấp/cắt, fuzz và bàn thử `/papercut?dev=1` đã xong; còn đo trên tablet và cổng duyệt hình (xem mục 17 và `docs/papercut-studio/spike-report.md`). Module chưa gắn vào menu. Các con số hiệu năng ở mục 11 vẫn là mục tiêu.

Xưởng Cắt Giấy là xưởng thứ tư của Góc Thủ Công. Bé chọn một tờ giấy, gấp theo ý mình, cắt bằng kéo, đục lỗ, rồi **mở ra** để thấy hoa văn đối xứng hiện lên. Sau đó bé xuất được một **tài liệu hướng dẫn từng bước** (PDF hoặc ảnh) để gửi bạn, và bạn làm lại được bằng giấy thật.

Ba lời hứa với người dùng, xếp theo thứ tự ưu tiên:

1. **Linh hoạt, không cứng nhắc.** Gấp ở bất kỳ đâu, theo bất kỳ hướng nào, cắt bất kỳ hình gì, mở ra giữa chừng rồi gấp lại kiểu khác. Mẫu và nút gấp nhanh chỉ là lối tắt, không phải đường ray bắt buộc.
2. **Gấp và mở đẹp mắt.** Giấy uốn cong mềm như giấy thật, có độ dày, hai mặt màu, nếp gấp in lại sau khi mở. Lúc mở ra là khoảnh khắc chính, phải được dàn dựng.
3. **Chia sẻ được cách làm.** Từ đúng những thao tác bé vừa làm, sinh ra hướng dẫn ngắn gọn, đúng ký hiệu gấp giấy, kèm **mẫu in tỉ lệ 1:1** để bạn đặt lên giấy thật mà cắt.

---

## 1. Các quyết định nền tảng

| Nội dung | Phương án |
|---|---|
| Vị trí | Module `src/papercut/`, route `/papercut/*`, thêm `papercut` vào `CraftId` và `CRAFT_CATALOG` (thẻ thứ tư trong Góc Thủ Công). Mọi lớp, có chế độ bé cho Mầm non. |
| Thiết bị | Tablet **ngang** là chính (cùng hướng với Piano Nhí, Lắp Ghép). Hỗ trợ chuột, bút cảm ứng, điện thoại dọc. |
| Công nghệ | React Three Fiber đang có (three 0.181, R3F 9.4, drei 10.7). Một canvas 3D cho bàn làm việc. Sơ đồ hướng dẫn vẽ bằng Canvas 2D. |
| Mô hình giấy | Giấy phẳng gấp phẳng (gấp 180°). Hình học thuần TypeScript, đơn vị **cm**, tách khỏi React/Three. |
| Gấp | v1: mỗi lần gấp lật **cả xấp** nằm ở phía bị lật (simple fold). Gấp riêng lớp trên cùng để sau v1. |
| Cắt | Kéo vẽ tự do, kéo nét thẳng, kéo răng cưa/lượn sóng, dụng cụ dập lỗ hình. Cắt xuyên mọi lớp tại chỗ cắt. |
| Phép toán đa giác | Thêm **một** thư viện boolean đa giác (người dùng đã đồng ý 15/10). Ứng viên: `clipper2-ts` (bản TS của Clipper2, BSL-1.0, không dependency) hoặc `polygon-clipping` (MIT). Chốt ở GĐ0 bằng fuzz. |
| Thành phẩm | Lưu tác phẩm, xem mở xòe, chiếu đèn xuyên lỗ, “dán lên cửa sổ”, chụp ảnh, xuất hướng dẫn. |
| Dữ liệu | IndexedDB theo tài khoản và hồ sơ, theo khuôn `src/coloring/progress/artworkRepo.ts` và `src/pottery/persistence/repository.ts`. Bản ghi chính là **công thức** (chuỗi thao tác), rất nhẹ. |
| Ưu tiên | Cảm giác gấp → hiệu ứng mở → cắt chính xác → hướng dẫn xuất ra làm lại được bằng giấy thật → nội dung và thử thách. |

---

## 2. Nền tảng hiện có và điểm tích hợp

Đã đối chiếu với repo ngày 15/10/2026.

| Thành phần | Cách dùng |
|---|---|
| `src/components/hub/catalog.ts` | Thêm `papercut` vào `CraftId`, `CRAFT_CATALOG` (`route: '/papercut'`). Cập nhật `catalog.test.ts`. |
| `App.tsx` | Route tải lười `/papercut/*` cạnh `/pottery/*`, `/bricks/*`. |
| `src/components/CraftMenuScreen.tsx`, `HubShell`, `HubCard` | Thẻ sảnh và ảnh bìa (`art: 'papercut'`). Trang con dùng `HubShell` với `backLabel="Về Góc Thủ Công"`. |
| `src/bricks/export/pdf.ts` | Trình ghi PDF tối giản: mỗi trang là một ảnh JPEG A4, không cần thư viện, chữ Việt đã vẽ sẵn trên canvas. **Chuyển lên chỗ dùng chung** (`src/lib/export/pdf.ts`) rồi cả hai xưởng import. |
| `src/bricks/export/pages.ts` | Khuôn dựng trang A4 1240×1754: bìa, chân trang, `txt()`, `roundRect()`, tiến độ, `AbortSignal`. Tách phần dùng chung khi làm GĐ5. |
| `src/bricks/ui/ExportSheet.tsx`, `src/coloring/render/svg.ts` (`sharePng`) | Mẫu sẵn cho Web Share có file, tải PDF và xem trước trang. |
| `src/pottery/render/StudioCanvas.tsx` | Tham khảo dựng bàn làm việc 3D, ánh sáng, chuỗi hậu kỳ. Bẫy đã gặp: EffectComposer tắt tone mapping, phải có `<ToneMapping>` ở cuối chuỗi. |
| `src/contexts/StudentContext.tsx` (`completePottery`) | Thêm `completePapercut(owner, art)` theo cùng khuôn; khóa chống thưởng lặp. |
| `src/utils/speech.ts` | Đọc to từng bước khi bé xem lại hoặc làm theo hướng dẫn. |
| `scripts/bricks/shot.sh` | Cách chụp màn bằng Chrome headless để kiểm hình. Làm bản tương tự cho xưởng này. |

---

## 3. Trải nghiệm từ đầu đến cuối

### Phiên đầu tiên (khoảng 3 phút)

1. Bàn gỗ, trên có tấm lót cắt kẻ ô cm, một tờ giấy vuông 15 cm màu đỏ, cây kéo đầu tròn.
2. Bàn tay gợi ý (không chặn thao tác) kéo góc giấy chéo lên góc đối diện. Giấy uốn theo ngón tay. Thả tay thì giấy miết phẳng thành tam giác, có tiếng “xoẹt” nhẹ.
3. Gợi ý gấp tiếp một lần. Bé tự gấp hay bỏ qua đều được.
4. Bé cầm kéo, vẽ một đường cong từ mép này sang mép kia. Kéo chạy theo ngón tay, vết cắt hiện dần sau lưỡi kéo. Mảnh vụn rơi xuống bàn.
5. Nút lớn **“Mở ra!”**. Giấy mở từng nếp theo thứ tự ngược lại, camera kéo lại gần, hoa văn hiện ra. Cuối cùng có ánh đèn chiếu từ phía sau xuyên qua các lỗ.
6. Ba lựa chọn: **Cất vào sổ**, **Làm tiếp** (gấp lại để cắt thêm), **Chia sẻ cách làm**.

### Nguyên tắc “không cứng nhắc”

- **Không có thứ tự bắt buộc.** Được gấp, cắt, mở một nếp, cắt thêm, gấp lại theo cách khác, rồi mở. Mỗi lần mở một nếp vẫn giữ mọi vết cắt đã có.
- **Không có đáp án đúng ở chế độ Tự do.** Không chấm đẹp/xấu.
- **Mẫu là gợi ý có thể rẽ ngang.** Đang làm theo mẫu bông tuyết, bé được gấp khác hay cắt khác bất cứ lúc nào; app không kéo bé về và không báo sai. Khi bé đã đi khác mẫu, nhãn chuyển thành “Tác phẩm của em (lấy cảm hứng từ Bông tuyết)”.
- **Hoàn tác mọi thứ.** Hoàn tác và làm lại không giới hạn trong phiên. Mảnh vụn rơi cũng “bay ngược” về chỗ cũ khi hoàn tác.
- **Thử trước khi cam kết.** Đang kéo nếp gấp mà buông giữa chừng (dưới 40% hành trình) thì giấy bật về. Bút chì vẽ đường dự định trước, cắt sau, dùng khi bé muốn cẩn thận.

### Những lần quay lại

- **Sổ Cắt Giấy:** lưới các tác phẩm đã mở xòe. Chạm một tác phẩm để xem lại hoạt cảnh gấp, cắt, mở, để làm bản sao rồi sửa, hoặc để xuất hướng dẫn.
- **Cửa sổ trưng bày:** dán tối đa 6 tác phẩm lên ô cửa sổ. Ánh nắng chiếu bóng hoa văn xuống sàn, có chu kỳ ngày/đêm nhẹ.
- **Mẫu và thử thách** mở dần (mục 8).

---

## 4. Hợp đồng tương tác

### 4.1 Gấp

| Thao tác | Kết quả |
|---|---|
| Chạm một điểm **P** trên mép hoặc góc của xấp giấy rồi kéo tới **F** | Đường gấp là trung trực của đoạn PF. Phần chứa P lật theo ngón tay, có uốn cong mềm. Đây là cách gấp tự nhiên nhất: “đưa góc này tới chỗ kia”. |
| Thả khi đã kéo ≥ 1,2 cm | Giấy miết phẳng, nếp gấp hằn lại. Trong lúc kéo vạt luôn lật đủ θ = π, độ “nhấc” thể hiện bằng bán kính uốn (mục 5.5). |
| Thả khi kéo chưa tới 1,2 cm | Giấy bật về, không ghi vào lịch sử. |
| Kéo gần một đường “đẹp” | **Nam châm:** đường gấp hút vào đường đẹp gần nhất (góc lệch ≤ 4° và lệch ≤ 12 px màn hình), có tiếng tách nhỏ và nhãn như `½`, `¼`, `60°`, `góc → góc`. Kéo tiếp ra xa là thoát hút, gấp tự do tiếp. |
| Nút gấp nhanh (khay bên) | **Gấp đôi**, **Gấp chéo**, **Gấp tư**, **Gấp quạt** (n nếp), **Gấp bông tuyết** (6 hoặc 8 cánh), **Gấp hoa 5 cánh**. Mỗi nút chạy đúng chuỗi gấp như tay bé gấp, có hoạt ảnh, và ghi vào lịch sử thành từng nếp riêng. Nhờ vậy tài liệu xuất ra vẫn tách từng bước. |
| Hai ngón: xoay, thu phóng | Xoay xấp giấy trên bàn, phóng to để cắt chi tiết. Không ghi vào công thức, chỉ là góc nhìn. |
| Nút **Lật xấp giấy** | Lật mặt xấp (đảo trên/dưới). Có ghi vào công thức vì ảnh hưởng hình trong sơ đồ hướng dẫn. |
| Nút **Mở một nếp** | Mở nếp gần nhất (LIFO, giống giấy thật). Các vết cắt vẫn giữ. |

**Đường “đẹp” cho nam châm**, tính lại sau mỗi lần gấp từ đường viền xấp hiện tại:

- đường qua hai đỉnh (đường chéo);
- trung trực của hai đỉnh (đưa góc tới góc);
- phân giác góc giữa hai cạnh (đưa mép trùng mép);
- đường giữa song song với cạnh (½), và các đường ⅓, ¼;
- tia chia góc tại một đỉnh thành 2, 3 hoặc 5 phần bằng nhau. Đây là các tia cần cho bông tuyết 6 cánh (60°/30°) và hoa 5 cánh (36°).

**Giới hạn thật:** số lớp tại một điểm vượt 32 thì không cho gấp nữa. Khi đó hiện lời nhắc vui “Giấy dày quá rồi, kéo không cắt nổi đâu!”. Đây cũng là một bài học: giấy thật khó gấp quá 6–7 lần.

### 4.2 Cắt

| Dụng cụ | Hành vi |
|---|---|
| **Kéo tự do** | Vẽ bằng ngón tay. Cây kéo chạy theo, há/khép theo tốc độ; vết cắt hiện ngay sau lưỡi. Nét được làm mượt (Chaikin) và rút gọn (RDP). Nếu đầu hoặc cuối nét cách mép ≤ 12 px thì tự nối ra tới mép. |
| **Kéo thẳng** | Chạm từng điểm, nối thành đường gấp khúc. Hợp với hình sắc cạnh và thử thách “một nhát kéo”. |
| **Lưỡi răng cưa / lượn sóng** | Như kéo tự do nhưng mép cắt có hoa văn, mô phỏng kéo răng cưa thủ công. |
| **Bút chì** | Vẽ nét dự định, không cắt. Sau đó dùng kéo đi theo. Nét chì cũng được đưa vào mẫu in. |
| **Dập lỗ** | Tròn, tim, sao, giọt nước, trăng khuyết, lá. Kéo thả để đặt; hai ngón để xoay và đổi cỡ (tối thiểu 3 mm, cỡ thật). |

**Luật cắt** (giống giấy thật, cài trong engine):

- **Nét đi từ mép tới mép:** tách xấp thành các vùng. Vùng giữ lại là vùng có **diện tích giấy lớn nhất** (cộng mọi lớp). Các vùng khác rơi xuống bàn thành mảnh vụn. Hoàn tác được.
- **Nét đi từ mép vào trong rồi dừng:** tạo **khe** (cắt hở), không có mảnh rơi, nhưng ảnh hưởng tới việc giấy còn liền hay không.
- **Nét khép kín nằm hẳn bên trong:** đục lỗ. Trên giấy thật phải gập nhẹ để bấm mũi kéo, nên hướng dẫn xuất ra sẽ ghi chú điều này.
- **Cắt đứt hết nếp gấp:** khi mở ra, giấy rời thành nhiều mảnh. App vẫn cho làm, và khi mở ra thì các mảnh tách nhau một cách duyên dáng, kèm mẹo: “Chừa lại một đoạn nếp gấp để giấy còn nối nhau nhé!”. Đây chính là bí quyết của dây người nắm tay.
- **Nếu sau một nhát cắt chỉ còn dưới 10% giấy:** cho phép nhưng rung nhẹ cây kéo và hỏi “Cắt mất gần hết rồi, em có muốn hoàn tác không?”.

### 4.3 Chế độ bé (Mầm non)

- Nút gấp nhanh to, chỉ 3 kiểu: Gấp đôi, Gấp tư, Bông tuyết.
- Kéo tự do có hỗ trợ mạnh: nét luôn được nối ra mép, bỏ qua nét quá ngắn.
- Dập lỗ có sẵn hình to.
- Không có nút Lật xấp hay Mở một nếp, chỉ có “Mở ra!”.
- Lời hướng dẫn đọc to; không có chữ nào bắt buộc phải đọc.

---

## 5. Mô hình hình học (engine thuần)

### 5.1 Biểu diễn

```text
Sheet     = đa giác có lỗ, trong toạ độ GIẤY (cm, giấy chưa gấp)  — trạng thái duy nhất bị cắt
Fold      = { line: (điểm, vector pháp) trong toạ độ XẤP lúc gấp, side: phía bị lật }
Facet     = { region: đa giác trong toạ độ giấy, M: phép dời hình 2D (det ±1), layer: số nguyên }
FoldState = Sheet + Fold[]  →  Facet[] (suy ra, có cache)
Recipe    = Op[]  (giấy ban đầu, gấp, lật, cắt, dập lỗ, mở một nếp)
```

- **Sheet** là nguồn sự thật duy nhất của “giấy còn lại”. Gấp không đổi Sheet, chỉ đổi cách nó được xếp chồng.
- **Facets** được suy ra bằng cách áp lần lượt các nếp gấp. Với mỗi nếp: tách từng facet theo đường gấp; phần nằm ở phía lật được nhân thêm phép đối xứng qua đường gấp, đảo thứ tự lớp và đặt lên trên.
- **Mở một nếp** chỉ là bỏ Fold cuối rồi suy lại facets. Mọi vết cắt đã nằm sẵn trong Sheet nên tự động “được mở ra” đúng.

### 5.2 Cắt

1. Nét cắt trong toạ độ xấp được đổi thành một vùng bị loại:
   - nét mở → một dải rất hẹp (kerf 0,3 mm) cộng với các vùng rơi;
   - nét kín hoặc hình dập lỗ → vùng bên trong.
2. Với từng facet: đổi vùng đó về toạ độ giấy bằng `M⁻¹`, giao với `facet.region`, rồi trừ khỏi Sheet.
3. Tính các thành phần liên thông của Sheet. Nếu có từ hai thành phần trở lên, đánh dấu “giấy đã rời” để phần mở ra xử lý (mục 4.2).
4. Vùng rơi được tính trong toạ độ xấp: đường viền xấp trừ nét cắt cho ra các vùng; giữ vùng lớn nhất, các vùng còn lại rơi. Tiền ảnh của một vùng rơi luôn khép kín qua các nếp gấp (các lớp nối nhau qua nếp đều nằm cùng vùng), nên trừ tiền ảnh là đúng về mặt vật lý.

Có kerf nên phép boolean ổn định, và khe cắt hở hiện được thành một vết mảnh khi mở ra. Đây là lý do nghiêng về Clipper2: có sẵn phép nong polyline và toạ độ nguyên nên ít lỗi số học. GĐ0 sẽ so với `polygon-clipping` trên bộ fuzz.

### 5.3 Bất biến để test (fuzz 10 000 chuỗi thao tác ngẫu nhiên)

- Tổng diện tích facets bằng diện tích Sheet (gấp không làm mất hay sinh giấy).
- Mở hết các nếp thì facets trùng Sheet, mọi `M` là đồng nhất.
- Gấp k lần theo kiểu bông tuyết n cánh rồi cắt bất kỳ: Sheet bất biến dưới nhóm đối xứng nhị diện Dₙ (sai số ≤ 0,05 mm). Đây là test “toán học” đẹp nhất của module.
- Chạy lại một Recipe luôn cho cùng Sheet (tất định, có làm tròn lưới 0,01 mm).
- Hoàn tác rồi làm lại cho kết quả trùng từng bit với trạng thái trước.

### 5.4 Mô tả nếp gấp bằng lời (`engine/describe.ts`)

Dùng cho hướng dẫn xuất ra và cho giọng đọc. Thứ tự ưu tiên khi phân loại một nếp:

1. **Khớp mốc:** đường qua hai mốc trên viền xấp (đỉnh, trung điểm, điểm ⅓). Ví dụ: “Gấp đôi từ dưới lên”, “Gấp chéo: đưa góc phải lên trùng góc trái”, “Gấp sao cho mép trái trùng đường giữa”.
2. **Khớp góc chia:** “Gấp thành 3 phần bằng nhau, mỗi phần 60°”.
3. **Không khớp mốc:** “Gấp theo đường nét đứt, cách góc dưới 4,5 cm”. Số đo lấy cm thật, làm tròn 0,5 cm, và sơ đồ có ghi kích thước.

Hướng (lên, xuống, trái, phải) tính theo góc nhìn đã chuẩn hoá của sơ đồ ở bước đó, không theo góc bé đang xoay trên màn hình.

### 5.5 Thuật toán đã cài (GĐ0)

Code: `src/papercut/engine/fold.ts`, `cut.ts`, `src/papercut/render/paperMesh.ts`.

- **Gấp một facet:**
  - Đổi đường gấp (p, n) của toạ độ xấp về toạ độ giấy: p' = m⁻¹(p), n' = phần tuyến tính của m⁻¹ áp lên n.
  - Tách `region` bằng `halfPlane(p', n')`. Phần bị lật nhận m ← R ∘ m (R là phép đối xứng qua đường gấp).
  - Lớp mới: gấp lõm `2·top + 1 − layer`, gấp lồi `2·bottom − 1 − layer`.
  - **Không nén thứ hạng lớp**, để renderer tính z = 2T − z với T = (top + 0,5)·h cho ra đúng lớp như engine.
- **Lật xấp** coi như một mục trong danh sách nếp: phép đối xứng toàn xấp, đảo lớp. “Mở một nếp” bỏ mục cuối, kể cả mục lật.
- **Cắt dùng một luật chung cho mọi loại nét:**
  - K = kerf(nét) hoặc hình dập lỗ (toạ độ xấp); O = hợp các facet trong toạ độ xấp.
  - Tách O − K thành các thành phần. Giữ thành phần có diện tích giấy lớn nhất (cộng mọi lớp); các thành phần khác rơi.
  - Vùng bỏ = K ∪ các thành phần rơi. Với mỗi facet lấy `region ∩ m⁻¹(vùng bỏ)`, hợp lại rồi trừ khỏi Sheet.
  - Nét kín, khe hở và nét đi từ mép tới mép đều tự đúng với luật này, không cần phân loại nét.
  - Vì sao đúng: đường đi trên giấy không cắt qua tiền ảnh của K thì ảnh của nó trên xấp cũng không cắt qua K. Nên mỗi mảnh giấy thật nằm trọn trong một thành phần của xấp.
- **Uốn trụ khi lật vạt** (u = khoảng cách tới trục, θ = góc lật, r = bán kính uốn):
  - Khi u ≤ r·θ: φ = u/r, u' = r·sin φ, w' = r·(1 − cos φ).
  - Khi u > r·θ: đi tiếp theo tiếp tuyến (cos θ, sin θ) thêm một đoạn u − r·θ.
  - Khi θ = π: u' = −(u − π·r), w' = 2r. Lúc miết phẳng thì r co về độ dày giấy.
  - Đỉnh bị phản xạ tự đảo chiều tam giác, nên `gl_FrontFacing` tự đổi mặt trước/mặt sau đúng, không cần logic thêm.
- **Kéo-gấp bằng ngón tay:** lúc đang kéo, vạt luôn lật đủ θ = π quanh trung trực PF (góc giấy dính vào ngón tay). Độ “nhấc” thể hiện bằng r = clamp(0,25·|PF|, 0,3, 2) cm. Kéo chưa tới 1,2 cm thì bật về. Luật này thay cho luật “40% hành trình” ở mục 4.1.
- **Giấy in sẵn nét (mục 7.3):**
  - Lấy “mặt trên nhìn thấy” bằng cách duyệt facet từ lớp cao xuống: phần thấy = ảnh facet − phần đã bị che.
  - Vẽ tiền ảnh nét cắt trên từng phần thấy, trong toạ độ giấy.
  - Nếu mọi phần thấy có det < 0 thì thử mặt dưới kèm bước “lật xấp”. Nếu lẫn cả hai loại thì dùng mẫu đặt lên xấp.

- **Giấy được đặt tâm ở gốc toạ độ**, trục y hướng lên. Trong three: (x, cao, −y).
- **Facets sau khi cắt** được cập nhật tăng dần (region − tiền ảnh vùng bỏ), không gấp lại từ đầu, nên nhanh hơn khoảng 3 lần. Mỗi phép trừ đều kiểm bảo toàn diện tích (`differenceKnown`, xem spike-report mục 3).

---

## 6. Hiệu ứng gấp và mở

Đây là phần quyết định cảm giác “đẹp mắt”, nên được dựng thử và duyệt bằng video ngay ở GĐ0.

### 6.1 Lưới giấy và mặt nạ cắt

- Giấy được vẽ bằng **một lưới đều mịn** phủ khung bao của tờ giấy gốc: 160×160 ở mức Vừa, 256×256 ở mức Cao.
- Hình dạng sau khi cắt nằm trong một **texture mặt nạ** (2048², vẽ Sheet bằng Canvas 2D) và được bỏ pixel trong fragment shader. Mép được khử răng cưa bằng `fwidth`.
- Lợi ích:
  - không phải tam giác hoá lại mỗi lần cắt;
  - lưới đều nên uốn cong mượt;
  - một draw call;
  - mặt nạ dùng luôn cho bóng đổ (`customDepthMaterial` có alpha test).
- Kênh phụ của mặt nạ chứa **viền mép**, dùng để tô tối mép cắt cho có cảm giác độ dày giấy, và **vết nếp** (mục 6.3).
- Phương án dự phòng nếu mép mặt nạ bị mờ khi phóng to: tam giác hoá facets bằng `ShapeUtils` của three. GĐ0 so cả hai.

### 6.2 Uốn khi gấp

- Mỗi đỉnh lưới mang toạ độ giấy. Vị trí 3D được tính bằng cách áp lần lượt các nếp gấp: đỉnh nằm ở phía lật thì quay quanh trục nếp một góc θ = π·t (t là tiến độ, 0→1).
- **Uốn theo trụ:** đỉnh cách trục khoảng d < π·r được đặt lên một cung trụ bán kính r, nên giấy uốn cong mềm như mép trang sách chứ không gập cứng như bản lề. Bán kính r lớn khi đang kéo (khoảng 1,5 cm) và co dần về độ dày giấy khi miết phẳng.
- **Chuyển động phụ:** vạt giấy đang lật hơi trễ và gợn nhẹ theo lò xo giảm chấn. Lúc miết phẳng có một nhịp nảy nhỏ.
- **Thứ tự lớp:** phần lật nằm trên: z' = 2·T − z, với T là mặt trên của xấp. Mỗi lớp cách nhau bằng độ dày giấy hiển thị (khoảng 0,2 mm), đủ để không nhấp nháy z mà nhìn vẫn phẳng.
- Biến dạng chạy trên CPU vào `Float32Array` cho đơn giản, khớp tuyệt đối với engine để chạm/raycast, và tính pháp tuyến từ lưới. Nếu GĐ0 đo thấy quá 2 ms/khung trên tablet chuẩn thì chuyển sang vertex shader với mảng uniform tối đa 8 nếp.

### 6.3 Giấy trông như giấy

- **Hai mặt:** mặt trước và mặt sau khác màu, chọn qua `gl_FrontFacing`. Có loại giấy thủ công hai mặt màu khác nhau, giúp bé thấy rõ lớp nào đã lật.
- **Thớ giấy:** normal map nhiễu sinh lúc chạy, không cần ảnh. Có độ nhám nhẹ và một chút ánh sáng xuyên giả khi có đèn phía sau.
- **Nếp in lại:** sau khi mở, mỗi nếp để lại một vệt sáng–tối mảnh, phân biệt nếp lõm và nếp lồi. Giấy không phẳng tuyệt đối mà giữ góc dư khoảng 4–8° ở mỗi nếp, nhìn rất thật.
- **Loại giấy (đã chốt 15/10, người dùng giao Claude quyết):** v1 gồm giấy thủ công trơn 12 màu, giấy hai mặt khác màu, giấy kim tuyến (ánh kim sinh bằng shader), và giấy hoa văn **hình học sinh bằng code** (chấm bi, kẻ ô, sọc chéo, ô trám). Các hoa văn này là hình lặp đơn giản nên vẽ bằng code vẫn đẹp và không cần ảnh. **Không** tự vẽ tay hoa văn minh hoạ (Đông Hồ, hoa lá); nếu cần thì để sau v1 và sinh bằng AI qua cổng duyệt như Xưởng Tô Màu. Ảnh bìa thẻ sảnh được **chụp từ chính renderer** (bông tuyết mở xòe chiếu đèn), không vẽ tay.

### 6.4 Mảnh vụn

- Mảnh rơi là mesh riêng: tam giác hoá vùng rơi, mang đúng màu hai mặt.
- Rơi có trọng lực, lực cản không khí, xoay lả tả, rồi nằm lại trên bàn.
- Tối đa 40 mảnh; mảnh cũ mờ dần. Nút “Dọn bàn” có hoạt cảnh chổi quét.

### 6.5 Khoảnh khắc mở ra

1. Camera kéo về nhìn chính diện, tối nhẹ nền bàn.
2. Mở từng nếp theo thứ tự ngược, mỗi nếp khoảng 0,6 s, có uốn trụ. Mở nhanh dần ở các nếp sau.
3. Khi nếp cuối mở: giấy nhấc lên khỏi bàn, xoay nhẹ, lấp lánh dọc theo các trục đối xứng. Trục đối xứng hiện thoáng qua như tia sáng, đây cũng là chỗ lồng toán.
4. **Chiếu đèn:** một ngọn đèn sau giấy chiếu bóng hoa văn lên tường (spotlight + shadow map + mặt nạ). Nếu thiết bị yếu thì thay bằng ảnh bóng nướng sẵn từ mặt nạ.
5. Âm thanh: sột soạt khi mở, chuông nhỏ khi xong. Có thể bấm để bỏ qua.

Khi “Làm tiếp”, giấy gấp lại đúng chuỗi nếp cũ bằng hoạt ảnh tua ngược.

### 6.6 Bàn làm việc và chất lượng

- Bàn gỗ, tấm lót cắt xanh có lưới cm in số. Lưới khớp cm thật nên bé đọc được kích thước, nối với toán đo lường.
- Ánh sáng studio mềm, bóng đổ mềm của xấp giấy.
- Ba mức chất lượng như Lắp Ghép: Thấp (lưới 96², không chiếu bóng tường), Vừa, Cao (lưới 256², bóng mềm, bloom nhẹ lúc lấp lánh). Tự hạ mức khi fps < 45 trong 2 giây.
- Âm thanh (đã chốt 15/10): **nguồn miễn phí bản quyền** (CC0 hoặc tương đương, ghi nguồn trong `public/papercut/audio/README.md`). Tiếng kéo phát theo nhịp ngón tay; sột soạt gấp đổi tốc độ phát theo tốc độ kéo. Tìm và tải file ở GĐ3, hỏi người dùng trước khi tải.

---

## 7. Xuất hướng dẫn từng bước

Mục tiêu: **một bạn nhỏ khác cầm tờ giấy thật, đọc tài liệu và làm ra gần giống.** Tài liệu phải ngắn, rõ, đúng ký hiệu gấp giấy, và có mẫu tỉ lệ thật.

### 7.1 Từ lịch sử thao tác tới các bước

Recipe được rút gọn trước khi dựng tài liệu:

1. Bỏ mọi thao tác đã hoàn tác, bỏ xoay và thu phóng.
2. Một cặp “gấp rồi mở ngay” mà không cắt gì ở giữa được bỏ đi (nếp nháp).
3. **Gộp các nhát cắt liên tiếp ở cùng một trạng thái gấp thành một bước** (“Cắt theo các nét liền trong hình”). Bé cắt 30 nhát thì vẫn chỉ là một bước.
4. Các nếp từ nút gấp nhanh vẫn tách thành từng bước gấp riêng (người làm theo cần từng nếp), nhưng gom dưới một tiêu đề, ví dụ: “Gấp bông tuyết 6 cánh (bước 2–5)”.
5. Mở một nếp rồi gấp kiểu khác vẫn giữ thành bước: “Mở nếp vừa gấp ra, gấp lại theo đường mới”.

### 7.2 Các loại bước và sơ đồ

| Bước | Sơ đồ | Lời |
|---|---|---|
| Chuẩn bị | Tờ giấy đúng hình và màu, ghi kích thước, kéo, bút chì | “Chuẩn bị giấy vuông 15 cm, kéo đầu tròn, bút chì.” |
| Gấp | Viền xấp trước khi gấp, **nét đứt** cho nếp lõm, nét chấm-gạch cho nếp lồi, **mũi tên cong** chỉ hướng lật vạt giấy, hình nhỏ “sau khi gấp” ở góc | Câu từ `describe.ts` (mục 5.4) |
| Lật xấp | Ký hiệu lật (mũi tên xoay vòng) | “Lật xấp giấy lại.” |
| Cắt | Viền xấp đã gấp, nét cắt là **nét liền đậm** kèm biểu tượng kéo, phần bỏ đi **tô xám có gạch chéo**, các nếp gấp trên viền được đánh dấu “đừng cắt hết chỗ này” | “Vẽ theo mẫu ở trang cuối rồi cắt bỏ phần tô xám.” |
| Dập lỗ | Hình lỗ, tâm và cỡ thật | “Đục lỗ hình trái tim ở chỗ đánh dấu.” |
| Mở ra | Hình mở xòe, trục đối xứng mảnh | “Mở nhẹ từng nếp. Hoa giấy có 6 trục đối xứng!” |

- Sơ đồ vẽ bằng Canvas 2D từ chính hình học engine (viền xấp = hợp các facet trong toạ độ xấp). Nét sạch, in rõ, không phụ thuộc ảnh 3D.
- Mỗi bước kèm **ảnh 3D nhỏ** chụp từ renderer ở cùng trạng thái, cho bạn nào chưa quen đọc sơ đồ.
- Hướng của xấp được chuẩn hoá cho mỗi bước (cạnh dài nằm ngang, nếp chính ở dưới hoặc bên trái), để tài liệu không bị xoay lung tung theo cách bé đã cầm trên màn hình.

### 7.3 Mẫu in tỉ lệ 1:1 (phần giá trị nhất)

Hai dạng, người xuất chọn dạng nào cũng được, mặc định in cả hai:

- **Mẫu cắt đặt lên xấp:** viền xấp đã gấp ở **kích thước thật** cùng các nét cắt. Bạn in ra, cắt theo viền, đặt lên xấp giấy đã gấp, đồ lại rồi cắt.
- **Giấy in sẵn nét:** tờ giấy chưa gấp ở kích thước thật, đã in sẵn nếp gấp (nét đứt) và **nét cắt trên đúng mặt sẽ nằm trên cùng sau khi gấp**. Bạn in, cắt ra hình vuông, gấp theo nét đứt, rồi cắt theo nét liền mà mình nhìn thấy. Đây là cách dễ nhất cho trẻ nhỏ.
  - Engine tìm facet nằm trên cùng ở trạng thái cắt rồi vẽ nét cắt lên vùng đó trong toạ độ giấy.
  - Nếu facet trên cùng là mặt sau của giấy (det M = −1), tài liệu thêm bước “Lật xấp giấy lại trước khi cắt” và vẽ lên facet dưới cùng có mặt trước hướng lên. Nếu không có facet phù hợp thì in mẫu cắt đặt lên xấp thay thế.
- Trang mẫu có **thước hiệu chuẩn**: “Đoạn này phải dài đúng 5 cm. Nếu không, hãy chọn in 100% / Kích thước thực.” Bộ ghi PDF hiện có đặt ảnh phủ kín A4, nên chỉ cần vẽ đúng tỉ lệ 1240 px ↔ 210 mm (≈ 5,905 px/mm). Có test kiểm tỉ lệ.
- Giấy lớn hơn khổ in (A4 sau lề) thì tự chia thành nhiều trang ghép, có dấu căn chỉnh.

### 7.4 Định dạng xuất

| Định dạng | Nội dung | Dùng khi |
|---|---|---|
| **PDF A4** | Bìa (ảnh thành phẩm mở xòe + ảnh chiếu đèn, tên tác phẩm, ngày, số bước, đồ cần chuẩn bị) → các bước (4–6 bước mỗi trang) → mẫu 1:1 → mẹo an toàn với kéo | In ra, gửi thầy cô, bố mẹ |
| **Ảnh thẻ chia sẻ PNG** | Một ảnh dọc rộng 1080 px: thành phẩm ở trên, lưới các bước đánh số, chân thẻ ghi Genius Kids | Gửi qua Zalo, Messenger (phổ biến nhất) |
| **Ảnh từng trang** | JPEG từng trang PDF | Máy không mở được PDF |
| Web Share | Chia sẻ thẳng PDF/PNG trên iPad/Android khi `navigator.canShare({files})`, như `ExportSheet` của Lắp Ghép | Tablet |

- **Riêng tư (đã chốt 15/10):** không in tên bé lên bất kỳ file xuất nào. Bìa chỉ có tên tác phẩm và ngày. Không đưa thông tin tài khoản vào file.
- Xuất chạy ở luồng chính với `AbortSignal` và thanh tiến độ như Lắp Ghép. Mục tiêu: dưới 3 s cho 10 bước trên tablet chuẩn.

### 7.5 Xem lại và làm theo trong app

- **Xem lại:** phát lại recipe đã rút gọn trên bàn 3D, từng bước, có đọc to. Đây cũng là cách bé kiểm lại tài liệu trước khi gửi.
- **Làm theo (sau v1):** nhập công thức của bạn, app hiện **đường gấp mờ** và **nét cắt mờ** để bé đi theo, nhưng không ép (đúng nguyên tắc linh hoạt). Cuối cùng so độ giống bằng IoU của Sheet và báo theo kiểu khen, không chấm điểm.
- **Mã công thức/QR: không làm (đã chốt 15/10).** Chia sẻ chỉ qua PDF và ảnh. Chế độ Làm theo chỉ dùng cho mẫu có sẵn và tác phẩm trong Sổ của chính bé.

---

## 8. Nội dung và chế độ chơi

| Chế độ | Mô tả | Lớp |
|---|---|---|
| **Tự do** | Mặc định, luôn mở. Chọn giấy (vuông, chữ nhật, dải dài, tròn, lục giác), màu, cỡ. | Mọi lớp |
| **Mẫu gợi ý** | 12 mẫu ban đầu: bông tuyết 6 cánh, hoa 4 cánh, hoa 5 cánh, hoa 8 cánh, trái tim, con bướm, dây người nắm tay, dây ngôi sao, chữ Hỷ (cắt giấy truyền thống), hoa sen, lá cờ đuôi nheo, mặt nạ. Mỗi mẫu là một recipe chuẩn, chạy được ở chế độ Làm theo. | Mọi lớp |
| **Đoán hình** | App gấp và cắt sẵn; bé đoán hình mở ra trong 3–4 lựa chọn, rồi mở để kiểm tra. Có thể bật một câu đoán nhanh trước khi mở tác phẩm của chính mình (tắt được, không bắt buộc). | Lớp 1+ |
| **Một nhát kéo** | Thử thách dựa trên định lý gấp-và-cắt: được gấp tuỳ ý nhưng **chỉ cắt một đường thẳng**, để ra ngôi sao 5 cánh, hình vuông, chữ cái. Đối chiếu IoU với hình mục tiêu (lệch xoay/tịnh tiến được bỏ qua). | Lớp 3+ |
| **Đối xứng ngược** | Cho hình mục tiêu; bé tự nghĩ cách gấp và cắt cho ra hình đó. | Lớp 4+ |

**Toán lồng ghép (nhẹ, không thành bài kiểm tra):**

- nhãn phân số ở nam châm gấp (½, ¼, ⅓);
- góc 360°/n khi gấp bông tuyết;
- trục đối xứng hiện lúc mở và câu “Hoa này có 6 trục đối xứng”;
- lưới cm trên tấm lót và kích thước thật trong mẫu in;
- nhận xét diện tích: “Em đã cắt bỏ khoảng 40% tờ giấy”.

**Thưởng:** huy hiệu theo cột mốc (lần đầu mở hoa, 6 cánh, cắt rời thành dây, xuất hướng dẫn đầu tiên, thắng thử thách một nhát kéo). Dùng pipeline thưởng hiện có, có khoá chống thưởng lặp khi nhân bản, nhập lại hay tải lại trang.

---

## 9. Kiến trúc mã nguồn đề xuất

```text
src/papercut/
  model.ts                   kiểu dữ liệu chung: Recipe, Op, PaperSpec, ArtworkDoc
  engine/                    thuần TS — không React/Three/DOM/IndexedDB
    geom.ts                  vector, phép dời hình 2D, phản xạ qua đường
    poly.ts                  bọc thư viện boolean, làm tròn lưới, nong polyline
    sheet.ts                 Sheet, cắt, thành phần liên thông, diện tích
    fold.ts                  áp nếp → facets, viền xấp, đếm lớp
    cut.ts                   nét mở/khép, kerf, vùng rơi, dập lỗ
    snap.ts                  ứng viên đường “đẹp” và hút nam châm
    recipe.ts                áp/hoàn tác/làm lại, phát lại tất định, rút gọn
    describe.ts              phân loại nếp → câu tiếng Việt
    symmetry.ts              phát hiện nhóm đối xứng của Sheet (trục, bậc quay)
    challenges.ts            IoU, chấm “một nhát kéo”, đoán hình
    *.test.ts                + fuzz.test.ts (bất biến mục 5.3)
  input/
    foldDrag.ts              máy trạng thái kéo-gấp (P, F, 40%, thoát hút)
    cutStroke.ts             làm mượt, rút gọn, nối mép, phân loại nét
  render/
    PaperCanvas.tsx          canvas R3F, bàn, ánh sáng, camera, mức chất lượng
    paperMesh.ts             lưới đều + biến dạng uốn trụ
    paperMaterial.ts         hai mặt, thớ giấy, mặt nạ, vết nếp
    maskTexture.ts           vẽ Sheet/viền/nếp vào texture
    scraps.ts                mảnh vụn rơi
    reveal.ts                hoạt cảnh mở, chiếu đèn, cửa sổ
    snapshot.ts              chụp ảnh 3D cho bìa và từng bước
  export/
    steps.ts                 recipe rút gọn → các bước tài liệu
    diagrams.ts              sơ đồ 2D theo ký hiệu gấp giấy
    template.ts              mẫu 1:1, giấy in sẵn nét, thước hiệu chuẩn, chia trang
    pages.ts                 trang A4 → PDF (dùng src/lib/export/pdf.ts)
    shareCard.ts             thẻ PNG 1080 px
  state/
    studioController.ts      điều phối thao tác, hoạt ảnh, lưu bản nháp
  persistence/
    repository.ts            IndexedDB theo tài khoản/hồ sơ, revision, ảnh thu nhỏ
  content/
    papers.ts  templates.ts  challenges.ts  content.test.ts
  progress/
    progress.ts  rewards.test.ts
  ui/
    PapercutPage.tsx  Workbench.tsx  ToolTray.tsx  Notebook.tsx
    WindowDisplay.tsx  ExportSheet.tsx  papercut.css
src/lib/export/pdf.ts         chuyển từ src/bricks/export/pdf.ts (dùng chung)
public/papercut/              ảnh bìa thẻ, hoa văn giấy, âm thanh (nếu không tổng hợp)
docs/papercut-studio/         spike-report.md, qa-checklist.md, ảnh duyệt
scripts/papercut/shot.sh      chụp kiểm hình bằng Chrome headless
```

Ranh giới giống Xưởng Gốm: engine nhận và trả dữ liệu thuần; render chuyển dữ liệu engine thành hình; controller điều phối; UI chỉ gửi ý định. Phần sinh tài liệu dùng engine + Canvas 2D nên test được cả sơ đồ bằng ảnh chụp so sánh.

---

## 10. Lưu trữ

```ts
interface PapercutArtwork {
  id: string; owner: { account: string; student: string };
  name: string; createdAt: number; updatedAt: number; revision: number;
  paper: PaperSpec;          // hình, cỡ cm, màu hai mặt, hoa văn
  recipe: Op[];              // đã rút gọn khi hoàn tất; bản nháp giữ đủ để hoàn tác
  templateId?: string;       // nếu lấy cảm hứng từ mẫu
  thumb: Blob;               // 512² ảnh mở xòe
  badges?: string[];
}
```

- Sheet và facets **không lưu**, luôn dựng lại từ recipe (tất định, mục 5.3). Bản ghi chỉ vài KB.
- Bản nháp tự lưu sau mỗi thao tác (debounce 1 s). Có kiểm revision để ảnh thu nhỏ cũ không ghi đè dữ liệu mới, như `artworkRepo.ts`.
- Xoá hồ sơ thì xoá tác phẩm theo phạm vi; chuyển tài khoản thì không lẫn dữ liệu.

---

## 11. Hiệu năng (mục tiêu, đo ở GĐ0)

| Hạng mục | Mục tiêu trên tablet chuẩn |
|---|---|
| Khung hình khi kéo gấp | ≥ 55 fps; biến dạng CPU ≤ 2 ms/khung ở lưới 160² |
| Một nhát cắt (boolean + vẽ lại mặt nạ) | ≤ 30 ms với 6 nếp, nét 200 điểm |
| Dựng lại từ recipe 50 thao tác | ≤ 150 ms |
| Xuất PDF 10 bước | ≤ 3 s |
| Bộ nhớ GPU | ≤ 64 MB (mặt nạ 2048² + bóng) |
| Tải module lần đầu | Chia gói riêng; thư viện boolean ≤ 60 KB gzip |

---

## 12. Kế hoạch thực thi

Ước lượng tính bằng ngày công của một người đã quen repo. Tổng khoảng **24–32 ngày công**, nên dự trù thêm 20% cho tinh chỉnh cảm giác gấp và thử trên thiết bị thật.

| Giai đoạn | Việc và đầu ra | Nghiệm thu | Ngày công |
|---|---|---|---|
| **GĐ0 Kiểm chứng** | Spike engine fold/cut với 2 thư viện boolean + fuzz; prototype lưới uốn trụ, gấp bằng kéo ngón tay, mở 3 nếp, mặt nạ cắt; một sơ đồ 2D mẫu; đo trên tablet | **Cổng duyệt hình:** video gấp–cắt–mở gửi người dùng duyệt “đẹp mắt”; chốt thư viện, CPU hay shader, lưới hay facet | 2–3 |
| **GĐ1 Engine** | `geom`, `poly`, `sheet`, `fold`, `cut`, `snap`, `recipe`, `describe`, `symmetry` + test; fuzz 10 000 chuỗi | Mọi bất biến mục 5.3 đạt; engine không import React/Three | 3–4 |
| **GĐ2 Nền module** | Route, thẻ sảnh, `PapercutPage`, controller, repository bản nháp, phạm vi hồ sơ, chuyển `pdf.ts` sang `src/lib/export` (Lắp Ghép vẫn xanh) | Vào/ra an toàn, tải lại giữ bản nháp, hai hồ sơ không lẫn | 2 |
| **GĐ3 Gấp và cắt** | Kéo-gấp có uốn, nam châm + nhãn, nút gấp nhanh, lật, mở một nếp; kéo tự do/thẳng/răng cưa, bút chì, dập lỗ; mảnh vụn; hoàn tác/làm lại; âm thanh; chế độ bé | Làm được bông tuyết, dây người, trái tim, chữ Hỷ hoàn toàn bằng tay, trên chuột và cảm ứng | 5–6 |
| **GĐ4 Mở và thành phẩm** | Hoạt cảnh mở, vết nếp, chiếu đèn, cửa sổ trưng bày, Sổ Cắt Giấy, chụp ảnh, nhân bản để sửa | **Cổng duyệt hình lần 2:** khoảnh khắc mở; tải lại tác phẩm ra đúng từng bit | 3–4 |
| **GĐ5 Xuất hướng dẫn** | Rút gọn bước, sơ đồ, câu mô tả, ảnh 3D từng bước, mẫu 1:1 hai dạng + thước, PDF, thẻ PNG, Web Share, xem lại có đọc to | **Cổng thử giấy thật:** in 3 tài liệu (bông tuyết, dây người, một tác phẩm tự do), một người chưa xem app làm theo bằng giấy thật ra đúng hình; thước in đúng 5 cm | 5–6 |
| **GĐ6 Nội dung và chế độ** | 12 mẫu, giấy hoa văn, Đoán hình, Một nhát kéo, Đối xứng ngược, huy hiệu, `completePapercut` | Mỗi mẫu chạy được ở Làm theo; không thưởng lặp sau nhân bản/nhập/tải lại | 3–4 |
| **GĐ7 Hoàn thiện** | Mức chất lượng tự động, offline (PWA), khả năng tiếp cận, đo hiệu năng, QA thiết bị thật, tài liệu | Đạt mục 11 và checklist mục 13; build/test xanh | 2–3 |
| Sau v1 | Gấp riêng lớp trên; thiệp nổi (kirigami pop-up); đèn lồng giấy | — | — |

**Hạng mục đầu tiên của GĐ0:**

1. `fold.ts` tối thiểu: Sheet vuông, áp 1–4 nếp, ra facets; test diện tích.
2. Cắt một nét mở và một lỗ kín; so Clipper2 và `polygon-clipping` trên 1 000 chuỗi ngẫu nhiên (lỗi, tốc độ, cỡ gói).
3. Lưới 160² + mặt nạ + uốn trụ cho một nếp kéo bằng chuột; rồi 3 nếp liên tiếp và mở ngược.
4. Quay video 20 s trên tablet; ghi số đo vào `docs/papercut-studio/spike-report.md`.

---

## 13. Kiểm thử và tiêu chí hoàn thành

**Tự động:**

- Fuzz bất biến engine (mục 5.3), gồm đối xứng Dₙ.
- `describe.ts`: bảng ca mẫu → đúng câu cho 20 nếp chuẩn.
- `steps.ts`: recipe có hoàn tác, nếp nháp, 30 nhát cắt → đúng số bước mong đợi.
- `template.ts`: tỉ lệ px/mm, chọn đúng facet trên cùng, chia trang khi giấy lớn.
- Repository: phạm vi, revision, xoá hồ sơ (fake-indexeddb).
- Thưởng: không lặp.

**Thủ công (checklist):**

- Chạm: kéo-gấp ở 4 cạnh và 4 góc; thoát nam châm; hai ngón không vô tình gấp.
- Cắt: nét sát mép, nét đi qua nếp, cắt rời dây người, đục lỗ trong lỗ.
- Mở hoặc gấp lại 10 lần liên tiếp không lệch hình.
- PDF mở được trên Chrome, Safari iPad, trình xem PDF Android; in thử A4 thật.
- Thẻ PNG gửi qua Zalo không bị nén vỡ chữ.

---

## 14. Rủi ro và cách xử lý

| Rủi ro | Xử lý |
|---|---|
| Boolean đa giác sai ở ca suy biến (nét cắt trùng nếp, đỉnh chạm đỉnh) | Lưới toạ độ nguyên 0,01 mm, kerf thay cho nét không độ dày, fuzz từ GĐ0; chọn thư viện theo số liệu |
| Gấp tự do khó với bé nhỏ | Nam châm mạnh hơn ở chế độ bé, nút gấp nhanh, bàn tay gợi ý; đo ở cổng GĐ0 |
| Mép cắt mờ khi phóng to (mặt nạ raster) | Mặt nạ 2048² cho giấy 15 cm (≈ 0,07 mm/px), cộng `fwidth`; dự phòng tam giác hoá facets |
| Nét tự do của bé quá phức tạp để người khác cắt theo | Rút gọn RDP cho tài liệu; mẫu 1:1 để đồ lại thay vì đoán; cảnh báo nét quá mảnh (< 2 mm) trong tài liệu |
| Hướng dẫn tự sinh khó hiểu | Cổng thử giấy thật ở GĐ5 là bắt buộc; câu mô tả có bảng ca mẫu; luôn có ảnh 3D kèm sơ đồ |
| Máy in tự co giãn làm sai tỉ lệ | Thước hiệu chuẩn 5 cm + lời nhắc chọn 100% |
| Giấy rời mảnh khi mở làm bé thất vọng | Hoạt cảnh tách duyên dáng + mẹo “chừa nếp”; hoàn tác 1 chạm |
| Hiệu năng tablet yếu | Ba mức chất lượng, hạ tự động, bỏ chiếu bóng tường ở mức Thấp |

---

## 15. Quyết định đã chốt (15/10/2026)

| Câu hỏi | Quyết định |
|---|---|
| Thêm thư viện boolean đa giác | **Cho phép.** So `clipper2-ts` và `polygon-clipping` ở GĐ0, chọn một. |
| Tên bé trên tài liệu chia sẻ | **Không in tên.** |
| Mã công thức/QR | **Không làm.** |
| Âm thanh | **Nguồn miễn phí bản quyền** (CC0 hoặc tương đương), có ghi nguồn. |
| Hoa văn giấy, ảnh bìa | Người dùng giao Claude quyết: giấy trơn, hai mặt, kim tuyến và hoa văn hình học sinh bằng code; ảnh bìa ban đầu định chụp từ renderer (mục 6.3); 20/10 người dùng cho GPT vẽ (`public/papercut/cover.webp`, `cover-sm.webp`). |

## 16. Nhật ký lệch plan

| Ngày | Lệch | Lý do |
|---|---|---|
| 15/10 | Luật “thả ≥ 40% hành trình” (4.1) đổi thành “kéo ≥ 1,2 cm”; vạt luôn lật đủ khi kéo | Kéo bằng ngón tay không có “hành trình” xác định; ngưỡng khoảng cách dễ hiểu và ổn định hơn |
| 20/10 | Phát hành sớm, chưa qua cổng GĐ0: thẻ trong Góc Thủ Công, `/papercut` mở bàn cắt giấy cho bé (`ui/PapercutStudio.tsx`, đổi tên từ `DevBench.tsx`): giấy vuông/lục giác/dải dài, 7 màu, Gấp/Kéo cắt/Đục lỗ, gấp nhanh, Hoàn tác, Giấy mới, Mở ra!. `?dev=1` chỉ bật bảng số đo và `window.__papercut`. Ảnh bìa do GPT vẽ (`public/papercut/`) thay vì chụp từ renderer. Chưa có lưu tác phẩm, xuất hướng dẫn, mẫu, âm thanh, nam châm | Người dùng yêu cầu release ngay |
| 20/10 | Làm nốt v1: nam châm gấp (`engine/snap.ts`, thêm trục 60° tại trung điểm cạnh), mô tả nếp (`describe.ts`), các bước + sơ đồ + mẫu 1:1 + PDF/PNG (`export/`), Sổ Cắt Giấy (`persistence/`), thưởng/huy hiệu (`progress/`), 6 mẫu (`content/templates.ts`), vết nếp in lại, mảnh vụn rơi, chế độ bé. Mẫu 1:1 in lên **mặt nằm trên lúc cắt** (thường là mặt sau, vẽ soi gương) thay cho "lật xấp trước khi cắt". `pdf.ts` chuyển sang `src/lib/export/`. Vệt diện tích ≈ 0 dọc nếp (< 0,2 mm²) bị lọc sau mỗi nhát cắt. Chưa có âm thanh (chờ người dùng duyệt nguồn CC0) | Người dùng: "làm nốt đi" |
| 15/10 | Lưới làm tròn 0,01 mm (5.3) đổi thành **0,001 mm** | Ở lưới 0,01 mm clipper2-ts treo và trừ sai thường hơn; chi phí thêm khoảng 15% |
| 15/10 | Thêm `clipperGuard.ts`, vá prototype của clipper2-ts lúc chạy | Thư viện treo vô hạn ở vài ca cạnh ngang; chưa có bản mới hơn |
| 15/10 | Sau khi cắt, facets cập nhật tăng dần thay vì gấp lại từ đầu | 64 facet: 145 → 41 ms/nhát; vẫn tất định |
| 15/10 | Fuzz mặc định 150 chuỗi; 1 000 và 10 000 bật bằng `PAPERCUT_FUZZ` | Để `npm test` không chạy thêm 70 s |

---

## 17. Checklist bàn giao (dừng lúc 15/10/2026, phiên 2)

Nhánh `feat/papercut-studio`, tách từ `main` tại `1caa20e`. Số đo và các bẫy: `docs/papercut-studio/spike-report.md`.

### Đã xong

- [x] Plan và 5 quyết định ở mục 15. Đã chọn `clipper2-ts` 2.0.1-18; bảng so sánh ở `docs/papercut-studio/spike/bench-poly.mjs` (commit 0848940).
- [x] `geom.ts`, `poly.ts` qua `tsc` và có test. Đã sửa lỗi `unionD` bỏ qua precision.
- [x] `model.ts`, `sheet.ts`, `fold.ts`, `cut.ts`, `recipe.ts` cùng `fold.test.ts`. Các ca đã test: gấp đôi, gấp lồi, lật xấp, D4 8 lớp, mở hết, cắt góc, đục lỗ, khe, cắt rời, đối xứng D4 và 6 cánh.
- [x] `fuzz.test.ts`: 1 000 chuỗi đạt mọi bất biến mục 5.3; đã đo ms/nhát với 6 nếp.
- [x] Phát hiện và chặn 3 lỗi của clipper2-ts (treo, trừ sai, `unionD`). Xem spike-report mục 3.
- [x] Bàn thử `/papercut?dev=1`: route tải lười trong `App.tsx`, **không** thêm vào `catalog.ts`. Có lưới 160², mặt nạ 2048², uốn trụ, hai mặt màu, kéo-gấp bằng chuột, bật về, gấp nhanh, cắt, dập lỗ, hoàn tác, mở ngược từng nếp. Đã kiểm trên trình duyệt; ảnh ở `docs/papercut-studio/shots/`.
- [x] `paperMesh.test.ts`: lưới hiển thị khớp engine (vị trí và độ cao lớp); khi θ = π và r → 0 thì trùng trạng thái đã gấp.
- [x] Đã chuyển ghi chú thuật toán vào mục 5.5.

### Việc tiếp theo (theo thứ tự)

1. [ ] **Cổng GĐ0:** mở `/papercut?dev=1` trên tablet chuẩn. Chọn hồ sơ trước rồi vào bằng điều hướng trong app, vì tải lại trang sẽ mất hồ sơ đang chọn. Ghi fps khi kéo-gấp và ms/nhát cắt vào spike-report mục 4. Quay video 20 s gấp–cắt–mở, rồi **người dùng duyệt “đẹp mắt”**.
2. [ ] Theo số đo ở bước 1, chốt biến dạng chạy trên CPU hay shader, và dùng mặt nạ hay tam giác hoá facets (so khi phóng to).
3. [ ] GĐ1: đưa thời gian cắt qua 6 nếp xuống ≤ 30 ms trên tablet (gộp facet cùng phép biến đổi, lọc khung bao, hoặc Web Worker). Fuzz 10 000 chuỗi (`PAPERCUT_FUZZ=10000`) phải ra 0 ca `unresolved`.
4. [ ] GĐ1: `snap.ts`, `describe.ts`, `symmetry.ts`; hoàn tác/làm lại trong `recipe.ts` (bàn thử hiện hoàn tác bằng cách phát lại).
5. [ ] Một sơ đồ 2D mẫu (hạng mục GĐ0 còn thiếu).

### Ghi chú cho người làm tiếp

- Trên bàn thử, `window.__papercut` có `bench`, `fold(px, py, fx, fy)`, `cut([[x, y], …])`, `unfoldAll()` để kiểm thử trong trình duyệt. Toạ độ tính bằng cm, tâm giấy ở gốc.
- Khi ô trình duyệt bị ẩn, `requestAnimationFrame` bị hạn nên hoạt ảnh chạy chậm. Số fps đo ở đó không phản ánh máy thật.
