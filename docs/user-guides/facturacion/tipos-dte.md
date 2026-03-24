# Tipos de DTE

Facturosv.com soporta los 10 tipos de Documento Tributario Electronico (DTE) definidos por el Ministerio de Hacienda de El Salvador.

## Resumen de tipos

| Codigo | Nombre | Requiere doc. relacionado | Uso principal |
|--------|--------|:-------------------------:|---------------|
| 01 | Factura | No | Venta a consumidor final |
| 03 | Comprobante de Credito Fiscal | No | Venta a contribuyente |
| 04 | Nota de Remision | Si | Traslado de mercaderia |
| 05 | Nota de Credito | Si | Correccion a favor del cliente |
| 06 | Nota de Debito | Si | Cargo adicional al cliente |
| 07 | Comprobante de Retencion | No | Retencion de impuestos |
| 09 | Liquidacion | No | Liquidacion de operaciones |
| 11 | Factura de Exportacion | No | Venta al exterior |
| 14 | Factura de Sujeto Excluido | No | Compra a no contribuyente |
| 34 | Comprobante de Retencion CRS | No | Retencion bajo normativa CRS |

---

## 01 - Factura

**Uso**: Emitir a consumidor final (persona natural sin NRC).

**Cuando usarla**:
- Venta de bienes o servicios a personas que no son contribuyentes.
- Ventas en las que el comprador no solicita CCF.

**Campos principales**:
- Receptor: nombre, DUI o documento de identidad, direccion, correo.
- Items: descripcion, cantidad, precio unitario, gravado/exento.
- Condicion de pago: contado, credito u otro.

**IVA**: El IVA (13%) va incluido en el precio de los items gravados. El consumidor final no desglosa IVA.

---

## 03 - Comprobante de Credito Fiscal (CCF)

**Uso**: Emitir a otro contribuyente (empresa o persona con NRC).

**Cuando usarlo**:
- Venta entre contribuyentes.
- El comprador necesita el documento para deducir credito fiscal.

**Campos principales**:
- Receptor: razon social, NIT, NRC, actividad economica, direccion, correo.
- Items: descripcion, cantidad, precio unitario, gravado/exento.
- Condicion de pago.

**IVA**: El IVA (13%) se desglosa por separado en los items gravados.

**Diferencia con la Factura**: El CCF permite al receptor usar el IVA como credito fiscal. Requiere NRC del receptor.

---

## 04 - Nota de Remision

**Uso**: Documentar el traslado de mercaderia entre establecimientos o hacia un cliente sin que exista una venta inmediata.

**Cuando usarla**:
- Traslado de inventario entre sucursales.
- Envio de mercaderia en consignacion.
- Despacho de bienes previo a la facturacion.

**Requiere documento relacionado**: Si. Debe vincularse a una factura o CCF existente, o indicar el motivo del traslado.

**Campos especiales**:
- Documento relacionado: referencia al DTE original.
- Motivo del traslado.

---

## 05 - Nota de Credito

**Uso**: Corregir una factura o CCF previamente emitida a favor del cliente (reducir el monto).

**Cuando usarla**:
- Devolucion total o parcial de mercaderia.
- Aplicar un descuento despues de emitir la factura.
- Corregir un error en el monto cobrado (a favor del cliente).

**Requiere documento relacionado**: Si. Debe vincularse a la factura o CCF que se esta corrigiendo.

**Campos especiales**:
- Documento relacionado: numero de control y codigo de generacion del DTE original.
- Items: los productos o servicios que se estan devolviendo o descontando.

> **Importante**: La Nota de Credito no anula el documento original. Ambos documentos quedan vigentes, pero la Nota de Credito reduce el saldo a favor del cliente.

---

## 06 - Nota de Debito

**Uso**: Agregar un cargo adicional a una factura o CCF previamente emitida.

**Cuando usarla**:
- Cobrar intereses por mora.
- Ajustar precios al alza despues de emitir la factura.
- Agregar cargos no incluidos en el documento original.

**Requiere documento relacionado**: Si. Debe vincularse a la factura o CCF que se esta ajustando.

**Campos especiales**:
- Documento relacionado: numero de control y codigo de generacion del DTE original.
- Items: los cargos adicionales que se estan aplicando.

---

## 07 - Comprobante de Retencion

**Uso**: Documentar retenciones de impuestos realizadas a un proveedor o tercero.

**Cuando usarlo**:
- Retencion de ISR (Impuesto sobre la Renta).
- Retencion de IVA a proveedores.
- Cualquier retencion fiscal obligatoria.

