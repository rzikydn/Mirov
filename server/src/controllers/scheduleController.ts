import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: { schedules }
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

    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

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

    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        status: status || 'planned',
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

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
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
      return;
    }

    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(location !== undefined && { location }),
        ...(status && { status })
      },
      include: {
        creator: {
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
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
      return;
    }

    await prisma.schedule.delete({
      where: { id: parseInt(id) }
    });

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
