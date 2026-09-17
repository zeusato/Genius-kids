# Làng Mầm — kinh tế, công trình, chợ và mục tiêu dài hạn

> **Tham khảo kinh tế ở giai đoạn trước.** [REVAMP_PLAN](REVAMP_PLAN.md) là thiết kế hiện hành; [bàn giao](README.md) ghi các quyết định đã chốt. Giữ phân tích chuỗi sản xuất và giao dịch bên dưới, nhưng đề xuất nhà 3–5 cấp/lịch online sớm đã được thay bằng tối đa 25 cấp, Home làm trung tâm và server sau module chính. Giá, mốc mở và phương án chuyển tiền local lên online ở đây chưa phải thông số đã duyệt. Bản thử local đã có, xem [CURRENT_STATE](CURRENT_STATE.md).

Ngày: 17/09/2026. Bổ sung theo yêu cầu tiếp theo của Đại ca. Trạng thái: thiết kế đề xuất, chưa triển khai gameplay/backend. Tài liệu này cập nhật phạm vi của [nghiên cứu ban đầu](farm-research-and-design.md) và [phương án Supabase](farm-online-supabase-plan.md).

Cập nhật mỹ thuật: Đại ca định hướng công trình, cây theo giai đoạn và decor bằng model 3D có chất lượng và bản sắc. [Kế hoạch sản xuất 3D](farm-3d-art-production-plan.md) quy định cách phân biệt hình dáng, thể hiện nâng cấp, dùng chung bộ phận, giữ footprint khi bố trí và kiểm chứng bằng cảnh mẫu trước khi nhân rộng nội dung.

## 1. Các yêu cầu đã được Đại ca bổ sung

- Hoạt động kiếm tiền để mua giống, xây dựng, nâng cấp và mở rộng nông trại.
- Công trình đa dạng, có cấp riêng và mở sản phẩm/tính năng theo tiến trình.
- Đổi vị trí, sắp xếp công trình và vật trang trí.
- Nhiệm vụ và thành tích làm mục tiêu chơi.
- Rao bán giữa người chơi lấy tiền và trao đổi vật phẩm.
- Cửa hàng hệ thống.
- Đại ca chốt giao dịch giữa người chơi chỉ thực hiện khi có mạng, để tránh xử lý lệnh giao dịch offline.

Chợ giữa người chơi trở thành **phạm vi sản phẩm cần làm**, thay cho giả định trước đó chỉ lưu online/thăm vườn. Thứ tự triển khai vẫn chia giai đoạn. Ý tưởng mới, số lượng, cấp và thông số trong phần sau là đề xuất cần thử, không phải toàn bộ đã được duyệt.

## 2. Vòng kinh tế chính

**Làm ra hàng → chọn bán/giao đơn/chế biến/đổi → nhận xu hoặc nguyên liệu → đầu tư → mở sản phẩm và cách chơi mới → nhận mục tiêu lớn hơn.**

Một đồng tiền chính là **xu nông trại**, tách sao học tập, không quy đổi tiền thật. XP mở quyền tiếp cận; xu/vật liệu trả chi phí đầu tư. Đạt cấp mở nhà xưởng chưa đồng nghĩa được nhận miễn phí toàn bộ nhà xưởng.

| Nguồn thu | Người chơi quyết định gì? | Cân bằng |
|---|---|---|
| Bán nông sản cho hệ thống | Nhận tiền ngay hay giữ để chế biến? | Giá cơ bản rõ ràng; luôn có đầu ra |
| Đơn NPC/phiên chợ | Dùng hàng cho đơn nào? | Thưởng cao hơn nhưng tiêu thụ hàng theo cơ cấu, số lượng hữu hạn |
| Chợ người chơi | Bán hàng dư, mua hàng thiếu hay đổi? | Tiền chuyển giữa người chơi; không tự sinh thêm xu |
| Sản phẩm chế biến | Dùng trạm và thời gian vào mặt hàng nào? | Tính lợi nhuận sau giá trị nguyên liệu và nút thắt trạm |
| Quán/khách tham quan NPC | Làm thực đơn nào, phục vụ nhóm khách nào? | Doanh thu dựa trên đơn đã phục vụ; không tiền vô hạn chỉ vì đặt đồ đẹp |
| Nhiệm vụ/mini game | Chọn mục tiêu và hoạt động phụ | Thưởng mốc rõ, giới hạn lợi ích kinh tế từ chơi lặp |

