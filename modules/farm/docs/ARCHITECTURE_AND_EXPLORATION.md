# Kiến trúc, tỷ lệ cảnh và sương khám phá — 18/09/2026

Đợt này tiếp tục sau khi Đại ca phản hồi công trình giống nhau, cảnh nhỏ/trống và nền toàn cỏ. Đây là thay đổi đã triển khai, không phải danh sách ý tưởng.

## Phân biệt khởi đầu và trưng bày

Trang trại khởi đầu vẫn chỉ có **Home, kho và 8 luống**, 180 xu. Ảnh cũ chứa tất cả công trình là fixture QA Home 25, không phải cấu hình người chơi mới.

`DevLab` nay ghi rõ **SÂN THỬ**, có ba tình huống: **Xem khởi đầu**, **Trưng bày cấp 25**, **Thử mở đất** (Home 5, tiền thử để nhận thêm vùng). Không chạm DB người chơi. Home 25 trưng bày 29 công trình cách nhau tối thiểu một ô, 120 luống thành bốn cánh đồng, có lối đi. Không dùng thuật toán nhét vào ô trống đầu tiên nữa. Cầu ở fixture trưng bày đã xây để đi quanh được.

Sân thử: <http://127.0.0.1:4328/?lab=qa>. Bảng riêng từng mẫu: <http://127.0.0.1:4328/?lab=architecture>. Trong QA, nút **Xem khu trưng bày** đưa camera vào khu nhà. Các chức năng thử được loại khỏi production bằng `import.meta.env.DEV`.

## Kiến trúc đã thay

Xoá fallback nhà mái ngói dùng chung cho xưởng. `render/architecture.ts` dựng riêng 26 loại; ba kiểu đã có hình riêng (cối xay/lò bánh/chuồng bò) tiếp tục được dùng và thay phụ kiện nâng cấp chung bằng đồ nghề phù hợp. Không gắn cùng cột/khối vàng trên mọi nhà nữa. Màu viên ngói đi theo màu mái, không lẫn ngói cam lên mái xanh/tím.

| Công trình | Nhận diện hình khối và công năng |
|---|---|
| Home | Nhà ghép cánh, hiên, mái đá xanh, ống khói, phần mở rộng theo cấp |
| Kho | Mái gãy dốc, cửa đôi xuất hàng, bệ giao nhận, silo và thùng hàng |
| Cối xay / lò bánh / chuồng bò | Tháp và cánh quay / lò nướng và quầy bánh / chuồng mở, bò, máng, kiện rơm và bình sữa |
| Chuồng gà / chuồng cừu | Nhà sàn có dốc lên / mái trú thấp, sân rào và đàn cừu |
| Xưởng gỗ | Khung mở, bàn cưa đĩa, đống gỗ, bánh truyền động |
| Trạm đá / quặng | Khối đá cắt và cần cẩu / cửa hầm, ray, xe goòng, giàn kéo |
| Lò luyện / xưởng dụng cụ | Thân lò tròn, ống khói, máng rót / nhà khung, bàn dụng cụ, đe và đá mài |
| Xưởng sữa | Nhà nhỏ mái xanh, bồn sữa ngoài trời, bàn phô mai |
| Xưởng dệt / may / nhuộm | Khung dệt có sợi và cuộn vải / tầng lầu, mái che, bàn máy, mannequin / bồn nhuộm và giàn phơi màu |
| Xưởng gốm / ép | Lò vòm, bàn xoay, kệ gốm / máy ép vít gỗ, thùng chứa và két quả |
| Nhà bếp / mứt / kem | Bếp mở và nồi / nồi đồng, ống khói và lọ mứt / kiosk tròn, quầy và biểu tượng kem |
| Hội chợ / nhà trà | Lều tám múi, cờ và quầy hàng / đình mái rộng, hiên và bàn trà |
| Nhà kính | Vòm kính có sườn, bồn/chậu hoa |
| Vườn cây / thảo mộc / ong | Cây quả, giỏ và thang / luống nâng, giàn thảo mộc / tổ ong đan và hoa |
| Ao cá / cảng | Ao oval kè đá, sàn gỗ và guồng / cầu gỗ, mái che, dây neo và dụng cụ câu |

