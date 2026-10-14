// Lượt rà tay đầu tiên cho parts-v1.csv (chạy một lần sau select.mjs; chạy lại vô hại).
// node scripts/bricks/curate-v1.mjs
import fs from 'node:fs';
import { readPartsCsv, COLUMNS } from './select.mjs';
import { viName } from './names.mjs';
import { KITS } from './kits.mjs';

const DROP = ['33051', '29119', '29120', '30374', '87994', '11090', '48729b', '3484', '78258', '58176', '23443', '2569', '30031', '98397', '65578', '3822', '16091', '30663'];
const MOVE = { '50745': 'vehicle', '3788': 'vehicle', '60212': 'vehicle', '13548': 'slope', '3957a': 'decor', '50943': 'decor' };
const NAME = {
  '33320': 'Con ếch', '64648': 'Con cá', '24866': 'Hoa 5 cánh', '33291': 'Hoa 4 cánh', '32607': 'Lá 3 chiếc', '30176': 'Lá tre',
  '2423': 'Lá 4×3', '2417': 'Lá 6×5', '33183': 'Lá cà rốt', '33172': 'Củ cà rốt', '22667': 'Chùm anh đào', '33051': 'Quả táo',
  '37695': 'Thân hoa 3 lá', '3742': 'Bông hoa nhỏ', '4727': 'Lá hoa 2×2',
  '50745': 'Chắn bùn 4×2', '3788': 'Chắn bùn 2×4', '60212': 'Chắn bùn 2×4 có lỗ', '41854': 'Chắn bùn 2×4 vành rộng', '44674': 'Chắn bùn 2×4 có đèn',
  '3829c01': 'Vô lăng', '4079': 'Ghế 2×2', '3823': 'Kính chắn gió 2×4×2', '4176': 'Kính chắn gió 2×6×2', '2437': 'Kính chắn gió 3×4',
  '3137c01': 'Gạch 2×2 có bánh xe', '4624': 'Vành bánh xe nhỏ', '2496': 'Bánh xe nhỏ', '50943': 'Ống hút gió 2×2', '3957a': 'Ăng-ten 1×4',
  '44728': 'Ke góc 1×2 – 2×2', '99780': 'Ke góc ngược 1×2 – 1×2', '99207': 'Ke góc ngược 1×2 – 2×2', '99781': 'Ke góc 1×2 – 1×2', '36840': 'Ke góc ngược 1×1 – 1×1',
  '15573': 'Tấm nhảy 1×2', '87580': 'Tấm nhảy 2×2', '18674': 'Tấm tròn 2×2 có lỗ giữa', '4070': 'Gạch đèn pha 1×1', '87087': 'Gạch núm cạnh 1×1',
  '11211': 'Gạch 1×2 núm cạnh', '4733': 'Gạch 1×1 núm 4 cạnh', '22885': 'Gạch 1×2×1⅔ núm cạnh', '32952': 'Gạch 1×1×1⅔ núm cạnh', '99206': 'Tấm 2×2×⅔ núm cạnh',
  '30414': 'Gạch 1×4 núm cạnh', '26604': 'Gạch 1×1 núm 2 cạnh', '67329': 'Gạch 1×2×1⅔ núm 2 cạnh',
  '29120': 'Gạch cong 2×1 khía trái', '29119': 'Gạch cong 2×1 khía phải', '52031': 'Gạch cong ba 4×6', '13548': 'Mái dốc góc 45° 2×2',
  '93273': 'Gạch cong đôi 4×1', '49307': 'Gạch cong đôi 1×1', '30602': 'Gạch cong 2×2 có gờ', '88930': 'Gạch cong 2×4', '30165': 'Gạch cong 2×2 có 2 núm',
  '87620': 'Gạch cong mặt lõm 2×2', '3747b': 'Mái dốc ngược 33° 3×2', '27925': 'Tấm trơn cong 2×2', '27507': 'Tấm trơn cong 4×4',
  '3942c': 'Nón 2×2×2', '30367c': 'Gạch tròn 2×2 vòm', '14395': 'Vòm 1×5×4', '4081b': 'Tấm 1×1 có vòng', '3176': 'Tấm 3×2 có lỗ',
  '32028': 'Tấm 1×2 ray cửa', '2540': 'Tấm 1×2 tay cầm', '48336': 'Tấm 1×2 tay cầm cạnh', '60478': 'Tấm 1×2 tay cầm đầu', '26047': 'Tấm 1×1 tay cầm',
  '33909': 'Tấm trơn 2×2 có 2 núm', '41740': 'Tấm 1×4 có 2 núm', '32828': 'Tấm 1×1 có răng', '2412b': 'Tấm trơn lưới 1×2', '99563': 'Thỏi vàng 1×2',
  '2877': 'Gạch lưới 1×2', '30136': 'Gạch khúc gỗ 1×2', '30137': 'Gạch khúc gỗ 1×4', '98283': 'Gạch vân đá 1×2', '15533': 'Gạch vân đá 1×4',
  '20482': 'Tấm trơn tròn 1×1 có thanh', '15535': 'Tấm trơn tròn 2×2 có lỗ', '2460': 'Tấm trơn 2×2 có chốt', '11203': 'Tấm trơn ngược 2×2', '35459': 'Tấm trơn ngược 1×3',
  '22385': 'Tấm trơn ngũ giác 2×3', '35787': 'Tấm trơn tam giác 2×2', '27263': 'Tấm trơn góc vát 2×2', '2432': 'Tấm trơn 1×2 tay cầm',
  '35480': 'Tấm 1×2 tròn đầu', '77850': 'Tấm 1×3 tròn đầu', '85861': 'Tấm tròn 1×1 núm rỗng', '6141': 'Tấm tròn 1×1', '2654a': 'Tấm tròn 2×2 đáy cong',
  '4740': 'Đĩa 2×2', '43898': 'Đĩa 3×3', '3960': 'Đĩa 4×4', '11213': 'Tấm tròn 6×6', '22888': 'Tấm tròn 4×8', '87081': 'Gạch tròn 4×4',
  '92947': 'Gạch tròn 2×2', '15395': 'Gạch tròn 2×2 vòm', '98100': 'Gạch tròn 2×2 cánh hoa', '59900': 'Nón 1×1', '4589': 'Nón 1×1 cũ', '11610': 'Nón 1×1 có rãnh',
  '30357': 'Tấm góc tròn 3×3', '30565': 'Tấm góc tròn 4×4', '6003': 'Tấm góc tròn 6×6', '18980': 'Tấm tròn hai đầu 2×6', '85080': 'Gạch góc tròn 2×2',
  '2458': 'Gạch 1×2 có chốt cạnh', '2653': 'Gạch 1×4 không núm giữa', '4216': 'Gạch 1×2 rãnh cửa', '2921': 'Gạch 1×1 tay cầm', '30236': 'Gạch 1×2 tay cầm', '20310': 'Gạch 1×1 núm rỗng',
  '4865b': 'Vách 1×2×1', '6231': 'Vách góc 1×1×1', '93095': 'Vách bo góc 1×2×1', '23969': 'Vách 1×2×1 góc', '15207': 'Vách 1×4×1', '87552': 'Vách 1×2×2', '87544': 'Vách 1×2×3', '60581': 'Vách 1×4×3', '59349': 'Vách 1×6×5',
  '4600': 'Tấm 2×2 trục bánh xe', '60592': 'Cửa sổ 1×2×2', '60594': 'Cửa sổ 1×4×3', '60596': 'Khung cửa 1×4×6', '3633': 'Hàng rào 1×4×1',
};

