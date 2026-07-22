import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EquipmentType, UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignOperatorDto } from './dto/assign-operator.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { EquipmentEntity } from './equipment.entity';
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

  /** Renter-facing "Маркет" browse (SoW 2.1 "Переглядає доступну техніку"). */
  @Get()
  async findBrowsable(@Query('type') type?: EquipmentType) {
    const list = await this.equipmentService.findBrowsable(type);
    return Promise.all(list.map((e) => this.toDto(e)));
  }

  @Get('mine')
  @Roles(UserRole.EQUIPMENT_OWNER)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    const list = await this.equipmentService.findOwnedBy(user.id);
    return Promise.all(list.map((e) => this.toDto(e)));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const equipment = await this.equipmentService.findById(id);
    if (!equipment) throw new NotFoundException('Equipment not found');
    return this.toDto(equipment);
  }

  @Get(':id/journal')
  findJournal(@Param('id') id: string) {
    return this.equipmentService.findJournal(id);
  }

  @Post(':id/journal')
  @Roles(UserRole.EQUIPMENT_OWNER, UserRole.OPERATOR)
  addJournalEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const authorLabel = user.roles.includes(UserRole.EQUIPMENT_OWNER) ? 'Власник' : 'Оператор';
    return this.equipmentService.addJournalEntry(id, user.id, authorLabel, dto.kind, dto.text);
  }

  @Post(':id/operators')
  @Roles(UserRole.EQUIPMENT_OWNER)
  assignOperator(@Param('id') id: string, @Body() dto: AssignOperatorDto) {
    return this.equipmentService.assignOperator(id, dto.operatorId);
  }

  @Delete(':id/operators/:operatorId')
  @Roles(UserRole.EQUIPMENT_OWNER)
  removeOperator(@Param('id') id: string, @Param('operatorId') operatorId: string) {
    return this.equipmentService.removeOperator(id, operatorId);
  }

  private async toDto(equipment: EquipmentEntity) {
    const assignedOperatorIds = await this.equipmentService.assignedOperatorIds(equipment.id);
    return { ...equipment, assignedOperatorIds };
  }
}
