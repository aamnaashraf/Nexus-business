import { prisma } from '../config/database';
import dailyAPI from '../config/daily';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

export class VideoService {
  // Room name is deterministic — derived from meeting ID so no DB column needed
  private roomName(meetingId: string): string {
    return `nx-${meetingId}`;
  }

  async joinRoom(meetingId: string, userId: string) {
    // ── 1. Validate meeting & participant ──────────────────────────────────
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        investor: { select: { id: true, firstName: true, lastName: true } },
        entrepreneur: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!meeting) throw new AppError('Meeting not found', 404);

    if (meeting.status !== 'ACCEPTED') {
      throw new AppError('Video calls are only available for accepted meetings', 400);
    }

    const isInvestor = meeting.investorId === userId;
    const isEntrepreneur = meeting.entrepreneurId === userId;

    if (!isInvestor && !isEntrepreneur) {
      throw new AppError('You are not a participant in this meeting', 403);
    }

    const participant = isInvestor ? meeting.investor : meeting.entrepreneur;
    const userName = `${participant.firstName} ${participant.lastName}`;

    // ── 2. Guard: no API key → mock mode ──────────────────────────────────
    if (!env.DAILY_API_KEY) {
      return this.mockRoom(meetingId, userName);
    }

    const name = this.roomName(meetingId);
    const expiry = Math.floor(Date.now() / 1000) + 7200; // 2 h from now

    // ── 3. Create or fetch the Daily.co room ──────────────────────────────
    let roomUrl: string;
    try {
      const res = await dailyAPI.get<{ url: string }>(`/rooms/${name}`);
      roomUrl = res.data.url;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await dailyAPI.post<{ url: string }>('/rooms', {
          name,
          properties: {
            max_participants: 2,
            exp: expiry,
            enable_chat: false,
            enable_knocking: false,
            start_video_off: false,
            start_audio_off: false,
          },
        });
        roomUrl = res.data.url;
      } else {
        throw new AppError(`Daily.co room error: ${err.response?.data?.error || err.message}`, 502);
      }
    }

    // ── 4. Generate a per-user meeting token ──────────────────────────────
    const tokenRes = await dailyAPI.post<{ token: string }>('/meeting-tokens', {
      properties: {
        room_name: name,
        user_name: userName,
        is_owner: meeting.createdById === userId,
        exp: expiry,
        enable_screenshare: false,
      },
    });

    return {
      roomUrl,
      token: tokenRes.data.token,
      roomName: name,
      userName,
      meetingTitle: meeting.title,
      mock: false,
    };
  }

  // Sandbox mode when no API key is configured
  private mockRoom(meetingId: string, userName: string) {
    const name = this.roomName(meetingId);
    return {
      roomUrl: `https://nexus.daily.co/${name}`,
      token: '',
      roomName: name,
      userName,
      meetingTitle: 'Video Call (sandbox)',
      mock: true,
    };
  }
}
