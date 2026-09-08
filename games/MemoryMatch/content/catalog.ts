import { MemoryConfig, MemoryMission, ZoneId } from '../engine/model';

export const PICTURES = {
    fox: 'Cáo', cat: 'Mèo', bear: 'Gấu', rabbit: 'Thỏ', panda: 'Gấu trúc', lion: 'Sư tử', penguin: 'Chim cánh cụt', frog: 'Ếch', owl: 'Cú mèo', whale: 'Cá voi', butterfly: 'Bướm', turtle: 'Rùa',
    bus: 'Xe buýt', firetruck: 'Xe cứu hỏa', taxi: 'Taxi', tractor: 'Máy kéo', bike: 'Xe đạp', train: 'Tàu hỏa', boat: 'Thuyền buồm', plane: 'Máy bay', house: 'Ngôi nhà', school: 'Trường học', lighthouse: 'Hải đăng', windmill: 'Cối xay gió',
    sun: 'Mặt Trời', earth: 'Trái Đất', mars: 'Sao Hỏa', saturn: 'Sao Thổ', moon: 'Mặt Trăng', rocket: 'Tên lửa', astronaut: 'Phi hành gia', ufo: 'Đĩa bay tưởng tượng', comet: 'Sao chổi', star: 'Ngôi sao', satellite: 'Vệ tinh', rover: 'Xe thám hiểm',
    circle: 'Hình tròn', square: 'Hình vuông', triangle: 'Tam giác', heart: 'Trái tim', hexagon: 'Lục giác', diamond: 'Hình thoi', crescent: 'Trăng lưỡi liềm', cloud: 'Đám mây', cross: 'Dấu cộng', flower: 'Bông hoa', bolt: 'Tia chớp', drop: 'Giọt nước',
} as const;
export type PictureId = keyof typeof PICTURES;
export const ZONES: { id:ZoneId; name:string; subtitle:string; color:string; light:string; icon:PictureId; pool:PictureId[] }[] = [
    { id:'garden',name:'Vườn bạn nhỏ',subtitle:'Gặp những người bạn dễ thương',color:'#347e6b',light:'#e8f3df',icon:'fox',pool:['fox','cat','bear','rabbit','panda','lion','penguin','frog','owl','whale','butterfly','turtle'] },
    { id:'town',name:'Thị trấn tí hon',subtitle:'Những chuyến xe và mái nhà',color:'#cb7042',light:'#fff0dc',icon:'bus',pool:['bus','firetruck','taxi','tractor','bike','train','boat','plane','house','school','lighthouse','windmill'] },
    { id:'space',name:'Trạm không gian',subtitle:'Mang trí nhớ bay thật xa',color:'#7772ba',light:'#efedff',icon:'rocket',pool:['sun','earth','mars','saturn','moon','rocket','astronaut','ufo','comet','star','satellite','rover'] },
    { id:'shapes',name:'Xưởng hình học',subtitle:'Nhận ra hình, nhớ đường nét',color:'#32899b',light:'#e3f4f5',icon:'flower',pool:['circle','square','triangle','heart','hexagon','diamond','crescent','cloud','cross','flower','bolt','drop'] },
    { id:'festival',name:'Đảo hội ngộ',subtitle:'Một ngày hội của mọi khám phá',color:'#bc6683',light:'#ffecf2',icon:'butterfly',pool:['fox','rabbit','penguin','frog','bus','bike','boat','house','rocket','saturn','astronaut','star','flower','heart','turtle','lighthouse','earth','butterfly'] },
];
const counts = [[3,4,4,6,6,8],[4,6,6,8,8,10],[4,6,8,8,10,12],[4,6,6,8,10,12],[6,8,8,10,12,12]];
const titles = [
    ['Chào bạn mới!','Bốn người bạn','Góc vườn quen','Nhìn một chút nhé','Bạn ở đâu nhỉ?','Khu vườn sum vầy'],
    ['Phố vừa thức giấc','Những bánh xe vui','Dạo quanh thị trấn','Ghi nhớ con phố','Chuyến xe của em','Ngày hội trong phố'],
    ['Chào vũ trụ!','Theo dấu tên lửa','Những bạn xa xôi','Một thoáng trời sao','Chuyến thám hiểm xa','Về trạm cùng nhau'],
    ['Hình nào cũng xinh','Nhớ đường nét','Tìm chiếc bóng','Chiếc bóng quen thuộc','Xưởng sắc màu','Bậc thầy hình dáng'],
    ['Những người bạn cũ','Một phố dưới sao','Nhớ ngày hội','Cùng nhau khám phá','Chuyến đi cuối','Đảo ký ức của em'],
];
export const GIFTS = ['Hàng cây xanh','Căn nhà ấm áp','Vườn hoa nhỏ','Chiếc thuyền vui','Tháp ngắm cảnh','Cổng cầu vồng'];
export const REGION_GIFTS:Record<ZoneId,string[]>={
    garden:GIFTS,
    town:['Công viên nhỏ','Ngôi trường mới','Vườn hoa bên phố','Bến thuyền vui','Tháp đồng hồ','Cổng ngày hội'],
    space:['Vườn tinh thể','Trạm nghiên cứu','Đèn dẫn đường','Xe thám hiểm','Đài quan sát','Cổng quỹ đạo'],
    shapes:['Khu rừng hình học','Ngôi nhà hình khối','Vườn hoa sắc màu','Thuyền tam giác','Tháp hình học','Cổng sắc màu'],
    festival:['Hàng cây ngày hội','Ngôi nhà sum vầy','Đường hoa','Thuyền lễ hội','Tháp ánh sáng','Cổng cầu vồng'],
};
export const MISSIONS: MemoryMission[] = ZONES.flatMap((z,zi)=>counts[zi].map((pairs,i)=>({
    id:`${z.id}-${i+1}`,zone:z.id,number:i+1,title:titles[zi][i],pairs,
    rule:zi===3&&[2,3,5].includes(i)?'shadow':'same',preview:[3].includes(i)||(zi===4&&i===2)?5:0,
    skill:zi===3&&[2,3,5].includes(i)?'Ghép hình với bóng':i===3?'Quan sát trước rồi ghi nhớ':i===0?'Làm quen với bộ hình':i===5?'Tự tin khám phá':'Nhớ vị trí, tìm người bạn',
    gift:REGION_GIFTS[z.id][i],tip:zi===3&&[2,3,5].includes(i)?'Mỗi hình có một chiếc bóng. Tìm đường nét giống nhau nhé.':i===0?'Chạm hai thẻ để tìm hai hình giống nhau. Chưa đúng thì thử tiếp nhé!':i===3?'Ngắm các thẻ trước khi úp. Nhớ vài vị trí gần nhau cũng là một khởi đầu tốt.':'Thử nhớ theo từng hàng. Một hình vừa gặp có thể xuất hiện ở lượt sau!',
})));
export const missionConfig = (m:MemoryMission,relaxed=false):MemoryConfig=>({zone:m.zone,pairs:m.pairs,rule:m.rule,preview:relaxed?-1:m.preview,relaxed,missionId:m.id});
export function poolFor(config: MemoryConfig): PictureId[] {
    const z=ZONES.find(z=>z.id===config.zone)!;
    if(config.missionId){const m=MISSIONS.find(m=>m.id===config.missionId);if(m)return z.pool.slice(0,m.number===1?Math.max(4,config.pairs):m.number===2?Math.max(8,config.pairs):z.pool.length);}
    // Large free-play boards add clearly different figures, never duplicate a picture.
    if(config.pairs<=z.pool.length||config.rule==='shadow')return z.pool;
    return [...new Set([...z.pool,...ZONES.find(z=>z.id==='festival')!.pool])];
}
export function validConfig(value: unknown): value is MemoryConfig {
    if(!value||typeof value!=='object')return false;
    const c=value as MemoryConfig;
    if(!ZONES.some(z=>z.id===c.zone)||![3,4,6,8,10,12,15].includes(c.pairs)||!['same','shadow'].includes(c.rule)||![0,3,5,8,-1].includes(c.preview)||typeof c.relaxed!=='boolean')return false;
    if(c.rule==='shadow'&&c.zone!=='shapes')return false;
    if(c.relaxed&&c.preview!==-1)return false;
    if(c.missionId!==undefined){const m=MISSIONS.find(m=>m.id===c.missionId);if(!m||JSON.stringify(missionConfig(m,c.relaxed))!==JSON.stringify({zone:c.zone,pairs:c.pairs,rule:c.rule,preview:c.preview,relaxed:c.relaxed,missionId:c.missionId}))return false;}
    return poolFor(c).length>=c.pairs;
}
