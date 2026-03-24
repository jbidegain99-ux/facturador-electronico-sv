# Contabilidad - Guia de Usuario

## Descripcion general

El modulo de **Contabilidad** de Facturosv integra la gestion contable directamente con la facturacion electronica. Basado en las Normas Internacionales de Informacion Financiera para Pequenas y Medianas Empresas (NIIF PYMES), permite llevar un control contable completo sin necesidad de software externo.

### Capacidades principales

- **Catalogo de cuentas** predefinido con ~150 cuentas basadas en NIIF PYMES para El Salvador, con jerarquia de 4 niveles.
- **Partidas contables** manuales y automaticas, con flujo de estados (Borrador, Contabilizada, Anulada).
- **Contabilizacion automatica** de facturas y otros DTE mediante reglas de mapeo configurables.
- **Reportes financieros**: Balanza de Comprobacion, Balance General, Estado de Resultados y Libro Mayor.
- **Dashboard contable** con indicadores clave (activos, pasivos, patrimonio, ingresos, gastos, utilidad neta).
- **Simulacion** de impacto contable antes de registrar operaciones.

### Disponibilidad

El modulo de Contabilidad esta disponible a partir del plan **STARTER**. Los reportes avanzados requieren la funcionalidad `advanced_reports`.

| Funcionalidad | Plan requerido |
|---|---|
| Catalogo de cuentas | STARTER+ |
| Partidas manuales | STARTER+ |
| Contabilizacion automatica | STARTER+ |
| Reportes financieros | STARTER+ (con `advanced_reports`) |
| Dashboard contable | STARTER+ |

---

## Indice de contenidos

1. [Catalogo de Cuentas](catalogo-cuentas.md)
   - Que es el catalogo de cuentas
   - Como inicializar el catalogo predeterminado NIIF PYMES
   - Crear, editar y desactivar cuentas
   - Jerarquia y niveles
   - Tipos de cuenta y saldos normales

2. [Partidas Contables](partidas.md)
   - Que son las partidas contables
   - Crear partidas manuales
   - Agregar lineas (debe/haber)
   - Contabilizar partidas (Borrador a Contabilizada)
   - Anular partidas (Contabilizada a Anulada)
   - Formato de numeracion
   - Reglas de validacion

3. [Reportes Financieros](reportes.md)
   - Balanza de Comprobacion
   - Balance General
   - Estado de Resultados
   - Libro Mayor
   - Filtros de fecha
   - Interpretacion de resultados
   - Indicadores del Dashboard

4. [Solucion de Problemas](troubleshooting.md)
   - Problemas comunes y sus soluciones

---

## Flujo de trabajo recomendado

1. **Inicializar el catalogo** de cuentas con la semilla NIIF PYMES.
2. **Revisar y personalizar** las cuentas segun las necesidades de la empresa.
3. **Configurar las reglas de mapeo** para contabilizacion automatica de DTEs.
4. **Habilitar la contabilizacion automatica** en la configuracion del tenant.
5. **Emitir facturas** y verificar que las partidas se generen correctamente.
6. **Consultar reportes** para monitorear la situacion financiera.

---

## Conceptos clave

| Termino | Descripcion |
|---|---|
| **Cuenta contable** | Categoria donde se registran movimientos financieros (ej: Efectivo, Cuentas por Cobrar). |
| **Partida contable** | Registro que documenta una transaccion financiera con al menos dos lineas. |
| **Debe (Debito)** | Lado izquierdo de una partida. Aumenta activos y gastos, disminuye pasivos e ingresos. |
| **Haber (Credito)** | Lado derecho de una partida. Aumenta pasivos e ingresos, disminuye activos y gastos. |
| **Saldo normal** | Indica si una cuenta normalmente tiene saldo deudor (DEBIT) o acreedor (CREDIT). |
| **Partida doble** | Principio fundamental: toda transaccion afecta al menos dos cuentas y los debitos deben igualar los creditos. |
| **NIIF PYMES** | Normas contables internacionales adaptadas para pequenas y medianas empresas. |
