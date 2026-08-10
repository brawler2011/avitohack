import React, { useState } from 'react';
import { Achievement, UserProfile } from '../api/client';
import { Trophy, Tag, PiggyBank, Zap, Lock, Info, ExternalLink, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AchievementsDashboardProps {
  achievements: Achievement[];
  profile: UserProfile;
  onSelectCTA: (action: string) => void;
  onOpenExplanation: (explanation: string, title: string) => void;
}

export const AchievementsDashboard: React.FC<AchievementsDashboardProps> = ({
  achievements,
  profile: _profile,
  onSelectCTA,
  onOpenExplanation,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const filtered = achievements.filter((ach) => {
    if (filter === 'unlocked') return ach.is_unlocked;
    if (filter === 'locked') return !ach.is_unlocked;
    return true;
  });

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'tag':
        return <Tag className="w-6 h-6 text-[#00aa5b]" />;
      case 'piggy-bank':
        return <PiggyBank className="w-6 h-6 text-[#9A41FE]" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-[#ffaa00]" />;
      default:
        return <Trophy className="w-6 h-6 text-[#00A0FF]" />;
    }
  };

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 font-sans">
      {/* Avito Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#e3e5e8] shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            onClick={triggerConfetti}
            className="p-3.5 bg-[#e5f7ed] border border-[#b2e7ca] rounded-2xl shrink-0 animate-badge-float animate-glow-pulse cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            title="Нажмите для салюта!"
          >
            <Trophy className="w-8 h-8 text-[#00aa5b]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-[#222222]">
                Достижения на Авито 🏆
              </h1>
              <span className="animate-pulse-subtle bg-gradient-to-r from-[#e5f7ed] to-[#e6f4fe] text-[#00aa5b] text-xs px-3 py-1 rounded-full border border-[#b2e7ca] font-extrabold shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#00aa5b]" />
                Система наград
              </span>
            </div>
            <p className="text-[#757575] text-sm mt-1">
              Открывайте бейджи за активность за 2024 год и повышайте ваш уровень на платформе!
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-[#f2f3f5] p-1.5 rounded-xl border border-[#e3e5e8] shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-[#00aa5b] text-white shadow-sm scale-105'
                : 'text-[#757575] hover:text-[#222222]'
            }`}
          >
            Все ({achievements.length})
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === 'unlocked'
                ? 'bg-[#00aa5b] text-white shadow-sm scale-105'
                : 'text-[#757575] hover:text-[#222222]'
            }`}
          >
            Разблокированы ({achievements.filter((a) => a.is_unlocked).length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === 'locked'
                ? 'bg-[#757575] text-white shadow-sm scale-105'
                : 'text-[#757575] hover:text-[#222222]'
            }`}
          >
            Заблокированы ({achievements.filter((a) => !a.is_unlocked).length})
          </button>
        </div>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ach, index) => {
          const progressPercent = Math.min(
            100,
            Math.round((ach.current_progress / ach.max_progress) * 100)
          );

          return (
            <div
              key={ach.id}
              style={{ animationDelay: `${index * 70}ms` }}
              className={`animate-fade-in-up relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${
                ach.is_unlocked
                  ? 'bg-white border-[#e3e5e8] hover:border-[#00aa5b]/60 shadow-sm hover:shadow-xl hover:-translate-y-1.5'
                  : 'bg-[#fafafa] border-[#e8ebf0] opacity-85 hover:opacity-100 hover:shadow-md hover:-translate-y-1'
              }`}
            >
              {/* Top Row: Icon, Title, Level */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={(e) => ach.is_unlocked && triggerConfetti(e)}
                    className={`p-3 rounded-2xl border transition-all duration-300 ${
                      ach.is_unlocked
                        ? 'bg-[#f8f9fa] border-[#b2e7ca] animate-badge-float animate-glow-pulse cursor-pointer hover:scale-110 active:scale-95'
                        : 'bg-[#f2f3f5] border-[#e5e7eb] hover-wiggle cursor-pointer'
                    }`}
                  >
                    {ach.is_unlocked ? (
                      getBadgeIcon(ach.badge_icon)
                    ) : (
                      <Lock className="w-6 h-6 text-[#999999]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-[#222222] text-base">
                        {ach.name}
                      </h3>
                      {ach.is_unlocked && (
                        <span className="animate-pulse-subtle bg-gradient-to-r from-[#e5f7ed] to-[#dcfce7] text-[#00aa5b] text-xs px-2.5 py-0.5 rounded-md border border-[#b2e7ca] font-extrabold flex items-center gap-1 shadow-2xs">
                          <Award className="w-3 h-3" />
                          Уровень {ach.level}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#757575] mt-0.5">
                      {ach.description}
                    </p>
                  </div>
                </div>

                {/* Info Explanation Button */}
                <button
                  onClick={() => onOpenExplanation(ach.explanation, ach.name)}
                  className="text-[#999999] hover:text-[#00aa5b] p-1.5 hover:bg-[#e5f7ed] rounded-full transition-all duration-200"
                  title="Правила начисления"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar with Shimmer Effect */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#757575]">
                  <span className="flex items-center gap-1">
                    Прогресс
                    {ach.is_unlocked && (
                      <Sparkles className="w-3 h-3 text-[#00aa5b] animate-spin-slow" />
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#222222]">
                      {ach.current_progress} / {ach.max_progress}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        ach.is_unlocked
                          ? 'bg-[#00aa5b]/10 text-[#00aa5b]'
                          : 'bg-[#009cf0]/10 text-[#009cf0]'
                      }`}
                    >
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Animated Shimmer Progress Bar Track */}
                <div className="h-3 bg-[#eef1f5] rounded-full overflow-hidden border border-[#e3e5e8] shadow-inner relative">
                  <div
                    className={`h-full transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                      ach.is_unlocked
                        ? 'shimmer-bar-unlocked shine-sweep shadow-[0_0_12px_rgba(0,170,91,0.5)]'
                        : progressPercent > 0
                        ? 'shimmer-bar-progress shine-sweep'
                        : 'bg-[#d0d5dd]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="mt-4 pt-3 border-t border-[#f0f2f5] flex items-center justify-between gap-2">
                <span className="text-xs text-[#757575] italic line-clamp-1">
                  {ach.explanation}
                </span>

                <button
                  onClick={() => onSelectCTA(ach.cta_action)}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-[#009cf0] hover:text-white bg-[#e6f4fe] hover:bg-[#009cf0] px-3.5 py-1.5 rounded-xl border border-[#bce0fd] transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 shadow-2xs hover:shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {ach.cta_text}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


