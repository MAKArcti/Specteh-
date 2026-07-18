import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { WorkVolumeUnit } from '@spectech/shared-types';

export class WorkVolumeDto {
  @IsNumber()
  @Min(0)
  value: number;

  @IsString()
  unit: WorkVolumeUnit;
}

export class ReportDraftDto {
  @IsUUID()
  clientReportId: string;

  @IsUUID()
  dealId: string;

  @IsDateString()
  capturedAt: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsArray()
  @IsString({ each: true })
  photoUrls: string[];

  @ValidateNested()
  @Type(() => WorkVolumeDto)
  workVolume: WorkVolumeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engineHours?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReportSyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDraftDto)
  reports: ReportDraftDto[];
}
