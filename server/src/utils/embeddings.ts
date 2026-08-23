// Gemini Embedding API wrapper + Cosine Similarity for RAG Vector Search
// Uses text-embedding-004 model consistently for both indexing and query

import dotenv from 'dotenv';
dotenv.config();

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIM = 768;
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;
const GEMINI_BATCH_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents`;

function getApiKey(overrideKey?: string): string {
  const key = overrideKey || process.env.GEMINI_API_KEY || '';
  if (!key) {
    throw new Error('GEMINI_API_KEY not set — required for RAG embedding');
  }
  return key;
}

/**
 * Embed a single text string → float[] (768-dim)
 */
export async function embedText(text: string, overrideKey?: string): Promise<number[]> {
  const key = getApiKey(overrideKey);
  const res = await fetch(`${GEMINI_EMBED_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini Embedding API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as any;
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding shape: expected ${EMBEDDING_DIM}, got ${values?.length}`);
  }
  return values;
}

/**
 * Embed multiple texts in a single batch API call.
 * Gemini supports up to 100 texts per batch request.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length === 1) return [await embedText(texts[0])];

  const key = getApiKey();
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const requests = batch.map(text => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
    }));

    const res = await fetch(`${GEMINI_BATCH_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini Batch Embedding error (${res.status}): ${err}`);
    }

    const data = (await res.json()) as any;
    const embeddings = data?.embeddings;
    if (!Array.isArray(embeddings)) {
      throw new Error('Unexpected batch embedding response format');
    }

    for (const emb of embeddings) {
      allEmbeddings.push(emb.values);
    }
  }

  return allEmbeddings;
}

/**
 * Cosine similarity between two vectors.
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
