import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhoneOff, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import { meetingAPI } from '../../services/meetingAPI';

export const VideoCallPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('Video Call');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!meetingId) {
      navigate('/meetings');
      return;
    }

    meetingAPI
      .getMeetingById(meetingId)
      .then((res) => {
        // Validate the meeting is accepted before allowing video
        const meeting = res.data;
        if (meeting.status !== 'ACCEPTED') {
          setError('This meeting has not been accepted yet.');
        } else {
          setTitle(meeting.title || 'Video Call');
        }
      })
      .catch(() => {
        // Non-fatal: if we can't fetch the title, still allow the call
        setTitle('Video Call');
      })
      .finally(() => setIsLoading(false));
  }, [meetingId, navigate]);

  if (!meetingId) return null;

  // Jitsi room name — UUID makes it effectively private
  const roomName = `nexus-call-${meetingId}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-600">
        <Loader size={40} className="animate-spin text-primary-600" />
        <p className="font-medium">Setting up call…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900">Cannot join call</h2>
        <p className="text-gray-600 text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/meetings')}
          className="mt-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Meetings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-xl"
      style={{ height: 'calc(100vh - 5rem)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-900 shrink-0">
        <div>
          <h1 className="text-white font-semibold text-sm leading-tight">{title}</h1>
          <span className="inline-flex items-center gap-1.5 text-xs text-green-400 mt-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live via Jitsi Meet
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Open in new tab fallback (useful if browser blocks iframe mic/cam) */}
          <a
            href={jitsiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
            title="Open in a new tab if camera/mic don't work in the iframe"
          >
            <ExternalLink size={13} />
            Open in new tab
          </a>

          <button
            onClick={() => navigate('/meetings')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PhoneOff size={14} />
            Leave
          </button>
        </div>
      </div>

      {/* ── Jitsi iframe ───────────────────────────────────────────────────── */}
      {/*
        Jitsi Meet is free, open-source, and requires NO API key or account.
        The room name (based on the meeting UUID) acts as the private room key.
        Browser will request camera/microphone permissions automatically.
      */}
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="flex-1 w-full border-0 bg-gray-950"
        title={title}
      />
    </div>
  );
};
