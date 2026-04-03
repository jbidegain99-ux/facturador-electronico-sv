'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  Settings2,
  Loader2,
  Plus,
  Trash2,
  Zap,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface AccountingConfig {
  autoJournalEnabled: boolean;
  autoJournalTrigger: string;
}

interface AccountRef {
  id: string;
  code: string;
  name: string;
}

interface MappingRule {
  id: string;
  operation: string;
  description: string | null;
  debitAccountId: string;
  creditAccountId: string;
  debitAccount: AccountRef;
  creditAccount: AccountRef;
  mappingConfig: string | null;
  isActive: boolean;
}

interface PostableAccount {
  id: string;
  code: string;
  name: string;
}

interface MappingLine {
  cuenta: string;
  monto: string;
  descripcion?: string;
}

interface MappingConfig {
  debe: MappingLine[];
  haber: MappingLine[];
}

const OPERATION_LABELS: Record<string, string> = {
  VENTA_CONTADO: 'Venta al Contado',
  VENTA_CREDITO: 'Venta al Crédito',
  CREDITO_FISCAL: 'Crédito Fiscal',
  NOTA_CREDITO: 'Nota de Crédito',
  NOTA_DEBITO: 'Nota de Débito',
  SUJETO_EXCLUIDO: 'Sujeto Excluido',
};

import { apiFetch, API_URL } from '@/lib/api';

