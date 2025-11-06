import { Card } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailViewProps {
  email: {
    from: string;
    subject: string;
    content: string;
    timestamp: string;
    html?: string | null;
  } | null;
  onBack?: () => void;
}

const EmailView = ({ email, onBack }: EmailViewProps) => {
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
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: email.html }}
          />
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
