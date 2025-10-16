import { useState } from 'react';
import { Card as UICard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CardsProps {
  balance: number;
  onBet: (amount: number, choice: 'higher' | 'lower') => Promise<{ won: boolean; dealerCard: number; payout: number }>;
}

const suits = ['♠️', '♥️', '♣️', '♦️'];
const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function Cards({ balance, onBet }: CardsProps) {
  const [betAmount, setBetAmount] = useState(50);
  const [playerCard, setPlayerCard] = useState<{ value: string; suit: string } | null>(null);
  const [dealerCard, setDealerCard] = useState<{ value: string; suit: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const getRandomCard = () => {
    return {
      value: cardValues[Math.floor(Math.random() * cardValues.length)],
      suit: suits[Math.floor(Math.random() * suits.length)]
    };
  };

  const getCardNumericValue = (value: string): number => {
    const index = cardValues.indexOf(value);
    return index + 2;
  };

  const startGame = () => {
    if (betAmount < 50) {
      toast.error('Минимальная ставка 50₽');
      return;
    }

    if (betAmount > balance) {
      toast.error('Недостаточно средств');
      return;
    }

    setPlayerCard(getRandomCard());
    setDealerCard(null);
    setShowResult(false);
    setIsPlaying(true);
  };

  const handleChoice = async (choice: 'higher' | 'lower') => {
    if (!playerCard) return;

    const dealer = getRandomCard();
    setDealerCard(dealer);
    setShowResult(true);

    try {
      const playerValue = getCardNumericValue(playerCard.value);
      const dealerValue = getCardNumericValue(dealer.value);
      
      const won = (choice === 'higher' && dealerValue > playerValue) ||
                   (choice === 'lower' && dealerValue < playerValue);

      const result = await onBet(betAmount, choice);

      setTimeout(() => {
        if (won) {
          toast.success(`Вы выиграли ${result.payout}₽!`);
        } else {
          toast.error(`Вы проиграли ${betAmount}₽`);
        }
        setIsPlaying(false);
      }, 1000);
    } catch (error) {
      setIsPlaying(false);
      toast.error('Ошибка игры');
    }
  };

  const CardDisplay = ({ card, label }: { card: { value: string; suit: string } | null; label: string }) => (
    <div className="space-y-2">
      <div className="text-neon-cyan text-sm text-center">{label}</div>
      <div className={`w-24 h-36 rounded-lg flex items-center justify-center ${
        card 
          ? 'bg-white border-4 border-neon-purple' 
          : 'bg-black/50 border-4 border-dashed border-neon-cyan'
      }`}>
        {card ? (
          <div className="text-center">
            <div className={`text-4xl font-bold ${
              card.suit === '♥️' || card.suit === '♦️' ? 'text-red-500' : 'text-black'
            }`}>
              {card.value}
            </div>
            <div className="text-3xl">{card.suit}</div>
          </div>
        ) : (
          <div className="text-4xl text-gray-600">🃏</div>
        )}
      </div>
    </div>
  );

  return (
    <UICard className="p-6 bg-black/50 border-neon-cyan neon-box">
      <h2 className="text-3xl font-bold text-neon-cyan neon-text text-center mb-6">
        🎴 Карты
      </h2>

      <div className="space-y-6">
        <div className="flex justify-center gap-8">
          <CardDisplay card={playerCard} label="Ваша карта" />
          <CardDisplay card={dealerCard} label="Карта дилера" />
        </div>

        {!isPlaying && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-neon-cyan">Ставка (мин. 50₽):</label>
              <Input
                type="number"
                min={50}
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                className="bg-black/70 border-neon-purple text-white text-center text-xl"
              />
            </div>

            <Button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box"
            >
              Раздать карты
            </Button>
          </div>
        )}

        {isPlaying && playerCard && !showResult && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleChoice('higher')}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xl py-6 neon-box"
            >
              ⬆️ Выше
            </Button>
            <Button
              onClick={() => handleChoice('lower')}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-xl py-6 neon-box"
            >
              ⬇️ Ниже
            </Button>
          </div>
        )}

        <div className="text-center text-sm text-gray-400">
          Угадайте, будет ли следующая карта выше или ниже | x2
        </div>
      </div>
    </UICard>
  );
}
