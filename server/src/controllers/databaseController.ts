import { Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { databases, users } from '../db/schema';

// Get all databases
export const getAllDatabases = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allDatabases = await db
      .select({
        id: databases.id,
        name: databases.name,
        description: databases.description,
        icon: databases.icon,
        columns: databases.columns,
        rows: databases.rows,
        columnWidths: databases.columnWidths,
        createdBy: databases.createdBy,
        createdAt: databases.createdAt,
        updatedAt: databases.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(databases)
      .leftJoin(users, eq(databases.createdBy, users.id))
      .orderBy(desc(databases.createdAt));

    res.json({ success: true, data: allDatabases });
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch databases' });
  }
};

// Get single database by ID
export const getDatabaseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [database] = await db
      .select({
        id: databases.id,
        name: databases.name,
        description: databases.description,
        icon: databases.icon,
        columns: databases.columns,
        rows: databases.rows,
        columnWidths: databases.columnWidths,
        createdBy: databases.createdBy,
        createdAt: databases.createdAt,
        updatedAt: databases.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(databases)
      .leftJoin(users, eq(databases.createdBy, users.id))
      .where(eq(databases.id, parseInt(id)))
      .limit(1);

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

    const [result] = await db.insert(databases).values({
      name: name || 'Untitled Database',
      description: description || null,
      icon: icon || null,
      columns: columns || [],
      rows: rows || [],
      createdBy: userId
    }).$returningId();

    // Get the created database with user data
    const [database] = await db
      .select({
        id: databases.id,
        name: databases.name,
        description: databases.description,
        icon: databases.icon,
        columns: databases.columns,
        rows: databases.rows,
        columnWidths: databases.columnWidths,
        createdBy: databases.createdBy,
        createdAt: databases.createdAt,
        updatedAt: databases.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(databases)
      .leftJoin(users, eq(databases.createdBy, users.id))
      .where(eq(databases.id, result.id))
      .limit(1);

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
    const { name, description, icon, columns, rows, columnWidths } = req.body;

    const [existingDatabase] = await db
      .select()
      .from(databases)
      .where(eq(databases.id, parseInt(id)))
      .limit(1);

    if (!existingDatabase) {
      res.status(404).json({ success: false, message: 'Database not found' });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (columns !== undefined) updateData.columns = columns;
    if (rows !== undefined) updateData.rows = rows;
    if (columnWidths !== undefined) updateData.columnWidths = columnWidths;

    await db
      .update(databases)
      .set(updateData)
      .where(eq(databases.id, parseInt(id)));

    // Get the updated database with user data
    const [updatedDatabase] = await db
      .select({
        id: databases.id,
        name: databases.name,
        description: databases.description,
        icon: databases.icon,
        columns: databases.columns,
        rows: databases.rows,
        columnWidths: databases.columnWidths,
        createdBy: databases.createdBy,
        createdAt: databases.createdAt,
        updatedAt: databases.updatedAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(databases)
      .leftJoin(users, eq(databases.createdBy, users.id))
      .where(eq(databases.id, parseInt(id)))
      .limit(1);

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

    const [existingDatabase] = await db
      .select()
      .from(databases)
      .where(eq(databases.id, parseInt(id)))
      .limit(1);

    if (!existingDatabase) {
      res.status(404).json({ success: false, message: 'Database not found' });
      return;
    }

    await db
      .delete(databases)
      .where(eq(databases.id, parseInt(id)));

    res.json({ success: true, message: 'Database deleted successfully' });
  } catch (error) {
    console.error('Error deleting database:', error);
    res.status(500).json({ success: false, message: 'Failed to delete database' });
  }
};
