import React, { useState } from "react";
import { Achievement, UserProfile } from "../api/client";
import {
  Award,
  ExternalLink,
  Info,
  Lock,
  PiggyBank,
  Sparkles,
  Tag,
  Trophy,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import "./AchievementsDashboard.css";

interface AchievementsDashboardProps {
  achievements: Achievement[];
  profile: UserProfile;
  onSelectCTA: (action: string) => void;
  onOpenExplanation: (explanation: string, title: string) => void;
}

type AchievementTier = "locked" | "bronze" | "silver" | "gold";

const getAchievementTier = (achievement: Achievement): AchievementTier => {
  if (!achievement.is_unlocked) return "locked";
  if (achievement.level <= 1) return "bronze";
  if (achievement.level === 2) return "silver";
  return "gold";
};

const getTierLabel = (tier: AchievementTier) => {
  switch (tier) {
    case "bronze":
      return "Бронза";
    case "silver":
      return "Серебро";
    case "gold":
      return "Золото";
    default:
      return "Закрыто";
  }
};

export const AchievementsDashboard: React.FC<AchievementsDashboardProps> = ({
  achievements,
  profile: _profile,
  onSelectCTA,
  onOpenExplanation,
}) => {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const filtered = achievements.filter((achievement) => {
    if (filter === "unlocked") return achievement.is_unlocked;
    if (filter === "locked") return !achievement.is_unlocked;
    return true;
  });

  const getBadgeIcon = (iconName: string) => {
    const iconClass = "achievement-card__badge-icon";

    switch (iconName) {
      case "tag":
        return <Tag className={iconClass} />;
      case "piggy-bank":
        return <PiggyBank className={iconClass} />;
      case "zap":
        return <Zap className={iconClass} />;
      default:
        return <Trophy className={iconClass} />;
    }
  };

  const triggerConfetti = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 48,
      spread: 68,
      origin: { x, y },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-[#e3e5e8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={triggerConfetti}
            className="p-3.5 bg-[#e5f7ed] border border-[#b2e7ca] rounded-2xl shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Нажмите для салюта!"
          >
            <Trophy className="w-8 h-8 text-[#00aa5b]" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-[#222222]">
                Достижения на Авито
              </h1>

              <span className="bg-[#e5f7ed] text-[#00aa5b] text-xs px-3 py-1 rounded-full border border-[#b2e7ca] font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Система наград
              </span>
            </div>

            <p className="text-[#757575] text-sm mt-1">
              Повышайте уровень достижений: бронза → серебро → золото.
            </p>
          </div>
        </div>

        <div className="flex items-center bg-[#f2f3f5] p-1.5 rounded-xl border border-[#e3e5e8] shrink-0">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === "all"
                ? "bg-[#00aa5b] text-white shadow-sm"
                : "text-[#757575] hover:text-[#222222]"
            }`}
          >
            Все ({achievements.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("unlocked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === "unlocked"
                ? "bg-[#00aa5b] text-white shadow-sm"
                : "text-[#757575] hover:text-[#222222]"
            }`}
          >
            Открыты ({achievements.filter((a) => a.is_unlocked).length})
          </button>

          <button
            type="button"
            onClick={() => setFilter("locked")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
              filter === "locked"
                ? "bg-[#6f7680] text-white shadow-sm"
                : "text-[#757575] hover:text-[#222222]"
            }`}
          >
            Закрыты ({achievements.filter((a) => !a.is_unlocked).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((achievement, index) => {
          const progressPercent = Math.min(
            100,
            Math.round(
              (achievement.current_progress /
                Math.max(achievement.max_progress, 1)) *
                100,
            ),
          );

          const tier = getAchievementTier(achievement);
          const tierLabel = getTierLabel(tier);

          return (
            <article
              key={achievement.id}
              style={
                {
                  "--achievement-delay": `${index * 160}ms`,
                } as React.CSSProperties
              }
              className={`achievement-card achievement-card--${tier}`}
            >
              {achievement.is_unlocked && (
                <>
                  <span
                    className="achievement-card__shine"
                    aria-hidden="true"
                  />
                  <span
                    className="achievement-card__sparkle achievement-card__sparkle--one"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                  <span
                    className="achievement-card__sparkle achievement-card__sparkle--two"
                    aria-hidden="true"
                  >
                    ✦
                  </span>
                </>
              )}

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3.5">
                  <button
                    type="button"
                    onClick={(event) =>
                      achievement.is_unlocked && triggerConfetti(event)
                    }
                    className={`achievement-card__badge achievement-card__badge--${tier}`}
                    title={
                      achievement.is_unlocked
                        ? `${tierLabel}, уровень ${achievement.level}`
                        : "Достижение пока закрыто"
                    }
                  >
                    <span
                      className="achievement-card__badge-shine"
                      aria-hidden="true"
                    />

                    {achievement.is_unlocked ? (
                      getBadgeIcon(achievement.badge_icon)
                    ) : (
                      <Lock className="achievement-card__badge-icon" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#222222]">
                        {achievement.name}
                      </h3>

                      <span
                        className={`achievement-card__tier achievement-card__tier--${tier}`}
                      >
                        {achievement.is_unlocked && (
                          <Award className="w-3 h-3" />
                        )}
                        {achievement.is_unlocked
                          ? `${tierLabel} · Ур. ${achievement.level}`
                          : tierLabel}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-[#757575]">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenExplanation(achievement.explanation, achievement.name)
                  }
                  className="achievement-card__info"
                  title="Правила начисления"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#757575]">
                  <span className="flex items-center gap-1.5">
                    Прогресс
                    {achievement.is_unlocked && (
                      <Sparkles className="achievement-card__progress-sparkle w-3 h-3" />
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#222222]">
                      {achievement.current_progress} /{" "}
                      {achievement.max_progress}
                    </span>
                    <span
                      className={`achievement-card__percent achievement-card__percent--${tier}`}
                    >
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                <div
                  className={`achievement-card__progress achievement-card__progress--${tier}`}
                >
                  <div
                    className="achievement-card__progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  >
                    {achievement.is_unlocked && (
                      <span
                        className="achievement-card__progress-shine"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-5 flex items-center justify-between gap-3 border-t border-black/[0.055] pt-3">
                <span className="min-w-0 line-clamp-1 text-xs italic text-[#777d85]">
                  {achievement.explanation}
                </span>

                <button
                  type="button"
                  onClick={() => onSelectCTA(achievement.cta_action)}
                  className={`achievement-card__cta achievement-card__cta--${tier}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {achievement.cta_text}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
