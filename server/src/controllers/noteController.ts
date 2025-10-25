import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getNotes = async (req: Request, res: Response) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notes", error: err });
  }
};

export const addNote = async (req: Request, res: Response) => {
  const { text, color, userId } = req.body; // ⭐ Terima userId
  
  try {
    const note = await prisma.note.create({
      data: { 
        text, 
        color, 
        userId: Number(userId), // ⭐ Simpan userId
        date: new Date().toISOString() // atau format sesuai kebutuhan
      },
    });
    res.json(note);
  } catch (err) {
    console.error("Add note error:", err);
    res.status(500).json({ message: "Failed to add note", error: err });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, color, favorite } = req.body;
  
  try {
    const note = await prisma.note.update({
      where: { id: Number(id) },
      data: { text, color, favorite },
    });
    res.json(note);
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ message: "Failed to update note", error: err });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await prisma.note.delete({ where: { id: Number(id) } });
    res.json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Failed to delete note", error: err });
  }
};