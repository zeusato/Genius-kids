// Sinh trang mô phỏng bảng tuần hoàn (giữ đúng kiểu ô hiện tại) + các kính lọc để chụp ảnh ý tưởng.
// node gen-lenses.cjs <out.html>
const fs = require('fs');
const path = require('path');
const { ELEMENTS_DATA: E, CATEGORY_COLORS } = require(process.env.ELEMENTS_CJS || '../elements.cjs');
const originPath = path.join(__dirname, '..', 'research', 'origin.json');
const ORIGIN = fs.existsSync(originPath) ? JSON.parse(fs.readFileSync(originPath, 'utf8')) : null;

const USES = { 1: '💧', 2: '🎈', 3: '🔋', 4: '🛰️', 5: '🧪', 6: '✏️', 7: '🌱', 8: '🫁', 9: '🦷', 10: '🌃', 11: '🧂', 12: '🎇', 13: '🥫', 14: '💻', 15: '🧬', 16: '🌋', 17: '🏊', 18: '🪟', 19: '🍌', 20: '🦴',
  21: '🚲', 22: '🦾', 23: '🔧', 24: '🚿', 25: '🛤️', 26: '🔩', 27: '🔵', 28: '🪙', 29: '🔌', 30: '🧴', 31: '🔦', 32: '📡', 33: '⚠️', 34: '🌰', 35: '🧯', 36: '📸', 37: '🧭', 38: '🎆', 39: '📺', 40: '💍',
  41: '🚄', 42: '⚙️', 43: '🏥', 44: '💾', 45: '✨', 46: '🚗', 47: '🥈', 48: '🎨', 49: '🖥️', 50: '🥁', 51: '🧸', 52: '💿', 53: '🩹', 54: '🚀', 55: '⏱️', 56: '🩻', 57: '📷', 58: '🔥', 59: '🥽', 60: '🧲',
  61: '🔋', 62: '🎸', 63: '💶', 64: '🧊', 65: '🔊', 66: '🛵', 67: '🔬', 68: '🌐', 69: '🔬', 70: '⏰', 71: '🩺', 72: '⚛️', 73: '📱', 74: '💡', 75: '✈️', 76: '🖋️', 77: '🦖', 78: '💍', 79: '🥇', 80: '🌡️',
  81: '⚠️', 82: '🎣', 83: '💊', 84: '☢️', 85: '🔬', 86: '🏠', 87: '🔬', 88: '⌚', 89: '✨', 90: '🏮', 91: '🔬', 92: '⚡', 93: '⚛️', 94: '🛰️', 95: '🚨', 96: '🤖', 97: '🔬', 98: '🛢️', 99: '💥' };
const BODY = { 8: 65, 6: 18.5, 1: 9.5, 7: 3.2, 20: 1.5, 15: 1.0, 19: 0.4, 16: 0.3, 11: 0.2, 17: 0.2, 12: 0.1, 26: 0.006, 30: 0.003, 29: 0.0001, 53: 0.00002, 34: 0.00002, 9: 0.004, 25: 0.00002, 27: 0.000002, 42: 0.00001 };

