**Tài khoản 18/09:** Đại ca đã cho phép dùng Supabase hiện tại. Đọc [ACCOUNT_SYNC](ACCOUNT_SYNC.md) trước các hạn chế Auth cũ. Mã đăng nhập/cache/outbox/conflict đã có; migration đã chạy qua Chrome và 16/16 kiểm tra DB thật đạt, redirect local đã thêm. Custom SMTP/email thật còn cần cấu hình và nghiệm thu.

**Google 18/09:** nút đăng nhập Google và xử lý PKCE/lỗi đã có, 17/17 bài Google + online đạt. Đã tạo project Google **Lang Mam** theo xác nhận của Đại ca; OAuth đang chờ đồng ý chính sách dữ liệu ở onboarding, chưa có client/provider hoạt động. Đọc [ACCOUNT_SYNC](ACCOUNT_SYNC.md) để tiếp tục đúng bước, không tạo project trùng.

**Ghép app chính 18/09:** Đại ca đã yêu cầu tích hợp. Đọc [HOST_INTEGRATION](HOST_INTEGRATION.md) trước các hạn chế độc lập cũ: Games → Làng Mầm, ảnh imagegen riêng, route `/games/farm`, guest save theo hồ sơ và vẫn giữ sân thử 4328. Google OAuth còn chờ bước chính sách.

# Làng Mầm — đọc từ đây để tiếp tục công việc

**Rà soát cuối 18/09:** [bờ nước và polish](FINAL_POLISH_2026-09-18.md): bờ thấp vát xuống mặt nước, dải cát/nước nông theo khoảng cách, normals mềm, gợn không lặp lưới. Sửa thanh QA che dock điện thoại và focus các túi kho. Không đổi save/logic địa hình.

**Xây dựng 18/09:** [giá và hạn mức](CONSTRUCTION_COSTS.md): công trình chức năng cần xu + vật liệu; tối đa 1 mỗi loại kể cả đang xây, menu hiện 0/1–1/1. Trang trí vẫn chỉ dùng xu. Giữ hóa đơn/job/save cũ; đọc tài liệu này trước các mô tả xây chỉ bằng tiền cũ.

**Kho gọn 18/09:** danh sách chỉ hình + tên + số lượng đang có; bấm vật phẩm mới mở số lượng/nút bán và giữ lại. Túi hỗ trợ, trang trí đã cất, sổ sản phẩm thu gọn mặc định. Component `ui/Inventory.tsx`; giữ nguyên engine bán/ghim và save.

**Nhịp chim cảnh 18/09:** `SceneLife.tsx` cho đàn chim bay vào, lượn rồi bay khỏi map trong 26–32 giây; nghỉ ngẫu nhiên 80–140 giây giữa hai lượt. Lần đầu chờ 15 giây. Giảm chuyển động thì ẩn chim; không giữ chim đứng im trên map.

**Mới nhất, 24 giống cây 18/09:** đã tăng gấp đôi bộ giống; nghệ tây dài nhất 24 giờ, mở ở Home 25. Mỗi giống mới có model, thumbnail và icon riêng. Bản lưu content 2 được chuyển sang 3, giữ tiến trình. Đọc [CROPS_24](CROPS_24.md) trước các ghi chép 12 giống bên dưới.

**Quyết định UI mới nhất 18/09:** Đại ca yêu cầu gọn như game. Chi phí nâng cấp chỉ có icon từng tài nguyên + số có/số cần, đủ xanh/thiếu đỏ; bỏ bảng và chữ giải thích. Menu chọn cây/đá/quặng phải gọi đúng tên variant. Đã triển khai; xem bằng chứng mới nhất trong [VERIFICATION](VERIFICATION.md).

**Mới nhất, hòa trộn cảnh 18/09:** [foliage blending](foliage-blending-2026-09-18.md): mép sprite giữ alpha, bóng tiếp đất mềm, ảnh bạch dương v2. Không đổi bố trí/save; đây là bản sửa sau menu ảnh.

