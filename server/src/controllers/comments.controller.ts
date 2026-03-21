import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { comments } from '../db/schema/comments.js';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

// @desc    Créer un commentaire
// @route   POST /api/comments
// @access  Private
export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { quizId, text, avatar, time } = req.body;

    if (!text || !quizId) {
      return res.status(400).json({ message: 'Texte et quizId requis' });
    }

    const id = crypto.randomUUID();
    await db.insert(comments).values({
      id,
      quizId,
      userId,
      user: req.user.username,
      avatar: avatar || '👤',
      text,
      time: time || 'Just now'
    });

    const newComment = await db.query.comments.findFirst({
      where: eq(comments.id, id)
    });

    res.status(201).json(newComment);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la création du commentaire', error: error.message });
  }
};

// @desc    Obtenir les commentaires d'un quiz
// @route   GET /api/comments/:quizId
// @access  Public
export const getComments = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const quizComments = await db.query.comments.findMany({
      where: eq(comments.quizId, quizId),
      orderBy: [desc(comments.createdAt)]
    });

    res.json(quizComments);
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commentaires' });
  }
};

// @desc    Mettre à jour un commentaire
// @route   PUT /api/comments/:commentId
// @access  Private
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const existing = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
    if (!existing) return res.status(404).json({ message: 'Non trouvé' });
    if (existing.userId !== userId) return res.status(403).json({ message: 'Non autorisé' });

    await db.update(comments).set({ text }).where(eq(comments.id, commentId));
    
    res.json({ id: commentId, text });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// @desc    Supprimer un commentaire
// @route   DELETE /api/comments/:commentId
// @access  Private
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const existing = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
    if (!existing) return res.status(404).json({ message: 'Non trouvé' });
    if (existing.userId !== userId) return res.status(403).json({ message: 'Non autorisé' });

    await db.delete(comments).where(eq(comments.id, commentId));
    res.json({ message: 'Supprimé avec succès', id: commentId });
  } catch (error: any) {
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};
