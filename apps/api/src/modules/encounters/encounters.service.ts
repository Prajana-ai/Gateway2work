import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EncountersRepository, EncounterRow } from './encounters.repository';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class EncountersService {
  constructor(
    private readonly encountersRepository: EncountersRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async list(
    tenantId: string,
    userId: string,
    role: string,
    filters: {
      participantId?: string;
      staffId?: string;
      startDate?: string;
      endDate?: string;
      billable?: boolean;
      page: number;
      limit: number;
    },
  ): Promise<{ items: EncounterRow[]; total: number }> {
    return this.encountersRepository.findAll(tenantId, userId, role, filters);
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<EncounterRow> {
    const encounter = await this.encountersRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );

    if (!encounter) {
      throw new NotFoundException(`Encounter with id ${id} not found`);
    }

    return encounter;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      participantId: string;
      encounterDate: string;
      durationMinutes: number;
      notes?: string;
      billable: boolean;
      serviceType?: string;
      serviceSubcategory?: string;
      partnerOrganizationName?: string;
      location?: string;
      deliveryMode?: string;
      format?: string;
      isCompleted?: boolean;
      recoveryStatus?: string;
      recoveryStage?: string;
      substanceUseTreatment?: string;
      behavioralHealthTreatment?: string;
      peerSupportParticipation?: string;
      housingInstability?: string;
      foodInsecurity?: string;
      childcareNeed?: string;
      transportationNeed?: string;
      legalSupportNeed?: string;
      physicalHealthNeed?: string;
      mentalHealthNeed?: string;
      traumaInformedSupport?: string;
    },
  ): Promise<EncounterRow> {
    // Validate participant exists within the tenant context
    const participantExists = await this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (client) => {
        const result = await client.query(
          'SELECT id FROM protected.participants WHERE id = $1',
          [dto.participantId],
        );
        return result.rows.length > 0;
      },
    );

    if (!participantExists) {
      throw new BadRequestException(
        `Participant with id ${dto.participantId} not found`,
      );
    }

    if (dto.durationMinutes <= 0) {
      throw new BadRequestException('Duration must be a positive number');
    }

    return this.encountersRepository.create(tenantId, userId, role, {
      participant_id: dto.participantId,
      encounter_date: dto.encounterDate,
      duration_minutes: dto.durationMinutes,
      notes: dto.notes,
      billable: dto.billable,
      service_type: dto.serviceType,
      service_subcategory: dto.serviceSubcategory,
      partner_organization_name: dto.partnerOrganizationName,
      location: dto.location,
      delivery_mode: dto.deliveryMode,
      format: dto.format,
      is_completed: dto.isCompleted,
      recovery_status: dto.recoveryStatus,
      recovery_stage: dto.recoveryStage,
      substance_use_treatment: dto.substanceUseTreatment,
      behavioral_health_treatment: dto.behavioralHealthTreatment,
      peer_support_participation: dto.peerSupportParticipation,
      housing_instability: dto.housingInstability,
      food_insecurity: dto.foodInsecurity,
      childcare_need: dto.childcareNeed,
      transportation_need: dto.transportationNeed,
      legal_support_need: dto.legalSupportNeed,
      physical_health_need: dto.physicalHealthNeed,
      mental_health_need: dto.mentalHealthNeed,
      trauma_informed_support: dto.traumaInformedSupport,
    });
  }

  async getByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<EncounterRow[]> {
    return this.encountersRepository.getByParticipant(
      tenantId,
      userId,
      role,
      participantId,
    );
  }
}
