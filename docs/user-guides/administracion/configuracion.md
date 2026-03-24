# Configuración de Empresa

## Datos Generales

Ve a **Configuración > Datos de Empresa** para administrar la información de tu organización.

### Campos principales

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Nombre | Razón social registrada en Hacienda | Demo Empresa S.A. de C.V. |
| Nombre Comercial | Nombre público (opcional) | Mi Tienda |
| NIT | Número de Identificación Tributaria (14 dígitos) | 06140101880019 |
| NRC | Número de Registro de Contribuyente (sin guion) | 3674750 |
| Actividad Económica | Código + descripción del catálogo MH | 62010 - Programación informática |
| Teléfono | Número de contacto | 2222-3333 |
| Correo | Email de la empresa | info@empresa.com |

### Cómo actualizar

1. Ve a **Configuración** en el menú lateral
2. Edita los campos necesarios
3. Haz clic en **Guardar cambios**
4. Los cambios se reflejan inmediatamente en nuevos DTEs

> **Importante:** El NIT y NRC deben coincidir exactamente con los registrados en el Ministerio de Hacienda. Un error en estos campos causará rechazo de transmisiones.

---

## Logo de Empresa

**Disponible en:** STARTER+

El logo aparece en:
- PDFs de facturas (esquina superior izquierda)
- PDFs de cotizaciones
- Correos enviados a clientes

### Cómo subir el logo

1. Ve a **Configuración > Datos de Empresa**
2. Haz clic en el área de logo o en **Subir logo**
3. Selecciona un archivo de imagen
4. Haz clic en **Guardar**

### Requisitos del logo
- Formatos: PNG, JPG, JPEG
- Tamaño máximo recomendado: 500x500 px
- Fondo transparente (PNG) recomendado para mejor apariencia en PDF

---

## Color Primario

Puedes personalizar el color principal de tu interfaz:

1. Ve a **Configuración > Datos de Empresa**
2. Selecciona un color primario (por defecto: `#8b5cf6` violeta)
3. El color se aplica a botones, enlaces y elementos de acento

---

## Modo Demo

El modo demo permite operar sin enviar datos reales a Hacienda:

- Simula respuestas de transmisión
- Genera sellos de recepción ficticios (prefijo `DEMO`)
- Útil para pruebas y demostraciones
- Se activa/desactiva en Configuración

> **Precaución:** En modo demo, ningún DTE se registra oficialmente en Hacienda. Desactívalo cuando estés listo para operar en producción.

---

## Dirección del Emisor

La dirección configurada se incluye en todos los DTEs como datos del emisor:

- **Departamento:** Selecciona del catálogo (01-14)
- **Municipio:** Se filtra según departamento seleccionado
- **Complemento:** Dirección exacta (calle, número, colonia)

---

## Periodo Fiscal

El periodo fiscal en El Salvador es generalmente de enero a diciembre. El sistema:

- Captura año y mes fiscal automáticamente de la fecha de cada partida contable
- Permite filtrar reportes por rango de fechas
- No requiere configuración manual de cierre de período
