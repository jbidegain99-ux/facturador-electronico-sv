# Reportes Financieros

## Descripcion general

El modulo de Contabilidad incluye 4 reportes financieros y un dashboard con indicadores clave. Los reportes se generan en tiempo real a partir de las partidas contabilizadas (estado POSTED) y permiten analizar la situacion financiera de la empresa.

> **Requisito:** Los reportes financieros requieren la funcionalidad `advanced_reports` habilitada en el plan del tenant.

---

## 1. Balanza de Comprobacion

### Que es

La Balanza de Comprobacion es un listado de todas las cuentas contables con sus saldos deudores y acreedores a una fecha determinada. Su proposito principal es verificar que la contabilidad esta cuadrada (total debitos = total creditos).

### Como generarla

1. Navegue a **Contabilidad > Reportes > Balanza de Comprobacion**.
2. Seleccione la **fecha de corte** (`dateTo`): el reporte incluira todas las partidas contabilizadas hasta esta fecha.
3. Haga clic en **Generar**.

### Filtros disponibles

| Filtro | Descripcion |
|---|---|
| **Fecha de corte** (`dateTo`) | Fecha limite. Se incluyen partidas con fecha igual o anterior. |

### Que muestra

Para cada cuenta contable con movimientos:

| Columna | Descripcion |
|---|---|
| **Codigo** | Codigo de la cuenta |
| **Nombre** | Nombre de la cuenta |
| **Debitos** | Suma total de movimientos en el debe |
| **Creditos** | Suma total de movimientos en el haber |
| **Saldo deudor** | Diferencia cuando debitos > creditos |
| **Saldo acreedor** | Diferencia cuando creditos > debitos |

Al final del reporte se muestran los totales. Si la contabilidad esta correcta:
- Total de saldos deudores = Total de saldos acreedores
- Total de debitos = Total de creditos

### Como interpretar

- Si los totales no cuadran, hay un error en alguna partida (esto no deberia ocurrir dado que el sistema valida el cuadre al contabilizar).
- Cuentas con saldo contrario a su naturaleza pueden indicar errores. Por ejemplo, una cuenta de activo con saldo acreedor podria ser una sobrecreditacion.
- Use este reporte como punto de partida para detectar inconsistencias antes de generar el Balance General o el Estado de Resultados.

---

## 2. Balance General

### Que es

El Balance General (tambien llamado Estado de Situacion Financiera) muestra la posicion financiera de la empresa a una fecha especifica. Se basa en la ecuacion contable fundamental:

**Activos = Pasivos + Patrimonio**

### Como generarlo

1. Navegue a **Contabilidad > Reportes > Balance General**.
2. Seleccione la **fecha de corte** (`dateTo`).
3. Haga clic en **Generar**.

### Filtros disponibles

| Filtro | Descripcion |
|---|---|
| **Fecha de corte** (`dateTo`) | Muestra la posicion financiera a esta fecha. |

### Que muestra

El reporte se divide en tres secciones principales:

**Activos**
- Activos Corrientes (efectivo, cuentas por cobrar, inventarios, etc.)
- Activos No Corrientes (propiedad, planta, equipo, intangibles, etc.)
- **Total Activos**

**Pasivos**
- Pasivos Corrientes (cuentas por pagar, prestamos a corto plazo, etc.)
- Pasivos No Corrientes (prestamos a largo plazo, etc.)
- **Total Pasivos**

**Patrimonio**
- Capital social, reservas, utilidades acumuladas, etc.
- **Total Patrimonio**

Al final: **Total Pasivos + Patrimonio** (debe ser igual a Total Activos).

### Como interpretar

- **Si Activos no es igual a Pasivos + Patrimonio**, hay un descuadre contable que debe investigarse.
- **Razon de liquidez** (Activos Corrientes / Pasivos Corrientes): valores mayores a 1 indican capacidad de pago a corto plazo.
- **Nivel de endeudamiento** (Pasivos / Activos): un valor alto indica dependencia de financiamiento externo.
- Compare con periodos anteriores para identificar tendencias en el crecimiento de activos o acumulacion de deuda.

---

## 3. Estado de Resultados

### Que es

El Estado de Resultados (tambien llamado Estado de Perdidas y Ganancias) muestra los ingresos, gastos y la utilidad o perdida neta de la empresa durante un periodo especifico.

### Como generarlo

1. Navegue a **Contabilidad > Reportes > Estado de Resultados**.
2. Seleccione la **fecha de inicio** (`dateFrom`).
3. Seleccione la **fecha de fin** (`dateTo`).
4. Haga clic en **Generar**.

### Filtros disponibles

| Filtro | Descripcion |
|---|---|
| **Fecha de inicio** (`dateFrom`) | Inicio del periodo a evaluar |
| **Fecha de fin** (`dateTo`) | Fin del periodo a evaluar |

