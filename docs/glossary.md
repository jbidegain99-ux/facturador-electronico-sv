# Glosario de Términos - Facturosv.com

## Términos de Facturación Electrónica

**DTE** — Documento Tributario Electrónico
Factura o comprobante digital autorizado por el Ministerio de Hacienda de El Salvador. Reemplaza los documentos físicos impresos. Cada DTE tiene un código de generación único (UUID) y un número de control.

**Tipos de DTE:**
| Código | Nombre |
|--------|--------|
| 01 | Factura |
| 03 | Comprobante de Crédito Fiscal (CCF) |
| 04 | Nota de Remisión |
| 05 | Nota de Crédito |
| 06 | Nota de Débito |
| 07 | Comprobante de Retención |
| 09 | Documento Contable de Liquidación |
| 11 | Factura de Exportación |
| 14 | Factura de Sujeto Excluido |
| 34 | Comprobante de Retención CRS |

**Transmisión** — Envío de DTE a Hacienda
Proceso de enviar un documento tributario electrónico al servidor del Ministerio de Hacienda para su registro oficial. Requiere credenciales MH vigentes y certificado digital.

**Sello de Recepción** — Código de confirmación de Hacienda
Código alfanumérico que el Ministerio de Hacienda devuelve al aceptar un DTE. Sirve como comprobante de que el documento fue recibido y registrado.

**Código de Generación** — UUID del DTE
Identificador único universal (UUID v4) asignado a cada DTE al momento de creación. Formato: 36 caracteres alfanuméricos con guiones.

**Número de Control** — Identificador secuencial
Código de 31 caracteres que identifica el DTE dentro del establecimiento. Formato: `DTE-[tipoDte]-[codEstablecimiento]-[codigoGeneracion]`.

**Firma Digital** — Firma electrónica del DTE
Proceso criptográfico que autentica el DTE usando un certificado digital (.p12/.pfx). El DTE firmado se convierte en un JWS (JSON Web Signature).

**Ambiente** — Entorno de operación
- `00`: Ambiente de pruebas (testing)
- `01`: Ambiente de producción (real)

**Anulación** — Cancelación de DTE
Proceso para invalidar un DTE ya transmitido. Requiere motivo de al menos 10 caracteres y puede requerir anulación en Hacienda si el DTE fue procesado.

---

## Términos de Identificación Tributaria

**NIT** — Número de Identificación Tributaria
Número de 14 dígitos que identifica a una persona natural o jurídica ante el Ministerio de Hacienda. Ejemplo: `06140101880019`.

**NRC** — Número de Registro de Contribuyente
Número de 7-8 dígitos que identifica al contribuyente registrado en IVA. Se almacena sin guion (ej: `3674750`) y se muestra con guion al usuario (ej: `367475-0`). Validación MH: `^[0-9]{1,8}$`.

**DUI** — Documento Único de Identidad
Documento de identidad personal salvadoreño. Utilizado como tipo de documento del receptor en facturas a consumidor final.

**Actividad Económica** — Clasificación de negocio
Código de 5-6 dígitos que clasifica la actividad comercial del contribuyente según el catálogo del Ministerio de Hacienda. Ejemplo: `62010` (Actividades de programación informática).

---

## Términos de Facturación

**Emisor** — Quien emite la factura
La empresa o contribuyente que genera y envía el DTE. Sus datos provienen de la configuración del tenant.

**Receptor** — Quien recibe la factura
El cliente o contribuyente destinatario del DTE. Para tipo 01 (Factura) el receptor puede ser opcional; para CCF (tipo 03) requiere NIT y NRC completos.

**Sujeto Excluido** — Contribuyente no registrado en IVA
Persona natural no inscrita como contribuyente de IVA. Se utiliza con DTE tipo 14.

**Condición de Operación** — Forma de pago
- `1`: Contado (pago inmediato)
- `2`: A crédito (pago diferido)
- `3`: Otro

**Gravado** — Sujeto a IVA
Monto de la transacción sobre el cual se calcula el 13% de IVA.

**Exento** — Libre de IVA
Monto que no está sujeto al cálculo de IVA por disposición legal.

**No Sujeto** — No aplica IVA
Operaciones que por su naturaleza no están dentro del alcance del IVA.

**IVA** — Impuesto al Valor Agregado
Impuesto del 13% aplicado sobre montos gravados. Se calcula automáticamente en el sistema.

**Retención** — Descuento por impuesto
Porcentaje retenido de la factura por concepto de impuesto sobre la renta (ISR) u otros tributos.

