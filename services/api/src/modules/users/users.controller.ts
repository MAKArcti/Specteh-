import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublicUserDto } from './dto/public-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Operator roster for the owner's add-equipment/assign pickers. */
  @Get('operators')
  @Roles(UserRole.EQUIPMENT_OWNER)
  async findOperators(): Promise<PublicUserDto[]> {
    const operators = await this.usersService.findOperators();
    return operators.map((u) => ({ id: u.id, fullName: u.fullName, phone: u.phone, roles: u.roles }));
  }
}
