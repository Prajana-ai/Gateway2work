import { Injectable, NotFoundException } from '@nestjs/common';
import { FormsRepository, FormTemplateRow } from './forms.repository';

@Injectable()
export class FormsService {
  constructor(private readonly formsRepository: FormsRepository) {}

  async list(
    tenantId: string,
    userId: string,
    role: string,
    filters: { vertical?: string; assessmentType?: string; isActive?: boolean },
  ): Promise<FormTemplateRow[]> {
    return this.formsRepository.findAll(tenantId, userId, role, filters);
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<FormTemplateRow> {
    const template = await this.formsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );

    if (!template) {
      throw new NotFoundException(`Form template with id ${id} not found`);
    }

    return template;
  }

  async getByAssessmentType(
    tenantId: string,
    userId: string,
    role: string,
    assessmentType: string,
  ): Promise<FormTemplateRow> {
    const template = await this.formsRepository.findByAssessmentType(
      tenantId,
      userId,
      role,
      assessmentType,
    );

    if (!template) {
      throw new NotFoundException(
        `Form template for assessment type '${assessmentType}' not found`,
      );
    }

    return template;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      name: string;
      vertical: string;
      assessment_type: string;
      json_schema: Record<string, any>;
      ui_schema: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<FormTemplateRow> {
    return this.formsRepository.create(tenantId, userId, role, dto);
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: {
      name?: string;
      vertical?: string;
      assessment_type?: string;
      json_schema?: Record<string, any>;
      ui_schema?: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<FormTemplateRow> {
    const existing = await this.formsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );

    if (!existing) {
      throw new NotFoundException(`Form template with id ${id} not found`);
    }

    const updated = await this.formsRepository.update(
      tenantId,
      userId,
      role,
      id,
      dto,
    );

    if (!updated) {
      throw new NotFoundException(`Form template with id ${id} not found`);
    }

    return updated;
  }
}
