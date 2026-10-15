import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BulkService } from './bulk.service';
import {
  CurrentUser,
  CurrentTenant,
  DataZoneAccess,
  Roles,
} from '../../common/decorators';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('bulk')
export class BulkController {
  constructor(private bulkService: BulkService) {}

  @Post('participants/import')
  @HttpCode(HttpStatus.OK)
  @DataZoneAccess('protected')
  @Roles('org_admin', 'workforce_specialist')
  async importParticipants(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { csv: string },
  ) {
    return this.bulkService.importParticipants(
      tenantId,
      user.id,
      user.roleName,
      body.csv,
    );
  }

  @Post('referrals/import')
  @HttpCode(HttpStatus.OK)
  @DataZoneAccess('protected')
  @Roles('org_admin', 'workforce_specialist')
  async importReferrals(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { csv: string },
  ) {
    return this.bulkService.importReferrals(
      tenantId,
      user.id,
      user.roleName,
      body.csv,
    );
  }
}
