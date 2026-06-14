// Electricity Module Data

// Component types
export type ComponentType = 'battery' | 'bulb' | 'switch' | 'wire' | 'bell' | 'fan' | 'candle' | 'buzzer';

export interface ComponentDefinition {
    type: ComponentType;
    name: string;
    icon: string;
    description: string;
    hasInput: boolean;
    hasOutput: boolean;
    isSource: boolean; // true for battery
    isLoad: boolean;   // true for bulb, bell, fan, buzzer
    isPassive: boolean; // true for wire, switch, candle
}

export const COMPONENTS: Record<ComponentType, ComponentDefinition> = {
    battery: {
        type: 'battery',
        name: 'Pin',
        icon: '🔋',
        description: 'Nguồn điện cung cấp năng lượng cho mạch',
        hasInput: true,
        hasOutput: true,
        isSource: true,
        isLoad: false,
        isPassive: false,
    },
    bulb: {
        type: 'bulb',
        name: 'Đèn',
        icon: '💡',
        description: 'Phát sáng khi có dòng điện chạy qua',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: true,
        isPassive: false,
    },
    switch: {
        type: 'switch',
        name: 'Công tắc',
        icon: '🔘',
        description: 'Đóng/mở mạch điện, click để bật/tắt',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: false,
        isPassive: true,
    },
    wire: {
        type: 'wire',
        name: 'Dây dẫn',
        icon: '📏',
        description: 'Kết nối các linh kiện với nhau',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: false,
        isPassive: true,
    },
    bell: {
        type: 'bell',
        name: 'Chuông',
        icon: '🔔',
        description: 'Rung và phát tiếng kêu khi có điện',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: true,
        isPassive: false,
    },
    fan: {
        type: 'fan',
        name: 'Quạt',
        icon: '🌀',
        description: 'Quay tạo gió khi có điện, có thể thổi tắt nến',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: true,
        isPassive: false,
    },
    candle: {
        type: 'candle',
        name: 'Nến',
        icon: '🕯️',
        description: 'Ngọn nến đang cháy, tắt khi có gió từ quạt',
        hasInput: false,
        hasOutput: false,
        isSource: false,
        isLoad: false,
        isPassive: true,
    },
    buzzer: {
        type: 'buzzer',
        name: 'Còi',
        icon: '📢',
        description: 'Phát âm thanh báo động khi có điện',
        hasInput: true,
        hasOutput: true,
        isSource: false,
        isLoad: true,
        isPassive: false,
    },
};

// Circuit component instance
export interface CircuitComponentData {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    state: 'on' | 'off'; // for switch
    isActive: boolean; // receiving power
}

// Wire connection
export interface WireData {
    id: string;
    fromId: string;
    fromPort: 'input' | 'output';
    toId: string;
    toPort: 'input' | 'output';
}

// Complete circuit
export interface CircuitData {
    components: CircuitComponentData[];
    wires: WireData[];
}

// Lesson structure
export interface LessonData {
    id: number;
    title: string;
    subtitle: string;
    theory: {
        content: string;
        keyPoints: string[];
        funFact?: string;   // "Em có biết?" enrichment / safety note
    };
    illustration: {
        type: 'animation' | 'diagram' | 'comparison';
        data: any;
    };
    exercise: {
        type: 'quiz' | 'build' | 'fix' | 'identify';
        instruction: string;
        initialCircuit?: CircuitData;
        correctAnswer?: any;
    };
}

