import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, ParseUUIDPipe } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from '@impactforge/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DataZoneGuard } from '../../common/guards/data-zone.guard';
import { ResponseEnvelopeInterceptor } from '../../common/interceptors/response-envelope.interceptor';
import { CurrentUser, CurrentTenant, Resource, DataZoneAccess } from '../../common/decorators';

@UseGuards(JwtAuthGuard, RolesGuard, DataZoneGuard)
@UseInterceptors(ResponseEnvelopeInterceptor)
@Controller('enrollments')
@Resource('enrollments') // Tag for field permission filtering
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @DataZoneAccess('protected') // Enrollments are in the 'protected' schema
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') role: string,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    return this.enrollmentService.create(tenantId, userId, role, createEnrollmentDto);
  }

  @Get()
  @DataZoneAccess('protected')
  async findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') role: string,
    @Query() queryParams: {
      page?: number;
      limit?: number;
      participantId?: string;
      referralId?: string;
      sortBy?: string;
      // Add other potential query parameters for filtering/sorting
    },
  ) {
    return this.enrollmentService.findAll(tenantId, userId, role, queryParams);
  }

  @Get(':id')
  @DataZoneAccess('protected')
  async findById(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') role: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentService.findById(tenantId, userId, role, id);
  }

  @Patch(':id')
  @DataZoneAccess('protected')
  async update(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') role: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentService.update(tenantId, userId, role, id, updateEnrollmentDto);
  }

  @Delete(':id')
  @DataZoneAccess('protected')
  async delete(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') role: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentService.delete(tenantId, userId, role, id);
  }
}
