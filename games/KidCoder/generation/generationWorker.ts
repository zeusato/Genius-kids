import { generatePractice } from './practice';
self.onmessage = (event: MessageEvent<{ seed: number; unlockedIds: string[] }>) => {
    try { self.postMessage({ mission: generatePractice(event.data.seed, event.data.unlockedIds) }); }
    catch { self.postMessage({ error: 'Chưa chuẩn bị được bản đồ. Hãy chọn một nhiệm vụ trong hành trình nhé.' }); }
};
