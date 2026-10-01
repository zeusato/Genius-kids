import type { Lesson, Step } from '../model';
const line = (notes: number[], beats = 1): Step[] => notes.map(midi => ({ pitches: [midi], beats }));
const keys = (from: number, to: number, keep: (midi: number) => boolean = () => true) => Array.from({ length: to - from + 1 }, (_, i) => from + i).filter(keep);
const BLACK = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
// Ode to Joy (Beethoven, 1824), right hand in C position.
const JOY_A = line([64, 64, 65, 67, 67, 65, 64, 62]);
const JOY_B: Step[] = [...line([60, 60, 62, 64]), { pitches: [64], beats: 1.5 }, { pitches: [62], beats: .5 }, { pitches: [62], beats: 2 }];
const JOY_C: Step[] = [...line([60, 60, 62, 64]), { pitches: [62], beats: 1.5 }, { pitches: [60], beats: .5 }, { pitches: [60], beats: 2 }];
/**
 * A short path from the first touch to the first melody. Each lesson mixes looking (find a key),
 * naming (quiz), listening (echo, high/low) and playing; one idea per activity.
 */
export const LESSONS: Lesson[] = [
    { id:'learn-1', title:'Xin chào, phím đàn!', subtitle:'Phím trắng, phím đen', icon:'👋', range:[60,72], demonstration:'hand',
        tip:'Ngón cái là ngón 1, ngón út là ngón 5. Chạm nhẹ thôi nhé.',
        activities:[
            { type:'find', say:'Chạm thử năm phím bất kỳ. Mỗi phím có một tiếng riêng đấy!', targets:keys(60,72), need:5, wrongTip:'' },
            { type:'find', say:'Đàn có phím trắng và phím đen. Em chạm ba phím đen nhé.', targets:keys(60,72,BLACK), need:3, wrongTip:'Đó là phím trắng. Phím đen nhỏ hơn, nằm phía trên nhé.' },
            { type:'follow', say:'Đây là phím Đô. Dùng ngón cái, ngón số một, chạm Đô ba lần.', steps:line([60,60,60]), lights:'always', fingers:true },
        ] },
    { id:'learn-2', title:'Nhà của Đô', subtitle:'Bên trái hai phím đen', icon:'🏡', range:[60,84],
        tip:'Phím đen đứng thành nhóm 2 và nhóm 3. Đô luôn ở ngay bên trái nhóm 2.',
        activities:[
            { type:'find', say:'Phím đen đứng thành nhóm hai và nhóm ba. Tìm hết các phím đen trong nhóm hai nhé.', targets:[61,63,73,75], wrongTip:'Chưa đúng rồi. Nhóm hai chỉ có hai phím đen đứng cạnh nhau.' },
            { type:'find', say:'Phím trắng ngay bên trái nhóm hai phím đen là Đô. Tìm cả ba phím Đô!', targets:[60,72,84], labels:false, wrongTip:'Chưa phải Đô. Tìm nhóm hai phím đen, Đô ở ngay bên trái.' },
            { type:'follow', say:'Đô thấp, Đô giữa, Đô cao. Cùng tên nhưng nghe cao thấp khác nhau.', steps:line([60,72,84,72,60]), lights:'always' },
        ] },
    { id:'learn-3', title:'Đô, Rê, Mi', subtitle:'Ba bước chân nhỏ', icon:'🐾', range:[60,72], demonstration:'hand',
        tip:'Rê nằm giữa hai phím đen của nhóm 2. Mi ở ngay bên phải nhóm đó.',
        activities:[
            { type:'follow', say:'Ngón một Đô, ngón hai Rê, ngón ba Mi. Mình đi lên ba bậc nhé.', steps:line([60,62,64]), lights:'always', fingers:true },
            { type:'follow', say:'Bây giờ đi xuống: Mi, Rê, Đô.', steps:line([64,62,60]), lights:'always', fingers:true },
            { type:'follow', say:'Nghe bạn Cáo đàn trước, rồi em đàn lại giống vậy.', steps:line([60,62,64,62,60]), lights:'after-miss', listenFirst:true, fingers:true },
            { type:'quiz', say:'Bạn Cáo gọi tên nốt nào, em tìm nốt đó nhé.', rounds:[2,4,0,4,2] },
        ] },
    { id:'learn-4', title:'Fa, Sol, La, Si', subtitle:'Bên cạnh ba phím đen', icon:'🌈', range:[60,72],
        tip:'Fa ở ngay bên trái nhóm 3 phím đen. Giữa Mi – Fa và Si – Đô không có phím đen.',
        activities:[
            { type:'find', say:'Tìm nhóm ba phím đen. Chạm cả ba phím nhé.', targets:[66,68,70], wrongTip:'Nhóm ba có ba phím đen đứng liền nhau, ở bên phải.' },
            { type:'find', say:'Phím trắng ngay bên trái nhóm ba phím đen là Fa. Em tìm phím Fa nhé.', targets:[65], labels:false, wrongTip:'Chưa phải Fa. Tìm nhóm ba phím đen, Fa ở ngay bên trái.' },
            { type:'follow', say:'Fa, Sol, La, Si, rồi về nhà Đô cao!', steps:line([65,67,69,71,72]), lights:'always' },
            { type:'quiz', say:'Tìm nốt bạn Cáo gọi tên nhé.', rounds:[7,9,5,11] },
        ] },
    { id:'learn-5', title:'Cầu thang bảy nốt', subtitle:'Đô Rê Mi Fa Sol La Si', icon:'🪜', range:[60,72],
        tip:'Bảy nốt lặp lại khắp bàn đàn: hết Si lại đến Đô.',
        activities:[
            { type:'follow', say:'Đi lên cầu thang tám bậc: Đô, Rê, Mi, Fa, Sol, La, Si, Đô.', steps:line([60,62,64,65,67,69,71,72]), lights:'always' },
            { type:'follow', say:'Bây giờ đi xuống cầu thang nào!', steps:line([72,71,69,67,65,64,62,60]), lights:'always' },
            { type:'quiz', say:'Thử không nhìn tên nốt nhé! Bạn Cáo gọi nốt nào, em tìm nốt đó.', rounds:[0,4,7,2,9,5,11], labels:false },
        ] },
    { id:'learn-6', title:'Cao và thấp', subtitle:'Sang phải là cao hơn', icon:'⛰️', range:[60,84],
        tip:'Cao – thấp là chuyện của cao độ, khác với to – nhỏ.',
        activities:[
            { type:'find', say:'Phím bên phải kêu cao hơn. Chạm ba phím cao hơn phím có ngôi sao.', targets:keys(73,84), need:3, marks:[72], wrongTip:'Phím đó ở bên trái ngôi sao, tiếng thấp hơn. Sang phải nhé!' },
            { type:'find', say:'Phím bên trái kêu thấp hơn. Chạm ba phím thấp hơn phím có ngôi sao.', targets:keys(60,71), need:3, marks:[72], wrongTip:'Phím đó ở bên phải ngôi sao, tiếng cao hơn. Sang trái nhé!' },
            { type:'ear', say:'Nghe hai tiếng đàn. Tiếng thứ hai đi lên cao hay xuống thấp?', rounds:[[60,72],[79,64],[62,69],[76,60],[65,79]] },
        ] },
    { id:'learn-7', title:'Nốt ngắn, nốt dài', subtitle:'Giữ phím để ngân', icon:'🌦️', range:[60,72], demonstration:'hand',
        tip:'Nốt dài: giữ phím đến khi vòng sáng đầy rồi mới nhả tay.',
        activities:[
            { type:'follow', say:'Hai nốt ngắn, rồi giữ nốt Mi thật lâu. Đợi vòng sáng đầy mới nhả tay nhé.', steps:[{pitches:[60],beats:1},{pitches:[62],beats:1},{pitches:[64],beats:2,holdMs:900}], lights:'always', fingers:true },
            { type:'follow', say:'Ngắn, ngắn, dài. Ngắn, ngắn, dài.', steps:[{pitches:[64],beats:.5},{pitches:[64],beats:.5},{pitches:[67],beats:2,holdMs:900},{pitches:[62],beats:.5},{pitches:[62],beats:.5},{pitches:[60],beats:2,holdMs:900}], lights:'always', fingers:true },
            { type:'follow', say:'Nghe bạn Cáo trước, rồi đàn lại: ngắn, ngắn, dài.', steps:[{pitches:[67],beats:.5},{pitches:[67],beats:.5},{pitches:[64],beats:2,holdMs:900}], lights:'after-miss', listenFirst:true, fingers:true },
        ] },
    { id:'learn-8', title:'Âm nhạc cũng nghỉ', subtitle:'Một khoảng lặng nhỏ', icon:'☁️', range:[60,72],
        tip:'Khoảng nghỉ là một phần của âm nhạc. Cứ thong thả nhé.',
        activities:[
            { type:'follow', say:'Chơi một nốt, nhả tay, chờ đám mây trôi qua rồi chơi nốt tiếp theo.', steps:[{pitches:[60],beats:1,gapBeats:1},{pitches:[64],beats:1,gapBeats:1},{pitches:[67],beats:1,gapBeats:1},{pitches:[72],beats:2}], lights:'always' },
            { type:'follow', say:'Mi, nghỉ, Mi, nghỉ, rồi Sol thật vui!', steps:[{pitches:[64],beats:1,gapBeats:1},{pitches:[64],beats:1,gapBeats:1},{pitches:[67],beats:2}], lights:'always', fingers:true },
        ] },
    { id:'learn-9', title:'Hai bạn cùng hát', subtitle:'Hai nốt cùng lúc', icon:'🤝', range:[60,72], demonstration:'hand',
        tip:'Trên bàn phím máy tính: giữ A + D, rồi S + F. Không cần dùng sức.',
        activities:[
            { type:'follow', say:'Chạm cùng lúc Đô và Mi bằng hai ngón. Rồi thử Rê cùng Fa.', steps:[{pitches:[60,64],beats:2},{pitches:[62,65],beats:2},{pitches:[60,67],beats:2}], lights:'always', fingers:true },
            { type:'follow', say:'Ngón một và ngón năm cùng chạm: Đô và Sol!', steps:[{pitches:[60,67],beats:2},{pitches:[60,64],beats:1},{pitches:[60,64],beats:1},{pitches:[60,67],beats:2}], lights:'always', fingers:true },
        ] },
    { id:'learn-10', title:'Giai điệu đầu tiên', subtitle:'Bài ca Niềm vui', icon:'🌟', range:[60,72],
        tip:'Bài ca Niềm vui là giai điệu của nhạc sĩ Beethoven. Năm ngón tay đặt trên Đô, Rê, Mi, Fa, Sol.',
        activities:[
            { type:'follow', say:'Nghe câu đầu của Bài ca Niềm vui, rồi đàn theo phím sáng.', steps:JOY_A, lights:'always', listenFirst:true, fingers:true },
            { type:'follow', say:'Câu thứ hai kết thúc ở nốt Rê dài.', steps:JOY_B, lights:'always', fingers:true },
            { type:'follow', say:'Câu thứ ba giống hệt câu đầu tiên.', steps:JOY_A, lights:'always', fingers:true },
            { type:'follow', say:'Câu cuối về nhà, kết thúc ở nốt Đô.', steps:JOY_C, lights:'always', fingers:true },
            { type:'follow', say:'Bây giờ đàn cả bài mà không cần phím sáng. Em làm được mà!', steps:[...JOY_A,...JOY_B,...JOY_A,...JOY_C], lights:'after-miss', fingers:true },
        ] },
];
