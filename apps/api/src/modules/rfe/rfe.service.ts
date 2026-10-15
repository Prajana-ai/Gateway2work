import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RfeRepository, RfeRow, MatchWithEmployer, ParticipantEmployerMatchRow } from './rfe.repository';
import { DatabaseService } from '../../database/database.service';
import { parseCsv } from '../../common/utils/csv-parser';

const VALID_APPLICATION_STATUSES = [
  'interested',
  'applied',
  'interviewing',
  'offered',
];

const VALID_OUTCOMES = ['hired', 'not_hired', 'in_training', 'withdrawn'];

const VALID_TRAINEE_READINESS = ['yes', 'limited', 'no'];

@Injectable()
export class RfeService {
  constructor(
    private readonly rfeRepository: RfeRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async list(
    tenantId: string,
    userId: string,
    role: string,
    filters: {
      sector?: string;
      industry?: string;
      location?: string;
      traineeReadiness?: string;
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ items: RfeRow[]; total: number }> {
    return this.rfeRepository.findAll(tenantId, userId, role, filters);
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<RfeRow> {
    const employer = await this.rfeRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );

    if (!employer) {
      throw new NotFoundException(`Recovery-friendly employer with id ${id} not found`);
    }

    return employer;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: Partial<RfeRow>,
  ): Promise<RfeRow> {
    if (dto.trainee_readiness && !VALID_TRAINEE_READINESS.includes(dto.trainee_readiness)) {
      throw new BadRequestException(
        `Invalid trainee_readiness: ${dto.trainee_readiness}. Must be one of: ${VALID_TRAINEE_READINESS.join(', ')}`,
      );
    }

    return this.rfeRepository.create(tenantId, userId, role, dto);
  }

  async bulkImport(
    tenantId: string,
    userId: string,
    role: string,
    csvContent: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const rows = parseCsv<Record<string, any>>(csvContent, {
      transformHeader: (header: string) => header.trim().toLowerCase(),
    });

    const employers: Array<Partial<RfeRow>> = [];
    const errorGroups: Record<string, number[]> = {};
    const addError = (rowNum: number, message: string) => {
      if (!errorGroups[message]) {
        errorGroups[message] = [];
      }
      errorGroups[message].push(rowNum);
    };

    const HEADER_ALIASES: Record<string, string[]> = {
      name: ['name', 'employer', 'company', 'organization name', 'organization'],
      industry: ['industry', 'sector', 'category', 'business type'],
      contact_person: ['contact person', 'contact', 'person'],
      contact_email: ['email', 'contact email', 'email address'],
      contact_phone: ['phone', 'contact number', 'telephone', 'phone number'],
      employer_address: ['address', 'employer address', 'location'],
      service_provider_id: ['service provider id', 'provider id'],
      service_provider_name: ['service provider name', 'provider name'],
      partnership_start_date: ['partnership start date', 'start date'],
      is_rfe_certified: ['is_rfe_certified', 'certified', 'rfe certified', 'rfe_certified', 'is rfe'],
      is_fair_chance: ['is_fair_chance', 'fair chance', 'fair_chance'],
    };

    const getFieldValue = (row: any, field: string) => {
      const aliases = HEADER_ALIASES[field] || [field];
      for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== null) {
          return row[alias];
        }
      }
      return undefined;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNum = i + 2; // 1-indexed + header row

      const name = getFieldValue(row, 'name');
      const industry = getFieldValue(row, 'industry');
      
      if (!name || !String(name).trim()) {
        addError(rowNum, "missing required field 'name'");
        continue;
      }

      const emp: Partial<RfeRow> = {
        name: String(name).trim(),
        industry: industry ? String(industry).trim() : 'Other',
        contact_person: getFieldValue(row, 'contact_person'),
        contact_email: getFieldValue(row, 'contact_email'),
        contact_phone: getFieldValue(row, 'contact_phone'),
        employer_address: getFieldValue(row, 'employer_address'),
        service_provider_id: getFieldValue(row, 'service_provider_id'),
        service_provider_name: getFieldValue(row, 'service_provider_name'),
        partnership_start_date: getFieldValue(row, 'partnership_start_date'),
        is_rfe_certified: String(getFieldValue(row, 'is_rfe_certified') || '').toLowerCase() === 'true',
        is_fair_chance: String(getFieldValue(row, 'is_fair_chance') || '').toLowerCase() === 'true',
        hiring_sectors: getFieldValue(row, 'hiring_sectors'),
        entry_level_openings: getFieldValue(row, 'entry_level_openings'),
        salary_range: getFieldValue(row, 'salary_range'),
        benefits_offered: getFieldValue(row, 'benefits_offered'),
        notes: getFieldValue(row, 'notes'),
      };

      employers.push(emp);
    }

    if (employers.length === 0) {
      const formatRange = (nums: number[]) => {
        if (nums.length === 0) return '';
        if (nums.length === 1) return `Row ${nums[0]}`;
        
        const ranges: string[] = [];
        let start = nums[0];
        let prev = nums[0];
        
        for (let i = 1; i <= nums.length; i++) {
          const curr = nums[i];
          if (curr === prev + 1) {
            prev = curr;
          } else {
            if (start === prev) {
              ranges.push(`${start}`);
            } else {
              ranges.push(`${start}-${prev}`);
            }
            start = curr;
            prev = curr;
          }
        }
        
        const prefix = nums.length > 1 ? 'Rows' : 'Row';
        return `${prefix} ${ranges.join(', ')}`;
      };

      const aggregatedErrors = Object.entries(errorGroups).map(([msg, rows]) => {
        return `${formatRange(rows)}: ${msg}`;
      });

      throw new BadRequestException({
        message: 'No valid employers found in CSV',
        details: aggregatedErrors,
      });
    }

    const formatRange = (nums: number[]) => {
      if (nums.length === 0) return '';
      if (nums.length === 1) return `Row ${nums[0]}`;
      
      const ranges: string[] = [];
      let start = nums[0];
      let prev = nums[0];
      
      for (let i = 1; i <= nums.length; i++) {
        const curr = nums[i];
        if (curr === prev + 1) {
          prev = curr;
        } else {
          if (start === prev) {
            ranges.push(`${start}`);
          } else {
            ranges.push(`${start}-${prev}`);
          }
          start = curr;
          prev = curr;
        }
      }
      
      const prefix = nums.length > 1 ? 'Rows' : 'Row';
      return `${prefix} ${ranges.join(', ')}`;
    };

    const aggregatedErrors = Object.entries(errorGroups).map(([msg, rows]) => {
      return `${formatRange(rows)}: ${msg}`;
    });

    const result = await this.rfeRepository.bulkImport(
      tenantId,
      userId,
      role,
      employers,
    );

    return { imported: result.imported, errors: aggregatedErrors };
  }

