# DTE Type Selector for Quote Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to select which DTE type (01-Factura, 03-CCF, 14-Sujeto Excluido, etc.) to generate when converting an approved quote, limited to the tenant's enabled DTE types.

**Architecture:** Add a `dteType` column to the Quote model. Create a new endpoint to fetch the tenant's enabled DTE types (from `DteTypeSelection` via `TenantOnboarding`). Modify the existing `POST /quotes/:id/convert` to accept a `dteType` in the request body. Replace the simple confirm dialog in the frontend with a DTE type selector dialog.

**Tech Stack:** NestJS, Prisma (Azure SQL), Next.js 14, React, shadcn/ui, next-intl

---

## Key Context

- `DteTypeSelection.dteType` stores **enum names** like `FACTURA`, `CREDITO_FISCAL` — NOT MH codes like `01`, `03`. A mapping is needed.
- `TIPOS_DTE` catalog at `apps/api/src/modules/catalog/catalog.data.ts:469` has MH codes + descriptions.
- The `convertToInvoice()` method at `apps/api/src/modules/quotes/quotes.service.ts:1020` hardcodes `tipoDte: '01'` in two places (lines 1156 and 1210).
- The convert dialog lives at `apps/web/src/app/(dashboard)/cotizaciones/[id]/components/QuoteDialogs.tsx`.
- i18n messages are in `apps/web/messages/es.json` and `apps/web/messages/en.json` under the `"quotes"` key.

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/api/prisma/schema.prisma` | Modify | Add `dteType` field to Quote model |
| `apps/api/src/modules/quotes/dto/convert-quote.dto.ts` | Create | DTO for convert endpoint body |
| `apps/api/src/modules/quotes/quotes.controller.ts` | Modify | Add `GET :id/available-dte-types`, add `@Body()` to convert endpoint |
| `apps/api/src/modules/quotes/quotes.service.ts` | Modify | Add `getAvailableDteTypes()`, modify `convertToInvoice()` to accept dteType |
| `apps/web/src/app/(dashboard)/cotizaciones/[id]/components/QuoteDialogs.tsx` | Modify | Replace confirm dialog with DTE selector |
| `apps/web/src/app/(dashboard)/cotizaciones/[id]/page.tsx` | Modify | Pass dteType to convert handler |
| `apps/web/messages/es.json` | Modify | Add i18n keys for DTE selector |
| `apps/web/messages/en.json` | Modify | Add i18n keys for DTE selector |

---

### Task 1: Add `dteType` field to Quote schema + push to DB

**Files:**
- Modify: `apps/api/prisma/schema.prisma:1276-1363` (Quote model)

- [ ] **Step 1: Add dteType field to Quote model**

In `apps/api/prisma/schema.prisma`, inside the Quote model, add after line 1337 (`convertedAt DateTime?`):

```prisma
  dteType              String?   @db.NVarChar(5) // MH DTE type code: 01, 03, 11, 14, etc.
```

- [ ] **Step 2: Push schema to database**

```bash
cd apps/api && npx prisma db push
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd apps/api && npx prisma generate
```

Expected: "Generated Prisma Client"

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(schema): add dteType field to Quote model"
```

---

### Task 2: Create DTE type enum-to-code mapping + convert DTO

**Files:**
- Create: `apps/api/src/modules/quotes/dto/convert-quote.dto.ts`
- Modify: `apps/api/src/modules/quotes/quotes.service.ts:19-35` (add mapping constant)

- [ ] **Step 1: Create ConvertQuoteDto**

Create `apps/api/src/modules/quotes/dto/convert-quote.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertQuoteDto {
  @ApiPropertyOptional({
    description: 'MH DTE type code (01, 03, 11, 14, etc.). Defaults to 01 if not provided.',
    example: '01',
  })
  @IsString()
  @IsOptional()
  dteType?: string;
}
```

- [ ] **Step 2: Add DTE_TYPE_ENUM_TO_CODE mapping to quotes.service.ts**

In `apps/api/src/modules/quotes/quotes.service.ts`, after the `QUOTE_STATUSES` constant (around line 35), add:

