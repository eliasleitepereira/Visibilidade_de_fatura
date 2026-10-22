import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Flame, Layers, TrendingDown } from 'lucide-react';
import { StatementAnalysis } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface StatsCardsProps {
  data: StatementAnalysis;
  onFilterTopCategory?: (category: string) => void;
  onFilterLargestExpense?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  data,
  onFilterTopCategory,
  onFilterLargestExpense,
}) => {
  // Find single largest expense transaction
  const expenses = data.transactions.filter((t) => t.type === 'EXPENSE');
  const largestSingleExpense = expenses.length > 0
    ? expenses.reduce((prev, current) => (prev.amount > current.amount ? prev : current))
    : null;

  const isNetPositive = data.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Entradas (Receitas) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total de Entradas
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            {formatCurrency(data.totalIncome, data.currency)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Depósitos, salários e transferências recebidas
        </p>
      </div>

      {/* Total Saídas (Despesas) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total de Gastos
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-rose-400 tracking-tight">
            {formatCurrency(data.totalExpenses, data.currency)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {expenses.length} pagamentos e débitos registrados
        </p>
      </div>

      {/* Saldo Líquido */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saldo do Período
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isNetPositive
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-2xl font-extrabold tracking-tight ${
            isNetPositive ? 'text-white' : 'text-rose-400'
          }`}>
            {formatCurrency(data.netBalance, data.currency)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {isNetPositive ? 'Superávit no período analisado' : 'Gastos excederam as entradas'}
        </p>
      </div>

      {/* Maior Gasto Único (Highlight Feature!) */}
      <div
        onClick={onFilterLargestExpense}
        className="bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-900/80 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm cursor-pointer hover:border-amber-400/50 transition group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Maior Gasto Único
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium group-hover:bg-amber-500/30 transition">
            Ver detalhes
          </span>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-amber-400 tracking-tight">
            {largestSingleExpense ? formatCurrency(largestSingleExpense.amount, data.currency) : 'R$ 0,00'}
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1 truncate">
          {largestSingleExpense ? largestSingleExpense.merchantOrRecipient || largestSingleExpense.description : 'Nenhuma despesa'}
        </p>
      </div>
    </div>
  );
};
