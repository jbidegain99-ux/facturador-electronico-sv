# Integracion con Hacienda (MH)

La integracion con el Ministerio de Hacienda de El Salvador permite firmar y transmitir Documentos Tributarios Electronicos (DTE) directamente desde Facturosv.

## Credenciales necesarias

Para conectar con Hacienda necesita las siguientes credenciales, proporcionadas por el Ministerio de Hacienda:

| Credencial | Descripcion | Donde obtenerla |
|------------|-------------|-----------------|
| NIT | Numero de Identificacion Tributaria del contribuyente | Asignado por Hacienda al registrarse como contribuyente |
| NRC | Numero de Registro de Contribuyente | Asignado por Hacienda |
| Usuario MH | Usuario para la API de Hacienda | Proporcionado al registrarse en el portal de facturacion electronica |
| Contrasena MH | Contrasena para la API de Hacienda | Proporcionada al registrarse |
| Certificado de firma | Archivo de certificado digital (.p12, .pfx, .crt, .cer o .pem) | Generado en el portal de Hacienda |
| Contrasena del certificado | Contrasena para abrir el certificado | Definida al generar el certificado |

> **Importante sobre el NRC:** Facturosv almacena el NRC como digitos sin guion (por ejemplo, `3674750`). En la interfaz se muestra con formato `367475-0`. El validador de Hacienda acepta el formato sin guion.

---

## Configuracion rapida (recomendado)

La configuracion rapida permite conectar con Hacienda en un solo formulario. Es la opcion recomendada para la mayoria de usuarios.

### Paso 1: Acceder a la configuracion

1. Vaya a **Configuracion > Integraciones > Hacienda**.
2. Seleccione **Configuracion rapida**.

### Paso 2: Ingresar credenciales

Complete el formulario con los siguientes datos:

1. **NIT**: Ingrese su NIT sin guiones ni espacios.
2. **NRC**: Ingrese su NRC (solo digitos, sin guion).
3. **Usuario MH**: Su usuario de la API de Hacienda.
4. **Contrasena MH**: Su contrasena de la API de Hacienda.
5. **Certificado**: Haga clic en **Seleccionar archivo** y suba su certificado digital.
6. **Contrasena del certificado**: Ingrese la contrasena del certificado.
7. **Entorno**: Seleccione **TEST** para pruebas o **PRODUCTION** para produccion.

### Paso 3: Probar y guardar

1. Haga clic en **Probar conexion** para verificar que las credenciales son validas.
2. Si la prueba es exitosa, haga clic en **Guardar**.

> **Nota:** La configuracion rapida crea la configuracion para el entorno seleccionado. Si necesita configurar ambos entornos con credenciales diferentes, use la configuracion manual.

---

## Configuracion manual por entorno

La configuracion manual permite definir credenciales independientes para cada entorno (TEST y PRODUCTION). Esto es util cuando sus credenciales de prueba y produccion son diferentes.

### Entorno TEST

1. Vaya a **Configuracion > Integraciones > Hacienda > Manual**.
2. Seleccione la pestana **TEST**.
3. Ingrese las credenciales del entorno de pruebas.
4. Suba el certificado de pruebas.
5. Pruebe la conexion y guarde.

### Entorno PRODUCTION

1. Seleccione la pestana **PRODUCTION**.
2. Ingrese las credenciales del entorno de produccion.
3. Suba el certificado de produccion.
4. Pruebe la conexion y guarde.

> **Importante:** Cada entorno tiene su propia URL de API, tokens y certificados. Facturosv gestiona esto automaticamente, pero asegurese de ingresar las credenciales correctas en cada pestana.

---

## Tipos de certificado

Hacienda utiliza varios formatos de certificado. Facturosv acepta los siguientes:

| Formato | Extension | Descripcion |
|---------|-----------|-------------|
| PKCS#12 | `.p12`, `.pfx` | Formato binario que contiene la llave privada y el certificado. Es el mas comun. |
| Certificado MH (XML) | `.crt` | Formato XML propio de Hacienda (`<CertificadoMH>`). Contiene llaves publica y privada embebidas. **No es un certificado X.509 estandar.** |
| Certificado DER/PEM | `.cer`, `.pem` | Formatos estandar de certificado. |

### Como obtener su certificado

