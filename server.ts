import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { MarketHighlightsService } from './src/services/marketHighlightsService';
import { Exchange } from './src/types/market';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '10mb' }));

// Genuine Historical EOD Market Highlights Endpoint (NSE / BSE SQLite)
app.get('/api/market/highlights', (req, res) => {
  try {
    const rawExchange = String(req.query.exchange || 'NSE').trim().toUpperCase();
    if (rawExchange !== 'NSE' && rawExchange !== 'BSE') {
      return res.status(400).json({ error: 'Invalid exchange parameter. Expected NSE or BSE.' });
    }
    const exchange: Exchange = rawExchange;
    const rawLimit = parseInt(String(req.query.limit || '5'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(25, Math.max(1, rawLimit)) : 5;

    const highlights = MarketHighlightsService.buildFromRepository(exchange, limit);
    return res.json(highlights);
  } catch (err: any) {
    console.error('Error in /api/market/highlights:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to query historical market highlights',
    });
  }
});

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Gemini Chat Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      messages,
      model = 'gemini-3.8-flash',
      role = 'analyst',
      stockContext
    }: {
      messages: ChatMessage[];
      model?: string;
      role?: string;
      stockContext?: {
        symbol: string;
        name?: string;
        exchange?: string;
        ltp?: number;
        changePercent?: number;
        peRatio?: number;
        sector?: string;
      };
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please ensure an API key is attached in Settings > Secrets.',
      });
    }

    // Role-specific System Instructions
    let roleInstruction = '';
    switch (role) {
      case 'deep-researcher':
        roleInstruction = `You are an elite Equity Research Analyst specializing in Indian Equities (NSE and BSE).
Your role is deep reasoning, fundamental valuation, balance sheet health, moat analysis, corporate governance, and macro-tailwinds.
Provide thorough, well-reasoned, quantitative breakdowns. Reference specific metrics (P/E, ROCE, Debt-to-Equity, FII/DII holdings) where appropriate.`;
        break;
      case 'technical-strategist':
        roleInstruction = `You are a Quantitative Technical Analyst specializing in Indian Equities (NSE/BSE).
Your role is multi-timeframe chart pattern analysis, support/resistance levels, moving average crossovers (20/50/200 EMA), momentum oscillators (RSI, MACD), and risk-to-reward ratios.
Offer objective, structured risk-managed insights with defined entry zones, target levels, and invalidation stop-losses.`;
        break;
      case 'market-tutor':
        roleInstruction = `You are a patient and knowledgeable Academic Finance Professor and Stock Market Tutor for engineering and finance students at REVA University.
Explain financial concepts, algorithmic trading models (Ridge Regression, Random Forest, Decision Trees), market microstructure (Bhavcopy, UDiFF, SEBI surveillance BE/BZ segments), and technical indicators clearly with illustrative examples.`;
        break;
      case 'fast-assistant':
      default:
        roleInstruction = `You are an intelligent, prompt, and helpful Indian Stock Market Assistant on the NSE-BSE Market Analyzer platform.
Provide concise, accurate answers on stock symbols, price movements, exchange differences (NSE vs BSE), indices, and quick stock overviews.`;
        break;
    }

    let systemInstruction = `${roleInstruction}

Platform Context:
- Platform: Intelligent NSE-BSE Market Analyzer (B.Tech Capstone Project).
- Universe: 8,950+ NSE & BSE securities, including Mainboard & BSE SME segments.
- Data: Authentic EOD Bhavcopy records from official exchange archives (2024 to 2026).
- Standard Academic Disclaimer: You provide educational quantitative and market insights, not SEBI-registered financial advisory or guaranteed stock tips. Always encourage proper risk management.`;

    if (stockContext && stockContext.symbol) {
      systemInstruction += `\n\nCurrently Viewed Stock Context:
- Symbol: ${stockContext.symbol} (${stockContext.exchange || 'NSE'})
- Company: ${stockContext.name || stockContext.symbol}
- Sector: ${stockContext.sector || 'N/A'}
- LTP: ₹${stockContext.ltp ?? 'N/A'} (${stockContext.changePercent ? (stockContext.changePercent > 0 ? '+' : '') + stockContext.changePercent.toFixed(2) + '%' : 'N/A'})
- P/E Ratio: ${stockContext.peRatio ?? 'N/A'}`;
    }

    // Convert conversation history into @google/genai contents format
    // Map previous turns to contents
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const replyText = response.text || 'I analyzed your request, but no text response was generated.';

    return res.json({
      text: replyText,
      modelUsed: model,
      role: role,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to generate response from Gemini API',
    });
  }
});

// Setup Vite development middleware in dev, or serve static dist in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
