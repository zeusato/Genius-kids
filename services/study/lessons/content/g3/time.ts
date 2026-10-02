// Lớp 3 — Thời gian (g3_time).
import { explore, form, know, lesson, mistake, note, pic, rule, step, table, text, vis, widget, worked } from '../../build';
import type { LessonBook } from '../../types';

const endOf = (h: number, m: number, d: number) => {
    const t = m + d;
    return t >= 60 ? { h: h + 1, m: t - 60 } : { h, m: t };
};
const say = (h: number, m: number) => (m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`);

export default {
    'g3.clock_minute': lesson('g3.clock_minute', {
        v: 1,
        goal: 'đọc được giờ trên đồng hồ chính xác đến từng phút, kể cả cách đọc "giờ kém".',
        hook: { md: 'Đồng hồ chỉ 8 giờ 55 phút. Còn bao nhiêu phút nữa là 9 giờ?', answer: 'Còn 60 − 55 = 5 (phút). Vì vậy 8 giờ 55 phút còn gọi là 9 giờ kém 5 phút.' },
        needs: ['g2.clock'],
        know: [
            know('Kim giờ, kim phút',
                text('Kim ngắn chỉ **giờ**, kim dài chỉ **phút**. Kim dài đi từ một số sang số kế tiếp là 5 phút; mỗi vạch nhỏ là 1 phút.'),
                pic('clockSVG', 10, 20),
                text('Kim ngắn đã qua số 10, kim dài chỉ số 4: 4 × 5 = 20 phút. Đồng hồ chỉ 10 giờ 20 phút.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Đổi giờ và phút',
                    controls: {
                        h: { label: 'Giờ', min: 1, max: 12, init: 8 },
                        m: { label: 'Phút', min: 0, max: 59, init: 55 },
                    },
                    visual: v => vis('clockSVG', v.h, v.m),
                    caption: v => (v.m === 0 ? `Đồng hồ chỉ ${v.h} giờ đúng.`
                        : v.m > 30 ? `Đồng hồ chỉ ${v.h} giờ ${v.m} phút, còn gọi là ${v.h % 12 + 1} giờ kém ${60 - v.m} phút.`
                            : `Đồng hồ chỉ ${v.h} giờ ${v.m} phút.`),
                })),
                note('Khi kim dài đã qua số 6 (quá 30 phút), người ta hay đọc theo cách "giờ kém".'),
            ),
        ],
        forms: [
            form({
                id: 'boi-5', title: 'Dạng 1: Đọc giờ khi kim phút chỉ đúng số', level: 1,
                cue: 'Kim dài chỉ đúng vào một số trên mặt đồng hồ.',
                steps: ['Đọc giờ theo số kim ngắn vừa đi qua.', 'Lấy số kim dài chỉ nhân với 5 để được số phút.'],
                example: worked({
                    layout: 'calc', problem: 'Đồng hồ chỉ mấy giờ?',
                    visual: vis('clockSVG', 12, 20),
                    steps: [step('Kim ngắn chỉ quá số 12 một chút: 12 giờ.'), step('Kim dài chỉ số 4:', '4 × 5 = 20 (phút)')],
                    answer: 'Đồng hồ chỉ 12 giờ 20 phút.',
                }),
            }),
            form({
                id: 'phut-le', title: 'Dạng 2: Đọc giờ có phút lẻ', level: 2,
                cue: 'Kim dài chỉ vào giữa hai số, ở một vạch nhỏ.',
                steps: ['Đọc giờ theo kim ngắn: kim chưa tới số nào thì chưa phải giờ đó.', 'Đếm phút đến số gần nhất kim dài đã qua, rồi đếm thêm từng vạch nhỏ.'],
                example: worked({
                    layout: 'calc', problem: 'Đồng hồ chỉ mấy giờ?',
                    visual: vis('clockSVG', 10, 57),
                    steps: [step('Kim ngắn ở giữa số 10 và số 11, chưa tới số 11: 10 giờ.'), step('Kim dài đã qua số 11 (55 phút) thêm 2 vạch nhỏ:', '55 + 2 = 57 (phút)')],
                    answer: 'Đồng hồ chỉ 10 giờ 57 phút.',
                }),
            }),
            form({
                id: 'kem', title: 'Dạng 3: Đọc theo cách "giờ kém"', level: 2,
                cue: 'Đề hỏi một giờ quá 30 phút còn gọi là mấy giờ kém mấy phút.',
                steps: ['Tìm giờ tiếp theo.', 'Tính số phút còn thiếu để đến giờ đó: 60 trừ số phút.', 'Đọc: (giờ tiếp theo) giờ kém (số phút còn thiếu) phút.'],
                example: worked({
                    layout: 'calc', problem: '1 giờ 55 phút còn gọi là mấy giờ kém mấy phút?',
                    steps: [step('Giờ tiếp theo là 2 giờ.'), step('Số phút còn thiếu để đến 2 giờ:', '60 − 55 = 5 (phút)')],
                    answer: '1 giờ 55 phút còn gọi là 2 giờ kém 5 phút.',
                }),
            }),
        ],
        mistakes: [
            mistake('Kim ngắn gần tới số 11, kim dài chỉ 57 phút. Bạn Bi đọc là 11 giờ 57 phút.', 'Đồng hồ chỉ 10 giờ 57 phút.',
                'Kim ngắn chưa tới số 11 thì vẫn là 10 giờ. Khi kim dài chỉ đúng số 12, kim ngắn mới tới số 11.'),
        ],
        remember: [
            'Kim ngắn chỉ giờ, kim dài chỉ phút.',
            'Mỗi số trên mặt đồng hồ cách nhau 5 phút, mỗi vạch nhỏ là 1 phút.',
            'Quá 30 phút có thể đọc "giờ kém": số phút kém bằng 60 trừ số phút.',
        ],
    }),
    'g3.month_year': lesson('g3.month_year', {
        v: 1,
        goal: 'biết một năm có 12 tháng, số ngày của từng tháng, và xem lịch để tìm thứ của một ngày.',
        hook: { md: 'Năm nay ngày 30 tháng 6 là Chủ nhật. Ngày 3 tháng 7 là thứ mấy?', answer: 'Tháng 6 có 30 ngày nên sau ngày 30 tháng 6 là ngày 1 tháng 7. Đếm tiếp 3 ngày từ Chủ nhật: thứ Hai, thứ Ba, thứ Tư. Ngày 3 tháng 7 là thứ Tư.' },
        needs: ['g2.calendar_month'],
        know: [
            know('Số ngày trong các tháng',
                text('Một năm có **12 tháng**: từ tháng Một đến tháng Mười Hai.'),
                table(['Tháng', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], [['Số ngày', '31', '28 hoặc 29', '31', '30', '31', '30', '31', '31', '30', '31', '30', '31']]),
                note('Mẹo nắm tay: đếm các tháng trên đốt xương nhô lên và chỗ lõm giữa hai ngón tay. Tháng rơi vào đốt nhô lên có 31 ngày.'),
            ),
            know('Xem lịch tháng',
                pic('calendarMonthSVG', 6, 6, 30, 30),
                text('Một tuần có 7 ngày. Hai ngày cách nhau 7 ngày thì cùng thứ. Trên lịch, các ngày cùng thứ nằm trong cùng một cột.'),
            ),
        ],
        forms: [
            form({
                id: 'so-ngay', title: 'Dạng 1: Tháng có bao nhiêu ngày?', level: 1,
                cue: 'Đề hỏi số ngày của một tháng, hoặc số tháng trong năm.',
                steps: ['Dùng mẹo nắm tay hoặc nhớ bảng số ngày.', 'Tháng 4, 6, 9, 11 có 30 ngày; tháng 2 có 28 hoặc 29 ngày; các tháng còn lại có 31 ngày.'],
                example: worked({
                    layout: 'calc', problem: 'Tháng 8 có bao nhiêu ngày?',
                    steps: [step('Tháng 8 không thuộc nhóm tháng 4, 6, 9, 11 và không phải tháng 2.')],
                    answer: 'Tháng 8 có 31 ngày.',
                }),
            }),
            form({
                id: 'tim-thu', title: 'Dạng 2: Tìm thứ của một ngày', level: 2,
                cue: 'Đề cho thứ của một ngày và hỏi thứ của một ngày khác.',
                steps: ['Tính số ngày cách nhau (nhớ số ngày của tháng nếu sang tháng mới).', 'Đếm tiếp từng thứ trong tuần.', 'Cách nhau 7 ngày thì cùng thứ.'],
                example: worked({
                    layout: 'calc', problem: 'Ngày 25 tháng 6 là thứ Hai. Hỏi ngày 29 tháng 6 là thứ mấy?',
                    steps: [step('Từ ngày 25 đến ngày 29 cách nhau:', '29 − 25 = 4 (ngày)'), step('Đếm tiếp 4 ngày từ thứ Hai: thứ Ba, thứ Tư, thứ Năm, thứ Sáu.')],
                    answer: 'Ngày 29 tháng 6 là thứ Sáu.',
                }),
            }),
        ],
        mistakes: [
            mistake('Ngày 30 tháng 6 là Chủ nhật. Bạn Bi nói ngày 31 tháng 6 là thứ Hai.', 'Tháng 6 chỉ có 30 ngày; ngày tiếp theo là ngày 1 tháng 7.',
                'Tháng 4, 6, 9, 11 chỉ có 30 ngày. Đếm qua cuối tháng phải nhớ số ngày của tháng đó.'),
        ],
        remember: [
            'Một năm có 12 tháng; một tuần có 7 ngày.',
            'Tháng 4, 6, 9, 11 có 30 ngày; tháng 2 có 28 hoặc 29 ngày; các tháng khác có 31 ngày.',
            'Hai ngày cách nhau 7 ngày thì cùng thứ.',
        ],
    }),
    'g3.duration': lesson('g3.duration', {
        v: 1,
        goal: 'tính được một việc kéo dài bao lâu và lúc nào thì kết thúc.',
        hook: { md: 'Em bắt đầu làm bài lúc 9 giờ 45 phút và làm trong 20 phút. Em làm xong lúc mấy giờ?', answer: '45 + 20 = 65 (phút), tức là 1 giờ 5 phút. Em làm xong lúc 10 giờ 5 phút.' },
        needs: ['g3.clock_minute'],
        know: [
            know('Khoảng thời gian',
                rule('1 giờ = 60 phút.'),
                text('Muốn biết một việc kéo dài bao lâu, em đếm từ lúc bắt đầu đến lúc kết thúc. Kim dài quay đúng một vòng là 1 giờ.'),
            ),
            know('Kéo để quan sát',
                widget(explore({
                    title: 'Bắt đầu lúc nào, làm trong bao lâu?',
                    controls: {
                        h: { label: 'Bắt đầu: giờ', min: 6, max: 11, init: 9 },
                        m: { label: 'Bắt đầu: phút', min: 0, max: 55, step: 5, init: 45 },
                        d: { label: 'Làm trong (phút)', min: 5, max: 55, step: 5, init: 20 },
                    },
                    visual: v => { const e = endOf(v.h, v.m, v.d); return vis('clockSVG', e.h, e.m); },
                    caption: v => {
                        const e = endOf(v.h, v.m, v.d), t = v.m + v.d;
                        return `Bắt đầu ${say(v.h, v.m)}, thêm ${v.d} phút: ${v.m} + ${v.d} = ${t} (phút)${t >= 60 ? `, tức là 1 giờ${t > 60 ? ` ${t - 60} phút` : ''}` : ''}. Kết thúc lúc ${say(e.h, e.m)}.`;
                    },
                })),
            ),
        ],
        forms: [
            form({
                id: 'keo-dai', title: 'Dạng 1: Việc đó kéo dài bao lâu?', level: 2,
                cue: 'Đề cho giờ bắt đầu và giờ kết thúc, hỏi kéo dài bao lâu.',
                steps: ['So sánh số giờ và số phút của hai mốc.', 'Kim dài quay đủ một vòng là 1 giờ; còn lại đếm số phút.'],
                example: worked({
                    layout: 'calc', problem: 'Bộ phim bắt đầu lúc 12 giờ 15 phút và kết thúc lúc 13 giờ 15 phút. Bộ phim dài bao lâu?',
                    steps: [step('Từ 12 giờ 15 phút đến 13 giờ 15 phút, kim dài quay đúng một vòng.'), step('Một vòng của kim dài là 60 phút, tức là 1 giờ.')],
                    answer: 'Bộ phim dài 1 giờ.',
                }),
            }),
            form({
                id: 'ket-thuc', title: 'Dạng 2: Lúc nào thì kết thúc?', level: 3,
                cue: 'Đề cho giờ bắt đầu và thời gian làm, hỏi lúc kết thúc.',
                steps: ['Cộng số phút với nhau.', 'Được từ 60 phút trở lên thì đổi 60 phút thành 1 giờ.', 'Viết giờ kết thúc.'],
                example: worked({
                    layout: 'calc', problem: 'Em bắt đầu làm bài lúc 9 giờ 45 phút. Em làm bài hết 20 phút. Hỏi em làm xong lúc mấy giờ?',
                    steps: [step('Cộng số phút:', '45 + 20 = 65 (phút)'), step('65 phút là 1 giờ 5 phút, nên 9 giờ 45 phút thêm 20 phút là 10 giờ 5 phút.')],
                    answer: 'Em làm xong lúc 10 giờ 5 phút.',
                }),
            }),
        ],
        mistakes: [
            mistake('Bạn Bi viết: 9 giờ 45 phút thêm 20 phút là 9 giờ 65 phút.', 'Là 10 giờ 5 phút.', 'Số phút không được từ 60 trở lên. Đủ 60 phút phải đổi thành 1 giờ.'),
        ],
        remember: [
            '1 giờ = 60 phút.',
            'Cộng phút được từ 60 trở lên thì đổi 60 phút thành 1 giờ.',
            'Kim dài quay một vòng là 1 giờ.',
        ],
    }),
} satisfies LessonBook;
