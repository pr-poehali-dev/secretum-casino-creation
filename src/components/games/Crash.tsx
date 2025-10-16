import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CrashProps {
  balance: number;
  onBet: (amount: number) => Promise<void>;
  onCashout: (multiplier: number) => Promise<{ payout: number }>;
}

export default function Crash({ balance, onBet, onCashout }: CrashProps) {
  const [betAmount, setBetAmount] = useState(10);
  const [multiplier, setMultiplier] = useState(1.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const targetCrash = Math.random() < 0.05 ? 
      (Math.random() * 5 + 1) :
      (Math.random() * 3 + 1);
    
    setCrashPoint(targetCrash);

    const interval = setInterval(() => {
      setMultiplier(prev => {
        const next = prev + 0.01;
        
        if (next >= targetCrash) {
          clearInterval(interval);
          setCrashed(true);
          setIsPlaying(false);
          
          if (hasBet) {
            toast.error(`Краш на ${targetCrash.toFixed(2)}x! Вы проиграли ${betAmount}₽`);
            setHasBet(false);
          }
          
          setTimeout(() => {
            startNewRound();
          }, 2000);
          
          return targetCrash;
        }
        
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const startNewRound = () => {
    setMultiplier(1.00);
    setCrashed(false);
    setIsPlaying(true);
    setHasBet(false);
  };

  const handlePlaceBet = async () => {
    if (betAmount < 10) {
      toast.error('Минимальная ставка 10₽');
      return;
    }

    if (betAmount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    try {
      await onBet(betAmount);
      setHasBet(true);
      toast.success(`Ставка ${betAmount}₽ принята!`);
    } catch (error) {
      toast.error('Ошибка ставки');
    }
  };

  const handleCashOut = async () => {
    if (!hasBet) return;

    try {
      const result = await onCashout(multiplier);
      toast.success(`Вы вывели ${result.payout.toFixed(0)}₽ на ${multiplier.toFixed(2)}x!`);
      setHasBet(false);
    } catch (error) {
      toast.error('Ошибка вывода');
    }
  };

  useEffect(() => {
    startNewRound();
  }, []);

  return (
    <Card className="p-6 bg-black/50 border-neon-cyan neon-box">
      <h2 className="text-3xl font-bold text-neon-cyan neon-text text-center mb-6">
        ✈️ Краш
      </h2>

      <div className="space-y-6">
        <div className="relative h-64 bg-black/50 border-2 border-neon-purple rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-6xl ${crashed ? 'animate-pulse' : ''}`}>
              {crashed ? '💥' : '✈️'}
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-8xl font-bold ${
              crashed ? 'text-red-500' : 'text-neon-cyan'
            } neon-text ${!crashed ? 'animate-pulse' : ''}`}>
              {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>

        {!hasBet && !crashed && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-neon-cyan">Ставка (мин. 10₽):</label>
              <Input
                type="number"
                min={10}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-black/70 border-neon-purple text-white text-center text-xl"
                disabled={isPlaying && hasBet}
              />
            </div>

            <Button
              onClick={handlePlaceBet}
              disabled={crashed}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
            >
              Сделать ставку
            </Button>
          </div>
        )}

        {hasBet && !crashed && (
          <Button
            onClick={handleCashOut}
            className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box animate-pulse"
          >
            Забрать {(betAmount * multiplier).toFixed(0)}₽
          </Button>
        )}

        {crashed && (
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 mb-2">
              Краш на {crashPoint.toFixed(2)}x!
            </div>
            <div className="text-gray-400">
              Новый раунд начнётся через 2 секунды...
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-400">
          Макс. множитель: x6 (редко) | Средний: x2.5
        </div>
      </div>
    </Card>
  );
}
