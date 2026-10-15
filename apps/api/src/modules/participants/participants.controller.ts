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
import { ParticipantsService } from './participants.service';
import { EnrollmentService } from '../enrollments/enrollment.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';
import { RequiresConsent } from '../../common/decorators/requires-consent.decorator';

@Controller('participants')
export class ParticipantsController {
  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  @Get()
  @DataZoneAccess('protected')
  async list(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.participantsService.list(tenantId, user.id, user.roleName, {
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    });
  }

  @Get(':id')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async getById(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.participantsService.getById(tenantId, user.id, user.roleName, id);
  }

  @Get(':id/360')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async get360View(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.participantsService.get360View(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post()
  @DataZoneAccess('protected')
  async create(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      participant_id?: string;
      external_ehr_id?: string;
      demographics: Record<string, any>;
      legal_info?: Record<string, any>;
      socioeconomic?: Record<string, any>;
      consent_42cfr?: boolean;
      consent_expires_at?: string;
      status?: string;
    },
  ) {
    return this.participantsService.create(
      tenantId,
      user.id,
      user.roleName,
      body,
    );
  }

  @Patch(':id')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async update(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: Partial<{
      participant_id: string;
      external_ehr_id: string;
      demographics: Record<string, any>;
      legal_info: Record<string, any>;
      socioeconomic: Record<string, any>;
      consent_42cfr: boolean;
      consent_expires_at: string;
      status: string;
    }>,
  ) {
    return this.participantsService.update(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }

  @Patch(':id/consent')
  @DataZoneAccess('protected')
  async updateConsent(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { consent_42cfr: boolean; consent_expires_at?: string },
  ) {
    return this.participantsService.updateConsent(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.consent_42cfr,
      body.consent_expires_at,
    );
  }

  @Get(':id/enrollments')
  @DataZoneAccess('protected')
  async getEnrollments(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentService.findByParticipantId(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post(':id/provision-login')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async provisionLogin(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { password?: string },
  ) {
    return this.participantsService.provisionLogin(
      tenantId,
      user.id,
      user.roleName,
      id,
      body?.password,
    );
  }
}
