/**
 * V2: Normalize CCF JSON, re-sign and re-transmit DTE-03-M001P001-000000000000021
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/fix-dte-021-v2.ts
 */
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import * as crypto from 'crypto';

const TENANT_ID = 'cmkwth4ie0001b3hld086ommq';
const DTE_ID = 'cmmnpub46000bsclb6zohj83l';
const ENCRYPTION_KEY = 'e2ec959638e61afc4850b57054965266249ca18e5edc32f46c9d2fb6110c26a8';

function numberToWords(num: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return units[n] ?? '';
    if (n < 20) return teens[n - 10] ?? '';
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (n === 20) return 'VEINTE';
      if (n < 30) return 'VEINTI' + units[unit];
      return tens[ten] + (unit ? ' Y ' + units[unit] : '');
    }
    if (n === 100) return 'CIEN';
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return hundreds[hundred] + (rest ? ' ' + convertGroup(rest) : '');
  };

  const convertThousands = (n: number): string => {
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      const rest = n % 1000;
      return (thousands === 1 ? 'MIL' : convertGroup(thousands) + ' MIL') +
        (rest ? ' ' + convertGroup(rest) : '');
    }
    return convertGroup(n);
  };

  let result = '';
  if (intPart === 0) {
    result = 'CERO';
  } else if (intPart >= 1000000) {
    const millions = Math.floor(intPart / 1000000);
    const rest = intPart % 1000000;
    result = (millions === 1 ? 'UN MILLON' : convertGroup(millions) + ' MILLONES') +
      (rest ? ' ' + convertThousands(rest) : '');
  } else {
    result = convertThousands(intPart);
  }

  return `${result} ${decPart.toString().padStart(2, '0')}/100 USD`;
}

const ACTIVIDAD_ECONOMICA_MAP: Record<string, string> = {
  '62010': 'Actividades de programación informática',
  '62020': 'Actividades de consultoría informática y gestión de instalaciones informáticas',
  '62090': 'Otras actividades de tecnología de la información y servicios informáticos',
  '46510': 'Venta al por mayor de computadoras, equipo periférico y programas informáticos',
};

function decrypt(ciphertext: string): string {
  const SALT_LENGTH = 32;
  const IV_LENGTH = 16;
  const AUTH_TAG_LENGTH = 16;

  const encryptionKey = Buffer.from(ENCRYPTION_KEY, 'hex');
  const combined = Buffer.from(ciphertext, 'base64');

  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512');

  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

async function signWithHaciendaXmlCert(certBuffer: Buffer, payload: Record<string, unknown>): Promise<string> {
  const content = certBuffer.toString('utf8');

  if (!content.includes('<CertificadoMH>')) {
    throw new Error('Certificate is not in Hacienda XML format');
  }

  const privateKeyMatch = content.match(/<privateKey>.*?<encodied>([^<]+)<\/encodied>/s);
  if (!privateKeyMatch?.[1]) throw new Error('No private key found in XML cert');

  const privateKeyBase64 = privateKeyMatch[1].replace(/\s/g, '');
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64}\n-----END PRIVATE KEY-----`;

  const algorithm = 'RS512';
  const privateKey = await jose.importPKCS8(privateKeyPem, algorithm);

  const payloadString = JSON.stringify(payload);
  const jws = await new jose.CompactSign(new TextEncoder().encode(payloadString))
    .setProtectedHeader({ alg: algorithm })
    .sign(privateKey);

  return jws;
}

async function authenticateWithMH(nit: string, password: string, env: 'test' | 'prod'): Promise<string> {
  const cleanNit = nit.replace(/-/g, '');
  const baseUrl = env === 'prod'
    ? 'https://api.dtes.mh.gob.sv'
    : 'https://apitest.dtes.mh.gob.sv';
  const url = `${baseUrl}/seguridad/auth`;

  const formData = new URLSearchParams();
  formData.append('user', cleanNit);
  formData.append('pwd', password);

  console.log(`Authenticating at ${url} with user=${cleanNit}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  const responseText = await response.text();
  console.log(`Auth response status: ${response.status}`);

  const data = JSON.parse(responseText) as { status: string; body?: { token: string; roles: string[] }; message?: string };

  if (data.status === 'OK' && data.body?.token) {
    const rawToken = data.body.token.replace(/^Bearer\s+/i, '');
    console.log(`Token obtained (first 50): ${rawToken.substring(0, 50)}...`);
    return rawToken;
  }

  throw new Error(`MH Auth failed: ${JSON.stringify(data)}`);
}

/**
 * Normalize the CCF JSON to comply with Hacienda fe-ccf-v3 schema
 */
