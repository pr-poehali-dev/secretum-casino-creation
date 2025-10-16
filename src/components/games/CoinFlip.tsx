import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CoinFlipProps {
  balance: number;
  onBet: (amount: number, choice: 'heads' | 'tails') => Promise<{ won: boolean; result: 'heads' | 'tails'; payout: number }>;
}

export default function CoinFlip({ balance, onBet }: CoinFlipProps) {
  const [betAmount, setBetAmount] = useState(35);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<'heads' | 'tails' | null>(null);

  const handleFlip = async () => {
    if (betAmount < 35) {
      toast.error('Минимальная ставка 35₽');
      return;
    }

    if (betAmount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    setIsFlipping(true);
    setLastResult(null);

    try {
      const result = await onBet(betAmount, choice);
      
      setTimeout(() => {
        setLastResult(result.result);
        setIsFlipping(false);
        
        if (result.won) {
          toast.success(`Вы выиграли ${result.payout}₽!`);
        } else {
          toast.error(`Вы проиграли ${betAmount}₽`);
        }
      }, 1500);
    } catch (error) {
      setIsFlipping(false);
      toast.error('Ошибка игры');
    }
  };

  return (
    <Card className="p-6 bg-black/50 border-neon-cyan neon-box">
      <h2 className="text-3xl font-bold text-neon-cyan neon-text text-center mb-6">
        🪙 Монетка
      </h2>

      <div className="space-y-6">
        <div className="flex justify-center">
          <div 
            className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl ${
              isFlipping ? 'animate-spin' : ''
            } ${
              lastResult === 'heads' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
              lastResult === 'tails' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
              'bg-gradient-to-br from-neon-purple to-neon-cyan'
            }`}
            style={{ boxShadow: '0 0 30px rgba(255, 0, 255, 0.5)' }}
          >
            {isFlipping ? '🔄' : lastResult === 'heads' ? '🦅' : lastResult === 'tails' ? '🔢' : '🪙'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => setChoice('heads')}
            variant={choice === 'heads' ? 'default' : 'outline'}
            className={choice === 'heads' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
          >
            🦅 Орёл
          </Button>
          <Button
            onClick={() => setChoice('tails')}
            variant={choice === 'tails' ? 'default' : 'outline'}
            className={choice === 'tails' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
          >
            🔢 Решка
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-neon-cyan">Ставка (мин. 35₽):</label>
          <Input
            type="number"
            min={35}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="bg-black/70 border-neon-purple text-white text-center text-xl"
          />
        </div>

        <Button
          onClick={handleFlip}
          disabled={isFlipping}
          className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
        >
          {isFlipping ? 'Подбрасываем...' : 'Подбросить монетку'}
        </Button>

        <div className="text-center text-sm text-gray-400">
          Коэффициент: x2 | Шанс: 50%
        </div>
      </div>
    </Card>
  );
}
