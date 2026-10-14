// Tên tiếng Việt tự động từ tên Rebrickable (bản nháp, rà tay trong parts-v1.csv).

// Số đo: "2", "2/3", "1 1/3" (phân số đứng trước để không bị "2" ăn mất)
const DIM = /(\d+ \d\/\d|\d\/\d|\d+)\s*x\s*(\d+ \d\/\d|\d\/\d|\d+)(?:\s*x\s*(\d+ \d\/\d|\d\/\d|\d+))?/;
const frac = v => v.replace(/^(\d+) 1\/3$/, '$1⅓').replace(/^(\d+) 2\/3$/, '$1⅔').replace(/^(\d+) 1\/2$/, '$1½').replace(/^1\/3$/, '⅓').replace(/^2\/3$/, '⅔').replace(/^1\/2$/, '½');
const dims = s => { const m = DIM.exec(s); return m ? [m[1], m[2], m[3]].filter(Boolean).map(frac).join('×') : ''; };

const RULES = [
  [/Cheese Slope/i, 'Mái phô mai'],
  [/Brick Sloped Inverted/i, 'Mái dốc ngược'], [/Brick Sloped/i, 'Mái dốc'],
  [/Brick Curved Inverted/i, 'Dốc cong ngược'], [/Brick Curved/i, 'Gạch cong'],
  [/Brick Arch/i, 'Vòm'], [/Brick Round Corner/i, 'Gạch góc tròn'], [/Brick Round/i, 'Gạch tròn'],
  [/Wedge Plate/i, 'Tấm nêm'], [/Plate Round Corner/i, 'Tấm góc tròn'], [/Plate Round/i, 'Tấm tròn'], [/Plate Special/i, 'Tấm đặc biệt'], [/Plate/i, 'Tấm'],
  [/Tile Round/i, 'Tấm trơn tròn'], [/Tile Special/i, 'Tấm trơn đặc biệt'], [/Tile/i, 'Tấm trơn'],
  [/Brick Special/i, 'Gạch đặc biệt'], [/Brick/i, 'Gạch'],
  [/Cone/i, 'Nón'], [/Dish/i, 'Đĩa'], [/Window/i, 'Cửa sổ'], [/Door/i, 'Cửa'], [/Fence/i, 'Hàng rào'], [/Panel/i, 'Vách'],
  [/Windscreen/i, 'Kính chắn gió'], [/Wheel/i, 'Bánh xe'], [/Tyre|Tire/i, 'Lốp'], [/Plant|Flower/i, 'Cây hoa'], [/Bar/i, 'Thanh'],
];
const EXTRA = [
  [/Double/i, 'đôi'], [/Triple/i, 'ba'], [/Convex/i, 'lồi'], [/Concave/i, 'lõm'], [/Corner/i, 'góc'], [/Left/i, 'trái'], [/Right/i, 'phải'],
  [/No Studs/i, 'không núm'], [/Grille/i, 'lưới'], [/Log/i, 'khúc gỗ'], [/Masonry/i, 'vân đá'], [/Jumper/i, 'nhảy'], [/Headlight/i, 'đèn pha'],
  [/Bracket/i, 'ke góc'], [/Stud on (1 )?Side|Studs on/i, 'núm cạnh'], [/Half Circle/i, 'nửa tròn'], [/Quarter/i, 'phần tư'], [/Macaroni/i, 'mì ống'],
  [/Heart/i, 'trái tim'], [/Star/i, 'ngôi sao'], [/Ingot|Gold Bar/i, 'thỏi vàng'], [/Handle/i, 'tay cầm'], [/Cutout/i, 'khoét'], [/Hollow Stud|Open Stud/i, 'núm rỗng'],
];

export function viName(en) {
  const base = RULES.find(([re]) => re.test(en))?.[1] || en;
  const angle = /(\d+)°/.exec(en)?.[1];
  const extra = EXTRA.filter(([re]) => re.test(en)).map(([, v]) => v);
  return [base, angle ? angle + '°' : '', dims(en), ...extra].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
