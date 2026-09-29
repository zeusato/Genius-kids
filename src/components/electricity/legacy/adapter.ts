import { CHALLENGES } from '../../../data/electricityData';
import { ContentSpec } from '../../../data/electricity/content';
import { Circuit, newPart } from '../engine/circuit';
import { preset, wire } from '../engine/fixtures';
/** Original 15 briefs, now evaluated by the numerical engine; practice never awards stars. */
export const LEGACY_CONTENT: ContentSpec[] = CHALLENGES.map(c => ({ id: `legacy-${c.id}`, modelVersion:1,isIllustrative:true,revision: 1, release: 1, kind: 'mission', title: c.title, intro: c.description, initialCircuitId: `legacy-${c.id}`, canonicalLayoutId: `legacy-${c.id}-14x8-v1`, minimumTools: ['battery'], allowedParts: ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'junction'], curriculumTags: ['KH5-core'], steps: [{ id: `legacy-${c.id}-function`, text: c.description, predicate: `legacy-${c.id}`, audioKey: `electricity.legacy.${c.id}` }, { id: `legacy-${c.id}-verify`, text: 'Giữ mạch khỏe và kiểm tra điều khiển nếu đề yêu cầu.', predicate: `legacy-${c.id}`, audioKey: `electricity.legacy.${c.id}.verify` }], hintRules: [c.hint ?? 'Lần theo đường dây.', 'Mỗi tải cần đường đi kín về nguồn.', 'Cầu dao phải thật sự ngắt đường cấp điện cho tải.'], takeaway: 'Đã luyện lại đề cũ bằng mô hình mạch điện mới.', sourceIds: ['MODEL-DC'], build: true }));
export function legacyPreset(id: string): Circuit {
    const code = id.replace('legacy-', '');
    let c = preset(['h1', 'h3'].includes(code) ? 'smartRoom' : ['m2'].includes(code) ? 'parallel' : ['m1', 'm6'].includes(code) ? code === 'm6' ? 'tetLights' : 'series' : 'flashlight');
    c.id = id;
    if (['e4', 'e5', 'e1'].includes(code)) {
        c = preset('single');
        c.parts[1].kind = code === 'e4' ? 'buzzer' : code === 'e5' ? 'motor' : 'bulb';
    }
    if (['e3', 'm3', 'm4'].includes(code)) {
        c = preset(code === 'e3' ? 'doorbell' : 'candleFan');
    }
    if (['m5', 'h2', 'h4'].includes(code)) {
        c = preset('doorAlarm');
        const k = c.parts.find(p => p.id === 'K1')!;
        delete k.actuator;
        delete k.doorClosed;
        k.closed = true;
        if (code === 'h2')
            c.parts.find(p => p.id === 'L1')!.kind = 'buzzer';
        if (code === 'h4') {
            c.parts.push(newPart('motor', 'L3', 11, 4));
            c.wires.push(wire('third-a', 'K1', 'b', 'L3', 'a'), wire('third-b', 'L3', 'b', 'B', 'minus'));
        }
    }
    if (code === 'm1') {
        c.parts.push({ ...newPart('switch', 'K', 6, 4), closed: true });
        const first = c.wires[0];
        c.wires[0] = wire('w0', 'B', 'plus', 'K', 'a');
        c.wires.push(wire('switch-wire', 'K', 'b', first.b.partId, first.b.postId));
    }
    if (code === 'h1')
        c.parts.find(p => p.id === 'L2')!.kind = 'bulb';
    c.id = id;
    return c;
}
