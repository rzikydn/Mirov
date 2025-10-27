import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all databases
export const getAllDatabases = async (req: Request, res: Response): Promise<void> => {
  try {
    const databases = await prisma.database.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    res.json({ success: true, data: databases });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch databases' });
  }
};

// Get single database by ID
export const getDatabaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const database = await prisma.database.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!database) {
      res.status(404).json({ success: false, message: 'Database not found' });
      return;
    }

    res.json({ success: true, data: database });
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch database' });
  }
};

// Create new database
export const createDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, icon, columns, rows } = req.body;
    const userId = req.user!.userId;

    const database = await prisma.database.create({
      data: {
        name: name || 'Untitled Database',
        description: description || null,
        icon: icon || null,
        columns: columns || [],
        rows: rows || [],
        createdBy: userId
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    res.status(201).json({ success: true, data: database });
  } catch (error) {
    console.error('Error creating database:', error);
    res.status(500).json({ success: false, message: 'Failed to create database' });
  }
};

// Update database
export const updateDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, icon, columns, rows } = req.body;

    const database = await prisma.database.findUnique({
      where: { id: parseInt(id) }
    });

    if (!database) {
      res.status(404).json({ success: false, message: 'Database not found' });
      return;
    }

    const updatedDatabase = await prisma.database.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : database.name,
        description: description !== undefined ? description : database.description,
        icon: icon !== undefined ? icon : database.icon,
        columns: columns !== undefined ? columns : database.columns,
        rows: rows !== undefined ? rows : database.rows
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    res.json({ success: true, data: updatedDatabase });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({ success: false, message: 'Failed to update database' });
  }
};

// Delete database
export const deleteDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const database = await prisma.database.findUnique({
      where: { id: parseInt(id) }
    });

    if (!database) {
      res.status(404).json({ success: false, message: 'Database not found' });
      return;
    }

    await prisma.database.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Database deleted successfully' });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ success: false, message: 'Failed to delete database' });
  }
};
