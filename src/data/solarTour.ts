// Kịch bản tour "Du hành Hệ Mặt Trời" — chuỗi chặng bay từ Mặt Trời ra ngoài.
// Mỗi chặng: id thiên thể (khớp solarData) + lời thuyết minh ngắn, thân thiện cho trẻ.

export interface TourStop {
    id: string;
    narration: string;
}

export const SOLAR_TOUR: TourStop[] = [
    {
        id: 'sun',
        narration: 'Chào mừng chuyến du hành! Đây là Mặt Trời — ngôi sao khổng lồ ở trung tâm. Nó lớn đến mức chứa được hơn một triệu Trái Đất, và cho cả hệ ánh sáng cùng hơi ấm.'
    },
    {
        id: 'mercury',
        narration: 'Bay tới hành tinh gần Mặt Trời nhất: Sao Thủy. Nó nhỏ nhất và chạy quanh Mặt Trời nhanh nhất — một năm ở đây chỉ dài 88 ngày thôi!'
    },
    {
        id: 'venus',
        narration: 'Tiếp theo là Sao Kim, hành tinh nóng nhất. Lớp mây dày màu trắng kem giữ nhiệt lại, khiến nó còn nóng hơn cả Sao Thủy.'
    },
    {
        id: 'earth',
        narration: 'Ngôi nhà của chúng ta — Trái Đất! Hành tinh xanh duy nhất có sự sống, với đại dương, mây trắng và một người bạn đồng hành là Mặt Trăng.'
    },
    {
        id: 'mars',
        narration: 'Hành tinh Đỏ Sao Hỏa đây rồi. Màu đỏ là do gỉ sắt trên bề mặt. Đây là nơi các robot của NASA đang khám phá ngay lúc này!'
    },
    {
        id: 'asteroid-belt',
        narration: 'Chúng ta đang bay qua Vành đai Tiểu hành tinh — hàng triệu mảnh đá giữa Sao Hỏa và Sao Mộc. Đừng lo, chúng cách nhau rất xa nên không hề đông đúc như trong phim!'
    },
    {
        id: 'jupiter',
        narration: 'Khổng lồ Sao Mộc — hành tinh lớn nhất! Vết Đỏ Lớn của nó là một cơn bão to hơn cả Trái Đất, đã xoáy suốt hàng trăm năm.'
    },
    {
        id: 'saturn',
        narration: 'Sao Thổ với vành đai lộng lẫy bằng băng và đá. Vành rộng hàng trăm nghìn km nhưng mỏng đến kinh ngạc — chỉ khoảng mười mét thôi!'
    },
    {
        id: 'uranus',
        narration: 'Sao Thiên Vương xanh ngọc kỳ lạ — nó nằm nghiêng hẳn một bên và lăn quanh Mặt Trời như một quả bóng.'
    },
    {
        id: 'neptune',
        narration: 'Chặng cuối: Sao Hải Vương xa xôi, hành tinh nhiều gió bão nhất. Một năm ở đây dài bằng 165 năm Trái Đất. Cảm ơn bé đã cùng du hành Hệ Mặt Trời!'
    }
];
