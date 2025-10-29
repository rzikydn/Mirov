import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getAllHistory,
  createHistory,
  getLastChange,
  clearOldHistory
} from '../controllers/historyController';

const router = express.Router();

// GET /api/history/last - Get last change (must be before /)
router.get('/last', authenticate, getLastChange);

// DELETE /api/history/clear - Clear old history
router.delete('/clear', authenticate, clearOldHistory);

// GET /api/history - Get all history
router.get('/', authenticate, getAllHistory);

// POST /api/history - Create history entry
router.post('/', authenticate, createHistory);

export default router;