Bảng kiến trúc xem được các cấp 1/5/10/15/20/25, bốn hướng và mở mẫu cận cảnh xoay tự do. Công trình **vẫn là 3D**, không phải bộ sprite bốn ảnh đã sản xuất. Không đánh đồng việc có dropdown 25 cấp với 25 ngoại hình mỹ thuật độc lập; mốc phụ kiện tùy nghề, lợi ích gameplay vẫn theo catalog hiện hành.

## Tỷ lệ và cảnh quan

- Camera Home thay khung 40 × 31 bằng 22 × 18 đơn vị tham chiếu; màn hẹp dùng bề ngang 15. Kích thước thực trên màn hình tùy tỷ lệ cửa sổ. Không đổi footprint gameplay hoặc phá save để tăng hình.
- Cây tự nhiên tăng 15%, đá tăng 25% so với kích thước sprite trước đợt này; vẫn kiểm alpha khi chọn, tán cây mờ khi làm ruộng/sắp xếp.
- Bảy nhóm nền trong `core/landcover.ts`: đồng cỏ, sân đất, đất rừng, vùng cao đá, đất khô, ven nước và đường mòn. Màu chuyển theo vertex/shader; bờ cát/nước giữ hình học thật. Ánh sáng giảm độ gắt để vật liệu bớt bạc màu.
- Generator mới tăng mật độ tài nguyên ở rừng/đồng/cao nguyên, vẫn giữ lối đi, cầu, bến và vùng sạch khởi đầu. Thế giới đã lưu không bị thêm vật cản mới đè tài sản.
- Ba ảnh imagegen RGBA mới: dương xỉ, bụi lá, hoa dại. `GroundCover` rải theo loại nền, tránh nhà/ruộng và ô đã khai phá. Đây là lớp cây thấp trang trí không cản thao tác, không phải tài nguyên thưởng mới. Ảnh gốc ở `src/assets/terrain`, prompt đầy đủ ở [undergrowth-prompts](undergrowth-prompts-2026-09-18.json), mode **built-in image_gen**.

## Sương theo tiến trình

`ExplorationFog` dùng lớp phủ trong canvas, tính khoảng cách tới hợp các khu sở hữu. Mép sương mềm, có biến thiên mây; khu chưa mở bị che và không lộ tooltip tài nguyên. Minimap cũng che khu chưa mở. Home tăng giới hạn số khu; **nhận thêm khu đất** mới làm sương rút, không phải chỉ tăng cấp Home là tự mở đất miễn phí.

Không thêm field visited hoặc migration save. Sương suy ra từ `world.owned`, luôn giữ sáng đất đã mở, không đóng lại khi thoát/reload. Đây là sương khám phá theo khu, chưa phải hệ tầm nhìn nhân vật hoặc nhiệm vụ mở từng polygon riêng. Giảm chuyển động tắt chuyển động mây.

## Kiểm chứng và phần còn mở

- **75/75 test, 9/9 file, 218,16 giây**: giữ kiểm 6.000 seed, đường tiếp cận và chín lịch solo; thêm hai bài QA fixture và hai bài phân vùng/sương. Kiểm model hữu hạn, clone hoạt ảnh, các mốc cấp; test không thay nghiệm thu mỹ thuật.
- Typecheck module/host và production build đạt ở lượt kiểm. Build còn cảnh báo chunk lớn. Xem VERIFICATION để biết lần build cuối và thử UI.
- 17 PNG terrain gốc tổng 27.547.484 byte, chưa tối ưu atlas/texture compression/VRAM. Có instancing lớp cây thấp, gộp mesh công trình theo vật liệu.
- Chưa chứng nhận chất lượng mobile thật hoặc mục tiêu 60 FPS. Cảnh QA 29 nhà/120 luống quan sát khoảng 34 FPS trong lúc chạy kiểm tra; không phải benchmark kiểm soát. Cần duyệt mỹ thuật cùng Đại ca và tối ưu vật liệu/texture tiếp, không tự ghi đã đạt mỹ thuật cuối.

Chỉ sửa module độc lập; không ghép host/Auth/Supabase. Không reset DB người chơi, không commit/push.
