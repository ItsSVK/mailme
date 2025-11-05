import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
    <div className="space-y-2">
      {emails.map(email => (
        <Card
          key={email.id}
          className={cn(
            'p-4 cursor-pointer transition-all hover:shadow-md border',
            selectedEmailId === email.id
              ? 'bg-accent/10 border-accent'
              : 'hover:bg-secondary/50',
            !email.read && 'bg-card font-medium'
          )}
          onClick={() => onSelectEmail(email.id)}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {email.from}
                </h3>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {email.timestamp}
                </span>
              </div>

              <p className="text-sm font-medium text-foreground mb-1 truncate">
                {email.subject}
              </p>

              <p className="text-sm text-muted-foreground truncate">
                {email.preview}
              </p>
            </div>
          </div>
        </Card>
      ))}

      {emails.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No emails yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Incoming emails will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailList;
