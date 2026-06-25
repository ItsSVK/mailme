import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Labeled match first ("code: 123456"), then bare standalone 4-8 digit block.
// Skips years (1900-2099) and common phone-number-like contexts.
function extractOTP(text: string): string | null {
  const labeled = text.match(
    /(?:otp|one[\s-]*time|passcode|pin|verification[\s-]*code|confirm(?:ation)?[\s-]*code|security[\s-]*code|access[\s-]*code|auth(?:entication)?[\s-]*code)[^\d]{0,30}(\d{4,8})/i
  );
  if (labeled) return labeled[1];

  const bare = text.match(/(?<!\d)(\d{4,8})(?!\d)/);
  return bare?.[1] ?? null;
}

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
  const [otp, setOtp] = useState<string | null>(null);
  const [otpCopied, setOtpCopied] = useState(false);

  // Reset state on email change
  useEffect(() => {
    setOtp(null);
    setOtpCopied(false);
    if (email?.html) setIsIframeLoaded(false);
    // Plain-text emails: extract immediately from content
    if (!email?.html && email?.content) setOtp(extractOTP(email.content));
  }, [email?.id, email?.html, email?.content]);

  const handleCopyOtp = async () => {
    if (!otp) return;
    await navigator.clipboard.writeText(otp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.documentElement) return;

    // Force every link in the email to open in a new tab instead of
    // navigating the sandboxed iframe (which fails to load).
    const base = doc.createElement('base');
    base.target = '_blank';
    (doc.head ?? doc.documentElement).appendChild(base);

    // Inject styles that strip default body margin and hide any scrollbars
    // that the email's own HTML might trigger inside the iframe.
    const style = doc.createElement('style');
    style.textContent = `
      html, body {
        margin: 0 !important;
        overflow-x: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      /* Zero-specificity default: plain emails get breathing room,
         but emails that set their own padding (full-bleed designs) win. */
      :where(html, body) {
        padding: 16px;
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

    // Extract OTP from rendered text (catches JS-rendered content too)
    const text = doc.body?.innerText ?? '';
    const detected = extractOTP(text);
    if (detected) setOtp(detected);
  }, []);

  if (isLoading) {
    return (
      <Card className="p-8 h-full flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground italic">Fetching email content...</p>
        </div>
      </Card>
    );
  }

  if (!email) {
    return (
      <Card className="p-8 h-full flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-background neu-inset flex items-center justify-center mb-5">
            <Mail className="w-9 h-9 text-muted-foreground opacity-60" />
          </div>
          <p className="font-semibold text-foreground">Select an email to view</p>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a message from the list on the left
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 h-full flex flex-col animate-scale-in">
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

      <div className="border-b border-border/60 pb-4 mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {email.subject}
        </h2>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-background neu-sm flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1">
            <p className="font-medium text-foreground">{email.from}</p>
            <p className="text-sm text-muted-foreground">{email.timestamp}</p>
          </div>
        </div>
      </div>

      {otp && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-background neu-sm border border-primary/20 animate-fade-in">
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
              OTP
            </span>
            <span className="font-mono text-xl font-bold text-primary tracking-[0.25em]">
              {otp}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleCopyOtp}
            className="h-8 px-3 text-xs shrink-0 cursor-pointer"
          >
            {otpCopied ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            {otpCopied ? 'Copied!' : 'Copy OTP'}
          </Button>
        </div>
      )}

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
              className="w-full border-0 rounded-lg"
              style={{
                colorScheme: 'light',
                // Email HTML is authored for light backgrounds; render every
                // message on a white sheet so dark-themed pages stay readable.
                backgroundColor: '#ffffff',
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
