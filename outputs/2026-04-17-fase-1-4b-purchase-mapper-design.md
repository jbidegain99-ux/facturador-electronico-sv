# Fase 1.4b — Purchase Mapper + Asiento Contable (design spec)

**Fecha:** 2026-04-17
**Fase:** 1.4b (segunda de tres sub-fases dentro de Fase 1.4)
**Depende de:** PR #91 (Fase 1.4a DteImportService) **merged a main** ✅
**Plan:** se genera después vía `superpowers:writing-plans`

**Propósito:** construir `PurchasesModule` + `PurchasesService.createFromReceivedDte()` que toma un `ReceivedDTE` validado (generado por Fase 1.4a) y produce `Purchase` + `PurchaseLineItem` con supplier upsert + catalog matching + asiento contable automático via nuevo `AccountingAutomationService.generateFromPurchase()`. No crea `InventoryMovement` (reception workflow es Fase 1.5), no expone controller (Fase 2).

---

## 0. Decisiones locked

| # | Decisión | Elegido |
|---|---|---|
| D1 | Entry point | **B:** manual, caller explícito. `DteImportService.ingest()` NO auto-chain. Purchase creation es un paso separado. |
| D2 | Tipos DTE soportados | **A:** solo 01 (FE), 03 (CCFE), 14 (FSEE). Otros → `UnsupportedOperationException` con mensaje claro. |
| D3 | `ingestStatus` gating | **C:** permissive — acepta VERIFIED, STRUCTURAL_OK, VERIFY_*_RETRY. Rechaza FAILED_PARSE y FAILED_MH_NOT_FOUND. Warning log para no-VERIFIED. Parámetro opt-in `requireVerified: true` para callers estrictos. |
| D4 | Catalog matching | **A:** exact match por `code`. Unmatched → `catalogItemId=null`. NO auto-create CatalogItem. |
| D5 | Retención IVA en asiento | **B:** diferido a Fase 1.5 (requiere extender enum `monto` con `'retention'` — O5 del spec original). `retentionAmount` en Purchase populated, pero asiento ignora ese leg. Gap contable corto, se cierra en 1.5. |

---

## 1. Alcance (IN / OUT)

**IN Fase 1.4b:**
- Módulo nuevo `apps/api/src/modules/purchases/`
- `PurchasesService.createFromReceivedDte(tenantId, receivedDteId, options)` — método único público
- Supplier upsert (Cliente con `isSupplier=true`) por `numDocumento`
- Line item mapping con catalog match por `code` + `unitCostPosted` calculation
- Nuevo método `AccountingAutomationService.generateFromPurchase(purchaseId, tenantId, trigger)` — clon del patrón de `generateFromDTE()`
- Idempotency via `Purchase.receivedDteId @unique` (existente en schema Fase 1.2)
- Unit tests con mocks (15 casos)

**OUT (diferido):**
- Reception workflow (Purchase DRAFT → RECEIVED) → **Fase 1.5**
- `InventoryMovement` creation + `InventoryState` update (Kardex) → Fase 1.5 al hacer recepción
- Retención IVA en el asiento → Fase 1.5 (O5 enum extension)
- NC / ND (05 / 06) — actualiza Purchase existente vs crear nuevo → **Fase 1.4d** o post-MVP
- Controller HTTP / endpoint → **Fase 2 (frontend)**
- OCR / PDF → JSON → Fase 2
- Manual Purchase creation (sin DTE, compras en papel/contingencia) → Fase 2 controller
- Auto-chain de `DteImportService.ingest()` → opcional futuro (hoy NO)

Regla: Purchase creado queda en `status='DRAFT'` con asiento contable ya posted (CxP reconocido al recibir el CCFE, patrón contable estándar). Reception física y Kardex son eventos separados.

---

## 2. Módulo + archivos

**Crear:**
```
apps/api/src/modules/purchases/
├── purchases.module.ts
├── services/
│   ├── purchases.service.ts
│   └── purchases.service.spec.ts
└── index.ts
```

