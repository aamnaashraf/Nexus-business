import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { meetingAPI, Meeting } from '../../services/meetingAPI';
import { messageAPI, Conversation } from '../../services/messageAPI';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';

interface Notification {
  id: string;
  type: 'message' | 'meeting_request' | 'meeting_accepted' | 'meeting_rejected';
  title: string;
  description: string;
  time: Date;
  unread: boolean;
  avatarName: string;
  avatarSrc?: string;
  actionPath?: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    Promise.all([
      meetingAPI.getMyMeetings().catch(() => ({ data: [] as Meeting[] })),
      messageAPI.getConversations().catch(() => ({ data: [] as Conversation[] })),
    ]).then(([meetingsRes, convsRes]) => {
      const notifs: Notification[] = [];

      // Meeting notifications
      for (const meeting of meetingsRes.data) {
        const isInvestor = user.role === 'investor';
        const other = isInvestor ? meeting.entrepreneur : meeting.investor;
        const otherName = `${other.firstName} ${other.lastName}`;
        const avatarSrc =
          other.profileImage ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=random`;

        if (meeting.status === 'PENDING' && !isInvestor) {
          // Entrepreneur sees incoming meeting requests
          notifs.push({
            id: `meeting-pending-${meeting.id}`,
            type: 'meeting_request',
            title: 'Meeting Request',
            description: `${otherName} requested a meeting: "${meeting.title}"`,
            time: new Date(meeting.createdAt),
            unread: true,
            avatarName: otherName,
            avatarSrc,
            actionPath: '/meetings',
          });
        } else if (meeting.status === 'ACCEPTED') {
          notifs.push({
            id: `meeting-accepted-${meeting.id}`,
            type: 'meeting_accepted',
            title: 'Meeting Accepted',
            description: isInvestor
              ? `${otherName} accepted your meeting request: "${meeting.title}"`
              : `You accepted a meeting with ${otherName}: "${meeting.title}"`,
            time: new Date(meeting.updatedAt),
            unread: false,
            avatarName: otherName,
            avatarSrc,
            actionPath: '/meetings',
          });
        } else if (meeting.status === 'REJECTED') {
          notifs.push({
            id: `meeting-rejected-${meeting.id}`,
            type: 'meeting_rejected',
            title: 'Meeting Declined',
            description: isInvestor
              ? `${otherName} declined your meeting request: "${meeting.title}"`
              : `You declined a meeting with ${otherName}: "${meeting.title}"`,
            time: new Date(meeting.updatedAt),
            unread: false,
            avatarName: otherName,
            avatarSrc,
            actionPath: '/meetings',
          });
        }
      }

      // Unread message notifications
      for (const conv of convsRes.data) {
        if (conv.unreadCount > 0) {
          const partnerName = `${conv.partner.firstName} ${conv.partner.lastName}`;
          const avatarSrc =
            conv.partner.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random`;
          notifs.push({
            id: `message-${conv.partnerId}`,
            type: 'message',
            title: 'New Message',
            description: `${partnerName} sent you ${conv.unreadCount} new message${conv.unreadCount > 1 ? 's' : ''}`,
            time: new Date(conv.lastMessage.createdAt),
            unread: true,
            avatarName: partnerName,
            avatarSrc,
            actionPath: `/chat/${conv.partnerId}`,
          });
        }
      }

      // Sort newest first
      notifs.sort((a, b) => b.time.getTime() - a.time.getTime());
      setNotifications(notifs);
    }).finally(() => setIsLoading(false));
  }, [user]);

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return (
          <div className="p-2 bg-primary-100 rounded-full">
            <MessageCircle size={16} className="text-primary-600" />
          </div>
        );
      case 'meeting_request':
        return (
          <div className="p-2 bg-yellow-100 rounded-full">
            <Clock size={16} className="text-yellow-600" />
          </div>
        );
      case 'meeting_accepted':
        return (
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle size={16} className="text-green-600" />
          </div>
        );
      case 'meeting_rejected':
        return (
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle size={16} className="text-red-600" />
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => n.unread && !readIds.has(n.id)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-gray-100 p-5 rounded-full mb-4">
            <Bell size={36} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">No notifications yet</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Activity from meetings and messages will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isUnread = notif.unread && !readIds.has(notif.id);
            return (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors duration-150 hover:shadow-md ${
                  isUnread ? 'bg-primary-50 border-primary-100' : 'bg-white'
                }`}
                onClick={() => {
                  setReadIds((prev) => new Set([...prev, notif.id]));
                  if (notif.actionPath) navigate(notif.actionPath);
                }}
              >
                <CardBody className="flex items-start gap-4 p-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar
                      src={notif.avatarSrc}
                      alt={notif.avatarName}
                      size="md"
                    />
                    <div className="absolute -bottom-1 -right-1">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                        {notif.title}
                      </span>
                      {isUnread && (
                        <Badge variant="primary" size="sm" rounded>New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{notif.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(notif.time, { addSuffix: true })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary-600 mt-1" />
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
