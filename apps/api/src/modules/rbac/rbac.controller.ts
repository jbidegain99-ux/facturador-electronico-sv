import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from './decorators/require-permission.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { RbacManagementService } from './services/rbac-management.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto';

@ApiTags('rbac')
@Controller('rbac')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RbacController {
  constructor(private readonly rbacManagementService: RbacManagementService) {}

  private ensureTenant(user: CurrentUserData): string {
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no tiene tenant asignado');
    }
    return user.tenantId;
  }

  @Get('roles')
  @RequirePermission('role:read')
  getRoles(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.getRoles(tenantId);
  }

  @Get('roles/:id')
  @RequirePermission('role:read')
  getRole(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.getRole(tenantId, id);
  }

  @Post('roles')
  @RequirePermission('role:manage')
  createRole(@CurrentUser() user: CurrentUserData, @Body() dto: CreateRoleDto) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.createRole(tenantId, dto);
  }

  @Patch('roles/:id')
  @RequirePermission('role:manage')
  updateRole(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.updateRole(tenantId, id, dto);
  }

  @Delete('roles/:id')
  @RequirePermission('role:manage')
  deleteRole(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.deleteRole(tenantId, id);
  }

  @Get('permissions')
  @RequirePermission('role:read')
  getPermissions() {
    return this.rbacManagementService.getPermissions();
  }

  @Get('templates')
  @RequirePermission('role:read')
  getTemplates() {
    return this.rbacManagementService.getTemplates();
  }

  @Get('users')
  @RequirePermission('user:read')
  getUsers(@CurrentUser() user: CurrentUserData) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.getUsers(tenantId);
  }

  @Post('users/:userId/assign')
  @RequirePermission('user:manage')
  assignRole(
    @CurrentUser() user: CurrentUserData,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.assignRole(tenantId, userId, dto, user.id);
  }

  @Delete('users/:userId/assignments/:assignmentId')
  @RequirePermission('user:manage')
  removeAssignment(
    @CurrentUser() user: CurrentUserData,
    @Param('userId') userId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    const tenantId = this.ensureTenant(user);
    return this.rbacManagementService.removeAssignment(tenantId, userId, assignmentId, user.id);
  }
}
