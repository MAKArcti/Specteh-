import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReportPhotosDto {
  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @IsString()
  during?: string;

  @IsOptional()
  @IsString()
  after?: string;
}

export class ReportDraftDto {
  @IsUUID()
  clientReportId: string;

  @IsUUID()
  orderId: string;

  @IsDateString()
  capturedAt: string;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMin?: number;

  @IsString()
  text: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ValidateNested()
  @Type(() => ReportPhotosDto)
  photos: ReportPhotosDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engineHours?: number;

  @IsOptional()
  @IsString()
  fuelConsumption?: string;

  @IsBoolean()
  problem: boolean;

  @IsBoolean()
  needsService: boolean;
}

export class ReportSyncBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportDraftDto)
  reports: ReportDraftDto[];
}
