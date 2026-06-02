import React, { useState, useRef } from 'react';
import { Search, Book, MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const faqs = [
  {
    question: 'How do I connect with investors?',
    answer:
      'Browse the investor directory and visit any investor profile to send them a direct message. Once you start chatting, you can schedule meetings through the Meetings section.',
  },
  {
    question: 'What should I include in my startup profile?',
    answer:
      'Your startup profile should include a compelling pitch, funding needs, team information, market opportunity, and any traction or metrics that demonstrate your progress.',
  },
  {
    question: 'How do I share documents securely?',
    answer:
      'You can upload pitch decks and business plans directly on your profile page. These are stored securely and can be viewed by investors browsing your profile.',
  },
  {
    question: 'How do meeting requests work?',
    answer:
      'Investors can send meeting requests to entrepreneurs from their profile page. Entrepreneurs receive a notification and can accept or decline the request from the Meetings section.',
  },
  {
    question: 'How do I update my profile photo?',
    answer:
      'Go to Settings → Profile and click "Change Photo". You can upload a JPG, PNG, or WEBP image up to 5MB. The photo is automatically cropped to a square.',
  },
  {
    question: 'What can I do if I forget my password?',
    answer:
      'On the login page, click "Forgot password?" and enter your email. You will receive a 6-digit OTP to verify your identity, after which you can set a new password.',
  },
];

export const HelpPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const faqRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSending(false);
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions or get in touch with our support team</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl">
        <Input
          placeholder="Search help articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<Search size={18} />}
          fullWidth
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Book size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Documentation</h2>
            <p className="text-sm text-gray-600 mt-2">Browse our detailed documentation and guides</p>
            <Button
              variant="outline"
              className="mt-4"
              rightIcon={<ExternalLink size={16} />}
              onClick={() => scrollTo(faqRef)}
            >
              View Docs
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <MessageCircle size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Live Chat</h2>
            <p className="text-sm text-gray-600 mt-2">Chat with our support team in real-time</p>
            <Button className="mt-4" onClick={() => scrollTo(contactRef)}>
              Start Chat
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-lg mb-4">
              <Phone size={24} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Contact Us</h2>
            <p className="text-sm text-gray-600 mt-2">Get help via email or phone</p>
            <Button
              variant="outline"
              className="mt-4"
              leftIcon={<Mail size={16} />}
              onClick={() => window.location.href = 'mailto:support@nexusplatform.com'}
            >
              Contact Support
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* FAQs */}
      <div ref={faqRef}><Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Frequently Asked Questions
            {search && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
        </CardHeader>
        <CardBody>
          {filteredFaqs.length > 0 ? (
            <div className="space-y-6">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-base font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No articles match your search. Try a different term or contact support below.
            </p>
          )}
        </CardBody>
      </Card></div>

      {/* Contact form */}
      <div ref={contactRef}><Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Still need help?</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleContactSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Name"
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                placeholder="How can we help you?"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isSending}>
              Send Message
            </Button>
          </form>
        </CardBody>
      </Card></div>
    </div>
  );
};