**Bổ sung menu ảnh 18/09:** xây dựng/trang trí có thumbnail đúng model và cấp; 12 giống có ảnh trưởng thành. Gieo và đổi giống dùng popup ảnh. Chi tiết trong [CONTEXTUAL_PLAY_AND_ROADS](CONTEXTUAL_PLAY_AND_ROADS.md), bằng chứng mới nhất trong [VERIFICATION](VERIFICATION.md).

**Cập nhật mới nhất 18/09:** đọc [CONTEXTUAL_PLAY_AND_ROADS](CONTEXTUAL_PLAY_AND_ROADS.md). Đã bỏ sidebar/toolbar cố định, thêm menu tại vật thể, cửa sổ có tranh, kéo liềm và hàng bay về kho sau lưu thành công, texture đất, chim ảnh và đường tự nối 16 hướng. Mô tả bảng bên/toolbar phía dưới là lịch sử, không phải UI hiện tại.

**Mới nhất, sau phản hồi mỹ thuật 18/09:** đọc [ARCHITECTURE_AND_EXPLORATION](ARCHITECTURE_AND_EXPLORATION.md). Đã thay kiến trúc xưởng chung, tách khởi đầu/trưng bày, tăng tỷ lệ nhìn, thêm nền phân vùng, cây thấp và sương theo đất đã mở. 75 test đạt; không coi mỹ thuật/mobile đã nghiệm thu chỉ vì test qua.

**Bàn giao địa hình v2 ngày 18/09/2026.** Module có gameplay Home 1–25, camera cố định pan/zoom và cảnh 2.5D. Đọc [TERRAIN_V2_IMPLEMENTATION](TERRAIN_V2_IMPLEMENTATION.md) trước phần lịch sử bên dưới.

**Đã triển khai sau review:** thung lũng hồ/sông/rừng và một cao nguyên có lối lên; bỏ đồi lặp theo chunk; 7 mẫu cây + 7 mẫu đá/quặng tạo bằng imagegen. Đã chặn xây/khai phá trên bờ chưa tiếp cận, giữ nguyên save cũ. [REVIEW_2026-09-18](REVIEW_2026-09-18.md) là bằng chứng baseline trước sửa.

**Tham chiếu Đại ca chỉ định:** [phân tích map Family Island](TERRAIN_REFERENCE_FAMILY_ISLAND.md). Đã dựng một mẫu thung lũng với biến thiên seed có giới hạn; chưa hoàn thành sáu bố cục địa hình riêng. Không sao chép tài nguyên của game tham chiếu.

Xưng **em**, gọi người dùng là **Đại ca**. Lượt này đã triển khai gameplay theo yêu cầu Đại ca. Giữ module độc lập, bảo toàn save; chưa làm account/online hoặc ghép hệ thống chính.

## 1. Đọc theo thứ tự này

Ở phiên tiếp tục mới, đọc toàn bộ các tệp dưới đây, không chỉ tiêu đề hoặc bản tóm tắt. Tài liệu dài nên đọc từng phần để tránh tool cắt mất nội dung. Nếu gặp đầu ra bị truncate thì đọc nốt phần thiếu trước khi kết luận. Không cần mở lại mọi trang nguồn trên web chỉ để tiếp nhận bàn giao; kiểm chứng nguồn hiện hành khi chuẩn bị dùng thông tin có thể thay đổi.

