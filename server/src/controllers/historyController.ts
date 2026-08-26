import { Request, Response } from 'express';
import { eq, desc, notInArray } from 'drizzle-orm';
import { db } from '../db';
import { history, users, type HistoryAction, type HistoryTarget, type Role } from '../db/schema';

// Get all history (with pagination)
export const getAllHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const limitParam = req.query.limit as string;
    const limit = limitParam !== undefined ? parseInt(limitParam) : 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const baseQuery = db
      .select({
        id: history.id,
        userId: history.userId,
        userName: history.userName,
        userRole: history.userRole,
        action: history.action,
        target: history.target,
        targetName: history.targetName,
        description: history.description,
        createdAt: history.createdAt,
        userAvatar: users.avatar,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          avatar: users.avatar
        }
      })
      .from(history)
      .leftJoin(users, eq(history.userId, users.id))
      .orderBy(desc(history.createdAt))
      .offset(offset);

    const allHistory = limit > 0 ? await baseQuery.limit(limit) : await baseQuery;

    res.status(200).json({
      success: true,
      data: allHistory
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

    const [result] = await db.insert(history).values({
      userId,
      userName,
      userRole: userRole as Role,
      action: action as HistoryAction,
      target: target as HistoryTarget,
      targetName,
      description
    }).$returningId();

    // Get the created history entry
    const [historyEntry] = await db
      .select()
      .from(history)
      .where(eq(history.id, result.id))
      .limit(1);

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
    const [lastChange] = await db
      .select()
      .from(history)
      .orderBy(desc(history.createdAt))
      .limit(1);

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

    // Check if user is SUPERUSER only
    if (!user || user.role !== 'SUPERUSER') {
      console.log('❌ Authorization failed - User role:', user?.role);
      res.status(403).json({
        success: false,
        message: 'Only SUPERUSER can delete history entries'
      });
      return;
    }

    // Check if history entry exists
    const [historyEntry] = await db
      .select()
      .from(history)
      .where(eq(history.id, parseInt(id)))
      .limit(1);

    if (!historyEntry) {
      res.status(404).json({
        success: false,
        message: 'History entry not found'
      });
      return;
    }

    // Delete the history entry
    await db
      .delete(history)
      .where(eq(history.id, parseInt(id)));

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
    const entriesToKeep = await db
      .select({ id: history.id })
      .from(history)
      .orderBy(desc(history.createdAt))
      .limit(keepLast);

    const idsToKeep = entriesToKeep.map(entry => entry.id);

    // Delete entries not in the keep list
    if (idsToKeep.length > 0) {
      await db
        .delete(history)
        .where(notInArray(history.id, idsToKeep));
    } else {
      // If no entries to keep, delete all
      await db.delete(history);
    }

    // Count remaining entries to calculate deleted count
    const remainingEntries = await db
      .select({ id: history.id })
      .from(history);
    const deletedCount = Math.max(0, entriesToKeep.length - remainingEntries.length);

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} old history entries`,
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
