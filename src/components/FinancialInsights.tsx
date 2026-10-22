import React, { useState } from 'react';
import { Sparkles, Lightbulb, Repeat, AlertCircle, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { StatementAnalysis } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface FinancialInsightsProps {
  data: StatementAnalysis;
}

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ data }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const quickQuestions = [
    'Onde estão meus maiores vazamentos de dinheiro?',
    'Quanto gastei com alimentação e delivery?',
    'Quais despesas posso cortar no próximo mês?',
    'Quais são meus gastos fixos recorrentes?',
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsAsking(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          statementContext: {
            bankName: data.bankName,
            totalIncome: data.totalIncome,
            totalExpenses: data.totalExpenses,
            netBalance: data.netBalance,
            topExpenseCategory: data.topExpenseCategory,
            largestExpensesInsight: data.largestExpensesInsight,
            recurringExpenses: data.recurringExpenses,
            topTransactions: data.transactions
              .filter((t) => t.type === 'EXPENSE')
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 10),
          },
        }),
      });

      const resData = await res.json();
      if (resData.answer) {
        setAnswer(resData.answer);
      } else {
        setAnswer('Não foi possível obter uma resposta para essa pergunta no momento.');
      }
    } catch (err) {
      console.error('Error asking question:', err);
      setAnswer('Erro ao comunicar com a inteligência artificial. Tente novamente.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Diagnóstico dos Maiores Gastos */}
      <div className="bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white tracking-tight">
                Diagnóstico dos Maiores Gastos &amp; Comportamento
              </h4>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium">
                IA Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              {data.largestExpensesInsight}
            </p>
            <p className="text-xs text-slate-400 mt-2 border-t border-slate-800 pt-2">
              <strong>Resumo do mês:</strong> {data.summary}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas Recorrentes e Assinaturas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Gastos Recorrentes &amp; Assinaturas Identificadas
                </h4>
                <p className="text-xs text-slate-400">
                  Custos fixos que se repetem todo mês
                </p>
              </div>
            </div>

            {data.recurringExpenses && data.recurringExpenses.length > 0 ? (
              <div className="space-y-2.5">
                {data.recurringExpenses.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="font-semibold text-slate-200 truncate">
                        {rec.name}
                      </span>
                      {rec.frequency && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {rec.frequency}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-white shrink-0">
                      {formatCurrency(rec.amount, data.currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">
                Nenhum gasto explicitamente recorrente ou assinatura foi detectado no período.
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60">
            Dica: Rever mensalidades antigas costuma liberar de 10% a 20% do orçamento.
          </p>
        </div>

        {/* Dicas Práticas de Economia */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Oportunidades de Economia
                </h4>
                <p className="text-xs text-slate-400">
                  Pontos de atenção encontrados nas suas despesas
                </p>
              </div>
            </div>

            {data.savingsTips && data.savingsTips.length > 0 ? (
              <div className="space-y-3">
                {data.savingsTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">
                Seus gastos parecem equilibrados em relação às suas receitas.
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60">
            Gerado automaticamente com base nos valores e frequências do seu extrato.
          </p>
        </div>
      </div>

      {/* Assistente Financeiro Interativo */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-sm font-bold text-white">
            Tire Dúvidas com a IA sobre este Extrato
          </h4>
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-3 py-1.5 rounded-full transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Ex: Quanto gastei com farmácia? Qual foi o maior PIX enviado?"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={isAsking || !question.trim()}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isAsking ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Perguntar
          </button>
        </div>

        {/* Response */}
        {answer && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-teal-500/30 text-xs text-slate-200 leading-relaxed">
            <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Resposta da Inteligência Financeira:
            </div>
            <p className="whitespace-pre-line">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