export default function ConfiguracionContablePage() {
  const [config, setConfig] = useState<AccountingConfig | null>(null);
  const [mappings, setMappings] = useState<MappingRule[]>([]);
  const [accounts, setAccounts] = useState<PostableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MappingRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchAll = useCallback(async () => {
    try {
      const [configData, mappingsData, accountsData] = await Promise.all([
        apiFetch<AccountingConfig>('/accounting/config').catch(() => null),
        apiFetch<MappingRule[]>('/accounting/mappings').catch(() => []),
        apiFetch<PostableAccount[]>('/accounting/accounts/postable').catch(() => []),
      ]);

      if (configData) setConfig(configData);
      if (Array.isArray(mappingsData)) setMappings(mappingsData);
      if (Array.isArray(accountsData)) setAccounts(accountsData);
    } catch {
      toastRef.current.error('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleToggleEnabled = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await apiFetch<AccountingConfig>('/accounting/config', {
        method: 'PATCH',
        body: JSON.stringify({ autoJournalEnabled: !config.autoJournalEnabled }),
      });
      if (updated) setConfig(updated);
      toastRef.current.success(
        'Configuración actualizada',
        !config.autoJournalEnabled ? 'Automatización activada' : 'Automatización desactivada',
      );
    } catch {
      toastRef.current.error('Error', 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeTrigger = async (trigger: string) => {
    setSaving(true);
    try {
      const updated = await apiFetch<AccountingConfig>('/accounting/config', {
        method: 'PATCH',
        body: JSON.stringify({ autoJournalTrigger: trigger }),
      });
      if (updated) setConfig(updated);
      toastRef.current.success('Trigger actualizado');
    } catch {
      toastRef.current.error('Error', 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedMappings = async () => {
    setSeeding(true);
    try {
      const json = await apiFetch<{ created?: number; skipped?: number }>('/accounting/mappings/seed', {
        method: 'POST',
      });
      toastRef.current.success(
        'Mapeos creados',
        `${json.created ?? 0} creados, ${json.skipped ?? 0} existentes`,
      );
      fetchAll();
    } catch {
      toastRef.current.error('Error', 'No se pudieron crear los mapeos');
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await apiFetch(`/accounting/mappings/${id}`, { method: 'DELETE' });
      setMappings(prev => prev.filter(m => m.id !== id));
      toastRef.current.success('Mapeo eliminado');
    } catch {
      toastRef.current.error('Error', 'No se pudo eliminar');
    }
  };

  const openEditor = (mapping?: MappingRule) => {
    setEditingMapping(mapping || null);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/contabilidad"
          className="rounded-md p-1 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Configuración Contable</h1>
          <p className="text-muted-foreground">Automatización de partidas desde DTEs</p>
        </div>
      </div>

      {/* Toggle principal */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-purple-500" />
            <div>
              <h3 className="font-semibold">Generación automática de partidas</h3>
              <p className="text-sm text-muted-foreground">
                Al activar, cada DTE generará una partida contable automáticamente
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEnabled}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {config?.autoJournalEnabled ? (
              <ToggleRight className="h-8 w-8 text-green-500" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            )}
          </button>
        </div>

        {config?.autoJournalEnabled && (
          <div className="mt-4 pt-4 border-t">
            <label className="text-sm font-medium mb-2 block">Momento de generación</label>
            <div className="flex gap-3">
              <button
                onClick={() => handleChangeTrigger('ON_APPROVED')}
                disabled={saving}
                className={`flex-1 rounded-md border p-3 text-sm text-left transition-colors ${
                  config.autoJournalTrigger === 'ON_APPROVED'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium">Al ser aprobado por Hacienda</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La partida se crea cuando el DTE es procesado exitosamente
                </p>
              </button>
              <button
                onClick={() => handleChangeTrigger('ON_CREATED')}
                disabled={saving}
                className={`flex-1 rounded-md border p-3 text-sm text-left transition-colors ${
                  config.autoJournalTrigger === 'ON_CREATED'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                    : 'hover:bg-muted'
                }`}
              >
                <p className="font-medium">Al crear el DTE</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La partida se crea inmediatamente al generar el DTE
                </p>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mapeos */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Mapeos contables</h3>
            <p className="text-sm text-muted-foreground">
              Define qué cuentas se afectan para cada tipo de operación
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSeedMappings}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Cargar predeterminados
            </button>
            <button
              onClick={() => openEditor()}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo mapeo
            </button>
          </div>
        </div>

        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay mapeos configurados.</p>
            <p className="text-sm mt-1">
              Usa &quot;Cargar predeterminados&quot; para empezar con los mapeos estándar de El Salvador.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Operación</th>
                  <th className="text-left py-2 font-medium">Descripción</th>
                  <th className="text-left py-2 font-medium">Cuenta Débito</th>
                  <th className="text-left py-2 font-medium">Cuenta Crédito</th>
                  <th className="text-center py-2 font-medium">Multi-línea</th>
                  <th className="text-right py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(mapping => (
                  <tr key={mapping.id} className="border-b border-muted/50">
                    <td className="py-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                        {mapping.operation}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {mapping.description || OPERATION_LABELS[mapping.operation] || '-'}
                    </td>
                    <td className="py-2">
                      <span className="font-mono text-xs">{mapping.debitAccount.code}</span>
                      <span className="ml-1 text-muted-foreground">{mapping.debitAccount.name}</span>
                    </td>
                    <td className="py-2">
                      <span className="font-mono text-xs">{mapping.creditAccount.code}</span>
                      <span className="ml-1 text-muted-foreground">{mapping.creditAccount.name}</span>
                    </td>
                    <td className="py-2 text-center">
                      {mapping.mappingConfig ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          Sí
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Simple</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditor(mapping)}
                          className="rounded p-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Editar"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMapping(mapping.id)}
                          className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-muted-foreground hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <MappingEditor
          mapping={editingMapping}
          accounts={accounts}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

// ====== Mapping Editor Modal ======

interface MappingEditorProps {
  mapping: MappingRule | null;
  accounts: PostableAccount[];
  onClose: () => void;
  onSaved: () => void;
}

function MappingEditor({ mapping, accounts, onClose, onSaved }: MappingEditorProps) {
  const [operation, setOperation] = useState(mapping?.operation || '');
  const [description, setDescription] = useState(mapping?.description || '');
  const [debitAccountId, setDebitAccountId] = useState(mapping?.debitAccountId || '');
  const [creditAccountId, setCreditAccountId] = useState(mapping?.creditAccountId || '');
  const [useMultiLine, setUseMultiLine] = useState(!!mapping?.mappingConfig);
  const [debeLines, setDebeLines] = useState<MappingLine[]>([]);
  const [haberLines, setHaberLines] = useState<MappingLine[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (mapping?.mappingConfig) {
      try {
        const config: MappingConfig = JSON.parse(mapping.mappingConfig);
        setDebeLines(config.debe || []);
        setHaberLines(config.haber || []);
      } catch {
        setDebeLines([]);
        setHaberLines([]);
      }
    }
  }, [mapping]);

  const handleSave = async () => {
    if (!operation || !debitAccountId || !creditAccountId) {
      toastRef.current.error('Campos requeridos', 'Operación y cuentas son obligatorias');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        operation,
        description: description || undefined,
        debitAccountId,
        creditAccountId,
      };

      if (useMultiLine && (debeLines.length > 0 || haberLines.length > 0)) {
        body.mappingConfig = { debe: debeLines, haber: haberLines };
      }

      await apiFetch('/accounting/mappings', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toastRef.current.success('Mapeo guardado');
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar';
      toastRef.current.error('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const addLine = (side: 'debe' | 'haber') => {
    const newLine: MappingLine = { cuenta: '', monto: 'total' };
    if (side === 'debe') setDebeLines(prev => [...prev, newLine]);
    else setHaberLines(prev => [...prev, newLine]);
  };

  const updateLine = (side: 'debe' | 'haber', index: number, field: keyof MappingLine, value: string) => {
    const setter = side === 'debe' ? setDebeLines : setHaberLines;
    setter(prev => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const removeLine = (side: 'debe' | 'haber', index: number) => {
    const setter = side === 'debe' ? setDebeLines : setHaberLines;
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const operations = Object.entries(OPERATION_LABELS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {mapping ? 'Editar mapeo' : 'Nuevo mapeo contable'}
          </h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Operation */}
          <div>
            <label className="text-sm font-medium mb-1 block">Operación</label>
            <select
              value={operation}
              onChange={e => setOperation(e.target.value)}
              disabled={!!mapping}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {operations.map(([key, label]) => (
                <option key={key} value={key}>{label} ({key})</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción del mapeo..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Simple accounts (always required for fallback) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cuenta débito principal</label>
              <select
                value={debitAccountId}
                onChange={e => setDebitAccountId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Cuenta crédito principal</label>
              <select
                value={creditAccountId}
                onChange={e => setCreditAccountId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-line toggle */}
          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => setUseMultiLine(!useMultiLine)}>
              {useMultiLine ? (
                <ToggleRight className="h-6 w-6 text-green-500" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <span className="text-sm font-medium">Configuración multi-línea (IVA separado)</span>
          </div>

          {useMultiLine && (
            <div className="space-y-4 pt-2">
              {/* Debe lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Líneas DEBE</label>
                  <button
                    onClick={() => addLine('debe')}
                    className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar
                  </button>
                </div>
                {debeLines.map((line, i) => (
                  <LineEditor
                    key={i}
                    line={line}
                    accounts={accounts}
                    onChange={(field, value) => updateLine('debe', i, field, value)}
                    onRemove={() => removeLine('debe', i)}
                  />
                ))}
              </div>

              {/* Haber lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Líneas HABER</label>
                  <button
                    onClick={() => addLine('haber')}
                    className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar
                  </button>
                </div>
                {haberLines.map((line, i) => (
                  <LineEditor
                    key={i}
                    line={line}
                    accounts={accounts}
                    onChange={(field, value) => updateLine('haber', i, field, value)}
                    onRemove={() => removeLine('haber', i)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== Line Editor Component ======

interface LineEditorProps {
  line: MappingLine;
  accounts: PostableAccount[];
  onChange: (field: keyof MappingLine, value: string) => void;
  onRemove: () => void;
}

function LineEditor({ line, accounts, onChange, onRemove }: LineEditorProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <select
        value={line.cuenta}
        onChange={e => onChange('cuenta', e.target.value)}
        className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Cuenta...</option>
        {accounts.map(a => (
          <option key={a.id} value={a.code}>{a.code} - {a.name}</option>
        ))}
      </select>
      <select
        value={line.monto}
        onChange={e => onChange('monto', e.target.value)}
        className="w-28 h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="total">Total</option>
        <option value="subtotal">Subtotal</option>
        <option value="iva">IVA</option>
      </select>
      <input
        type="text"
        value={line.descripcion || ''}
        onChange={e => onChange('descripcion', e.target.value)}
        placeholder="Descripción..."
        className="w-40 h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <button
        onClick={onRemove}
        className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-900/10 text-muted-foreground hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
