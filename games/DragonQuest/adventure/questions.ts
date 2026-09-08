import { Config, Prepared, Question, Slot, Task, hash, rng } from './model';

export const COLORS={red:{name:'Đỏ',hex:'#e96860'},blue:{name:'Xanh dương',hex:'#529ce0'},green:{name:'Xanh lá',hex:'#72b47a'},yellow:{name:'Vàng',hex:'#edc653'},purple:{name:'Tím',hex:'#9773ba'},pink:{name:'Hồng',hex:'#e99fb3'}};
export const SHAPES={circle:'Hình tròn',square:'Hình vuông',triangle:'Hình tam giác',rectangle:'Hình chữ nhật'};
export const FACTS=[
 ['cat','Con vật nào kêu meo meo?','Mèo','Chó','Gà','Vịt'],['elephant','Con vật nào có chiếc vòi dài?','Voi','Hươu','Thỏ','Ngựa'],
 ['bee','Con vật nào làm ra mật ong?','Ong','Bướm','Kiến','Chuồn chuồn'],['spider','Con vật nào có tám chân?','Nhện','Ong','Bướm','Kiến'],
 ['giraffe','Con vật nào có chiếc cổ rất dài?','Hươu cao cổ','Mèo','Thỏ','Vịt'],['duck','Con vật nào kêu cạp cạp?','Vịt','Mèo','Chó','Bò'],
 ['week','Một tuần có bao nhiêu ngày?','7','5','6','8'],['year','Một năm có bao nhiêu tháng?','12','10','11','14'],
 ['day','Một ngày có bao nhiêu giờ?','24','12','30','60'],['hour','Một giờ có bao nhiêu phút?','60','24','30','100'],
 ['sun','Thiên thể nào là một ngôi sao?','Mặt Trời','Mặt Trăng','Trái Đất','Sao Hỏa'],['moon','Vệ tinh tự nhiên của Trái Đất là gì?','Mặt Trăng','Mặt Trời','Sao Kim','Sao Hỏa'],
 ['leaf','Bộ phận nào của cây thường có màu xanh?','Lá','Rễ','Hạt','Vỏ thân'],['root','Bộ phận nào giúp cây hút nước từ đất?','Rễ','Hoa','Quả','Hạt'],
 ['ice','Nước được đông lạnh thành gì?','Nước đá','Cát','Khói','Dầu'],['rain','Nước rơi từ mây xuống gọi là gì?','Mưa','Gió','Nắng','Sương mù'],
 ['triangle','Hình tam giác có bao nhiêu cạnh?','3','2','4','5'],['square','Hình vuông có bao nhiêu cạnh?','4','3','5','6'],
 ['ten','Một chục bằng bao nhiêu?','10','5','12','100'],['hundred','Một trăm bằng bao nhiêu chục?','10','5','20','100'],
 ['ear','Bộ phận nào giúp chúng ta nghe âm thanh?','Tai','Mắt','Mũi','Tay'],['eye','Bộ phận nào giúp chúng ta nhìn?','Mắt','Tai','Mũi','Chân'],
 ['nose','Bộ phận nào giúp chúng ta ngửi hương hoa?','Mũi','Tai','Mắt','Chân'],['book','Vật nào dùng để đọc các câu chuyện?','Quyển sách','Chiếc thìa','Cái cốc','Chiếc giày'],
] as const;
export const factFor=(id:string)=>FACTS.find(f=>f[0]===id);
export const factsForGrade=(grade:number)=>FACTS.filter(f=>grade===0?!['week','year','day','hour','sun','moon','ten','hundred'].includes(f[0]):grade===1?!['sun','moon','hundred'].includes(f[0]):true);
export const countLimit=(c:Config)=>c.grade===0||c.grade===1&&c.difficulty==='easy'?5:10;
const integer=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export function limits(c:Config){return c.grade===0?10:c.grade===1?c.difficulty==='easy'?10:20:c.grade===2?100:c.grade===3?1000:c.grade===4?10000:100000;}
export function validConfig(c:any):c is Config{return !!c&&typeof c.missionId==='string'&&integer(c.grade,0,5)&&['easy','medium','hard'].includes(c.difficulty)&&['mixed','math','observe','knowledge'].includes(c.topic)&&['story','challenge'].includes(c.mode)&&typeof c.ai==='boolean';}
export function validateTask(raw:any,slot:Slot,c:Config):raw is Task {
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.kind!==slot.kind)return false;
 const allowed:Record<string,string[]>={arithmetic:['kind','a','b','op','target'],count:['kind','left','right','object'],clock:['kind','hour','minute'],shape:['kind','shape'],color:['kind','color'],fact:['kind','factId']};
 if(Object.keys(raw).some(k=>!allowed[raw.kind]?.includes(k)))return false;
 switch(raw.kind){
  case 'arithmetic':{
   const max=limits(c);if(!integer(raw.a,0,max)||!integer(raw.b,0,max)||!['add','subtract','multiply','divide'].includes(raw.op)||!['result','missing'].includes(raw.target))return false;
   if(c.grade<2&&['multiply','divide'].includes(raw.op))return false;
   if(c.grade===2&&c.difficulty==='easy'&&['multiply','divide'].includes(raw.op))return false;
   const v=calculate(raw);if(!integer(v,0,max)||raw.op==='divide'&&raw.b===0)return false;
   if(raw.op==='multiply'&&(raw.a>12||raw.b>12))return false;
   if(raw.op==='divide'&&(raw.b>12||raw.a/raw.b>12||!Number.isInteger(raw.a/raw.b)))return false;
   if(raw.target==='missing'&&(c.grade<2||!['add','multiply'].includes(raw.op)))return false;
   if(raw.target==='missing'&&raw.op==='multiply'&&raw.a===0)return false;
   if(c.grade===2&&c.difficulty==='easy'&&((raw.op==='add'&&raw.a%10+raw.b%10>9)||(raw.op==='subtract'&&raw.a%10<raw.b%10)))return false;
   return true;
  }
  case 'count':return integer(raw.left,1,countLimit(c))&&integer(raw.right,0,countLimit(c))&&raw.left+raw.right<=countLimit(c)*2&&['gem','apple','star'].includes(raw.object);
  case 'clock':return c.grade>0&&integer(raw.hour,1,12)&&integer(raw.minute,0,55)&&raw.minute%(c.grade<=1?30:5)===0;
  case 'shape':return Object.hasOwn(SHAPES,raw.shape);
  case 'color':return Object.hasOwn(COLORS,raw.color);
  case 'fact':return factsForGrade(c.grade).some(f=>f[0]===raw.factId);
  default:return false;
 }
}
function calculate(t:Extract<Task,{kind:'arithmetic'}>){return t.op==='add'?t.a+t.b:t.op==='subtract'?t.a-t.b:t.op==='multiply'?t.a*t.b:t.a/t.b;}
export function describeTask(t:Task){
 switch(t.kind){
  case 'arithmetic':{const op={add:'+',subtract:'−',multiply:'×',divide:'÷'}[t.op],value=calculate(t),missing=t.target==='missing';return {text:missing?`${t.a} ${op} ? = ${value}`:`${t.a} ${op} ${t.b} = ?`,answer:String(missing?t.b:value),hint:missing?`Tìm số còn thiếu để phép tính bằng ${value}.`:t.op==='add'?'Cộng hàng đơn vị trước, rồi đến hàng chục.':t.op==='subtract'?'Bắt đầu từ số đầu tiên và bớt đi số thứ hai.':'Có thể dùng các nhóm bằng nhau để tìm kết quả.',explanation:`${t.a} ${op} ${t.b} = ${value}.${missing?` Số còn thiếu là ${t.b}.`:''}`};}
  case 'count':return {text:'Có tất cả bao nhiêu vật ở hai nhóm?',answer:String(t.left+t.right),hint:`Đếm nhóm thứ nhất, rồi đếm tiếp nhóm thứ hai.`,explanation:`${t.left} + ${t.right} = ${t.left+t.right}. Có tất cả ${t.left+t.right} vật.`};
  case 'clock':{const answer=`${t.hour}:${String(t.minute).padStart(2,'0')}`;return {text:'Đồng hồ đang chỉ mấy giờ?',answer,hint:'Kim ngắn chỉ giờ. Kim dài chỉ phút.',explanation:`Đồng hồ chỉ ${t.hour} giờ${t.minute?` ${t.minute} phút`:' đúng'}.`};}
  case 'shape':return {text:'Em nhận ra hình này không?',answer:SHAPES[t.shape],hint:t.shape==='circle'?'Hình này không có góc.':t.shape==='triangle'?'Hãy đếm ba cạnh của hình.':'Quan sát số cạnh và độ dài của chúng.',explanation:`Đây là ${SHAPES[t.shape].toLocaleLowerCase('vi')}.`};
  case 'color':return {text:'Tinh thể này có màu gì?',answer:COLORS[t.color].name,hint:'Nhìn vào màu bên trong viên tinh thể.',explanation:`Tinh thể có màu ${COLORS[t.color].name.toLocaleLowerCase('vi')}.`};
  case 'fact':{const f=factFor(t.factId)!;return {text:f[1],answer:f[2],hint:'Đọc từng lựa chọn và tìm điều em đã biết.',explanation:`${f[1]} Đáp án là ${f[2]}.`};}
 }
}
function shuffle<T>(a:T[],random:()=>number){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeQuestion(slot:Slot,task:Task,seed:number,source:Question['source']='local',leadIn=''):Question {
 const d=describeTask(task),random=rng(seed),values=new Set<string>([d.answer]);
 if(task.kind==='shape')Object.values(SHAPES).forEach(v=>values.add(v));
 else if(task.kind==='color')shuffle(Object.values(COLORS).map(v=>v.name),random).forEach(v=>{if(values.size<4)values.add(v);});
 else if(task.kind==='fact')factFor(task.factId)!.slice(2).forEach(v=>values.add(v));
 else if(task.kind==='clock'){for(let i=1;i<4;i++)values.add(`${(task.hour+i-1)%12+1}:${String((task.minute+i*10)%60).padStart(2,'0')}`);}
 else{const correct=Number(d.answer);for(let i=0;values.size<4&&i<30;i++)values.add(String(Math.max(0,correct+(i%2?1:-1)*(1+Math.floor(i/2)))));}
 const options=shuffle([...values].slice(0,4),random).map((text,i)=>({id:String.fromCharCode(97+i),text}));
 return {id:`${slot.id}:${hash(task)}`,slotId:slot.id,task,...d,leadIn:leadIn||leadFor(slot),options,input:slot.input,source};
}
export function leadFor(slot:Slot){return slot.nodeId==='tile-49'?'Rồng Thần đang chờ câu trả lời của em.':'Giải câu đố tại ô này rồi gieo xúc xắc đi tiếp.';}
function localTask(slot:Slot,c:Config,random:()=>number):Task {
 const int=(a:number,b:number)=>a+Math.floor(random()*(b-a+1));
 switch(slot.kind){
  case 'arithmetic':{
   const max=limits(c),multi=c.grade>=2&&c.difficulty!=='easy'&&random()<.35;
   if(multi){const a=int(2,Math.min(12,c.grade+5)),b=int(2,Math.min(12,c.grade+5)),divide=random()<.5;return {kind:'arithmetic',a:divide?a*b:a,b,op:divide?'divide':'multiply',target:'result'};}
   const sub=random()<.5;let a=int(1,Math.floor(max*.55)),b=int(1,Math.floor(max*.4));if(sub&&a<b)[a,b]=[b,a];
   if(c.grade===2&&c.difficulty==='easy'){a=int(1,5)*10+int(1,9);b=int(0,3)*10+int(0,sub?a%10:9-a%10);if(sub&&b>a)b=a%10;}
   return {kind:'arithmetic',a,b,op:sub?'subtract':'add',target:!sub&&c.grade>=2&&c.difficulty==='hard'&&random()<.4?'missing':'result'};
  }
  case 'count':return {kind:'count',left:int(1,countLimit(c)),right:int(0,countLimit(c)),object:(['gem','apple','star'] as const)[int(0,2)]};
  case 'clock':return {kind:'clock',hour:int(1,12),minute:int(0,c.grade<=1?1:11)*(c.grade<=1?30:5)};
  case 'shape':return {kind:'shape',shape:Object.keys(SHAPES)[int(0,3)] as any};
  case 'color':return {kind:'color',color:Object.keys(COLORS)[int(0,5)] as any};
  case 'fact':{const facts=factsForGrade(c.grade);return {kind:'fact',factId:facts[int(0,facts.length-1)][0]};}
 }
}
export function createLocalQuestions(c:Config,slots:Slot[],seed:number,exclude:Question[]=[]):Record<string,Question>{
 const random=rng(seed),seen=new Set(exclude.map(q=>hash(q.task))),result:Record<string,Question>={};
 for(const slot of slots){let task:Task;for(let i=0;i<100;i++){task=localTask(slot,c,random);if(validateTask(task,slot,c)&&(!['arithmetic','count','clock'].includes(task.kind)||!seen.has(hash(task))))break;}
  if(!validateTask(task!,slot,c))throw new Error('Chưa tạo được câu hỏi phù hợp.');seen.add(hash(task));result[slot.id]=makeQuestion(slot,task,Math.floor(random()*0xffffffff));
  result[slot.id].leadIn=slot.nodeId==='tile-49'?'Rồng Thần đang chờ câu trả lời của em.':'Giải câu đố tại ô này rồi gieo xúc xắc đi tiếp.';
 }return result;
}
export function assemble(questions:Record<string,Question>,notice=''):Prepared {const count=Object.values(questions).filter(q=>q.source==='ai').length;return{questions,source:count===0?'local':count===Object.keys(questions).length?'ai':'mixed',hash:hash(questions),notice};}
export function correct(q:Question,input:string){const v=input.normalize('NFC').trim();return q.input?/^\d+$/.test(v)&&Number(v)===Number(q.answer):q.options.find(o=>o.id===v)?.text===q.answer;}
export function validatePrepared(p:any,slots:Slot[],c:Config):p is Prepared {
 if(!p||!p.questions||!['ai','local','mixed'].includes(p.source)||typeof p.notice!=='string'||p.notice.length>400||p.hash!==hash(p.questions)||Object.keys(p.questions).length!==slots.length)return false;
 for(const slot of slots){const q=p.questions[slot.id];if(!q||!validateTask(q.task,slot,c)||q.slotId!==slot.id||q.id!==`${slot.id}:${hash(q.task)}`||q.input!==slot.input||!['ai','local'].includes(q.source)||typeof q.leadIn!=='string'||q.leadIn.length>180)return false;
  const d=describeTask(q.task);if(q.answer!==d.answer||q.text!==d.text||q.hint!==d.hint||q.explanation!==d.explanation||!Array.isArray(q.options)||q.options.length!==4||new Set(q.options.map(o=>o.id)).size!==4||new Set(q.options.map(o=>o.text)).size!==4||q.options.filter(o=>o.text===q.answer).length!==1||q.options.some(o=>!['a','b','c','d'].includes(o.id)||typeof o.text!=='string'||o.text.length>160))return false;
 }return assemble(p.questions).source===p.source;
}


