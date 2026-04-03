'use client';

import * as React from 'react';
import { Spinner, XIcon } from './ApprovalIcons';

interface RejectDialogProps {
  quoteNumber: string;
  show: boolean;
  onClose: () => void;
  onReject: () => void;
  submitting: boolean;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  rejectorName: string;
  setRejectorName: (v: string) => void;
  rejectorEmail: string;
  setRejectorEmail: (v: string) => void;
  rejectComments: string;
  setRejectComments: (v: string) => void;
}

export function RejectDialog({
  quoteNumber,
  show,
  onClose,
  onReject,
  submitting,
  rejectReason, setRejectReason,
  rejectorName, setRejectorName,
  rejectorEmail, setRejectorEmail,
  rejectComments, setRejectComments,
}: RejectDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Rechazar Cotizacion</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors"><XIcon className="h-5 w-5" /></button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Rechazaras completamente la cotizacion <span className="text-white font-medium">{quoteNumber}</span>. Por favor indica el motivo.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Motivo del rechazo <span className="text-red-400">*</span></label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Describe por que rechazas esta cotizacion..." rows={3}
              className="w-full px-4 py-2.5 text-sm rounded-xl text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tu nombre</label>
              <input type="text" value={rejectorName} onChange={(e) => setRejectorName(e.target.value)} placeholder="Nombre"
                className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tu correo</label>
              <input type="email" value={rejectorEmail} onChange={(e) => setRejectorEmail(e.target.value)} placeholder="correo@ejemplo.com"
                className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Comentarios adicionales</label>
            <input type="text" value={rejectComments} onChange={(e) => setRejectComments(e.target.value)} placeholder="Comentarios opcionales..."
              className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancelar
          </button>
          <button type="button" onClick={onReject} disabled={!rejectReason.trim() || submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: submitting ? '#991B1B' : 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
            {submitting ? <Spinner className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
            Rechazar Cotizacion
          </button>
        </div>
      </div>
    </div>
  );
}
