import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { useAuth } from '../../context/AuthContext';
import { userAPI, UserSummary } from '../../services/userAPI';
import { meetingAPI, Meeting } from '../../services/meetingAPI';
import toast from 'react-hot-toast';

export const InvestorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entrepreneurs, setEntrepreneurs] = useState<UserSummary[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoadingEntrepreneurs, setIsLoadingEntrepreneurs] = useState(true);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    userAPI
      .getAllUsers('ENTREPRENEUR')
      .then((res) => setEntrepreneurs(res.data))
      .catch(() => toast.error('Failed to load startups'))
      .finally(() => setIsLoadingEntrepreneurs(false));

    meetingAPI
      .getMyMeetings()
      .then((res) => setMeetings(res.data))
      .catch(() => {})
      .finally(() => setIsLoadingMeetings(false));
  }, []);

  if (!user) return null;

  const industries = Array.from(
    new Set(
      entrepreneurs
        .map((e) => e.entrepreneurProfile?.industry)
        .filter((i): i is string => !!i)
    )
  );

  const filteredEntrepreneurs = entrepreneurs.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      fullName.includes(searchQuery.toLowerCase()) ||
      (e.entrepreneurProfile?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.entrepreneurProfile?.industry || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.bio || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustries.length === 0 ||
      selectedIndustries.includes(e.entrepreneurProfile?.industry || '');

    return matchesSearch && matchesIndustry;
  });

  const toggleIndustry = (industry: string) =>
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );

  const acceptedMeetings = meetings.filter((m) => m.status === 'ACCEPTED');
  const upcomingMeetings = meetings.filter(
    (m) => (m.status === 'PENDING' || m.status === 'ACCEPTED') && new Date(m.startTime) > new Date()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Startups</h1>
          <p className="text-gray-600">Find and connect with promising entrepreneurs</p>
        </div>
        <Link to="/entrepreneurs">
          <Button leftIcon={<PlusCircle size={18} />}>View All Startups</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
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
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">{upcomingMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-green-50 border border-green-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <CheckCircle size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Accepted Meetings</p>
                <h3 className="text-xl font-semibold text-green-900">{acceptedMeetings.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search + industry filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search startups, industries, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            startAdornment={<Search size={18} />}
          />
        </div>
        {industries.length > 0 && (
          <div className="w-full md:w-1/3 flex items-center gap-2 flex-wrap">
            {industries.map((industry) => (
              <Badge
                key={industry}
                variant={selectedIndustries.includes(industry) ? 'primary' : 'gray'}
                className="cursor-pointer"
                onClick={() => toggleIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Entrepreneurs grid */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Featured Startups
            {!isLoadingEntrepreneurs && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {filteredEntrepreneurs.length} results
              </span>
            )}
          </h2>
        </CardHeader>
        <CardBody>
          {isLoadingEntrepreneurs ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : filteredEntrepreneurs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {entrepreneurs.length === 0
                  ? 'No entrepreneurs have registered yet.'
                  : 'No startups match your filters.'}
              </p>
              {selectedIndustries.length > 0 && (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntrepreneurs.map((entrepreneur) => (
                <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
