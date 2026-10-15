import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface EventFilters {
  participantId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface EventRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  event_type: string;
  participant_id: string | null;
  staff_id: string | null;
  rfe_id: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  is_virtual: boolean;
  meeting_url: string | null;
  status: string;
  reminder_sent: boolean;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PaginatedEvents {
  data: EventRecord[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SchedulingRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: EventFilters,
  ): Promise<PaginatedEvents> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const { participantId, staffId, startDate, endDate, eventType, status, page, limit } = filters;
      const offset = (page - 1) * limit;
      const params: any[] = [];
      const conditions: string[] = [];

      if (participantId) {
        params.push(participantId);
        conditions.push(`participant_id = $${params.length}`);
      }

      if (staffId) {
        params.push(staffId);
        conditions.push(`staff_id = $${params.length}`);
      }

      if (startDate) {
        params.push(startDate);
        conditions.push(`start_time >= $${params.length}::timestamptz`);
      }

      if (endDate) {
        params.push(endDate);
        conditions.push(`end_time <= $${params.length}::timestamptz`);
      }

      if (eventType) {
        params.push(eventType);
        conditions.push(`event_type = $${params.length}`);
      }

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT *, COUNT(*) OVER() AS total_count
        FROM application.events
        ${whereClause}
        ORDER BY start_time ASC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await client.query(sql, params);

      const total =
        result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
      const data = result.rows.map(({ total_count, ...row }) => row);

      return { data, total, page, limit };
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<EventRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.events WHERE id = $1`,
        [id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      title: string;
      description?: string;
      event_type: string;
      participant_id?: string;
      staff_id?: string;
      rfe_id?: string;
      start_time: string;
      end_time: string;
      location?: string;
      is_virtual?: boolean;
      meeting_url?: string;
      notes?: string;
    },
  ): Promise<EventRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.events (
          tenant_id, title, description, event_type,
          participant_id, staff_id, rfe_id,
          start_time, end_time, location,
          is_virtual, meeting_url, notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *`,
        [
          tenantId,
          data.title,
          data.description || null,
          data.event_type,
          data.participant_id || null,
          data.staff_id || null,
          data.rfe_id || null,
          data.start_time,
          data.end_time,
          data.location || null,
          data.is_virtual ?? false,
          data.meeting_url || null,
          data.notes || null,
          userId,
        ],
      );
      return result.rows[0];
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      event_type: string;
      participant_id: string;
      staff_id: string;
      rfe_id: string;
      start_time: string;
      end_time: string;
      location: string;
      is_virtual: boolean;
      meeting_url: string;
      notes: string;
    }>,
  ): Promise<EventRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.title !== undefined) {
        params.push(data.title);
        setClauses.push(`title = $${params.length}`);
      }
      if (data.description !== undefined) {
        params.push(data.description);
        setClauses.push(`description = $${params.length}`);
      }
      if (data.event_type !== undefined) {
        params.push(data.event_type);
        setClauses.push(`event_type = $${params.length}`);
      }
      if (data.participant_id !== undefined) {
        params.push(data.participant_id);
        setClauses.push(`participant_id = $${params.length}`);
      }
      if (data.staff_id !== undefined) {
        params.push(data.staff_id);
        setClauses.push(`staff_id = $${params.length}`);
      }
      if (data.rfe_id !== undefined) {
        params.push(data.rfe_id);
        setClauses.push(`rfe_id = $${params.length}`);
      }
      if (data.start_time !== undefined) {
        params.push(data.start_time);
        setClauses.push(`start_time = $${params.length}`);
      }
      if (data.end_time !== undefined) {
        params.push(data.end_time);
        setClauses.push(`end_time = $${params.length}`);
      }
      if (data.location !== undefined) {
        params.push(data.location);
        setClauses.push(`location = $${params.length}`);
      }
      if (data.is_virtual !== undefined) {
        params.push(data.is_virtual);
        setClauses.push(`is_virtual = $${params.length}`);
      }
      if (data.meeting_url !== undefined) {
        params.push(data.meeting_url);
        setClauses.push(`meeting_url = $${params.length}`);
      }
      if (data.notes !== undefined) {
        params.push(data.notes);
        setClauses.push(`notes = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return this.findById(tenantId, userId, role, id);
      }

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE application.events
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await client.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    status: string,
  ): Promise<EventRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `UPDATE application.events
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async getUpcoming(
    tenantId: string,
    userId: string,
    role: string,
    staffId: string,
    days: number,
  ): Promise<EventRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.events
         WHERE staff_id = $1
           AND start_time >= NOW()
           AND start_time <= NOW() + ($2 || ' days')::interval
           AND status IN ('scheduled', 'confirmed')
         ORDER BY start_time ASC`,
        [staffId, days.toString()],
      );
      return result.rows;
    });
  }

  async getParticipantEvents(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<EventRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.events
         WHERE participant_id = $1
         ORDER BY start_time DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async findRemindersNeeded(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<EventRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.events
         WHERE reminder_sent = false
           AND status IN ('scheduled', 'confirmed')
           AND start_time >= NOW()
           AND start_time <= NOW() + INTERVAL '24 hours'
         ORDER BY start_time ASC`,
      );
      return result.rows;
    });
  }
}
