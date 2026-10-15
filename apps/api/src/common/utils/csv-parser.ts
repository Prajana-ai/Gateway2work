import { BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';

export interface CsvParseOptions {
  transformHeader?: (header: string) => string;
  /**
   * When true, rows with parse errors are included alongside valid data
   * (only throws if there are errors and zero valid rows).
   */
  lenient?: boolean;
}

/**
 * Parse CSV content into typed rows using Papa.parse.
 * Throws BadRequestException on parse errors or empty data.
 */
export function parseCsv<T = Record<string, any>>(
  csvContent: string,
  options: CsvParseOptions = {},
): T[] {
  // Strip UTF-8 BOM if present
  const sanitizedContent = csvContent.startsWith('\ufeff')
    ? csvContent.slice(1)
    : csvContent;

  const parsed = Papa.parse<T>(sanitizedContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: options.transformHeader,
  });

  if (options.lenient) {
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new BadRequestException(
        `CSV parsing failed: ${parsed.errors.map((e) => e.message).join(', ')}`,
      );
    }
  } else {
    if (parsed.errors.length > 0) {
      throw new BadRequestException(
        `CSV parsing errors: ${parsed.errors.map((e) => e.message).join(', ')}`,
      );
    }
  }

  if (parsed.data.length === 0) {
    throw new BadRequestException('CSV file is empty');
  }

  return parsed.data;
}
