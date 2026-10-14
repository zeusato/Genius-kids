// Shared build/worker geometry. Every white component is retained, including tiny dots.
export function segment(gray, size) {
    const n = size * size, labels = new Uint16Array(n), queue = new Int32Array(n), regions = [];
    for (let start = 0; start < n; start++) {
        if (labels[start] || gray[start] < 160)
            continue;
        const id = regions.length + 1;
        if (id > 65534)
            throw Error('Quá nhiều vùng');
        let head = 0, tail = 1;
        queue[0] = start;
        labels[start] = id;
        let area = 0, bg = false, x0 = size, y0 = size, x1 = 0, y1 = 0;
        while (head < tail) {
            const p = queue[head++], x = p % size, y = p / size | 0;
            area++;
            bg ||= x === 0 || y === 0 || x === size - 1 || y === size - 1;
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
            if (x && !labels[p - 1] && gray[p - 1] >= 160) {
                labels[p - 1] = id;
                queue[tail++] = p - 1;
            }
            if (x < size - 1 && !labels[p + 1] && gray[p + 1] >= 160) {
                labels[p + 1] = id;
                queue[tail++] = p + 1;
            }
            if (y && !labels[p - size] && gray[p - size] >= 160) {
                labels[p - size] = id;
                queue[tail++] = p - size;
            }
            if (y < size - 1 && !labels[p + size] && gray[p + size] >= 160) {
                labels[p + size] = id;
                queue[tail++] = p + size;
            }
        }
        regions.push({ id, area, bg, bbox: [x0, y0, x1, y1], anchor: [start % size, start / size | 0], inr: 0, d: '' });
    }
    // Distance from region boundaries finds labels/number positions INSIDE concave regions.
    const dist = new Uint16Array(n);
    dist.fill(60000);
    for (let p = 0; p < n; p++) {
        const x = p % size, y = p / size | 0;
        if (!labels[p] || !x || !y || x === size - 1 || y === size - 1)
            dist[p] = 0;
        else
            dist[p] = Math.min(dist[p - 1] + 1, dist[p - size] + 1, dist[p - size - 1] + 2);
    }
    for (let p = n - 1; p >= 0; p--) {
        const x = p % size, y = p / size | 0;
        if (x < size - 1 && y < size - 1)
            dist[p] = Math.min(dist[p], dist[p + 1] + 1, dist[p + size] + 1, dist[p + size + 1] + 2);
        const r = regions[labels[p] - 1];
        if (r && dist[p] > r.inr) {
            r.inr = dist[p];
            r.anchor = [x + .5, y + .5];
        }
    }
    return { labels, regions };
}
export function contours(labels, size) {
    const w = size + 1, groups = new Map();
    const add = (id, a, b) => { if (!groups.has(id))
        groups.set(id, new Map()); const e = groups.get(id); if (!e.has(a))
        e.set(a, []); e.get(a).push(b); };
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const p = y * size + x, id = labels[p], a = y * w + x, b = a + 1, c = a + w, d = c + 1;
            if (!y || labels[p - size] !== id)
                add(id, a, b);
            if (x === size - 1 || labels[p + 1] !== id)
                add(id, b, d);
            if (y === size - 1 || labels[p + size] !== id)
                add(id, d, c);
            if (!x || labels[p - 1] !== id)
                add(id, c, a);
        }
    const paths = new Map(), dir = (a, b) => b - a === 1 ? 0 : b - a === w ? 1 : b - a === -1 ? 2 : 3;
    for (const [id, edges] of groups) {
        const parts = [];
        while (edges.size) {
            const start = edges.keys().next().value;
            let a = start, last = 0;
            const pts = [];
            do {
                pts.push(a);
                const choices = edges.get(a);
                if (!choices?.length)
                    throw Error('Đường bao hở');
                const order = [(last + 1) % 4, last, (last + 3) % 4, (last + 2) % 4];
                let k = 0;
                if (choices.length > 1)
                    k = choices.map((b, i) => ({ i, r: order.indexOf(dir(a, b)) })).sort((u, v) => u.r - v.r)[0].i;
                const b = choices.splice(k, 1)[0];
                if (!choices.length)
                    edges.delete(a);
                last = dir(a, b);
                a = b;
            } while (a !== start);
            parts.push(pts.filter((p, i) => dir(pts[(i + pts.length - 1) % pts.length], p) !== dir(p, pts[(i + 1) % pts.length])).map((p, i) => (i ? 'L' : 'M') + (p % w) + ' ' + (p / w | 0)).join('') + 'Z');
        }
        paths.set(id, parts.join(''));
    }
    return paths;
}
export function encodeMap(labels, size) { const pairs = []; for (let p = 0; p < labels.length;) {
    const id = labels[p];
    let end = p + 1;
    while (end < labels.length && labels[end] === id && end - p < 65535)
        end++;
    pairs.push(id, end - p);
    p = end;
} const out = new Uint8Array(8 + pairs.length * 2), v = new DataView(out.buffer); out.set([82, 71, 78, 49]); v.setUint16(4, size, true); v.setUint16(6, size, true); pairs.forEach((x, i) => v.setUint16(8 + i * 2, x, true)); return out; }
export function decodeMap(bytes) { const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); if (bytes.length < 8 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RGN1' || (bytes.length - 8) % 4)
    throw Error('Bản đồ vùng không hợp lệ'); const w = v.getUint16(4, true), h = v.getUint16(6, true); if (!w || w !== h || w > 2048)
    throw Error('Kích thước không hợp lệ'); const labels = new Uint16Array(w * h); let p = 0; for (let i = 8; i < bytes.length; i += 4) {
    const id = v.getUint16(i, true), n = v.getUint16(i + 2, true);
    if (!n || p + n > labels.length)
        throw Error('Dữ liệu vùng bị hỏng');
    labels.fill(id, p, p + n);
    p += n;
} if (p !== labels.length)
    throw Error('Thiếu dữ liệu vùng'); return labels; }
