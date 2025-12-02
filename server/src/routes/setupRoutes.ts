import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate } from '../middleware/authMiddleware';
import { requireSuperuser } from '../middleware/roleCheck';

const router = Router();

// PROTECTED: Only SUPERUSER can access this endpoint
// This endpoint should be removed in production
router.post('/update-roles', authenticate, requireSuperuser, async (_req: Request, res: Response) => {
  try {
    // Update roles
    await db.update(users).set({ role: 'SUPERUSER' }).where(eq(users.email, 'superusermirov'));
    await db.update(users).set({ role: 'ADMIN' }).where(eq(users.email, 'adminmirov'));

    // Get all users to verify
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    }).from(users);

    res.status(200).json({
      success: true,
      message: 'Roles updated successfully',
      data: { users: allUsers }
    });
  } catch (error) {
    console.error('Update roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update roles'
    });
  }
});

export default router;