**Nota de Crédito** — Documento de reducción
DTE tipo 05 que reduce el monto de una factura anterior. Se usa para devoluciones, descuentos posteriores o correcciones a favor del cliente.

**Nota de Débito** — Documento de aumento
DTE tipo 06 que incrementa el monto de una factura anterior. Se usa para cargos adicionales o ajustes.

**CCF** — Comprobante de Crédito Fiscal
DTE tipo 03 usado en transacciones entre contribuyentes registrados en IVA. Permite al receptor deducir el IVA pagado.

**Total en Letras** — Monto escrito
Representación textual del monto total del DTE en dólares estadounidenses. Ejemplo: "CIEN DÓLARES CON CINCUENTA CENTAVOS USD".

**Factura Recurrente** — Factura programada
Plantilla que genera facturas automáticamente según un intervalo definido (diario, semanal, mensual, anual). Puede auto-transmitir a Hacienda.

---

## Términos de Establecimientos

**Establecimiento** — Sucursal o local comercial
Cada ubicación física donde opera el negocio. Tiene un código MH asignado.

**Sucursal** — Local adicional
Ubicación de negocio que no es la sede principal. Tipo: `01`.

**Casa Matriz** — Sede principal
Establecimiento principal del negocio. Tipo: `02`.

**Punto de Venta** — POS
Terminal o caja registradora dentro de un establecimiento. Código por defecto: `P001`. Se usa para generar el número de control del DTE.

---

## Términos Contables

**Catálogo de Cuentas** — Plan de cuentas / Chart of Accounts
Estructura jerárquica de cuentas contables organizadas por tipo (Activo, Pasivo, Patrimonio, Ingreso, Gasto). Facturosv incluye un catálogo NIIF PYMES pre-configurado con ~150 cuentas.

**Partida Contable** — Asiento / Journal Entry
Registro contable que documenta una transacción. Siempre tiene al menos dos líneas: una al debe y otra al haber. Formato de número: `PDA-YYYY-XXXXXX`.

**Estados de partida:**
- `DRAFT`: Borrador, sin efecto en saldos
- `POSTED`: Contabilizada, afecta saldos de cuentas
- `VOIDED`: Anulada, revierte el efecto en saldos

**Libro Mayor** — General Ledger
Registro detallado de todos los movimientos para una cuenta específica, con saldo corriente.

**Libro Diario** — Journal
Lista cronológica de todas las partidas contables registradas.

**Balance de Saldos** — Trial Balance / Balanza de Comprobación
Listado de todas las cuentas con sus saldos al debe y al haber en un momento dado. Debe cuadrar: Total Débitos = Total Créditos.

**Balance General** — Statement of Financial Position
Estado financiero que muestra Activos = Pasivos + Patrimonio en una fecha determinada.

**Estado de Resultados** — Income Statement / P&L
Reporte que muestra Ingresos - Gastos = Utilidad Neta para un período específico.

**Posteo Automático** — Auto-posting
Función que genera partidas contables automáticamente cuando se crea o aprueba un DTE, según reglas de mapeo configuradas.

**Regla de Mapeo** — Mapping Rule
Configuración que define qué cuentas contables se afectan al procesar cada tipo de DTE. Ejemplo: Venta al contado → Debita Caja, Acredita Ventas + IVA.

**NIIF** — Normas Internacionales de Información Financiera
Estándares contables internacionales. Facturosv soporta NIIF completas y NIIF para PYMES.

**Período Fiscal** — Fiscal Year
Período de 12 meses para fines contables. En El Salvador generalmente de enero a diciembre.

---

## Términos de Cotizaciones

**Cotización** — Quote / Proposal
Documento B2B que detalla productos/servicios y precios para un cliente potencial. Formato de número: `COT-YYYY-XXXX`.

**Portal de Aprobación** — Approval Portal
Página web pública (sin login) donde el cliente puede ver, aprobar, rechazar o solicitar cambios a una cotización. Acceso mediante token único.

**Versionamiento** — Versioning
Sistema que permite crear nuevas versiones de una cotización, manteniendo historial. Formato: `COT-2026-0001-v2`.

**Estados de cotización:**
- `DRAFT`: Borrador, editable
- `SENT`: Enviada al cliente, esperando respuesta
- `APPROVED`: Aprobada por el cliente
- `PARTIALLY_APPROVED`: Aprobada parcialmente (algunos ítems rechazados)
- `CHANGES_REQUESTED`: Cliente solicita modificaciones
- `REJECTED`: Rechazada por el cliente
- `CONVERTED`: Convertida a factura
- `EXPIRED`: Venció la fecha de validez
- `CANCELLED`: Cancelada manualmente

