import { v4 as uuidv4 } from 'uuid';

export function createMockTenant(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: uuidv4(),
    name: 'Acme Behavioral Health',
    slug: 'acme-behavioral',
    settings: {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockUser(overrides: Partial<Record<string, any>> = {}) {
  const id = overrides.id || uuidv4();
  const tenantId = overrides.tenant_id || uuidv4();
  const roleId = overrides.role_id || uuidv4();
  return {
    id,
    tenant_id: tenantId,
    email: `user-${id.slice(0, 8)}@example.com`,
    password_hash: '$2a$10$KIXmQQWQlC8eSVlHJlK9TeFH1dBQGkNu3YkHq7Vgo.QcJVw0H1Zqe', // bcrypt of 'Password123!'
    is_active: true,
    mfa_enabled: false,
    mfa_secret: null,
    role_id: roleId,
    role_name: 'case_manager',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockParticipant(overrides: Partial<Record<string, any>> = {}) {
  const id = overrides.id || uuidv4();
  const tenantId = overrides.tenant_id || uuidv4();
  return {
    id,
    tenant_id: tenantId,
    external_ehr_id: `EHR-${id.slice(0, 8)}`,
    referral_source: 'partner_agency',
    referral_date: '2025-06-15',
    demographics: {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-05-20',
      email: 'john.doe@example.com',
      phone: '555-0100',
      address: '123 Main St, Springfield, IL 62704',
      ssn_last4: '1234',
    },
    consent_42cfr: true,
    consent_expires_at: '2027-06-15T00:00:00.000Z',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: uuidv4(),
    updated_by: uuidv4(),
    ...overrides,
  };
}

export function createMockReferral(overrides: Partial<Record<string, any>> = {}) {
  const id = overrides.id || uuidv4();
  const tenantId = overrides.tenant_id || uuidv4();
  return {
    id,
    tenant_id: tenantId,
    participant_id: overrides.participant_id || uuidv4(),
    provider_agency_id: overrides.provider_agency_id || uuidv4(),
    referral_status: 'pending',
    notes: 'Initial referral for assessment',
    ingested_at: new Date().toISOString(),
    created_by: uuidv4(),
    updated_by: uuidv4(),
    ...overrides,
  };
}

export function createMockAssessment(overrides: Partial<Record<string, any>> = {}) {
  const id = overrides.id || uuidv4();
  const tenantId = overrides.tenant_id || uuidv4();
  return {
    id,
    tenant_id: tenantId,
    participant_id: overrides.participant_id || uuidv4(),
    form_id: overrides.form_id || uuidv4(),
    assessor_id: overrides.assessor_id || uuidv4(),
    status: 'completed',
    responses: {
      q1: 'yes',
      q2: 'no',
      q3: 'moderate',
    },
    score: 72,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: uuidv4(),
    updated_by: uuidv4(),
    ...overrides,
  };
}
