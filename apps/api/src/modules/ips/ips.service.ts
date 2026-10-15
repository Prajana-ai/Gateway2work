import { Injectable, NotFoundException } from '@nestjs/common';
import { IpsRepository, IpsFidelityReviewRow } from './ips.repository';

@Injectable()
export class IpsService {
  constructor(private readonly ipsRepository: IpsRepository) {}

  async listReviews(tenantId: string, userId: string, role: string) {
    return this.ipsRepository.findAll(tenantId, userId, role);
  }

  async getReview(tenantId: string, userId: string, role: string, id: string) {
    const review = await this.ipsRepository.findById(tenantId, userId, role, id);
    if (!review) throw new NotFoundException('Fidelity review not found');
    return review;
  }

  async createReview(tenantId: string, userId: string, role: string, data: Partial<IpsFidelityReviewRow>) {
    const staffId = await this.ipsRepository.getStaffIdByUserId(tenantId, userId, role);
    return this.ipsRepository.create(tenantId, userId, role, {
      ...data,
      reviewer_id: staffId,
    });
  }

  async updateReview(tenantId: string, userId: string, role: string, id: string, data: Partial<IpsFidelityReviewRow>) {
    // If reviewer_id is being explicitly set to something, respect it.
    // Otherwise, if it's a new review being finalized/saved and we don't have one, we could auto-set it,
    // but typically it's set on create.
    return this.ipsRepository.update(tenantId, userId, role, id, data);
  }

  async getAutomatedFidelityStats(tenantId: string, userId: string, role: string) {
    return this.ipsRepository.getAutomatedFidelityStats(tenantId, userId, role);
  }
}