const pos = (el) => {
  const z = el.atomicNumber;
  if (z >= 57 && z <= 71) return { row: 9, col: z - 54 };
  if (z >= 89 && z <= 103) return { row: 10, col: z - 86 };
  return { row: el.period, col: el.group };
};
const cells = E.map(el => ({ z: el.atomicNumber, s: el.symbol, n: el.name, c: CATEGORY_COLORS[el.category].color, g: CATEGORY_COLORS[el.category].glow,
  mp: el.meltingPoint ?? null, bp: el.boilingPoint ?? null, y: el.discoveryYear, u: USES[el.atomicNumber] || '⚛️', body: BODY[el.atomicNumber] ?? 0,
  o: ORIGIN ? (ORIGIN[String(el.atomicNumber)] ?? null) : null, ...pos(el) }));

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Periodic lenses proto</title>
<style>
html{background:#0f172a}html,body{margin:0;min-height:100vh;font-family:'Comic Sans MS','Comic Sans',Verdana,sans-serif;background:linear-gradient(135deg,#0f172a,#1e1b4b 50%,#0f172a);color:#e2e8f0}
header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(0,0,0,.3);border-bottom:1px solid rgba(255,255,255,.1)}
header h1{margin:0;font-size:28px;background:linear-gradient(90deg,#34d399,#22d3ee,#c084fc);-webkit-background-clip:text;color:transparent}
.btn{padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.1);font-weight:700}
#lensbar{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin:14px 0 6px}
#lensbar span{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);font-size:13px}
#lensbar span.on{background:#22d3ee;color:#0f172a;border-color:#22d3ee;font-weight:700}
#panel{max-width:1120px;margin:6px auto 16px;padding:12px 16px;border-radius:18px;background:rgba(15,23,42,.72);border:1px solid rgba(255,255,255,.12)}
.row{display:flex;align-items:center;gap:12px}
.track{position:relative;flex:1;height:14px;border-radius:9px}
.thumb{position:absolute;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.25),0 0 14px #fff}
.mark{position:absolute;top:18px;transform:translateX(-50%);font-size:11px;color:#cbd5e1;text-align:center;white-space:nowrap;line-height:1.15}
.mark:before{content:'';position:absolute;left:50%;top:-6px;width:1px;height:5px;background:#94a3b8}
.legend{display:flex;gap:16px;font-size:13px;justify-content:center;flex-wrap:wrap}
.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:5px;vertical-align:-1px}
#table{display:grid;grid-template-columns:repeat(18,64px);grid-template-rows:repeat(7,64px) 18px repeat(2,64px);gap:4px;justify-content:center;padding:0 8px 16px}
.cell{position:relative;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden;transition:all .3s}
.cell .z{position:absolute;top:2px;left:4px;font-size:10px;opacity:.7;z-index:2}
.cell .s{font-weight:700;font-size:18px;line-height:1;z-index:2}
.cell .n{font-size:10px;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;padding:0 4px;z-index:2}
.cell .e{font-size:24px;line-height:1.05;z-index:2}
.solidpat{background-image:repeating-linear-gradient(60deg,rgba(255,255,255,.08) 0 1.5px,transparent 1.5px 8px),repeating-linear-gradient(-60deg,rgba(255,255,255,.08) 0 1.5px,transparent 1.5px 8px)}
.fill{position:absolute;left:0;right:0;bottom:0;height:50%;background:linear-gradient(180deg,rgba(34,211,238,.55),rgba(8,145,178,.65))}
.fill:before{content:'';position:absolute;left:0;right:0;top:-6px;height:6px;background:radial-gradient(ellipse 6px 4px at 6px 6px,rgba(34,211,238,.55) 98%,transparent 100%) repeat-x;background-size:12px 6px}
.bub{position:absolute;border-radius:50%;border:1.5px solid rgba(254,215,170,.9);box-shadow:0 0 6px rgba(251,146,60,.8)}
.q{position:absolute;right:4px;top:2px;font-size:10px;color:#94a3b8}
.stripes{position:absolute;inset:0;display:flex;flex-direction:column;opacity:.55}
.gapmark{grid-row:6/span 1;grid-column:3;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8;border:1px dashed rgba(148,163,184,.35);border-radius:8px}
.foot{text-align:center;color:rgba(255,255,255,.5);font-size:13px;margin-bottom:18px}
</style></head><body>
<header><span class="btn">← Quay lại</span><h1>Bảng Tuần Hoàn</h1><span class="btn">🔎 🎵</span></header>
<div id="lensbar"></div><div id="panel"></div><div id="table"></div><div class="foot" id="foot"></div>
<script>
const CELLS = ${JSON.stringify(cells)};
const q = new URLSearchParams(location.search);
const LENS = q.get('lens') || 'category';
const T = q.has('t') ? +q.get('t') : 25, YEAR = q.has('year') ? +q.get('year') : 2016;
const LENSES = [['category','🎨 Nhóm'],['state','🌡️ Rắn · lỏng · khí'],['uses','🏠 Đời sống'],['origin','✨ Nguồn gốc vũ trụ'],['discovery','🕰️ Lịch sử'],['body','🧍 Quanh em'],['metal','🧲 Kim loại?'],['radio','☢️ Phóng xạ']];
document.getElementById('lensbar').innerHTML = LENSES.map(([k,l]) => '<span class="'+(k===LENS?'on':'')+'">'+l+'</span>').join('');
const KN = [[-273,0],[-200,.08],[-100,.16],[0,.26],[100,.36],[500,.5],[1000,.6],[2000,.73],[3500,.86],[6000,1]];
const fracT = t => { for (let i=1;i<KN.length;i++) if (t<=KN[i][0]) { const [a,fa]=KN[i-1],[b,fb]=KN[i]; return fa+(fb-fa)*(t-a)/(b-a); } return 1; };
const YK = [[-9000,0],[1000,.12],[1600,.18],[1750,.26],[1800,.36],[1869,.55],[1900,.7],[1940,.8],[1960,.88],[2016,1]];
const fracY = y => { for (let i=1;i<YK.length;i++) if (y<=YK[i][0]) { const [a,fa]=YK[i-1],[b,fb]=YK[i]; return fa+(fb-fa)*(y-a)/(b-a); } return 1; };
const stateAt = (c,t) => { if (c.mp==null) return 'unknown'; if (c.bp!=null && c.bp<c.mp) return t>=c.bp?'gas':'solid'; if (t<c.mp) return 'solid'; if (c.bp==null||t<c.bp) return 'liquid'; return 'gas'; };
const OC = { big_bang:['#fde68a','💥 Vụ Nổ Lớn'], cosmic_ray:['#a5b4fc','☄️ Tia vũ trụ'], dying_low_mass_stars:['#fb923c','🔴 Sao nhỏ già đi'], exploding_massive_stars:['#f472b6','💫 Sao lớn nổ tung'], exploding_white_dwarfs:['#67e8f9','⚪ Sao lùn trắng nổ'], merging_neutron_stars:['#facc15','🌟 Sao neutron va nhau'], human_made:['#94a3b8','🧪 Con người tạo ra'] };
const METAL_NON = new Set([1,2,6,7,8,9,10,15,16,17,18,34,35,36,53,54,85,86]); const METALLOID = new Set([5,14,32,33,51,52]);
const RADIO = z => z===43||z===61||z>=84;
const cnt = {solid:0,liquid:0,gas:0,unknown:0};
const table = document.getElementById('table');
for (const c of CELLS) {
  const d = document.createElement('div'); d.className = 'cell';
  d.style.gridColumn = c.col; d.style.gridRow = c.row <= 7 ? c.row : c.row;
  let col = c.c, glow = c.g, dim = false, inner = '', body = '<span class="s">'+c.s+'</span><span class="n">'+c.n+'</span>';
  if (LENS==='state') {
    const s = stateAt(c,T); cnt[s]++;
    col = {solid:'#93c5fd',liquid:'#22d3ee',gas:'#fb923c',unknown:'#64748b'}[s]; glow = col+'80';
    if (s==='solid') d.classList.add('solidpat');
    if (s==='liquid') inner = '<div class="fill"></div>';
    if (s==='gas') { inner = [[18,70,7],[70,55,5],[40,22,4],[82,18,6]].map(([x,y,r])=>'<div class="bub" style="left:'+x+'%;top:'+y+'%;width:'+r+'px;height:'+r+'px"></div>').join(''); d.style.transform='translateY(-2px)'; }
    if (s==='unknown') { inner = '<div class="q">?</div>'; d.style.borderStyle = 'dashed'; }
    d.dataset.state = s;
  } else if (LENS==='uses') {
    body = '<span class="e">'+c.u+'</span><span class="n" style="font-weight:700">'+c.s+'</span>';
  } else if (LENS==='discovery') {
    if (c.y > YEAR) { dim = true; body = '<span class="s" style="opacity:.35">?</span>'; col = '#475569'; glow = 'transparent'; }
    if (YEAR>=1869 && YEAR<1875 && [21,31,32].includes(c.z)) { dim=false; body = '<span class="s">?</span><span class="n">Mendeleev đoán</span>'; col='#fde047'; glow='#fde04799'; }
  } else if (LENS==='body') {
    if (!c.body) { dim = true; } else { const k = Math.min(1, (Math.log10(c.body)+6)/7.8); glow = 'rgba(52,211,153,'+(0.25+0.6*k)+')'; col = '#34d399'; body = '<span class="s">'+c.s+'</span><span class="n" style="font-weight:700">'+(c.body>=0.1? c.body.toLocaleString('vi-VN')+'%':'vi lượng')+'</span>'; }
  } else if (LENS==='origin' && c.o) {
    const parts = Object.entries(c.o).filter(([,v])=>v>0.02).sort((a,b)=>b[1]-a[1]);
    inner = '<div class="stripes">'+parts.map(([k,v])=>'<div style="flex:'+v+';background:'+(OC[k]?.[0]||'#666')+'"></div>').join('')+'</div>';
    col = OC[parts[0]?.[0]]?.[0] || col; glow = col+'80';
  } else if (LENS==='metal') {
    col = METAL_NON.has(c.z) ? '#4DABF7' : METALLOID.has(c.z) ? '#38D9A9' : '#FFD43B'; glow = col+'80';
  } else if (LENS==='radio') {
    if (RADIO(c.z)) { col = '#a3e635'; glow = '#a3e635'; } else dim = true;
  }
  d.style.border = (d.style.borderStyle==='dashed'?'2px dashed ':'2px solid ')+col;
  d.style.background = (d.style.background||'') ; d.style.backgroundColor = dim ? 'rgba(71,85,105,.08)' : col + '20';
  d.style.boxShadow = dim ? 'none' : '0 0 10px '+glow+', inset 0 0 10px '+glow;
  d.style.color = dim ? '#64748b' : (LENS==='state' ? ({solid:'#dbeafe',liquid:'#ecfeff',gas:'#ffedd5'}[d.dataset.state]||'#94a3b8') : col);
  if (dim) d.style.opacity = LENS==='discovery' ? .55 : .32;
  d.innerHTML = inner + '<span class="z">'+c.z+'</span>' + body;
  table.appendChild(d);
}
// ô trống nhóm 3 chu kỳ 6/7 → chỉ dẫn tới hàng f
for (const [r,t] of [[6,'57–71'],[7,'89–103']]) { const m=document.createElement('div'); m.className='gapmark'; m.style.gridRow=r; m.textContent=t; table.appendChild(m); }
const panel = document.getElementById('panel'); const foot = document.getElementById('foot');
if (LENS==='state') {
  const marks = [[-196,'🧊 Nitơ lỏng<br>−196°'],[-89,'🐧 Nam Cực<br>−89°'],[25,'🏠 Phòng<br>25°'],[100,'♨️ Nước sôi<br>100°'],[1200,'🌋 Dung nham<br>1200°'],[3422,'💡 Dây tóc đèn<br>3422°'],[5500,'☀️ Mặt Trời<br>5500°']];
  panel.innerHTML = '<div class="row"><b style="font-size:16px;white-space:nowrap">🌡️ Nhiệt kế thần kỳ</b><div class="track" style="background:linear-gradient(90deg,#1e3a8a,#38bdf8 22%,#a7f3d0 30%,#fde68a 45%,#fb923c 70%,#ef4444 88%,#fff7ed)">'+marks.map(([t,l])=>'<div class="mark" style="left:'+fracT(t)*100+'%">'+l+'</div>').join('')+'<div class="thumb" style="left:'+fracT(T)*100+'%"></div></div><b style="font-size:22px;min-width:100px;text-align:right">'+T.toLocaleString('vi-VN')+' °C</b></div><div class="legend" style="margin-top:40px"><span>❄️ Rắn <b>'+cnt.solid+'</b></span><span>💧 Lỏng <b>'+cnt.liquid+'</b></span><span>💨 Khí <b>'+cnt.gas+'</b></span><span>❓ Chưa biết <b>'+cnt.unknown+'</b></span></div>';
} else if (LENS==='discovery') {
  const marks = [[-5000,'⚱️ Cổ đại'],[1669,'🕯️ 1669 Brand'],[1808,'⚡ 1808 Davy'],[1869,'📜 1869 Mendeleev'],[1898,'👩‍🔬 1898 Marie Curie'],[1940,'⚛️ 1940 nhân tạo'],[2016,'🏁 2016']];
  const n = CELLS.filter(c=>c.y<=YEAR).length;
  panel.innerHTML = '<div class="row"><b style="font-size:16px;white-space:nowrap">🕰️ Cỗ máy thời gian</b><div class="track" style="background:linear-gradient(90deg,#78350f,#b45309 30%,#0e7490 60%,#6d28d9 85%,#db2777)">'+marks.map(([t,l])=>'<div class="mark" style="left:'+fracY(t)*100+'%">'+l+'</div>').join('')+'<div class="thumb" style="left:'+fracY(YEAR)*100+'%"></div></div><b style="font-size:22px;min-width:100px;text-align:right">'+YEAR+'</b></div><div class="legend" style="margin-top:40px"><span>Đã tìm ra <b>'+n+'</b>/118 nguyên tố</span>'+(YEAR>=1869&&YEAR<1875?'<span style="color:#fde047">✨ Mendeleev để trống 3 ô và đoán trước tính chất của chúng!</span>':'')+'</div>';
} else if (LENS==='origin') {
  panel.innerHTML = '<div class="row" style="justify-content:space-between"><b style="font-size:16px">✨ Các nguyên tố được "nấu" ở đâu trong vũ trụ?</b><span class="btn" style="background:#facc15;color:#1e1b4b">▶ Xem chuyện của vũ trụ</span></div><div class="legend" style="margin-top:10px">'+Object.values(OC).map(([c,l])=>'<span><i style="background:'+c+'"></i>'+l+'</span>').join('')+'</div>';
} else if (LENS==='body') {
  panel.innerHTML = '<div class="row" style="justify-content:space-between"><b style="font-size:16px">🧍 Cơ thể em được làm từ… (theo khối lượng)</b><span>Ôxi 65% · Cacbon 18,5% · Hiđro 9,5% · Nitơ 3,2% · Canxi 1,5% · Phốtpho 1%</span></div><div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin-top:10px"><div style="flex:65;background:#34d399"></div><div style="flex:18.5;background:#10b981"></div><div style="flex:9.5;background:#059669"></div><div style="flex:3.2;background:#047857"></div><div style="flex:3.8;background:#065f46"></div></div><div class="legend" style="margin-top:8px"><span>Chuyển: 🧍 Cơ thể · 💨 Không khí · 🌍 Vỏ Trái Đất · ☀️ Mặt Trời</span></div>';
} else if (LENS==='uses') {
  panel.innerHTML = '<div class="row" style="justify-content:space-between"><b style="font-size:16px">🏠 Nguyên tố quanh nhà em</b><span>Chạm vào hình để xem nó dùng làm gì · 🔊 đọc to</span></div>';
} else {
  const CN = {'alkali-metal':'Kim loại kiềm','alkaline-earth':'Kim loại kiềm thổ','transition-metal':'Kim loại chuyển tiếp','post-transition':'Kim loại sau chuyển tiếp','metalloid':'Á kim','nonmetal':'Phi kim','halogen':'Halogen','noble-gas':'Khí hiếm','lanthanide':'Lanthanide','actinide':'Actinide'};
  panel.innerHTML = '<div class="legend">'+Object.entries(CN).map(([k,l])=>'<span><i style="background:'+({'alkali-metal':'#FF6B6B','alkaline-earth':'#FFA94D','transition-metal':'#FFD43B','post-transition':'#69DB7C','metalloid':'#38D9A9','nonmetal':'#4DABF7','halogen':'#748FFC','noble-gas':'#DA77F2','lanthanide':'#F783AC','actinide':'#E599F7'})[k]+'"></i>'+l+'</span>').join('')+'</div>';
}
foot.textContent = '118 nguyên tố • Chu kỳ 1-7 • Nhóm 1-18';
</script></body></html>`;
fs.writeFileSync(process.argv[2], html);
console.log('ok', cells.length, 'origin:', !!ORIGIN);
