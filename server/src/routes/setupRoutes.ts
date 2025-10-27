import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Temporary endpoint to update user roles
router.post('/update-roles', async (_req: Request, res: Response) => {
  try {
    // Update roles
    await prisma.user.update({
      where: { email: 'superusermirov' },
      data: { role: 'SUPERUSER' }
    });

    await prisma.user.update({
      where: { email: 'adminmirov' },
      data: { role: 'ADMIN' }
    });

    // Get all users to verify
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Roles updated successfully',
      data: { users }
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
