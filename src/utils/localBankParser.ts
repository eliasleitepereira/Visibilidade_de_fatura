import { StatementAnalysis, Transaction } from '../types.ts';

export function parseBankStatementText(text: string): StatementAnalysis {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Detect Bank Name
  let bankName = 'Extrato Bancário';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('nubank') || lowerText.includes('nu pagamentos')) bankName = 'Nubank';
  else if (lowerText.includes('itau') || lowerText.includes('itaú') || lowerText.includes('uniclass')) bankName = 'Banco Itaú';
  else if (lowerText.includes('bradesco')) bankName = 'Bradesco';
  else if (lowerText.includes('inter') || lowerText.includes('banco inter')) bankName = 'Banco Inter';
  else if (lowerText.includes('santander')) bankName = 'Santander';
  else if (lowerText.includes('caixa') || lowerText.includes('cef')) bankName = 'Caixa Econômica Federal';
  else if (lowerText.includes('banco do brasil') || lowerText.includes('bb.com.br')) bankName = 'Banco do Brasil';
  else if (lowerText.includes('c6') || lowerText.includes('c6bank')) bankName = 'C6 Bank';
  else if (lowerText.includes('btg')) bankName = 'BTG Pactual';

  // 2. Detect Account Holder
  let accountHolder = 'Titular da Conta';
  for (const line of lines) {
    const match = line.match(/(?:nome|titular|cliente|correntista)[:\s]+([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,40})/i);
    if (match && match[1]) {
      accountHolder = match[1].trim();
      break;
    }
  }

  // 3. Parse Transactions
  const transactions: Transaction[] = [];
  const dateRegex = /\b(\d{2}[/-]\d{2}(?:[/-]\d{2,4})?)\b/;
  const amountRegex = /(?:R\$\s*)?([+-]?\s*\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(?:\s*([DCdc]))?/;

  const detectedDates: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains a date and an amount
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);

    if (dateMatch && amountMatch) {
      let rawDate = dateMatch[1].replace(/-/g, '/');
      if (rawDate.length === 5) {
        // e.g. "15/10" -> "15/10/2024"
        const currentYear = new Date().getFullYear();
        rawDate = `${rawDate}/${currentYear}`;
      }
      detectedDates.push(rawDate);

      // Parse amount string to number
      let rawAmountStr = amountMatch[1].replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
      let amountVal = Math.abs(parseFloat(rawAmountStr));
      if (isNaN(amountVal) || amountVal === 0) continue;

      // Extract description
      let desc = line
        .replace(dateMatch[0], '')
        .replace(amountMatch[0], '')
        .replace(/\b(R\$|BRL|D|C)\b/gi, '')
        .trim();

      if (!desc || desc.length < 2) {
        // Look in adjacent line if description was on previous or next line
        if (i > 0 && lines[i - 1].length > 3 && !lines[i - 1].match(dateRegex)) {
          desc = lines[i - 1];
        } else if (i < lines.length - 1 && lines[i + 1].length > 3 && !lines[i + 1].match(dateRegex)) {
          desc = lines[i + 1];
        } else {
          desc = 'Lançamento Bancário';
        }
      }

      // Determine Type (EXPENSE vs INCOME)
      const descLower = desc.toLowerCase();
      const lineLower = line.toLowerCase();
      const isExplicitDebit =
        amountMatch[2]?.toUpperCase() === 'D' ||
        amountMatch[0].includes('-') ||
        line.includes('(-)') ||
        descLower.includes('pix enviado') ||
        descLower.includes('compra') ||
        descLower.includes('pagamento') ||
        descLower.includes('pagto') ||
        descLower.includes('boleto') ||
        descLower.includes('debito') ||
        descLower.includes('débito') ||
        descLower.includes('tarifa') ||
        descLower.includes('saque');

      const isExplicitCredit =
        amountMatch[2]?.toUpperCase() === 'C' ||
        amountMatch[0].includes('+') ||
        descLower.includes('salario') ||
        descLower.includes('salário') ||
        descLower.includes('pix recebido') ||
        descLower.includes('ted recebida') ||
        descLower.includes('transferencia recebida') ||
        descLower.includes('transferência recebida') ||
        descLower.includes('deposito') ||
        descLower.includes('depósito') ||
        descLower.includes('estorno') ||
        descLower.includes('rendimento');

      const isExpense = isExplicitCredit ? false : isExplicitDebit ? true : true; // default to expense if ambiguous
      const type = isExpense ? 'EXPENSE' : 'INCOME';

      // Clean merchant name
      let merchant = desc
        .replace(/^(pix\s*(enviado|recebido)|ted|doc|compra\s*(cartao|debito|credito)?|pagto|pagamento|boleto|debito\s*automatico)\s*[:\-]?\s*/i, '')
        .replace(/\b(cnpj|cpf|agencia|conta|aut\.|doc\.|terminal)\b.*$/i, '')
        .trim();

      if (!merchant) merchant = desc;

      // Classify Category
      let category = 'Outros';
      const mLower = (desc + ' ' + merchant).toLowerCase();

      if (
        mLower.includes('mercado') ||
        mLower.includes('supermercado') ||
        mLower.includes('pao de acucar') ||
        mLower.includes('carrefour') ||
        mLower.includes('assai') ||
        mLower.includes('atacad') ||
        mLower.includes('ifood') ||
        mLower.includes('restaurante') ||
        mLower.includes('lanchonete') ||
        mLower.includes('padaria') ||
        mLower.includes('sabor') ||
        mLower.includes('alimento') ||
        mLower.includes('acougue')
      ) {
        category = 'Alimentação & Supermercado';
      } else if (
        mLower.includes('aluguel') ||
        mLower.includes('imobiliaria') ||
        mLower.includes('condominio') ||
        mLower.includes('enel') ||
        mLower.includes('luz') ||
        mLower.includes('agua') ||
        mLower.includes('energia') ||
        mLower.includes('claro') ||
        mLower.includes('vivo') ||
        mLower.includes('internet') ||
        mLower.includes('gas') ||
        mLower.includes('iptu') ||
        mLower.includes('residencia')
      ) {
        category = 'Moradia & Contas';
      } else if (
        mLower.includes('uber') ||
        mLower.includes('99') ||
        mLower.includes('posto') ||
        mLower.includes('gasolina') ||
        mLower.includes('combustivel') ||
        mLower.includes('shell') ||
        mLower.includes('ipiranga') ||
        mLower.includes('petrobras') ||
        mLower.includes('estacionamento') ||
        mLower.includes('oficina') ||
        mLower.includes('mecanica') ||
        mLower.includes('porto seguro') ||
        mLower.includes('ipva') ||
        mLower.includes('pedagio') ||
        mLower.includes('sem parar')
      ) {
        category = 'Transporte & Veículo';
      } else if (
        mLower.includes('farmacia') ||
        mLower.includes('drogasil') ||
        mLower.includes('droga') ||
        mLower.includes('drogaria') ||
        mLower.includes('pague menos') ||
        mLower.includes('unimed') ||
        mLower.includes('saude') ||
        mLower.includes('hospital') ||
        mLower.includes('clinica') ||
        mLower.includes('medico') ||
        mLower.includes('smart fit') ||
        mLower.includes('academia')
      ) {
        category = 'Saúde & Bem-estar';
      } else if (
        mLower.includes('netflix') ||
        mLower.includes('spotify') ||
        mLower.includes('amazon prime') ||
        mLower.includes('hbo') ||
        mLower.includes('disney') ||
        mLower.includes('cinema') ||
        mLower.includes('steam') ||
        mLower.includes('game')
      ) {
        category = 'Lazer & Assinaturas';
      } else if (
        mLower.includes('mercado livre') ||
        mLower.includes('shopee') ||
        mLower.includes('magalu') ||
        mLower.includes('magazine') ||
        mLower.includes('amazon') ||
        mLower.includes('aliexpress') ||
        mLower.includes('zara') ||
        mLower.includes('roupa')
      ) {
        category = 'Compras & Eletrônicos';
      } else if (
        mLower.includes('escola') ||
        mLower.includes('colegio') ||
        mLower.includes('faculdade') ||
        mLower.includes('curso') ||
        mLower.includes('livraria') ||
        mLower.includes('livro') ||
        mLower.includes('cultura')
      ) {
        category = 'Educação & Livros';
      } else if (
        mLower.includes('tarifa') ||
        mLower.includes('iof') ||
        mLower.includes('anuidade') ||
        mLower.includes('juros') ||
        mLower.includes('cheque especial')
      ) {
        category = 'Serviços Financeiros & Tarifas';
      } else if (
        mLower.includes('salario') ||
        mLower.includes('provento') ||
        mLower.includes('remuneracao') ||
        mLower.includes('ted recebida')
      ) {
        category = 'Salário & Receitas';
      } else if (mLower.includes('pix')) {
        category = isExpense ? 'Transferências Enviadas' : 'Transferências Recebidas';
      }

      // Detect Payment Method
      let paymentMethod = 'Outro';
      if (mLower.includes('pix')) paymentMethod = 'PIX';
      else if (mLower.includes('boleto')) paymentMethod = 'Boleto';
      else if (mLower.includes('debito') || mLower.includes('débito')) paymentMethod = 'Cartão de Débito';
      else if (mLower.includes('credito') || mLower.includes('crédito')) paymentMethod = 'Cartão de Crédito';
      else if (mLower.includes('ted') || mLower.includes('doc')) paymentMethod = 'TED/DOC';
      else if (mLower.includes('tarifa')) paymentMethod = 'Tarifa';
      else if (mLower.includes('saque')) paymentMethod = 'Saque';
      else if (isExpense) paymentMethod = 'Cartão / Débito';

      transactions.push({
        id: `local-tx-${Date.now()}-${transactions.length}`,
        date: rawDate,
        description: desc,
        originalDescription: line,
        amount: amountVal,
        type,
        category,
        merchantOrRecipient: merchant,
        paymentMethod,
      });
    }
  }

  // Fallback if no specific transactions could be matched
  if (transactions.length === 0) {
    // Return sample Nubank structure with note
    return {
      bankName: `${bankName} (Pré-visualização)`,
      accountHolder,
      period: { startDate: 'Início do Mês', endDate: 'Fim do Mês' },
      currency: 'BRL',
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      topExpenseCategory: 'Diversos',
      largestExpensesInsight: 'Não foi possível extrair linhas estruturadas de valor do texto fornecido. Tente enviar o arquivo original em PDF legível ou colar o texto direto do Internet Banking.',
      summary: 'Arquivo de extrato lido, mas as linhas de valores não puderam ser identificadas automaticamente.',
      savingsTips: ['Certifique-se de que o PDF não está bloqueado por senha.', 'Você também pode usar a aba "Colar Texto" para colar os dados diretamente.'],
      transactions: [],
    };
  }

  // Calculate Totals
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Category Aggregation
  const catMap: { [cat: string]: number } = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const topExpenseCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : 'Diversos';

  // Largest Expenses Ranking
  const sortedExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .sort((a, b) => b.amount - a.amount);

  const top3 = sortedExpenses.slice(0, 3);
  const top3Sum = top3.reduce((s, t) => s + t.amount, 0);
  const top3Pct = totalExpenses > 0 ? (top3Sum / totalExpenses) * 100 : 0;

  const largestExpensesInsight = top3.length > 0
    ? `Seus 3 maiores gastos somam R$ ${top3Sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e representam ${top3Pct.toFixed(1)}% de todas as despesas: ${top3.map((t) => `${t.merchantOrRecipient} (R$ ${t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`).join(', ')}. A categoria com maior peso no seu bolso foi ${topExpenseCategory}.`
    : 'Nenhum gasto significativo foi identificado no período.';

  // Savings Tips
  const savingsTips: string[] = [];
  if (topExpenseCategory) {
    savingsTips.push(`Sua principal despesa foi em "${topExpenseCategory}". Tente definir um teto semanal para essa categoria.`);
  }
  if (sortedExpenses.length > 5) {
    savingsTips.push('Identificamos múltiplos lançamentos menores. Gastos frequentes de baixo valor costumam somar valores altos no fim do mês.');
  }

  // Recurring detection
  const recurringExpenses = sortedExpenses.slice(0, 4).map((t) => ({
    name: t.merchantOrRecipient,
    amount: t.amount,
    frequency: 'Mensal provável',
  }));

  const startDate = detectedDates[0] || '01/--/----';
  const endDate = detectedDates[detectedDates.length - 1] || '30/--/----';

  return {
    bankName,
    accountHolder,
    period: { startDate, endDate },
    currency: 'BRL',
    totalIncome,
    totalExpenses,
    netBalance,
    topExpenseCategory,
    largestExpensesInsight,
    summary: `Extrato processado com ${transactions.length} lançamentos. Saldo do período de R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    savingsTips,
    recurringExpenses,
    transactions,
  };
}
