import { Request, Response } from 'express';
import { PrismaClient, HistoryAction, HistoryTarget, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Get all history (with pagination)
export const getAllHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history'
    });
  }
};

// Create history entry
export const createHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, userName, userRole, action, target, targetName, description } = req.body;

    // Validate required fields
    if (!userId || !userName || !userRole || !action || !target || !description) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }

    // Validate enums
    if (!['CREATE', 'EDIT', 'DELETE'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'Invalid action type'
      });
      return;
    }

    if (!['NOTE', 'DATABASE', 'SCHEDULE'].includes(target)) {
      res.status(400).json({
        success: false,
        message: 'Invalid target type'
      });
      return;
    }

    const historyEntry = await prisma.history.create({
      data: {
        userId,
        userName,
        userRole: userRole as Role,
        action: action as HistoryAction,
        target: target as HistoryTarget,
        targetName,
        description
      }
    });

    res.status(201).json({
      success: true,
      data: historyEntry
    });
  } catch (error) {
    console.error('Error creating history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create history entry'
    });
  }
};

// Get last change (most recent history entry)
export const getLastChange = async (_req: Request, res: Response): Promise<void> => {
  try {
    const lastChange = await prisma.history.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: lastChange
    });
  } catch (error) {
    console.error('Error fetching last change:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch last change'
    });
  }
};

// Delete single history entry (SUPERUSER only)
export const deleteHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user; // From auth middleware

    console.log('🔍 Delete history request:');
    console.log('   Entry ID:', id);
    console.log('   User from token:', user);
    console.log('   User role:', user?.role);
    console.log('   Role type:', typeof user?.role);
    console.log('   Is SUPERUSER?:', user?.role === 'SUPERUSER');

    // Check if user is SUPERUSER
    if (!user || user.role !== 'SUPERUSER') {
      console.log('❌ Authorization failed - User role:', user?.role);
      res.status(403).json({
        success: false,
        message: 'Only SUPERUSER can delete history entries'
      });
      return;
    }

    // Check if history entry exists
    const historyEntry = await prisma.history.findUnique({
      where: { id: parseInt(id) }
    });

    if (!historyEntry) {
      res.status(404).json({
        success: false,
        message: 'History entry not found'
      });
      return;
    }

    // Delete the history entry
    await prisma.history.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'History entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history entry'
    });
  }
};

// Clear old history (keep last N entries)
export const clearOldHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const keepLast = parseInt(req.query.keepLast as string) || 50;

    // Get IDs of entries to keep
    const entriesToKeep = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: keepLast,
      select: {
        id: true
      }
    });

    const idsToKeep = entriesToKeep.map(entry => entry.id);

    // Delete entries not in the keep list
    const deleted = await prisma.history.deleteMany({
      where: {
        id: {
          notIn: idsToKeep
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${deleted.count} old history entries`,
      kept: keepLast
    });
  } catch (error) {
    console.error('Error clearing old history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear old history'
    });
  }
};
