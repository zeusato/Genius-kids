import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useRegisterSW } from 'virtual:pwa-register/react';
import CoVua from './CoVuaGame';
import { matchFromFen } from './engine';
import type { Match,Player } from './model';
const owner={id:'co-vua-standalone',name:'Bạn'};
const players:[Player,Player]=[{id:owner.id,name:'Bạn',kind:'human',level:'medium',avatar:''},{id:'guest',name:'Bạn cùng chơi',kind:'human',level:'medium',avatar:''}];
function Updates(){const [error,setError]=useState('');const {needRefresh:[ready,setReady],offlineReady:[offline,setOffline],updateServiceWorker}=useRegisterSW();return ready?<div className='cv-update' role='status'><span>Cờ Vua có phiên bản mới.<small>{error||'Ván đang chơi sẽ được lưu trước khi tải lại.'}</small></span><button onClick={()=>{if(window.dispatchEvent(new Event('cv-before-update',{cancelable:true})))void updateServiceWorker(true);else setError('Chưa lưu được ván. Hãy thử lưu lại trước khi cập nhật.');}}>Cập nhật</button><button onClick={()=>setReady(false)}>Để sau</button></div>:offline?<div className='cv-update' role='status'><span>Đã tải đủ tài nguyên. Bạn có thể chơi offline.</span><button onClick={()=>setOffline(false)}>Đã hiểu</button></div>:null;}
function Preview(){const [fixture,setFixture]=useState<Match|undefined>(),[run,setRun]=useState(0);
  const setup=(fen?:string)=>{setFixture(fen?matchFromFen(owner.id,players,crypto.randomUUID(),fen):undefined);setRun(v=>v+1);};
  return <><CoVua key={run} owner={owner} initialMatch={fixture}/><Updates/>{import.meta.env.DEV&&<details className='cv-dev-tools'><summary>DEV · Kiểm thử cờ vua</summary><button onClick={()=>setup()}>Phòng chơi</button><button onClick={()=>setup('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')}>Sắp phong cấp</button><button onClick={()=>setup('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1')}>Sắp chiếu bí</button><button onClick={()=>setup('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1')}>Nhập thành</button><button onClick={()=>document.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()}>Mất WebGL</button></details>}</>;
}
const root:ReturnType<typeof createRoot>=import.meta.hot?.data.root??createRoot(document.getElementById('root')!);if(import.meta.hot)import.meta.hot.data.root=root;
root.render(<React.StrictMode><Preview/></React.StrictMode>);
