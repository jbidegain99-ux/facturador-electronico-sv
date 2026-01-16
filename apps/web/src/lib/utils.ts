import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getTipoDteName(tipo: string): string {
  const tipos: Record<string, string> = {
    '01': 'Factura',
    '03': 'Credito Fiscal',
    '05': 'Nota de Credito',
    '06': 'Nota de Debito',
  };
  return tipos[tipo] || tipo;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    PROCESANDO: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PROCESADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ANULADO: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    ERROR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
