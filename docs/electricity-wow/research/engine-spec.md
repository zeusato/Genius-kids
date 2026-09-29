# Hợp đồng engine Điện — bản chốt để triển khai

Ngày 29/09/2026. Phạm vi: mô hình DC giáo dục của bàn thí nghiệm, phiên bản `electricalModelVersion: 1`. Đây là đặc tả cần triển khai; các kiểm chứng đã thực hiện nằm riêng ở mục 9. Khi đoạn mô tả tóm tắt trong plan chưa đủ chi tiết, dùng hợp đồng dưới đây cho engine.

## 1. Mô hình nào đang được cam kết?

**Dòng điện, hiệu điện thế và công suất tuân theo Ohm/Kirchhoff trên cùng một netlist.** Không có luật riêng kiểu “bài nối tiếp thì đặt độ sáng bằng 30%”. Vị trí trên bàn, camera, màu dây, góc nhìn và mã bài học không được đi vào bộ giải.

Đây là **mô hình giáo dục có thông số hiệu chuẩn**, không phải SPICE đầy đủ hoặc thiết bị đo linh kiện thật. Bóng sợi đốt dùng điện trở nóng cố định; màu dây tóc, thời gian cháy, pin nóng, tốc độ quạt có quy tắc hiển thị được ghi rõ. Không gọi các quy tắc đó là số đo thực nghiệm. Chế độ này đủ để học mạch kín/hở, nối tiếp/song song, sụt áp, cực LED, đo dòng/áp, quá tải và chuyển hóa năng lượng. Không mô phỏng AC gia dụng, điện dung/ký sinh, tia lửa, điện giật, điện phân, tốc độ truyền sóng hay đặc tuyến nhiệt đầy đủ.

Tất cả nguồn DC có nội trở hữu hạn. Vì thế v1 chỉ cần **phân tích điện thế nút với nguồn Norton**, là trường hợp con của MNA; không cần ẩn dòng của nguồn áp lý tưởng. Không tuyên bố thuật toán hay mã này là bản sao của PhET. PhET là tham chiếu trải nghiệm: có góc nhìn vật thật/sơ đồ, electron/dòng quy ước, nội trở pin và tùy chọn bóng thực. [PhET CCK DC](https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html).

## 2. Quy ước dữ liệu, đơn vị và dấu

- SI nội bộ: V, A, Ω, W, s, C; chỉ đổi sang mA khi định dạng màn hình. `charge01` là 0–1, không phải 0–100.
- Mỗi cọc có `PostRef { partId, postId }` ổn định. Không dùng từ `input/output` cho bóng, điện trở hay công tắc. Xoay linh kiện chỉ đổi hình học cọc, không đổi định danh và cực.
- Nhánh có hai đầu `a`, `b`. Quy ước chung: `Uab = Va - Vb`, `Iab > 0` là dòng quy ước từ `a` sang `b`, `Pabsorbed = Uab * Iab`. Không lấy trị tuyệt đối trong kết quả engine.
- Tải thụ động: `Iab = Uab / R`; `Pabsorbed ≥ 0`. Nguồn có `a = −`, `b = +`, suất điện động có dấu `E`: `Uab = -E + r * Iab`, tức `Iab = (Uab + E) / r`. Nguồn đang cấp điện thường có `Pabsorbed < 0`; `Pdelivered = -Pabsorbed`, `PinternalHeat = Iab² * r`, `Pchemical = E * Iab`.
- LED: `a = anode`, `b = cathode`; chân dài/anode được chỉ rõ. Công tắc hai chiều có 3 cọc `common`, `throw0`, `throw1`; trạng thái 0/1 chỉ nối common với đúng một nhánh.
- Chiều electron trên **dây kim loại** là `-sign(Iab)`. Dòng nhỏ hơn `1e-7 A` trả hướng `0` cho animation; không giữ hướng cũ. Không vẽ một electron xuyên qua dung dịch chanh/pin như thể toàn mạch chỉ dẫn điện bằng electron.
- Ampe kế đọc `Iab` có dấu. Vôn kế đọc điện thế cọc đỏ trừ cọc đen. Cả hai cho đổi cọc; không sửa dấu kết quả để kim luôn dương.
- `nodeVoltage` luôn kèm `islandId` và nút tham chiếu. Không lấy hiệu điện thế giữa hai đảo rời chưa nối bằng đầu đo. Khi thêm vôn kế, điện trở đầu vào của nó trở thành nhánh thật trong netlist.

Hợp đồng tối thiểu, dùng thay cho map chỉ có `I/U/P` không nêu dấu:

```ts
type SolveResult =
  | { ok: true; editRevision: number; runtimeRevision: number; solveRevision: number; modelVersion: 1;
      nodes: ReadonlyMap<string, { volts: number; islandId: string }>;
      branches: ReadonlyMap<string, { Uab: number; Iab: number; Pabsorbed: number }>;
      sourceHeatW: ReadonlyMap<string, number>;
      diagnostics: { iterations: number; residualA: number; fallbackUsed: boolean } }
  | { ok: false; editRevision: number; runtimeRevision: number; solveRevision: number;
      reason: 'invalid-netlist' | 'limit-exceeded' | 'singular' | 'nonconvergent';
      affectedIds: readonly string[] };
```

