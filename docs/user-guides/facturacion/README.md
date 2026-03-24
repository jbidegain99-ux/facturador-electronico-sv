# Facturacion - Guia de usuario

Bienvenido a la guia del modulo de **Facturacion** de Facturosv.com. Este modulo le permite crear, transmitir y gestionar Documentos Tributarios Electronicos (DTE) conforme a la normativa del Ministerio de Hacienda (MH) de El Salvador.

## Flujo general

El proceso de facturacion sigue estos pasos:

1. **Crear** el documento: seleccionar tipo de DTE, agregar cliente, agregar items y guardar.
2. **Firma y transmision automatica**: al guardar, el sistema firma el documento y lo transmite al MH automaticamente.
3. **Recepcion**: el MH procesa el documento y devuelve un sello de recepcion si es aceptado.
4. **Entrega**: el sistema genera el PDF y lo envia por correo al receptor.

## Estados de un DTE

| Estado | Descripcion |
|--------|-------------|
| PENDIENTE | El documento fue creado pero aun no se ha firmado. |
| FIRMADO | El documento fue firmado digitalmente y esta listo para transmitir. |
| PROCESADO | El MH acepto el documento y devolvio un sello de recepcion. |
| RECHAZADO | El MH rechazo el documento. Revise los errores y corrija. |
| ERROR | Ocurrio un error tecnico durante la transmision. |
| ANULADO | El documento fue anulado (invalidado). |

## Contenido de esta guia

- [Crear una factura](crear-factura.md) - Paso a paso para crear cualquier tipo de DTE.
- [Tipos de DTE](tipos-dte.md) - Los 10 tipos de documento tributario electronico soportados.
- [Transmitir a Hacienda](transmitir-hacienda.md) - Como funciona la transmision al MH y que esperar.
- [Anular una factura](anular-factura.md) - Como invalidar un documento ya emitido.
- [Facturas recurrentes](facturas-recurrentes.md) - Automatizar la emision periodica de facturas.
- [Solucion de problemas](troubleshooting.md) - Problemas comunes y como resolverlos.

## Tipos de DTE disponibles

El sistema soporta los siguientes 10 tipos de DTE:

| Codigo | Nombre | Uso principal |
|--------|--------|---------------|
| 01 | Factura | Venta a consumidor final |
| 03 | Comprobante de Credito Fiscal (CCF) | Venta a contribuyente |
| 04 | Nota de Remision | Traslado de mercaderia |
| 05 | Nota de Credito | Devolucion, descuento o correccion a favor del cliente |
| 06 | Nota de Debito | Cargo adicional al cliente |
| 07 | Comprobante de Retencion | Retencion de impuestos |
| 09 | Liquidacion | Liquidacion de operaciones |
| 11 | Factura de Exportacion | Venta al exterior |
| 14 | Factura de Sujeto Excluido | Compra a persona no contribuyente |
| 34 | Comprobante de Retencion CRS | Retencion bajo normativa CRS |

## Requisitos previos

Antes de emitir documentos, asegurese de tener configurado:

- **Credenciales del MH**: NIT y contrasena del portal de Hacienda.
- **Certificado digital**: generado y cargado en el portal del MH.
- **Datos de la empresa**: NRC, actividad economica, direccion fiscal.
- **Al menos un establecimiento**: con su codigo de establecimiento.

Para configurar estos datos, consulte la guia de configuracion de empresa.
