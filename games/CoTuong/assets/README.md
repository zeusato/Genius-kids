# Tài nguyên Kỳ Viên

## Ảnh Google Flow

Tạo ngày 2026-09-15 qua Google Flow đang đăng nhập trong in-app browser, theo quyền người dùng đã cấp. Model được chọn trong giao diện: Nano Banana 2, một ảnh 16:9.

- Project: https://flow.google.com/project/7b20f6a9-d1ff-4fbb-9152-27694219b8d5
- Tên ảnh trong Flow: **Xiangqi board in garden courtyard**.
- Media ID: `6b658e5e-f244-4952-89cd-b6ac1ebded03`.
- `art/courtyard.webp`: 1440×810, 188,156 bytes, ảnh lobby.
- `art/cover.webp`: 800×450, 76,310 bytes, chuẩn bị cho catalog khi ghép.
- `art/cover-sm.webp`: 400×225, 24,044 bytes, chuẩn bị cho catalog nhỏ.
- Xuất ảnh từ tài nguyên hiển thị trong Flow và chuyển WebP bằng Sharp. Không lưu URL tải có token vào source.

Prompt đã gửi:

> Create one beautiful horizontal 16:9 cinematic illustration for a Vietnamese Xiangqi game called Ky Vien. A handcrafted miniature Chinese chess board in honey walnut wood with round ivory wooden discs engraved with red and dark ink Chinese characters, a correct 9 by 10 intersection grid and river, sits on a low wooden table in a peaceful Vietnamese garden courtyard. Lush sage green bamboo, a small bonsai tree, ceramic tea pot and tiny teacups, warm terracotta tiles, soft golden morning sunlight, delicate falling leaves. Premium tactile toy diorama, beveled wood edges, subtle grain, elegant calm atmosphere, friendly for children, polished 3D illustration, close three-quarter overhead composition, board prominent in center-right with breathing room to the left, rich forest green shadows and cream highlights. No people, no interface, no letters or title, no watermarks. One scene only, not a contact sheet.

Ảnh chỉ làm bìa minh họa. Bàn và quân tương tác được dựng bằng code với tọa độ chính xác; không dùng bố trí quân trong ảnh AI làm dữ liệu luật.

## Font

- Nunito Latin/Vietnamese: sao chép từ `public/hub/fonts/` của dự án. SIL OFL 1.1, Copyright 2014 The Nunito Project Authors; giấy phép `fonts/Nunito-OFL.txt`.
- Noto Serif TC 600: lấy từ Google Fonts với tập 18 chữ `帥仕相傌俥炮兵將士象馬車砲卒楚河漢界`, khoảng 7.94 KB. Chữ Hán và nhãn tiếng Việt đều có nguồn font local.
- Nguồn Noto: https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600 (script `../scripts/fetch-font.mjs` thêm text subset).
- Giấy phép Noto: https://github.com/notofonts/noto-cjk/blob/main/Serif/LICENSE, bản lưu `fonts/OFL.txt`.
- Bản build kèm hai giấy phép trong `public/licenses/`. Font được pre-cache, không gọi Google Fonts lúc chơi.

## Cảnh và âm thanh

`geometry.ts`: bàn gỗ bo cạnh, vân gỗ/lưới/nhãn vẽ canvas, mặt quân riêng theo màu và loại quân. Quân dùng instancing; tiểu cảnh vườn gộp một geometry. Ánh sáng môi trường tạo trong bộ nhớ từ RoomEnvironment, không tải HDRI ngoài.

`audio.ts`: tổng hợp tiếng chọn/đặt/ăn quân/chiếu/kết thúc bằng Web Audio sau tương tác người dùng. Không có âm thanh thương mại tải ngoài. Icon app là SVG hình bàn cờ viết riêng, PNG 192/512 được rasterize từ cùng SVG.
