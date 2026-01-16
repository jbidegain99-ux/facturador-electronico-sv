import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignerService } from './signer.service';

export class SignTestDto {
  payload: Record<string, unknown>;
}

export class VerifySignatureDto {
  jws: string;
}

export class LoadCertificateDto {
  password: string;
}

@Controller('signer')
export class SignerController {
  constructor(private readonly signerService: SignerService) {}

  @Get('status')
  getStatus() {
    const isLoaded = this.signerService.isCertificateLoaded();

    if (!isLoaded) {
      return {
        loaded: false,
        valid: false,
        certificate: null,
      };
    }

    try {
      const certInfo = this.signerService.getCertificateInfo();
      const isValid = this.signerService.isCertificateValid();

      return {
        loaded: true,
        valid: isValid,
        certificate: {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          validFrom: certInfo.validFrom.toISOString(),
          validTo: certInfo.validTo.toISOString(),
          serialNumber: certInfo.serialNumber,
        },
      };
    } catch (error) {
      return {
        loaded: false,
        valid: false,
        certificate: null,
      };
    }
  }

  @Post('load')
  @UseInterceptors(FileInterceptor('certificate'))
  async loadCertificate(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: LoadCertificateDto
  ) {
    if (!file) {
      throw new HttpException('Certificate file is required', HttpStatus.BAD_REQUEST);
    }

    if (!dto.password) {
      throw new HttpException('Password is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const certInfo = await this.signerService.loadCertificateFromBuffer(file.buffer, dto.password);

      return {
        success: true,
        message: 'Certificate loaded successfully',
        certificate: {
          subject: certInfo.subject,
          issuer: certInfo.issuer,
          validFrom: certInfo.validFrom.toISOString(),
          validTo: certInfo.validTo.toISOString(),
          serialNumber: certInfo.serialNumber,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load certificate',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('test')
  async signTest(@Body() dto: SignTestDto) {
    if (!dto.payload || typeof dto.payload !== 'object') {
      throw new HttpException('Payload must be a valid JSON object', HttpStatus.BAD_REQUEST);
    }

    if (!this.signerService.isCertificateLoaded()) {
      throw new HttpException(
        'No certificate loaded. Upload a certificate first using POST /signer/load',
        HttpStatus.PRECONDITION_FAILED
      );
    }

    try {
      const result = await this.signerService.signDTEWithInfo(dto.payload);

      return {
        success: true,
        jws: result.jws,
        jwsParts: {
          header: this.signerService.decodeJWSHeader(result.jws),
          payloadPreview: JSON.stringify(dto.payload).substring(0, 200) + '...',
        },
        certificate: {
          subject: result.certificateInfo.subject,
          validTo: result.certificateInfo.validTo.toISOString(),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to sign payload',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify')
  async verifySignature(@Body() dto: VerifySignatureDto) {
    if (!dto.jws || typeof dto.jws !== 'string') {
      throw new HttpException('JWS string is required', HttpStatus.BAD_REQUEST);
    }

    if (!this.signerService.isCertificateLoaded()) {
      throw new HttpException(
        'No certificate loaded. Upload a certificate first using POST /signer/load',
        HttpStatus.PRECONDITION_FAILED
      );
    }

    try {
      const result = await this.signerService.verifySignature(dto.jws);

      return {
        success: true,
        valid: result.valid,
        payload: result.payload,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to verify signature',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('decode')
  decodeJWS(@Body() dto: VerifySignatureDto) {
    if (!dto.jws || typeof dto.jws !== 'string') {
      throw new HttpException('JWS string is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const header = this.signerService.decodeJWSHeader(dto.jws);
      const payload = this.signerService.decodeJWSPayload(dto.jws);

      return {
        success: true,
        header,
        payload,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to decode JWS',
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