| Thứ tự | Tài liệu | Vai trò và mức ưu tiên |
|---|---|---|
| 1 | **README.md — tệp đang đọc** | Điểm vào, các quyết định đã chốt, phân biệt kế hoạch/code, cách tiếp tục |
| 1.0000 | [FINAL_POLISH_2026-09-18.md](FINAL_POLISH_2026-09-18.md) | Mới nhất: bờ nước, normals, mobile dock và phạm vi kiểm chứng |
| 1.000 | [CONSTRUCTION_COSTS.md](CONSTRUCTION_COSTS.md) | Giá vật liệu xây mới, hạn mức chức năng, UI và không áp giá hồi tố |
| 1.00 | [CROPS_24.md](CROPS_24.md) | Bộ 24 giống, thời gian tối đa 24 giờ, hình ảnh và chuyển bản lưu |
| 1.0 | [foliage-blending-2026-09-18.md](foliage-blending-2026-09-18.md) | Mới nhất: alpha mép cây, bóng tiếp đất và bạch dương v2 |
| 1.1 | [CONTEXTUAL_PLAY_AND_ROADS.md](CONTEXTUAL_PLAY_AND_ROADS.md) | Mới nhất: tương tác tại vật thể, game window, thu hoạch, texture, chim và đường tự nối |
| 1a | [ARCHITECTURE_AND_EXPLORATION.md](ARCHITECTURE_AND_EXPLORATION.md) | Mới nhất: kiến trúc, kích thước nhìn, phân vùng nền, sương, QA và kiểm chứng |
| 1a.0 | [TERRAIN_V2_IMPLEMENTATION.md](TERRAIN_V2_IMPLEMENTATION.md) | Nền địa hình v2 trước đợt kiến trúc/sương |
| 1a.1 | [REVIEW_2026-09-18.md](REVIEW_2026-09-18.md) | Lịch sử vấn đề địa hình/tiếp cận trước sửa |
| 1b | [TERRAIN_REFERENCE_FAMILY_ISLAND.md](TERRAIN_REFERENCE_FAMILY_ISLAND.md) | Tham chiếu mới do Đại ca chỉ định; bố cục cảnh quan và cách khai phá cho bản đồ mẫu |
| 2 | [REVAMP_PLAN.md](REVAMP_PLAN.md) | **Thiết kế hiện hành**, đầy đủ yêu cầu nâng cấp, thế giới, generator, kinh tế, UI, dữ liệu và nghiệm thu |
| 3 | [progression-draft.json](progression-draft.json) | Bảng thiết kế Home 1–25, 28 nhà phụ, điều kiện cấp, timer, ruộng, đội thợ và quy mô thế giới; Home đã được game import; cân bằng vẫn cần chơi thử |
| 4 | [CURRENT_STATE.md](CURRENT_STATE.md) | Bản 0.2 thực sự có gì, cách chạy, ranh giới module, kiến trúc và việc server còn thiếu |
| 5 | [VERIFICATION.md](VERIFICATION.md) | Kết quả engine/migration/world/model/solo và trình duyệt 0.2; giới hạn phép đo |
| 6 | [farm-research-and-design.md](farm-research-and-design.md) | Nghiên cứu ban đầu, nguồn thị trường, vòng chơi và ý tưởng; phần tiến trình/đối tượng/lịch triển khai đã được cập nhật ở REVAMP_PLAN |
| 7 | [farm-economy-and-engagement.md](farm-economy-and-engagement.md) | Tham khảo sâu về dòng tiền, nghề, hợp đồng, bán/đổi, giữ hàng, giao dịch và phiên offline |
| 8 | [farm-online-supabase-plan.md](farm-online-supabase-plan.md) | Phương án tương lai cho Auth/cloud save/thăm trại; không phải backend đã triển khai hoặc lệnh làm server ngay |
| 9 | [farm-3d-art-production-plan.md](farm-3d-art-production-plan.md) | Quy trình concept → model → tích hợp → đo, nhận diện, footprint, cây/vật nuôi/decor; định mức cũ phải cập nhật theo 25 cấp |
| 10 | [farm-3d-art-prompts.md](farm-3d-art-prompts.md) và [ảnh concept](farm-3d-concept-v1.png) | Prompt/nguồn ảnh và tham chiếu hình ảnh. Xem ảnh trực tiếp khi làm mỹ thuật; ảnh raster không phải model 3D |

