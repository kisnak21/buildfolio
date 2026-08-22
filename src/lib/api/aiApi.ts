import realApiClient from './realApiClient'
import type {
  AiGenerationInput,
  AiGenerationResult,
  AiModelId,
  AiTask,
} from '@/lib/aiModels'

export const generateAiContent = async (
  task: AiTask,
  model: AiModelId,
  input: AiGenerationInput,
): Promise<AiGenerationResult> => {
  const response = await realApiClient.post(
    '/ai/generate',
    { task, model, input },
    { timeoutMs: 35_000 },
  )
  return response.data.data as AiGenerationResult
}
