import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  IntegrationsRepository,
  EhrProviderRecord,
  EhrFieldMappingRecord,
  EhrImportLogRecord,
} from './integrations.repository';
import { parseCsv } from '../../common/utils/csv-parser';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly integrationsRepository: IntegrationsRepository,
  ) {}

  // --- Provider operations ---

  async listProviders(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<EhrProviderRecord[]> {
    return this.integrationsRepository.findAllProviders(
      tenantId,
      userId,
      role,
    );
  }

  async configureProvider(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      id?: string;
      name: string;
      providerType: string;
      config?: Record<string, any>;
      isActive?: boolean;
    },
  ): Promise<EhrProviderRecord> {
    if (dto.id) {
      const existing = await this.integrationsRepository.findProviderById(
        tenantId,
        userId,
        role,
        dto.id,
      );
      if (!existing) {
        throw new NotFoundException(`Provider with id ${dto.id} not found`);
      }

      const updated = await this.integrationsRepository.updateProvider(
        tenantId,
        userId,
        role,
        dto.id,
        {
          name: dto.name,
          provider_type: dto.providerType,
          config: dto.config,
          is_active: dto.isActive,
        },
      );

      if (!updated) {
        throw new NotFoundException(`Provider with id ${dto.id} not found`);
      }

      return updated;
    }

    return this.integrationsRepository.createProvider(
      tenantId,
      userId,
      role,
      {
        name: dto.name,
        provider_type: dto.providerType,
        config: dto.config,
        is_active: dto.isActive,
      },
    );
  }

  // --- Field mapping operations ---

  async getFieldMappings(
    tenantId: string,
    userId: string,
    role: string,
    providerId: string,
  ): Promise<EhrFieldMappingRecord[]> {
    return this.integrationsRepository.findMappingsByProvider(
      tenantId,
      userId,
      role,
      providerId,
    );
  }

  async saveFieldMappings(
    tenantId: string,
    userId: string,
    role: string,
    providerId: string,
    mappings: Array<{
      sourceField: string;
      targetTable: string;
      targetField: string;
      transform?: string;
      transformConfig?: Record<string, any>;
      isRequired?: boolean;
    }>,
  ): Promise<EhrFieldMappingRecord[]> {
    const provider = await this.integrationsRepository.findProviderById(
      tenantId,
      userId,
      role,
      providerId,
    );
    if (!provider) {
      throw new NotFoundException(`Provider with id ${providerId} not found`);
    }

    const results = await Promise.all(
      mappings.map((mapping) =>
        this.integrationsRepository.createMapping(tenantId, userId, role, {
          provider_id: providerId,
          source_field: mapping.sourceField,
          target_table: mapping.targetTable,
          target_field: mapping.targetField,
          transform: mapping.transform,
          transform_config: mapping.transformConfig,
          is_required: mapping.isRequired,
        }),
      ),
    );

    return results;
  }

  // --- Import operations ---

  async importFromCsv(
    tenantId: string,
    userId: string,
    role: string,
    providerId: string,
    csvContent: string,
  ): Promise<EhrImportLogRecord> {
    const provider = await this.integrationsRepository.findProviderById(
      tenantId,
      userId,
      role,
      providerId,
    );
    if (!provider) {
      throw new NotFoundException(`Provider with id ${providerId} not found`);
    }

    // Parse CSV
    const rows = parseCsv<Record<string, any>>(csvContent, { lenient: true });

    // Get field mappings for this provider
    const mappings = await this.integrationsRepository.findMappingsByProvider(
      tenantId,
      userId,
      role,
      providerId,
    );

    if (mappings.length === 0) {
      throw new BadRequestException(
        `No field mappings configured for provider ${providerId}. Configure mappings before importing.`,
      );
    }

    // Create import log
    const importLog = await this.integrationsRepository.createImportLog(
      tenantId,
      userId,
      role,
      {
        provider_id: providerId,
        import_type: 'manual',
        records_total: rows.length,
      },
    );

    let recordsImported = 0;
    let recordsSkipped = 0;
    let recordsFailed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        // Check required fields
        const missingRequired = mappings
          .filter((m) => m.is_required && !row[m.source_field])
          .map((m) => m.source_field);

        if (missingRequired.length > 0) {
          recordsSkipped++;
          errors.push({
            row: i + 1,
            error: `Missing required fields: ${missingRequired.join(', ')}`,
          });
          continue;
        }

        // Transform row data according to mappings
        const transformed: Record<string, Record<string, any>> = {};

        for (const mapping of mappings) {
          const sourceValue = row[mapping.source_field];
          if (sourceValue === undefined || sourceValue === '') continue;

          if (!transformed[mapping.target_table]) {
            transformed[mapping.target_table] = {};
          }

          transformed[mapping.target_table][mapping.target_field] =
            this.applyTransform(sourceValue, mapping.transform, mapping.transform_config);
        }

        // For now, we log the transformed data. Actual insertion into
        // target tables (clients, referrals, etc.) would be done here
        // based on the target_table values in the mappings.
        this.logger.log(
          `Row ${i + 1} transformed: ${JSON.stringify(transformed)}`,
        );

        recordsImported++;
      } catch (error) {
        recordsFailed++;
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Update the import log with results
    const updatedLog = await this.integrationsRepository.updateImportLog(
      tenantId,
      userId,
      role,
      importLog.id,
      {
        status: recordsFailed > 0 ? 'completed' : 'completed',
        records_imported: recordsImported,
        records_skipped: recordsSkipped,
        records_failed: recordsFailed,
        error_details: errors.length > 0 ? { errors } : undefined,
        completed_at: new Date().toISOString(),
      },
    );

    // Update provider last_sync_at
    await this.integrationsRepository.updateProvider(
      tenantId,
      userId,
      role,
      providerId,
      { last_sync_at: new Date().toISOString() },
    );

    return updatedLog!;
  }

  async getImportHistory(
    tenantId: string,
    userId: string,
    role: string,
    providerId?: string,
  ): Promise<EhrImportLogRecord[]> {
    return this.integrationsRepository.findImportLogsByProvider(
      tenantId,
      userId,
      role,
      providerId,
    );
  }

  // --- Webhook (placeholder) ---

  async processWebhook(
    tenantId: string,
    providerId: string,
    payload: Record<string, any>,
  ): Promise<{ received: boolean }> {
    this.logger.log(
      `Webhook received for provider ${providerId} in tenant ${tenantId}: ${JSON.stringify(payload)}`,
    );
    // Future: parse payload based on provider config and process accordingly
    return { received: true };
  }

  // --- Helpers ---

  private applyTransform(
    value: string,
    transform: string | null,
    config: Record<string, any> | null,
  ): any {
    switch (transform) {
      case 'date_format': {
        // Attempt to parse and reformat date
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toISOString();
      }
      case 'lookup': {
        // Use config to map values
        if (config && config.map) {
          return config.map[value] ?? value;
        }
        return value;
      }
      case 'concat': {
        // Concat with separator (value is already a single field here)
        return value;
      }
      case 'custom': {
        // Custom transforms would be handled by specific logic
        return value;
      }
      case 'direct':
      default:
        return value;
    }
  }
}