**Modificar:**
- `apps/api/src/modules/accounting/accounting-automation.service.ts` — agregar método `generateFromPurchase()`
- `apps/api/src/modules/accounting/accounting-automation.service.spec.ts` — agregar tests del nuevo método (~4 tests)
- `apps/api/src/app.module.ts` — registrar `PurchasesModule` como import

**`purchases.module.ts` imports:**
- `PrismaModule` — para queries Prisma
- `DteModule` — para tipos `ParsedDTE` + `DteImportService` (future auto-chain)
- `AccountingModule` — para `AccountingAutomationService.generateFromPurchase()`

Sin cambios de schema Prisma — todos los modelos necesarios (`Purchase`, `PurchaseLineItem`, `Cliente`, `CatalogItem`, `ReceivedDTE`) ya existen.

---

## 3. API contract

```typescript
// apps/api/src/modules/purchases/services/purchases.service.ts

export interface CreateFromDteOptions {
  createdBy: string;              // userId — audit trail
  requireVerified?: boolean;      // default false (permissive)
                                  // true → throws si ingestStatus != 'VERIFIED'
}

@Injectable()
export class PurchasesService {
  async createFromReceivedDte(
    tenantId: string,
    receivedDteId: string,
    options: CreateFromDteOptions,
  ): Promise<PurchaseWithRelations>;
}

// Purchase returned includes relations loaded
type PurchaseWithRelations = Purchase & {
  lineItems: PurchaseLineItem[];
  supplier: Cliente;
  journalEntry: JournalEntry | null;  // null si asiento generation falló (non-blocking)
};
```

**Exceptions:**
- `NotFoundException` — `ReceivedDTE` no existe o `tenantId` mismatch
- `PreconditionFailedException` — ingestStatus es FAILED_* o requireVerified=true y status != VERIFIED
- `UnsupportedOperationException` (NestJS: `NotImplementedException`) — tipoDte no en {01, 03, 14}

**NO throws si:**
- Purchase ya existe para este `receivedDteId` → retorna el existente (idempotente)
- Asiento generation falla → Purchase creado con `journalEntryId=null`, error logged

---

## 4. Supplier upsert flow

Del `ReceivedDTE.parsedPayload`, extraemos el emisor del DTE:

**Normalización de documento:**
```typescript
function extractSupplierDoc(parsed: ParsedDTE): { tipoDocumento: string; numDocumento: string } {
  // NIT emisor (CCFE/FE) tiene prioridad
  if (parsed.emisor.nit) {
    return { tipoDocumento: '36', numDocumento: parsed.emisor.nit };
  }
  // FSEE (14) o fallback a numDocumento+tipoDocumento
  if (parsed.emisor.tipoDocumento && parsed.emisor.numDocumento) {
    return {
      tipoDocumento: parsed.emisor.tipoDocumento,
      numDocumento: parsed.emisor.numDocumento,
    };
  }
  throw new PreconditionFailedException(
    `Cannot extract supplier identification from ReceivedDTE ${receivedDteId} — emisor missing nit and numDocumento`,
  );
}
```

**Upsert logic:**
```typescript
const { tipoDocumento, numDocumento } = extractSupplierDoc(parsed);

let supplier = await prisma.cliente.findUnique({
  where: { tenantId_numDocumento: { tenantId, numDocumento } },
});

if (supplier) {
  // Cliente existente — solo flipear isSupplier si es necesario.
  // NO sobreescribimos nombre/direccion/etc del usuario.
  if (!supplier.isSupplier) {
    supplier = await prisma.cliente.update({
      where: { id: supplier.id },
      data: { isSupplier: true },
    });
  }
} else {
  // Nuevo Cliente desde datos del DTE
  supplier = await prisma.cliente.create({
    data: {
      tenantId,
      tipoDocumento,
      numDocumento,
      nombre: parsed.emisor.nombre,
      nrc: parsed.emisor.nrc ?? null,
      correo: parsed.emisor.correo ?? null,
      telefono: parsed.emisor.telefono ?? null,
      direccion: parsed.emisor.direccion ? JSON.stringify(parsed.emisor.direccion) : '{}',
      isCustomer: false,
      isSupplier: true,
    },
  });
}
```

