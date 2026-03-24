# Partidas Contables

## Que son las partidas contables

Una partida contable (tambien llamada asiento contable o journal entry) es el registro formal de una transaccion financiera. Cada partida documenta como una operacion afecta las cuentas de la empresa, siguiendo el principio de **partida doble**: el total de debitos siempre debe ser igual al total de creditos.

Facturosv soporta dos formas de generar partidas:

- **Manuales:** Creadas directamente por el usuario para registrar operaciones que no se generan automaticamente.
- **Automaticas:** Generadas por el sistema cuando se emiten DTEs (facturas, notas de credito, etc.), si la contabilizacion automatica esta habilitada.

---

## Tipos de partida

| Tipo | Codigo interno | Descripcion |
|---|---|---|
| **Manual** | `MANUAL` | Creada manualmente por el usuario |
| **Ajuste** | `ADJUSTMENT` | Partida de ajuste contable |
| **Cierre** | `CLOSING` | Partida de cierre de periodo |
| **Automatica** | `AUTOMATIC` | Generada automaticamente por el sistema al procesar DTEs |

---

## Ciclo de vida de una partida

Cada partida pasa por un flujo de estados:

```
DRAFT (Borrador) → POSTED (Contabilizada) → VOIDED (Anulada)
```

| Estado | Descripcion | Efecto en saldos |
|---|---|---|
| **DRAFT** | Partida en borrador. Se puede editar libremente. | No afecta saldos |
| **POSTED** | Partida contabilizada. Ya no se puede editar. | Afecta los saldos de las cuentas |
| **VOIDED** | Partida anulada. Revierte el efecto en los saldos. | Revierte los saldos |

> **Importante:** Solo las partidas en estado **POSTED** afectan los saldos de las cuentas y aparecen en los reportes financieros. Las partidas en DRAFT y VOIDED no tienen impacto contable.

---

## Formato de numeracion

Las partidas se numeran automaticamente con el formato:

```
PDA-YYYY-XXXXXX
```

Donde:
- `PDA` — Prefijo fijo (Partida Diario)
- `YYYY` — Ano de la partida
- `XXXXXX` — Numero secuencial de 6 digitos, con ceros a la izquierda

**Ejemplos:**
- `PDA-2026-000001` — Primera partida del 2026
- `PDA-2026-000142` — Partida numero 142 del 2026

La numeracion es automatica y secuencial dentro de cada tenant. No se puede asignar manualmente.

---

## Crear una partida manual

### Paso 1: Iniciar la partida

1. Navegue a **Contabilidad > Partidas**.
2. Haga clic en **Nueva Partida**.
3. Complete los campos de encabezado:

| Campo | Descripcion | Ejemplo |
|---|---|---|
| **Fecha** | Fecha de la transaccion | `2026-03-15` |
| **Descripcion** | Descripcion general de la operacion | `Pago de alquiler oficina mes de marzo` |
| **Tipo** | Tipo de partida | `MANUAL` |

### Paso 2: Agregar lineas

Cada partida requiere un minimo de **2 lineas**. Cada linea registra un movimiento en una cuenta especifica:

| Campo de linea | Descripcion | Ejemplo |
|---|---|---|
| **Cuenta** | Cuenta contable (solo nivel 4, que permita movimientos) | `510101 - Gasto de Alquiler` |
| **Descripcion** | Detalle del movimiento en esta linea | `Alquiler local comercial` |
| **Debe** | Monto en el debe (debito) | `500.00` |
| **Haber** | Monto en el haber (credito) | `0.00` |

> **Regla fundamental:** Cada linea tiene un valor en el **debe** o en el **haber**, pero nunca en ambos. Si una linea tiene monto en el debe, el haber debe ser cero, y viceversa.

### Paso 3: Verificar el cuadre

Antes de guardar, verifique que:
- El total de la columna **Debe** sea igual al total de la columna **Haber**.
- La diferencia entre ambos totales sea cero (se permite una tolerancia de $0.01 por redondeo).

### Ejemplo completo

Registro de pago de alquiler ($500.00) con cheque:

| Cuenta | Descripcion | Debe | Haber |
|---|---|---|---|
| 510101 - Gasto de Alquiler | Alquiler marzo 2026 | $500.00 | |
| 110102 - Bancos | Cheque #1234 | | $500.00 |
| **Totales** | | **$500.00** | **$500.00** |

4. Haga clic en **Guardar**. La partida se creara en estado **DRAFT** (Borrador).

---

## Contabilizar una partida (DRAFT a POSTED)

Una partida en borrador no afecta los saldos contables. Para que tenga efecto:

1. Navegue a **Contabilidad > Partidas**.
2. Abra la partida en estado **Borrador** que desea contabilizar.
3. Revise que todos los datos sean correctos (una vez contabilizada, no se puede editar).
4. Haga clic en **Contabilizar** (o **Publicar**).
5. Confirme la accion.

