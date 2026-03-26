import { IsString, IsOptional, IsArray, IsIn, IsEmail } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class AssignRoleDto {
  @IsString()
  roleId: string;

  @IsIn(['tenant', 'branch', 'pos'])
  scopeType: 'tenant' | 'branch' | 'pos';

  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class InviteUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  nombre: string;

  @IsString()
  roleId: string;

  @IsOptional()
  @IsIn(['tenant', 'branch', 'pos'])
  scopeType?: string;

  @IsOptional()
  @IsString()
  scopeId?: string;
}

export class AcceptInviteDto {
  @IsString()
  token: string;

  @IsString()
  password: string;
}
