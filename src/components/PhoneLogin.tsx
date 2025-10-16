import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface PhoneLoginProps {
  onAuth: (phoneNumber: string, code: string) => void;
}

export default function PhoneLogin({ onAuth }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [savedPhone, setSavedPhone] = useState('');

  const handleSendCode = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      toast.error('Введите корректный номер телефона');
      return;
    }

    setSavedPhone(cleaned);
    setStep('code');
    toast.success(`Код отправлен на номер +${cleaned}`);
  };

  const handleVerifyCode = () => {
    if (code.length !== 4) {
      toast.error('Введите 4-значный код');
      return;
    }

    onAuth(savedPhone, code);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
    
    if (!match) return value;
    
    const parts = [];
    if (match[1]) parts.push('+' + match[1]);
    if (match[2]) parts.push(' (' + match[2]);
    if (match[3]) parts.push(') ' + match[3]);
    if (match[4]) parts.push('-' + match[4]);
    if (match[5]) parts.push('-' + match[5]);
    
    return parts.join('');
  };

  if (step === 'code') {
    return (
      <Card className="w-full max-w-md p-8 bg-black/50 border-neon-purple neon-box">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neon-cyan neon-text mb-2">
              Введите код
            </h2>
            <p className="text-gray-400">
              Код отправлен на номер +{savedPhone}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="• • • •"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setCode(value);
              }}
              className="text-center text-2xl tracking-widest bg-black/70 border-neon-purple text-white"
              maxLength={4}
            />

            <Button
              onClick={handleVerifyCode}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-lg py-6 neon-box"
            >
              Войти
            </Button>

            <Button
              onClick={() => {
                setStep('phone');
                setCode('');
              }}
              variant="outline"
              className="w-full border-neon-cyan text-neon-cyan"
            >
              Изменить номер
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 bg-black/50 border-neon-purple neon-box">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-neon-purple neon-text animate-neon-glow mb-4">
            SECRETUM
          </h1>
          <p className="text-neon-cyan text-lg">Онлайн казино с кейсами</p>
        </div>

        <div className="space-y-4">
          <Input
            type="tel"
            placeholder="+7 (___) ___-__-__"
            value={formatPhone(phoneNumber)}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '');
              setPhoneNumber(cleaned);
            }}
            className="text-center text-xl bg-black/70 border-neon-purple text-white"
          />

          <Button
            onClick={handleSendCode}
            className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-lg py-6 neon-box"
          >
            Получить код
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Мы отправим вам SMS с кодом подтверждения
          </p>
        </div>
      </div>
    </Card>
  );
}
