export interface AiChatMessage {
    role: 'user' | 'model';
    content: string;
}

const getSystemPrompt = (studentName: string) => `Bạn là "Bo Biết Tuốt", một trợ lý AI học tập thông minh, thân thiện và hiểu biết dành cho trẻ em học sinh tiểu học. 
Bạn được tích hợp trong ứng dụng MathGenius Kids.
Bạn đang nói chuyện với một bạn nhỏ tên là "${studentName}". Hãy gọi bạn ấy bằng tên "${studentName}" một cách tự nhiên và thân thiện trong suốt cuộc trò chuyện (ví dụ: "${studentName} ơi, ..." hoặc "Bạn ${studentName} giỏi lắm!"). Không cần gọi tên trong mọi câu, chỉ xen kẽ tự nhiên thôi nhé.

NGUYÊN TẮC GIAO TIẾP VÀ SÀNG LỌC NỘI DUNG TUYỆT ĐỐI TUÂN THỦ:
1. Bạn CHỈ cho phép trẻ trao đổi, hỏi đáp các vấn đề liên quan đến học tập (đặc biệt là Toán học khoa học), các kiến thức về khoa học, xã hội, lịch sử, văn hóa và học hỏi nói chung.
2. CẤM HOÀN TOÀN việc thảo luận đến các chủ đề người lớn, bạo lực, chính trị, nội dung độc hại, và các chủ đề ngoài học tập. Nếu người dùng hỏi về những chủ đề này, bạn phải kiên quyết từ chối một cách lịch sự, nhẹ nhàng nhưng tuyệt đối không giải thích thêm hay cung cấp bất kỳ thông tin nào liên quan, và hướng trẻ quay lại chủ đề học tập.
3. Cách xưng hô: Gọi mình là "Bo" hoặc "tớ" cho thân thiện. Gọi người dùng bằng "${studentName}" hoặc "bạn".
4. Giọng văn phải vui vẻ, dễ thương, đôi khi hài hước và luôn động viên. Nói như một người anh/chị lớn dạy em học bài chứ không phải thầy giáo cứng nhắc. Câu trả lời phải ngắn gọn, dễ hiểu, tuyệt đối không dùng từ ngữ phức tạp. Hướng dẫn từng bước một nếu là câu hỏi toán hoặc tư duy.
5. Luôn nói tiếng Việt có dấu chuẩn xác (trừ khi được yêu cầu hướng dẫn tiếng Anh).

Nhớ kỹ: Nhiệm vụ số 1 của bạn là một người bạn học tập an toàn và vui vẻ. Không bao giờ vượt qua giới hạn này.`;

/**
 * Gọi Gemini API trực tiếp bằng fetch
 */
export const generateAiResponse = async (
    prompt: string,
    history: { role: 'user' | 'model', content: string }[],
    apiKey: string,
    studentName: string = 'bạn'
): Promise<string> => {
    if (!apiKey) {
        throw new Error("Vui lòng cung cấp API Key để sử dụng AI (Cấu hình tại Hồ sơ cá nhân).");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Lấy 10 tin nhắn gần nhất để làm ngữ cảnh (tránh gửi quá dài)
    const recentHistory = history.slice(-10);

    const contents = recentHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    // Bổ sung tin nhắn hiện tại
    contents.push({
        role: 'user',
        parts: [{ text: prompt }]
    });

    const requestBody = {
        system_instruction: {
            parts: [{ text: getSystemPrompt(studentName) }]
        },
        contents: contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", response.status, errorText);
            throw new Error(`Đã có lỗi kết nối đến Bo Biết Tuốt (Mã lỗi: ${response.status}). Vui lòng kiểm tra lại API key hoặc kết nối mạng.`);
        }

        const data = await response.json();

        // Trích xuất phản hồi
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            console.error("Unexpected API response format:", data);
            throw new Error("Đang xảy ra lỗi xử lý câu trả lời từ Bo Biết Tuốt.");
        }
    } catch (error: any) {
        throw new Error(error.message || "Không thể kết nối với Bo. Vui lòng thử lại sau!");
    }
};

/**
 * Sinh đề thi tự động bằng AI, trả về mảng JSON câu hỏi.
 */
