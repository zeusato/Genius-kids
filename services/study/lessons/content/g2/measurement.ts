import { lesson, know, rule, text, pic, table, mistake, vis } from '../../build';
import { example as ex, step as s } from '../authored';
import type { LessonBook } from '../../types';
export default {
 'g2.kg': lesson('g2.kg',{v:1,goal:'đọc cân và tính số đo ki-lô-gam.',
  know:[know('Đĩa cân thấp hơn',rule('Khi cân thăng bằng đúng cách, đĩa thấp hơn chứa vật nặng hơn.'),pic('balanceSVG',{e:'🍉',kg:3,w:3},{e:'🍍',kg:2,w:2}),text('3 kg nặng hơn 2 kg.')),know('Tính cùng đơn vị',rule('Cộng, trừ số đo cùng đơn vị kg.'),text('5 kg thêm 3 kg được 8 kg.'))],
  forms:[ex('can','Dạng 1: Đọc và so sánh cân',1,'Đề hỏi vật nặng hơn hoặc nhẹ hơn.',['Quan sát đĩa cân hoặc số đo.','Chọn vật theo yêu cầu.'],'Túi gạo nặng 5 kg, túi đậu nặng 3 kg. Túi nào nhẹ hơn?',[s('3 kg nhẹ hơn 5 kg.')],'Túi đậu.'),ex('tinh','Dạng 2: Tính khối lượng',2,'Đề hỏi tổng khối lượng.',['Lấy hai số đo cùng đơn vị.','Cộng rồi ghi kg.'],'Hai túi gạo nặng 15 kg và 8 kg. Tất cả nặng bao nhiêu?',[s('Tất cả nặng là:', '15 + 8 = 23 (kg)')],'Đáp số: 23 kg.',{layout:'solution'})],
  remember:['kg là ki-lô-gam.','So sánh khối lượng, không chỉ nhìn kích thước.']}),
 'g2.liter': lesson('g2.liter',{v:1,goal:'đọc và tính lượng chất lỏng bằng lít.',
  know:[know('Đong bằng lít',rule('Lít dùng để đo lượng chất lỏng. Viết tắt là l.'),pic('bigEmojiSVG','🥛'),text('Bình có 2 l nước, can có 5 l nước.'))],
  forms:[ex('cong','Dạng 1: Gộp lượng nước',1,'Đổ chung hai lượng chất lỏng.',['Đọc số lít mỗi phần.','Cộng hai số đo.'],'Có 7 l nước, thêm 5 l. Tất cả bao nhiêu lít?',[s('Tất cả có là:', '7 + 5 = 12 (l)')],'Đáp số: 12 l nước.',{layout:'solution'}),ex('tru','Dạng 2: Lượng còn lại',2,'Lấy bớt nước khỏi bình.',['Xác định lượng ban đầu.','Trừ lượng đã lấy.'],'Can có 18 l, dùng 6 l. Còn bao nhiêu lít?',[s('Lượng nước còn là:', '18 − 6 = 12 (l)')],'Đáp số: 12 l nước.',{layout:'solution'})],
  remember:['Lít viết là l.','Bình cao hơn chưa chắc chứa nhiều hơn.']}),
 'g2.length': lesson('g2.length',{v:1,goal:'đổi dm, m, km và chọn đơn vị độ dài phù hợp.',
  know:[know('Quan hệ đơn vị',rule('1 dm bằng 10 cm. 1 m bằng 10 dm hoặc 100 cm.'),text('1 km bằng 1000 m. 3 dm bằng 30 cm.')),know('Chọn đơn vị phù hợp',pic('rulerSVG',10),text('Bút dài khoảng 15 cm. Bảng dài khoảng 3 m. Đường giữa hai xã tính bằng km.'))],
  forms:[ex('doi','Dạng 1: Đổi đơn vị',1,'Đổi số đo sang đơn vị khác.',['Nhớ quan hệ đơn vị.','Nhân hoặc chia theo quan hệ.'],'Đổi 4 m ra dm.',[s('Mỗi mét có 10 dm.', '4 × 10 = 40')],'40 dm.'),ex('chon','Dạng 2: Ước lượng độ dài',2,'Chọn đơn vị phù hợp đồ vật.',['Hình dung kích thước thật.','Chọn cm, dm, m hoặc km.'],'Chiều dài lớp học khoảng 8 cm, 8 m hay 8 km?',[s('Lớp học dài vài mét.')],'8 m.')],
  mistakes:[mistake('Bạn Bi viết 1 m bằng 10 cm.','1 m bằng 100 cm.','1 m có 10 dm, mỗi dm có 10 cm.')],remember:['dm, m, km đo độ dài khác nhau.','Đổi cùng đơn vị trước khi so sánh.']}),
 'g2.clock': lesson('g2.clock',{v:1,goal:'đọc giờ khi kim phút chỉ 3 hoặc 6.',
  know:[know('Mỗi khoảng là 5 phút',rule('Kim phút chỉ 3: 15 phút. Kim phút chỉ 6: 30 phút.'),pic('clockSVG',8,15),text('Đồng hồ chỉ 8 giờ 15 phút.')),know('Kim giờ đang đi tiếp',pic('clockSVG',8,30),text('8 giờ 30 phút còn gọi là 8 giờ rưỡi.'))],
  forms:[ex('muoilam','Dạng 1: Giờ 15 phút',1,'Kim dài chỉ 3.',['Đọc giờ theo kim ngắn.','Thêm 15 phút.'],'Đọc giờ trên đồng hồ.',[s('Kim giờ vừa qua 10. Kim phút chỉ 3.')],'10 giờ 15 phút.',{visual:vis('clockSVG',10,15)}),ex('ruoi','Dạng 2: Giờ rưỡi',2,'Kim dài chỉ 6.',['Đọc số giờ đã qua.','Thêm 30 phút.'],'Kim giờ giữa 4 và 5, kim phút chỉ 6.',[s('Đã qua 4 giờ, chưa đến 5 giờ.')],'4 giờ 30 phút.')],
  mistakes:[mistake('Bạn Bi đọc 5 giờ 30 khi kim giờ giữa 4 và 5.','Phải đọc 4 giờ 30 phút.','Kim giờ chưa tới 5.')],remember:['Kim phút chỉ 3: 15 phút.','Kim phút chỉ 6: 30 phút.']}),
 'g2.hours_day': lesson('g2.hours_day',{v:1,goal:'hiểu 24 giờ trong ngày và 60 phút trong giờ.',
  know:[know('Một ngày có 24 giờ',rule('Một ngày có 24 giờ. Một giờ có 60 phút.'),text('Sau 12 giờ trưa là 13 giờ, tức 1 giờ chiều.')),know('Giờ buổi chiều, tối',table(['Cách đọc','Giờ'],[['2 giờ chiều','14 giờ'],['7 giờ tối','19 giờ'],['9 giờ tối','21 giờ']]))],
  forms:[ex('gio','Dạng 1: Đọc giờ chiều, tối',1,'Đổi giờ buổi chiều sang cách ghi 24 giờ.',['Xác định giờ sau buổi trưa.','Cộng thêm 12.'],'3 giờ chiều là mấy giờ?',[s('3 + 12 = 15.')],'15 giờ.'),ex('phut','Dạng 2: Đổi giờ ra phút',2,'Đề hỏi số phút trong một số giờ.',['Nhớ mỗi giờ có 60 phút.','Cộng các phần 60 phút.'],'2 giờ có bao nhiêu phút?',[s('60 + 60 = 120.')],'120 phút.')],
  remember:['Một ngày có 24 giờ.','Một giờ có 60 phút.']}),
 'g2.calendar_month': lesson('g2.calendar_month',{v:1,goal:'đọc ngày, thứ trên lịch tháng.',
  know:[know('Đọc theo hàng và cột',rule('Cột cho biết thứ. Ô có số cho biết ngày trong tháng.'),pic('calendarMonthSVG',10,4,31,9),text('Lịch tháng 10 này bắt đầu vào thứ Năm. Ngày 9 là thứ Sáu.'))],
  forms:[ex('doc','Dạng 1: Tìm thứ của một ngày',1,'Đề cho lịch tháng.',['Tìm ô có ngày cần đọc.','Dò lên tên thứ.'],'Theo lịch trên, ngày 9 là thứ mấy?',[s('Ngày 9 nằm ở cột thứ Sáu.')],'Thứ Sáu.',{visual:vis('calendarMonthSVG',10,4,31,9)}),ex('tuan','Dạng 2: Cùng thứ tuần sau',2,'Hỏi cùng thứ sau một tuần.',['Nhớ một tuần có 7 ngày.','Thêm 7 vào ngày đã biết.'],'Ngày 9 là thứ Sáu. Thứ Sáu tuần sau là ngày nào?',[s('9 + 7 = 16.')],'Ngày 16.')],
  mistakes:[mistake('Bạn Bi nói tuần sau ngày 9 là ngày 10.','Cùng thứ tuần sau là ngày 16.','Một tuần cách 7 ngày, không phải 1 ngày.')],remember:['Dò đúng cột thứ.','Cùng thứ hai tuần liên tiếp cách 7 ngày.']}),
} satisfies LessonBook;
