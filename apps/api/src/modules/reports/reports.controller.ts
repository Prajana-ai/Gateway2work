import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  DataZoneAccess,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('encounters')
  @DataZoneAccess('protected')
  async getEncounterExport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.reportsService.getEncounterExport(
      tenantId,
      user.id,
      user.roleName,
      startDate,
      endDate,
    );
  }

  @Get('placement')
  @DataZoneAccess('application')
  async getPlacementMetrics(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('group_by') groupBy?: string,
  ) {
    return this.reportsService.getPlacementMetrics(
      tenantId,
      user.id,
      user.roleName,
      groupBy,
    );
  }

  @Get('dashboard')
  @DataZoneAccess('application')
  async getDashboardStats(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getDashboardStats(
      tenantId,
      user.id,
      user.roleName,
    );
  }

  @Get('recommended-variables')
  @DataZoneAccess('application')
  async getRecommendedVariables(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getRecommendedVariables(
      tenantId,
      user.id,
      user.roleName,
    );
  }

  @Get('employability')
  @DataZoneAccess('application')
  async getEmployabilityMetrics(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reportsService.getEmployabilityMetrics(
      tenantId,
      user.id,
      user.roleName,
    );
  }
}
