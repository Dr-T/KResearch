import React, { useRef, useEffect } from 'react';
import Spinner from './Spinner';
import { ResearchUpdate, AgentPersona } from '../types';

interface ResearchProgressProps {
  updates: ResearchUpdate[];
  isResearching: boolean;
}

const getAgentInfo = (persona: AgentPersona) => {
    switch (persona) {
        case 'Alpha':
            return {
                name: 'Alpha智能体',
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
            };
        case 'Beta':
            return {
                name: 'Beta智能体',
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
            };
    }
}


const TypeIcon = ({ type, persona }: { type: ResearchUpdate['type'], persona?: AgentPersona }) => {
  if (type === 'thought' && persona) {
    return getAgentInfo(persona).icon;
  }
  switch (type) {
    case 'thought':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case 'search':
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
    case 'read':
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    default:
      return null;
  }
};

const ResearchProgress: React.FC<ResearchProgressProps> = ({ updates, isResearching }) => {
  const headerText = isResearching ? "研究中..." : "研究完成";
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTo({
            top: logContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [updates]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-200">
        {isResearching && <Spinner />}
        <span>{headerText}</span>
      </div>
      <div ref={logContainerRef} className="max-h-[22rem] overflow-y-auto pr-4 -mr-4 space-y-1 scroll-smooth">
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border-light dark:bg-border-dark"></div>
          
          {updates.map((update) => (
            <div key={update.id} className="relative mb-4 animate-fade-in">
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-glass-light dark:bg-glass-dark border-2 border-border-light dark:border-border-dark flex items-center justify-center -translate-x-1/2">
                <TypeIcon type={update.type} persona={update.persona}/>
            </div>
            <div className="ml-2 p-3 rounded-lg bg-glass-light/30 dark:bg-glass-dark/30 backdrop-blur-sm border border-border-light/20 dark:border-border-dark/20">
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {update.type === 'search' && Array.isArray(update.content) ? (
                    <div>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">搜索内容：</span>
                    <ul className="list-disc pl-5 mt-1 text-xs space-y-1">
                        {update.content.map((query, qIndex) => (
                            <li key={qIndex}>
                                {query}
                                {Array.isArray(update.source) && update.source[qIndex] && (
                                    <a href={update.source[qIndex]} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 ml-1 hover:underline">（来源）</a>
                                )}
                            </li>
                        ))}
                    </ul>
                    </div>
                ) : update.type === 'read' ? (
                    <div>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">阅读与整合</span>
                    {Array.isArray(update.source) &&
                        <span className="text-xs text-gray-500 ml-1">({update.source.length} sources)</span>
                    }
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic truncate">{String(update.content)}</p>
                    </div>
                ) : update.type === 'thought' ? (
                    <div>
                        {update.persona ? (
                             <span className={`font-semibold capitalize ${update.persona === 'Alpha' ? 'text-purple-500 dark:text-purple-400' : 'text-cyan-500 dark:text-cyan-400'}`}>{getAgentInfo(update.persona).name}:</span>
                        ) : (
                             <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">思考：</span>
                        )}
                       
                        <span className="ml-1 italic">{String(update.content)}</span>
                    </div>
                ) : (
                    <div>
                    <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">{update.type}:</span>
                    <span className="ml-1 italic">{String(update.content)}</span>
                    </div>
                )}
                </div>
            </div>
            </div>
        ))}
        </div>
      </div>
    </div>
  );
};

export default ResearchProgress;
