import { lesson, know, rule, text, table, widget, mistake, pic } from '../../build';
import { example as ex, step as s } from '../authored';
import type { LessonBook } from '../../types';

export default {
 'g4.read_write': lesson('g4.read_write', {
  v:1, goal:'đọc và viết số đến lớp triệu, kể cả số có chữ số 0.',
  hook:{md:'Thư viện ghi có 2 005 016 trang sách. Em đọc số này thế nào?',answer:'Hai triệu không trăm linh năm nghìn không trăm mười sáu.'},
  know:[know('Đọc theo từng lớp',rule('Tách số thành từng lớp ba chữ số từ phải sang trái. Đọc từ lớp triệu, lớp nghìn đến lớp đơn vị.'),table(['Triệu','Nghìn','Đơn vị'],[['2','005','016']]),text('Lớp toàn chữ số 0 thì bỏ qua khi đọc. Ví dụ: 3 000 012 đọc là ba triệu không trăm mười hai.'))],
  forms:[ex('doc','Dạng 1: Đọc số',1,'Đề cho một số và hỏi cách đọc.',['Tách các lớp từ phải sang trái.','Đọc từ trái sang phải, kèm tên lớp.'],'Đọc số 12 034 506.',[s('Lớp triệu: mười hai triệu.'),s('Lớp nghìn: không trăm ba mươi tư nghìn.'),s('Lớp đơn vị: năm trăm linh sáu.')],'Mười hai triệu không trăm ba mươi tư nghìn năm trăm linh sáu.'),ex('viet','Dạng 2: Viết số',1,'Đề cho cách đọc của một số.',['Viết từng lớp từ trái sang phải.','Sau lớp đầu, mỗi lớp phải đủ ba chữ số.'],'Viết: bảy triệu hai nghìn không trăm linh chín.',[s('Các lớp lần lượt: 7 | 002 | 009.'),s('Ghép lại được 7 002 009.')],'Số cần viết: 7 002 009.')],
  mistakes:[mistake('Bạn Bi viết bảy triệu hai nghìn là 72 000.','Viết đúng: 7 002 000.','Mỗi lớp sau lớp đầu phải có đủ ba chữ số, kể cả chữ số 0.')], remember:['Đọc theo lớp, từ trái sang phải.','Viết đủ chữ số 0 giữ chỗ.'],
 }),
 'g4.place_class': lesson('g4.place_class', {
  v:1,goal:'xác định hàng, lớp và giá trị của từng chữ số.',
  know:[know('Mỗi lớp gồm ba hàng',rule('Giá trị của chữ số phụ thuộc vào hàng của nó.'),table(['Lớp','Các hàng'],[['Đơn vị','Đơn vị, chục, trăm'],['Nghìn','Nghìn, chục nghìn, trăm nghìn'],['Triệu','Triệu, chục triệu, trăm triệu']]),text('Trong 3 253 418, chữ số 3 đầu tiên có giá trị 3 000 000.')),know('Thay đổi chữ số',widget({w:'place-value',int:7,init:3253418}))],
  forms:[ex('hang','Dạng 1: Hàng và giá trị',2,'Đề hỏi vị trí hoặc giá trị của một chữ số.',['Đếm hàng từ phải sang trái.','Lấy chữ số nhân với giá trị một đơn vị của hàng.'],'Chữ số 5 trong 3 253 418 có giá trị bao nhiêu?',[s('Chữ số 5 ở hàng chục nghìn.'),s('Giá trị là:', '5 × 10 000 = 50 000')],'50 000.'),ex('tach','Dạng 2: Phân tích số',1,'Đề yêu cầu viết số thành tổng.',['Xác định giá trị từng chữ số.','Cộng các giá trị khác 0.'],'Viết 2 030 405 thành tổng.',[s('Có 2 triệu, 3 chục nghìn, 4 trăm, 5 đơn vị.'),s('Viết:', '2 030 405 = 2 000 000 + 30 000 + 400 + 5')],'2 000 000 + 30 000 + 400 + 5.')],
  mistakes:[mistake('Bạn Bi nói chữ số 5 luôn có giá trị 5.','Trong 50 000, chữ số 5 có giá trị 50 000.','Phải biết hàng của chữ số trước khi nêu giá trị.')],remember:['Mỗi lớp có ba hàng.','Giá trị chữ số thay đổi theo hàng.'],
 }),
 'g4.compare': lesson('g4.compare', {
  v:1,goal:'so sánh và sắp xếp các số có nhiều chữ số.',
  know:[know('So sánh từ hàng lớn nhất',rule('Số có nhiều chữ số hơn thì lớn hơn. Nếu cùng số chữ số, so từng hàng từ trái sang phải.'),text('456 789 < 1 000 000. Còn 456 789 > 456 709 vì hàng chục có 8 > 0.'))],
  forms:[ex('dau','Dạng 1: Điền dấu',1,'Hai số được ngăn bởi ô trống.',['So sánh số chữ số.','Nếu bằng nhau, tìm hàng đầu tiên khác nhau.'],'Điền dấu: 708 412 □ 708 512.',[s('Hai số cùng có sáu chữ số.'),s('Hàng trăm: 4 < 5.')],'708 412 < 708 512.'),ex('sap','Dạng 2: Sắp xếp',2,'Đề yêu cầu thứ tự tăng hoặc giảm.',['Tìm số bé nhất.','So sánh các số còn lại, xếp đúng chiều.'],'Xếp từ bé đến lớn: 99 999; 100 001; 100 000.',[s('99 999 ít chữ số hơn hai số còn lại.'),s('100 000 < 100 001.')],'99 999; 100 000; 100 001.')],
  mistakes:[mistake('Bạn Bi cho 99 999 > 100 000 vì chữ số đầu là 9.','99 999 < 100 000.','Cần so sánh số chữ số trước.')],remember:['Đếm số chữ số trước.','Cùng độ dài thì so từ trái sang phải.'],
 }),
 'g4.round': lesson('g4.round', {
  v:1,goal:'làm tròn số đến hàng chục, trăm, nghìn và trăm nghìn.',
  know:[know('Nhìn hàng ngay bên phải',rule('Chữ số bên phải bé hơn 5: giữ nguyên hàng làm tròn. Từ 5 trở lên: tăng hàng đó thêm 1.'),text('Đổi các chữ số bên phải thành 0. Ví dụ: 346 781 làm tròn đến hàng trăm nghìn được 300 000.'))],
  forms:[ex('tron','Dạng 1: Làm tròn đến hàng đã cho',2,'Đề nêu rõ hàng cần làm tròn.',['Xác định hàng cần làm tròn.','Xem chữ số ngay bên phải, rồi thay các chữ số phía sau bằng 0.'],'Làm tròn 375 240 đến hàng chục nghìn.',[s('Hàng chục nghìn là 7, bên phải là 5.'),s('Tăng 7 thành 8, thay phần sau bằng 0.')],'380 000.'),ex('qua','Dạng 2: Làm tròn có nhớ',2,'Tăng hàng có chữ số 9 làm xuất hiện số nhớ.',['Tăng hàng làm tròn thêm 1.','Nhớ sang hàng trái nếu cần.'],'Làm tròn 999 500 đến hàng nghìn.',[s('Hàng trăm là 5 nên tăng phần nghìn thêm 1.'),s('999 nghìn thêm 1 nghìn là 1000 nghìn.')],'1 000 000.')],
  mistakes:[mistake('Bạn Bi làm tròn 375 240 đến hàng chục nghìn được 370 000.','Kết quả là 380 000.','Chữ số ngay bên phải là 5 nên phải làm tròn lên.')],remember:['Xét đúng chữ số ngay bên phải.','Sau khi làm tròn, phần bên phải là các chữ số 0.'],
 }),
 'g4.even_odd': lesson('g4.even_odd', {
  v:1,goal:'nhận biết số chẵn, số lẻ và các số chẵn, lẻ liên tiếp.',
  know:[know('Chỉ cần xem hàng đơn vị',rule('Số chẵn tận cùng bằng 0, 2, 4, 6, 8. Số lẻ tận cùng bằng 1, 3, 5, 7, 9.'),text('248 là số chẵn. 135 là số lẻ. Số 0 cũng là số chẵn.'))],
  forms:[ex('chon','Dạng 1: Chọn số chẵn, số lẻ',1,'Đề cho nhiều số để phân loại.',['Xem chữ số tận cùng.','Đối chiếu nhóm chẵn hoặc lẻ.'],'Chọn số chẵn: 125; 408; 731; 990.',[s('408 tận cùng bằng 8; 990 tận cùng bằng 0.')],'408 và 990.'),ex('tiep','Dạng 2: Hai số cùng loại liên tiếp',2,'Đề hỏi số chẵn hoặc số lẻ liền sau.',['Giữ cùng loại chẵn hoặc lẻ.','Cộng 2 để tìm số tiếp theo.'],'Số lẻ liền sau 199 là bao nhiêu?',[s('Số lẻ kế tiếp cách 2 đơn vị.', '199 + 2 = 201')],'201.')],
  mistakes:[mistake('Bạn Bi bảo 312 là số lẻ vì bắt đầu bằng 3.','312 là số chẵn.','Chỉ chữ số tận cùng quyết định tính chẵn, lẻ.')],remember:['Xem hàng đơn vị.','Hai số chẵn liên tiếp hoặc hai số lẻ liên tiếp hơn kém nhau 2.'],
 }),
 'g4.sequence': lesson('g4.sequence', {
  v:1,goal:'tìm quy luật và điền số tiếp theo trong dãy.',
  know:[know('Kiểm tra nhiều bước',rule('Tìm quan hệ giữa các số liền nhau. Kiểm tra quy luật trên nhiều cặp trước khi điền số.'),text('Dãy 5; 10; 15; 20 tăng đều 5. Dãy 3; 6; 12; 24 mỗi bước gấp đôi.'))],
  forms:[ex('cong','Dạng 1: Tăng hoặc giảm đều',2,'Các hiệu giữa hai số liền nhau bằng nhau.',['Tính vài hiệu liên tiếp.','Cộng hoặc trừ cùng một số.'],'Điền số: 120; 115; 110; □.',[s('Mỗi bước giảm 5.'),s('Số tiếp theo:', '110 − 5 = 105')],'105.'),ex('nhan','Dạng 2: Nhân theo quy luật',3,'Tỉ số giữa các số liền nhau không đổi.',['Thử chia số sau cho số trước.','Nhân tiếp theo cùng quy luật.'],'Điền số: 2; 6; 18; □.',[s('Mỗi số sau gấp 3 lần số trước.'),s('Số tiếp theo:', '18 × 3 = 54')],'54.')],
  mistakes:[mistake('Bạn Bi thấy 2; 6 nên cộng 4 và điền 22 sau 18.','Dãy 2; 6; 18 tiếp theo là 54 theo quy luật nhân 3.','Phải kiểm tra cả cặp 6 và 18.')],remember:['Kiểm tra quy luật trên nhiều cặp.','Đọc kỹ chiều tăng hoặc giảm của dãy.'],
 }),
} satisfies LessonBook;
