// Read-only validation of the research prototype, not production solver tests.
// Expectations below use independent series/parallel/KCL formulas, never its log snapshot.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const source = readFileSync(new URL('./mna-proto.mjs', import.meta.url), 'utf8');
const marker = 'const B = PARTS.battery, L = PARTS.bulb, W = PARTS.wire.R;';
assert.equal(source.split(marker).length, 2, 'Prototype boundary changed: review adapter');
const context = createContext({});
new Script(`${source.slice(0, source.indexOf(marker))}\nglobalThis.adapter = { solve, PARTS };`, {
  filename: 'mna-proto-adapter.mjs',
}).runInContext(context, { timeout: 1000 });
const { solve: rawSolve, PARTS } = context.adapter;
const solve = (nodes, branches) => rawSolve(nodes, structuredClone(branches));
const R = (a, b, value, label) => ({ kind: 'R', a, b, R: value, label });
const S = (a, b, E = 1.5, r = 0.2, label = 'source') => ({ kind: 'src', a, b, E, r, label });
const D = (a, b, label = 'led') => ({ kind: 'led', a, b, Vf: 1.8, Ron: 15, label });
const W = (a, b) => R(a, b, 0.02, 'wire');
const lampR = 2.5 / 0.3;
const near = (actual, expected, label, absolute = 1e-8) => {
  assert.ok(Number.isFinite(actual), `${label}: not finite`);
  const tolerance = Math.max(absolute, Math.abs(expected) * 1e-6);
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: actual ${actual}, expected ${expected}, tolerance ${tolerance}`);
};
const branch = (result, name) => {
  const found = result.find(item => item.label === name);
  assert.ok(found, `Missing branch ${name}`);
  return found;
};
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log(`PASS ${String(count).padStart(2)} ${name}`);
}

test('Fixture constants match the reviewed teaching model', () => {
  near(PARTS.battery.E, 1.5, 'AA voltage');
  near(PARTS.battery.r, 0.2, 'AA resistance');
  near(PARTS.bulb.R, lampR, 'lamp resistance');
  near(PARTS.bulb.Prated, 0.75, 'lamp rating');
  near(PARTS.lemon.E, 0.95, 'lemon voltage');
  near(PARTS.lemon.r, 450, 'lemon resistance');
});

for (const cells of [1, 2, 4]) {
  test(`${cells} AA cell(s), one lamp: Ohm's law`, () => {
    const list = Array.from({ length: cells }, (_, i) => S(i, i + 1));
    list.push(W(cells, cells + 1), R(cells + 1, cells + 2, lampR, 'lamp'), W(cells + 2, 0));
    const result = solve(cells + 3, list);
    const expectedI = 1.5 * cells / (0.2 * cells + 0.04 + lampR);
    const lamp = branch(result, 'lamp');
    near(lamp.i, expectedI, 'lamp current');
    near(lamp.v, expectedI * lampR, 'lamp voltage');
    near(lamp.i * lamp.v / 0.75, expectedI ** 2 * lampR / 0.75, 'power fraction');
  });
}

test('Two lamps in series: same current, divided voltage', () => {
  const result = solve(5, [S(0, 1), W(1, 2), R(2, 3, lampR, 'a'), R(3, 4, lampR, 'b'), W(4, 0)]);
  const expected = 1.5 / (0.2 + 0.04 + 2 * lampR);
  near(branch(result, 'a').i, expected, 'series a');
  near(branch(result, 'b').i, expected, 'series b');
});

test('Two lamps in parallel: KCL, source droop, less than twice single current', () => {
  const result = solve(4, [S(0, 1), W(1, 2), R(2, 3, lampR, 'a'), R(2, 3, lampR, 'b'), W(3, 0)]);
  const total = 1.5 / (0.2 + 0.04 + lampR / 2);
  near(branch(result, 'source').i, total, 'source current');
  near(branch(result, 'a').i, total / 2, 'branch a');
  near(branch(result, 'b').i, total / 2, 'branch b');
  assert.ok(total < 2 * 1.5 / (0.2 + 0.04 + lampR));
});

test('Teaching preset: parallel lamps each have two independent leads (four wires)', () => {
  const result = solve(6, [S(0, 1), W(1, 2), R(2, 3, lampR, 'a'), W(3, 0),
    W(1, 4), R(4, 5, lampR, 'b'), W(5, 0)]);
  const expectedTotal = 1.5 / (0.2 + (lampR + 0.04) / 2);
  const expectedBranch = expectedTotal / 2;
  near(branch(result, 'source').i, expectedTotal, 'four-wire source');
  for (const name of ['a', 'b']) {
    const lamp = branch(result, name);
    near(lamp.i, expectedBranch, `four-wire ${name} current`);
    near(lamp.v, expectedBranch * lampR, `four-wire ${name} voltage`);
    near(lamp.i * lamp.v / 0.75, expectedBranch ** 2 * lampR / 0.75, `four-wire ${name} power fraction`);
  }
  for (const wire of result.filter(item => item.label === 'wire')) near(wire.i, expectedBranch, 'independent lead');
});

