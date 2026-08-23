export const AI_MODELS = [
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3 Note',
    note: 'Balanced writing and reasoning',
    supportsJson: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    note: 'Fast, direct drafts',
    supportsJson: false,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super',
    note: 'Strong structured output',
    supportsJson: true,
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'GLM 5.2',
    note: 'Detailed technical copy',
    supportsJson: true,
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Gemma 4 26B',
    note: 'Concise project writing',
    supportsJson: true,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Gemma 4 31B',
    note: 'Reliable structured drafts',
    supportsJson: true,
  },
] as const

export const PROJECT_CATEGORIES = [
  'SaaS',
  'AI',
  'Web App',
  'Mobile App',
  'Open Source',
  'Game',
] as const

export type AiModelId = (typeof AI_MODELS)[number]['id']
export type AiTask = 'description' | 'readme' | 'ideas'

export interface AiGenerationInput {
  title?: string
  description?: string
  category?: string
  technologies?: string[]
  github?: string
  live?: string
  interests?: string
  experience?: 'beginner' | 'intermediate' | 'advanced'
}

export interface AiIdea {
  title: string
  summary: string
  description: string
  category: string
  technologies: string[]
}

export type AiGenerationResult =
  | {
      task: 'description' | 'readme'
      text: string
      model: string
    }
  | {
      task: 'ideas'
      ideas: AiIdea[]
      model: string
    }

export const DEFAULT_AI_MODEL: AiModelId = AI_MODELS[0].id

const modelIds = new Set<string>(AI_MODELS.map((model) => model.id))

export const isAiModelId = (value: unknown): value is AiModelId =>
  typeof value === 'string' && modelIds.has(value)
