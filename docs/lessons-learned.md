# Lessons Learned: Automatizacion DTE -> Partida Contable

## Fecha: Marzo 2026

---

## 1. Decisiones de Arquitectura

### 1.1 Fire-and-Forget vs Sincrono

**Decision:** La generacion de partidas es fire-and-forget (no bloquea el DTE).

**Razon:** Un DTE es el documento fiscal primario. Si la contabilidad falla, el DTE ya fue aprobado por Hacienda y debe completarse. La partida contable es secundaria.

**Patron implementado:**
```typescript
// En dte.service.ts - mismo patron que webhooks
private triggerAccountingEntry(dteId: string, tenantId: string, trigger: string): void {
  if (!this.accountingAutomation) return;
  this.accountingAutomation.generateFromDTE(dteId, tenantId, trigger).catch((err) =>
    this.logger.error(`Accounting auto-entry failed: ${err.message}`),
  );
}
```

**Alternativa descartada:** Transaccion atomica (DTE + partida en una transaccion). Descartada porque:
- Si Hacienda aprueba el DTE pero la partida falla, no se puede "des-aprobar" el DTE
- El retry de la partida es trivial; el retry del DTE no lo es

### 1.2 mappingConfig JSON vs Modelo Relacional

**Decision:** Usar campo JSON (`NVARCHAR(MAX)`) en `AccountMappingRule` en lugar de crear tabla `MappingLine`.

**Razon:**
- Maximo 5-6 lineas por mapeo, no justifica una tabla separada
- JSON permite flexibilidad sin migraciones futuras
- El campo es nullable = backward compatible con mapeos simples existentes
- SQL Server soporta `OPENJSON` si se necesita consultar en el futuro

**Estructura del JSON:**
```json
{
  "debe": [
    { "cuenta": "110101", "monto": "total", "descripcion": "Caja General" }
  ],
  "haber": [
    { "cuenta": "4101", "monto": "subtotal", "descripcion": "Ventas" },
    { "cuenta": "210201", "monto": "iva", "descripcion": "IVA Debito Fiscal" }
  ]
}
```

### 1.3 Trigger Configurable (ON_APPROVED vs ON_CREATED)

**Decision:** Permitir al tenant elegir cuando se genera la partida.

**Razon:**
- `ON_APPROVED` (default): Mas seguro, la partida solo se crea si Hacienda aprueba. Ideal para produccion.
- `ON_CREATED`: Util para contabilidad anticipada o modo demo donde no hay aprobacion real.

**Implementacion:** Campo `autoJournalTrigger` en Tenant, verificado en el servicio antes de generar.

---

## 2. Patrones Tecnicos

### 2.1 Inyeccion Circular con forwardRef

El modulo de DTE necesita AccountingAutomationService, y Accounting puede necesitar DTE en el futuro.

```typescript
// dte.module.ts
imports: [forwardRef(() => AccountingModule)]

// dte.service.ts
@Optional() @Inject(forwardRef(() => AccountingAutomationService))
private accountingAutomation: AccountingAutomationService | null
```

**Clave:** `@Optional()` asegura que si el modulo de contabilidad no esta cargado, el DTE sigue funcionando.

### 2.2 Resolucion de Cuentas por Codigo

El `mappingConfig` usa codigos de cuenta (ej: `'110101'`), no IDs. Esto es intencional:
- Los codigos son estables y legibles
- Los IDs son CUIDs que cambian entre tenants
- La busqueda usa el indice unico `@@unique([tenantId, code])`

```typescript
private async findAccountByCode(tenantId: string, code: string) {
  return this.prisma.accountingAccount.findUnique({
    where: { tenantId_code: { tenantId, code } },
  });
}
```

### 2.3 Determinacion de Operacion

La operacion contable se determina con una combinacion de `tipoDte` + `condicionOperacion`:

| tipoDte | condicionOperacion | Operacion |
|---------|-------------------|-----------|
| 01 | 1 (Contado) | VENTA_CONTADO |
| 01 | 2 (Credito) | VENTA_CREDITO |
| 03 | cualquiera | CREDITO_FISCAL |
| 05 | - | NOTA_CREDITO |
| 06 | - | NOTA_DEBITO |
| 14 | - | SUJETO_EXCLUIDO |

`condicionOperacion` se extrae parseando `jsonOriginal` del DTE.

---

## 3. Gotchas y Errores Evitados

