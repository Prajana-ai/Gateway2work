import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EncountersService } from './encounters.service';
import {
  DataZoneAccess,
  RequiresConsent,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Get()
  @DataZoneAccess('protected')
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('participant_id') participantId?: string,
    @Query('staff_id') staffId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('billable') billable?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));

    return this.encountersService.list(tenantId, user.id, user.roleName, {
      participantId: participantId,
      staffId,
      startDate,
      endDate,
      billable: billable !== undefined ? billable === 'true' : undefined,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('participant/:participantId')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async getByParticipant(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.encountersService.getByParticipant(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }

  @Get(':id')
  @DataZoneAccess('protected')
  async getById(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.encountersService.getById(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post()
  @DataZoneAccess('protected')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      participantId: string;
      encounterDate: string;
      durationMinutes: number;
      notes?: string;
      billable: boolean;
      serviceType?: string;
      serviceSubcategory?: string;
      partnerOrganizationName?: string;
      location?: string;
      deliveryMode?: string;
      format?: string;
      isCompleted?: boolean;
      recoveryStatus?: string;
      recoveryStage?: string;
      substanceUseTreatment?: string;
      behavioralHealthTreatment?: string;
      peerSupportParticipation?: string;
      housingInstability?: string;
      foodInsecurity?: string;
      childcareNeed?: string;
      transportationNeed?: string;
      legalSupportNeed?: string;
      physicalHealthNeed?: string;
      mentalHealthNeed?: string;
      traumaInformedSupport?: string;
    },
  ) {
    return this.encountersService.create(
      tenantId,
      user.id,
      user.roleName,
      {
        ...body,
        participantId: body.participantId,
      } as any,
    );
  }
}
