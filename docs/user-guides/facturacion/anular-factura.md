# Anular una factura

Esta guia explica como anular (invalidar) un Documento Tributario Electronico (DTE) en Facturosv.com.

## Que es la anulacion

La anulacion es el proceso de invalidar un DTE previamente emitido. Un documento anulado pierde su validez fiscal y no puede utilizarse como respaldo de operaciones tributarias.

La anulacion se comunica al Ministerio de Hacienda (MH) para que quede registrada oficialmente.

## Cuando se puede anular

Un documento solo puede anularse si se encuentra en uno de los siguientes estados:

| Estado | Se puede anular |
|--------|:--------------:|
| PENDIENTE | Si |
| FIRMADO | Si |
| PROCESADO | Si |
| RECHAZADO | No |
| ERROR | No |
| ANULADO | No |

> **Nota**: Un documento en estado RECHAZADO o ERROR no necesita anularse porque nunca fue aceptado por el MH. Un documento ya ANULADO no puede anularse nuevamente.

## Requisitos para anular

1. **Estado valido**: El documento debe estar en estado PENDIENTE, FIRMADO o PROCESADO.
2. **Motivo de anulacion**: Debe proporcionar un motivo con al menos **10 caracteres** de longitud. El motivo debe describir claramente la razon de la anulacion.

## Paso a paso

### 1. Localizar el documento

1. Navegue a **Facturacion** en el menu lateral.
2. Use los filtros para encontrar el documento que desea anular:
   - Busque por numero de control, nombre del receptor u otros datos.
   - Filtre por tipo de DTE o estado.
3. Haga clic en el documento para abrir su detalle.

### 2. Iniciar la anulacion

1. En el detalle del documento, haga clic en el boton **Anular**.
2. Se abrira un dialogo de confirmacion.

### 3. Ingresar el motivo

1. En el campo **Motivo de anulacion**, escriba la razon por la que anula el documento.
2. El motivo debe tener al menos **10 caracteres**. Ejemplos validos:
   - "Error en los datos del receptor, se emitira nuevo documento."
   - "El cliente solicito cambio en los items facturados."
   - "Documento emitido por error, operacion no realizada."
3. Ejemplos no validos (muy cortos):
   - "Error" (solo 5 caracteres).
   - "Anulado" (solo 7 caracteres).

### 4. Confirmar la anulacion

1. Haga clic en **Confirmar anulacion**.
2. El sistema procesa la anulacion.

## Tipos de anulacion

### Anulacion local (documentos PENDIENTE o FIRMADO)

Si el documento nunca fue aceptado por el MH (estados PENDIENTE o FIRMADO):

- La anulacion es **solo local**. El sistema marca el documento como ANULADO en la base de datos.
- No se envia ninguna solicitud al MH porque el documento nunca fue registrado en sus sistemas.
- El proceso es inmediato.

### Anulacion con el MH (documentos PROCESADO)

Si el documento ya fue aceptado por el MH (estado PROCESADO):

- El sistema envia una solicitud de invalidacion al MH.
- El MH valida la solicitud y la registra.
- Si el MH acepta la anulacion, el documento cambia a estado ANULADO.
- Si el MH rechaza la anulacion, el documento mantiene su estado PROCESADO y se muestra un mensaje de error.

> **Importante**: La anulacion de un documento PROCESADO requiere credenciales activas del MH y conectividad con sus servidores.

## Que sucede despues de anular

1. El documento cambia a estado **ANULADO**.
2. El documento permanece visible en el listado pero con la etiqueta de estado ANULADO.
3. No se puede revertir una anulacion. Si necesita el documento, debe crear uno nuevo.
4. Los reportes fiscales excluyen los documentos anulados de los totales.

## Consideraciones importantes

- **La anulacion es irreversible**: Una vez anulado, el documento no puede restaurarse. Si necesita facturar la misma operacion, cree un documento nuevo.
- **Motivo obligatorio**: El motivo de anulacion queda registrado como parte del historial del documento y puede ser auditado.
- **Plazo para anular**: Consulte la normativa vigente del MH para conocer los plazos maximos de anulacion de documentos ya transmitidos.
- **Alternativa a la anulacion**: Si necesita corregir montos, considere emitir una Nota de Credito (tipo 05) o Nota de Debito (tipo 06) en lugar de anular el documento completo.
- **Documentos relacionados**: Si el documento que desea anular tiene Notas de Credito o Debito asociadas, considere el impacto de la anulacion en esos documentos vinculados.
