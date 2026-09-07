import { BUILDINGS, footprint, heightAt, Region, SIZE, STRIDE } from '../engine/region';
export function regionThumbnail(r: Region): string {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const colors = ['#79a76a', '#79a76a', '#dec68f', '#8e9298', '#e7eff5', '#ed7342'];
    for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) { ctx.fillStyle = heightAt(r, x + .5, z + .5) <= r.seaLevel ? '#61b5cd' : r.roads[z * SIZE + x] ? '#d1c9b7' : colors[r.biome[(z * 2) * STRIDE + x * 2]]; ctx.fillRect(x * 2, z * 2, 2, 2); }
    for (const tree of r.trees) { if (heightAt(r, tree.x, tree.z) <= r.seaLevel) continue; ctx.fillStyle = '#43825d'; ctx.fillRect(tree.x * 2, tree.z * 2, 2, 2); }
    for (const b of r.buildings) { const [w, d] = footprint(b.type, b.yaw); ctx.fillStyle = b.color || BUILDINGS[b.type].color; ctx.fillRect(b.x * 2, b.z * 2, w * 2, d * 2); ctx.strokeStyle = '#f1ecd1'; ctx.lineWidth = .5; ctx.strokeRect(b.x * 2, b.z * 2, w * 2, d * 2); }
    return canvas.toDataURL('image/png');
}
