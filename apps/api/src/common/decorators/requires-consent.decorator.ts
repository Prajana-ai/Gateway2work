import { SetMetadata } from '@nestjs/common';

export const REQUIRES_CONSENT_KEY = 'requiresConsent';
export const RequiresConsent = () => SetMetadata(REQUIRES_CONSENT_KEY, true);