**Quy tắc khi tài liệu khác nhau:** chỉ dẫn mới của Đại ca trong phiên hiện tại → các quyết định đã chốt ở đây và REVAMP_PLAN → số liệu dự thảo trong JSON → tài liệu nghiên cứu cũ. Code là bằng chứng của hành vi hiện tại, không có nghĩa hành vi cũ là thiết kế cần giữ mãi. Nếu bảng và JSON lệch nhau thì đối chiếu yêu cầu đã chốt, sửa đồng thời và ghi rõ; không tự coi số trong JSON là số đã cân bằng.

## 2. Yêu cầu đã chốt của Đại ca

### Sản phẩm và ranh giới

- Xây game nông trại có chiều sâu, người lớn cũng chơi được; không giới hạn thành trò cho trẻ tiểu học.
- Người chơi là chủ trại; kiếm tiền từ sản xuất/hoạt động để mua giống, xây/nâng, mở đất và tùy biến trang trại.
- Chơi chủ động và tiến trình hữu hạn khi đóng game; không phải để tab mở. Cây/vật nuôi không bị mất vì người chơi nghỉ.
- Cảnh **2.5D, camera cố định** theo chỉ dẫn mới: địa hình có cao độ thật, cây/đá dùng sprite; công trình hiện vẫn là 3D. Object tĩnh một góc ảnh, object xoay được phải đủ bốn góc nếu dùng sprite. Ưu tiên đa dạng silhouette, không chỉ đổi màu.
- Phát triển độc lập trong `modules/farm`; **chưa ghép route/menu/profile vào Genius Kids**. Login và server làm sau khi module chính đủ tốt. Chưa tự cài hoặc thay dependency của ứng dụng chính.
- Tương lai có tài khoản, Supabase, lưu online, thăm trang trại, bán hàng lấy xu và đổi vật phẩm. **Mọi thao tác trading cần online; không xếp lệnh trading offline.** Đường tiếp nhận tài sản local vào kinh tế online còn phải thiết kế, không tự reset hoặc tự tin tiền client.

### Toàn bộ yêu cầu nâng cấp giao diện và tiến trình

1. Thông báo hiện đè toolbar; sửa vùng thông báo theo bố cục thực tế.
2. Chọn thao tác một lần rồi làm trên nhiều ô ruộng, hỗ trợ chạm liên tiếp/quét.
3. Chọn chuyển vị trí rồi kéo thả; nút xoay hiện cạnh vật thể.
4. Có **Home** ban đầu làm công trình trung tâm, nâng để mở cây/tính năng/vật nuôi.
5. Xây/nâng có thời gian, tăng theo cấp; các cấp cuối **có thể kéo dài vài ngày**.
6. **Đã thay bằng chỉ dẫn mới 18/09:** khóa góc nhìn bản đồ, cho pan/zoom; giữ xoay công trình.
7. Công trình có nhiều cấp, **tối đa 25**; hover tên/cấp, mobile có cách xem tương đương.
8. Home mở quyền xây thêm thửa ruộng.
9. Chính tuyến xoay quanh phát triển trại và nâng Home.
10. Ràng buộc chéo: ví dụ Home 3 cần cối xay 2; không tạo vòng bất khả thi.
11. Công trình bị giới hạn bởi cấp Home đã hoàn thành.
12. Menu: **Xây dựng, Cửa hàng, Kho hàng, Nhiệm vụ, Đơn hàng**; nhiệm vụ có chính tuyến và thành tựu.
13. Thưởng đa dạng, gồm tăng tốc **5 phút, 10 phút, 30 phút, 1 giờ**.
14. Thêm gỗ, đá, sắt và chuỗi tài nguyên/vật liệu.
15. Mỗi map có thế mạnh tài nguyên khác nhau để thúc đẩy trao đổi.
16. Cửa hàng hệ thống bán tài nguyên với giá cao hoặc tồn giới hạn.
17. Tổng thể phải đủ sâu và chi tiết cho chơi lâu dài, không chỉ thêm timer vào bản thử.

