import { segment, contours } from '../engine/geometry.mjs';
self.onmessage = (e: MessageEvent<{
    gray: Uint8Array;
    size: number;
}>) => { try {
    const { gray, size } = e.data, { labels, regions } = segment(gray, size), paths = contours(labels, size);
    const rs = regions.map(r => ({ ...r, d: paths.get(r.id), color: r.id % 8, name: `Vùng ${r.id}`, decor: r.area < 16 }));
    self.postMessage({ labels, regions: rs, ink: paths.get(0) || '' }, [labels.buffer]);
}
catch (error) {
    self.postMessage({ error: String(error) });
} };
