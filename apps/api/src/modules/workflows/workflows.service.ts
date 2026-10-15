import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  WorkflowsRepository,
  WorkflowTemplateRecord,
  WorkflowInstanceRecord,
  WorkflowInstanceWithProgress,
  WorkflowStage,
  WorkflowStageCondition,
} from './workflows.repository';

@Injectable()
export class WorkflowsService {
  constructor(private readonly workflowsRepository: WorkflowsRepository) {}

  // ── Template methods ───────────────────────────────────────────────

  async listTemplates(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<WorkflowTemplateRecord[]> {
    return this.workflowsRepository.findAllTemplates(tenantId, userId, role);
  }

  async getTemplateById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<WorkflowTemplateRecord> {
    const template = await this.workflowsRepository.findTemplateById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!template) {
      throw new NotFoundException(`Workflow template with id ${id} not found`);
    }
    return template;
  }

  async createTemplate(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      name: string;
      description?: string;
      stages: WorkflowStage[];
    },
  ): Promise<WorkflowTemplateRecord> {
    return this.workflowsRepository.createTemplate(
      tenantId,
      userId,
      role,
      dto,
    );
  }

  async updateTemplate(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      stages: WorkflowStage[];
      is_active: boolean;
    }>,
  ): Promise<WorkflowTemplateRecord> {
    const updated = await this.workflowsRepository.updateTemplate(
      tenantId,
      userId,
      role,
      id,
      dto,
    );
    if (!updated) {
      throw new NotFoundException(`Workflow template with id ${id} not found`);
    }
    return updated;
  }

  // ── Instance methods ───────────────────────────────────────────────

  async createInstance(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
    templateId?: string,
  ): Promise<WorkflowInstanceWithProgress> {
    // Resolve the template: use provided ID or fall back to default
    let template: WorkflowTemplateRecord | null = null;

    if (templateId) {
      template = await this.workflowsRepository.findTemplateById(
        tenantId,
        userId,
        role,
        templateId,
      );
    }

    if (!template) {
      // Try to find any active template for this tenant
      const templates = await this.workflowsRepository.findAllTemplates(
        tenantId,
        userId,
        role,
      );
      template = templates.length > 0 ? templates[0] : null;
    }

    if (!template) {
      throw new BadRequestException(
        'No workflow template found. Please create a template first.',
      );
    }

    const stages: WorkflowStage[] =
      typeof template.stages === 'string'
        ? JSON.parse(template.stages)
        : template.stages;

    // Sort stages by order and pick the first
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const firstStage = sortedStages[0];

    if (!firstStage) {
      throw new BadRequestException('Template has no stages defined.');
    }

    // Check for existing active workflow for this participant
    const existingInstances =
      await this.workflowsRepository.findInstancesByParticipant(
        tenantId,
        userId,
        role,
        participantId,
      );
    const activeInstance = existingInstances.find(
      (i) => i.status === 'active',
    );
    if (activeInstance) {
      throw new BadRequestException(
        'Participant already has an active workflow. Complete or cancel it before starting a new one.',
      );
    }

    // Create the instance starting at the first stage
    const instance = await this.workflowsRepository.createInstance(
      tenantId,
      userId,
      role,
      {
        template_id: template.id,
        participant_id: participantId,
        current_stage: firstStage.name,
        stage_data: {
          [firstStage.name]: {
            entered_at: new Date().toISOString(),
            auto_tasks_created: firstStage.auto_tasks,
          },
        },
      },
    );

    // Return full progress view
    const progress = await this.workflowsRepository.getInstanceWithProgress(
      tenantId,
      userId,
      role,
      instance.id,
    );

    return progress!;
  }

  async checkAndAdvance(
    tenantId: string,
    userId: string,
    role: string,
    instanceId: string,
  ): Promise<WorkflowInstanceWithProgress> {
    const progress = await this.workflowsRepository.getInstanceWithProgress(
      tenantId,
      userId,
      role,
      instanceId,
    );

    if (!progress) {
      throw new NotFoundException(
        `Workflow instance with id ${instanceId} not found`,
      );
    }

    if (progress.status !== 'active') {
      throw new BadRequestException(
        `Workflow is ${progress.status}, cannot advance.`,
      );
    }

    const stages = [...progress.stages].sort((a, b) => a.order - b.order);
    const currentStageIndex = stages.findIndex(
      (s) => s.name === progress.current_stage,
    );
    const currentStage = stages[currentStageIndex];

    if (!currentStage) {
      throw new BadRequestException('Current stage not found in template.');
    }

    // Check if the current stage uses auto-advance
    if (currentStage.next_stage_trigger !== 'auto') {
      throw new BadRequestException(
        `Stage "${currentStage.name}" requires manual advancement.`,
      );
    }

    // Evaluate conditions against participant data
    const conditionsMet = await this.evaluateConditions(
      tenantId,
      userId,
      role,
      progress.participant_id,
      currentStage.conditions,
    );

    if (!conditionsMet) {
      // Return current progress with no advancement
      return progress;
    }

    // Advance to next stage
    return this.advanceToNextStage(
      tenantId,
      userId,
      role,
      instanceId,
      stages,
      currentStageIndex,
    );
  }

  async manualAdvance(
    tenantId: string,
    userId: string,
    role: string,
    instanceId: string,
  ): Promise<WorkflowInstanceWithProgress> {
    const progress = await this.workflowsRepository.getInstanceWithProgress(
      tenantId,
      userId,
      role,
      instanceId,
    );

    if (!progress) {
      throw new NotFoundException(
        `Workflow instance with id ${instanceId} not found`,
      );
    }

    if (progress.status !== 'active') {
      throw new BadRequestException(
        `Workflow is ${progress.status}, cannot advance.`,
      );
    }

    const stages = [...progress.stages].sort((a, b) => a.order - b.order);
    const currentStageIndex = stages.findIndex(
      (s) => s.name === progress.current_stage,
    );

    return this.advanceToNextStage(
      tenantId,
      userId,
      role,
      instanceId,
      stages,
      currentStageIndex,
    );
  }

  async getParticipantWorkflow(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<WorkflowInstanceWithProgress | null> {
    const instances = await this.workflowsRepository.findInstancesByParticipant(
      tenantId,
      userId,
      role,
      participantId,
    );

    // Return the most recent active workflow, or the most recent overall
    const active = instances.find((i) => i.status === 'active');
    const target = active || instances[0];

    if (!target) return null;

    return this.workflowsRepository.getInstanceWithProgress(
      tenantId,
      userId,
      role,
      target.id,
    );
  }

  async updateInstanceStatus(
    tenantId: string,
    userId: string,
    role: string,
    instanceId: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled',
  ): Promise<WorkflowInstanceRecord> {
    const updated = await this.workflowsRepository.updateStatus(
      tenantId,
      userId,
      role,
      instanceId,
      status,
    );

    if (!updated) {
      throw new NotFoundException(
        `Workflow instance with id ${instanceId} not found`,
      );
    }

    return updated;
  }

  /**
   * Returns the default TSRG workflow stages definition.
   * Can be used to seed a template for a new tenant.
   */
  getDefaultTemplate(): WorkflowStage[] {
    return [
      {
        name: 'Referral & Intake',
        order: 1,
        type: 'referral_intake',
        conditions: [
          { field: 'referral_received', operator: 'eq', value: true },
          { field: 'intake_completed', operator: 'eq', value: true },
        ],
        auto_tasks: [
          { description: 'Review referral', owner_type: 'staff', due_days: 3 },
          {
            description: 'Schedule intake meeting',
            owner_type: 'staff',
            due_days: 5,
          },
          {
            description: 'Verify consent',
            owner_type: 'staff',
            due_days: 5,
          },
        ],
        next_stage_trigger: 'manual',
      },
      {
        name: 'Assessments',
        order: 2,
        type: 'assessment',
        conditions: [
          { field: 'assessments_completed', operator: 'gte', value: 3 },
        ],
        auto_tasks: [
          {
            description: 'Complete skills assessment',
            owner_type: 'staff',
            due_days: 7,
          },
          {
            description: 'Complete interests inventory',
            owner_type: 'staff',
            due_days: 7,
          },
          {
            description: 'Complete barriers assessment',
            owner_type: 'staff',
            due_days: 7,
          },
        ],
        next_stage_trigger: 'auto',
      },
      {
        name: 'Workforce Plan',
        order: 3,
        type: 'workforce_plan',
        conditions: [
          { field: 'workforce_plan_created', operator: 'eq', value: true },
        ],
        auto_tasks: [
          {
            description: 'Create workforce development plan',
            owner_type: 'staff',
            due_days: 10,
          },
          {
            description: 'Review plan with participant',
            owner_type: 'staff',
            due_days: 14,
          },
          {
            description: 'Set short-term goals',
            owner_type: 'staff',
            due_days: 14,
          },
        ],
        next_stage_trigger: 'auto',
      },
      {
        name: 'Employer Matching',
        order: 4,
        type: 'employer_match',
        conditions: [
          { field: 'employer_matches', operator: 'gte', value: 1 },
        ],
        auto_tasks: [
          {
            description: 'Search RFE directory',
            owner_type: 'staff',
            due_days: 7,
          },
          {
            description: 'Submit applications',
            owner_type: 'staff',
            due_days: 14,
          },
          {
            description: 'Schedule interviews',
            owner_type: 'staff',
            due_days: 21,
          },
        ],
        next_stage_trigger: 'auto',
      },
      {
        name: 'Follow-Up',
        order: 5,
        type: 'follow_up',
        conditions: [],
        auto_tasks: [
          {
            description: '30-day check-in',
            owner_type: 'staff',
            due_days: 30,
          },
          {
            description: '90-day check-in',
            owner_type: 'staff',
            due_days: 90,
          },
          {
            description: 'Update employment status',
            owner_type: 'staff',
            due_days: 90,
          },
        ],
        next_stage_trigger: 'manual',
      },
    ];
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async advanceToNextStage(
    tenantId: string,
    userId: string,
    role: string,
    instanceId: string,
    stages: WorkflowStage[],
    currentStageIndex: number,
  ): Promise<WorkflowInstanceWithProgress> {
    const nextStageIndex = currentStageIndex + 1;

    if (nextStageIndex >= stages.length) {
      // No more stages -- mark workflow as completed
      await this.workflowsRepository.updateStatus(
        tenantId,
        userId,
        role,
        instanceId,
        'completed',
      );
      const completed = await this.workflowsRepository.getInstanceWithProgress(
        tenantId,
        userId,
        role,
        instanceId,
      );
      return completed!;
    }

    const nextStage = stages[nextStageIndex];

    // Record stage transition data
    const stageData: Record<string, any> = {
      [stages[currentStageIndex].name]: {
        completed_at: new Date().toISOString(),
      },
      [nextStage.name]: {
        entered_at: new Date().toISOString(),
        auto_tasks_created: nextStage.auto_tasks,
      },
    };

    await this.workflowsRepository.advanceStage(
      tenantId,
      userId,
      role,
      instanceId,
      nextStage.name,
      stageData,
    );

    const updated = await this.workflowsRepository.getInstanceWithProgress(
      tenantId,
      userId,
      role,
      instanceId,
    );
    return updated!;
  }

  private async evaluateConditions(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
    conditions: WorkflowStageCondition[],
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    const actualValues = await Promise.all(
      conditions.map((condition) =>
        this.resolveConditionValue(tenantId, userId, role, participantId, condition.field),
      ),
    );

    return conditions.every((condition, index) =>
      this.compareValues(actualValues[index], condition.operator, condition.value),
    );
  }

  private async resolveConditionValue(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
    field: string,
  ): Promise<any> {
    switch (field) {
      case 'assessments_completed':
        return this.workflowsRepository.countParticipantAssessments(
          tenantId,
          userId,
          role,
          participantId,
        );

      case 'workforce_plan_created':
        return this.workflowsRepository.hasWorkforcePlan(
          tenantId,
          userId,
          role,
          participantId,
        );

      case 'employer_matches':
        return this.workflowsRepository.countEmployerMatches(
          tenantId,
          userId,
          role,
          participantId,
        );

      case 'referral_received':
        return this.workflowsRepository.hasReferral(
          tenantId,
          userId,
          role,
          participantId,
        );

      case 'intake_completed':
        // Intake completion is tracked in stage_data (set manually)
        // Default to false; staff manually advance the referral_intake stage
        return false;

      default:
        return null;
    }
  }

  private compareValues(
    actual: any,
    operator: string,
    expected: any,
  ): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      default:
        return false;
    }
  }
}
