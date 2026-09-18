# Địa hình Làng Mầm — tham khảo Family Island

**Trạng thái sau duyệt:** Đại ca đã yêu cầu thực hiện. Đọc [TERRAIN_V2_IMPLEMENTATION](TERRAIN_V2_IMPLEMENTATION.md) để biết mẫu v2 đã dựng và giới hạn; phần dưới giữ nội dung nghiên cứu trước triển khai.

Ngày 18/09/2026. Theo chỉ dẫn mới của Đại ca: các cụm đồi phía dưới bản đồ hiện tại vô nghĩa và thiếu thẩm mỹ; tham khảo cách làm map của Family Island. Tài liệu này bổ sung định hướng cho REVAMP_PLAN, chưa phải thay đổi renderer hoặc thế giới đã lưu.

## 1. Nguồn đã xem và phạm vi kết luận

- [Website Family Island](https://familyisland.games/): xem trực tiếp các ảnh trong carousel.
- [Ảnh bờ nước/cầu cảng](https://familyisland.games/images/content-screen_01_landscape.jpg): ảnh quảng bá so sánh giai đoạn phát triển; dùng tham khảo cách nối nhà–đất–bờ–nước.
- [Ảnh khu nhà và ruộng](https://familyisland.games/images/content-screen_03_landscape.jpg): khu đất rộng, đường, hàng rào và cụm cây; không xem là sơ đồ toàn đảo.
- [Ảnh cảnh tuyết](https://familyisland.games/images/content-screen_05_landscape.jpg): vách đá/cây bao quanh một khoảng đất có điểm nhấn.
- [Hướng dẫn Pink Bags chính thức](https://melsoft-games.helpshift.com/hc/pt/11-family-island/faq/1243-where-can-i-find-pink-bags-and-what-s-inside-them-1-4/), [ảnh địa hình minh họa đã xem](https://d2duuy9yo5pldo.cloudfront.net/melsoft-games/558378d6-e91c-4ffa-888b-d8695ba1ff7e.png): bờ sông, vách đá, thác và các cụm thực vật. Trang hỗ trợ lưu ý ảnh minh họa có thể khác bản game thực tế.
- [Hướng dẫn di chuyển chính thức](https://melsoft-games.helpshift.com/hc/en/11-family-island/faq/1595-how-can-i-travel-in-the-game-1688120020/): phân biệt Home Island với các đảo thám hiểm/sự kiện; một số đảo bị khóa theo nhiệm vụ/cấp.

Đây là phân tích hình ảnh và thiết kế hiển thị, không phải kiểm tra mã nguồn Family Island. Không suy ra engine, kỹ thuật 2D/3D hay thuật toán sinh map của họ từ screenshot. Không lấy ảnh của họ làm asset cho module.

## 2. Những điểm học được từ hình ảnh

Trong ảnh khu nhà, mặt bằng đủ rộng cho công trình và ruộng; cây/bụi tập trung thành cụm, đường và hàng rào làm bố cục dễ đọc. Ảnh bờ nước thể hiện rõ lớp cỏ, mép đất/đá và nước, thay vì hai mảng màu sát nhau. Ở cảnh tuyết, vách đá bao quanh khoảng đất chính và cây che bớt đường nối. Ảnh minh họa sự kiện có dòng nước nối các vùng, thác nằm ở chênh cao và thực vật chia thành những mảng rõ.

**Suy luận thiết kế của em:** chất lượng này đến từ việc chọn hình dạng vùng và đặt vật thể có bố cục. Độ cong tự do không phải điều kiện duy nhất; các bờ vẫn có thể được tạo từ mảnh ghép hoặc theo lưới nhưng không lộ nhịp lặp của khối lưu trữ.

## 3. Thay các cụm đồi hiện tại bằng gì

Không tiếp tục công thức cao độ dựa vào khoảng cách đến mép khu 16 × 16. Đối với template đầu tiên, đề xuất một **thung lũng ven hồ**, có vùng đất liền mạch và ít mốc cao độ dễ đọc.

Các hướng dưới đây là vị trí trên màn hình khi dùng camera cố định đang được đề xuất, không mặc định trùng trục x/z của dữ liệu.

| Vùng | Bố cục hình ảnh | Giá trị chơi | Điều kiện cần kiểm |
|---|---|---|---|
| Trung tâm | Đồng cỏ rộng, Home và sân sinh hoạt; khoảng trống rõ để bố trí nhà | Khu xây và ruộng chính, mở dần diện tích | Đủ đặt công trình lớn, không bị suối chia thành ô vụn |
| Phía dưới | Một phần hồ và bờ thấp uốn thành vịnh, vài cụm lau/đá | Cảng, câu cá, lối dạo và decor | Thấy rõ đối tượng ở giữa; chân cảng có lối tiếp cận |
| Phía sau bên trái | Cụm rừng dày có bìa thưa, đường mòn dẫn vào một khoảng đất | Gỗ, thu gom, mở đất và một mục tiêu phục hồi | Cây có thể dọn; điểm đặc biệt vẫn nhận ra từ xa |
| Phía sau bên phải | Một dải vách đá không đều, mặt cao nguyên đủ rộng, một lối dốc | Mỏ hoặc vườn trên cao tùy thế mạnh map | Đường lên có chủ ý; vật liệu mở lối kiếm được ở vùng trước |
| Dọc một cạnh | Suối nối từ vùng cao tới hồ; cầu ở chỗ hẹp | Mở đường tới bãi đất mới | Dòng nước liền mạch, độ cao không chạy ngược, vật liệu cầu không bị khóa bên kia |
| Bờ đối diện | Đồng cỏ mở rộng, dấu tích công trình nhỏ dễ nhìn | Đích khai phá trung/dài hạn, thêm chỗ xây | Đất sau khi dọn phải thực sự dùng được |

Đây là một template đề xuất cho Làng Mầm, không phải chép bố cục Family Island. Không biến mọi map thành đảo nhiệt đới hoặc bắt mọi khu chức năng cố định ở cùng tọa độ. Các template khác cần khác cách chia vùng và đường mở, chứ không chỉ thay màu cỏ hoặc độ uốn sông.

**Tiêu chuẩn cho vùng cao:** phải tạo ít nhất một giá trị có chủ ý — mặt bằng xây, nguồn tài nguyên, điểm khám phá hoặc đường viền cảnh quan. Vách xa có thể chỉ làm phông, nhưng phải có bố cục và tiết chế. Không rải nhiều đồi giống nhau chỉ để lấp khoảng trống.

## 4. Thiết kế khai phá cùng với địa hình

Mỗi vùng khai phá khai báo: vùng đang tiếp cận → vật cản/công trình mở lối → chi phí/thời gian → vùng nhận được → ích lợi mới. Người chơi nhìn thấy đích đến trước khi trả giá mở đường.

Ví dụ đề xuất:

1. Từ Home thấy một bìa rừng cùng con đường mòn; dọn cây đổ nhận gỗ và mở bãi xây mới.
2. Từ bãi xây nhìn thấy đầu cầu hỏng; sửa cầu mở đồng cỏ bên kia suối.
3. Đồng cỏ cho tiếp cận chân dốc có đá chắn; dọn đá mở mặt bằng cao và điểm tài nguyên đặc thù.
4. Bờ hồ có khu đủ rộng cho cảng; công trình mở theo Home đã định, không cần đập cả vách núi mới tới được nước.

Tránh tạo một con đường tuyến tính duy nhất xuyên toàn nông trại: nên có nhánh để người chơi chọn mở đất trồng, lấy gỗ hoặc chuẩn bị nghề cá. Các nhánh thiết yếu phải hội tụ được, không chặn nâng Home bằng nguồn vật liệu chỉ có sau chính lần nâng đó. Rừng/mỏ đặc thù có nguồn cung dài hạn; phá vật cản một lần là nguồn bổ sung.

Giữ trại chính có khoảng trống và khả năng sắp xếp tự do. Bố cục dày đặc theo chuỗi của một đảo sự kiện có thể làm tham chiếu cho khu khám phá nhỏ, không áp lên toàn bộ khu xây lâu dài. Chưa bổ sung đảo sự kiện có hạn giờ hoặc hệ năng lượng chỉ vì game tham khảo có chúng.

## 5. Thay cách sinh thế giới

Sinh từ vùng có ý nghĩa rồi mới chi tiết hóa:

1. **Chọn mẫu được duyệt:** sơ đồ đất xây, vùng nước, rừng, mặt cao, điểm nhấn và các lối nối. Người chơi vẫn nhận ngẫu nhiên, không chọn map.
2. **Tạo hình dáng toàn vùng:** đường bao và các bậc cao độ chạy liên tục qua ranh chunk; một vùng có thể chiếm nhiều chunk. Bờ/lối mở theo địa hình, không theo hình vuông lưu trữ.
3. **Đặt mặt bằng và đường tiến trình:** giữ diện tích trống, hướng nhìn tới mục tiêu, chân dốc và hai bờ cầu. Kiểm bằng footprint công trình lớn thực tế trong catalog.
4. **Đặt cụm tài nguyên/vật cản:** chọn tâm cụm, mật độ lõi/rìa, các cỡ cây/đá và khoảng trống. Tách vật cản có thể dọn, nguồn tài nguyên dài hạn và nền cố định.
5. **Ghép lớp hình ảnh:** mép cỏ, đất lộ, vách đá, đá chân bờ, lau/cây; thay đổi có giới hạn từ seed. Chỉ đặt props sau khi lối đi/mặt bằng hợp lệ.
6. **Kiểm logic và duyệt hình:** tự động kiểm đường mở, cầu/cảng và diện tích; duyệt ảnh ở zoom toàn cảnh, zoom chơi và zoom gần. Seed không đạt dùng mẫu dự phòng đã duyệt.

Mục tiêu trước mắt là một mẫu thực sự đẹp và chơi được. Sau đó mới mở rộng sáu họ; không lấy số lượng seed hoặc family làm đại diện cho chất lượng bố cục.

## 6. Gắn với hướng 2.5D đang trao đổi

- Cố định góc nhìn giúp chủ động bố cục tiền cảnh thấp, điểm nhấn phía sau; pan/zoom không đổi hướng.
- Địa hình/cầu/nước giữ hình học cần thiết. Dùng ảnh ghép cho phần lớn cây, đá, nhà và một số mảng vách; điểm chân/cao độ và che khuất phải đúng.
- Bộ asset môi trường cần các mảnh bờ/vách nối được: đoạn thẳng, cong, góc lồi/lõm, chân vách, lối dốc, cửa suối. Không lấy một ảnh núi đơn lẻ nhân khắp map.
- Dùng imagegen cho concept bố cục và bộ mẫu đồng phong cách sau khi triển khai cảnh thử. Concept phải mô tả được mặt bằng và các lối mở, không chỉ tạo phong cảnh đẹp mà không chơi được.
- Giữ asset sáng/tối cùng hướng sáng. Dùng bóng tiếp đất và vài chi tiết chuyển động để vật thể hòa với nền.

## 7. Điều kiện nghiệm thu bản đồ mẫu

- Thu nhỏ vẫn nhận ra khu Home, vùng nước, khu rừng, vùng cao và tuyến mở rộng.
- Không thấy chu kỳ đồi/đường trống 16 ô; biên chunk không quyết định mỹ thuật.
- Cao nguyên có mặt bằng hoặc điểm đến rõ; không xuất hiện cụm đồi lặp vô dụng ở cạnh dưới.
- Dọn một vùng đem lại ích lợi nhìn thấy và không làm cảnh thành nền phẳng trống trải hoàn toàn; các lớp cỏ/bờ cố định vẫn giữ cảnh quan.
- Có lối tới cảng và lên vùng cao; không đặt đồ qua bờ chưa có đường tới.
- Camera cố định vẫn cho chọn ô phía sau cây/nhà bằng cơ chế làm mờ hoặc chế độ bố trí.
- Cảnh mẫu đẹp ở mức zoom chơi thực tế; kiểm thêm các biến thể seed trước khi nhân rộng.

Thay đổi địa hình logic trên thế giới đã lưu cần version/migration riêng. Không tự sinh lại theo seed mới khiến nhà hiện hữu rơi xuống nước hoặc nằm giữa vách.
