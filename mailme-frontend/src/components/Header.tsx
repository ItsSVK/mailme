import { Mail } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  showEmail?: boolean;
  tempEmail?: string;
}

const Header = ({ showEmail, tempEmail }: HeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-primary-glow flex items-center justify-center">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1
            className="text-lg font-bold text-foreground cursor-pointer"
            onClick={() => navigate('/')}
          >
            MailMe
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {showEmail && tempEmail && (
            <div className="hidden md:flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {tempEmail}
              </span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
