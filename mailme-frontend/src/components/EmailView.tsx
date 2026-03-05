import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailViewProps {
  email: {
    id?: string;
    from: string;
    subject: string;
    content: string;
    timestamp: string;
    html?: string | null;
  } | null;
  isLoading?: boolean;
  onBack?: () => void;
}

const EmailView = ({ email, isLoading, onBack }: EmailViewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Reset iframe loaded state whenever the selected email changes
  useEffect(() => {
    if (email?.html) {
      setIsIframeLoaded(false);
    }
  }, [email?.id, email?.html]);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.documentElement) return;

    // Inject styles that strip default body margin and hide any scrollbars
    // that the email's own HTML might trigger inside the iframe.
    const style = doc.createElement('style');
    style.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
      }
    `;
    (doc.head ?? doc.documentElement).appendChild(style);

    // Take the max of both scrollHeight values — email templates vary in which
    // element carries the full content height.
    const height = Math.max(
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
    );
    iframe.style.height = `${height}px`;
    setIsIframeLoaded(true);
  }, []);

  if (isLoading) {
    return (
      <Card className="p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground italic">Fetching email content...</p>
        </div>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Select an email to view</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full flex flex-col">
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 md:hidden w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      <div className="border-b border-border pb-4 mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {email.subject}
        </h2>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-foreground">{email.from}</p>
            <p className="text-sm text-muted-foreground">{email.timestamp}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {email.html ? (
          <>
            {/* Spinner shown until iframe onLoad fires */}
            {!isIframeLoaded && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground italic">Loading email body...</p>
                </div>
              </div>
            )}
            <iframe
              key={email.id ?? email.html}
              ref={iframeRef}
              srcDoc={email.html}
              sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              title="Email content"
              onLoad={handleIframeLoad}
              className="w-full border-0 rounded"
              style={{
                colorScheme: 'light',
                height: 0,
                // Keep iframe in the DOM but invisible until loaded so onLoad fires
                visibility: isIframeLoaded ? 'visible' : 'hidden',
                overflow: 'hidden',
              }}
            />
          </>
        ) : (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {email.content}
          </div>
        )}
      </div>
    </Card>
  );
};

export default EmailView;
