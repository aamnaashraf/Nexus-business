import { Router } from 'express';
import {
  createMeeting,
  getMyMeetings,
  getMeetingById,
  acceptMeeting,
  rejectMeeting,
  cancelMeeting,
} from '../controllers/meeting.controller';
import { authenticate } from '../middleware/auth';
import {
  validateCreateMeeting,
  validateMeetingId,
} from '../middleware/meetingValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new meeting request
router.post('/', validateCreateMeeting, createMeeting);

// Get all meetings for the logged-in user
router.get('/', getMyMeetings);

// Get a specific meeting by ID
router.get('/:id', validateMeetingId, getMeetingById);

// Accept a meeting
router.patch('/:id/accept', validateMeetingId, acceptMeeting);

// Reject a meeting
router.patch('/:id/reject', validateMeetingId, rejectMeeting);

// Cancel a meeting
router.patch('/:id/cancel', validateMeetingId, cancelMeeting);

export default router;
