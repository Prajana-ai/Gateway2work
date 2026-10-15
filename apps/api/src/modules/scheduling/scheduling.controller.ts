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
import { SchedulingService } from './scheduling.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';

@Controller('events')
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get()
  @DataZoneAccess('application')
  async list(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Query('participantId') participantId?: string,
    @Query('staffId') staffId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('eventType') eventType?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.schedulingService.findAll(tenantId, user.id, user.roleName, {
      participantId,
      staffId,
      startDate,
      endDate,
      eventType,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    });
  }

  @Get('upcoming')
  @DataZoneAccess('application')
  async upcoming(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.schedulingService.getUpcoming(
      tenantId,
      user.id,
      user.roleName,
      user.id, // Assuming upcoming is for current staff
      days ? parseInt(days, 10) : 7,
    );
  }

  @Get('participant/:participantId')
  @DataZoneAccess('application')
  async participantSchedule(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.schedulingService.getParticipantEvents(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }

  @Get(':id')
  @DataZoneAccess('application')
  async getById(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.schedulingService.findById(tenantId, user.id, user.roleName, id);
  }

  @Post()
  @DataZoneAccess('application')
  async create(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      title: string;
      event_type: string;
      participantId?: string;
      staffId?: string;
      startTime: string;
      endTime: string;
      location?: string;
      isVirtual?: boolean;
      meetingUrl?: string;
      notes?: string;
    },
  ) {
    return this.schedulingService.create(
      tenantId,
      user.id,
      user.roleName,
      {
        ...body,
        participantId: body.participantId,
      },
    );
  }

  @Patch(':id')
  @DataZoneAccess('application')
  async update(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: Partial<{
      title: string;
      description: string;
      event_type: string;
      participantId: string;
      staffId: string;
      rfeId: string;
      startTime: string;
      endTime: string;
      location: string;
      isVirtual: boolean;
      meetingUrl: string;
      notes: string;
    }>,
  ) {
    return this.schedulingService.update(
      tenantId,
      user.id,
      user.roleName,
      id,
      {
        ...body,
        participantId: body.participantId,
      },
    );
  }

  @Patch(':id/status')
  @DataZoneAccess('application')
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.schedulingService.updateStatus(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.status,
    );
  }
}
