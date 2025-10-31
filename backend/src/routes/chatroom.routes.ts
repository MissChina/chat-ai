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

const router = Router();

// All chatroom routes require authentication
router.use(authenticate);

// Chatroom CRUD
router.post('/', createChatRoom);
router.get('/', getChatRooms);
router.get('/:id', getChatRoomById);
router.put('/:id', updateChatRoom);
router.delete('/:id', deleteChatRoom);

// AI member management
router.put('/:id/ai-members/order', updateAIMemberOrder);

export default router;
