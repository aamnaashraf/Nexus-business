import { Response, NextFunction } from 'express';
import { VideoService } from '../services/video.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const videoService = new VideoService();

export const joinVideoRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const meetingId = req.params.meetingId as string;
    const result = await videoService.joinRoom(meetingId, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
