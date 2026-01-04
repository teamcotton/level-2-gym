/**
 * List of sensitive field names that should be redacted in audit logs
 * to comply with security and privacy requirements (GDPR, PCI-DSS, etc.)
 */
const SENSITIVE_FIELDS = [
  // Authentication & Authorization
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'oldToken',
  'newToken',
  'apiKey',
  'secret',
  'privateKey',
  'publicKey',
  'jwt',
  'sessionId',
  'authToken',

  // Financial Information
  'creditCard',
  'cardNumber',
  'cvv',
  'cvc',
  'expiryDate',
  'cardholderName',
  'bankAccount',
  'routingNumber',
  'iban',
  'swift',

  // Personal Identifiable Information (PII)
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'nationalId',
  'passport',
  'driversLicense',
  'dob',
  'dateOfBirth',

  // Healthcare
  'medicalRecord',
  'healthRecord',
  'diagnosis',
  'prescription',

  // Biometric
  'fingerprint',
  'faceId',
  'retinaScan',
  'biometric',
] as const

/**
 * Placeholder text for redacted sensitive fields
 */
const REDACTED_PLACEHOLDER = '[REDACTED]'

/**
 * Recursively redacts sensitive fields from an object
 *
 * This function deeply traverses nested objects and arrays to ensure
 * sensitive data is removed at all levels before being stored in audit logs.
 *
 * @param data - The data object to redact (can be any type)
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum recursion depth (default: 10)
 * @returns A new object with sensitive fields redacted
 *
 * @example
 * ```typescript
 * const data = {
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   profile: {
 *     name: 'John',
 *     ssn: '123-45-6789'
 *   }
 * }
 *
 * const redacted = redactSensitiveData(data)
 * // Result:
 * // {
 * //   email: 'user@example.com',
 * //   password: '[REDACTED]',
 * //   profile: {
 * //     name: 'John',
 * //     ssn: '[REDACTED]'
 * //   }
 * // }
 * ```
 */
export function redactSensitiveData(
  data: unknown,
  depth: number = 0,
  maxDepth: number = 10
): unknown {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_EXCEEDED]'
  }

  // Handle null and undefined
  if (data == null) {
    return data
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1, maxDepth))
  }

  // Handle Date objects
  if (data instanceof Date) {
    return data
  }

  // Handle regular objects
  const redacted: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    // Check if the field name matches any sensitive field (case-insensitive)
    const isFieldSensitive = SENSITIVE_FIELDS.some(
      (sensitiveField) => key.toLowerCase() === sensitiveField.toLowerCase()
    )

    if (isFieldSensitive) {
      // Redact the entire field
      redacted[key] = REDACTED_PLACEHOLDER
    } else if (typeof value === 'object' && value !== null) {
      // Recursively redact nested objects
      redacted[key] = redactSensitiveData(value, depth + 1, maxDepth)
    } else {
      // Keep non-sensitive primitive values
      redacted[key] = value
    }
  }

  return redacted
}

/**
 * Type guard to check if changes object needs redaction
 */
export function hasChangesObject(
  entry: unknown
): entry is { changes: Record<string, unknown> | null } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'changes' in entry &&
    (entry.changes === null || typeof entry.changes === 'object')
  )
}

/**
 * Redacts sensitive data from audit log entry changes
 *
 * This is a convenience wrapper specifically for audit log entries
 * that applies redaction to the 'changes' field while preserving
 * other audit metadata (action, entityType, etc.)
 *
 * @param entry - The audit log entry with potential sensitive data
 * @returns A new entry with redacted changes
 *
 * @example
 * ```typescript
 * const entry = {
 *   userId: 'user-123',
 *   action: 'UPDATE',
 *   changes: {
 *     before: { email: 'old@example.com', password: 'oldpass' },
 *     after: { email: 'new@example.com', password: 'newpass' }
 *   }
 * }
 *
 * const redacted = redactAuditLogEntry(entry)
 * // changes.before.password and changes.after.password will be '[REDACTED]'
 * ```
 */
export function redactAuditLogEntry<T extends Record<string, unknown>>(entry: T): T {
  if (!hasChangesObject(entry) || !entry.changes) {
    return entry
  }

  return {
    ...entry,
    changes: redactSensitiveData(entry.changes) as Record<string, unknown>,
  }
}

/**
 * Type-safe wrapper for redacting CreateAuditLogDTO entries
 *
 * This function provides a type-safe way to redact sensitive data from
 * CreateAuditLogDTO objects without requiring type casting.
 *
 * @param entry - The CreateAuditLogDTO entry to redact
 * @returns A new CreateAuditLogDTO with redacted changes
 */
export function redactCreateAuditLogDTO<T extends { changes?: unknown }>(entry: T): T {
  // If no changes field exists or it's nullish, return entry as-is
  if (!entry.changes) {
    return entry
  }

  // Redact the changes object
  const redactedChanges = redactSensitiveData(entry.changes)

  // Return new object with redacted changes
  return {
    ...entry,
    changes: redactedChanges,
  }
}
