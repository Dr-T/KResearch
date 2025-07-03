import { aiClient, PROVIDER } from './geminiClient';
import { researchModeModels } from './models';
import { ResearchUpdate, Citation, FinalResearchData, ResearchMode, FileData } from '../types';

export const synthesizeReport = async (
    query: string,
    history: ResearchUpdate[],
    citations: Citation[],
    mode: ResearchMode,
    fileData: FileData | null,
    customModels?: { synthesizer?: string }
): Promise<Omit<FinalResearchData, 'researchTimeMs'>> => {
    const learnings = history.filter(h => h.type === 'read').map(h => h.content).join('\n\n---\n\n');
    const historyText = history.map(h => `${h.persona ? h.persona + ' ' : ''}${h.type}: ${Array.isArray(h.content) ? h.content.join(' | ') : h.content}`).join('\n');

    const initialReportPrompt = `You are an elite Senior Research Analyst and Strategist, tasked with producing a formal, in-depth, and comprehensive research report for a C-suite executive audience. Your analysis must be sharp, insightful, and decision-ready.

**Your Mission:** Transform the provided raw research materials—including synthesized learnings, the full research history, and any attached files—into a polished, substantial, and impeccably structured final report. The expected length is significant, reflecting the depth of the research performed.

**Core Requirement from User:** <REQUIREMENT>${query}</REQUIREMENT>
**Attached File Context:** ${fileData ? `A file named '${fileData.name}' has been provided and its content was central to the research process.` : "No file was provided."}
**Synthesized Research Learnings (Primary Source for the Report):** <LEARNINGS>${learnings || "No specific content was read during research. Base the report primarily on the research history and any attached file."}</LEARNINGS>
**Full Research History (For Context and Nuance Only):** <HISTORY>${historyText}</HISTORY>

**--- MANDATORY REPORT STRUCTURE & INSTRUCTIONS ---**

You must generate a report that strictly adheres to the following structure and guidelines. Each section must be clearly delineated with the specified markdown headings.

# [Create a Formal and Descriptive Title for the Report]

## 1. Executive Summary
*   Start with a high-level overview.
*   Concisely state the original research objective.
*   Summarize the most critical findings and conclusions drawn from the entire research process.
*   End with a brief statement on the strategic implications.
*   This section must be a dense, polished summary of the entire document.

## 2. Introduction and Methodology
*   **Introduction:** Restate the refined research problem from the \`<REQUIREMENT>\`. Explain the report's purpose and what it aims to achieve.
*   **Scope:** Clearly define the boundaries of the research. What was included and what was intentionally excluded?
*   **Methodology:** Describe the research process. Mention the use of a multi-agent AI system, iterative search cycles using Google Search, and synthesis of information from multiple sources. Explain that the research was dynamic and adaptive based on emerging findings.

## 3. Thematic Analysis of Findings
*   This is the core of the report. It must be detailed and extensive.
*   Synthesize information from the \`<LEARNINGS>\` block AND the attached file content into a thorough, coherent analysis.
*   Organize findings into distinct thematic sections (e.g., "Market Trends," "Technological Advancements," "Competitive Landscape"). Use \`###\` for sub-headings for each theme.
*   For each theme, provide in-depth analysis, supported by the data gathered. Do not just list facts; interpret them.
*   Where applicable, discuss contrasting viewpoints or conflicting data found during the research.

## 4. Strategic Implications and Recommendations
*   Based *exclusively* on the findings in the previous section, deduce the strategic implications for the target audience.
*   If relevant, perform a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis.
*   Provide a set of clear, actionable recommendations. Each recommendation should be justified by the research findings.

## 5. Future Outlook and Areas for Further Research
*   Discuss the likely future trajectory of the topic based on your analysis.
*   Identify any unanswered questions that emerged during the research.
*   Suggest specific areas where further, more targeted research could provide additional value.

## 6. Conclusion
*   Provide a strong, concise final summary of the report.
*   Reiterate the most important takeaways and their significance.
*   End with a powerful concluding thought.

**--- STYLE AND FORMATTING ---**
*   **Tone:** Formal, objective, authoritative, and analytical.
*   **Data Visualization:** Where appropriate, use Mermaid.js charts (e.g., flowcharts, mind maps, Gantt charts) to visually represent complex relationships, processes, or timelines. Embed them in the relevant sections.
*   **Formatting:** Use Markdown extensively for clarity (headings, lists, bold text).
*   **Exclusivity:** The report's content must be based **exclusively** on the information provided in the prompt context. Do NOT invent information or use outside knowledge. Do NOT include inline citations.

**Final Output:** Respond ONLY with the raw markdown content of the final report, starting with the H1 Title.
`;

    const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: initialReportPrompt }];
    if (fileData) {
        parts.push({ inlineData: { mimeType: fileData.mimeType, data: fileData.data } });
    }
    let modelName = customModels?.synthesizer || researchModeModels[mode].synthesizer;
    let reportResponse;
    if (PROVIDER === 'openai') {
        reportResponse = await aiClient.chat.completions.create({
            model: modelName,
            messages: [
                { role: 'system', content: 'You are an elite Senior Research Analyst and Strategist.' },
                { role: 'user', content: initialReportPrompt }
            ],
            temperature: 0.5
        });
        reportResponse = { text: reportResponse.choices[0].message.content };
    } else {
        reportResponse = await aiClient.models.generateContent({
            model: modelName,
            contents: { parts },
            config: { temperature: 0.5 }
        });
    }
    
    const reportText = reportResponse.text.trim();
    if (!reportText) {
        return { report: "Failed to generate an initial report.", citations: [] };
    }
    return { report: reportText, citations: [] };
};
