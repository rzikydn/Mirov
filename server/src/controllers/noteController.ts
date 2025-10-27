import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const notes = await prisma.note.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: notes
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

    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
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

    const note = await prisma.note.create({
      data: {
        title: title || 'Untitled',
        content,
        color: color || '#FEF08A',
        userId
      },
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

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(color !== undefined && { color }),
        ...(favorite !== undefined && { favorite })
      },
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

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingNote) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    await prisma.note.delete({
      where: { id: parseInt(id) }
    });

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
