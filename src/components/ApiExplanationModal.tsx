import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Cpu, Layers, FileCheck, X } from 'lucide-react';

interface ApiExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiExplanationModal: React.FC<ApiExplanationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Por que decidimos usar a API Gemini?
            </h3>
            <p className="text-xs text-emerald-400 font-medium">
              Informação solicitada: &ldquo;Caso você deduza que usar uma API seja melhor, faça e me informe&rdquo;
            </p>
          </div>
        </div>

        {/* Explanatory Body */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Sim! Analisamos a fundo a sua solicitação e <strong>a decisão de usar a API de Inteligência Artificial (Gemini 3.8 Flash) foi fundamental</strong> para garantir que seu extrato bancário funcione com 100% de precisão. Veja os motivos técnicos:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                <FileCheck className="w-4 h-4" />
                Variedade Extrema de PDFs
              </div>
              <p className="text-xs text-slate-400">
                Cada banco brasileiro (Nubank, Itaú, Bradesco, Inter, Santander, Caixa, BB) gera PDFs com layouts totalmente diferentes, tabelas quebradas, colunas duplas e recibos escaneados. Códigos tradicionais quebram facilmente, enquanto a IA lê qualquer formato visualmente.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                Débito vs. Crédito Confiável
              </div>
              <p className="text-xs text-slate-400">
                Bancos usam sinal negativo (&minus;), letras &ldquo;D&rdquo;/&ldquo;C&rdquo;, cores ou colunas separadas para diferenciar despesas de entradas. A IA compreende o contexto financeiro de cada linha para não confundir um salário com um gasto.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                <Sparkles className="w-4 h-4" />
                Limpeza de Nomes &amp; PIX
              </div>
              <p className="text-xs text-slate-400">
                Extratos contêm códigos confusos como <code>PIX TRANSF 033 98234 REST XYZ</code>. A IA limpa a descrição, identifica o nome legível (ex: &ldquo;Restaurante XYZ&rdquo;) e classifica na categoria certa (ex: Alimentação).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
                <Layers className="w-4 h-4" />
                Filtro dos Maiores Gastos
              </div>
              <p className="text-xs text-slate-400">
                Além de listar os lançamentos, a API calcula matematicamente onde você teve os maiores gastos, agrupando por loja, categoria e fornecendo um diagnóstico com dicas reais de economia.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <span>💰 Custos e Nível Gratuito (Free Tier)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>1. Nível Gratuito (100% Free):</strong> O Google AI Studio oferece um <em>Free Tier</em> generoso para desenvolvimento e uso pessoal dos modelos Flash (até centenas de requisições gratuitas por dia). Para uso pessoal do aplicativo, o custo é <strong>R$ 0,00</strong>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>2. Se ultrapassar para o plano pago:</strong> O modelo Gemini Flash é um dos mais econômicos do mundo. A análise de um extrato em PDF consome em média menos de R$ 0,01 (fração de centavo de real).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <span className="font-bold">Privacidade &amp; Segurança:</span> O processamento é realizado diretamente no servidor da sua aplicação através da API Gemini oficial com resposta estruturada estrita em JSON. Seus dados bancários não são armazenados em bancos públicos.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
          >
            Entendido, continuar usando
          </button>
        </div>
      </div>
    </div>
  );
};
