import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EnrollmentRepository } from './enrollment.repository';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from '@impactforge/shared';

@Injectable()
export class EnrollmentService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: CreateEnrollmentDto,
  ): Promise<{ id: string }> {
    if (!data.participant_id) {
      throw new BadRequestException('Participant ID is required for enrollment.');
    }
    
    // Check maximum enrollments per participant
    const existingEnrollments = await this.enrollmentRepository.findByParticipantId(tenantId, userId, role, data.participant_id);
    if (existingEnrollments.length >= 5) {
      throw new BadRequestException('This participant has reached the maximum allowed limit of 5 enrollments.');
    }

    // Add more business logic validation as needed.
    // E.g., check if participant_id and referral_id exist in their respective tables.
    // This would typically involve injecting and using ParticipantRepository and ReferralRepository.
    // For now, we assume valid IDs are passed or handled by DB constraints.

    return this.enrollmentRepository.create(tenantId, userId, role, data);
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<any> {
    const enrollment = await this.enrollmentRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found.`);
    }
    return enrollment;
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    queryParams: {
      page?: number;
      limit?: number;
      participantId?: string;
      referralId?: string;
      sortBy?: string;
    },
  ): Promise<{ data: any[]; total: number }> {
    // Add more complex filtering/sorting logic here if needed.
    // For example, parsing date ranges, handling complex string searches etc.
    // Ensure queryParams are sanitized and validated.

    // If participantId or referralId are provided directly in query params,
    // the repository's findAll method will handle them.
    // If specific logic is needed for listing (e.g., combining results), do it here.
    
    // If only participantId is provided, we can use findByParticipantId, but findAll is more generic.
    // The current repository handles participantId and referralId within findAll.

    return this.enrollmentRepository.findAll(
      tenantId,
      userId,
      role,
      queryParams,
    );
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<any[]> {
    // Basic validation
    if (!participantId) {
      throw new BadRequestException('Participant ID is required.');
    }
    // We can delegate directly to the repository if no extra logic is needed.
    // If we need to check for participant existence first, we would inject ParticipantRepository.
    return this.enrollmentRepository.findByParticipantId(tenantId, userId, role, participantId);
  }

  async findByReferralId(
    tenantId: string,
    userId: string,
    role: string,
    referralId: string,
  ): Promise<any[]> {
    // Basic validation
    if (!referralId) {
      throw new BadRequestException('Referral ID is required.');
    }
    // Delegate to repository. If we need to check for referral existence, inject ReferralRepository.
    return this.enrollmentRepository.findByReferralId(tenantId, userId, role, referralId);
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: UpdateEnrollmentDto,
  ): Promise<any> {
    const existingEnrollment = await this.enrollmentRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!existingEnrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found.`);
    }

    // Add business logic validation for updates here.
    // For example, preventing updates to certain fields if enrollment is in a closed state.

    const updatedEnrollment = await this.enrollmentRepository.update(
      tenantId,
      userId,
      role,
      id,
      data,
    );

    if (!updatedEnrollment) {
      // This case should ideally not happen if findById succeeded, but as a safeguard.
      throw new NotFoundException(`Enrollment with ID ${id} not found after update attempt.`);
    }
    return updatedEnrollment;
  }

  async delete(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<boolean> {
    const enrollmentExists = await this.enrollmentRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!enrollmentExists) {
      throw new NotFoundException(`Enrollment with ID ${id} not found.`);
    }
    
    // Add business logic validation for deletion here.
    // E.g., prevent deletion if enrollment has associated active records or is in a certain state.

    return this.enrollmentRepository.delete(tenantId, userId, role, id);
  }
}
