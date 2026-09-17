# Nông trại Làng Mầm — nghiên cứu tham khảo và thiết kế đề xuất

> **Nghiên cứu ban đầu, giữ để tham khảo.** Hướng triển khai hiện hành ở [REVAMP_PLAN](REVAMP_PLAN.md); đọc [bàn giao](README.md) trước khi code. Các đề xuất bên dưới về trẻ 6–12 tuổi, 30 cấp theo XP, phạm vi bản 1 và online sớm đã được thay bằng game cho cả người lớn, Home 1–25 và module chính trước/server sau. Bản thử 3D đã tồn tại: xem [CURRENT_STATE](CURRENT_STATE.md). Những câu “chưa triển khai” ở phần lịch sử chỉ mô tả thời điểm tài liệu ban đầu.

Ngày nghiên cứu: 17/09/2026. Trạng thái: tài liệu nghiên cứu và đề xuất, chưa triển khai game. Tên “Nông trại Làng Mầm” là tên làm việc.

Đại ca đã chốt nhịp **kết hợp: chơi chủ động, nông trại vẫn phát triển khi thoát**. Các lựa chọn còn lại trong tài liệu là đề xuất của em để đưa vào thử nghiệm, chưa phải yêu cầu đã được Đại ca duyệt.

Bổ sung theo trao đổi tiếp theo: đã nghiên cứu [phương án Supabase cho tài khoản, lưu online và thăm nông trại](farm-online-supabase-plan.md). Đề xuất chuẩn bị cấu trúc ngay từ bản thử và đưa liên kết/cloud save/thăm chỉ đọc vào bản 1; tương tác có thưởng và chơi đồng thời để sau.

**Bổ sung ở giai đoạn nghiên cứu:** Đại ca yêu cầu kinh tế kiếm xu để đầu tư, công trình nâng cấp, tự sắp xếp, nhiệm vụ/thành tích, cửa hàng hệ thống và **chợ người chơi có bán/đổi hàng**. Đại ca chốt **giao dịch chỉ khi có mạng, không hàng đợi giao dịch offline**. Xem [thiết kế kinh tế và nội dung mở rộng](farm-economy-and-engagement.md). Chợ là phần cần làm; nông trại tham gia chợ cần server xác thực tiền/hàng. Bản lưu cục bộ mô tả dưới đây không được tự ghi đè sổ kinh tế của server.

**Cập nhật mỹ thuật:** theo yêu cầu tiếp theo của Đại ca, hướng thế giới chuyển sang **3D thật**, ưu tiên chất lượng và sự khác biệt giữa công trình, cấp nâng cấp, cây theo giai đoạn và decor. Xem [kế hoạch sản xuất tài nguyên 3D](farm-3d-art-production-plan.md), thay cho đề xuất 2D trước đây. Đã có ảnh concept định hướng; chưa có model nông trại được dựng và kiểm chứng trong engine.

## 1. Kết luận đề xuất

Xây dựng một thế giới nông trại riêng của mỗi hồ sơ, có thể gắn bó qua nhiều lần chơi: khởi đầu là mảnh vườn nhỏ, sau đó mở đồng cỏ, bờ suối, vườn cây và các xưởng nghề. Trồng trọt cung cấp nguyên liệu; chăn nuôi và chế tác tạo chuỗi sản phẩm; nhiệm vụ nhân vật và công trình của làng tạo mục tiêu; trang trí, thú cưng và bộ sưu tập tạo dấu ấn cá nhân.

Vòng chơi chính:

**Chọn mục tiêu → trồng/chăm vật nuôi → thu nguyên liệu → chế biến/chế tác → giao hàng hoặc hoàn thành dự án → nhận xu/kinh nghiệm → mở cách chơi và khu đất mới.**

Khi chờ, người chơi có thể khám phá, trang trí, trò chuyện hoặc chơi mini game. Khi rời game, những công việc đã lên lịch vẫn hoàn thành; khi trở lại có kết quả để nhận. Tiến trình dài hạn phải tạo ra thay đổi nhìn thấy được ở nông trại.

Định hướng ban đầu: trẻ 6–12 tuổi, có hỗ trợ chơi cùng người lớn; phiên chơi khoảng 10–20 phút nhưng có thể chơi ngắn hoặc dài hơn. Đây là giả định từ đối tượng của Genius Kids, cần thử với người dùng thực tế. Mầm non nên có chế độ hỗ trợ riêng, không chỉ giảm giá vật phẩm.

## 2. Thị trường tham khảo: điều gì đã có bằng chứng?

Đây là nghiên cứu đối thủ từ nguồn công khai, chưa phải khảo sát nhu cầu trẻ em Việt Nam hoặc dự báo doanh thu. Số bán bản, lượt tải và tuổi đời là các chỉ số khác nhau; không dùng chúng để suy ra tỷ lệ giữ chân hay doanh thu của dự án này.

