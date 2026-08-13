import React, { useEffect, useMemo, useState } from "react";
import { RecapCard, UserProfile } from "../api/client";
import "./StoriesPlayer.css";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Coins,
  Compass,
  ExternalLink,
  Info,
  Rocket,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  WalletCards,
  X,
} from "lucide-react";

interface StoriesPlayerProps {
  cards: RecapCard[];
  profile: UserProfile;
  onSelectCTA: (action: string) => void;
  onOpenExplanation: (card: RecapCard) => void;
  onOpenShareModal: () => void;
  onClose?: () => void;
}

const STORY_DURATION = 6000;

const ORB_COUNT = 7;

type OrbConfig = {
  size: number;
  left: number;
  bottom: number;
  duration: number;
  delay: number;
  startX: number;
  midX: number;
  endX: number;
  startY: number;
  midY: number;
  endY: number;
  startScale: number;
  midScale: number;
  endScale: number;
  startOpacity: number;
  midOpacity: number;
  endOpacity: number;
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const createOrbConfigs = (_seed?: number): OrbConfig[] =>
  Array.from({ length: ORB_COUNT }, (_, index) => {
    const sizeRanges = [
      [250, 340],
      [170, 240],
      [90, 150],
      [210, 290],
      [120, 190],
      [55, 100],
      [80, 135],
    ] as const;
    const [minSize, maxSize] = sizeRanges[index % sizeRanges.length];
    const duration = randomBetween(15, 27);
    const phase = (index / ORB_COUNT + randomBetween(-0.07, 0.07) + 1) % 1;

    return {
      size: randomBetween(minSize, maxSize),
      left: randomBetween(-22, 82),
      bottom: randomBetween(-105, 35),
      duration,
      delay: -(duration * phase),
      startX: randomBetween(-55, 55),
      midX: randomBetween(-90, 90),
      endX: randomBetween(-125, 125),
      startY: randomBetween(90, 175),
      midY: -randomBetween(280, 455),
      endY: -randomBetween(760, 980),
      startScale: randomBetween(0.84, 0.96),
      midScale: randomBetween(0.98, 1.06),
      endScale: randomBetween(1.04, 1.16),
      startOpacity: randomBetween(0.28, 0.42),
      midOpacity: randomBetween(0.66, 0.9),
      endOpacity: randomBetween(0.12, 0.24),
    };
  });

const getProfileInitials = (fullName: string) =>
  fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "A";

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
  const profileInitials = getProfileInitials(profile.full_name);

  const orbConfigs = useMemo(
    () => createOrbConfigs(currentIndex),
    [currentIndex],
  );

  useEffect(() => {
    if (isPaused || !currentCard) return;

    const timer = window.setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    }, STORY_DURATION);

    return () => window.clearTimeout(timer);
  }, [currentIndex, isPaused, cards.length, currentCard]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey)
        return;

      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      /*
        event.code привязан к физической клавише, а не к раскладке.
        Поэтому KeyA / KeyD работают одинаково в EN и RU:
        A/Ф и D/В.
      */
      const goPrev = event.key === "ArrowLeft" || event.code === "KeyA";

      const goNext = event.key === "ArrowRight" || event.code === "KeyD";

      if (goPrev) {
        event.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (goNext) {
        event.preventDefault();
        setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cards.length]);

  if (!currentCard) return null;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const getIcon = (iconName: string) => {
    const iconClass = "w-6 h-6 text-white";

    switch (iconName) {
      case "sparkles":
        return <Sparkles className={iconClass} />;
      case "compass":
        return <Compass className={iconClass} />;
      case "coins":
        return <Coins className={iconClass} />;
      case "award":
        return <Award className={iconClass} />;
      default:
        return <Rocket className={iconClass} />;
    }
  };

  const getGradientStyle = (card: RecapCard): React.CSSProperties => {
    switch (card.card_type) {
      case "welcome":
        return {
          background:
            "linear-gradient(145deg, #19bf77 0%, #00aa5b 48%, #078a77 100%)",
        };
      case "category":
        return {
          background:
            "linear-gradient(145deg, #238cff 0%, #5365e8 48%, #8d4fe8 100%)",
        };
      case "finance":
        return {
          background:
            "linear-gradient(145deg, #a35af0 0%, #d64292 50%, #f15a62 100%)",
        };
      case "achievement":
        return {
          background:
            "linear-gradient(145deg, #ffbd3e 0%, #ff814a 50%, #f25353 100%)",
        };
      case "cta":
        return {
          background:
            "radial-gradient(circle at 82% 14%, rgba(110, 235, 255, 0.24) 0%, rgba(110, 235, 255, 0) 34%), linear-gradient(145deg, #12394a 0%, #087082 48%, #00a6a6 100%)",
        };
      default:
        return {
          background:
            "linear-gradient(145deg, #1ac885 0%, #00aa5b 52%, #009cf0 100%)",
        };
    }
  };

  const getOrbThemeStyle = (
    card: RecapCard,
  ): React.CSSProperties & Record<string, string> => {
    if (card.card_type === "welcome") {
      return {
        "--story-orb-fill": "rgba(255, 255, 255, 0.17)",
        "--story-orb-border": "rgba(255, 255, 255, 0.11)",
        "--story-orb-glow": "rgba(255, 255, 255, 0.055)",
      };
    }

    if (card.card_type === "cta") {
      return {
        "--story-orb-fill": "rgba(131, 239, 255, 0.14)",
        "--story-orb-border": "rgba(196, 249, 255, 0.11)",
        "--story-orb-glow": "rgba(77, 226, 255, 0.07)",
      };
    }

    return {
      "--story-orb-fill": "rgba(255, 255, 255, 0.11)",
      "--story-orb-border": "rgba(255, 255, 255, 0.07)",
      "--story-orb-glow": "rgba(255, 255, 255, 0.035)",
    };
  };

  const getTextThemeStyle = (
    card: RecapCard,
  ): React.CSSProperties & Record<string, string> => {
    switch (card.card_type) {
      case "welcome":
        return {
          "--story-accent": "#caffdf",
          "--story-accent-soft": "rgba(202, 255, 223, 0.14)",
          "--story-accent-border": "rgba(202, 255, 223, 0.28)",
        };
      case "category":
        return {
          "--story-accent": "#d9e4ff",
          "--story-accent-soft": "rgba(217, 228, 255, 0.14)",
          "--story-accent-border": "rgba(217, 228, 255, 0.28)",
        };
      case "finance":
        return {
          "--story-accent": "#ffd3e9",
          "--story-accent-soft": "rgba(255, 211, 233, 0.14)",
          "--story-accent-border": "rgba(255, 211, 233, 0.28)",
        };
      case "achievement":
        return {
          "--story-accent": "#fff0ad",
          "--story-accent-soft": "rgba(255, 240, 173, 0.15)",
          "--story-accent-border": "rgba(255, 240, 173, 0.30)",
        };
      case "cta":
        return {
          "--story-accent": "#c1f9ff",
          "--story-accent-soft": "rgba(193, 249, 255, 0.14)",
          "--story-accent-border": "rgba(193, 249, 255, 0.28)",
        };
      default:
        return {
          "--story-accent": "#ffffff",
          "--story-accent-soft": "rgba(255, 255, 255, 0.12)",
          "--story-accent-border": "rgba(255, 255, 255, 0.24)",
        };
    }
  };

  const getAccentStyle = (card: RecapCard): React.CSSProperties => {
    switch (card.card_type) {
      case "finance":
        return { background: "rgba(255, 230, 246, 0.18)" };
      case "achievement":
        return { background: "rgba(255, 245, 210, 0.18)" };
      default:
        return { background: "rgba(255, 255, 255, 0.15)" };
    }
  };

  const getPrimaryAction = () => {
    if (currentCard.cta_action === "share") {
      return {
        label: currentCard.cta_text || "Поделиться итогами",
        icon: <Share2 className="w-5 h-5" />,
        onClick: onOpenShareModal,
      };
    }

    if (
      currentCard.cta_action &&
      currentCard.cta_action !== "next" &&
      currentCard.cta_text
    ) {
      const action = currentCard.cta_action;

      return {
        label: currentCard.cta_text,
        icon: <ExternalLink className="w-5 h-5" />,
        onClick: () => onSelectCTA(action),
      };
    }

    return {
      label:
        currentIndex === cards.length - 1 ? "Посмотреть ещё раз" : "Продолжить",
      icon: <ChevronRight className="w-5 h-5" />,
      onClick:
        currentIndex === cards.length - 1
          ? () => setCurrentIndex(0)
          : handleNext,
    };
  };

  const primaryAction = getPrimaryAction();

  const getHeroFontSize = (text: string, card: RecapCard) => {
    const cleanText = text.trim();
    const totalLength = cleanText.replace(/\s/g, "").length;
    const words = cleanText.split(/\s+/).filter(Boolean);
    const longestWord = words.length
      ? Math.max(...words.map((word) => word.length))
      : 0;

    if (card.card_type === "finance") return "58px";

    if (card.card_type === "achievement") {
      if (longestWord >= 13) return "43px";
      if (totalLength <= 11) return "52px";
      if (totalLength <= 16) return "48px";
      if (totalLength <= 22) return "44px";
      return "40px";
    }

    if (card.card_type === "cta") {
      if (longestWord >= 12) return "36px";
      if (longestWord >= 10) return "39px";
      if (totalLength <= 14) return "50px";
      if (totalLength <= 20) return "44px";
      if (totalLength <= 28) return "40px";
      return "36px";
    }

    // Сначала страхуем длинные цельные слова.
    if (longestWord >= 16) return "39px";
    if (longestWord >= 13) return "44px";
    if (longestWord >= 11) return "48px";

    // Затем учитываем общую длину фразы.
    if (totalLength <= 11) return "56px";
    if (totalLength <= 17) return "52px";
    if (totalLength <= 23) return "47px";
    if (totalLength <= 30) return "42px";

    return "37px";
  };

  const formatMoneyText = (value: string) =>
    value.replace(/(\d[\d\s]*)(?=\s*₽)/g, (rawNumber) => {
      const digits = rawNumber.replace(/\s/g, "");

      if (digits.length < 4) return digits;

      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    });

  const getTitleFontSize = (text: string) => {
    const length = text.replace(/\s/g, "").length;

    if (length <= 16) return "34px";
    if (length <= 24) return "31px";
    return "28px";
  };

  const rawDisplayHighlight =
    currentCard.highlight_stat?.replace(/-/g, "‑") || "";

  const displayHighlight =
    currentCard.card_type === "finance"
      ? formatMoneyText(rawDisplayHighlight)
      : rawDisplayHighlight;

  const displayTitle = currentCard.title.replace(/-/g, "‑");

  const splitStoryText = (text: string) => {
    const parts =
      text
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
        ?.map((part) => part.trim())
        .filter(Boolean) ?? [];

    return {
      lead: parts[0] || text,
      detail: parts.slice(1).join(" "),
    };
  };

  const welcomeStory = splitStoryText(currentCard.description);

  const financeStats =
    currentCard.card_type === "finance"
      ? currentCard.description
          .split("\n")
          .map((line) => {
            const separatorIndex = line.indexOf(":");

            if (separatorIndex === -1) {
              return { label: line.trim(), value: "" };
            }

            return {
              label: line.slice(0, separatorIndex).trim(),
              value: formatMoneyText(line.slice(separatorIndex + 1).trim()),
            };
          })
          .filter((item) => item.label)
      : [];

  const financeValues = financeStats.map((stat) => {
    const numeric = Number(
      stat.value.replace(/[^0-9.,-]/g, "").replace(",", "."),
    );
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  });

  const financeTotal = financeValues.reduce((sum, value) => sum + value, 0);

  const financeShares = financeValues.map((value, index) => {
    if (financeTotal > 0) {
      return Math.round((value / financeTotal) * 100);
    }

    return financeValues.length === 2 ? 50 : index === 0 ? 100 : 0;
  });

  const getFinanceShortLabel = (label: string, index: number) => {
    const normalized = label.toLowerCase();

    if (normalized.includes("заработ")) return "Продажи";
    if (normalized.includes("сэконом")) return "Экономия";

    return index === 0 ? "Результат 1" : "Результат 2";
  };

  const achievementLevel =
    currentCard.card_type === "achievement"
      ? currentCard.subtitle.match(/\d+/)?.[0]
      : undefined;

  const getAchievementTheme = (level?: string) => {
    switch (level) {
      case "1":
        return { tone: "bronze", label: "BRONZE" };
      case "2":
        return { tone: "silver", label: "SILVER" };
      case "3":
      default:
        return { tone: "gold", label: "GOLD" };
    }
  };

  const achievementTheme = getAchievementTheme(achievementLevel);
  const achievementLevelNumber = Math.min(
    3,
    Math.max(1, Number(achievementLevel || 1)),
  );

  return (
    <div className="relative w-full min-h-full flex items-center justify-center p-4 font-sans">
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentIndex === 0}
        aria-label="Предыдущая карточка. Клавиши A или стрелка влево"
        title="Назад — A / ←"
        className="story-side-nav story-side-nav--prev"
      >
        <ChevronLeft className="w-6 h-6" />
        <span className="story-side-nav__key">A</span>
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentIndex === cards.length - 1}
        aria-label="Следующая карточка. Клавиши D или стрелка вправо"
        title="Вперёд — D / →"
        className="story-side-nav story-side-nav--next"
      >
        <ChevronRight className="w-6 h-6" />
        <span className="story-side-nav__key">D</span>
      </button>

      <section
        key={currentCard.id}
        style={{
          ...getGradientStyle(currentCard),
          ...getOrbThemeStyle(currentCard),
          ...getTextThemeStyle(currentCard),
        }}
        className="relative isolate w-full max-w-[430px] h-[min(680px,calc(100dvh-32px))] overflow-hidden rounded-[30px] text-white shadow-[0_32px_90px_rgba(0,0,0,0.26)] select-none animate-fade-in-up"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Randomized slowly floating background circles */}
        {orbConfigs.map((orb, index) => (
          <div
            key={`${currentCard.id}-orb-${index}`}
            className="story-orb"
            style={
              {
                width: `${orb.size}px`,
                height: `${orb.size}px`,
                left: `${orb.left}%`,
                bottom: `${orb.bottom}px`,
                animationDuration: `${orb.duration}s`,
                animationDelay: `${orb.delay}s`,
                "--orb-start-x": `${orb.startX}px`,
                "--orb-mid-x": `${orb.midX}px`,
                "--orb-end-x": `${orb.endX}px`,
                "--orb-start-y": `${orb.startY}px`,
                "--orb-mid-y": `${orb.midY}px`,
                "--orb-end-y": `${orb.endY}px`,
                "--orb-start-scale": orb.startScale,
                "--orb-mid-scale": orb.midScale,
                "--orb-end-scale": orb.endScale,
                "--orb-start-opacity": orb.startOpacity,
                "--orb-mid-opacity": orb.midOpacity,
                "--orb-end-opacity": orb.endOpacity,
              } as React.CSSProperties & Record<string, string | number>
            }
          />
        ))}

        <div className="relative z-20 h-full flex flex-col p-5">
          {/* Story progress */}
          <div
            className={`flex gap-1.5 ${
              currentCard.card_type === "cta" ? "mb-3" : "mb-5"
            }`}
          >
            {cards.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <div
                  className={`h-full rounded-full bg-white ${
                    idx < currentIndex
                      ? "w-full"
                      : idx === currentIndex
                        ? "animate-progress"
                        : "w-0"
                  }`}
                  style={
                    idx === currentIndex
                      ? { animationPlayState: isPaused ? "paused" : "running" }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          {/* Profile header */}
          {currentCard.card_type === "cta" ? (
            <header className="absolute right-5 top-[48px] z-30 flex items-center justify-end gap-3">
              <span className="rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm">
                {currentIndex + 1} / {cards.length}
              </span>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть итоги"
                  className="grid w-9 h-9 shrink-0 place-items-center rounded-full bg-black/10 text-white transition hover:bg-black/20 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </header>
          ) : (
            <header className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-11 h-11 shrink-0 rounded-full border-2 border-white/80 object-cover shadow-sm"
                />
              ) : (
                <div className="story-avatar-fallback w-11 h-11 shrink-0 rounded-full border-2 border-white/80 shadow-sm">
                  {profileInitials}
                </div>
              )}

              <div className="min-w-0">
                <p className="m-0 truncate text-[14px] font-extrabold leading-tight text-white">
                  {profile.full_name}
                </p>
                <p className="m-0 mt-1 truncate text-xs font-medium text-white/70">
                  @{profile.username}
                </p>
              </div>

              <span className="ml-auto rounded-full bg-black/10 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur-sm">
                {currentIndex + 1} / {cards.length}
              </span>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть итоги"
                  className="grid w-9 h-9 shrink-0 place-items-center rounded-full bg-black/10 text-white transition hover:bg-black/20 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </header>
          )}

          {/* Invisible navigation zones */}
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Предыдущая карточка"
            className="absolute left-0 top-20 bottom-28 z-10 w-[23%] cursor-w-resize disabled:cursor-default"
          />
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            aria-label="Следующая карточка"
            className="absolute right-0 top-20 bottom-28 z-10 w-[23%] cursor-e-resize disabled:cursor-default"
          />

          {/* Content */}
          <main
            className={`story-card-main story-card-main--${currentCard.card_type} relative z-20 flex min-h-0 flex-1 flex-col justify-start ${currentCard.card_type === "cta" ? "pt-0 pb-3" : "pt-5 pb-3"}`}
          >
            <div
              style={getAccentStyle(currentCard)}
              className={`story-feature-icon mb-3.5 grid w-11 h-11 shrink-0 place-items-center rounded-2xl border border-white/20 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.10)] ${currentCard.card_type === "achievement" ? `story-feature-icon--achievement story-feature-icon--${achievementTheme.tone}` : ""}`}
            >
              {getIcon(currentCard.icon_name)}
            </div>

            <div className="story-kicker-row">
              <p className="story-kicker">{currentCard.subtitle}</p>

              {currentCard.card_type === "category" && (
                <span className="story-mini-chip">TOP 1</span>
              )}
            </div>

            {currentCard.card_type === "cta" && (
              <div
                className="story-year-transition"
                aria-label="Переход от итогов 2024 к новым целям 2025"
              >
                <span className="story-year-transition__year story-year-transition__year--start">
                  2024
                </span>

                <div
                  className="story-year-transition__track"
                  aria-hidden="true"
                >
                  <span className="story-year-transition__track-base" />
                  <span className="story-year-transition__track-fill" />

                  <span className="story-year-transition__runner">
                    <span className="story-year-transition__runner-icon">
                      →
                    </span>
                  </span>
                </div>

                <span className="story-year-transition__year story-year-transition__year--end">
                  2025
                </span>
              </div>
            )}

            <h2
              className={`story-card-title story-card-title--${currentCard.card_type}`}
              style={{ fontSize: getTitleFontSize(displayTitle) }}
            >
              {displayTitle}
            </h2>

            {currentCard.card_type === "achievement" ? (
              <>
                <div
                  className={`story-achievement-plate story-achievement-plate--${achievementTheme.tone}`}
                >
                  <Award
                    className={`story-achievement-watermark story-achievement-watermark--${achievementTheme.tone}`}
                    aria-hidden="true"
                  />

                  <div className="story-achievement-plate__topline">
                    <span>ГЛАВНЫЙ ТИТУЛ</span>

                    <div className="story-achievement-plate__meta">
                      <div
                        className={`story-achievement-medal story-achievement-medal--${achievementTheme.tone}`}
                        aria-label={`Награда уровня ${achievementLevel || "3"}`}
                      >
                        <span
                          className="story-achievement-medal__glow"
                          aria-hidden="true"
                        />
                        <Award
                          className="story-achievement-medal__icon"
                          aria-hidden="true"
                        />
                        <span className="story-achievement-medal__label">
                          {achievementTheme.label}
                        </span>
                      </div>

                      {achievementLevel && (
                        <span
                          className={`story-level-chip story-level-chip--${achievementTheme.tone}`}
                        >
                          LVL {achievementLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="story-hero-text story-hero-text--achievement"
                    style={{
                      fontSize: getHeroFontSize(displayHighlight, currentCard),
                    }}
                  >
                    {displayHighlight}
                  </div>
                </div>

                <div
                  className={`story-achievement-insight story-achievement-insight--${achievementTheme.tone}`}
                >
                  <span className="story-achievement-insight__icon">
                    <Trophy className="h-[17px] w-[17px]" aria-hidden="true" />
                  </span>

                  <div className="story-achievement-insight__copy">
                    <span className="story-achievement-insight__eyebrow">
                      За что награда
                    </span>
                    <p>{currentCard.description}</p>
                  </div>
                </div>

                <div
                  className={`story-achievement-tier story-achievement-tier--${achievementTheme.tone}`}
                  aria-label={`Достигнут ${achievementLevelNumber} уровень из 3`}
                >
                  <div className="story-achievement-tier__header">
                    <span>Путь достижения</span>
                    <strong>{achievementLevelNumber} / 3</strong>
                  </div>

                  <div
                    className={`story-achievement-tier__track story-achievement-tier__track--level-${achievementLevelNumber}`}
                  >
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`story-achievement-tier__step ${
                          level <= achievementLevelNumber ? "is-reached" : ""
                        } ${level === achievementLevelNumber ? "is-current" : ""}`}
                      >
                        <span className="story-achievement-tier__dot">
                          {level}
                        </span>
                        <span className="story-achievement-tier__name">
                          {level === 1
                            ? "Bronze"
                            : level === 2
                              ? "Silver"
                              : "Gold"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {currentCard.highlight_stat && (
                  <div
                    className={`story-hero-text story-hero-text--${currentCard.card_type}`}
                    style={{
                      fontSize: getHeroFontSize(displayHighlight, currentCard),
                    }}
                  >
                    {displayHighlight}
                  </div>
                )}

                {currentCard.card_type === "finance" ? (
                  <>
                    <div className="story-finance-grid">
                      {financeStats.map((stat, index) => (
                        <div
                          key={`${stat.label}-${index}`}
                          className="story-stat-card"
                        >
                          <span className="story-stat-card__number">
                            {index + 1}
                          </span>
                          <span className="story-stat-card__label">
                            {stat.label}
                          </span>
                          <strong className="story-stat-card__value">
                            {stat.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {financeStats.length > 0 && (
                      <div className="story-finance-breakdown">
                        <div className="story-finance-breakdown__header">
                          <span className="story-finance-breakdown__icon">
                            <WalletCards
                              className="h-[15px] w-[15px]"
                              aria-hidden="true"
                            />
                          </span>
                          <span>Структура результата</span>
                        </div>

                        <div
                          className="story-finance-breakdown__track"
                          aria-label="Соотношение финансового результата"
                        >
                          {financeStats.slice(0, 2).map((stat, index) => (
                            <span
                              key={`${stat.label}-share`}
                              className={`story-finance-breakdown__segment story-finance-breakdown__segment--${index + 1}`}
                              style={{
                                width: `${financeShares[index] ?? 0}%`,
                              }}
                            />
                          ))}
                        </div>

                        <div className="story-finance-breakdown__legend">
                          {financeStats.slice(0, 2).map((stat, index) => (
                            <div
                              key={`${stat.label}-legend`}
                              className="story-finance-breakdown__legend-item"
                            >
                              <span
                                className={`story-finance-breakdown__legend-dot story-finance-breakdown__legend-dot--${index + 1}`}
                              />
                              <span>
                                {getFinanceShortLabel(stat.label, index)}
                              </span>
                              <strong>{financeShares[index] ?? 0}%</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {currentCard.card_type === "welcome" ? (
                      <div className="story-welcome-insight">
                        <div className="story-welcome-insight__head">
                          <span className="story-welcome-insight__icon">
                            <TrendingUp
                              className="h-[16px] w-[16px]"
                              aria-hidden="true"
                            />
                          </span>
                          <span>Ваш результат года</span>
                        </div>

                        <p className="story-welcome-insight__lead">
                          {welcomeStory.lead}
                        </p>

                        {welcomeStory.detail && (
                          <p className="story-welcome-insight__detail">
                            {welcomeStory.detail}
                          </p>
                        )}

                        <div
                          className="story-welcome-insight__footer"
                          aria-hidden="true"
                        >
                          <span>2024</span>
                          <span className="story-welcome-insight__line" />
                          <span>личный итог</span>
                        </div>
                      </div>
                    ) : currentCard.card_type === "category" ? (
                      <>
                        <div className="story-copy-panel story-copy-panel--category">
                          <span className="story-copy-panel__mark story-copy-panel__mark--icon">
                            <TrendingUp
                              className="h-[15px] w-[15px]"
                              aria-hidden="true"
                            />
                          </span>

                          <div className="story-copy-panel__body">
                            <span className="story-copy-panel__eyebrow">
                              Пик интереса
                            </span>
                            <p>{currentCard.description}</p>
                          </div>
                        </div>

                        <div className="story-category-meter">
                          <div className="story-category-meter__head">
                            <span>Интерес к категории</span>
                            <strong>TOP 1</strong>
                          </div>

                          <div className="story-category-meter__track">
                            <span className="story-category-meter__fill" />
                            <span className="story-category-meter__pulse" />
                          </div>

                          <div className="story-category-meter__footer">
                            <span>Ваш лидер года</span>
                            <strong>{displayHighlight}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`story-copy-panel ${
                          currentCard.card_type === "cta"
                            ? "story-copy-panel--finale"
                            : ""
                        }`}
                      >
                        <span className="story-copy-panel__mark">
                          {currentCard.card_type === "cta" ? "→" : "✦"}
                        </span>
                        <p>{currentCard.description}</p>
                      </div>
                    )}

                    {currentCard.card_type === "cta" && (
                      <div className="story-review-card mt-3 rounded-[18px] bg-white px-3.5 py-3 text-[#17181c] shadow-[0_14px_34px_rgba(0,0,0,0.14)]">
                        <div className="flex items-center gap-2.5">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.full_name}
                              className="h-10 w-10 shrink-0 rounded-full border-2 border-[#00aa5b] object-cover shadow-sm"
                              style={{ width: 40, height: 40 }}
                            />
                          ) : (
                            <div
                              className="story-avatar-fallback story-review-card__avatar-fallback"
                              style={{ width: 40, height: 40 }}
                            >
                              {profileInitials}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="m-0 truncate text-[13px] font-black leading-tight text-[#17181c]">
                              {profile.full_name}
                            </p>
                            <p className="m-0 mt-1 truncate text-[10.5px] font-semibold leading-none text-[#8a8f98]">
                              @{profile.username}
                            </p>
                          </div>

                          <span className="rounded-full bg-[#f2f3f5] px-2.5 py-1 text-[12px] font-black text-[#17181c]">
                            5,0
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3">
                          <div
                            className="story-review-stars flex shrink-0 items-center gap-1"
                            aria-label="Рейтинг 5 звёзд"
                          >
                            {Array.from({ length: 5 }).map((_, starIndex) => (
                              <Star
                                key={starIndex}
                                className="story-review-star h-[17px] w-[17px]"
                                fill="currentColor"
                                style={{
                                  animationDelay: `${starIndex * 120}ms`,
                                }}
                              />
                            ))}
                          </div>

                          <span className="min-w-0 text-[11px] font-bold leading-[1.25] text-[#4f5359]">
                            Вы отлично провели этот год на Авито
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="relative z-20 mt-auto space-y-2">
            <button
              type="button"
              onClick={() => onOpenExplanation(currentCard)}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-black/10 px-4 py-2.5 text-[13px] font-bold text-white/[0.85] transition hover:bg-black/[0.15] hover:text-white active:scale-[0.99]"
            >
              <Info className="w-4 h-4" />
              Почему именно этот результат?
            </button>

            <button
              type="button"
              onClick={primaryAction.onClick}
              className="flex w-full items-center justify-center gap-2 rounded-[15px] bg-white px-5 py-3 text-[15px] font-extrabold text-[#17181c] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)] active:translate-y-0 active:scale-[0.99]"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
};
