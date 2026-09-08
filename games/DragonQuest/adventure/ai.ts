import { geminiGenerateContent } from '../../../services/geminiClient';
import { Config, Prepared, Question, Slot, hash } from './model';
import { regionOf } from './content';
import { assemble, countLimit, createLocalQuestions, describeTask, factsForGrade, limits, makeQuestion, validateTask } from './questions';

export const PROMPT_VERSION=2;
export function buildRequest(config:Config,slots:Slot[],seed:number,excluded:Question[]=[]){
 const system=`Bạn biên soạn câu hỏi tiếng Việt cho game Đại Chiến Rồng Thần. Tạo đúng một câu cho mỗi slotId, đúng loại task được yêu cầu. Giữ phạm vi lớp và độ khó. Câu boss không vượt kiến thức hiện hành. Dẫn truyện leadIn tối đa 120 ký tự, ngắn và hấp dẫn, liên quan ô quái vật/nàng tiên/rồng trên bàn cờ 50 ô, KHÔNG thêm số liệu hoặc đáp án. Ứng dụng tự dựng câu hỏi, hình và lời giải từ task. Không HTML, SVG, URL, Markdown. Trả JSON {"schemaVersion":1,"questions":[{"slotId":"...","leadIn":"...","task":{...},"correctAnswer":"..."}]}. Đáp án phải tự giải đúng. Không lặp task số học, đếm hoặc đồng hồ đã có. Với hình, màu, kiến thức có tập hữu hạn, được lặp khi hết lựa chọn. Nhân vật tiến bằng xúc xắc; chỉ trả lời tại ô dừng, không chọn nhánh.
Các task hợp lệ:
arithmetic: {kind:"arithmetic",a:23,b:14,op:"add"|"subtract"|"multiply"|"divide",target:"result"|"missing"}; missing chỉ với cộng/nhân, đáp án là b; các trường a,b vẫn là phép tính hoàn chỉnh. Cộng/trừ trong miền số, nhân/chia bảng 2–12, chia hết, không số âm. Mầm non/lớp 1 không nhân chia; lớp 2 dễ chỉ cộng/trừ không nhớ/không mượn.
count: {kind:"count",left:3,right:4,object:"gem"|"apple"|"star"}; left 1–10, right 0–10, tổng <=20; mỗi nhóm không vượt maxCountGroup trong yêu cầu. Đáp án là tổng.
clock: {kind:"clock",hour:8,minute:30}; giờ 1–12, phút 0–55 bội 5, lớp 1 chỉ 0 hoặc 30. Đáp án "8:30", phút hai chữ số.
shape: {kind:"shape",shape:"circle"|"square"|"triangle"|"rectangle"}; đáp án Hình tròn/Hình vuông/Hình tam giác/Hình chữ nhật.
color: {kind:"color",color:"red"|"blue"|"green"|"yellow"|"purple"|"pink"}; đáp án Đỏ/Xanh dương/Xanh lá/Vàng/Tím/Hồng.
fact: {kind:"fact",factId:"ID trong facts"}; chỉ dùng dữ liệu facts được cấp, đáp án đúng lấy từ facts. Không tự tạo kiến thức mới.`;
 const data={promptVersion:PROMPT_VERSION,grade:config.grade,difficulty:config.difficulty,topic:config.topic,maxNumber:limits(config),maxCountGroup:countLimit(config),region:regionOf(config.missionId).name,seed,
  slots:slots.map(s=>({slotId:s.id,taskKind:s.kind,context:s.nodeId,tileNumber:Number(s.nodeId.split('-')[1])+1,bossPhase:s.bossPhase})),
  facts:slots.some(s=>s.kind==='fact')?factsForGrade(config.grade).map(f=>({id:f[0],question:f[1],answer:f[2]})):[],excluded:excluded.map(q=>q.task)};
 return {systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:JSON.stringify(data)}]}],generationConfig:{temperature:.8,maxOutputTokens:12000,responseMimeType:'application/json'}};
}
export function parseBatch(raw:string,config:Config,slots:Slot[],seed:number,existing:Question[]=[]):Record<string,Question>{
 if(raw.length>2_000_000)throw new Error('Phản hồi quá lớn');
 const clean=raw.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/,'$1');const data=JSON.parse(clean);
 if(!data||data.schemaVersion!==1||!Array.isArray(data.questions)||data.questions.length>200)throw new Error('Định dạng câu hỏi chưa phù hợp');
 const found:Record<string,Question>={},seen=new Set(existing.map(q=>hash(q.task))),counts=new Map<string,number>();
 for(const q of data.questions)if(q&&typeof q.slotId==='string')counts.set(q.slotId,(counts.get(q.slotId)||0)+1);
 for(const rawQ of data.questions){
  const slot=slots.find(s=>s.id===rawQ?.slotId);if(!slot||counts.get(slot.id)!==1||Object.keys(rawQ).some(k=>!['slotId','leadIn','task','correctAnswer'].includes(k))||!validateTask(rawQ.task,slot,config))continue;
  const answer=describeTask(rawQ.task).answer;if(typeof rawQ.correctAnswer!=='string'||rawQ.correctAnswer.trim()!==answer||(['arithmetic','count','clock'].includes(rawQ.task.kind)&&seen.has(hash(rawQ.task))))continue;
  const intro=rawQ.leadIn;if(typeof intro!=='string'||intro.length>180||/[<>\d]|https?:|javascript:|\p{C}/u.test(intro))continue;
  found[slot.id]=makeQuestion(slot,rawQ.task,seed+slots.indexOf(slot),'ai',intro);seen.add(hash(rawQ.task));
 }return found;
}
export type Generate=(body:ReturnType<typeof buildRequest>,signal:AbortSignal)=>Promise<string>;
export const apiGenerator=(key:string):Generate=>async(body,signal)=>{
 const response=await geminiGenerateContent(key,body,{signal,maxAttempts:2});
 if(!response.ok)throw new Error(`AI ${response.status}`);
 const raw=await response.text();if(raw.length>2_500_000)throw new Error('Phản hồi quá lớn');const data=JSON.parse(raw);
 const text=data.candidates?.[0]?.content?.parts?.filter((p:any)=>!p.thought&&typeof p.text==='string').map((p:any)=>p.text).join('');
 if(!text)throw new Error('AI chưa trả câu hỏi');return text;
};
export async function prepareQuestions(config:Config,slots:Slot[],seed:number,options:{signal:AbortSignal;generate?:Generate;budgetMs?:number;onProgress?:(text:string)=>void}):Promise<Prepared>{
 options.signal.throwIfAborted();
 if(!config.ai||!options.generate)return assemble(createLocalQuestions(config,slots,seed),config.ai?'AI chưa sẵn sàng, đã dùng câu hỏi có sẵn.':'');
 const controller=new AbortController(),cancel=()=>controller.abort(options.signal.reason),deadline=setTimeout(()=>controller.abort(new DOMException('Timeout','TimeoutError')),options.budgetMs??25000);
 options.signal.addEventListener('abort',cancel,{once:true});let questions:Record<string,Question>={};
 try{
  for(let attempt=0;attempt<2;attempt++){
   controller.signal.throwIfAborted();const missing=slots.filter(s=>!questions[s.id]);if(!missing.length)break;
   options.onProgress?.(attempt?'Đang bổ sung những thử thách còn lại…':'Rồng nhỏ đang chuẩn bị câu đố mới…');
   // Race also bounds custom transports that fail to honour abort; a late response is never committed.
   const body=buildRequest(config,missing,seed+attempt,Object.values(questions));
   let stop:(()=>void)|undefined;
   try{const canceled=new Promise<never>((_,reject)=>{stop=()=>reject(controller.signal.reason);if(controller.signal.aborted)stop();else controller.signal.addEventListener('abort',stop,{once:true});});
    const raw=await Promise.race([canceled,options.generate(body,controller.signal)]);
    Object.assign(questions,parseBatch(raw,config,missing,seed,Object.values(questions)));
   }catch(error){if(controller.signal.aborted||!(error instanceof SyntaxError)&&!(error instanceof Error&&error.message==='Định dạng câu hỏi chưa phù hợp'))throw error;}
   finally{if(stop)controller.signal.removeEventListener('abort',stop);}
  }
 }catch{options.signal.throwIfAborted();}
 finally{clearTimeout(deadline);options.signal.removeEventListener('abort',cancel);}
 options.signal.throwIfAborted();const missing=slots.filter(s=>!questions[s.id]);
 if(missing.length)Object.assign(questions,createLocalQuestions(config,missing,seed^0x52abc,Object.values(questions)));
 options.onProgress?.('Đang thắp sáng các điểm trên bản đồ…');
 return assemble(questions,missing.length?'AI tạm gián đoạn, đã bổ sung câu hỏi có sẵn.':'');
}



