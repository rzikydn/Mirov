import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/noteController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notes
 * Access: All authenticated users
 * Description: View all notes
 */
router.get('/', getAllNotes);

/**
 * GET /api/notes/:id
 * Access: All authenticated users
 * Description: View specific note
 */
router.get('/:id', getNoteById);

/**
 * POST /api/notes
 * Access: All authenticated users
 * Description: Create new note
 */
router.post('/', createNote);

/**
 * PUT /api/notes/:id
 * Access: All authenticated users (can update own notes)
 * Description: Update existing note
 */
router.put('/:id', updateNote);

/**
 * DELETE /api/notes/:id
 * Access: All authenticated users (can delete own notes)
 * Description: Delete note
 */
router.delete('/:id', deleteNote);

export default router;
