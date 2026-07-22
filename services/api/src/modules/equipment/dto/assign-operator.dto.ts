import { IsUUID } from 'class-validator';

export class AssignOperatorDto {
  @IsUUID()
  operatorId: string;
}
