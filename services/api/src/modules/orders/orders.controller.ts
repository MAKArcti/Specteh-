import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @Get('mine')
  @Roles(UserRole.CUSTOMER)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForRenter(user.id);
  }

  @Get('for-operator')
  @Roles(UserRole.OPERATOR)
  findForOperator(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForOperator(user.id);
  }

  @Get('actionable')
  @Roles(UserRole.EQUIPMENT_OWNER)
  findActionable(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findActionableForOwner(user.id);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const order = await this.ordersService.findByIdOrThrow(id);
    if (!this.ordersService.canView(order, user.id)) {
      throw new ForbiddenException('Not your order');
    }
    return order;
  }

  @Post(':id/assign')
  @Roles(UserRole.EQUIPMENT_OWNER)
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignOrderDto,
  ) {
    return this.ordersService.assign(id, user.id, dto);
  }

  @Post(':id/start-contract')
  @Roles(UserRole.EQUIPMENT_OWNER)
  startContract(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.startContract(id, user.id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.cancel(id, user.id);
  }
}
