import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, UserCircle, FileText, DollarSign, Send, Globe, Linkedin, Twitter } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { userAPI, UserDetail } from '../../services/userAPI';
import toast from 'react-hot-toast';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [entrepreneur, setEntrepreneur] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    userAPI
      .getUserById(id)
      .then((res) => {
        if (res.data.role !== 'ENTREPRENEUR') {
          setEntrepreneur(null);
        } else {
          setEntrepreneur(res.data);
        }
      })
      .catch(() => {
        toast.error('Failed to load profile');
        setEntrepreneur(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!entrepreneur) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">This profile doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const fullName = `${entrepreneur.firstName} ${entrepreneur.lastName}`;
  const avatarSrc =
    entrepreneur.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const ep = entrepreneur.entrepreneurProfile;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={avatarSrc} alt={fullName} size="xl" className="mx-auto sm:mx-0" />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              {ep?.companyName && (
                <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                  <Building2 size={16} className="mr-1" />
                  Founder at {ep.companyName}
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {ep?.industry && <Badge variant="primary">{ep.industry}</Badge>}
                {ep?.fundingStage && <Badge variant="accent">{ep.fundingStage}</Badge>}
                {entrepreneur.socialLinks?.linkedin && (
                  <a
                    href={entrepreneur.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                  >
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {entrepreneur.socialLinks?.twitter && (
                  <a
                    href={entrepreneur.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                  >
                    <Twitter size={13} /> Twitter
                  </a>
                )}
                {entrepreneur.socialLinks?.website && (
                  <a
                    href={entrepreneur.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline"
                  >
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${entrepreneur.id}`}>
                <Button variant="outline" leftIcon={<MessageCircle size={18} />}>
                  Message
                </Button>
              </Link>
            )}
            {isCurrentUser && (
              <Link to="/profile">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">
                {entrepreneur.bio || 'No bio provided yet.'}
              </p>
            </CardBody>
          </Card>

          {/* Startup Overview */}
          {ep && (ep.companyName || ep.industry || ep.fundingStage) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ep.companyName && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                      <p className="mt-1 font-medium text-gray-900">{ep.companyName}</p>
                    </div>
                  )}
                  {ep.industry && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Industry</p>
                      <p className="mt-1 font-medium text-gray-900">{ep.industry}</p>
                    </div>
                  )}
                  {ep.fundingStage && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Funding Stage</p>
                      <p className="mt-1 font-medium text-gray-900">{ep.fundingStage}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Startup History */}
          {entrepreneur.startupHistories && entrepreneur.startupHistories.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Startup History</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {entrepreneur.startupHistories.map((h) => (
                    <div key={h.id} className="border-l-2 border-primary-200 pl-4">
                      <h3 className="font-medium text-gray-900">{h.companyName}</h3>
                      {h.position && <p className="text-sm text-gray-600">{h.position}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(h.startDate).getFullYear()} –{' '}
                        {h.endDate ? new Date(h.endDate).getFullYear() : 'Present'}
                      </p>
                      {h.description && (
                        <p className="text-sm text-gray-600 mt-1">{h.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Documents */}
          {(ep?.pitchDeck || ep?.businessPlan) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {ep.pitchDeck && (
                    <a
                      href={ep.pitchDeck}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                      </div>
                    </a>
                  )}
                  {ep.businessPlan && (
                    <a
                      href={ep.businessPlan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">Business Plan</h3>
                      </div>
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Member since */}
          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(entrepreneur.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