**Invariantes:**
- `Cliente.tenantId_numDocumento` unique (schema Fase 1.2) → no duplicates
- Un Cliente puede ser customer AND supplier (both flags true) — flags independientes
- Nunca flipeamos `isCustomer=false` en un Cliente existente (preservamos data del usuario)

---

## 5. Line item mapping

Iteramos `parsedPayload.cuerpoDocumento` (nunca vacío — garantizado por validación Fase 1.3).

**Per line:**

```typescript
async function mapLine(line: ParsedLineItem, tenantId: string): Promise<PurchaseLineItemCreateData> {
  // 1. Catalog match por codigo exact — null si sin match
  let catalogItemId: string | null = null;
  if (line.codigo) {
    const catItem = await prisma.catalogItem.findUnique({
      where: { tenantId_code: { tenantId, code: line.codigo } },
    });
    catalogItemId = catItem?.id ?? null;
  }

  // 2. Tax code (CAT-015) — prioridad gravada > exenta > no sujeta
  let taxCode = '20'; // IVA 13% gravada default
  const ventaGravada = parseFloat(line.ventaGravada ?? '0');
  const ventaExenta = parseFloat(line.ventaExenta ?? '0');
  const ventaNoSuj = parseFloat(line.ventaNoSuj ?? '0');

  if (ventaGravada > 0) taxCode = '20';
  else if (ventaExenta > 0) taxCode = '10';
  else if (ventaNoSuj > 0) taxCode = '30';

  // 3. IVA amount per line (solo CCFE tiene ivaItem populated)
  const ivaItem = line.ivaItem ? parseFloat(line.ivaItem) : 0;

  // 4. Line total = suma de los 3 buckets de venta (menos descuento, más IVA si CCFE)
  const discountAmount = parseFloat(line.montoDescu ?? '0');
  const lineTotal = ventaGravada + ventaExenta + ventaNoSuj + ivaItem - discountAmount;

  // 5. unitCostPosted — snapshot del costo unitario para inventario futuro
  // Para los 3 tipos, usamos precioUni tal cual:
  //   - CCFE (03): precioUni = subtotal por unidad (sin IVA) → queda sin IVA en inventario
  //   - FE (01):   precioUni = precio al consumidor (IVA capitalizado dentro)
  //   - FSEE (14): precioUni = precio sin IVA (sujeto excluido no cobra IVA)
  // La diferencia CCFE vs FE/FSEE se refleja en el asiento (sección 6), no aquí.
  const unitCostPosted = parseFloat(line.precioUni);

  return {
    lineNumber: line.numItem,
    catalogItemId,
    description: line.descripcion,
    quantity: line.cantidad,           // Decimal string preservado
    unitPrice: line.precioUni,
    discountAmount: discountAmount.toFixed(2),
    taxCode,
    taxAmount: ivaItem.toFixed(2),
    lineTotal: lineTotal.toFixed(2),
    unitCostPosted: unitCostPosted.toFixed(4),
    qtyExpected: line.cantidad,        // expected = ordered; actual qtyReceived updates on Fase 1.5 reception
    qtyReceived: '0',
    receiptStatus: 'PENDING',
  };
}
```

**Notas:**
- Todos los montos se almacenan como strings decimales con precision explícita (patrón Prisma Decimal).
- `lineNumber` se preserva del DTE (`numItem`) — Art. 142-A compliance implícita.
- `unitCostPosted` siempre populated — sirve para reportería futura, no depende de `catalogItemId`.

---

## 6. Asiento contable — nuevo `generateFromPurchase()`

### Signatura

```typescript
// accounting-automation.service.ts

async generateFromPurchase(
  purchaseId: string,
  tenantId: string,
  trigger: string,  // 'ON_PURCHASE_CREATED' | 'ON_PURCHASE_RECEIVED' (Fase 1.5)
): Promise<JournalEntry | null>;
```

### Flow

1. **Load Purchase** con relaciones (`supplier`, `lineItems`).
2. **Determine operation code** desde `purchase.documentType`:

   | documentType | operation |
   |---|---|
   | `CCFE` | `COMPRA_CCFE` |
   | `FCFE` | `COMPRA_FCFE` (corresponde al FE 01) |
   | `FSEE` | `COMPRA_FSEE` |

   Si `documentType` no mapea → log warning + return null (no throw — Purchase sigue siendo válido).

