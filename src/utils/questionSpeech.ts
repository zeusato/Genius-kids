// ============================================================================
//  questionToSpeech — chuyển nội dung câu hỏi (có thể chứa Markdown/KaTeX +
//  ký hiệu toán) thành VĂN NÓI tiếng Việt để TTS đọc tự nhiên cho trẻ.
//  Dùng cho chế độ Ôn Tập (đọc đề lớp 1 / mầm non). Tham khảo cơ chế đọc ở
//  docs/vietnamese-tts-mechanism.md (speak() trong src/utils/speech.ts).
// ============================================================================

/**
 * Chuẩn hoá một chuỗi đề bài thành câu đọc được:
 *  - Bỏ Markdown (đậm/nghiêng/code/bảng/tiêu đề) và KaTeX ($...$, \frac, \times...).
 *  - Phân số a/b → "a phần b"; "= ?" → "bằng mấy".
 *  - Ký hiệu phép tính giữa các số → từ tiếng Việt (cộng/trừ/nhân/chia/bằng/lớn hơn/bé hơn).
 *  - Giữ nguyên dấu "?" cuối câu hỏi lời văn (TTS tự lên giọng).
 */
export function questionToSpeech(raw: string): string {
    if (!raw) return '';
    let s = raw;

    // 1) KaTeX / LaTeX
    s = s.replace(/\$\$?([^$]*)\$\$?/g, ' $1 ');                       // bỏ ký hiệu $...$
    s = s.replace(/\\d?frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, ' $1 phần $2 '); // \frac{a}{b}
    s = s.replace(/\\times/g, ' nhân ').replace(/\\div/g, ' chia ').replace(/\\cdot/g, ' nhân ');
    s = s.replace(/\\[a-zA-Z]+/g, ' ');                               // bỏ lệnh latex còn lại
    s = s.replace(/[{}]/g, ' ');

    // 2) Markdown
    s = s.replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1'); // đậm/nghiêng
    s = s.replace(/`([^`]*)`/g, '$1');                               // code
    s = s.replace(/[|#]/g, ' ');                                     // bảng | , tiêu đề #

    // 2b) Ô trống (□, ___, _) → "ô trống"; nhóm nghìn "12 345" → "12345"; "0,5" → "0 phẩy 5"
    s = s.replace(/□|\[\s*\]|_+/g, ' ô trống ');
    s = s.replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1');
    s = s.replace(/(\d),(\d)/g, '$1 phẩy $2');

    // 2c) Ngày tháng "ngày 27/1" → "ngày 27 tháng 1"; hỗn số "2 3/4" → "2 và 3/4" (phân số đọc ở bước 3)
    s = s.replace(/([Nn]gày[  ]+)(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?(?![\d/])/g, (_m, n: string, d: string, mo: string, y?: string) => `${n}${d} tháng ${mo}${y ? ` năm ${y}` : ''}`);
    s = s.replace(/(?<![\d/,])(\d+)[  ]+(\d+)\s*\/\s*(\d+)(?![\d/])/g, (all, w: string, a: string, b: string) => (Number(a) < Number(b) ? `${w} và ${a}/${b}` : all));

    // 3) Phân số a/b → "a phần b" (làm trước khi xử lý dấu chia)
    s = s.replace(/(\d+)\s*\/\s*(\d+)/g, ' $1 phần $2 ');

    // 4) "= ?" → "bằng mấy"; "=" → "bằng"
    s = s.replace(/=\s*\?/g, ' bằng mấy ').replace(/=/g, ' bằng ');

    // 5) Phép tính (giữa hai số để tránh đụng chữ thường)
    s = s.replace(/(\d)\s*[×x]\s*(\d)/gi, '$1 nhân $2');
    s = s.replace(/×/g, ' nhân ');
    s = s.replace(/(\d)\s*[:÷]\s*(\d)/g, '$1 chia $2');
    s = s.replace(/÷/g, ' chia ');
    s = s.replace(/(\d)\s*\+\s*(\d)/g, '$1 cộng $2');
    s = s.replace(/(\d)\s*[-−]\s*(\d)/g, '$1 trừ $2');
    s = s.replace(/(\d)\s*>\s*(\d)/g, '$1 lớn hơn $2');
    s = s.replace(/(\d)\s*<\s*(\d)/g, '$1 bé hơn $2');
    // phép tính quanh "ô trống" (vd "ô trống + 2")
    s = s.replace(/\s\+\s/g, ' cộng ').replace(/\s[-−]\s/g, ' trừ ').replace(/\s×\s/g, ' nhân ');

    // 6) Dấu chấm lửng (so sánh "a ... b") → ngắt nhẹ
    s = s.replace(/\.{2,}|…/g, ' ');

    // 7) Gom khoảng trắng
    return s.replace(/\s+/g, ' ').trim();
}
