**Sửa lỗi sau phản hồi ảnh 19/09:** chân Nhà chính/kho bị nền 3D che vì neo sprite sai chiều sâu. Đã sửa tọa độ chân chạm mặt đất cho cả nhà đặt và preview xoay; tái hiện trước/sau trong browser. 8/8 kiểm thử liên quan, typecheck và build module đạt. Kiểm biên file ảnh trước đây không đủ để xác nhận hiển thị trong map. Xem [bản sửa](ARRIVAL_AND_SPRITES_2026-09-19.md).

**Mới nhất 19/09 — khởi đầu và công trình ảnh:** [ARRIVAL_AND_SPRITES_2026-09-19](ARRIVAL_AND_SPRITES_2026-09-19.md): bảo đảm 20 tài nguyên cấp 1, 696 ảnh công trình đủ góc/cấp, bụi quả gen, tiến độ thi công + búa/cưa, chọn cloud ưu tiên khi đăng nhập, lời chào và nhiệm vụ dẫn đường. Lối trang viên có 6 chất liệu theo Home hoàn tất. Typecheck, 160/160 suite + 1/1 kiểm tra toàn bộ ảnh và build module/host đạt. Chưa deploy, chưa thử chọn cloud Google thật hoặc nghiệm thu Android.

**Icon năng lượng 18/09:** Thay toàn bộ ký tự Unicode năng lượng trong HUD, nút khai phá, phần thưởng quả và hiệu ứng bay bằng EnergyIcon.tsx (SVG tia sét vàng, viền và mặt sáng vẽ riêng). Chỉnh kích thước desktop/mobile, thêm tên nút đầy đủ cho trình đọc màn hình. Typecheck module và diff check đạt; không đổi cơ chế hoặc save, chưa deploy.

**Gia đình tự sinh hoạt 18/09:** [FAMILY_LIFE](FAMILY_LIFE.md): bốn người tự tìm đường trong đất đã mở, ghé nhà/cây/đồ vật, nghỉ và vẫy chào; ưu tiên lệnh khai phá, không tác động kinh tế. Lưới đi tránh công trình/ruộng/nước/vách, nhận cầu đã xây. Giảm chuyển động tắt đi dạo. 26/26 kiểm tra liên quan, typecheck và build module đạt; chưa deploy hoặc đo Android thật.

**Mỹ thuật gia đình 18/09:** Đã thay mô hình hộp bằng hình bo mềm, mặt có mắt/mũi/má, bố mặc yếm + mũ rơm, mẹ mặc tạp dề + tóc búi, bé trai đội mũ và bé gái tóc hai bên. Rig vai/khuỷu/hông/gối riêng cho chạy và khai phá; gia đình đứng thành nhóm hai hàng. Cả bốn dùng 2 instanced draw, 14.496 tam giác, không thêm texture/model tải ngoài. Chrome đã xem cận cảnh, console không lỗi; typecheck, 20/20 test khai phá và build module đạt. Chưa deploy hoặc đo Android thật.

**Kiểm chứng tài khoản 18/09:** xem [ACCOUNT_SYNC](ACCOUNT_SYNC.md): migration đã chạy trên Supabase thật qua Chrome; 16/16 kiểm tra DB trực tiếp đạt, dữ liệu thử rollback sạch, thêm redirect farm. Nhóm lưu trữ/sync 21/21, typecheck/build đạt. Full suite 113/114 (1 timeout geometry; chạy riêng 10/10 đạt). Custom SMTP và email/tài khoản thật chưa nghiệm thu.

# Kiểm chứng Làng Mầm

## Khai phá, năng lượng và gia đình — 18/09/2026

Xem [HARVESTING_ENERGY](HARVESTING_ENERGY.md), thay thế các bài dọn theo timer/thu gom cũ. Tổng **148 bài đạt** qua các lượt: 146 bài ngoài playthrough, thêm 1 bài biên kho/dụng cụ (chạy lại nhóm khai phá 20/20), và 1 bài mô phỏng gồm 9 hành trình Home 25. Mô phỏng 301 giây, 3 biome × 5/15/30 phút, không cấp vật liệu/xu/tăng tốc; nguồn vật liệu dùng khai phá, sản xuất và NPC hữu hạn. Sửa bot lấy lại luống sau khi kiếm tiền vì vòng kiếm tiền có thể đã gieo vào luống cũ.

