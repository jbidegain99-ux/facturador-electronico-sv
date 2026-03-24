# API REST

La API REST de Facturosv permite integrar la facturacion electronica con sus sistemas existentes (ERP, CRM, e-commerce, etc.) de forma programatica.

> **Requisito:** La API REST esta disponible exclusivamente para el plan **Enterprise**.

## Autenticacion

La API utiliza autenticacion mediante tokens JWT (JSON Web Token) con el esquema Bearer.

### Obtener un token

1. Vaya a **Configuracion > Integraciones > API REST**.
2. Haga clic en **Generar API Key**.
3. Asigne un nombre descriptivo a la clave (por ejemplo, "ERP Produccion").
4. Copie el token generado. **Se muestra una sola vez.**
5. Almacene el token de forma segura en su sistema.

### Usar el token

Incluya el token en el encabezado `Authorization` de cada solicitud HTTP:

```
Authorization: Bearer <su-token-jwt>
```

**Ejemplo:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Renovar o revocar tokens

- Para crear un nuevo token, repita el proceso de generacion.
- Para revocar un token existente, vaya a **API REST > Claves activas** y haga clic en **Revocar** junto a la clave que desea desactivar.
- Un token revocado deja de funcionar inmediatamente.

---

## URL base

Todas las solicitudes se realizan a la siguiente URL base:

```
https://api.facturosv.com/api/v1/
```

---

## Endpoints principales

### Clientes

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/clientes` | Listar clientes |
| GET | `/api/v1/clientes/:id` | Obtener un cliente |
| POST | `/api/v1/clientes` | Crear un cliente |
| PUT | `/api/v1/clientes/:id` | Actualizar un cliente |
| DELETE | `/api/v1/clientes/:id` | Eliminar un cliente |

### Productos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/productos` | Listar productos |
| GET | `/api/v1/productos/:id` | Obtener un producto |
| POST | `/api/v1/productos` | Crear un producto |
| PUT | `/api/v1/productos/:id` | Actualizar un producto |
| DELETE | `/api/v1/productos/:id` | Eliminar un producto |

### Facturas / DTEs

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/facturas` | Listar facturas |
| GET | `/api/v1/facturas/:id` | Obtener una factura |
| POST | `/api/v1/facturas` | Crear y transmitir una factura |
| GET | `/api/v1/facturas/:id/pdf` | Descargar PDF de la factura |
| GET | `/api/v1/facturas/:id/json` | Descargar JSON del DTE |

### Cotizaciones

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/cotizaciones` | Listar cotizaciones |
| POST | `/api/v1/cotizaciones` | Crear una cotizacion |
| POST | `/api/v1/cotizaciones/:id/aprobar` | Aprobar y convertir a factura |

### Empresa

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/empresa` | Obtener datos de la empresa |
| PUT | `/api/v1/empresa` | Actualizar datos de la empresa |

---

## Ejemplos de codigo

### cURL

**Listar clientes:**

```bash
curl -X GET "https://api.facturosv.com/api/v1/clientes" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json"
```

**Crear una factura:**

```bash
curl -X POST "https://api.facturosv.com/api/v1/facturas" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "clx1abc2def3",
    "tipoDte": "01",
    "items": [
      {
        "productoId": "clx4ghi5jkl6",
        "cantidad": 2,
        "precioUnitario": 25.00,
        "descripcion": "Servicio de consultoria"
      }
    ],
    "condicionOperacion": 1,
    "observaciones": "Factura generada via API"
  }'
```

**Descargar PDF:**

```bash
curl -X GET "https://api.facturosv.com/api/v1/facturas/clx7mno8pqr9/pdf" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  --output factura.pdf
```

### JavaScript (Node.js / fetch)

**Listar clientes:**

```javascript
const API_BASE = 'https://api.facturosv.com/api/v1';
const TOKEN = 'eyJhbGciOi...';

const response = await fetch(`${API_BASE}/clientes`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
});

const clientes = await response.json();
console.log(clientes);
```

**Crear una factura:**

```javascript
const factura = await fetch(`${API_BASE}/facturas`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clienteId: 'clx1abc2def3',
    tipoDte: '01',
    items: [
      {
        productoId: 'clx4ghi5jkl6',
        cantidad: 2,
        precioUnitario: 25.00,
        descripcion: 'Servicio de consultoria',
      },
    ],
    condicionOperacion: 1,
  }),
});

const resultado = await factura.json();
console.log(resultado);
```

### Python (requests)

**Listar clientes:**

```python
import requests

API_BASE = "https://api.facturosv.com/api/v1"
TOKEN = "eyJhbGciOi..."

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

response = requests.get(f"{API_BASE}/clientes", headers=headers)
clientes = response.json()
print(clientes)
```

**Crear una factura:**

```python
payload = {
    "clienteId": "clx1abc2def3",
    "tipoDte": "01",
    "items": [
        {
            "productoId": "clx4ghi5jkl6",
            "cantidad": 2,
            "precioUnitario": 25.00,
            "descripcion": "Servicio de consultoria",
        }
    ],
    "condicionOperacion": 1,
}

response = requests.post(f"{API_BASE}/facturas", json=payload, headers=headers)
resultado = response.json()
print(resultado)
```

---

## Paginacion

Los endpoints que retornan listas soportan paginacion mediante parametros de consulta:

| Parametro | Tipo | Descripcion | Predeterminado |
|-----------|------|-------------|----------------|
| `page` | number | Numero de pagina (comienza en 1) | 1 |
| `limit` | number | Cantidad de registros por pagina | 20 |

**Ejemplo:**

```
GET /api/v1/clientes?page=2&limit=50
```

La respuesta incluye metadatos de paginacion:

```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 50,
    "total": 230,
    "totalPages": 5
  }
}
```

---

## Codigos de respuesta

| Codigo | Significado |
|--------|-------------|
| 200 | Solicitud exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Error de validacion en los datos enviados |
| 401 | Token invalido o expirado |
| 403 | Sin permisos para esta operacion |
| 404 | Recurso no encontrado |
| 429 | Limite de solicitudes excedido |
| 500 | Error interno del servidor |

---

## Limites de uso (Rate Limiting)

Para garantizar la estabilidad del servicio, la API aplica limites de solicitudes:

| Plan | Solicitudes por minuto | Solicitudes por hora |
|------|----------------------|---------------------|
| Enterprise | 60 | 1,000 |

Cuando excede el limite, la API retorna el codigo `429 Too Many Requests` con los siguientes encabezados:

| Encabezado | Descripcion |
|------------|-------------|
| `X-RateLimit-Limit` | Limite total del periodo |
| `X-RateLimit-Remaining` | Solicitudes restantes |
| `X-RateLimit-Reset` | Timestamp (Unix) de cuando se reinicia el contador |

**Recomendacion:** Implemente logica de reintento con espera exponencial (exponential backoff) cuando reciba un codigo 429.

---

## Manejo de errores

Las respuestas de error siguen un formato consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo clienteId es requerido",
    "details": [
      {
        "field": "clienteId",
        "message": "Este campo es obligatorio"
      }
    ]
  }
}
```

**Buenas practicas:**
- Siempre verifique el codigo de estado HTTP antes de procesar la respuesta.
- Registre los errores en sus logs para facilitar la depuracion.
- Nunca exponga su token JWT en codigo del lado del cliente (frontend). Realice las llamadas a la API desde su servidor backend.
