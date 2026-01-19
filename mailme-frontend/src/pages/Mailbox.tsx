import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmailList, { Email } from '@/components/EmailList';
import EmailView from '@/components/EmailView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEmails } from '@/hooks/useMailbox';
import SEO from '@/components/SEO';
import type { Email as ApiEmail } from '@/lib/api';

// Helper to format timestamp
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Convert API email to component email format
function convertEmail(apiEmail: ApiEmail): Email {
  const preview = apiEmail.text || apiEmail.html || 'No content';
  // Strip HTML tags for preview
  const textPreview = preview.replace(/<[^>]*>/g, '').substring(0, 100);

  return {
    id: apiEmail.id,
    from: apiEmail.from,
    subject: apiEmail.subject || '(no subject)',
    preview: textPreview + (textPreview.length >= 100 ? '...' : ''),
    timestamp: formatTimestamp(apiEmail.createdAt),
    read: false, // We'll track this in state
  };
}

const Mailbox = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [readEmails, setReadEmails] = useState<Set<string>>(new Set());

  // Get username from sessionStorage and redirect if not found
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('mailboxUsername');
    if (!storedUsername) {
      // Redirect to home if username is not in sessionStorage
      navigate('/');
      return;
    }
    setUsername(storedUsername);
  }, [navigate]);

  // Fetch emails with auto-refresh every 15 seconds
  const {
    data: apiEmails = [],
    isLoading,
    isFetching,
    refetch,
  } = useEmails(username || undefined, {
    enabled: !!username,
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Convert API emails to component format and mark read status
  const emails = useMemo(() => {
    return apiEmails.map(convertEmail).map(email => ({
      ...email,
      read: readEmails.has(email.id),
    }));
  }, [apiEmails, readEmails]);

  const tempEmail = username
    ? `${username}@${import.meta.env.VITE_DOMAIN || 'mailme.local'}`
    : '';

  const selectedEmail = selectedEmailId
    ? (() => {
        const apiEmail = apiEmails.find(e => e.id === selectedEmailId);
        if (!apiEmail) return null;
        return {
          from: apiEmail.from,
          subject: apiEmail.subject || '(no subject)',
          content: apiEmail.html || apiEmail.text || 'No content available',
          timestamp: formatTimestamp(apiEmail.createdAt),
          html: apiEmail.html,
        };
      })()
    : null;

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(tempEmail);
    toast.success('Email address copied to clipboard');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    toast.info('Checking for new emails...');
    await refetch();
  };

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setReadEmails(prev => new Set(prev).add(id));
  };

  // Don't render if username is not available (will redirect)
  if (!username) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 bg-linear-to-br from-background">
      <SEO
        title="Your Mailbox - MailMe"
        description="View your temporary email inbox. Secure, private, and auto-deletes after 24 hours."
        url="https://mailme.itssvk.dev/mailbox"
        noindex={true}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
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
              disabled={isFetching}
              className="cursor-pointer hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
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
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading emails...</p>
              </Card>
            ) : (
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={handleSelectEmail}
              />
            )}
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
