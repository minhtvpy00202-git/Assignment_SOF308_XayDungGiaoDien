/**
 * Validates that a required field is not empty or whitespace-only
 * @param value - The value to validate
 * @returns true if valid (non-empty and not just whitespace), false otherwise
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Validates email format
 * @param email - The email to validate
 * @returns true if valid email format, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates form data for empty required fields
 * @param data - Object with string values to validate
 * @param requiredFields - Array of field names that are required
 * @returns Object with validation errors, empty if all valid
 */
export function validateFormData(
  data: Record<string, string>,
  requiredFields: string[]
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const field of requiredFields) {
    if (!data[field] || !validateRequired(data[field])) {
      errors[field] = `${field} is required and cannot be empty`
    }
  }

  return errors
}
