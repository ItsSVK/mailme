import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Clock, Zap, Mail, ChevronDown, Shuffle } from 'lucide-react';

const ADJS = ['swift', 'quiet', 'bold', 'calm', 'dark', 'wild', 'cool', 'fast', 'bright', 'silver', 'crisp', 'clean'];
const NOUNS = ['fox', 'river', 'cloud', 'stone', 'wave', 'fire', 'wind', 'star', 'hawk', 'pine', 'reed', 'oak'];

function randomUsername(): string {
  const adj = ADJS[Math.floor(Math.random() * ADJS.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}
import SEO from '@/components/SEO';
import { useCreateMailbox } from '@/hooks/useMailbox';

const STEPS = [
  {
    title: 'Pick a username',
    desc: 'Type any name and get an instant @mailme address — no signup, no password.',
  },
  {
    title: 'Use it anywhere',
    desc: 'Drop it into signups, free trials, downloads, or anywhere you would rather not give your real email.',
  },
  {
    title: 'Read your mail',
    desc: 'Incoming emails appear in your inbox in real time, then auto-delete after 24 hours.',
  },
];

const FAQS = [
  {
    q: 'Is MailMe free to use?',
    a: 'Yes. MailMe is completely free, with no signup, registration, or credit card required.',
  },
  {
    q: 'How long do temporary emails last?',
    a: 'Every email is automatically deleted 24 hours after it arrives, so nothing lingers on our servers.',
  },
  {
    q: 'Do I need to create an account?',
    a: 'No. Just choose a username and your disposable inbox is ready instantly.',
  },
  {
    q: 'Can I reply to or send emails?',
    a: 'MailMe is a receive-only inbox built for verifications and signups. You can read incoming mail, but not send or reply.',
  },
  {
    q: 'Is it private and safe?',
    a: 'MailMe keeps your real address hidden and auto-deletes every email after 24 hours. Keep in mind that inboxes are public and not password-protected — anyone who enters the same username can read that inbox. Pick a hard-to-guess username and never use MailMe for sensitive or personal mail.',
  },
];

const Home = () => {
  const [username, setUsername] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
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
    <div className="flex flex-col flex-1 bg-background overflow-hidden">
      <SEO
        title="Free Temporary Email with Zero Trace | MailMe"
        description="Create a free disposable email address instantly with MailMe. Protect your inbox from spam and keep your real email private — no signup, auto-deletes in 24h."
        url="https://mailme.itssvk.dev/"
        canonical="https://mailme.itssvk.dev/"
      />
      <main className="flex-1 flex flex-col items-center px-4 py-12 gap-24">
        {/* Hero + form */}
        <section className="relative w-full max-w-2xl pt-6">
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
              Temporary email
              <span className="block bg-linear-to-r from-primary to-accent bg-clip-text text-transparent pb-1">
                with zero trace
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Protect your real email address from spam, advertising, and malware
            </p>
          </div>

          {/* Form Card */}
          <Card className="p-6 neu-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-foreground"
                  >
                    Choose your username
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUsername(randomUsername())}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    Random
                  </Button>
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="text-base h-11 transition-all duration-200"
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
                className="w-full h-11 text-base cursor-pointer disabled:cursor-not-allowed"
                disabled={!isValidUsername || isPending}
              >
                {isPending ? 'Creating...' : 'Check Mailbox'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>
          </Card>

          {/* Feature Badges - Compact horizontal layout */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { Icon: Zap, title: 'Instant', desc: 'No signup' },
              { Icon: Shield, title: 'Private', desc: 'Zero trace' },
              { Icon: Clock, title: 'Secure', desc: 'Auto-delete after 24 hours' },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background neu-sm hover:neu-md transition-all duration-300 group animate-slide-up"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <div className="w-11 h-11 rounded-full bg-primary shadow-brand flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                  <Icon className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="text-center">
                  <h3 className="text-xs font-semibold text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">
            How it works
          </h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            A disposable inbox in three steps — no account, no waiting.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="group p-6 rounded-xl bg-background neu-md hover:neu-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-full bg-primary shadow-brand flex items-center justify-center text-primary-foreground font-bold text-lg mb-4 transition-transform duration-300 group-hover:scale-110">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => {
              const isOpen = openFaq === q;
              return (
                <div
                  key={q}
                  className={`rounded-xl bg-background transition-shadow duration-300 ${isOpen ? 'neu-md' : 'neu-sm'}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : q)}
                    className="flex w-full items-center justify-between gap-4 cursor-pointer p-5 font-semibold text-foreground text-left"
                    aria-expanded={isOpen}
                  >
                    {q}
                    <ChevronDown
                      className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {/* grid 0fr→1fr animates height with pure CSS, no JS measuring */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
