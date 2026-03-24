# Solucion de Problemas - Contabilidad

## 1. La partida no cuadra: "Total debitos no es igual a total creditos"

**Sintoma:** Al intentar guardar o contabilizar una partida, el sistema muestra un error indicando que los debitos no son iguales a los creditos.

**Causa:** La suma de los montos en la columna Debe no coincide con la suma de la columna Haber. La tolerancia maxima es de $0.01.

**Solucion:**
- Revise cada linea de la partida y verifique que los montos son correctos.
- Asegurese de que cada linea tenga monto solo en el Debe o solo en el Haber, nunca en ambos.
- Si el descuadre es por centavos (diferencia de redondeo), ajuste el monto de una linea para que los totales cuadren exactamente.

---

## 2. No puedo seleccionar una cuenta al crear una partida

**Sintoma:** Al agregar una linea a una partida, la cuenta que necesita no aparece en el selector.

**Causa posible:**
- La cuenta esta en un nivel superior (1, 2 o 3) y no permite movimientos.
- La cuenta esta desactivada (`isActive = false`).

**Solucion:**
- Solo las cuentas de **nivel 4** con `allowsPosting = true` aparecen en el selector.
- Verifique en el Catalogo de Cuentas si la cuenta esta activa.
- Si necesita registrar un movimiento en una categoria que solo tiene cuentas de nivel 3, cree una cuenta de detalle (nivel 4) bajo esa categoria.

---

## 3. El boton "Inicializar Catalogo" no aparece

**Sintoma:** En la seccion de Catalogo de Cuentas no se muestra la opcion para sembrar el catalogo NIIF PYMES.

**Causa:** El catalogo ya fue inicializado previamente. La semilla solo se puede ejecutar una vez.

**Solucion:**
- Si el catalogo ya existe, no necesita volver a inicializarlo.
- Si necesita cuentas adicionales, creelas manualmente desde la interfaz.
- Si el catalogo esta corrupto o incompleto, contacte al soporte tecnico.

---

## 4. Las partidas automaticas no se generan al emitir facturas

**Sintoma:** Se emiten facturas pero no aparecen partidas automaticas en el modulo de contabilidad.

**Causa posible:**
- La contabilizacion automatica no esta habilitada.
- Las reglas de mapeo no estan configuradas.
- El trigger no coincide con el flujo actual.

**Solucion:**
1. Verifique que `autoJournalEnabled` este activado en la configuracion del tenant.
2. Verifique que `autoJournalTrigger` tenga el valor correcto:
   - Use `ON_CREATED` si desea la partida al crear el DTE.
   - Use `ON_APPROVED` si desea la partida al ser aprobado por Hacienda.
3. Verifique que existan reglas de mapeo para la operacion correspondiente (ej: `VENTA_CONTADO` para facturas de contado).
4. Revise que las cuentas asignadas en las reglas de mapeo esten activas y permitan movimientos.

---

## 5. Los saldos del Balance General no cuadran (Activos != Pasivos + Patrimonio)

**Sintoma:** El Balance General muestra un Total de Activos diferente a la suma de Total Pasivos + Total Patrimonio.

**Causa posible:**
- Existen cuentas mal clasificadas (tipo de cuenta incorrecto).
- Hay partidas que afectan cuentas que no estan en el catalogo estandar.

**Solucion:**
1. Genere la **Balanza de Comprobacion** a la misma fecha de corte.
2. Verifique que los totales de la Balanza cuadren (debitos = creditos).
3. Revise que todas las cuentas tengan el **tipo de cuenta** correcto (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE).
4. Busque cuentas con saldos contrarios a su naturaleza (ej: un activo con saldo acreedor significativo).
5. Verifique que las utilidades del periodo (ingresos - gastos) se reflejen correctamente en el patrimonio.

---

## 6. No puedo editar una partida contabilizada

**Sintoma:** Al abrir una partida en estado POSTED, los campos estan deshabilitados y no hay opcion de edicion.

**Causa:** Por diseno, las partidas contabilizadas no se pueden modificar. Esto es un principio contable fundamental para garantizar la integridad del historial.

**Solucion:**
- **Anule** la partida contabilizada (POSTED a VOIDED). Esto revertira los saldos.
- **Cree una nueva partida** con los datos correctos.
- La partida anulada quedara en el historial para efectos de auditoria.

---

## 7. Los reportes no muestran datos aunque hay partidas creadas

**Sintoma:** Al generar cualquier reporte financiero, aparece vacio o sin montos, aunque existen partidas en el sistema.

**Causa posible:**
- Las partidas estan en estado DRAFT (borrador) y no han sido contabilizadas.
- El rango de fechas seleccionado no incluye las partidas existentes.
- La funcionalidad `advanced_reports` no esta habilitada en el plan.

**Solucion:**
1. Verifique en **Contabilidad > Partidas** que las partidas esten en estado **POSTED**.
2. Si estan en DRAFT, contabilicelas primero.
3. Amplíe el rango de fechas del reporte para asegurarse de incluir el periodo correcto.
4. Verifique que su plan incluya la funcionalidad de reportes avanzados. Contacte al administrador si es necesario.

---

## 8. Error al contabilizar: "La cuenta XXXX no permite movimientos"

**Sintoma:** Al intentar contabilizar una partida, aparece un error indicando que una cuenta no permite registrar movimientos.

**Causa:** La partida incluye una linea que referencia una cuenta de nivel 1, 2 o 3 (cuenta sumaria), o una cuenta con `allowsPosting = false`.

**Solucion:**
1. Vuelva a la partida en borrador.
2. Identifique la linea con la cuenta problematica.
3. Cambie la cuenta por una de **nivel 4** que pertenezca al mismo grupo.
4. Si no existe una cuenta de nivel 4 adecuada, creela en el Catalogo de Cuentas y luego actualice la linea de la partida.

---

## 9. La simulacion muestra resultados diferentes a la partida contabilizada

**Sintoma:** Los saldos proyectados en la simulacion no coinciden con los saldos reales despues de contabilizar la partida.

**Causa posible:**
- Se contabilizaron otras partidas entre el momento de la simulacion y la contabilizacion.
- Los montos o cuentas se modificaron despues de simular y antes de guardar.

**Solucion:**
- La simulacion refleja el estado de los saldos en el momento exacto en que se ejecuta. Si se registran otras partidas despues, los saldos base cambian.
- Ejecute la simulacion nuevamente justo antes de contabilizar para obtener una proyeccion actualizada.
- Verifique que los datos de la partida guardada coincidan con los que uso en la simulacion.

---

## 10. El dashboard muestra "Utilidad Neta" diferente al Estado de Resultados

**Sintoma:** El indicador de Utilidad Neta en el dashboard no coincide con el resultado del Estado de Resultados.

**Causa:** El dashboard calcula los ingresos y gastos **del mes actual** unicamente, mientras que el Estado de Resultados usa el rango de fechas que usted seleccione.

**Solucion:**
- Para comparar, genere el Estado de Resultados usando como fecha de inicio el primer dia del mes actual y como fecha de fin el dia de hoy. Ambos valores deberian coincidir.
- Si aun asi no coinciden, verifique que no haya partidas contabilizadas recientemente que aun no se reflejen (refresque la pagina del dashboard).
