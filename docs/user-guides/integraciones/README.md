# Integraciones - Guia del Usuario

Facturosv permite conectar su cuenta con servicios externos para ampliar las capacidades de facturacion electronica. Esta guia cubre todas las integraciones disponibles.

## Contenido

| Guia | Descripcion |
|------|-------------|
| [Correos Externos](./correos-externos.md) | Configure un proveedor de correo externo para enviar DTEs, cotizaciones y notificaciones desde su propio dominio. |
| [Hacienda (MH)](./hacienda.md) | Conecte su cuenta con el Ministerio de Hacienda para firmar y transmitir documentos tributarios electronicos. |
| [API REST](./api-rest.md) | Integre Facturosv con sus sistemas mediante la API REST. Requiere plan Enterprise. |
| [Webhooks](./webhooks.md) | Reciba notificaciones en tiempo real cuando ocurran eventos en su cuenta. Requiere plan Enterprise. |
| [Solucion de Problemas](./troubleshooting.md) | Diagnostico y solucion de los problemas mas comunes en integraciones. |

## Requisitos por plan

| Integracion | Starter | Professional | Enterprise |
|-------------|---------|--------------|------------|
| Correos Externos | Si | Si | Si |
| Hacienda (MH) | Si | Si | Si |
| API REST | No | No | Si |
| Webhooks | No | No | Si |

## Antes de comenzar

1. Inicie sesion en [Facturosv.com](https://facturosv.com).
2. Navegue a **Configuracion > Integraciones** desde el menu lateral.
3. Seleccione la integracion que desea configurar.

> **Nota:** Algunas integraciones requieren credenciales de servicios externos. Tenga a la mano las credenciales necesarias antes de iniciar la configuracion.
