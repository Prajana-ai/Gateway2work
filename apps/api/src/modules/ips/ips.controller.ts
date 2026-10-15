import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { IpsService } from './ips.service';
import { DataZoneAccess, CurrentUser, CurrentTenant } from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('ips')
export class IpsController {
  constructor(private readonly ipsService: IpsService) {}

  @Get('reviews')
  @DataZoneAccess('application')
  async listReviews(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ipsService.listReviews(tenantId, user.id, user.roleName);
  }

  @Get('reviews/:id')
  @DataZoneAccess('application')
  async getReview(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.ipsService.getReview(tenantId, user.id, user.roleName, id);
  }

  @Post('reviews')
  @DataZoneAccess('application')
  async createReview(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() data: any,
  ) {
    return this.ipsService.createReview(tenantId, user.id, user.roleName, data);
  }

  @Patch('reviews/:id')
  @DataZoneAccess('application')
  async updateReview(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.ipsService.updateReview(tenantId, user.id, user.roleName, id, data);
  }

  @Get('automated-stats')
  @DataZoneAccess('application')
  async getAutomatedStats(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ipsService.getAutomatedFidelityStats(tenantId, user.id, user.roleName);
  }
}
