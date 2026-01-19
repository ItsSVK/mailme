import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '@/components/SEO';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 w-full items-center justify-center bg-linear-to-br from-background to-secondary">
      <SEO
        title="Page Not Found - MailMe"
        description="The page you are looking for does not exist."
        noindex={true}
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <span
          role="button"
          onClick={() => navigate('/')}
          className="text-primary underline hover:text-primary-glow flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </span>
      </div>
    </div>
  );
};

export default NotFound;
