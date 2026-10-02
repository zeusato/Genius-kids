// Lớp 3 — Hình học (g3_geometry).
import { explore, form, know, lesson, mistake, note, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

export default {
    'g3.midpoint': lesson('g3.midpoint', {
        v: 1,
        goal: 'nhận biết điểm ở giữa, trung điểm của đoạn thẳng và tính được độ dài nửa đoạn.',
        hook: { md: 'Cô cắt sợi ruy băng dài 20 cm thành hai đoạn dài bằng nhau. Điểm cắt nằm ở đâu?', answer: 'Điểm cắt là trung điểm của sợi ruy băng; mỗi đoạn dài 20 : 2 = 10 (cm).' },
        know: [
            know('Điểm ở giữa và trung điểm',
                text('Ba điểm A, M, B thẳng hàng, M nằm giữa A và B: M là **điểm ở giữa** hai điểm A và B.'),
                pic('midpointSVG', 10, 5, 'AMB'),
                rule('M là trung điểm của đoạn thẳng AB khi M ở giữa A, B và đoạn AM dài bằng đoạn MB.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Dời điểm M trên đoạn thẳng AB dài 10 vạch',
                    controls: { at: { label: 'Độ dài AM (vạch)', min: 1, max: 9, init: 3 } },
                    visual: v => vis('midpointSVG', 10, v.at, 'AMB'),
                    caption: v => (v.at === 5 ? 'AM và MB đều dài 5 vạch: M là trung điểm của AB.'
                        : `AM dài ${v.at} vạch, MB dài ${10 - v.at} vạch, không bằng nhau: M ở giữa A và B nhưng không phải trung điểm.`),
                })),
            ),
        ],
        forms: [
            form({
                id: 'nhan-biet', title: 'Dạng 1: Có phải trung điểm không?', level: 1,
                cue: 'Đề cho hình đoạn thẳng có vạch chia và hỏi một điểm có phải trung điểm không.',
                steps: ['Kiểm tra điểm có nằm giữa hai đầu đoạn thẳng không.', 'Đếm hoặc đo độ dài hai phần.', 'Hai phần bằng nhau thì đó là trung điểm.'],
                example: worked({
                    layout: 'calc', problem: 'Điểm M có phải là trung điểm của đoạn thẳng AB không?',
                    visual: vis('midpointSVG', 12, 7, 'AMB'),
                    steps: [step('Đếm: AM dài 7 vạch, MB dài 5 vạch.'), step('7 vạch và 5 vạch không bằng nhau.')],
                    answer: 'M không phải là trung điểm của AB.',
                }),
            }),
            form({
                id: 'nua-doan', title: 'Dạng 2: Tính độ dài nửa đoạn thẳng', level: 2,
                cue: 'Đề cho độ dài đoạn thẳng và trung điểm, hỏi độ dài một nửa.',
                steps: ['Trung điểm chia đoạn thẳng thành hai phần bằng nhau.', 'Lấy độ dài đoạn thẳng chia cho 2.'],
                example: worked({
                    problem: 'Đoạn thẳng EG dài 20 cm, O là trung điểm của EG. Độ dài đoạn thẳng EO là bao nhiêu xăng-ti-mét?',
                    steps: [step('Độ dài đoạn thẳng EO là:', '20 : 2 = 10 (cm)')],
                    answer: 'Đáp số: 10 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('M nằm giữa A và B nên bạn Bi nói M là trung điểm của AB.', 'Chỉ khi AM dài bằng MB thì M mới là trung điểm.',
                'Điểm ở giữa chưa chắc chia đôi đoạn thẳng. Phải đếm hoặc đo để kiểm tra hai phần bằng nhau.'),
        ],
        remember: [
            'Trung điểm nằm giữa hai đầu đoạn thẳng và chia đoạn thẳng thành hai phần bằng nhau.',
            'Độ dài nửa đoạn thẳng bằng độ dài đoạn thẳng chia cho 2.',
        ],
    }),
    'g3.circle': lesson('g3.circle', {
        v: 1,
        goal: 'nhận biết tâm, bán kính, đường kính của hình tròn và tính được đường kính khi biết bán kính, bán kính khi biết đường kính.',
        hook: { md: 'Bánh xe đạp có các nan hoa từ trục đến vành. Mỗi nan hoa giống đoạn thẳng nào của hình tròn?', answer: 'Mỗi nan hoa giống một bán kính: nối tâm (trục xe) với một điểm trên vành bánh.' },
        know: [
            know('Tâm, bán kính, đường kính',
                pic('circlePartsSVG', 'both', 'OAB'),
                text('O là **tâm**. OC nối tâm với một điểm trên đường tròn: **bán kính**. AB đi qua tâm, nối hai điểm trên đường tròn: **đường kính**.'),
                rule('Trong một hình tròn, đường kính dài gấp 2 lần bán kính.', '{Đường kính} = {Bán kính} × 2'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi bán kính của hình tròn',
                    controls: { r: { label: 'Bán kính', min: 1, max: 9, init: 3, unit: 'cm' } },
                    visual: v => vis('circleSVG', v.r, { showRadius: true }),
                    caption: v => `Bán kính ${v.r} cm. Đường kính: ${v.r} × 2 = ${v.r * 2} (cm).`,
                })),
            ),
        ],
        forms: [
            form({
                id: 'goi-ten', title: 'Dạng 1: Gọi tên bán kính, đường kính', level: 1,
                cue: 'Đề cho hình tròn có tâm và các đoạn thẳng, hỏi đoạn nào là bán kính, đường kính.',
                steps: ['Đoạn nối tâm với một điểm trên đường tròn là bán kính.', 'Đoạn đi qua tâm, nối hai điểm trên đường tròn là đường kính.'],
                example: worked({
                    layout: 'calc', problem: 'Trong hình tròn tâm O, đoạn thẳng AB là gì?',
                    visual: vis('circlePartsSVG', 'diameter', 'OAB'),
                    steps: [step('AB nối hai điểm trên đường tròn.'), step('AB đi qua tâm O.')],
                    answer: 'AB là đường kính của hình tròn.',
                }),
            }),
            form({
                id: 'tinh', title: 'Dạng 2: Tính đường kính, bán kính', level: 2,
                cue: 'Đề cho bán kính hỏi đường kính, hoặc cho đường kính hỏi bán kính.',
                steps: ['Biết bán kính: lấy bán kính nhân với 2.', 'Biết đường kính: lấy đường kính chia cho 2.', 'Viết đáp số kèm đơn vị.'],
                example: worked({
                    problem: 'Hình tròn có bán kính 12 cm. Đường kính của hình tròn là bao nhiêu xăng-ti-mét?',
                    steps: [step('Đường kính của hình tròn là:', '12 × 2 = 24 (cm)')],
                    answer: 'Đáp số: 24 cm.',
                }),
            }),
        ],
        mistakes: [
            mistake('Đoạn CD nối hai điểm trên đường tròn nhưng không đi qua tâm. Bạn Bi gọi CD là đường kính.', 'CD không phải là đường kính.', 'Đường kính phải đi qua tâm của hình tròn.'),
            mistake('Đường kính 10 cm, bạn Bi tính bán kính: 10 × 2 = 20 (cm).', 'Bán kính: 10 : 2 = 5 (cm).', 'Bán kính ngắn hơn đường kính, bằng một nửa đường kính, nên phải chia cho 2.'),
        ],
        remember: [
            'Bán kính nối tâm với một điểm trên đường tròn.',
            'Đường kính đi qua tâm và dài gấp 2 lần bán kính.',
            'Bán kính bằng đường kính chia cho 2.',
        ],
    }),
    'g3.right_angle': lesson('g3.right_angle', {
        v: 1,
        goal: 'nhận biết góc vuông, góc không vuông và dùng ê-ke để kiểm tra.',
        hook: { md: 'Góc của trang vở và góc của bảng lớp có gì giống nhau?', answer: 'Đều là góc vuông: đặt góc vuông của ê-ke vào thì khít.' },
        know: [
            know('Góc và cách kiểm tra góc vuông',
                text('Góc có một **đỉnh** và hai **cạnh** đi ra từ đỉnh. Góc có đỉnh O, cạnh OA và OB gọi là góc đỉnh O.'),
                pic('angleShapeSVG', 90, { names: 'AOB' }),
                rule('Đặt góc vuông của ê-ke trùng đỉnh và một cạnh của góc. Cạnh còn lại khít với ê-ke thì là góc vuông; không khít thì là góc không vuông.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Mở rộng hoặc khép góc đỉnh O',
                    controls: { d: { label: 'Độ mở của góc', min: 30, max: 150, step: 10, init: 60 } },
                    visual: v => vis('angleShapeSVG', v.d, { names: 'AOB' }),
                    caption: v => (v.d === 90 ? 'Góc đỉnh O là góc vuông.' : `Góc đỉnh O là góc không vuông (${v.d < 90 ? 'hẹp hơn' : 'rộng hơn'} góc vuông).`),
                })),
            ),
        ],
        forms: [
            form({
                id: 'kiem-tra', title: 'Dạng 1: Góc vuông hay góc không vuông?', level: 1,
                cue: 'Đề cho hình một góc và hỏi có phải góc vuông không.',
                steps: ['Đặt đỉnh góc vuông của ê-ke trùng đỉnh của góc.', 'Đặt một cạnh ê-ke trùng một cạnh của góc.', 'Xem cạnh còn lại của góc có khít cạnh ê-ke không.'],
                example: worked({
                    layout: 'calc', problem: 'Góc đỉnh O có phải là góc vuông không?',
                    visual: vis('angleShapeSVG', 70, { names: 'AOB' }),
                    steps: [step('Đặt góc vuông của ê-ke vào đỉnh O, một cạnh ê-ke trùng cạnh OA.'), step('Cạnh OB không trùng cạnh còn lại của ê-ke.')],
                    answer: 'Góc đỉnh O là góc không vuông.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi nhìn bằng mắt, thấy góc "gần vuông" nên nói là góc vuông.', 'Phải đặt ê-ke để kiểm tra.', 'Mắt dễ nhìn nhầm những góc gần vuông. Ê-ke cho biết chính xác.'),
        ],
        remember: [
            'Góc có một đỉnh và hai cạnh.',
            'Dùng ê-ke để kiểm tra góc vuông.',
            'Góc vuông có ở góc vở, góc bàn, góc bảng.',
        ],
    }),
    'g3.polygon': lesson('g3.polygon', {
        v: 1,
        goal: 'nhận biết đỉnh, cạnh, góc của hình tam giác và hình tứ giác.',
        hook: { md: 'Một miếng bánh hình tam giác có mấy góc?', answer: 'Hình tam giác có 3 góc, 3 cạnh và 3 đỉnh.' },
        know: [
            know('Hình tam giác, hình tứ giác',
                pic('namedPolygonSVG', 3, 'ABC'),
                text('Hình tam giác ABC có 3 đỉnh A, B, C; 3 cạnh AB, BC, CA; 3 góc là góc đỉnh A, góc đỉnh B, góc đỉnh C.'),
                pic('namedPolygonSVG', 4, 'MNPQ'),
                text('Hình tứ giác MNPQ có 4 đỉnh, 4 cạnh và 4 góc.'),
            ),
            know('Cạnh của một góc',
                table(['Hình', 'Số đỉnh', 'Số cạnh', 'Số góc'], [['Tam giác', '3', '3', '3'], ['Tứ giác', '4', '4', '4']]),
                rule('Góc đỉnh A được tạo bởi hai cạnh cùng đi ra từ đỉnh A.'),
            ),
        ],
        forms: [
            form({
                id: 'dem', title: 'Dạng 1: Đếm đỉnh, cạnh, góc', level: 1,
                cue: 'Đề cho hình tam giác hoặc tứ giác và hỏi có mấy đỉnh, cạnh, góc.',
                steps: ['Đỉnh là các điểm ở góc hình.', 'Cạnh là các đoạn thẳng nối hai đỉnh liền nhau.', 'Đoạn thẳng nối hai đỉnh không liền nhau (như AC trong hình tứ giác ABCD) không phải là cạnh.', 'Mỗi đỉnh có một góc.'],
                example: worked({
                    layout: 'calc', problem: 'Hình tam giác HIK có mấy đỉnh? Kể tên các đỉnh.',
                    visual: vis('namedPolygonSVG', 3, 'HIK'),
                    steps: [step('Các điểm ở góc hình là H, I, K.')],
                    answer: 'Hình tam giác HIK có 3 đỉnh: H, I, K.',
                }),
            }),
            form({
                id: 'goc-canh', title: 'Dạng 2: Góc tạo bởi hai cạnh nào?', level: 2,
                cue: 'Đề hỏi góc ở một đỉnh được tạo bởi hai cạnh nào.',
                steps: ['Tìm các cạnh có chứa tên đỉnh đó.', 'Ví dụ đỉnh A của tam giác ABC: hai cạnh là AB và AC.', 'Hai cạnh đó là hai cạnh của góc.'],
                example: worked({
                    layout: 'calc', problem: 'Góc đỉnh A của hình tam giác ABC được tạo bởi hai cạnh nào?',
                    visual: vis('namedPolygonSVG', 3, 'ABC'),
                    steps: [step('Các cạnh có chứa điểm A là AB và AC.'), step('Cạnh BC không đi qua A nên không phải cạnh của góc đỉnh A.')],
                    answer: 'Góc đỉnh A được tạo bởi hai cạnh AB và AC.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi nói góc đỉnh A tạo bởi hai cạnh AB và BC.', 'Góc đỉnh A tạo bởi AB và AC.', 'Hai cạnh của góc đều phải đi ra từ đỉnh A. Cạnh BC không chứa điểm A.'),
        ],
        remember: [
            'Tam giác có 3 đỉnh, 3 cạnh, 3 góc.',
            'Tứ giác có 4 đỉnh, 4 cạnh, 4 góc.',
            'Hai cạnh của góc cùng đi ra từ đỉnh của góc.',
        ],
    }),
    'g3.rect_square': lesson('g3.rect_square', {
        v: 1,
        goal: 'nêu được đặc điểm về góc và cạnh của hình chữ nhật, hình vuông.',
        hook: { md: 'Tờ giấy vở và viên gạch hoa hình vuông khác nhau ở điểm nào?', answer: 'Cả hai đều có 4 góc vuông. Tờ giấy là hình chữ nhật: hai cạnh dài bằng nhau, hai cạnh ngắn bằng nhau. Viên gạch là hình vuông: 4 cạnh bằng nhau.' },
        needs: ['g3.right_angle'],
        know: [
            know('Hình chữ nhật',
                pic('rectSVG', 6, 4),
                text('Hình chữ nhật có **4 góc vuông**, có hai cạnh dài bằng nhau (chiều dài) và hai cạnh ngắn bằng nhau (chiều rộng).'),
            ),
            know('Hình vuông',
                pic('squareSVG', 5),
                text('Hình vuông có **4 góc vuông** và **4 cạnh bằng nhau**.'),
                note('Hình vuông cũng có 4 góc vuông như hình chữ nhật, nhưng 4 cạnh của nó dài bằng nhau.'),
            ),
        ],
        forms: [
            form({
                id: 'dung-sai', title: 'Dạng 1: Đúng hay sai về đặc điểm', level: 1,
                cue: 'Đề cho một câu nói về góc, cạnh của hình và hỏi đúng hay sai.',
                steps: ['Nhớ đặc điểm: hình chữ nhật và hình vuông đều có 4 góc vuông.', 'Hình chữ nhật: hai cạnh dài bằng nhau, hai cạnh ngắn bằng nhau.', 'Hình vuông: 4 cạnh bằng nhau.'],
                example: worked({
                    layout: 'calc', problem: 'Đúng hay sai: Hình chữ nhật có 4 cạnh dài bằng nhau.',
                    steps: [step('Hình chữ nhật có hai cạnh dài và hai cạnh ngắn.'), step('Chỉ hình vuông mới có 4 cạnh bằng nhau.')],
                    answer: 'Câu đó sai.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi nói: hình nào có 4 cạnh là hình chữ nhật.', 'Hình chữ nhật phải có 4 góc vuông.', 'Hình tứ giác nào cũng có 4 cạnh. Chỉ khi có đủ 4 góc vuông mới là hình chữ nhật.'),
        ],
        remember: [
            'Hình chữ nhật và hình vuông đều có 4 góc vuông.',
            'Hình chữ nhật: hai cạnh dài bằng nhau, hai cạnh ngắn bằng nhau.',
            'Hình vuông: 4 cạnh bằng nhau.',
        ],
    }),
    'g3.solids': lesson('g3.solids', {
        v: 1,
        goal: 'nhận biết khối lập phương, khối hộp chữ nhật và đếm được số mặt, đỉnh, cạnh.',
        hook: { md: 'Con xúc xắc và hộp sữa có dạng khối gì?', answer: 'Con xúc xắc là khối lập phương, hộp sữa là khối hộp chữ nhật.' },
        know: [
            know('Hai khối quen thuộc',
                pic('solidSVG', 'cube'),
                text('**Khối lập phương** có 6 mặt đều là hình vuông.'),
                pic('solidSVG', 'box', 'orange'),
                text('**Khối hộp chữ nhật** có 6 mặt là hình chữ nhật.'),
            ),
            know('Mặt, đỉnh, cạnh',
                table(['Khối', 'Số mặt', 'Số đỉnh', 'Số cạnh'], [['Khối lập phương', '6', '8', '12'], ['Khối hộp chữ nhật', '6', '8', '12']]),
                note('Khi đếm, nhớ đếm cả những mặt, đỉnh, cạnh bị khuất phía sau.'),
            ),
        ],
        forms: [
            form({
                id: 'nhan-dang', title: 'Dạng 1: Nhận dạng khối', level: 1,
                cue: 'Đề cho hình một khối và hỏi đó là khối gì.',
                steps: ['Quan sát các mặt của khối.', 'Mọi mặt là hình vuông: khối lập phương.', 'Các mặt là hình chữ nhật: khối hộp chữ nhật.'],
                example: worked({
                    layout: 'calc', problem: 'Đây là khối gì?',
                    visual: vis('solidSVG', 'box', 'orange'),
                    steps: [step('Các mặt của khối là hình chữ nhật, không phải mặt nào cũng là hình vuông.')],
                    answer: 'Đây là khối hộp chữ nhật.',
                }),
            }),
            form({
                id: 'dem', title: 'Dạng 2: Đếm mặt, đỉnh, cạnh', level: 2,
                cue: 'Đề hỏi khối có bao nhiêu mặt, đỉnh hoặc cạnh.',
                steps: ['Đếm phần nhìn thấy trước.', 'Tưởng tượng phía sau để đếm phần bị khuất.', 'Kiểm tra lại: 6 mặt, 8 đỉnh, 12 cạnh.'],
                example: worked({
                    layout: 'calc', problem: 'Khối hộp chữ nhật có bao nhiêu cạnh?',
                    steps: [step('Mặt trên có 4 cạnh, mặt dưới có 4 cạnh.'), step('Thêm 4 cạnh đứng nối mặt trên với mặt dưới:', '4 + 4 + 4 = 12')],
                    answer: 'Khối hộp chữ nhật có 12 cạnh.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi đếm khối lập phương có 3 mặt.', 'Khối lập phương có 6 mặt.', 'Bi chỉ đếm 3 mặt nhìn thấy. Còn 3 mặt bị khuất ở phía sau, bên trái và bên dưới.'),
        ],
        remember: [
            'Khối lập phương: 6 mặt là hình vuông.',
            'Khối hộp chữ nhật: 6 mặt là hình chữ nhật.',
            'Cả hai khối đều có 6 mặt, 8 đỉnh, 12 cạnh.',
        ],
    }),
} satisfies LessonBook;
