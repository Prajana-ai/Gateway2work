import { Module } from '@nestjs/common';
import { RfeController } from './rfe.controller';
import { RfeService } from './rfe.service';
import { RfeRepository } from './rfe.repository';

@Module({
  controllers: [RfeController],
  providers: [RfeService, RfeRepository],
  exports: [RfeService],
})
export class RfeModule {}
