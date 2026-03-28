/**
 * Form validation utilities
 */

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9\s\-\+\(\)]{7,20}$/
const PARTY_SIZE_LIMITS = { min: 1, max: 500 }
const TEXT_LIMITS = { min: 1, max: 255 }

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

export function validatePhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.trim())
}

export function validatePartySize(size: number): boolean {
  return Number.isInteger(size) && size >= PARTY_SIZE_LIMITS.min && size <= PARTY_SIZE_LIMITS.max
}

export function validateName(name: string): boolean {
  const trimmed = name.trim()
  return trimmed.length >= TEXT_LIMITS.min && trimmed.length <= TEXT_LIMITS.max
}

export function validateReservationForm(data: {
  customerName?: string
  phone?: string
  email?: string
  guests?: number
  timeSlot?: string
}): ValidationResult {
  const errors: ValidationError[] = []

  if (!data.customerName?.trim()) {
    errors.push({ field: 'customerName', message: 'Customer name is required' })
  } else if (!validateName(data.customerName)) {
    errors.push({ field: 'customerName', message: 'Name must be between 1 and 255 characters' })
  }

  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' })
  } else if (!validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number (7-20 characters)' })
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  if (data.guests !== undefined && !validatePartySize(data.guests)) {
    errors.push({ field: 'guests', message: 'Party size must be between 1 and 500' })
  }

  if (!data.timeSlot) {
    errors.push({ field: 'timeSlot', message: 'Time slot is required' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateGuestForm(data: {
  name?: string
  phone?: string
  email?: string
  partySize?: number
  dateTime?: string
}): ValidationResult {
  return validateReservationForm({
    customerName: data.name,
    phone: data.phone,
    email: data.email,
    guests: data.partySize,
    timeSlot: data.dateTime ? 'valid' : undefined,
  })
}

export function getFirstError(errors: ValidationError[]): string | null {
  return errors[0]?.message || null
}
