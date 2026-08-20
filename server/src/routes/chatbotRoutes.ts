import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getFaqs,
  addFaq,
  deleteFaq,
  getRagDocuments,
  addRagDocument,
  deleteRagDocument,
  getVisitorSessions,
  deleteVisitorSession,
  addAdminReply,
  processChatMessage,
  getAnalytics,
} from '../controllers/chatbotController';

const router = Router();

// Settings & Config
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// FAQ Management
router.get('/faqs', getFaqs);
router.post('/faqs', addFaq);
router.delete('/faqs/:id', deleteFaq);

// RAG Knowledge Base Documents & Chunks
router.get('/rag/documents', getRagDocuments);
router.post('/rag/upload', addRagDocument);
router.delete('/rag/documents/:id', deleteRagDocument);

// Visitor Sessions & Chat Memory
router.get('/sessions', getVisitorSessions);
router.delete('/sessions/:sessionId', deleteVisitorSession);
router.post('/admin-reply', addAdminReply);

// Process Chat Message (RAG + FAQ + Memory)
router.post('/chat', processChatMessage);

// Analytics & Dashboard Logs
router.get('/analytics', getAnalytics);

export default router;
