interface GardenScene {
    art: string;
    title: string;
    instruction: string;
    targetY?: number;
}

/** Every letter has its own full scene; no shared fallback scenery. */
export const GARDEN_SCENES: Record<string, GardenScene> = {
    a: { art: 'orchard', title: 'Vườn táo của Cáo', instruction: 'Chạm 3 quả táo, giúp Cáo hái vào giỏ nhé!' },
    b: { art: 'playground', title: 'Sân chơi vui nhộn', instruction: 'Chạm quả bóng 3 lần. Cùng chơi với Cáo nào!' },
    c: { art: 'hideaway', title: 'Ú òa, bạn ở đâu?', instruction: 'Mèo trốn ở đâu? Chạm các bụi cây để tìm nhé!' },
    d: { art: 'd-dog', title: 'Ngôi nhà của Chó', instruction: 'Chạm bạn Chó để chào bạn ấy nhé!' },
    e: { art: 'e-elephant', title: 'Voi con bên hồ nước', instruction: 'Chạm bạn Voi đang chơi với nước nào!' },
    f: { art: 'f-fish', title: 'Hồ cá trong veo', instruction: 'Bé thấy bạn Cá ở đâu? Chạm vào bạn ấy nhé!' },
    g: { art: 'g-goat', title: 'Dê con trên núi', instruction: 'Cùng chào bạn Dê trên đồng cỏ nhé!' },
    h: { art: 'h-hat', title: 'Tiệm mũ nhỏ xinh', instruction: 'Chạm chiếc mũ có nơ xinh nào!' },
    i: { art: 'i-ice-cream', title: 'Xe kem bên bờ biển', instruction: 'Tìm cây kem mát lạnh, chạm để nghe tên nhé!' },
    j: { art: 'j-juice', title: 'Buổi dã ngoại ngọt ngào', instruction: 'Chạm ly nước ép trên bàn nhé!' },
    k: { art: 'k-kite', title: 'Đồi diều lộng gió', instruction: 'Diều đang bay kìa! Chạm chiếc diều nhé!', targetY: 40 },
    l: { art: 'l-lion', title: 'Sư tử đón nắng', instruction: 'Chạm bạn Sư tử có chiếc bờm tròn nào!' },
    m: { art: 'm-monkey', title: 'Khỉ con trong rừng', instruction: 'Bạn Khỉ ở trên cành cây! Bé chạm thử nhé.', targetY: 57 },
    n: { art: 'n-nest', title: 'Chiếc tổ trên cành hoa', instruction: 'Tìm chiếc tổ có những quả trứng nhỏ nhé!', targetY: 57 },
    o: { art: 'o-orange', title: 'Vườn cam thơm ngát', instruction: 'Chạm quả cam tròn trên chiếc thùng nhé!' },
    p: { art: 'p-pig', title: 'Nông trại của Heo', instruction: 'Chạm bạn Heo hồng để chào nào!' },
    q: { art: 'q-queen', title: 'Lâu đài cổ tích', instruction: 'Chạm Nữ hoàng có chiếc vương miện nhé!' },
    r: { art: 'r-rabbit', title: 'Thỏ và vườn cà rốt', instruction: 'Tìm bạn Thỏ đang ôm cà rốt nào!' },
    s: { art: 's-sun', title: 'Mặt trời thức dậy', instruction: 'Chạm Mặt trời đang mỉm cười nhé!', targetY: 32 },
    t: { art: 't-tiger', title: 'Hổ con trong rừng tre', instruction: 'Chạm bạn Hổ có những vằn đen nhé!' },
    u: { art: 'u-umbrella', title: 'Chiếc ô ngày mưa', instruction: 'Tìm chiếc ô để cùng Cáo che mưa nào!', targetY: 53 },
    v: { art: 'v-violin', title: 'Góc nhạc trong vườn', instruction: 'Chạm cây đàn vĩ cầm để nghe tên nhé!', targetY: 59 },
    w: { art: 'w-watermelon', title: 'Quầy dưa mùa hè', instruction: 'Tìm quả dưa hấu ruột đỏ, vỏ xanh nhé!' },
    x: { art: 'x-xylophone', title: 'Sân khấu cầu vồng', instruction: 'Chạm cây đàn mộc cầm nhiều màu nào!' },
    y: { art: 'y-yo-yo', title: 'Xưởng đồ chơi nhỏ', instruction: 'Tìm con quay yo-yo có sợi dây nhé!', targetY: 58 },
    z: { art: 'z-zebra', title: 'Chuyến đi thăm Ngựa vằn', instruction: 'Chạm bạn Ngựa vằn đen trắng nhé!' },
};
