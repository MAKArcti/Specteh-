import { EquipmentType } from '@spectech/shared-types';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsEnum(EquipmentType)
  type: EquipmentType;

  @IsString()
  label: string;

  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  mass?: string;

  @IsOptional()
  @IsString()
  capacity?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;
}