3. **Lookup AccountMappingRule:**
   ```typescript
   const rule = await prisma.accountMappingRule.findFirst({
     where: { tenantId, operation, isActive: true },
   });
   if (!rule) {
     this.logger.warn(`No AccountMappingRule seeded for ${operation} in tenant ${tenantId}`);
     return null;
   }
   ```

4. **Build journal entry lines** desde `rule.mappingConfig`:
   ```typescript
   const config = JSON.parse(rule.mappingConfig as string);
   // config = { debe: [{cuenta, monto, descripcion}], haber: [...] }

   const amounts = {
     total: parseFloat(purchase.totalAmount),
     subtotal: parseFloat(purchase.subtotal),
     iva: parseFloat(purchase.ivaAmount),
     // NOTA: retention NO se usa en Fase 1.4b. Log warning si purchase.retentionAmount > 0:
     //   "Purchase ${purchaseId} has retentionAmount=X — not yet reflected in asiento (Fase 1.5 O5)"
   };

   const debitLines = config.debe.map(l => buildLine(l, amounts, /* side: DEBIT */));
   const creditLines = config.haber.map(l => buildLine(l, amounts, /* side: CREDIT */));
   ```

   El helper `buildLine()` resuelve `cuenta` a `accountId` via lookup y selecciona `amounts[l.monto]`.

5. **Create JournalEntry:**
   ```typescript
   const entry = await prisma.journalEntry.create({
     data: {
       tenantId,
       entryNumber: await this.generateEntryNumber(tenantId, purchase.purchaseDate),
       entryDate: purchase.purchaseDate,
       description: `${operation} — ${purchase.documentNumber ?? purchase.purchaseNumber}`,
       entryType: 'AUTOMATIC',
       sourceType: 'PURCHASE',
       sourceDocumentId: purchase.id,
       status: 'DRAFT',
       totalDebit: sumDebit.toFixed(2),
       totalCredit: sumCredit.toFixed(2),
       fiscalYear: purchase.purchaseDate.getFullYear(),
       fiscalMonth: purchase.purchaseDate.getMonth() + 1,
       lines: { create: [...debitLines, ...creditLines] },
     },
   });
   ```

6. **Post (validate + change status):**
   ```typescript
   await this.postEntry(entry.id);  // existing helper — valida debe==haber, flags POSTED
   ```

7. **Link back to Purchase:**
   ```typescript
   await prisma.purchase.update({
     where: { id: purchaseId },
     data: { journalEntryId: entry.id },
   });
   ```

### Reuso

El patrón es 95% reutilizable del `generateFromDTE()` existente. Diferencias:
- Source type: `'PURCHASE'` vs `'DTE'`
- Amounts: `purchase.subtotal/ivaAmount/totalAmount` vs `dte.totalGravada/totalIva/totalPagar` (mismo shape semántico)
- Descripción: formato diferente pero lógica igual

Se puede refactorizar para extraer un helper compartido, **pero no en Fase 1.4b** — YAGNI, dejar como funciones paralelas y deduplicar en una fase futura cuando haya un tercer consumer (ej. manual entries).

### Non-blocking failure

Si `generateFromPurchase()` throws por cualquier razón (FK missing, mapping config malformado, etc.) el caller (`PurchasesService.createFromReceivedDte()`) **captura y loggea**, NO roll back el Purchase:

```typescript
// dentro de createFromReceivedDte():
try {
  await this.accountingAutomation.generateFromPurchase(
    purchase.id,
    tenantId,
    'ON_PURCHASE_CREATED',
  );
} catch (err) {
  this.logger.error(
    `Failed to generate asiento for Purchase ${purchase.id}: ${err.message}. Purchase created in DRAFT, asiento can be generated manually later.`,
  );
  // Don't rethrow — Purchase still valid without asiento
}
```

Razón: Purchase es el master. Accounting es downstream. Un bug en mapping rules no debe impedir ingest. UI de Fase 2 mostrará "⚠ asiento pendiente" en Purchases con `journalEntryId=null` + botón "Generar asiento ahora" que re-invoca el service.

