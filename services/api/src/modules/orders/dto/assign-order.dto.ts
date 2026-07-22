import { IsUUID } from 'class-validator';

export class AssignOrderDto {
  @IsUUID()
  equipmentId: string;

  @IsUUID()
  operatorId: string;
}
