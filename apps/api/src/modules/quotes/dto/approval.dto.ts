import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  IsNumber,
  IsIn,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineItemApprovalDto {
  @IsString()
  id: string;

  @IsIn(['APPROVED', 'REJECTED'])
  approvalStatus: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedQuantity?: number;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ClientApprovalDto {
  @IsString()
  approverName: string;

  @IsEmail()
  approverEmail: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemApprovalDto)
  lineItems?: LineItemApprovalDto[];
}

export class ClientRejectionDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  rejectorName?: string;

  @IsOptional()
  @IsEmail()
  rejectorEmail?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class RequestChangesDto {
  @IsArray()
  @IsString({ each: true })
  removedItems: string[];

  @IsString()
  @IsNotEmpty()
  comments: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;
}