export const generateAiQuiz = async (
    grade: number,
    topics: { id: string, title: string, description: string }[],
    count: number,
    apiKey: string,
    isStoryMode: boolean = false
): Promise<any[]> => {
    if (!apiKey) {
        throw new Error("Vui lòng cung cấp API Key để sử dụng AI.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const topicsText = topics.map(t => `- ${t.title}: ${t.description}`).join('\n');

    const prompt = `Đóng vai: Bạn là giáo viên cực kỳ sáng tạo ra đề thi Toán cho học sinh Lớp ${grade}.
Yêu cầu sinh đề: Hãy tạo một đề thi gồm ĐÚNG ${count} câu hỏi thuộc các chủ đề sau:
${topicsText}
${isStoryMode ? `
[QUAN TRỌNG: CHẾ ĐỘ CỐT TRUYỆN ĐANG BẬT]
Hãy biến toàn bộ đề thi thành một chuyến phiêu lưu kỳ thú LIỀN MẠCH NGAY TRONG nội dung \`questionText\`. 
Thay vì hỏi khô khan "Tính 15 x 4", hãy viết kiểu: "Hiệp sĩ Bo đang tiến vào rừng ma thuật. Cửa ải đầu tiên yêu cầu giải mã phép tính: $15 \\times 4 = ?$ Hãy cứu hiệp sĩ nhé!". 
Sáng tạo ra các nhân vật dễ thương, bối cảnh phép thuật, kẹo ngọt, v.v.` : ''}

QUY TẮC ĐẦU RA BẮT BUỘC:
1. Bạn CHỈ ĐƯỢC PHÉP trả về MẢNG JSON THUẦN TÚY (Array of Objects). Không giải thích, không bọc \`\`\`json.
2. LƯU Ý QUAN TRỌNG VỀ JSON: Khi viết công thức KaTeX (như \\times, \\frac), BẠN BẮT BUỘC PHẢI "ESCAPE" (thoát) dấu gạch chéo bằng 2 dấu gạch chéo (ví dụ: \\\\times, \\\\frac) ĐỂ KHÔNG BỊ LỖI JSON.
3. Mỗi object trong mảng đại diện cho 1 câu hỏi, tuân thủ chặt chẽ cấu trúc JSON sau:
{
  "id": "chuỗi_random_id",
  "topicId": "sử_dụng_ĐÚNG_id_của_chủ_đề_câu_hỏi_này_thuộc_về_như_đã_liệt_kê",
  "type": "single", (hoặc "input")
  "questionText": "nội dung câu hỏi...",
  "options": ["đáp án 1", "đáp án 2", "đáp án 3", "đáp án 4"], (tuỳ chọn, BẮT BUỘC CÓ MẢNG 4 CHI TIẾT nếu type là single)
  "correctAnswer": "đáp án đúng NGHIÊM NGẶT khớp chính xác 1 trong 4 options bên trên",
  "explanation": "giải thích chi tiết cách giải...",
  "visualRequest": { "type": "draw_objects", "data": { "objectType": "apple", "count": 3 } }
}
(Ghi chú: thuộc tính visualRequest là tùy chọn, nhưng BẮT BUỘC trong các chủ đề yêu cầu hình ảnh trực quan)
4. KaTeX: Các phân số, số mũ, công thức phức tạp phải bọc trong cặp $$ (VD: $$\\frac{1}{2}$$).
5. HÌNH ẢNH TRỰC QUAN LÀ BẮT BUỘC (visualRequest): Rất quan trọng với trẻ em!
NẾU chủ đề là Đếm số, Cộng/Trừ (Lớp 1-2), Phân số (Lớp 4-5), Góc (Lớp 4), Chia kẹo quả... thì BẠN TUYỆT ĐỐI PHẢI ĐƯA VÀO thuộc tính \`visualRequest\`.
Hệ thống hỗ trợ 6 loại hình ảnh sau:
- Đếm/Đồ vật: { "type": "draw_objects", "data": { "objectType": "apple", "count": 3 } }
(Hỗ trợ: apple, star, circle, triangle, square, orange, candy, car, dog, cat, clock, pencil, book, bear, ball)
- Phân số (Lớp 4, 5): { "type": "draw_fraction", "data": { "numerator": 2, "denominator": 5 } }
- Đo/Biểu diễn Góc (Lớp 4): { "type": "draw_angle", "data": { "degrees": 90 } }
- Hình Học phẳng (Chu vi, Diện tích Lớp 4): { "type": "draw_geometry", "data": { "shape": "square", "side": 15, "label": "15cm" } }
HOẶC hình chữ nhật: { "type": "draw_geometry", "data": { "shape": "rectangle", "w": 10, "h": 20, "labelW": "10m", "labelH": "20m" } }
HOẶC hình ghép: { "type": "draw_geometry", "data": { "shape": "composite", "hA": 8, "wA": 4, "hB": 3, "wB": 5 } }
- Biểu đồ cột (Thống kê Lớp 4): { "type": "draw_chart", "data": { "items": [{ "label": "Toán", "value": 10 }, { "label": "Văn", "value": 8 }] } }
- Hình Tròn (Lớp 5): { "type": "draw_circle", "data": { "radius": 5 } }
Ví dụ: Câu hỏi "Diện tích hình chữ nhật dài 20m rộng 10m" -> Dùng "draw_geometry", tham số "rectangle".
Hệ thống sẽ render hình học siêu to dựa vào parameter này! ĐỪNG QUÊN nếu đề bài nói về đồ vật, phân số, góc, hình học hay biểu đồ!`;

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            temperature: 0.7,
            response_mime_type: "application/json", // Ép Gemini trả JSON
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Đã có lỗi kết nối đến API (Mã lỗi: ${response.status}).`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const textResponse = data.candidates[0].content.parts[0].text;
            // Xoá code block markdown nếu AI vẫn cố tình trả về
            const cleanedText = textResponse.replace(/```json|```/gi, '').trim();
            
            // Xử lý lỗi AI sinh ra JSON có escape string bị thiếu (vd: \times thay vì \\times)
            // Lọc tất cả dấu \ không được theo sau bởi các kí tự escape chuẩn của JSON (n, r, t, b, f, u, ", \, /)
            const safeJsonText = cleanedText.replace(/(?<!\\)\\(?![nrtbf"\\/u])/g, '\\\\');

            const jsonArray = JSON.parse(safeJsonText);
            
            if (!Array.isArray(jsonArray)) {
                throw new Error("AI không trả về định dạng mảng (Array).");
            }
            console.log("=== RAW AI JSON RESPONSE ===", jsonArray);
            return jsonArray;
        } else {
            throw new Error("Lỗi đọc dữ liệu từ AI.");
        }
    } catch (error: any) {
        console.error("Lỗi parse JSON từ AI:", error);
        throw new Error(error.message || "Không thể kết nối với AI để sinh đề lúc này.");
    }
};