Xu tiêu vào hạt giống, vật nuôi, công trình, nâng cấp, mở đất, tiện ích và trang trí. Không dùng thuế bảo trì làm nợ khi nghỉ. Chuyển vị trí và cất đồ trang trí miễn phí để khuyến khích sáng tạo.

Các khoản mua của hệ thống tạo ra chi tiêu thực. Giao dịch người chơi chủ yếu đổi chủ của tiền/hàng; có thể thử phí nhỏ khi bán thành công để giảm xu dư thừa. Phải mô phỏng nguồn tạo xu và nơi tiêu xu, không coi số giao dịch lớn là nền kinh tế cân bằng.

## 3. Công trình: nhiều vai trò, nâng cấp có ý nghĩa

Danh mục toàn bộ lộ trình, không làm tất cả trong bản thử đầu tiên:

| Nhóm | Công trình | Hướng nâng cấp và mở khóa |
|---|---|---|
| Trồng trọt | Luống, vườn cây, nhà kính, trạm tưới, khu ủ phân | Giống mới, gieo theo lô, chăm thuận tiện, cách bố trí mới |
| Chăn nuôi | Chuồng gà, bò, cừu, vịt, trại ong, ao nuôi | Sức chứa, máng thức ăn, sản phẩm chế biến tương ứng |
| Chế biến cơ bản | Cối xay, lò bánh, trạm sữa, bếp mứt | Công thức mới, hàng chờ, mẻ lớn |
| Chế biến mở rộng | Máy ép, bếp món ăn, xưởng đồ ngọt | Ghép chuỗi cũ thành sản phẩm có vai trò mới |
| Thủ công | Bàn mộc, xưởng dệt, lò gốm, góc đan giỏ | Đồ dùng và trang trí thật sự đặt được trong vườn |
| Thương mại | Quầy nhà, bảng đơn, chợ làng, quán ăn | Thêm gian rao, đơn đa dạng, thực đơn, khách |
| Kho và vận chuyển | Kho hàng, silo, bến giao hàng | Sức chứa, kế hoạch nguyên liệu, đơn lớn |
| Khám phá và cộng đồng | Cầu suối, nhà thiên nhiên, hội quán, sân hội chợ | Vùng mới, bộ sưu tập, nhiệm vụ chung |

Đề xuất mỗi công trình sản xuất có 3–5 cấp với ba yếu tố tách biệt:

1. **Cấp nông trại:** được phép mua công trình hoặc nâng tới một mốc.
2. **Cấp công trình:** công thức, hàng chờ, sức chứa và ngoại hình.
3. **Tay nghề:** tiến bộ từ sử dụng, mở mẫu trang trí hoặc lợi ích nhỏ; không buộc chờ thêm một thanh kinh nghiệm cho mọi công thức cơ bản.

Ví dụ lò bánh:

| Cấp lò | Thay đổi đề xuất |
|---:|---|
| 1 | Bánh mì, một vị trí hàng chờ, lò nhỏ |
| 2 | Bánh ngô, thêm vị trí, kệ bên cạnh |
| 3 | Bánh cà rốt, làm theo mẻ, bàn sơ chế |
| 4 | Bánh trái cây, kế hoạch nguyên liệu, biển hiệu riêng |
| 5 | Bánh tiệc cho phiên chợ và tùy chọn chuyên nghề |

