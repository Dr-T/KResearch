import React, { useState, useEffect, useCallback, useRef } from 'react';
import GlassCard from './components/GlassCard';
import LiquidButton from './components/LiquidButton';
import ResearchProgress from './components/ResearchProgress';
import FinalReport from './components/FinalReport';
import ThemeSwitcher from './components/ThemeSwitcher';
import ClarificationChat from './components/ClarificationChat';
import { useAppLogic } from './hooks/useAppLogic';
import { ResearchMode } from './types';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const finalReportRef = useRef<HTMLDivElement>(null);
  
  const {
      query, setQuery, selectedFile, researchUpdates, finalData, mode, setMode, appState,
      clarificationHistory, clarificationLoading, startClarificationProcess, handleAnswerSubmit,
      handleStopResearch, handleFileChange, handleRemoveFile, handleReset, fileInputRef
  } = useAppLogic();

  const [isLogVisible, setIsLogVisible] = useState<boolean>(true);
  
  const [customModels, setCustomModels] = useState({
    planner: '',
    searcher: '',
    synthesizer: '',
    clarification: ''
  });
  const mainstreamModels = [
    'gpt-4.1',
    'gpt-4.1-mini',
    'deepseek-chat',
    'deepseek-reasoner',
    'claude-3-7-sonnet-20250219',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17'
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (appState === 'complete' && finalData && finalReportRef.current) {
        setTimeout(() => {
            finalReportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [appState, finalData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      startClarificationProcess();
    }
  };

  const modes: { id: ResearchMode | 'Custom', name: string, description: string }[] = [
    { id: 'Balanced', name: '均衡', description: '质量与速度的最佳平衡' },
    { id: 'DeepDive', name: '深度', description: '最高质量，使用最强模型' },
    { id: 'Fast', name: '快速', description: '快速获得结果' },
    { id: 'UltraFast', name: '极速', description: '极速反馈，适合快速检查' },
    { id: 'Custom', name: '自定义', description: '手动选择/输入各服务模型' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </div>

      <GlassCard className="w-full max-w-4xl p-6 sm:p-8 flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">KResearch</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">你的AI深度研究助手</p>
        </header>

        {appState === 'idle' && (
          <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {modes.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id as ResearchMode | 'Custom')} className={`p-3 rounded-[10px] text-sm font-semibold transition-all duration-300 text-center border ${mode === m.id ? 'bg-glow-light/20 dark:bg-glow-dark/30 text-gray-900 dark:text-white shadow-md border-glow-light dark:border-glow-dark' : 'bg-glass-light/50 dark:bg-glass-dark/50 text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 border-border-light dark:border-border-dark'}`} title={m.description}>{m.name}</button>
              ))}
            </div>
            {mode === 'Custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Planner模型</label>
                  <select className="w-full p-2 rounded border" value={customModels.planner} onChange={e => setCustomModels(v => ({ ...v, planner: e.target.value }))}>
                    <option value="">请选择或自定义</option>
                    {mainstreamModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="w-full p-2 rounded border mt-1" placeholder="自定义模型名" value={customModels.planner} onChange={e => setCustomModels(v => ({ ...v, planner: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Searcher模型</label>
                  <select className="w-full p-2 rounded border" value={customModels.searcher} onChange={e => setCustomModels(v => ({ ...v, searcher: e.target.value }))}>
                    <option value="">请选择或自定义</option>
                    {mainstreamModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="w-full p-2 rounded border mt-1" placeholder="自定义模型名" value={customModels.searcher} onChange={e => setCustomModels(v => ({ ...v, searcher: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Synthesizer模型</label>
                  <select className="w-full p-2 rounded border" value={customModels.synthesizer} onChange={e => setCustomModels(v => ({ ...v, synthesizer: e.target.value }))}>
                    <option value="">请选择或自定义</option>
                    {mainstreamModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="w-full p-2 rounded border mt-1" placeholder="自定义模型名" value={customModels.synthesizer} onChange={e => setCustomModels(v => ({ ...v, synthesizer: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Clarification模型</label>
                  <select className="w-full p-2 rounded border" value={customModels.clarification} onChange={e => setCustomModels(v => ({ ...v, clarification: e.target.value }))}>
                    <option value="">请选择或自定义</option>
                    {mainstreamModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input className="w-full p-2 rounded border mt-1" placeholder="自定义模型名" value={customModels.clarification} onChange={e => setCustomModels(v => ({ ...v, clarification: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="relative">
              <textarea value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="例如：AI在医疗领域的未来？（你也可以上传文件）" className="w-full h-32 p-4 pr-12 rounded-lg resize-none bg-black/10 dark:bg-black/20 border border-transparent focus:border-glow-light dark:focus:border-glow-dark focus:ring-2 focus:ring-glow-light/50 dark:focus:ring-glow-dark/50 focus:outline-none transition-all duration-300" disabled={appState !== 'idle'}/>
              <div className="absolute inset-y-0 right-0 flex items-end p-3">
                  <input type="file" id="file-upload" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={appState !== 'idle'} />
                  <label htmlFor="file-upload" className="p-2 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="附加文件"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg><span className="sr-only">附加文件</span></label>
              </div>
            </div>
            {selectedFile && <div className="flex items-center justify-between px-3 py-2 text-sm rounded-lg bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20"><span className="truncate text-gray-700 dark:text-gray-300" title={selectedFile.name}>{selectedFile.name}</span><button onClick={handleRemoveFile} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10" title="移除文件"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg><span className="sr-only">移除文件</span></button></div>}
            <LiquidButton onClick={startClarificationProcess} disabled={appState !== 'idle' || !query.trim()} className="w-full">开始研究</LiquidButton>
          </div>
        )}
        
        {appState === 'clarifying' && (<ClarificationChat history={clarificationHistory} onAnswerSubmit={handleAnswerSubmit} isLoading={clarificationLoading}/>)}
        
        {appState === 'researching' && (<LiquidButton onClick={handleStopResearch} className="w-full bg-red-500/30 hover:bg-red-500/40 border-red-500/50">停止研究</LiquidButton>)}

        {(appState === 'researching' || (appState === 'complete' && researchUpdates.length > 0)) && (
          <div className="animate-fade-in space-y-4">
            {appState === 'complete' && (<button onClick={() => setIsLogVisible(!isLogVisible)} className="flex items-center justify-between w-full text-left font-semibold text-lg p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><span>{isLogVisible ? '隐藏' : '显示'}研究日志</span><svg className={`w-5 h-5 transition-transform ${isLogVisible ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>)}
            {isLogVisible && <ResearchProgress updates={researchUpdates} isResearching={appState === 'researching'} />}
          </div>
        )}
        
        {appState === 'complete' && finalData && (
            <div ref={finalReportRef} className="animate-fade-in space-y-6 border-t border-border-light dark:border-border-dark pt-6 mt-6">
                 <FinalReport data={finalData} />
                 <LiquidButton onClick={handleReset} className="w-full mt-4">开始新研究</LiquidButton>
            </div>
        )}
      </GlassCard>
      
      <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} KResearch. 由 Gemini 驱动.</p>
      </footer>
    </div>
  );
};

export default App;
