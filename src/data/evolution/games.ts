// Dữ liệu 3 trò chơi (data-spec mục L). Đáp án được test kiểm với cấu trúc cây (engine/games.test.ts).

/** "Họ hàng gần nhất của A là ai?" — answer ∈ {b, c}. */
export interface RelativesQ { a: string; b: string; c: string; answer: string; fact: string }

export const RELATIVES_BANK: RelativesQ[] = [
    { a: 'songbirds', b: 'trex', c: 'lizards_snakes', answer: 'trex', fact: 'Chim là khủng long còn sống sót!' },
    { a: 'humans', b: 'agaricus_example', c: 'flowering_plants_monocots', answer: 'agaricus_example', fact: 'Nấm gần với động vật hơn là với cây xanh.' },
    { a: 'humans', b: 'sea_stars', c: 'scyphozoa', answer: 'sea_stars', fact: 'Sao biển cùng nhánh "miệng thứ sinh" với chúng ta.' },
    { a: 'whales_dolphins', b: 'cows_deer', c: 'cartilaginous_fish', answer: 'cows_deer', fact: 'Cá voi là thú, họ hàng của bò và hà mã.' },
    { a: 'bats', b: 'rodents', c: 'songbirds', answer: 'rodents', fact: 'Dơi là thú biết bay, không phải chim.' },
    { a: 'lungfish', b: 'frogs_toads', c: 'ray_finned_fish', answer: 'frogs_toads', fact: 'Cá phổi gần ếch hơn là gần cá hồi!' },
    { a: 'butterflies_beetles_bees', b: 'crabs_shrimps_lobsters', c: 'spiders_scorpions_ticks', answer: 'crabs_shrimps_lobsters', fact: 'Côn trùng là họ hàng gần nhất của tôm cua.' },
    { a: 'pinworms', b: 'butterflies_beetles_bees', c: 'earthworms', answer: 'butterflies_beetles_bees', fact: 'Giun tròn và côn trùng đều lột xác để lớn.' },
    { a: 'humans', b: 'chimpanzees', c: 'gorillas', answer: 'chimpanzees', fact: 'Tinh tinh là họ hàng gần nhất của người.' },
    { a: 'kelp_example', b: 'phytophthora_example', c: 'flowering_plants_dicots', answer: 'phytophthora_example', fact: 'Tảo bẹ không phải họ hàng gần của cây xanh!' },
    { a: 'amoeba_example', b: 'agaricus_example', c: 'chlamydomonas_example', answer: 'agaricus_example', fact: 'Amip cùng một nhánh lớn với nấm và động vật.' },
    { a: 'crocodilians', b: 'songbirds', c: 'lizards_snakes', answer: 'songbirds', fact: 'Cá sấu gần chim hơn là gần thằn lằn.' },
    { a: 'humans', b: 'halobacterium_example', c: 'ecoli_example', answer: 'halobacterium_example', fact: 'Tế bào của chúng ta có "gốc" cổ khuẩn.' },
    { a: 'baker_yeast_example', b: 'blue_mold_example', c: 'agaricus_example', answer: 'blue_mold_example', fact: 'Men bánh mì và mốc xanh đều là nấm túi.' },
    { a: 'ferns', b: 'pine_spruce_fir_examples', c: 'mosses', answer: 'pine_spruce_fir_examples', fact: 'Dương xỉ và thông đều có mạch dẫn.' },
    { a: 'pine_spruce_fir_examples', b: 'flowering_plants_monocots', c: 'ferns', answer: 'flowering_plants_monocots', fact: 'Thông và lúa đều có hạt.' },
    { a: 'squids', b: 'octopuses', c: 'snails', answer: 'octopuses', fact: 'Mực và bạch tuộc đều là chân đầu.' },
    { a: 'humans', b: 'ray_finned_fish', c: 'cartilaginous_fish', answer: 'ray_finned_fish', fact: 'Cá hồi gần bạn hơn cá mập, vì cả hai cùng nhánh cá xương!' },
    { a: 'whales_dolphins', b: 'hippos', c: 'odd_toed', answer: 'hippos', fact: 'Họ hàng gần nhất của cá voi là hà mã.' },
    { a: 'frogs_toads', b: 'humans', c: 'ray_finned_fish', answer: 'humans', fact: 'Ếch và bạn đều là động vật bốn chân.' },
    { a: 'sea_urchins', b: 'humans', c: 'anthozoa', answer: 'humans', fact: 'Nhím biển là họ hàng xa của chúng ta, còn san hô thì xa hơn nữa.' },
    { a: 'agaricus_example', b: 'songbirds', c: 'ferns', answer: 'songbirds', fact: 'Nấm gần chim hơn gần dương xỉ.' },
];

export const RELATIVES_ROUND = 8;
export const RELATIVES_PASS = 6;

/** Khóa lưỡng phân "Đoán xem tớ là ai?". truth = node của câu trả lời "Có". */
export type KeyNext = { q: string } | { result: string };
export interface KeyQ { id: string; q: string; truth: string; flyNo: string | null; yes: KeyNext; no: KeyNext }

