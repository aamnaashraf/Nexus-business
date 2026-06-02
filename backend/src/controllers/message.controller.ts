import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

// GET /messages — list of conversations (unique chat partners + last message)
export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const userId = req.user.id;

    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profileImage: true, role: true },
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, profileImage: true, role: true },
        },
      },
    });

    // Build conversation map: partnerId -> latest message
    const conversationMap = new Map<string, any>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!conversationMap.has(partnerId)) {
        const unreadCount = await prisma.message.count({
          where: { senderId: partnerId, receiverId: userId, read: false },
        });
        conversationMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: msg,
          unreadCount,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: Array.from(conversationMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

// GET /messages/:userId — messages between current user and userId
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const currentUserId = req.user.id;
    const partnerId = req.params.userId as string;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: partnerId },
          { senderId: partnerId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
      },
    });

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: currentUserId, read: false },
      data: { read: true },
    });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// POST /messages/:userId — send a message to userId
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const senderId = req.user.id;
    const receiverId = req.params.userId as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new AppError('Message content cannot be empty', 400);
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw new AppError('Recipient not found', 404);

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

// GET /messages/partner/:userId — get partner user info
export const getChatPartner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const partnerId = req.params.userId as string;

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        role: true,
        bio: true,
      },
    });

    if (!partner) throw new AppError('User not found', 404);

    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    next(error);
  }
};