1. Inicie sesion en el [portal de facturacion electronica de Hacienda](https://admin.factura.gob.sv).
2. Vaya a la seccion de **Certificados**.
3. Haga clic en **Generar certificado**.
4. Defina una contrasena segura para el certificado.
5. Descargue el archivo generado.
6. **Paso critico:** Despues de descargar, regrese al portal y haga clic en **Cargar Certificado** para registrar el certificado en el sistema de Hacienda.

> **Atencion:** Generar y descargar el certificado NO es suficiente. Debe hacer clic en **Cargar Certificado** en el portal de Hacienda para que el certificado quede registrado y sea valido para firmar DTEs. Si omite este paso, recibira errores de firma al transmitir documentos.

---

## Probar la conexion

La prueba de conexion verifica tres cosas:

1. **Autenticacion**: Las credenciales de usuario y contrasena son validas.
2. **Certificado**: El certificado puede ser leido y la contrasena es correcta.
3. **Comunicacion**: La API de Hacienda responde correctamente.

Para probar:

1. Haga clic en **Probar conexion** dentro de la configuracion de Hacienda.
2. Espere el resultado (puede tardar unos segundos).
3. Si falla, revise los mensajes de error detallados que se muestran.

### Sobre los tokens de autenticacion

Facturosv gestiona los tokens de autenticacion de Hacienda automaticamente:

- Los tokens se almacenan en cache despues de la primera autenticacion.
- La validez tipica de un token es de 24 a 48 horas.
- Facturosv renueva el token automaticamente cuando expira.
- Si cambia sus credenciales en el portal de Hacienda, debe actualizar la configuracion en Facturosv para que se genere un nuevo token.

---

## Centro de pruebas para certificacion DTE

Antes de emitir DTEs en produccion, Hacienda requiere que el contribuyente complete un proceso de certificacion enviando documentos de prueba. Facturosv incluye un Centro de Pruebas que facilita este proceso.

### Como funciona

1. Vaya a **Configuracion > Integraciones > Hacienda > Centro de Pruebas**.
2. Asegurese de tener configurado el entorno TEST.
3. Vera una lista de los 7 tipos de DTE con la cantidad de pruebas requeridas para cada uno:

| Tipo DTE | Codigo | Descripcion | Pruebas requeridas |
|----------|--------|-------------|-------------------|
| Factura | 01 | Comprobante de Credito Fiscal | Segun MH |
| Credito Fiscal | 03 | Comprobante de Credito Fiscal | Segun MH |
| Nota de Remision | 04 | Nota de Remision | Segun MH |
| Nota de Credito | 05 | Nota de Credito | Segun MH |
| Nota de Debito | 06 | Nota de Debito | Segun MH |
| Factura de Exportacion | 11 | Factura de Exportacion | Segun MH |
| Factura de Sujeto Excluido | 14 | Comprobante de Sujeto Excluido | Segun MH |

### Seguimiento de progreso

- Cada tipo de DTE muestra una barra de progreso con el conteo de pruebas completadas vs. requeridas.
- Los documentos exitosamente transmitidos se marcan en verde.
- Los documentos rechazados se marcan en rojo con el detalle del error.
- Al completar todas las pruebas requeridas, el tipo de DTE se marca como **Certificado**.

### Enviar documentos de prueba

1. Seleccione el tipo de DTE que desea probar.
2. Facturosv genera un documento de prueba con datos ficticios.
3. El documento se firma, sella y transmite al entorno de pruebas de Hacienda.
4. Verifique el resultado en la columna de estado.
5. Repita hasta completar la cantidad requerida.

---

## Cambiar de TEST a PRODUCTION

Una vez completada la certificacion de pruebas:

1. Configure las credenciales del entorno PRODUCTION (si son diferentes a las de TEST).
2. Suba el certificado de produccion (puede ser el mismo o uno diferente).
3. En **Configuracion > Integraciones > Hacienda**, cambie el **Entorno activo** a **PRODUCTION**.
4. Pruebe la conexion en produccion.
5. Emita su primer DTE real.

> **Advertencia:** Despues de cambiar a produccion, todos los DTEs emitidos son documentos fiscales reales con validez legal. Asegurese de que los datos del emisor, receptor y detalle de los productos son correctos antes de transmitir.

---

## Notas tecnicas importantes

Estos detalles son relevantes si experimenta problemas o si su equipo tecnico necesita depurar la integracion:

- **Encabezado de autorizacion**: La API de Hacienda requiere el token en el encabezado `Authorization` **sin** el prefijo `Bearer`. Facturosv maneja esto automaticamente.
- **Formato de fechas**: Hacienda retorna el campo `fhProcesamiento` en formato `DD/MM/YYYY HH:mm:ss`. Facturosv lo convierte automaticamente al formato estandar.
- **Respuestas vacias en errores 401/403**: Cuando Hacienda retorna un error de autenticacion, el cuerpo de la respuesta esta vacio. Facturosv maneja este caso y muestra un mensaje descriptivo.
- **Archivos .crt de Hacienda**: Son archivos XML con la etiqueta `<CertificadoMH>`, no certificados X.509 estandar. Facturosv los procesa correctamente.