`solve` không sửa `Circuit`, branch hay cache do bên gọi sở hữu. Cache LED là đối tượng riêng gắn cấu trúc điện và `solveRevision`, chỉ dùng làm điểm khởi tạo; vẫn phải kiểm lại nghiệm. Các lần giải giả định để phân tích công tắc chỉ chạy trên bản sao Circuit/SimState, không được cập nhật pin, nhiệt, tiến độ hoặc animation của mạch thật.

## 3. Thông số v1 và xuất xứ

`measured-reference` nghĩa là có nguồn hỗ trợ giá trị hoặc khoảng thực; `calibrated` nghĩa là lựa chọn có chủ ý cho mô hình, không gán nhầm thành hằng số vật liệu. Mỗi bản ghi dữ liệu có `modelVersion`, `provenance`, `sourceIds`, `note`.

| Phần tử | Thông số điện chốt | Loại và giới hạn |
| --- | --- | --- |
| Một pin AA mới | `E = 1.5 V`, `r = 0.2 Ω`, `capacityC = 7200 C` | E và khoảng r có tham chiếu; 2 Ah là dung lượng danh nghĩa chọn cho mô hình, không đường xả thực |
| Hộp pin | 1–4 ngăn; `E = Σ polarity_i * E_i`, `r = Σ r_i`; có **bất kỳ ngăn được cấu hình nào trống** thì hở | Hộp 1 ngăn dùng 1 pin; không coi 3 ngăn trống trong hộp 4 ngăn là dây nối |
| Pin chanh Cu/Zn | `E = 0.95 V`, `r = 450 Ω` | calibrated; điện áp có bối cảnh thực, nội trở phụ thuộc diện tích/khoảng cách điện cực, loại quả, thời gian |
| Pin khoai Cu/Zn | `E = 0.85 V`, `r = 700 Ω` | calibrated; so sánh hai **mẫu trong lab**, không kết luận mọi quả chanh luôn tốt hơn mọi củ khoai |
| Dây | `R = 0.02 Ω` mỗi đối tượng dây | calibrated; không phụ thuộc tuyến vẽ/độ dài màn hình. Tránh đổi điện khi xoay điện thoại |
| Công tắc/nút nhấn | đóng `R = 0.02 Ω`; mở thì loại nhánh | Không dùng `Infinity` trong ma trận; nút nhấn nhả khi pointer cancel/blur |
| Công tắc hai chiều | nhánh đang chọn `R = 0.02 Ω`; nhánh kia hở | common chỉ nối một throw; thay trạng thái trong một transaction |
| Bóng sợi đốt | `Vrated = 2.5 V`, `Irated = 0.3 A`, `R = 25/3 Ω`, `Prated = 0.75 W` | calibrated kit mẫu, dùng R nóng cố định; không mô hình hóa dòng khởi động hay thay đổi R theo nhiệt |
| LED đỏ/vàng/xanh lá/xanh dương | `Vf = 1.8 / 2.0 / 2.1 / 2.8 V`; `Ron = 15 Ω`; `Irated = 0.02 A` | calibrated đặc tuyến từng khúc; không khẳng định chỉ nhìn màu là biết Vf mọi LED |
| Ngưỡng quan sát LED | `Ivisible = 0.0005 A`; dưới đó hình sáng tăng rất nhẹ, không đủ qua nhiệm vụ “thắp LED” | Ngưỡng sư phạm/hiển thị, không phải ranh giới vật lý phát photon |
| Điện trở | mặc định `100 Ω`; lựa chọn `10/47/100/220/1000 Ω` | Không cho nhập âm, 0, NaN hay vô hạn |
| Biến trở hai cọc | `R = 1 + 999 * knob01 Ω` | calibrated; là rheostat hai cọc, không giả làm potentiometer ba cọc |
| Ampe kế | `R = 0.02 Ω`; tự chọn thang ±0.02/0.2/2/10 A | Mắc nối tiếp; mắc ngang pin tạo đường gần đoản mạch thật trong model; vượt thang hiển thị `OL`, không clamp I |
| Vôn kế | `R = 10e6 Ω`; thang ±2/20/200 V | Có tải đo rất nhỏ; mạch không cấp nguồn đọc 0; đảo cọc đổi dấu |
| Cầu chì | `R = 0.02 Ω`, mặc định `Irated = 0.5 A`; cho chọn 0.25/0.5/1 A | calibrated mô hình nhiệt ở mục 5; không phải đường đặc tính của sản phẩm cụ thể |
| Chuông điện | cuộn hút `R = 12 Ω`; kéo búa khi `|I| ≥ 0.08 A` | Tiếp điểm tự ngắt và chu kỳ ở mục 5; không cho chuông kêu khi dòng bằng 0 suốt phiên |
| Còi điện tử | `R = 150 Ω`, bắt đầu khi `|I| ≥ 0.004 A`, dừng dưới `0.0036 A` | Tải tương đương trung bình calibrated; không mô phỏng dao động bán dẫn |
| Động cơ | `R = 6 Ω`; bắt đầu ở `|I| ≥ 0.05 A`, dừng dưới `0.045 A` | Tải tương đương calibrated, tốc độ ở mục 5; v1 chưa có phản điện động/quán tính điện |
| Nam châm điện | cuộn dây `R = 12 Ω`; số vòng N=20/40/80; lõi không khí/sắt | Định tính từ `N * I`; “số kẹp hút được” là chỉ báo calibrated, không phải kết quả Maxwell |
| Máy phát tay quay | `E = clamp(3 * turnsPerSecond, -6, 6) V`, `r = 2 Ω` | Máy phát DC tương đương; quay ngược đảo cực, dừng thì E=0; chưa có mô hình lực cản cơ |
| Đồ vật kẹp đo | `R`/`open` từ registry nội dung; ghi điều kiện vật liệu, trạng thái khô/ướt, lớp phủ | Không suy ra “cách điện” chỉ vì bóng chưa đủ sáng; dụng cụ thử có độ nhạy hữu hạn |
| Đèn thử của Thám tử | pin riêng 3 V, LED đỏ, điện trở 1 kΩ; 2 que đo khép mạch bên trong đèn thử | Netlist con thật, chỉ bật chế độ thử thông mạch khi nguồn của mạch được tháo; vôn kế dùng để đo mạch đang có nguồn |