export const KEY_START = 'green';
export const MYSTERY_KEY: Record<string, KeyQ> = {
    green: { id: 'green', q: 'Nó có màu xanh lá và tự làm ra thức ăn từ ánh nắng không?', truth: 'viridiplantae', flyNo: 'opisthokonta', yes: { q: 'vascular' }, no: { q: 'fungus' } },
    vascular: { id: 'vascular', q: 'Nó có rễ, thân, lá thật với ống dẫn nước bên trong không?', truth: 'vascular_plants', flyNo: 'mosses', yes: { q: 'seed' }, no: { result: 'mosses' } },
    seed: { id: 'seed', q: 'Nó có tạo ra hạt không?', truth: 'seed_plants', flyNo: 'ferns', yes: { q: 'flower' }, no: { result: 'ferns' } },
    flower: { id: 'flower', q: 'Nó có hoa và quả không?', truth: 'angiosperms', flyNo: 'pine_spruce_fir_examples', yes: { q: 'parallel' }, no: { result: 'pine_spruce_fir_examples' } },
    parallel: { id: 'parallel', q: 'Lá của nó có gân song song như lá lúa không?', truth: 'flowering_plants_monocots', flyNo: 'flowering_plants_dicots', yes: { result: 'flowering_plants_monocots' }, no: { result: 'flowering_plants_dicots' } },
    fungus: { id: 'fungus', q: 'Nó mọc tại chỗ, không có miệng, hút thức ăn qua những sợi nhỏ li ti không?', truth: 'fungi_simple', flyNo: 'animalia', yes: { result: 'agaricus_example' }, no: { q: 'backbone' } },
    backbone: { id: 'backbone', q: 'Nó có xương sống không?', truth: 'vertebrates', flyNo: null, yes: { q: 'limbs' }, no: { q: 'jointed' } },
    jointed: { id: 'jointed', q: 'Nó có bộ xương cứng bên ngoài và chân có nhiều khớp không?', truth: 'arthropoda', flyNo: null, yes: { q: 'six' }, no: { q: 'arms' } },
    six: { id: 'six', q: 'Nó có đúng 6 chân không?', truth: 'insects', flyNo: 'arachnids', yes: { result: 'butterflies_beetles_bees' }, no: { result: 'spiders_scorpions_ticks' } },
    arms: { id: 'arms', q: 'Quanh đầu nó có nhiều tay với giác mút không?', truth: 'cephalopods', flyNo: null, yes: { result: 'octopuses' }, no: { q: 'sting' } },
    sting: { id: 'sting', q: 'Nó có thân mềm như chiếc ô và xúc tu biết chích không?', truth: 'cnidaria', flyNo: 'echinodermata', yes: { result: 'scyphozoa' }, no: { result: 'sea_stars' } },
    limbs: { id: 'limbs', q: 'Nó có bốn chi (chân hoặc cánh) không?', truth: 'tetrapods', flyNo: 'gnathostomes', yes: { q: 'tadpole' }, no: { q: 'cartilage' } },
    cartilage: { id: 'cartilage', q: 'Bộ xương của nó bằng sụn dẻo (giống sụn tai của bạn) không?', truth: 'cartilaginous_fish', flyNo: 'ray_finned_fish', yes: { result: 'cartilaginous_fish' }, no: { result: 'ray_finned_fish' } },
    tadpole: { id: 'tadpole', q: 'Nó có da ẩm và lúc bé là nòng nọc sống dưới nước không?', truth: 'amphibians', flyNo: 'amniotes', yes: { result: 'frogs_toads' }, no: { q: 'feathers' } },
    feathers: { id: 'feathers', q: 'Nó có lông vũ không?', truth: 'birds', flyNo: null, yes: { result: 'songbirds' }, no: { q: 'milk' } },
    milk: { id: 'milk', q: 'Nó có lông mao và bú sữa mẹ khi còn nhỏ không?', truth: 'mammals', flyNo: 'lepidosauria', yes: { q: 'trunk' }, no: { result: 'lizards_snakes' } },
    trunk: { id: 'trunk', q: 'Nó có chiếc vòi thật dài không?', truth: 'proboscidea', flyNo: 'hominini', yes: { result: 'asian_elephant' }, no: { result: 'humans' } },
};

/** Tên bí ẩn khi lật đáp án ("Tớ là …"). */
export const MYSTERY_NAMES: Record<string, string> = {
    mosses: 'Rêu', ferns: 'Dương xỉ', pine_spruce_fir_examples: 'Cây thông', flowering_plants_monocots: 'Cây lúa',
    flowering_plants_dicots: 'Hoa hướng dương', agaricus_example: 'Nấm mỡ', butterflies_beetles_bees: 'Con ong',
    spiders_scorpions_ticks: 'Con nhện', octopuses: 'Bạch tuộc', scyphozoa: 'Con sứa', sea_stars: 'Sao biển',
    cartilaginous_fish: 'Cá mập', ray_finned_fish: 'Cá hồi', frogs_toads: 'Con ếch', songbirds: 'Chim sẻ',
    lizards_snakes: 'Thằn lằn', asian_elephant: 'Con voi', humans: 'Người — đó chính là bạn!',
};
export const KEY_PASS = 6;