Báo cáo bot trong reports/solo-progression.json: 5 phút/ngày mất 1.635–1.671 ngày giả lập, 15 phút 765–781 ngày, 30 phút 473–484 ngày. Đây là kiểm tra không bế tắc; bot giữ 8 ruộng, không khai thác tối ưu mở đất/nhiệm vụ/trao đổi. **Không coi số liệu này là nhịp chơi đã cân bằng hoặc dự báo thời gian người thật.**

Typecheck module đạt. Build module và host/PWA đạt; cảnh báo font/CSS/import/chunk cũ vẫn còn, precache host 817 entry khoảng 108.109 KiB. Không thay cấu hình host, không deploy.

Chrome QA local riêng: khai phá đá tốn 2 dụng cụ, giữ năng lượng/xu, nhận ngay 12 đá + 2 sét; cây trừ 12 năng lượng nhận 6 gỗ; bụi quả hồi năng lượng không trừ dụng cụ/xu; quặng cấp 3 khóa Home 12. Reload giữ 20 vật liệu, 180 xu và năng lượng đang hồi. Cả bốn nhân vật hiện cạnh Home; bụi quả có model riêng. Đã bỏ mục thu gom ở Nhiệm vụ. Viewport 390×844 không chồng thanh năng lượng/dock; console không lỗi.

Giới hạn: chưa bắt được trọn chuyển động ngắn của nhân vật/đường bay bằng screenshot trong phiên Chrome bị giãn frame. Bộ đo đôi lúc 1 FPS, có đoạn 22–30 FPS; chưa là phép đo Android thật. Chưa nghiệm thu độ mượt, mỹ thuật nhân vật hoặc cân bằng với người chơi. Không sửa vườn production.


## Hiệu năng sau phản hồi Android/Chrome — 18/09/2026

Xem [PERFORMANCE_2026-09-18](PERFORMANCE_2026-09-18.md). 128/128 bài đạt: full run 127 bài và rerun 1 playthrough đạt sau lỗi sandbox ghi report. Typecheck, build module, build host/PWA và diff check đạt. 21 WebP lossless đã kiểm alpha/RGB hiển thị và kích thước, tổng giảm 34,8%. Chrome QA riêng kiểm khởi đầu, Home 25, mở khu 13, nhớ cấu hình qua reload và viewport 390×844; bộ đếm địa hình giữ 1 sau reload qua nhiều tick. Không thay vườn production.

**Giới hạn:** phiên Chrome đo gần 1 FPS/p95 khoảng 1 giây chưa rõ nguyên nhân; chưa có benchmark FPS đáng tin trên Android thật. Không tuyên bố 60 FPS hoặc đã hết giật. Chưa deploy. Host build còn cảnh báo font/CSS/chunk/import sẵn có và precache 817 entry khoảng 108.095 KiB; không sửa cấu hình host trong lượt này.

## Google OAuth production — cập nhật 21 giờ 18/09/2026

Đã hoàn tất cấu hình Google/Supabase theo xác nhận của Đại ca. Chrome trên GitHub Pages đã chuyển sang Google, consent tên/ảnh/email, trở về `/Genius-kids/games/farm` với tài khoản Owner và giữ phiên sau reload. Form hiện **Chọn nông trại / Liên kết nông trại**; chưa bấm upload vườn thật hoặc thử hai thiết bị. Google Audience vẫn Testing. Không đổi mã ứng dụng; không chạy lại build/test cho thay đổi cấu hình dashboard và tài liệu. Xem [ACCOUNT_SYNC](ACCOUNT_SYNC.md); mục Google cũ bên dưới là lịch sử trước khi cấu hình.

## Rà soát cuối và mép nước — 18/09/2026