AA alkaline E91 có điện áp danh nghĩa 1,5 V và nội trở pin mới 150–300 mΩ; vì vậy 0,2 Ω là lựa chọn đại diện có căn cứ. Dung lượng thay đổi theo tải, không dùng 2 Ah để dự báo tuổi thọ pin thực. [Datasheet Energizer E91](https://data.energizer.com/pdfs/E91_Max_NA.pdf).

Panasonic nêu pin chanh Cu/Zn có thể đạt khoảng 1,1 V rồi giảm, dòng phụ thuộc diện tích điện cực và khoảng cách. Các giá trị 0,95 V/450 Ω và 0,85 V/700 Ω ở đây là **hai mẫu đã chọn của lab**. “Ba quả thắp LED” là kết quả mẫu, không phải bảo đảm ngoài đời. [Panasonic: Lemon Battery](https://www.panasonic.com/global/energy/study/academy/lemon.html).

LED cần đúng cực và hạn dòng. Kit v1 dùng bộ 4 đặc tuyến hiệu chuẩn; datasheet của một LED không đại diện toàn bộ màu đó. Bàn lớp nhỏ có sẵn điện trở trong khay “LED + bảo vệ”, nhìn rõ cả hai linh kiện; không âm thầm thêm điện trở vào LED trần. [SparkFun: Light-Emitting Diodes](https://learn.sparkfun.com/tutorials/light-emitting-diodes-leds).

## 4. Bộ giải DC và hành vi khi không giải được

1. Kiểm netlist trước: ID duy nhất, endpoint tồn tại, tất cả R/r dương hữu hạn, tham số trong registry. **Hard cap engine:** 64 linh kiện, 128 dây, 192 cọc, 8 LED. **Editor/phát hành R1:** tối đa 24 linh kiện, 40 dây và vẫn không vượt hard cap còn lại; deserialize/import áp dụng cùng giới hạn R1, không lách bằng file. Thông báo giới hạn trước thao tác vượt mức; không cắt bớt phần tử sau khi người chơi lắp. Các fixture nghiên cứu/benchmark thuần có thể vượt giới hạn editor nhưng phải nằm trong hard cap engine.
2. Mọi cọc là nút riêng. Các dây gặp cùng `PostRef` dùng chung nút; dây cắt nhau về hình học **không** tự nối. Không union hai đầu dây điện trở 0,02 Ω trong phép giải.
3. Loại nhánh mở/broken/loose. Tách các đảo điện; chọn cọc ID nhỏ nhất làm mốc 0 V cho từng đảo. Đảo không nguồn có dòng bằng 0. Không thêm điện trở từ mọi nút ra một “đất” chung để vô tình nối các đảo.
4. Mỗi điện trở stamp `g = 1/R`: `Gaa += g; Gbb += g; Gab -= g; Gba -= g`. Nguồn stamp g=1/r cùng nguồn dòng E/r: `rhs[a] -= E/r; rhs[b] += E/r`.
5. LED dùng `I(U) = gOff * U + max(0, (U-Vf)/Ron)`, `gOff = 1e-9 S`. Nhánh off chỉ là dòng rò số học; khi on stamp thêm 1/Ron và nguồn bù Vf/Ron. Trong ma trận có nhánh gOff của LED nhưng **không** có shunt chung ra đất. Tính cả dòng rò trong residual và năng lượng; không dùng nó cho kết quả “LED sáng”.
6. Giải `Float64Array` bằng khử Gauss có partial pivot và chuẩn hóa theo hàng. Pivot sau chuẩn hóa `< 1e-14`, số không hữu hạn hoặc residual ngoài ngưỡng phải trả lỗi, không để NaN đi vào shader.
7. Active-set LED: khởi tạo từ cache cùng cấu trúc hoặc all-off, giải rồi kiểm trạng thái theo U. Chấp nhận biên `|U-Vf| ≤ 1e-7 V`; mỗi trạng thái được trả phải ứng với ma trận **đã giải**. Tối đa 20 vòng. Gặp chu kỳ trạng thái hoặc hết vòng: duyệt tất định tối đa `2^8` trạng thái và chọn nghiệm thỏa bất đẳng thức, residual. Chia việc fallback qua task/worker nếu vượt ngân sách tương tác; không chạy 256 phép giải liền trên animation frame.
8. Kiểm KCL ở mọi nút: `|Σ I| ≤ 1e-8 A + 1e-6 * Σ|I|`. Kiểm nhánh tuyến tính và bảo toàn năng lượng tương tự. Giá trị vôn kế hiện tới 0,01 V, ampe kế tới thang phù hợp; rounding chỉ ở UI.
9. Lỗi `SolveResult`: không dùng nghiệm cũ để cho qua nhiệm vụ, trao sao hoặc tiếp tục gia nhiệt. Giữ mô hình bàn, tạm dừng hiệu ứng phụ thuộc điện, hiện “Mạch này chưa tính được — thử hoàn tác bước vừa rồi”; nút Undo vẫn dùng được. Dev panel lưu `reason/editRevision/runtimeRevision/solveRevision/affectedIds`, không tự sửa mạch của trẻ.

Ngưỡng residual, gOff, giới hạn và fallback là lựa chọn triển khai của dự án. Ngspice xác nhận hội tụ cần tiêu chí dòng/áp và có xử lý trường hợp nút floating/phần tử ngắt; tài liệu đó là căn cứ cần phát hiện lỗi, **không phải bằng chứng bộ giải hiện tại đã xử lý chúng**. [Ngspice manual, §1.4 và §11.3.5/.OP](https://ngspice.sourceforge.io/docs/ngspice-manual.pdf).

## 5. Đồng hồ mô phỏng, phản hồi và sự kiện phá mạch

`effects.ts` thuần không được chỉ đổi hình ảnh khi pin cạn/cầu chì đứt. Tách **runtime điện** khỏi **render state**:

```text
command đổi điện → editRevision++ → solveRevision++ → solve
                                                        ↓
                          event log hợp lệ ← runtime bước 20 ms
                                                        ↓
runtime đổi netlist/nguồn → runtimeRevision++ → solveRevision++ → solve
                                                                  ↓
                                                 analysis → evidence → UI
                                                                  ↓
                                              render nội suy (không đổi điện)
```

- `editRevision` tăng khi người chơi commit thay đổi điện: nối/cắt, bật/tắt, đảo/thêm pin, đổi linh kiện/thông số. Camera, đổi layout và kéo vị trí không tăng nó. `runtimeRevision` tăng khi trạng thái tự diễn biến làm thay đổi netlist/thông số điện, như tiếp điểm chuông, E máy phát, bóng/cầu chì đứt, pin cạn. Một bước tăng timer/nhiệt nhưng chưa đổi đầu vào solver không bắt buộc solve.
- `solveRevision` là số tuần tự của yêu cầu giải, tăng cho cả thay đổi người chơi và runtime. Chỉ dùng `Solution.solveRevision === latestRequestedSolveRevision` với `ok=true`; bỏ kết quả worker/counterfactual đến muộn. Nếu pending/lỗi, không tích lũy bằng chứng ổn định từ nghiệm cũ.
- Cửa sổ evidence thuộc `(runId, stepId, editRevision)`; **không reset chỉ vì solveRevision/runtimeRevision tăng**. Mỗi mẫu phải lấy nghiệm mới đúng solveRevision, và điều kiện điện phải còn đúng. Thay đổi điện do người chơi hoặc đổi mục tiêu mới reset cửa sổ đang thu; bằng chứng bước trước được lưu riêng cho so sánh trước/sau. Failure làm predicate không đúng thì reset theo predicate, không theo số revision. Điều kiện ổn định mặc định 250 ms; chuông xét sự kiện gõ trong 0,5 s vừa qua vì dòng có thể về 0 ở pha tự ngắt 80 ms. Dedupe theo `runId+stepId+editRevision+milestoneId`, không theo mỗi solveRevision.
- Fixed step `dt = 0.02 s`, thời gian **đang hiển thị và đang chơi**. Animation lấy thời gian bằng `performance.now`, runtime thuần nhận dt từ scheduler để test được. Tab ẩn, mở modal tạm dừng hoặc chuyển lab thì pause; trở lại không cộng bù hàng phút làm cháy bóng ngoài màn hình.
- Khi bị khựng, mỗi tick lấy tối đa 0,1 s chia 5 bước; nếu khoảng cách >0,5 s thì coi là pause và bỏ backlog. Các ca 30/60/120 fps dùng cùng chuỗi thời gian mô phỏng phải cho cùng sự kiện với sai số ≤1 bước.
- Kéo vị trí/đổi tuyến dây/morph/camera không đổi netlist: không solve. Nối/cắt dây, bật/tắt, lắp/đảo pin, vặn lỏng bóng, đổi R, đổi mẫu vật: solve ngay sau transaction. Điện áp máy phát được cập nhật tối đa 20 Hz; giải lại khi `|ΔE| ≥ 0.01 V` hoặc đổi dấu/dừng.
- Runtime bước từ nghiệm hợp lệ gần nhất, phát toàn bộ sự kiện cùng tick rồi áp dụng atomically. Cháy bóng, đứt cầu chì, cạn pin hoặc đổi tiếp điểm chuông → solve lại **trước** analysis, predicates và frame kế tiếp. Tối đa 4 đợt sự kiện cùng tick; vượt mức dừng mô phỏng với chẩn đoán, không loop vô hạn.
- Undo/redo lưu Circuit + trạng thái broken/charge01/fuse/chuông ở trước thao tác. Không tạo mục lịch sử mỗi 20 ms. Undo bước lắp 4 pin phục hồi cả bóng đã cháy do bước đó; reset nhiệm vụ dùng snapshot đầu bài. Snapshot sổ sáng chế **giữ charge01, broken, loose, cells, trạng thái cầu chì và công tắc**. Mở lại giải mới từ dữ liệu đó; nhiệt tạm về môi trường, không cộng thời gian khi app đóng. Không tự thay pin hoặc sửa bóng/cầu chì. Nút rõ **“Thay pin/bóng mới”** tạo một command có thể undo, giữ dây và bố cục; thumbnail phải khớp trạng thái được lưu. `charge01 = Q / capacityC` của từng viên; không suy dung lượng còn lại từ điện áp hiển thị đã làm tròn.

| Hiện tượng | Quy tắc đã chốt | Tác động điện |
| --- | --- | --- |
| Độ sáng bóng | `q = max(0,P/Prated)`; `target = min(1.3, q^0.45 * smoothstep(0.003,0.015,q))`; nội suy mũ τ=0,15 s | Chỉ là ảnh; không đổi I. Ngưỡng tối giúp bóng bị bypass thực sự trông tắt |
| Bóng cháy | `P/Prated > 2.8` liên tục 0,30 s; xuống ngưỡng thì timer về 0; sau ngưỡng `broken=true` | Loại nhánh bóng; solve lại; lóe ngắn một lần, không lặp tiếng póc |
| LED sáng | target `clamp(max(0,I)/0.02,0,1)^0.6`; nhiệm vụ sáng yêu cầu `I ≥ 0.0005 A` ≥0,25 s | Không dùng Vf để quyết định sáng thay cho I |
| LED hỏng | `I > 0.04 A` hoặc `Uab < -5 V` liên tục 0,30 s → broken | Nhánh mở; thời gian/ngưỡng calibrated, không mô phỏng đánh thủng thực |
| Cầu chì | trạng thái damage≥0; quá dòng: `damage += dt * ((abs(I)/Irated)^2 - 1) / 0.10`; dưới định mức: `damage *= exp(-dt/2)`; damage≥1 → đứt | Nhánh mở; chỉ thay mới mới nối lại. Hiện ngưỡng dòng, không ghi đây là thời gian đứt thực của cầu chì thương mại |
| Pin dùng hết | từng viên có Q ban đầu 7200 C; khi viên đang cấp năng lượng, `Q -= abs(I) * dt`; Q=0 → E=0, r=10 Ω | Cạn từng viên rồi cộng E/r hộp lại, solve ngay; không tự biến cả hộp thành hở |
| Pin nóng | `heatTarget = I²r / 0.5 W`, lọc τ=2 s; heat≥1 hiện nóng, UI clamp mức hiển thị 0–1 | Không gán nhiệt độ °C từ chỉ báo này; không tự ngắt pin. Vạch pin phản ánh Q thật, không tụt giả theo “cảm giác” |
| Pin bị nguồn khác đẩy dòng ngược | phát hiện `E_i * I_holder < -1e-6 W`; hiện cảnh báo mắc nguồn đối nhau; Q không tăng | Không dạy pin AA thường là pin sạc; không cần mô hình hóa hóa học nạp sai |
| Động cơ | từ I có dấu: `targetTurnsPerSec = sign(I) * 12 * clamp((abs(I)-0.05)/0.20,0,1)`; quán tính hiển thị τ=0,3 s | R vẫn 6 Ω. Số vòng quay minh họa, không số đo; muốn dạy phản điện động/tải cơ phải nâng model version |
| Chuông | ban đầu tiếp điểm đóng; `|I|≥0.08 A` đủ 80 ms → búa gõ, mở tiếp điểm 80 ms → đóng lại; nếu thiếu dòng, timer kéo búa về 0 | Mở/đóng là sự kiện netlist. Cảnh soi bên trong ghi chuyển động làm chậm. Predicates “chuông kêu” dùng sự kiện gõ trong 0,5 s vừa qua |
| Máy phát | tốc độ tay quay lấy chuyển động góc có dấu, lọc τ=0,1 s; clamp ±2 vòng/s; nhả tay target về 0 | Đổi E thật theo bảng; kết quả LED/đèn lấy solve, không chiếu sáng trực tiếp theo tốc độ chuột |

“Pin tụt nhanh” khi đoản mạch nghĩa là tốc độ tiêu hao tăng theo dòng so với bình thường; pin 2 Ah không hết sau vài giây. Nếu cần bài quan sát cạn pin ngắn, fixture được ghi rõ **pin gần hết**, khởi tạo Q nhỏ. Không đổi dung lượng âm thầm theo bài.

Chuyển hóa điện → nhiệt/ánh sáng/cơ/âm thanh là nhãn khái niệm. V1 không chia phần trăm năng lượng cơ/quang/âm nếu chưa có mô hình hiệu suất; biểu đồ được dùng P vào tải, không bịa tỷ lệ.

## 6. Phân tích mạch: giữ ý sư phạm, sửa lỗi BFS

Không port nguyên kết luận của engine cũ thành “chuẩn đúng”. `reach(−)` và `reach(+)` có thể cùng chứa cả một vùng khi đã có một đường kín khác. Một vòng nhánh thừa gắn ở một nút hoặc tải giữa hai điểm đồng thế vẫn có thể bị nhận nhầm là sáng. **Dòng/áp/công suất có dấu từ solve mới quyết định phần tử có hoạt động.** Cầu Wheatstone cân bằng là ca bắt buộc: nhánh giữa nối đủ đường nhưng dòng bằng 0.

Kết quả analysis tách rõ:

- `poweredLoadIds`: bóng/LED vượt ngưỡng quan sát hoặc thiết bị thực sự hoạt động theo runtime. `conductingBranchIds` chỉ xét `|I| > 1e-7 A`, không đánh đồng hai danh sách.
- `closedSourceLoops`: mỗi nguồn có đường dẫn điện ra ngoài quay về nguồn. Đây là kết cấu; không đồng nghĩa có công suất tải, ví dụ hai pin đối nhau đúng bằng nhau có vòng kín nhưng I=0.
- `shortPaths`: đường nối hai cực của một nguồn chỉ qua dây, công tắc đóng, cầu chì còn tốt, ampe kế. Với pin chanh dòng có thể rất nhỏ: vẫn chỉ ra nối tắt, chỉ báo nóng phải do `I²r` quyết định. Điện trở/tải giá trị thấp gây quá dòng là `overcurrent`, không tự dán nhãn “dây nối tắt”.
- `gaps`: danh sách có **lý do và độ chắc chắn**, ví dụ cọc cô đơn, công tắc mở, bóng lỏng, cầu chì đứt, pin thiếu. Có nhiều nhánh hở thì highlight các ứng viên; không khẳng định một chỗ hở duy nhất. Editor, deserialize và import từ chối dây nối chính cọc hoặc dây trùng **cặp PostRef không thứ tự**; báo lỗi rõ, không âm thầm gộp. Ở tầng solver thuần, hai branch ID khác nhau cùng a/b vẫn stamp được như hai nhánh song song, phục vụ test/netlist nội bộ; khả năng này không mở quyền tạo dây trùng trong editor.
- `controls[loadId]`: mô phỏng **thay trạng thái từng điều khiển** trên snapshot, giải rồi so kết quả/hoạt động tải. Với chuông, chạy runtime trên bản sao tối đa 0,5 s để xét có gõ hay không, không kết luận từ đúng một mẫu ở pha tiếp điểm đang ngắt. Với switch2 phải thử cả hai vị trí; bài cầu thang kiểm đủ 4 tổ hợp, đổi bất kỳ một công tắc phải đảo sáng/tắt. Không suy từ sự có mặt của công tắc trong mạch.

**Nối tiếp/song song là quan hệ kết nối, không chỉ là “tháo một bóng thì còn bóng nào sáng”.** Làm một đồ thị ngữ nghĩa riêng cho nhãn: collapse dây, tiếp điểm đóng, cầu chì tốt và ampe kế, nhưng giữ bản điện trở đầy đủ cho solver. Bỏ nhánh đo vôn kế khi phân loại. Loại các nhánh cụt không chứa tải đang xét bằng cắt lá.

1. `single`: đúng một tải đang được xét trong mạng nối tới nguồn.
2. `parallel`: mọi tải đang xét có cùng **cặp nút ngữ nghĩa** không thứ tự. Hai nhánh có bóng nối tiếp với điện trở khác nhau là hai nhánh tải hỗn hợp, không khẳng định riêng hai bóng song song trực tiếp.
3. `series`: các tải ở cùng một đường đơn giữa hai nút đầu nguồn; sau khi loại nhánh cụt, mọi nút trong đường có bậc 2. Các tải có cùng dòng do tình cờ cân bằng chưa đủ để gọi nối tiếp.
4. `mixed`: còn lại, kể cả cầu cân bằng, hai chuỗi nối song song, hoặc nhiều nguồn không rút được về một hộp nguồn. `none`: chưa có tải được nối để phân loại.

Nhãn lớp học dùng danh sách tải mục tiêu của fixture, không nuốt mọi tải phụ như đèn thử; đồ thị dùng trạng thái đầu thí nghiệm trước thao tác “vặn lỏng” để giữ tên “mạch nối tiếp đang hở”. Bàn tự do phân loại cấu trúc hiện hành, khi hở/không đủ điều kiện trả `none` và lời nhắc cụ thể. Phép tháo thử vẫn dùng để **giải thích hậu quả** và kiểm bài, không là thuật toán định nghĩa topology.

Tách analysis nhẹ (dòng/áp/hoạt động theo nghiệm mới) khỏi phép thử phản thực tốn nhiều lần solve. Phép thử phản thực chạy sau thao tác người chơi hoặc debounce 100 ms của thao tác đó; không debounce lại từ đầu sau mỗi xung tiếp điểm chuông. Cache phản thực theo editRevision, trạng thái hỏng/nguồn và cấu hình mục tiêu; với thiết bị tự dao động thì cache kết quả trên cửa sổ runtime của bản sao, không cache đúng một pha tiếp điểm. Bài chỉ yêu cầu kiểm những điều khiển/tải được khai báo. Khi pending thì giữ chip “Đang kiểm tra”, không dùng kết quả cũ cho qua bài. Ngân sách mỗi task ≤4 ms, chia công việc hoặc worker; không cố gom 30 ms vào một frame 16,7 ms.

## 7. Oracle tính tay và điều cần sửa trong lời giải thích

Các số dưới phân biệt **fixture số cũ** của `mna-proto.mjs` với **preset trình bày mới**: nối tiếp 3 dây, song song 4 dây riêng về pin. Mỗi dây đều 0,02 Ω, pin và bóng theo mục 3. Collapse dây chỉ phục vụ đồ thị ngữ nghĩa; solver luôn giữ điện trở từng dây. Hai cách nối cùng topology có thể khác I/U/P; không đòi preset mới khớp số của fixture dùng ít dây hơn.

| Ca | Oracle độc lập | Giá trị dự kiến |
| --- | --- | --- |
| 1 AA + 1 bóng | `I=1.5/(0.2+0.04+25/3)` | 0,174961 A; P/Prated=0,3401 |
| 2 AA + 1 bóng | `I=3/(0.4+0.04+25/3)` | 0,341945 A; P/Prated=1,2992 |
| Fixture số cũ: 1 AA + 2 bóng nối tiếp, 2 dây và một nút chung giữa bóng | `I=1.5/(0.2+0.04+2*25/3)` | 0,088722 A; mỗi bóng ≈0,08746 Prated |
| Fixture số cũ: 1 AA + 2 bóng song song, 2 dây chung | `Itotal=1.5/(0.2+0.04+(25/3)/2)`; mỗi nhánh Itotal/2 | tổng 0,340393 A; mỗi bóng ≈0,32185 Prated |
| Preset mới: 1 AA + 2 bóng nối tiếp, 3 dây riêng | `I=1.5/(0.2+0.06+2*25/3)` | 0,088617566 A; U mỗi bóng≈0,738480 V; mỗi bóng≈0,08725637 Prated (**8,7256%**) |
| Preset mới: 1 AA + 2 bóng song song, 4 dây riêng | `Itotal=1.5/(0.2+(25/3+0.04)/2)`; mỗi nhánh Itotal/2 | tổng 0,341945289 A; mỗi bóng I≈0,170972644 A, U≈1,424772 V, P/Prated≈0,32479606 (**32,4796%**) |
| 4 AA + 1 bóng | `I=6/(0.8+0.04+25/3)` | P/Prated≈4,7534; sau 0,30 s đứt nếu không được cầu chì ngắt trước |
| Nối tắt 0,02 Ω song song với nhánh bóng | `Req=1/(1/0.02+1/(25/3+0.04))`; `Itotal=1.5/(0.2+Req)` | pin≈6,8197 A; bóng còn ≈16,25 mA, P/Prated≈0,00294 |
| k quả chanh + LED đỏ | `I=max(0,(0.95*k-1.8)/(450*k+15+0.04))` | k=1: 0; k=2: 0,1093 mA; k=3: 0,7692 mA; k=4: 1,1019 mA |
| 4 chanh + bóng | `I=3.8/(1800+0.04+25/3)` | ≈2,101 mA; ≈36,8 μW, chưa sáng thấy được |
| 2 AA + LED đỏ + 100 Ω | `I=(3-1.8)/(0.4+0.04+15+100)` | ≈10,395 mA |
| Hai AA ngược nhau trong hộp 2 ngăn | `E=1.5-1.5=0`, `r=0.4` | I=0; vòng kín vẫn tồn tại |

Sai số bắt buộc: tuyến tính `max(1e-8 A/V/W theo đại lượng, 1e-6 * |expected|)`; LED theo mô hình gOff cho phép tới `1e-7 A`. Kiểm cả số gần 0 bằng absolute tolerance, không dùng chỉ phần trăm. Dòng rò số học không được làm qua bài.

Những câu cần dùng đúng:

- “Hai đèn song song sáng **gần như** khi chỉ có một đèn”: nội trở nguồn làm mỗi bóng giảm chút; tổng dòng của preset **4 dây riêng ≈1,9544 lần** mạch một bóng 2 dây. Fixture cũ dùng 2 dây chung cho hai bóng có tỷ lệ≈1,9455; cả hai đều không đúng 2 lần.
- “Dây nối tắt làm bóng **gần như tắt**”: dòng qua bóng không bằng 0 tuyệt đối khi dây có R hữu hạn; renderer có ngưỡng cảm nhận nhưng không sửa kết quả vật lý.
- “Hai quả chanh chưa làm LED sáng rõ trong mẫu này”: model đã cho khoảng 0,109 mA; không được dạy chưa qua Vf nếu model cho qua rồi.
- “Bốn quả chanh chưa thắp được bóng này”: vẫn có dòng và công suất rất nhỏ. Phân biệt không sáng với không dẫn điện.
- Đảo cả pin trên bóng sợi đốt vẫn sáng; đảo riêng một viên trong hộp thay E; đảo LED thay khả năng dẫn. Nhiệm vụ về cực phải chỉ rõ đang nói loại nào.

## 8. Electron trong dây và giới hạn khoa học của hình ảnh

Hiệu ứng dòng trên bàn dùng tốc độ `vScreen = k * log1p(abs(I)/Iref)`, mật độ hạt không đổi; tất cả đoạn được cấp nguồn bắt đầu chuyển động từ cùng kết quả solve. Không chạy một chấm từ pin tới đèn rồi mới bật đèn. Không đặt mốc thời gian “đúng tuyệt đối” ở quy mô nanô.

Trong Soi dây, ví dụ tính được và có nhãn điều kiện: đồng có `n≈8.5e28 electron/m³`, dây tiết diện `A=1 mm²`, dòng `I=0.175 A`; `vd=I/(n*e*A)≈1.29e-5 m/s≈0.013 mm/s`. Nếu dòng khác, HUD tính lại; không hiện cùng tốc độ cho mọi mạch. Tốc độ tín hiệu thường cỡ `10^8 m/s`, phụ thuộc cấu trúc đường truyền, khác với vận tốc trôi electron. Đây là suy ra từ công thức và dữ kiện ví dụ, không phải đo dây đồ chơi của app. [OpenStax, Current and Drift Velocity](https://openstax.org/books/college-physics/pages/20-1-current).

Mạng Cu ở cỡ nguyên tử là sơ đồ tinh thể; các chấm tự do và biên độ rung đã phóng đại để nhìn được. Vỏ nhựa có electron liên kết, không nên thuyết minh “không có electron”. Với dung dịch muối/chanh, giải thích dòng nhờ ion trong dung dịch; không tái dùng hình biển electron kim loại cho chất lỏng. Các thử nghiệm tĩnh điện và phần 220 V gia dụng là mô hình/cảnh riêng, không đưa vào solver DC này.

## 9. Bằng chứng đã có và cổng nghiệm thu cần làm

Đã thêm [mna-proto-check.mjs](../proto/mna-proto-check.mjs), chạy ngày 29/09/2026 bằng:

```sh
node docs/electricity-wow/proto/mna-proto-check.mjs
```

**Kết quả hiện tại: 21/21 ca qua.** Runner đọc nguyên prototype, trích phần định nghĩa vào VM, clone input, dùng công thức độc lập để đối chiếu: pin/bóng, nối tiếp/song song (cả fixture số cũ và preset trình bày mới 3/4 dây), LED, nối tắt, pin đối nhau, nhánh cụt, đảo rời, cầu cân bằng và bảo toàn năng lượng. Không dùng `solver-cases.txt` làm oracle; file đó chỉ là log lịch sử. Adapter có assertion mốc trích để lỗi rõ khi prototype đổi cấu trúc.

21 ca này xác nhận số DC cơ bản của **prototype**, chưa xác nhận engine production. Prototype còn làm biến đổi `e.on`, trả |U|, thêm shunt mọi nút và không trả lỗi hội tụ; không được kéo thẳng vào app rồi coi đã đạt GĐ0.

| Cổng | Phải có bằng chứng khi triển khai |
| --- | --- |
| Tính đúng số | Chuyển 21 oracle sang test TS; thêm dòng dây có dấu, công tắc 3 cọc, vôn kế/ampe kế, đảo cọc, node-order permutation và nhiều đảo có nguồn độc lập |
| Không tự chứng minh | Expected lấy công thức riêng/fixture tay; kiểm KCL và tổng công suất. Không ghi snapshot từ chính solver rồi coi snapshot là đúng |
| Hội tụ/lỗi | LED ở ngay ngưỡng, 8 LED hỗn hợp chiều, cache khác nhau vẫn cùng nghiệm; cố tình ép iteration limit để kiểm fallback/error; input không bị mutate; invalid R/missing endpoints/duplicate IDs/NaN bị chặn |
| Topology | Nhánh thừa một đầu, vòng phụ gắn một nút, cầu cân bằng, hai nhánh mỗi nhánh 2 bóng, hai bóng cùng cặp nút, công tắc bị dây bypass, switch2 đủ 4 tổ hợp |
| Thời gian | Cầu chì mở thì dòng giảm ngay; bóng cháy không chỉ xám đi; pin cạn solve lại; chuông không tự kêu khi hở; LED hỏng theo đúng solveRevision; pause/resume không cộng nhiệt thời gian nền |
| Tính tất định | Replay cùng thao tác với 30/60/120 fps cho cùng trạng thái/sự kiện; render tắt hoàn toàn vẫn ra cùng kết quả; undo/redo không cộng sao hoặc tích lũy nhiệt lặp |
| Nội dung | Mỗi bài có netlist lời giải và ít nhất 3 mạch sai; trạng thái sáng giữ ≥0,25 s; chuông dùng event history 0,5 s qua nhiều runtime/solveRevision, không reset chỉ vì tự ngắt tiếp điểm; chỉ chấp nhận solution đúng solveRevision và không pending |
| Hiệu năng | Fixture 63 nút/92 nhánh và tải 12 linh kiện/14 dây, 100 warmup + 1000 mẫu, ghi CPU/browser/build, median/p95. Mục tiêu một solve tuyến tính p95≤4 ms trên máy mốc; analysis chia task≤4 ms; chưa coi số ~1 ms trên máy tác giả là cam kết điện thoại |

Chỉ đánh dấu GĐ0 xong sau các cổng tương ứng của engine production. Cấu hình nhiệt/thiết bị ở tài liệu này phải được gắn `modelVersion: 1` vào fixture và mạch lưu để thay thông số sau này không làm nhiệm vụ cũ đổi đáp án âm thầm.
