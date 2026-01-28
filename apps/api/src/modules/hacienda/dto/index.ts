import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigureEnvironmentDto {
  @ApiProperty({
    description: 'API user for Hacienda authentication (usually NIT without dashes)',
    example: '06140101001000',
  })
  @IsString()
  @IsNotEmpty({ message: 'El usuario de API es requerido' })
  apiUser: string;

  @ApiProperty({
    description: 'API password for Hacienda authentication',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña de API es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(50, { message: 'La contraseña no puede exceder 50 caracteres' })
  apiPassword: string;

  @ApiProperty({
    description: 'Certificate password for the .p12/.pfx file',
    example: 'CertPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña del certificado es requerida' })
  certificatePassword: string;
}

export class SwitchEnvironmentDto {
  @ApiProperty({
    enum: ['TEST', 'PRODUCTION'],
    description: 'Environment to switch to',
    example: 'PRODUCTION',
  })
  @IsEnum(['TEST', 'PRODUCTION'], {
    message: 'El ambiente debe ser TEST o PRODUCTION',
  })
  environment: 'TEST' | 'PRODUCTION';
}

export class TestConnectionDto {
  @ApiProperty({
    enum: ['TEST', 'PRODUCTION'],
    description: 'Environment to test connection',
    example: 'TEST',
  })
  @IsEnum(['TEST', 'PRODUCTION'], {
    message: 'El ambiente debe ser TEST o PRODUCTION',
  })
  environment: 'TEST' | 'PRODUCTION';
}

export class RenewTokenDto {
  @ApiProperty({
    enum: ['TEST', 'PRODUCTION'],
    description: 'Environment to renew token',
    example: 'TEST',
  })
  @IsEnum(['TEST', 'PRODUCTION'], {
    message: 'El ambiente debe ser TEST o PRODUCTION',
  })
  environment: 'TEST' | 'PRODUCTION';
}

export class ExecuteTestDto {
  @ApiProperty({
    description: 'DTE type code',
    enum: ['01', '03', '04', '05', '06', '11', '14'],
    example: '01',
  })
  @IsString()
  @IsEnum(['01', '03', '04', '05', '06', '11', '14'], {
    message: 'Tipo de DTE inválido',
  })
  dteType: '01' | '03' | '04' | '05' | '06' | '11' | '14';

  @ApiProperty({
    description: 'Test type',
    enum: ['EMISSION', 'CANCELLATION', 'CONTINGENCY'],
    example: 'EMISSION',
  })
  @IsEnum(['EMISSION', 'CANCELLATION', 'CONTINGENCY'], {
    message: 'Tipo de prueba inválido',
  })
  testType: 'EMISSION' | 'CANCELLATION' | 'CONTINGENCY';

  @ApiPropertyOptional({
    description: 'Optional custom test data',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  testData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'For cancellation: codigo generacion of DTE to cancel',
  })
  @IsOptional()
  @IsString()
  codigoGeneracionToCancel?: string;
}

export class GetTestHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by DTE type',
    enum: ['01', '03', '04', '05', '06', '11', '14'],
  })
  @IsOptional()
  @IsString()
  dteType?: string;

  @ApiPropertyOptional({
    description: 'Filter by test status',
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Number of records to return',
    default: 50,
  })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    default: 0,
  })
  @IsOptional()
  offset?: number;
}

export class GenerateTestDataDto {
  @ApiProperty({
    description: 'DTE type code',
    enum: ['01', '03', '04', '05', '06', '11', '14'],
    example: '01',
  })
  @IsString()
  @IsEnum(['01', '03', '04', '05', '06', '11', '14'], {
    message: 'Tipo de DTE inválido',
  })
  dteType: '01' | '03' | '04' | '05' | '06' | '11' | '14';
}

// Response DTOs for documentation
export class CertificateInfoDto {
  @ApiProperty()
  fileName: string;

  @ApiProperty()
  validUntil: Date;

  @ApiProperty({ nullable: true })
  nit: string | null;

  @ApiProperty()
  subject: string;
}

export class EnvironmentConfigResponseDto {
  @ApiProperty({ enum: ['TEST', 'PRODUCTION'] })
  environment: 'TEST' | 'PRODUCTION';

  @ApiProperty()
  isConfigured: boolean;

  @ApiProperty()
  isValidated: boolean;

  @ApiPropertyOptional()
  tokenExpiry?: Date;

  @ApiPropertyOptional({ type: CertificateInfoDto })
  certificateInfo?: CertificateInfoDto;

  @ApiPropertyOptional()
  lastValidationAt?: Date;

  @ApiPropertyOptional()
  lastValidationError?: string;
}

export class HaciendaConfigResponseDto {
  @ApiProperty({ enum: ['TEST', 'PRODUCTION'] })
  activeEnvironment: 'TEST' | 'PRODUCTION';

  @ApiProperty({ enum: ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_AUTHORIZATION', 'AUTHORIZED'] })
  testingStatus: string;

  @ApiPropertyOptional()
  testingStartedAt?: Date;

  @ApiPropertyOptional()
  testingCompletedAt?: Date;

  @ApiPropertyOptional()
  productionAuthorizedAt?: Date;

  @ApiPropertyOptional({ type: EnvironmentConfigResponseDto })
  testConfig?: EnvironmentConfigResponseDto;

  @ApiPropertyOptional({ type: EnvironmentConfigResponseDto })
  prodConfig?: EnvironmentConfigResponseDto;
}

export class TestProgressByDteDto {
  @ApiProperty()
  dteType: string;

  @ApiProperty()
  dteName: string;

  @ApiProperty()
  emissionRequired: number;

  @ApiProperty()
  emissionCompleted: number;

  @ApiProperty()
  cancellationRequired: number;

  @ApiProperty()
  cancellationCompleted: number;

  @ApiProperty()
  isComplete: boolean;
}

export class TestProgressResponseDto {
  @ApiProperty({ type: [TestProgressByDteDto] })
  progress: TestProgressByDteDto[];

  @ApiProperty()
  totalRequired: number;

  @ApiProperty()
  totalCompleted: number;

  @ApiProperty()
  percentComplete: number;

  @ApiProperty()
  canRequestAuthorization: boolean;

  @ApiPropertyOptional()
  daysRemaining?: number;

  @ApiPropertyOptional()
  testingStartedAt?: Date;
}