- Landscape/roads/showcase **16/16** đạt; sau tinh chỉnh normals chạy lại landscape **10/10**, 5,69 giây. Bổ sung kiểm dải khoảng cách hữu hạn, bờ thấp chạm mặt nước, world v1/v2 không thay dữ liệu. Typecheck module và `git diff --check` đạt.
- Build cuối đạt **23,91 giây**, JS **1.335,06 kB / 391,72 kB gzip**, CSS **29,69 kB / 7,03 kB gzip**. Một lượt build trước đó dừng exit 1 tại rendering chunks, không có chẩn đoán trong stdout; lần chạy lại nguyên mã đạt. Cảnh báo chunk lớn vẫn còn.
- Đã kiểm trực tiếp hồ/cầu cảng, sông/cầu, toàn đảo và giảm chuyển động; không có lỗi shader trong log trang game. Mobile 390 × 844: sửa thanh QA che dock, kiểm kho ba cột và popup. Ghi nhận một lỗi MutationObserver ở trang chứa iframe khi reload; chưa xác định nguồn, không coi mobile đã kiểm sạch mọi lỗi hoặc nghiệm thu thiết bị thật.
- Không đổi logic gameplay, topology nước, seed, save hoặc tích hợp host. Nội dung thay đổi, ảnh kết quả và giới hạn: [FINAL_POLISH_2026-09-18](FINAL_POLISH_2026-09-18.md).

## Xây mới bằng vật liệu và hạn mức — 18/09/2026

- Nhóm construction/progression-playthrough/revamp/persistence **35/35 test, 4/4 file đạt, 347,72 giây**. Gồm 6 test mới về giá/hạn mức, không tiêu khi thiếu vật liệu, hóa đơn được lưu, đếm cả đang xây, timer offline, hóa đơn cũ, di chuyển miễn phí, trang trí nhiều bản, khóa Home/đội thợ. Lượt đầu hai assertion dùng nhầm đồng hồ logic làm timestamp thực; đã sửa test sang `lastWallTime + readyAt - clock`, không đổi engine timer để làm test qua.
- Bộ solo đã tự kiếm cả vật liệu xây mới bằng lệnh thật: cả 9 lịch (3 thế mạnh × 5/15/30 phút) đến Home 25, không cấp tài nguyên hay tăng tốc. Đây là bằng chứng không kẹt tiến trình trong các lịch kiểm, không phải nghiệm thu cân bằng thời gian chơi.
- Browser `construction-review`, fixture Home 5: cối xay hiện 0/1, 25.000/100 xu, 25/6 gỗ, 25/4 đá; xác nhận xây thật còn 24.900 xu, kho 65 → 55. Đợi tự hoàn thành, mở lại menu hiện 1/1 · Cấp 1 và chuyển sang xem công trình cũ. Log error rỗng. Ảnh [giá vật liệu](screenshots/art-pass-2026-09-18/build-materials.png), [đã đủ hạn mức](screenshots/art-pass-2026-09-18/build-limit.png).
- Typecheck module và production build đạt; JS 1.331,06 kB / 390,17 kB gzip, CSS 29,37 kB / 6,97 kB gzip. Cảnh báo chunk lớn còn. `git diff --check` đạt. Không đổi save/schema/contentVersion, không ghép host/server; không kiểm điện thoại thật trong đợt này.
- Quy tắc và bảng vật liệu: [CONSTRUCTION_COSTS](CONSTRUCTION_COSTS.md).

## Kho hàng gọn — 18/09/2026

- Đổi UI danh sách sang lưới hình/tên/số lượng; không có giá hoặc nút bán trên từng ô. Chọn món mới hiện phần bán; lượng bán giới hạn theo phần không ghim, khóa trong lúc lưu. Bán thành công quay lại danh sách. Túi hỗ trợ/trang trí/sổ sản phẩm đóng mặc định. Không sửa engine/schema/save.
- Module typecheck và production build đạt. Browser trên DB riêng `stock-review`: kho nhiều vật phẩm hiển thị 6 cột desktop; chọn cà rốt, nhập 3, nút hiện 30 xu, thực hiện bán từ 500 còn 497. Đã thử giữ lại toàn bộ 497 để kiểm khóa bán. Ảnh [kho gọn](screenshots/art-pass-2026-09-18/inventory-compact.png). Không reset vườn của Đại ca.
- Không thêm/chạy lại suite gameplay cho thay đổi UI; full suite 95/95 của đợt cây phía dưới vẫn là lần chạy gần nhất. Cảnh báo bundle lớn còn, chưa kiểm trên điện thoại thật.

