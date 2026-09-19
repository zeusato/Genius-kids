import { Html } from '@react-three/drei';
import { ASSETS } from '../core/catalog';
import { dimensions } from '../core/engine';
import { heightAt } from '../core/world';
import type { FarmState } from '../core/types';
import { constructionProgress, countdown } from '../ui/constructionProgress';
const toolsUrl = new URL('../assets/ui/construction-tools-v1.webp', import.meta.url).href;
function Badge({ title, waiting, percent, remaining, reduced }: { title: string; waiting?: boolean; percent: number; remaining: number; reduced: boolean }) {
    return <div className="farm-construction-badge" aria-label={`${title}: ${waiting ? 'Chờ mẻ hiện tại' : `${percent}%, còn ${countdown(remaining)}`}`}>
        <i aria-hidden="true" className={`farm-construction-tools ${reduced || waiting ? 'is-still' : ''}`} style={{ backgroundImage: `url(${toolsUrl})` }}/>
        <strong>{waiting ? 'Chờ mẻ hiện tại' : title}</strong>
        <div className="farm-construction-meter" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }}/></div>
        <small>{waiting ? 'Đã đặt lịch nâng cấp' : <><b>{percent}%</b><time>{countdown(remaining)}</time></>}</small>
    </div>;
}
export function ConstructionSites({ state: s, reduced }: { state: FarmState; reduced: boolean }) {
    return <>
        {s.entities.filter(e => !e.stored && e.construction).map(e => {
            const job = e.construction!, [w, d] = dimensions(e.asset, e.rotation), progress = constructionProgress(job, s.clock);
            const y = heightAt(s.world, e.x, e.z) + .03;
            return <group key={job.id} position={[e.x + w / 2, y, e.z + d / 2]}>
                {!job.waitingFor && <group userData={{ id: e.id }}>{[-1, 1].flatMap(x => [-1, 1].map(z => <mesh key={`${x}:${z}`} position={[x * w / 2, 1.1, z * d / 2]}><boxGeometry args={[.1, 2.2, .1]}/><meshStandardMaterial color="#af8857" roughness={1}/></mesh>))}{[-1, 1].map(z => <mesh key={z} position={[0, 1.55, z * d / 2]}><boxGeometry args={[w + .25, .1, .16]}/><meshStandardMaterial color="#c7a270" roughness={1}/></mesh>)}</group>}
                <Html center position={[0, e.asset === 'mill' ? 6.4 : Math.max(w, d) * .9 + .9, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[9, 5]}><Badge title={`${job.newBuilding ? 'Xây' : 'Nâng'} ${ASSETS[e.asset].name}`} waiting={!!job.waitingFor} {...progress} reduced={reduced}/></Html>
            </group>;
        })}
        {s.world.bridges.filter(b => !b.built && b.readyAt !== undefined).map(b => <Html key={b.id} center position={[b.x + 3, 2, b.z + 1]} style={{ pointerEvents: 'none' }} zIndexRange={[9, 5]}><Badge title="Xây cầu gỗ" {...constructionProgress({ readyAt: b.readyAt!, duration: 300000 }, s.clock)} reduced={reduced}/></Html>)}
    </>;
}
