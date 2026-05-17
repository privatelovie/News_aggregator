import type { EmbeddingVector } from "@/lib/embeddings/types";

type OpenAIEmbeddingResponse = {
  data?: Array<{
    embedding: number[];
  }>;
  error?: {
    message?: string;
  };
};

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

export function getEmbeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
}

export async function createEmbedding(input: string): Promise<EmbeddingVector> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getEmbeddingModel(),
      input: normalizeEmbeddingInput(input),
      dimensions: 1536
    })
  });

  const payload = (await response.json()) as OpenAIEmbeddingResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `OpenAI embeddings request failed with ${response.status}.`
    );
  }

  const embedding = payload.data?.[0]?.embedding;

  if (!embedding?.length) {
    throw new Error("OpenAI returned an empty embedding.");
  }

  return embedding;
}

function normalizeEmbeddingInput(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 24000);
}
