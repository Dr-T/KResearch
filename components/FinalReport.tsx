import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FinalResearchData } from '../types';
import LiquidButton from './LiquidButton';


declare global {
  interface Window {
    mermaid?: any;
  }
}

interface FinalReportProps {
  data: FinalResearchData;
}

const FinalReport: React.FC<FinalReportProps> = ({ data }) => {
  const { report, citations, researchTimeMs } = data;
  const [copyButtonText, setCopyButtonText] = useState('复制报告');

  useEffect(() => {
    if (report && window.mermaid) {
      const timer = setTimeout(() => {
        try {
          const mermaidElements = document.querySelectorAll('.mermaid');
          if (mermaidElements.length) {
            mermaidElements.forEach(el => el.removeAttribute('data-processed'));
            window.mermaid.run({ nodes: mermaidElements });
          }
        } catch(e) {
          console.error("Error rendering mermaid graphs:", e);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [report]);

  const handleCopy = () => {
    navigator.clipboard.writeText(report).then(() => {
        setCopyButtonText('已复制！');
        setTimeout(() => setCopyButtonText('复制报告'), 2000);
    }).catch(err => {
        console.error('Failed to copy report: ', err);
        setCopyButtonText('复制失败');
        setTimeout(() => setCopyButtonText('复制报告'), 2000);
    });
  };


  return (
    <div className="w-full text-gray-800 dark:text-gray-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold">最终报告</h2>
        <LiquidButton onClick={handleCopy} className="px-4 py-2 text-sm shrink-0">
            {copyButtonText}
        </LiquidButton>
      </div>
      <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
            p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
            a: ({node, ...props}) => <a className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 hover:brightness-125 transition-all duration-300" target="_blank" rel="noopener noreferrer" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
            pre: ({ node, children, ...props }) => {
              const codeNode = node?.children[0];

              if (codeNode && codeNode.type === 'element' && codeNode.tagName === 'code') {
                const className = (codeNode.properties?.className || []) as string[];
                const match = /language-(\w+)/.exec(className[0] || '');

                if (match && match[1] === 'mermaid') {
                  const textNode = codeNode.children?.[0];
                  if (textNode && textNode.type === 'text') {
                    const codeString = textNode.value;
                    return (
                      <div className="p-4 my-4 bg-glass-light dark:bg-glass-dark rounded-lg flex justify-center items-center overflow-x-auto">
                        <div key={codeString} className="mermaid" style={{ minWidth: '100%', textAlign: 'center' }}>
                          {codeString}
                        </div>
                      </div>
                    );
                  }
                }
              }
              // For all other code blocks, wrap them in a glass container.
              return (
                <div className="my-4 bg-black/20 dark:bg-black/40 backdrop-blur-[25px] border border-border-light/50 dark:border-border-dark/50 rounded-lg overflow-x-auto">
                    <pre className="!bg-transparent !p-4" {...props}>
                        {children}
                    </pre>
                </div>
              );
            },
          }}
        >
          {report}
        </ReactMarkdown>
      </div>

      <div className="mt-12 border-t border-border-light dark:border-border-dark pt-6">
        <h3 className="text-2xl font-bold mb-4">研究摘要</h3>
        <div className="flex flex-col sm:flex-row gap-4 text-base">
            <div className="flex-1 text-center p-4 bg-glass-light dark:bg-glass-dark rounded-lg">
                <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">研究用时</div>
                <div className="text-2xl font-semibold">{(researchTimeMs / 1000).toFixed(2)}s</div>
            </div>
            <div className="flex-1 text-center p-4 bg-glass-light dark:bg-glass-dark rounded-lg">
                <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">来源数量</div>
                <div className="text-2xl font-semibold">{citations.length}</div>
            </div>
        </div>
      </div>

      <div className="mt-8 border-t border-border-light dark:border-border-dark pt-6">
        <h3 className="text-2xl font-bold mb-4">参考文献</h3>
        <ul className="list-none p-0 space-y-2">
            {citations.map((citation, index) => (
                <li key={index} className="text-sm p-3 bg-glass-light dark:bg-glass-dark rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline transition-colors font-medium break-words">
                        {citation.title || citation.url}
                    </a>
                    <span className="text-gray-500 dark:text-gray-400 block text-xs mt-1 break-all">{citation.url}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default FinalReport;
