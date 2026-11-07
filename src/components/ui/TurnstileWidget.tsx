import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

export function TurnstileWidget({ onToken, onExpire, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Keep stable refs to callbacks to avoid re-rendering the widget on prop changes
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    const sitekey =
      (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ??
      '1x00000000000000000000AA';

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      // Remove any existing widget before rendering a new one
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey,
        callback:           (t) => onTokenRef.current(t),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback':   () => onErrorRef.current?.(),
        theme: 'dark',
        size:  'normal',
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Avoid duplicate script tags
    if (!document.querySelector('script[data-turnstile]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.dataset.turnstile = 'true';
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      // Script already loading - poll until ready
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
      }
    };
  }, []); // run once on mount

  return <div ref={containerRef} className="flex justify-center" />;
}
