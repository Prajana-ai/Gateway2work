import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkforcePlansService } from './workforce-plans.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';

@Controller()
export class WorkforcePlansController {
  constructor(
    private readonly workforcePlansService: WorkforcePlansService,
  ) {}
@Post('workforce-plans')
@DataZoneAccess('application')
async createPlan(
  @CurrentUser() user: RequestUser,
  @CurrentTenant() tenantId: string,
  @Body()
  body: {
    participantId: string;
    longTermGoal: string;
    shortTermGoals: Record<string, any>;
  },
) {
  return this.workforcePlansService.create(
    tenantId,
    user.id,
    user.roleName,
    body,
  );
}

@Get('workforce-plans/participant/:participantId')
@DataZoneAccess('application')
async listByParticipant(
  @CurrentUser() user: RequestUser,
  @CurrentTenant() tenantId: string,
  @Param('participantId', ParseUUIDPipe) participantId: string,
) {
  return this.workforcePlansService.listByParticipant(
    tenantId,
    user.id,
    user.roleName,
    participantId,
  );
}

// ... (skip getById and updatePlan)

@Get('participant-tasks/:participantId')
@DataZoneAccess('application')
async getParticipantTasks(
  @CurrentUser() user: RequestUser,
  @CurrentTenant() tenantId: string,
  @Param('participantId', ParseUUIDPipe) participantId: string,
) {
  return this.workforcePlansService.getParticipantTasks(
    tenantId,
    user.id,
    user.roleName,
    participantId,
  );
}
  @Patch('workforce-plans/:id')
  @DataZoneAccess('application')
  async updatePlan(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      longTermGoal?: string;
      shortTermGoals?: Record<string, any>;
      status?: string;
    },
  ) {
    return this.workforcePlansService.update(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }

  @Post('workforce-plans/:id/tasks')
  @DataZoneAccess('application')
  async addTask(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      description: string;
      ownerType: string;
      assignedTo: string;
      dueDate?: string;
    },
  ) {
    return this.workforcePlansService.addTask(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }

  @Patch('plan-tasks/:id')
  @DataZoneAccess('application')
  async updateTask(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      description?: string;
      ownerType?: string;
      assignedTo?: string;
      dueDate?: string;
      status?: string;
    },
  ) {
    return this.workforcePlansService.updateTask(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }

  @Patch('plan-tasks/:id/complete')
  @DataZoneAccess('application')
  async completeTask(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
  }
}
