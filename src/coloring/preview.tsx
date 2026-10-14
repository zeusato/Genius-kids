import React from 'react';
import { createRoot } from 'react-dom/client';
import { ColoringApp } from './ui/ColoringPage';
import { MemoryRouter } from 'react-router-dom';
import { MusicProvider } from '../contexts/MusicContext';
import { HubShell } from '../components/hub/HubShell';
if (import.meta.env.DEV)
    createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/coloring']}><MusicProvider><HubShell section="Xưởng Tô Màu"><ColoringApp owner="coloring-preview" grade={1} onExit={() => location.assign(import.meta.env.BASE_URL)} onComplete={() => ({ ok: true, earned: 0 })}/></HubShell></MusicProvider></MemoryRouter>);
