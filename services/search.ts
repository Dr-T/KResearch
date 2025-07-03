import { aiClient, PROVIDER } from './geminiClient';
import { researchModeModels } from './models';
import { Citation, ResearchMode } from '../types';

export const executeSingleSearch = async (searchQuery: string, mode: ResearchMode): Promise<{ text: string, citations: Citation[] }> => {
    let response;
    if (PROVIDER === 'openai') {
        response = await aiClient.chat.completions.create({
            model: researchModeModels[mode].searcher,
            messages: [
                { role: 'system', content: 'You are an AI search summarizer.' },
                { role: 'user', content: `Concisely summarize key information for the query: "${searchQuery}"` }
            ],
            temperature: 0.5
        });
        response = { text: response.choices[0].message.content };
    } else {
        response = await aiClient.models.generateContent({
            model: researchModeModels[mode].searcher,
            contents: `Concisely summarize key information for the query: "${searchQuery}"`,
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
