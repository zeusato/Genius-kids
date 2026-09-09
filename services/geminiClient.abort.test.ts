import { afterEach, expect, it, vi } from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
it('propagates cancellation through model discovery without posting a generation',async()=>{
 const fetch=vi.fn((_url,opts)=>new Promise((_,reject)=>opts.signal.addEventListener('abort',()=>reject(opts.signal.reason),{once:true})));vi.stubGlobal('fetch',fetch);
 const {geminiGenerateContent}=await import('./geminiClient');const controller=new AbortController(),request=geminiGenerateContent('fixture-key',{}, {signal:controller.signal,maxAttempts:2});controller.abort();await expect(request).rejects.toMatchObject({name:'AbortError'});expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
});
it('cancels the active generation and bounds retries after model 404',async()=>{
 const fetch=vi.fn(async(_url:string,opts:any)=>opts?.method==='POST'?new Response('',{status:404}):new Response(JSON.stringify({models:['gemini-9.0-flash','gemini-8.0-flash'].map(name=>({name:'models/'+name,supportedGenerationMethods:['generateContent']}))}),{status:200}));vi.stubGlobal('fetch',fetch);
 const {geminiGenerateContent}=await import('./geminiClient');const controller=new AbortController(),result=await geminiGenerateContent('fixture-key',{}, {signal:controller.signal,maxAttempts:2});expect(result.status).toBe(404);expect(fetch.mock.calls.filter(([,opts])=>opts.method==='POST')).toHaveLength(2);expect(fetch.mock.calls.every(([,opts])=>opts.signal===controller.signal)).toBe(true);
 controller.abort();await expect(geminiGenerateContent('fixture-key',{}, {signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
});
