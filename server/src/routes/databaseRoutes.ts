import express from 'express';
import {
  getAllDatabases,
  getDatabaseById,
  createDatabase,
  updateDatabase,
  deleteDatabase
} from '../controllers/databaseController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole, UserRole } from '../middleware/roleCheck';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all databases - all authenticated users can view
router.get('/', getAllDatabases);

// GET single database by ID - all authenticated users can view
router.get('/:id', getDatabaseById);

// CREATE new database - only ADMIN and SUPERUSER
router.post('/', requireRole([UserRole.ADMIN, UserRole.SUPERUSER]), createDatabase);

// UPDATE database - only ADMIN and SUPERUSER
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.SUPERUSER]), updateDatabase);

// DELETE database - only ADMIN and SUPERUSER
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.SUPERUSER]), deleteDatabase);

export default router;
