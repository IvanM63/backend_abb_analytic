/**
 * Custom ID Generator Utilities
 * Provides numeric-only ID generation functions for face recognition system
 */

/**
 * Generates a simple numeric ID with specified length
 * @param length - Length of the ID (default: 36)
 * @returns string - Numeric ID with only digits 0-9
 */
export const generateSimpleNumericId = (length: number = 36): string => {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += Math.floor(Math.random() * 10).toString();
  }
  return id;
};

/**
 * Generates a random numeric ID with custom length
 * @param length - Length of the desired ID
 * @returns string - Random numeric ID
 */
export const generateRandomNumericId = (length: number): string => {
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }

  let id = '';
  // Ensure first digit is not 0 to avoid leading zero issues
  id += Math.floor(Math.random() * 9 + 1).toString();

  for (let i = 1; i < length; i++) {
    id += Math.floor(Math.random() * 10).toString();
  }
  return id;
};

/**
 * Generates a numeric UUID-like format (36 characters with hyphens replaced by numbers)
 * Format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX becomes all numeric
 * @returns string - 36 character numeric ID
 */
export const generateNumericUUID = (): string => {
  // Generate 36 character numeric string in UUID-like pattern
  const segments = [8, 4, 4, 4, 12];
  let id = '';

  for (const segmentLength of segments) {
    if (id.length > 0) {
      // Add separator digit instead of hyphen
      id += Math.floor(Math.random() * 10).toString();
    }

    for (let i = 0; i < segmentLength; i++) {
      id += Math.floor(Math.random() * 10).toString();
    }
  }

  return id.substring(0, 36); // Ensure exactly 36 characters
};

/**
 * Generates a high-entropy numeric ID with timestamp prefix for better uniqueness
 * @param length - Total length of ID (default: 36)
 * @returns string - Timestamp-prefixed numeric ID
 */
export const generateTimestampNumericId = (length: number = 36): string => {
  const timestamp = Date.now().toString();
  const remainingLength = length - timestamp.length;

  if (remainingLength <= 0) {
    // If timestamp is longer than desired length, use random ID
    return generateRandomNumericId(length);
  }

  const randomPart = generateRandomNumericId(remainingLength);
  return timestamp + randomPart;
};

/**
 * Validates if a string contains only numeric characters
 * @param id - ID string to validate
 * @returns boolean - True if ID is numeric only
 */
export const isNumericId = (id: string): boolean => {
  return /^\d+$/.test(id);
};

/**
 * Generates a secure numeric ID with configurable options
 * @param options - Configuration options for ID generation
 * @returns string - Generated numeric ID
 */
export interface NumericIdOptions {
  length?: number;
  includeTimestamp?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const generateSecureNumericId = (
  options: NumericIdOptions = {}
): string => {
  const {
    length = 36,
    includeTimestamp = false,
    minLength = 8,
    maxLength = 64,
  } = options;

  // Validate length constraints
  if (length < minLength || length > maxLength) {
    throw new Error(`ID length must be between ${minLength} and ${maxLength}`);
  }

  if (includeTimestamp) {
    return generateTimestampNumericId(length);
  }

  return generateRandomNumericId(length);
};
