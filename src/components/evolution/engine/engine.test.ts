import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { EVOLUTION_TREE_DATA } from '../../../data/evolutionData';
import { SPLIT_TIMES, EXTINCT } from '../../../data/evolution/times';
import { KID } from '../../../data/evolution/kid';
import { TEXTBOOK_GROUPS, SYMBIOSES } from '../../../data/evolution/overlays';
import { KEY_START, MYSTERY_KEY, MYSTERY_NAMES, RELATIVES_BANK, JOURNEY_STOPS } from '../../../data/evolution/games';
import { TIME_EVENTS } from '../../../data/evolution/events';
import { buildTree, idx, isAncestor, mrca, outline, pathToRoot } from './tree';
import { resolveTimes, displayTime } from './times';
import { cosmicDate, formatMa, frac, fracEras, KNOTS, maAtFrac } from './timeScale';
import { fanBounds, layoutPolar, LAYOUT, pointOnBranchAtFrac, project, rotate, buildRibbon } from './layout';
import { searchNodes, normalizeVi } from './search';
import { journeyStops, relativesAnswer, solveKey, mulberry32, pickRound } from './games';
import { placeLabels } from './lod';

const tree = buildTree(EVOLUTION_TREE_DATA);
const times = resolveTimes(tree);

describe('dữ liệu cây', () => {
    it('khớp đúng dàn ý docs/evolution-tree-wow/target-tree.txt', () => {
        const target = readFileSync('docs/evolution-tree-wow/target-tree.txt', 'utf8').split(/\r?\n/).filter(l => l.trim())
            .map(l => l.replace(/\s+[*X](\s+[*X])*\s*$/, '').replace(/\s+$/, ''));
        expect(outline(tree)).toEqual(target);
    });
    it('251 node, 116 ngọn, id duy nhất', () => {
        expect(tree.nodes.length).toBe(251);
        expect(tree.leaves.length).toBe(116);
        expect(new Set(tree.nodes.map(n => n.id)).size).toBe(251);
    });
    it('mọi node có câu cho bé, không thừa id', () => {
        for (const n of tree.nodes) expect(KID[n.id], n.id).toBeTruthy();
        for (const id of Object.keys(KID)) expect(tree.byId.has(id), id).toBe(true);
    });
    it('chỉ người có ghim "Bạn ở đây"; 8 nhóm tuyệt chủng', () => {
        expect(tree.nodes.filter(n => n.data.youAreHere).map(n => n.id)).toEqual(['humans']);
        expect(tree.nodes.filter(n => n.extinct).length).toBe(8);
    });
    it('lớp phủ, cộng sinh, sự kiện chỉ tham chiếu id có thật', () => {
        for (const g of TEXTBOOK_GROUPS) {
            const ids = g.members ?? g.parts!.flatMap(p => p.members);
            expect(ids.length, g.id).toBeGreaterThan(0);
            for (const id of ids) expect(tree.byId.has(id), `${g.id}:${id}`).toBe(true);
        }
        for (const s of SYMBIOSES) { expect(tree.byId.has(s.from)).toBe(true); expect(tree.byId.has(s.to)).toBe(true); }
        expect(TIME_EVENTS.every((e, k) => k === 0 || e.ma < TIME_EVENTS[k - 1].ma)).toBe(true);
    });
    it('không lãng phí tranh: đủ 229 infographic của cây cũ vẫn mở được (node, bộ sưu tập, lớp phủ SGK)', () => {
        const urls = new Set<string>();
        for (const n of tree.nodes) {
            if (n.data.infographicUrl) urls.add(n.data.infographicUrl);
            for (const g of n.data.gallery?.items ?? []) if (g.infographicUrl) urls.add(g.infographicUrl);
        }
        for (const g of TEXTBOOK_GROUPS) if (g.infographicUrl) urls.add(g.infographicUrl);
        expect(urls.size).toBe(229);
    });
    it('sector: nấm cạnh động vật, eukarya là thân cây', () => {
        const s = (id: string) => tree.nodes[idx(tree, id)].sector;
        expect(s('eukarya')).toBe('trunk');
        expect(s('humans')).toBe('animal');
        expect(s('agaricus_example')).toBe('fungi');
        expect(s('kelp_example')).toBe('protist');
        expect(s('lokiarchaeum_example')).toBe('archaea');
        expect(s('ferns')).toBe('plant');
    });
});

