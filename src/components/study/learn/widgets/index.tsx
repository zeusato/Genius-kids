// Chọn widget theo spec. `step` (ví dụ mẫu dạng tính) điều khiển phát lại từ ngoài.
import React from 'react';
import type { WidgetSpec } from '@/services/study/lessons/types';
import { Explore } from './Explore';
import { LongDivision } from './LongDivision';
import { ColumnArith } from './ColumnArith';
import { PlaceValue } from './PlaceValue';
import { UnitLadder } from './UnitLadder';

export function Widget({ spec, step }: { spec: WidgetSpec; step?: number }) {
    switch (spec.w) {
        case 'explore': return <Explore spec={spec} />;
        case 'long-division': return <LongDivision key={`${spec.a}:${spec.b}`} spec={spec} step={step} />;
        case 'column': return <ColumnArith key={`${spec.op}${spec.a}:${spec.b}`} spec={spec} step={step} />;
        case 'place-value': return <PlaceValue key={`${spec.mode}${spec.init}`} spec={spec} />;
        case 'unit-ladder': return <UnitLadder key={`${spec.kind}${spec.from}${spec.to}`} spec={spec} />;
    }
}
