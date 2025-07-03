import { aiClient, PROVIDER } from './geminiClient';
import { researchModeModels } from './models';
import { parseJsonFromMarkdown } from './utils';
import { ResearchUpdate, AgentPersona, ResearchMode, FileData } from '../types';

interface PlannerTurn {
    thought: string;
    action: 'search' | 'continue_debate' | 'finish';
    queries?: string[] | null;
    finish_reason?: string | null;
}

export const runDynamicConversationalPlanner = async (
    query: string,
    researchHistory: ResearchUpdate[],
    onUpdate: (update: ResearchUpdate) => void,
    checkSignal: () => void,
    idCounter: { current: number },
    mode: ResearchMode,
    clarifiedContext: string,
    fileData: FileData | null,
    customModels?: { planner?: string }
): Promise<{ search_queries: string[], should_finish: boolean, finish_reason?: string }> => {
    const searchHistoryText = researchHistory.filter(h => h.type === 'search').map(h => (Array.isArray(h.content) ? h.content : [h.content]).join(', ')).join('; ');
    const readHistoryText = researchHistory.filter(h => h.type === 'read').map(h => h.content).join('\n---\n');
    const searchCycles = researchHistory.filter(h => h.type === 'search').length;

    let currentConversation: { persona: AgentPersona; thought: string }[] = [];
    let nextPersona: AgentPersona = 'Alpha';

    while (true) {
        checkSignal();
        const conversationText = currentConversation.map(t => `${t.persona}: ${t.thought}`).join('\n');
        const isFirstTurn = conversationText === '';

        const prompt = `
            You are Agent ${nextPersona} (${nextPersona === 'Alpha' ? 'Strategist' : 'Tactician'}).
            Engage in a critical debate to decide the next research step. The goal is to formulate novel and effective search queries through collaboration.

            请始终使用与用户输入相同的语言进行回复。如果用户用中文提问，请用中文回复；如果用户用英文提问，请用英文回复。

            **Overall Research Context:**
            *   User's Original Query: "${query}"
            *   Refined Research Goal (from user conversation): "${clarifiedContext}"
            *   Provided File: ${fileData ? fileData.name : 'None'}
            *   Total search cycles so far: ${searchCycles}.
            *   Previously Executed Searches: <searches>${searchHistoryText || 'None yet.'}</searches>
            *   Synthesized Learnings from Past Searches: <learnings>${readHistoryText || 'No learnings yet.'}</learnings>

            **Current Planning Conversation:**
            ${conversationText || 'You are Agent Alpha, starting the conversation. Propose the initial strategy.'}

            **Your Task & Rules:**
            1.  **Analyze All Context:** Critically analyze the refined goal, the learnings from past searches, the provided file content, and the ongoing debate.
            2.  **Avoid Redundancy:** Do NOT propose search queries that are identical or semantically very similar to queries already in <searches>. Your goal is to explore new avenues, deepen understanding, or challenge existing findings, not repeat work.
            3.  **Provide Your 'thought':** Articulate your reasoning, addressing the other agent if they have spoken.
            4.  **Choose ONE Action:**
                *   'continue_debate': To continue the discussion and refine the strategy. Let the other agent respond.
                *   'search': When you are confident in the next 1-4 queries. This ends the current planning session.
                *   'finish': ONLY if you are certain the research is comprehensive enough. You MUST provide a clear reason.
            5.  **Research Cycle Rules:**
                *   The 'finish' action is disabled until at least 7 search cycles are complete. (Current cycles: ${searchCycles}).
                *   You should aim to conclude the research between 7 and 17 cycles. Do not extend research unnecessarily.

            ${isFirstTurn ? `**Critical Rule for Agent Alpha (First Turn):** As this is the first turn of the debate, propose an initial strategy. Your action MUST be 'continue_debate'.` : ''}

            **RESPONSE FORMAT:**
            Your entire output MUST be a single JSON object. Example: { "thought": "...", "action": "search", "queries": ["query1", "query2"] }
        `;
        const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: prompt }];
        if (fileData) {
            parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
        }
        let modelName = customModels?.planner || researchModeModels[mode].planner;
        let response;
        if (PROVIDER === 'openai') {
            response = await aiClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: 'You are an AI research planner.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            });
            response = { text: response.choices[0].message.content };
        } else {
            response = await aiClient.models.generateContent({
                model: modelName,
                contents: { parts },
                config: { responseMimeType: "application/json", temperature: 0.7 }
            });
        }
        checkSignal();
        const parsedResponse = parseJsonFromMarkdown(response.text) as PlannerTurn;

        if (!parsedResponse || !parsedResponse.thought || !parsedResponse.action) {
            onUpdate({ id: idCounter.current++, type: 'thought', content: `Agent ${nextPersona} failed to respond. Finishing research.` });
            return { should_finish: true, search_queries: [], finish_reason: `Agent ${nextPersona} failed to generate a valid action.` };
        }
        onUpdate({ id: idCounter.current++, type: 'thought' as const, persona: nextPersona, content: parsedResponse.thought });
        currentConversation.push({ persona: nextPersona, thought: parsedResponse.thought });
        await new Promise(res => setTimeout(res, 400));
        checkSignal();

        if (parsedResponse.action === 'finish') {
            if (searchCycles < 7) {
                 const thought = `Rule violation: Cannot finish before 7 search cycles. Continuing debate. My previous thought was: ${parsedResponse.thought}`;
                 onUpdate({ id: idCounter.current++, type: 'thought' as const, persona: nextPersona, content: thought });
                 currentConversation.push({ persona: nextPersona, thought: thought });
                 nextPersona = (nextPersona === 'Alpha') ? 'Beta' : 'Alpha';
                 continue;
            }
            return { should_finish: true, search_queries: [], finish_reason: parsedResponse.finish_reason || `${nextPersona} decided to finish.` };
        }
        if (parsedResponse.action === 'search' && parsedResponse.queries && parsedResponse.queries.length > 0) {
            return { should_finish: false, search_queries: parsedResponse.queries };
        }
        nextPersona = (nextPersona === 'Alpha') ? 'Beta' : 'Alpha';
    }
};
