-- Add approximate nearest-neighbor indexes for pgvector cosine similarity.
CREATE INDEX IF NOT EXISTS "Article_embedding_hnsw_idx"
ON "Article"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "UserProfileEmbedding_embedding_hnsw_idx"
ON "UserProfileEmbedding"
USING hnsw ("embedding" vector_cosine_ops);
