import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';
import { ReportSyncBatchDto } from './dto/report-draft.dto';
import { ReportsService } from './reports.service';
import { ReportsSyncService } from './reports-sync.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsSyncService: ReportsSyncService,
    private readonly reportsService: ReportsService,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Batch sync endpoint the mobile app drains its offline queue into once
   * connectivity returns. Safe to retry: see ReportsSyncService idempotency.
   */
  @Post('reports/sync')
  @Roles(UserRole.OPERATOR, UserRole.EQUIPMENT_OWNER)
  async sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportSyncBatchDto) {
    const results = await this.reportsSyncService.syncBatch(user.id, dto.reports);
    return { results };
  }

  @Get('orders/:orderId/reports')
  async findByOrder(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    const order = await this.ordersService.findByIdOrThrow(orderId);
    if (!this.ordersService.canView(order, user.id)) {
      throw new ForbiddenException('Not your order');
    }
    return this.reportsService.findByOrder(orderId);
  }

  @Post('reports/:id/confirm')
  @Roles(UserRole.EQUIPMENT_OWNER)
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reportsService.confirm(id, user.id);
  }
}