### Que muestra

| Seccion | Descripcion |
|---|---|
| **Ingresos** | Todas las cuentas de tipo INCOME con movimientos en el periodo |
| **Total Ingresos** | Suma de todos los ingresos |
| **Gastos** | Todas las cuentas de tipo EXPENSE con movimientos en el periodo |
| **Total Gastos** | Suma de todos los gastos |
| **Utilidad/Perdida Neta** | Total Ingresos - Total Gastos |

### Como interpretar

- **Utilidad neta positiva:** La empresa genero ganancias en el periodo.
- **Utilidad neta negativa (perdida):** Los gastos superaron los ingresos.
- **Margen neto** (Utilidad Neta / Total Ingresos): indica que porcentaje de los ingresos se convierte en ganancia.
- Analice que categorias de gasto tienen mayor peso para identificar oportunidades de reduccion de costos.
- Compare con periodos anteriores para evaluar el crecimiento de ingresos y la evolucion de gastos.

---

## 4. Libro Mayor

### Que es

El Libro Mayor muestra el detalle de todos los movimientos de una cuenta contable especifica en un rango de fechas. Es el reporte mas detallado y permite auditar cada transaccion que afecto una cuenta.

### Como generarlo

1. Navegue a **Contabilidad > Reportes > Libro Mayor**.
2. Seleccione la **cuenta contable** (`accountId`).
3. Seleccione la **fecha de inicio** (`dateFrom`).
4. Seleccione la **fecha de fin** (`dateTo`).
5. Haga clic en **Generar**.

### Filtros disponibles

| Filtro | Descripcion |
|---|---|
| **Cuenta** (`accountId`) | La cuenta especifica a consultar |
| **Fecha de inicio** (`dateFrom`) | Inicio del rango de consulta |
| **Fecha de fin** (`dateTo`) | Fin del rango de consulta |

### Que muestra

| Columna | Descripcion |
|---|---|
| **Fecha** | Fecha de la partida |
| **No. Partida** | Numero de la partida (ej: PDA-2026-000015) |
| **Descripcion** | Descripcion de la linea de la partida |
| **Debe** | Monto en el debe (si aplica) |
| **Haber** | Monto en el haber (si aplica) |
| **Saldo** | Saldo acumulado despues de cada movimiento |

El reporte inicia con el saldo de apertura (saldo acumulado antes de `dateFrom`) y muestra cronologicamente cada movimiento hasta llegar al saldo final.

### Como interpretar

- Use este reporte para rastrear el origen de un saldo especifico.
- Verifique que cada movimiento corresponda a una transaccion valida.
- El saldo final debe coincidir con el saldo reportado en la Balanza de Comprobacion para la misma fecha.
- Puede hacer clic en el numero de partida para ir directamente al detalle de la partida.

---

## Dashboard Contable

El dashboard ofrece una vista resumida de los indicadores financieros mas importantes, calculados en tiempo real.

### Indicadores disponibles

| Indicador | Descripcion | Calculo |
|---|---|---|
| **Total Activos** | Valor total de los activos de la empresa | Suma de saldos de cuentas tipo ASSET |
| **Total Pasivos** | Valor total de las obligaciones | Suma de saldos de cuentas tipo LIABILITY |
| **Total Patrimonio** | Patrimonio neto de la empresa | Suma de saldos de cuentas tipo EQUITY |
| **Ingresos del Mes** | Ingresos generados en el mes actual | Suma de movimientos de cuentas tipo INCOME en el mes |
| **Gastos del Mes** | Gastos incurridos en el mes actual | Suma de movimientos de cuentas tipo EXPENSE en el mes |
| **Utilidad Neta** | Resultado del periodo actual | Ingresos del Mes - Gastos del Mes |

### Como acceder

Navegue a **Contabilidad > Dashboard** (o la vista principal del modulo de Contabilidad). Los indicadores se actualizan automaticamente al cargar la pagina.

### Como interpretar el dashboard

- **Total Activos** debe ser igual a **Total Pasivos + Total Patrimonio**. Si no cuadra, revise la Balanza de Comprobacion.
- **Utilidad Neta** positiva indica que la empresa esta generando ganancias en el mes actual.
- Monitoree la tendencia de **Ingresos del Mes** y **Gastos del Mes** para identificar patrones estacionales o anomalias.

---

## Consideraciones generales sobre reportes

### Datos incluidos

- Solo se consideran partidas en estado **POSTED** (contabilizadas).
- Las partidas en DRAFT (borrador) y VOIDED (anuladas) no aparecen en los reportes.

### Precision

- Todos los montos se redondean a 2 decimales.
- La moneda base es el dolar estadounidense (USD), moneda de curso legal en El Salvador.

### Exportacion

Los reportes se pueden exportar o imprimir desde la interfaz para adjuntar a declaraciones fiscales o para revision de auditores.
