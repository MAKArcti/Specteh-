import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportSyncBatchDto } from './dto/report-draft.dto';
import { ReportsSyncService } from './reports-sync.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsSyncService: ReportsSyncService) {}

  /**
   * Batch sync endpoint the mobile app drains its offline queue into once
   * connectivity returns. Safe to retry: see ReportsSyncService idempotency.
   */
  @Post('sync')
  @Roles(UserRole.OPERATOR, UserRole.EQUIPMENT_OWNER)
  async sync(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportSyncBatchDto) {
    const results = await this.reportsSyncService.syncBatch(user.id, dto.reports);
    return { results };
  }
}
