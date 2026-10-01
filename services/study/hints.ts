import { skillById } from './catalog';

/** Gợi ý cách làm khi một nhánh template chưa có gợi ý riêng; không đọc đáp số. */
export function skillHint(id: string): string {
    if (/average/.test(id)) return 'Tổng các số bằng số trung bình cộng nhân với số các số hạng.';
    if (/motion|stream/.test(id)) return 'Xác định quãng đường, vận tốc, thời gian và đổi về cùng đơn vị trước khi tính.';
    if (/sum_diff|sumdiff/.test(id)) return 'Vẽ hai đoạn thẳng, đánh dấu tổng và phần chênh lệch rồi tìm từng số.';
    if (/word|work_together/.test(id)) return 'Ghi các dữ kiện đã biết. Tìm đại lượng còn thiếu trước khi trả lời câu hỏi.';
    if (/fraction|frac|mixed/.test(id)) return 'Quan sát tử số, mẫu số và các phần bằng nhau. Đọc kỹ phép tính cần làm.';
    if (/percent|ratio|scale/.test(id)) return 'Xác định hai đại lượng được so sánh và đơn vị của chúng trước khi tính.';
    if (/expr|parenthes/.test(id)) return 'Làm trong ngoặc trước; nhân, chia trước; cộng, trừ sau.';
    if (/mul|times_more/.test(id)) return 'Dùng bảng nhân hoặc đặt tính, nhân lần lượt từ phải sang trái.';
    if (/div|remainder/.test(id)) return 'Nhẩm phép nhân ngược lại để tìm thương; số dư phải bé hơn số chia.';
    if (/add|sub|chain/.test(id)) return 'Tính theo thứ tự, chú ý hàng đơn vị, hàng chục và số nhớ.';
    if (/compare|order|neighbor|number|round|decimal/.test(id)) return 'So sánh từ hàng lớn nhất; chú ý vị trí và giá trị của từng chữ số.';
    const strand = skillById(id)?.strand;
    if (strand === 'geometry') return 'Quan sát các cạnh, góc và số đo đã cho; nhớ quy tắc của hình đang xét.';
    if (strand === 'measurement') return 'Đọc kỹ đơn vị, vạch chia hoặc mốc thời gian rồi thực hiện từng bước.';
    if (strand === 'statistics') return 'Đọc tên hàng, cột và đơn vị; đối chiếu dữ liệu mà câu hỏi yêu cầu.';
    if (strand === 'probability') return 'Xét tất cả trường hợp có thể xảy ra rồi so với điều đề bài hỏi.';
    return 'Quan sát từng chi tiết, đếm hoặc so sánh rồi kiểm tra lại lựa chọn.';
}
