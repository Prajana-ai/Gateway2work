import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import {
  DataZoneAccess,
  Roles,
  CurrentUser,
  CurrentTenant,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('form-templates')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @DataZoneAccess('application')
  async list(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Query('vertical') vertical?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('is_active') isActive?: string,
  ) {
    const filters: { vertical?: string; assessmentType?: string; isActive?: boolean } = {};

    if (vertical) {
      filters.vertical = vertical;
    }

    if (assessmentType) {
      filters.assessmentType = assessmentType;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return this.formsService.list(tenantId, user.id, user.roleName, filters);
  }

  @Get('by-type/:assessmentType')
  @DataZoneAccess('application')
  async getByAssessmentType(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('assessmentType') assessmentType: string,
  ) {
    return this.formsService.getByAssessmentType(
      tenantId,
      user.id,
      user.roleName,
      assessmentType,
    );
  }

  @Get(':id')
  @DataZoneAccess('application')
  async getById(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.formsService.getById(tenantId, user.id, user.roleName, id);
  }

  @Post()
  @DataZoneAccess('application')
  @Roles('org_admin')
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body()
    body: {
      name: string;
      vertical: string;
      assessment_type: string;
      json_schema: Record<string, any>;
      ui_schema: Record<string, any>;
      is_active?: boolean;
    },
  ) {
    return this.formsService.create(
      tenantId,
      user.id,
      user.roleName,
      body,
    );
  }

  @Patch(':id')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      name?: string;
      vertical?: string;
      assessment_type?: string;
      json_schema?: Record<string, any>;
      ui_schema?: Record<string, any>;
      is_active?: boolean;
    },
  ) {
    return this.formsService.update(
      tenantId,
      user.id,
      user.roleName,
      id,
      body,
    );
  }
}
