// Bảng màu v1 (D6): 18 màu thường + 6 trong suốt + 3 ánh kim. Mã LDraw ↔ Rebrickable đối chiếu theo tên ngày 14/10/2026
// (LDConfig.ldr và colors.csv). Chú ý: Trans Light Blue là LDraw 43 nhưng Rebrickable 41.
export const PALETTE = [
  // key, ldraw, rebrickable, tên Việt, tên gốc, nhóm
  ['white', 15, 15, 'Trắng', 'White', 'basic'],
  ['black', 0, 0, 'Đen', 'Black', 'basic'],
  ['red', 4, 4, 'Đỏ', 'Red', 'basic'],
  ['yellow', 14, 14, 'Vàng', 'Yellow', 'basic'],
  ['blue', 1, 1, 'Xanh dương', 'Blue', 'basic'],
  ['green', 2, 2, 'Xanh lá đậm', 'Green', 'basic'],
  ['bright-green', 10, 10, 'Xanh lá tươi', 'Bright Green', 'basic'],
  ['orange', 25, 25, 'Cam', 'Orange', 'basic'],
  ['light-orange', 191, 191, 'Vàng cam', 'Bright Light Orange', 'basic'],
  ['brown', 70, 70, 'Nâu', 'Reddish Brown', 'basic'],
  ['tan', 19, 19, 'Màu cát', 'Tan', 'basic'],
  ['light-gray', 71, 71, 'Xám nhạt', 'Light Bluish Gray', 'basic'],
  ['dark-gray', 72, 72, 'Xám đậm', 'Dark Bluish Gray', 'basic'],
  ['lime', 27, 27, 'Xanh nõn chuối', 'Lime', 'basic'],
  ['azure', 322, 322, 'Xanh da trời', 'Medium Azure', 'basic'],
  ['pink', 29, 29, 'Hồng', 'Bright Pink', 'basic'],
  ['magenta', 26, 26, 'Hồng tím', 'Magenta', 'basic'],
  ['lavender', 30, 30, 'Tím', 'Medium Lavender', 'basic'],
  ['trans-clear', 47, 47, 'Trong suốt', 'Trans-Clear', 'trans'],
  ['trans-red', 36, 36, 'Đỏ trong', 'Trans-Red', 'trans'],
  ['trans-yellow', 46, 46, 'Vàng trong', 'Trans-Yellow', 'trans'],
  ['trans-blue', 33, 33, 'Xanh dương trong', 'Trans-Dark Blue', 'trans'],
  ['trans-green', 34, 34, 'Xanh lá trong', 'Trans-Green', 'trans'],
  ['trans-light-blue', 43, 41, 'Xanh nhạt trong', 'Trans-Light Blue', 'trans'],
  ['pearl-gold', 297, 297, 'Vàng kim', 'Pearl Gold', 'shiny'],
  ['silver', 179, 179, 'Bạc', 'Flat Silver', 'shiny'],
  ['chrome', 383, 383, 'Bạc gương', 'Chrome Silver', 'shiny'],
].map(([key, ldraw, rb, nameVi, nameEn, kind]) => ({ key, ldraw, rb, nameVi, nameEn, kind }));

/** 10 màu cho chế độ bé (mục 4.5). */
export const PRESCHOOL_COLORS = ['red', 'yellow', 'blue', 'bright-green', 'orange', 'white', 'black', 'pink', 'azure', 'brown'];