```typescript
/** Maps DteTypeSelection enum names to MH numeric codes */
const DTE_TYPE_ENUM_TO_CODE: Record<string, string> = {
  FACTURA: '01',
  CREDITO_FISCAL: '03',
  NOTA_REMISION: '04',
  NOTA_CREDITO: '05',
  NOTA_DEBITO: '06',
  COMPROBANTE_RETENCION: '07',
  COMPROBANTE_LIQUIDACION: '08',
  DOCUMENTO_CONTABLE_LIQUIDACION: '09',
  FACTURA_EXPORTACION: '11',
  FACTURA_SUJETO_EXCLUIDO: '14',
  COMPROBANTE_DONACION: '15',
};

/** Maps MH codes back to human-readable names */
const DTE_CODE_TO_NAME: Record<string, string> = {
  '01': 'Factura',
  '03': 'Comprobante de Crédito Fiscal',
  '04': 'Nota de Remisión',
  '05': 'Nota de Crédito',
  '06': 'Nota de Débito',
  '07': 'Comprobante de Retención',
  '08': 'Comprobante de Liquidación',
  '09': 'Documento Contable de Liquidación',
  '11': 'Factura de Exportación',
  '14': 'Factura de Sujeto Excluido',
  '15': 'Comprobante de Donación',
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/quotes/dto/convert-quote.dto.ts apps/api/src/modules/quotes/quotes.service.ts
git commit -m "feat(quotes): add DTE type mapping constants and ConvertQuoteDto"
```

---

### Task 3: Add `getAvailableDteTypes()` to QuotesService + controller endpoint

**Files:**
- Modify: `apps/api/src/modules/quotes/quotes.service.ts` (add method)
- Modify: `apps/api/src/modules/quotes/quotes.controller.ts:237-248` (add GET endpoint)

- [ ] **Step 1: Add getAvailableDteTypes method to QuotesService**

In `apps/api/src/modules/quotes/quotes.service.ts`, add this method before `convertToInvoice()` (before line 1020):

```typescript
  /**
   * Returns the list of DTE types the tenant has enabled (via onboarding),
   * mapped to MH codes and human-readable names.
   */
  async getAvailableDteTypes(tenantId: string): Promise<{
    availableDteTypes: { code: string; name: string }[];
  }> {
    const onboarding = await this.prisma.tenantOnboarding.findFirst({
      where: { tenantId },
      include: { dteTypes: true },
    });

    if (!onboarding || onboarding.dteTypes.length === 0) {
      // Fallback: if no onboarding config, return default Factura only
      return {
        availableDteTypes: [{ code: '01', name: 'Factura' }],
      };
    }

    const availableDteTypes = onboarding.dteTypes
      .map((dt) => {
        const code = DTE_TYPE_ENUM_TO_CODE[dt.dteType];
        if (!code) return null;
        return { code, name: DTE_CODE_TO_NAME[code] || dt.dteType };
      })
      .filter((dt): dt is { code: string; name: string } => dt !== null)
      .sort((a, b) => a.code.localeCompare(b.code));

    if (availableDteTypes.length === 0) {
      return {
        availableDteTypes: [{ code: '01', name: 'Factura' }],
      };
    }

    return { availableDteTypes };
  }
```

- [ ] **Step 2: Add GET endpoint to controller**

In `apps/api/src/modules/quotes/quotes.controller.ts`, add before the `// ── Conversion` section (before line 237):

```typescript
  // ── DTE Type Selection ──────────────────────────────────────────────

  @Get(':id/available-dte-types')
  @ApiOperation({ summary: 'Obtener tipos de DTE disponibles para convertir cotización' })
  @RequirePermission('quote:read')
  getAvailableDteTypes(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.getAvailableDteTypes(tenantId);
  }
```

