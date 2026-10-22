export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Transaction {
  id: string;
  date: string; // e.g. "2024-10-15" or "15/10/2024"
  description: string;
  originalDescription?: string;
  amount: number; // positive number in BRL
  type: TransactionType;
  category: string;
  merchantOrRecipient: string;
  paymentMethod: string; // e.g. "PIX", "Cartão de Crédito", "Cartão de Débito", "Boleto", "TED", "Tarifa", "Outro"
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
  category?: string;
}

export interface RecurringExpense {
  name: string;
  amount: number;
  frequency?: string;
}

export interface StatementAnalysis {
  bankName: string;
  accountHolder?: string;
  period: {
    startDate: string;
    endDate: string;
  };
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  topExpenseCategory: string;
  transactions: Transaction[];
  summary: string;
  largestExpensesInsight: string;
  savingsTips: string[];
  recurringExpenses?: RecurringExpense[];
}

export interface FilterOptions {
  search: string;
  category: string;
  type: 'ALL' | 'EXPENSE' | 'INCOME';
  minAmount: number;
  maxAmount: number;
  sortBy: 'amount-desc' | 'amount-asc' | 'date-desc' | 'date-asc';
  onlyTopExpenses: boolean;
  topCount: number; // e.g. top 5, 10, 20
  selectedMerchant: string;
}
