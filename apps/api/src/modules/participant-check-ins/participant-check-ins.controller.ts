import { Controller, Get, Post, Body } from '@nestjs/common';
import { ParticipantCheckInsService } from './participant-check-ins.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';

@Controller('participant-check-ins')
export class ParticipantCheckInsController {
  constructor(private readonly service: ParticipantCheckInsService) {}

  @Post()
  @DataZoneAccess('application')
  async create(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      feeling: number;
      employmentStatus: string;
      hoursWorked: number;
      hoursSearching: number;
      hoursPrepping: number;
      challenges: string;
      needsHelp: string[];
    },
  ) {
    return this.service.create(tenantId, user.id, user.roleName, {
      participantId: user.id, // participant's user.id == their participant record id
      ...body,
    });
  }

  @Get()
  @DataZoneAccess('application')
  async findMyCheckIns(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
  ) {
    return this.service.findByParticipant(
      tenantId,
      user.id,
      user.roleName,
      user.id,
    );
  }
}