- [ ] **Step 3: Verify API compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/quotes/quotes.service.ts apps/api/src/modules/quotes/quotes.controller.ts
git commit -m "feat(quotes): add GET available-dte-types endpoint"
```

---

### Task 4: Modify `convertToInvoice()` to accept and use `dteType`

**Files:**
- Modify: `apps/api/src/modules/quotes/quotes.service.ts:1020-1241`
- Modify: `apps/api/src/modules/quotes/quotes.controller.ts:239-248`

- [ ] **Step 1: Update convertToInvoice signature and add validation**

In `apps/api/src/modules/quotes/quotes.service.ts`, change the method signature at line 1020 from:

```typescript
  async convertToInvoice(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<ConvertResult> {
```

to:

```typescript
  async convertToInvoice(
    tenantId: string,
    id: string,
    userId?: string,
    dteType?: string,
  ): Promise<ConvertResult> {
```

- [ ] **Step 2: Add DTE type validation after the existing checks**

After the `if (quote.convertedToInvoiceId)` check (after line 1047), add:

```typescript
    // Resolve DTE type: use provided, fall back to '01'
    const selectedDteType = dteType || '01';

    // Validate against tenant's enabled DTE types
    const validCodes = Object.values(DTE_TYPE_ENUM_TO_CODE);
    if (!validCodes.includes(selectedDteType)) {
      throw new BadRequestException(
        `Tipo de DTE '${selectedDteType}' no es válido`,
      );
    }

    const { availableDteTypes } = await this.getAvailableDteTypes(tenantId);
    const isEnabled = availableDteTypes.some((dt) => dt.code === selectedDteType);
    if (!isEnabled) {
      throw new BadRequestException(
        `Tipo de DTE '${selectedDteType}' no está habilitado para este tenant`,
      );
    }
```

- [ ] **Step 3: Replace hardcoded '01' with selectedDteType**

At line 1156, change:

```typescript
        tipoDte: '01',
```

to:

```typescript
        tipoDte: selectedDteType,
```

At line 1210, change:

```typescript
    const invoice = await this.dteService.createDte(
      tenantId,
      '01',
      dteData,
    );
```

to:

```typescript
    const invoice = await this.dteService.createDte(
      tenantId,
      selectedDteType,
      dteData,
    );
```

- [ ] **Step 4: Store selected dteType on Quote when converting**

At line 1214, change the update to include dteType:

```typescript
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QUOTE_STATUSES.CONVERTED,
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
        dteType: selectedDteType,
        updatedBy: userId,
      },
    });
```

- [ ] **Step 5: Update controller to pass dteType from request body**

In `apps/api/src/modules/quotes/quotes.controller.ts`, modify the convert endpoint. Add import for `ConvertQuoteDto` at the top imports:

```typescript
import { ConvertQuoteDto } from './dto/convert-quote.dto';
```

Then change the endpoint (lines 239-248) from:

```typescript
  @Post(':id/convert')
  @ApiOperation({ summary: 'Convertir cotizacion a factura' })
  @RequirePermission('quote:update', 'dte:create')
  convertToInvoice(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.convertToInvoice(tenantId, id, user.id);
  }
```

to:

```typescript
  @Post(':id/convert')
  @ApiOperation({ summary: 'Convertir cotizacion a DTE del tipo seleccionado' })
  @RequirePermission('quote:update', 'dte:create')
  convertToInvoice(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ConvertQuoteDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.quotesService.convertToInvoice(tenantId, id, user.id, dto.dteType);
  }
```

- [ ] **Step 6: Verify API compiles**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/quotes/quotes.service.ts apps/api/src/modules/quotes/quotes.controller.ts apps/api/src/modules/quotes/dto/convert-quote.dto.ts
git commit -m "feat(quotes): accept dteType in convert endpoint, validate against tenant config"
```

---

### Task 5: Update frontend Convert dialog with DTE type selector

**Files:**
- Modify: `apps/web/src/app/(dashboard)/cotizaciones/[id]/components/QuoteDialogs.tsx`
- Modify: `apps/web/src/app/(dashboard)/cotizaciones/[id]/page.tsx:105-116`
- Modify: `apps/web/messages/es.json:426-427`
- Modify: `apps/web/messages/en.json:426-427`

- [ ] **Step 1: Add i18n keys for DTE selector**

In `apps/web/messages/es.json`, replace lines 426-427:

```json
    "convertQuote": "Convertir a Documento Fiscal",
    "convertConfirm": "Selecciona el tipo de documento fiscal a generar con los items de la cotización {number}.",
    "selectDteType": "Tipo de documento",
    "loadingDteTypes": "Cargando tipos disponibles...",
    "noDteTypesAvailable": "No hay tipos de DTE habilitados. Configura los tipos en la sección de Hacienda.",
    "convertToDte": "Generar Documento",
```

