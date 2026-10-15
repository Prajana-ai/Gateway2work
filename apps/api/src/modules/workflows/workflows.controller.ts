import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import {
  CurrentUser,
  CurrentTenant,
  DataZoneAccess,
  Roles,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // ── Workflow instance endpoints ────────────────────────────────────

  @Get()
  @DataZoneAccess('application')
  async listWorkflows(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
  ) {
    // Note: If a global list is needed, we could add a listInstances to service.
    // For now, return empty or a basic list if the frontend expects it.
    return { data: [], total: 0 };
  }

  @Post()
  @DataZoneAccess('application')
  async startWorkflow(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body() body: { participantId: string; templateId?: string },
  ) {
    return this.workflowsService.createInstance(
      tenantId,
      user.id,
      user.roleName,
      body.participantId,
      body.templateId,
    );
  }

  @Get('participant/:participantId')
  @DataZoneAccess('application')
  async getParticipantWorkflow(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.workflowsService.getParticipantWorkflow(
      tenantId,
      user.id,
      user.roleName,
      participantId,
    );
  }

  @Post(':id/advance')
  @DataZoneAccess('application')
  async checkAndAdvance(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.checkAndAdvance(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post(':id/manual-advance')
  @DataZoneAccess('application')
  @Roles('org_admin', 'workforce_specialist')
  async manualAdvance(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workflowsService.manualAdvance(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Patch(':id/status')
  @DataZoneAccess('application')
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: 'active' | 'paused' | 'completed' | 'cancelled' },
  ) {
    return this.workflowsService.updateInstanceStatus(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.status,
    );
  }

  // ── Template endpoints ─────────────────────────────────────────────

  @Get('templates')
  @DataZoneAccess('application')
  async listTemplates(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
  ) {
    return this.workflowsService.listTemplates(
      tenantId,
      user.id,
      user.roleName,
    );
  }

  @Post('templates')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async createTemplate(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      stages: any[];
    },
  ) {
    return this.workflowsService.createTemplate(
      tenantId,
      user.id,
      user.roleName,
      body,
    );
  }
}
