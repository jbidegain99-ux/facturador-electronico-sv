# Webhooks

Los webhooks permiten que Facturosv notifique a sus sistemas en tiempo real cuando ocurren eventos importantes, como la aprobacion de un DTE o el pago de una factura.

> **Requisito:** Los webhooks estan disponibles exclusivamente para el plan **Enterprise**.

## Que son los webhooks

Un webhook es una llamada HTTP POST que Facturosv envia automaticamente a una URL que usted define cada vez que ocurre un evento determinado. A diferencia de la API REST (donde su sistema consulta a Facturosv), con webhooks es Facturosv quien notifica a su sistema.

**Ejemplo de flujo:**

1. Un cliente paga una factura en Facturosv.
2. Facturosv envia un POST a `https://su-servidor.com/webhooks/facturosv` con los datos del evento.
3. Su servidor procesa la notificacion (por ejemplo, actualiza el estado del pedido en su ERP).

---

## Eventos disponibles

Facturosv puede enviar notificaciones para los siguientes 8 eventos:

| Evento | Descripcion |
|--------|-------------|
| `dte.created` | Se creo un nuevo DTE (factura, credito fiscal, etc.) |
| `dte.signed` | Un DTE fue firmado digitalmente |
| `dte.transmitted` | Un DTE fue transmitido al Ministerio de Hacienda |
| `dte.approved` | Hacienda aprobo un DTE |
| `dte.rejected` | Hacienda rechazo un DTE |
| `invoice.paid` | Una factura fue marcada como pagada |
| `client.created` | Se creo un nuevo cliente |
| `quote.approved` | Una cotizacion fue aprobada |

Puede suscribirse a uno, varios o todos los eventos por cada endpoint.

---

## Crear un endpoint de webhook

### Paso 1: Preparar su servidor

Antes de configurar el webhook en Facturosv, asegurese de que su servidor:

1. Tiene una URL publica accesible desde internet (HTTPS requerido).
2. Puede recibir solicitudes HTTP POST.
3. Responde con un codigo de estado `2xx` (200, 201, 204) en menos de 30 segundos.

### Paso 2: Configurar en Facturosv

1. Vaya a **Configuracion > Integraciones > Webhooks**.
2. Haga clic en **Nuevo endpoint**.
3. Complete el formulario:

| Campo | Descripcion |
|-------|-------------|
| URL | La URL publica de su servidor (debe ser HTTPS) |
| Eventos | Seleccione los eventos que desea recibir |
| Descripcion | (Opcional) Nombre descriptivo para identificar este endpoint |

4. Haga clic en **Crear**.
5. Se generara automaticamente un **secreto de firma** (signing secret). Copielo y guardelo de forma segura.

---

## Formato del payload

Cada notificacion de webhook incluye un cuerpo JSON con la siguiente estructura:

```json
{
  "id": "evt_abc123def456",
  "event": "dte.approved",
  "timestamp": "2026-03-24T14:30:00.000Z",
  "data": {
    "id": "clx1abc2def3",
    "tipoDte": "01",
    "codigoGeneracion": "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
    "selloRecibido": "2026031214300012345",
    "estado": "APROBADO",
    "cliente": {
      "nombre": "Empresa Ejemplo S.A. de C.V.",
      "nit": "06141234567890"
    },
    "total": 1130.00
  }
}
```

---

## Seguridad: verificacion de firma HMAC

Cada solicitud de webhook incluye una firma HMAC-SHA256 en el encabezado `X-Webhook-Signature-256`. Esta firma permite verificar que la solicitud fue enviada por Facturosv y no fue alterada en transito.

### Como verificar la firma

1. Obtenga el cuerpo crudo (raw body) de la solicitud.
2. Calcule el HMAC-SHA256 del cuerpo usando su secreto de firma.
3. Compare el resultado con el valor del encabezado `X-Webhook-Signature-256`.

### Ejemplo en Node.js

```javascript
const crypto = require('crypto');

function verificarFirma(payload, firmaRecibida, secreto) {
  const firmaCalculada = crypto
    .createHmac('sha256', secreto)
    .update(payload, 'utf8')
    .digest('hex');

  const firmaEsperada = `sha256=${firmaCalculada}`;

  return crypto.timingSafeEqual(
    Buffer.from(firmaEsperada),
    Buffer.from(firmaRecibida)
  );
}

// En su handler de Express:
app.post('/webhooks/facturosv', express.raw({ type: 'application/json' }), (req, res) => {
  const firma = req.headers['x-webhook-signature-256'];
  const secreto = process.env.WEBHOOK_SECRET;

  if (!verificarFirma(req.body.toString(), firma, secreto)) {
    return res.status(401).send('Firma invalida');
  }

  const evento = JSON.parse(req.body);
  console.log(`Evento recibido: ${evento.event}`);

  // Procesar el evento...

  res.status(200).send('OK');
});
```

### Ejemplo en Python

