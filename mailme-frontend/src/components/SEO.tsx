import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  noindex?: boolean;
  canonical?: string;
}

const DEFAULT_TITLE = 'Free Temporary Email with Zero Trace | MailMe';
const DEFAULT_DESCRIPTION =
  'Create a free disposable email address instantly with MailMe. Protect your inbox from spam and keep your real email private — no signup, auto-deletes in 24h.';

// Find an existing head tag (from index.html) and update it in place, or
// create it once if missing. Mutating the static tags avoids duplicates and
// works reliably on every route change with React 19 / StrictMode.
function setMeta(selector: string, attr: string, key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  url = 'https://mailme.itssvk.dev/',
  noindex = false,
  canonical,
}: SEOProps) => {
  useEffect(() => {
    document.title = title;

    const robots = noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="robots"]', 'name', 'robots', robots);
    setMeta('meta[name="googlebot"]', 'name', 'googlebot', robots);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical ?? url);
  }, [title, description, url, noindex, canonical]);

  return null;
};

export default SEO;
