import { IsUUID } from 'class-validator';

export class ConfirmDealDto {
  @IsUUID()
  matchOfferId: string;
}
