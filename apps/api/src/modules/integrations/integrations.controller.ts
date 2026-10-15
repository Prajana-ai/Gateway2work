import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DataZoneAccess } from '../../common/decorators/data-zone.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('providers')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async listProviders(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
  ) {
    return this.integrationsService.listProviders(
      tenantId,
      user.id,
      user.roleName,
    );
  }

  @Post('providers')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async configureProvider(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      id?: string;
      name: string;
      providerType: string;
      config?: Record<string, any>;
      isActive?: boolean;
    },
  ) {
    return this.integrationsService.configureProvider(
      tenantId,
      user.id,
      user.roleName,
      body,
    );
  }

  @Get('providers/:id/mappings')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async getFieldMappings(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.integrationsService.getFieldMappings(
      tenantId,
      user.id,
      user.roleName,
      id,
    );
  }

  @Post('providers/:id/mappings')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async saveFieldMappings(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      mappings: Array<{
        sourceField: string;
        targetTable: string;
        targetField: string;
        transform?: string;
        transformConfig?: Record<string, any>;
        isRequired?: boolean;
      }>;
    },
  ) {
    return this.integrationsService.saveFieldMappings(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.mappings,
    );
  }

  @Post('providers/:id/import')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async importCsv(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { csv: string },
  ) {
    return this.integrationsService.importFromCsv(
      tenantId,
      user.id,
      user.roleName,
      id,
      body.csv,
    );
  }

  @Get('import-history')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async getImportHistory(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.integrationsService.getImportHistory(
      tenantId,
      user.id,
      user.roleName,
      providerId,
    );
  }

  @Get('imports')
  @DataZoneAccess('application')
  @Roles('org_admin')
  async getImports(
    @CurrentUser() user: RequestUser,
    @CurrentTenant() tenantId: string,
    @Query('providerId') providerId?: string,
  ) {
    return this.getImportHistory(user, tenantId, providerId);
  }

  @Post('ehr/webhook')
  @Public()
  async processWebhook(
    @Body() body: { tenantId: string; providerId: string; payload: Record<string, any> },
  ) {
    return this.integrationsService.processWebhook(
      body.tenantId,
      body.providerId,
      body.payload,
    );
  }
}
