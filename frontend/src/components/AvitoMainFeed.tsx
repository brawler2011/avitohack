import React from 'react';
import { PlayCircle, Trophy, Truck, Search, ChevronUp, Sparkles, Flame } from 'lucide-react';

interface AvitoMainFeedProps {
  onOpenStories: () => void;
  onOpenAchievements: () => void;
}

export const AvitoMainFeed: React.FC<AvitoMainFeedProps> = ({
  onOpenStories,
  onOpenAchievements,
}) => {
  const categories = [
    {
      title: 'Авто',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Недвижимость',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Жильё для путешествия',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Для дома и дачи',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Запчасти',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Услуги',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Электроника',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Работа и подработка',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Бизнес 360',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    },
    {
      title: 'Одежда, обувь, аксессуары',
      bg: '#f4f5f7',
      img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    },
  ];

  const businessSubitems = [
    { title: 'Оборудование', icon: '⚙️' },
    { title: 'Помещения', icon: '🏢' },
    { title: 'Товары', icon: '📦' },
    { title: 'Транспорт', icon: '🚚' },
    { title: 'Услуги', icon: '🛠️' },
    { title: 'Сотрудники', icon: '👥' },
  ];

  const feedItems = [
    {
      id: 1,
      title: 'Декоративный синий поднос (ручная работа)',
      price: '1 500 ₽',
      location: 'Москва, р-н ЦАО',
      date: 'Сегодня, 14:20',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'Кроссовки Nike Air Jordan 1 Retro High',
      price: '8 900 ₽',
      location: 'Москва, р-н Тверской',
      date: 'Сегодня, 13:05',
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: 'Настенное панно с орнаментом Red Art',
      price: '3 200 ₽',
      location: 'Москва, р-н Арбат',
      date: 'Вчера, 19:40',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 4,
      title: 'Тренажер силовая скамья Kettler',
      price: '24 000 ₽',
      location: 'Москва, р-н Хамовники',
      date: 'Вчера, 18:12',
      image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 5,
      title: 'Ноутбук Apple MacBook Air 13 M2 8/256GB',
      price: '89 000 ₽',
      location: 'Москва, р-н Пресненский',
      date: 'Сегодня, 09:15',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 font-sans text-[#222222]">
      {/* Avito Stories & Recap Promo Bar (Interactive Stories Entry Points) */}
      <div className="bg-white rounded-2xl p-4 border border-[#e3e5e8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar / Circle Story preview */}
          <div
            onClick={onOpenStories}
            className="relative cursor-pointer group flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full p-[3px] bg-gradient-to-tr from-[#00aa5b] via-[#00a0ff] to-[#9a41fe] group-hover:scale-105 transition-transform shadow-md">
              <div className="w-full h-full bg-white rounded-full p-0.5">
                <div className="w-full h-full bg-[#00aa5b] rounded-full flex items-center justify-center text-white">
                  <PlayCircle className="w-7 h-7" />
                </div>
              </div>
            </div>
            <span className="absolute -bottom-1 bg-[#ff4053] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white uppercase">
              NEW
            </span>
          </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#222222]">
                  Ваши итоги 2024 года на Авито 🌟
                </h2>
              </div>
              <p className="text-xs text-[#757575] mt-0.5">
                Смотрите ваши персональные итоги, узнайте свой статус и достижения за этот год!
              </p>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            onClick={onOpenStories}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm animate-bounce hover:animate-none"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Смотреть итоги</span>
          </button>
          <button
            onClick={onOpenAchievements}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#f2f3f5] hover:bg-[#e4e6eb] text-[#222222] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#d0d4dc] transition-all"
          >
            <Trophy className="w-4 h-4 text-[#ffaa00]" />
            <span>Мои Достижения 🏆</span>
          </button>
        </div>
      </div>

      {/* Main Categories + Business 360 Section (Authentic Avito Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Category Cards (Left 3 columns) */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="group relative bg-[#f4f5f7] hover:bg-[#eef0f3] rounded-2xl p-3.5 h-32 flex flex-col justify-between overflow-hidden cursor-pointer transition-all duration-200 border border-transparent hover:border-[#d0d4dc]"
            >
              <h3 className="text-xs font-bold text-[#222222] leading-tight z-10 max-w-[80%]">
                {cat.title}
              </h3>
              <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 rounded-full overflow-hidden transition-transform group-hover:scale-110">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar: Всё для бизнеса (Authentic Avito Business Card) */}
        <div className="bg-[#f4f5f7] rounded-2xl p-4 flex flex-col justify-between border border-[#e3e5e8]">
          <div>
            <h3 className="text-base font-black text-[#222222]">
              Всё для бизнеса
            </h3>
            <p className="text-[11px] text-[#757575] mt-1 leading-snug">
              Миллионы предложений для разных задач в Авито Бизнес 360
            </p>

            {/* Sub-item circular icons */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {businessSubitems.map((sub, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#e3e5e8] flex items-center justify-center text-lg shadow-2xs group-hover:bg-[#e6f4fe] transition-colors">
                    {sub.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-[#222222] leading-tight">
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="mt-5 w-full bg-white hover:bg-[#f8f9fa] border border-[#d0d4dc] text-[#222222] font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors">
            <Search className="w-3.5 h-3.5 text-[#00a0ff]" />
            <span>Искать в Бизнес 360</span>
          </button>
        </div>
      </div>

      {/* Recommendations Feed (Listing Items) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-[#222222]">
            Рекомендации для вас
          </h2>
          <span className="text-xs font-semibold text-[#00a0ff] hover:underline cursor-pointer">
            Показать еще
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#e3e5e8] overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col group"
            >
              {/* Product Image + Truck Badge */}
              <div className="relative aspect-square overflow-hidden bg-[#f4f5f7]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Truck Badge Top Left */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md p-1 rounded-md text-white">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-xs font-semibold text-[#222222] line-clamp-2 leading-snug group-hover:text-[#00a0ff] transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-sm font-black text-[#222222] mt-1">
                    {item.price}
                  </div>
                </div>

                <div className="text-[10px] text-[#757575] space-y-0.5 pt-1 border-t border-[#f2f3f5]">
                  <div>{item.location}</div>
                  <div>{item.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Messenger Bar at Bottom Right (Authentic Avito UI) */}
      <div className="fixed bottom-0 right-6 z-30">
        <button className="bg-white border border-[#d0d4dc] border-b-0 rounded-t-xl px-4 py-2 shadow-lg flex items-center gap-2 text-xs font-bold text-[#222222] hover:bg-[#f8f9fa] transition-colors">
          <span>Сообщения</span>
          <span className="w-4 h-4 rounded-full bg-[#ff4053] text-white text-[10px] font-black flex items-center justify-center">
            1
          </span>
          <ChevronUp className="w-4 h-4 text-[#757575]" />
        </button>
      </div>
    </div>
  );
};
