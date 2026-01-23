'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DteType,
  DteTypeSelection,
  DTE_TYPE_INFO,
} from '@/types/onboarding';

interface DteSelectionStepProps {
  selectedTypes?: DteTypeSelection[];
  onSubmit: (types: { dteType: DteType; isRequired: boolean }[]) => void;
  onBack: () => void;
  loading?: boolean;
}

const ALL_DTE_TYPES: DteType[] = [
  'FACTURA',
  'CREDITO_FISCAL',
  'NOTA_REMISION',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
  'COMPROBANTE_RETENCION',
  'COMPROBANTE_LIQUIDACION',
  'DOCUMENTO_CONTABLE_LIQUIDACION',
  'FACTURA_EXPORTACION',
  'FACTURA_SUJETO_EXCLUIDO',
  'COMPROBANTE_DONACION',
];

// Tests required per DTE type
const TESTS_REQUIRED: Record<DteType, number> = {
  FACTURA: 5,
  CREDITO_FISCAL: 3,
  NOTA_REMISION: 2,
  NOTA_CREDITO: 2,
  NOTA_DEBITO: 2,
  COMPROBANTE_RETENCION: 2,
  COMPROBANTE_LIQUIDACION: 2,
  DOCUMENTO_CONTABLE_LIQUIDACION: 1,
  FACTURA_EXPORTACION: 2,
  FACTURA_SUJETO_EXCLUIDO: 2,
  COMPROBANTE_DONACION: 1,
};

// Common document types that most businesses need
const COMMON_TYPES: DteType[] = [
  'FACTURA',
  'CREDITO_FISCAL',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
];

export function DteSelectionStep({
  selectedTypes = [],
  onSubmit,
  onBack,
  loading,
}: DteSelectionStepProps) {
  const [selected, setSelected] = React.useState<Set<DteType>>(() => {
    if (selectedTypes.length > 0) {
      return new Set(selectedTypes.map((t) => t.dteType));
    }
    // Pre-select common types
    return new Set(COMMON_TYPES);
  });

  const toggleType = (type: DteType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(ALL_DTE_TYPES));
  };

  const selectCommon = () => {
    setSelected(new Set(COMMON_TYPES));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;

    const types = Array.from(selected).map((dteType) => ({
      dteType,
      isRequired: COMMON_TYPES.includes(dteType),
    }));

    onSubmit(types);
  };

  const totalTests = Array.from(selected).reduce(
    (sum, type) => sum + TESTS_REQUIRED[type],
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tipos de DTE a Emitir</h2>
          <p className="text-muted-foreground">
            Seleccione los documentos tributarios que necesita emitir
          </p>
        </div>
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Cada tipo de documento requiere un número específico de pruebas
          exitosas antes de poder solicitar la autorización. El total de pruebas
          dependerá de los tipos seleccionados.
        </AlertDescription>
      </Alert>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={selectCommon}>
          Documentos Comunes
        </Button>
        <Button variant="outline" size="sm" onClick={selectAll}>
          Seleccionar Todos
        </Button>
        <Button variant="outline" size="sm" onClick={clearAll}>
          Limpiar Selección
        </Button>
      </div>

      {/* DTE types grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_DTE_TYPES.map((type) => {
          const info = DTE_TYPE_INFO[type];
          const isSelected = selected.has(type);
          const isCommon = COMMON_TYPES.includes(type);

          return (
            <Card
              key={type}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/50'
              }`}
              onClick={() => toggleType(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleType(type)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="font-medium cursor-pointer">
                        {info.name}
                      </Label>
                      {isCommon && (
                        <Badge variant="secondary" className="text-xs">
                          Común
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {info.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {TESTS_REQUIRED[type]} pruebas requeridas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resumen de Selección</p>
              <p className="text-sm text-muted-foreground">
                {selected.size} tipo(s) de documento seleccionado(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{totalTests}</p>
              <p className="text-sm text-muted-foreground">pruebas totales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || selected.size === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {selected.size === 0 && (
        <p className="text-center text-sm text-red-500">
          Debe seleccionar al menos un tipo de documento
        </p>
      )}
    </div>
  );
}