```python
import hmac
import hashlib

def verificar_firma(payload: bytes, firma_recibida: str, secreto: str) -> bool:
    firma_calculada = hmac.new(
        secreto.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    firma_esperada = f"sha256={firma_calculada}"

    return hmac.compare_digest(firma_esperada, firma_recibida)

# En su handler de Flask:
@app.route('/webhooks/facturosv', methods=['POST'])
def webhook_handler():
    firma = request.headers.get('X-Webhook-Signature-256')
    secreto = os.environ['WEBHOOK_SECRET']

    if not verificar_firma(request.data, firma, secreto):
        return 'Firma invalida', 401

    evento = request.get_json()
    print(f"Evento recibido: {evento['event']}")

    # Procesar el evento...

    return 'OK', 200
```

> **Importante:** Siempre verifique la firma antes de procesar el evento. Nunca confie en datos de un webhook sin validar la firma.

---

## Politica de reintentos

Si su servidor no responde con un codigo `2xx`, Facturosv reintenta la entrega con una estrategia de espera exponencial (exponential backoff):

| Intento | Espera aproximada |
|---------|-------------------|
| 1 (original) | Inmediato |
| 2 | ~30 segundos |
| 3 | ~2 minutos |
| 4 | ~8 minutos |
| 5 | ~30 minutos |

- **Maximo de reintentos:** 5 (configurable al crear el endpoint).
- **Procesamiento:** Los reintentos se ejecutan cada 30 segundos por el sistema de procesamiento.
- Despues de agotar todos los reintentos, el evento se mueve a **Dead Letter** (carta muerta).

### Ciclo de vida de un evento

```
PENDING → SENDING → DELIVERED
                  ↘ FAILED → (reintento) → DELIVERED
                                         → DEAD_LETTER
```

| Estado | Descripcion |
|--------|-------------|
| **PENDING** | El evento esta en cola esperando ser procesado |
| **SENDING** | El evento se esta enviando al endpoint |
| **DELIVERED** | El endpoint respondio con un codigo 2xx |
| **FAILED** | El envio fallo. Se reintentara automaticamente |
| **DEAD_LETTER** | Se agotaron todos los reintentos. Requiere atencion manual |

---

## Pruebas y depuracion

### Enviar ping de prueba

Antes de esperar un evento real, puede verificar que su endpoint esta configurado correctamente:

1. Vaya a **Webhooks > Su endpoint**.
2. Haga clic en **Enviar ping de prueba**.
3. Facturosv enviara un evento de prueba a su URL:

```json
{
  "id": "evt_test_ping",
  "event": "ping",
  "timestamp": "2026-03-24T14:30:00.000Z",
  "data": {
    "message": "Conexion verificada exitosamente"
  }
}
```

4. Si su servidor responde con `200`, la prueba es exitosa.

### Ver historial de entregas

En la pagina de detalle de cada endpoint puede ver:

- La lista de eventos enviados con su estado (DELIVERED, FAILED, DEAD_LETTER).
- El cuerpo del payload enviado.
- El codigo de respuesta de su servidor.
- El tiempo de respuesta.
- La cantidad de reintentos realizados.

### Reenviar eventos

Para eventos en estado DEAD_LETTER o FAILED, puede hacer clic en **Reenviar** para intentar la entrega nuevamente. Esto reinicia el contador de reintentos.

---

## Estadisticas

Facturosv proporciona un endpoint de estadisticas para monitorear la salud de sus webhooks:

### Desde la interfaz

Vaya a **Webhooks > Estadisticas** para ver:

- Total de eventos enviados (por periodo).
- Tasa de entrega exitosa (%).
- Eventos en DEAD_LETTER que requieren atencion.
- Tiempo promedio de respuesta de su servidor.
- Desglose por tipo de evento.

### Desde la API

```bash
curl -X GET "https://api.facturosv.com/api/v1/webhooks/stats" \
  -H "Authorization: Bearer eyJhbGciOi..."
```

Respuesta:

```json
{
  "totalEvents": 1250,
  "delivered": 1230,
  "failed": 15,
  "deadLetter": 5,
  "deliveryRate": 98.4,
  "avgResponseTimeMs": 245
}
```

---

## Buenas practicas

1. **Responda rapido:** Su endpoint debe responder en menos de 30 segundos. Si necesita hacer procesamiento pesado, responda `200` inmediatamente y procese el evento de forma asincrona.

2. **Implemente idempotencia:** Es posible recibir el mismo evento mas de una vez (por reintentos). Use el campo `id` del evento para evitar procesamiento duplicado.

3. **Verifique la firma siempre:** No omita la verificacion HMAC, incluso en desarrollo.

4. **Use HTTPS:** Los webhooks solo se envian a URLs HTTPS. No se soportan URLs HTTP sin cifrado.

5. **Monitoree Dead Letters:** Revise periodicamente los eventos en DEAD_LETTER para identificar y resolver problemas en su servidor receptor.

6. **Registre los payloads:** Guarde los payloads recibidos en sus logs para facilitar la depuracion en caso de problemas.
