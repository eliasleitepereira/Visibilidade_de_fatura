import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Download, Filter, Flame, ArrowUpRight, ArrowDownRight, Tag, CreditCard } from 'lucide-react';
import { Transaction, StatementAnalysis } from '../types.ts';
import { formatCurrency, formatDate, getCategoryColor } from '../utils/formatters.ts';

interface TransactionListProps {
  data: StatementAnalysis;
  selectedCategory: string;
  onClearCategory: () => void;
  selectedMerchant: string;
  onClearMerchant: () => void;
  minAmountFilter: number;
  onlyTopExpenses: boolean;
  topCountFilter: number;
  highlightTransactionId?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  data,
  selectedCategory,
  onClearCategory,
  selectedMerchant,
  onClearMerchant,
  minAmountFilter,
  onlyTopExpenses,
  topCountFilter,
  highlightTransactionId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [sortBy, setSortBy] = useState<'amount-desc' | 'amount-asc' | 'date-desc' | 'date-asc'>('amount-desc');

  // Identify top 5 overall expenses for visual highlight badges
  const top5Ids = useMemo(() => {
    return data.transactions
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => t.id);
  }, [data.transactions]);

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = [...data.transactions];

    // Filter by type
    if (typeFilter !== 'ALL') {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Filter by search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.merchantOrRecipient.toLowerCase().includes(q) ||
          (t.originalDescription && t.originalDescription.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (selectedCategory) {
      result = result.filter((t) => t.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by merchant
    if (selectedMerchant) {
      result = result.filter(
        (t) =>
          t.merchantOrRecipient.toLowerCase().includes(selectedMerchant.toLowerCase()) ||
          t.description.toLowerCase().includes(selectedMerchant.toLowerCase())
      );
    }

    // Filter by minimum amount
    if (minAmountFilter > 0) {
      result = result.filter((t) => t.amount >= minAmountFilter);
    }

    // Filter by top count
    if (onlyTopExpenses) {
      result = result
        .filter((t) => t.type === 'EXPENSE')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, topCountFilter);
      return result; // already sorted
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });

    return result;
  }, [
    data.transactions,
    searchTerm,
    typeFilter,
    selectedCategory,
    selectedMerchant,
    minAmountFilter,
    onlyTopExpenses,
    topCountFilter,
    sortBy,
  ]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descricao', 'Estabelecimento', 'Categoria', 'Metodo', 'Valor (R$)'];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.date),
      tx.type === 'EXPENSE' ? 'Despesa' : 'Receita',
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.merchantOrRecipient.replace(/"/g, '""')}"`,
      `"${tx.category.replace(/"/g, '""')}"`,
      `"${tx.paymentMethod.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2).replace('.', ','),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_${data.bankName.toLowerCase()}_analisado.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Lançamentos do Extrato
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              {filteredTransactions.length} de {data.transactions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize, ordene e busque entre todos os débitos e créditos extraídos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, loja, categoria ou PIX..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter by Type */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              typeFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('EXPENSE')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              typeFilter === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gastos (Saídas)
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('INCOME')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              typeFilter === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Entradas
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="amount-desc">Maior Valor (Decrescente)</option>
            <option value="amount-asc">Menor Valor (Crescente)</option>
            <option value="date-desc">Data Mais Recente</option>
            <option value="date-asc">Data Mais Antiga</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {(selectedCategory || selectedMerchant || minAmountFilter > 0 || onlyTopExpenses) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Filtros ativos:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Categoria: {selectedCategory}
              <button type="button" onClick={onClearCategory} className="hover:text-white ml-1">✕</button>
            </span>
          )}
          {selectedMerchant && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Estabelecimento: {selectedMerchant}
              <button type="button" onClick={onClearMerchant} className="hover:text-white ml-1">✕</button>
            </span>
          )}
          {minAmountFilter > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Valor ≥ {formatCurrency(minAmountFilter, data.currency)}
            </span>
          )}
          {onlyTopExpenses && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Top {topCountFilter} Maiores Gastos
            </span>
          )}
        </div>
      )}

      {/* Transactions Table / Cards */}
      <div className="mt-4 overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-slate-800">
            <p className="text-sm font-semibold text-slate-300">Nenhum lançamento encontrado com estes filtros.</p>
            <p className="text-xs text-slate-500 mt-1">Tente remover alguns filtros ou ajustar a busca.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Descrição / Estabelecimento</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Forma de Pagto</th>
                <th className="py-3 px-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                const isTop5 = isExpense && top5Ids.includes(tx.id);
                const isHighlighted = highlightTransactionId === tx.id;
                const catColor = getCategoryColor(tx.category);

                return (
                  <tr
                    key={tx.id}
                    className={`transition hover:bg-slate-800/40 ${
                      isHighlighted ? 'bg-amber-950/30 border-l-2 border-l-amber-400' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400 font-mono">
                      {formatDate(tx.date)}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                          isExpense ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isExpense ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{tx.description}</span>
                            {isTop5 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Flame className="w-2.5 h-2.5" />
                                Top Gasto
                              </span>
                            )}
                          </div>
                          {tx.originalDescription && tx.originalDescription !== tx.description && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {tx.originalDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        {tx.paymentMethod}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 whitespace-nowrap text-right font-mono font-bold text-sm">
                      <span className={isExpense ? 'text-rose-400' : 'text-emerald-400'}>
                        {isExpense ? '- ' : '+ '}
                        {formatCurrency(tx.amount, data.currency)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