In `apps/web/messages/en.json`, replace lines 426-427:

```json
    "convertQuote": "Convert to Tax Document",
    "convertConfirm": "Select the type of tax document to generate from quote {number}.",
    "selectDteType": "Document type",
    "loadingDteTypes": "Loading available types...",
    "noDteTypesAvailable": "No DTE types enabled. Configure types in the Hacienda settings.",
    "convertToDte": "Generate Document",
```

- [ ] **Step 2: Rewrite the Convert dialog in QuoteDialogs.tsx**

Replace the entire `QuoteDialogs.tsx` file. The key change is the Convert dialog which now fetches available DTE types and shows radio buttons.

Replace the full file content of `apps/web/src/app/(dashboard)/cotizaciones/[id]/components/QuoteDialogs.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, XCircle, Trash2, Ban, Loader2, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface DteTypeOption {
  code: string;
  name: string;
}

interface QuoteDialogsProps {
  quoteId: string;
  quoteNumber: string;
  actionLoading: boolean;
  // Reject
  showRejectDialog: boolean;
  setShowRejectDialog: (v: boolean) => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onReject: (reason: string) => void;
  // Convert
  showConvertDialog: boolean;
  setShowConvertDialog: (v: boolean) => void;
  onConvert: (dteType: string) => void;
  // Delete
  showDeleteDialog: boolean;
  setShowDeleteDialog: (v: boolean) => void;
  onDelete: () => void;
  // Cancel
  showCancelDialog: boolean;
  setShowCancelDialog: (v: boolean) => void;
  onCancel: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string) => string;
}

export function QuoteDialogs({
  quoteId,
  quoteNumber,
  actionLoading,
  showRejectDialog, setShowRejectDialog, rejectReason, setRejectReason, onReject,
  showConvertDialog, setShowConvertDialog, onConvert,
  showDeleteDialog, setShowDeleteDialog, onDelete,
  showCancelDialog, setShowCancelDialog, onCancel,
  t, tCommon,
}: QuoteDialogsProps) {
  const [dteTypes, setDteTypes] = React.useState<DteTypeOption[]>([]);
  const [dteTypesLoading, setDteTypesLoading] = React.useState(false);
  const [selectedDteType, setSelectedDteType] = React.useState<string>('');

  // Fetch available DTE types when convert dialog opens
  React.useEffect(() => {
    if (!showConvertDialog) {
      setSelectedDteType('');
      return;
    }
    setDteTypesLoading(true);
    fetch(`${API_URL}/quotes/${quoteId}/available-dte-types`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { availableDteTypes: DteTypeOption[] }) => {
        setDteTypes(data.availableDteTypes || []);
        // Auto-select if only one option
        if (data.availableDteTypes?.length === 1) {
          setSelectedDteType(data.availableDteTypes[0].code);
        }
      })
      .catch(() => setDteTypes([]))
      .finally(() => setDteTypesLoading(false));
  }, [showConvertDialog, quoteId]);

  return (
    <>
      {/* Reject dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectQuote')}</DialogTitle>
            <DialogDescription>{t('rejectPrompt', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('rejectPlaceholder')}
            rows={3}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={() => onReject(rejectReason)} disabled={!rejectReason.trim() || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert dialog — DTE type selector */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('convertQuote')}</DialogTitle>
            <DialogDescription>{t('convertConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>

          {dteTypesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">{t('loadingDteTypes')}</span>
            </div>
          ) : dteTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t('noDteTypesAvailable')}</p>
          ) : (
            <div className="space-y-2 py-2">
              <label className="text-sm font-medium text-foreground">{t('selectDteType')}</label>
              {dteTypes.map((dte) => (
                <label
                  key={dte.code}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDteType === dte.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dteType"
                    value={dte.code}
                    checked={selectedDteType === dte.code}
                    onChange={() => setSelectedDteType(dte.code)}
                    className="accent-primary"
                  />
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium">{dte.code} — {dte.name}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConvertDialog(false)}>{tCommon('cancel')}</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => onConvert(selectedDteType)}
              disabled={!selectedDteType || actionLoading || dteTypesLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              {t('convertToDte')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteQuote')}</DialogTitle>
            <DialogDescription>{t('deleteConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={onDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelQuote')}</DialogTitle>
            <DialogDescription>{t('cancelConfirm', { number: quoteNumber })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>{tCommon('back')}</Button>
            <Button variant="destructive" onClick={onCancel} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              {t('cancelQuote')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 3: Update page.tsx to pass quoteId and handle dteType in convert**

In `apps/web/src/app/(dashboard)/cotizaciones/[id]/page.tsx`:

**3a.** Change `handleConvert` (lines 105-116) from:

```typescript
  const handleConvert = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/convert`, { credentials: 'include', method: 'POST', headers: {} });
```