---

## 7. Flow del `createFromReceivedDte()`

```
INPUT: tenantId, receivedDteId, options = { createdBy, requireVerified? }

1. Load ReceivedDTE
   ├─ findFirst({ id: receivedDteId, tenantId }) — security check tenantId match
   └─ Not found → NotFoundException

2. Validate ingestStatus
   ├─ FAILED_PARSE | FAILED_MH_NOT_FOUND → PreconditionFailedException
   ├─ requireVerified && status !== 'VERIFIED' → PreconditionFailedException
   ├─ STRUCTURAL_OK → log warning "asiento using unverified DTE"
   ├─ VERIFY_*_RETRY → log warning "MH verification pending — asiento provisional"
   └─ VERIFIED → silent

3. Validate tipoDte
   └─ NOT in {'01', '03', '14'} → NotImplementedException (tipoDte ${x} no mapeable a Purchase en Fase 1.4b)

4. Idempotency check
   ├─ prisma.purchase.findUnique({ receivedDteId }) → if exists, return existing + include lineItems
   └─ not exists → continue

5. Parse the stored parsedPayload JSON back to ParsedDTE object
   └─ JSON.parse(receivedDte.parsedPayload) — we trust it (was validated by Fase 1.3 parser)

6. Supplier upsert
   ├─ Extract {tipoDocumento, numDocumento} from parsed.emisor
   ├─ findUnique by tenantId_numDocumento
   ├─ If exists + !isSupplier → update isSupplier=true
   └─ If not exists → create with isSupplier=true, isCustomer=false

7. Map cuerpoDocumento → PurchaseLineItem[] (sección 5)
   └─ Parallel awaits for catalog lookups (Promise.all)

8. Compute Purchase header fields
   ├─ purchaseNumber: `PUR-${tenantId.slice(0,6)}-${Date.now()}` (simple correlative, enhance later)
   ├─ documentType: normalize tipoDte → 'CCFE' | 'FCFE' | 'FSEE' (for mapping rule lookup)
   ├─ documentNumber: parsed.numeroControl
   ├─ purchaseDate: parsed.fecEmi (YYYY-MM-DD)
   ├─ subtotal: parsed.resumen.subTotalVentas (CCFE) or totalGravada (FE/FSEE)
   ├─ ivaAmount: parsed.resumen.totalIva ?? '0'
   ├─ retentionAmount: parsed.resumen.ivaRete1 ?? '0'  (populated but NOT in asiento — Fase 1.5)
   ├─ totalAmount: parsed.resumen.totalPagar
   └─ status: 'DRAFT'

9. Prisma transaction (atomic):
   ├─ Create Purchase (with receivedDteId link) + nested lineItems
   └─ If txn fails → throw (no partial state)

10. Generate asiento (outside txn, non-blocking)
    ├─ try: accountingAutomation.generateFromPurchase(purchase.id, tenantId, 'ON_PURCHASE_CREATED')
    └─ catch: log, don't throw

11. Return Purchase with includes
    └─ { ...purchase, lineItems, supplier, journalEntry: journalEntry ?? null }
```

---

## 8. Tests (unit, ~15 casos)

**Archivo:** `apps/api/src/modules/purchases/services/purchases.service.spec.ts`

**Mocks:**
- `PrismaService` — manual mock shape: `{ receivedDTE: {findFirst}, cliente: {findUnique, create, update}, catalogItem: {findUnique}, purchase: {findUnique, create}, $transaction: fn }`
- `AccountingAutomationService` — mock `generateFromPurchase()` default OK, controllable

**Test fixtures:**
- `validCcfeReceivedDTE` — ReceivedDTE con parsedPayload para CCFE (1 línea, supplier con NIT)
- `validFeReceivedDTE` — FE equivalente (sin ivaItem per line)
- `validFseeReceivedDTE` — FSEE (sujetoExcluido con DUI)

**Casos (15):**

