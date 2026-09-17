# Làng Mầm — đọc từ đây để tiếp tục công việc

**Bàn giao ngày 17/09/2026, khi Đại ca tạm dừng ở công ty để về nhà làm tiếp.** Thư mục này là nơi tập trung toàn bộ tài liệu và concept của module nông trại. Không cần lịch sử chat để biết yêu cầu, trạng thái code và bước tiếp theo.

Xưng **em**, gọi người dùng là **Đại ca**. Lượt bàn giao này chỉ tổ chức tài liệu; không triển khai gameplay, không sửa save, không commit/push, không ghép module vào ứng dụng chính.

## 1. Đọc theo thứ tự này

Ở phiên tiếp tục mới, đọc toàn bộ các tệp dưới đây, không chỉ tiêu đề hoặc bản tóm tắt. Tài liệu dài nên đọc từng phần để tránh tool cắt mất nội dung. Nếu gặp đầu ra bị truncate thì đọc nốt phần thiếu trước khi kết luận. Không cần mở lại mọi trang nguồn trên web chỉ để tiếp nhận bàn giao; kiểm chứng nguồn hiện hành khi chuẩn bị dùng thông tin có thể thay đổi.

| Thứ tự | Tài liệu | Vai trò và mức ưu tiên |
|---|---|---|
| 1 | **README.md — tệp đang đọc** | Điểm vào, các quyết định đã chốt, phân biệt kế hoạch/code, cách tiếp tục |
| 2 | [REVAMP_PLAN.md](REVAMP_PLAN.md) | **Thiết kế hiện hành**, đầy đủ yêu cầu nâng cấp, thế giới, generator, kinh tế, UI, dữ liệu và nghiệm thu |
| 3 | [progression-draft.json](progression-draft.json) | Bảng thiết kế Home 1–25, 28 nhà phụ, điều kiện cấp, timer, ruộng, đội thợ và quy mô thế giới; chưa được game import |
| 4 | [CURRENT_STATE.md](CURRENT_STATE.md) | Bản thử 0.1 thực sự có gì, cách chạy, ranh giới module, kiến trúc và việc server còn thiếu |
| 5 | [VERIFICATION.md](VERIFICATION.md) | Kết quả kiểm thử đã thực hiện trên bản thử; không phải kết quả của các tính năng mới |
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
- Đại ca nêu hai khả năng: engine sinh tự động hoặc một tập các loại địa hình cố định. **Em đề xuất hướng kết hợp mẫu đã kiểm duyệt + seed + validator** trong REVAMP_PLAN 5.6; đây là phương án kỹ thuật đề xuất, chưa có generator được code và chưa phải Đại ca đã chọn mọi thông số của nó.

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

**Đã có:** module độc lập 0.1 chạy được, React/TypeScript/Three.js; bốn cây có năm trạng thái; cối xay/lò bánh/chuồng bò, tám decor, tám luống đầu; gieo/tưới/thu/bán, công thức, nâng ba cấp tức thì, mục tiêu/thưởng và đơn NPC; pan/zoom, preview đặt/xoay, xưởng mẫu; IndexedDB riêng có revision, giữ bản trước, import/export; test và build riêng.

**Chưa có:** Home; cấp 25; nâng có thời gian; thao tác quét nhiều ô; kéo thả thực; xoay camera chơi; khắc phục toast đè dock; vật liệu gỗ/đá/sắt; hàng đợi nhiều mẻ; map lớn/ngẫu nhiên/cao độ/nước/khai phá; cầu/cảng; chính tuyến; tăng tốc; backend/Auth/cloud/chợ/thăm vườn. Các mục này mới ở kế hoạch, không được báo là đã hoàn thành.

Các chỗ phải chú ý khi bắt tay nâng cấp:

- `src/core/engine.ts`: `MAX_OFFLINE_MS` đang giới hạn tổng thời gian cộng thêm ở 24 giờ; phải thay trước khi thêm jobs nhiều ngày. Nâng cấp hiện trực tiếp tăng `level`.
- `src/core/types.ts`: schema/contentVersion 1, job gắn entity chỉ là một mẻ, economy `local-unverified`; cần migration khi thay schema.
- `src/core/catalog.ts`: cây/công thức/nhà/quest và `levelOf(xp)` đang chung một file; mở khóa hiện theo XP.
- `src/render/FarmScene.tsx`: camera chơi khóa hướng; chọn vật bằng raycast và đặt theo mặt đất phẳng. Gallery có điều khiển khác với cảnh chơi.
- `src/render/models.ts`: geometry dựng bằng code, cache và ghép mesh; không phải bộ GLB sản xuất đã được duyệt.
- `src/FarmApp.tsx`, `src/farm.css`, `src/ui/useFarm.ts`: UI, tương tác và toast; toast và dock cùng ở đáy là lỗi đã được Đại ca chỉ ra.
- `src/adapters/local.ts`: serial commands, save nguyên tử + so revision, `main/previous`, TimeProvider qua hàm giờ; giữ các đảm bảo này khi mở rộng.
- `src/core/validation.ts`: kiểm snapshot; không bỏ kiểm tra để chấp nhận schema mới tạm bợ.
- `tests/*.check.ts`: ba file, 34 ca kiểm thử của bản thử; dùng đuôi/config riêng để không bị test host tự quét theo mẫu thông thường.

Đường dẫn trong mục này tính từ `modules/farm/`. Thông tin chức năng và kiến trúc đầy đủ ở CURRENT_STATE.

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

