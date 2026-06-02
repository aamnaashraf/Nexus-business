import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { param } from 'express-validator';
import { joinVideoRoom } from '../controllers/video.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/room/:meetingId/join',
  validate([
    param('meetingId')
      .trim()
      .notEmpty()
      .withMessage('Meeting ID is required')
      .isUUID()
      .withMessage('Invalid meeting ID'),
  ]),
  joinVideoRoom
);

export default router;
