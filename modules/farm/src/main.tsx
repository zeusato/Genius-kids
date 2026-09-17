import { createRoot } from 'react-dom/client';
import FarmApp from './FarmApp';
// Standalone entry: no host router, providers, auth, PWA or profile imports.
createRoot(document.getElementById('root')!).render(<FarmApp />);
