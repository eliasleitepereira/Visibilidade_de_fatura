import React from 'react';
import { Store, TrendingDown, ArrowRight, Check } from 'lucide-react';
import { Transaction, StatementAnalysis } from '../types.ts';
import { formatCurrency } from '../utils/formatters.ts';

interface MerchantRankingProps {
  data: StatementAnalysis;
  selectedMerchant: string;
  onSelectMerchant: (merchant: string) => void;
}

export const MerchantRanking: React.FC<MerchantRankingProps> = ({
  data,
  selectedMerchant,
  onSelectMerchant,
}) => {
  // Aggregate expenses by merchantOrRecipient
  const merchantMap: { [key: string]: { total: number; count: number; category: string } } = {};

  data.transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const name = (t.merchantOrRecipient || t.description).trim();
      if (!merchantMap[name]) {
        merchantMap[name] = { total: 0, count: 0, category: t.category };
      }
      merchantMap[name].total += t.amount;
      merchantMap[name].count += 1;
    });

  const sortedMerchants = Object.entries(merchantMap)
    .map(([merchant, details]) => ({
      merchant,
      total: details.total,
      count: details.count,
      category: details.category,
      percentage: data.totalExpenses > 0 ? (details.total / data.totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6); // Top 6 merchants

  if (sortedMerchants.length === 0) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Onde Você Mais Gastou
              </h4>
              <p className="text-xs text-slate-400">
                Lojas e recebedores com maior volume financeiro
              </p>
            </div>
          </div>
          {selectedMerchant && (
            <button
              type="button"
              onClick={() => onSelectMerchant('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Ver todos
            </button>
          )}
        </div>

        <div className="space-y-3">
          {sortedMerchants.map((item, idx) => {
            const isSelected = selectedMerchant.toLowerCase() === item.merchant.toLowerCase();
            return (
              <div
                key={idx}
                onClick={() => onSelectMerchant(isSelected ? '' : item.merchant)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-slate-950/50 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.merchant}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.count} {item.count === 1 ? 'lançamento' : 'lançamentos'} • {item.percentage.toFixed(1)}% do total
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-rose-400">
                    {formatCurrency(item.total, data.currency)}
                  </span>
                  <div className="w-20 bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-1 rounded-full"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-4 pt-3 border-t border-slate-800/60">
        💡 Clique em qualquer estabelecimento para filtrar os lançamentos abaixo.
      </p>
    </div>
  );
};
