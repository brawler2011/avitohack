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

const createOrbConfigs = (): OrbConfig[] =>
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

  const orbConfigs = useMemo(() => createOrbConfigs(), [currentIndex]);

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

  const getHighlightSizeClass = (card: RecapCard) => {
    switch (card.card_type) {
      case "finance":
        return "text-[58px]";
      case "category":
        return "text-[52px]";
      case "achievement":
        return "text-[52px]";
      case "cta":
        return "text-[52px]";
      case "welcome":
        return "text-[54px]";
      default:
        return "text-[52px]";
    }
  };

  const displayHighlight = currentCard.highlight_stat?.replace(/-/g, "‑");

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
          <div className="flex gap-1.5 mb-5">
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
          <header className="flex items-center gap-3">
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-11 h-11 shrink-0 rounded-full border-2 border-white/80 object-cover shadow-sm"
            />

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
          <main className="relative z-20 flex min-h-0 flex-1 flex-col justify-start pt-7 pb-3">
            <div
              style={getAccentStyle(currentCard)}
              className="mb-4 grid w-11 h-11 shrink-0 place-items-center rounded-2xl border border-white/20 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
            >
              {getIcon(currentCard.icon_name)}
            </div>

            <p className="m-0 mb-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white/70">
              {currentCard.subtitle}
            </p>

            <h2 className="m-0 max-w-full text-[36px] font-black leading-[0.96] tracking-[-0.04em] text-white [text-wrap:balance]">
              {currentCard.title}
            </h2>

            {currentCard.highlight_stat && (
              <div
                className={`mt-5 max-w-full break-words font-black leading-[0.92] tracking-[-0.05em] text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.13)] [text-wrap:balance] ${getHighlightSizeClass(currentCard)}`}
              >
                {displayHighlight}
              </div>
            )}

            <p className="m-0 mt-5 max-w-full whitespace-pre-line text-[14px] font-semibold leading-[1.48] text-white/[0.86]">
              {currentCard.description}
            </p>
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
