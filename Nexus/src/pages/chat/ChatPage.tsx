import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Info, MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { messageAPI, ChatMessage as ChatMessageType, Conversation, ChatPartner } from '../../services/messageAPI';
import toast from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Load conversations list
  useEffect(() => {
    messageAPI
      .getConversations()
      .then((res) => setConversations(res.data))
      .catch(() => {});
  }, []);

  // Load messages + partner info when userId changes
  useEffect(() => {
    if (!userId) {
      setChatPartner(null);
      setMessages([]);
      return;
    }

    messageAPI
      .getChatPartner(userId)
      .then((res) => setChatPartner(res.data))
      .catch(() => toast.error('Could not load chat partner'));

    messageAPI
      .getMessages(userId)
      .then((res) => setMessages(res.data))
      .catch(() => toast.error('Could not load messages'));
  }, [userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userId || isSending) return;

    setIsSending(true);
    const optimisticContent = newMessage.trim();
    setNewMessage('');

    try {
      const res = await messageAPI.sendMessage(userId, optimisticContent);
      setMessages((prev) => [...prev, res.data]);

      // Refresh conversation list to update last message
      messageAPI.getConversations().then((r) => setConversations(r.data)).catch(() => {});
    } catch {
      toast.error('Failed to send message');
      setNewMessage(optimisticContent);
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) return null;

  const partnerName = chatPartner
    ? `${chatPartner.firstName} ${chatPartner.lastName}`
    : '';
  const partnerAvatar =
    chatPartner?.profileImage ||
    (partnerName
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=random`
      : '');

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {chatPartner ? (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={partnerAvatar}
                  alt={partnerName}
                  size="md"
                  className="mr-3"
                />
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{partnerName}</h2>
                  <p className="text-sm text-gray-500 capitalize">
                    {chatPartner.role.toLowerCase()}
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Info">
                <Info size={18} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || isSending}
                  isLoading={isSending}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