### Efectos de contabilizar

- El estado cambia de **DRAFT** a **POSTED**.
- Los saldos de todas las cuentas involucradas se actualizan:
  - Las lineas con monto en el **debe** incrementan el saldo deudor de la cuenta.
  - Las lineas con monto en el **haber** incrementan el saldo acreedor de la cuenta.
- La partida aparecera en los reportes financieros.
- La partida **ya no se puede editar**. Solo se puede anular.

---

## Anular una partida (POSTED a VOIDED)

Si una partida contabilizada contiene un error, no se puede editar ni eliminar. En su lugar, se anula:

1. Navegue a **Contabilidad > Partidas**.
2. Abra la partida en estado **Contabilizada** que desea anular.
3. Haga clic en **Anular**.
4. Confirme la accion.

### Efectos de anular

- El estado cambia de **POSTED** a **VOIDED**.
- Los saldos de todas las cuentas involucradas se **revierten** (se deshace el efecto de la contabilizacion).
- La partida permanece en el historial para auditoria, pero deja de afectar los saldos.
- Una partida anulada **no se puede reactivar**. Si necesita registrar la operacion corregida, cree una nueva partida.

---

## Reglas de validacion

El sistema aplica las siguientes validaciones al guardar o contabilizar una partida:

| Regla | Descripcion |
|---|---|
| **Minimo 2 lineas** | Toda partida debe tener al menos 2 lineas (principio de partida doble). |
| **Cuadre de totales** | La suma de debitos debe ser igual a la suma de creditos, con una tolerancia maxima de $0.01. |
| **Una columna por linea** | Cada linea debe tener monto en el debe o en el haber, nunca en ambos simultaneamente. |
| **Cuentas de movimiento** | Solo se pueden usar cuentas de nivel 4 con `allowsPosting = true`. |
| **Cuentas activas** | Solo se pueden usar cuentas con `isActive = true`. |
| **Montos positivos** | Los montos en debe y haber deben ser mayores a cero. |
| **Fecha requerida** | La fecha de la partida es obligatoria. |
| **Descripcion requerida** | La descripcion general de la partida es obligatoria. |

---

## Contabilizacion automatica

Facturosv puede generar partidas automaticamente cuando se procesan documentos tributarios electronicos (DTEs). Esta funcionalidad requiere dos configuraciones:

### 1. Habilitar la contabilizacion automatica

En la configuracion del tenant, active:

- **autoJournalEnabled**: Activa la generacion automatica de partidas.
- **autoJournalTrigger**: Define cuando se genera la partida:
  - `ON_CREATED` — Al crear el DTE.
  - `ON_APPROVED` — Al ser aprobado por Hacienda.

### 2. Configurar reglas de mapeo

Las reglas de mapeo definen que cuentas se afectan para cada tipo de operacion:

| Operacion | Codigo | Descripcion |
|---|---|---|
| Venta al contado | `VENTA_CONTADO` | Factura pagada de inmediato |
| Venta al credito | `VENTA_CREDITO` | Factura con plazo de pago |
| Nota de credito | `NOTA_CREDITO` | Devolucion o descuento |
| Nota de debito | `NOTA_DEBITO` | Cargo adicional |
| Retencion | `RETENCION` | Retencion de impuestos |
| Exportacion | `EXPORTACION` | Venta al exterior |
| Sujeto excluido | `SUJETO_EXCLUIDO` | Compra a sujeto excluido |

Cada regla de mapeo especifica:
- La **cuenta de debito** (la cuenta que se carga).
- La **cuenta de credito** (la cuenta que se abona).

### Mapeos multi-linea

Para operaciones que requieren desglose (por ejemplo, separar subtotal e IVA), se utiliza la configuracion avanzada `mappingConfig` con arreglos de `debe` y `haber`:

**Ejemplo: Venta al contado con desglose de IVA**

| Linea | Cuenta | Debe | Haber | Base de calculo |
|---|---|---|---|---|
| 1 | Caja/Bancos | Total factura | | `total` |
| 2 | Ingresos por Ventas | | Subtotal | `subtotal` |
| 3 | IVA Debito Fiscal | | IVA | `iva` |

De esta forma, el sistema genera automaticamente partidas con el desglose correcto cada vez que se emite una factura.

---

## Simulacion de impacto contable

Antes de crear una partida real, puede simular el impacto contable para verificar que las cuentas y montos son correctos:

1. Configure la partida con todas sus lineas como lo haria normalmente.
2. En lugar de guardar, haga clic en **Simular** (o **Vista previa**).
3. El sistema mostrara como se afectarian los saldos de cada cuenta sin crear ningun registro.

Esta funcionalidad es especialmente util para:
- Verificar reglas de mapeo automatico antes de activarlas.
- Revisar partidas de ajuste complejas antes de registrarlas.
- Capacitar a nuevos usuarios en el uso del sistema contable.
