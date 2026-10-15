import { Module } from '@nestjs/common';
import { IpsController } from './ips.controller';
import { IpsService } from './ips.service';
import { IpsRepository } from './ips.repository';

@Module({
  controllers: [IpsController],
  providers: [IpsService, IpsRepository],
  exports: [IpsService],
})
export class IpsModule {}