describe('thời gian', () => {
    it('mọi node rẽ nhánh có thời gian, con luôn trẻ hơn cha', () => {
        for (const n of tree.nodes) {
            if (n.children.length >= 2) expect(SPLIT_TIMES[n.id], n.id).toBeTruthy();
            if (n.i) expect(times.ma[n.i], n.id).toBeLessThan(times.ma[n.parent]);
        }
    });
    it('ngọn còn sống kéo tới 0, tuyệt chủng dừng ở endMa', () => {
        expect(times.ma[idx(tree, 'humans')]).toBe(0);
        expect(times.ma[idx(tree, 'trex')]).toBe(66);
        expect(times.ma[idx(tree, 'trilobites')]).toBe(252);
        for (const id of Object.keys(EXTINCT)) expect(tree.nodes[idx(tree, id)].isLeaf).toBe(true);
    });
    it('node chuỗi được nội suy và không hiện số', () => {
        const i = idx(tree, 'nostocales');
        expect(times.approx[i]).toBe(1);
        expect(displayTime(tree, times, i)).not.toMatch(/\d/);
    });
    it('câu thời gian', () => {
        expect(displayTime(tree, times, idx(tree, 'amniotes'))).toMatch(/318 triệu/);
        expect(displayTime(tree, times, idx(tree, 'luca'))).toMatch(/4 tỷ/);
        expect(displayTime(tree, times, idx(tree, 'proteobacteria'))).toMatch(/Rất xa xưa/);
    });
});

describe('thang thời gian', () => {
    it('knot đúng tại ranh giới, đơn điệu, nghịch đảo được', () => {
        for (const [ma, f] of KNOTS) expect(fracEras(ma)).toBeCloseTo(f, 9);
        let prev = -1;
        for (let ma = 4540; ma >= 0; ma -= 7) { const f = fracEras(ma); expect(f).toBeGreaterThanOrEqual(prev); prev = f; }
        for (const ma of [4200, 1800, 540, 66, 6.5, 0.3]) {
            for (const mix of [0, 0.35, 1]) expect(maAtFrac(frac(ma, mix), mix)).toBeCloseTo(ma, 1);
        }
    });
    it('formatMa', () => {
        expect(formatMa(1800)).toBe('khoảng 1,8 tỷ năm trước');
        expect(formatMa(430)).toBe('khoảng 430 triệu năm trước');
        expect(formatMa(6.5)).toBe('khoảng 6,5 triệu năm trước');
        expect(formatMa(0.3)).toBe('khoảng 300.000 năm trước');
        expect(formatMa(0.004)).toBe('khoảng 4.000 năm trước');
    });
    it('lịch vũ trụ 1 năm', () => {
        expect(cosmicDate(4540).text).toBe('1/1 lúc 00:00');
        expect(cosmicDate(66).text).toBe('26/12 lúc 16:39');
        expect(cosmicDate(0.3).text).toBe('31/12 lúc 23:25');
    });
});

describe('bố cục quạt', () => {
    const polar = layoutPolar(tree, times);
    const pr = project(tree, polar, times, 0, 'landscape');
    it('ngọn nằm đúng bán kính mốc cuối, con xa tâm hơn cha', () => {
        for (const l of tree.leaves) {
            const r = Math.hypot(pr.nodeXY[l * 2], pr.nodeXY[l * 2 + 1]);
            expect(r).toBeCloseTo(LAYOUT.R * fracEras(times.ma[l]), 2);
        }
        for (const n of tree.nodes) if (n.i) expect(pr.nodeFrac[n.i]).toBeGreaterThan(pr.nodeFrac[n.parent]);
    });
    it('ngọn liền nhau cách nhau ≥ 21 đơn vị ở vành, nằm trong dải góc', () => {
        for (let k = 1; k < tree.leaves.length; k++) {
            const d = (polar.theta[tree.leaves[k - 1]] - polar.theta[tree.leaves[k]]) * LAYOUT.R;
            expect(d).toBeGreaterThanOrEqual(21);
        }
        for (const l of tree.leaves) { expect(polar.theta[l]).toBeLessThan(LAYOUT.SPAN_START); expect(polar.theta[l]).toBeGreaterThan(LAYOUT.SPAN_END); }
    });
    it('thứ tự sector từ trái sang phải', () => {
        const seq: string[] = [];
        for (const l of tree.leaves) { const s = tree.nodes[l].sector; if (seq[seq.length - 1] !== s) seq.push(s); }
        expect(seq).toEqual(['bacteria', 'archaea', 'protist', 'fungi', 'animal', 'plant', 'protist']);
    });
    it('màn dọc = màn ngang giãn theo chiều đứng (cây vẫn mọc lên); thời gian thật đẩy ngọn sống ra vành', () => {
        const pp = project(tree, polar, times, 0, 'portrait');
        const i = idx(tree, 'mammals');
        const [x, y] = rotate('portrait', pr.nodeXY[i * 2], pr.nodeXY[i * 2 + 1]);
        expect(pp.nodeXY[i * 2]).toBeCloseTo(x, 3); expect(pp.nodeXY[i * 2 + 1]).toBeCloseTo(y, 3);
        const pl = project(tree, polar, times, 1, 'landscape');
        const h = idx(tree, 'humans');
        expect(Math.hypot(pl.nodeXY[h * 2], pl.nodeXY[h * 2 + 1])).toBeCloseTo(LAYOUT.R, 2);
        const [bx0, , bx1] = fanBounds('landscape');
        expect(bx1 - bx0).toBeGreaterThan(2 * LAYOUT.R);
    });
    it('ribbon + điểm trên cành', () => {
        const rb = buildRibbon(tree, polar, pr);
        expect(rb.index.length).toBe(polar.branches.length * LAYOUT.SAMPLES * 6);
        const h = idx(tree, 'humans');
        const [x, y] = pointOnBranchAtFrac(polar, pr, h, 1);
        expect(Math.hypot(x, y)).toBeCloseTo(LAYOUT.R, 1);
    });
});

