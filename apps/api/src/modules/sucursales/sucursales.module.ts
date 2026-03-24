import { Module } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
