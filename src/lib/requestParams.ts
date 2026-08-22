export const parsePositiveInteger = (
  value: string | null,
  fallback: number,
  max?: number,
) => {
  if (value === null) return fallback
  if (!/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) return null
  return max === undefined ? parsed : Math.min(parsed, max)
}

export const isAllowedParam = <T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): value is T | undefined => value === undefined || allowed.includes(value as T)