---

## Términos de Integraciones

**Webhook** — Notificación automática de evento
Llamada HTTP que Facturosv envía a una URL externa cuando ocurre un evento (factura creada, transmitida, etc.). Firmado con HMAC-SHA256.

**Eventos de webhook disponibles:**
- `dte.created` — DTE creado
- `dte.signed` — DTE firmado
- `dte.transmitted` — DTE enviado a MH
- `dte.approved` — DTE aprobado por MH
- `dte.rejected` — DTE rechazado por MH
- `invoice.paid` — Factura pagada
- `client.created` — Cliente nuevo
- `quote.approved` — Cotización aprobada

**API REST** — Interfaz de programación
Conexión técnica para que otros sistemas accedan a Facturosv programáticamente. Autenticación mediante JWT Bearer Token.

**SMTP** — Simple Mail Transfer Protocol
Protocolo estándar para envío de correos electrónicos. Facturosv soporta conexión SMTP genérica y proveedores específicos.

**OAuth2** — Protocolo de autorización
Método de autenticación usado para conectar Microsoft 365 y Google Workspace como proveedores de correo.

**App Password** — Contraseña de aplicación
Contraseña especial generada en Gmail/Outlook para aplicaciones de terceros. Requiere tener 2FA habilitado.

---

## Términos de Soporte y SLA

**SLA** — Service Level Agreement / Acuerdo de Nivel de Servicio
Tiempo máximo comprometido para responder y resolver tickets de soporte según el plan contratado.

| Plan | Respuesta | Resolución |
|------|-----------|------------|
| FREE | Mejor esfuerzo | Mejor esfuerzo |
| STARTER | 24 horas | 48 horas |
| PROFESSIONAL | 12 horas | 24 horas |
| ENTERPRISE | 2 horas | 8 horas |

**Ticket de Soporte** — Support Ticket
Solicitud formal de ayuda técnica. Número: `TKT-YYYYMMDD-XXXX`.

**Tipos de ticket:**
- `EMAIL_CONFIG` — Configuración de correo
- `TECHNICAL` — Problema técnico
- `BILLING` — Facturación/cobro
- `GENERAL` — Consulta general
- `ONBOARDING` — Configuración inicial

**Prioridades de ticket:**
- `LOW` — Baja
- `MEDIUM` — Media
- `HIGH` — Alta
- `URGENT` — Urgente

---

## Términos de Planes y Suscripción

**Plan** — Nivel de suscripción
Paquete de funcionalidades y límites contratado. Cuatro niveles: FREE, STARTER ($19/mes), PROFESSIONAL ($65/mes), ENTERPRISE ($199/mes).

**Feature Gate** — Control de funcionalidad
Sistema que habilita o deshabilita funciones según el plan del tenant. Por ejemplo, cotizaciones B2B solo disponibles en PROFESSIONAL+.

**Tenant** — Empresa/Organización
Cada empresa registrada en Facturosv. Todos los datos (facturas, clientes, cuentas) están aislados por tenant.

**Multi-tenancy** — Aislamiento de datos
Arquitectura donde múltiples empresas comparten la misma infraestructura pero sus datos están completamente separados y protegidos.

**DTEs/mes** — Límite mensual de documentos
Cantidad máxima de documentos tributarios que se pueden emitir por mes según el plan (10, 300, 2000 o ilimitado).

---

## Términos Técnicos

**Certificado Digital** — Digital Certificate
Archivo criptográfico (.p12, .pfx, .crt) emitido por Hacienda que permite firmar DTEs. Los archivos .crt de MH son formato XML (`<CertificadoMH>`), no X.509 estándar.

**JWS** — JSON Web Signature
Formato estándar para firmar digitalmente datos JSON. Los DTEs firmados se convierten en JWS antes de transmitir a Hacienda.

**JWT** — JSON Web Token
Token de autenticación usado para acceder a la API de Facturosv. Incluye información del usuario y tenant.

**PDF** — Portable Document Format
Formato de documento descargable. Facturosv genera PDFs de facturas con código QR, logo de empresa y datos fiscales.

**QR Code** — Código QR
Código de barras 2D incluido en el PDF de cada DTE. Contiene el código de generación para verificación.

**Modo Demo** — Entorno de demostración
Modo de operación que simula respuestas de Hacienda sin enviar datos reales. Útil para pruebas y demostraciones.
