import React from 'react';
import { FileText, Sparkles, HelpCircle, RefreshCw, Upload, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  hasData: boolean;
  onReset: () => void;
  onOpenApiInfo: () => void;
  onLoadSample: (sample: 'nubank' | 'itau') => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasData,
  onReset,
  onOpenApiInfo,
  onLoadSample,
  isLoading,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <FileText className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ExtratoScan <span className="text-emerald-400">AI</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Análise inteligente de extratos em PDF &amp; Filtro dos maiores gastos
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Why API Button */}
          <button
            type="button"
            onClick={onOpenApiInfo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
            title="Entenda por que a API foi utilizada para ler os extratos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Por que usamos a API?
          </button>

          {/* Quick Demo Samples */}
          {!hasData && (
            <div className="flex items-center gap-1.5 bg-slate-800/50 p-1 rounded-lg border border-slate-700/60 text-xs">
              <span className="text-slate-400 px-2 font-medium">Testar com:</span>
              <button
                type="button"
                onClick={() => onLoadSample('nubank')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/30 font-medium transition disabled:opacity-50"
              >
                Nubank
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('itau')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 font-medium transition disabled:opacity-50"
              >
                Itaú
              </button>
            </div>
          )}

          {hasData && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Subir Outro PDF
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
