import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { messageAPI, Conversation } from '../../services/messageAPI';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    messageAPI
      .getConversations()
      .then((res) => setConversations(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (!user) return null;

  const filtered = conversations.filter((c) => {
    const name = `${c.partner.firstName} ${c.partner.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        <Link to={user.role === 'entrepreneur' ? '/investors' : '/entrepreneurs'}>
          <Button leftIcon={<Send size={16} />} size="sm">
            New Message
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        startAdornment={<Search size={18} />}
        fullWidth
      />

      {/* Conversations list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="bg-gray-100 p-5 rounded-full mb-4">
              <MessageCircle size={36} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {search ? 'No conversations match your search' : 'No messages yet'}
            </h2>
            <p className="text-gray-500 text-sm text-center mt-2">
              {search
                ? 'Try a different name'
                : 'Visit an investor or entrepreneur profile and send them a message to get started'}
            </p>
            {!search && (
              <Link
                to={user.role === 'entrepreneur' ? '/investors' : '/entrepreneurs'}
                className="mt-4"
              >
                <Button size="sm">
                  {user.role === 'entrepreneur' ? 'Find Investors' : 'Find Startups'}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((conv) => {
              const partnerName = `${conv.partner.firstName} ${conv.partner.lastName}`;
              const avatarSrc =
                conv.partner.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random`;
              const isUnread = conv.unreadCount > 0;
              const lastMsg = conv.lastMessage;

              return (
                <li key={conv.partnerId}>
                  <button
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left ${
                      isUnread ? 'bg-primary-50 hover:bg-primary-50/80' : ''
                    }`}
                    onClick={() => navigate(`/chat/${conv.partnerId}`)}
                  >
                    <div className="relative shrink-0">
                      <Avatar src={avatarSrc} alt={partnerName} size="lg" />
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-600 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {partnerName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {lastMsg
                            ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className={`text-sm truncate ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                          {lastMsg
                            ? `${lastMsg.senderId === user.id ? 'You: ' : ''}${lastMsg.content}`
                            : 'No messages yet'}
                        </p>
                        {isUnread && (
                          <Badge variant="primary" size="sm" rounded>
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {conv.partner.role.toLowerCase()}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
