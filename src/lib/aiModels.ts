export type AiModelProvider = 'groq' | 'openrouter'

export const AI_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    note: 'Primary fast reasoning model via Groq',
    provider: 'groq',
    supportsJson: true,
    supportsJsonSchema: true,
    reasoningEffort: 'low',
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: 'GLM 5.2',
    note: 'Fallback technical reasoning via OpenRouter',
    provider: 'openrouter',
    supportsJson: true,
    supportsJsonSchema: true,
    reasoningEffort: 'low',
  },
] as const

export type AiModelConfig = (typeof AI_MODELS)[number]

export const PROJECT_CATEGORIES = [
  'SaaS',
  'AI',
  'Web App',
  'Mobile App',
  'Open Source',
  'Game',
] as const

export type AiModelId = (typeof AI_MODELS)[number]['id']
export type AiDocumentTask = 'prd' | 'design' | 'styleGuide' | 'readme'
export type AiTask = 'description' | 'ideas' | AiDocumentTask

export const getModelConfig = (id: AiModelId): AiModelConfig =>
  AI_MODELS.find((model) => model.id === id) as AiModelConfig

export interface AiGenerationInput {
  title?: string
  summary?: string
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
      task: 'description' | AiDocumentTask
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
