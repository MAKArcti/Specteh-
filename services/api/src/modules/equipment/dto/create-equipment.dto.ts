import { EquipmentType } from '@spectech/shared-types';
import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator';

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
}