## Bộ 24 giống cây và nhịp chim cảnh — 18/09/2026

- Full suite sau mở rộng cây: **95/95 test, 11/11 file đạt, 335,45 giây**. Bao gồm 16 test mới về 12 giống bổ sung, vụ tối đa 24 giờ, tưới, khóa Home, offline, gieo/thu/bán, import và chuyển save IndexedDB content 2 → 3. Chi tiết: [CROPS_24](CROPS_24.md).
- Browser QA riêng `crops24-review`: 24 ảnh 320 × 240 tải đủ; kiểm các nhóm rau và cây dài ngày; chọn nghệ tây từ cửa hàng, ảnh giống đang cầm đúng và popup đổi giống giữ lựa chọn. Xu giữ nguyên khi chỉ chọn. Error log rỗng tại lượt kiểm cây. Ảnh trong CROPS_24.
- Sau full suite, theo yêu cầu mới của Đại ca sửa riêng hoạt cảnh chim: vào/lượn/ra 26–32 giây, nghỉ ngẫu nhiên 80–140 giây, lần đầu chờ 15 giây. Tắt khi giảm chuyển động; giới hạn delta để không nhảy vị trí sau khi tab nền. Không thay gameplay/save. Không chạy lại toàn suite cho thay đổi trang trí này.
- Module typecheck sau sửa chim đạt; `git diff --check` đạt. Browser kiểm tiếp chim gặp CDP `Page.getFrameTree` timeout; không coi đó là kiểm chứng hình ảnh thành công hoặc lỗi runtime game.
- Production build cuối gồm cả chim đạt: JS 1.327,15 kB / 388,96 kB gzip, CSS 26,78 kB / 6,50 kB gzip; vẫn còn cảnh báo chunk lớn. Không thêm PNG hoặc sửa cấu hình host trong đợt này.

## Hòa trộn cảnh, chi phí nâng cấp và tên tài nguyên — 18/09/2026

- Kết quả cuối: module typecheck đạt, build đạt (JS 1.316,77 kB / 385,06 kB gzip; CSS 26,78 kB / 6,50 kB gzip), `git diff --check` đạt. Cảnh báo bundle lớn còn. Landscape 9/9 đạt sau thay bạch dương; không chạy lại toàn bộ suite gameplay cho phần UI.
- **UI đã chốt theo Đại ca:** chỉ icon tài nguyên + số có/số cần, xanh khi đủ, đỏ khi thiếu. Tên và số thiếu nằm trong tooltip/nhãn truy cập; bỏ bảng, nhãn cột, chữ trạng thái và đoạn giải thích. Dùng cùng component ở chi tiết và xác nhận; nút khóa nếu thiếu tiền/vật liệu hoặc điều kiện công trình.
- QA riêng `upgrade-review`: 180/90 xu đủ, 0/8 gỗ và 0/6 đá thiếu → nút khóa. Thu gom thật tới đúng 8 gỗ + 6 đá → mở nút, xác nhận hiện đúng số; thực hiện nâng cấp trừ 90 xu và 14 vật liệu, bắt đầu timer 2 phút. Kiểm logic này trước khi rút giao diện thành icon; sau chỉnh đã xem lại trạng thái thiếu trên bản gọn. [Ảnh bản gọn cuối](screenshots/art-pass-2026-09-18/upgrade-compact.png). `upgrade-missing.png`/`upgrade-ready.png` là ảnh bảng cũ trong quá trình kiểm, không dùng làm mẫu thiết kế hiện hành.
- Menu chọn và hover đã kiểm trực tiếp tên **Sồi tán rộng**, **Vỉa quặng sắt**. Tên dùng chung `obstacleName` với tiêu đề/chi tiết/xác nhận khai phá; tên cây trồng lấy từ CROPS. [Ảnh quặng](screenshots/art-pass-2026-09-18/ore-name.png). Hiện chỉ có một loại quặng sắt, không tự thêm các loại quặng chưa có gameplay.
- Hòa trộn: alpha-to-coverage cho sprite, fallback alpha hash; bóng gốc mềm thay đĩa cứng, birch-v2 từ imagegen. Đã xem rừng gần/xa và bản đồ nhẹ; chưa kiểm phần cứng không MSAA/điện thoại. [Chi tiết và prompt](foliage-blending-2026-09-18.md). Browser bị auto-review ngắt khi hết quota ở lượt trước; sau Đại ca yêu cầu tiếp tục, dùng lại công cụ browser được phép, không vòng qua chặn.
- Log error của hai tab QA riêng rỗng khi chốt. Các timeout CDP khi build/HMR không phải lỗi runtime game. Không sửa DB `interaction-review` của Đại ca, không ghép host/server.

