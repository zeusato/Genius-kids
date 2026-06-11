// Câu hỏi thử thách cho từng thiên thể — 3 câu/thiên thể, rút từ facts NASA trong solarData.ts.
// Trả lời đúng cả 3 (được thử lại thoải mái, không phạt) → nhận huy hiệu + sao.

export interface SolarQuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export const SOLAR_QUIZ: Record<string, SolarQuizQuestion[]> = {
    sun: [
        {
            question: 'Ánh sáng từ Mặt Trời mất bao lâu để đến Trái Đất?',
            options: ['8 giây', '8 phút', '8 giờ'],
            correctIndex: 1
        },
        {
            question: 'Mặt Trời chiếm bao nhiêu khối lượng của cả Hệ Mặt Trời?',
            options: ['99,8%', '50%', '10%'],
            correctIndex: 0
        },
        {
            question: 'Nhiệt độ bề mặt Mặt Trời khoảng bao nhiêu?',
            options: ['100°C', '1 triệu °C', '5.500°C'],
            correctIndex: 2
        }
    ],
    mercury: [
        {
            question: 'Một năm trên Sao Thủy dài bao nhiêu ngày Trái Đất?',
            options: ['88 ngày', '365 ngày', '1.000 ngày'],
            correctIndex: 0
        },
        {
            question: 'Vì sao ban đêm trên Sao Thủy lại rất lạnh?',
            options: ['Vì ở xa Mặt Trời nhất', 'Vì không có khí quyển giữ nhiệt', 'Vì có nhiều băng tuyết'],
            correctIndex: 1
        },
        {
            question: 'Bề mặt Sao Thủy trông giống thiên thể nào?',
            options: ['Mặt Trăng — đầy hố thiên thạch', 'Trái Đất — có đại dương', 'Sao Mộc — toàn khí'],
            correctIndex: 0
        }
    ],
    venus: [
        {
            question: 'Hành tinh nào NÓNG nhất Hệ Mặt Trời?',
            options: ['Sao Thủy', 'Sao Hỏa', 'Sao Kim'],
            correctIndex: 2
        },
        {
            question: 'Sao Kim còn được gọi là gì?',
            options: ['Sao Hôm / Sao Mai', 'Sao Bắc Đẩu', 'Sao Chổi'],
            correctIndex: 0
        },
        {
            question: 'Điều gì đặc biệt về cách Sao Kim tự quay?',
            options: ['Quay nhanh nhất', 'Quay ngược chiều với đa số hành tinh', 'Không bao giờ quay'],
            correctIndex: 1
        }
    ],
    earth: [
        {
            question: 'Bao nhiêu phần trăm bề mặt Trái Đất được nước bao phủ?',
            options: ['30%', '71%', '100%'],
            correctIndex: 1
        },
        {
            question: 'Vì sao Trái Đất có bốn mùa?',
            options: ['Vì trục Trái Đất nghiêng 23,4°', 'Vì Mặt Trăng che Mặt Trời', 'Vì gió thổi mạnh'],
            correctIndex: 0
        },
        {
            question: 'Vệ tinh tự nhiên của Trái Đất tên là gì?',
            options: ['Titan', 'Sao Hỏa', 'Mặt Trăng'],
            correctIndex: 2
        }
    ],
    mars: [
        {
            question: 'Vì sao Sao Hỏa có màu đỏ?',
            options: ['Vì oxit sắt (gỉ sắt) trên bề mặt', 'Vì núi lửa đang phun', 'Vì hoa đỏ mọc khắp nơi'],
            correctIndex: 0
        },
        {
            question: 'Sao Hỏa có mấy mặt trăng?',
            options: ['Không có', '2 (Phobos và Deimos)', '100'],
            correctIndex: 1
        },
        {
            question: 'Ngọn núi lửa cao nhất Hệ Mặt Trời nằm ở đâu?',
            options: ['Trái Đất', 'Sao Kim', 'Sao Hỏa (Olympus Mons)'],
            correctIndex: 2
        }
    ],
    jupiter: [
        {
            question: 'Hành tinh nào LỚN nhất Hệ Mặt Trời?',
            options: ['Sao Mộc', 'Sao Thổ', 'Trái Đất'],
            correctIndex: 0
        },
        {
            question: 'Sao Mộc có thể chứa được bao nhiêu Trái Đất bên trong?',
            options: ['2', 'Hơn 1.300', '50'],
            correctIndex: 1
        },
        {
            question: 'Vết Đỏ Lớn trên Sao Mộc là gì?',
            options: ['Một hồ nước màu đỏ', 'Một ngọn núi lửa', 'Một cơn bão khổng lồ hàng trăm năm tuổi'],
            correctIndex: 2
        }
    ],
    saturn: [
        {
            question: 'Vành đai tuyệt đẹp của Sao Thổ được làm từ gì?',
            options: ['Băng và đá', 'Vàng', 'Mây màu'],
            correctIndex: 0
        },
        {
            question: 'Nếu có một bể nước khổng lồ, Sao Thổ sẽ thế nào?',
            options: ['Chìm ngay lập tức', 'Nổi trên mặt nước', 'Tan thành bọt'],
            correctIndex: 1
        },
        {
            question: 'Hành tinh nào có NHIỀU mặt trăng nhất (274 mặt trăng)?',
            options: ['Trái Đất', 'Sao Thủy', 'Sao Thổ'],
            correctIndex: 2
        }
    ],
    uranus: [
        {
            question: 'Sao Thiên Vương quay khác các hành tinh khác như thế nào?',
            options: ['Nó "nằm ngang", lăn trên quỹ đạo', 'Nó quay hình vuông', 'Nó đứng yên'],
            correctIndex: 0
        },
        {
            question: 'Hành tinh nào có khí quyển LẠNH nhất (-224°C)?',
            options: ['Sao Hải Vương', 'Sao Thiên Vương', 'Sao Thủy'],
            correctIndex: 1
        },
        {
            question: 'Các mặt trăng của Sao Thiên Vương được đặt tên theo ai?',
            options: ['Các cầu thủ bóng đá', 'Các loài hoa', 'Nhân vật kịch Shakespeare'],
            correctIndex: 2
        }
    ],
    neptune: [
        {
            question: 'Hành tinh nào XA Mặt Trời nhất?',
            options: ['Sao Hải Vương', 'Sao Mộc', 'Sao Kim'],
            correctIndex: 0
        },
        {
            question: 'Một năm trên Sao Hải Vương bằng bao nhiêu năm Trái Đất?',
            options: ['1 năm', '165 năm', '12 năm'],
            correctIndex: 1
        },
        {
            question: 'Cơn gió nhanh nhất Hệ Mặt Trời (2.100 km/h) thổi ở đâu?',
            options: ['Trái Đất', 'Sao Thủy', 'Sao Hải Vương'],
            correctIndex: 2
        }
    ],
    'asteroid-belt': [
        {
            question: 'Vành đai tiểu hành tinh nằm giữa hai hành tinh nào?',
            options: ['Sao Hỏa và Sao Mộc', 'Trái Đất và Sao Hỏa', 'Sao Thổ và Sao Thiên Vương'],
            correctIndex: 0
        },
        {
            question: 'Thiên thể lớn nhất trong vành đai tiểu hành tinh là gì?',
            options: ['Mặt Trăng', 'Ceres', 'Sao Diêm Vương'],
            correctIndex: 1
        },
        {
            question: 'Các tiểu hành tinh có bay sát nhau như trong phim không?',
            options: ['Có, phải né liên tục', 'Chúng dính liền nhau', 'Không, thực tế chúng cách nhau rất xa'],
            correctIndex: 2
        }
    ]
};

// Thứ tự hiển thị trên kệ sưu tập
export const COLLECTIBLE_BODY_IDS = [
    'sun',
    'mercury',
    'venus',
    'earth',
    'mars',
    'asteroid-belt',
    'jupiter',
    'saturn',
    'uranus',
    'neptune'
];

export const BADGE_STAR_REWARD = 10; // sao thưởng khi nhận huy hiệu lần đầu
