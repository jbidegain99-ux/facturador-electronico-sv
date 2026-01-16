import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as jose from 'jose';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SignerService {
  private readonly logger = new Logger(SignerService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async signDocument(tenantId: string, document: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant no encontrado');
    }

    const certPath = tenant.certificatePath || this.configService.get<string>('CERT_PATH');
    const certPassword = this.configService.get<string>('CERT_PASSWORD');

    if (!certPath || !certPassword) {
      throw new Error('Certificado no configurado');
    }

    const privateKey = await this.loadPrivateKeyFromP12(certPath, certPassword);
    const jws = await this.createJws(document, privateKey);

    this.logger.log(`Documento firmado para tenant ${tenantId}`);
    return jws;
  }

  private async loadPrivateKeyFromP12(certPath: string, password: string): Promise<jose.KeyLike> {
    const absolutePath = path.resolve(certPath);
    const p12Buffer = fs.readFileSync(absolutePath);
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];

    if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
      throw new Error('No se encontro la llave privada en el certificado');
    }

    const privateKeyPem = forge.pki.privateKeyToPem(keyBag[0].key);
    const privateKey = await jose.importPKCS8(privateKeyPem, 'RS512');

    return privateKey;
  }

  private async createJws(payload: string, privateKey: jose.KeyLike): Promise<string> {
    const jws = await new jose.CompactSign(new TextEncoder().encode(payload))
      .setProtectedHeader({ alg: 'RS512' })
      .sign(privateKey);

    return jws;
  }
}