function normalizeCcfJson(
  original: Record<string, unknown>,
  tenant: { nit: string; nrc: string; nombre: string; nombreComercial: string | null; actividadEcon: string; direccion: string | null; telefono: string | null; correo: string },
  sucursal: { tipoEstablecimiento: string; codEstableMH: string | null; codEstable: string | null } | null,
): Record<string, unknown> {
  const identificacion = (original.identificacion as Record<string, unknown>) || {};
  const receptor = (original.receptor as Record<string, unknown>) || {};
  const cuerpoDocumento = (original.cuerpoDocumento as Array<Record<string, unknown>>) || [];
  const resumen = (original.resumen as Record<string, unknown>) || {};

  // Build emisor from tenant
  let direccionEmisor: Record<string, unknown>;
  try {
    direccionEmisor = typeof tenant.direccion === 'string' ? JSON.parse(tenant.direccion) : (tenant.direccion as unknown as Record<string, unknown>);
  } catch {
    direccionEmisor = { departamento: '06', municipio: '14', complemento: tenant.direccion || '' };
  }
  if (typeof direccionEmisor === 'string' || !direccionEmisor?.departamento) {
    direccionEmisor = { departamento: '06', municipio: '14', complemento: String(direccionEmisor || tenant.direccion || '') };
  }

  const emisor = {
    nit: tenant.nit.replace(/-/g, ''),
    nrc: tenant.nrc.replace(/-/g, ''),
    nombre: tenant.nombre,
    codActividad: tenant.actividadEcon || '62010',
    descActividad: ACTIVIDAD_ECONOMICA_MAP[tenant.actividadEcon] || 'Servicios',
    nombreComercial: tenant.nombreComercial || null,
    tipoEstablecimiento: sucursal?.tipoEstablecimiento || '01',
    direccion: direccionEmisor,
    telefono: tenant.telefono || '00000000',
    correo: tenant.correo,
    codEstableMH: sucursal?.codEstableMH || null,
    codEstable: sucursal?.codEstable || null,
    codPuntoVentaMH: null,
    codPuntoVenta: null,
  };

  // Normalize identificacion
  const normalizedIdentificacion = {
    ...identificacion,
    motivoContin: identificacion.motivoContin ?? null,
  };

  // Normalize receptor: CCF uses nit/nrc instead of numDocumento
  const receptorNumDoc = (receptor.numDocumento as string) || '';
  let receptorDireccion = receptor.direccion;
  if (typeof receptorDireccion === 'string') {
    try {
      receptorDireccion = JSON.parse(receptorDireccion);
    } catch {
      receptorDireccion = { departamento: '06', municipio: '14', complemento: receptorDireccion };
    }
  }
  if (!receptorDireccion || typeof receptorDireccion !== 'object' || !(receptorDireccion as Record<string, unknown>).departamento) {
    receptorDireccion = { departamento: '06', municipio: '14', complemento: String(receptorDireccion || '') };
  }

  const normalizedReceptor = {
    nit: receptorNumDoc.replace(/-/g, '') || (receptor.nit as string)?.replace(/-/g, '') || '',
    nrc: ((receptor.nrc as string) || '').replace(/-/g, '') || '',
    nombre: receptor.nombre as string || '',
    codActividad: (receptor.codActividad as string) || '62010',
    descActividad: (receptor.descActividad as string) || 'Servicios',
    nombreComercial: (receptor.nombreComercial as string) || null,
    direccion: receptorDireccion,
    telefono: (receptor.telefono as string) || null,
    correo: (receptor.correo as string) || '',
  };

  // Normalize cuerpoDocumento: remove ivaItem, add codTributo/numeroDocumento
  const normalizedCuerpo = cuerpoDocumento.map(item => {
    const { ivaItem: _ivaItem, ...rest } = item;
    return {
      ...rest,
      numeroDocumento: item.numeroDocumento ?? null,
      codTributo: item.codTributo ?? null,
    };
  });

  // Normalize resumen: replace totalIva with tributos + ivaPerci1/ivaRete1
  const totalGravada = Number(resumen.totalGravada) || 0;
  const IVA_RATE = 0.13;
  const ivaAmount = Math.round(totalGravada * IVA_RATE * 100) / 100;

  const tributos = totalGravada > 0 ? [{
    codigo: '20',
    descripcion: 'Impuesto al Valor Agregado 13%',
    valor: ivaAmount,
  }] : null;

  const montoTotalOperacion = Math.round((totalGravada + (Number(resumen.totalExenta) || 0) + (Number(resumen.totalNoSuj) || 0) + ivaAmount) * 100) / 100;

  const { totalIva: _totalIva, ...resumenRest } = resumen;
  const normalizedResumen = {
    ...resumenRest,
    tributos,
    subTotal: Number(resumen.subTotal) || Number(resumen.subTotalVentas) || 0,
    ivaPerci1: 0,
    ivaRete1: 0,
    reteRenta: Number(resumen.reteRenta) || 0,
    montoTotalOperacion,
    totalPagar: montoTotalOperacion,
    totalLetras: (resumen.totalLetras as string) || numberToWords(montoTotalOperacion),
    saldoFavor: Number(resumen.saldoFavor) || 0,
    condicionOperacion: Number(resumen.condicionOperacion) || 1,
    pagos: resumen.pagos ?? [{
      codigo: '01',
      montoPago: montoTotalOperacion,
      referencia: null,
      plazo: null,
      periodo: null,
    }],
    numPagoElectronico: resumen.numPagoElectronico ?? null,
  };

  return {
    identificacion: normalizedIdentificacion,
    documentoRelacionado: (original.documentoRelacionado as unknown) ?? null,
    emisor,
    receptor: normalizedReceptor,
    otrosDocumentos: (original.otrosDocumentos as unknown) ?? null,
    ventaTercero: (original.ventaTercero as unknown) ?? null,
    cuerpoDocumento: normalizedCuerpo,
    resumen: normalizedResumen,
    extension: (original.extension as unknown) ?? null,
    apendice: (original.apendice as unknown) ?? null,
  };
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Fix DTE #021 v2 — Normalize CCF + Re-sign + Re-transmit ===\n');

    // 1. Load the DTE
    const dte = await prisma.dTE.findFirst({
      where: { id: DTE_ID, tenantId: TENANT_ID },
      include: {
        tenant: {
          include: {
            sucursales: {
              where: { activa: true },
              orderBy: { esPrincipal: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!dte) {
      console.error('DTE not found!');
      return;
    }

    console.log(`DTE: ${dte.numeroControl}`);
    console.log(`Estado: ${dte.estado}`);
    console.log(`Tipo: ${dte.tipoDte}`);
    console.log(`Tenant: ${dte.tenant.nombre} (NIT: ${dte.tenant.nit})`);

    if (dte.estado !== 'PENDIENTE' && dte.estado !== 'FIRMADO' && dte.estado !== 'RECHAZADO') {
      console.log(`DTE is ${dte.estado} — cannot retry. Skipping.`);
      return;
    }

    // 2. Load HaciendaConfig + EnvironmentConfig
    const haciendaConfig = await prisma.haciendaConfig.findUnique({
      where: { tenantId: TENANT_ID },
    });

    if (!haciendaConfig) {
      console.error('No HaciendaConfig found!');
      return;
    }

    const envConfig = await prisma.haciendaEnvironmentConfig.findFirst({
      where: {
        haciendaConfigId: haciendaConfig.id,
        environment: haciendaConfig.activeEnvironment,
      },
    });

    if (!envConfig?.certificateP12) {
      console.error('No certificate found!');
      return;
    }

    console.log(`\nEnvironment: ${envConfig.environment}`);
    console.log(`Certificate: ${envConfig.certificateFileName}`);

    // 3. Parse and normalize the JSON
    const jsonOriginal = JSON.parse(dte.jsonOriginal);
    console.log('\n--- Original JSON keys:', Object.keys(jsonOriginal).join(', '));
    console.log('Has emisor?', !!jsonOriginal.emisor);
    console.log('Has documentoRelacionado?', jsonOriginal.documentoRelacionado !== undefined);

    const sucursal = dte.tenant.sucursales[0] || null;
    const normalizedJson = normalizeCcfJson(jsonOriginal, dte.tenant, sucursal);

    console.log('\n--- Normalized JSON keys:', Object.keys(normalizedJson).join(', '));
    console.log('Emisor NIT:', (normalizedJson.emisor as Record<string, unknown>).nit);
    console.log('Receptor NIT:', (normalizedJson.receptor as Record<string, unknown>).nit);
    console.log('Tributos:', JSON.stringify((normalizedJson.resumen as Record<string, unknown>).tributos));
    console.log('montoTotalOperacion:', (normalizedJson.resumen as Record<string, unknown>).montoTotalOperacion);

    const ambiente = ((normalizedJson.identificacion as Record<string, unknown>)?.ambiente as string) || '00';
    const mhEnv: 'test' | 'prod' = ambiente === '01' ? 'prod' : 'test';
    console.log(`Ambiente: ${ambiente} (${mhEnv})`);

    // 4. Update jsonOriginal in DB with normalized version
    console.log('\n--- Step 1: Updating jsonOriginal with normalized CCF JSON ---');
    await prisma.dTE.update({
      where: { id: DTE_ID },
      data: {
        jsonOriginal: JSON.stringify(normalizedJson),
        estado: 'PENDIENTE',
        jsonFirmado: null,
        selloRecepcion: null,
        fechaRecepcion: null,
        descripcionMh: null,
      },
    });
    console.log('jsonOriginal updated and estado reset to PENDIENTE');

    // 5. Sign the normalized JSON
    console.log('\n--- Step 2: Signing DTE ---');
    const certBuffer = Buffer.from(envConfig.certificateP12);
    const jsonFirmado = await signWithHaciendaXmlCert(certBuffer, normalizedJson);
    console.log(`Signed! JWS length: ${jsonFirmado.length}`);

    await prisma.dTE.update({
      where: { id: DTE_ID },
      data: { jsonFirmado, estado: 'FIRMADO' },
    });
    await prisma.dTELog.create({
      data: { dteId: DTE_ID, accion: 'SIGNED', response: JSON.stringify({ auto: true, scriptFixV2: true, normalized: true }) },
    });
    console.log('DTE updated to FIRMADO');

    // 6. Authenticate with Hacienda
    console.log('\n--- Step 3: Getting Hacienda Auth Token ---');
    if (!envConfig.apiPasswordEncrypted) {
      console.error('No API password found!');
      return;
    }

    const apiPassword = decrypt(envConfig.apiPasswordEncrypted);
    const token = await authenticateWithMH(dte.tenant.nit, apiPassword, mhEnv);

    // 7. Transmit to Hacienda
    console.log('\n--- Step 4: Transmitting to Hacienda ---');
    const DTE_VERSIONS: Record<string, number> = {
      '01': 1, '03': 3, '05': 3, '06': 1, '07': 3, '11': 1, '14': 1, '15': 1,
    };

    const mhBaseUrl = mhEnv === 'prod'
      ? 'https://api.dtes.mh.gob.sv'
      : 'https://apitest.dtes.mh.gob.sv';
    const mhUrl = `${mhBaseUrl}/fesv/recepciondte`;

    const requestBody = {
      ambiente,
      idEnvio: Date.now(),
      version: DTE_VERSIONS[dte.tipoDte] || 3,
      tipoDte: dte.tipoDte,
      documento: jsonFirmado,
      codigoGeneracion: dte.codigoGeneracion,
    };

    console.log(`Sending to: ${mhUrl}`);
    console.log(`tipoDte: ${requestBody.tipoDte}, version: ${requestBody.version}, ambiente: ${requestBody.ambiente}`);

    const mhResponse = await fetch(mhUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`MH Status: ${mhResponse.status} ${mhResponse.statusText}`);
    const responseText = await mhResponse.text();
    console.log(`MH Body: ${responseText.substring(0, 1500)}`);

    if (!responseText.trim()) {
      console.error('Empty response from Hacienda!');
      return;
    }

    const response = JSON.parse(responseText) as {
      estado: string;
      selloRecibido: string | null;
      fhProcesamiento: string;
      observaciones: string[];
      descripcionMsg?: string;
    };

    if (response.estado === 'RECHAZADO') {
      console.error(`\nRECHAZADO: ${response.descripcionMsg}`);
      console.error(`Observaciones: ${JSON.stringify(response.observaciones, null, 2)}`);
      await prisma.dTE.update({
        where: { id: DTE_ID },
        data: {
          estado: 'RECHAZADO',
          descripcionMh: response.observaciones?.join(', ') || response.descripcionMsg,
          intentosEnvio: { increment: 1 },
        },
      });
      await prisma.dTELog.create({
        data: { dteId: DTE_ID, accion: 'TRANSMISSION_ERROR', response: JSON.stringify({ ...response, scriptFixV2: true }) },
      });
      return;
    }

    console.log(`\n=== SUCCESS ===`);
    console.log(`Estado: ${response.estado}`);
    console.log(`Sello Recibido: ${response.selloRecibido}`);
    console.log(`Fecha Procesamiento: ${response.fhProcesamiento}`);
    console.log(`Observaciones: ${response.observaciones?.join(', ') || 'ninguna'}`);

    await prisma.dTE.update({
      where: { id: DTE_ID },
      data: {
        estado: 'PROCESADO',
        selloRecepcion: response.selloRecibido || undefined,
        fechaRecepcion: response.fhProcesamiento ? new Date(response.fhProcesamiento) : null,
        descripcionMh: response.observaciones?.join(', '),
        intentosEnvio: { increment: 1 },
      },
    });

    await prisma.dTELog.create({
      data: {
        dteId: DTE_ID,
        accion: 'TRANSMITTED',
        response: JSON.stringify({ selloRecibido: response.selloRecibido, fhProcesamiento: response.fhProcesamiento, scriptFixV2: true }),
      },
    });

    console.log('\nDTE updated to PROCESADO!');

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
