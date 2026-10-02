// Chọn widget theo spec. Widget chưa làm (GĐ2) hiện khung báo "đang chuẩn bị" thay vì lỗi.
import React from 'react';
import type { WidgetSpec } from '@/services/study/lessons/types';
import { Explore } from './Explore';
import { LongDivision } from './LongDivision';

export function Widget({ spec, step }: { spec: WidgetSpec; step?: number }) {
    switch (spec.w) {
        case 'explore': return <Explore spec={spec} />;
        case 'long-division': return <LongDivision key={`${spec.a}:${spec.b}`} spec={spec} step={step} />;
        default: return <div className="learn-widget"><p className="explore-warn">Phần thao tác này đang được chuẩn bị.</p></div>;
    }
}
