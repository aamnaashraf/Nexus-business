import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { userAPI, UserSummary } from '../../services/userAPI';
import toast from 'react-hot-toast';

export const EntrepreneursPage: React.FC = () => {
  const [entrepreneurs, setEntrepreneurs] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    userAPI
      .getAllUsers('ENTREPRENEUR')
      .then((res) => setEntrepreneurs(res.data))
      .catch(() => toast.error('Failed to load startups'))
      .finally(() => setIsLoading(false));
  }, []);

  const allIndustries = Array.from(
    new Set(
      entrepreneurs
        .map((e) => e.entrepreneurProfile?.industry)
        .filter((i): i is string => !!i)
    )
  );

  const filtered = entrepreneurs.filter((e) => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              {allIndustries.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Industry</h3>
                  <div className="space-y-1">
                    {allIndustries.map((industry) => (
                      <button
                        key={industry}
                        onClick={() => toggleIndustry(industry)}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedIndustries.includes(industry)
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedIndustries.length > 0 && (
                <button
                  onClick={() => setSelectedIndustries([])}
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
              placeholder="Search startups by name, industry, or keywords..."
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
              {entrepreneurs.length === 0
                ? 'No entrepreneurs have registered yet.'
                : 'No startups match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map((entrepreneur) => (
                <EntrepreneurCard key={entrepreneur.id} entrepreneur={entrepreneur} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