test('Teaching preset: two series lamps joined by three physical wires', () => {
  const result = solve(6, [S(0, 1), W(1, 2), R(2, 3, lampR, 'a'), W(3, 4),
    R(4, 5, lampR, 'b'), W(5, 0)]);
  const expected = 1.5 / (0.2 + 0.06 + 2 * lampR);
  near(branch(result, 'source').i, expected, 'three-wire source');
  for (const name of ['a', 'b']) {
    const lamp = branch(result, name);
    near(lamp.i, expected, `three-wire ${name} current`);
    near(lamp.v, expected * lampR, `three-wire ${name} voltage`);
    near(lamp.i * lamp.v / 0.75, expected ** 2 * lampR / 0.75, `three-wire ${name} power fraction`);
  }
});

test('Short beside lamp: divider predicts residual nonzero lamp current', () => {
  const result = solve(4, [S(0, 1), R(1, 0, 0.02, 'short'), W(1, 2), R(2, 3, lampR, 'lamp'), W(3, 0)]);
  const loadR = lampR + 0.04;
  const equivalent = 1 / (1 / 0.02 + 1 / loadR);
  const total = 1.5 / (0.2 + equivalent);
  const terminalV = total * equivalent;
  near(branch(result, 'source').i, total, 'short source');
  near(branch(result, 'short').i, terminalV / 0.02, 'short wire');
  near(branch(result, 'lamp').i, terminalV / loadR, 'residual lamp current');
  assert.ok(branch(result, 'lamp').i > 0, 'Do not force current to zero for visuals');
});

for (const cells of [1, 2, 3, 4]) {
  test(`${cells} lemon cell(s), LED: piecewise-linear analytic oracle`, () => {
    const list = Array.from({ length: cells }, (_, i) => S(i, i + 1, 0.95, 450));
    list.push(W(cells, cells + 1), D(cells + 1, cells + 2), W(cells + 2, 0));
    const result = solve(cells + 3, list);
    const expected = Math.max(0, (cells * 0.95 - 1.8) / (cells * 450 + 0.04 + 15));
    near(branch(result, 'led').i, expected, 'lemon LED current');
  });
}

test('Four lemons with filament lamp: tiny power, not zero current', () => {
  const result = solve(7, [S(0, 1, 0.95, 450), S(1, 2, 0.95, 450), S(2, 3, 0.95, 450),
    S(3, 4, 0.95, 450), W(4, 5), R(5, 6, lampR, 'lamp'), W(6, 0)]);
  near(branch(result, 'lamp').i, 3.8 / (1800 + 0.04 + lampR), 'lemon lamp current');
});

test('Reverse LED blocks current', () => {
  const result = solve(4, [S(0, 1, 3, 0.4), W(1, 2), D(3, 2), W(3, 0)]);
  near(branch(result, 'led').i, 0, 'reverse LED');
  near(branch(result, 'source').i, 0, 'reverse source', 1e-7);
});

test('Forward LED and 100 ohms: independent sum of voltage drops', () => {
  const result = solve(5, [S(0, 1, 3, 0.4), W(1, 2), D(2, 3), R(3, 4, 100, 'resistor'), W(4, 0)]);
  near(branch(result, 'led').i, (3 - 1.8) / (0.4 + 0.04 + 15 + 100), 'protected LED');
});

test('Opposing identical AA cells cancel their electromotive forces', () => {
  const result = solve(5, [S(0, 1), S(1, 2, -1.5), W(2, 3), R(3, 4, lampR, 'lamp'), W(4, 0)]);
  near(branch(result, 'lamp').i, 0, 'opposed lamp current');
});

test('Dangling lamp on live node carries no meaningful current', () => {
  const result = solve(5, [S(0, 1), W(1, 2), R(2, 3, lampR, 'live'), W(3, 0), R(1, 4, lampR, 'stub')]);
  near(branch(result, 'stub').i, 0, 'dead stub');
});

test('Floating disconnected resistor island has no source', () => {
  const result = solve(6, [S(0, 1), R(1, 0, lampR, 'live'), R(2, 3, 10, 'island1'),
    R(3, 4, 20, 'island2'), R(4, 2, 30, 'island3'), R(4, 5, 5, 'island4')]);
  for (const item of result.filter(item => item.label.startsWith('island'))) near(item.i, 0, item.label);
});

test('Balanced bridge: reachable load can still have zero current', () => {
  const result = solve(4, [S(0, 1), R(1, 2, 100, 'upperA'), R(2, 0, 100, 'lowerA'),
    R(1, 3, 100, 'upperB'), R(3, 0, 100, 'lowerB'), R(2, 3, lampR, 'bridge')]);
  near(branch(result, 'bridge').i, 0, 'balanced bridge');
  near(branch(result, 'source').i, 1.5 / (100 + 0.2), 'bridge source');
});

test('Closed resistor network conserves energy', () => {
  const result = solve(4, [S(0, 1, 3, 0.4), W(1, 2), R(2, 3, lampR, 'a'),
    R(2, 3, 12, 'b'), W(3, 0)]);
  const generated = result.filter(item => item.kind === 'src').reduce((sum, item) => sum + item.E * item.i, 0);
  const dissipated = result.reduce((sum, item) => sum + item.i ** 2 * (item.kind === 'src' ? item.r : item.R), 0);
  near(generated, dissipated, 'energy conservation', 1e-7);
});

console.log(`\n${count} checks passed against independent analytical expectations.`);
console.log('Scope: research prototype only; no production event loop, fuse, motor, UI, topology, or convergence-failure coverage.');
console.log('Known prototype limits: mutates LED input, unsigned voltage output, global shunts, no convergence/error result.');