### 3.1 No Duplicar Partidas

Si el trigger se ejecuta dos veces (ej: retry de transmision), la partida no debe duplicarse. La verificacion es:

```typescript
const existing = await this.prisma.journalEntry.findFirst({
  where: {
    tenantId,
    sourceType: 'DTE',
    sourceDocumentId: dteId,
    status: { not: 'VOIDED' },  // VOIDED entries don't count as duplicates
  },
});
if (existing) return null;
```

### 3.2 Backward Compatibility de mappingConfig

Si un mapeo NO tiene `mappingConfig` (null), se usa el fallback simple:
- 1 linea debe (debitAccountId) con totalPagar
- 1 linea haber (creditAccountId) con totalPagar

Esto permite que mapeos creados antes de esta feature sigan funcionando.

### 3.3 Precision Decimal

Todos los montos se redondean a 2 decimales antes de crear lineas:
```typescript
debit: Math.round(amount * 100) / 100
```

Y la validacion de balance usa tolerancia:
```typescript
if (Math.abs(totalDebit - totalCredit) > 0.01) { /* unbalanced */ }
```

### 3.4 Azure SQL y Prisma

- `prisma migrate dev` requiere shadow database en Azure SQL (no disponible)
- Usamos `prisma db push` para desarrollo
- Para produccion, aplicamos SQL manual via `verify-azure-sql-schema.sql`
- Siempre verificar que `prisma generate` funciona despues de cambios de schema

---

## 4. Testing

### 4.1 Estrategia de Mocks

El `AccountingAutomationService` depende de `AccountingService` y `PrismaService`. Para testear:
- `PrismaService`: Mock completo via `createMockPrismaService()`
- `AccountingService`: Instancia real con Prisma mockeado, metodos clave espiados con `jest.spyOn`

```typescript
accountingService = new AccountingService(prisma as unknown as PrismaService);
jest.spyOn(accountingService, 'createJournalEntry').mockResolvedValue(mockJournalEntry);
jest.spyOn(accountingService, 'postJournalEntry').mockResolvedValue(mockPostedEntry);
```

### 4.2 Casos de Test Criticos

| # | Caso | Verifica |
|---|------|----------|
| 1 | autoJournalEnabled=false | No genera partida |
| 2 | Trigger no coincide | No genera partida |
| 3 | DTE no encontrado | No genera, no crashea |
| 4 | Partida ya existe | No duplica |
| 5 | Sin regla de mapeo | No genera |
| 6 | mappingConfig con 3 lineas | Crea correctamente |
| 7 | Sin mappingConfig (simple) | Usa 2 lineas fallback |
| 8 | condicionOperacion=2 | Detecta VENTA_CREDITO |
| 9 | tipoDte=05 | Detecta NOTA_CREDITO |
| 10 | tipoDte=03 | Detecta CREDITO_FISCAL |
| 11 | Anular DTE | Reversa partida (VOIDED) |
| 12 | Anular sin partida | No crashea |

---

## 5. Frontend

### 5.1 Patron useRef para Toast

```typescript
const toast = useToast();
const toastRef = useRef(toast);
toastRef.current = toast;

// En callbacks usar toastRef.current en vez de toast
toastRef.current.success('Exito');
```

**Razon:** Incluir `toast` en deps de `useCallback` causa re-renders infinitos porque el valor de toast cambia en cada render.

### 5.2 Safe JSON parsing

```typescript
const json = await res.json().catch(() => ({}));
```

**Razon:** Respuestas de error (HTML, proxies) causan crash en `.json()`. Siempre usar `.catch()` en paths de error.

---

## 6. Integracion con Hacienda (MH) - Lecciones Criticas

### 6.1 Authorization Header SIN "Bearer"

**Problema:** Hacienda devuelve HTTP 401 con body vacio si se envia `Authorization: Bearer <token>`.

**Solucion:** Enviar solo el token raw: `Authorization: <token>`.

```typescript
// INCORRECTO - Hacienda rechaza con 401
headers: { 'Authorization': `Bearer ${token}` }

// CORRECTO
headers: { 'Authorization': token }
```

**Archivo:** `packages/mh-client/src/reception.ts`

### 6.2 Formato de Fecha fhProcesamiento

