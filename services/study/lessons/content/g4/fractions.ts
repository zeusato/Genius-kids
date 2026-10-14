import { lesson, know, rule, text, pic, widget, explore, vis, mistake } from '../../build';
import { example as ex, step as s } from '../authored';
import type { LessonBook } from '../../types';

export default {
 'g4.fraction_concept': lesson('g4.fraction_concept', {
  v:1,goal:'đọc, viết phân số và hiểu tử số, mẫu số.',
  hook:{md:'Một chiếc bánh chia thành 8 phần bằng nhau. Em ăn 3 phần. Em đã ăn bao nhiêu phần chiếc bánh?',answer:'Em đã ăn 3/8 chiếc bánh.'},
  know:[know('Các phần phải bằng nhau',rule('Mẫu số cho biết số phần bằng nhau của một đơn vị. Tử số cho biết số phần được lấy.'),pic('fractionPieSVG',3,8),text('Đọc 3/8 là ba phần tám. Mẫu số phải khác 0.')),know('Chạm để tô thêm',widget(explore({title:'Tô các phần bằng nhau',controls:{n:{label:'Phần đã tô',min:0,max:8,init:3}},visual:v=>vis('fractionBarSVG',v.n,8),caption:v=>`Đã tô ${v.n}/8 của thanh.`})))],
  forms:[ex('hinh','Dạng 1: Viết phân số từ hình',1,'Một hình được chia đều và tô một số phần.',['Đếm tổng số phần bằng nhau làm mẫu số.','Đếm phần tô làm tử số.'],'Thanh chia thành 6 phần bằng nhau, tô 5 phần.',[s('Mẫu số là 6; tử số là 5.')],'5/6.',{visual:vis('fractionBarSVG',5,6)}),ex('doc','Dạng 2: Đọc và gọi tên thành phần',1,'Đề cho sẵn một phân số.',['Đọc tử số, chữ phần, rồi mẫu số.','Nêu đúng vị trí của mỗi số.'],'Đọc phân số 7/9.',[s('Tử số là 7, mẫu số là 9.')],'Bảy phần chín.')],
  mistakes:[mistake('Bạn Bi ghi 8/3 khi lấy 3 trong 8 phần bằng nhau.','Phân số đúng là 3/8.','Số phần được lấy ở tử số; tổng số phần bằng nhau ở mẫu số.')],remember:['Chia đơn vị thành các phần bằng nhau.','Tử số ở trên, mẫu số ở dưới.'],
 }),
 'g4.fraction_equiv': lesson('g4.fraction_equiv', {
  v:1,goal:'tạo phân số bằng nhau và rút gọn phân số.',needs:['g4.fraction_concept'],
  know:[know('Nhân hoặc chia cả hai số',rule('Nhân cả tử và mẫu với cùng một số tự nhiên khác 0 được phân số bằng phân số đã cho.'),text('2/3 = 4/6. Có thể chia cả tử và mẫu cho cùng một ước chung khác 0.'),pic('fractionBarSVG',4,6))],
  forms:[ex('bang','Dạng 1: Tìm phân số bằng nhau',1,'Đề hỏi phân số bằng phân số ban đầu.',['Chọn cùng một số nhân.','Nhân cả tử và mẫu.'],'Viết 3/4 thành phân số có mẫu 12.',[s('Mẫu số gấp lên:', '12 : 4 = 3'),s('Tử số mới:', '3 × 3 = 9')],'3/4 = 9/12.'),ex('rut','Dạng 2: Rút gọn',2,'Tử và mẫu cùng chia hết cho một số lớn hơn 1.',['Tìm số chia chung.','Chia cả tử và mẫu; làm tiếp đến tối giản.'],'Rút gọn 12/18.',[s('12 và 18 cùng chia hết cho 6.'),s('Tử mới 12 : 6 = 2; mẫu mới 18 : 6 = 3.')],'12/18 = 2/3.')],
  mistakes:[mistake('Bạn Bi rút gọn 12/18 thành 2/18.','12/18 = 2/3.','Phải chia cả tử và mẫu cho cùng một số.')],remember:['Làm cùng phép tính ở tử và mẫu.','Phân số tối giản không còn ước chung lớn hơn 1.'],
 }),
 'g4.fraction_common': lesson('g4.fraction_common', {
  v:1,goal:'quy đồng mẫu số hai phân số.',needs:['g4.fraction_equiv'],
  know:[know('Đưa về cùng mẫu',rule('Quy đồng là viết các phân số thành những phân số bằng chúng và có cùng mẫu số.'),text('1/2 = 3/6 và 1/3 = 2/6. Mẫu số chung có thể là tích hai mẫu.'))],
  forms:[ex('tich','Dạng 1: Dùng tích hai mẫu',2,'Hai mẫu số chưa có quan hệ chia hết thuận tiện.',['Lấy tích hai mẫu làm mẫu chung.','Nhân tử và mẫu mỗi phân số với mẫu của phân số kia.'],'Quy đồng 2/3 và 3/5.',[s('Mẫu chung:', '3 × 5 = 15'),s('2/3 = 10/15; 3/5 = 9/15.')],'10/15 và 9/15.'),ex('boi','Dạng 2: Một mẫu chia hết cho mẫu kia',2,'Mẫu lớn chia hết cho mẫu bé.',['Chọn mẫu lớn làm mẫu chung.','Đổi phân số có mẫu bé, giữ nguyên phân số kia.'],'Quy đồng 1/4 và 5/12.',[s('12 : 4 = 3, nhân tử và mẫu của 1/4 với 3.'),s('1/4 = 3/12; giữ nguyên 5/12.')],'3/12 và 5/12.')],
  mistakes:[mistake('Bạn Bi đổi 1/4 thành 1/12.','1/4 = 3/12.','Khi nhân mẫu với 3 phải nhân tử với 3.')],remember:['Giá trị phân số giữ nguyên.','Chọn mẫu chung nhỏ giúp tính gọn.'],
 }),
 'g4.fraction_compare': lesson('g4.fraction_compare', {
  v:1,goal:'so sánh phân số cùng mẫu, khác mẫu và với 1.',needs:['g4.fraction_common'],
  know:[know('So sánh khi cùng mẫu',rule('Hai phân số cùng mẫu: phân số có tử lớn hơn thì lớn hơn. Khác mẫu thì quy đồng trước.'),text('2/7 < 5/7. Với cùng tử số dương, mẫu nhỏ hơn cho phân số lớn hơn.')),know('So sánh với 1',rule('Tử bé hơn mẫu thì phân số bé hơn 1. Tử bằng mẫu thì bằng 1; tử lớn hơn mẫu thì lớn hơn 1.'),text('3/5 < 1; 5/5 = 1; 7/5 > 1.'))],
  forms:[ex('cung','Dạng 1: Cùng mẫu',1,'Hai mẫu số bằng nhau.',['Giữ nguyên mẫu số.','So sánh hai tử số.'],'So sánh 5/9 và 7/9.',[s('Cùng mẫu 9 và 5 < 7.')],'5/9 < 7/9.'),ex('khac','Dạng 2: Khác mẫu',2,'Hai mẫu số khác nhau.',['Quy đồng mẫu số.','So sánh tử số của hai phân số mới.'],'So sánh 3/4 và 5/6.',[s('Quy đồng: 3/4 = 9/12; 5/6 = 10/12.'),s('9 < 10.')],'3/4 < 5/6.')],
  mistakes:[mistake('Bạn Bi nói 1/8 > 1/4 vì 8 > 4.','1/8 < 1/4.','Cùng một chiếc bánh, chia thành nhiều phần bằng nhau thì mỗi phần nhỏ hơn.')],remember:['Khác mẫu: quy đồng rồi so sánh.','Cùng tử dương: mẫu lớn hơn thì phân số bé hơn.'],
 }),
 'g4.frac_addsub': lesson('g4.frac_addsub', {
  v:1,goal:'cộng, trừ phân số cùng mẫu và trường hợp một mẫu chia hết cho mẫu kia.',needs:['g4.fraction_common'],
  know:[know('Giữ nguyên mẫu chung',rule('Cộng hoặc trừ hai phân số cùng mẫu: cộng hoặc trừ các tử số, giữ nguyên mẫu số.'),text('2/7 + 3/7 = 5/7. 6/7 − 2/7 = 4/7.'),pic('fractionBarSVG',5,7))],
  forms:[ex('cung','Dạng 1: Cùng mẫu số',1,'Hai phân số có cùng mẫu.',['Cộng hoặc trừ tử số.','Giữ mẫu, rút gọn kết quả nếu được.'],'Tính 7/8 − 3/8.',[s('Trừ tử số:', '7 − 3 = 4'),s('Giữ mẫu 8, rút gọn:', '7/8 − 3/8 = 4/8 = 1/2')],'1/2.'),ex('boi','Dạng 2: Một mẫu là bội của mẫu kia',2,'Mẫu lớn chia hết cho mẫu bé.',['Đưa về mẫu lớn.','Cộng hoặc trừ rồi rút gọn.'],'Tính 1/3 + 1/6.',[s('1/3 = 2/6.'),s('Cộng:', '2/6 + 1/6 = 3/6 = 1/2')],'1/2.')],
  mistakes:[mistake('Bạn Bi tính 2/7 + 3/7 = 5/14.','2/7 + 3/7 = 5/7.','Các phần vẫn có kích thước một phần bảy nên giữ mẫu 7.')],remember:['Chỉ cộng, trừ tử khi cùng mẫu.','Rút gọn kết quả nếu có thể.'],
 }),
 'g4.frac_mul': lesson('g4.frac_mul', {
  v:1,goal:'nhân phân số và rút gọn kết quả.',needs:['g4.fraction_equiv'],
  know:[know('Nhân tử với tử, mẫu với mẫu',rule('Muốn nhân hai phân số, lấy tử số nhân tử số, mẫu số nhân mẫu số.'),text('2/3 × 3/4 = 6/12 = 1/2. Số tự nhiên có thể viết thành phân số mẫu 1.'))],
  forms:[ex('hai','Dạng 1: Nhân hai phân số',1,'Giữa hai phân số là dấu nhân.',['Nhân hai tử, nhân hai mẫu.','Rút gọn kết quả.'],'Tính 3/5 × 2/9.',[s('Tử số: 3 × 2 = 6; mẫu số: 5 × 9 = 45.'),s('Rút gọn:', '6/45 = 2/15')],'2/15.'),ex('so','Dạng 2: Nhân với số tự nhiên',2,'Một thừa số là số tự nhiên.',['Viết số tự nhiên với mẫu 1.','Nhân rồi rút gọn.'],'Tính 3 × 2/5.',[s('Viết 3 thành phân số 3/1.'),s('Nhân:', '3/1 × 2/5 = 6/5')],'6/5.')],
  mistakes:[mistake('Bạn Bi tính 2/3 × 3/4 = 6/4.','2/3 × 3/4 = 6/12 = 1/2.','Phải nhân cả hai mẫu số.')],remember:['Nhân tử với tử, mẫu với mẫu.','Không cần quy đồng khi nhân.'],
 }),
 'g4.frac_div': lesson('g4.frac_div', {
  v:1,goal:'chia phân số bằng cách nhân với phân số đảo ngược.',needs:['g4.frac_mul'],
  know:[know('Đảo phân số thứ hai',rule('Muốn chia một phân số cho phân số khác 0, nhân phân số thứ nhất với phân số đảo ngược của phân số thứ hai.'),text('2/3 : 4/5 = 2/3 × 5/4 = 5/6.'))],
  forms:[ex('chia','Dạng 1: Chia hai phân số',2,'Số chia là một phân số khác 0.',['Giữ phân số thứ nhất.','Đảo tử và mẫu phân số thứ hai, đổi chia thành nhân.','Nhân và rút gọn.'],'Tính 3/4 : 2/5.',[s('Đảo phân số thứ hai thành 5/2.'),s('Nhân:', '3/4 × 5/2 = 15/8')],'15/8.',{check:'15/8 × 2/5 = 3/4'}),ex('so','Dạng 2: Chia cho số tự nhiên',2,'Số chia là số tự nhiên khác 0.',['Viết số chia thành phân số mẫu 1.','Đảo số chia rồi nhân.'],'Tính 3/5 : 2.',[s('Đảo 2/1 thành 1/2.'),s('Tính:', '3/5 × 1/2 = 3/10')],'3/10.')],
  mistakes:[mistake('Bạn Bi đảo phân số đầu: 3/4 : 2/5 = 4/3 × 2/5.','Phải tính 3/4 × 5/2.','Chỉ đảo phân số thứ hai, là số chia.')],remember:['Giữ nguyên số bị chia.','Không chia cho 0.'],
 }),
 'g4.fraction_of': lesson('g4.fraction_of', {
  v:1,goal:'tìm phân số của một số và số còn lại.',needs:['g4.frac_mul'],
  know:[know('Chia theo mẫu, nhân theo tử',rule('Muốn tìm phân số của một số, lấy số đó nhân với phân số.'),text('2/3 của 24 là 24 : 3 × 2 = 16.'),pic('segmentDiagramSVG',[{label:'24',parts:[1,1,1],labels:['8','8','8']}]))],
  forms:[ex('tim','Dạng 1: Tìm một phần của số lượng',2,'Đề hỏi một phân số của số đã cho.',['Tìm giá trị một phần.','Nhân với tử số.'],'Lớp có 35 bạn, 3/5 số bạn tham gia văn nghệ. Có bao nhiêu bạn tham gia?',[s('Số bạn tham gia là:', '35 : 5 × 3 = 21 (bạn)')],'Đáp số: 21 bạn.',{layout:'solution'}),ex('con','Dạng 2: Tìm số còn lại',3,'Đề cho phần đã dùng, hỏi phần còn lại.',['Tính phần đã dùng.','Lấy tổng trừ phần đã dùng.'],'Có 40 quyển vở, đã tặng 3/8 số vở. Còn bao nhiêu quyển?',[s('Số vở đã tặng là:', '40 : 8 × 3 = 15 (quyển)'),s('Số vở còn lại là:', '40 − 15 = 25 (quyển)')],'Đáp số: 25 quyển vở.',{layout:'solution'})],
  mistakes:[mistake('Bạn Bi tính 3/8 của 40 bằng 40 : 3 × 8.','Tính đúng: 40 : 8 × 3 = 15.','Mẫu số cho số phần bằng nhau; tử số cho số phần cần lấy.')],remember:['Chia theo mẫu rồi nhân theo tử.','Hỏi còn lại thì cần thêm phép trừ.'],
 }),
 'g4.frac_addsub_any': lesson('g4.frac_addsub_any', {
  v:1,goal:'cộng, trừ hai phân số có mẫu số bất kỳ.',needs:['g4.fraction_common','g4.frac_addsub'],
  know:[know('Quy đồng trước khi tính',rule('Muốn cộng hoặc trừ hai phân số khác mẫu, quy đồng rồi cộng hoặc trừ các phân số cùng mẫu.'),text('1/2 + 1/3 = 3/6 + 2/6 = 5/6.'))],
  forms:[ex('cong','Dạng 1: Cộng khác mẫu',2,'Hai phân số khác mẫu không thuận tiện giữ mẫu lớn.',['Chọn mẫu chung.','Đổi cả hai phân số rồi cộng tử số.'],'Tính 2/3 + 3/4.',[s('Quy đồng: 2/3 = 8/12; 3/4 = 9/12.'),s('Cộng:', '8/12 + 9/12 = 17/12')],'17/12.'),ex('tru','Dạng 2: Trừ khác mẫu',2,'Hai phân số khác mẫu, phép tính là trừ.',['Quy đồng mẫu số.','Trừ tử số, giữ mẫu và rút gọn.'],'Tính 5/6 − 1/4.',[s('Quy đồng: 5/6 = 10/12; 1/4 = 3/12.'),s('Trừ:', '10/12 − 3/12 = 7/12')],'7/12.')],
  mistakes:[mistake('Bạn Bi tính 2/3 + 3/4 = 5/7.','2/3 + 3/4 = 17/12.','Phải đưa các phần về cùng kích thước trước khi cộng.')],remember:['Cộng, trừ khác mẫu cần quy đồng.','Kết quả có thể lớn hơn 1.'],
 }),
} satisfies LessonBook;
