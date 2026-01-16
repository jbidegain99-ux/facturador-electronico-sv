# Facturador Electronico SV

Sistema de facturacion electronica para El Salvador, integrado con el Ministerio de Hacienda (MH).

## Arquitectura

```
facturador-electronico-sv/
├── apps/
│   ├── api/          # NestJS Backend API
│   └── web/          # Next.js 14 Frontend
├── packages/
│   ├── mh-client/    # Cliente HTTP para API del MH
│   └── shared/       # Tipos y schemas compartidos
└── docs/
    └── mh/           # Documentacion y schemas del MH
```

## Requisitos

- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Redis 7+ (para colas de transmision)
- Certificado digital .p12 del MH

## Setup Rapido

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/jbidegain99-ux/facturador-electronico-sv.git
cd facturador-electronico-sv
npm install
```

### 2. Configurar variables de entorno

```bash
# API
cp apps/api/.env.example apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
```

Edita `apps/api/.env`:

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/facturador"

# JWT
JWT_SECRET="tu-secret-seguro"

# Redis (para colas)
REDIS_HOST=localhost
REDIS_PORT=6379

# Ministerio de Hacienda
MH_API_ENV=test
MH_NIT=tu-nit
MH_PASSWORD=tu-password

# Certificado digital
CERT_PATH=/path/to/certificado.p12
CERT_PASSWORD=password-certificado
```

### 3. Iniciar servicios con Docker

```bash
docker-compose up -d
```

Esto inicia:
- PostgreSQL en puerto 5432
- Redis en puerto 6379

### 4. Ejecutar migraciones

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### 5. Iniciar en modo desarrollo

```bash
# Desde la raiz del proyecto
npm run dev
```

Esto inicia:
- API en http://localhost:3001
- Web en http://localhost:3000

## Modulos del Sistema

### API (NestJS)

| Modulo | Descripcion |
|--------|-------------|
| `auth` | Autenticacion JWT y credenciales MH |
| `tenants` | Multi-tenancy para empresas |
| `dte` | Constructor y validador de DTEs |
| `signer` | Firma digital JWS con certificado .p12 |
| `transmitter` | Transmision al MH con reintentos |
| `catalog` | Catalogos de El Salvador |

### Endpoints Principales

```
POST /auth/login              # Login usuario
POST /auth/mh/authenticate    # Autenticar con MH

GET  /catalog/departamentos   # Catalogos SV
GET  /catalog/municipios/:dep

POST /dte/factura             # Crear factura
POST /dte/ccf                 # Crear CCF
GET  /dte/:id                 # Obtener DTE

POST /signer/load             # Cargar certificado
POST /signer/test             # Firmar documento prueba

POST /transmitter/send/:id    # Enviar DTE al MH
GET  /transmitter/status/:cod # Consultar estado
```

### Web (Next.js)

| Pagina | Ruta |
|--------|------|
| Dashboard | `/` |
| Facturas | `/facturas` |
| Nueva Factura | `/facturas/nueva` |
| Detalle Factura | `/facturas/[id]` |
| Clientes | `/clientes` |
| Configuracion | `/configuracion` |

## Tipos de DTE Soportados

| Codigo | Tipo | Descripcion |
|--------|------|-------------|
| 01 | Factura | Factura Electronica |
| 03 | CCF | Comprobante Credito Fiscal |
| 05 | NC | Nota de Credito |
| 06 | ND | Nota de Debito |

## Flujo de Facturacion

```
1. Crear DTE (dte.service)
   ↓
2. Validar estructura (dte-validator.service)
   ↓
3. Firmar con JWS (signer.service)
   ↓
4. Transmitir al MH (transmitter.service)
   ↓
5. Recibir sello de validacion
   ↓
6. Guardar DTE validado
```

## Estructura de Numero de Control

```
DTE-XX-MMMMMMMM-NNNNNNNNNNNNNNN
│   │  │        └── Correlativo (15 digitos)
│   │  └── Codigo establecimiento (8 digitos)
│   └── Tipo DTE (01, 03, 05, 06)
└── Prefijo fijo
```

Ejemplo: `DTE-01-M001P001-000000000000001`

## Desarrollo

### Estructura de comandos

```bash
# Desarrollo
npm run dev          # Inicia API y Web
npm run build        # Build de produccion

# API
cd apps/api
npm run start:dev    # Solo API
npm run test         # Tests

# Web
cd apps/web
npm run dev          # Solo Web
npm run build        # Build Next.js
```

### Agregar nuevo tipo de DTE

1. Definir tipos en `packages/shared/src/types/dte.types.ts`
2. Agregar builder en `apps/api/src/modules/dte/services/dte-builder.service.ts`
3. Agregar validador en `apps/api/src/modules/dte/services/dte-validator.service.ts`

## Ambientes MH

| Ambiente | URL Base |
|----------|----------|
| Test | `https://apitest.dtes.mh.gob.sv` |
| Produccion | `https://api.dtes.mh.gob.sv` |

Configura con `MH_API_ENV=test` o `MH_API_ENV=prod`

## Licencia

MIT
