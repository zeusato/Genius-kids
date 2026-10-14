// Lớp 5 — Hình học (g5_geometry).
import { explore, form, know, lesson, mistake, note, pic, picCap, rule, step, text, vis, widget, worked } from '../../build';
import { fmt } from '../../../value';
import type { LessonBook } from '../../types';

type Net = [number, number][];
const CROSS: Net = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]];
const BAD_ROW: Net = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]];
const BAD_BLOCK: Net = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]];

export default {
    'g5.triangle_area': lesson('g5.triangle_area', {
        v: 1,
        goal: 'tính được diện tích hình tam giác và tìm được chiều cao hoặc độ dài đáy khi biết diện tích.',
        hook: { md: 'Cắt tờ giấy hình chữ nhật theo đường chéo, em được hai hình tam giác bằng nhau. Mỗi hình tam giác có diện tích bằng bao nhiêu phần tờ giấy?', answer: 'Mỗi hình tam giác có diện tích bằng một nửa tờ giấy hình chữ nhật.' },
        needs: ['g3.area_cm2'],
        know: [
            know('Công thức diện tích tam giác',
                pic('triangleSVG', { base: 6, height: 4 }),
                text('Ghép hai hình tam giác bằng nhau được một hình chữ nhật có chiều dài bằng đáy, chiều rộng bằng chiều cao của tam giác.'),
                rule('Muốn tính diện tích hình tam giác, ta lấy độ dài đáy nhân với chiều cao (cùng đơn vị đo) rồi chia cho 2.', 'S = {a} × {h} : 2'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi độ dài đáy và chiều cao',
                    controls: {
                        a: { label: 'Độ dài đáy', min: 2, max: 12, init: 6, unit: 'cm' },
                        h: { label: 'Chiều cao', min: 2, max: 10, init: 4, unit: 'cm' },
                    },
                    visual: v => vis('triangleSVG', { base: v.a, height: v.h }),
                    caption: v => `Diện tích: ${v.a} × ${v.h} : 2 = ${fmt(v.a * v.h / 2)} (cm²).`,
                })),
                rule('Biết diện tích và độ dài đáy: chiều cao bằng diện tích nhân với 2 rồi chia cho độ dài đáy.'),
            ),
        ],
        forms: [
            form({
                id: 'tinh-s', title: 'Dạng 1: Tính diện tích tam giác', level: 1,
                cue: 'Đề cho độ dài đáy và chiều cao, hỏi diện tích.',
                steps: ['Kiểm tra đáy và chiều cao cùng đơn vị.', 'Lấy đáy nhân chiều cao rồi chia cho 2.', 'Viết đáp số kèm đơn vị diện tích.'],
                example: worked({
                    problem: 'Tính diện tích hình tam giác có độ dài đáy 19 cm và chiều cao 5 cm.',
                    steps: [step('Diện tích hình tam giác là:', '19 × 5 : 2 = 47,5 (cm²)')],
                    answer: 'Đáp số: 47,5 cm².',
                }),
            }),
            form({
                id: 'tim-cao', title: 'Dạng 2: Tìm chiều cao hoặc độ dài đáy', level: 2,
                cue: 'Đề cho diện tích và một trong hai: đáy hoặc chiều cao.',
                steps: ['Nhân diện tích với 2.', 'Chia cho độ dài đã biết (đáy hoặc chiều cao).', 'Viết đáp số kèm đơn vị độ dài.'],
                example: worked({
                    problem: 'Hình tam giác có diện tích 24 cm², độ dài đáy 12 cm. Tính chiều cao.',
                    steps: [step('Chiều cao của hình tam giác là:', '24 × 2 : 12 = 4 (cm)')],
                    answer: 'Đáp số: 4 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đáy 19 cm, chiều cao 5 cm, bạn Bi tính: 19 × 5 = 95 (cm²).', 'Diện tích: 19 × 5 : 2 = 47,5 (cm²).', 'Diện tích tam giác bằng một nửa hình chữ nhật cùng đáy, cùng chiều cao, nên phải chia cho 2.'),
            mistake('Đáy 2 dm, chiều cao 15 cm, bạn Bi tính: 2 × 15 : 2 = 15.', 'Đổi 2 dm = 20 cm, rồi tính 20 × 15 : 2 = 150 (cm²).', 'Đáy và chiều cao phải cùng đơn vị đo.'),
        ],
        remember: [
            'S = đáy × chiều cao : 2.',
            'Chiều cao = S × 2 : đáy; đáy = S × 2 : chiều cao.',
            'Đáy và chiều cao phải cùng đơn vị.',
        ],
    }),
    'g5.trapezoid_area': lesson('g5.trapezoid_area', {
        v: 1,
        goal: 'tính được diện tích hình thang và tìm được chiều cao khi biết diện tích.',
        hook: { md: 'Mảnh ruộng hình thang có đáy lớn 12 m, đáy bé 8 m, chiều cao 5 m. Diện tích mảnh ruộng là bao nhiêu mét vuông?', answer: 'Diện tích: (12 + 8) × 5 : 2 = 50 (m²).' },
        needs: ['g5.triangle_area'],
        know: [
            know('Hình thang',
                pic('trapezoidSVG', 4, 8, 3),
                text('Hình thang có hai cạnh đáy song song: **đáy lớn** và **đáy bé**. **Chiều cao** là khoảng cách giữa hai đáy.'),
                rule('Muốn tính diện tích hình thang, ta lấy tổng độ dài hai đáy nhân với chiều cao (cùng đơn vị đo) rồi chia cho 2.', 'S = ({a} + {b}) × {h} : 2'),
            ),
            know('Tìm chiều cao',
                rule('Biết diện tích và tổng hai đáy: chiều cao bằng diện tích nhân với 2 rồi chia cho tổng hai đáy.'),
            ),
        ],
        forms: [
            form({
                id: 'tinh-s', title: 'Dạng 1: Tính diện tích hình thang', level: 1,
                cue: 'Đề cho đáy lớn, đáy bé và chiều cao.',
                steps: ['Cộng hai đáy.', 'Nhân với chiều cao.', 'Chia cho 2.'],
                example: worked({
                    problem: 'Tính diện tích hình thang có đáy bé 4 cm, đáy lớn 12 cm và chiều cao 2 cm.',
                    visual: vis('trapezoidSVG', 4, 12, 2),
                    steps: [step('Diện tích hình thang là:', '(12 + 4) × 2 : 2 = 16 (cm²)')],
                    answer: 'Đáp số: 16 cm².',
                }),
            }),
            form({
                id: 'tim-cao', title: 'Dạng 2: Tìm chiều cao', level: 2,
                cue: 'Đề cho diện tích và tổng hai đáy (hoặc từng đáy), hỏi chiều cao.',
                steps: ['Nhân diện tích với 2.', 'Chia cho tổng hai đáy.', 'Viết đáp số kèm đơn vị độ dài.'],
                example: worked({
                    problem: 'Hình thang có diện tích 154 cm², tổng hai đáy là 28 cm. Tính chiều cao.',
                    steps: [step('Chiều cao của hình thang là:', '154 × 2 : 28 = 11 (cm)')],
                    answer: 'Đáp số: 11 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đáy lớn 12 cm, đáy bé 4 cm, cao 2 cm. Bạn Bi chỉ lấy đáy lớn: 12 × 2 : 2 = 12 (cm²).', 'Diện tích: (12 + 4) × 2 : 2 = 16 (cm²).', 'Phải cộng cả hai đáy trước, rồi mới nhân với chiều cao và chia cho 2.'),
        ],
        remember: [
            'S = (đáy lớn + đáy bé) × chiều cao : 2.',
            'Chiều cao = S × 2 : (tổng hai đáy).',
        ],
    }),
    'g5.circle': lesson('g5.circle', {
        v: 1,
        goal: 'tính được chu vi, diện tích hình tròn và giải bài toán thực tế về hình tròn.',
        hook: { md: 'Bánh xe đạp có đường kính 6 dm. Bánh xe lăn một vòng thì xe đi được bao nhiêu đề-xi-mét?', answer: 'Một vòng lăn bằng chu vi bánh xe: 6 × 3,14 = 18,84 (dm).' },
        needs: ['g3.circle'],
        know: [
            know('Chu vi hình tròn',
                rule('Muốn tính chu vi hình tròn, ta lấy đường kính nhân với 3,14.', 'C = {d} × 3,14'),
                text('Hoặc lấy bán kính nhân với 2 rồi nhân với 3,14.'),
                widget(explore({
                    title: 'Đổi bán kính',
                    controls: { r: { label: 'Bán kính', min: 1, max: 10, init: 3, unit: 'cm' } },
                    visual: v => vis('circleSVG', v.r, { showRadius: true }),
                    caption: v => `Bán kính ${v.r} cm. Chu vi: ${v.r} × 2 × 3,14 = ${fmt(v.r * 2 * 3.14)} (cm). Diện tích: ${v.r} × ${v.r} × 3,14 = ${fmt(v.r * v.r * 3.14)} (cm²).`,
                })),
            ),
            know('Diện tích hình tròn',
                rule('Muốn tính diện tích hình tròn, ta lấy bán kính nhân với bán kính rồi nhân với 3,14.', 'S = {r} × {r} × 3,14'),
                note('Công thức diện tích dùng bán kính. Đề cho đường kính thì chia đôi để được bán kính.'),
            ),
        ],
        forms: [
            form({
                id: 'chu-vi', title: 'Dạng 1: Tính chu vi', level: 1,
                cue: 'Đề cho bán kính (hoặc đường kính), hỏi chu vi.',
                steps: ['Có đường kính: chu vi = đường kính × 3,14.', 'Có bán kính: chu vi = bán kính × 2 × 3,14.'],
                example: worked({
                    problem: 'Tính chu vi hình tròn có bán kính 9 cm.',
                    steps: [step('Chu vi hình tròn là:', '9 × 2 × 3,14 = 56,52 (cm)')],
                    answer: 'Đáp số: 56,52 cm.',
                }),
            }),
            form({
                id: 'dien-tich', title: 'Dạng 2: Tính diện tích', level: 2,
                cue: 'Đề cho bán kính (hoặc đường kính), hỏi diện tích.',
                steps: ['Tìm bán kính (đường kính chia 2).', 'Diện tích = bán kính × bán kính × 3,14.', 'Viết đơn vị diện tích.'],
                example: worked({
                    problem: 'Tính diện tích hình tròn có bán kính 11 cm.',
                    steps: [step('Diện tích hình tròn là:', '11 × 11 × 3,14 = 379,94 (cm²)')],
                    answer: 'Đáp số: 379,94 cm².',
                }),
            }),
            form({
                id: 'banh-xe', title: 'Dạng 3: Bánh xe lăn', level: 3,
                cue: 'Bài toán về bánh xe, vòng quay: quãng đường lăn được một vòng chính là chu vi.',
                steps: ['Một vòng lăn bằng chu vi bánh xe.', 'Nhiều vòng thì nhân chu vi với số vòng.'],
                example: worked({
                    problem: 'Bánh xe có đường kính 5 dm. Bánh xe lăn được 1 vòng thì đi được quãng đường dài bao nhiêu đề-xi-mét?',
                    steps: [step('Bánh xe lăn 1 vòng thì đi được quãng đường bằng chu vi bánh xe:', '5 × 3,14 = 15,7 (dm)')],
                    answer: 'Đáp số: 15,7 dm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bán kính 11 cm, bạn Bi tính diện tích: 11 × 2 × 3,14 = 69,08 (cm²).', 'Diện tích: 11 × 11 × 3,14 = 379,94 (cm²).', 'Bi dùng công thức chu vi. Diện tích là bán kính nhân bán kính rồi nhân 3,14.'),
            mistake('Đường kính 10 cm, bạn Bi tính diện tích: 10 × 10 × 3,14.', 'Bán kính là 10 : 2 = 5 (cm); diện tích: 5 × 5 × 3,14 = 78,5 (cm²).', 'Công thức diện tích dùng bán kính, không dùng đường kính.'),
        ],
        remember: [
            'Chu vi = đường kính × 3,14 = bán kính × 2 × 3,14.',
            'Diện tích = bán kính × bán kính × 3,14.',
            'Bánh xe lăn một vòng đi được quãng đường bằng chu vi.',
        ],
    }),
    'g5.solid_area': lesson('g5.solid_area', {
        v: 1,
        goal: 'tính được diện tích xung quanh, diện tích toàn phần của hình hộp chữ nhật và hình lập phương.',
        hook: { md: 'Bố muốn sơn mặt ngoài một cái hộp không có nắp. Cần sơn những mặt nào?', answer: 'Bốn mặt xung quanh và mặt đáy. Không có nắp nên không sơn mặt trên.' },
        needs: ['g3.area_cm2'],
        know: [
            know('Hình hộp chữ nhật',
                pic('box3dSVG', 5, 3, 4),
                text('**Diện tích xung quanh** là tổng diện tích bốn mặt bên. **Diện tích toàn phần** là diện tích xung quanh cộng diện tích hai đáy.'),
                rule('Diện tích xung quanh hình hộp chữ nhật bằng chu vi mặt đáy nhân với chiều cao (cùng đơn vị đo).', 'Sxq = ({dài} + {rộng}) × 2 × {cao}'),
            ),
            know('Hình lập phương',
                pic('cubeSVG', 4),
                rule('Hình lập phương có 6 mặt là hình vuông bằng nhau. Diện tích xung quanh bằng diện tích một mặt nhân 4; diện tích toàn phần bằng diện tích một mặt nhân 6.'),
            ),
        ],
        forms: [
            form({
                id: 'lap-phuong', title: 'Dạng 1: Hình lập phương', level: 2,
                cue: 'Đề cho cạnh hình lập phương, hỏi diện tích xung quanh hoặc toàn phần.',
                steps: ['Tính diện tích một mặt: cạnh × cạnh.', 'Xung quanh: nhân 4. Toàn phần: nhân 6.'],
                example: worked({
                    problem: 'Hình lập phương có cạnh 6 cm. Tính diện tích toàn phần.',
                    visual: vis('cubeSVG', 6),
                    steps: [step('Diện tích một mặt là:', '6 × 6 = 36 (cm²)'), step('Diện tích toàn phần là:', '36 × 6 = 216 (cm²)')],
                    answer: 'Đáp số: 216 cm².',
                }),
            }),
            form({
                id: 'hop-chu-nhat', title: 'Dạng 2: Hình hộp chữ nhật, hộp không nắp', level: 3,
                cue: 'Đề cho dài, rộng, cao của hình hộp chữ nhật; có thể hỏi phần cần sơn, cần dán giấy.',
                steps: ['Tính diện tích xung quanh: chu vi đáy × chiều cao.', 'Tính diện tích một đáy: dài × rộng.', 'Cộng đủ số đáy cần tính (hộp không nắp chỉ một đáy).'],
                example: worked({
                    problem: 'Một cái hộp hình hộp chữ nhật không có nắp, dài 12 dm, rộng 6 dm, cao 6 dm. Tính diện tích cần sơn mặt ngoài của hộp.',
                    steps: [step('Diện tích xung quanh là:', '(12 + 6) × 2 × 6 = 216 (dm²)'), step('Diện tích một đáy là:', '12 × 6 = 72 (dm²)'), step('Hộp không có nắp nên chỉ cộng một đáy:', '216 + 72 = 288 (dm²)')],
                    answer: 'Đáp số: 288 dm².',
                }),
            }),
        ],
        mistakes: [
            mistake('Hộp không có nắp, bạn Bi vẫn cộng cả hai đáy: 216 + 72 × 2 = 360 (dm²).', 'Chỉ cộng một đáy: 216 + 72 = 288 (dm²).', 'Không có nắp thì không sơn mặt trên, chỉ sơn bốn mặt xung quanh và một mặt đáy.'),
        ],
        remember: [
            'Hình hộp chữ nhật: Sxq = (dài + rộng) × 2 × cao; Stp = Sxq + 2 đáy.',
            'Hình lập phương: Sxq = một mặt × 4; Stp = một mặt × 6.',
            'Đọc kĩ đề: có nắp hay không có nắp.',
        ],
    }),
    'g5.volume': lesson('g5.volume', {
        v: 1,
        goal: 'tính được thể tích hình hộp chữ nhật, hình lập phương và giải bài toán thực tế.',
        hook: { md: 'Một bể cá dài 5 dm, rộng 3 dm, cao 4 dm. Bể chứa đầy được bao nhiêu lít nước?', answer: 'Thể tích bể: 5 × 3 × 4 = 60 (dm³), tức là 60 l nước.' },
        needs: ['g5.volume_units'],
        know: [
            know('Công thức thể tích',
                rule('Thể tích hình hộp chữ nhật bằng chiều dài nhân chiều rộng nhân chiều cao (cùng đơn vị đo).', 'V = {dài} × {rộng} × {cao}'),
                rule('Thể tích hình lập phương bằng cạnh nhân cạnh nhân cạnh.'),
                widget(explore({
                    title: 'Đổi kích thước hình hộp',
                    controls: {
                        a: { label: 'Chiều dài', min: 2, max: 8, init: 5, unit: 'cm' },
                        b: { label: 'Chiều rộng', min: 2, max: 6, init: 3, unit: 'cm' },
                        c: { label: 'Chiều cao', min: 1, max: 6, init: 4, unit: 'cm' },
                    },
                    visual: v => vis('box3dSVG', v.a, v.b, v.c),
                    caption: v => `Thể tích: ${v.a} × ${v.b} × ${v.c} = ${v.a * v.b * v.c} (cm³).`,
                })),
            ),
            know('Thể tích và lít',
                note('1 dm³ = 1 l. Bể nước tính thể tích bằng đề-xi-mét khối thì đổi ngay ra lít.'),
                text('Biết thể tích, chiều dài và chiều rộng thì chiều cao bằng thể tích chia cho tích của chiều dài và chiều rộng.'),
            ),
        ],
        forms: [
            form({
                id: 'tinh-v', title: 'Dạng 1: Tính thể tích', level: 1,
                cue: 'Đề cho các kích thước của hình hộp chữ nhật hoặc cạnh hình lập phương.',
                steps: ['Kiểm tra cùng đơn vị đo.', 'Nhân ba kích thước với nhau.', 'Viết đơn vị khối (cm³, dm³, m³).'],
                example: worked({
                    problem: 'Tính thể tích hình hộp chữ nhật có chiều dài 7 cm, chiều rộng 2 cm, chiều cao 5 cm.',
                    visual: vis('box3dSVG', 7, 2, 5),
                    steps: [step('Thể tích hình hộp chữ nhật là:', '7 × 2 × 5 = 70 (cm³)')],
                    answer: 'Đáp số: 70 cm³.',
                }),
            }),
            form({
                id: 'tim-cao', title: 'Dạng 2: Tìm chiều cao', level: 2,
                cue: 'Đề cho thể tích, chiều dài, chiều rộng và hỏi chiều cao.',
                steps: ['Tính diện tích đáy: dài × rộng.', 'Lấy thể tích chia cho diện tích đáy.'],
                example: worked({
                    problem: 'Hình hộp chữ nhật có thể tích 420 cm³, chiều dài 10 cm, chiều rộng 6 cm. Tính chiều cao.',
                    steps: [step('Chiều cao của hình hộp chữ nhật là:', '420 : (10 × 6) = 7 (cm)')],
                    answer: 'Đáp số: 7 cm.',
                }),
            }),
            form({
                id: 'be-nuoc', title: 'Dạng 3: Bể nước và lít', level: 3,
                cue: 'Bài toán về bể nước, thùng, hộp và hỏi chứa được bao nhiêu lít.',
                steps: ['Đổi các kích thước ra đề-xi-mét.', 'Tính thể tích bằng đề-xi-mét khối.', 'Đổi 1 dm³ = 1 l.'],
                example: worked({
                    problem: 'Một bể cá hình hộp chữ nhật dài 6 dm, rộng 13 dm, cao 7 dm. Bể chứa đầy nước thì được bao nhiêu lít nước?',
                    steps: [step('Thể tích bể là:', '6 × 13 × 7 = 546 (dm³)'), step('Vì 1 dm³ = 1 l nên bể chứa được 546 l nước.')],
                    answer: 'Đáp số: 546 l.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết thể tích hình hộp là 70 cm².', 'Thể tích là 70 cm³.', 'Thể tích đo bằng đơn vị khối (cm³, dm³, m³); cm² là đơn vị diện tích.'),
        ],
        remember: [
            'Hình hộp chữ nhật: V = dài × rộng × cao.',
            'Hình lập phương: V = cạnh × cạnh × cạnh.',
            '1 dm³ = 1 l.',
        ],
    }),
    'g5.nets': lesson('g5.nets', {
        v: 1,
        goal: 'nhận biết hình khai triển của hình lập phương.',
        hook: { md: 'Mở phẳng một hộp giấy hình lập phương ra, em được hình gồm mấy hình vuông?', answer: 'Được 6 hình vuông nối liền nhau, gọi là hình khai triển của hình lập phương.' },
        needs: ['g3.solids'],
        know: [
            know('Hình khai triển',
                picCap('Hình chữ thập: gấp lại được hình lập phương', 'netsRowSVG', [CROSS]),
                text('Hình khai triển của hình lập phương gồm **6 hình vuông** nối liền. Gấp lại được hình lập phương mà không có hai mặt chồng lên nhau.'),
            ),
            know('Không phải hình 6 ô nào cũng gấp được',
                picCap('Hai hình này không gấp được thành hình lập phương', 'netsRowSVG', [BAD_ROW, BAD_BLOCK]),
                text('Em tưởng tượng gấp từng mặt lên. Nếu có hai mặt chồng lên nhau thì hình đó không phải hình khai triển.'),
            ),
        ],
        forms: [
            form({
                id: 'nhan-biet', title: 'Dạng 1: Hình nào là hình khai triển?', level: 1,
                cue: 'Đề cho vài hình gồm 6 ô vuông và hỏi hình nào gấp được thành hình lập phương.',
                steps: ['Chọn một ô làm mặt đáy.', 'Tưởng tượng gấp các ô xung quanh dựng lên.', 'Hai mặt chồng nhau thì loại; đủ 6 mặt không chồng thì chọn.'],
                example: worked({
                    layout: 'calc', problem: 'Hình nào là hình khai triển của hình lập phương?',
                    visual: vis('netsRowSVG', [BAD_ROW, CROSS, BAD_BLOCK]),
                    steps: [step('Hình 1: hai ô ở hàng dưới gấp lên sẽ chồng vào cùng một mặt.'), step('Hình 3: sáu ô xếp thành hai hàng, gấp lại có mặt bị chồng.'), step('Hình 2: lấy ô giữa làm đáy, bốn ô xung quanh dựng lên, ô còn lại làm nắp.')],
                    answer: 'Hình 2 là hình khai triển của hình lập phương.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi nói: hình nào có 6 ô vuông cũng gấp được thành hình lập phương.', 'Phải kiểm tra khi gấp không có hai mặt chồng lên nhau.', 'Ví dụ 6 ô xếp thành 2 hàng, mỗi hàng 3 ô thì gấp lại sẽ có mặt bị chồng.'),
        ],
        remember: [
            'Hình khai triển của hình lập phương có 6 hình vuông.',
            'Gấp lại không có hai mặt chồng lên nhau.',
        ],
    }),
    'g5.para_area': lesson('g5.para_area', {
        v: 1,
        goal: 'tính được diện tích hình bình hành.',
        hook: { md: 'Cắt một hình tam giác ở bên trái hình bình hành rồi ghép sang bên phải, em được hình gì?', answer: 'Được một hình chữ nhật có chiều dài bằng đáy, chiều rộng bằng chiều cao của hình bình hành.' },
        needs: ['g4.para_rhombus_id'],
        know: [
            know('Diện tích hình bình hành',
                pic('parallelogramSVG', 6, 4),
                rule('Muốn tính diện tích hình bình hành, ta lấy độ dài đáy nhân với chiều cao (cùng đơn vị đo).', 'S = {a} × {h}'),
                note('Chiều cao là đoạn thẳng vuông góc với đáy, không phải cạnh bên nghiêng.'),
            ),
        ],
        forms: [
            form({
                id: 'tinh', title: 'Dạng 1: Tính diện tích hình bình hành', level: 2,
                cue: 'Đề cho độ dài đáy và chiều cao của hình bình hành.',
                steps: ['Kiểm tra cùng đơn vị đo.', 'Lấy đáy nhân với chiều cao.', 'Viết đơn vị diện tích.'],
                example: worked({
                    problem: 'Tính diện tích hình bình hành có độ dài đáy 20 cm, chiều cao 12 cm.',
                    steps: [step('Diện tích hình bình hành là:', '20 × 12 = 240 (cm²)')],
                    answer: 'Đáp số: 240 cm².',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi lấy đáy nhân với cạnh bên để tính diện tích hình bình hành.', 'Lấy đáy nhân với chiều cao (đoạn vuông góc với đáy).', 'Cạnh bên nằm nghiêng nên dài hơn chiều cao. Dùng cạnh bên sẽ ra diện tích lớn hơn thật.'),
        ],
        remember: [
            'S = đáy × chiều cao.',
            'Chiều cao vuông góc với đáy.',
        ],
    }),
} satisfies LessonBook;
