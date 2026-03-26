import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';

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

  @IsString()
  scopeId: string;
}
