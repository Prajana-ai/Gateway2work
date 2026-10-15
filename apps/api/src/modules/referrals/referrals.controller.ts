import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import {
  DataZoneAccess,
  RequiresConsent,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @DataZoneAccess('protected')
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));

    return this.referralsService.list(tenantId, user.id, user.roleName, {
      status,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get(':id')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async getById(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.referralsService.getById(tenantId, user.id, user.roleName, id);
  }

  @Post()
  @DataZoneAccess('protected')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      participant_id?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      externalEhrId?: string;
      email?: string;
      phone?: string;
      provider_agency_id?: string;
      provider_agency_name?: string;
      referral_status?: string;
      referralDate?: string;
      referralType?: string;
      notes?: string;
    },
  ) {
    return this.referralsService.create(
      tenantId,
      user.id,
      user.roleName,
      body,
    );
  }

  @Patch(':id/status')
  @DataZoneAccess('protected')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.referralsService.updateStatus(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.status,
    );
  }
}
