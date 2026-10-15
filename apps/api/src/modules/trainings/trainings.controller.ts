import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto, UpdateTrainingDto, TrainingDto } from '@impactforge/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentTenant,
  CurrentUser,
  DataZoneAccess,
  Roles,
} from '../../common/decorators';

import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('trainings')
@UseGuards(JwtAuthGuard)
@DataZoneAccess('protected')
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Post()
  @Roles('org_admin', 'workforce_specialist')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() data: CreateTrainingDto,
  ): Promise<TrainingDto> {
    return this.trainingsService.create(tenantId, user.id, user.roleName, data);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('participantId') participantId?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.trainingsService.findAll(tenantId, user.id, user.roleName, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      participantId,
      sortBy,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<TrainingDto> {
    return this.trainingsService.findById(tenantId, user.id, user.roleName, id);
  }

  @Patch(':id')
  @Roles('org_admin', 'workforce_specialist')
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() data: UpdateTrainingDto,
  ): Promise<TrainingDto> {
    return this.trainingsService.update(
      tenantId,
      user.id,
      user.roleName,
      id,
      data,
    );
  }

  @Delete(':id')
  @Roles('org_admin')
  async remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.trainingsService.delete(tenantId, user.id, user.roleName, id);
  }

  @Get('participant/:participantId')
  async findByParticipant(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('participantId') participantId: string,
  ): Promise<TrainingDto[]> {
    return this.trainingsService.findByParticipantId(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }
}
