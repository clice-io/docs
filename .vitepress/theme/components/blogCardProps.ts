export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function createRequiredTextProp() {
  return {
    type: String,
    required: true,
    validator: isNonEmptyString
  }
}

export function assertRequiredTextProps(
  componentName: string,
  props: Record<string, unknown>
): void {
  for (const [field, value] of Object.entries(props)) {
    if (!isNonEmptyString(value)) {
      throw new Error(
        `[${componentName}] Required field "${field}" must be a non-empty string.`
      )
    }
  }
}
