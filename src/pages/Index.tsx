import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';

interface Case {
  id: string;
  name: string;
  price: number;
  prizes: { amount: number; chance: number }[];
}

const CASES: Case[] = [
  {
    id: 'bomj',
    name: 'Бомж',
    price: 30,
    prizes: [
      { amount: 100, chance: 50 },
      { amount: 200, chance: 24 },
      { amount: 250, chance: 23 },
      { amount: 300, chance: 20 }
    ]
  },
  {
    id: 'rich',
    name: 'Богатый',
    price: 560,
    prizes: [
      { amount: 350, chance: 75 },
      { amount: 400, chance: 50 },
      { amount: 1200, chance: 11 },
      { amount: 3000, chance: 10 },
      { amount: 15000, chance: 0.0001 }
    ]
  }
];

const PROMOCODES = {
  'exe': { amount: 40, uses: 1 },
  'Ismailov': { amount: 30000, uses: 1 },
  'гурманов': { amount: 200, uses: 3 }
};

export default function Index() {
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'cases' | 'profile' | 'deposit'>('home');
  const [promoCode, setPromoCode] = useState('');
  const [usedPromos, setUsedPromos] = useState<{ [key: string]: number }>({});
  const [prizeAnimation, setPrizeAnimation] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const [openingCase, setOpeningCase] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setUser({ name: 'Игрок', email: 'player@example.com' });
    toast.success('Вы успешно вошли в систему!');
  };

  const handlePromoCode = () => {
    const promo = PROMOCODES[promoCode as keyof typeof PROMOCODES];
    if (!promo) {
      toast.error('Промокод не найден!');
      return;
    }

    const used = usedPromos[promoCode] || 0;
    if (used >= promo.uses) {
      toast.error('Промокод использован максимальное количество раз!');
      return;
    }

    setUsedPromos({ ...usedPromos, [promoCode]: used + 1 });
    setBalance(balance + promo.amount);
    setPrizeAnimation({ amount: promo.amount, show: true });
    
    setTimeout(() => {
      setPrizeAnimation({ amount: 0, show: false });
    }, 2000);
    
    setPromoCode('');
  };

  const openCase = (caseData: Case) => {
    if (balance < caseData.price) {
      toast.error('Недостаточно средств!');
      return;
    }

    setBalance(balance - caseData.price);
    setOpeningCase(caseData.id);

    setTimeout(() => {
      const random = Math.random() * 100;
      let cumulative = 0;
      let won = caseData.prizes[0].amount;

      for (const prize of caseData.prizes) {
        cumulative += prize.chance;
        if (random <= cumulative) {
          won = prize.amount;
          break;
        }
      }

      setBalance(prev => prev + won);
      setPrizeAnimation({ amount: won, show: true });
      setOpeningCase(null);

      setTimeout(() => {
        setPrizeAnimation({ amount: 0, show: false });
      }, 2000);
    }, 1500);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-black/50 border-neon-purple neon-box">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-neon-purple neon-text animate-neon-glow">
              SECRETUM
            </h1>
            <p className="text-neon-cyan text-lg">Онлайн казино с кейсами</p>
            <Button 
              onClick={handleGoogleLogin}
              className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-lg py-6 neon-box"
            >
              <Icon name="LogIn" className="mr-2" size={24} />
              Войти через Google
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-neon-purple bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-neon-purple neon-text cursor-pointer" onClick={() => setCurrentPage('home')}>
              SECRETUM
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-neon-cyan font-bold text-xl neon-text">
                {balance.toFixed(0)} ₽
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={currentPage === 'home' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('home')}
              className={currentPage === 'home' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
            >
              <Icon name="Home" className="mr-2" size={18} />
              Главная
            </Button>
            <Button
              variant={currentPage === 'cases' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('cases')}
              className={currentPage === 'cases' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
            >
              <Icon name="Package" className="mr-2" size={18} />
              Кейсы
            </Button>
            <Button
              variant={currentPage === 'profile' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('profile')}
              className={currentPage === 'profile' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
            >
              <Icon name="User" className="mr-2" size={18} />
              Профиль
            </Button>
            <Button
              variant={currentPage === 'deposit' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('deposit')}
              className={currentPage === 'deposit' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
            >
              <Icon name="Wallet" className="mr-2" size={18} />
              Пополнение
            </Button>
          </div>
        </div>
      </nav>

      {prizeAnimation.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl font-bold text-neon-cyan neon-text animate-prize-float">
            🎉 Поздравляем! <br />
            +{prizeAnimation.amount} ₽
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold text-neon-cyan neon-text animate-neon-glow">
                Добро пожаловать в SECRETUM
              </h2>
              <p className="text-neon-purple text-xl">Откройте кейсы и получите крутые призы!</p>
            </div>

            <Card className="p-6 bg-black/50 border-neon-cyan neon-box">
              <h3 className="text-2xl font-bold text-neon-purple mb-4 neon-text">Промокод</h3>
              <div className="flex gap-2">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Введите промокод"
                  className="bg-black/70 border-neon-purple text-white placeholder:text-gray-500"
                />
                <Button 
                  onClick={handlePromoCode}
                  className="bg-gradient-to-r from-neon-purple to-neon-cyan text-white neon-box"
                >
                  Активировать
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {CASES.map(caseData => (
                <Card 
                  key={caseData.id} 
                  className="p-6 bg-black/50 border-neon-cyan neon-box hover:scale-105 transition-transform cursor-pointer"
                  onClick={() => {
                    setCurrentPage('cases');
                  }}
                >
                  <div className="text-center space-y-4">
                    <div className="text-6xl">📦</div>
                    <h3 className="text-3xl font-bold text-neon-purple neon-text">{caseData.name}</h3>
                    <p className="text-2xl text-neon-cyan font-bold">{caseData.price} ₽</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'cases' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-neon-cyan neon-text text-center">Кейсы</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {CASES.map(caseData => (
                <Card key={caseData.id} className="p-6 bg-black/50 border-neon-purple neon-box">
                  <div className="text-center space-y-4">
                    <div className="text-8xl">📦</div>
                    <h3 className="text-4xl font-bold text-neon-purple neon-text">{caseData.name}</h3>
                    <p className="text-3xl text-neon-cyan font-bold">{caseData.price} ₽</p>
                    <div className="space-y-2">
                      <p className="text-neon-purple">Возможные призы:</p>
                      {caseData.prizes.sort((a, b) => b.amount - a.amount).map((prize, idx) => (
                        <div key={idx} className="text-white text-lg">
                          {prize.amount} ₽
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => openCase(caseData)}
                      disabled={openingCase === caseData.id}
                      className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
                    >
                      {openingCase === caseData.id ? 'Открываем...' : 'Открыть'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 bg-black/50 border-neon-cyan neon-box">
              <h2 className="text-4xl font-bold text-neon-purple neon-text mb-6 text-center">Профиль</h2>
              <div className="space-y-4 text-center">
                <div className="text-6xl mb-4">👤</div>
                <div className="text-2xl text-white">{user.name}</div>
                <div className="text-xl text-neon-cyan">{user.email}</div>
                <div className="text-3xl font-bold text-neon-purple neon-text mt-6">
                  Баланс: {balance.toFixed(0)} ₽
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentPage === 'deposit' && (
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 bg-black/50 border-neon-purple neon-box">
              <h2 className="text-4xl font-bold text-neon-cyan neon-text mb-6 text-center">Пополнение</h2>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-2xl text-white mb-4">Текущий баланс: <span className="text-neon-cyan font-bold">{balance.toFixed(0)} ₽</span></p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl text-neon-purple font-bold">Пополнить счёт</h3>
                  <Button 
                    onClick={() => {
                      toast.success('Функция пополнения в разработке');
                    }}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold text-xl py-6 neon-box"
                  >
                    Пополнить
                  </Button>
                </div>

                <div className="space-y-4 pt-6 border-t border-neon-purple">
                  <h3 className="text-2xl text-neon-purple font-bold">Вывести средства</h3>
                  <p className="text-white">Минимальная сумма для вывода: <span className="text-neon-cyan font-bold">3500 ₽</span></p>
                  <Button 
                    onClick={() => {
                      if (balance >= 3500) {
                        toast.success('Функция вывода в разработке');
                      } else {
                        toast.error(`Недостаточно средств! Нужно ещё ${(3500 - balance).toFixed(0)} ₽`);
                      }
                    }}
                    disabled={balance < 3500}
                    className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
                  >
                    Вывести средства
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
