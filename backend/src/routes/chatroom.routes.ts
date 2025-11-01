import { Router } from 'express';
import {
  createChatRoom,
  getChatRooms,
  getChatRoomById,
  updateChatRoom,
  deleteChatRoom,
  updateAIMemberOrder,
} from '../controllers/chatroom.controller';
import { authenticate } from '../middleware/auth';
import { createLimiter, apiLimiter } from '../middleware/rateLimit';

const router = Router();

// All chatroom routes require authentication
router.use(authenticate);

// Chatroom CRUD
router.post('/', createLimiter, createChatRoom);
router.get('/', apiLimiter, getChatRooms);
router.get('/:id', apiLimiter, getChatRoomById);
router.put('/:id', apiLimiter, updateChatRoom);
router.delete('/:id', apiLimiter, deleteChatRoom);

// AI member management
router.put('/:id/ai-members/order', apiLimiter, updateAIMemberOrder);

export default router;