/** Điểm dừng của "Hành trình về tổ tiên". */
export const JOURNEY_STOPS: ReadonlySet<string> = new Set([
    'luca', 'archaea', 'asgard_archaea_simple', 'eukarya', 'opisthokonta', 'animalia', 'bilateria', 'deuterostomes',
    'vertebrates', 'gnathostomes', 'bony_fish', 'rhipidistia', 'tetrapods', 'amniotes', 'synapsids', 'mammals',
    'placental_mammals', 'primates', 'simians', 'great_apes', 'hominini', 'reptiles_phylo', 'archosauria', 'dinosaurs',
    'theropods', 'birds', 'arthropoda', 'pancrustacea', 'spiralia', 'ecdysozoa', 'mollusca', 'cnidaria', 'fungi_simple',
    'dikarya', 'archaeplastida', 'viridiplantae', 'land_plants', 'vascular_plants', 'seed_plants', 'angiosperms', 'sar',
    'bacteria', 'proteobacteria', 'amoebozoa',
]);

/** Câu riêng cho các điểm dừng của hai hành trình chính (Người, Chim). */
export const JOURNEY: Record<string, string> = {
    hominini: 'tổ tiên chung của bạn và tinh tinh sống trong rừng châu Phi.',
    great_apes: 'tổ tiên vượn người không đuôi đu mình trên cây.',
    simians: 'tổ tiên khỉ và vượn có đôi mắt nhìn thẳng về phía trước.',
    primates: 'một con vật nhỏ sống trên cây, bàn tay biết cầm nắm.',
    placental_mammals: 'tổ tiên thú nhau thai nhỏ như con chuột, sống cùng thời khủng long.',
    mammals: 'những con thú đầu tiên có lông và cho con bú sữa.',
    synapsids: 'tổ tiên của thú trông giống thằn lằn nhưng không phải thằn lằn.',
    amniotes: 'trứng có vỏ giúp tổ tiên sống hẳn trên cạn.',
    tetrapods: 'cá vây thùy bò lên bờ, vây dần thành chân.',
    rhipidistia: 'tổ tiên có phổi, họ hàng với cá phổi.',
    bony_fish: 'một loài cá có bộ xương cứng.',
    gnathostomes: 'những con cá đầu tiên có hàm.',
    vertebrates: 'một sinh vật nhỏ như con cá, lần đầu có xương sống.',
    bilateria: 'một con vật nhỏ xíu có đầu và đuôi, bò trên đáy biển.',
    animalia: 'những động vật đầu tiên còn rất nhỏ và mềm.',
    opisthokonta: 'tổ tiên chung của bạn và cây nấm, một tế bào bơi bằng một chiếc roi.',
    eukarya: 'một tế bào có nhân, bên trong đã có ty thể.',
    asgard_archaea_simple: 'một cổ khuẩn tí hon, tổ tiên xa của mọi tế bào có nhân.',
    luca: 'LUCA, tổ tiên chung của mọi sinh vật. Mọi sinh vật đều là họ hàng!',
    theropods: 'khủng long chân thú chạy bằng hai chân.',
    dinosaurs: 'những con khủng long đầu tiên.',
    archosauria: 'tổ tiên chung của chim và cá sấu.',
    reptiles_phylo: 'tổ tiên bò sát có da vảy.',
};

export const JOURNEY_SUGGESTIONS = ['humans', 'songbirds', 'cartilaginous_fish', 'agaricus_example', 'flowering_plants_monocots', 'ecoli_example'];

/** Huy hiệu (StudentProfile.evoBadges). need = số ngọn cần xem trong sector. */
export const EVO_BADGE_STARS = 10;
export const EVO_BADGES: { id: string; label: string; icon: string; need?: number; sector?: string }[] = [
    { id: 'bacteria', label: 'Nhà vi khuẩn học', icon: '🦠', need: 10, sector: 'bacteria' },
    { id: 'archaea', label: 'Thám tử cổ khuẩn', icon: '🌋', need: 7, sector: 'archaea' },
    { id: 'protist', label: 'Bạn của nguyên sinh vật', icon: '🔬', need: 8, sector: 'protist' },
    { id: 'plant', label: 'Nhà thực vật học', icon: '🌿', need: 8, sector: 'plant' },
    { id: 'fungi', label: 'Nhà nấm học', icon: '🍄', need: 8, sector: 'fungi' },
    { id: 'animal', label: 'Nhà động vật học', icon: '🦊', need: 20, sector: 'animal' },
    { id: 'relatives', label: 'Thánh đoán họ hàng', icon: '🧬' },
    { id: 'key', label: 'Bậc thầy khóa lưỡng phân', icon: '🗝️' },
    { id: 'journey', label: 'Nhà du hành thời gian', icon: '⏳' },
];
