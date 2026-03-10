import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // Verify token's tenantId matches user's current tenantId in DB.
    // Prevents stale tokens from accessing wrong tenant after reassignment.
    if (payload.tenantId && payload.tenantId !== user.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch — please login again');
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      rol: user.rol,
      tenant: user.tenant,
    };
  }
}
