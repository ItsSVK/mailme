import { Mail, Star } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
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
          <Button
            variant="outline"
            size="sm"
            asChild
            className="relative cursor-pointer"
          >
            <a
              href="https://github.com/Itssvk/mailme"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Star on GitHub"
              className="flex items-center gap-2"
            >
              <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400 dark:fill-yellow-500 dark:stroke-yellow-500 transition-all hover:fill-yellow-500 hover:stroke-yellow-500 dark:hover:fill-yellow-400 dark:hover:stroke-yellow-400" />
              <span className="hidden sm:inline text-sm font-medium">
                Star on GitHub
              </span>
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
