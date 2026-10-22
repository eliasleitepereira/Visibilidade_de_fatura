import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, ArrowRight, Sparkles, CheckCircle2, AlertTriangle, FileSpreadsheet, ClipboardList } from 'lucide-react';

interface UploadZoneProps {
  onAnalyze: (payload: { base64Data?: string; mimeType?: string; filename?: string; rawText?: string }) => void;
  isLoading: boolean;
  onLoadSample: (sample: 'nubank' | 'itau') => void;
  errorMessage?: string | null;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyze,
  isLoading,
  onLoadSample,
  errorMessage,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [rawText, setRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    // Check if it's PDF or image
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, envie um arquivo em formato PDF ou imagem (PNG, JPG) do seu extrato.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite de 25MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'upload' && fileBase64 && selectedFile) {
      onAnalyze({
        base64Data: fileBase64,
        mimeType: selectedFile.type || 'application/pdf',
        filename: selectedFile.name,
      });
    } else if (activeTab === 'text' && rawText.trim()) {
      onAnalyze({
        rawText: rawText.trim(),
        filename: 'extrato-colado.txt',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Análise de Extratos com Inteligência Artificial
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Suba seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Extrato Bancário</span> em PDF
        </h2>
        <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Descubra instantaneamente para onde seu dinheiro foi, veja a categorização completa
          e <strong className="text-emerald-400 font-semibold">filtre exatamente onde você teve os maiores gastos</strong>.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Tab switch (File Upload vs Paste Text) */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Enviar Arquivo PDF / Imagem
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition ${
              activeTab === 'text'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Colar Texto do Extrato
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div>
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                    <FileText className="w-8 h-8" />
                  </div>
                  <span className="text-white font-semibold text-lg">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar de arquivo
                  </span>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Arquivo pronto para análise
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-4 group-hover:scale-105 transition shadow-inner">
                    <UploadCloud className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Arraste e solte o PDF do extrato aqui
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm">
                    Ou clique para selecionar do seu computador ou celular.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                    <span className="bg-slate-800 px-2 py-1 rounded">PDF</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Nubank</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Itaú</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Bradesco</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Inter</span>
                    <span className="bg-slate-800 px-2 py-1 rounded">Santander / BB / Caixa</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cole abaixo as linhas ou texto copiado do seu Internet Banking:
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Exemplo:&#10;05/10 PIX ENVIADO IMOBILIARIA ALIANCA R$ 1.850,00&#10;07/10 COMPRA CARTAO PAO DE ACUCAR R$ 420,50&#10;10/10 TED RECEBIDA SALARIO EMPRESA R$ 6.500,00"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Ocorreu um erro ao processar o extrato:</p>
              <p className="text-xs text-red-200/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Seus dados são processados de forma confidencial e segura
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (activeTab === 'upload' ? !fileBase64 : !rawText.trim())}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Analisando extrato com IA...</span>
              </>
            ) : (
              <>
                <span>Processar e Filtrar Gastos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Loading Indicator Steps */}
        {isLoading && (
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Inteligência Artificial Gemini 3.8 Flash em Execução
              </span>
              <span className="text-xs text-slate-400">Processando documento...</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Lendo tabelas, identificando PIX, débitos, créditos e classificando seus maiores gastos...
            </p>
          </div>
        )}

        {/* Quick Demo Sample Option */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>Não tem um PDF em mãos agora? Experimente um extrato de demonstração:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLoadSample('nubank')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
            >
              Exemplo Nubank
            </button>
            <button
              type="button"
              onClick={() => onLoadSample('itau')}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition"
            >
              Exemplo Itaú Uniclass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
