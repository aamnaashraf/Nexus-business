import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { UserSummary } from '../../services/userAPI';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: UserSummary;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const fullName = `${entrepreneur.firstName} ${entrepreneur.lastName}`;
  const avatarSrc =
    entrepreneur.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;

  const ep = entrepreneur.entrepreneurProfile;

  const handleViewProfile = () => navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${entrepreneur.id}`);
  };

  return (
    <Card hoverable className="transition-all duration-300 h-full" onClick={handleViewProfile}>
      <CardBody className="flex flex-col">
        <div className="flex items-start">
          <Avatar src={avatarSrc} alt={fullName} size="lg" className="mr-4" />

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{fullName}</h3>
            <p className="text-sm text-gray-500 mb-2">
              {ep?.companyName || 'Entrepreneur'}
            </p>

            <div className="flex flex-wrap gap-1 mb-2">
              {ep?.industry && <Badge variant="primary" size="sm">{ep.industry}</Badge>}
              {ep?.fundingStage && <Badge variant="accent" size="sm">{ep.fundingStage}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm text-gray-600 line-clamp-3">
            {entrepreneur.bio || 'No bio provided.'}
          </p>
        </div>
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
