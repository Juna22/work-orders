import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignMechanicDto {
  @IsUUID()
  mechanicId: string;
}

/** "Update lanjutan" by Admin: all fields optional. */
export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class SparepartItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  qty: number;
}

export class RequestSparepartDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SparepartItemDto)
  items: SparepartItemDto[];
}

export class ApproveSparepartDto {
  @IsOptional()
  @IsString()
  approvalNote?: string;
}

export class CompleteWorkOrderDto {
  @IsDateString()
  endDate: string;
}
