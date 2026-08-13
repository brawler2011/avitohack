import React, { useEffect } from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { UserProfile } from "../api/client";
import "./RecapOnboarding.css";

interface RecapOnboardingProps {
  isOpen: boolean;
  profile: UserProfile;
  onOpenRecap: () => void;
  onClose: () => void;
}

const FireworkDecoration: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <svg
      className={`recap-onboarding-firework ${className}`}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path className="fw-line fw-line--center" d="M70 108C70 90 70 73 70 54" />
      <path className="fw-line fw-line--side" d="M51 103C47 88 41 75 33 62" />
      <path className="fw-line fw-line--side" d="M89 103C93 88 99 75 107 62" />

      <path
        className="fw-star fw-star--a"
        d="M70 22L74 30L83 31L76 37L78 46L70 41L62 46L64 37L57 31L66 30L70 22Z"
      />
      <path
        className="fw-star fw-star--b"
        d="M28 52L31 58L38 59L33 64L34 71L28 67L22 71L23 64L18 59L25 58L28 52Z"
      />
      <path
        className="fw-star fw-star--c"
        d="M112 52L115 58L122 59L117 64L118 71L112 67L106 71L107 64L102 59L109 58L112 52Z"
      />
      <path
        className="fw-star fw-star--d"
        d="M44 110L47 116L54 117L49 122L50 129L44 125L38 129L39 122L34 117L41 116L44 110Z"
      />
      <path
        className="fw-star fw-star--e"
        d="M96 110L99 116L106 117L101 122L102 129L96 125L90 129L91 122L86 117L93 116L96 110Z"
      />
    </svg>
  );
};

export const RecapOnboarding: React.FC<RecapOnboardingProps> = ({
  isOpen,
  profile: _profile,
  onOpenRecap,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOpenRecap = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onOpenRecap();
  };

  return (
    <div
      className="recap-onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recap-onboarding-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="recap-onboarding-modal">
        <div className="recap-onboarding-gradient" aria-hidden="true" />
        <div className="recap-onboarding-lights" aria-hidden="true" />

        <button
          type="button"
          className="recap-onboarding-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X size={25} />
        </button>

        <div className="recap-onboarding-badge">
          <Sparkles size={16} />
          <span>Ваши итоги 2024</span>
        </div>

        <div className="recap-onboarding-hero">
          <FireworkDecoration className="recap-onboarding-firework-left" />

          <div className="recap-onboarding-title-wrap">
            <div className="recap-onboarding-kicker">специально для вас</div>

            <h2 id="recap-onboarding-title" className="recap-onboarding-title">
              <span className="recap-onboarding-title-top">ИТОГИ</span>
              <span className="recap-onboarding-title-bottom">ГОДА</span>
            </h2>

            <p className="recap-onboarding-subtitle">
              Мы подготовили для вас кое-что интересное
            </p>
          </div>

          <FireworkDecoration className="recap-onboarding-firework-right" />
        </div>

        <div className="recap-onboarding-pills" aria-label="Что внутри итогов">
          <div className="recap-onboarding-pill">главные цифры</div>
          <div className="recap-onboarding-pill">достижения</div>
          <div className="recap-onboarding-pill">лучшие итоги года</div>
        </div>

        <button
          type="button"
          className="recap-onboarding-primary"
          onClick={handleOpenRecap}
        >
          <span className="recap-onboarding-primary-shine" aria-hidden="true" />
          <span>Посмотреть мои итоги</span>
          <ChevronRight size={22} />
        </button>

        <button
          type="button"
          className="recap-onboarding-secondary"
          onClick={onClose}
        >
          Посмотреть позже
        </button>
      </section>
    </div>
  );
};
