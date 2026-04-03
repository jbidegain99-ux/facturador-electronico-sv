'use client';

import * as React from 'react';
import { formatCurrency } from '@/lib/utils';
import type { QuoteLineItem } from './approval-types';

interface ApprovalLineItemsProps {
  lineItems: QuoteLineItem[];
  actionable: boolean;
  removedItems: Set<string>;
  onToggleRemoval: (id: string) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function ApprovalLineItems({
  lineItems,
  actionable,
  removedItems,
  onToggleRemoval,
  subtotal,
  taxAmount,
  total,
}: ApprovalLineItemsProps) {
  const hasRemovedItems = removedItems.size > 0;

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-lg font-semibold text-white">Items de la Cotizacion</h2>
        {actionable && <p className="text-gray-500 text-xs mt-1">Si desea eliminar algun item, marquelo con la casilla. Luego podra solicitar cambios.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {actionable && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Quitar</th>}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Desc.</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => {
              const isRemoved = removedItems.has(item.id);
              const wasRejected = item.approvalStatus === 'REJECTED';
              return (
                <tr key={item.id} className="transition-colors" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: isRemoved ? 'rgba(239,68,68,0.05)' : wasRejected && !actionable ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  {actionable && (
                    <td className="px-4 py-3">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input type="checkbox" checked={isRemoved} onChange={() => onToggleRemoval(item.id)} className="w-4 h-4 rounded border-border bg-background text-red-500 focus:ring-red-500/40 focus:ring-offset-0 cursor-pointer" />
                      </label>
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500 text-sm">{item.lineNumber}</td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-medium ${isRemoved || wasRejected ? 'text-gray-500 line-through' : 'text-white'}`}>{item.description}</p>
                    {item.itemCode && <p className="text-xs text-gray-500">{item.itemCode}</p>}
                    {wasRejected && !actionable && item.rejectionReason && <p className="text-xs text-red-400/70 mt-1">{item.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                  <td className={`px-4 py-3 text-right text-sm font-medium ${isRemoved ? 'text-gray-500 line-through' : 'text-white'}`}>{formatCurrency(item.lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        {lineItems.map((item) => {
          const isRemoved = removedItems.has(item.id);
          const wasRejected = item.approvalStatus === 'REJECTED';
          return (
            <div key={item.id} className="p-4" style={{ background: isRemoved ? 'rgba(239,68,68,0.05)' : 'transparent', borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-start gap-3">
                {actionable && (
                  <label className="flex items-center pt-1 cursor-pointer">
                    <input type="checkbox" checked={isRemoved} onChange={() => onToggleRemoval(item.id)} className="w-4 h-4 rounded border-border bg-background text-red-500 focus:ring-red-500/40 focus:ring-offset-0 cursor-pointer" />
                  </label>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isRemoved || wasRejected ? 'text-gray-500 line-through' : 'text-white'}`}>{item.description}</p>
                  {item.itemCode && <p className="text-xs text-gray-500 mt-0.5">{item.itemCode}</p>}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                    <span>Cant: {item.quantity}</span>
                    <span>Precio: {formatCurrency(item.unitPrice)}</span>
                    {item.discount > 0 && <span>Desc: {formatCurrency(item.discount)}</span>}
                  </div>
                </div>
                <p className={`text-sm font-medium flex-shrink-0 ${isRemoved ? 'text-gray-500 line-through' : 'text-white'}`}>{formatCurrency(item.lineTotal)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col items-end space-y-2">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-gray-300">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">IVA:</span>
              <span className="text-gray-300">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Total:</span>
              <span className="text-white font-semibold text-lg">{formatCurrency(total)}</span>
            </div>
            {hasRemovedItems && actionable && (
              <p className="text-xs text-orange-400 text-right mt-1">
                {removedItems.size} item{removedItems.size > 1 ? 's' : ''} marcado{removedItems.size > 1 ? 's' : ''} para eliminar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
