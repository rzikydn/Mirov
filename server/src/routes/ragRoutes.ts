// RAG Knowledge Base API Routes

import { Router } from 'express';
import {
  uploadDocument,
  uploadMiddleware,
  addFAQ,
  listDocuments,
  deleteDocument,
  retrieveChunks,
  debugQuery,
} from '../controllers/ragController';

const router = Router();

// Document upload (multipart form)
router.post('/upload', uploadMiddleware, uploadDocument);

// FAQ input
router.post('/faq', addFAQ);

// List all documents
router.get('/documents', listDocuments);

// Delete a document
router.delete('/documents/:id', deleteDocument);

// Semantic retrieval (for chat context injection)
router.post('/retrieve', retrieveChunks);

// Debug query (skip LLM, show raw similarity scores)
router.post('/debug-query', debugQuery);

export default router;
