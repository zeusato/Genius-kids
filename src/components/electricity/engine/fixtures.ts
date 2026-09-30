import { Circuit, emptyCircuit, newPart, Part, PartKind, postIds, ref, Wire } from './circuit';
export function wire(id: string, a: string, ap: string, b: string, bp: string): Wire { return { id, a: ref(a, ap), b: ref(b, bp) }; }
export function preset(name = 'single'): Circuit {
    const c = emptyCircuit(name);
    c.parts = [newPart('battery', 'B', 3, 4), newPart('bulb', 'L1', 10, 4)];
    const add = (kind: PartKind, id: string, x: number, z: number) => { const p = newPart(kind, id, x, z); c.parts.push(p); return p; };
    const series = (ids: string[]) => { c.wires = []; let prev = 'B', port = 'plus'; ids.forEach((id, i) => { const p = c.parts.find(p => p.id === id)!; const posts = postIds(p); c.wires.push(wire(`w${i}`, prev, port, id, posts[0])); prev = id; port = posts[1]; }); c.wires.push(wire(`w${ids.length}`, prev, port, 'B', 'minus')); };
    if (name === 'empty')
        return emptyCircuit();
    if (name === 'showcase') {
        // Mạch trưng bày cho ảnh sảnh: 2 pin → cầu dao → hai bóng song song.
        c.parts[0].cells!.push({ polarity: 1, charge01: 1, present: true });
        c.parts[1].z = 2;
        add('bulb', 'L2', 10, 6);
        add('switch', 'K', 6.5, 4).closed = true;
        c.wires = [wire('w0', 'B', 'plus', 'K', 'a'), wire('w1', 'K', 'b', 'L1', 'a'), wire('w2', 'K', 'b', 'L2', 'a'), wire('w3', 'L1', 'b', 'B', 'minus'), wire('w4', 'L2', 'b', 'B', 'minus')];
        return c;
    }
    if (name === 'intro')
        return c;
    if (name === 'series' || name === 'parallel' || name === 'batterySaver' || name === 'tetLights') {
        c.parts[1].z = 2;
        add('bulb', 'L2', 10, 6);
        if (name === 'series') {
            series(['L1', 'L2']);
        }
        else {
            c.wires = [wire('w0', 'B', 'plus', 'L1', 'a'), wire('w1', 'L1', 'b', 'B', 'minus'), wire('w2', 'B', 'plus', 'L2', 'a'), wire('w3', 'L2', 'b', 'B', 'minus')];
            c.presentationHints = { branchCorridors: { w0: 'upper', w1: 'upper', w2: 'lower', w3: 'lower' } };
        }
        if (name === 'tetLights') {
            delete c.presentationHints;
            c.parts[0].x = 2;
            c.parts[1].x = 7;
            c.parts[2].x = 7;
            add('bulb', 'L3', 11, 4);
            series(['L1', 'L2', 'L3']);
        }
        return c;
    }
    const twoCells = () => { c.parts[0].cells!.push({ polarity: 1, charge01: 1, present: true }); };
    if (['lantern', 'reversedLed', 'lemonLight'].includes(name)) {
        c.parts[1] = { ...newPart('led', 'L1', 10, 4) };
        if (name === 'lemonLight') {
            c.parts[0] = newPart('lemon', 'B', 3, 4);
            series(['L1']);
            return c;
        }
        twoCells();
        add('resistor', 'R', 7, 6);
        add('switch', 'K', 7, 2).closed = true;
        series(['K', 'R', 'L1']);
        if (name === 'reversedLed') {
            c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === 'L1' ? ref('L1', w.a.postId === 'anode' ? 'cathode' : 'anode') : w.a, b: w.b.partId === 'L1' ? ref('L1', w.b.postId === 'anode' ? 'cathode' : 'anode') : w.b }));
        }
        return c;
    }
    if (name === 'stairs') {
        add('spdt', 'K1', 6, 2);
        add('spdt', 'K2', 9, 2);
        c.parts[1].z = 6;
        c.wires = [wire('w0', 'B', 'plus', 'K1', 'common'), wire('w1', 'K1', 'throw0', 'K2', 'throw0'), wire('w2', 'K1', 'throw1', 'K2', 'throw1'), wire('w3', 'K2', 'common', 'L1', 'a'), wire('w4', 'L1', 'b', 'B', 'minus')];
        return c;
    }
    if (name === 'trafficLight') {
        c.parts = [c.parts[0]];
        twoCells();
        c.parts[0].cells!.push({ polarity: 1, charge01: 1, present: true });
        for (let i = 0; i < 3; i++) {
            const z = 1.5 + i * 2.5;
            const k = add('switch', `K${i + 1}`, 6, z);
            k.closed = i === 0;
            const r = add('resistor', `R${i + 1}`, 9, z);
            r.resistance = 220;
            const l = add('led', `L${i + 1}`, 12, z);
            l.color = (['red', 'green', 'yellow'] as const)[i];
            c.wires.push(wire(`w${i}a`, 'B', 'plus', k.id, 'a'), wire(`w${i}b`, k.id, 'b', r.id, 'a'), wire(`w${i}c`, r.id, 'b', l.id, 'anode'), wire(`w${i}d`, l.id, 'cathode', 'B', 'minus'));
        }
        return c;
    }
    if (['smartRoom', 'doorAlarm'].includes(name)) {
        twoCells();
        c.parts[1].z = 2;
        const l2 = add(name === 'smartRoom' ? 'motor' : 'bell', 'L2', 10, 6);
        const k1 = add('switch', 'K1', 6, 2);
        k1.closed = true;
        const k2 = add('switch', 'K2', 6, 6);
        k2.closed = true;
        c.wires = [wire('w0', 'B', 'plus', 'K1', 'a'), wire('w1', 'K1', 'b', 'L1', 'a'), wire('w2', 'L1', 'b', 'B', 'minus'), wire('w3', 'B', 'plus', 'K2', 'a'), wire('w4', 'K2', 'b', l2.id, 'a'), wire('w5', l2.id, 'b', 'B', 'minus')];
        if (name === 'doorAlarm') {
            c.parts = c.parts.filter(p => p.id !== 'K2');
            k1.actuator = 'doorContact';
            k1.doorClosed = true;
            c.wires = c.wires.filter(w => w.id !== 'w3' && w.id !== 'w4');
            c.wires.push(wire('w4', 'K1', 'b', 'L2', 'a'));
        }
        return c;
    }
    if (['doorbell', 'candleFan'].includes(name)) {
        twoCells();
        c.parts[1].kind = name === 'doorbell' ? 'bell' : 'motor';
    }
    if (['flashlight', 'doorbell', 'candleFan', 'missingWire', 'looseBulb', 'openSwitch', 'brokenFilament', 'emptyBattery', 'hiddenWireBreak', 'brokenSwitch', 'shortedLoad', 'blownFuse', 'insulatedClip', 'opposedCells', 'fuseRescue', 'switch'].includes(name)) {
        add(name === 'doorbell' ? 'button' : 'switch', 'K', 6, 2).closed = name !== 'openSwitch' && name !== 'doorbell';
        if (name === 'blownFuse' || name === 'fuseRescue') {
            add('fuse', 'F', 6, 6);
            series(['F', 'K', 'L1']);
        }
        else
            series(['K', 'L1']);
    }
    else
        series(['L1']);
    if (name === 'missingWire')
        c.wires.pop();
    if (name === 'looseBulb')
        c.parts[1].loose = true;
    if (name === 'brokenFilament')
        c.parts[1].broken = true;
    if (name === 'emptyBattery')
        c.parts[0].cells![0].charge01 = 0;
    if (name === 'hiddenWireBreak')
        c.wires[0].broken = true;
    if (name === 'brokenSwitch')
        c.parts.find(p => p.id === 'K')!.broken = true;
    if (name === 'shortedLoad')
        c.wires.push(wire('short', 'L1', 'a', 'L1', 'b'));
    if (name === 'blownFuse')
        c.parts.find(p => p.id === 'F')!.broken = true;
    if (name === 'insulatedClip') {
        add('sample', 'X', 6, 6).resistance = null;
        series(['K', 'X', 'L1']);
    }
    if (name === 'opposedCells') {
        twoCells();
        c.parts[0].cells![1].polarity = -1;
    }
    return c;
}
