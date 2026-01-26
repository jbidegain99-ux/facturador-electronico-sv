import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  MAINTENANCE = 'MAINTENANCE',
  NEW_FEATURE = 'NEW_FEATURE',
  PLAN_LIMIT_WARNING = 'PLAN_LIMIT_WARNING',
  PLAN_EXPIRED = 'PLAN_EXPIRED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  GENERAL = 'GENERAL',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationTarget {
  ALL_USERS = 'ALL_USERS',
  ALL_TENANTS = 'ALL_TENANTS',
  SPECIFIC_TENANT = 'SPECIFIC_TENANT',
  SPECIFIC_USER = 'SPECIFIC_USER',
  BY_PLAN = 'BY_PLAN',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.GENERAL })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationTarget, default: NotificationTarget.ALL_USERS })
  @IsOptional()
  @IsEnum(NotificationTarget)
  target?: NotificationTarget;

  @ApiPropertyOptional({ description: 'ID del tenant objetivo (si target = SPECIFIC_TENANT)' })
  @IsOptional()
  @IsString()
  targetTenantId?: string;

  @ApiPropertyOptional({ description: 'ID del usuario objetivo (si target = SPECIFIC_USER)' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'IDs de planes objetivo (si target = BY_PLAN)' })
  @IsOptional()
  @IsString()
  targetPlanIds?: string; // JSON array

  @ApiPropertyOptional({ description: 'Fecha de inicio de la notificación' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración de la notificación' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Permite descartar la notificación', default: true })
  @IsOptional()
  @IsBoolean()
  isDismissable?: boolean;

  @ApiPropertyOptional({ description: 'Mostrar solo una vez', default: false })
  @IsOptional()
  @IsBoolean()
  showOnce?: boolean;

  @ApiPropertyOptional({ description: 'URL de acción' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Texto del botón de acción' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionLabel?: string;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Título de la notificación' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Mensaje de la notificación' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationTarget })
  @IsOptional()
  @IsEnum(NotificationTarget)
  target?: NotificationTarget;

  @ApiPropertyOptional({ description: 'ID del tenant objetivo' })
  @IsOptional()
  @IsString()
  targetTenantId?: string;

  @ApiPropertyOptional({ description: 'ID del usuario objetivo' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'IDs de planes objetivo' })
  @IsOptional()
  @IsString()
  targetPlanIds?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Permite descartar' })
  @IsOptional()
  @IsBoolean()
  isDismissable?: boolean;

  @ApiPropertyOptional({ description: 'Mostrar solo una vez' })
  @IsOptional()
  @IsBoolean()
  showOnce?: boolean;

  @ApiPropertyOptional({ description: 'URL de acción' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Texto del botón de acción' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionLabel?: string;

  @ApiPropertyOptional({ description: 'Notificación activa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