// 8 Lessons data
export const LESSONS: LessonData[] = [
    {
        id: 1,
        title: 'Dòng điện là gì?',
        subtitle: 'Hiểu về electron và sự di chuyển của chúng',
        theory: {
            content: 'Dòng điện là sự di chuyển của các hạt electron qua dây dẫn. Giống như nước chảy trong ống, electron chảy trong dây đồng khi có nguồn điện.',
            keyPoints: [
                'Electron là hạt rất nhỏ mang điện âm (-)',
                'Khi electron di chuyển → tạo ra dòng điện',
                'Cần có nguồn (pin) để đẩy electron đi'
            ],
            funFact: 'Electron nhỏ xíu nhưng tín hiệu điện chạy trong dây nhanh gần bằng tốc độ ánh sáng — bật công tắc là đèn sáng gần như tức thì!'
        },
        illustration: {
            type: 'animation',
            data: { showElectronFlow: true }
        },
        exercise: {
            type: 'quiz',
            instruction: 'Dòng điện là gì?',
            correctAnswer: 'electron-movement'
        }
    },
    {
        id: 2,
        title: 'Mạch kín và mạch hở',
        subtitle: 'Tại sao đèn phải trong mạch kín mới sáng?',
        theory: {
            content: 'Mạch kín là khi các linh kiện nối thành vòng tròn liên tục. Mạch hở là khi có chỗ bị đứt. Electron chỉ chạy được trong mạch kín!',
            keyPoints: [
                'Mạch kín = vòng liên tục từ (+) về (-) của pin',
                'Mạch hở = có chỗ đứt, electron không chạy được',
                'Đèn chỉ sáng khi ở trong mạch kín'
            ],
            funFact: '⚠️ Nối thẳng cực (+) sang (−) của pin mà không qua thiết bị nào gọi là ĐOẢN MẠCH — pin sẽ nóng lên và hỏng rất nhanh. Đừng thử với pin thật nhé!'
        },
        illustration: {
            type: 'comparison',
            data: { showClosed: true, showOpen: true }
        },
        exercise: {
            type: 'fix',
            instruction: 'Kéo thêm dây để nối mạch hở thành mạch kín'
        }
    },
    {
        id: 3,
        title: 'Nguồn điện - Pin',
        subtitle: 'Cực (+) và cực (-) của pin',
        theory: {
            content: 'Pin có 2 cực: cực dương (+) và cực âm (-). Pin đẩy electron từ cực (-) đi vòng qua mạch rồi về cực (+). Phải nối đúng chiều pin mới hoạt động!',
            keyPoints: [
                'Pin có 2 đầu: (+) dương và (-) âm',
                'Electron đi từ (-) → qua mạch → về (+)',
                'Pin cung cấp năng lượng cho dòng điện chạy'
            ],
            funFact: 'Cục pin đầu tiên do nhà khoa học Volta chế tạo năm 1800. Đơn vị đo điện áp "Vôn (V)" được đặt theo tên ông đấy!'
        },
        illustration: {
            type: 'diagram',
            data: { showBatteryPoles: true }
        },
        exercise: {
            type: 'build',
            instruction: 'Đặt pin vào đúng vị trí để đèn sáng'
        }
    },
    {
        id: 4,
        title: 'Công tắc điện',
        subtitle: 'Đóng/mở mạch một cách an toàn',
        theory: {
            content: 'Công tắc giúp đóng hoặc mở mạch điện. Khi bật = mạch kín = đèn sáng. Khi tắt = mạch hở = đèn tắt. Dùng công tắc an toàn hơn rút dây!',
            keyPoints: [
                'Công tắc BẬT = mạch kín = có dòng điện',
                'Công tắc TẮT = mạch hở = không có dòng điện',
                'Luôn dùng công tắc để bật/tắt thiết bị điện'
            ],
            funFact: '🦺 An toàn: hãy TẮT công tắc trước khi thay bóng đèn để không bị điện giật.'
        },
        illustration: {
            type: 'animation',
            data: { showSwitchToggle: true }
        },
        exercise: {
            type: 'build',
            instruction: 'Thêm công tắc vào mạch để điều khiển đèn'
        }
    },
    {
        id: 5,
        title: 'Lắp mạch đơn giản',
        subtitle: 'Pin + Dây + Đèn = Ánh sáng!',
        theory: {
            content: 'Mạch điện đơn giản nhất gồm: Pin (nguồn), Dây dẫn (đường đi), Đèn (tải). Nối chúng thành vòng kín và đèn sẽ sáng!',
            keyPoints: [
                'Nguồn: Pin cung cấp năng lượng',
                'Dây dẫn: Đường cho electron chạy',
                'Tải: Đèn biến điện thành ánh sáng'
            ],
            funFact: 'Chiếc đèn pin trong nhà em cũng chỉ gồm pin + bóng đèn + công tắc thôi đấy!'
        },
        illustration: {
            type: 'diagram',
            data: { showSimpleCircuit: true }
        },
        exercise: {
            type: 'build',
            instruction: 'Tự lắp mạch hoàn chỉnh: Pin → Dây → Đèn → Dây → Pin'
        }
    },
    {
        id: 6,
        title: 'Mạch nối tiếp',
        subtitle: 'Các linh kiện xếp thành 1 hàng',
        theory: {
            content: 'Mạch nối tiếp: các linh kiện nối thành MỘT đường duy nhất. Nếu 1 đèn tắt → cả mạch mất điện → tất cả đèn tắt!',
            keyPoints: [
                'Các linh kiện nối thành 1 đường',
                '1 đèn hỏng = cả dãy tắt',
                'Càng nhiều đèn → mỗi đèn càng mờ'
            ],
            funFact: 'Dây đèn nhấp nháy trang trí thường mắc nối tiếp — nên chỉ 1 bóng cháy là cả dây tối thui!'
        },
        illustration: {
            type: 'diagram',
            data: { showSeriesCircuit: true }
        },
        exercise: {
            type: 'build',
            instruction: 'Lắp 2 bóng đèn NỐI TIẾP với nhau'
        }
    },
    {
        id: 7,
        title: 'Mạch song song',
        subtitle: 'Mỗi linh kiện có đường riêng',
        theory: {
            content: 'Mạch song song: mỗi linh kiện có NHÁNH RIÊNG nối với pin. Nếu 1 đèn tắt → các đèn khác vẫn sáng bình thường!',
            keyPoints: [
                'Mỗi đèn có đường riêng đến pin',
                '1 đèn hỏng ≠ ảnh hưởng đèn khác',
                'Các đèn sáng đều như nhau'
            ],
            funFact: 'Đèn trong nhà mắc song song, nên tắt phòng này thì phòng kia vẫn sáng bình thường.'
        },
        illustration: {
            type: 'diagram',
            data: { showParallelCircuit: true }
        },
        exercise: {
            type: 'build',
            instruction: 'Lắp 2 bóng đèn SONG SONG với nhau'
        }
    },
    {
        id: 8,
        title: 'So sánh và ứng dụng',
        subtitle: 'Khi nào dùng nối tiếp, khi nào dùng song song?',
        theory: {
            content: 'Nối tiếp: đơn giản, tiết kiệm dây, nhưng 1 hỏng = tất cả hỏng. Song song: phức tạp hơn, tốn dây, nhưng an toàn và đèn sáng đều.',
            keyPoints: [
                'Đèn trang trí thường NỐI TIẾP',
                'Đèn trong nhà thường SONG SONG',
                'Chọn loại mạch phù hợp với mục đích'
            ],
            funFact: '⚡ Điện trong nhà (220V) mạnh hơn pin rất nhiều — tuyệt đối không tự cắm vật lạ vào ổ điện nhé!'
        },
        illustration: {
            type: 'comparison',
            data: { compareSeries: true, compareParallel: true }
        },
        exercise: {
            type: 'quiz',
            instruction: 'Nhà bạn nên dùng mạch gì để khi 1 đèn hỏng, các đèn khác vẫn sáng?',
            correctAnswer: 'parallel'
        }
    }
];

