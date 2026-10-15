import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import {
  DataZoneAccess,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateFollowUpDto } from '@impactforge/shared';

@Controller('participants/:participantId/follow-ups')
@DataZoneAccess('protected')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.followUpsService.listByParticipant(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() dto: Omit<CreateFollowUpDto, 'participant_id'>,
  ) {
    return this.followUpsService.create(tenantId, user.id, user.roleName, {
      ...dto,
      participant_id: participantId,
    });
  }
}
