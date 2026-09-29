# Tài liệu đi kèm plan "Bảng Tuần Hoàn wow"

Plan chính: [../periodic-table-wow-plan.md](../periodic-table-wow-plan.md).

| File | Là gì |
| --- | --- |
| `concept-*.webp` | Ảnh ý tưởng chụp từ bản thử ngày 29/09/2026 (không phải code app) |
| `research/isotopes.json` | Z → đồng vị dùng cho mô hình hạt nhân: `A`, `stable`, `abundancePct`, `halfLife`. Nguồn: CIAAW (IUPAC) và NUBASE2020 |
| `research/data-audit.json` | Kết quả đối chiếu `src/data/elementsData.ts` với PubChem, CIAAW, NIST, WebElements/CRC/Lange, theo từng trường |
| `research/neutron-errors.json` | 35 nguyên tố mà công thức `round(khối lượng) − Z` cho ra sai đồng vị |
| `proto/specimens.html` | Bản thử: canvas trong suốt + bloom đè lên ô DOM; khối vàng/đồng, ống neon, bitmut, giọt thủy ngân, mây electron + hạt nhân Au-197 |
| `proto/dive.html` | Bản thử: 4 tầng "lặn vào khối vàng" (mẫu vật → mạng fcc → nguyên tử Bohr kiểu SGK → hạt nhân) |
| `proto/gen-lenses.cjs` | Sinh trang mô phỏng bảng (đúng kiểu ô hiện tại) với các kính lọc |

## Chạy lại bản thử
Các file HTML nạp three r181 + postprocessing 6.39 từ jsDelivr qua importmap, nên cần được phục vụ qua HTTP (mở `file://` không chạy module).

1. Chép vào thư mục có tiền tố `.tmp-`. Repo đã gitignore mẫu `/.tmp-*`, ví dụ `.tmp-proto/`.
2. Mở qua dev server: `http://localhost:3000/Genius-kids/.tmp-proto/specimens.html?fx=1`. Tham số: `fx=0` để tắt composer, `t=<giây>` để cố định khung hình.
3. `gen-lenses.cjs` cần bản CommonJS của `elementsData.ts`. Tạo bằng esbuild (`transformSync(..., { loader: 'ts', format: 'cjs' })`) rồi trỏ tới bằng biến `ELEMENTS_CJS`. Tham số của trang sinh ra: `?lens=category|state|uses|discovery|body|metal|radio`, `&t=30`, `&year=1870`.