// Challenge for playground
export interface ChallengeData {
    id: string;
    difficulty: 1 | 2 | 3;
    title: string;
    description: string;
    hint?: string;
    requiredComponents: ComponentType[];
    validator: string; // function name to validate
}

export const CHALLENGES: ChallengeData[] = [
    // ⭐ Easy (1 star)
    {
        id: 'e1',
        difficulty: 1,
        title: 'Thắp sáng đèn',
        description: 'Lắp mạch đơn giản để làm đèn sáng',
        hint: 'Cần: Pin + Đèn, nối dây giữa chúng',
        requiredComponents: ['battery', 'bulb'],
        validator: 'validateBulbOn'
    },
    {
        id: 'e2',
        difficulty: 1,
        title: 'Thêm công tắc',
        description: 'Lắp mạch có công tắc để bật/tắt đèn',
        hint: 'Thêm công tắc vào giữa mạch',
        requiredComponents: ['battery', 'bulb', 'switch'],
        validator: 'validateSwitchControls'
    },
    {
        id: 'e3',
        difficulty: 1,
        title: 'Chuông cửa',
        description: 'Lắp chuông có thể bấm để kêu',
        hint: 'Dùng công tắc như nút bấm',
        requiredComponents: ['battery', 'bell', 'switch'],
        validator: 'validateBellWorks'
    },

    // ⭐⭐ Medium (2 stars)
    {
        id: 'm1',
        difficulty: 2,
        title: 'Hai đèn nối tiếp',
        description: 'Lắp 2 đèn nối tiếp với 1 công tắc điều khiển cả 2',
        hint: 'Các đèn nối thành 1 hàng',
        requiredComponents: ['battery', 'bulb', 'bulb', 'switch'],
        validator: 'validateSeriesBulbs'
    },
    {
        id: 'm2',
        difficulty: 2,
        title: 'Hai đèn song song',
        description: 'Lắp 2 đèn song song',
        hint: 'Mỗi đèn cần có đường riêng',
        requiredComponents: ['battery', 'bulb', 'bulb'],
        validator: 'validateParallelBulbs'
    },
    {
        id: 'm3',
        difficulty: 2,
        title: 'Quạt thông gió',
        description: 'Lắp quạt có công tắc điều khiển',
        hint: 'Giống mạch đèn, thay đèn bằng quạt',
        requiredComponents: ['battery', 'fan', 'switch'],
        validator: 'validateFanWorks'
    },
    {
        id: 'm4',
        difficulty: 2,
        title: 'Thổi tắt nến',
        description: 'Dùng quạt điện để thổi tắt nến đang cháy',
        hint: 'Đặt quạt gần nến, bật quạt để tạo gió',
        requiredComponents: ['battery', 'fan', 'switch', 'candle'],
        validator: 'validateCandleBlown'
    },

    // ⭐⭐⭐ Hard (3 stars)
    {
        id: 'h1',
        difficulty: 3,
        title: 'Điều khiển độc lập',
        description: 'Lắp 2 đèn, mỗi đèn có công tắc riêng',
        hint: 'Mỗi đèn 1 nhánh với 1 công tắc',
        requiredComponents: ['battery', 'bulb', 'bulb', 'switch', 'switch'],
        validator: 'validateIndependentControl'
    },
    {
        id: 'h2',
        difficulty: 3,
        title: 'Hệ thống báo động',
        description: 'Lắp chuông VÀ còi cùng kêu khi bật công tắc',
        hint: 'Chuông và còi nối song song',
        requiredComponents: ['battery', 'bell', 'buzzer', 'switch'],
        validator: 'validateAlarmSystem'
    },
    {
        id: 'h3',
        difficulty: 3,
        title: 'Phòng thông minh',
        description: 'Đèn sáng + quạt quay, điều khiển riêng biệt',
        hint: 'Đèn và quạt mỗi cái 1 công tắc riêng',
        requiredComponents: ['battery', 'bulb', 'fan', 'switch', 'switch'],
        validator: 'validateSmartRoom'
    },
    // Additional challenges
    {
        id: 'e4',
        difficulty: 1,
        title: 'Còi báo hiệu',
        description: 'Lắp còi đơn giản với pin',
        hint: 'Nối còi vào pin qua dây dẫn',
        requiredComponents: ['battery', 'buzzer'],
        validator: 'validateBuzzerWorks'
    },
    {
        id: 'e5',
        difficulty: 1,
        title: 'Quạt mini',
        description: 'Lắp quạt chạy bằng pin',
        hint: 'Nối pin với quạt',
        requiredComponents: ['battery', 'fan'],
        validator: 'validateFanWorks'
    },
    {
        id: 'm5',
        difficulty: 2,
        title: 'Đèn và chuông',
        description: 'Lắp đèn VÀ chuông cùng hoạt động',
        hint: 'Nối song song đèn và chuông',
        requiredComponents: ['battery', 'bulb', 'bell', 'switch'],
        validator: 'validateBulbAndBell'
    },
    {
        id: 'm6',
        difficulty: 2,
        title: 'Ba đèn nối tiếp',
        description: 'Lắp 3 đèn nối tiếp cùng sáng',
        hint: 'Nối 3 đèn thành 1 chuỗi',
        requiredComponents: ['battery', 'bulb', 'bulb', 'bulb'],
        validator: 'validateThreeBulbsSeries'
    },
    {
        id: 'h4',
        difficulty: 3,
        title: 'Mạch phức hợp',
        description: 'Lắp đèn, quạt, chuông cùng hoạt động với công tắc tổng',
        hint: 'Nối tất cả song song rồi thêm công tắc tổng',
        requiredComponents: ['battery', 'bulb', 'fan', 'bell', 'switch'],
        validator: 'validateComplexCircuit'
    },
];

// Get random challenge by difficulty, avoiding an immediate repeat when possible
export function getRandomChallenge(difficulty?: 1 | 2 | 3, excludeId?: string): ChallengeData {
    let pool = difficulty ? CHALLENGES.filter(c => c.difficulty === difficulty) : CHALLENGES;
    if (excludeId && pool.length > 1) {
        const filtered = pool.filter(c => c.id !== excludeId);
        if (filtered.length > 0) pool = filtered;
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// Get challenges by difficulty
export function getChallengesByDifficulty(difficulty: 1 | 2 | 3): ChallengeData[] {
    return CHALLENGES.filter(c => c.difficulty === difficulty);
}
