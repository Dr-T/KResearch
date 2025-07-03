import { aiClient, PROVIDER } from './geminiClient';
import { researchModeModels } from './models';
import { Citation, ResearchMode } from '../types';

export const executeSingleSearch = async (searchQuery: string, mode: ResearchMode, customModels?: { searcher?: string }): Promise<{ text: string, citations: Citation[] }> => {
    let modelName = customModels?.searcher || researchModeModels[mode].searcher;
    let response;
    if (PROVIDER === 'openai') {
        response = await aiClient.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: 'You are an AI search summarizer.' },
                { role: 'user', content: `请始终使用与用户输入相同的语言进行回复。如果用户用中文提问，请用中文回复；如果用户用英文提问，请用英文回复。\nConcisely summarize key information for the query: "${searchQuery}"` }
            ],
            temperature: 0.5
        });
        response = { text: response.choices[0].message.content };
    } else {
        response = await aiClient.models.generateContent({
            model: modelName,
            contents: `请始终使用与用户输入相同的语言进行回复。如果用户用中文提问，请用中文回复；如果用户用英文提问，请用英文回复。\nConcisely summarize key information for the query: "${searchQuery}"`,
            config: { tools: [{ googleSearch: {} }] },
        });
    }

    // GoogleGenAI 专属引用处理
    let citations: Citation[] = [];
    if (PROVIDER !== 'openai') {
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        citations = groundingMetadata
            ? groundingMetadata.map((chunk: any) => ({
                  url: chunk.web.uri,
                  title: chunk.web.title || chunk.web.uri,
              }))
            : [];
    }
    const uniqueCitations = Array.from(new Map(citations.map(c => [c.url, c])).values());
    return { text: `Summary for "${searchQuery}": ${response.text}`, citations: uniqueCitations };
};
