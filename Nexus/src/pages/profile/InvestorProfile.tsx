import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageCircle, UserCircle, BarChart3, Briefcase,
  Globe, Linkedin, Twitter, MapPin, TrendingUp, Target
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { userAPI, UserDetail } from '../../services/userAPI';
import toast from 'react-hot-toast';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [investor, setInvestor] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    userAPI.getUserById(id)
      .then((res) => {
        if (res.data.role !== 'INVESTOR') setInvestor(null);
        else setInvestor(res.data);
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

  if (!investor) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <p className="text-gray-600 mt-2">This profile doesn't exist or has been removed.</p>
        <Link to="/dashboard/entrepreneur"><Button variant="outline" className="mt-4">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const fullName = `${investor.firstName} ${investor.lastName}`;
  const avatarSrc = investor.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  const isCurrentUser = currentUser?.id === investor.id;
  const ip = investor.investorProfile;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header card */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar src={avatarSrc} alt={fullName} size="xl" className="mx-auto sm:mx-0" />
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Briefcase size={16} className="mr-1" /> Investor
                {ip?.portfolioCompanies ? ` · ${ip.portfolioCompanies} portfolio companies` : ''}
              </p>
              {ip?.location && (
                <p className="text-gray-500 flex items-center justify-center sm:justify-start mt-1 text-sm">
                  <MapPin size={14} className="mr-1" /> {ip.location}
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {ip?.ticketSize && <Badge variant="accent">{ip.ticketSize}</Badge>}
                {ip?.investmentFocus?.map((f, i) => <Badge key={i} variant="primary" size="sm">{f}</Badge>)}
                {investor.socialLinks?.linkedin && (
                  <a href={investor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {investor.socialLinks?.twitter && (
                  <a href={investor.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Twitter size={13} /> Twitter
                  </a>
                )}
                {investor.socialLinks?.website && (
                  <a href={investor.socialLinks.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${investor.id}`}>
                <Button leftIcon={<MessageCircle size={18} />}>Message</Button>
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
              <p className="text-gray-700 leading-relaxed">{investor.bio || 'No bio provided yet.'}</p>
            </CardBody>
          </Card>

          {/* Investment Focus */}
          {ip && (ip.investmentFocus?.length > 0 || ip.investmentStage?.length > 0 || ip.ticketSize) && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Investment Thesis</h2></CardHeader>
              <CardBody className="space-y-5">
                {ip.investmentFocus && ip.investmentFocus.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-primary-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Investment Focus</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ip.investmentFocus.map((f, i) => <Badge key={i} variant="primary">{f}</Badge>)}
                    </div>
                  </div>
                )}
                {ip.investmentStage && ip.investmentStage.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-primary-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Investment Stage</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ip.investmentStage.map((s, i) => <Badge key={i} variant="accent">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {ip.ticketSize && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={16} className="text-primary-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Typical Ticket Size</h3>
                    </div>
                    <p className="text-gray-900 font-semibold text-lg">{ip.ticketSize}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Investment History */}
          {investor.investmentHistories && investor.investmentHistories.length > 0 && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Portfolio Highlights</h2></CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {investor.investmentHistories.map((h) => (
                    <div key={h.id} className="border-l-2 border-primary-200 pl-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{h.companyName}</h3>
                        <span className="text-sm font-semibold text-primary-700">
                          {h.currency} {Number(h.amount).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(h.investmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
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
          {ip && (
            <Card>
              <CardHeader><h2 className="text-lg font-medium text-gray-900">Stats</h2></CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Portfolio Companies</h3>
                        <p className="text-xl font-semibold text-primary-700 mt-1">{ip.portfolioCompanies}</p>
                      </div>
                      <BarChart3 size={24} className="text-primary-600" />
                    </div>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Investment Records</h3>
                        <p className="text-xl font-semibold text-primary-700 mt-1">
                          {investor.investmentHistories?.length ?? 0}
                        </p>
                      </div>
                      <Briefcase size={24} className="text-primary-600" />
                    </div>
                  </div>
                  {ip.investmentStage && ip.investmentStage.length > 0 && (
                    <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Stages</h3>
                      <div className="flex flex-wrap gap-1">
                        {ip.investmentStage.map((s, i) => (
                          <Badge key={i} variant="accent" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(investor.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
