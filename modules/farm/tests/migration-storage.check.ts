import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {LocalFarmRepository,LocalFarmGateway} from '../src/adapters/local';
import {createFarm as legacyFarm} from '../src/core/legacy/engine';
import {RECIPES as oldRecipes} from '../src/core/legacy/catalog';
import {execute,advanceTime} from '../src/core/engine';
import {migrateLegacy} from '../src/core/validation';

it('durably preserves the exact pre-migration snapshot through later saves',async()=>{
 const name=`migration-${crypto.randomUUID()}`,old=legacyFarm(1000);
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(old,'main');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
 const repo=new LocalFarmRepository(name),g=await LocalFarmGateway.open(repo,()=>1000);
 await g.execute({type:'harvest',plotId:'plot-1'});await g.execute({type:'harvest',plotId:'plot-2'});
 expect(JSON.parse((await repo.exportOriginal())!).state).toEqual(old);expect((await repo.load())!.schema).toBe(2);await g.close();
});
it('keeps promised legacy XP and does not grant newly introduced recipes early',()=>{
 const old=legacyFarm(1000);old.entities[0].level=2;old.entities[0].job={recipe:'flour',startedAt:old.clock,readyAt:old.clock+30000};
 const s=migrateLegacy(old),next=advanceTime(s,31000);expect(next.xp-s.xp).toBe(oldRecipes.flour.xp);
 expect(execute(next,{type:'produce',entityId:old.entities[0].id,recipe:'feed'}).ok).toBe(false);
});
