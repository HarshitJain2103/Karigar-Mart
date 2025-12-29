import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY1,
});

const AI_TIMEOUT_MS = 30000;

export const refineStory = async ({ title, content }) => {
    if (!title || !content) {
        return { title, content };
    }

    const safeTitle = title.replace(/"/g, '\\"');
    const safeContent = content.replace(/"/g, '\\"');


    console.log('[AI] Refining story (single call)');

    const prompt = `You are a professional language editor.

Your task:
- Detect the language of the input text automatically
- Improve grammar, clarity, and flow
- Fix tense, gender, and sentence structure where applicable
- Keep the SAME language as the input
- Do NOT translate the text
- Do NOT add new facts
- Do NOT add marketing or promotional language
- Keep tone authentic and human
- Preserve the original meaning
- Do not change the original length by more than 20%

Return ONLY valid JSON in this format:
{
  "title": "...",
  "content": "..."
}

Input:
{
  "title": "${safeTitle}",
  "content": "${safeContent}"
}`;

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
            () => reject(new Error('AI refinement timed out')),
            AI_TIMEOUT_MS
        );
    });

    try {
        const aiPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const result = await Promise.race([aiPromise, timeoutPromise]);

        const rawText = result.text?.trim();
        if (!rawText) throw new Error('Empty AI response');

        try {
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
                return {
                    title: parsed.title || title,
                    content: parsed.content || content,
                };
            }
        } catch (e) {
            console.warn('[AI] JSON parsing failed, falling back to plain text');
        }

        // Fallback: treat entire output as refined content
        return {
            title,
            content: rawText,
        };
    } catch (error) {
        console.error('[AI] Story refinement failed:', error.message);
        return { title, content };
    }
};