import { describe, expect, it } from 'vitest'
import {
  getPasswordRequirementStatus,
  getPasswordValidationError,
  isPasswordStrong,
} from '@/lib/password'

describe('password requirements', () => {
  it('accepts a password that satisfies every requirement', () => {
    expect(isPasswordStrong('Buildfolio9!')).toBe(true)
    expect(getPasswordValidationError('Buildfolio9!')).toBeNull()
  })

  it('reports each unmet requirement for an incomplete password', () => {
    const password = 'buildfolio'

    expect(getPasswordRequirementStatus(password)).toEqual([
      { key: 'length', label: 'At least 8 characters', met: true },
      { key: 'uppercase', label: 'One uppercase letter', met: false },
      { key: 'lowercase', label: 'One lowercase letter', met: true },
      { key: 'number', label: 'One number', met: false },
      { key: 'special', label: 'One special character', met: false },
    ])
    expect(getPasswordValidationError(password)).toBe(
      'Password needs one uppercase letter, one number, one special character.',
    )
  })
})
