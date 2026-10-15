import { Controller, Get } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CurrentTenant } from '../../common/decorators';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  async getCurrentTenant(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getCurrentTenant(tenantId);
  }
}
