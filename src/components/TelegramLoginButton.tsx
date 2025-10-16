import { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  onAuth: (user: TelegramUser) => void;
}

export default function TelegramLoginButton({
  botName,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = true,
  onAuth
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTelegramAuth = (event: CustomEvent<TelegramUser>) => {
      onAuth(event.detail);
    };

    window.addEventListener('telegram-login', handleTelegramAuth as EventListener);

    if (containerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-radius', cornerRadius.toString());
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      if (requestAccess) {
        script.setAttribute('data-request-access', 'write');
      }

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(script);
    }

    return () => {
      window.removeEventListener('telegram-login', handleTelegramAuth as EventListener);
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, onAuth]);

  return <div ref={containerRef} className="inline-block" />;
}
