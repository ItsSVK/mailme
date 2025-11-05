import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Clock, Zap } from 'lucide-react';
import heroImage from '@/assets/hero-email.jpg';
import Header from '@/components/Header';

const Home = () => {
  const [username, setUsername] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUsername) {
      navigate(`/mailbox/${username}`);
    }
  };

  useEffect(() => {
    setIsValidUsername(
      /^[a-z0-9](?!.*\.\.)[a-z0-9._-]{1,28}[a-z0-9]$/.test(username.trim())
    );
  }, [username]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-secondary">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-foreground leading-tight">
                Temporary mail
                <span className="block text-primary">with zero trace</span>
              </h2>

              <p className="text-lg text-muted-foreground">
                Protect your real email address from spam, advertising, and
                malware with our instant temporary email service.
              </p>

              <Card className="p-6 shadow-lg">
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
                      className="text-lg h-12 dark:bg-slate-900"
                      required
                      autoComplete="off"
                    />
                    {(username.length < 3 &&
                      (username.length == 0 ? (
                        <p className="text-sm text-muted-foreground mt-2">
                          Your email:{' '}
                          <span className="font-medium text-foreground">
                            {username || 'yourname'}@
                            {import.meta.env.VITE_DOMAIN || 'mailme.itssvk.dev'}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm dark:text-yellow-500 text-orange-500 mt-2">
                          Username must be at least 3 characters long
                        </p>
                      ))) ||
                      (username.length >= 3 && !isValidUsername ? (
                        <p className="text-sm text-red-500 mt-2">
                          The username can not be used
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          Your email:{' '}
                          <span className="font-medium dark:text-green-500 text-blue-500">
                            {username || 'yourname'}@
                            {import.meta.env.VITE_DOMAIN || 'mailme.itssvk.dev'}
                          </span>
                        </p>
                      ))}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base bg-linear-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!isValidUsername}
                  >
                    Check Mailbox
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </form>
              </Card>
            </div>

            <div className="relative">
              <img
                src={heroImage}
                alt="Temporary Email Service"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Instant Setup
              </h3>
              <p className="text-muted-foreground">
                Get your temporary email address instantly. No registration
                required.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Privacy First
              </h3>
              <p className="text-muted-foreground">
                Protect your real email from spam and unwanted messages.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Auto-Expires
              </h3>
              <p className="text-muted-foreground">
                Messages are automatically deleted after 24 hours for your
                security.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
