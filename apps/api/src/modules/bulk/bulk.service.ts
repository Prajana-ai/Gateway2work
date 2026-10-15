import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { parseCsv } from '../../common/utils/csv-parser';

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  duplicates: string[];
  errors: string[];
}

interface ParticipantCsvRow {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  external_ehr_id?: string;
  referral_source?: string;
}

interface ReferralCsvRow {
  external_ehr_id: string;
  provider_agency_id?: string;
  notes?: string;
}

@Injectable()
export class BulkService {
  constructor(private databaseService: DatabaseService) {}

  async importParticipants(
    tenantId: string,
    userId: string,
    role: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const rows = parseCsv<ParticipantCsvRow>(csvContent, {
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      duplicates: [],
      errors: [],
    };

    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2; // 1-indexed + header row

          if (!row.first_name || !row.last_name) {
            result.errors.push(`Row ${rowNum}: missing first_name or last_name`);
            result.skipped++;
            continue;
          }

          try {
            // Check for duplicate by external_ehr_id
            if (row.external_ehr_id) {
              const existing = await dbClient.query(
                `SELECT id FROM protected.participants
                 WHERE external_ehr_id = $1`,
                [row.external_ehr_id],
              );
              if (existing.rows.length > 0) {
                result.duplicates.push(
                  `Row ${rowNum}: duplicate external_ehr_id ${row.external_ehr_id}`,
                );
                result.skipped++;
                continue;
              }
            }

            // Fuzzy duplicate check on name + DOB
            if (row.date_of_birth) {
              const fuzzy = await dbClient.query(
                `SELECT id, demographics->>'first_name' as fn, demographics->>'last_name' as ln
                 FROM protected.participants
                 WHERE similarity(demographics->>'first_name', $1) > 0.4
                   AND similarity(demographics->>'last_name', $2) > 0.4
                   AND demographics->>'date_of_birth' = $3
                 LIMIT 1`,
                [row.first_name, row.last_name, row.date_of_birth],
              );
              if (fuzzy.rows.length > 0) {
                result.duplicates.push(
                  `Row ${rowNum}: possible duplicate of ${fuzzy.rows[0].fn} ${fuzzy.rows[0].ln}`,
                );
                result.skipped++;
                continue;
              }
            }

            const demographics = {
              first_name: row.first_name,
              last_name: row.last_name,
              date_of_birth: row.date_of_birth || null,
              email: row.email || null,
              phone: row.phone || null,
            };

            await dbClient.query(
              `INSERT INTO protected.participants
               (tenant_id, external_ehr_id, referral_source, demographics, status, created_by)
               VALUES ($1, $2, $3, $4, 'pending', $5)`,
              [
                tenantId,
                row.external_ehr_id || null,
                row.referral_source || null,
                JSON.stringify(demographics),
                userId,
              ],
            );

            result.imported++;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            result.errors.push(`Row ${rowNum}: ${message}`);
            result.skipped++;
          }
        }

        return result;
      },
    );
  }

  async importReferrals(
    tenantId: string,
    userId: string,
    role: string,
    csvContent: string,
  ): Promise<ImportResult> {
    const rows = parseCsv<ReferralCsvRow>(csvContent, {
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    const result: ImportResult = {
      total: rows.length,
      imported: 0,
      skipped: 0,
      duplicates: [],
      errors: [],
    };

    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          if (!row.external_ehr_id) {
            result.errors.push(`Row ${rowNum}: missing external_ehr_id`);
            result.skipped++;
            continue;
          }

          try {
            // Find participant by external_ehr_id
            const participantResult = await dbClient.query(
              `SELECT id FROM protected.participants WHERE external_ehr_id = $1`,
              [row.external_ehr_id],
            );

            if (participantResult.rows.length === 0) {
              result.errors.push(
                `Row ${rowNum}: no participant found with external_ehr_id ${row.external_ehr_id}`,
              );
              result.skipped++;
              continue;
            }

            const participantId = participantResult.rows[0].id;

            await dbClient.query(
              `INSERT INTO protected.referrals
               (tenant_id, participant_id, provider_agency_id, notes, referral_status, created_by)
               VALUES ($1, $2, $3, $4, 'pending', $5)`,
              [
                tenantId,
                participantId,
                row.provider_agency_id || null,
                row.notes || null,
                userId,
              ],
            );

            result.imported++;
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            result.errors.push(`Row ${rowNum}: ${message}`);
            result.skipped++;
          }
        }

        return result;
      },
    );
  }
}
