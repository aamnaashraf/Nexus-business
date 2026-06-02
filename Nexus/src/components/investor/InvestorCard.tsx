import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, Briefcase } from 'lucide-react';
import { UserSummary } from '../../services/userAPI';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: UserSummary;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const fullName = `${investor.firstName} ${investor.lastName}`;
  const avatarSrc =
    investor.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

  const ip = investor.investorProfile;

  const handleViewProfile = () => navigate(`/profile/investor/${investor.id}`);
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${investor.id}`);
  };

  return (
    <Card hoverable className="transition-all duration-300 h-full" onClick={handleViewProfile}>
      <CardBody className="flex flex-col">
        <div className="flex items-start">
          <Avatar src={avatarSrc} alt={fullName} size="lg" className="mr-4" />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{fullName}</h3>
            <p className="text-sm text-gray-500 mb-2">
              <Briefcase size={13} className="inline mr-1" />
              Investor
              {ip?.portfolioCompanies
                ? ` • ${ip.portfolioCompanies} portfolio companies`
                : ''}
            </p>

            {ip?.investmentFocus && ip.investmentFocus.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {ip.investmentFocus.slice(0, 3).map((focus, i) => (
                  <Badge key={i} variant="primary" size="sm">{focus}</Badge>
                ))}
                {ip.investmentFocus.length > 3 && (
                  <Badge variant="gray" size="sm">+{ip.investmentFocus.length - 3}</Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {investor.bio || 'No bio provided.'}
          </p>
        </div>

        {ip?.ticketSize && (
          <div className="mt-3">
            <span className="text-xs text-gray-500">Ticket Size</span>
            <p className="text-sm font-medium text-gray-900">{ip.ticketSize}</p>
          </div>
        )}
      </CardBody>

      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