**Campos especiales**:
- Tipo de retencion (ISR, IVA, etc.).
- Monto retenido.
- Base imponible.

---

## 09 - Liquidacion

**Uso**: Documentar la liquidacion de operaciones realizadas por cuenta de terceros.

**Cuando usarla**:
- Liquidacion de comisiones.
- Rendicion de cuentas de operaciones realizadas como intermediario.
- Liquidacion de ventas en consignacion.

**Campos especiales**:
- Detalle de las operaciones liquidadas.
- Comisiones o cargos aplicados.
- Monto neto a pagar o cobrar.

---

## 11 - Factura de Exportacion

**Uso**: Documentar ventas de bienes o servicios al exterior de El Salvador.

**Cuando usarla**:
- Venta de productos a clientes en otros paises.
- Prestacion de servicios a empresas extranjeras.

**Campos especiales**:

| Campo | Descripcion |
|-------|-------------|
| **codIncoterms** | Codigo Incoterms que define las responsabilidades de entrega (FOB, CIF, EXW, etc.). |
| **flete** | Costo del flete o transporte internacional. |
| **seguro** | Costo del seguro de la mercaderia. |
| **descuento** | Descuentos aplicados. |
| **observaciones** | Notas adicionales sobre la exportacion. |

**IVA**: Las exportaciones estan exentas de IVA (tasa 0%).

**Receptor**: Debe incluir datos del cliente en el exterior (nombre, pais, direccion).

---

## 14 - Factura de Sujeto Excluido

**Uso**: Documentar compras realizadas a personas naturales que no son contribuyentes del IVA.

**Cuando usarla**:
- Compra de bienes o servicios a personas que no emiten facturas.
- Adquisicion de productos agricolas directamente al productor.
- Pagos a personas naturales por servicios esporadicos.

**Campos especiales**:

| Campo | Descripcion |
|-------|-------------|
| **sujetoExcluido** | Objeto con los datos del vendedor no contribuyente. |
| **sujetoExcluido.nombre** | Nombre completo de la persona. |
| **sujetoExcluido.tipoDocumento** | Tipo de documento de identidad (DUI, pasaporte, etc.). |
| **sujetoExcluido.numDocumento** | Numero del documento. |
| **sujetoExcluido.direccion** | Direccion del sujeto excluido. |

> **Nota**: En este tipo de DTE, su empresa es la **compradora** y el sujeto excluido es el **vendedor**. El documento lo emite el comprador.

**IVA**: No aplica IVA. El comprador esta obligado a retener el 1% de ISR si el monto supera $100.00.

---

## 34 - Comprobante de Retencion CRS

**Uso**: Documentar retenciones bajo la normativa CRS (Common Reporting Standard) para intercambio automatico de informacion financiera.

**Cuando usarlo**:
- Instituciones financieras que deben reportar bajo CRS.
- Retenciones a cuentahabientes sujetos a reporte CRS.

**Campos especiales**:
- Datos del titular de la cuenta.
- Jurisdiccion de residencia fiscal.
- Numero de identificacion fiscal del titular.
- Monto retenido bajo CRS.

---

## Documentos relacionados

Los tipos **04**, **05** y **06** requieren un documento relacionado. Al crear uno de estos documentos:

1. El sistema muestra un campo de busqueda para localizar el documento original.
2. Puede buscar por numero de control o codigo de generacion.
3. Al seleccionar el documento, el sistema vincula automaticamente:
   - Numero de control del documento original.
   - Codigo de generacion.
   - Fecha de emision.
   - Datos del receptor.

El documento relacionado establece la trazabilidad fiscal entre los documentos y es obligatorio para la aceptacion por parte del MH.

## Seleccionar el tipo correcto

| Situacion | Tipo recomendado |
|-----------|-----------------|
| Vendo a un consumidor final | 01 - Factura |
| Vendo a otra empresa contribuyente | 03 - CCF |
| Traslado mercaderia sin venta | 04 - Nota de Remision |
| El cliente devuelve producto | 05 - Nota de Credito |
| Cobro adicional despues de facturar | 06 - Nota de Debito |
| Retengo impuesto a un proveedor | 07 - Retencion |
| Liquido operaciones de un tercero | 09 - Liquidacion |
| Vendo a un cliente en otro pais | 11 - Exportacion |
| Compro a alguien sin NRC | 14 - Sujeto Excluido |
| Retencion bajo normativa CRS | 34 - Retencion CRS |
