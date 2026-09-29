// Prototype DC solver (Modified Nodal Analysis, Norton form) for the electricity plan.
// Components have 2 terminals: a (first) and b (second). Battery: a = (−), b = (+).
// Wires are tiny resistors so every wire has a current (for electron animation).

const PARTS = {
  battery: { E: 1.5, r: 0.2 },            // AA alkaline, fresh
  lemon:   { E: 0.95, r: 450 },           // Cu/Zn lemon cell
  bulb:    { R: 2.5 / 0.3, Prated: 0.75 },// 2,5 V – 0,3 A school-kit bulb (hot resistance)
  wire:    { R: 0.02 },
  switchOn:{ R: 0.02 },
  bell:    { R: 12, Imin: 0.08 },
  motor:   { R: 6, Imin: 0.05 },
  buzzer:  { R: 150, Imin: 0.004 },
  ledRed:  { Vf: 1.8, Ron: 15, Imin: 0.0005, Irated: 0.02 },
  resistor:{ R: 100 },
};

function solve(nodeCount, elems) {
  // Iterate LED states (piecewise-linear), max 20 rounds.
  const led = elems.filter(e => e.kind === 'led');
  led.forEach(e => { e.on = false; });
  let V;
  for (let round = 0; round < 20; round++) {
    const n = nodeCount; // node 0 = ground
    const G = Array.from({ length: n }, () => new Float64Array(n));
    const I = new Float64Array(n);
    const gmin = 1e-9;
    for (let i = 0; i < n; i++) G[i][i] += gmin;
    const stampG = (a, b, g) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
    const stampI = (a, b, i) => { I[a] -= i; I[b] += i; }; // current i flowing a -> b through source (into b)
    for (const e of elems) {
      if (e.kind === 'R') stampG(e.a, e.b, 1 / e.R);
      else if (e.kind === 'src') { stampG(e.a, e.b, 1 / e.r); stampI(e.a, e.b, e.E / e.r); } // pushes current out of + (b)
      else if (e.kind === 'led') {
        if (e.on) { stampG(e.a, e.b, 1 / e.Ron); stampI(e.b, e.a, e.Vf / e.Ron); } // anode a, cathode b
        else stampG(e.a, e.b, 1e-9);
      }
    }
    // ground node 0: remove row/col 0
    const m = n - 1;
    const A = Array.from({ length: m }, (_, i) => Float64Array.from(G[i + 1].slice(1)));
    const rhs = Float64Array.from(I.slice(1));
    // Gaussian elimination with partial pivoting
    for (let c = 0; c < m; c++) {
      let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [rhs[c], rhs[p]] = [rhs[p], rhs[c]];
      for (let r = c + 1; r < m; r++) {
        const f = A[r][c] / A[c][c]; if (!f) continue;
        for (let k = c; k < m; k++) A[r][k] -= f * A[c][k];
        rhs[r] -= f * rhs[c];
      }
    }
    const x = new Float64Array(m);
    for (let r = m - 1; r >= 0; r--) { let s = rhs[r]; for (let k = r + 1; k < m; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    V = [0, ...x];
    let changed = false;
    for (const e of led) {
      const vd = V[e.a] - V[e.b];
      const shouldOn = e.on ? (vd - e.Vf) / e.Ron > 0 : vd > e.Vf;
      if (shouldOn !== e.on) { e.on = shouldOn; changed = true; }
    }
    if (!changed) break;
  }
  return elems.map(e => {
    const vab = V[e.b] - V[e.a];
    let i;
    if (e.kind === 'R') i = (V[e.a] - V[e.b]) / e.R;                 // a -> b
    else if (e.kind === 'src') i = (e.E - vab) / e.r;               // out of + terminal
    else i = e.on ? (V[e.a] - V[e.b] - e.Vf) / e.Ron : 0;          // anode -> cathode
    return { ...e, i, v: Math.abs(vab) };
  });
}

// Tiny netlist builder: terminals get node ids via union of wire endpoints is NOT done here;
// we connect by explicit node numbers and add wires as small resistors between nodes.
function report(title, nodes, list) {
  const res = solve(nodes, list);
  console.log('\n## ' + title);
  for (const r of res) {
    if (!r.label) continue;
    const P = r.kind === 'src' ? r.i * (r.E - r.i * r.r) : Math.abs(r.i) * r.v;
    let extra = '';
    if (r.Prated) extra = ` brightness(P/Prated)=${(P / r.Prated).toFixed(3)}  glow=${Math.min(1.3, Math.sqrt(P / r.Prated)).toFixed(2)}`;
    if (r.kind === 'led') extra = ` LED ${r.on ? 'ON' : 'off'}  I=${(r.i * 1000).toFixed(2)} mA`;
    console.log(`${r.label.padEnd(14)} I=${Math.abs(r.i).toFixed(4)} A  V=${r.v.toFixed(3)} V  P=${P.toFixed(4)} W${extra}`);
  }
}
const B = PARTS.battery, L = PARTS.bulb, W = PARTS.wire.R;
const bat = (a, b, label) => ({ kind: 'src', a, b, E: B.E, r: B.r, label });
const bulb = (a, b, label) => ({ kind: 'R', a, b, R: L.R, Prated: L.Prated, label });
const wire = (a, b, label) => ({ kind: 'R', a, b, R: W, label });

// 1) single bulb
report('1 pin + 1 bóng', 4, [bat(0, 1, 'pin'), wire(1, 2), bulb(2, 3, 'bóng'), wire(3, 0)]);
// 2) two batteries in series
report('2 pin nối tiếp + 1 bóng', 5, [bat(0, 1, 'pin1'), bat(1, 2, 'pin2'), wire(2, 3), bulb(3, 4, 'bóng'), wire(4, 0)]);
// 3) two bulbs in series, 1 battery
report('1 pin + 2 bóng NỐI TIẾP', 5, [bat(0, 1, 'pin'), wire(1, 2), bulb(2, 3, 'bóng1'), bulb(3, 4, 'bóng2'), wire(4, 0)]);
// 4) two bulbs in parallel, 1 battery
report('1 pin + 2 bóng SONG SONG', 4, [bat(0, 1, 'pin'), wire(1, 2), bulb(2, 3, 'bóng1'), bulb(2, 3, 'bóng2'), wire(3, 0)]);
// 5) three bulbs series, 2 batteries
report('2 pin + 3 bóng nối tiếp', 7, [bat(0, 1, 'pin1'), bat(1, 2, 'pin2'), wire(2, 3), bulb(3, 4, 'bóng1'), bulb(4, 5, 'bóng2'), bulb(5, 6, 'bóng3'), wire(6, 0)]);
// 6) 4 batteries -> overload
report('4 pin nối tiếp + 1 bóng (quá tải?)', 7, [bat(0, 1, 'pin1'), bat(1, 2, 'pin2'), bat(2, 3, 'pin3'), bat(3, 4, 'pin4'), wire(4, 5), bulb(5, 6, 'bóng'), wire(6, 0)]);
// 7) short circuit with a bulb in parallel
report('Đoản mạch (dây nối thẳng 2 cực, có bóng song song)', 4, [bat(0, 1, 'pin'), wire(1, 0, 'dây tắt'), wire(1, 2), bulb(2, 3, 'bóng'), wire(3, 0)]);
// 8) lemons + red LED
const lemon = (a, b, label) => ({ kind: 'src', a, b, E: PARTS.lemon.E, r: PARTS.lemon.r, label });
const led = (a, b, label) => ({ kind: 'led', a, b, Vf: PARTS.ledRed.Vf, Ron: PARTS.ledRed.Ron, label });
for (const k of [1, 2, 3, 4]) {
  const list = []; for (let j = 0; j < k; j++) list.push(lemon(j, j + 1, 'chanh' + (j + 1)));
  list.push(wire(k, k + 1), led(k + 1, k + 2, 'LED đỏ'), wire(k + 2, 0));
  report(`${k} quả chanh + LED đỏ`, k + 3, list);
}
{ const list = []; for (let j = 0; j < 4; j++) list.push(lemon(j, j + 1, 'chanh' + (j + 1)));
  list.push(wire(4, 5), bulb(5, 6, 'bóng'), wire(6, 0));
  report('4 quả chanh + bóng sợi đốt', 7, list); }
// 9) LED reversed on 2 batteries
report('2 pin + LED lắp NGƯỢC', 5, [bat(0, 1, 'pin1'), bat(1, 2, 'pin2'), wire(2, 3), { ...led(4, 3, 'LED ngược') }, wire(4, 0)]);
report('2 pin + LED thuận + điện trở 100 Ω', 6, [bat(0, 1, 'pin1'), bat(1, 2, 'pin2'), wire(2, 3), led(3, 4, 'LED'), { kind: 'R', a: 4, b: 5, R: 100, label: 'điện trở' }, wire(5, 0)]);

// 10) timing: a 40-node ladder with 30 bulbs, 1000 solves
{
  const list = [bat(0, 1, 'pin'), bat(1, 2, 'pin2')];
  let node = 3;
  for (let k = 0; k < 30; k++) { list.push(wire(2, node), bulb(node, node + 1), wire(node + 1, 0)); node += 2; }
  const t0 = performance.now();
  for (let k = 0; k < 1000; k++) solve(node, list.map(e => ({ ...e })));
  console.log(`\n## Tốc độ: 1000 lần giải mạch ${node} nút / ${list.length} phần tử: ${(performance.now() - t0).toFixed(0)} ms`);
}
