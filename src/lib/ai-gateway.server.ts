import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    // Lovable AI Gateway / Gemini supports JSON Schema response_format.
    // Without this, AI SDK falls back to json_object and the model returns
    // free-form keys that fail Zod validation.
    supportsStructuredOutputs: true,
  });
}

