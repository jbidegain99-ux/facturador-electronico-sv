# Transmitir a Hacienda

Esta guia explica como funciona la transmision de Documentos Tributarios Electronicos (DTE) al Ministerio de Hacienda (MH) de El Salvador a traves de Facturosv.com.

## Que es la transmision

La transmision es el proceso mediante el cual un DTE firmado digitalmente se envia al sistema del Ministerio de Hacienda para su validacion y registro oficial. Un documento no tiene validez fiscal hasta que el MH lo acepta y devuelve un **sello de recepcion**.

## Requisitos previos

Antes de poder transmitir documentos, debe tener configurado:

### 1. Credenciales del MH

- **NIT de la empresa**: registrado en el portal del MH.
- **Contrasena del MH**: la contrasena de acceso al sistema de facturacion electronica del MH.

Estas credenciales se configuran en **Configuracion > Empresa > Credenciales de Hacienda**.

### 2. Certificado digital

- El certificado debe estar **generado** en el portal del MH.
- Ademas de generarlo, debe **cargarlo** (opcion "Cargar Certificado" en el portal del MH). Solo descargarlo no es suficiente.
- El archivo `.crt` del MH es un formato XML especial (`<CertificadoMH>`), no un certificado X.509 estandar. Contiene las llaves publica y privada embebidas.

> **Importante**: Despues de generar un nuevo certificado en el portal del MH, debe seleccionar la opcion "Cargar Certificado" para registrarlo. Si solo descarga el archivo sin cargarlo, la transmision fallara.

### 3. Datos fiscales completos

- NRC de la empresa.
- Actividad economica.
- Direccion fiscal.
- Al menos un establecimiento con codigo.

## Como funciona la transmision

### Transmision automatica

En Facturosv.com, la transmision es **automatica**. Al guardar un documento:

1. El sistema genera el JSON del DTE con todos los datos fiscales.
2. Firma digitalmente el documento usando el certificado.
3. Obtiene un token de autenticacion del MH usando el NIT y contrasena.
4. Envia el DTE firmado al endpoint del MH.
5. Recibe la respuesta del MH.

No es necesario realizar ningun paso manual adicional.

### Transmision manual (reintento)

Si un documento queda en estado **PENDIENTE**, **ERROR** o **RECHAZADO**, puede reintentar la transmision:

1. Vaya al detalle del documento.
2. Haga clic en **Reintentar transmision**.
3. El sistema intentara enviar el documento nuevamente al MH.

## Estados de transmision

| Estado | Significado | Accion requerida |
|--------|-------------|-----------------|
| **PENDIENTE** | El documento se creo pero la transmision no se ha completado. | Espere o reintente manualmente. |
| **FIRMADO** | El documento fue firmado pero no se ha enviado al MH. | Reintente la transmision. |
| **PROCESADO** | El MH acepto el documento exitosamente. | Ninguna. El documento es valido. |
| **RECHAZADO** | El MH rechazo el documento por errores en los datos. | Revise el mensaje de error, corrija y reintente. |
| **ERROR** | Ocurrio un error tecnico (red, timeout, etc.). | Reintente la transmision. |
| **ANULADO** | El documento fue anulado/invalidado. | No se puede retransmitir. |

## Sello de recepcion

Cuando el MH acepta un documento, devuelve un **sello de recepcion** (`selloRecepcion`). Este sello:

- Es un codigo unico que certifica que el MH recibio y acepto el documento.
- Sirve como comprobante de que el documento tiene validez fiscal.
- Se incluye automaticamente en el PDF del documento.
- Debe conservarse como parte de los registros fiscales.

Ademas del sello, el MH devuelve la **fecha y hora de procesamiento** (`fhProcesamiento`), que indica el momento exacto en que el MH registro el documento.

## Autenticacion con el MH

El sistema maneja la autenticacion de forma automatica:

1. Envia el NIT y contrasena al endpoint de autenticacion del MH.
2. Recibe un token de sesion.
3. Usa el token en las solicitudes posteriores.

> **Detalle tecnico**: El token se envia en el encabezado de autorizacion **sin** el prefijo "Bearer". El MH espera el token en formato directo.

El token se almacena en cache para evitar autenticaciones innecesarias. Si experimenta problemas de autenticacion despues de cambiar credenciales, puede ser necesario limpiar la cache de tokens.

## Errores comunes de transmision

### Error 401/403 - No autorizado

**Causa**: Credenciales incorrectas o token expirado.

**Solucion**:
- Verifique que el NIT y contrasena sean correctos en la configuracion.
- Si cambio las credenciales recientemente, limpie la cache de tokens y reinicie la sesion.

> **Nota**: El MH puede devolver un cuerpo vacio en errores 401/403. El sistema maneja esto internamente leyendo la respuesta como texto antes de intentar parsear JSON.

### Error de certificado

**Causa**: El certificado no esta cargado o expiro.

**Solucion**:
- Verifique en el portal del MH que el certificado este activo.
- Recuerde que debe **cargar** el certificado ademas de generarlo.
- Si genero un nuevo certificado, asegurese de actualizar el archivo `.crt` en la configuracion del sistema.

### Error de validacion del MH

**Causa**: Los datos del DTE no cumplen con las reglas de validacion del MH.

**Solucion**:
- Revise el mensaje de error devuelto por el MH.
- Verifique que los datos del receptor (NIT, NRC, direccion) sean correctos.
- Asegurese de que los calculos de IVA y totales sean correctos.
- Confirme que el NRC tenga el formato correcto (digitos sin guion).

### Error de red o timeout

**Causa**: Problema de conectividad con los servidores del MH.

**Solucion**:
- Espere unos minutos y reintente la transmision.
- Verifique la conexion a internet.
- Si el problema persiste, consulte el estado del servicio del MH.

## Buenas practicas

1. **Verifique los datos antes de guardar**: Aunque puede reintentar, es mas eficiente enviar datos correctos desde el inicio.
2. **Mantenga las credenciales actualizadas**: Si cambia la contrasena del MH, actualicela inmediatamente en la configuracion del sistema.
3. **Monitoree los estados**: Revise periodicamente si hay documentos en estado ERROR o RECHAZADO que requieran atencion.
4. **Conserve los sellos de recepcion**: Aunque el sistema los almacena, es buena practica llevar un registro externo.
5. **No reintente inmediatamente**: Si un documento falla por error de red, espere al menos un minuto antes de reintentar para no saturar el servicio del MH.