  async createMatch(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
    rfeId: string,
    applicationStatus?: string,
  ): Promise<ParticipantEmployerMatchRow> {
    // Validate the employer exists
    const employer = await this.rfeRepository.findById(
      tenantId,
      userId,
      role,
      rfeId,
    );

    if (!employer) {
      throw new BadRequestException(
        `Recovery-friendly employer with id ${rfeId} not found`,
      );
    }

    // Validate the participant exists
    const participantExists = await this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (client) => {
        const result = await client.query(
          'SELECT id FROM protected.participants WHERE id = $1',
          [participantId],
        );
        return result.rows.length > 0;
      },
    );

    if (!participantExists) {
      throw new BadRequestException(`Participant with id ${participantId} not found`);
    }

    const status = applicationStatus || 'interested';
    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid application status: ${status}. Must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}`,
      );
    }

    return this.rfeRepository.createMatch(tenantId, userId, role, {
      participant_id: participantId,
      rfe_id: rfeId,
      application_status: status,
    });
  }

  async updateMatch(
    tenantId: string,
    userId: string,
    role: string,
    matchId: string,
    dto: {
      application_status?: string;
      outcome?: string;
      outcome_date?: string;
      notes?: string;
    },
  ): Promise<ParticipantEmployerMatchRow> {
    if (
      dto.application_status &&
      !VALID_APPLICATION_STATUSES.includes(dto.application_status)
    ) {
      throw new BadRequestException(
        `Invalid application status: ${dto.application_status}. Must be one of: ${VALID_APPLICATION_STATUSES.join(', ')}`,
      );
    }

    if (dto.outcome && !VALID_OUTCOMES.includes(dto.outcome)) {
      throw new BadRequestException(
        `Invalid outcome: ${dto.outcome}. Must be one of: ${VALID_OUTCOMES.join(', ')}`,
      );
    }

    const updated = await this.rfeRepository.updateMatch(
      tenantId,
      userId,
      role,
      matchId,
      dto,
    );

    if (!updated) {
      throw new NotFoundException(
        `Participant-employer match with id ${matchId} not found`,
      );
    }

    return updated;
  }

  async getParticipantMatches(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<MatchWithEmployer[]> {
    return this.rfeRepository.getMatchesByParticipant(
      tenantId,
      userId,
      role,
      participantId,
    );
  }
}
