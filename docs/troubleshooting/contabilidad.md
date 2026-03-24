# Troubleshooting — Contabilidad

## Error: Partidas contables no se postean automáticamente

**Síntoma:**
Creas o transmites facturas pero no aparecen partidas automáticas en el Libro Diario.

**Causas posibles:**

### 1. Posteo automático desactivado
La función de auto-posteo está apagada por defecto.

**Solución:**
1. Ve a **Contabilidad > Configuración**
2. Activa el switch **"Posteo automático"**
3. Selecciona el trigger:
   - **Al aprobar DTE** (recomendado) — postea cuando Hacienda acepta la factura
   - **Al crear DTE** — postea inmediatamente al crear la factura
4. Guarda cambios

### 2. Reglas de mapeo no configuradas
El sistema necesita saber qué cuentas afectar para cada tipo de operación.

**Solución:**
1. Ve a **Contabilidad > Configuración > Reglas de mapeo**
2. Si no hay reglas, haz clic en **"Sembrar mapeos por defecto"**
3. Se crearán mapeos estándar para El Salvador:
   - VENTA_CONTADO → Caja + Ventas + IVA
   - VENTA_CREDITO → Clientes + Ventas + IVA
   - NOTA_CREDITO, NOTA_DEBITO, RETENCION, EXPORTACION, etc.
4. Personaliza las cuentas según tu plan de cuentas si es necesario

### 3. Catálogo de cuentas no inicializado
Las cuentas referidas en las reglas de mapeo no existen.

**Solución:**
1. Ve a **Contabilidad > Cuentas**
2. Si está vacío, haz clic en **"Sembrar catálogo NIIF"**
3. Se crearán ~150 cuentas pre-configuradas
4. Luego siembra los mapeos por defecto

### 4. Plan no incluye contabilidad
El módulo de contabilidad requiere plan STARTER o superior.

**Solución:**
1. Ve a **Configuración > Plan** para verificar
2. FREE no incluye contabilidad
3. Haz upgrade a STARTER+ para acceder

**¿Aún hay problema?**
→ Crea un ticket TECHNICAL indicando el tipo de DTE que creaste y el trigger configurado

---

## Error: Balance de saldos no cuadra

**Síntoma:**
El reporte de Balance de Saldos muestra Total Débitos ≠ Total Créditos.

**Causas posibles:**

### 1. Partida con error de redondeo
Las partidas permiten una tolerancia de $0.01 en la diferencia débito-crédito.

**Solución:**
1. Ve a **Contabilidad > Libro Diario**
2. Filtra por estado POSTED
3. Revisa las partidas una por una buscando inconsistencias
4. Si encuentras una con diferencia, anúlala (void) y crea una nueva corregida

### 2. Partida anulada parcialmente
El proceso de anulación no revirtió correctamente los saldos.

**Solución:**
1. Busca partidas en estado VOIDED
2. Verifica que los saldos de las cuentas afectadas se hayan revertido
3. Si no, crea una partida de ajuste manual para corregir

### 3. Modificación directa de base de datos
Si alguien modificó datos directamente en la base de datos (no recomendado).

**Solución:**
1. Los saldos de cuentas (`currentBalance`) se actualizan atómicamente al postear/anular
2. Si hay inconsistencia, puede ser necesario recalcular saldos desde cero
3. Contacta soporte técnico para asistencia

**¿Aún hay problema?**
→ Crea un ticket TECHNICAL adjuntando captura del balance de saldos

---

## Error: No puedo postear una partida

**Síntoma:**
El botón "Postear" no funciona o muestra error.

**Causas posibles:**

### 1. La partida no está en estado DRAFT
Solo las partidas en borrador (DRAFT) se pueden postear.

**Solución:**
1. Verifica el estado de la partida — debe decir DRAFT
2. Si ya está POSTED, no necesitas postearla de nuevo
3. Si está VOIDED, está anulada — crea una nueva

### 2. Cuenta inactiva o no permite posteo
Una de las cuentas referidas en las líneas de la partida está inactiva.

**Solución:**
1. Revisa las cuentas usadas en cada línea
2. Ve a **Contabilidad > Cuentas** y verifica:
   - La cuenta está activa (`isActive: true`)
   - La cuenta permite posteo (`allowsPosting: true`)
   - Solo cuentas de nivel 4 permiten posteo por defecto
3. Activa la cuenta o cambia a una cuenta que permita posteo

### 3. Débitos ≠ Créditos
La partida no está balanceada.

**Solución:**
1. Verifica que la suma de débitos sea igual a la suma de créditos
2. Tolerancia permitida: $0.01
3. Cada línea debe tener SOLO débito O SOLO crédito (no ambos)
4. Mínimo 2 líneas por partida
5. Corrige las líneas y reintenta

---

## Error: Reportes contables no muestran datos recientes

**Síntoma:**
Generaste partidas y las posteaste, pero los reportes no las incluyen.

**Causas posibles:**

### 1. Filtro de fecha incorrecto
Los reportes filtran por fecha.

**Solución:**
1. Verifica el rango de fechas del reporte:
   - **Balance de saldos:** usa "fecha hasta" (dateTo)
   - **Estado de resultados:** usa "fecha desde" y "fecha hasta"
   - **Libro mayor:** usa rango de fechas + cuenta específica
2. Ajusta las fechas para incluir el período deseado
3. La fecha del reporte debe ser >= la fecha de las partidas

### 2. Partidas en estado DRAFT
Solo las partidas POSTED afectan los reportes y saldos.

**Solución:**
1. Ve a **Contabilidad > Libro Diario**
2. Filtra por estado DRAFT
3. Postea las partidas pendientes
4. Regenera el reporte

### 3. Plan no incluye reportes avanzados
Los reportes (balance sheet, income statement, general ledger) requieren la funcionalidad `advanced_reports`, disponible en PROFESSIONAL+.

**Solución:**
1. El dashboard básico de contabilidad está en STARTER+
2. Los reportes avanzados están en PROFESSIONAL+
3. Haz upgrade si necesitas reportes completos

**¿Aún hay problema?**
→ Crea un ticket TECHNICAL indicando qué reporte genera y el rango de fechas usado
