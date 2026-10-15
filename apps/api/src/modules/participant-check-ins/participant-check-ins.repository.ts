import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface CheckInRecord {
  id: string;
  tenant_id: string;
  participant_id: string;
  date: string;
  feeling: number;
  employment_status: string;
  hours_worked: number;
  hours_searching: number;
  hours_prepping: number;
  challenges: string;
  needs_help: string[];
  created_at: string;
}

@Injectable()
export class ParticipantCheckInsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participantId: string;
      feeling: number;
      employmentStatus: string;
      hoursWorked: number;
      hoursSearching: number;
      hoursPrepping: number;
      challenges: string;
      needsHelp: string[];
    },
  ): Promise<CheckInRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.participant_check_ins
           (tenant_id, participant_id, date, feeling, employment_status,
            hours_worked, hours_searching, hours_prepping, challenges, needs_help)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          tenantId,
          data.participantId,
          data.feeling,
          data.employmentStatus,
          data.hoursWorked,
          data.hoursSearching,
          data.hoursPrepping,
          data.challenges,
          JSON.stringify(data.needsHelp),
        ],
      );
      return result.rows[0];
    });
  }

  async findByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<CheckInRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, tenant_id, participant_id, date, feeling, employment_status,
                hours_worked, hours_searching, hours_prepping, challenges, needs_help, created_at
         FROM application.participant_check_ins
         WHERE participant_id = $1
         ORDER BY date DESC
         LIMIT 12`,
        [participantId],
      );
      return result.rows;
    });
  }
}
