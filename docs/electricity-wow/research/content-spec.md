# Điện & Mạch Điện — hợp đồng nội dung v1

Ngày chốt: 29/09/2026. Đây là đặc tả để tạo dữ liệu và fixture kiểm thử, **chưa phải nội dung đã có trong app**. Tên ID dưới đây ổn định qua bản dịch và qua thay đổi thứ tự bài. R1: bài 1–11, lab vật dẫn, cảnh an toàn nhỏ, bốn nhiệm vụ và bốn ca sửa mạch đầu tiên. R2: bài 12–13, nhà, các lab còn lại và nội dung nâng cao.

## 1. Căn cứ chương trình, không đánh đồng với yêu cầu của app

Nguồn chương trình là phụ lục chính thức do Bộ GDĐT ban hành kèm TT32/2018, được trường học lưu lại; không dùng bản **dự thảo tháng 1/2018**. Các trang dưới đây là số trang in trong PDF. Nội dung trong bảng là diễn giải ngắn, không phải trích nguyên văn SGK.

| Nhãn | Căn cứ đã đối chiếu | Phạm vi app |
| --- | --- | --- |
| `KH5-core` | Khoa học 5, trang 15–16: cấu tạo/hoạt động mạch đèn có nguồn và công tắc; vật dẫn/cách điện và thiết kế phép thử; an toàn, tiết kiệm; năng lượng mặt trời/gió/nước. [Phụ lục môn Khoa học](https://fileth.hcm.shieldix.app/data/hcmedu/thphudinh/2019_9/2019-2020/tin%20t%E1%BB%A9c%20s%E1%BB%B1%20ki%E1%BB%87n/ch%C6%B0%C6%A1ng%20tr%C3%ACnh%20t%E1%BB%95ng%20th%E1%BB%83/10_ctkhoa_hoc_259201916.pdf) | Bài 3–7, 12–13; bài 1–2 là làm quen phù hợp trẻ nhỏ. |
| `KHTN7-preview` | KHTN 7, trang 37: từ trường, nam châm điện, thay đổi dòng điện để thay đổi từ trường. | Lab nam châm, không ghi là chương trình điện lớp 8. |
| `KHTN8-preview` | KHTN 8, trang 48–49: nhiễm điện do cọ xát, nguồn/dòng điện, mạch đơn giản, tác dụng dòng điện, kí hiệu, cầu chì/chuông, đo dòng và điện áp. | Sơ đồ, đồng hồ, tĩnh điện, chuông/cầu chì. |
| `KHTN9-preview` | KHTN 9, trang 61–63: Ohm, nối tiếp/song song, công suất/năng lượng, cảm ứng điện từ. | Bài 10–11 định tính; công thức và máy phát là mở rộng. |

Ba dòng KHTN cùng đối chiếu [phụ lục môn Khoa học tự nhiên](https://thcsvotruongtoanvc.edu.vn/image/catalog/THONG%20TU%2032%20CTR%20GDPT%202018/11--CT_Khoa-hoc-tu-nhien.pdf). Vẽ sơ đồ bằng kí hiệu điện chuẩn, V/A, điện trở, số kWh và phép tính tiền là **mở rộng của sản phẩm**, không quảng bá là yêu cầu bắt buộc Khoa học 5. Bài “thêm pin” là thí nghiệm mở rộng về nguồn điện; không gán một yêu cầu SGK cụ thể cho thử làm cháy bóng. App không phải học liệu bao trọn chương trình THCS.

TT17/2025 sửa một số chương trình theo thay đổi hành chính, tập trung Lịch sử/Địa lí/GDCD; không có căn cứ từ thông tư này để đổi mapping phần điện nói trên. [Thông tin và văn bản trên Cổng Chính phủ](https://xaydungchinhsach.chinhphu.vn/thong-tu-so-17-2025-tt-bgddt-sua-doi-bo-sung-mot-so-noi-dung-trong-chuong-trinh-giao-duc-pho-thong-119250916145653739.htm).

## 2. Học gì từ PhET và giới hạn sử dụng nguồn

PhET CCK: DC có linh kiện như thật và sơ đồ trên cùng mạch; bật/tắt nhãn, giá trị, electron/chiều quy ước; đo V/A; đồ vật dẫn/cách điện; thao tác thay thế bằng bàn phím. Mục tiêu học tập gồm suy luận từ số đo và xây mạch từ sơ đồ. [Mô phỏng gốc](https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html), [mục tiêu học tập](https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc?locale=en).

Áp dụng vào app bằng quyết định thiết kế riêng:

- Dự đoán → tác động một biến → quan sát → giải thích bằng một lựa chọn ngắn. Không cho qua bài chỉ vì tải cuối cùng đang sáng.
- Sơ đồ, dụng cụ đo và bàn đồ chơi dùng cùng trạng thái điện; chuyển góc nhìn không khởi động lại thí nghiệm.
- Giữ dấu vết so sánh “trước/sau”: ảnh thu nhỏ, độ sáng, lượng pin. Trẻ chạm lại để xem điều mình vừa chứng minh.
- Gợi ý dựa trên phép đo hoặc điểm hở, không lấy đáp án ra đọc ngay.

Tự viết lời Việt, asset, bố cục và code; nguồn chỉ chứng minh kiến thức/hướng tham khảo. Không chép câu SGK, hình SGK, sprite hay code PhET vào sản phẩm trong phạm vi plan này. Nếu triển khai phát sinh nhu cầu tái sử dụng, kiểm giấy phép của đúng asset/repository tại thời điểm đó; không suy diễn rằng “có trên web” nghĩa là dùng tự do. [Trang giấy phép PhET](https://phet.colorado.edu/en/licensing).

## 3. Chuẩn dữ liệu và cách chấm

Mỗi `LessonSpec`/`MissionSpec`/`FaultSpec` có `id`, `revision`, `release`, `minimumTools`, `curriculumTags`, `intro` (tối đa 3 câu), `steps`, `allowedParts`, `initialCircuitId`, **`canonicalLayoutId` duy nhất cho bàn 14×8**, `predicates`, `hintRules[3]`, `takeaway`, `sourceIds`. Portrait hiển thị cùng bố trí thành 8×14 bằng `T(x,z)=(z,14-x)`; không có layout vật lý riêng theo hướng màn hình, không sửa `Part.rot`, post ID hoặc Circuit khi resize. `steps` chứa chính lời đọc/gợi ý và `audioKey`; không đặt lời học ở component React.

Mỗi fixture có **trạng thái ban đầu + chuỗi hành động + kết quả điện mong đợi**. Harness dùng engine/runtime thật và thời gian ảo xác định, không chấm `part.kind` đơn thuần, không dùng màu/bloom làm bằng chứng. Nội dung không có mạch dùng `classification`, `hazardChoice` hoặc `sequenceChoice` thay `Solution`.

Quy ước dùng trong các bảng:

- `on(L)`: bóng nguyên vẹn và `P/Prated >= 0.05`; `off(L)`: `P/Prated < 0.005`. Đây là ngưỡng sư phạm, không tuyên bố là ngưỡng mắt người thật. Riêng bài/mission yêu cầu “đủ sáng” dùng `P/Prated >= 0.25`.
- LED đạt khi `Ivisible <= I <= Irated` (`0,5–20 mA` ở kit v1); còi/chuông/động cơ đạt theo tham số loại linh kiện trong [đặc tả vật lý](engine-spec.md), không đặt ngưỡng riêng để ép nhiệm vụ qua. Đây là yêu cầu hoạt động đúng định mức của bài; không nhầm với ngưỡng hỏng LED40 mA/0,30 s. Chuông có tiếp điểm tự ngắt nên bằng chứng “kêu” là có sự kiện gõ trong 0,5 s vừa qua và sau khi bắt đầu bước quan sát hiện tại, không đòi I khác 0 ở mọi mẫu thời gian. Sau nhả nút, bằng chứng “dừng” là không có sự kiện gõ mới trong cửa sổ 0,5 s kể từ nhả; không dùng một tiếng gõ trước nhả để kết luận vẫn đang được cấp điện.
- `controls(K,L)` là phép thử đối chứng: giữ nguyên mạch, đóng K làm L hoạt động, mở K làm L dừng. Có cả snapshot thật do trẻ tạo và phép kiểm phản thực bằng engine để loại dây nối tắt.
- `stable`: thỏa predicate liên tục 250 ms thời gian mô phỏng qua các kết quả giải còn mới; nhiệm vụ ghi thời gian riêng như giữ quạt2 s dùng thời gian đã khai báo đó. Sự kiện thao tác như mở rồi đóng phải xảy ra ở **hai trạng thái khác nhau**. Thời gian chờ không phải số khung hình; điều kiện chuông dùng lịch sử gõ nói trên thay điều kiện dòng tức thời.
- `healthy`: không đoản mạch, không tải hỏng, không quá nhiệt và **không overload đang diễn ra theo ngưỡng engine**, kể cả khi timer chưa đủ làm đứt tải. Điều này chặn mạch quá tải đạt cửa sổ250 ms rồi mới cháy ở300 ms. Có thể sai rồi sửa; không tước sao vì trẻ thử sai trước đó.
- `evidence` lưu theo phiên làm bài gồm ID sự kiện và snapshot/giá trị đủ chấm. Mở/xem trang, thời lượng nghe audio hoặc click nút “Kiểm tra” không tự sinh bằng chứng hoàn thành.
- Tách **`editRevision`** (lệnh người chơi đổi kết nối, tham số điện hoặc điều khiển) và **`solveRevision`** (mọi thay đổi cần giải lại từ lệnh đó **hoặc runtime**, gồm tiếp điểm chuông, cầu chì, pin, nguồn quay tay). `revision` trong bản ghi nội dung là phiên bản nội dung, không thay hai số này. Di chuyển để trình bày, đổi camera và resize không tăng revision điện.
- Chỉ chấm khi `Solution.solveRevision === runtime.solveRevision`, solve thành công và analysis cần dùng đã xong cùng revision. Pending/error/stale không được dùng để tích lũy thời gian hay sinh evidence. Mỗi mẫu số đo lưu cả `editRevision`, `solveRevision` và thời gian mô phỏng để truy lại nguồn kết quả.
- Cửa sổ quan sát bắt đầu lại khi người chơi sửa điện hoặc bước/mục tiêu đối chứng thay đổi; `stable` cũng về 0 nếu predicate thật sự sai. **Không reset chỉ vì `solveRevision` tăng**: nguồn thay đổi theo runtime được chấm bằng kết quả mới; chuông tự mở tiếp điểm80 ms vẫn giữ cửa sổ quan sát và predicate theo lịch sử gõ. Bóng cháy làm predicate “bóng sáng khỏe” sai nên phải reset, không được giữ kết quả trước khi hỏng.
- Evidence kết quả dedupe theo `(runId, stepId, editRevision, milestoneId)`; tiếng gõ thô vẫn ghi riêng theo event ID/thời gian. Snapshot đối chứng đã đạt được giữ qua thao tác thay đúng biến bài yêu cầu, chỉ vô hiệu nếu thay biến bị khóa hoặc đổi mục tiêu. Dedupe không theo `solveRevision`, tránh trao lại điểm sau mỗi nhịp chuông. Tải lại phiên đã hoàn thành không cộng sao lần nữa.

Giá trị linh kiện mặc định luôn có một nguồn dữ liệu duy nhất theo [đặc tả engine](engine-spec.md); tiến độ, cấp sao và ledger theo [đặc tả tương tác/tiến độ](interaction-progress-spec.md). Ordinal 1–13 chỉ để hiển thị, không dùng để suy ra ID sau khi sắp lại bài.

## 4. Hành trình 13 bài: dữ liệu và nghiệm thu

| ID / bài | Kịch bản ban đầu và việc làm | Bằng chứng bắt buộc / fixture đúng | Fixture sai phải chặn; gợi ý đầu | Câu kết tự viết |
| --- | --- | --- | --- | --- |
| `L01-powerAround` / 1 | 9 tranh có nguồn rõ: đèn pin 2 pin, điều khiển TV, đồng hồ pin; ấm cắm điện, tủ lạnh, quạt cắm điện; sách, bóng đá, thìa. 3 rổ theo nguồn của **đồ vật trong tranh**. | 9/9 đúng; mỗi rổ có 3 thẻ. Đổi đáp án được, không phạt. | Không dùng tranh điện thoại/quạt vừa pin vừa điện gây hai đáp án. Gợi ý chỉ vào pin/phích trên tranh. | “Cùng tên đồ dùng có thể dùng nguồn khác nhau. Mình nhìn đúng mẫu đang có nhé.” |
| `L02-safeRoom` / 2 | Cảnh nhỏ với 5 hotspot `wetHands`, `exposedWire`, `foreignObject`, `wetAppliance`, `damagedOutlet` (§7); mỗi hotspot 2 lựa chọn. | Nhận diện đủ 5 + chọn hành động an toàn; `safeChoice` riêng từng ID. | Chạm tìm ra nguy cơ nhưng chọn “tự sửa” không qua. Gợi ý nêu vật có nguy cơ, không cho điểm vì chạm mò nhiều lần. | “Thấy điện bất thường: tránh chạm và gọi người lớn.” |
| `L03-firstLight` / 3 | Một pin, một bóng, chưa có dây; nối hai cọc khác nhau của bóng với hai cực nguồn. | `on(L) && healthy` stable; nguồn cấp công suất thực vào bóng. | Chỉ một dây; hai dây về cùng cực; vòng dây bỏ qua bóng. “Ánh sáng cần một đường đi khép kín qua bóng.” | “Mạch khép kín đưa năng lượng từ pin tới bóng.” |
| `L04-openClosed` / 4 | Mạch đúng thiếu một dây; sửa rồi dùng thao tác cắt dây và nối lại. | `off → on → off → on`, mỗi bước có hành động trẻ và snapshot. | Dây thừa lủng lẳng không có vai trò; chỉ thay pin không sửa khe hở. “Theo đường dây từ pin, chỗ nào chưa nối?” | “Một chỗ hở cũng đủ ngắt đường đi.” |
| `L05-switch` / 5 | Pin+bóng có sẵn; thêm K vào đường cấp bóng. | `controls(K,L)` + trẻ đóng/mở/đóng K, có 2 trạng thái tương ứng. | K đặt bên ngoài hoặc có dây bắc cầu qua K. “Công tắc phải nằm trên đường đi tới bóng.” | “Công tắc đóng hoặc mở đường đi của dòng điện.” |
| `L06-twoContacts` / 6 | Bóng phóng lớn; chọn điểm đáy và phần ren kim loại, lớp cách điện được tô riêng; hộp một pin có dấu cực. | Chọn đúng hai điểm khác nhau → lắp mạch sáng; đảo một pin duy nhất: bóng sợi đốt vẫn sáng, hướng dòng đổi. | Kẹp hai dây lên cùng vỏ ren không được tính; không yêu cầu trẻ nối tắt hai cực pin. Gợi ý soi đường từ tiếp điểm tới dây tóc. | “Bóng sợi đốt có hai tiếp điểm, không có cực cộng trừ; pin thì có.” |
| `L07-conductors` / 7 | Lab (§5), 12 mẫu core cố định; trẻ dự đoán rồi kẹp thử và phân loại. Mẫu nước/graphite là câu hỏi mở rộng sau core. | Đã đo đủ 12 mẫu, sửa phân loại đúng 12/12, nhận ra lõi đồng/vỏ nhựa cùng một dây khác nhau. | Không qua vì đoán 12 mẫu mà không thử; không suy “đèn tắt = cách điện” cho mẫu nhạy. “Kiểm tra hai kẹp đang chạm vào phần nào.” | “Mình thử vật liệu và điểm tiếp xúc, không chỉ nhìn tên đồ vật.” |
| `L08-schematic` / 8 | 3 mạch nhỏ: pin–bóng; pin–K–bóng; pin–nút nhấn–chuông. Đọc một sơ đồ, tự lắp; vẽ lại hai mẫu. | Đúng đồ thị điện và trạng thái điều khiển cả 3; chuyển hình thật/sơ đồ vẫn cùng circuit ID. | Không so vị trí pixel hoặc yêu cầu dây y hệt đáp án. Gợi ý đi từ cọc nguồn theo kí hiệu. | “Sơ đồ giữ nguyên cách nối, dù hình vẽ trông khác.” |
| `L09-moreCells` / 9 | Hộp cấu hình1 ngăn lắp đủ1 pin → mở rộng thành2 ngăn và lắp đủ2 pin đúng chiều → đảo một viên. Ngăn được cấu hình mà trống vẫn là mạch hở, không tự bắc cầu. Xem quá tải bằng demo có nút xem riêng. | Lưu P1, P2: `P2>P1`; hai viên đối nhau làm bóng tắt; trẻ chọn lời giải thích “hai nguồn chống nhau”. | Thay điện trở/bóng giữa hai phép đo bị vô hiệu đối chứng. Gợi ý giữ các món khác như cũ. | “Pin cùng chiều làm tăng điện áp; hai viên giống nhau ngược chiều có thể triệt tiêu.” |
| `L10-series` / 10 | 1 pin và 2 bóng cùng loại, tạo một vòng duy nhất. So với snapshot một bóng; vặn lỏng rồi siết lại L1. | Cả hai có cùng dòng trong sai số solver; P mỗi bóng nhỏ hơn mạch một bóng; lỏng L1 → cả hai tắt; siết lại → cả hai sáng. | Song song không được đánh dấu nối tiếp chỉ vì đặt cùng hàng. “Đếm đường đi qua bóng, không đếm hàng trên bàn.” | “Hai bóng nối tiếp cùng một đường; hở một bóng thì cả đường dừng.” |
| `L11-parallel` / 11 | Một pin, 2 bóng cùng loại; mẫu tham chiếu có **4 dây riêng: mỗi bóng tự nối cả hai đầu về hai cực nguồn**, không chuyền dây từ bóng này sang bóng kia. Tô sáng từng nhánh; vặn lỏng L1 và siết lại. | Hai bóng cùng cặp nút **ngữ nghĩa** của nguồn sau collapse dây trong analysis; U hai bóng gần bằng nhau theo netlist thật; lỏng L1 → L1 tắt/L2 vẫn sáng. Chấp nhận L2 sáng lên nhẹ do sụt áp nguồn giảm. Cách nối cùng topology và đạt điều kiện vẫn được chấm đúng, không đòi I/U/P bằng đúng mẫu tham chiếu. | Không khẳng định “hoàn toàn không ảnh hưởng nhau” với pin có điện trở trong. Gợi ý lần theo **hai vòng riêng** từ nguồn qua từng bóng về nguồn; mẫu ảnh phải tách dây nhìn rõ. | “Mỗi bóng có đường đi riêng về pin; nhánh còn kín vẫn sáng khi nhánh kia hở.” |
| `L12-saveAtHome` / 12, R2 | Hai cảnh §6: tắt đồ không dùng trong một giờ; thay 5 bóng 60 W bằng LED 9 W cùng ánh sáng minh họa. | Đúng bộ thiết bị cần giữ; E sau<E trước với cùng lịch; đổi đủ 5 đèn cho tiết kiệm 0,255 kWh/giờ. Chọn đúng “cùng thời gian và đủ ánh sáng”. | Tắt tủ lạnh để thắng hoặc so lịch khác độ dài không qua. Gợi ý xem phòng đang có người. | “Tiết kiệm là vẫn đáp ứng nhu cầu mà dùng ít điện hơn.” |
| `L13-powerJourney` / 13, R2 | Thu nhỏ nhà→phố→mạng điện→4 nguồn; ghép nguồn đầu vào với cách tạo điện. | Đúng chuỗi nhà←phân phối←truyền tải←nguồn; ghép nắng/gió/nước/nhiên liệu 4/4; thử cảnh đêm làm mặt trời giảm và chọn một nguồn/bộ lưu trữ bù trong mô hình. | Không cho “đêm mặt trời vẫn đủ” hoặc “điện tái tạo không có tác động nào” là đáp án. | “Điện đến từ nhiều nguồn; lượng tạo ra phải đáp ứng lượng đang dùng.” |

Bài 3–11 có ít nhất một fixture đúng và ba fixture sai triển khai từ các lỗi trong bảng. Mỗi fixture chỉ có một bố trí canonical14×8; kiểm cùng mạch ở landscape14×8 và portrait8×14 qua view transform, hash Circuit không đổi khi resize. Bài 7 R1 cần lab vật dẫn trước phát hành bài học. Bài 2 dùng cảnh độc lập, không phụ thuộc hoàn thành mô hình nhà R2. Demo bóng hỏng là tùy chọn, không khóa tiến độ trẻ lớp 1–2 bằng thao tác cố ý phá hỏng.

**Oracle riêng cho mẫu song song4 dây:** mỗi nhánh có `25/3 + 2*0.02 Ω`; `I_branch=1.5/(2*0.2 + 25/3 + 0.04)`, `P_lamp/Prated=I_branch²*(25/3)/0.75≈0.3248`. Mẫu cũ có hai dây đi/về chung là netlist khác, cho khoảng0,3218. Collapse dây chỉ phục vụ nhãn topology; solver luôn giữ0,02 Ω cho từng đối tượng dây. Hai mạch cùng sơ đồ kết nối ngữ nghĩa không có nghĩa I/U/P phải trùng tuyệt đối khi số dây, nhánh chung hoặc trạng thái tải khác. Không dùng một bộ số expected để chấm mọi cách đi dây.

## 5. 16 mẫu dẫn điện: điều kiện thử phải đi cùng tên mẫu

**Tách kiến thức và preset.** Kim loại thường dẫn điện; graphite dẫn điện; vật liệu nhựa, cao su, thủy tinh, gỗ khô thường được dùng cách điện trong điều kiện thích hợp. Nước có ion dẫn điện; lượng ion, nhiệt độ và hình học phép đo ảnh hưởng kết quả. Không coi nước máy là an toàn vì đèn thử không sáng. [RSC — thử chất dẫn điện](https://edu.rsc.org/experiments/which-substances-conduct-electricity/1789.article), [USGS — độ dẫn điện của nước](https://www.usgs.gov/water-science-school/science/conductivity-electrical-conductance-and-water), [USGS — phương pháp đo](https://pubs.usgs.gov/publication/twri09A6.3).

Các điện trở dưới đây là **preset minh họa do app chọn**, đã bao gồm tiếp xúc của mẫu; không phải bảng điện trở suất, không phải số đo thực nghiệm của mọi thìa/bút chì/cốc nước. Phải lưu `valueKind:'illustrative'`, `assumptions`, `sourceIds` cho từng mẫu. Mẫu cách điện được mô hình bằng nhánh hở (`R:null`), không biểu thị điện trở thật vô hạn. Chỉ bài mẫu điện áp pin thấp, không suy sang điện nhà.

| ID | Mẫu/giả định hình ảnh | R preset Ω | Phân loại trong phép thử / lời giải thích | Bộ |
| --- | --- | ---: | --- | --- |
| `copperCore` | Lõi dây đồng trần sạch; kẹp đúng lõi | 0.05 | Dẫn; electron chuyển động trong kim loại. | core |
| `aluminiumStrip` | Thanh nhôm sạch, kẹp tiếp xúc tốt | 0.08 | Dẫn; lớp bẩn/oxide ở điểm kẹp có thể làm tiếp xúc kém ngoài đời. | core |
| `steelSpoon` | Thìa inox không phủ, chạm phần kim loại | 0.5 | Dẫn; tay cầm bọc nhựa là một phần khác. | core |
| `brassKey` | Chìa khóa đồng thau, không phủ sơn | 0.15 | Dẫn; đây là hợp kim kim loại. | core |
| `paperClip` | Kẹp giấy thép không bọc nhựa | 0.3 | Dẫn; đổi kẹp bọc nhựa có thể làm hở ở chỗ kẹp. | core |
| `kitchenFoil` | Miếng giấy nhôm liền, không bị rách | 0.1 | Dẫn; chữ “giấy” không quyết định vật liệu. | core |
| `metalCoin` | Đồng xu bằng kim loại, không sơn | 0.2 | Dẫn; không buộc vào mệnh giá hay hợp kim đồng tiền hiện hành. | core |
| `plasticRuler` | Thước nhựa khô, không có dải kim loại | null | Không phát hiện dòng ở phép thử pin này. | core |
| `rubberEraser` | Tẩy cao su sạch, khô | null | Không phát hiện dòng; không biến mọi loại cao su thành thiết bị bảo hộ. | core |
| `dryWood` | Đũa tre/gỗ khô, không sơn dẫn điện | null | Khô là điều kiện quan trọng; vật ẩm có thể dẫn tốt hơn. | core |
| `glassCup` | Thành cốc thủy tinh khô, kẹp vào thành | null | Thành cốc và chất lỏng trong cốc là hai mẫu khác nhau. | core |
| `dryPaper` | Tờ giấy sạch, khô, không phủ kim loại | null | Không phát hiện dòng trong điều kiện này. | core |
| `graphiteRod` | Đoạn ruột bút chì lộ hai đầu, dài 3 cm | 220 | Dẫn yếu hơn mẫu kim loại; điện trở phụ thuộc thành phần/lõi, độ dài, độ dày. Không bảo đảm bóng sợi đốt thật luôn sáng. | mở rộng |
| `saltWater` | Mẫu nước muối loãng; 2 điện cực cố định, cùng độ ngập/khoảng cách | 1000 | Dẫn bằng ion trong dung dịch. Không vẽ electron chạy xuyên qua nước như dây đồng. | mở rộng |
| `tapWater` | Mẫu nước máy minh họa; cùng hình học điện cực | 100000 | Dẫn yếu trong mẫu này, còn phụ thuộc ion; đèn tắt không đồng nghĩa an toàn/cách điện tuyệt đối. | mở rộng |
| `plasticJacket` | Chính dây đồng ở hàng đầu, nhưng hai kẹp chỉ chạm vỏ nhựa nguyên | null | Điểm kẹp bị cách ly dù bên trong có lõi dẫn. | mở rộng |

**Mạch đo khóa cấu hình:** nguồn 3,0 V, điện trở trong tổng 0,4 Ω, điện trở bảo vệ 100 Ω, mẫu thử, đúng 2 dây ngoài mỗi dây0,02 Ω; điện trở bảo vệ gắn trong hộp nguồn. Đồng hồ quan sát I của nhánh từ `Solution`, không thêm phần tử nguồn/dây lí tưởng. Dòng tính bằng engine, oracle kiểm độc lập `I=3/(100.44+R)` (A) cho mẫu có R; mẫu nhánh hở I=0. Chỉ các trị số này là preset của dụng cụ này, không thay đổi tham số toàn cục của pin app. Lớp nhỏ hiện “có dòng/không phát hiện”; nút “đo nhạy” hiện µA/mA cùng nhãn điều kiện thử.

Đèn chỉ báo trên màn hình **dụng cụ đo** phản ánh số đo từ `Solution`, không phải bóng sợi đốt mắc thay dụng cụ: trên 0,1 mA → báo có dòng, 0,001–0,1 mA → báo dòng nhỏ khi bật đo nhạy, dưới 0,001 mA → chưa phát hiện. `graphiteRod` ≈9,362 mA, `saltWater` ≈2,726 mA, `tapWater` ≈29,970 µA. Cảnh đổi đèn/LED riêng giải lại đúng linh kiện và có thể khác chỉ báo. Không ép LED sáng bằng ID đồ vật.

Huy hiệu `sorter`: 12 mẫu core đã thử và phân loại đúng. Lượt mở rộng cố ý hỏi “chỉ nhìn bóng tắt đã kết luận được chưa?”; đáp án đúng là cần dụng cụ nhạy/kiểm tra tiếp xúc. Không thêm cơ thể người hoặc ổ điện làm mẫu thử.

## 6. Ngôi nhà: dataset minh họa và phép tính có thể kiểm

Dataset `house-demo-v1` chỉ đại diện **một căn nhà giả lập**. Mỗi thiết bị có `mode`, `powerW`, `schedule`, `essential`, `label:'Công suất minh họa'`. Không lấy số giả lập làm thông số đại diện toàn thị trường. Watt thể hiện công suất; kWh thể hiện điện năng. Quan hệ điện năng theo công suất và thời gian là kiến thức chuẩn. [DOE — Electricity 101](https://www.energy.gov/oe/electricity-101), [Energy.gov.au — ước tính điện năng và chi phí](https://www.energy.gov.au/households/energy-rating).

| ID / thiết bị | Chế độ → W | Lịch mặc định một ngày | kWh/ngày oracle |
| --- | --- | --- | ---: |
| `lampIncandescent` / mỗi bóng, 5 bóng | sáng 60; tắt 0 | 4 h sáng/bóng | 1,200 cho cả 5 |
| `lampLed` / phương án thay 5 bóng | sáng 9; tắt 0 | cùng 4 h và cùng ánh sáng minh họa | 0,180 cho cả 5 |
| `fan` / quạt | chạy 50; tắt 0 | 6 h | 0,300 |
| `tv` | xem 80; chờ 1; ngắt 0 | 3 h xem + 21 h chờ | 0,261 |
| `fridge` | máy nén chạy 100; nghỉ 2 | 8 h chạy + 16 h nghỉ, vẫn cắm điện | 0,832 |
| `riceCooker` | nấu 700; giữ ấm 30; tắt 0 | 0,5 h nấu + 2 h giữ ấm | 0,410 |
| `kettle` | đun 1500; tắt 0 | 0,1 h | 0,150 |
| `airConditioner` | chạy 900; tắt 0 | 4 h chạy tương đương | 3,600 |
| `waterHeater` | đun 2000; tắt 0 | 0,5 h đun tương đương | 1,000 |
| `phoneCharger` | sạc 10; chờ 0,1; ngắt 0 | 2 h sạc + 22 h chờ | 0,0222 |

Các chu kỳ tủ lạnh/điều hòa/đun nước là **lịch minh họa**, không mô phỏng nhiệt căn nhà và không suy số công suất cực đại thành hoạt động liên tục. Tổng ngày với 5 bóng sợi đốt = **7,7752 kWh**, đổi 5 LED = **6,7552 kWh**; chênh **1,02 kWh/ngày**. Trạng thái đang chạy của công tơ lấy từ lịch tức thời, không lấy kWh/ngày chia đều rồi giả là dòng thật.

`energyKWh += sum(activePowerW) * simulatedDeltaSeconds / 3_600_000`. Khi tua `1 s = 10 phút`, nhân thời gian mô phỏng 600, không nhân công suất. Cắt bước đúng tại ranh giới lịch, thao tác bật/tắt và kết thúc nhiệm vụ; chạy 30/60/120 fps phải cho cùng điện năng trong sai số 1e-6 kWh. Tab ẩn tạm dừng; trở lại không tính cả khoảng bỏ quên. Bộ đếm dùng số chưa làm tròn, UI làm tròn ở bước hiển thị.

`teachingRateVndPerKWh` mặc định `null` (ẩn tiền). Khi bật chế độ toán tiền dùng **2.000 đ/kWh giả định**, nhãn luôn hiện “Đơn giá giả định để học, không phải biểu giá/hóa đơn”. Cho nhập số khác ≥0; `estimatedCost=energyKWh*rate`. Không bậc thang, thuế hay khẳng định giá điện hiện hành. Ví dụ một giờ thay 5×60 W bằng 5×9 W: tiết kiệm 0,255 kWh, ứng với 510 đ ở đơn giá giả định.

**Fixture `earthHour-v1`:** một giờ, TV 80 W đang không ai xem, quạt 50 W ở phòng trống, 4 đèn sợi đốt thừa (240 W), một đèn học cần giữ (60 W), tủ lạnh chu kỳ 20 phút chạy100 W/40 phút nghỉ2 W. Chọn tắt bốn đèn thừa/TV/quạt; giữ đèn học và nguồn tủ lạnh. Trước=0,4646667 kWh; sau=0,0946667 kWh; giảm=0,37 kWh. Không dùng nến làm mục tiêu thay đèn, không thưởng vì tắt thiết bị thiết yếu.

**`powerJourney-v1`:** 4 thẻ thủy điện (nước→tuabin→máy phát), gió (gió→tuabin→máy phát), nhiệt điện (nhiên liệu→nhiệt→tuabin→máy phát), mặt trời quang điện (ánh sáng→tấm pin→điện; **không có tuabin**). Tái tạo không đồng nghĩa hoàn toàn không tác động môi trường. Cảnh chọn nguồn dùng nhu cầu/công suất **minh họa**, chỉ ra phụ thuộc thời tiết/thời gian và lưu trữ; không dùng tỷ trọng nguồn Việt Nam giả hoặc dữ liệu “hiện tại” thiếu ngày/nguồn.

## 7. Sáu hotspot an toàn: chấm quyết định của trẻ

Phần này dạy nhận diện và báo trợ giúp, không dạy trẻ tự xử lý điện nhà. Cảnh hậu quả chỉ cảnh báo, không cần diễn điện giật. Các hành động kỹ thuật sau khi trẻ báo do nhân vật người lớn thực hiện ngoài khung; trẻ không kéo dây ổ điện. Các mẫu `wetHands`/`exposedWire`/`foreignObject`/`wetAppliance`/`damagedOutlet` dựa trên [khuyến cáo EVN cho trẻ](https://www.evn.com.vn/d6/news/Mot-so-khuyen-cao-ve-an-toan-dien-cho-tre-nho-66-142-29032.aspx). `kite` dựa trên [khuyến cáo không tự gỡ diều mắc điện](https://evn.com.vn/d6/news/Bao-dam-an-toan-luoi-dien-mua-kho-Khong-tha-dieu-dot-rac-duoi-duong-day-dien-550-2022-123446.aspx).

| ID | Dấu hiệu trong cảnh | Lựa chọn được chấm đúng | Lựa chọn sai cần giải thích |
| --- | --- | --- | --- |
| `wetHands` | Tay ướt đang định chạm phích | Dừng lại, tránh chạm, nhờ người lớn | “Lau sơ vào áo rồi tự rút ngay” |
| `exposedWire` | Dây bị bong vỏ lộ lõi | Tránh xa, báo người lớn | “Chạm thử xem có điện không” |
| `foreignObject` | Bạn định đưa que vào ổ | Nhắc bạn dừng, gọi người lớn | “Thử bằng que nhựa là được” |
| `wetAppliance` | Thiết bị điện rơi vào nước | Không chạm nước/thiết bị, gọi người lớn | “Nhanh tay vớt lên” |
| `damagedOutlet` | Ổ/phích nứt, dấu hỏng | Không sử dụng, báo người lớn | “Giữ chặt bằng tay khi cắm” |
| `kite` | Diều mắc đường dây ngoài nhà | Đứng xa, báo người lớn/đơn vị điện; không tự lấy | “Dùng cây dài gỡ xuống” |

L02 dùng 5 mẫu đầu; nhà dùng cả 6. Sao/huy hiệu xét đủ ID và đáp án đúng, không xét tốc độ. Không dùng “tắt công tắc rồi bé tự thay bóng” trong lời kể điện nhà; câu này chỉ hợp thao tác đồ chơi pin trên bàn.

## 8. Mười hai mission: ID, điều kiện và lời giải chuẩn

Mỗi mission có tối đa 3 sao theo ba tầng: (1) chức năng chính chạy, (2) kiểm được mọi trạng thái yêu cầu và mạch khỏe, (3) điều kiện thiết kế ghi trước trong bảng. Lưu `bestStars` và chỉ cộng `max(0,newBest-oldBest)`; số dây không quyết định vẻ gọn vì renderer tự đi dây. Layout gọn là tiêu chí trải nghiệm, không ép đúng đường vẽ đáp án.

| ID / bản | Chức năng và lời giải tham chiếu | Tầng 2 cần chứng minh | Tầng 3 / fixture sai điển hình |
| --- | --- | --- | --- |
| `flashlight` / R1 | 1 pin–K–bóng một vòng; sáng khi đóng K | Mở/tắt, đóng/sáng; controls đúng | Chỉ 1 pin, 1 bóng, 1 K; K đặt ngoài đường bóng không qua tầng2 |
| `doorbell` / R1 | 2 pin–nút nhấn–chuông | Giữ nút kêu, nhả dừng; không tự giữ trạng thái nhấn sau rời màn | Không công tắc chốt thay nút nhấn; chuông không được kêu liên tục |
| `lantern` / R1 | 2 pin–K–điện trở100 Ω–LED đỏ đúng chiều | Tắt/mở được, Ivisible≤I≤Irated | Đủ sáng với 2 pin; bỏ điện trở không qua tầng2 nếu quá dòng |
| `smartRoom` / R1 | Nguồn2 pin, nhánh K1–bóng, nhánh K2–động cơ | Kiểm đủ 00/10/01/11, K1 chỉ điều khiển đèn, K2 chỉ quạt | Đúng 2 công tắc; hai tải nối tiếp không qua kiểm độc lập |
| `candleFan` / R2 | Nguồn2 pin–K–động cơ/cánh quạt; nến giả lập | Động cơ trên ngưỡng hoạt động liên tục2 s, tắt được; mô phỏng tắt nến theo gió hình ảnh | Tối đa2 pin; không khẳng định tốc độ gió thật nếu chưa có mô hình khí động; nến chỉ ảo |
| `batterySaver` / R2 | 1 pin cấp 2 bóng song song | Mỗi bóng P/Prated≥0.25; cả hai sáng, khỏe | Đúng1 pin (fixture2 pin khỏe chỉ đạt2 sao); nối tiếp1 pin không đủ sáng |
| `lemonLight` / R2 | 3 nguồn chanh mẫu nối tiếp–LED đỏ | Có snapshot1 quả chưa đạt ngưỡng,3 quả đạt; đổi bóng sợi đốt không đủ sáng | Không nguồn pin ẩn; dùng thông số chanh và LED đã hiệu chỉnh oracle, không gắn “luôn đúng với chanh thật” |
| `tetLights` / R2 | Chuyển 3 bóng nối tiếp sang 3 nhánh song song | Bóng L1 lỏng,2 bóng kia vẫn sáng; siết L1 cả3 sáng | Giữ cùng nguồn và cả3 bóng; xóa bóng hỏng không thay cho sửa |
| `trafficLight` / R2 | 3 nhánh K–điện trở220 Ω–LED R/Y/G; nguồn3 pin | Trình tự đỏ→xanh→vàng; chỉ1 màu bật ở mỗi snapshot; I trong giới hạn | Mỗi LED có điện trở hạn dòng riêng, không dùng1 điện trở chung rồi nhầm mọi trạng thái an toàn |
| `doorAlarm` / R2 | Cửa tác động lên công tắc: cửa **mở** → tiếp điểm đóng, nuôi đèn+chuông song song; cửa đóng → tiếp điểm mở | Cửa đóng: cả2 tắt; cửa mở: cả2 chạy; thử2 lần | Không dùng nút bấm tay thay cảm biến cửa. `doorContact` là actuator của switch, không giả lập kết quả tải |
| `stairs` / R2 | Hai SPDT: nguồn+→common S1; 2 traveler nối tương ứng; common S2→bóng→nguồn− | 4 tổ hợp00/01/10/11; mỗi lần đổi một công tắc đảo on/off; fixture chấp nhận cả XOR/XNOR tùy traveler | Đúng2 SPDT, không thêm switch thường; chỉ1 đầu bật được không qua tầng2 |
| `fuseRescue` / R2 | Nguồn→cầu chì→K→bóng; nhánh lỗi tải do fixture kích hoạt | Bình thường sáng; kích hoạt lỗi đã định→cầu chì ngắt theo runtime→dòng nguồn về gần0; sửa lỗi rồi thay cầu chì mới sáng lại | Cầu chì ở **đường chung**, không chỉ trên nhánh bóng; loại bỏ/ngắn mạch cầu chì không qua |

R1 cần điện trở cố định **100 Ω ngay GĐ1** cho `lantern`, `reversedLed` và dụng cụ lab GĐ2. Khay “LED + bảo vệ” đặt hai linh kiện nhìn thấy rõ; không âm thầm chèn điện trở vào LED trần. Các nhiệm vụ cần `doorContact`, SPDT, cầu chì thuộc R2; `minimumTools` và cờ phát hành chặn link sâu nếu công cụ chưa có. `doorContact` được làm ở GĐ4 trước mission: dùng `knifeSwitch` hiện có, metadata `actuator:'doorContact'` và trạng thái cửa quyết định `closed=!doorClosed`. Nó vẫn dùng kí hiệu và phương trình switch; không cần một PartKind điện mới, không nhầm quy ước thường mở/đóng của cảm biến thật. Nhiệm vụ pin chanh, LED màu, chuông, động cơ phải kiểm lời giải với **cùng preset** trước mở cho trẻ; không điều chỉnh công suất kết quả để làm một nội dung thắng.

## 9. Mười hai ca thám tử: không đoán bệnh bằng một đèn thử

Mỗi ca có một lỗi chính, mạch tham chiếu đúng, tập thao tác sửa được phép và lời giải thích. Để tránh “xóa cả bàn dựng lại”, khóa loại linh kiện và số nguồn; cho sửa đúng vật, không khóa vị trí. Chấm ba bằng chứng: **quan sát/đo có liên quan → chọn lỗi → sửa và tái kiểm chức năng**. Chọn ngẫu nhiên đúng tên mà không có bằng chứng chưa qua. Dụng cụ kẹp vào mạch phải là phần tử của solver; đèn thử có tải nên có thể thay đổi mạch. Một đèn thử không sáng không đủ kết luận pin hay dây hỏng.

| ID / bản | Lỗi gài | Bằng chứng hợp lệ trước sửa | Hành động sửa và nghiệm thu |
| --- | --- | --- | --- |
| `missingWire` / R1 | Mất đường về nguồn | Lần theo vòng thấy hai cọc chưa nối | Nối đúng hai cọc; bóng sáng và K điều khiển; thêm dây thừa không qua |
| `looseBulb` / R1 | Bóng chưa chạm tiếp điểm | Soi đui thấy khe, kiểm nguồn đã lắp đủ và đúng chiều; không yêu cầu vôn kế R2 | Siết bóng cũ, sáng; thay pin không qua |
| `openSwitch` / R1 | K đang mở; không hỏng | Soi lưỡi dao thấy hở | Đóng K, bóng sáng; mở lại bóng tắt; đây là trạng thái điều khiển, lời kết không gọi K hỏng |
| `reversedLed` / R1 | LED ngược chiều, có100 Ω bảo vệ | Soi nhãn anode/cathode + xác định cực nguồn | Đảo LED, dòng thuận đạt; không đổi LED thành bóng sợi đốt |
| `brokenFilament` / R2 | Dây tóc đứt | Soi bóng thấy đứt; V hai tiếp điểm có áp phù hợp | Thay bóng, hoạt động; không kết luận chỉ từ đèn thử mắc song song |
| `emptyBattery` / R2 | Nguồn cạn | Đo V nguồn khi tách tải, thấp hơn ngưỡng cạn của model; kiểm dây vẫn liền | Thay pin/nguồn cạn, bóng sáng; cầu nối qua bóng không qua |
| `hiddenWireBreak` / R2 | Lõi đứt dưới vỏ | Soi dây hoặc kiểm liên tục khi tách nguồn trong tool chuyên dụng | Thay đúng dây lỗi, sáng; chỉ đổi vỏ màu không sửa |
| `brokenSwitch` / R2 | K đã đóng hình thức nhưng tiếp điểm lỗi hở | Soi tiếp điểm hoặc kiểm liên tục tách nguồn; khác với openSwitch | Thay K, kiểm cả mở/tắt và đóng/sáng; nối tắt K không qua |
| `shortedLoad` / R2 | Có dây nối tắt hai đầu bóng | Theo hai đường thấy đường bỏ qua tải + snapshot dòng nguồn lớn | Bỏ dây nối tắt, bóng sáng, không short; không thưởng vì đợi pin cạn |
| `blownFuse` / R2 | Cầu chì đã đứt, lỗi gốc trong fixture đã được loại bỏ | Soi cầu chì thấy dây đứt; nguồn vẫn tốt | Thay cầu chì cùng loại, mạch khỏe; quấn dây bắc cầu không qua |
| `insulatedClip` / R2 | Kẹp chỉ chạm vỏ nhựa | Soi đúng điểm kẹp | Đưa kẹp sang đầu lõi đã tuốt sẵn; không hướng dẫn trẻ tự tuốt dây điện nhà |
| `opposedCells` / R2 | Hộp2 viên1 viên ngược chiều | Soi dấu cực; đo từng viên có áp rồi đo cả hộp gần0 | Đảo đúng viên, bóng sáng với cùng2 pin; thêm pin thứ3 không thay cho sửa |

R1 không cần đồng hồ: bốn ca đầu có quan sát trực tiếp. R2 có vôn kế để đo mạch đang cấp nguồn và đèn thử “kiểm dây” **chỉ hoạt động khi nguồn đã tháo**; đèn thử dùng netlist pin3 V+LED đỏ+1 kΩ và hai que đo theo [engine §3](engine-spec.md), không hỏi logic hard-code theo ID lỗi. Đèn thử chỉ hỗ trợ ca mà tác động tải đã được fixture kiểm; không tuyên bố 12/12 ca phân biệt duy nhất bằng đèn thử. Với kết quả còn mơ hồ, gợi ý kiểm thêm một vị trí hoặc soi linh kiện.

## 10. Phân tầng tuổi, đọc to và nghiệm thu dữ liệu

| Hồ sơ | Mặc định | Kiến thức mở rộng |
| --- | --- | --- |
| Lớp1–2 | Bài1–6, 1 nhiệm vụ mỗi lần, tự đọc sau thao tác; hình cọc lớn; không số. Được bỏ qua đọc. | Bài7, các bài khác có hướng dẫn; chưa tự mở sự cố quá tải. |
| Lớp3–4 | Đủ R1; thẻ dự đoán/trước-sau, LED và động cơ. | Nối tiếp/song song định tính; không bắt nhập công thức. |
| Lớp5 | Đủ hành trình; bật tùy chọn V/A, đo và sơ đồ. | Gắn nhãn “Khám phá thêm THCS” cho Ohm/kWh/nam châm/cảm ứng; không yêu cầu để nhận huy hiệu KH5. |
| Mầm non | Giữ `allowPreschool:false` của catalog. | Không mở bằng link sâu. |

Giọng đọc không phải điều kiện chấm kiến thức; khi có `speechSynthesis` lỗi hoặc người dùng tắt tiếng, luôn có nút Tiếp tục. Mỗi bước có `aria-label`, câu chữ không chỉ dựa vào đỏ/xanh, bàn phím/chạm-chạm thay kéo dây. Thông tin “còn thiếu bằng chứng nào” hiển thị bằng câu ngắn, không có tên predicate hoặc thông số triển khai.

Điều kiện dữ liệu trước phát hành từng đợt:

1. ID duy nhất; không lesson/mission trỏ công cụ chưa phát hành; không source ID rỗng cho lời khẳng định vật lý; preset minh họa có nhãn.
2. Mọi bài có fixture đúng và ít nhất3 sai; mission có ba cấp sao kiểm được; fault có chẩn đoán+sửa+tái kiểm. Bố trí canonical nằm trọn bàn14×8; hai hướng hiển thị14×8/8×14 đều đọc và thao tác được, không thay model.
3. Với bài so sánh, chỉ biến mục tiêu thay đổi; vật liệu ánh sáng không tham gia logic chấm. Thay tier hoặc tắt animation cho cùng kết quả.
   Ca hồi quy bắt buộc: chuông tự ngắt/đóng qua nhiều `solveRevision` vẫn đạt bằng chứng kêu; nhả nút xác nhận dừng; stale solution không qua; người chơi sửa điện giữa cửa sổ ổn định bắt đầu cửa sổ mới; bóng cháy trước250 ms không nhận bằng chứng sáng khỏe.
4. 13 ID lesson, 16 ID object, 12 ID mission, 12 ID fault, 6 ID hazard khớp danh mục; R1 chỉ bật các ID được đánh dấu ở đây. Fixture định lượng/điện năng dùng oracle toán riêng, không gọi chính hàm cần kiểm để tạo expected.
5. Lời đọc dùng tiếng Việt tự viết, tối đa3 câu mở đầu; mọi từ “luôn”, “không ảnh hưởng”, “an toàn tuyệt đối” được rà lại điều kiện áp dụng. Link nguồn hiện ở trang tài liệu cho phụ huynh, không làm loãng nhiệm vụ trẻ.

## 11. Nguồn và phạm vi chứng minh

| ID | Nguồn | Dùng để chứng minh; không dùng để suy diễn |
| --- | --- | --- |
| `CUR-KH` | [Bộ GDĐT — phụ lục Khoa học TT32](https://fileth.hcm.shieldix.app/data/hcmedu/thphudinh/2019_9/2019-2020/tin%20t%E1%BB%A9c%20s%E1%BB%B1%20ki%E1%BB%87n/ch%C6%B0%C6%A1ng%20tr%C3%ACnh%20t%E1%BB%95ng%20th%E1%BB%83/10_ctkhoa_hoc_259201916.pdf), bản lưu từ [trang trường Phú Định](https://thphudinh.hcm.edu.vn/tin-tuc-su-kien/chuong-trinh-tong-the-va-chuong-trinh-chi-tiet-cac-mon-hoc-va-hoat-dong-giao-du/ctmb/21820/412126) | Yêu cầu môn KH5; không phải giấy phép chép hình SGK. |
| `CUR-KHTN` | [Bộ GDĐT — phụ lục KHTN TT32](https://thcsvotruongtoanvc.edu.vn/image/catalog/THONG%20TU%2032%20CTR%20GDPT%202018/11--CT_Khoa-hoc-tu-nhien.pdf) | Mapping lớp7/8/9 ở §1; không gán yêu cầu THCS cho tiểu học. |
| `REF-PHET` | [PhET CCK: DC](https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc?locale=en) | Phương pháp tương tác/đo/sơ đồ; không làm bằng chứng app đã đạt chất lượng PhET. |
| `SAFE-EVN` | [EVN — an toàn điện cho trẻ](https://www.evn.com.vn/d6/news/Mot-so-khuyen-cao-ve-an-toan-dien-cho-tre-nho-66-142-29032.aspx) | Các quyết định tránh chạm/báo người lớn. |
| `SAFE-KITE` | [EVN — không thả/gỡ diều gần điện](https://evn.com.vn/d6/news/Bao-dam-an-toan-luoi-dien-mua-kho-Khong-tha-dieu-dot-rac-duoi-duong-day-dien-550-2022-123446.aspx) | Nguy cơ diều và xử lý tìm người có trách nhiệm; không đưa mức phạt vào app. |
| `SCI-RSC` | [RSC — Which substances conduct electricity?](https://edu.rsc.org/experiments/which-substances-conduct-electricity/1789.article) | Phân biệt vật liệu/chất điện ly; không lấy quy trình phòng lab làm hướng dẫn trẻ tại nhà. |
| `SCI-USGS` | [USGS — conductivity and water](https://www.usgs.gov/water-science-school/science/conductivity-electrical-conductance-and-water), [đo độ dẫn](https://pubs.usgs.gov/publication/twri09A6.3) | Ion và điều kiện đo; không chứng minh các R minh họa là số đo. |
| `ENERGY-DOE` | [DOE — Electricity 101](https://www.energy.gov/oe/electricity-101) | Mạng điện, đơn vị điện năng; không nhập số liệu tiêu thụ Mỹ vào nhà Việt Nam. |
| `ENERGY-AU` | [Chính phủ Australia — Energy Ratings](https://www.energy.gov.au/households/energy-rating) | Quan hệ công suất/thời gian/chi phí và điều kiện ước tính; không dùng đơn giá nước ngoài. |

Nguồn truy cập 29/09/2026. Bảng thiết bị, điện trở mẫu, giá tiền và số sao là quyết định thiết kế minh họa trong file này. Các phép tính oracle là tính toán từ preset đã công bố, không phải trích số liệu thực tế từ nguồn.
