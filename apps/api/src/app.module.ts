import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { WorkforcePlansModule } from './modules/workforce-plans/workforce-plans.module';
import { RfeModule } from './modules/rfe/rfe.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FormsModule } from './modules/forms/forms.module';
import { BulkModule } from './modules/bulk/bulk.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AiReportsModule } from './modules/ai-reports/ai-reports.module';
import { HealthModule } from './health/health.module';
import { EnrollmentModule } from './modules/enrollments/enrollment.module';
import { TrainingsModule } from './modules/trainings/trainings.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { EmploymentOutcomesModule } from './modules/employment-outcomes/employment-outcomes.module';
import { DischargesModule } from './modules/discharges/discharges.module';
import { IpsModule } from './modules/ips/ips.module';
import { ParticipantCheckInsModule } from './modules/participant-check-ins/participant-check-ins.module';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { FieldPermissionInterceptor } from './common/interceptors/field-permission.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { MfaGuard } from './common/guards/mfa.guard';
import { DataZoneGuard } from './common/guards/data-zone.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    ParticipantsModule,
    ReferralsModule,
    AssessmentsModule,
    WorkforcePlansModule,
    RfeModule,
    EncountersModule,
    ReportsModule,
    FormsModule,
    BulkModule,
    WorkflowsModule,
    SchedulingModule,
    IntegrationsModule,
    AiReportsModule,
    HealthModule,
    EnrollmentModule,
    TrainingsModule,
    FollowUpsModule,
    EmploymentOutcomesModule,
    DischargesModule,
    IpsModule,
    ParticipantCheckInsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: MfaGuard },
    { provide: APP_GUARD, useClass: DataZoneGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: FieldPermissionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
