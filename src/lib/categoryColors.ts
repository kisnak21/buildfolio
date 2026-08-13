export const CATEGORY_COLORS: Record<string, string> = {
  SaaS: 'bg-secondary',
  AI: 'bg-purpleSoft text-white',
  'Web App': 'bg-accentSoft',
  'Mobile App': 'bg-dangerSoft',
  'Open Source': 'bg-warningSoft',
  Game: 'bg-greenMid',
}

export const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] || 'bg-secondary'

export const isCategoryLightText = (category: string) =>
  CATEGORY_COLORS[category]?.includes('text-white') ?? false