import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MhAuthService } from './mh-auth.service';
import { MHAuthError, MHEnvironment } from '@facturador/mh-client';

export class GetTokenDto {
  nit: string;
  password: string;
  env?: MHEnvironment;
}

@Controller('mh-auth')
export class MhAuthController {
  constructor(private readonly mhAuthService: MhAuthService) {}

  @Post('token')
  async getToken(@Body() dto: GetTokenDto) {
    try {
      const tokenInfo = await this.mhAuthService.getToken(
        dto.nit,
        dto.password,
        dto.env || 'test'
      );

      return {
        success: true,
        data: {
          token: tokenInfo.token,
          roles: tokenInfo.roles,
          obtainedAt: tokenInfo.obtainedAt.toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof MHAuthError) {
        throw new HttpException(
          {
            success: false,
            error: error.message,
            statusCode: error.statusCode,
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      throw new HttpException(
        {
          success: false,
          error: 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
