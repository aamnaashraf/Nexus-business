import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageCircle, Building2, MapPin, UserCircle, FileText,
  Globe, Linkedin, Twitter, Users, DollarSign, Calendar, Target
} from 'lucide-react';
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
    userAPI.getUserById(id)
      .then((res) => {
        if (res.data.role !== 'ENTREPRENEUR') setEntrepreneur(null);
        else setEntrepreneur(res.data);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
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
        <Link to="/dashboard/investor"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const fullName = `${entrepreneur.firstName} ${entrepreneur.lastName}`;
  const avatarSrc = entrepreneur.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const ep = entrepreneur.entrepreneurProfile;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={avatarSrc} alt={fullName} size="xl" className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              {ep?.tagline && <p className="text-gray-500 mt-1 italic">"{ep.tagline}"</p>}
              {ep?.companyName && (
                <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                  <Building2 size={16} className="mr-1" /> Founder at {ep.companyName}
                </p>
              )}
              {ep?.location && (
                <p className="text-gray-500 flex items-center justify-center sm:justify-start mt-1 text-sm">
                  <MapPin size={14} className="mr-1" /> {ep.location}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {ep?.industry && <Badge variant="primary">{ep.industry}</Badge>}
                {ep?.fundingStage && <Badge variant="accent">{ep.fundingStage}</Badge>}
                {ep?.foundedYear && <Badge variant="gray">Est. {ep.foundedYear}</Badge>}
                {entrepreneur.socialLinks?.linkedin && (
                  <a href={entrepreneur.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {entrepreneur.socialLinks?.twitter && (
                  <a href={entrepreneur.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Twitter size={13} /> Twitter
                  </a>
                )}
                {entrepreneur.socialLinks?.website && (
                  <a href={entrepreneur.socialLinks.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${entrepreneur.id}`}>
                <Button variant="outline" leftIcon={<MessageCircle size={18} />}>Message</Button>
              </Link>
            )}
            {isCurrentUser && (
              <Link to="/profile">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>Edit Profile</Button>
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
            <CardHeader><h2 className="text-lg font-medium text-gray-900">About</h2></CardHeader>
            <CardBody>
              <p className="text-gray-700 leading-relaxed">{entrepreneur.bio || 'No bio provided yet.'}</p>
            </CardBody>
          </Card>

          {/* Startup Overview */}
          {ep && (ep.companyName || ep.industry || ep.fundingStage || ep.location || ep.foundedYear) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Startup Overview</h2></CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {ep.companyName && (
                    <div className="flex items-start gap-2">
                      <Building2 size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                        <p className="font-medium text-gray-900">{ep.companyName}</p>
                      </div>
                    </div>
                  )}
                  {ep.industry && (
                    <div className="flex items-start gap-2">
                      <Target size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Industry</p>
                        <p className="font-medium text-gray-900">{ep.industry}</p>
                      </div>
                    </div>
                  )}
                  {ep.fundingStage && (
                    <div className="flex items-start gap-2">
                      <DollarSign size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Stage</p>
                        <p className="font-medium text-gray-900">{ep.fundingStage}</p>
                      </div>
                    </div>
                  )}
                  {ep.location && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="font-medium text-gray-900">{ep.location}</p>
                      </div>
                    </div>
                  )}
                  {ep.foundedYear && (
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Founded</p>
                        <p className="font-medium text-gray-900">{ep.foundedYear}</p>
                      </div>
                    </div>
                  )}
                  {ep.teamSize && (
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-primary-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Team Size</p>
                        <p className="font-medium text-gray-900">{ep.teamSize} people</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Funding */}
          {ep && (ep.fundingAmount || ep.fundingTarget || ep.fundingStage) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Funding</h2></CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ep.fundingStage && (
                    <div className="p-4 bg-primary-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stage</p>
                      <p className="font-semibold text-primary-700">{ep.fundingStage}</p>
                    </div>
                  )}
                  {ep.fundingAmount && (
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Raised</p>
                      <p className="font-semibold text-green-700">{ep.fundingAmount}</p>
                    </div>
                  )}
                  {ep.fundingTarget && (
                    <div className="p-4 bg-accent-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Seeking</p>
                      <p className="font-semibold text-accent-700">{ep.fundingTarget}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Team */}
          {ep?.teamDescription && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary-600" />
                  <h2 className="text-lg font-medium text-gray-900">Team</h2>
                  {ep.teamSize && <Badge variant="gray">{ep.teamSize} members</Badge>}
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700 leading-relaxed">{ep.teamDescription}</p>
              </CardBody>
            </Card>
          )}

          {/* Startup History */}
          {entrepreneur.startupHistories && entrepreneur.startupHistories.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Previous Startups</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {entrepreneur.startupHistories.map((h) => (
                    <div key={h.id} className="border-l-2 border-primary-200 pl-4">
                      <h3 className="font-medium text-gray-900">{h.companyName}</h3>
                      {h.position && <p className="text-sm text-gray-600">{h.position}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(h.startDate).getFullYear()} – {h.endDate ? new Date(h.endDate).getFullYear() : 'Present'}
                      </p>
                      {h.description && <p className="text-sm text-gray-600 mt-1">{h.description}</p>}
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
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Documents</h2></CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {ep.pitchDeck && (
                    <a href={ep.pitchDeck} target="_blank" rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div><h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3></div>
                    </a>
                  )}
                  {ep.businessPlan && (
                    <a href={ep.businessPlan} target="_blank" rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div><h3 className="text-sm font-medium text-gray-900">Business Plan</h3></div>
                    </a>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Quick stats */}
          {ep && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Quick Stats</h2></CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {ep.teamSize && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team Size</span>
                      <span className="font-semibold text-gray-900">{ep.teamSize}</span>
                    </div>
                  )}
                  {ep.foundedYear && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Founded</span>
                      <span className="font-semibold text-gray-900">{ep.foundedYear}</span>
                    </div>
                  )}
                  {ep.industry && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Industry</span>
                      <span className="font-semibold text-gray-900">{ep.industry}</span>
                    </div>
                  )}
                  {ep.fundingStage && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stage</span>
                      <Badge variant="accent" size="sm">{ep.fundingStage}</Badge>
                    </div>
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
                {new Date(entrepreneur.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
