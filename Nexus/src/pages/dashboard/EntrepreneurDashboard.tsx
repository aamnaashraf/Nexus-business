import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { useAuth } from '../../context/AuthContext';
import { userAPI, UserSummary } from '../../services/userAPI';
import { meetingAPI, Meeting } from '../../services/meetingAPI';
import toast from 'react-hot-toast';

export const EntrepreneurDashboard: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [investors, setInvestors] = useState<UserSummary[]>([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(true);

  useEffect(() => {
    meetingAPI
      .getMyMeetings()
      .then((res) => setMeetings(res.data))
      .catch(() => toast.error('Failed to load meetings'))
      .finally(() => setIsLoadingMeetings(false));

    userAPI
      .getAllUsers('INVESTOR')
      .then((res) => setInvestors(res.data.slice(0, 3)))
      .catch(() => {})
      .finally(() => setIsLoadingInvestors(false));
  }, []);

  const handleAccept = async (meetingId: string) => {
    try {
      await meetingAPI.acceptMeeting(meetingId);
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status: 'ACCEPTED' } : m))
      );
      toast.success('Meeting accepted');
    } catch {
      toast.error('Failed to accept meeting');
    }
  };

  const handleReject = async (meetingId: string) => {
    try {
      await meetingAPI.rejectMeeting(meetingId);
      setMeetings((prev) =>
        prev.map((m) => (m.id === meetingId ? { ...m, status: 'REJECTED' } : m))
      );
      toast.success('Meeting rejected');
    } catch {
      toast.error('Failed to reject meeting');
    }
  };

  if (!user) return null;

  const pendingMeetings = meetings.filter((m) => m.status === 'PENDING');
  const acceptedMeetings = meetings.filter((m) => m.status === 'ACCEPTED');
  const upcomingMeetings = meetings.filter(
    (m) => (m.status === 'PENDING' || m.status === 'ACCEPTED') && new Date(m.startTime) > new Date()
  );

  const statusIcon = (status: Meeting['status']) => {
    if (status === 'ACCEPTED') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'REJECTED') return <XCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

  const statusLabel = (status: Meeting['status']) => {
    if (status === 'ACCEPTED') return <Badge variant="success">Accepted</Badge>;
    if (status === 'REJECTED') return <Badge variant="error">Rejected</Badge>;
    if (status === 'CANCELLED') return <Badge variant="gray">Cancelled</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          <p className="text-gray-600">Here's what's happening with your startup today</p>
        </div>
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>Find Investors</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Meetings</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Accepted Meetings</p>
                <h3 className="text-xl font-semibold text-secondary-900">{acceptedMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming</p>
                <h3 className="text-xl font-semibold text-accent-900">{upcomingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-green-50 border border-green-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Meetings</p>
                <h3 className="text-xl font-semibold text-green-900">{meetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Meeting Requests</h2>
              {pendingMeetings.length > 0 && (
                <Badge variant="primary">{pendingMeetings.length} pending</Badge>
              )}
            </CardHeader>
            <CardBody>
              {isLoadingMeetings ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : meetings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <AlertCircle size={24} className="text-gray-500" />
                  </div>
                  <p className="text-gray-600">No meeting requests yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    When investors schedule meetings with you, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting) => {
                    const other = meeting.investor;
                    const otherName = `${other.firstName} ${other.lastName}`;
                    const avatarSrc =
                      other.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=random`;

                    return (
                      <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar src={avatarSrc} alt={otherName} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900">{otherName}</p>
                              <p className="text-sm text-gray-600">{meeting.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(meeting.startTime).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusLabel(meeting.status)}
                          </div>
                        </div>

                        {meeting.status === 'PENDING' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                            <Button
                              size="sm"
                              leftIcon={<CheckCircle size={14} />}
                              onClick={() => handleAccept(meeting.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<XCircle size={14} />}
                              onClick={() => handleReject(meeting.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        )}

                        {meeting.status === 'ACCEPTED' && meeting.meetingLink && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <Link to={`/video/${meeting.id}`}>
                              <Button size="sm" variant="outline">Join Video Call</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {meetings.length > 5 && (
                    <Link to="/meetings" className="block text-center text-sm text-primary-600 hover:underline pt-2">
                      View all {meetings.length} meetings →
                    </Link>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recommended investors */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
              <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-4">
              {isLoadingInvestors ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                </div>
              ) : investors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No investors registered yet</p>
              ) : (
                investors.map((investor) => (
                  <InvestorCard key={investor.id} investor={investor} showActions={false} />
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
