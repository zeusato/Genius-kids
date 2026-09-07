import { createRegion, Preset } from '../engine/region';
self.onmessage = (event: MessageEvent<{ id: number; preset: Preset; seed: number }>) => {
    try {
        const region = createRegion(event.data.preset, event.data.seed);
        self.postMessage({ id: event.data.id, region }, { transfer: [region.height.buffer, region.biome.buffer, region.roads.buffer] });
    } catch (error) { self.postMessage({ id: event.data.id, error: String(error) }); }
};
