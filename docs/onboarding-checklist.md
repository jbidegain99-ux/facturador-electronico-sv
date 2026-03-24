# Checklist de Onboarding - Facturosv.com

Guía paso a paso para configurar tu cuenta según tu plan.

---

## Plan FREE — Empezar en 30 minutos

### Día 1 — Setup Inicial (30 minutos)

- [ ] **Crear cuenta y verificar correo**
  - Registrate en facturosv.com/register
  - Revisa tu bandeja de entrada
  - Haz clic en el enlace de verificación

- [ ] **Completar datos de empresa**
  - Ve a Configuración > Datos de Empresa
  - Ingresa nombre de empresa
  - Ingresa NIT (14 dígitos)
  - Ingresa NRC (7-8 dígitos)
  - Agrega teléfono y correo
  - Selecciona actividad económica

- [ ] **Agregar primer cliente**
  - Ve a Clientes > Agregar cliente
  - Ingresa nombre y tipo de documento
  - Ingresa número de documento (NIT o DUI)
  - Guarda

- [ ] **Crear primer producto en catálogo**
  - Ve a Catálogo > Agregar producto
  - Ingresa nombre y descripción
  - Define precio unitario
  - Guarda

### Semana 1 — Primera Factura

- [ ] **Crear primera factura**
  - Ve a Facturas > Crear factura
  - Selecciona tipo: 01 (Factura)
  - Selecciona o crea un cliente
  - Agrega ítems del catálogo
  - Revisa totales (subtotal + IVA 13%)
  - Haz clic en "Guardar"

- [ ] **Descargar PDF**
  - Abre la factura guardada
  - Haz clic en "Descargar PDF"
  - Verifica que los datos sean correctos

### Límites del Plan FREE
- 10 DTEs por mes
- 1 usuario
- 1 sucursal
- 50 productos en catálogo
- 10 clientes
- Soporte: mejor esfuerzo
- Sin contabilidad, cotizaciones ni integraciones avanzadas

### Soporte
- 💬 Chatbot IA para preguntas rápidas
- 🎟️ Crear ticket: ve a Soporte > Nuevo ticket
- 📚 Manuales: docs/user-guides/

---

## Plan STARTER ($19/mes) — Setup Completo en 1 Semana

### Día 1 — Setup Inicial (1 hora)

- [ ] **Crear cuenta y verificar correo**
  - Registrate en facturosv.com/register
  - Verifica tu correo electrónico

- [ ] **Completar datos de empresa**
  - Ve a Configuración > Datos de Empresa
  - Nombre, NIT, NRC, teléfono, correo
  - Actividad económica
  - Subir logo (funcionalidad STARTER+)

- [ ] **Configurar sucursal principal**
  - Ve a Configuración > Sucursales
  - Verifica datos de sucursal principal
  - Código MH, dirección, departamento, municipio

### Día 2 — Conexión con Hacienda (1-2 horas)

- [ ] **Preparar credenciales MH**
  - Ten a la mano tu usuario de portal MH
  - Ten tu contraseña de portal MH
  - Ten tu certificado digital (.p12, .pfx o .crt)

- [ ] **Configurar conexión**
  - Ve a Configuración > Hacienda
  - Selecciona "Configuración rápida"
  - Sube tu certificado
  - Ingresa credenciales
  - Selecciona ambiente (pruebas primero)

- [ ] **Probar conexión**
  - Haz clic en "Probar conexión"
  - Verifica que diga "Conectado exitosamente"
  - Si hay error, revisa credenciales y certificado

- [ ] **Transmitir factura de prueba**
  - Crea una factura de prueba
  - Haz clic en "Transmitir"
  - Verifica estado: "PROCESADO" = éxito
  - Verifica sello de recepción

### Semana 1 — Operación Diaria

- [ ] **Agregar clientes**
  - Ve a Clientes > Agregar
  - Ingresa datos fiscales de cada cliente
  - Para CCF: necesitas NIT y NRC del cliente

- [ ] **Crear catálogo de productos**
  - Ve a Catálogo > Agregar producto
  - Define nombre, descripción, precio
  - Máximo 300 productos en STARTER

- [ ] **Crear y transmitir facturas**
  - Ve a Facturas > Crear factura
  - Selecciona cliente y productos
  - Guardar → el sistema firma y transmite automáticamente
  - Verifica estados en el listado

- [ ] **Configurar facturas recurrentes** (opcional)
  - Ve a Facturas > Recurrentes > Nuevo
  - Selecciona cliente y productos
  - Define intervalo (mensual, semanal, etc.)
  - Selecciona modo: borrador automático o envío automático

### Semana 1 — Contabilidad Básica

- [ ] **Inicializar catálogo de cuentas**
  - Ve a Contabilidad > Cuentas
  - Haz clic en "Sembrar catálogo NIIF"
  - Se crearán ~150 cuentas pre-configuradas
  - Revisa la estructura jerárquica

- [ ] **Configurar posteo automático** (opcional)
  - Ve a Contabilidad > Configuración
  - Activa "Posteo automático"
  - Selecciona trigger: "Al aprobar DTE"
  - Revisa reglas de mapeo por defecto

- [ ] **Crear primera partida manual** (opcional)
  - Ve a Contabilidad > Libro Diario > Nueva partida
  - Ingresa descripción y fecha
  - Agrega líneas (mínimo 2)
  - Verifica que débitos = créditos
  - Guarda y postea

### Límites del Plan STARTER
- 300 DTEs por mes
- 3 usuarios
- 1 sucursal
- 300 productos en catálogo
- 100 clientes
- Contabilidad básica incluida
- Facturas recurrentes incluidas
- SLA: respuesta en 24h, resolución en 48h

