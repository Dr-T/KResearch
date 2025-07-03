import { aiClient, PROVIDER } from './geminiClient';
import { clarificationModels } from './models';
import { parseJsonFromMarkdown } from './utils';
import { ResearchMode, FileData, ClarificationTurn } from '../types';

export interface ClarificationResponse {
    type: 'question' | 'summary';
    content: string;
}

export const clarifyQuery = async (
    history: ClarificationTurn[],
    mode: ResearchMode,
    fileData: FileData | null
): Promise<ClarificationResponse> => {
    const systemPrompt = `**YOUR ONLY JOB IS TO PRODUCE A SINGLE, RAW JSON OBJECT.**
Do not write any other text. Your entire response must start with \`{\` and end with \`}\`. Do not use markdown fences like \`\`\`json.

Your role is to ask clarifying questions to refine a user's research request. You will use Google Search to inform your questions.

**CRITICAL RULES:**
1.  **ASK, DON'T ANSWER:** Your goal is to ask questions, not provide answers. Use search results to formulate better questions. (e.g., After searching "iPhone 17e", ask "Are you interested in its rumored specs, potential release date, or something else?").
2.  **VERIFY:** Always use Google Search. Your internal knowledge may be outdated. Do not argue with the user about facts you can verify.
3.  **ONE QUESTION AT A TIME:** Ask only one targeted question per turn.
4.  **FINISH:** After 2-4 questions, you MUST stop asking and provide a summary.

**JSON FORMATS (CHOOSE ONE):**
1.  **To ask a question:** \`{ "type": "question", "content": "Your single, focused question here." }\`
2.  **To provide the final summary:** \`{ "type": "summary", "content": "Your final summary paragraph of the refined research goal." }\`

**EXAMPLE DIALOGUE:**
User: "iPhone 17e"
Your AI Response (this is the entire response, nothing else):
{ "type": "question", "content": "I see from search results that the iPhone 17e is a rumored future product. Are you more interested in its technical specifications, potential market impact, or comparisons to the existing iPhone SE line?" }
`;
    
    const contents = history.map((turn, index) => {
        const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: turn.content }];
        if (turn.role === 'user' && index === 0 && fileData) {
            parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
        }
        return { role: turn.role, parts: parts };
    });

    let response;
    if (PROVIDER === 'openai') {
        response = await aiClient.chat.completions.create({
            model: clarificationModels[mode],
            messages: [
                { role: 'system', content: 'You are an AI clarification assistant.' },
                { role: 'user', content: systemPrompt + '\n' + history.map(h => h.content).join('\n') }
            ],
            temperature: 0.5
        });
        response = { text: response.choices[0].message.content };
    } else {
        response = await aiClient.models.generateContent({
            model: clarificationModels[mode],
            contents: contents,
            config: { 
                systemInstruction: systemPrompt, 
                temperature: 0.5,
                tools: [{ googleSearch: {} }] 
            }
        });
    }

    const parsedResponse = parseJsonFromMarkdown(response.text) as ClarificationResponse;

    if (!parsedResponse || !parsedResponse.type || !parsedResponse.content) {
        console.error("Failed to parse clarification response:", response.text);
        return { type: 'summary', content: 'AI clarification failed. Proceeding with original query.' };
    }
    
    return parsedResponse;
};
