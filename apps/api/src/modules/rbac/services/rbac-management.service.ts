import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RbacService } from './rbac.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto';

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
  ) {}

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

  async createRole(tenantId: string, dto: CreateRoleDto) {
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

  async updateRole(tenantId: string, roleId: string, dto: UpdateRoleDto) {
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

    return this.getRole(tenantId, roleId);
  }

  async deleteRole(tenantId: string, roleId: string) {
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

    const assignment = await this.prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId: dto.roleId,
        tenantId,
        scopeType: dto.scopeType,
        scopeId: dto.scopeId,
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
          include: {
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

    return { deleted: true };
  }
}
