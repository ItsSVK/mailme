import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full py-8 border-t border-border bg-background/95 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-sm">Crafted with care by</span>
          <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
          <a
            href="https://x.com/ShouvikMohanta"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors duration-200"
          >
            Shouvik Mohanta
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
