import { Response, NextFunction } from 'express';
import { MeetingService } from '../services/meeting.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const meetingService = new MeetingService();

export const createMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { title, description, startTime, endTime, participantId } = req.body;

    const meeting = await meetingService.createMeeting({
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      requesterId: req.user.id,
      requesterRole: req.user.role,
      participantId,
    });

    res.status(201).json({
      success: true,
      message: 'Meeting request created successfully',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyMeetings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { status } = req.query;
    const meetings = await meetingService.getUserMeetings(
      req.user.id,
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const meeting = await meetingService.getMeetingById(id as string, req.user.id);

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const meeting = await meetingService.acceptMeeting(id as string, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Meeting accepted successfully',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const meeting = await meetingService.rejectMeeting(id as string, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Meeting rejected successfully',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMeeting = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const meeting = await meetingService.cancelMeeting(id as string, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully',
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};
