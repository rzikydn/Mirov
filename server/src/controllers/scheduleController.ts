import { Request, Response } from 'express';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db';
import { schedules, users } from '../db/schema';

export const getAllSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allSchedules = await db
      .select({
        id: schedules.id,
        title: schedules.title,
        description: schedules.description,
        startDate: schedules.startDate,
        endDate: schedules.endDate,
        location: schedules.location,
        status: schedules.status,
        createdBy: schedules.createdBy,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.createdBy, users.id))
      .orderBy(asc(schedules.startDate));

    res.status(200).json({
      success: true,
      data: { schedules: allSchedules }
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [schedule] = await db
      .select({
        id: schedules.id,
        title: schedules.title,
        description: schedules.description,
        startDate: schedules.startDate,
        endDate: schedules.endDate,
        location: schedules.location,
        status: schedules.status,
        createdBy: schedules.createdBy,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.createdBy, users.id))
      .where(eq(schedules.id, parseInt(id)))
      .limit(1);

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { schedule }
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, startDate, endDate, location, status } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!title || !startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
      return;
    }

    const [result] = await db.insert(schedules).values({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      status: status || 'planned',
      createdBy: userId
    }).$returningId();

    // Get the created schedule with user data
    const [schedule] = await db
      .select({
        id: schedules.id,
        title: schedules.title,
        description: schedules.description,
        startDate: schedules.startDate,
        endDate: schedules.endDate,
        location: schedules.location,
        status: schedules.status,
        createdBy: schedules.createdBy,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.createdBy, users.id))
      .where(eq(schedules.id, result.id))
      .limit(1);

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: { schedule }
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, location, status } = req.body;

    // Check if schedule exists
    const [existingSchedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, parseInt(id)))
      .limit(1);

    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (status) updateData.status = status;

    await db
      .update(schedules)
      .set(updateData)
      .where(eq(schedules.id, parseInt(id)));

    // Get the updated schedule with user data
    const [schedule] = await db
      .select({
        id: schedules.id,
        title: schedules.title,
        description: schedules.description,
        startDate: schedules.startDate,
        endDate: schedules.endDate,
        location: schedules.location,
        status: schedules.status,
        createdBy: schedules.createdBy,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(schedules)
      .leftJoin(users, eq(schedules.createdBy, users.id))
      .where(eq(schedules.id, parseInt(id)))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: { schedule }
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const [existingSchedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, parseInt(id)))
      .limit(1);

    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
      return;
    }

    await db
      .delete(schedules)
      .where(eq(schedules.id, parseInt(id)));

    res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
