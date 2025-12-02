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

    // Parse JSON fields (MySQL returns them as strings)
    const parsedDatabases = allDatabases.map(db => ({
      ...db,
      columns: typeof db.columns === 'string' ? JSON.parse(db.columns) : db.columns,
      rows: typeof db.rows === 'string' ? JSON.parse(db.rows) : db.rows,
      columnWidths: db.columnWidths ? (typeof db.columnWidths === 'string' ? JSON.parse(db.columnWidths) : db.columnWidths) : null
    }));

    res.json({ success: true, data: parsedDatabases });
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

    // Parse JSON fields (MySQL returns them as strings)
    const parsedDatabase = {
      ...database,
      columns: typeof database.columns === 'string' ? JSON.parse(database.columns) : database.columns,
      rows: typeof database.rows === 'string' ? JSON.parse(database.rows) : database.rows,
      columnWidths: database.columnWidths ? (typeof database.columnWidths === 'string' ? JSON.parse(database.columnWidths) : database.columnWidths) : null
    };

    res.json({ success: true, data: parsedDatabase });
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

    // Parse JSON fields (MySQL returns them as strings)
    const parsedDatabase = {
      ...database,
      columns: typeof database.columns === 'string' ? JSON.parse(database.columns) : database.columns,
      rows: typeof database.rows === 'string' ? JSON.parse(database.rows) : database.rows,
      columnWidths: database.columnWidths ? (typeof database.columnWidths === 'string' ? JSON.parse(database.columnWidths) : database.columnWidths) : null
    };

    res.status(201).json({ success: true, data: parsedDatabase });
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

    // Parse JSON fields (MySQL returns them as strings)
    const parsedDatabase = {
      ...updatedDatabase,
      columns: typeof updatedDatabase.columns === 'string' ? JSON.parse(updatedDatabase.columns) : updatedDatabase.columns,
      rows: typeof updatedDatabase.rows === 'string' ? JSON.parse(updatedDatabase.rows) : updatedDatabase.rows,
      columnWidths: updatedDatabase.columnWidths ? (typeof updatedDatabase.columnWidths === 'string' ? JSON.parse(updatedDatabase.columnWidths) : updatedDatabase.columnWidths) : null
    };

    res.json({ success: true, data: parsedDatabase });
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
