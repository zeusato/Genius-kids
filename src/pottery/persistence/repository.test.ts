import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { newArtwork } from '../engine/document';
import { database, closeDatabase, DATABASE, saveArtwork, readArtwork, listArtworks, removeArtwork, clearPotteryData, saveThumbnail } from './repository';
import { StudioController } from '../state/studioController';
import { sculpt } from '../engine/profile';
const scope={account:'guest',student:'pottery-test'};
beforeEach(async()=>{await closeDatabase();await new Promise<void>((resolve,reject)=>{const req=indexedDB.deleteDatabase(DATABASE);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error);});});
describe('pottery repository',()=>{
  it('isolates account and student, survives reload, and deletes only the selected scope',async()=>{
    const a=newArtwork(scope),b=newArtwork({...scope,account:'other'}),d=newArtwork({...scope,student:'sibling'});
    await saveArtwork(a,0,true);await saveArtwork(b,0);await saveArtwork(d,0);await closeDatabase();
    expect((await readArtwork(scope,a.id))?.shape).toEqual(a.shape);expect(await readArtwork({...scope,account:'other'},a.id)).toBeUndefined();
    expect(await listArtworks(scope)).toHaveLength(1);await clearPotteryData(scope);expect(await listArtworks(scope)).toHaveLength(0);expect(await listArtworks(b)).toHaveLength(1);expect(await listArtworks(d)).toHaveLength(1);
  });
  it('rejects a stale tab and a stale thumbnail without overwriting new content',async()=>{
    const a=newArtwork(scope);a.revision=await saveArtwork(a,0);const old=structuredClone(a);a.name='Mới hơn';a.revision=await saveArtwork(a,1);
    await expect(saveArtwork(old,1)).rejects.toThrow('tab khác');await saveThumbnail(old,new Blob(['old']));expect((await listArtworks(scope))[0].thumb).toBeUndefined();
    await saveThumbnail(a,new Blob(['new']));expect((await listArtworks(scope))[0].thumb?.size).toBe(3);expect((await readArtwork(scope,a.id))?.name).toBe('Mới hơn');
  });
  it('removes artwork, checkpoint and thumbnail atomically',async()=>{
    const a=newArtwork(scope);a.revision=await saveArtwork(a,0,true);await saveThumbnail(a,new Blob(['image']));await removeArtwork(scope,a.id);
    expect(await readArtwork(scope,a.id)).toBeUndefined();const db=await database();for(const store of ['checkpoints','thumbnails'])await new Promise<void>(resolve=>{const req=db.transaction(store).objectStore(store).count();req.onsuccess=()=>{expect(req.result).toBe(0);resolve();};});
  });
});
describe('studio transactions',()=>{
  it('keeps the chosen wheel motion when switching brush, eraser and view',async()=>{
    const a=newArtwork(scope);a.stage='decorating';const c=new StudioController(a);
    expect(c.spinning).toBe(false);c.spinning=true;c.paintWheelSpeed=1.5;c.paintWheelDirection=-1;
    for(const tool of ['brush','erase','view','brush'] as const){c.selectTool(tool);expect(c.spinning).toBe(true);}
    expect(c.paintWheelSpeed).toBe(1.5);expect(c.paintWheelDirection).toBe(-1);
    c.selectTool('stamp');expect(c.spinning).toBe(false);
    c.selectTool('brush');expect(c.spinning).toBe(false);
    c.dispose();await c.flush();
  });
  it('keeps brush dynamics through undo, redo and reloading the saved artwork',async()=>{
    const a=newArtwork(scope);a.stage='decorating';const c=new StudioController(a);
    c.begin();c.point({u:.4,v:.3,radius:.7},true,100);
    c.point({u:.41,v:.4,radius:.7},false,140);
    c.point({u:.42,v:.5,radius:.7,pressure:.9},false,300);c.end();
    const strokes=structuredClone(c.doc.decoration.strokes);
    expect(strokes[0].brushStyle).toBe('bristle-v1');
    expect(strokes[0].points[1].pressure).toBeLessThan(strokes[0].points[0].pressure!);
    expect(strokes[0].points[2].pressure).toBeGreaterThan(strokes[0].points[1].pressure!);
    c.undo();expect(c.doc.decoration.strokes).toHaveLength(0);c.undo(true);
    expect(c.doc.decoration.strokes).toEqual(strokes);await c.flush();
    expect((await readArtwork(scope,c.doc.id))?.decoration.strokes).toEqual(strokes);c.dispose();await c.flush();
  });
  it('undo and redo restore an entire sculpt gesture and cavity opening',async()=>{
    const c=new StudioController(newArtwork(scope)),original=structuredClone(c.doc.shape);c.begin();for(let i=0;i<20;i++){sculpt(c.doc.shape,.5,.006);c.changed(true);}c.end();const changed=structuredClone(c.doc.shape);
    c.undo();expect(c.doc.shape).toEqual(original);c.undo(true);expect(c.doc.shape).toEqual(changed);c.open();expect(c.doc.shape.depth).toBeGreaterThan(0);c.undo();expect(c.doc.shape.depth).toBe(0);await c.flush();c.dispose();
  });
  it('serializes concurrent save calls and reloads a firing transaction',async()=>{
    const c=new StudioController(newArtwork(scope));await Promise.all([c.flush(),c.flush(),c.flush()]);c.open();await c.stage('preparing');await c.stage('decorating');await c.stage('firing');
    const loaded=await readArtwork(scope,c.doc.id);expect(loaded?.stage).toBe('firing');expect(loaded?.seed).toBe(c.doc.seed);expect(loaded?.revision).toBe(c.doc.revision);await c.stage('reveal');await c.stage('finished');expect(await listArtworks(scope)).toHaveLength(1);c.dispose();
  });
  it('does not move to firing when saving conflicts',async()=>{
    const c=new StudioController(newArtwork(scope));await c.stage('preparing');await c.stage('decorating');const other=structuredClone(c.doc);other.name='tab khác';await saveArtwork(other,other.revision);expect(await c.stage('firing')).toBe(false);expect(c.doc.stage).toBe('decorating');expect(c.error).toContain('tab khác');c.dispose();await c.flush();
  });
  it('rejects skipping the preparation and firing stages',async()=>{
    const c=new StudioController(newArtwork(scope));expect(await c.stage('finished')).toBe(false);expect(await c.stage('reveal')).toBe(false);expect(c.doc.stage).toBe('shaping');await c.flush();c.dispose();
  });
  it('restores the solid lump when preparation cannot be committed and does not award a manual opening skill',async()=>{
    const c=new StudioController(newArtwork(scope));await c.flush();const original=structuredClone(c.doc.shape);await saveArtwork(c.doc,c.doc.revision);
    expect(await c.stage('preparing')).toBe(false);expect(c.doc.shape).toEqual(original);expect(c.doc.skills).not.toContain('open');c.dispose();await c.flush();
  });
});
