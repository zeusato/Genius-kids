import { createRoot } from 'react-dom/client';
import FarmApp from './FarmApp';
import { lazy, Suspense } from 'react';
const DevLab = import.meta.env.DEV && ['qa', 'mobile'].includes(new URLSearchParams(location.search).get('lab') ?? '') ? lazy(() => import('./DevLab')) : null;
// Standalone entry: no host router, providers, auth, PWA or profile imports.
createRoot(document.getElementById('root')!).render(DevLab ? <Suspense fallback={<p>Đang mở sân thử riêng…</p>}><DevLab /></Suspense> : <FarmApp />);
