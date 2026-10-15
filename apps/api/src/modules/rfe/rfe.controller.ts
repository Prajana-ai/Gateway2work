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
import { RfeService } from './rfe.service';
import {
  DataZoneAccess,
  Roles,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class RfeController {
  constructor(private readonly rfeService: RfeService) {}

  @Get('rfes')
  @DataZoneAccess('application')
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('sector') sector?: string,
    @Query('location') location?: string,
    @Query('trainee_readiness') traineeReadiness?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );

    return this.rfeService.list(tenantId, user.id, user.roleName, {
      sector,
      location,
      traineeReadiness,
      search,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('rfes/:id')
  @DataZoneAccess('application')
  async getById(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.rfeService.getById(tenantId, user.id, user.roleName, id);
  }

  @Post('rfes')
  @DataZoneAccess('application')
  @Roles('org_admin', 'workforce_specialist')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      name: string;
      sector: string;
      locations: any;
      is_rfe_certified: boolean;
      trainee_readiness: string;
      contact_info: any;
      notes?: string;
    },
  ) {
    return this.rfeService.create(tenantId, user.id, user.roleName, body);
  }

  @Post('rfes/import')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async bulkImport(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { csv: string },
  ) {
    return this.rfeService.bulkImport(
      tenantId,
      user.id,
      user.roleName,
      body.csv,
    );
  }

  @Post('participants/:participantId/matches')
  @DataZoneAccess('application')
  async createMatch(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() body: { rfeId: string; applicationStatus?: string },
  ) {
    return this.rfeService.createMatch(
      tenantId,
      user.id,
      user.roleName,
      participantId,
      body.rfeId,
      body.applicationStatus,
    );
  }

  @Patch('matches/:id')
  @DataZoneAccess('application')
  async updateMatch(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      application_status?: string;
      outcome?: string;
      outcome_date?: string;
      notes?: string;
    },
  ) {
    return this.rfeService.updateMatch(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }

  @Get('participants/:participantId/matches')
  @DataZoneAccess('application')
  async getParticipantMatches(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.rfeService.getParticipantMatches(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }
}
