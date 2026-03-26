import { Module } from '@nestjs/common';
import { RbacService } from './services/rbac.service';
import { RbacGuard } from './guards/rbac.guard';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  providers: [RbacService, RbacGuard, TenantGuard],
  exports: [RbacService, RbacGuard, TenantGuard],
})
export class RbacModule {}
