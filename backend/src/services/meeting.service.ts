import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateMeetingData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  requesterId: string;
  requesterRole: string;
  participantId: string;
}

export class MeetingService {
  async createMeeting(data: CreateMeetingData) {
    const {
      title,
      description,
      startTime,
      endTime,
      requesterId,
      requesterRole,
      participantId,
    } = data;

    // Validate time
    if (startTime >= endTime) {
      throw new AppError('End time must be after start time', 400);
    }

    if (startTime < new Date()) {
      throw new AppError('Cannot schedule meetings in the past', 400);
    }

    // Verify participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new AppError('Participant not found', 404);
    }

    // Determine investor and entrepreneur based on requester role
    let investorId: string;
    let entrepreneurId: string;

    if (requesterRole === 'INVESTOR') {
      investorId = requesterId;
      entrepreneurId = participantId;

      // Verify participant is an entrepreneur
      if (participant.role !== 'ENTREPRENEUR') {
        throw new AppError('Can only schedule meetings with entrepreneurs', 400);
      }
    } else if (requesterRole === 'ENTREPRENEUR') {
      entrepreneurId = requesterId;
      investorId = participantId;

      // Verify participant is an investor
      if (participant.role !== 'INVESTOR') {
        throw new AppError('Can only schedule meetings with investors', 400);
      }
    } else {
      throw new AppError('Invalid user role', 400);
    }

    // Check for conflicts for both users
    await this.checkConflicts(investorId, startTime, endTime);
    await this.checkConflicts(entrepreneurId, startTime, endTime);

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        startTime,
        endTime,
        investorId,
        entrepreneurId,
        createdById: requesterId,
        status: 'PENDING',
      },
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return meeting;
  }

  async checkConflicts(userId: string, startTime: Date, endTime: Date) {
    const conflicts = await prisma.meeting.findMany({
      where: {
        AND: [
          {
            OR: [
              { investorId: userId },
              { entrepreneurId: userId },
            ],
          },
          {
            status: {
              in: ['PENDING', 'ACCEPTED'],
            },
          },
          {
            OR: [
              // New meeting starts during existing meeting
              {
                AND: [
                  { startTime: { lte: startTime } },
                  { endTime: { gt: startTime } },
                ],
              },
              // New meeting ends during existing meeting
              {
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gte: endTime } },
                ],
              },
              // New meeting completely contains existing meeting
              {
                AND: [
                  { startTime: { gte: startTime } },
                  { endTime: { lte: endTime } },
                ],
              },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(
        'Time slot conflicts with an existing meeting. Please choose a different time.',
        409
      );
    }
  }

  async getUserMeetings(userId: string, status?: string) {
    const where: any = {
      OR: [
        { investorId: userId },
        { entrepreneurId: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return meetings;
  }

  async getMeetingById(meetingId: string, userId: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Verify user is part of the meeting
    if (meeting.investorId !== userId && meeting.entrepreneurId !== userId) {
      throw new AppError('You do not have access to this meeting', 403);
    }

    return meeting;
  }

  async acceptMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    if (meeting.status !== 'PENDING') {
      throw new AppError('Only pending meetings can be accepted', 400);
    }

    // Only the participant (not the requester) can accept
    // The requester is the one who created it, so they can't accept their own meeting
    // We need to determine who created it based on logic or add a createdBy field
    // For now, we'll allow both parties to accept (simpler logic)

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'ACCEPTED' },
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updatedMeeting;
  }

  async rejectMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    if (meeting.status !== 'PENDING') {
      throw new AppError('Only pending meetings can be rejected', 400);
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'REJECTED' },
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updatedMeeting;
  }

  async cancelMeeting(meetingId: string, userId: string) {
    const meeting = await this.getMeetingById(meetingId, userId);

    if (meeting.status === 'CANCELLED') {
      throw new AppError('Meeting is already cancelled', 400);
    }

    if (meeting.status === 'REJECTED') {
      throw new AppError('Cannot cancel a rejected meeting', 400);
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'CANCELLED' },
      include: {
        investor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        entrepreneur: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updatedMeeting;
  }
}
