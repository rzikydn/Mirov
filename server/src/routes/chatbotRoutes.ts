import { Router } from 'express';
import {
  getFaqs,
  upsertFaq,
  deleteFaq,
  resetFaqs,
  getSettings,
  updateSettings,
  getSessions,
  saveSession,
  markSessionAsRead,
  deleteSession,
  getAnalytics,
  updateAnalytics,
} from '../controllers/chatbotController';

const router = Router();

// FAQ endpoints
router.get('/faqs', getFaqs);
router.post('/faqs', upsertFaq);
router.delete('/faqs/:id', deleteFaq);
router.post('/faqs/reset', resetFaqs);

// Settings endpoints
router.get('/settings', getSettings);
router.post('/settings', updateSettings);

// Visitor Chat Sessions endpoints
router.get('/sessions', getSessions);
router.post('/sessions', saveSession);
router.post('/sessions/:id/read', markSessionAsRead);
router.delete('/sessions/:id', deleteSession);

// Analytics endpoints
router.get('/analytics', getAnalytics);
router.post('/analytics', updateAnalytics);

export default router;