## Ảnh menu xây dựng và chọn giống — 18/09/2026

- Module typecheck và production build đạt. JS 1.311,10 kB / 383,29 kB gzip; CSS 26,20 kB / 6,34 kB gzip. Cảnh báo chunk lớn còn; 21 PNG tĩnh không đổi. Không chạy lại suite gameplay cho thay đổi UI này.
- Browser QA riêng `?lab=qa&session=catalog-review`: ảnh cối xay, lò bánh, chuồng bò, ghế, hàng rào và chậu hoa tải đúng 320 × 240; tìm cầu cảng vẫn thấy ảnh và khóa Home 11. Cuộn bảng giống kiểm đủ 12 ảnh tải thành công.
- Chọn cà rốt trong cửa hàng → nút giống đang cầm hiện cà rốt → mở popup đổi giống → chọn lúa mì. Tiền giữ 180 xu vì chưa gieo. Khóa Home và trạng thái giống được chọn hiển thị đúng; log error rỗng.
- Ảnh: [xây dựng](screenshots/art-pass-2026-09-18/catalog-build.png), [cửa hàng giống](screenshots/art-pass-2026-09-18/catalog-seeds.png), [popup đổi giống](screenshots/art-pass-2026-09-18/catalog-seed-picker.png). Kiểm desktop; chưa đo GPU/memory trên điện thoại thật.

## Đợt kiến trúc, sương, tương tác game và đường — 18/09/2026

- Trước phần tương tác: **75/75 test, 9/9 file, 218,16 giây** đạt; gồm 6.000 seed và chín lịch chơi solo. Bổ sung fixture không lẫn vườn mới/trưng bày, phân vùng nền và sương.
- Sau phần tương tác: nhóm regression/persistence/model/showcase/landscape **41/41** đạt. Đường có thêm **4/4**: đủ 16 mask, không nối chéo/cao độ khác, build/move/store/undo thật, hình học và UV trùng tại mối nối.
- Lượt full cuối gồm **79 bài trong 10 file**: **78 đạt, 1 timeout**, 440,20 giây. Bài kiểm bờ nước vượt timeout 5 giây trong lúc cùng chạy build. Đã gộp các assertion theo mảng lỗi, vẫn kiểm mọi đỉnh và dùng sai số cao độ chặt hơn. Chạy lại toàn bộ file landscape **9/9 đạt, 6,10 giây**. Mọi bài đã có lượt chạy đạt; không mô tả lượt full ban đầu là 79/79 sạch.
- Typecheck cuối của module và host đều exit 0; production build cuối đạt. Build cuối JS 1.308,01 kB / 381,99 kB gzip, CSS 23,96 kB / 5,90 kB gzip; cảnh báo chunk >500 kB còn. 21 PNG gốc tổng 36.512.748 byte, chưa tối ưu ngân sách texture/GPU.
- UI trên DB QA riêng: chọn cây → nút cầm liềm → quét 4 ô nhận 12 hàng → quét bí/cà rốt nhận thêm 5. Xem được sản phẩm +N bay từ luống lên giỏ sau lưu; quét ô trống không tăng kho. Gieo 4 ô trừ 12 xu. Cửa hàng dùng banner ảnh, chuyển nhiệm vụ trong cửa sổ và Escape đóng. Menu di chuyển/rotation nằm cạnh công trình, hủy giữ bố trí cũ.
- Sương: Home 5 mở khu 13 bằng lệnh thật, 25.000 → 24.880 xu; khu 19 trở thành liền kề, sương rút khỏi khu vừa mở. Minimap phản ánh sở hữu.
- Đường: xem 6 dạng, 16 tổ hợp và đường liên tục trong toàn cảnh nông trại. Preview không còn chồng khối path cũ. Chim RGBA thay các thanh hình hộp, không nhận raycast.
- Trong lúc thêm file road có lỗi HMR vì import đến asset chưa được chép; đã bổ sung asset và build thành công. Tải lại trong tab mới sau cùng: log error rỗng, save thu hoạch vẫn giữ 12 hàng. Phân biệt log HMR này với lỗi runtime sau tải sạch.
- Không reset save thật, không ghép host/server. Chưa chứng nhận viewport điện thoại thật, 60 FPS hoặc nghiệm thu mỹ thuật cuối.

