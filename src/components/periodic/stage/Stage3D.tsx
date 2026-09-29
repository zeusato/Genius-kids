// Ghép canvas dùng chung với nội dung theo chế độ (chunk lazy — trang chỉ tải khi cần 3D).
import React from 'react';
import { PeriodicCanvas, type CanvasMode } from './PeriodicCanvas';
import { ElementStage, type StageLive } from './ElementStage';
import { CellFx, IntroFxLayer, type CellFxState, type IntroPlan } from './TableFx';
import { Fireworks, BuilderAtom, type FireworksApi } from './Labs';
import type { CellRects } from './screen';
import type { ElementFull } from '../engine/elements';
import type { ExperimentSpec } from '../../../data/periodic/experiments';
import type { Cue } from './Experiments';
import type { QualityTier } from './params';
import { identify } from '../engine/builder';
import { CityScape, MoleculeView, type CityProp } from './Extras';
import type { Counts, Recipe } from '../engine/molecules';

interface Props {
    mode: CanvasMode; warmKey: string; onReady: (k: string) => void; onTier: (t: QualityTier) => void; onContextLost: () => void;
    active: boolean; rects: CellRects; fx: CellFxState; intro: IntroPlan | null;
    selected: ElementFull | null; closing: boolean; onClosed: () => void; live: StageLive; experiment: ExperimentSpec | null; expPower: boolean;
    cloud: boolean; tempC: number; onCue: (c: Cue, p?: number) => void;
    lab: 'fireworks' | 'builder' | 'city' | 'kitchen' | null; cityProp: CityProp; onCityPick: (e: ElementFull) => void; kitchen: { counts: Counts; recipe: Recipe | null }; fwApi: React.MutableRefObject<FireworksApi | null>; onBoom: () => void; builder: { p: number; n: number; e: number };
}

export default function Stage3D(p: Props) {
    const id = identify(p.builder.p, p.builder.n, p.builder.e);
    return (
        <PeriodicCanvas mode={p.mode} active={p.active} warmKey={p.warmKey} onReady={p.onReady} onTier={p.onTier} onContextLost={p.onContextLost}>
            {(tier) => (
                <>
                    {p.mode === 'table' && <CellFx rects={p.rects} state={p.fx} />}
                    {p.intro && <IntroFxLayer rects={p.rects} plan={p.intro} />}
                    {p.selected && (
                        <ElementStage key={p.selected.atomicNumber} el={p.selected} tier={tier} live={p.live} closing={p.closing} onClosed={p.onClosed}
                            experiment={p.experiment} experimentPower={p.expPower} cloud={p.cloud} tempC={p.tempC} onCue={p.onCue} />
                    )}
                    {p.lab === 'fireworks' && <Fireworks apiRef={p.fwApi} tier={tier} onBoom={p.onBoom} />}
                    {p.lab === 'city' && <CityScape rects={p.rects} prop={p.cityProp} tier={tier} onPick={p.onCityPick} />}
                    {p.lab === 'kitchen' && <MoleculeView recipe={p.kitchen.recipe} counts={p.kitchen.counts} tier={tier} />}
                    {p.lab === 'builder' && <BuilderAtom p={p.builder.p} n={p.builder.n} e={p.builder.e} tier={tier} unstable={id.stable === false} />}
                </>
            )}
        </PeriodicCanvas>
    );
}
