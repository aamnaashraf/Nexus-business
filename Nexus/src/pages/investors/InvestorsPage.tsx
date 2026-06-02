import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { userAPI, UserSummary } from '../../services/userAPI';
import toast from 'react-hot-toast';

export const InvestorsPage: React.FC = () => {
  const [investors, setInvestors] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  useEffect(() => {
    userAPI
      .getAllUsers('INVESTOR')
      .then((res) => setInvestors(res.data))
      .catch(() => toast.error('Failed to load investors'))
      .finally(() => setIsLoading(false));
  }, []);

  // Unique investment focus tags from all investor profiles
  const allFocusTags = Array.from(
    new Set(investors.flatMap((i) => i.investorProfile?.investmentFocus ?? []))
  );

  const filtered = investors.filter((investor) => {
    const fullName = `${investor.firstName} ${investor.lastName}`.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      fullName.includes(searchQuery.toLowerCase()) ||
      (investor.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.investorProfile?.investmentFocus ?? []).some((f) =>
        f.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesFocus =
      selectedFocus.length === 0 ||
      (investor.investorProfile?.investmentFocus ?? []).some((f) =>
        selectedFocus.includes(f)
      );

    return matchesSearch && matchesFocus;
  });

  const toggleFocus = (focus: string) =>
    setSelectedFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {allFocusTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {allFocusTags.map((focus) => (
                      <Badge
                        key={focus}
                        variant={selectedFocus.includes(focus) ? 'primary' : 'gray'}
                        className="cursor-pointer"
                        onClick={() => toggleFocus(focus)}
                      >
                        {focus}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedFocus.length > 0 && (
                <button
                  onClick={() => setSelectedFocus([])}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, focus, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">{filtered.length} results</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              {investors.length === 0
                ? 'No investors have registered yet.'
                : 'No investors match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((investor) => (
                <InvestorCard key={investor.id} investor={investor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
