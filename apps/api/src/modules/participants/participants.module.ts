import { Module, forwardRef } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { ParticipantsRepository } from './participants.repository';
import { EnrollmentModule } from '../enrollments/enrollment.module';

@Module({
  imports: [forwardRef(() => EnrollmentModule)],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantsRepository],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
