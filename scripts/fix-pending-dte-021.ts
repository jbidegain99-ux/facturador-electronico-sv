/**
 * One-off script to sign and transmit the pending DTE-03-M001P001-000000000000021
 * for tenant Republicode S.A. de C.V.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/fix-pending-dte-021.ts
 */
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import * as forge from 'node-forge';
import * as crypto from 'crypto';
import { sendDTE, SendDTERequest } from '@facturador/mh-client';
import { DTE_VERSIONS, TipoDte } from '@facturador/shared';

const TENANT_ID = 'cmkwth4ie0001b3hld086ommq';
const DTE_ID = 'cmmnpub46000bsclb6zohj83l';
const ENCRYPTION_KEY = 'e2ec959638e61afc4850b57054965266249ca18e5edc32f46c9d2fb6110c26a8';
const MH_AUTH_URL_PROD = 'https://api.dtes.mh.gob.sv/seguridad/auth?user={user}&pwd={pwd}';
const MH_AUTH_URL_TEST = 'https://apitest.dtes.mh.gob.sv/seguridad/auth?user={user}&pwd={pwd}';

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

  const publicKeyMatch = content.match(/<publicKey>.*?<encodied>([^<]+)<\/encodied>/s);
  if (!publicKeyMatch?.[1]) throw new Error('No public key found in XML cert');

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
  console.log(`Auth response: ${responseText.substring(0, 500)}`);

  const data = JSON.parse(responseText) as { status: string; body?: { token: string; roles: string[] }; message?: string };

  if (data.status === 'OK' && data.body?.token) {
    const roles = data.body.roles || ((data as Record<string, unknown>).body as Record<string, unknown>)?.rol;
    console.log(`Roles: ${JSON.stringify(roles)}`);
    // Token from MH may include "Bearer " prefix - strip it
    const rawToken = data.body.token.replace(/^Bearer\s+/i, '');
    console.log(`Token (first 50): ${rawToken.substring(0, 50)}...`);
    return rawToken;
  }

  throw new Error(`MH Auth failed: ${JSON.stringify(data)}`);
}

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Fix Pending DTE #021 ===\n');

    // 1. Load the DTE
    const dte = await prisma.dTE.findFirst({
      where: { id: DTE_ID, tenantId: TENANT_ID },
      include: { tenant: true },
    });

    if (!dte) {
      console.error('DTE not found!');
      return;
    }

    console.log(`DTE: ${dte.numeroControl}`);
    console.log(`Estado: ${dte.estado}`);
    console.log(`Tenant: ${dte.tenant.nombre} (NIT: ${dte.tenant.nit})`);

    if (dte.estado !== 'PENDIENTE' && dte.estado !== 'FIRMADO') {
      console.log(`DTE is not PENDIENTE or FIRMADO (estado=${dte.estado}), skipping.`);
      return;
    }

    // 2. Load tenant's HaciendaConfig + EnvironmentConfig
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

    console.log(`\nCertificate: ${envConfig.certificateFileName}`);
    console.log(`Environment: ${envConfig.environment}`);
    console.log(`API User: ${envConfig.apiUser}`);

    // 3. Parse jsonOriginal
    const jsonOriginal = JSON.parse(dte.jsonOriginal);
    const ambiente = jsonOriginal.identificacion?.ambiente || '00';
    const mhEnv: 'test' | 'prod' = ambiente === '01' ? 'prod' : 'test';

    console.log(`Codigo Generacion: ${jsonOriginal.identificacion?.codigoGeneracion}`);
    console.log(`Ambiente: ${ambiente} (${mhEnv})`);

    // 4. Sign the DTE (always re-sign to ensure fresh signature)
    let jsonFirmado: string;
    if (false) {
      // Placeholder - always re-sign
      jsonFirmado = '';
    } else {
      console.log('\n--- Step 1: Signing DTE ---');
      const certBuffer = Buffer.from(envConfig.certificateP12);
      jsonFirmado = await signWithHaciendaXmlCert(certBuffer, jsonOriginal);
      console.log(`Signed! JWS length: ${jsonFirmado.length}`);

      await prisma.dTE.update({
        where: { id: DTE_ID },
        data: { jsonFirmado, estado: 'FIRMADO' },
      });
      await prisma.dTELog.create({
        data: { dteId: DTE_ID, accion: 'SIGNED', response: JSON.stringify({ auto: true, scriptFix: true }) },
      });
      console.log('DTE updated to FIRMADO');
    }

    // 5. Authenticate with Hacienda
    console.log('\n--- Step 2: Getting Hacienda Auth Token ---');
    if (!envConfig.apiPasswordEncrypted) {
      console.error('No API password found!');
      return;
    }

    const apiPassword = decrypt(envConfig.apiPasswordEncrypted);
    const token = await authenticateWithMH(dte.tenant.nit, apiPassword, mhEnv);
    console.log('Token obtained!');

    // 6. Transmit to Hacienda
    console.log('\n--- Step 3: Transmitting to Hacienda ---');
    const request: SendDTERequest = {
      ambiente: ambiente as '00' | '01',
      idEnvio: Date.now(),
      version: DTE_VERSIONS[dte.tipoDte as TipoDte],
      tipoDte: dte.tipoDte as TipoDte,
      documento: jsonFirmado,
      codigoGeneracion: dte.codigoGeneracion,
    };

    // Send directly with full debugging instead of using sendDTE
    const mhBaseUrl = mhEnv === 'prod'
      ? 'https://api.dtes.mh.gob.sv'
      : 'https://apitest.dtes.mh.gob.sv';
    const mhUrl = `${mhBaseUrl}/fesv/recepciondte`;

    console.log(`Sending to: ${mhUrl}`);
    console.log(`tipoDte: ${request.tipoDte}, version: ${request.version}, ambiente: ${request.ambiente}`);

    const mhFetchResponse = await fetch(mhUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log(`MH Status: ${mhFetchResponse.status} ${mhFetchResponse.statusText}`);
    const responseText = await mhFetchResponse.text();
    console.log(`MH Body: ${responseText.substring(0, 1000)}`);

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
      console.error(`Observaciones: ${response.observaciones?.join('\n')}`);
      await prisma.dTE.update({
        where: { id: DTE_ID },
        data: {
          estado: 'RECHAZADO',
          descripcionMh: response.observaciones?.join(', ') || response.descripcionMsg,
          intentosEnvio: { increment: 1 },
        },
      });
      return;
    }

    console.log(`\n=== SUCCESS ===`);
    console.log(`Sello Recibido: ${response.selloRecibido}`);
    console.log(`Fecha Procesamiento: ${response.fhProcesamiento}`);
    console.log(`Observaciones: ${response.observaciones?.join(', ') || 'ninguna'}`);

    // Update DTE
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
        response: JSON.stringify({ selloRecibido: response.selloRecibido, fhProcesamiento: response.fhProcesamiento, scriptFix: true }),
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
