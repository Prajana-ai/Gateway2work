import { SetMetadata } from '@nestjs/common';

export const DATA_ZONE_KEY = 'dataZone';
export const DataZoneAccess = (zone: 'protected' | 'application') =>
  SetMetadata(DATA_ZONE_KEY, zone);
