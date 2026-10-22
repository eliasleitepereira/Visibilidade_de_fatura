import React from 'react';
import { PieChart, Layers, Check } from 'lucide-react';
import { StatementAnalysis } from '../types.ts';
import { formatCurrency, getCategoryColor } from '../utils/formatters.ts';

interface CategoryBreakdownProps {
  data: StatementAnalysis;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  selectedCategory,
  onSelectCategory,
}) => {
  // Aggregate expenses by category
  const categoryMap: { [key: string]: { total: number; count: number } } = {};

  data.transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const cat = t.category || 'Outros';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, count: 0 };
      }
      categoryMap[cat].total += t.amount;
      categoryMap[cat].count += 1;
    });

  const categories = Object.entries(categoryMap)
    .map(([cat, details]) => ({
      category: cat,
      total: details.total,
      count: details.count,
      percentage: data.totalExpenses > 0 ? (details.total / data.totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  if (categories.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Gastos por Categoria
              </h4>
              <p className="text-xs text-slate-400">
                Divisão percentual do seu dinheiro no extrato
              </p>
            </div>
          </div>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {/* Stacked Bar Visualizer */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800 mb-4 shadow-inner">
          {categories.map((cat, idx) => {
            const color = getCategoryColor(cat.category);
            return (
              <div
                key={idx}
                className={`${color.bar} transition-all duration-300`}
                style={{ width: `${cat.percentage}%` }}
                title={`${cat.category}: ${formatCurrency(cat.total, data.currency)} (${cat.percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Category List */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory.toLowerCase() === cat.category.toLowerCase();
            const color = getCategoryColor(cat.category);

            return (
              <div
                key={idx}
                onClick={() => onSelectCategory(isSelected ? '' : cat.category)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                    : 'bg-slate-950/40 hover:bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.bar}`} />
                  <span className="font-semibold text-slate-200 truncate">
                    {cat.category}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({cat.count})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(cat.total, data.currency)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 w-12 text-right">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-4 pt-3 border-t border-slate-800/60">
        💡 Clique em qualquer categoria para isolar apenas as despesas dela.
      </p>
    </div>
  );
};
