import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Plus, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { meetingAPI, Meeting } from '../../services/meetingAPI';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CreateMeetingModal } from '../../components/meetings/CreateMeetingModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const response = await meetingAPI.getMyMeetings(
        filter === 'all' ? undefined : filter
      );
      setMeetings(response.data);
    } catch (error: any) {
      toast.error('Failed to load meetings');
      console.error('Fetch meetings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (meetingId: string) => {
    try {
      await meetingAPI.acceptMeeting(meetingId);
      toast.success('Meeting accepted!');
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept meeting');
    }
  };

  const handleReject = async (meetingId: string) => {
    try {
      await meetingAPI.rejectMeeting(meetingId);
      toast.success('Meeting rejected');
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject meeting');
    }
  };

  const handleCancel = async (meetingId: string) => {
    try {
      await meetingAPI.cancelMeeting(meetingId);
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel meeting');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getOtherParticipant = (meeting: Meeting) => {
    if (user?.id === meeting.investorId) {
      return meeting.entrepreneur;
    }
    return meeting.investor;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Manage your meeting schedule</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
          Schedule Meeting
        </Button>
      </div>

      <CreateMeetingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchMeetings}
      />

      {/* Filter tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {['all', 'PENDING', 'ACCEPTED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === status
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'You have no scheduled meetings yet.'
                : `You have no ${filter.toLowerCase()} meetings.`}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => {
            const participant = getOtherParticipant(meeting);
            const isPending = meeting.status === 'PENDING';
            const isAccepted = meeting.status === 'ACCEPTED';
            const isCreator = user?.id === meeting.createdById;

            // Only recipient can accept/reject pending meetings
            const canRespond = isPending && !isCreator;
            // Creator can cancel pending meetings, both can cancel accepted meetings
            const canCancel = (isPending && isCreator) || isAccepted;

            return (
              <Card key={meeting.id}>
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meeting.title}
                        </h3>
                        {getStatusBadge(meeting.status)}
                      </div>

                      {meeting.description && (
                        <p className="text-gray-600 mb-4">{meeting.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar size={16} className="mr-2" />
                          {format(new Date(meeting.startTime), 'PPP')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock size={16} className="mr-2" />
                          {format(new Date(meeting.startTime), 'p')} -{' '}
                          {format(new Date(meeting.endTime), 'p')}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <User size={16} className="mr-2" />
                        <span>
                          With {participant.firstName} {participant.lastName} (
                          {participant.role})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      {/* Join video call — only for accepted meetings */}
                      {isAccepted && (
                        <Button
                          size="sm"
                          leftIcon={<Video size={16} />}
                          onClick={() => navigate(`/video/${meeting.id}`)}
                        >
                          Join Call
                        </Button>
                      )}

                      {canRespond && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<CheckCircle size={16} />}
                            onClick={() => handleAccept(meeting.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<XCircle size={16} />}
                            onClick={() => handleReject(meeting.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {canCancel && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(meeting.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
