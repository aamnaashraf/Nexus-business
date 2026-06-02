import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  getConversations,
  getMessages,
  sendMessage,
  getChatPartner,
} from '../controllers/message.controller';

const router = Router();

router.use(authenticate);

router.get('/', getConversations);
router.get('/partner/:userId', getChatPartner);
router.get('/:userId', getMessages);
router.post(
  '/:userId',
  validate([body('content').trim().notEmpty().withMessage('Message cannot be empty')]),
  sendMessage
);

export default router;
