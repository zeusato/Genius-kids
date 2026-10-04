import { lesson, know, rule, text, widget, mistake } from '../../build';
import { example as ex, step as s } from '../authored';
import type { LessonBook } from '../../types';

export default {
 'g4.addsub': lesson('g4.addsub', {
  v:1,goal:'đặt tính cộng, trừ số nhiều chữ số và kiểm tra kết quả.',
  know:[know('Thẳng hàng, tính từ phải',rule('Viết các chữ số cùng hàng thẳng cột. Cộng hoặc trừ từ phải sang trái, nhớ sang hàng tiếp theo khi cần.'),text('Ví dụ: 46 758 + 23 465 = 70 223.')),know('Trừ có nhớ',widget({w:'column',op:'-',a:50302,b:17856}),text('Số nhớ được cộng vào chữ số hàng tiếp theo của số trừ.'))],
  forms:[ex('cong','Dạng 1: Cộng',1,'Tìm tổng hai số có nhiều chữ số.',['Đặt tính thẳng hàng.','Cộng từ phải sang trái, ghi số nhớ.'],'Tính 46 758 + 23 465.',[s('8 cộng 5 bằng 13, viết 3 nhớ 1.'),s('5 cộng 6 thêm 1 bằng 12, viết 2 nhớ 1.'),s('7 cộng 4 thêm 1 bằng 12, viết 2 nhớ 1.'),s('6 cộng 3 thêm 1 bằng 10, viết 0 nhớ 1.'),s('4 cộng 2 thêm 1 bằng 7.')],'70 223.',{replay:{w:'column',op:'+',a:46758,b:23465}}),ex('tru','Dạng 2: Trừ và thử lại',2,'Tìm hiệu hai số.',['Đặt tính thẳng hàng.','Trừ từng hàng, cộng số nhớ vào số trừ.','Thử lại bằng phép cộng.'],'Tính 50 302 − 17 856.',[s('12 trừ 6 bằng 6, viết 6 nhớ 1.'),s('5 thêm 1 bằng 6; 10 trừ 6 bằng 4, nhớ 1.'),s('8 thêm 1 bằng 9; 13 trừ 9 bằng 4, nhớ 1.'),s('7 thêm 1 bằng 8; 10 trừ 8 bằng 2, nhớ 1.'),s('1 thêm 1 bằng 2; 5 trừ 2 bằng 3.')],'32 446.',{check:'32 446 + 17 856 = 50 302',replay:{w:'column',op:'-',a:50302,b:17856}})],
  mistakes:[mistake('Bạn Bi quên cộng số nhớ vào hàng kế tiếp.','Luôn ghi và dùng số nhớ trước khi tính hàng tiếp theo.','Một số nhớ bỏ sót làm sai giá trị ở hàng tiếp theo.')],remember:['Các chữ số cùng hàng thẳng cột.','Thử lại phép trừ bằng phép cộng.'],
 }),
 'g4.properties_add': lesson('g4.properties_add', {
  v:1,goal:'dùng tính chất giao hoán, kết hợp để tính nhanh và so sánh tổng.',
  know:[know('Đổi chỗ và nhóm số hạng',rule('Đổi chỗ các số hạng không làm thay đổi tổng. Có thể nhóm các số hạng để cộng thuận tiện.'),text('125 + 37 + 75 = (125 + 75) + 37 = 237.'))],
  forms:[ex('nhom','Dạng 1: Tính nhanh',2,'Các số hạng ghép được thành số tròn.',['Tìm cặp có tổng tròn chục, trăm.','Đổi chỗ, nhóm cặp đó rồi cộng.'],'Tính 48 + 125 + 52.',[s('Nhóm 48 với 52:', '48 + 125 + 52 = (48 + 52) + 125'),s('Tính:', '100 + 125 = 225')],'225.'),ex('sosanh','Dạng 2: So sánh tổng',3,'Hai tổng có chung một số hạng.',['Nhận ra số hạng chung.','So sánh hai số hạng còn lại.'],'So sánh 456 + 789 và 789 + 450.',[s('Hai tổng cùng có 789.'),s('456 > 450 nên tổng bên trái lớn hơn.')],'456 + 789 > 789 + 450.')],
  mistakes:[mistake('Bạn Bi đổi 48 + 125 + 52 thành 48 + 125 − 52.','Chỉ đổi chỗ hoặc nhóm, vẫn giữ dấu cộng.','Tính chất phép cộng không cho phép đổi dấu của số hạng.')],remember:['Đổi chỗ, nhóm số hạng để tính thuận tiện.','Cùng một số hạng, so sánh phần còn lại.'],
 }),
 'g4.letter_expr': lesson('g4.letter_expr', {
  v:1,goal:'thay số vào biểu thức chứa chữ và tính giá trị.',
  know:[know('Chữ đại diện cho số',rule('Thay mỗi chữ bằng giá trị đã cho, rồi tính theo thứ tự thực hiện phép tính.'),text('Với a bằng 12, biểu thức a + 8 có giá trị 12 + 8 = 20.'))],
  forms:[ex('mot','Dạng 1: Biểu thức chứa một chữ',2,'Đề cho giá trị của một chữ.',['Thay chữ bằng số.','Tính giá trị biểu thức.'],'Tính 5 × a + 7 với a bằng 6.',[s('Thay a bằng 6: 5 × 6 + 7.'),s('Nhân trước:', '5 × 6 + 7 = 30 + 7 = 37')],'37.'),ex('hai','Dạng 2: Biểu thức chứa nhiều chữ',2,'Đề cho giá trị của hai hoặc ba chữ.',['Thay đúng số ứng với từng chữ.','Giữ ngoặc và tính theo thứ tự.'],'Tính (a + b) : c với a bằng 24, b bằng 12, c bằng 6.',[s('Thay số: (24 + 12) : 6.'),s('Tính:', '(24 + 12) : 6 = 36 : 6 = 6')],'6.')],
  mistakes:[mistake('Bạn Bi tính 5 × a + 7 bằng 5 × (6 + 7).','Thay số được 5 × 6 + 7 = 37.','Thay chữ bằng số nhưng không tự thêm hoặc bỏ ngoặc.')],remember:['Mỗi chữ thay bằng đúng số đã cho.','Giữ nguyên dấu phép tính và dấu ngoặc.'],
 }),
 'g4.mul': lesson('g4.mul', {
  v:1,goal:'nhân số nhiều chữ số với số có một hoặc hai chữ số.',
  know:[know('Nhân từng hàng',rule('Nhân lần lượt từ hàng đơn vị. Với số nhân hai chữ số, tích riêng thứ hai viết lùi sang trái một cột.'),text('123 × 24 = 123 × 4 + 123 × 20 = 2952.'),widget({w:'column',op:'×',a:123,b:24}))],
  forms:[ex('mot','Dạng 1: Nhân với số một chữ số',1,'Thừa số thứ hai có một chữ số.',['Đặt tính.','Nhân từ phải sang trái, cộng số nhớ.'],'Tính 234 × 3.',[s('3 nhân 4 bằng 12, viết 2 nhớ 1.'),s('3 nhân 3 bằng 9, thêm 1 bằng 10, viết 0 nhớ 1.'),s('3 nhân 2 bằng 6, thêm 1 bằng 7.')],'702.'),ex('hai','Dạng 2: Nhân với số hai chữ số',2,'Thừa số thứ hai gồm chục và đơn vị.',['Nhân với hàng đơn vị.','Nhân với hàng chục, viết lùi một cột.','Cộng hai tích riêng.'],'Tính 123 × 24.',[s('Nhân với 4:', '123 × 4 = 492'),s('Nhân với 2 chục:', '123 × 20 = 2460'),s('Cộng:', '492 + 2460 = 2952')],'2952.')],
  mistakes:[mistake('Bạn Bi cộng 492 + 246 = 738 khi tính 123 × 24.','Phải cộng 492 + 2460 = 2952.','Chữ số 2 ở hàng chục nên tích riêng ứng với 20, không phải 2.')],remember:['Nhân từ hàng đơn vị.','Tích riêng hàng chục lùi sang trái một cột.'],
 }),
 'g4.mul10': lesson('g4.mul10', {
  v:1,goal:'nhân với 10, 100, 1000 và số tròn chục.',
  know:[know('Thêm chữ số 0',rule('Nhân số tự nhiên với 10, 100, 1000: viết thêm một, hai, ba chữ số 0 vào bên phải.'),text('235 × 100 = 23 500. Với số tròn chục, nhân phần khác 0 trước.'))],
  forms:[ex('muoi','Dạng 1: Nhân với 10, 100, 1000',1,'Thừa số thứ hai là 10, 100 hoặc 1000.',['Đếm chữ số 0 của thừa số.','Viết thêm đúng số chữ số 0.'],'Tính 407 × 1000.',[s('1000 có ba chữ số 0.'),s('Viết thêm ba chữ số 0 bên phải 407.')],'407 000.'),ex('tron','Dạng 2: Nhân số tròn chục',2,'Một thừa số có tận cùng bằng 0.',['Tách số tròn chục thành tích với 10.','Nhân phần còn lại rồi nhân 10.'],'Tính 36 × 20.',[s('20 là 2 chục.', '36 × 20 = 36 × 2 × 10'),s('Tính:', '72 × 10 = 720')],'720.')],
  mistakes:[mistake('Bạn Bi tính 407 × 1000 = 4070.','407 × 1000 = 407 000.','Nhân 1000 cần thêm ba chữ số 0.')],remember:['Quy tắc thêm 0 dùng cho số tự nhiên.','Đếm đủ chữ số 0.'],
 }),
 'g4.properties_mul': lesson('g4.properties_mul', {
  v:1,goal:'dùng giao hoán, kết hợp và nhân một số với tổng hoặc hiệu.',
  know:[know('Tính thuận tiện',rule('Có thể đổi chỗ, nhóm các thừa số. Muốn nhân một số với một tổng, nhân số đó với từng số hạng rồi cộng.'),text('25 × 7 × 4 = 25 × 4 × 7 = 700. 6 × (10 + 2) = 60 + 12 = 72.'))],
  forms:[ex('nhom','Dạng 1: Nhóm thừa số',2,'Có các thừa số ghép thành số tròn.',['Đổi chỗ thừa số thuận tiện.','Nhóm rồi nhân.'],'Tính 5 × 37 × 2.',[s('Nhóm 5 với 2:', '5 × 37 × 2 = (5 × 2) × 37'),s('Tính:', '10 × 37 = 370')],'370.'),ex('chung','Dạng 2: Thừa số chung',3,'Hai tích có chung một thừa số.',['Giữ thừa số chung.','Cộng hoặc trừ các thừa số còn lại rồi nhân.'],'Tính 27 × 18 − 27 × 8.',[s('Cùng có thừa số 27:', '27 × 18 − 27 × 8 = 27 × (18 − 8)'),s('Tính:', '27 × 10 = 270')],'270.')],
  mistakes:[mistake('Bạn Bi viết 6 × (10 + 2) = 60 + 2 = 62.','6 × (10 + 2) = 60 + 12 = 72.','Phải nhân 6 với cả hai số hạng.')],remember:['Chỉ nhóm trong phép nhân khi giữ đủ thừa số.','Nhân với từng số hạng của tổng.'],
 }),
 'g4.div': lesson('g4.div', {
  v:1,goal:'chia cho số một, hai chữ số, biết ước lượng và thử lại.',
  know:[know('Ước lượng rồi kiểm tra',rule('Chọn chữ số thương sao cho tích không vượt phần đang chia. Sau khi trừ, số dư phải bé hơn số chia.'),text('Với 75 : 24, thử 3 vì 24 × 3 = 72; còn dư 3.'),widget({w:'long-division',a:752,b:24}))],
  forms:[ex('mot','Dạng 1: Thương có chữ số 0',1,'Trong một lượt chia, phần đang chia bé hơn số chia.',['Chia lần lượt từ trái sang phải.','Viết 0 ở thương nếu lượt tiếp theo chưa chia được.'],'Tính 812 : 4.',[s('8 chia 4 được 2; trừ còn 0, hạ 1.'),s('1 bé hơn 4 nên viết 0 ở thương; hạ 2 được 12.'),s('12 chia 4 được 3; trừ còn 0.')],'203.',{check:'203 × 4 = 812'}),ex('hai','Dạng 2: Chia cho số hai chữ số',2,'Số chia gồm hai chữ số.',['Lấy đủ chữ số để chia.','Ước lượng, nhân thử và điều chỉnh thương.','Trừ, hạ chữ số tiếp theo.'],'Tính 752 : 24.',[s('75 chia 24: thử 3, được tích 72, dư 3. Hạ 2 được 32.'),s('32 chia 24 được 1, tích 24, dư 8.')],'31 dư 8.',{check:'31 × 24 + 8 = 752',replay:{w:'long-division',a:752,b:24}}),ex('giam','Dạng 3: Điều chỉnh thương',3,'Thương ước lượng cho tích lớn hơn phần đang chia.',['Nhân thử thương dự đoán.','Giảm thương đến khi tích vừa đủ.'],'Ước lượng 93 : 38.',[s('93 gần 90, 38 gần 40 nên thử thương 2.'),s('38 × 2 = 76; 38 × 3 = 114 lớn hơn 93.'),s('Số dư:', '93 − 76 = 17')],'2 dư 17.')],
  mistakes:[mistake('Bạn Bi tính 752 : 24 = 30 dư 32.','752 : 24 = 31 dư 8.','Số dư 32 lớn hơn 24 nên thương còn thiếu 1.')],remember:['Ước lượng chỉ là dự đoán, phải nhân thử.','Số dư luôn bé hơn số chia.','Thương nhân số chia cộng dư bằng số bị chia.'],
 }),
 'g4.div10': lesson('g4.div10', {
  v:1,goal:'chia số tròn chục, tròn trăm, tròn nghìn thuận tiện.',
  know:[know('Cùng bỏ chữ số 0 tận cùng',rule('Khi cả hai số cùng tận cùng bằng 0, có thể cùng bỏ số lượng chữ số 0 như nhau rồi chia.'),text('7200 : 300 = 72 : 3 = 24.'))],
  forms:[ex('muoi','Dạng 1: Chia cho 10, 100, 1000',1,'Số bị chia có đủ chữ số 0 tận cùng.',['Đếm số chữ số 0 trong số chia.','Bỏ bấy nhiêu chữ số 0 tận cùng của số bị chia.'],'Tính 45 000 : 100.',[s('Bỏ hai chữ số 0 ở tận cùng 45 000.')],'450.'),ex('tron','Dạng 2: Chia số tròn chục',2,'Cả hai số đều tròn chục.',['Cùng bỏ số lượng chữ số 0 như nhau.','Thực hiện phép chia còn lại.'],'Tính 12 600 : 60.',[s('Cùng bỏ một chữ số 0:', '12 600 : 60 = 1260 : 6'),s('Chia:', '1260 : 6 = 210')],'210.')],
  mistakes:[mistake('Bạn Bi bỏ hai chữ số 0 ở 7200, một chữ số 0 ở 300.','Cùng bỏ hai chữ số 0: 7200 : 300 = 72 : 3 = 24.','Phải cùng bỏ số lượng chữ số 0 bằng nhau.')],remember:['Chỉ bỏ chữ số 0 ở tận cùng.','Bỏ bằng nhau ở cả hai số.'],
 }),
 'g4.expr': lesson('g4.expr', {
  v:1,goal:'tính và so sánh biểu thức có dấu ngoặc.',
  know:[know('Thứ tự tính',rule('Tính trong ngoặc trước. Ngoài ngoặc, nhân chia trước, cộng trừ sau; cùng mức ưu tiên thì từ trái sang phải.'),text('120 : (2 + 4) × 3 = 120 : 6 × 3 = 20 × 3 = 60.'))],
  forms:[ex('tinh','Dạng 1: Tính giá trị',2,'Biểu thức có nhiều phép tính và dấu ngoặc.',['Tính phần trong ngoặc.','Tính nhân, chia rồi cộng, trừ.'],'Tính 80 − (12 + 8) × 3.',[s('Trong ngoặc:', '12 + 8 = 20'),s('Nhân:', '20 × 3 = 60'),s('Trừ:', '80 − 60 = 20')],'20.'),ex('ss','Dạng 2: So sánh hai biểu thức',3,'Đề hỏi dấu giữa hai biểu thức.',['Tính đúng từng vế.','So sánh hai kết quả.'],'So sánh (18 + 12) : 3 và 18 + 12 : 3.',[s('Vế trái:', '(18 + 12) : 3 = 30 : 3 = 10'),s('Vế phải:', '18 + 12 : 3 = 18 + 4 = 22')],'Vế trái bé hơn vế phải.')],
  mistakes:[mistake('Bạn Bi tính 80 − (12 + 8) × 3 = 180.','Kết quả là 20.','Sau ngoặc phải nhân trước rồi mới trừ.')],remember:['Ngoặc trước, nhân chia trước cộng trừ.','Nhân và chia cùng mức ưu tiên.'],
 }),
 'g4.divisibility': lesson('g4.divisibility', {
  v:1,goal:'nhận biết số chia hết cho 2, 3, 5, 9.',
  know:[know('Nhìn chữ số tận cùng',rule('Số chẵn chia hết cho 2. Số tận cùng bằng 0 hoặc 5 chia hết cho 5.'),text('240 chia hết cho cả 2 và 5.')),know('Cộng các chữ số',rule('Số có tổng các chữ số chia hết cho 3 thì chia hết cho 3. Với 9 cũng làm tương tự.'),text('234 có tổng chữ số 2 + 3 + 4 = 9 nên chia hết cho cả 3 và 9.'))],
  forms:[ex('hai','Dạng 1: Chia hết cho 2 và 5',2,'Đề hỏi tính chia hết cho 2 hoặc 5.',['Xem hàng đơn vị.','Đối chiếu dấu hiệu chia hết.'],'Số 735 có chia hết cho 2 và cho 5 không?',[s('Tận cùng bằng 5 nên chia hết cho 5.'),s('Tận cùng không chẵn nên không chia hết cho 2.')],'Chia hết cho 5; không chia hết cho 2.'),ex('chin','Dạng 2: Chia hết cho 3 và 9',2,'Đề hỏi tính chia hết cho 3 hoặc 9.',['Cộng các chữ số.','Kiểm tra tổng chia hết cho 3 hoặc 9.'],'Số 123 có chia hết cho 3, cho 9 không?',[s('Tổng chữ số:', '1 + 2 + 3 = 6'),s('6 chia hết cho 3 nhưng không chia hết cho 9.')],'Chia hết cho 3; không chia hết cho 9.')],
  mistakes:[mistake('Bạn Bi nói mọi số chia hết cho 3 đều chia hết cho 9.','12 chia hết cho 3 nhưng không chia hết cho 9.','Chia hết cho 9 thì chia hết cho 3; chiều ngược lại không luôn đúng.')],remember:['2, 5: xem chữ số tận cùng.','3, 9: xem tổng các chữ số.'],
 }),
} satisfies LessonBook;