Kiểm tra trước bàn giao ở lượt triển khai: 34/34 test, typecheck module và host, build module đạt; vẫn có cảnh báo JS chunk lớn. Chưa đo điện thoại thật/hiệu năng map lớn. Lượt tổ chức tài liệu không chạy lại gameplay test vì không đổi source/config; không ghi các kết quả cũ thành kiểm chứng mới.

## 7. Mang công việc và tiến trình sang máy khác

Tại lúc bàn giao: branch **main**, HEAD **c95e1fccc44575f52b893d90dcd829174509becc**. Đây là commit nền, **không chứa module chưa commit**. `modules/` đang untracked. Có thay đổi sẵn có ở `src/components/hub/catalog.ts` từ công việc trước và `.claude/settings.local.json` untracked; không gộp hoặc reset các tệp đó chỉ để chuyển tài liệu farm.

- Mang **toàn bộ `modules/farm/`**, gồm code, config, fonts/giấy phép, docs và ảnh concept; chỉ mang docs thì model hiểu kế hoạch nhưng không có code bản thử để tiếp tục.
- Có thể chuyển bằng Git hoặc sao chép thư mục vào cùng repo ở nhà; việc commit/push chưa được thực hiện trong lượt này. `git pull` đơn thuần sẽ không mang các tệp chưa commit ở công ty sang.
- Nếu sao chép trực tiếp, không cần `.build/.vite-cache/reports`; vẫn cần dependency của repo cha. Không phụ thuộc đường tuyệt đối `D:\Quyetnm\Dev\mathgenius-kids` trên máy ở nhà: các link nội bộ trong bộ docs dùng đường tương đối.
- Tiến trình chơi nằm trong **IndexedDB của trình duyệt trên máy công ty**, DB `lang-mam-independent-lab-v1`, origin `http://127.0.0.1:4328`; không nằm trong Git hay thư mục module. Nếu muốn mang vườn đang chơi, dùng Cài đặt → xuất bản sao JSON, mang file đó về, rồi nhập bằng giao diện ở nhà. Không giả định localhost và 127.0.0.1 dùng chung save.
- Không có bản save của Đại ca được xuất kèm bộ tài liệu này. Không tự đọc/ghi tiến trình bằng chỉnh DB, reset vườn hoặc nhập bản thử vào vườn thật để kiểm.
- Ảnh concept gốc đã có bản cục bộ trong thư mục docs; không cần file temp hoặc thư mục imagegen của máy công ty. Phiên dev server/tab/ID công cụ ở công ty không tiếp tục được ở máy mới; khởi động phiên mới bằng lệnh trên.

## 8. Điểm tiếp tục công việc

**Chưa bắt đầu đợt A của kế hoạch nâng cấp.** Sau khi Đại ca yêu cầu code tiếp, làm đợt A trước: sửa vị trí toast, năm menu, giữ công cụ/thao tác nhiều ô, kéo thả và xoay tại vật thể, xoay camera và tooltip tên/cấp. Khi cần lệnh batch thì bổ sung giao dịch vào engine cùng UI; không xử lý tiền/kho trực tiếp trong render.

Tiếp theo theo REVAMP_PLAN: B = Home/jobs/migration và vòng Home 1–3; C = generator/địa hình/khai phá/kinh tế Home 4–10; D = nội dung đến 25; E = mỹ thuật/âm thanh/mini game/hiệu năng; F = online. Mỹ thuật đại diện và thử terrain/placement được làm sớm, không đợi xong mọi bảng kinh tế mới xem chất lượng hình ảnh.

Trước chỉnh code: xem `git status`, đọc source liên quan, kiểm bản đang chạy và bảo toàn thay đổi có trước. Sau mỗi đợt: cập nhật CURRENT_STATE/VERIFICATION và mục trạng thái ở đây, ghi phần nào đạt/chưa đạt. Nếu sửa mốc tiến trình, cập nhật cả REVAMP_PLAN và JSON. Không đánh dấu kế hoạch là triển khai chỉ vì đã tạo data/catalog.

Prompt Đại ca có thể dùng ở máy nhà:

> Đọc modules/farm/docs/README.md, rồi đọc đầy đủ bộ tài liệu theo thứ tự trong đó và xem concept. Đối chiếu source hiện tại, tiếp tục triển khai đợt A của kế hoạch nâng cấp Làng Mầm. Giữ module độc lập, bảo toàn save, chưa làm login/server hay ghép vào Genius Kids. Gọi tao là Đại ca, xưng em.

## 9. Bản đồ vị trí tài liệu sau khi gom

Năm file `docs/farm-*.md` và ảnh `docs/farm-3d-concept-v1.png` cũ đã chuyển vào **thư mục này**, giữ tên và nội dung tham khảo. `modules/farm/VERIFICATION.md` chuyển thành `docs/VERIFICATION.md`; nội dung README module cũ chuyển thành `docs/CURRENT_STATE.md`. README ở gốc module và AGENTS chỉ làm điểm dẫn vào đây. REVAMP_PLAN và progression-draft vẫn ở cùng folder như trước.

Không giữ hai bản thiết kế đang hoạt động ở hai chỗ. Link giữa các tài liệu và ảnh nằm trong cùng thư mục. Các nguồn thị trường ngoài web là tài liệu tham khảo tại thời điểm nghiên cứu, không có lời hứa luôn cập nhật.