**Problema:** Hacienda devuelve `fhProcesamiento` en formato `"DD/MM/YYYY HH:mm:ss"` (ej: `"17/03/2026 11:41:51"`). JavaScript `new Date()` no parsea este formato y genera `Invalid Date`, causando error de Prisma al guardar.

**Solucion:** Parser personalizado que maneja tanto ISO como DD/MM/YYYY:

```typescript
private parseMhDate(fhProcesamiento: string | null): Date | null {
  if (!fhProcesamiento) return null;
  const isoDate = new Date(fhProcesamiento);
  if (!isNaN(isoDate.getTime())) return isoDate;
  const match = fhProcesamiento.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, day, month, year, hours, minutes, seconds] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
  }
  return new Date(); // fallback
}
```

### 6.3 Certificado Digital (.crt de Hacienda)

**El archivo `.crt` de Hacienda NO es un certificado X.509 estandar.** Es un XML propietario (`<CertificadoMH>`) que contiene:
- Llave privada (PKCS#8 en base64)
- Llave publica (X.509 en base64)
- Metadatos del certificado

**Flujo correcto para certificados:**
1. **Generar Certificado** en admin.factura.gob.sv → descarga `.crt` (XML con llaves)
2. **Cargar Certificado** en admin.factura.gob.sv → sube el mismo `.crt` para que MH lo registre
3. Subir el `.crt` a Facturosv en Configuracion > Hacienda

**ERROR COMUN:** Solo hacer paso 1 y 3, sin paso 2. MH rechaza la firma porque no tiene el certificado registrado.

**IMPORTANTE:** Al generar un certificado nuevo, el anterior se invalida automaticamente. No se pueden tener dos activos.

### 6.4 Respuestas Vacias de Hacienda

Hacienda devuelve body vacio en varios escenarios de error (401, 403). Si se usa `response.json()` directamente, falla con "Unexpected end of JSON input".

**Solucion:** Leer como texto primero:

```typescript
const rawText = await response.text();
let data;
try {
  data = JSON.parse(rawText);
} catch {
  throw new Error(`MH returned invalid JSON (HTTP ${response.status}): ${rawText.substring(0, 200)}`);
}
```

### 6.5 Token Caching y Cambio de Credenciales

Cuando se cambian credenciales de API en MH, hay que limpiar **dos caches**:
1. **BD:** `haciendaEnvironmentConfig.currentTokenEncrypted = null`
2. **In-memory:** Reiniciar el API container (la clase `HaciendaAuthService` tiene `tokenCache: Map`)

Sin limpiar ambos, el sistema seguira usando el token viejo (que puede ser invalido con las nuevas credenciales).

### 6.6 Normalizacion de Factura Tipo 01

Los tipos 03, 05, 06, etc. tenian normalizacion completa de `receptor.direccion`, `resumen.totalLetras`, `resumen.pagos`, etc. Pero **tipo 01 (Factura)** pasaba los datos sin normalizar, causando:
- `receptor.direccion` como string JSON en vez de objeto → "Unexpected end of JSON input"
- `resumen.totalLetras` vacio → rechazo de MH
- `resumen.pagos` null → rechazo de MH
- Decimales con mas de 2 posiciones → rechazo de MH

### 6.7 NRC: Almacenamiento vs Display

- **BD:** 7 digitos sin guion (ej: `3674750`)
- **UI:** Con guion XXXXXX-X (ej: `367475-0`)
- **Hacienda:** Acepta 1-8 digitos sin guion (regex `^[0-9]{1,8}$`)
- **API Response:** Incluir campo `nrcDisplay` para el frontend

---

## 7. Limitaciones Conocidas

1. **Solo IVA 13%** - No maneja retenciones ni impuestos variables
2. **Mapeo 1:1** - Un DTE = una partida. No soporta division por centro de costo
3. **Sin conciliacion** - Asume cobro/pago inmediato
4. **Solo USD** - Sin soporte de moneda extranjera
5. **Sin auditoria de cambios** - Si se modifica un mapeo, no queda registro del anterior

---

## 7. Metricas de Implementacion

| Metrica | Valor |
|---------|-------|
| Archivos creados | 6 |
| Archivos modificados | 8 |
| Lineas de codigo (backend) | ~350 |
| Lineas de codigo (frontend) | ~550 |
| Tests nuevos | 12 |
| Tests totales | 175 |
| Endpoints nuevos | 6 |
| Tiempo de build API | ~6s |
| Tiempo de build Web | ~24s |
