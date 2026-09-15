export const CARD_TEXT={
 'community-0':['Hội chợ cuối tuần','Gian hàng đông khách. Nhận 100 xu.','🎪'],
 'community-1':['Đơn hàng của hàng xóm','Nhận 150 xu từ một đơn hàng mới.','🎁'],
 'community-2':['Khu vườn xanh','Đóng góp 100 xu chăm vườn chung.','🌱'],
 'community-3':['Biển hiệu mới','Trả 100 xu sửa biển hiệu.','🪧'],
 'community-4':['Cả phố cùng vui','Mỗi người còn trong ván nhận 50 xu.','🎉'],
 'community-5':['Ngân hàng hoàn phí','Nhận ngay 50 xu từ ngân hàng.','🪙'],
 'chance-0':['Về quảng trường','Đến ô Bắt đầu và nhận 200 xu.','🏁'],
 'chance-1':['Khám phá cửa tiệm','Tiến đến cửa hàng chưa có chủ gần nhất.','🗺'],
 'chance-2':['Quên chiếc mũ','Lùi 3 ô, xử lý mua đất hoặc tiền thuê. Không rút nối tiếp thẻ khác.','👒'],
 'chance-3':['Món quà bất ngờ','Nhận 100 xu từ ngân hàng.','🎁'],
 'chance-4':['Chiếc xe cần sửa','Trả 150 xu sửa xe.','🔧'],
 'chance-5':['Vào tù','Đến Nhà tù. Không nhận 200 xu khi đi qua Bắt đầu.','🔒'],
 'community-6':['Phí ngân hàng','Trả 200 xu phí dịch vụ ngân hàng.','🏦'],
 'community-7':['Tài trợ khu phố','Nhận 150 xu tài trợ cho khu phố.','🏆'],
 'community-8':['Xe giao hàng hỏng','Trả 100 xu sửa xe giao hàng.','🛵'],
 'community-9':['Sinh nhật vui vẻ','Nhận 100 xu quà sinh nhật.','🎂'],
 'chance-6':['Xúc xắc may mắn','Được gieo thêm một lần trong lượt này. Vẫn chỉ được nâng cấp một lần mỗi lượt.','🎲'],
 'chance-7':['Chuyến xe tốc hành','Tiến 3 ô, xử lý mua đất hoặc tiền thuê. Không rút nối tiếp thẻ khác.','🚋'],
 'chance-8':['Đến kỳ đóng thuế','Trả 250 xu cho ngân hàng.','🧾'],
 'chance-9':['Chậu hoa bị vỡ','Trả 50 xu để thay chậu hoa.','🪴'],
} as const;
export type Deck='community'|'chance';
export const cardKey=(id:string)=>id.split(':')[0] as keyof typeof CARD_TEXT;
export const cardDeck=(id:string):Deck=>id.startsWith('community')?'community':'chance';
export function deckIds(deck:Deck){return Array.from({length:10},(_,i)=>`${deck}-${i}:0`);}

export function cardMood(id:string){const key=cardKey(id);return ['community-2','community-3','community-6','community-8','chance-4','chance-5','chance-8','chance-9'].includes(key)?'challenge':['chance-0','chance-1','chance-2','chance-6','chance-7'].includes(key)?'journey':'gift';}