Chi tiết mới nhất và ảnh: [CONTEXTUAL_PLAY_AND_ROADS](CONTEXTUAL_PLAY_AND_ROADS.md), [ARCHITECTURE_AND_EXPLORATION](ARCHITECTURE_AND_EXPLORATION.md).


## Sau triển khai địa hình v2 — 18/09/2026

- Suite **71/71 test, 8/8 file, 303,82 giây**, giữ 6.000 seed và chín lịch chơi solo. Thêm kiểm cao nguyên/dốc, save world v1, đường tiếp cận trước/sau xây cầu bằng lệnh thật, mesh bờ không hở, catalog 14 ảnh RGBA và biến thể seed ổn định.
- Typecheck module và host đạt. Build đạt; cảnh báo bundle JS >500 kB còn. PNG gốc 23,7 MB cần tối ưu cho mạng/VRAM mục tiêu.
- Trình duyệt QA: toàn cảnh, focus hồ, 14 mẫu alpha, chọn cây trên hình đúng tên, khai phá bằng timer. Log error rỗng khi kiểm cảnh đã tải ổn định. Camera cố định; nút pan/zoom/focus thay điều khiển xoay cũ. Đã kéo pan trên đất trống và bấm phóng to/thu nhỏ trên cảnh mới.
- Khai phá thực trên QA: 1.000.000 → 999.990 xu, kho 26.500 → 26.512, nhận 12 gỗ và sprite biến mất; trạng thái “Đã dọn”. Quét nhiều luống đầu game: kho 0 → 14, công cụ Thu vẫn được giữ.
- Sau tinh chỉnh cuối camera/picking và làm mềm mép cao nguyên, chạy lại 7/7 bài landscape đạt (7,98 giây), module typecheck/build đạt. JS cuối 1.275,32 kB / 370,07 kB gzip; CSS 15,71 kB / 4,10 kB gzip.
- Có thử công cụ viewport 390 × 844 nhưng browser vẫn báo 1280 × 720; không coi là kiểm responsive thành công. Đã reset override. Chưa xác nhận mobile của bản terrain v2, không dùng ảnh mobile 0.2 làm bằng chứng mới.
- Ảnh và chi tiết: [TERRAIN_V2_IMPLEMENTATION](TERRAIN_V2_IMPLEMENTATION.md). Save thật được giữ, chỉ thao tác fixture QA.

Phần dưới là bằng chứng **trước sửa**, không dùng số hiệu năng hoặc điều khiển xoay cũ làm mô tả bản mới.

## Google Auth ngày 18/09/2026

Bổ sung ghép app chính: [HOST_INTEGRATION](HOST_INTEGRATION.md). Typecheck đạt, production build/PWA đạt, 14/14 catalog + 20/20 host-save/online/Google. Chrome xác nhận ảnh/menu, mở game và reload đúng vườn. Chưa nghiệm thu mobile thật hoặc OAuth; các thao tác tự động trong màn 3D gặp timeout CDP. Dữ liệu sân thử cũ không bị thay đổi.