### Những bổ sung mới nhất về bản đồ

- **Phát map ngẫu nhiên hoàn toàn cho người chơi**, không cho chọn một trong ba vùng. Điều này nói về cách cấp map; thuật toán được phép dùng họ mẫu/seed.
- Map rộng hơn nhiều, nhìn thấy các vùng xa còn cây/đá/núi. Mở dần bằng khai phá, dụng cụ hoặc xu; phá vật cản thu tài nguyên tương ứng.
- Địa hình có **hồ đặt cầu cảng và đánh cá, sông/suối, vách đá**, thêm cao độ/đường nối để sinh động.
- Đại ca nêu hai khả năng: engine sinh tự động hoặc một tập các loại địa hình cố định. **Em đề xuất hướng kết hợp mẫu đã kiểm duyệt + seed + validator** trong REVAMP_PLAN 5.6; đây là phương án kỹ thuật đề xuất, generator v1 đã được code và kiểm seed; các thông số cân bằng còn cần chơi thử.

## 3. Số đề xuất, chưa được coi là cân bằng đã duyệt

REVAMP_PLAN và JSON đang thử: Home 1–25, 8 → 120 ruộng, 1 → 4 đội thợ, thời gian Home 2 là 2 phút và Home 25 là 96 giờ; thế giới 96 × 96 ô, khu 16 × 16, bốn khu sở hữu ban đầu, khoảng 24 × 24 đã dọn; sáu họ địa hình, ba nhóm thế mạnh tài nguyên; 28 loại nhà phụ gồm cầu cảng; sáu bậc ngoại hình 1/5/10/15/20/25.

Giới hạn 25 và nhịp cuối game nhiều ngày là yêu cầu đã chốt. Các con số diện tích, timer từng cấp, số nhà, số thợ, giá/sản lượng/tồn chợ và mốc mở chi tiết vẫn cần mô phỏng/chơi thử. Không tạo 25 cấp hình thức bằng cách nhân giá/thời gian mà không có lợi ích gameplay.

## 4. Những đề xuất cũ đã được thay thế

| Nội dung có thể gặp trong tài liệu cũ | Hướng hiện hành |
|---|---|
| Đối tượng mặc định trẻ 6–12 tuổi | Game đủ sâu cho cả người lớn; giao diện vẫn dễ hiểu |
| Khung 30 cấp theo XP, bản đầu 1–15 | Home làm trục 1–25; XP phục vụ danh tiếng/chuyên môn |
| Nhà 3–5 cấp, ngoại hình mốc 1/3/5 | Trần 25; sáu bậc ngoại hình lớn theo thiết kế mới |
| Tài khoản/cloud/thăm vườn trong bản đầu | Làm module chính trước; online là đợt F sau này |
| Gửi snapshot local là đủ đồng bộ kinh tế | Kinh tế giao dịch phải được server xác thực; không ghi đè tiền/kho bằng JSON client |
| Chuyển toàn bộ tiến trình khách lên chợ nguyên trạng | Chính sách chuyển còn mở; giữ bản local, không tự cấp quyền giao dịch |
| Bối cảnh 2D/isometric hoặc chưa có cảnh thử | Đã có bản thử 3D bằng React Three Fiber; asset vẫn là bản dựng thử |
| Cảnh A0 cần bắt đầu từ số không | Đã có mô hình và vòng chơi nhỏ; cải thiện trên nền hiện có, theo đợt A–F của REVAMP_PLAN |
| Hai lần mở đất đơn giản, tối đa 32 luống trong code | Đây là giới hạn bản thử; mục tiêu mới là thế giới chia khu, khai phá, địa hình và giới hạn theo Home |

Giữ tài liệu cũ để hiểu nghiên cứu, phương án và các phân tích chuyên sâu; các thông báo cập nhật ở đầu mỗi tệp đánh dấu ranh giới này.

