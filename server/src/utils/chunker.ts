// Structure-Aware Chunking Engine for RAG Pipeline
// Splits extracted sections into chunks of ~300-800 tokens with overlap

import { ExtractedSection } from './extractors';

export interface Chunk {
  content: string;
  heading: string;
  pageOrSlide?: number;
  tokenCount: number;
  chunkIndex: number;
}

const TARGET_CHUNK_TOKENS = 500;
const MAX_CHUNK_TOKENS = 800;
const MIN_CHUNK_TOKENS = 50;
const OVERLAP_RATIO = 0.15;

/**
 * Rough token count — ~4 chars per token for mixed Indonesian/English text.
 * Good enough for chunking; not worth pulling tiktoken dependency for this.
 */
function estimateTokens(text: string): number {
  // ponytail: naive char/4 estimator — upgrade to tiktoken if precision matters
  return Math.ceil(text.length / 4);
}

/**
 * Detect if a line looks like a table row (tab-separated or pipe-separated)
 */
function isTableRow(line: string): boolean {
  return (line.includes('\t') && line.split('\t').length >= 3) ||
         (line.includes('|') && line.split('|').length >= 3);
}

/**
 * Chunk a single section's content by paragraphs, preserving tables as units.
 * Returns chunks within the target token range with overlap.
 */
function chunkSectionContent(
  content: string,
  heading: string,
  pageOrSlide: number | undefined,
  startIndex: number
): Chunk[] {
  const lines = content.split('\n');
  const chunks: Chunk[] = [];

  // Group lines into logical blocks: paragraphs and table blocks
  const blocks: string[] = [];
  let currentTableBlock: string[] = [];

  for (const line of lines) {
    if (isTableRow(line)) {
      currentTableBlock.push(line);
    } else {
      // Flush table block as single unit
      if (currentTableBlock.length > 0) {
        blocks.push(currentTableBlock.join('\n'));
        currentTableBlock = [];
      }
      if (line.trim()) {
        blocks.push(line.trim());
      }
    }
  }
  if (currentTableBlock.length > 0) {
    blocks.push(currentTableBlock.join('\n'));
  }

  // Accumulate blocks into chunks
  let currentChunkLines: string[] = [];
  let currentTokens = 0;

  for (const block of blocks) {
    const blockTokens = estimateTokens(block);

    // If a single block exceeds max, it becomes its own chunk (e.g. large table)
    if (blockTokens > MAX_CHUNK_TOKENS) {
      // Flush current
      if (currentChunkLines.length > 0) {
        const text = currentChunkLines.join('\n');
        if (estimateTokens(text) >= MIN_CHUNK_TOKENS) {
          chunks.push({
            content: text,
            heading,
            pageOrSlide,
            tokenCount: estimateTokens(text),
            chunkIndex: startIndex + chunks.length,
          });
        }
        currentChunkLines = [];
        currentTokens = 0;
      }
      // Add oversized block as its own chunk
      chunks.push({
        content: block,
        heading,
        pageOrSlide,
        tokenCount: blockTokens,
        chunkIndex: startIndex + chunks.length,
      });
      continue;
    }

    if (currentTokens + blockTokens > TARGET_CHUNK_TOKENS && currentChunkLines.length > 0) {
      const text = currentChunkLines.join('\n');
      if (estimateTokens(text) >= MIN_CHUNK_TOKENS) {
        chunks.push({
          content: text,
          heading,
          pageOrSlide,
          tokenCount: estimateTokens(text),
          chunkIndex: startIndex + chunks.length,
        });
      }

      // Overlap: keep last ~15% of lines for next chunk
      const overlapLines = Math.max(1, Math.floor(currentChunkLines.length * OVERLAP_RATIO));
      currentChunkLines = currentChunkLines.slice(-overlapLines);
      currentTokens = estimateTokens(currentChunkLines.join('\n'));
    }

    currentChunkLines.push(block);
    currentTokens += blockTokens;
  }

  // Flush remaining
  if (currentChunkLines.length > 0) {
    const text = currentChunkLines.join('\n');
    if (estimateTokens(text) >= MIN_CHUNK_TOKENS) {
      chunks.push({
        content: text,
        heading,
        pageOrSlide,
        tokenCount: estimateTokens(text),
        chunkIndex: startIndex + chunks.length,
      });
    }
  }

  return chunks;
}

/**
 * Main chunking function: takes extracted sections, returns all chunks.
 * Preserves heading/page metadata per chunk.
 */
export function chunkDocument(sections: ExtractedSection[]): Chunk[] {
  const allChunks: Chunk[] = [];

  for (const section of sections) {
    if (!section.content.trim()) continue;

    const sectionTokens = estimateTokens(section.content);

    // Small section → single chunk
    if (sectionTokens <= MAX_CHUNK_TOKENS) {
      if (sectionTokens >= MIN_CHUNK_TOKENS) {
        allChunks.push({
          content: section.content,
          heading: section.heading,
          pageOrSlide: section.pageOrSlide,
          tokenCount: sectionTokens,
          chunkIndex: allChunks.length,
        });
      }
      continue;
    }

    // Large section → split into multiple chunks
    const sectionChunks = chunkSectionContent(
      section.content,
      section.heading,
      section.pageOrSlide,
      allChunks.length
    );
    allChunks.push(...sectionChunks);
  }

  // Re-index
  allChunks.forEach((c, i) => { c.chunkIndex = i; });
  return allChunks;
}
