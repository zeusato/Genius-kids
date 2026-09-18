import { createRoot } from 'react-dom/client';
import FarmApp from './FarmApp';
import { lazy, Suspense } from 'react';
const DevLab = import.meta.env.DEV && ['qa', 'mobile'].includes(new URLSearchParams(location.search).get('lab') ?? '') ? lazy(() => import('./DevLab')) : null;
const ArchitectureLab = import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'architecture' ? lazy(() => import('./dev/ArchitectureLab')) : null;
const RoadLab = import.meta.env.DEV && new URLSearchParams(location.search).get('lab') === 'roads' ? lazy(() => import('./dev/RoadLab')) : null;
// Standalone entry: module-owned auth; no host router, providers, PWA or profile imports.
createRoot(document.getElementById('root')!).render(RoadLab ? <Suspense fallback={<p>Đang mở xưởng lối đá…</p>}><RoadLab/></Suspense> : ArchitectureLab ? <Suspense fallback={<p>Đang mở xưởng kiến trúc…</p>}><ArchitectureLab/></Suspense> : DevLab ? <Suspense fallback={<p>Đang mở sân thử riêng…</p>}><DevLab /></Suspense> : <FarmApp />);
