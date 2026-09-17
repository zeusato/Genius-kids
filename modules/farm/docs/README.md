# Làng Mầm — đọc từ đây để tiếp tục công việc

**Bàn giao triển khai 0.2 ngày 17/09/2026.** Module đã có gameplay Home 1–25. Đọc trạng thái và kiểm chứng bên dưới để phân biệt chức năng đã chạy với nghiệm thu chất lượng còn lại.

Xưng **em**, gọi người dùng là **Đại ca**. Lượt này đã triển khai gameplay theo yêu cầu Đại ca. Giữ module độc lập, bảo toàn save; chưa làm account/online hoặc ghép hệ thống chính.

## 1. Đọc theo thứ tự này

Ở phiên tiếp tục mới, đọc toàn bộ các tệp dưới đây, không chỉ tiêu đề hoặc bản tóm tắt. Tài liệu dài nên đọc từng phần để tránh tool cắt mất nội dung. Nếu gặp đầu ra bị truncate thì đọc nốt phần thiếu trước khi kết luận. Không cần mở lại mọi trang nguồn trên web chỉ để tiếp nhận bàn giao; kiểm chứng nguồn hiện hành khi chuẩn bị dùng thông tin có thể thay đổi.

| Thứ tự | Tài liệu | Vai trò và mức ưu tiên |
|---|---|---|
| 1 | **README.md — tệp đang đọc** | Điểm vào, các quyết định đã chốt, phân biệt kế hoạch/code, cách tiếp tục |
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
- Thế giới **3D thật**, công trình/cây từng giai đoạn/decor có hình dáng khác nhau, ưu tiên đồ họa và trải nghiệm. Dùng imagegen khi cần concept/ảnh tham chiếu, không nhầm ảnh với mesh.
- Phát triển độc lập trong `modules/farm`; **chưa ghép route/menu/profile vào Genius Kids**. Login và server làm sau khi module chính đủ tốt. Chưa tự cài hoặc thay dependency của ứng dụng chính.
- Tương lai có tài khoản, Supabase, lưu online, thăm trang trại, bán hàng lấy xu và đổi vật phẩm. **Mọi thao tác trading cần online; không xếp lệnh trading offline.** Đường tiếp nhận tài sản local vào kinh tế online còn phải thiết kế, không tự reset hoặc tự tin tiền client.

### Toàn bộ yêu cầu nâng cấp giao diện và tiến trình

1. Thông báo hiện đè toolbar; sửa vùng thông báo theo bố cục thực tế.
2. Chọn thao tác một lần rồi làm trên nhiều ô ruộng, hỗ trợ chạm liên tiếp/quét.
3. Chọn chuyển vị trí rồi kéo thả; nút xoay hiện cạnh vật thể.
4. Có **Home** ban đầu làm công trình trung tâm, nâng để mở cây/tính năng/vật nuôi.
5. Xây/nâng có thời gian, tăng theo cấp; các cấp cuối **có thể kéo dài vài ngày**.
6. Cho phép xoay bản đồ.
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

Giữ bản gốc v1 và giao kèo job khi thay catalog/schema; không reset vườn thật để thử. Cập nhật CURRENT_STATE/VERIFICATION sau mỗi thay đổi. Không bắt đầu F hoặc tích hợp Genius Kids khi chưa hoàn thành chất lượng module và có chỉ dẫn phù hợp từ Đại ca.

Prompt tiếp tục: “Đọc đầy đủ bộ docs farm và trạng thái 0.2, kiểm code/bằng chứng hiện tại, tiếp tục các mục nghiệm thu còn mở. Giữ module độc lập và save của tao; chưa làm login/server/ghép host. Xưng em, gọi tao là đại ca.”

## 9. Bản đồ vị trí tài liệu sau khi gom

Năm file `docs/farm-*.md` và ảnh `docs/farm-3d-concept-v1.png` cũ đã chuyển vào **thư mục này**, giữ tên và nội dung tham khảo. `modules/farm/VERIFICATION.md` chuyển thành `docs/VERIFICATION.md`; nội dung README module cũ chuyển thành `docs/CURRENT_STATE.md`. README ở gốc module và AGENTS chỉ làm điểm dẫn vào đây. REVAMP_PLAN và progression-draft vẫn ở cùng folder như trước.

Không giữ hai bản thiết kế đang hoạt động ở hai chỗ. Link giữa các tài liệu và ảnh nằm trong cùng thư mục. Các nguồn thị trường ngoài web là tài liệu tham khảo tại thời điểm nghiên cứu, không có lời hứa luôn cập nhật.
