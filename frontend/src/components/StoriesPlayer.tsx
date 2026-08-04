import React, { useState, useEffect } from 'react';
import { RecapCard, UserProfile } from '../api/client';
import {
  Sparkles,
  Compass,
  Coins,
  Award,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Info,
  Share2,
  ExternalLink,
  X,
} from 'lucide-react';

interface StoriesPlayerProps {
  cards: RecapCard[];
  profile: UserProfile;
  onSelectCTA: (action: string) => void;
  onOpenExplanation: (card: RecapCard) => void;
  onOpenShareModal: () => void;
  onClose?: () => void;
}

export const StoriesPlayer: React.FC<StoriesPlayerProps> = ({
  cards,
  profile,
  onSelectCTA,
  onOpenExplanation,
  onOpenShareModal,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0); // loop back
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, cards.length]);

  if (!currentCard) return null;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'sparkles':
        return <Sparkles className="w-8 h-8 text-yellow-300" />;
      case 'compass':
        return <Compass className="w-8 h-8 text-cyan-300" />;
      case 'coins':
        return <Coins className="w-8 h-8 text-amber-300" />;
      case 'award':
        return <Award className="w-8 h-8 text-orange-300" />;
      default:
        return <Rocket className="w-8 h-8 text-emerald-300" />;
    }
  };

  // Guaranteed inline background gradients to prevent Tailwind purges
  const getGradientStyle = (card: RecapCard) => {
    switch (card.card_type) {
      case 'welcome':
        return {
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0e7490 100%)',
        };
      case 'category':
        return {
          background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 50%, #6d28d9 100%)',
        };
      case 'finance':
        return {
          background: 'linear-gradient(135deg, #7e22ce 0%, #be185d 50%, #be123c 100%)',
        };
      case 'achievement':
        return {
          background: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)',
        };
      case 'cta':
        return {
          background: 'linear-gradient(135deg, #0f766e 0%, #047857 50%, #15803d 100%)',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)',
        };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-4 font-sans">
      {/* Avito Stories Frame / Container Wrapper */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] p-3 shadow-2xl border border-[#e3e5e8]">
        {/* Top Phone / Story Header Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 text-xs text-[#757575] font-semibold border-b border-[#f0f0f0]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00CC76]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4053]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00AAFF]"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#9A41FE]"></span>
            <span className="font-black text-[#222222] text-xs">Авито Итоги</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#e5f7ed] text-[#00aa5b] text-[10px] px-2 py-0.5 rounded-md font-extrabold border border-[#b2e7ca]">
              Итоги 2024
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[#757575] hover:text-[#222222] p-1 rounded-full hover:bg-[#f2f3f5]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Story Card Container with Guaranteed Vivid Gradient & Contrast */}
        <div
          style={getGradientStyle(currentCard)}
          className="relative w-full h-[580px] rounded-2xl overflow-hidden shadow-xl text-white flex flex-col justify-between p-6 transition-all duration-500 border border-white/20 select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Progress Bars Header */}
          <div className="flex items-center gap-1.5 z-20">
            {cards.map((_, idx) => (
              <div
                key={idx}
                className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    idx < currentIndex
                      ? 'w-full'
                      : idx === currentIndex
                      ? isPaused
                        ? 'w-full bg-amber-300'
                        : 'animate-progress'
                      : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* User Info Header */}
          <div className="flex items-center justify-between pt-3 z-20">
            <div className="flex items-center gap-3">
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <div>
                <div className="font-extrabold text-sm leading-tight text-white drop-shadow-md">
                  {profile.full_name}
                </div>
                <div className="text-xs text-white/90 font-medium drop-shadow-sm">
                  @{profile.username}
                </div>
              </div>
            </div>
          </div>

          {/* Left / Right Click Areas for Navigation */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-10 opacity-0 hover:opacity-10 transition-opacity bg-white/10 flex items-center justify-start pl-2 text-white"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-20 w-1/3 z-10 opacity-0 hover:opacity-10 transition-opacity bg-white/10 flex items-center justify-end pr-2 text-white"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Main Content Area with Dark Semi-Transparent Container for Maximum Contrast */}
          <div className="my-auto z-20 flex flex-col items-center text-center space-y-4 px-2">
            {/* Card Icon */}
            <div className="p-3.5 bg-black/30 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg animate-bounce">
              {getIcon(currentCard.icon_name)}
            </div>

            {/* Subtitle & Title Box */}
            <div className="space-y-1.5 bg-black/30 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 w-full shadow-lg">
              <span className="text-[11px] uppercase font-black tracking-widest text-amber-300">
                {currentCard.subtitle}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight leading-snug drop-shadow-lg">
                {currentCard.title}
              </h2>
            </div>

            {/* Highlighted Stat Display */}
            <div className="w-full">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white bg-black/45 backdrop-blur-md drop-shadow-xl px-4 py-3 rounded-2xl border border-white/30 shadow-2xl">
                {currentCard.highlight_stat}
              </div>
            </div>

            {/* Description Text Box */}
            <div className="bg-black/30 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 w-full shadow-lg">
              <p className="text-xs font-medium text-white/95 leading-relaxed drop-shadow-sm whitespace-pre-line">
                {currentCard.description}
              </p>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="space-y-2 z-20 pt-2">
            {/* Explanation Link */}
            <button
              onClick={() => onOpenExplanation(currentCard)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-white hover:text-amber-200 font-bold py-1 transition-colors drop-shadow-sm"
            >
              <Info className="w-3.5 h-3.5" />
              Почему зафиксированы эти итоги?
            </button>

            {/* Action CTA Button - Avito Green Style */}
            {currentCard.cta_action === 'share' ? (
              <button
                onClick={onOpenShareModal}
                className="w-full flex items-center justify-center gap-2 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold py-3 px-6 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="w-5 h-5 text-white" />
                Поделиться карточкой итогов
              </button>
            ) : currentCard.cta_action !== 'next' && currentCard.cta_text ? (
              <button
                onClick={() => onSelectCTA(currentCard.cta_action!)}
                className="w-full flex items-center justify-center gap-2 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold py-3 px-6 rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="w-5 h-5 text-white" />
                {currentCard.cta_text}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md text-white font-bold py-3 px-6 rounded-xl border border-white/30 hover:bg-black/50 transition-all shadow-md"
              >
                Следующий слайд
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots */}
      <div className="flex items-center gap-2 mt-4">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              idx === currentIndex
                ? 'bg-[#00aa5b] w-7 shadow-sm'
                : 'bg-[#d0d4dc] hover:bg-[#a0a4ac]'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
