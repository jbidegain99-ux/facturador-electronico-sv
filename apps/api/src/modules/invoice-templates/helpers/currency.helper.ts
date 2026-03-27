const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: unknown): string {
  const num = Number(amount);
  if (isNaN(num)) return '$0.00';
  return formatter.format(num);
}
