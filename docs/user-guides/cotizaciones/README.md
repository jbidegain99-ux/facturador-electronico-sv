# Cotizaciones B2B - Guia de Usuario

## Descripcion general

El modulo de **Cotizaciones** de Facturosv permite crear, enviar y gestionar cotizaciones profesionales para clientes empresariales. El flujo completo abarca desde la creacion del documento hasta su conversion automatica en factura electronica (DTE tipo 01).

### Funcionalidades principales

- Creacion de cotizaciones con items del catalogo de productos/servicios
- Envio por correo electronico con enlace de aprobacion
- Portal publico donde el cliente aprueba, rechaza o solicita cambios sin necesidad de cuenta
- Versionamiento automatico cuando el cliente solicita modificaciones
- Conversion directa de cotizacion aprobada a factura electronica
- Notificaciones automaticas por correo (envio, aprobacion, rechazo, recordatorios)
- Verificacion automatica de vencimiento y envio de recordatorios

### Disponibilidad

Esta funcion esta disponible en los planes **Professional** y superiores (feature flag: `quotes_b2b`).

### Formato de numeracion

Las cotizaciones utilizan el formato `COT-YYYY-XXXX`, donde `YYYY` es el ano y `XXXX` es un correlativo secuencial. Ejemplo: `COT-2026-0042`.

### Flujo de estados

```
DRAFT --> SENT --> APPROVED -----------> CONVERTED
                   PARTIALLY_APPROVED --> CONVERTED
                   REJECTED
                   CHANGES_REQUESTED --> (nueva version, regresa a DRAFT)
                   EXPIRED

Cualquier estado --> CANCELLED
```

| Estado                | Descripcion                                                  |
|-----------------------|--------------------------------------------------------------|
| `DRAFT`               | Borrador en edicion, no visible para el cliente              |
| `SENT`                | Enviada al cliente, pendiente de respuesta                   |
| `APPROVED`            | Aprobada por el cliente en su totalidad                      |
| `PARTIALLY_APPROVED`  | Aprobada parcialmente (algunos items fueron removidos)       |
| `REJECTED`            | Rechazada por el cliente (con motivo obligatorio)            |
| `CHANGES_REQUESTED`   | El cliente solicito cambios en items especificos             |
| `EXPIRED`             | Vencida sin respuesta del cliente                            |
| `CONVERTED`           | Convertida exitosamente en factura electronica               |
| `CANCELLED`           | Cancelada manualmente por el usuario                         |

### Automatizaciones (cron)

- **Verificacion de vencimiento**: se ejecuta diariamente a las 6:00 AM. Las cotizaciones cuya fecha de validez haya pasado cambian automaticamente a `EXPIRED`.
- **Recordatorios**: se ejecuta diariamente a las 9:00 AM. Envia un recordatorio por correo al cliente 3 dias antes del vencimiento. Se envian un maximo de 2 recordatorios por cotizacion.

---

## Indice de la guia

1. [Crear y enviar una cotizacion](crear.md)
2. [Portal de aprobacion del cliente](portal-aprobacion.md)
3. [Solucion de problemas](troubleshooting.md)