Mỗi nâng cấp hiển thị trước chi phí, lợi ích và ngoại hình. Di chuyển giữ nguyên ID, cấp, hàng chờ và thời gian; không tạo sản phẩm mới hoặc hoàn tất nhanh hơn. Nâng cấp không hủy mẻ hiện tại; hiệu lực sản xuất mới áp dụng từ mẻ sau. Nếu đổi diện tích chiếm chỗ, phải cho chọn vị trí hợp lệ trước khi trừ tiền.

Tham khảo: Hay Day có công trình mở theo cấp, hàng chờ và mức thành thạo riêng. Thiết kế trên phát triển lại bằng xu/vật liệu và mục tiêu của dự án, không sao chép hệ thống mua ô bằng tiền cao cấp. [Supercell: công trình sản xuất](https://support.supercell.com/hay-day/pt/articles/production-building.html)

## 4. Chế độ sắp xếp nông trại

- Chuyển riêng sang “Sắp xếp”; lúc này kéo không kích hoạt thu hoạch hay mua hàng.
- Lưới chỉ hiện khi cần; xem vùng chiếm chỗ, bóng công trình và lối vào. Chạm chọn rồi chạm đặt là phương án thay thế kéo thả trên điện thoại.
- Di chuyển, đổi hướng đồ có hỗ trợ, cất kho trang trí, hoàn tác và làm lại. Góc máy vẫn cố định; đổi hướng một ghế không đồng nghĩa xoay cả bản đồ.
- Lưu vài bản bố trí yêu thích: “Làm việc”, “Vườn hoa”, “Phiên chợ”. Bản bố trí chỉ tham chiếu đồ đã sở hữu, không nhân bản tài sản.
- Chuyển bố trí phải kiểm tra diện tích, cấp/vật phẩm còn sở hữu và giữ nguyên jobs. Công trình đang làm việc không được bán/cất mất; UI hướng dẫn đợi mẻ xong hoặc giữ tại chỗ.
- Kho trang trí riêng với kho nông sản. Có đường, hàng rào, đèn, cổng, biển tên, ghế, hoa, hồ cảnh và đồ thủ công.
- Chế độ chụp ảnh ẩn UI; dùng ảnh làm bìa thăm vườn nếu chủ chọn chia sẻ.

Đồ đẹp tạo lợi ích chơi: mở nhóm khách NPC, chủ đề quán hoặc sinh vật sưu tầm. Phần thưởng tính theo nhiều điều kiện phù hợp, có trần; đặt hàng trăm món giống nhau không nhân thu nhập vô hạn. Không bắt trang trí đúng một công thức tối ưu mới chơi được.

## 5. Nhiệm vụ và thành tích

| Loại mục tiêu | Ví dụ | Thưởng phù hợp |
|---|---|---|
| Chương truyện | Chuẩn bị phiên chợ, sửa cầu, đón cư dân mới | Khu đất, công trình, nhân vật |
| Đơn hàng thường | Giao bánh và sữa cho bữa sáng | Xu, XP, vật liệu phổ biến |
| Đơn dài qua nhiều phiên | Chuẩn bị giỏ quà cho làng | Khoản thu lớn, mẫu đồ, tình bạn |
| Mục tiêu tự chọn | Hoàn thiện góc quán, nuôi đủ đàn cừu | Tiến độ rõ, mốc nhỏ động viên |
| Thành tích lâu dài | 10 công thức đầu; hoàn tất chương nghề | Danh hiệu, huy hiệu, biển hiệu |
| Bộ sưu tập | Cá, hoa, món ăn, đồ thủ công | Đồ trưng bày và trang nhật ký |
| Công trình nhóm | Góp hàng xây sân hội chợ | Mỗi người nhận đồ kỷ niệm, mở hoạt động chung |

Màn mục tiêu chỉ ghim tối đa ba việc: việc làm được ngay, mục tiêu đầu tư, mục tiêu tự chọn. Mỗi dòng nguyên liệu có “Đi tới nơi làm”. Đơn thường không đòi món chỉ mới mở trên giấy nhưng chưa có khả năng sản xuất, trừ đơn mua/đổi được ghi rõ và không bắt buộc.

Không trừ thành tích khi vắng, không chuỗi đăng nhập mất sạch, không buộc hoàn tất theo ngày thật. Sự kiện có thể quay lại. Thành tích kinh tế không dựa vào số lượt tự mua bán giữa hồ sơ cùng tài khoản; ưu tiên sản phẩm tự tạo và mục tiêu nội dung có giá trị.

## 6. Cửa hàng hệ thống và chợ người chơi

Hai nơi có vai trò khác nhau nhưng sử dụng cùng xu nông trại.

**Cửa hàng hệ thống:** hạt giống, con giống, vật liệu cơ bản, công trình, nâng cấp, trang trí. Giá rõ và nguồn cơ bản ổn định; hàng mới theo cấp được xem trước. Có thương nhân NPC đổi vật liệu theo tỷ lệ định sẵn để không kẹt vì chợ vắng. Hàng chủ đề đổi theo chương/phiên chợ, có ngày quay lại hoặc đưa vào bộ sưu tập mua sau.

**Chợ người chơi:** hàng dư/thiếu, sản phẩm nghề và nguyên liệu; gồm quầy của từng nông trại và danh mục chung. Có lọc mặt hàng, giá đơn vị, số lượng, bạn bè và “món đang cần cho kế hoạch”. Dùng biểu mẫu hàng hóa thay cho viết quảng cáo/chat tự do.

Ba loại đề nghị:

| Loại | Ví dụ | Giai đoạn |
|---|---|---|
| Bán lấy xu | 10 trứng giá tổng 80 xu, rõ 8 xu/quả | Chợ bản đầu |
| Đổi hàng | Đưa 5 phô mai để lấy 10 bột | Chợ bản đầu |
| Đặt mua | Cần 20 gỗ, trả trước khoản xu giữ riêng | Mở rộng sau hai loại đầu |

Giá trên chỉ minh họa thao tác, chưa phải bảng giá cân bằng. Với trẻ nhỏ có giá tham khảo, dải giá cho phép và cảnh báo giao dịch khác biệt lớn. Chỉ mở mặt hàng thuộc tầng tiến trình được phép; vật phẩm nhiệm vụ, phần thưởng tài khoản và tài nguyên trợ giúp khởi đầu không đem bán/đổi.

Quy tắc chợ bản đầu:

- **Rao bán, sửa/hủy đơn, mua và chấp nhận đổi đều cần kết nối server. Không đưa lệnh chợ vào hàng đợi offline.** Mất mạng khóa thao tác và hiện “Kết nối mạng để giao dịch”.
- Trước giao dịch phải hoàn tất đồng bộ phần tiền/hàng liên quan và lấy trạng thái server mới. Chỉ dùng số dư/kho đã được server xác nhận.
- Mất kết nối sau khi đã gửi yêu cầu: giữ mã giao dịch, báo “Đang kiểm tra kết quả”; khi có mạng tra receipt của yêu cầu đó. Không tự coi thất bại, hoàn tiền hay tạo giao dịch mới. Tra lại kết quả khác với xếp một giao dịch mới chờ gửi offline.
- Mở ở một cấp sớm sau khi hiểu sản xuất, ví dụ cấp 7; cần tài khoản online. Liên kết/lưu cloud vẫn mở từ đầu, không phải chờ cấp 7.
- Bán/đổi theo **cả lô cố định** trước; chia mua một phần để sau, giảm nhầm đơn giá và xử lý giao dịch.
- Khi đăng, hàng chuyển từ kho dùng được sang nơi giữ hàng của chợ. Không được chế biến/bán tiếp cùng số hàng đó.
- Người mua/đổi nhìn rõ cả hai phía trước khi xác nhận. Đổi hàng kiểm tra và chuyển đồng thời; không có bước “gửi trước rồi chờ bạn gửi lại”.
- Có hủy/hết hạn và hoàn hàng một lần vào hộp nhận; kho đầy không làm mất hàng. Đơn đã bán không thể hủy. Nếu nhiều người bấm mua, chỉ một giao dịch thắng.
- Người bán có thể offline; backend vẫn hoàn tất giao dịch. Người mua cần mạng để xác nhận; mất phản hồi thì kiểm tra mã giao dịch, không tự trừ tiền lần nữa.
- Ban đầu ít ô rao, mở thêm qua nâng quầy. Phí bán thành công nếu thử nghiệm phải hiện trước; ví dụ bán 100 xu, phí 3 xu, thực nhận 97. Đổi hiện vật có thể không thu phí ở bản thử nhưng vẫn có giới hạn ô và số lượng.
- Không có đấu giá đếm giây, vay nợ hoặc tiền thật trong phạm vi này. Giao dịch với hồ sơ cùng tài khoản không tạo thưởng/thành tích kinh tế.

Hệ thống vẫn mua hàng cơ bản và cung cấp đầu vào thiết yếu khi chợ vắng. Giá cửa hàng/bán NPC được kiểm tra để không có vòng mua rồi bán ngay vô hạn tiền hoặc XP. Giá chợ theo người bán nhưng trong dải phù hợp; không làm đầu cơ giá thành hoạt động bắt buộc.

## 7. Sáu lớp nội dung mới nên ưu tiên

### A. Chọn một nghề để đầu tư sâu

Người thích làm bánh đầu tư lò và quầy bánh; người thích vật nuôi phát triển sữa/len; người thích cây làm vườn trái và mứt; người thích sáng tạo làm đồ thủ công. Tất cả vẫn có thể học nghề khác. Chuyên nghề tạo tiện ích/công thức đặc trưng và ngoại hình, có thể đổi về sau; không khóa vĩnh viễn nguồn hàng để ép mua người khác.

Lợi ích: người chơi có bản sắc, chợ có nhu cầu thật, các nông trại không giống nhau dù cùng cấp.

### B. Mở quán và đón khách NPC

Từ một quầy bánh lên quán nhỏ, chọn thực đơn từ hàng tự làm. Khách đến khi mở cửa trong phiên chơi, có sở thích dễ hiểu; hoàn tất đơn tạo xu và tiến độ nhân vật. Cảnh quan đạt mốc mở nhóm khách/đề bài mới, không tự đổi lượt thích của người thật thành tiền.

Lợi ích: nhìn thấy sản phẩm được sử dụng và một nông trại có người sinh hoạt. Không cần người thật đang online để hoạt động.

### C. Dự án của làng và hợp tác bạn bè

Xây cầu, phục hồi vườn hoa, chuẩn bị ngày hội. Chia mục tiêu thành nhiều giỏ hàng khác nhau, mỗi người chọn phần muốn góp. Hiện thay đổi công trình theo giai đoạn. Khi góp, server trừ hàng và tăng tiến độ cùng lúc; phần thưởng mốc nhận một lần.

Lợi ích: người chơi có lý do hỗ trợ nhau và mục tiêu lớn hơn ví tiền. Không phạt nhóm vì một thành viên vắng; chơi riêng vẫn có phiên bản dự án với NPC.

### D. Khám phá những góc đất có chuyện riêng

Mở bờ suối tìm loài cá, đồi cây gặp nhân vật mới, sửa nhà kính tìm bộ giống, khu xưởng học mẫu thủ công. Mỗi vùng thêm một hoạt động hoặc quyết định, không chỉ thêm ô trống.

Lợi ích: tạo sự tò mò và thay đổi nhịp sau nhiều phiên sản xuất.

### E. Giống, công thức và đồ nghề sưu tầm

Các giống khác màu, mẫu bánh, hoa và họa tiết có đường lấy cụ thể qua nghề/nhiệm vụ. Dùng bộ sưu tập để mở đồ trưng bày hoặc mẫu mới. Nếu có chất lượng sản phẩm, bắt đầu với ít bậc, giá trị rõ; không đưa hàng hiếm ngẫu nhiên thành điều kiện tiến trình chính.

Lợi ích: vẫn có mục tiêu khi đã xây đủ công trình. Đồ thủ công và trang trí là đầu ra dài hạn cho vật liệu.

### F. Trợ thủ và công cụ giảm việc lặp

Sau khi người chơi hiểu quy trình, mở thu theo luống, kế hoạch gieo, hàng chờ, trợ thủ giao một số việc. Trợ thủ chỉ làm danh sách hữu hạn có nguyên liệu, không tự sản xuất vô tận. Thú cưng đi theo, mang giỏ hoặc chỉ điểm một món tìm được; không là nguồn tiền không giới hạn.

Lợi ích: nông trại lớn hơn nhưng không biến thành hàng trăm lần bấm. Người chơi dành thời gian vào đầu tư và sáng tạo.

Các ý tưởng nên thử sau: lễ hội theo chủ đề, chụp ảnh/bưu thiếp, thuyền hàng đi vùng khác. Chưa cần ngay thiên tai phá mùa, PvP, bảng xếp hạng giàu nhất, nhiều loại tiền và chợ đầu cơ.

## 8. Chợ làm thay đổi kiến trúc online

Phương án cloud save gửi toàn bộ JSON ở tài liệu trước chỉ thích hợp cho chơi cá nhân/thăm chỉ đọc. Khi có chợ, **số tiền, hàng, công việc sản xuất và tài sản tạo hàng của nông trại online phải do server xác thực**, không cho client tự cập nhật số dư hoặc ghi đè state kinh tế.

Đề xuất:

- Client gửi lệnh có mã duy nhất: gieo, xếp mẻ, thu, giao đơn, xây/nâng cấp, rao, mua, đổi. Server kiểm tra điều kiện và ghi kết quả; Realtime chỉ báo có thay đổi.
- Tiền dùng số nguyên. Có sổ giao dịch, kho khả dụng, hàng chợ giữ riêng, jobs, listings, trades và receipts. Quyền bảng/RPC không cho người dùng tự thêm tiền/hàng.
- Mua/đổi diễn ra trong một giao dịch database: kiểm tra đơn còn mở, khóa hàng/tiền liên quan, trừ và cộng hai phía, đóng đơn, ghi receipt. Giữ thứ tự khóa ổn định; retry dùng cùng mã để không nhân đôi. PostgreSQL có cơ chế khóa dòng phù hợp để ngăn cập nhật cạnh tranh. [PostgreSQL row locks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS)
- Mini game có thưởng kinh tế cũng phải có luật kiểm chứng/giới hạn phía server; không có API nhận trực tiếp “được X xu” từ client. Khởi đầu dùng seed/lượt chơi do server cấp, phát lại thao tác hợp lệ khi khả thi; không hứa chống bot tuyệt đối.
- RLS vẫn bảo vệ chủ sở hữu, nhưng riêng RLS không chứng minh luật kinh tế. Chỉ làm giao dịch qua nhiều request frontend không bảo đảm nguyên tử.

### Offline vẫn chơi được, nhưng chợ cần xác nhận online

Jobs đã được server chấp nhận vẫn tới hạn lúc người chơi nghỉ; khi quay lại server tính bằng mốc đã lưu. Offline có thể xem tiến trình, sắp xếp bản nháp và chuẩn bị hành động; phần kinh tế chưa xác nhận hiện là tạm tính, chưa dùng lên chợ.

Để chơi chủ động khi mất mạng mà vẫn có tính toàn vẹn, thiết kế một **phiên offline hữu hạn** khi đang online: server dành riêng ngân sách xu/nguyên liệu cho một thiết bị, ghi trạng thái xuất phát và thời gian. Thiết bị lưu chuỗi lệnh; khi quay lại server chạy lại theo cùng luật và giới hạn thời gian thực, rồi đối soát một lần. Tài nguyên đã dành cho phiên đó không được thiết bị khác đem bán. Đầu ra offline chỉ trở thành hàng giao dịch sau đối soát.

Không tự trả tài nguyên của phiên offline vào ví chung chỉ vì hết thời gian trong khi thiết bị cũ có thể còn dùng; nếu buộc đóng/hủy phiên từ máy khác, phải hủy quyền đối soát cũ và giải thích rõ bản chơi chưa đồng bộ có thể không áp dụng. Phiên lệch/xung đột giữ bản cục bộ để phục hồi, không âm thầm ghi đè.

### Liên kết nông trại cục bộ cũ

Đây là quyết định UX cần giải quyết trước triển khai: bản JSON khách tùy ý không đủ bằng chứng để đưa tiền/kho vào chợ. Khuyến nghị mời liên kết sớm cho người muốn chơi chợ; tài sản nông trại online có nguồn xác thực từ đầu. Nếu người dùng đã chơi hoàn toàn cục bộ, giữ nguyên bản đó cho chơi riêng/sao lưu; không tự chuyển số dư sang thị trường.

Phương án chuyển an toàn ban đầu là tạo nông trại online với gói khởi đầu xác định, giữ nông trại cũ; bố cục/đồ trang trí chỉ nhập trong giới hạn đã mở và có quyền sở hữu. Đây là đề xuất cần chốt, **chưa phải quyết định được Đại ca đồng ý**, và thay cho lời hứa trước đó rằng mọi tiến trình cục bộ có thể lên online nguyên trạng. Nếu yêu cầu giữ toàn bộ kinh tế, cần thiết kế phiên chơi khách có xác thực server ngay từ đầu, thay đổi điều kiện “chỉ tạo dữ liệu online khi liên kết”.

## 9. Thứ tự triển khai và thử nghiệm

| Mốc | Phạm vi | Điều kiện qua |
|---|---|---|
| A | Vòng kiếm/tiêu xu, trồng/nuôi/chế biến, mua giống/nâng cấp, sắp xếp, mục tiêu ngắn | Chơi vui, hiểu được lời/lỗ, có việc khi chờ |
| B | Đầy đủ nghề/công trình bản 1, nhiệm vụ, thành tích, cửa hàng hệ thống, save; nền kinh tế server và xử lý offline | Không kẹt vốn; không sai/mất/nhân đôi tiền hàng khi đổi thiết bị |
| B3 | Chợ bán và đổi hàng chỉ khi có mạng, quầy riêng/danh mục chung, thăm vườn | Nhiều người mua cùng đơn vẫn đúng, hủy/timeout/hoàn hàng an toàn |
| C–D | Quán khách, chuyên nghề, dự án nhóm, mở thêm vùng và nội dung | Tạo lựa chọn mới và mục tiêu dài hạn, không chỉ kéo dài thời gian chờ |

Chợ đã nằm trong phạm vi cần hoàn thành, không còn là tính năng “nếu cần”. Mở chợ cho nhóm thử nhỏ trước rồi tới các tài khoản liên kết. Việc chia mốc không có nghĩa thêm tất cả ý tưởng mở rộng vào bản đầu.

Theo dõi ba câu hỏi: sau một phiên người chơi đã xây được điều gì; họ có mục tiêu để quay lại không; và có hiểu lựa chọn đầu tư của mình không? Đo số lần kẹt kho/vốn, thời gian không có việc, số đơn không đủ khả năng làm, mặt hàng không bán được và cách người chơi phân bố nghề. Cân bằng thị trường có cả NPC để không phụ thuộc lượng người online.

Kiểm thử giao dịch riêng: mua đồng thời; hủy đúng lúc mua; hết hạn giữa thao tác; retry sau mất phản hồi; kho đầy; đổi hàng thiếu một phía; đăng lặp; sửa giá client; số âm/tràn số; cùng tài khoản tự giao dịch; chỉnh đồng hồ; snapshot cũ; lợi dụng bản sao; hai máy dùng cùng một vật phẩm; đối soát offline hai lần; nhận thưởng mini game/nhóm nhiều lần.
