import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createRequire } from 'module';
import { parseBankStatementText } from './src/utils/localBankParser.ts';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    if (typeof pdfParse === 'function') {
      const data = await pdfParse(buffer);
      return data.text || '';
    } else if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ data: buffer });
      await parser.load();
      const res = await parser.getText();
      await parser.destroy();
      return res?.text || '';
    }
  } catch (err: any) {
    console.warn('PDF text extraction notice:', err?.message);
  }
  return '';
}

// Helper for sleep/backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(params: { contents: any; config?: any }) {
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

  for (const model of models) {
    try {
      const timeoutMs = 3500;
      const res = await Promise.race([
        ai.models.generateContent({ model, ...params }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on ${model}`)), timeoutMs)
        ),
      ]);
      return res;
    } catch (err: any) {
      console.warn(`[Gemini API] Call on ${model} failed: ${err?.message || err}`);
    }
  }

  throw new Error('Modelos de IA indisponíveis momentaneamente (503 alta demanda).');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Accept up to 50MB for PDF files and base64 documents
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash / gemini-3.1-flash-lite',
    });
  });

  // Analyze Bank Statement Endpoint
  app.post('/api/analyze-statement', async (req, res) => {
    try {
      const { base64Data, mimeType, filename, rawText } = req.body;

      if (!base64Data && !rawText) {
        return res.status(400).json({
          error: 'Nenhum arquivo PDF ou texto de extrato foi fornecido.',
        });
      }

      let extractedPdfText = '';
      let cleanBase64 = '';

      if (base64Data) {
        cleanBase64 = base64Data;
        if (cleanBase64.includes(',')) {
          cleanBase64 = cleanBase64.split(',')[1];
        }

        try {
          const pdfBuffer = Buffer.from(cleanBase64, 'base64');
          extractedPdfText = await extractPdfText(pdfBuffer);
          console.log(`[PDF Extraction] Extracted ${extractedPdfText.length} characters of text from PDF.`);
        } catch (pdfErr: any) {
          console.warn('PDF text extraction error:', pdfErr?.message);
        }
      }

      const effectiveText = (extractedPdfText || rawText || '').trim();

      const promptInstructions = `
Você é um auditor financeiro e especialista em processamento inteligente de extratos bancários de bancos brasileiros (Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, Caixa Econômica, C6 Bank, BTG, Sicredi, etc.) e internacionais.

${
  effectiveText
    ? `Abaixo está o CONTEÚDO EXTRAÍDO DO EXTRATO BANCÁRIO (via pdf-parse):
==================================================
${effectiveText.slice(0, 35000)}
==================================================`
    : 'Analise o documento visual fornecido.'
}

Sua missão:
1. Ler e analisar minuciosamente todo o extrato bancário.
2. Extrair TODAS as transações e lançamentos individuais.
3. Diferenciar com extrema precisão o que é DESPESA/DÉBITO (saída de dinheiro, compras, PIX enviados, pagamentos, saques, tarifas) de RECEITA/CRÉDITO (entrada de dinheiro, salários, PIX recebidos, transferências recebidas, estornos, rendimentos).
   - O campo "amount" DEVE SER SEMPRE UM NÚMERO POSITIVO (ex: se no extrato constar "-150,00", "-R$ 150,00" ou "150,00 D", retorne 150.0).
   - "type" deve ser "EXPENSE" para despesas/saídas e "INCOME" para receitas/entradas.
4. ATENÇÃO CRÍTICA AO PEDIDO DO USUÁRIO: "filtre onde eu tive os maiores gastos".
   - Identifique com destaque onde o usuário mais gastou: quais foram os estabelecimentos, pessoas ou categorias que mais consumiram dinheiro.
   - No campo "largestExpensesInsight", escreva em português claro e direto um diagnóstico revelando os 3 a 5 maiores gastos isolados e os maiores polos de gasto acumulado (ex: "Você gastou R$ X no total com moradia, R$ Y no estabelecimento Z").
5. Categorize cada despesa com categorias padronizadas e realistas:
   - "Moradia & Contas"
   - "Alimentação & Supermercado"
   - "Transporte & Veículo"
   - "Saúde & Bem-estar"
   - "Lazer & Assinaturas"
   - "Compras & Eletrônicos"
   - "Educação & Livros"
   - "Serviços Financeiros & Tarifas"
   - "Salário & Receitas"
   - "Transferências Pessoais"
   - "Outros"
6. Extraia o nome limpo do estabelecimento / recebedor (ex: "iFood", "Pão de Açúcar", "Posto Ipiranga", "Netflix", "Imobiliária", "Uber").
7. Detecte despesas recorrentes ou assinaturas identificadas no extrato.
8. Calcule com exatidão matemática o total de receitas, total de despesas e o saldo líquido (receitas - despesas).
`;

      // Build contents: if effectiveText is extracted, send as pure text prompt (fastest & most reliable!)
      // If no text was extractable (e.g. scanned image), attach inlineData
      let contentsPayload: any;
      if (effectiveText && effectiveText.length > 30) {
        contentsPayload = promptInstructions;
      } else if (cleanBase64) {
        contentsPayload = {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'application/pdf',
              },
            },
            {
              text: promptInstructions,
            },
          ],
        };
      } else {
        contentsPayload = promptInstructions;
      }

      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: {
              type: Type.STRING,
              description: 'Nome do banco (ex: Nubank, Itaú, Bradesco, etc.)',
            },
            accountHolder: {
              type: Type.STRING,
              description: 'Nome do titular da conta, se encontrado',
            },
            period: {
              type: Type.OBJECT,
              properties: {
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
              },
              required: ['startDate', 'endDate'],
            },
            currency: {
              type: Type.STRING,
              description: 'Código da moeda (ex: BRL)',
            },
            totalIncome: {
              type: Type.NUMBER,
              description: 'Soma total de entradas e receitas',
            },
            totalExpenses: {
              type: Type.NUMBER,
              description: 'Soma total de despesas e saídas',
            },
            netBalance: {
              type: Type.NUMBER,
              description: 'Saldo do período (entradas - saídas)',
            },
            topExpenseCategory: {
              type: Type.STRING,
              description: 'Categoria onde houve mais gastos em valor total',
            },
            largestExpensesInsight: {
              type: Type.STRING,
              description: 'Análise detalhada destacando onde ocorreram os maiores gastos e impactos no orçamento',
            },
            summary: {
              type: Type.STRING,
              description: 'Resumo geral do extrato e comportamento financeiro',
            },
            savingsTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Dicas práticas de economia com base nos gastos encontrados',
            },
            recurringExpenses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  frequency: { type: Type.STRING },
                },
                required: ['name', 'amount'],
              },
            },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  date: { type: Type.STRING, description: 'Data da transação (ex: DD/MM/AAAA ou AAAA-MM-DD)' },
                  description: { type: Type.STRING, description: 'Descrição clara e compreensível' },
                  originalDescription: { type: Type.STRING, description: 'Descrição original do extrato' },
                  amount: { type: Type.NUMBER, description: 'Valor positivo em reais' },
                  type: { type: Type.STRING, description: 'EXPENSE ou INCOME' },
                  category: { type: Type.STRING },
                  merchantOrRecipient: { type: Type.STRING },
                  paymentMethod: { type: Type.STRING, description: 'PIX, Cartão de Crédito, Cartão de Débito, Boleto, TED, Tarifa, etc.' },
                },
                required: ['date', 'description', 'amount', 'type', 'category', 'merchantOrRecipient', 'paymentMethod'],
              },
            },
          },
          required: [
            'bankName',
            'totalIncome',
            'totalExpenses',
            'netBalance',
            'topExpenseCategory',
            'largestExpensesInsight',
            'summary',
            'transactions',
          ],
        },
      };

      try {
        // Attempt AI analysis with Gemini
        const response = await callGemini({
          contents: contentsPayload,
          config,
        });

        const responseText = response.text?.trim() || '{}';
        const parsedData = JSON.parse(responseText);

        if (Array.isArray(parsedData.transactions)) {
          parsedData.transactions = parsedData.transactions.map((tx: any, idx: number) => ({
            id: tx.id || `tx-${Date.now()}-${idx}`,
            ...tx,
          }));
        }

        return res.json({
          success: true,
          source: 'gemini_ai',
          data: parsedData,
        });
      } catch (aiErr: any) {
        console.warn('Gemini API returned error/503. Switching to intelligent local parser:', aiErr?.message);

        // Fallback: If Gemini is under 503 demand spike, parse locally using intelligent parser!
        if (effectiveText && effectiveText.length > 20) {
          const localParsedData = parseBankStatementText(effectiveText);
          if (localParsedData.transactions.length > 0) {
            return res.json({
              success: true,
              source: 'local_engine',
              data: localParsedData,
              note: 'Processado pelo motor inteligente de extratos locais (servidores de IA do Google temporariamente em alta demanda).',
            });
          }
        }

        // If local parser could not find lines either:
        return res.status(503).json({
          error: 'Os servidores da IA estão com alta demanda temporária (Erro 503).',
          details: 'Por favor, aguarde alguns instantes e tente novamente, ou utilize os botões de demonstração (Nubank / Itaú).',
        });
      }
    } catch (err: any) {
      console.error('General error analyzing statement:', err);
      return res.status(500).json({
        error: 'Falha ao processar o extrato.',
        details: err?.message || 'Erro desconhecido',
      });
    }
  });

  // Assistant / Chat query endpoint for statement questions
  app.post('/api/ask-question', async (req, res) => {
    try {
      const { question, statementContext } = req.body;
      if (!question || !statementContext) {
        return res.status(400).json({ error: 'Pergunta ou contexto do extrato ausente.' });
      }

      const promptText = `Você é um assistente financeiro pessoal. O usuário tem dúvidas sobre o extrato analisado:
Contexto do extrato:
${JSON.stringify(statementContext, null, 2)}

Pergunta do usuário: "${question}"

Responda em português, de forma amigável, objetiva, apontando valores exatos em R$ e indicando onde ele teve os maiores gastos ou como economizar.`;

      try {
        const response = await callGemini({
          contents: promptText,
        });
        return res.json({ answer: response.text?.trim() });
      } catch (geminiErr: any) {
        console.warn('Gemini 503 in ask-question. Generating contextual answer locally:', geminiErr?.message);

        // Smart local answering when 503 occurs
        const qLower = question.toLowerCase();
        let fallbackAnswer = '';

        if (qLower.includes('maior') || qLower.includes('maiores') || qLower.includes('onde')) {
          fallbackAnswer = `Analisando seu extrato do ${statementContext.bankName || 'banco'}, ${statementContext.largestExpensesInsight || 'seus maiores gastos foram com os valores de topo listados no extrato.'}`;
        } else if (qLower.includes('alimenta') || qLower.includes('comida') || qLower.includes('mercado') || qLower.includes('ifood')) {
          fallbackAnswer = `Seus gastos em Alimentação e Supermercado costumam ser um dos maiores centros de consumo. Recomendamos verificar os lançamentos de delivery e compras de mercado na tabela para identificar economia.`;
        } else if (qLower.includes('economiz') || qLower.includes('cortar') || qLower.includes('reduzir')) {
          fallbackAnswer = `Para economizar com base no seu extrato: 1) Foque na sua maior categoria de gastos (${statementContext.topExpenseCategory || 'principais despesas'}); 2) Revise assinaturas recorrentes; 3) Estabeleça um teto para pedidos por aplicativo.`;
        } else {
          fallbackAnswer = `Seu extrato do ${statementContext.bankName} apresenta um total de gastos de R$ ${Number(statementContext.totalExpenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Seu saldo líquido no período foi de R$ ${Number(statementContext.netBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;
        }

        return res.json({ answer: fallbackAnswer });
      }
    } catch (err: any) {
      console.error('Error in ask-question:', err);
      return res.status(500).json({
        error: 'Erro ao responder pergunta financeira.',
        details: err?.message || String(err),
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Note: hmr: false avoids WebSocket connection errors in iframe preview
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ExtratoScan AI rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
