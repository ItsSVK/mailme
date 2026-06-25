import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (id: string) => void;
}

const EmailList = ({
  emails,
  selectedEmailId,
  onSelectEmail,
}: EmailListProps) => {
  return (
    <div className="space-y-3">
      {emails.map((email, i) => {
        const isSelected = selectedEmailId === email.id;
        return (
          <button
            key={email.id}
            type="button"
            onClick={() => onSelectEmail(email.id)}
            className={cn(
              'w-full text-left p-4 rounded-xl bg-background border border-border/60 cursor-pointer transition-all duration-200 animate-slide-up',
              isSelected ? 'neu-inset' : 'neu-sm hover:neu-md'
            )}
            style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-background neu-sm flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3
                    className={cn(
                      'truncate text-foreground',
                      email.read ? 'font-medium' : 'font-bold'
                    )}
                  >
                    {email.from}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {email.timestamp}
                  </span>
                </div>

                <p
                  className={cn(
                    'text-sm text-foreground mb-1 truncate',
                    email.read ? 'font-normal' : 'font-semibold'
                  )}
                >
                  {!email.read && (
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                  )}
                  {email.subject}
                </p>

                <p className="text-sm text-muted-foreground truncate">
                  {email.preview}
                </p>
              </div>
            </div>
          </button>
        );
      })}

      {emails.length === 0 && (
        <div className="flex flex-col items-center text-center py-16 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-background neu-inset flex items-center justify-center mb-5">
            <Mail className="w-9 h-9 text-muted-foreground opacity-60" />
          </div>
          <p className="font-semibold text-foreground">No emails yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Incoming emails will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailList;
