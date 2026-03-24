# Crear una factura

Esta guia explica paso a paso como crear un Documento Tributario Electronico (DTE) en Facturosv.com.

## Paso 1: Seleccionar el tipo de DTE

1. Navegue a **Facturacion** en el menu lateral.
2. Haga clic en el boton **Nueva factura**.
3. Seleccione el tipo de DTE que desea emitir:
   - **01 - Factura**: para ventas a consumidor final.
   - **03 - CCF**: para ventas a otro contribuyente.
   - **04 - Nota de Remision**: para traslado de mercaderia (requiere documento relacionado).
   - **05 - Nota de Credito**: para devoluciones o descuentos (requiere documento relacionado).
   - **06 - Nota de Debito**: para cargos adicionales (requiere documento relacionado).
   - **07 - Retencion**: para retenciones de impuestos.
   - **09 - Liquidacion**: para liquidacion de operaciones.
   - **11 - Exportacion**: para ventas al exterior.
   - **14 - Sujeto Excluido**: para compras a personas no contribuyentes.
   - **34 - Retencion CRS**: para retenciones bajo normativa CRS.

> **Nota**: Los tipos 04, 05 y 06 requieren que seleccione un documento relacionado previamente emitido. Consulte la seccion [Documento relacionado](#documento-relacionado) mas adelante.

## Paso 2: Agregar cliente (receptor)

1. En la seccion **Receptor**, busque el cliente por nombre, NIT o NRC.
2. Si el cliente ya existe en su base de datos, seleccionelo de la lista.
3. Si es un cliente nuevo, haga clic en **Crear cliente** y complete los datos:
   - **Nombre**: nombre completo o razon social.
   - **Tipo de documento**: NIT, DUI u otro.
   - **Numero de documento**: numero del documento de identidad.
   - **NRC**: Numero de Registro de Contribuyente (solo para CCF). Se almacena como digitos sin guion y se muestra con formato `XXXXXX-X`.
   - **Actividad economica**: codigo y descripcion.
   - **Correo electronico**: direccion donde se enviara el DTE.
   - **Telefono**: numero de contacto.
   - **Direccion**: departamento, municipio y complemento.

> **Formato del NRC**: El sistema almacena el NRC como digitos sin guion (ejemplo: `3674750`) pero lo muestra al usuario con guion (ejemplo: `367475-0`). No necesita incluir el guion al ingresarlo.

## Paso 3: Agregar items (cuerpo del documento)

Para cada linea del documento, complete los siguientes campos:

| Campo | Descripcion | Obligatorio |
|-------|-------------|:-----------:|
| **Descripcion** | Nombre o detalle del producto/servicio. | Si |
| **Cantidad** | Numero de unidades. | Si |
| **Precio unitario** | Precio por unidad antes de impuestos. | Si |
| **Es gravado** | Si el item esta gravado con IVA (13%). | Si |
| **Es exento** | Si el item esta exento de IVA. | Si |

### Agregar una linea

1. Haga clic en **Agregar item**.
2. Complete los campos de la linea.
3. El sistema calcula automaticamente:
   - **Subtotal**: cantidad x precio unitario.
   - **IVA**: 13% del subtotal si el item es gravado.
   - **Total de la linea**: subtotal + IVA (o subtotal si es exento).
4. Repita para cada producto o servicio.

### Calculos automaticos

El sistema calcula automaticamente los totales del documento:

- **Subtotal**: suma de todos los subtotales de linea.
- **Total gravado**: suma de items gravados antes de IVA.
- **Total exento**: suma de items exentos.
- **IVA (13%)**: impuesto calculado sobre el total gravado.
- **Total a pagar**: total gravado + IVA + total exento.

> **Precision decimal**: todos los montos se redondean a 2 decimales.

## Paso 4: Condiciones de pago

Seleccione la condicion de pago del documento:

| Codigo | Condicion | Descripcion |
|--------|-----------|-------------|
| 1 | Contado | Pago inmediato al momento de la operacion. |
| 2 | Credito | Pago a plazo, se puede especificar el plazo en dias. |
| 3 | Otro | Otra condicion de pago no especificada. |

## Paso 5: Guardar el documento

1. Revise todos los datos ingresados.
2. Haga clic en **Guardar**.
3. El sistema:
   - Genera el **numero de control** con formato `DTE-[tipo]-[codEstablecimiento]-[UUID]`.
   - Firma digitalmente el documento.
   - Transmite automaticamente el documento al Ministerio de Hacienda.
   - Si la transmision es exitosa, el estado cambia a **PROCESADO**.
   - Si hay un error, el estado cambia a **RECHAZADO** o **ERROR**.

> **Importante**: Al guardar, la firma y transmision son automaticas. No necesita realizar pasos adicionales para enviar el documento al MH.

## Guardado automatico de borradores

El sistema guarda automaticamente un borrador de su documento en el navegador (localStorage) cada **30 segundos**. Esto significa que:

- Si cierra el navegador accidentalmente, su trabajo no se pierde.
- Al volver a la pagina de creacion, el sistema le preguntara si desea restaurar el borrador.
- El borrador se elimina automaticamente al guardar el documento exitosamente.

> **Nota**: Los borradores se almacenan localmente en su navegador. Si cambia de navegador o dispositivo, el borrador no estara disponible.

## Documento relacionado

Los tipos de DTE **04 (Nota de Remision)**, **05 (Nota de Credito)** y **06 (Nota de Debito)** requieren seleccionar un documento previamente emitido como referencia.

1. En la seccion **Documento relacionado**, busque el documento por numero de control o codigo de generacion.
2. Seleccione el documento de la lista de resultados.
3. El sistema vincula automaticamente los datos del documento original.

Para Nota de Credito y Nota de Debito, el documento relacionado establece contra cual factura o CCF se aplica la correccion.

## Despues de guardar

Una vez que el documento se guarda y transmite exitosamente:

1. **PDF**: Se genera automaticamente un PDF del DTE que incluye:
   - Datos fiscales de emisor y receptor.
   - Detalle de items y totales.
   - Codigo QR para verificacion.
   - Logo de la empresa (si esta configurado).

2. **Correo electronico**: El PDF se envia automaticamente como adjunto al correo del receptor.

3. **Sello de recepcion**: El MH devuelve un `selloRecepcion` que certifica la aceptacion del documento.

## Acciones disponibles en el listado

Desde el listado de facturas puede realizar las siguientes acciones sobre cada documento:

| Accion | Descripcion |
|--------|-------------|
| **Ver** | Abre el detalle completo del documento. |
| **Duplicar** | Crea un nuevo documento con los mismos datos (nuevo numero de control). |
| **Descargar PDF** | Descarga el PDF del documento. |
| **Descargar JSON** | Descarga el JSON del DTE para integraciones. |
| **Anular** | Inicia el proceso de anulacion del documento. |

## Filtros y ordenamiento

El listado de facturas ofrece las siguientes opciones de filtrado:

- **Busqueda**: buscar por numero de control, nombre del receptor u otros datos.
- **Tipo de DTE**: filtrar por tipo de documento (01, 03, 05, etc.).
- **Estado**: filtrar por estado (PENDIENTE, PROCESADO, RECHAZADO, etc.).
- **Tamano de pagina**: mostrar 20, 50 o 100 resultados por pagina.

Opciones de ordenamiento disponibles:

- **Fecha de creacion** (`createdAt`): ascendente o descendente.
- **Numero de control** (`numeroControl`): ascendente o descendente.
- **Total a pagar** (`totalPagar`): ascendente o descendente.
