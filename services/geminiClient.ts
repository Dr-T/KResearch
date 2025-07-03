import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";

// 通过环境变量选择模型提供商: 'google' 或 'openai'
const PROVIDER = import.meta.env.VITE_LLM_PROVIDER || 'google';

let aiClient: any;

if (PROVIDER === 'openai') {
  aiClient = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseURL: import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1',
    dangerouslyAllowBrowser: true // 允许前端直接请求，注意安全性
  });
} else {
  aiClient = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_LLM_PROVIDER?: string;
    readonly VITE_OPENAI_API_KEY?: string;
    readonly VITE_OPENAI_API_BASE?: string;
    readonly VITE_API_KEY?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export { aiClient, PROVIDER };
