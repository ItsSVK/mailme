import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import EmailList, { Email } from '@/components/EmailList';
import EmailView from '@/components/EmailView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for demonstration
const mockEmails: Email[] = [
  {
    id: '1',
    from: 'welcome@service.com',
    subject: 'Welcome to our service!',
    preview: "Thank you for signing up. We're excited to have you on board...",
    timestamp: '2 min ago',
    read: false,
  },
  {
    id: '2',
    from: 'noreply@updates.com',
    subject: 'Your verification code',
    preview: 'Your verification code is: 123456. This code will expire in...',
    timestamp: '15 min ago',
    read: false,
  },
  {
    id: '3',
    from: 'newsletter@tech.com',
    subject: 'Weekly Tech Digest',
    preview: "Here are this week's top stories in technology and innovation...",
    timestamp: '1 hour ago',
    read: true,
  },
];

const mockEmailContents: Record<string, string> = {
  '1': "Thank you for signing up for our service! We're excited to have you on board. Get started by exploring our features and customizing your experience. ",
  '2': "Your verification code is: 123456\n\nThis code will expire in 10 minutes. Please use it to complete your registration.\n\nIf you didn't request this code, please ignore this email.",
  '3': "Here are this week's top stories in technology and innovation:\n\n1. AI breakthroughs in natural language processing\n2. New developments in quantum computing\n3. Sustainable tech solutions for climate change\n\nRead more on our website.",
};

const Mailbox = () => {
  const { username } = useParams();
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const [copied, setCopied] = useState(false);

  const tempEmail = `${username}@${
    import.meta.env.VITE_DOMAIN || 'mailme.itssvk.dev'
  }`;

  const selectedEmail = selectedEmailId
    ? {
        ...emails.find(e => e.id === selectedEmailId)!,
        content:
          mockEmailContents[selectedEmailId] || 'Email content not found',
      }
    : null;

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(tempEmail);
    toast.success('Email address copied to clipboard');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const handleRefresh = () => {
    toast.success('Checking for new emails...');
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setEmails(
      emails.map(email => (email.id === id ? { ...email, read: true } : email))
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background">
      <Header showEmail tempEmail={tempEmail} />

      <main className="container mx-auto px-4 py-6">
        <Card className="p-4 mb-6 flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">
                Your temporary email
              </p>
              <p className="text-lg font-semibold text-foreground truncate">
                {tempEmail}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEmail}
              disabled={copied}
              className="cursor-pointer hover:opacity-90 transition-opacity"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="cursor-pointer hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-5 gap-6">
          <div
            className={`lg:col-span-2 ${
              selectedEmailId ? 'hidden lg:block' : ''
            }`}
          >
            <EmailList
              emails={emails}
              selectedEmailId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
            />
          </div>

          <div
            className={`lg:col-span-3 ${
              !selectedEmailId ? 'hidden lg:block' : ''
            }`}
          >
            <EmailView
              email={selectedEmail}
              onBack={() => setSelectedEmailId(undefined)}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Mailbox;
