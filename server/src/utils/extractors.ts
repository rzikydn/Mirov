// Document Extraction Engine for RAG Pipeline
// Extracts structured text from PDF, DOCX, and PPTX files

import mammoth from 'mammoth';
import JSZip from 'jszip';

// pdf-parse doesn't export ESM default properly in some CJS bundles
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ExtractedSection {
  heading: string;
  content: string;
  pageOrSlide?: number;
}

/**
 * Extract structured text from a PDF buffer.
 * Uses pdf-parse (pdf.js wrapper). Returns per-page sections.
 */
export async function extractPDF(buffer: Buffer): Promise<ExtractedSection[]> {
  const data = await pdfParse(buffer);
  if (!data.text || !data.text.trim()) {
    // ponytail: OCR not included in phase 1 — return empty with note
    return [{ heading: 'PDF (no text found — may be scanned)', content: '', pageOrSlide: 1 }];
  }

  // pdf-parse doesn't give per-page splits reliably, so we split on form-feed or large whitespace gaps
  const rawPages = data.text.split(/\f/);
  const sections: ExtractedSection[] = [];

  for (let i = 0; i < rawPages.length; i++) {
    const pageText = rawPages[i].trim();
    if (!pageText) continue;

    // Try to extract a heading from the first non-empty line
    const lines = pageText.split('\n').filter((l: string) => l.trim());
    const heading = lines[0]?.trim().slice(0, 200) || `Halaman ${i + 1}`;
    const content = lines.join('\n').trim();

    sections.push({ heading, content, pageOrSlide: i + 1 });
  }

  return sections.length > 0 ? sections : [{ heading: 'PDF Document', content: data.text.trim(), pageOrSlide: 1 }];
}

/**
 * Extract structured text from a DOCX buffer.
 * Uses mammoth to convert to HTML, then parses headings/paragraphs/tables.
 */
export async function extractDOCX(buffer: Buffer): Promise<ExtractedSection[]> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  if (!html || !html.trim()) {
    return [{ heading: 'DOCX (empty)', content: '' }];
  }

  const sections: ExtractedSection[] = [];
  let currentHeading = 'Dokumen';
  let currentContent: string[] = [];

  // Simple HTML parser — split by heading tags
  // mammoth outputs: <h1>, <h2>, <h3>, <p>, <table>, <ul>, <ol>
  const parts = html.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>)/gi);

  for (const part of parts) {
    const headingMatch = part.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
    if (headingMatch) {
      // Flush previous section
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n').trim(),
        });
        currentContent = [];
      }
      currentHeading = stripHtml(headingMatch[1]).trim() || 'Section';
    } else {
      const text = stripHtml(part).trim();
      if (text) {
        currentContent.push(text);
      }
    }
  }

  // Flush last section
  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join('\n').trim(),
    });
  }

  return sections.length > 0 ? sections : [{ heading: 'DOCX Document', content: stripHtml(html).trim() }];
}

/**
 * Extract text from a PPTX buffer.
 * Parses the ZIP structure to read slide XML + speaker notes.
 */
export async function extractPPTX(buffer: Buffer): Promise<ExtractedSection[]> {
  const zip = await JSZip.loadAsync(buffer);
  const sections: ExtractedSection[] = [];

  // Find slide files (ppt/slides/slide1.xml, slide2.xml, ...)
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const slideNum = parseInt(slidePath.match(/slide(\d+)/)?.[1] || '0');
    const slideXml = await zip.files[slidePath].async('text');
    const slideText = extractTextFromXml(slideXml);

    // Try to get speaker notes
    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let notesText = '';
    if (zip.files[notesPath]) {
      const notesXml = await zip.files[notesPath].async('text');
      notesText = extractTextFromXml(notesXml);
    }

    const combined = [slideText, notesText ? `[Speaker Notes] ${notesText}` : '']
      .filter(Boolean)
      .join('\n');

    if (combined.trim()) {
      sections.push({
        heading: `Slide ${slideNum}`,
        content: combined.trim(),
        pageOrSlide: slideNum,
      });
    }
  }

  return sections.length > 0 ? sections : [{ heading: 'PPTX (empty)', content: '' }];
}

/** Strip HTML tags to plain text */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|tr|td|th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract all text content from Office Open XML (used by PPTX) */
function extractTextFromXml(xml: string): string {
  // Office XML stores text in <a:t> tags
  const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
  if (!matches) return '';

  return matches
    .map(m => m.replace(/<[^>]+>/g, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