## 5. Trạng thái code khi bàn giao

**0.2 đã triển khai:** năm menu/công cụ quét nguyên tử, Home 1–25, 28 nhà phụ, jobs/đội thợ/phiếu, migration nguyên gốc, 12 cây, chuỗi vật liệu/sản phẩm, sáu họ map/ba biome/36 khu, nước/cao độ/dốc/cầu/cảng, khai phá, chợ NPC hữu hạn, hàng đợi/kho/dự trữ, 25 chương, thành tựu/hợp đồng, ba nghề, dự án decor, hai mini game, bộ model/cảnh sống, tối ưu instancing và gộp mesh.

**Nghiệm thu còn mở:** điện thoại thật/two-touch, chơi dài với người thật, duyệt nhận diện mỹ thuật từng nghề. Không gọi là đã cân bằng hoặc phát hành hoàn chỉnh chỉ vì test pass. Account, Auth, cloud, thăm vườn/chợ người chơi và tích hợp host chưa làm theo thứ tự Đại ca chốt.

Chi tiết kiến trúc, gameplay, save và sân thử ở [CURRENT_STATE](CURRENT_STATE.md). Bằng chứng và giới hạn ở [VERIFICATION](VERIFICATION.md), số liệu nhịp solo ở [ECONOMY_VERIFICATION](ECONOMY_VERIFICATION.md).

Concept mới và giới hạn của kit asset: [ART_V2](ART_V2.md). Ảnh nghiệm thu thật nằm trong `screenshots/`; không nhầm concept với hình chụp game.

## 6. Chạy lại trên máy ở nhà

Mở terminal tại **gốc repository**, có Node và các dependency từ `package-lock.json` của repo. Module dùng `node_modules` của repo cha; không phải dự án npm tách biệt có lockfile riêng. Nếu máy mới chưa có dependency thì khôi phục theo lockfile/quy trình repo; không tự nâng phiên bản để tiếp nhận bàn giao.

```powershell
node node_modules/vite/bin/vite.js --config modules/farm/vite.config.ts --configLoader runner
```

Mở **http://127.0.0.1:4328/**. Cổng cố định, nếu đã dùng thì báo lỗi; không tự đổi cổng, không lấy 3000 của ứng dụng chính. Không cần Supabase hoặc `.env` online để chạy module.

Các lệnh kiểm tra, chạy riêng từng lệnh:

```powershell
node node_modules/typescript/bin/tsc -p modules/farm/tsconfig.json
node node_modules/vitest/vitest.mjs run --config modules/farm/vitest.config.ts --configLoader runner
node node_modules/vite/bin/vite.js build --config modules/farm/vite.config.ts --configLoader runner
```

Giữ `--configLoader runner`: ở máy công ty, config loader mặc định từng lỗi quyền ghi `.vite-temp` trong dependency chung. Cấu hình runner dùng đường riêng của module. `.build`, `.vite-cache`, `reports` là đầu ra/cache bị ignore, không phải mã nguồn cần mang đi. TypeScript của host có thể quét module do include rộng, nên vẫn giữ tương thích typecheck.

Kiểm chứng 0.2: xem VERIFICATION và kết quả mô phỏng đã lưu; không dùng kết quả 34 test của 0.1 làm bằng chứng cho code mới.

## 7. Mang công việc và tiến trình sang máy khác

Thay đổi lượt này chưa commit/push. Chỉ làm trong modules/farm; giữ nguyên thay đổi sẵn có ngoài module, gồm .claude/settings.local.json. Xem git status thực tế khi chuyển máy, không dùng HEAD lịch sử trong tài liệu cũ.

