import { EquipmentType } from '@spectech/shared-types';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsEnum(EquipmentType)
  equipmentType: EquipmentType;

  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsString()
  location: string;

  @IsString()
  dateFrom: string;

  @IsString()
  dateTo: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
