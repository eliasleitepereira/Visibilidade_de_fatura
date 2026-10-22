import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { UploadZone } from './components/UploadZone.tsx';
import { StatsCards } from './components/StatsCards.tsx';
import { TopExpensesFilter } from './components/TopExpensesFilter.tsx';
import { MerchantRanking } from './components/MerchantRanking.tsx';
import { CategoryBreakdown } from './components/CategoryBreakdown.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { FinancialInsights } from './components/FinancialInsights.tsx';
import { ApiExplanationModal } from './components/ApiExplanationModal.tsx';
import { StatementAnalysis, Transaction } from './types.ts';
import { SAMPLE_NUBANK, SAMPLE_ITAU } from './data/sampleStatements.ts';
import { Building2, Calendar, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { formatDate } from './utils/formatters.ts';

export default function App() {
  const [statementData, setStatementData] = useState<StatementAnalysis | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'gemini_ai' | 'local_engine' | 'demo'>('gemini_ai');
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState(0);
  const [onlyTopExpenses, setOnlyTopExpenses] = useState(false);
  const [topCountFilter, setTopCountFilter] = useState(5);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>(undefined);

  // Upload & Analyze function
  const handleAnalyze = async (payload: {
    base64Data?: string;
    mimeType?: string;
    filename?: string;
    rawText?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error('O servidor respondeu com um formato inesperado. Por favor, tente novamente.');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Falha ao processar o extrato');
      }

      setStatementData(result.data);
      setAnalysisSource(result.source === 'local_engine' ? 'local_engine' : 'gemini_ai');
      setAnalysisNote(result.note || null);
      // Reset filter states
      setSelectedCategory('');
      setSelectedMerchant('');
      setMinAmountFilter(0);
      setOnlyTopExpenses(false);
      setSelectedTransactionId(undefined);
    } catch (err: any) {
      console.error('Error during statement analysis:', err);
      setErrorMessage(
        err.message || 'Não foi possível analisar o arquivo. Verifique se o PDF é válido e legível.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load Demo Samples
  const handleLoadSample = (sample: 'nubank' | 'itau') => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisNote(null);
    setTimeout(() => {
      if (sample === 'nubank') {
        setStatementData(SAMPLE_NUBANK);
      } else {
        setStatementData(SAMPLE_ITAU);
      }
      setAnalysisSource('demo');
      setSelectedCategory('');
      setSelectedMerchant('');
      setMinAmountFilter(0);
      setOnlyTopExpenses(false);
      setSelectedTransactionId(undefined);
      setIsLoading(false);
    }, 400);
  };

  const handleReset = () => {
    setStatementData(null);
    setAnalysisNote(null);
    setSelectedCategory('');
    setSelectedMerchant('');
    setMinAmountFilter(0);
    setOnlyTopExpenses(false);
    setSelectedTransactionId(undefined);
    setErrorMessage(null);
  };

  const handleClearValueFilters = () => {
    setMinAmountFilter(0);
    setOnlyTopExpenses(false);
    setSelectedTransactionId(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <Header
        hasData={Boolean(statementData)}
        onReset={handleReset}
        onOpenApiInfo={() => setIsApiModalOpen(true)}
        onLoadSample={handleLoadSample}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!statementData ? (
          <UploadZone
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            onLoadSample={handleLoadSample}
            errorMessage={errorMessage}
          />
        ) : (
          <div>
            {/* Statement Info Banner */}
            <div className="mb-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {statementData.bankName}
                    </h2>
                    {statementData.accountHolder && (
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                        {statementData.accountHolder}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Período: {statementData.period?.startDate} até {statementData.period?.endDate}
                    </span>
                    <span>•</span>
                    <span>{statementData.transactions.length} transações analisadas</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                    analysisSource === 'gemini_ai'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : analysisSource === 'local_engine'
                      ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
                      : 'bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {analysisSource === 'gemini_ai'
                    ? 'Processado via API Gemini 3.8 Flash'
                    : analysisSource === 'local_engine'
                    ? 'Motor Inteligente Local'
                    : 'Modo Demonstração'}
                </button>
              </div>
            </div>

            {/* Note banner if local fallback was used */}
            {analysisNote && (
              <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center justify-between">
                <span>⚡ {analysisNote}</span>
                <span className="text-[11px] text-teal-400/80">Todos os dados e filtros foram calculados com precisão.</span>
              </div>
            )}

            {/* 1. Stats Summary Cards */}
            <StatsCards
              data={statementData}
              onFilterTopCategory={(cat) => setSelectedCategory(cat)}
              onFilterLargestExpense={() => {
                setOnlyTopExpenses(true);
                setTopCountFilter(3);
              }}
            />

            {/* 2. CORE FEATURE: Top Expenses Filter (Maiores Gastos) */}
            <TopExpensesFilter
              data={statementData}
              minAmountFilter={minAmountFilter}
              setMinAmountFilter={setMinAmountFilter}
              topCountFilter={topCountFilter}
              setTopCountFilter={setTopCountFilter}
              onlyTopExpenses={onlyTopExpenses}
              setOnlyTopExpenses={setOnlyTopExpenses}
              selectedTransactionId={selectedTransactionId}
              onSelectTransaction={(tx) => setSelectedTransactionId(tx.id)}
              onClearFilters={handleClearValueFilters}
            />

            {/* 3. Category & Merchant Split Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MerchantRanking
                data={statementData}
                selectedMerchant={selectedMerchant}
                onSelectMerchant={(merchant) => setSelectedMerchant(merchant)}
              />

              <CategoryBreakdown
                data={statementData}
                selectedCategory={selectedCategory}
                onSelectCategory={(category) => setSelectedCategory(category)}
              />
            </div>

            {/* 4. Complete Transactions List & Interactive Search */}
            <div className="mb-8">
              <TransactionList
                data={statementData}
                selectedCategory={selectedCategory}
                onClearCategory={() => setSelectedCategory('')}
                selectedMerchant={selectedMerchant}
                onClearMerchant={() => setSelectedMerchant('')}
                minAmountFilter={minAmountFilter}
                onlyTopExpenses={onlyTopExpenses}
                topCountFilter={topCountFilter}
                highlightTransactionId={selectedTransactionId}
              />
            </div>

            {/* 5. Financial Insights & AI Assistant */}
            <FinancialInsights data={statementData} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ExtratoScan AI • Leitor e Extrator Inteligente de Extratos Bancários em PDF
          </span>
          <button
            type="button"
            onClick={() => setIsApiModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline"
          >
            Sobre o uso da API Gemini
          </button>
        </div>
      </footer>

      {/* API Explanation Modal */}
      <ApiExplanationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
}