- Mang **toàn bộ `modules/farm/`**, gồm code, config, fonts/giấy phép, docs và ảnh concept; chỉ mang docs thì model hiểu kế hoạch nhưng không có code bản thử để tiếp tục.
- Có thể chuyển bằng Git hoặc sao chép thư mục vào cùng repo ở nhà; việc commit/push chưa được thực hiện trong lượt này. `git pull` đơn thuần sẽ không mang các tệp chưa commit ở công ty sang.
- Nếu sao chép trực tiếp, không cần `.build/.vite-cache/reports`; vẫn cần dependency của repo cha. Không phụ thuộc đường tuyệt đối `D:\Quyetnm\Dev\mathgenius-kids` trên máy ở nhà: các link nội bộ trong bộ docs dùng đường tương đối.
- Tiến trình chơi nằm trong **IndexedDB của trình duyệt trên máy công ty**, DB `lang-mam-independent-lab-v1`, origin `http://127.0.0.1:4328`; không nằm trong Git hay thư mục module. Nếu muốn mang vườn đang chơi, dùng Cài đặt → xuất bản sao JSON, mang file đó về, rồi nhập bằng giao diện ở nhà. Không giả định localhost và 127.0.0.1 dùng chung save.
- Không có bản save của Đại ca được xuất kèm bộ tài liệu này. Không tự đọc/ghi tiến trình bằng chỉnh DB, reset vườn hoặc nhập bản thử vào vườn thật để kiểm.
- Ảnh concept gốc đã có bản cục bộ trong thư mục docs; không cần file temp hoặc thư mục imagegen của máy công ty. Phiên dev server/tab/ID công cụ ở công ty không tiếp tục được ở máy mới; khởi động phiên mới bằng lệnh trên.

## 8. Điểm tiếp tục công việc

Không bắt đầu lại A từ số không. Kiểm lại bản 0.2 bằng sân thử riêng. Ưu tiên các phần nghiệm thu E còn thiếu: cảm ứng/GPU trên điện thoại thật, chơi nhiều ngày để cân bằng, duyệt model từng nghề. Test solo là chiến lược tuần tự bảo thủ, không là dự đoán retention.

Đợt địa hình v2 đã xử lý camera cố định, bờ nước, đồi lặp, phân bố tài nguyên và chặn thao tác vượt bờ chưa có cầu. Phần còn lại: duyệt mỹ thuật với Đại ca, mở rộng bố cục mẫu, tối ưu texture/điện thoại, bộ công trình sprite bốn hướng nếu chuyển khỏi 3D. Xem TERRAIN_V2_IMPLEMENTATION.

Giữ bản gốc v1 và giao kèo job khi thay catalog/schema; không reset vườn thật để thử. Cập nhật CURRENT_STATE/VERIFICATION sau mỗi thay đổi. Không bắt đầu F hoặc tích hợp Genius Kids khi chưa hoàn thành chất lượng module và có chỉ dẫn phù hợp từ Đại ca.

Prompt tiếp tục: “Đọc đầy đủ bộ docs farm và trạng thái 0.2, kiểm code/bằng chứng hiện tại, tiếp tục các mục nghiệm thu còn mở. Giữ module độc lập và save của tao; chưa làm login/server/ghép host. Xưng em, gọi tao là đại ca.”

## 9. Bản đồ vị trí tài liệu sau khi gom

Năm file `docs/farm-*.md` và ảnh `docs/farm-3d-concept-v1.png` cũ đã chuyển vào **thư mục này**, giữ tên và nội dung tham khảo. `modules/farm/VERIFICATION.md` chuyển thành `docs/VERIFICATION.md`; nội dung README module cũ chuyển thành `docs/CURRENT_STATE.md`. README ở gốc module và AGENTS chỉ làm điểm dẫn vào đây. REVAMP_PLAN và progression-draft vẫn ở cùng folder như trước.

Không giữ hai bản thiết kế đang hoạt động ở hai chỗ. Link giữa các tài liệu và ảnh nằm trong cùng thư mục. Các nguồn thị trường ngoài web là tài liệu tham khảo tại thời điểm nghiên cứu, không có lời hứa luôn cập nhật.
