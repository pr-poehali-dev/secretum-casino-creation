import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

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

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
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
    window.onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    if (containerRef.current && window.location.hostname !== 'localhost') {
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
      delete window.onTelegramAuth;
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, onAuth]);

  const handleTestLogin = () => {
    const testUser: TelegramUser = {
      id: Math.floor(Math.random() * 1000000),
      first_name: 'Тестовый',
      last_name: 'Пользователь',
      username: 'test_user',
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'test_hash'
    };
    onAuth(testUser);
  };

  if (window.location.hostname === 'localhost' || !botName || botName === 'SecretumCasinoBot') {
    return (
      <div className="space-y-4">
        <Button
          onClick={handleTestLogin}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg py-6"
        >
          🚀 Войти (тестовый режим)
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Для настоящего входа через Telegram создайте бота через @BotFather
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="inline-block" />;
}