// Mảnh thêm tay: tấm in hoa văn chung chung (không thương hiệu, không nhân vật bản quyền, không chữ) và bộ ghép.
const EXTRA = [
  ['98138p07', 'Mắt tròn'], ['98138p0b', 'Mắt lim dim'], ['98138p0c', 'Mắt nhắm'], ['98138p0z', 'Mặt gấu trúc'], ['98138p23', 'Mặt hổ'],
  ['98138p28', 'Mặt khỉ'], ['98138p1r', 'Mặt cười'], ['98138p00', 'Hoa trái tim'], ['98138p1a', 'Bông hoa tròn'], ['98138p16', 'Trái tim hồng'],
  ['98138p0g', 'Ngôi sao trắng'], ['98138p0r', 'Bông tuyết'], ['98138p10', 'Dấu chân'], ['98138p13', 'Dưa hấu'], ['98138p39', 'Lát cam'],
  ['98138p1m', 'Bánh pizza'], ['98138p2w', 'Bánh donut'], ['98138p0a', 'Bánh quy'], ['98138p2r', 'Đồng hồ tròn'], ['98138p2t', 'Bọ rùa'],
  ['98138p3a', 'Cỏ bốn lá'], ['3070bp10', 'Mặt mèo'], ['3070bp11', 'Mặt thỏ'], ['3070bp1s', 'Mặt chó'], ['3070bpf3', 'Trái tim đỏ'],
  ['3070bpc2', 'Màn hình máy tính'], ['3070bp0n', 'Cầu vồng và mây'], ['3069bpx8', 'Hai con mắt'], ['3069bp69', 'Nụ cười'], ['3069bp08', 'Đồng hồ số'],
  ['3069bpc0', 'Bàn phím'], ['3069bpa0', 'Đồng hồ xe'], ['3069bp06', 'Mũi tên vàng'], ['3069bpf4', 'Hoa lá'],
].map(([key, nameVi]) => ({ keep: '1', key, group: 'tile', nameVi, ldraw: key + '.dat', rb: '', nameEn: '', sets: '', faces: '', conns: '', note: 'print' }));
for (const k of KITS) EXTRA.push({ keep: '1', key: k.key, group: k.group, nameVi: k.nameVi, ldraw: 'kit:' + k.key, rb: '', nameEn: '', sets: '', faces: '', conns: '', note: 'kit' });
EXTRA.push({ keep: '1', key: '4600', group: 'vehicle', nameVi: 'Tấm 2×2 trục bánh xe', ldraw: '4600.dat', rb: '4600', nameEn: 'Plate Special 2 x 2 with Wheel Holders', sets: '', faces: '', conns: '', note: '' });
// Mảnh gốc của bộ: không đứng riêng trong khay (bé dùng bản đã ghép).
DROP.push('60592', '60594', '60596', '4624');

const rows = readPartsCsv();
for (const e of EXTRA) if (!rows.some(r => r.key === e.key)) rows.push(e);
for (const r of rows) {
  if (DROP.includes(r.key)) r.keep = '0';
  if (MOVE[r.key]) r.group = MOVE[r.key];
  if (r.nameEn) r.nameVi = NAME[r.key] || viName(r.nameEn);
}
const csvCell = v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
fs.writeFileSync('docs/brick-studio/parts-v1.csv', '# Bộ mảnh v1 — sinh bởi scripts/bricks/select.mjs rồi rà tay. keep=0 để loại. key không bao giờ đổi.\n'
  + COLUMNS.join(',') + '\n' + rows.map(r => COLUMNS.map(c => csvCell(r[c] ?? '')).join(',')).join('\n') + '\n');
const kept = rows.filter(r => r.keep !== '0'), by = {};
for (const r of kept) by[r.group] = (by[r.group] || 0) + 1;
console.log('kept', kept.length, by);
console.log('English names left:', kept.filter(r => /[A-Za-z]{4,}/.test(r.nameVi)).map(r => r.key + ' ' + r.nameVi).join(' | '));
