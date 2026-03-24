# Crear y enviar una cotizacion

Esta guia describe paso a paso como crear una cotizacion, agregar items, configurar las condiciones y enviarla al cliente.

---

## 1. Acceder al modulo

1. En el menu lateral, seleccione **Cotizaciones**.
2. Se mostrara la lista de cotizaciones con pestanas para filtrar por estado: **Todas**, **Borrador**, **Enviadas**, **Aprobadas**, **Rechazadas**, **Vencidas**.
3. Haga clic en el boton **Nueva cotizacion**.

## 2. Seleccionar el cliente

1. En el campo **Cliente**, escriba el nombre o NRC del cliente para buscar en su directorio.
2. Seleccione al cliente de la lista de resultados.
3. Los datos fiscales del cliente (nombre, NRC, direccion) se cargaran automaticamente en la cotizacion.

> Si el cliente no existe en su directorio, puede crearlo desde el modulo de Clientes antes de continuar.

## 3. Agregar items

Cada cotizacion requiere al menos un item. Para agregar items:

1. Haga clic en **Agregar item**.
2. En el campo de busqueda, escriba el nombre del producto o servicio de su catalogo.
3. Seleccione el item del catalogo. Se cargaran automaticamente la descripcion y el precio unitario.
4. Complete los campos del item:

| Campo         | Descripcion                                           | Obligatorio |
|---------------|-------------------------------------------------------|-------------|
| Descripcion   | Nombre o detalle del bien/servicio                    | Si          |
| Cantidad      | Numero de unidades                                    | Si          |
| Precio unit.  | Precio por unidad (sin IVA)                           | Si          |
| Descuento     | Monto de descuento aplicado al item (opcional)        | No          |
| Tipo de item  | **1 = Bien** o **2 = Servicio**                       | Si          |

5. Para agregar mas items, repita el proceso con **Agregar item**.
6. Para eliminar un item, haga clic en el icono de papelera junto al item.

Los subtotales y el total general se calculan automaticamente conforme agrega o modifica items.

> Puede modificar la descripcion y el precio cargados desde el catalogo. Los cambios solo afectan a esta cotizacion, no al catalogo.

## 4. Configurar vigencia

- **Valido hasta**: por defecto se establece a 30 dias a partir de la fecha de creacion. Puede modificar esta fecha segun lo requiera.
- Las cotizaciones que superen esta fecha sin respuesta del cliente se marcaran automaticamente como **Vencida** (proceso automatico diario a las 6:00 AM).

## 5. Agregar terminos y notas

- **Terminos y condiciones**: condiciones comerciales, formas de pago, tiempos de entrega u otra clausula contractual. Este texto se muestra al cliente en el portal de aprobacion.
- **Notas**: comentarios internos o informacion adicional para el cliente. Este campo tambien es visible en el portal de aprobacion.

Ambos campos son opcionales pero recomendados para una comunicacion profesional.

## 6. Guardar como borrador

Haga clic en **Guardar** para almacenar la cotizacion con estado **DRAFT** (borrador). En este estado:

- La cotizacion no es visible para el cliente.
- Puede editarla cuantas veces necesite.
- No se envia ninguna notificacion.
- Se le asigna un numero correlativo con formato `COT-YYYY-XXXX`.

## 7. Enviar al cliente

Cuando la cotizacion este lista:

1. Abra la cotizacion desde la lista o despues de guardarla.
2. Haga clic en el boton **Enviar**.
3. El sistema envia un correo electronico al cliente con:
   - Un resumen de la cotizacion (items, montos, vigencia).
   - Un enlace al **portal de aprobacion** donde el cliente puede responder.
4. El estado cambia de `DRAFT` a `SENT`.

> Una vez enviada, la cotizacion no puede editarse directamente. Si necesita hacer cambios, debera crear una nueva version (ver [Portal de aprobacion - Versionamiento](portal-aprobacion.md#versionamiento)).

## 8. Acciones disponibles segun el estado

| Estado              | Acciones disponibles                                      |
|---------------------|-----------------------------------------------------------|
| DRAFT               | Editar, Enviar, Cancelar                                  |
| SENT                | Reenviar, Cancelar                                        |
| APPROVED            | Convertir a factura, Cancelar                             |
| PARTIALLY_APPROVED  | Convertir a factura, Cancelar                             |
| REJECTED            | Crear nueva version                                       |
| CHANGES_REQUESTED   | Crear nueva version                                       |
| EXPIRED             | Crear nueva version                                       |
| CONVERTED           | Ver factura generada                                      |
| CANCELLED           | Ninguna                                                   |

---

## Siguiente paso

Conozca como funciona el portal de aprobacion para el cliente: [Portal de aprobacion](portal-aprobacion.md).
