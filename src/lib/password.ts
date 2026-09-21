export const PASSWORD_REQUIREMENTS = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    key: 'uppercase',
    label: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: 'lowercase',
    label: 'One lowercase letter',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: 'One number',
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    key: 'special',
    label: 'One special character',
    test: (password: string) => /[^A-Za-z0-9\s]/.test(password),
  },
] as const

export const getPasswordRequirementStatus = (password: string) =>
  PASSWORD_REQUIREMENTS.map(({ key, label, test }) => ({
    key,
    label,
    met: test(password),
  }))

export const getPasswordValidationError = (password: string): string | null => {
  const unmet = getPasswordRequirementStatus(password)
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.label.toLowerCase())

  return unmet.length > 0 ? `Password needs ${unmet.join(', ')}.` : null
}

export const isPasswordStrong = (password: string): boolean =>
  getPasswordValidationError(password) === null