| Sản phẩm | Bằng chứng công khai | Điều có thể kết luận |
|---|---|---|
| Stardew Valley | Trang press công bố hơn **41 triệu bản tính đến tháng 12/2024**. Đây là mốc được ghi trên nguồn, không phải số cập nhật tháng 9/2026. [Nguồn](https://www.stardewvalley.net/press/) | Game đời sống/nông trại có thể có quy mô lớn trong phân khúc mua bản game. |
| Animal Crossing: New Horizons | Nintendo công bố **50,29 triệu bản tính đến 30/6/2026**; số liệu có quy ước tính bản đóng gói/bản tải xuống của Switch 2 Edition. [Nguồn](https://www.nintendo.co.jp/ir/en/finance/software/switch.html) | Tự xây dựng và cá nhân hóa một nơi chốn có sức hút rộng; đây là game đời sống, không thuần nông trại. |
| Hay Day | Bài của Supercell ngày 18/6/2026 mô tả game đã vận hành **14 năm**, đội ngũ tăng từ giai đoạn duy trì lên hơn 60 người. [Nguồn](https://supercell.com/en/news/nothing-bad-happens-in-hay-day/) | Có thể phát triển nội dung lâu dài, nhưng cần năng lực làm nội dung và vận hành, không chỉ một vòng thu hoạch ban đầu. |
| Township | Trang Google Play hiển thị **500 triệu+ lượt tải** ở thời điểm tra cứu; đây không phải số người đang chơi hay số người dùng duy nhất. [Nguồn](https://play.google.com/store/apps/details?id=com.playrix.township&hl=en) | Sự kết hợp sản xuất, xây dựng và hoạt động phụ có độ phủ lớn trên di động. |

Không dùng các sản phẩm thành công để khẳng định một cơ chế riêng lẻ đã gây ra thành công. Bài học bên dưới là suy luận thiết kế từ những hệ thống được nhà phát triển mô tả.

### Năm trường hợp nên học

| Game | Hệ thống được mô tả trong nguồn | Cách áp dụng đề xuất |
|---|---|---|
| **Hay Day** | Nông trại dễ tiếp cận, cây không chết; Supercell còn chia sẻ việc làm lại hướng dẫn người mới. [Game](https://supercell.com/en/games/hayday/), [bài đội ngũ](https://supercell.com/en/news/nothing-bad-happens-in-hay-day/) | Cho trẻ thu hoạch sớm, hiểu việc tiếp theo bằng hình; bỏ game vài ngày vẫn được chào đón. Học sự rõ ràng và thân thiện, không sao chép bố cục/tài nguyên. |
| **Stardew Valley** | Trồng trọt, chăn nuôi, câu cá, chế tác và quan hệ với cư dân cùng tồn tại. [Press kit](https://www.stardewvalley.net/press/) | Tạo nhiều hướng phát triển để người chơi tự chọn việc thích làm. Giới hạn số nghề trong bản đầu để mỗi nghề có chiều sâu. |
| **Animal Crossing** | Tự đặt đồ, thiết kế nhà/đảo, sưu tầm sinh vật và tương tác cư dân; hoạt động thay đổi theo thời gian. [Xây dựng](https://animalcrossing.nintendo.com/new-horizons/create/), [khám phá](https://animalcrossing.nintendo.com/new-horizons/explore/) | Cho nông trại mang dấu ấn riêng; nhật ký và bộ sưu tập giữ lại kỷ niệm. Sự kiện của dự án nên có thể quay lại chơi. |
| **Township** | Nông sản đi qua nhà máy thành hàng giao đơn; tài nguyên thu về hỗ trợ xây dựng/mở đất; có match-3 và hoạt động phụ. [Hướng dẫn chính thức](https://playrix.helpshift.com/hc/en/3-township/faq/15991-how-to-play/) | Mỗi khu mới mở thêm chuỗi sản xuất hoặc hoạt động. Mini game góp vào nông trại, không trở thành cửa bắt buộc phải vượt để tiếp tục trồng trọt. |
| **Disney Dreamlight Valley** | Hệ thống tình bạn có cấp, quyền lợi và hỗ trợ thu thập; các đợt cập nhật bổ sung nhân vật/nhiệm vụ. [Tình bạn](https://disneydreamlightvalley.com/news/BestFriends2026), [cập nhật 2026](https://disneydreamlightvalley.com/news/2026SummerShowcaseHighlights) | Mỗi nhân vật có nghề, chuyện riêng và đóng góp hữu ích. Quan hệ của Làng Mầm tích lũy bền vững; không đặt việc giữ tình bạn vào nghĩa vụ đăng nhập mỗi ngày. |

### Một tín hiệu cần kiểm tra, không coi là thống kê

Ba đánh giá hiển thị trên trang Google Play Township lúc nghiên cứu nhắc đến chờ lâu, khó tiến triển và không thích phần match-3. Đây là mẫu nhỏ do trang chọn hiển thị, không đại diện cộng đồng. Tuy vậy, nó gợi ý ba câu hỏi cần thử với game của mình: còn việc thú vị khi chờ không, có bị kẹt tài nguyên không, và hoạt động phụ có lấn át điều người chơi đến đây để làm không? [Các đánh giá tại nguồn](https://play.google.com/store/apps/details?id=com.playrix.township&hl=en)

### Vị trí phù hợp cho Genius Kids

Giả thuyết sản phẩm: **nông trại Việt nhỏ xinh, thao tác dễ hiểu, có nghề thủ công và tình làng xóm, chơi được theo nhịp gia đình**. Cây trồng, món ăn và sinh hoạt quen thuộc tạo chất riêng: lúa, ngô, cà rốt, đậu; giỏ tre, chậu cây; phiên chợ, cầu qua suối, ngày hội thu hoạch. Không cần lấy toàn bộ bối cảnh nông nghiệp Việt Nam làm bài học bắt buộc.

Điểm khác biệt cần kiểm chứng là cảm giác “đây là nông trại của mình”: con vật có tên, góc vườn tự trang trí, một nhân vật nhớ việc mình đã giúp, cây cầu từng tự góp vật liệu xây. Số lượng cây hoặc cấp độ đơn thuần chưa đủ.

## 3. Ba lớp tiến trình

1. **Cấp nông trại:** mở hệ thống, vùng và công thức. Tách khỏi lớp học/tuổi hồ sơ. XP đến từ sản xuất, đơn hàng và dự án; không thưởng XP cho mua/bán qua lại.
2. **Tay nghề:** trồng trọt, chăm vật nuôi, làm bếp, thủ công, khám phá. Mở công thức biến thể, cách thao tác tiện hơn và trang trí theo nghề. Không bắt mọi nghề đạt cùng cấp.
3. **Gắn bó:** tình bạn với cư dân, thú cưng, bộ sưu tập, cảnh quan và nhật ký. Không bị trừ tiến trình khi nghỉ chơi.

Mỗi lần lên cấp nên có một phần thưởng nhìn rõ; mỗi vài cấp có một thay đổi cách chơi. Màn “Sắp mở khóa” chỉ cho thấy 2–3 mốc gần nhất, còn bản đồ cho nhìn xa hơn bằng hình.

Điều kiện mở một hệ thống lớn: **đủ cấp + hoàn thành dự án giới thiệu ngắn**. Vật liệu dự án phải kiếm được từ nội dung đang có; cấp chỉ cho phép xây, không tạo ra một công trình không đủ khả năng sử dụng.

## 4. Nhịp chơi kết hợp và thời gian khi thoát

| Nhịp | Ví dụ đề xuất | Mục đích |
|---|---|---|
| 15–30 giây | Vụ thu hoạch hướng dẫn được tăng tốc, tương tác thú cưng | Hiểu thao tác ngay từ đầu |
| 1–5 phút | Cây nhanh, thức ăn chăn nuôi, mẻ hàng đơn giản | Có kết quả trong cùng phiên chơi |
| 10–30 phút | Cây trung bình, sản phẩm kết hợp | Lên kế hoạch giữa nhiều hoạt động |
| 1–4 giờ | Cây lâu, mẻ chế tác lớn | Có việc sẵn khi quay lại |
| Qua nhiều phiên | Xây cầu, nâng chuồng, hoàn thiện bộ sưu tập | Mục tiêu dài hạn nhìn thấy tiến độ |

Các khoảng thời gian trên là tham số thử nghiệm, không phải benchmark thị trường hay giá trị đã cân bằng.

Quy tắc đề xuất:

- Chỉ công việc đã gieo trồng, cho ăn hoặc xếp hàng mới chạy khi thoát. Không tự sinh sản lượng vô hạn từ một lần giao việc.
- Cây chín và hàng xong chờ nhận; không héo, hỏng hoặc mất vì về muộn. Vật nuôi không chết; khi hết thức ăn thì nghỉ sản xuất.
- Hàng chờ có giới hạn, đầu vào được giữ riêng khi đặt việc. Ví dụ 3 mẻ bánh, mỗi mẻ 10 phút: quay lại sau 40 phút có 3 mẻ, không phải 4.
- Khi đang chờ luôn còn hoạt động không mất phí: bố trí vườn, tương tác, đọc nhật ký, luyện mini game. Không yêu cầu trẻ để màn hình mở.
- Tưới/chăm trực tiếp cho lợi ích nhỏ, có giới hạn cho mỗi vụ; không ép chạm lặp để rút thời gian về 0.
- Khi trở lại, hiển thị bảng ngắn “6 luống chín, 2 mẻ bánh xong” và nút đi đến nơi nhận. Vẫn cho thu hoạch trực tiếp trên bản đồ.
- Phiên chợ định kỳ trong cốt truyện mở khi người chơi sẵn sàng. Vật phẩm lễ hội có đường chơi lại; không mất cơ hội vì vắng đúng ngày.

Thử ba hồ sơ chơi: 5 phút/ngày, 15 phút/ngày và 30 phút/phiên không đều. Cả ba phải tiến lên được; chơi lâu có thêm lựa chọn, không khiến chơi ít thất bại.

## 5. Trồng trọt, vật nuôi và sản xuất

### Trồng trọt

Mỗi cây phải có vai trò: cây nhanh cho phiên ngắn; cây lâu cho lúc nghỉ; cây làm thức ăn; cây cung cấp nguyên liệu chế biến; hoa để trang trí/thu hút sinh vật. Công thức mới giúp cây cũ tiếp tục hữu ích.

Mục tiêu nội dung bản 1: **10 cây ruộng + 2 cây ăn quả**. Danh sách dự kiến: lúa mì, cà rốt, ngô, bí đỏ, cà chua, dâu tây, lúa, đậu nành, bắp cải, bông; cây cam và táo. Thứ tự mở cần điều chỉnh theo đường sản xuất.

Không phải mọi cây đều cần một cơ chế chăm riêng. Dùng trạng thái dễ phân biệt: đất trống → mầm → cây lớn → sẵn thu hoạch. Năng suất rõ trước khi gieo; thưởng chất lượng là phần thêm, không dùng xác suất hiếm để chặn nhiệm vụ chính.

### Chăn nuôi

Bản 1 có gà, bò, cừu, vịt; một thú cưng đồng hành không sản xuất. Mỗi vật nuôi có tên, vài biểu cảm và hành động ngắn: ăn, đi dạo, ngủ, vui khi được chăm.

Gà cho trứng; bò cho sữa; cừu cho len; vịt cho trứng vịt. Nâng chuồng tăng sức chứa và tiện ích, đồng thời thay hình dáng. Nuôi ong, dê, cá ao và lai giống để giai đoạn sau; không đưa hết vào lần đầu.

### Sáu trạm và khoảng 20 công thức ban đầu

| Trạm | Sản phẩm dự kiến | Giá trị chơi |
|---|---|---|
| Cối xay | Bột, bột ngô, 4 loại thức ăn | Nối cây trồng với chăn nuôi và bếp |
| Lò bánh | Bánh mì, bánh cà rốt | Chuỗi đầu tiên dễ hiểu |
| Trạm sữa | Kem sữa, phô mai, sữa chua | Chọn bán nguyên liệu hoặc chế biến |
| Bếp mứt | Mứt dâu, cam, táo | Giá trị mới cho vườn cây |
| Bàn dệt | Sợi len, vải bông, khăn | Mở nghề dùng nguyên liệu khác đồ ăn |
| Bàn mộc | Chậu cây, ghế, nhà chim | Sản xuất trở thành đồ trang trí dùng được |

Ví dụ chuỗi: **lúa mì → thức ăn gà → trứng; lúa mì → bột; bột + trứng + cà rốt → bánh cà rốt → quầy bánh phiên chợ**. Chỉ mở từng nhánh khi đã hiểu nhánh trước. Bản đầu giữ đường phụ thuộc thường ở 2–3 bước.

Giao diện công thức cho biết thiếu gì, bấm nguyên liệu sẽ chỉ nơi lấy; tránh việc trẻ phải nhớ cả một cây công thức. Nút “Làm theo kế hoạch” giúp ghim nhu cầu nguyên liệu, không tự tiêu hàng ngoài ý muốn.

## 6. Mở đất phải mở thêm trải nghiệm

| Vùng | Lý do muốn mở | Thay đổi nhìn thấy |
|---|---|---|
| Vườn nhà | Làm quen, trồng cây, gà | Đất hoang thành vườn có hàng rào |
| Đồng cỏ | Bò/cừu, nguyên liệu nghề mới | Chuồng lớn và đàn vật nuôi đi lại |
| Bờ suối | Câu cá, nhặt vật liệu, đường đi mới | Cầu hoàn thiện, nước và sinh vật |
| Đồi cây trái | Thu hoạch cây lâu năm, bếp mứt mở rộng | Vườn tán cây, lối dạo |
| Vườn hoa và ong | Hoa, mật, bộ sưu tập bướm | Màu hoa và sinh vật mới |
| Khu hội chợ | Dự án lớn, trưng bày sản phẩm | Gian hàng mang dấu ấn của người chơi |

Bản 1 tập trung ba vùng đầu; cây ăn quả vẫn có thể trồng trên đất đã mở. Ba vùng còn lại là mục tiêu mở rộng nội dung sau bản 1.

Mỗi dự án góp tài nguyên nhiều lần, có 2–3 bước thay hình. Giá mở đất dùng xu + vật liệu phổ biến + nhiệm vụ giới thiệu; tránh phụ thuộc một vật phẩm rơi ngẫu nhiên. Trang trí được di chuyển và cất kho miễn phí. Không mất công trình khi thử bố cục mới.

## 7. Khung mở khóa 30 cấp

Đây là sơ đồ nội dung để thử, chưa phải bảng XP/giá đã cân bằng. Bản 1 nhắm cấp 1–15; phần 16–30 dành cho các đợt sau.

| Cấp | Mở chính | Việc người chơi vừa học được |
|---:|---|---|
| 1 | 6 luống, lúa mì/cà rốt, tên nông trại | Gieo, thu, bán; nhìn thấy mục tiêu tiếp theo |
| 2 | Ngô, mini game dẫn nước, sổ tay | Chọn loại cây theo kế hoạch |
| 3 | Gà, cối xay, thức ăn | Tạo nguyên liệu cho vật nuôi |
| 4 | Bột, lò bánh, bánh mì | Hoàn thành chuỗi sản xuất đầu tiên |
| 5 | Mảnh đất mở rộng đầu, bí đỏ, đóng giỏ hàng | Tự chọn dùng tiền mở đất hay mua đồ |
| 6 | Bò, trạm sữa | Chuyển sữa thành sản phẩm có giá trị hơn |
| 7 | Dâu tây, bếp mứt | Trồng hàng lâu để nhận khi quay lại |
| 8 | Cà chua, đơn kết hợp, trang trí mở rộng | Cân đối nhiều nguyên liệu |
| 9 | Đồng cỏ, nâng chuồng, cừu | Phát triển chăn nuôi và đón nhánh len |
| 10 | Bàn mộc, nhà chim, NPC mới | Làm đồ dùng cho chính nông trại |
| 11 | Cam/táo, công thức mứt | Giữ vườn cây qua nhiều vụ |
| 12 | Bông, bàn dệt, sợi/vải | Kết hợp cây trồng và len |
| 13 | Sửa cầu, bờ suối, vịt, câu cá | Khám phá một không gian và thao tác mới |
| 14 | Lúa, đậu nành, bắp cải, món hàng kết hợp | Chuẩn bị sản phẩm cho phiên chợ |
| 15 | Phiên chợ đầu tiên, kết chương 1 | Thấy toàn bộ công sức làm nên một sự kiện |
| 16–18 | Đồi cây trái, công thức chuyên nghề | Tạo lựa chọn chuyên môn thay vì chỉ tăng số lượng |
| 19–21 | Vườn hoa, ong, mật, sổ bướm | Khám phá sinh thái và sản phẩm mới |
| 22–24 | Nhà kính, công cụ tiện lợi, đồ thủ công nâng cao | Giảm thao tác lặp, tự thiết kế khu sản xuất |
| 25–27 | Khu hội chợ, dự án làng, chuyên nghề cấp cao | Dùng sản phẩm cho mục tiêu chung trong cốt truyện |
| 28–30 | Đại hội mùa gặt, bộ trang trí danh hiệu | Khép tuyến chuyện lớn, mở mục tiêu tự chọn |

Sau cấp 30: ưu tiên thiết kế vườn, hoàn thiện bộ sưu tập, truyện nhân vật và chương mới. Không tăng cấp vô tận bằng những đơn hàng ngày càng lớn mà không có hoạt động mới.

## 8. Mini game liên quan trực tiếp đến nông trại

| Hoạt động | Cách chơi | Kết nối với game chính | Giai đoạn |
|---|---|---|---|
| Dẫn nước | Xoay/nối rãnh để nước tới luống | Vật liệu chăm cây hoặc tiến độ huy hiệu | Bản 1 |
| Đóng giỏ nông sản | Phân loại, đếm, xếp theo đơn mẫu | Hoàn tất một đơn đặc biệt, mở mẫu giỏ | Bản 1 |
| Câu cá | Quan sát dấu hiệu và giữ nhịp đơn giản | Sinh vật cho sổ tay, nguyên liệu chọn lọc | Bản 1 |
| Chăm thú cưng | Nhớ sở thích, chọn đồ chăm phù hợp | Động tác/đồ dùng cho thú cưng | Sau bản 1 |
| Làm bánh | Thực hiện trình tự, phối nguyên liệu | Biến thể trang trí bánh và công thức | Sau bản 1 |
| Dệt và làm đồ mộc | Ghép mẫu, hoàn thiện hình | Đồ trưng bày dùng được | Sau bản 1 |
| Chụp ảnh thiên nhiên | Tìm sinh vật theo dấu hiệu | Bộ sưu tập, nhật ký | Sau bản 1 |

Mỗi lượt khoảng 30–90 giây, có mức hỗ trợ và luyện tự do. Thành tích mới nhận thưởng một lần; chơi lặp vẫn vui nhưng không trở thành cách kiếm xu vượt xa sản xuất. Nhiệm vụ chính có đường thông thường thay thế mini game. Không bắt trẻ vượt màn phản xạ khó để được mở chuồng hay trồng cây.

Đếm, đo lượng và xếp trình tự là hành động trong tình huống chơi. Nội dung theo tuổi thay đổi cách trình bày và mức phức tạp, không khóa nông trại vì làm sai toán.

## 9. Nhân vật, câu chuyện và gắn bó

Đề xuất bốn nhân vật bản đầu: cô Mây làm bánh, bác Mộc làm đồ gỗ, bạn Bống chăm vật nuôi, chú Nam trông vườn. Mỗi người có tuyến ngắn 5–6 nhiệm vụ và một phần thưởng thể hiện nghề. Bản sau có thêm người chăm suối và người giữ sổ thiên nhiên.

Tuyến chương 1: nhận mảnh đất → làm vụ mùa đầu → mở quầy hàng nhỏ → chuẩn bị nguyên liệu → sửa cầu → tổ chức phiên chợ. Mỗi nhiệm vụ phải có ít nhất một thay đổi hình ảnh, kiến thức thao tác hoặc tình tiết; tránh thay lời thoại nhưng giữ nguyên “giao 50 món”.

Các lớp nội dung lâu dài:

- **Mục tiêu ngắn:** một đơn hàng hoặc mẻ chế tác.
- **Mục tiêu qua vài phiên:** nâng chuồng, sửa cầu, làm quà cho nhân vật.
- **Mục tiêu tự chọn:** hoàn thiện góc vườn, sưu tầm món ăn, thu hút một loài bướm.
- **Kỷ niệm:** ảnh vụ mùa đầu, tên gà đầu tiên, trang nhật ký ngày mở cầu.
- **Thay đổi theo chủ đề:** mùa hoa, phiên chợ bánh, hội đèn; dùng cơ chế sẵn có nhưng thêm nguyên liệu, truyện và trang trí.

Không trừ tình bạn, giết vật nuôi, xóa chuỗi thành tích hoặc lấy mất đồ khi nghỉ. Sự gắn bó mong muốn là muốn quay lại chăm nơi mình tạo ra. Đánh giá bằng việc trẻ nhớ mục tiêu và muốn tiếp tục, không chỉ số phút ở lại.

## 10. Kinh tế và chống kẹt tiến trình

Ba loại tiến trình đủ dùng ở đầu: **xu nông trại, XP nông trại, tài nguyên vật phẩm**. Không thêm kim cương, năng lượng và nhiều loại vé ngay. Xu tách khỏi sao học tập; bản đầu không có luồng chuyển đổi hai chiều.

Nguồn xu: bán nông sản, giao đơn, thưởng dự án. Nơi tiêu: hạt giống, công trình, nâng cấp, mở đất, đồ trang trí. Nguyên liệu dành cho cốt truyện có nguồn chắc chắn. Thưởng nhiệm vụ có ID để nhận một lần.

Quy tắc cân bằng:

- So sánh cả **lợi nhuận/ô đất/phút**, **lợi nhuận/lần chăm** và **nút thắt trạm chế biến**. Cây nhanh có thể hiệu quả hơn khi chơi chủ động; cây lâu cho thu nhập tốt mỗi lần quay lại.
- Lãi chế biến tính sau giá trị nguyên liệu đầu vào và thời gian sử dụng trạm; không mặc định mọi món cầu kỳ đều tốt nhất.
- Không có vòng mua nguyên liệu rồi bán ngay lời tiền/XP. Vật phẩm bán lại thấp hơn giá mua.
- Đơn được sinh từ những chuỗi người chơi đã có khả năng sản xuất. Đơn yêu cầu công trình tương lai nằm riêng ở “dự án sắp tới”. Cho đổi đơn thường miễn phí; không phạt vì từ chối.
- Có hạt giống khởi đầu miễn phí với lượng nhỏ, không bán trực tiếp và không thưởng XP khi nhận, để không hết vốn rồi mất đường chơi.
- Kho ban đầu đủ rộng cho những chuỗi đang mở. Hàng đã sản xuất nằm ở khay nhận nếu kho đầy, không biến mất. Vật phẩm nhiệm vụ/trang trí cất riêng để không gây tắc kho nông sản.
- Vật liệu phổ biến có đường mua hoặc đổi xác định. Không đặt dự án chính sau xác suất rơi hiếm.
- Nâng cấp về sau giảm thao tác: thu theo luống, lưu kế hoạch gieo, hàng chờ lớn hơn. Không chỉ tăng số việc phải bấm.

Trước khi chốt bảng giá, chạy mô phỏng 30 phiên cho ba kiểu chơi ở mục 4, kiểm tra không âm tiền, không kẹt công thức, không có một chuỗi lấn át hoàn toàn. Các số giá/XP sẽ là đầu ra của mô phỏng và playtest, không lấy nguyên bảng của game tham khảo.

## 11. Đồ họa, âm thanh và thao tác

Hướng hiện tại là **thế giới 3D stylized**, công trình/cây/vật nuôi/decor có model thật. Thử camera orthographic nhìn xiên từ trên, zoom/pan; khả năng xoay camera được đánh giá riêng, không suy ra từ yêu cầu không xoay của Ca-rô. Công trình có thể xoay khi bố trí. Mặt bằng ô giúp đặt công trình; chỉ hiện lưới khi xây/sửa.

Mỹ thuật: làng quê thu nhỏ có chất thủ công, đất/gỗ/đất nung mờ, khối có cạnh mềm, cây rõ hình thái, phối xanh lá–kem–đất nung. Nét Việt thể hiện qua hàng rào, chậu cây, cầu nhỏ, mái hiên và đồ nghề. Mỗi công trình có hình khối và thiết bị nhận diện riêng; cây thay hình thái theo giai đoạn; cả bộ giữ thống nhất tỷ lệ, chất liệu và mức chi tiết.

Ưu tiên chuyển động nhỏ có ý nghĩa: cây bật nhẹ khi thu, giỏ nhận nông sản, gà chạy tới máng, khói lò khi đang làm. Âm thanh ngắn riêng cho đất, nước, lá và đồ gỗ; nhạc nền ít lớp, có tắt âm và giảm chuyển động.

Kế hoạch mỹ thuật và vai trò imagegen:

1. Dùng imagegen tạo concept, bảng màu và tham chiếu từng họ tài nguyên; imagegen không trực tiếp xuất model có mesh/UV/rig.
2. Dựng và chỉnh model thực trong công cụ 3D, phối hợp model gốc, module dùng chung và asset có giấy phép phù hợp đã được đồng bộ phong cách.
3. Chuẩn hóa footprint, pivot, vật liệu, animation, mức chi tiết và xuất GLB; render icon từ model đã duyệt.
4. Dùng code cho bố trí, lưới, vùng chạm, UI và trạng thái; kiểm tra che khuất khi kéo/đặt trên cảm ứng.
5. Làm cảnh kiểm chứng mỹ thuật A0 với ít công trình/cây/decor nhưng đủ cấp và trạng thái; đo chất lượng ở góc camera chơi trước khi sản xuất số lượng lớn.

Đã tạo [bảng concept đầu tiên](farm-3d-concept-v1.png), lưu [prompt và nguồn](farm-3d-art-prompts.md). Đây là ảnh định hướng, chưa phải model hoặc ảnh chụp game. Đồ họa của game tham khảo chỉ dùng để nghiên cứu, không đưa vào sản phẩm.

Giao diện: thanh trên chỉ có cấp/xu và nút mục tiêu; thanh dưới 4–5 thao tác lớn; bấm công trình mở bảng nhỏ theo ngữ cảnh. Khi kéo bản đồ không được vô tình gieo hoặc mua. Trước khi xây phải thấy diện tích và đường đi; di chuyển có hoàn tác. Với trẻ nhỏ, hỗ trợ đọc lời hướng dẫn và dùng hình bên cạnh chữ.

## 12. Phù hợp với dự án hiện tại

Đã đọc `package.json`, `games/GameLauncher.tsx`, catalog hub, dịch vụ hồ sơ và kho lưu của PlanetWorkshop. Dự án dùng React/Vite; game được tải riêng khi mở; hồ sơ hiện tại lưu bằng localStorage; Xưởng Hành Tinh đã có IndexedDB, revision và cơ chế bản sao. Có cấu hình Supabase cho nội dung, nhưng những phần đã đọc chưa chứng minh có dịch vụ đồng bộ trạng thái game hoặc tài khoản online dùng được cho nông trại.

Đề xuất triển khai:

- Mục riêng trong **Trò chơi**, ID `farm`, giữ **Board games ở vị trí đầu** theo yêu cầu gần nhất của Đại ca. Không đặt nông trại trong Board games.
- Dữ liệu nông trại tách riêng theo `studentId` trong IndexedDB; hồ sơ chỉ cần bản tóm tắt để hiện cấp/ảnh đại diện. Không ghi cả bản đồ vào hồ sơ mỗi nhịp hoạt ảnh.
- Lõi luật thuần TypeScript: gieo, nhận hàng, giao đơn, xây, mở khóa. Renderer chỉ hiển thị; tiền/kho/phần thưởng thay đổi qua lệnh có kiểm tra.
- Dùng React cho UI và React Three Fiber/Three.js cho thế giới 3D. Repo đã có các thư viện này, cùng ví dụ GLB/animation trong DragonQuest và bố trí cảnh trong PlanetWorkshop. Tận dụng kỹ thuật, thiết kế bộ mỹ thuật nông trại riêng; đo hiệu năng bằng cảnh mẫu trước khi chốt ngân sách asset.
- Gói dữ liệu tách `crops`, `animals`, `recipes`, `buildings`, `quests`, `unlocks`, `decorations`. Có schema/version và công cụ kiểm tra tham chiếu, chu trình công thức, nội dung không thể mở.
- Lưu sau hành động đã xác nhận, có checkpoint trước migration và xuất/nhập bản sao. Kho, công việc và cờ nhận thưởng phải ghi cùng giao dịch. IndexedDB cung cấp giao dịch và nâng phiên bản; thiết kế phục hồi vẫn phải do ứng dụng thực hiện. [Tài liệu MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- Tách `farmCoins` và XP khỏi sao chung. Nếu thêm thưởng thành tựu sang hồ sơ sau này, dùng bản ghi thưởng duy nhất và cơ chế áp dụng lại an toàn; không coi hai kho lưu là một giao dịch nguyên tử.
- Hai tab cùng mở: kiểm tra revision, chỉ một tab được ghi; tab còn lại chuyển xem hoặc yêu cầu tải trạng thái mới. Không ghi đè im lặng.
- Xóa hồ sơ phải dọn nông trại; nhập bản sao phải xác nhận thay thế và tạo bản dự phòng. Bản lưu hỏng không được tự đặt lại thành nông trại trắng.

### Tính tiến trình khi quay lại

Không cần chạy tác vụ liên tục trên máy chủ khi người chơi thoát. Lưu đồng hồ mô phỏng, mốc thời gian thực và lịch công việc; khi quay lại, tính phần thời gian hợp lệ rồi xử lý các công việc đến hạn. Bản đầu dùng công việc hữu hạn với đầu vào đã giữ riêng, tránh mô phỏng từng giây.

Đề xuất kỹ thuật để thử: khi đóng game, chỉ cộng tối đa 24 giờ cho một lần quay lại; tổng hàng chờ cũng không vượt 24 giờ. Công việc xong tiếp tục chờ nhận. Dùng đồng hồ mô phỏng cho `readyAt`, không lẫn với mốc giờ hệ điều hành; đồng hồ quay lùi thì cộng 0, đặt lại mốc quan sát và cho chơi tiếp. Kiểm tra nhảy giờ lớn để không nhận lại phần thưởng. Đây là chống lỗi thực dụng; offline trên máy người dùng không thể bảo đảm chống chỉnh giờ tuyệt đối.

PWA cần tải trước gói nội dung nông trại, kiểm tra khởi động offline và asset còn thiếu trên bản production. Tiến trình khi thoát không đồng nghĩa với đồng bộ sang thiết bị khác. Supabase Auth/revision/bản cảnh cho khách vẫn dùng được; riêng nông trại tham gia chợ phải có sổ kinh tế và lệnh do server kiểm tra theo tài liệu mới nhất. Chợ yêu cầu mạng; chơi đồng thời vẫn là bước riêng.

## 13. Chia phạm vi để làm được và thử được

| Mốc | Sản phẩm cụ thể | Điều kiện đi tiếp |
|---|---|---|
| **A0 — Kiểm chứng mỹ thuật 3D** | Ba loại công trình, ba mốc ngoại hình lò bánh, ba cây đủ giai đoạn, tám decor, một bò có animation và thao tác bố trí | Phân biệt tốt ở camera chơi; cùng phong cách; thao tác và hiệu năng đạt trên thiết bị đích |
| **A — Bản thử trọn vòng chơi** | Một góc vườn đẹp, 2 cây, gà, bột/bánh mì, một NPC, một mini game, 5 cấp, lưu/tiến trình khi thoát | Tự chơi được 15 phút; thoát/quay lại đúng hàng; trẻ biết muốn làm gì tiếp |
| **B — Bản 1** | Cấp 1–15, ba vùng, 12 cây gồm cây ăn quả, 4 vật nuôi sản xuất + thú cưng, 6 trạm/khoảng 20 công thức, 3 mini game, 4 NPC/khoảng 24 nhiệm vụ, khoảng 30 đồ trang trí | Qua thử nhiều phiên; không kẹt kinh tế; thao tác cảm ứng và lưu/khôi phục ổn định |
| **B1–B2 — Online tùy chọn, đề xuất bổ sung** | Liên kết tài khoản Supabase, cloud save, chuyển thiết bị, mời bạn/thăm bản vườn chỉ đọc | Quyền truy cập đúng; đồng bộ không ghi đè im lặng; không lộ hồ sơ học tập |
| **B3 — Chợ theo yêu cầu mới** | Rao bán lấy xu và đổi hiện vật chỉ khi có mạng; quầy riêng/chợ chung | Server giữ/chuyển/hoàn tiền hàng đúng, không xếp lệnh chợ offline |
| **C — Nội dung dài hạn** | Cấp 16–30, hoa/ong/nhà kính, 2 NPC mới, chuyên nghề và chương hội chợ | Người chơi bản 1 còn mục tiêu tự chọn; nội dung mới tận dụng hệ thống cũ nhưng có lựa chọn mới |
| **D — Tương tác online mở rộng** | Giúp việc, gửi quà hoặc cùng hiện diện/hợp tác | Có nhu cầu thực tế và cơ chế server xác thực tương tác kinh tế |

Mốc A0 kiểm chứng chất lượng tài nguyên trước khi mở rộng, rồi mốc A kiểm chứng vòng chơi. Bản đồ lớn và 30 cấp ngay lần đầu làm khó việc tìm ra thao tác trồng/thu hoạch có vui hay không. Không ước lượng lịch triển khai cố định trước khi thử renderer, khối lượng asset và khả năng sản xuất nội dung.

## 14. Kiểm chứng trước khi mở rộng

Đề xuất pilot với 8–12 trẻ thuộc hai nhóm 6–8 và 9–12 tuổi, có người lớn đồng hành, gồm nhiều lần chơi trong hai tuần. Mẫu này để tìm vấn đề và kiểm tra giả thuyết, không đại diện thị trường. Nếu lấy log, ban đầu chỉ cần ID hồ sơ cục bộ và sự kiện chơi, không cần thông tin nhận dạng.

Quan sát chính:

- Trẻ có tự gieo và thu vụ đầu không; có hiểu sản phẩm nào đang chờ không?
- Sau 10–15 phút, có kể được mục tiêu muốn làm tiếp không?
- Trong lúc chờ, trẻ tự chọn hoạt động khác hay chỉ nhìn đồng hồ?
- Khi quay lại hôm sau, có nhận ra nông trại và tiếp tục được không?
- Trẻ thích tạo ra cái gì của riêng mình; có nhớ vật nuôi/nhân vật không?
- Phiên ngắn có đạt một việc trọn vẹn; có điểm dừng tự nhiên không?

Các mốc thử nội bộ ban đầu: ít nhất 8/10 lượt thử tự thu hoạch sau hướng dẫn; phần lớn trẻ nói được một mục tiêu tiếp theo; không có đường chơi hợp lệ bị kẹt vốn; không mất hoặc nhân đôi vật phẩm qua thử thoát/tải lại. Đây là tiêu chí đề xuất, không phải số liệu D1/D7 của thị trường. Theo dõi quay lại ngày 1/7/14 nhưng không dùng mẫu nhỏ để hứa hẹn tỷ lệ giữ chân.

Kiểm tra kỹ thuật bắt buộc trước bản 1: tắt khi đang lưu; hai tab cùng thu hoạch; nhận thưởng rồi reload; đồng hồ lùi/tiến; nghỉ bảy ngày; kho đầy; hủy hàng chờ; di chuyển công trình đang sản xuất; đổi/xóa hồ sơ; nhập bản sao cũ; nâng phiên bản nội dung; thiếu asset khi offline. Tiền, kho, nhiệm vụ và hình ảnh phải kể cùng một trạng thái.

## 15. Đề xuất chốt để chuyển sang thiết kế chi tiết

Giữ hướng chơi kết hợp đã được Đại ca chọn. Lấy **chuỗi sản xuất dễ hiểu, nông trại tự trang trí, nhân vật có chuyện riêng và mini game gắn với nghề** làm bốn trụ. Tiền/cấp riêng, lưu tin cậy và không phạt nghỉ chơi là nền tảng.

Sản phẩm tiếp theo nên là cảnh 3D mốc A0 theo [kế hoạch mỹ thuật](farm-3d-art-production-plan.md), sau đó bản thử mốc A cùng bảng dữ liệu 5 cấp và sơ đồ mặt bằng. Sau khi đo nhịp chơi mới chốt giá/XP/thời gian và mở rộng theo khung cấp 1–15, rồi 16–30.
