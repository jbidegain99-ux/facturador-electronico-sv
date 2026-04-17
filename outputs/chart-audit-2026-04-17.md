# Chart of Accounts Audit — 2026-04-17

## Summary
- **Accounts Existing & Reusable:** 6
- **Accounts with Name Collisions:** 3
- **Accounts Missing (to add in Task 13):** 4

---

## Existentes (reusar tal cual)

- `110303` IVA Crédito Fiscal
- `110401` Mercadería
- `210101` Proveedores
- `5101` Costo de Mercadería Vendida

---

## Existentes con nombre distinto (posible colisión)

- `110305` Deudores Diversos ⚠️ esperado: IVA Anticipo a Cuenta 2%
  - **Issue:** Currently used for miscellaneous debtors, not IVA advance payment
  - **Recommendation:** Do not reuse; add new account `110305A` or similar for IVA anticipo

- `210202` Retenciones de Renta ⚠️ esperado: IVA Retención 1% por Pagar
  - **Issue:** Currently tracks income tax withholdings, not IVA withholding (1%)
  - **Recommendation:** Keep as-is; add new account `210206` or `210207` for IVA 1% withholding

- `210203` Pago a Cuenta ⚠️ esperado: IVA Retención 1% por Pagar (alt)
  - **Issue:** Currently tracks advance tax payments, not IVA-specific withholding
  - **Recommendation:** Keep as-is; add new account for IVA 1% withholding

---

## Faltantes (agregar en Task 13)

- `410901` Sobrantes de Inventario (INCOME account, level 4 under rubro 41 INGRESOS OPERACIONALES)
- `510101` Costo Venta Mercadería (EXPENSE account, level 3 under rubro 51 COSTO DE VENTAS) — currently only `5101` exists as level 3
- `510103` Costo por Ajustes Físicos (EXPENSE account, level 3 under rubro 51 COSTO DE VENTAS)
- **One new LIABILITY account** for IVA Retención 1% por Pagar (suggest code: `210206` or `210207`, level 4 under rubro 2102 OBLIGACIONES FISCALES)

---

## Convención del archivo

- **Sección COSTOS/GASTOS:** `5xxx` (only 5xxx used; no 6xxx accounts present)
  - Level 2 rubros: `51` (Costo de Ventas), `52` (Gastos Operacionales), `53` (Gastos Financieros), `54` (Gastos No Deducibles)
  - Level 3 cuentas: `5101`, `5102`, `5201`–`5214`, `5301`–`5303`, `5401`–`5402`

- **Estructura jerárquica sample:**
  - Level 1: `1` ACTIVOS (element)
  - Level 2: `11` ACTIVO CORRIENTE (rubro/section)
  - Level 3: `1103` CUENTAS POR COBRAR (cuenta/account group)
  - Level 4: `110303` IVA Crédito Fiscal (subcuenta/posting account)

---

## Recomendaciones para Task 13

### Para "Costo de Venta"
- **Current:** `5101` exists as level 3 account (Costo de Mercadería Vendida)
- **Recommendation:** 
  - Reuse `5101` as posting account for merchandise cost of goods sold
  - Add `510101` as alternative level 4 subcuenta if finer sub-categorization needed
  - Add `510103` as level 4 subcuenta for physical adjustment costs
  - Or: Add both `510101` and `510103` under `5101` as parent

### Para "Proveedores Locales"
- **Current:** `210101` Proveedores (already generic, fits)
- **Recommendation:** Reuse as-is; rename to "Proveedores Locales" if needed for clarity, or accept "Proveedores" as sufficient

### Para "IVA Retención 1% por Pagar"
- **Current:** `210202` (Retenciones de Renta) and `210203` (Pago a Cuenta) are taken for other purposes
- **Recommendation:** 
  - Add new account code `210206` or `210207`
  - Level 4, parent `2102` (OBLIGACIONES FISCALES)
  - Account type: LIABILITY
  - Normal balance: CREDIT
  - Name: "IVA Retención 1% por Pagar"
  - Allow posting: true

### For "Sobrantes de Inventario"
- **Current:** Code `410901` does not exist; section 41 (INGRESOS OPERACIONALES) only has codes `4101`–`4104`
- **Recommendation:**
  - Add `410105` or `410106` as level 3 subcuenta under `41` INGRESOS OPERACIONALES
  - Or: Create new level 3 rubro `43` (e.g., "INGRESOS POR AJUSTES DE INVENTARIO") with `4301` as first subcuenta
  - Account type: INCOME
  - Normal balance: CREDIT
  - Allow posting: true

---

## Notes for Schema Migration

1. **Collision avoidance:** Do not reassign existing codes (`110305`, `210202`, `210203`). Create new codes for conflicting purposes.
2. **Hierarchy consistency:** All new level 4 accounts must have a valid level 3 parent code.
3. **Posting restrictions:** Verify which accounts allow direct posting (`allowsPosting: true`) for audit trail integrity.
4. **Chart structure:** File follows NIIF PYMES standard. Maintain this in new additions.
