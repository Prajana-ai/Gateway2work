import { Controller, Post, Get, Body } from '@nestjs/common';
import { AiReportsService } from './ai-reports.service';
import { IpsMetricsService } from './ips-metrics.service';
import {
  CurrentUser,
  CurrentTenant,
  DataZoneAccess,
  Roles,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class AiReportsController {
  constructor(
    private readonly aiReportsService: AiReportsService,
    private readonly ipsMetricsService: IpsMetricsService,
  ) {}

  @Post('conversational')
  @DataZoneAccess('application')
  @Roles('org_admin', 'workforce_specialist')
  async conversationalQuery(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { q: string },
  ) {
    return this.aiReportsService.query(
      tenantId,
      user.id,
      user.roleName,
      body.q,
    );
  }

  @Get('ips-metrics')
  @DataZoneAccess('application')
  @Roles('org_admin', 'workforce_specialist')
  async getIpsMetrics(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ipsMetricsService.getIpsMetrics(
      tenantId,
      user.id,
      user.roleName,
    );
  }

  @Get('work-requirement')
  @DataZoneAccess('application')
  @Roles('org_admin', 'workforce_specialist')
  async getWorkRequirement(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ipsMetricsService.getWorkRequirementReadiness(
      tenantId,
      user.id,
      user.roleName,
    );
  }
}
