import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfirmDealDto } from './dto/confirm-deal.dto';
import { DealsService } from './deals.service';

@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConfirmDealDto) {
    return this.dealsService.confirmFromOffer(user.id, dto.matchOfferId);
  }

  @Get('mine')
  @Roles(UserRole.OPERATOR, UserRole.EQUIPMENT_OWNER)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.dealsService.findForOperator(user.id);
  }
}
