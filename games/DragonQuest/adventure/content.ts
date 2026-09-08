import { Config, MapNode, Mission, Region, Slot, TaskKind } from './model';
import { generateMap } from '../engine/map';
import { makeRng } from '../engine/rng';

export const REGIONS:Region[]=[
 {id:'forest',name:'Rừng Mầm Sáng',description:'Qua những tán cây, đánh thức một người bạn.',dragon:'Rồng Mầm',gift:'Mầm cây biết hát',color:'#287768',ground:'#8dbb76',rock:'#648a70',sky:'#e5f2e9',accent:'#e8b75b'},
 {id:'wind',name:'Quần đảo Gió',description:'Theo cánh buồm bay, tìm đường giữa tầng mây.',dragon:'Rồng Gió',gift:'Cánh buồm cầu vồng',color:'#357e9d',ground:'#9dcbbc',rock:'#789cab',sky:'#deeff8',accent:'#efc776'},
 {id:'crystal',name:'Hang Pha Lê',description:'Những viên đá sáng đang giấu điều kỳ diệu.',dragon:'Rồng Ngọc',gift:'Tinh thể ngân vang',color:'#5564a1',ground:'#afa7cf',rock:'#766f98',sky:'#e8e7f5',accent:'#efbaca'},
 {id:'snow',name:'Đỉnh Tuyết',description:'Thắp ánh đèn ấm giữa những ngọn núi tuyết.',dragon:'Rồng Tuyết',gift:'Ngọn đèn phương Bắc',color:'#3c7b90',ground:'#e2eee8',rock:'#8babb6',sky:'#e8f0f7',accent:'#efa873'},
 {id:'castle',name:'Thành Rồng',description:'Mở cánh cổng cuối. Cả vương quốc đang chờ em.',dragon:'Rồng Thần',gift:'Vương miện bình minh',color:'#a56948',ground:'#d9c693',rock:'#9c9278',sky:'#f5eddd',accent:'#e9b454'},
];
const titles=[['Người bạn trong lá','Cây cầu đầu tiên','Lối rẽ bí mật','Lời hẹn của rừng'],['Bến mây nhỏ','Cối gió thức giấc','Cánh buồm thất lạc','Vượt tầng mây'],['Ánh sáng trong đá','Tiếng vang lấp lánh','Cánh cổng ngọc','Trái tim pha lê'],['Dấu chân trên tuyết','Ngọn đèn ấm áp','Băng qua đỉnh núi','Bầu trời phương Bắc'],['Lá thư của rồng','Tháp đồng hồ cổ','Năm ngọn đuốc','Bình minh trở lại']];
const gifts=[['Hạt mầm','Cây cầu gỗ','Nhà của tiên','Mầm cây biết hát'],['Chuông gió','Cối xay','Thuyền mây','Cánh buồm cầu vồng'],['Ngọc xanh','Đèn pha lê','Vòm tinh thể','Tinh thể ngân vang'],['Cây thông','Lều tuyết','Tháp đèn','Ngọn đèn phương Bắc'],['Lá cờ','Tháp canh','Cổng thành','Vương miện bình minh']];
export const MISSIONS:Mission[]=REGIONS.flatMap((r,ri)=>titles[ri].map((title,i)=>({id:`${r.id}-${i+1}`,region:r.id,index:ri*4+i,title,brief:i===0?`Khám phá ${r.name.toLocaleLowerCase('vi')}, gieo xúc xắc và giúp ${r.dragon} gỡ phong ấn.`:`Gieo xúc xắc, gặp nàng tiên và thu thập ${gifts[ri][i].toLocaleLowerCase('vi')}.`,bossShields:5,gift:gifts[ri][i]})));
export const missionOf=(id:string)=>MISSIONS.find(m=>m.id===id)!;
export const regionOf=(id:string)=>REGIONS.find(r=>r.id===missionOf(id)?.region)||REGIONS[0];

export const TILE_STYLE:Record<MapNode['kind'],{name:string;color:string;ink:string;symbol:string}>={
 normal:{name:'Ô thường',color:'#f4edda',ink:'#66755b',symbol:'·'},
 combat:{name:'Quái vật',color:'#edc6b4',ink:'#944732',symbol:'⚔'},
 buff:{name:'Nàng tiên · Buff',color:'#d6e9ad',ink:'#446e35',symbol:'✦'},
 teleport:{name:'Cạm bẫy dịch chuyển',color:'#dcd3ed',ink:'#705094',symbol:'↔'},
 boss:{name:'Rồng Thần',color:'#f2d48e',ink:'#895f22',symbol:'♛'},
};
export function createMap(missionId:string,seed:number):MapNode[]{
 if(!missionOf(missionId))throw new Error('Màn chơi không tồn tại');
 return generateMap(makeRng(seed)).map(tile=>{const row=Math.floor(tile.position/10),col=row%2?9-tile.position%10:tile.position%10;
  return {id:`tile-${tile.id}`,index:tile.position,kind:tile.type,x:(col-4.5)*1.12,z:3-row*1.5,next:tile.position<49?[`tile-${tile.id+1}`]:[],title:tile.type==='boss'?regionOf(missionId).dragon:TILE_STYLE[tile.type].name};
 });
}
export function createSlots(config:Config,map:MapNode[]):Slot[]{
 const m=missionOf(config.missionId),list:Slot[]=[];
 const types:TaskKind[]=config.topic==='math'?config.grade===0?['count']:['arithmetic','count','arithmetic']:config.topic==='observe'?['count','clock','shape','color']:config.topic==='knowledge'?['fact']:config.grade===0?['count','shape','color']:['arithmetic','count','clock','fact','shape','arithmetic','color'];
 for(const node of map){if(node.kind==='normal'||node.kind==='teleport')continue;const count=node.kind==='boss'?5:1;
  for(let i=0;i<count;i++){let kind=types[(list.length+m.index)%types.length];if(config.grade===0&&kind==='clock')kind='count';list.push({id:`${node.id}:${i}`,nodeId:node.id,bossPhase:i,kind,difficulty:config.difficulty,input:kind==='arithmetic'&&config.grade>0&&(list.length+m.index)%4===3});}}
 return list;
}
export const NODE_COPY:Record<MapNode['kind'],{title:string;line:string;action:string}>={
 normal:{title:'Một ô bình yên',line:'Gieo xúc xắc để đi tiếp.',action:'Gieo xúc xắc'},
 combat:{title:'Quái vật chắn đường!',line:'Đúng được 10 điểm. Sai mất một tim rồi đi tiếp.',action:'Giải câu hỏi'},
 buff:{title:'Nàng tiên mang quà đến',line:'Trả lời đúng để nhận một buff và 15 điểm. Sai không mất máu.',action:'Nhận thử thách'},
 teleport:{title:'Cạm bẫy dịch chuyển',line:'Em có thể tiến hoặc lùi tối đa tám ô.',action:'Dịch chuyển'},
 boss:{title:'Đại chiến rồng thần',line:'Vượt hết lượt câu hỏi khi còn máu để chiến thắng. Kiếm Thánh giảm số câu.',action:'Đấu với rồng'},
};

