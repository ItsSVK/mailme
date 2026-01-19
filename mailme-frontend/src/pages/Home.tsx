import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Clock, Zap, Mail } from 'lucide-react';
import SEO from '@/components/SEO';
import { useCreateMailbox } from '@/hooks/useMailbox';

const Home = () => {
  const [username, setUsername] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(false);
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useCreateMailbox();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUsername) {
      try {
        await mutateAsync(username.trim());
        // Store username in sessionStorage to hide it from URL
        sessionStorage.setItem('mailboxUsername', username.trim());
        navigate('/mailbox');
      } catch (error) {
        // Error is handled by the mutation hook
      }
    }
  };

  useEffect(() => {
    setIsValidUsername(
      /^[a-z0-9](?!.*\.\.)[a-z0-9._-]{1,28}[a-z0-9]$/.test(username.trim())
    );
  }, [username]);

  return (
    <div className="flex flex-col flex-1 bg-linear-to-br from-background to-secondary overflow-hidden">
      <SEO
        title="MailMe - Temporary Email with Zero Trace | Disposable Email Service"
        description="Create instant disposable email addresses with MailMe. Protect your real email from spam, advertising, and malware. No signup required, auto-deletes after 24 hours. Privacy-focused temporary email service."
        keywords="temporary email, disposable email, temp mail, fake email, throwaway email, privacy email, spam protection, anonymous email, burner email, temporary inbox"
        url="https://mailme.itssvk.dev/"
        canonical="https://mailme.itssvk.dev/"
      />      
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl">
          {/* Animated floating email icons background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <Mail className="absolute top-20 left-10 w-8 h-8 text-primary animate-float" style={{ animationDelay: '0s' }} />
            <Mail className="absolute top-40 right-20 w-6 h-6 text-primary animate-float" style={{ animationDelay: '1s' }} />
            <Mail className="absolute bottom-32 left-1/4 w-10 h-10 text-primary animate-float" style={{ animationDelay: '2s' }} />
            <Mail className="absolute bottom-20 right-1/3 w-7 h-7 text-primary animate-float" style={{ animationDelay: '1.5s' }} />
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-3">
              Temporary mail
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-glow animate-gradient">
                with zero trace
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Protect your real email address from spam, advertising, and malware
            </p>
          </div>

          {/* Form Card */}
          <Card className="p-6 shadow-2xl backdrop-blur-sm bg-card/80 border-2 border-primary/10 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Choose your username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="text-base h-11 dark:bg-slate-900 transition-all duration-200 focus:scale-[1.02]"
                  required
                  autoComplete="off"
                />
                {(username.length < 3 &&
                  (username.length == 0 ? (
                    <p className="text-sm text-muted-foreground mt-2 transition-all">
                      Your email:{' '}
                      <span className="font-medium text-foreground">
                        {username || 'yourname'}@
                        {import.meta.env.VITE_DOMAIN || 'mailme.local'}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm dark:text-yellow-500 text-orange-500 mt-2 animate-shake">
                      Username must be at least 3 characters long
                    </p>
                  ))) ||
                  (username.length >= 3 && !isValidUsername ? (
                    <p className="text-sm text-red-500 mt-2 animate-shake">
                      The username can not be used
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2 transition-all">
                      Your email:{' '}
                      <span className="font-medium dark:text-green-500 text-blue-500 animate-pulse">
                        {username || 'yourname'}@
                        {import.meta.env.VITE_DOMAIN || 'mailme.local'}
                      </span>
                    </p>
                  ))}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 text-base bg-linear-to-r from-primary to-primary-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-xl"
                disabled={!isValidUsername || isPending}
              >
                {isPending ? 'Creating...' : 'Check Mailbox'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </Card>

          {/* Feature Badges - Compact horizontal layout */}
          <div className="grid grid-cols-3 gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-105 group">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-xs font-semibold text-foreground">Instant</h3>
                <p className="text-xs text-muted-foreground">No signup</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-105 group">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-xs font-semibold text-foreground">Private</h3>
                <p className="text-xs text-muted-foreground">Zero trace</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:scale-105 group">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <Clock className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-xs font-semibold text-foreground">Secure</h3>
                <p className="text-xs text-muted-foreground">Auto-delete after 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
