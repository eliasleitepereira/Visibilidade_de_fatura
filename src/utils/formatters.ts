export function formatCurrency(value: number, currency: string = 'BRL'): string {
  if (isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  // If already in DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;
  
  // If in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}

export function getCategoryColor(category: string): { bg: string; text: string; border: string; bar: string } {
  const cat = category.toLowerCase();
  if (cat.includes('moradia') || cat.includes('aluguel') || cat.includes('condomínio')) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', bar: 'bg-amber-500' };
  }
  if (cat.includes('alimentação') || cat.includes('supermercado') || cat.includes('refeição') || cat.includes('ifood')) {
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', bar: 'bg-emerald-500' };
  }
  if (cat.includes('transporte') || cat.includes('veículo') || cat.includes('uber') || cat.includes('posto') || cat.includes('combustível')) {
    return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/30', bar: 'bg-blue-500' };
  }
  if (cat.includes('saúde') || cat.includes('farmácia') || cat.includes('médic')) {
    return { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/30', bar: 'bg-rose-500' };
  }
  if (cat.includes('lazer') || cat.includes('assinatura') || cat.includes('streaming') || cat.includes('netflix')) {
    return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', bar: 'bg-purple-500' };
  }
  if (cat.includes('educação') || cat.includes('escola') || cat.includes('curso') || cat.includes('livro')) {
    return { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/30', bar: 'bg-cyan-500' };
  }
  if (cat.includes('compras') || cat.includes('eletrônico') || cat.includes('shopping')) {
    return { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/30', bar: 'bg-indigo-500' };
  }
  if (cat.includes('tarifa') || cat.includes('serviço financeiro') || cat.includes('iof') || cat.includes('banco')) {
    return { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30', bar: 'bg-orange-500' };
  }
  if (cat.includes('salário') || cat.includes('receita') || cat.includes('rendimento')) {
    return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/30', bar: 'bg-green-500' };
  }
  return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', bar: 'bg-slate-500' };
}
