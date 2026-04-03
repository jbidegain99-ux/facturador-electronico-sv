'use client';

import * as React from 'react';
import { Spinner, CheckIcon, XIcon } from './ApprovalIcons';

interface ApprovalFormProps {
  hasRemovedItems: boolean;
  removedItemsCount: number;
  submitting: boolean;
  approverName: string;
  setApproverName: (v: string) => void;
  approverEmail: string;
  setApproverEmail: (v: string) => void;
  comments: string;
  setComments: (v: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onOpenReject: () => void;
}

export function ApprovalForm({
  hasRemovedItems,
  removedItemsCount,
  submitting,
  approverName, setApproverName,
  approverEmail, setApproverEmail,
  comments, setComments,
  onApprove,
  onRequestChanges,
  onOpenReject,
}: ApprovalFormProps) {
  return (
    <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h2 className="text-lg font-semibold text-white mb-1">Tu Respuesta</h2>
      <p className="text-gray-500 text-xs mb-5">
        {hasRemovedItems
          ? 'Has marcado items para eliminar. Describe los cambios que necesitas y envialos al proveedor.'
          : 'Aprueba la cotizacion tal como esta, solicita cambios, o rechazala.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Nombre <span className="text-red-400">*</span></label>
          <input type="text" value={approverName} onChange={(e) => setApproverName(e.target.value)} placeholder="Tu nombre completo" required
            className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Correo electronico <span className="text-red-400">*</span></label>
          <input type="email" value={approverEmail} onChange={(e) => setApproverEmail(e.target.value)} placeholder="tu@correo.com" required
            className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          {hasRemovedItems ? 'Comentarios sobre los cambios *' : 'Comentarios (opcional)'}
        </label>
        <textarea value={comments} onChange={(e) => setComments(e.target.value)}
          placeholder={hasRemovedItems ? 'Explique que cambios necesita en la cotizacion...' : 'Agrega notas o comentarios adicionales...'}
          rows={3}
          className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: hasRemovedItems ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasRemovedItems ? (
          <button type="button" onClick={onRequestChanges} disabled={submitting || !comments.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ background: submitting ? '#92400e' : 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {submitting ? <Spinner className="h-4 w-4" /> : (
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            )}
            Solicitar Cambios ({removedItemsCount} item{removedItemsCount > 1 ? 's' : ''} a eliminar)
          </button>
        ) : (
          <button type="button" onClick={onApprove} disabled={submitting || !approverName.trim() || !approverEmail.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ background: submitting ? '#166534' : 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
            {submitting ? <Spinner className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
            Aprobar Cotizacion
          </button>
        )}
        <button type="button" onClick={onOpenReject} disabled={submitting}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <XIcon className="h-4 w-4 text-red-400" />
          <span className="text-red-400">Rechazar</span>
        </button>
      </div>

      {hasRemovedItems && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Sus cambios seran enviados al proveedor para actualizar su cotizacion. Recibira una nueva version para su aprobacion.
        </p>
      )}
    </div>
  );
}
