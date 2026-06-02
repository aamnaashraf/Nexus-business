import React, { useEffect, useRef, useState } from 'react';
import { User, Mail, Building2, Briefcase, Camera, Save, Linkedin, Twitter, Globe, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/authAPI';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export const MyProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Editable base fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Social links
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');

  // Entrepreneur-specific
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [fundingStage, setFundingStage] = useState('');

  // Investor-specific
  const [investmentFocus, setInvestmentFocus] = useState('');
  const [ticketSize, setTicketSize] = useState('');
  const [portfolioCompanies, setPortfolioCompanies] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getProfile();
      const data = response.data;
      setProfileData(data);

      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setBio(data.bio || '');
      setProfileImage(data.profileImage || '');

      setLinkedin(data.socialLinks?.linkedin || '');
      setTwitter(data.socialLinks?.twitter || '');
      setWebsite(data.socialLinks?.website || '');

      if (data.role === 'ENTREPRENEUR' && data.entrepreneurProfile) {
        setCompanyName(data.entrepreneurProfile.companyName || '');
        setIndustry(data.entrepreneurProfile.industry || '');
        setFundingStage(data.entrepreneurProfile.fundingStage || '');
      }
      if (data.role === 'INVESTOR' && data.investorProfile) {
        setInvestmentFocus((data.investorProfile.investmentFocus || []).join(', '));
        setTicketSize(data.investorProfile.ticketSize || '');
        setPortfolioCompanies(String(data.investorProfile.portfolioCompanies || 0));
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const result = await authAPI.uploadAvatar(file);
      setProfileImage(result.profileImage);
      await updateProfile(user!.id, { avatarUrl: result.profileImage });
      toast.success('Profile photo updated');
      fetchProfile();
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio,
        profileImage,
        socialLinks: {
          linkedin: linkedin.trim() || undefined,
          twitter: twitter.trim() || undefined,
          website: website.trim() || undefined,
        },
      };

      if (profileData?.role === 'ENTREPRENEUR') {
        payload.entrepreneurProfile = {
          companyName: companyName.trim() || undefined,
          industry: industry.trim() || undefined,
          fundingStage: fundingStage.trim() || undefined,
        };
      }

      if (profileData?.role === 'INVESTOR') {
        payload.investorProfile = {
          investmentFocus: investmentFocus
            ? investmentFocus.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
          ticketSize: ticketSize.trim() || undefined,
          portfolioCompanies: parseInt(portfolioCompanies, 10) || 0,
        };
      }

      await authAPI.updateProfile(payload);
      await updateProfile(user!.id, {
        name: `${firstName.trim()} ${lastName.trim()}`,
        bio,
        avatarUrl: profileImage,
      });

      toast.success('Profile updated successfully!');
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
        <p className="text-gray-600 mt-2">Unable to load your profile data.</p>
      </div>
    );
  }

  const displayAvatar =
    profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${profileData.firstName} ${profileData.lastName}`
    )}&background=random`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Save size={18} />}>
          Save Changes
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar src={displayAvatar} alt={`${firstName} ${lastName}`} size="xl" />
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50"
                title="Upload photo"
              >
                {isUploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-gray-600 flex items-center mt-1">
                <Mail size={16} className="mr-2" />
                {profileData.email}
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profileData.role === 'ENTREPRENEUR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {profileData.role === 'ENTREPRENEUR' ? (
                    <><Building2 size={14} className="mr-1" /> Entrepreneur</>
                  ) : (
                    <><Briefcase size={14} className="mr-1" /> Investor</>
                  )}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    profileData.verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {profileData.verified ? '✓ Verified' : 'Not Verified'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Member since{' '}
                {new Date(profileData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              startAdornment={<User size={18} />}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              startAdornment={<User size={18} />}
            />
          </div>

          <Input
            label="Email"
            value={profileData.email}
            disabled
            fullWidth
            startAdornment={<Mail size={18} />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
          </div>
        </CardBody>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Social Links</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="LinkedIn"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            fullWidth
            startAdornment={<Linkedin size={18} />}
            placeholder="https://linkedin.com/in/yourprofile"
          />
          <Input
            label="Twitter / X"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            fullWidth
            startAdornment={<Twitter size={18} />}
            placeholder="https://twitter.com/yourhandle"
          />
          <Input
            label="Website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            fullWidth
            startAdornment={<Globe size={18} />}
            placeholder="https://yourwebsite.com"
          />
        </CardBody>
      </Card>

      {/* Entrepreneur Profile */}
      {profileData.role === 'ENTREPRENEUR' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Entrepreneur Profile</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              fullWidth
              startAdornment={<Building2 size={18} />}
              placeholder="Your startup name"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select industry</option>
                  {[
                    'Technology', 'FinTech', 'HealthTech', 'EdTech', 'E-Commerce',
                    'SaaS', 'AI / ML', 'CleanTech', 'AgriTech', 'Real Estate',
                    'Logistics', 'Media', 'Other',
                  ].map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Funding Stage</label>
                <select
                  value={fundingStage}
                  onChange={(e) => setFundingStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select stage</option>
                  {['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'IPO'].map(
                    (opt) => <option key={opt} value={opt}>{opt}</option>
                  )}
                </select>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Investor Profile */}
      {profileData.role === 'INVESTOR' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Investor Profile</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Focus
              </label>
              <input
                type="text"
                value={investmentFocus}
                onChange={(e) => setInvestmentFocus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. SaaS, FinTech, HealthTech (comma-separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple with commas</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ticket Size"
                value={ticketSize}
                onChange={(e) => setTicketSize(e.target.value)}
                fullWidth
                placeholder="e.g. $50K - $500K"
              />
              <Input
                label="Portfolio Companies"
                type="number"
                value={portfolioCompanies}
                onChange={(e) => setPortfolioCompanies(e.target.value)}
                fullWidth
                placeholder="0"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900">Account Statistics</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Startup Histories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {profileData.startupHistories?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Investment Histories</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {profileData.investmentHistories?.length || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {profileData.verified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Save button at the bottom too */}
      <div className="flex justify-end pb-6">
        <Button onClick={handleSaveProfile} isLoading={isSaving} leftIcon={<Save size={18} />}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};
