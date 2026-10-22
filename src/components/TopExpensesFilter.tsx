import React from 'react';
import { Flame, Trophy, SlidersHorizontal, Filter, AlertCircle, ArrowDownCircle, Check, X } from 'lucide-react';
import { Transaction, StatementAnalysis } from '../types.ts';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters.ts';

interface TopExpensesFilterProps {
  data: StatementAnalysis;
  minAmountFilter: number;
  setMinAmountFilter: (val: number) => void;
  topCountFilter: number;
  setTopCountFilter: (count: number) => void;
  onlyTopExpenses: boolean;
  setOnlyTopExpenses: (val: boolean) => void;
  onSelectTransaction: (tx: Transaction) => void;
  selectedTransactionId?: string;
  onClearFilters: () => void;
}

export const TopExpensesFilter: React.FC<TopExpensesFilterProps> = ({
  data,
  minAmountFilter,
  setMinAmountFilter,
  topCountFilter,
  setTopCountFilter,
  onlyTopExpenses,
  setOnlyTopExpenses,
  onSelectTransaction,
  selectedTransactionId,
  onClearFilters,
}) => {
  // Sort all expenses by amount descending
  const sortedExpenses = [...data.transactions]
    .filter((t) => t.type === 'EXPENSE')
    .sort((a, b) => b.amount - a.amount);

  const top3 = sortedExpenses.slice(0, 3);
  const top3Total = top3.reduce((acc, curr) => acc + curr.amount, 0);
  const top3Percentage = data.totalExpenses > 0 ? (top3Total / data.totalExpenses) * 100 : 0;

  // Max expense amount for range slider
  const maxExpenseAmount = sortedExpenses.length > 0 ? sortedExpenses[0].amount : 1000;

  // Predefined quick thresholds
  const presets = [
    { label: 'Todos os Gastos', action: () => { setMinAmountFilter(0); setOnlyTopExpenses(false); } },
    { label: 'Top 3 Maiores', action: () => { setTopCountFilter(3); setOnlyTopExpenses(true); } },
    { label: 'Top 5 Maiores', action: () => { setTopCountFilter(5); setOnlyTopExpenses(true); } },
    { label: 'Top 10 Maiores', action: () => { setTopCountFilter(10); setOnlyTopExpenses(true); } },
    { label: 'Acima de R$ 100', action: () => { setMinAmountFilter(100); setOnlyTopExpenses(false); } },
    { label: 'Acima de R$ 500', action: () => { setMinAmountFilter(500); setOnlyTopExpenses(false); } },
    { label: 'Acima de R$ 1.000', action: () => { setMinAmountFilter(1000); setOnlyTopExpenses(false); } },
  ];

  const hasActiveFilter = minAmountFilter > 0 || onlyTopExpenses;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 backdrop-blur-sm shadow-xl">
      {/* Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Filtro dos Maiores Gastos
            </h3>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
              Foco do seu Pedido
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Isole e investigue as despesas que mais consumiram seu orçamento neste período.
          </p>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={onClearFilters}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <X className="w-3.5 h-3.5" />
            Limpar Filtros de Valor
          </button>
        )}
      </div>

      {/* Top 3 Spotlight Podium */}
      {top3.length > 0 && (
        <div className="mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Pódio: Onde Você Mais Gastou
            </span>
            <span className="text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Os 3 maiores equivalem a {top3Percentage.toFixed(1)}% do total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3.map((tx, idx) => {
              const medal = idx === 0 ? '🥇 1º Maior Gasto' : idx === 1 ? '🥈 2º Maior Gasto' : '🥉 3º Maior Gasto';
              const percentOfTotal = data.totalExpenses > 0 ? (tx.amount / data.totalExpenses) * 100 : 0;
              const catColor = getCategoryColor(tx.category);
              const isSelected = selectedTransactionId === tx.id;

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.01]'
                      : 'bg-slate-950/60 hover:bg-slate-950/90 border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-amber-400">{medal}</span>
                    <span className="text-slate-400">{percentOfTotal.toFixed(1)}% do mês</span>
                  </div>

                  <div className="text-lg font-extrabold text-white tracking-tight truncate">
                    {formatCurrency(tx.amount, data.currency)}
                  </div>

                  <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                    {tx.merchantOrRecipient || tx.description}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                      {tx.category}
                    </span>
                    <span className="text-slate-400 ml-auto">
                      {formatDate(tx.date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Controls: Quick Presets & Minimum Amount Slider */}
      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          Filtros Rápidos de Impacto
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {presets.map((preset, index) => {
            const isActive =
              (preset.label === 'Todos os Gastos' && !onlyTopExpenses && minAmountFilter === 0) ||
              (preset.label === 'Top 3 Maiores' && onlyTopExpenses && topCountFilter === 3) ||
              (preset.label === 'Top 5 Maiores' && onlyTopExpenses && topCountFilter === 5) ||
              (preset.label === 'Top 10 Maiores' && onlyTopExpenses && topCountFilter === 10) ||
              (preset.label === 'Acima de R$ 100' && minAmountFilter === 100 && !onlyTopExpenses) ||
              (preset.label === 'Acima de R$ 500' && minAmountFilter === 500 && !onlyTopExpenses) ||
              (preset.label === 'Acima de R$ 1.000' && minAmountFilter === 1000 && !onlyTopExpenses);

            return (
              <button
                key={index}
                type="button"
                onClick={preset.action}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Minimum Value Slider */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">
              Filtrar despesas com valor mínimo:
            </span>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md">
            <input
              type="range"
              min={0}
              max={Math.ceil(maxExpenseAmount)}
              step={10}
              value={minAmountFilter}
              onChange={(e) => {
                setMinAmountFilter(Number(e.target.value));
                setOnlyTopExpenses(false);
              }}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-xs font-bold text-emerald-400 min-w-[90px] text-right font-mono">
              ≥ {formatCurrency(minAmountFilter, data.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
