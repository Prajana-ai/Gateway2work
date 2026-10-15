import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EmploymentOutcomesService } from './employment-outcomes.service';
import {
  DataZoneAccess,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateEmploymentOutcomeDto } from '@impactforge/shared';

@Controller('participants/:participantId/employment-outcomes')
@DataZoneAccess('application')
export class EmploymentOutcomesController {
  constructor(private readonly service: EmploymentOutcomesService) {}

  @Get()
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.service.listByParticipant(
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
    @Body() dto: Omit<CreateEmploymentOutcomeDto, 'participant_id'>,
  ) {
    return this.service.create(tenantId, user.id, user.roleName, {
      ...dto,
      participant_id: participantId,
    } as any);
  }
}
