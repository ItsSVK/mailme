import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 w-full items-center justify-center bg-background px-4">
      <SEO
        title="Page Not Found - MailMe"
        description="The page you are looking for does not exist."
        noindex={true}
      />
      <div className="text-center animate-scale-in">
        <div className="w-24 h-24 rounded-2xl bg-background neu-inset flex items-center justify-center mx-auto mb-6">
          <h1 className="text-4xl font-bold text-primary">404</h1>
        </div>
        <p className="mb-6 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-background neu-sm hover:neu-md active:neu-inset text-primary font-semibold transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