- TypeScript và production build đạt; 5 bài Google + 12 bài online = **17/17** đạt. Kiểm provider chưa bật không gọi OAuth, redirect chỉ origin/path, scopes identity, không phản chiếu lỗi ngoài.
- Chrome đã hiển thị nút Google chính, email thu gọn. Chưa kiểm callback Google thật; provider còn chưa bật trong khi hoàn tất onboarding Google Cloud. [Trạng thái cấu hình](ACCOUNT_SYNC.md).

## Kiểm lại ngày 18/09/2026

Baseline `bc020ce`: 64/64 test, 7/7 file đạt (156,74 giây); typecheck module/host và production build đạt. Build JS 1.261,70 kB / 364,95 kB gzip, còn cảnh báo chunk >500 kB. Trình duyệt dùng QA riêng, xem Home 1/25, khu cao và hồ; không thấy warning/error lúc kiểm, không tác động save thật.

Kiểm bổ sung xác nhận địa hình cao lặp theo biên khu 16 × 16, bờ nước thiếu chuyển tiếp, sáu họ map dùng chung cấu trúc chính và lỗi đặt đồ trên bờ sông chưa tiếp cận. Bộ test đang đạt chưa bao phủ các điều kiện này. Chi tiết, cách tái hiện, ảnh thật và đề xuất 2.5D ở [REVIEW_2026-09-18](REVIEW_2026-09-18.md). Không thay gameplay trong lượt review.

Phần dưới giữ nguyên bằng chứng của lần triển khai trước, không coi là kết quả mới của ngày 18/09.

---

17/09/2026, kiểm trên module thật. Fixture chỉ dùng DB QA riêng, không đụng vườn của Đại ca.

## Tự động

Typecheck module/host và production build đạt. Bộ test gồm regression v1, engine v2, persistence, raw migration, model, thế giới, hoạt động và chơi solo. Kết quả cuối ghi tại cuối tài liệu sau chạy lại.

**Lần chạy cuối: 64/64 test, 7/7 file đạt**, 77,40 giây. Typecheck module/host đạt; build 0.2 đạt, JS 1.262 MB / 365 kB gzip, CSS 15,24 kB / 4,01 kB gzip và font 13,10 kB. Cảnh báo chunk >500 kB vẫn còn.

- 6.000 seed: kích thước, giá trị terrain, vùng sạch/bờ cảng và đủ sáu họ. 120 seed kiểm hai bờ cầu khô và đủ 36 khu tiếp cận sau xây cầu.
- Batch nguyên tử, ô lặp/thiếu hạt/revision cũ, receipt qua reload, kho đầy, reserve, move/undo giữ job, hủy lịch/hàng đợi hoàn phí.
- Đồng hồ lùi, nâng bốn ngày sau bảy ngày vắng, mẻ→nâng→mẻ chờ, không nhận lặp, phiếu sau deadline không bị tiêu.
- Mở đồng thời, cửa sổ stale không ghi đè, quota không đổi UI, import/revision, dữ liệu hỏng/tương lai không reset, raw v1 giữ nguyên sau nhiều lần lưu, XP mẻ cũ và quyền recipe kế thừa.
- Ống tưới kiểm đường chảy/thưởng kỳ; nghề đòi tự sản xuất; dự án nhận decor một lần.
- Model hữu hạn/clone hoạt ảnh độc lập; 12 cây × năm giai đoạn, sáu mốc nhà. Không thay kiểm thẩm mỹ.

## Chơi solo

`tests/progression-playthrough.check.ts`: **3 biome × lịch 5/15/30 phút/ngày**, dùng lệnh thật, không gán tiền/hàng/cấp sau tạo mới, không giao dịch người chơi hay dùng phiếu. Lên Home 25; một lượt còn tự làm và nhận đủ 25 chương. Validate snapshot mỗi mốc.

