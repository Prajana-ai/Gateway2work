import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentRepository } from './enrollment.repository';
import { DatabaseModule } from '../../database/database.module'; 
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [
    DatabaseModule,
    forwardRef(() => ParticipantsModule),
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, EnrollmentRepository],
  exports: [EnrollmentService, EnrollmentRepository],
})
export class EnrollmentModule {}
