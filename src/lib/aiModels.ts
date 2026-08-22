export const AI_MODELS = [
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: 'Dots3 Note',
    note: 'Balanced writing and reasoning',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'Nemotron 3.5 Lightning',
    note: 'Fast, direct drafts',
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B',
    note: 'Detailed technical copy',
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Gemma 4 26B',
    note: 'Concise project writing',
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
