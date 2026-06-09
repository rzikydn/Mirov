import { Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { notes, users } from '../db/schema';

export const getAllNotes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const allNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        color: notes.color,
        userId: notes.userId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        favorite: notes.favorite,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .orderBy(desc(notes.createdAt));

    res.status(200).json({
      success: true,
      data: allNotes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [note] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        color: notes.color,
        userId: notes.userId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        favorite: notes.favorite,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .where(eq(notes.id, parseInt(id)))
      .limit(1);

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, color } = req.body;
    const userId = req.user!.userId;

    // Validation
    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Content is required'
      });
      return;
    }

    const [result] = await db.insert(notes).values({
      title: title || 'Untitled',
      content,
      color: color || '#FEF08A',
      userId
    }).$returningId();

    // Get the created note with user data
    const [note] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        color: notes.color,
        userId: notes.userId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        favorite: notes.favorite,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .where(eq(notes.id, result.id))
      .limit(1);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, color, favorite } = req.body;
    const user = req.user!;

    // Check if note exists
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, parseInt(id)))
      .limit(1);

    if (!existingNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    // Authorization check: Only creator or ADMIN/SUPERUSER can modify
    if (existingNote.userId !== user.userId && user.role !== 'SUPERUSER' && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Forbidden - You do not have permission to modify this note'
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (favorite !== undefined) updateData.favorite = favorite;

    await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, parseInt(id)));

    // Get the updated note with user data
    const [note] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        color: notes.color,
        userId: notes.userId,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        favorite: notes.favorite,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(notes)
      .leftJoin(users, eq(notes.userId, users.id))
      .where(eq(notes.id, parseInt(id)))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Check if note exists
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, parseInt(id)))
      .limit(1);

    if (!existingNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    // Authorization check: Only creator or ADMIN/SUPERUSER can delete
    if (existingNote.userId !== user.userId && user.role !== 'SUPERUSER' && user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Forbidden - You do not have permission to delete this note'
      });
      return;
    }

    await db
      .delete(notes)
      .where(eq(notes.id, parseInt(id)));

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
