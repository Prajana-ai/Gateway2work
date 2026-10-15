import { Controller, Post, Get, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { DischargesService } from './discharges.service';
import { CreateDischargeDto, UpdateDischargeDto } from '@impactforge/shared';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';

@Controller('discharges')
export class DischargesController {
  constructor(private readonly service: DischargesService) {}

  @Post()
  @DataZoneAccess('protected')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateDischargeDto,
  ) {
    return this.service.create(tenantId, user.id, user.roleName, dto);
  }

  @Get('participant/:participantId')
  @DataZoneAccess('protected')
  async findByParticipantId(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.service.findByParticipantId(tenantId, user.id, user.roleName, participantId);
  }

  @Patch(':id')
  @DataZoneAccess('protected')
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDischargeDto,
  ) {
    return this.service.update(tenantId, user.id, user.roleName, id, dto);
  }
}
