import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { RbacService } from './rbac.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '../../audit-logs/dto';
import { DefaultEmailService } from '../../email-config/services/default-email.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, InviteUserDto } from '../dto';

export interface PermissionGroup {
  category: string;
  permissions: Array<{
    id: string;
    code: string;
    resource: string;
    action: string;
    name: string;
  }>;
}

@Injectable()
export class RbacManagementService {
  private readonly logger = new Logger(RbacManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
    private readonly auditLogs: AuditLogsService,
    private readonly defaultEmailService: DefaultEmailService,
    private readonly configService: ConfigService,
  ) {}

  private audit(
    tenantId: string,
    userId: string,
    action: AuditAction,
    description: string,
    entityType: string,
    entityId: string,
    extra?: { oldValue?: Record<string, unknown>; newValue?: Record<string, unknown> },
  ) {
    this.auditLogs.log({
      tenantId,
      userId,
      action,
      module: AuditModule.RBAC,
      description,
      entityType,
      entityId,
      oldValue: extra?.oldValue,
      newValue: extra?.newValue,
    }).catch((err: Error) => {
      this.logger.warn(`Audit log failed: ${err.message}`);
    });
  }

  async getRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        _count: { select: { permissions: true, assignments: true } },
        template: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      isCustom: role.isCustom,
      templateCode: role.template?.code ?? null,
      templateName: role.template?.name ?? null,
      permissionCount: role._count.permissions,
      assignmentCount: role._count.assignments,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  async getRole(tenantId: string, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        template: { select: { code: true, name: true } },
        _count: { select: { assignments: true } },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return {
      id: role.id,
      name: role.name,
      isCustom: role.isCustom,
      templateCode: role.template?.code ?? null,
      templateName: role.template?.name ?? null,
      assignmentCount: role._count.assignments,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        resource: rp.permission.resource,
        action: rp.permission.action,
        name: rp.permission.name,
        category: rp.permission.category,
      })),
    };
  }

  async createRole(tenantId: string, dto: CreateRoleDto, currentUserId: string) {
    let permissionIds = dto.permissionIds;

    // If templateId is provided, copy permissions from the template
    if (dto.templateId) {
      const template = await this.prisma.roleTemplate.findUnique({
        where: { id: dto.templateId },
        include: { permissions: { select: { permissionId: true } } },
      });

      if (!template) {
        throw new NotFoundException('Plantilla de rol no encontrada');
      }

      // Use template permissions if none provided, otherwise merge
      if (permissionIds.length === 0) {
        permissionIds = template.permissions.map((tp) => tp.permissionId);
      }
    }

    // Validate that all permission IDs exist
    if (permissionIds.length > 0) {
      const existingCount = await this.prisma.permission.count({
        where: { id: { in: permissionIds } },
      });
      if (existingCount !== permissionIds.length) {
        throw new BadRequestException('Uno o más permisos no son válidos');
      }
    }

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        templateId: dto.templateId ?? null,
        isCustom: !dto.templateId,
        permissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: {
        permissions: { include: { permission: true } },
      },
    });

    this.logger.log(`Role created: ${role.id} (${role.name}) for tenant ${tenantId}`);
    this.audit(tenantId, currentUserId, AuditAction.CREATE, `Rol creado: ${role.name}`, 'Role', role.id, {
      newValue: { name: role.name, permissionCount: role.permissions.length },
    });

    return {
      id: role.id,
      name: role.name,
      isCustom: role.isCustom,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
      })),
    };
  }

  async updateRole(tenantId: string, roleId: string, dto: UpdateRoleDto, currentUserId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Update name if provided
    if (dto.name !== undefined) {
      await this.prisma.role.update({
        where: { id: roleId },
        data: { name: dto.name },
      });
    }

    // Replace permissions if provided
    if (dto.permissionIds !== undefined) {
      // Validate permission IDs
      if (dto.permissionIds.length > 0) {
        const existingCount = await this.prisma.permission.count({
          where: { id: { in: dto.permissionIds } },
        });
        if (existingCount !== dto.permissionIds.length) {
          throw new BadRequestException('Uno o más permisos no son válidos');
        }
      }

      // Delete existing and recreate
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId } }),
        ...dto.permissionIds.map((permissionId) =>
          this.prisma.rolePermission.create({
            data: { roleId, permissionId },
          }),
        ),
      ]);
    }

    // Invalidate cache for all users with this role
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: { roleId, tenantId },
      select: { userId: true },
    });

    for (const assignment of assignments) {
      this.rbacService.invalidateUser(assignment.userId, tenantId);
    }

    this.logger.log(`Role updated: ${roleId} for tenant ${tenantId}`);
    this.audit(tenantId, currentUserId, AuditAction.UPDATE, `Rol actualizado: ${role.name}`, 'Role', roleId, {
      newValue: { name: dto.name, permissionCount: dto.permissionIds?.length },
    });

    return this.getRole(tenantId, roleId);
  }

  async deleteRole(tenantId: string, roleId: string, currentUserId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: { _count: { select: { assignments: true } } },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    if (!role.isCustom) {
      throw new BadRequestException('No se pueden eliminar roles del sistema');
    }

    if (role._count.assignments > 0) {
      throw new BadRequestException(
        'No se puede eliminar un rol que tiene usuarios asignados. Reasigne los usuarios primero.',
      );
    }

    await this.prisma.role.delete({ where: { id: roleId } });

    this.logger.log(`Role deleted: ${roleId} (${role.name}) from tenant ${tenantId}`);
    this.audit(tenantId, currentUserId, AuditAction.DELETE, `Rol eliminado: ${role.name}`, 'Role', roleId);

    return { deleted: true };
  }

  async getPermissions(): Promise<PermissionGroup[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });

    const grouped = new Map<string, PermissionGroup>();

    for (const perm of permissions) {
      let group = grouped.get(perm.category);
      if (!group) {
        group = { category: perm.category, permissions: [] };
        grouped.set(perm.category, group);
      }
      group.permissions.push({
        id: perm.id,
        code: perm.code,
        resource: perm.resource,
        action: perm.action,
        name: perm.name,
      });
    }

    return Array.from(grouped.values());
  }

  async getTemplates() {
    const templates = await this.prisma.roleTemplate.findMany({
      include: {
        _count: { select: { permissions: true } },
      },
      orderBy: { code: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      description: t.description,
      isSystem: t.isSystem,
      permissionCount: t._count.permissions,
    }));
  }

  async getUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        roleAssignments: {
          where: { tenantId },
          include: {
            role: { select: { id: true, name: true } },
          },
          orderBy: { assignedAt: 'asc' },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      legacyRole: u.rol,
      assignments: u.roleAssignments.map((a) => ({
        id: a.id,
        roleId: a.role.id,
        roleName: a.role.name,
        scopeType: a.scopeType,
        scopeId: a.scopeId,
        assignedAt: a.assignedAt,
        expiresAt: a.expiresAt,
      })),
    }));
  }

  async assignRole(
    tenantId: string,
    userId: string,
    dto: AssignRoleDto,
    assignedBy: string,
  ) {
    // Default scopeId to tenantId when scope is tenant-level
    const scopeId = dto.scopeId || (dto.scopeType === 'tenant' ? tenantId : '');
    if (!scopeId) {
      throw new BadRequestException('scopeId es requerido para scope de tipo branch o pos');
    }

    // Verify user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado en este tenant');
    }

    // Verify role belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado en este tenant');
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRoleAssignment.findFirst({
      where: { userId, roleId: dto.roleId, scopeType: dto.scopeType, scopeId },
    });

    if (existing) {
      throw new ConflictException('Este usuario ya tiene este rol asignado con el mismo alcance');
    }

    const assignment = await this.prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId: dto.roleId,
        tenantId,
        scopeType: dto.scopeType,
        scopeId,
        assignedBy,
      },
      include: {
        role: { select: { id: true, name: true } },
      },
    });

    // Invalidate cache for this user
    this.rbacService.invalidateUser(userId, tenantId);

    this.logger.log(
      `Role assigned: user=${userId} role=${dto.roleId} scope=${dto.scopeType}:${dto.scopeId} tenant=${tenantId}`,
    );
    this.audit(tenantId, assignedBy, AuditAction.CREATE, `Rol ${role.name} asignado a usuario`, 'UserRoleAssignment', assignment.id, {
      newValue: { userId, roleName: role.name, scopeType: dto.scopeType, scopeId: dto.scopeId },
    });

    return {
      id: assignment.id,
      roleId: assignment.role.id,
      roleName: assignment.role.name,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      assignedAt: assignment.assignedAt,
    };
  }

  async removeAssignment(
    tenantId: string,
    userId: string,
    assignmentId: string,
    currentUserId: string,
  ) {
    const assignment = await this.prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId, tenantId },
      include: {
        role: {
          select: {
            name: true,
            permissions: {
              include: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Prevent removing your own last admin-level assignment
    if (userId === currentUserId) {
      const hasAdminPermission = assignment.role.permissions.some(
        (rp) => rp.permission.code === 'role:manage' || rp.permission.code === 'user:manage',
      );

      if (hasAdminPermission) {
        // Check if user has other assignments with admin permissions
        const otherAdminAssignments = await this.prisma.userRoleAssignment.findMany({
          where: {
            userId,
            tenantId,
            id: { not: assignmentId },
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: { select: { code: true } } },
                },
              },
            },
          },
        });

        const hasOtherAdminRole = otherAdminAssignments.some((a) =>
          a.role.permissions.some(
            (rp) => rp.permission.code === 'role:manage' || rp.permission.code === 'user:manage',
          ),
        );

        if (!hasOtherAdminRole) {
          throw new ForbiddenException(
            'No puedes remover tu último rol de administrador. Asigna otro administrador primero.',
          );
        }
      }
    }

    await this.prisma.userRoleAssignment.delete({
      where: { id: assignmentId },
    });

    // Invalidate cache for this user
    this.rbacService.invalidateUser(userId, tenantId);

    this.logger.log(
      `Assignment removed: id=${assignmentId} user=${userId} tenant=${tenantId}`,
    );
    this.audit(tenantId, currentUserId, AuditAction.DELETE, `Rol ${assignment.role.name} removido de usuario`, 'UserRoleAssignment', assignmentId, {
      oldValue: { userId, roleName: assignment.role.name, scopeType: assignment.scopeType },
    });

    return { deleted: true };
  }

  async inviteUser(tenantId: string, dto: InviteUserDto, invitedBy: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Verify roleId belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado en este tenant');
    }

    // Hash a random temporary password
    const tempPassword = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate invite token
    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Determine scope
    const scopeType = dto.scopeType || 'tenant';
    const scopeId = dto.scopeId || (scopeType === 'tenant' ? tenantId : '');

    if (!scopeId) {
      throw new BadRequestException('scopeId es requerido para scope de tipo branch o pos');
    }

    // Create user and role assignment in a transaction
    const result = await this.prisma.$transaction(async (tx: typeof this.prisma) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          nombre: dto.nombre,
          password: hashedPassword,
          rol: 'FACTURADOR',
          tenantId,
          emailVerified: false,
          emailVerificationToken: inviteToken,
          emailVerificationExpiresAt: expiresAt,
        },
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: newUser.id,
          roleId: dto.roleId,
          tenantId,
          scopeType,
          scopeId,
          assignedBy: invitedBy,
        },
      });

      return newUser;
    });

    // Get tenant name for the email
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { nombre: true },
    });
    const tenantName = tenant?.nombre || 'Tu empresa';

    // Send invitation email
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const emailHtml = `
      <h2>Invitación a Facturosv</h2>
      <p>Hola ${dto.nombre},</p>
      <p>${tenantName} te ha invitado a unirte a su equipo en Facturosv.</p>
      <p>Haz clic en el siguiente enlace para configurar tu contraseña y activar tu cuenta:</p>
      <a href="${frontendUrl}/invite/${inviteToken}">Activar mi cuenta</a>
      <p>Este enlace expira en 72 horas.</p>
    `;

    const emailResult = await this.defaultEmailService.sendEmail(tenantId, {
      to: dto.email,
      subject: 'Invitación a Facturosv - Configura tu cuenta',
      html: emailHtml,
    });

    if (!emailResult.success) {
      this.logger.warn(`Failed to send invite email to ${dto.email}: ${emailResult.errorMessage}`);
    } else {
      this.logger.log(`Invite email sent to ${dto.email}`);
    }

    // Audit log
    this.audit(tenantId, invitedBy, AuditAction.CREATE, `Usuario invitado: ${dto.email} con rol ${role.name}`, 'User', result.id, {
      newValue: { email: dto.email, nombre: dto.nombre, roleName: role.name },
    });

    return {
      id: result.id,
      email: result.email,
      nombre: result.nombre,
      roleName: role.name,
    };
  }

  async acceptInvite(token: string, password: string) {
    // Find user by invite token that hasn't expired
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invitación inválida o expirada');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Activate the user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true, email: user.email };
  }
}
