import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin, requireSuperuser } from '../middleware/roleCheck';
import {
  getAllHistory,
  createHistory,
  getLastChange,
  clearOldHistory,
  deleteHistory
} from '../controllers/historyController';

const router = express.Router();

// GET /api/history/last - Get last change (must be before /)
router.get('/last', authenticate, getLastChange);

// DELETE /api/history/clear - Clear old history (ADMIN or SUPERUSER only)
router.delete('/clear', authenticate, requireAdmin, clearOldHistory);

// DELETE /api/history/:id - Delete single history entry (SUPERUSER only)
router.delete('/:id', authenticate, requireSuperuser, deleteHistory);

// GET /api/history - Get all history
router.get('/', authenticate, getAllHistory);

// POST /api/history - Create history entry
router.post('/', authenticate, createHistory);

export default router;
