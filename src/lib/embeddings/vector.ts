import type { EmbeddingVector } from "@/lib/embeddings/types";

export function toPgVector(vector: EmbeddingVector) {
  return `[${vector.map((value) => Number(value).toFixed(8)).join(",")}]`;
}

export function weightedAverageVectors(
  vectors: Array<{ vector: EmbeddingVector; weight: number }>
): EmbeddingVector {
  const usableVectors = vectors.filter(
    (item) => item.vector.length > 0 && item.weight > 0
  );

  if (usableVectors.length === 0) {
    return [];
  }

  const dimensions = usableVectors[0].vector.length;
  const totals = new Array<number>(dimensions).fill(0);
  let totalWeight = 0;

  for (const item of usableVectors) {
    totalWeight += item.weight;

    for (let index = 0; index < dimensions; index += 1) {
      totals[index] += item.vector[index] * item.weight;
    }
  }

  return normalizeVector(totals.map((value) => value / totalWeight));
}

function normalizeVector(vector: EmbeddingVector) {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0)
  );

  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}