to:

```typescript
  const handleConvert = async (dteType: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/quotes/${id}/convert`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dteType }) });
```

**3b.** In the `<QuoteDialogs>` usage (around line 465), add `quoteId={id}` prop and change `onConvert`:

From:

```tsx
      <QuoteDialogs
        quoteNumber={quote.quoteNumber} actionLoading={actionLoading}
        ...
        showConvertDialog={showConvertDialog} setShowConvertDialog={setShowConvertDialog} onConvert={handleConvert}
        ...
```

To:

```tsx
      <QuoteDialogs
        quoteId={id}
        quoteNumber={quote.quoteNumber} actionLoading={actionLoading}
        ...
        showConvertDialog={showConvertDialog} setShowConvertDialog={setShowConvertDialog} onConvert={handleConvert}
        ...
```

- [ ] **Step 4: Verify frontend compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(dashboard\)/cotizaciones/\[id\]/components/QuoteDialogs.tsx apps/web/src/app/\(dashboard\)/cotizaciones/\[id\]/page.tsx apps/web/messages/es.json apps/web/messages/en.json
git commit -m "feat(web): replace convert dialog with DTE type selector"
```

---

### Task 6: Update quote list page inline convert (if applicable)

**Files:**
- Modify: `apps/web/src/app/(dashboard)/cotizaciones/page.tsx:259` (list page convert action)

- [ ] **Step 1: Check if list page has inline convert**

The list page at `apps/web/src/app/(dashboard)/cotizaciones/page.tsx:259` also has a convert action. This should open the detail page rather than converting inline (since now we need DTE type selection). Check the current behavior:

If the list page does direct convert calls, change them to navigate to the detail page instead:

```typescript
// Instead of calling convert directly, navigate to detail page
router.push(`/cotizaciones/${quoteId}`);
```

If it already navigates, no change needed.

- [ ] **Step 2: Commit (if changes made)**

```bash
git add apps/web/src/app/\(dashboard\)/cotizaciones/page.tsx
git commit -m "fix(web): redirect list page convert action to detail page for DTE selection"
```

---

### Task 7: Manual E2E verification

- [ ] **Step 1: Start dev servers**

```bash
cd apps/api && npm run start:dev &
cd apps/web && npm run dev &
```

- [ ] **Step 2: Test GET endpoint**

```bash
curl -s http://localhost:3001/quotes/<quote-id>/available-dte-types -H "Cookie: <auth-cookie>" | jq .
```

Expected: `{ "availableDteTypes": [{ "code": "01", "name": "Factura" }, ...] }`

- [ ] **Step 3: Test convert with dteType**

```bash
curl -s -X POST http://localhost:3001/quotes/<approved-quote-id>/convert \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"dteType": "03"}' | jq .
```

Expected: Success response with invoice data.

- [ ] **Step 4: Test validation — invalid DTE type**

```bash
curl -s -X POST http://localhost:3001/quotes/<approved-quote-id>/convert \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{"dteType": "99"}' | jq .
```

Expected: 400 error "Tipo de DTE '99' no es válido"

- [ ] **Step 5: Test UI flow**

1. Open an approved quote in the browser
2. Click "Convertir a Documento Fiscal"
3. Verify the dialog shows the tenant's enabled DTE types as radio buttons
4. Select a type and click "Generar Documento"
5. Verify redirect to the generated document

- [ ] **Step 6: Verify backward compatibility**

```bash
curl -s -X POST http://localhost:3001/quotes/<approved-quote-id>/convert \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{}' | jq .
```

Expected: Success — defaults to tipo 01 when no dteType provided.
