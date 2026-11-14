import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Cpu,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Search,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { StockQuote } from '../../types/market';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type GeminiModelType = 
  | 'gemini-3.8-flash' 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-4-argon' 
  | 'gemini-4-carbon';

export type ChatbotRole = 
  | 'fast-assistant' 
  | 'deep-researcher' 
  | 'technical-strategist' 
  | 'market-tutor';

interface GeminiChatbotProps {
  allStocks: StockQuote[];
  selectedSymbol: string;
  onSelectStock: (symbol: string) => void;
}

const MODEL_OPTIONS: {
  id: GeminiModelType;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  icon: typeof Bot;
  color: string;
}[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tagline: 'General Market Q&A',
    badge: 'Default',
    description: 'Fast, balanced general tasks, stock summaries, and multi-turn conversations.',
    icon: Sparkles,
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tagline: 'Ultra-Fast Response',
    badge: 'Fast',
    description: 'High throughput, low-latency quick answers and rapid ticker lookups.',
    icon: Zap,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tagline: 'Complex Interactive Tasks',
    badge: 'Argon',
    description: 'Multi-step financial analysis, complex scenario modeling, and STEM tasks.',
    icon: Brain,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    tagline: 'Deep Reasoning',
    badge: 'Deep Logic',
    description: 'Exhaustive valuation modeling, corporate governance audits, and deep causal reasoning.',
    icon: Cpu,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
  }
];

const ROLE_OPTIONS: {
  id: ChatbotRole;
  title: string;
  recommendedModel: GeminiModelType;
  description: string;
}[] = [
  {
    id: 'fast-assistant',
    title: 'Market Assistant',
    recommendedModel: 'gemini-3.8-flash',
    description: 'General equity questions, NSE vs BSE differences, and index overviews.'
  },
  {
    id: 'deep-researcher',
    title: 'Deep Equity Analyst',
    recommendedModel: 'gemini-4-carbon',
    description: 'Fundamental valuation, corporate health, moat checks, and balance sheet reasoning.'
  },
  {
    id: 'technical-strategist',
    title: 'Quantitative Technical Strategist',
    recommendedModel: 'gemini-4-argon',
    description: 'Moving averages, momentum indicators, chart patterns, and entry/exit setups.'
  },
  {
    id: 'market-tutor',
    title: 'Academic ML & Finance Tutor',
    recommendedModel: 'gemini-3.8-flash',
    description: 'Explains machine learning algorithms (Random Forest, Ridge), MSE, and econometrics.'
  }
];

export const GeminiChatbotPage: React.FC<GeminiChatbotProps> = ({
  allStocks,
  selectedSymbol,
  onSelectStock
}) => {
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('fast-assistant');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active context stock
  const [activeStockSymbol, setActiveStockSymbol] = useState(selectedSymbol || 'RELIANCE');
  const activeStock = allStocks.find(s => s.symbol.toUpperCase() === activeStockSymbol.toUpperCase());

  // Conversation history (Multi-turn state)
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-msg',
      role: 'model',
      text: `Hello! I am your **NSE-BSE Market AI Assistant**, powered by Google Gemini.

I can assist you with:
- **Fundamental & Valuation Analysis** of any of the 8,950+ NSE & BSE equities.
- **Technical & Algorithmic Strategy** (RSI, Moving Averages, MACD, and Price Action).
- **Academic Machine Learning Insights** (how Ridge Regression and Random Forest forecast stock returns).
- **Macro & SEBI Market Segment Clarifications** (Mainboard vs BSE SME, BE/BZ surveillance groups).

Feel free to ask a question, or pick one of the suggested prompts below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRoleChange = (role: ChatbotRole) => {
    setSelectedRole(role);
    const target = ROLE_OPTIONS.find(r => r.id === role);
    if (target) {
      setSelectedModel(target.recommendedModel);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Build request payload for full-stack server endpoint
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        text: m.text
      }));

      const stockPayload = activeStock ? {
        symbol: activeStock.symbol,
        name: activeStock.name,
        exchange: activeStock.exchange,
        ltp: activeStock.ltp,
        changePercent: activeStock.changePercent,
        peRatio: activeStock.peRatio,
        sector: activeStock.sector
      } : undefined;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          role: selectedRole,
          stockContext: stockPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Unable to complete response**\n\n${err?.message || 'Network error occurred while calling the Gemini API.'}\n\nPlease check your internet connection or verify your API key settings in **Settings > Secrets**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        text: `Conversation history cleared. I am ready to answer your questions on Indian equities and machine learning analysis!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  const samplePrompts = [
    `Analyze ${activeStockSymbol}'s technical structure and momentum setup`,
    `Explain the difference between NSE Mainboard and BSE SME segments`,
    `How does Random Forest feature importance (MDI) help predict stock returns?`,
    `Evaluate ${activeStockSymbol}'s valuation metrics vs sectoral peers`
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto h-[calc(100vh-130px)] flex flex-col">
      {/* Top Banner & Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Gemini Market Chatbot
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Multi-Turn
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Google Gemini AI for NSE & BSE quantitative analysis and market intelligence
              </p>
            </div>
          </div>

          {/* Quick Stock Context Picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={activeStockSymbol}
                onChange={(e) => setActiveStockSymbol(e.target.value.toUpperCase())}
                placeholder="Active symbol..."
                className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>
            {activeStock && (
              <button
                onClick={() => onSelectStock(activeStock.symbol)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                title="View full charts for this stock"
              >
                <span>Analysis</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Reset conversation thread"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Persona Role & Model Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Persona Role Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Chatbot Persona & Role
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${
                    selectedRole === r.id
                      ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold truncate">{r.title}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                    {r.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gemini Model Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Active Gemini Model
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {MODEL_OPTIONS.map((m) => {
                const Icon = m.icon;
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.name}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                      {m.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-y-auto shadow-xs space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-2xs ${
                  isUser
                    ? 'bg-slate-700 dark:bg-slate-600'
                    : 'bg-sky-600 dark:bg-sky-500'
                }`}
              >
                {isUser ? 'You' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed max-w-2xl space-y-2 ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-xs'
                }`}
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 pb-1 border-b border-white/10 dark:border-slate-700/40">
                  <span className="font-semibold">
                    {isUser ? 'You' : `NSE-BSE AI (${msg.modelUsed || selectedModel})`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="hover:opacity-100 p-0.5 rounded transition-opacity"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body (Supports Markdown Paragraphs & Lists) */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-1">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-md">
            <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <span>Thinking with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Suggested:</span>
        </span>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-sky-500 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask ${selectedRole.replace('-', ' ')} about ${activeStockSymbol}, technicals, or ML algorithms...`}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
