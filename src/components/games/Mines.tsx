import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface MinesProps {
  balance: number;
  onBet: (amount: number) => Promise<void>;
  onReveal: (index: number) => Promise<{ isMine: boolean; multiplier: number; payout?: number }>;
  onCashout: (multiplier: number) => Promise<{ payout: number }>;
}

export default function Mines({ balance, onBet, onReveal, onCashout }: MinesProps) {
  const [betAmount, setBetAmount] = useState(15);
  const [gameStarted, setGameStarted] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [mines, setMines] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameOver, setGameOver] = useState(false);

  const totalCells = 25;
  const mineCount = 5;

  const startGame = async () => {
    if (betAmount < 15) {
      toast.error('Минимальная ставка 15₽');
      return;
    }

    if (betAmount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    try {
      await onBet(betAmount);
      
      const minePositions: number[] = [];
      while (minePositions.length < mineCount) {
        const pos = Math.floor(Math.random() * totalCells);
        if (!minePositions.includes(pos)) {
          minePositions.push(pos);
        }
      }
      
      setMines(minePositions);
      setRevealed([]);
      setMultiplier(1.00);
      setGameStarted(true);
      setGameOver(false);
      toast.success(`Игра началась! Найдите ${mineCount} мин`);
    } catch (error) {
      toast.error('Ошибка ставки');
    }
  };

  const handleReveal = async (index: number) => {
    if (revealed.includes(index) || gameOver) return;

    const isMine = mines.includes(index);
    
    try {
      const result = await onReveal(index);
      
      if (isMine) {
        setRevealed([...revealed, index]);
        setGameOver(true);
        setGameStarted(false);
        toast.error(`Вы попали на мину! Проиграли ${betAmount}₽`);
        
        setTimeout(() => {
          setRevealed([]);
          setMines([]);
        }, 2000);
      } else {
        const newRevealed = [...revealed, index];
        setRevealed(newRevealed);
        const newMultiplier = 1 + (newRevealed.length * 0.4);
        setMultiplier(newMultiplier);
        toast.success(`+${(betAmount * 0.4).toFixed(0)}₽ | ${newMultiplier.toFixed(2)}x`);
      }
    } catch (error) {
      toast.error('Ошибка открытия');
    }
  };

  const handleCashout = async () => {
    if (!gameStarted || gameOver) return;

    try {
      const result = await onCashout(multiplier);
      toast.success(`Вы забрали ${result.payout.toFixed(0)}₽!`);
      setGameStarted(false);
      setRevealed([]);
      setMines([]);
      setMultiplier(1.00);
    } catch (error) {
      toast.error('Ошибка вывода');
    }
  };

  return (
    <Card className="p-6 bg-black/50 border-neon-cyan neon-box">
      <h2 className="text-3xl font-bold text-neon-cyan neon-text text-center mb-6">
        💣 Минёр
      </h2>

      <div className="space-y-6">
        {!gameStarted && !gameOver && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-neon-cyan">Ставка (мин. 15₽):</label>
              <Input
                type="number"
                min={15}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-black/70 border-neon-purple text-white text-center text-xl"
              />
            </div>

            <Button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box"
            >
              Начать игру
            </Button>
          </div>
        )}

        {gameStarted && (
          <>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-cyan mb-2">
                {multiplier.toFixed(2)}x | {(betAmount * multiplier).toFixed(0)}₽
              </div>
              <div className="text-sm text-gray-400">
                Открыто: {revealed.length} | Мин: {mineCount}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalCells }).map((_, index) => {
                const isRevealed = revealed.includes(index);
                const isMine = mines.includes(index) && isRevealed;

                return (
                  <button
                    key={index}
                    onClick={() => handleReveal(index)}
                    disabled={isRevealed || gameOver}
                    className={`aspect-square rounded-lg text-3xl flex items-center justify-center transition-all ${
                      isRevealed
                        ? isMine
                          ? 'bg-red-500 animate-pulse'
                          : 'bg-green-500'
                        : 'bg-black/70 border-2 border-neon-purple hover:border-neon-cyan hover:scale-105'
                    } disabled:cursor-not-allowed`}
                  >
                    {isRevealed ? (isMine ? '💣' : '💎') : '?'}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleCashout}
              disabled={revealed.length === 0 || gameOver}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
            >
              Забрать {(betAmount * multiplier).toFixed(0)}₽
            </Button>
          </>
        )}

        <div className="text-center text-sm text-gray-400">
          {mineCount} мин на поле | +0.4x за каждую открытую клетку
        </div>
      </div>
    </Card>
  );
}
