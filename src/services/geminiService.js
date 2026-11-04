const ai = require('../config/AI');

// Fallback models in case one hits rate limit (429) or high demand (503)
const CANDIDATE_MODELS = [
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3-flash-preview',
];

const extractIngredientsFromImage = async (file) => {
    const imagePart = {
        inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        },
    };

    const prompt = `
        Hãy đọc kỹ bức ảnh chứa bảng thành phần mỹ phẩm này. 
        Nhiệm vụ của bạn là trích xuất toàn bộ các chất có trong bảng thành phần thành một danh sách.
        Trả về kết quả duy nhất dưới định dạng JSON thuần túy theo cấu trúc sau:
        {
            "ingredients": ["Water", "Glycerin", "Niacinamide"]
        }
    `;

    let lastError = null;

    for (const model of CANDIDATE_MODELS) {
        try {
            console.log(`[geminiService] Calling model ${model}...`);
            const response = await ai.models.generateContent({
                model,
                contents: [imagePart, prompt],
                config: {
                    responseMimeType: 'application/json',
                },
            });

            const rawText = (response.text || '').trim();
            const cleanJsonString = rawText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/, '');

            try {
                return JSON.parse(cleanJsonString);
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError.message);
                console.log('Raw AI Text:', response.text);
                return {
                    ingredients: [],
                    rawText: response.text,
                    message: 'Failed to parse JSON from AI response.',
                };
            }
        } catch (error) {
            console.warn(
                `[geminiService] Model ${model} failed:`,
                error.message || error
            );
            lastError = error;
            // If rate-limited or unavailable, continue to next model
            if (
                error.status === 429 ||
                error.status === 503 ||
                error.message?.includes('quota') ||
                error.message?.includes('high demand')
            ) {
                continue;
            }
            // For other critical errors, rethrow or try next model
            continue;
        }
    }

    throw lastError || new Error('All Gemini models failed to process image');
};

module.exports = {
    extractIngredientsFromImage,
};
