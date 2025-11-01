import { Request, Response } from 'express';
import { getPrisma } from '../config/database';
import { AIAdapterRegistry } from '../adapters/registry';
import { getAIColor } from '../utils/colors';

const prisma = getPrisma();

// Create a new chatroom
export const createChatRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name, aiMembers, defaultMode, globalConfig } = req.body;

    // Validation
    if (!name || !aiMembers || aiMembers.length === 0) {
      res.status(400).json({ error: 'Name and at least one AI member are required' });
      return;
    }

    // Validate AI model IDs
    const availableModels = AIAdapterRegistry.getAvailableModels();
    for (const member of aiMembers) {
      if (!availableModels.includes(member.aiModelId)) {
        res.status(400).json({ error: `Invalid AI model: ${member.aiModelId}` });
        return;
      }
    }

    // Create chatroom with AI members
    const chatRoom = await prisma.chatRoom.create({
      data: {
        name,
        userId: req.user.userId,
        defaultMode: defaultMode || 'normal',
        globalConfig: globalConfig || {},
        aiMembers: {
          create: aiMembers.map((member: any, index: number) => ({
            aiModelId: member.aiModelId,
            displayName: member.displayName || member.aiModelId,
            avatarColor: member.avatarColor || getAIColor(member.aiModelId),
            orderIndex: index + 1,
            isEnabled: true,
            config: member.config || {},
          })),
        },
      },
      include: {
        aiMembers: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.status(201).json({
      message: 'Chatroom created successfully',
      chatRoom,
    });
  } catch (error: any) {
    console.error('Create chatroom error:', error);
    res.status(500).json({ error: 'Failed to create chatroom' });
  }
};

// Get all chatrooms for the current user
export const getChatRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      userId: req.user.userId,
      deletedAt: null,
    };

    if (search) {
      where.name = {
        contains: String(search),
        mode: 'insensitive',
      };
    }

    const [chatRooms, total] = await Promise.all([
      prisma.chatRoom.findMany({
        where,
        include: {
          aiMembers: {
            orderBy: { orderIndex: 'asc' },
          },
          _count: {
            select: {
              sequentialSessions: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { isStarred: 'desc' },
          { lastActiveAt: 'desc' },
        ],
        skip,
        take: Number(limit),
      }),
      prisma.chatRoom.count({ where }),
    ]);

    res.json({
      chatRooms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Get chatrooms error:', error);
    res.status(500).json({ error: 'Failed to get chatrooms' });
  }
};

// Get a specific chatroom by ID
export const getChatRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id,
        userId: req.user.userId,
        deletedAt: null,
      },
      include: {
        aiMembers: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!chatRoom) {
      res.status(404).json({ error: 'Chatroom not found' });
      return;
    }

    res.json({ chatRoom });
  } catch (error: any) {
    console.error('Get chatroom error:', error);
    res.status(500).json({ error: 'Failed to get chatroom' });
  }
};

// Update a chatroom
export const updateChatRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { name, defaultMode, globalConfig, isStarred, isPinned, tags } = req.body;

    // Verify ownership
    const existing = await prisma.chatRoom.findFirst({
      where: {
        id,
        userId: req.user.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Chatroom not found' });
      return;
    }

    const chatRoom = await prisma.chatRoom.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(defaultMode && { defaultMode }),
        ...(globalConfig && { globalConfig }),
        ...(isStarred !== undefined && { isStarred }),
        ...(isPinned !== undefined && { isPinned }),
        ...(tags && { tags }),
      },
      include: {
        aiMembers: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    res.json({
      message: 'Chatroom updated successfully',
      chatRoom,
    });
  } catch (error: any) {
    console.error('Update chatroom error:', error);
    res.status(500).json({ error: 'Failed to update chatroom' });
  }
};

// Delete a chatroom (soft delete)
export const deleteChatRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.chatRoom.findFirst({
      where: {
        id,
        userId: req.user.userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Chatroom not found' });
      return;
    }

    await prisma.chatRoom.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user.userId,
      },
    });

    res.json({ message: 'Chatroom deleted successfully' });
  } catch (error: any) {
    console.error('Delete chatroom error:', error);
    res.status(500).json({ error: 'Failed to delete chatroom' });
  }
};

// Update AI member order
export const updateAIMemberOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params; // chatroom id
    const { memberOrders } = req.body; // Array of { id, orderIndex }

    // Verify ownership
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id,
        userId: req.user.userId,
        deletedAt: null,
      },
    });

    if (!chatRoom) {
      res.status(404).json({ error: 'Chatroom not found' });
      return;
    }

    // Update all member orders in a transaction
    await prisma.$transaction(
      memberOrders.map((member: any) =>
        prisma.aIMember.update({
          where: { id: member.id },
          data: { orderIndex: member.orderIndex },
        })
      )
    );

    const updatedMembers = await prisma.aIMember.findMany({
      where: { chatRoomId: id },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({
      message: 'AI member order updated successfully',
      aiMembers: updatedMembers,
    });
  } catch (error: any) {
    console.error('Update AI member order error:', error);
    res.status(500).json({ error: 'Failed to update AI member order' });
  }
};
