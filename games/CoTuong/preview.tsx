import React from 'react';
import { createRoot } from 'react-dom/client';
import CoTuongGame from './CoTuongGame';
import { useRegisterSW } from 'virtual:pwa-register/react';
function StandaloneUpdates() {
  const { needRefresh: [ready, setReady], updateServiceWorker } = useRegisterSW();
  return ready ? <div className='kv-standalone-update' role='status'><span>Có phiên bản Kỳ Viên mới.</span><button onClick={() => updateServiceWorker(true)}>Lưu ván &amp; cập nhật</button><button aria-label='Để cập nhật sau' onClick={() => setReady(false)}>Để sau</button></div> : null;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><CoTuongGame/><StandaloneUpdates/></React.StrictMode>);
