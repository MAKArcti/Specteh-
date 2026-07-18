import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentService } from './equipment.service';

@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.EQUIPMENT_OWNER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(user.id, dto);
  }
}
