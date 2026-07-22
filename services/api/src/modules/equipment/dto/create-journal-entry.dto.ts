import { JournalEntryKind } from '@spectech/shared-types';
import { IsEnum, IsString } from 'class-validator';

export class CreateJournalEntryDto {
  @IsEnum(JournalEntryKind)
  kind: JournalEntryKind;

  @IsString()
  text: string;
}
