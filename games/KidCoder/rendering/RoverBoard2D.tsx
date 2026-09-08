import React from 'react';
import { Board, World, key, same } from '../engine/model';
export function RoverBoard2D({ board, world, color }: { board: Board; world: World; color: string }) {
    const direction = ['↑','→','↓','←'][world.direction];
    return <div className="kc-board-2d" style={{ gridTemplateColumns: `repeat(${board.size},1fr)` }} role="img" aria-label={`Rover ở cột ${world.rover.x+1}, hàng ${world.rover.y+1}, hướng ${['lên','phải','xuống','trái'][world.direction]}.`}>
        {board.tiles.map((tile,i) => {
            const p = { x: i%board.size, y: Math.floor(i/board.size) }, sample = board.samples.find(v=>same(v,p)), device = board.devices.find(v=>same(v,p)), gate = board.gates.find(v=>same(v,p));
            const rover = same(world.rover,p), box = world.boxes.some(v=>same(v,p)), bridge = world.bridges.includes(key(p));
            const icon = rover ? direction : box ? '▣' : sample ? (world.scanned.includes(sample.id) ? '✓' : '◆') : device ? (world.activated.includes(device.id) ? '✓' : 'ϟ') : gate && !world.activated.includes(gate.device) ? '▥' : bridge ? '═' : same(board.exit,p) ? '⚑' : tile === 'wall' ? '•' : '';
            return <div key={i} className={`kc-tile ${tile} ${rover ? 'rover' : ''} ${sample ? 'sample' : ''} ${same(board.exit,p) ? 'exit' : ''}`} title={`Cột ${p.x+1}, hàng ${p.y+1}${sample ? ' · Mẫu tinh thể' : device ? ' · Thiết bị' : ''}`} style={rover ? { background: color } : undefined}>{icon}</div>;
        })}
    </div>;
}