### Happy paths (3)
1. **CCFE → Purchase creado** con documentType='CCFE', línea con ivaItem, asiento llamado con trigger='ON_PURCHASE_CREATED'
2. **FE (01) → Purchase con documentType='FCFE'**, IVA capitalizado (ivaAmount en Purchase=0, total incluye IVA del resumen)
3. **FSEE (14) → Purchase con documentType='FSEE'**, sin IVA (ivaAmount=0, retentionAmount=0)

### Status gating (4)
4. `FAILED_PARSE` → `PreconditionFailedException`
5. `FAILED_MH_NOT_FOUND` → `PreconditionFailedException`
6. `STRUCTURAL_OK` + requireVerified=false (default) → creates, warning logged
7. `STRUCTURAL_OK` + requireVerified=true → `PreconditionFailedException`

### Tipo gating (2)
8. tipoDte='05' (NC) → `NotImplementedException` con mensaje "no mapeable en Fase 1.4b"
9. tipoDte='07' (CRE) → `NotImplementedException`

### Supplier logic (2)
10. **Cliente existente** con isCustomer=true, isSupplier=false → update only flips isSupplier=true. Other fields (nombre, direccion, correo) preserved untouched.
11. **Nuevo Cliente** (supplier no existe) → create con isSupplier=true, isCustomer=false, data de parsed.emisor.

### Catalog match (2)
12. Line.codigo='ITEM-001' **matches CatalogItem** → catalogItemId populated en PurchaseLineItem
13. Line.codigo='UNKNOWN' **sin match** → catalogItemId=null, línea sigue creada

### Edge cases (2)
14. **Idempotency:** segundo call con mismo receivedDteId → retorna Purchase existente, no duplica, no invoca accounting
15. **Asiento generation falla** (generateFromPurchase throws) → Purchase creado con journalEntryId=null, error logged, no throw

**Coverage target:** 90%+ en `purchases.service.ts`.

**Tests para `generateFromPurchase()`** en `accounting-automation.service.spec.ts` (~4 adicionales):
- COMPRA_CCFE → JournalEntry con 3 líneas (Inventario subtotal + IVA Crédito Fiscal iva / Proveedores total)
- COMPRA_FCFE → JournalEntry con 2 líneas (Inventario total / Proveedores total)
- COMPRA_FSEE → JournalEntry 2 líneas
- Mapping rule missing → returns null, warning log (no throw)

---

## 9. Open decisions — diferidas

| # | Decisión | Se resuelve en |
|---|---|---|
| O1 | NC/ND (05/06) adjustment workflow | Fase 1.4d o post-MVP |
| O2 | Retención IVA 1% asiento split (extender enum `monto` con `'retention'`) | Fase 1.5 |
| O3 | Kardex entries + InventoryMovement generation al crear Purchase | **NO** — Kardex va con reception workflow (Fase 1.5) |
| O4 | Purchase correlativo scheme (`PUR-XXX-YYYYY` format, sequence per tenant) | Fase 1.4b implementa simple `PUR-${tenantSlice}-${timestamp}`; sequencing formal → post-MVP |
| O5 | Auto-chain desde `DteImportService.ingest()` | Fase 1.4c o post-MVP |
| O6 | Manual Purchase creation (sin DTE — compras en papel) | Fase 2 controller |
| O7 | Retention split en supplier upsert: Cliente con ambos roles (customer+supplier) — UX edge case | Fase 2 UI |

---

## 10. Checklist de aprobación

- [ ] §1 alcance IN/OUT — Purchase+asiento, sin Kardex ni reception
- [ ] §2 módulo nuevo `purchases/` + método nuevo en AccountingAutomation
- [ ] §3 API contract `createFromReceivedDte(tenantId, receivedDteId, options)` con exceptions definidas
- [ ] §4 supplier upsert — flipea flag si existe, crea nuevo si no, nunca sobreescribe data del usuario
- [ ] §5 line mapping — match por code, unitCostPosted=precioUni, taxCode per-bucket
- [ ] §6 `generateFromPurchase()` — clon de `generateFromDTE()` pattern, non-blocking failure
- [ ] §7 flow completo — 11 pasos en orden
- [ ] §8 15 tests unit
- [ ] §9 open decisions — retención diferida a 1.5 (D5 approved)

Una vez aprobado, invoco `superpowers:writing-plans` para plan tarea-por-tarea.
