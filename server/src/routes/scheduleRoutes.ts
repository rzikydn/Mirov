import { Router } from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
} from '../controllers/scheduleController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin, requireAuth, UserRole } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/schedules
 * Access: All authenticated users (SUPERUSER, ADMIN, UMUM)
 * Description: View all schedules
 */
router.get('/', requireAuth, getAllSchedules);

/**
 * GET /api/schedules/:id
 * Access: All authenticated users (SUPERUSER, ADMIN, UMUM)
 * Description: View specific schedule
 */
router.get('/:id', requireAuth, getScheduleById);

/**
 * POST /api/schedules
 * Access: ADMIN and SUPERUSER only
 * Description: Create new schedule
 */
router.post('/', requireAdmin, createSchedule);

/**
 * PUT /api/schedules/:id
 * Access: ADMIN and SUPERUSER only
 * Description: Update existing schedule
 */
router.put('/:id', requireAdmin, updateSchedule);

/**
 * DELETE /api/schedules/:id
 * Access: ADMIN and SUPERUSER only
 * Description: Delete schedule
 */
router.delete('/:id', requireAdmin, deleteSchedule);

export default router;
