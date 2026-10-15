import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';
import { RequiresConsent } from '../../common/decorators/requires-consent.decorator';

@Controller('participants/:participantId')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('assessments')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async listAssessments(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.assessmentsService.listByParticipant(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }

  @Get('assessments/:id')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async getAssessment(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assessmentsService.getById(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post('assessments')
  @DataZoneAccess('protected')
  @RequiresConsent()
  async submitAssessment(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @Body() body: { type: string; responses: Record<string, any> },
  ) {
    return this.assessmentsService.submit(
      tenantId,
      user.id,
      user.roleName,
      participantId,
      body.type,
      body.responses,
    );
  }

  @Get('assessment-summaries')
  @DataZoneAccess('application')
  async getAssessmentSummaries(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.assessmentsService.getSummaries(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }
}
