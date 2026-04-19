import * as React from 'react';
import type { KardexRow } from '@/types/inventory';

export function KardexTable({ rows }: { rows: KardexRow[] }) {
  if (rows.length === 0) {
    return <p className="text-center text-gray-500 py-8">Sin movimientos en el rango seleccionado.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Fecha</th>
            <th className="text-right p-2">#</th>
            <th className="text-left p-2">Tipo</th>
            <th className="text-right p-2">Qty entrada</th>
            <th className="text-right p-2">Qty salida</th>
            <th className="text-right p-2">Costo unit.</th>
            <th className="text-right p-2">Costo total</th>
            <th className="text-right p-2">Saldo qty</th>
            <th className="text-right p-2">Costo prom.</th>
            <th className="text-right p-2">Saldo valor</th>
            <th className="text-left p-2">Documento</th>
            <th className="text-left p-2">Notas</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{new Date(r.movementDate).toLocaleDateString('es-SV')}</td>
              <td className="p-2 text-right font-mono">{r.correlativo}</td>
              <td className="p-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{r.movementType}</span></td>
              <td className="p-2 text-right">{r.qtyIn > 0 ? r.qtyIn.toFixed(4) : '—'}</td>
              <td className="p-2 text-right">{r.qtyOut > 0 ? r.qtyOut.toFixed(4) : '—'}</td>
              <td className="p-2 text-right">${r.unitCost.toFixed(4)}</td>
              <td className="p-2 text-right">${r.totalCost.toFixed(2)}</td>
              <td className="p-2 text-right font-medium">{r.balanceQty.toFixed(4)}</td>
              <td className="p-2 text-right">${r.balanceAvgCost.toFixed(4)}</td>
              <td className="p-2 text-right font-medium">${r.balanceValue.toFixed(2)}</td>
              <td className="p-2 text-xs text-gray-600">
                {r.documentType && r.documentNumber ? `${r.documentType} ${r.documentNumber}` : '—'}
              </td>
              <td className="p-2 text-xs text-gray-600">{r.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
