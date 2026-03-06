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