Mỗi lệnh hai giây; hết phiên chuyển ngày, thu batch và dùng hàng đợi hữu hạn. Tám luống, nâng từng nhà tuần tự, tự gom/craft vật liệu, kiếm xu từ cây. Chưa mô phỏng tối ưu nhiều thợ, nhiều phiên/ngày hoặc hành vi thật. [Dữ liệu](solo-progression-v2.json), [phân tích](ECONOMY_VERIFICATION.md).

## Trình duyệt

- Quét thu sáu luống quà: 17 hàng; quét gieo tám ô lúa mì: trừ 24 xu; công cụ giữ nguyên.
- Chọn trên mesh đã gộp vẫn đúng nhà; xoay camera, xoay nhà/xác nhận, chuyển vị trí mới, hoàn tác thành công, tiền/kho giữ nguyên.
- Nút cạnh vật và toast nằm trên thanh công cụ/dock. Năm menu riêng. Mobile panel dưới bản đồ, đóng bảng hiện đủ công cụ.
- QA Home 25: 29 nhà, 120 luống, 12 giống, 36 khu. Minimap cùng terrain nước/cao độ/cầu.
- Hai cửa sổ chung DB báo conflict đúng; QA mobile tách DB để thử song song. Các lỗi HMR trong lúc ghi nguồn được kiểm lại bằng tải bản ổn định, không đồng nhất với lỗi release.
- Bản production đã được phục vụ riêng tại cổng 4329 và mở bằng trình duyệt: khởi tạo Home 1, đầy đủ menu/cảnh, không có debug/QA, log lỗi rỗng. Bundle được kiểm không chứa mã DB/nút QA. Dev server chờ ghi file ổn định 150 ms để tránh HMR đọc file đang ghi dở trên Windows.
- Sau sửa guard điểm thả, click thu hoạch qua canvas vẫn thành công. Thả trên UI overlay hủy nét thay vì commit qua thanh công cụ.

Ảnh thật: [Home 1](screenshots/home-1.png), [Home 25](screenshots/home-25.png), [bản đồ](screenshots/world-map.png), [mobile](screenshots/mobile-390.png). [Concept v2](farm-world-concept-v2.png) không phải screenshot.

## Hiệu năng và giới hạn

Windows, browser nhúng Codex, desktop 1280 × 720. CPU môi trường báo `Intel64 Family 6 Model 140 Stepping 2`; truy vấn GPU bị từ chối, không gán số đo cho GPU cụ thể. Bộ đo hiển thị trong QA, lấy mẫu ba giây sau dựng model.

- Home 25, một cửa sổ/ánh sáng mềm: **60 FPS, p95 17 ms, 107 calls, khoảng 402 nghìn tam giác** tại góc đo. Khi đổi góc/di chuyển có mẫu 57 FPS, p95 19 ms.
- Trước tối ưu: khoảng 342 calls/609 nghìn tam giác. Instancing/gộp công trình và bỏ bevel thừa giảm tải. Góc/cửa sổ khác nhau nên đây không là benchmark kiểm soát tuyệt đối.
- Khung mobile 390 × 844 trên cùng máy, trước tối ưu cuối, nhiều cửa sổ cùng vẽ: mẫu 38 FPS, p95 29 ms. **Không phải hiệu năng điện thoại thật.**
- Sau tối ưu cuối, khung mobile cùng desktop đang mở: mẫu 48 FPS, p95 24 ms, 107 calls, khoảng 401 nghìn tam giác. Ảnh mobile đã lưu ứng với lần kiểm này.
- Có đồ họa nhẹ (không bóng, DPR 1), giảm chuyển động/demand rendering, mobile mặc định nhẹ.

Chưa thử cảm ứng hai ngón/GPU điện thoại thật, chưa chạy nhiều giờ liên tục, chưa có người chơi nhiều ngày. Chưa chứng nhận toàn bộ E. Build còn cảnh báo bundle Three/React lớn; cần đo cold start trên thiết bị/mạng mục tiêu.

## Phạm vi

Chỉ đổi `modules/farm/`, giữ `.claude/settings.local.json` có trước. Không commit/push/deploy hoặc mở server public. Không đổi host/account/online.
