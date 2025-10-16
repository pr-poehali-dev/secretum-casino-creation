import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

const API_URLS = {
  auth: 'https://functions.poehali.dev/ddad3629-93e8-4f23-8e4a-ea5021eef5c7',
  game: 'https://functions.poehali.dev/bfefe8a6-7418-4824-a761-1a7cf861e291',
  admin: 'https://functions.poehali.dev/2d825673-36d9-4c08-abc0-359f98d9db76'
};

interface Case {
  id: string;
  name: string;
  price: number;
  prizes: { amount: number; chance: number }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
  is_admin: boolean;
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

function CasinoApp() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'cases' | 'profile' | 'deposit' | 'admin'>('home');
  const [promoCode, setPromoCode] = useState('');
  const [prizeAnimation, setPrizeAnimation] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  const [openingCase, setOpeningCase] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  const handleGoogleLogin = async (credentialResponse: any) => {
    const decoded = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    
    const response = await fetch(API_URLS.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        google_id: decoded.sub,
        email: decoded.email,
        name: decoded.name
      })
    });

    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
      toast.success('Добро пожаловать в SECRETUM!');
    } else {
      toast.error('Ошибка входа');
    }
  };

  const handlePromoCode = async () => {
    if (!user) return;

    const response = await fetch(API_URLS.game, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'use_promo',
        user_id: user.id,
        promo_code: promoCode
      })
    });

    const data = await response.json();

    if (response.ok) {
      setPrizeAnimation({ amount: data.amount, show: true });
      setUser({ ...user, balance: data.new_balance });
      
      setTimeout(() => {
        setPrizeAnimation({ amount: 0, show: false });
      }, 2000);
      
      setPromoCode('');
    } else {
      toast.error(data.error || 'Ошибка активации промокода');
    }
  };

  const openCase = async (caseData: Case) => {
    if (!user) return;

    if (user.balance < caseData.price) {
      toast.error('Недостаточно средств!');
      return;
    }

    setOpeningCase(caseData.id);

    const response = await fetch(API_URLS.game, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open_case',
        user_id: user.id,
        case_id: caseData.id
      })
    });

    const data = await response.json();

    if (response.ok) {
      setTimeout(() => {
        setUser({ ...user, balance: data.new_balance });
        setPrizeAnimation({ amount: data.won_amount, show: true });
        setOpeningCase(null);

        setTimeout(() => {
          setPrizeAnimation({ amount: 0, show: false });
        }, 2000);
      }, 1500);
    } else {
      setOpeningCase(null);
      toast.error(data.error || 'Ошибка открытия кейса');
    }
  };

  const loadAdminStats = async () => {
    if (!user || !user.is_admin) return;

    const [statsRes, usersRes] = await Promise.all([
      fetch(API_URLS.admin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats', user_id: user.id })
      }),
      fetch(API_URLS.admin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users', user_id: user.id })
      })
    ]);

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      setStats(statsData);
    }

    if (usersRes.ok) {
      const usersData = await usersRes.json();
      setUsers(usersData);
    }
  };

  const updateUserBalance = async (targetUserId: number, newBalance: number) => {
    if (!user || !user.is_admin) return;

    const response = await fetch(API_URLS.admin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_balance',
        user_id: user.id,
        target_user_id: targetUserId,
        new_balance: newBalance
      })
    });

    if (response.ok) {
      toast.success('Баланс обновлен!');
      loadAdminStats();
    } else {
      toast.error('Ошибка обновления баланса');
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && user?.is_admin) {
      loadAdminStats();
    }
  }, [currentPage]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-black/50 border-neon-purple neon-box">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-neon-purple neon-text animate-neon-glow">
              SECRETUM
            </h1>
            <p className="text-neon-cyan text-lg">Онлайн казино с кейсами</p>
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => toast.error('Ошибка входа через Google')}
                theme="filled_black"
                size="large"
                text="continue_with"
              />
            </div>
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
                {user.balance.toFixed(0)} ₽
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
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
            {user.is_admin && (
              <Button
                variant={currentPage === 'admin' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('admin')}
                className={currentPage === 'admin' ? 'bg-neon-purple text-white neon-box' : 'border-neon-cyan text-neon-cyan'}
              >
                <Icon name="Shield" className="mr-2" size={18} />
                Админ
              </Button>
            )}
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
                  onClick={() => setCurrentPage('cases')}
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
                  Баланс: {user.balance.toFixed(0)} ₽
                </div>
                {user.is_admin && (
                  <div className="text-xl text-neon-cyan mt-4">
                    ⭐ Администратор
                  </div>
                )}
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
                  <p className="text-2xl text-white mb-4">Текущий баланс: <span className="text-neon-cyan font-bold">{user.balance.toFixed(0)} ₽</span></p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl text-neon-purple font-bold">Пополнить счёт</h3>
                  <Button 
                    onClick={() => toast.success('Функция пополнения в разработке')}
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
                      if (user.balance >= 3500) {
                        toast.success('Функция вывода в разработке');
                      } else {
                        toast.error(`Недостаточно средств! Нужно ещё ${(3500 - user.balance).toFixed(0)} ₽`);
                      }
                    }}
                    disabled={user.balance < 3500}
                    className="w-full bg-gradient-to-r from-neon-purple to-neon-cyan text-white font-bold text-xl py-6 neon-box disabled:opacity-50"
                  >
                    Вывести средства
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentPage === 'admin' && user.is_admin && (
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-neon-cyan neon-text text-center">Панель администратора</h2>
            
            {stats && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="p-6 bg-black/50 border-neon-purple neon-box">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-3xl font-bold text-neon-cyan">{stats.total_users}</div>
                    <div className="text-white">Пользователей</div>
                  </div>
                </Card>
                <Card className="p-6 bg-black/50 border-neon-purple neon-box">
                  <div className="text-center">
                    <div className="text-4xl mb-2">💰</div>
                    <div className="text-3xl font-bold text-neon-cyan">{stats.total_balance.toFixed(0)} ₽</div>
                    <div className="text-white">Общий баланс</div>
                  </div>
                </Card>
                <Card className="p-6 bg-black/50 border-neon-purple neon-box">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-3xl font-bold text-neon-cyan">{stats.total_cases_opened}</div>
                    <div className="text-white">Кейсов открыто</div>
                  </div>
                </Card>
                <Card className="p-6 bg-black/50 border-neon-purple neon-box">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎁</div>
                    <div className="text-3xl font-bold text-neon-cyan">{stats.total_winnings.toFixed(0)} ₽</div>
                    <div className="text-white">Выигрышей</div>
                  </div>
                </Card>
              </div>
            )}

            <Card className="p-6 bg-black/50 border-neon-cyan neon-box">
              <h3 className="text-2xl font-bold text-neon-purple mb-4 neon-text">Пользователи</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-black/30 rounded border border-neon-purple">
                    <div>
                      <div className="text-white font-bold">{u.name}</div>
                      <div className="text-neon-cyan text-sm">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-neon-purple font-bold">{u.balance.toFixed(0)} ₽</div>
                      <Button
                        size="sm"
                        onClick={() => {
                          const newBalance = prompt('Новый баланс:', u.balance);
                          if (newBalance) updateUserBalance(u.id, parseFloat(newBalance));
                        }}
                        className="bg-neon-cyan text-black"
                      >
                        Изменить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CasinoApp />
    </GoogleOAuthProvider>
  );
}