### Soporte
- 💬 Chatbot IA
- 🎟️ Tickets con SLA de 24h respuesta
- ⏱️ Resolución en 48 horas

---

## Plan PROFESSIONAL ($65/mes) — Setup Completo en 2 Semanas

*Incluye TODO del plan STARTER, más:*

### Semana 1 — Setup Avanzado

- [ ] **Configurar sucursales adicionales** (hasta 5)
  - Ve a Configuración > Sucursales > Agregar
  - Código MH, dirección, punto de venta
  - Asigna usuarios a cada sucursal

- [ ] **Configurar correo externo** (opcional)
  - Ve a Configuración > Email
  - Selecciona proveedor (Gmail, Office 365, SendGrid, etc.)
  - Si usas Gmail:
    1. Habilita verificación en 2 pasos en Google
    2. Genera una contraseña de aplicación
    3. Copia la contraseña generada
  - Ingresa credenciales en Facturosv
  - Haz clic en "Probar conexión"
  - Envía un correo de prueba

### Semana 2 — Cotizaciones B2B

- [ ] **Crear primera cotización**
  - Ve a Cotizaciones > Nueva
  - Selecciona cliente
  - Agrega ítems con cantidades y precios
  - Define fecha de validez (por defecto +30 días)
  - Agrega términos y notas (opcional)
  - Guarda como borrador

- [ ] **Enviar cotización al cliente**
  - Abre la cotización guardada
  - Haz clic en "Enviar al cliente"
  - El cliente recibe un correo con enlace al portal de aprobación

- [ ] **Portal de aprobación**
  - El cliente abre el enlace (sin necesidad de login)
  - Puede: aprobar, rechazar, o solicitar cambios
  - Recibes notificación por correo del resultado

- [ ] **Convertir cotización aprobada a factura**
  - Abre la cotización aprobada
  - Haz clic en "Convertir a factura"
  - Se crea un DTE automáticamente con los datos aprobados

### Semana 2 — Contabilidad Avanzada

- [ ] **Personalizar reglas de mapeo**
  - Ve a Contabilidad > Configuración
  - Revisa los mapeos por tipo de operación:
    - Venta al contado → Caja + Ventas + IVA
    - Venta a crédito → Clientes + Ventas + IVA
    - Nota de crédito, retención, exportación, etc.
  - Ajusta cuentas según tu plan de cuentas

- [ ] **Generar reportes contables**
  - Balance de saldos: Contabilidad > Balance
  - Estado de resultados: Contabilidad > Resultados
  - Libro mayor por cuenta: Contabilidad > Libro Mayor

- [ ] **Simular impacto contable**
  - En el dashboard de Contabilidad
  - Haz clic en "Simular factura"
  - Ingresa montos de prueba
  - Verifica qué cuentas se afectarían

### Límites del Plan PROFESSIONAL
- 2,000 DTEs por mes
- 10 usuarios
- 5 sucursales
- 1,000 productos en catálogo
- 500 clientes
- Cotizaciones B2B con portal de aprobación
- Reportes contables avanzados
- Correo externo configurable
- Soporte para configuración de Hacienda
- SLA: respuesta en 12h, resolución en 24h

### Soporte
- 💬 Chatbot IA
- 🎟️ Tickets con SLA de 12h respuesta
- ⏱️ Resolución en 24 horas
- 🔧 Ayuda con configuración de Hacienda

---

## Plan ENTERPRISE ($199/mes) — Setup Completo en 2-3 Semanas

*Incluye TODO del plan PROFESSIONAL, más:*

### Semana 2 — Integraciones Avanzadas

- [ ] **Configurar webhooks**
  - Ve a Webhooks > Crear endpoint
  - Define nombre y URL de destino
  - Selecciona eventos a suscribir:
    - `dte.created`, `dte.approved`, `invoice.paid`, etc.
  - Guarda y copia el secretKey (HMAC-SHA256)
  - Haz clic en "Test" para verificar conectividad

- [ ] **Integrar API REST**
  - Obtén tu JWT token via POST /api/v1/auth/login
  - Endpoints principales:
    - `GET /api/v1/dte` — Listar facturas
    - `POST /api/v1/dte` — Crear factura
    - `POST /api/v1/transmitter/send/:id` — Transmitir
  - Implementa verificación de firma webhook (HMAC-SHA256)

- [ ] **Configurar sucursales ilimitadas**
  - Agrega todas las sucursales necesarias
  - Cada una con su código MH y punto de venta
  - Reportes consolidados multi-sucursal

### Semana 3 — Automatización

- [ ] **Automatizar facturación recurrente**
  - Configura plantillas para todos los clientes recurrentes
  - Activa auto-transmisión a Hacienda
  - El sistema genera y transmite facturas automáticamente

- [ ] **Automatizar contabilidad**
  - Verifica reglas de mapeo para todos los tipos de DTE
  - Activa posteo automático "Al aprobar"
  - Las partidas se crean y postean sin intervención manual

### Límites del Plan ENTERPRISE
- DTEs ilimitados
- Usuarios ilimitados
- Sucursales ilimitadas
- Catálogo ilimitado
- Clientes ilimitados
- Webhooks y API REST completa
- Soporte telefónico
- Account manager dedicado
- SLA: respuesta en 2h, resolución en 8h

### Soporte
- 💬 Chatbot IA
- 🎟️ Tickets con SLA de 2h respuesta
- ⏱️ Resolución en 8 horas
- 📞 Soporte telefónico
- 👤 Account manager dedicado