describe('tìm kiếm', () => {
    it('bỏ dấu + tên gọi quen', () => {
        expect(normalizeVi('Cá Mập')).toBe('ca map');
        expect(tree.nodes[searchNodes(tree, 'ca map')[0]].id).toBe('cartilaginous_fish');
        expect(tree.nodes[searchNodes(tree, 'khung long')[0]].id).toBe('dinosaurs');
        expect(tree.nodes[searchNodes(tree, 'nguoi')[0]].id).toBe('humans');
        expect(tree.nodes[searchNodes(tree, 'E. coli')[0]].id).toBe('ecoli_example');
    });
});

describe('trò chơi', () => {
    it('22 câu họ hàng đều đúng theo cây, không hòa, không dùng nhóm gộp', () => {
        expect(RELATIVES_BANK.length).toBe(22);
        for (const q of RELATIVES_BANK) {
            expect(relativesAnswer(tree, q), `${q.a}`).toBe(q.answer);
            for (const id of [q.a, q.b, q.c]) expect(tree.nodes[idx(tree, id)].data.grade, id).toBeFalsy();
        }
    });
    it('khóa lưỡng phân đưa mọi bí ẩn tới đúng kết quả', () => {
        const results = new Set<string>();
        for (const q of Object.values(MYSTERY_KEY)) for (const nx of [q.yes, q.no]) if ('result' in nx) results.add(nx.result);
        expect(results.size).toBe(18);
        for (const r of results) {
            expect(MYSTERY_NAMES[r], r).toBeTruthy();
            expect(solveKey(tree, KEY_START, r).result).toBe(r);
        }
        for (const q of Object.values(MYSTERY_KEY)) {
            expect(tree.byId.has(q.truth)).toBe(true);
            if (q.flyNo) expect(tree.byId.has(q.flyNo)).toBe(true);
        }
    });
    it('hành trình về tổ tiên của Người', () => {
        const stops = journeyStops(tree, 'humans').map(i => tree.nodes[i].id);
        expect(stops[0]).toBe('hominini');
        expect(stops[stops.length - 1]).toBe('luca');
        for (const id of JOURNEY_STOPS) expect(tree.byId.has(id), id).toBe(true);
        expect(isAncestor(tree, idx(tree, 'archaea'), idx(tree, 'humans'))).toBe(true);
        expect(tree.nodes[mrca(tree, idx(tree, 'humans'), idx(tree, 'agaricus_example'))].id).toBe('opisthokonta');
        expect(pathToRoot(tree, idx(tree, 'humans')).length).toBe(29);
    });
    it('bốc câu có seed', () => {
        const a = pickRound(RELATIVES_BANK, 8, mulberry32(7)), b = pickRound(RELATIVES_BANK, 8, mulberry32(7));
        expect(a).toEqual(b);
        expect(new Set(a).size).toBe(8);
    });
});

describe('nhãn', () => {
    it('không chồng nhau, theo ưu tiên, trong khung', () => {
        const c = [
            { i: 1, x: 100, y: 100, w: 80, h: 20, prio: 10, gap: 6 },
            { i: 2, x: 104, y: 102, w: 80, h: 20, prio: 50, gap: 6 },
            { i: 3, x: 790, y: 100, w: 80, h: 20, prio: 5, gap: 6 },
        ];
        const out = placeLabels(c, 10, 800, 600);
        expect(out[0].i).toBe(2);
        const rects = out.map(o => [o.x, o.y, o.x + 80, o.y + 20]);
        for (let a = 0; a < rects.length; a++) for (let b = a + 1; b < rects.length; b++) {
            const [p, q] = [rects[a], rects[b]];
            expect(p[0] < q[2] && p[2] > q[0] && p[1] < q[3] && p[3] > q[1]).toBe(false);
        }
        for (const r of rects) expect(r[2]).toBeLessThanOrEqual(798);
    });
});
