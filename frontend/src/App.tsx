import React, { useState, useEffect } from "react";
import {
  UserProfile,
  RecapResponse,
  RecapCard,
  fetchProfiles,
  fetchRecap,
} from "./api/client";
import { Header } from "./components/Header";
import { StoriesPlayer } from "./components/StoriesPlayer";
import { AchievementsDashboard } from "./components/AchievementsDashboard";
import { AvitoMainFeed } from "./components/AvitoMainFeed";
import { ExplanationModal } from "./components/ExplanationModal";
import { ShareCardModal } from "./components/ShareCardModal";
import { CTASimulationModal } from "./components/CTASimulationModal";
import { PublicShareCardPage } from "./components/PublicShareCardPage";
import { Loader2 } from "lucide-react";
import { RecapReveal } from "./components/recap/RecapReveal";
import { RecapOnboarding } from "./components/RecapOnboarding";

const getShareTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (hash.includes("share=")) {
    const match = hash.match(/share=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  if (hash.includes("/share/")) {
    const parts = hash.split("/share/");
    if (parts[1]) return parts[1].split("&")[0].split("?")[0];
  }

  const pathname = window.location.pathname;
  if (pathname.startsWith("/share/")) {
    const parts = pathname.split("/share/");
    if (parts[1]) return parts[1].split("/")[0];
  }

  return null;
};

const ONBOARDING_SEEN_KEY = "recap-onboarding-seen-profiles";
const RECAP_VIEWED_KEY = "recap-viewed-profiles";

const readStoredProfileIds = (key: string): number[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is number => typeof value === "number")
      : [];
  } catch {
    return [];
  }
};

const addStoredProfileId = (key: string, profileId: number) => {
  try {
    const ids = readStoredProfileIds(key);
    if (!ids.includes(profileId)) {
      localStorage.setItem(key, JSON.stringify([...ids, profileId]));
    }
  } catch {
    // Если localStorage недоступен, UI продолжит работать в текущей сессии.
  }
};

export const App: React.FC = () => {
  const [publicShareToken, setPublicShareToken] = useState<string | null>(getShareTokenFromUrl);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [activeView, setActiveView] = useState<
    "feed" | "stories" | "achievements"
  >("feed");
  const [loading, setLoading] = useState<boolean>(true);
  const [seenOnboardingProfileIds, setSeenOnboardingProfileIds] = useState<
    number[]
  >(() => readStoredProfileIds(ONBOARDING_SEEN_KEY));
  const [viewedProfileIds, setViewedProfileIds] = useState<number[]>(() =>
    readStoredProfileIds(RECAP_VIEWED_KEY),
  );

  // Modal states
  const [explanationData, setExplanationData] = useState<{
    isOpen: boolean;
    title: string;
    explanation: string;
  }>({ isOpen: false, title: "", explanation: "" });

  const [isShareOpen, setIsShareOpen] = useState(false);

  const [ctaModalData, setCtaModalData] = useState<{
    isOpen: boolean;
    url: string;
  }>({ isOpen: false, url: "" });

  useEffect(() => {
    const handleLocationChange = () => {
      setPublicShareToken(getShareTokenFromUrl());
    };

    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  const handleGoHomeFromShare = () => {
    window.location.hash = "";
    if (window.location.pathname.startsWith("/share/")) {
      window.history.pushState({}, "", "/");
    }
    setPublicShareToken(null);
  };

  useEffect(() => {
    fetchProfiles()
      .then((data) => {
        setProfiles(data);
        if (data.length > 0) {
          setSelectedProfileId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch recap when profile changes
  useEffect(() => {
    if (!selectedProfileId) return;
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setLoading(true);
    });
    fetchRecap(selectedProfileId)
      .then((data) => {
        if (isMounted) {
          setRecapData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedProfileId]);

  const markRecapViewed = (profileId: number) => {
    setViewedProfileIds((prev) => {
      if (prev.includes(profileId)) return prev;
      const next = [...prev, profileId];
      try {
        localStorage.setItem(RECAP_VIEWED_KEY, JSON.stringify(next));
      } catch {
        // Состояние всё равно сохранится в React до перезагрузки страницы.
      }
      return next;
    });
  };

  const markOnboardingSeen = (profileId: number) => {
    addStoredProfileId(ONBOARDING_SEEN_KEY, profileId);
    setSeenOnboardingProfileIds((prev) => {
      if (prev.includes(profileId)) return prev;
      return [...prev, profileId];
    });
  };

  const handleSelectProfile = (profileId: number) => {
    setActiveView("feed");
    if (profileId !== selectedProfileId) {
      setSelectedProfileId(profileId);
    }
  };

  const handleOpenStories = () => {
    markRecapViewed(selectedProfileId);
    markOnboardingSeen(selectedProfileId);
    setActiveView("stories");
  };

  const handleDismissOnboarding = () => {
    markOnboardingSeen(selectedProfileId);
  };

  const alreadyViewed = viewedProfileIds.includes(selectedProfileId);
  const alreadySawOnboarding =
    seenOnboardingProfileIds.includes(selectedProfileId);

  const isOnboardingOpen =
    !alreadyViewed &&
    !alreadySawOnboarding &&
    !loading &&
    recapData?.profile.id === selectedProfileId &&
    activeView === "feed";

  useEffect(() => {
    if (isOnboardingOpen && selectedProfileId) {
      addStoredProfileId(ONBOARDING_SEEN_KEY, selectedProfileId);
    }
  }, [isOnboardingOpen, selectedProfileId]);

  const handleOpenCardExplanation = (card: RecapCard) => {
    setExplanationData({
      isOpen: true,
      title: card.title,
      explanation: card.explanation,
    });
  };

  const handleOpenAchievementExplanation = (
    explanation: string,
    title: string,
  ) => {
    setExplanationData({
      isOpen: true,
      title: `Достижение: ${title}`,
      explanation: explanation,
    });
  };

  const handleSelectCTA = (action: string) => {
    if (action === "share") {
      setIsShareOpen(true);
    } else {
      setCtaModalData({ isOpen: true, url: action });
    }
  };

  if (publicShareToken) {
    return (
      <PublicShareCardPage
        shareToken={publicShareToken}
        onGoHome={handleGoHomeFromShare}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f3f5] text-[#222222] flex flex-col font-sans">
      <Header
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        onSelectProfile={handleSelectProfile}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      <main className="flex-1 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] space-y-4">
            <Loader2 className="w-12 h-12 text-[#00aa5b] animate-spin" />
            <p className="text-[#757575] font-semibold text-sm">
              Анализируем активность и формируем ваши итоги 2024...
            </p>
          </div>
        ) : recapData ? (
          <>
            {activeView === "achievements" ? (
              <AchievementsDashboard
                achievements={recapData.achievements}
                profile={recapData.profile}
                onSelectCTA={handleSelectCTA}
                onOpenExplanation={handleOpenAchievementExplanation}
              />
            ) : (
              <AvitoMainFeed
                onOpenStories={handleOpenStories}
                onOpenAchievements={() => setActiveView("achievements")}
                isRecapViewed={viewedProfileIds.includes(selectedProfileId)}
              />
            )}

            {activeView === "stories" && (
              <RecapReveal hue={150} onClose={() => setActiveView("feed")}>
                <StoriesPlayer
                  cards={recapData.cards}
                  profile={recapData.profile}
                  onSelectCTA={handleSelectCTA}
                  onOpenExplanation={handleOpenCardExplanation}
                  onOpenShareModal={() => setIsShareOpen(true)}
                  onClose={() => setActiveView("feed")}
                />
              </RecapReveal>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-[#757575]">
            Ошибка загрузки данных профиля.
          </div>
        )}
      </main>

      {recapData && (
        <RecapOnboarding
          isOpen={isOnboardingOpen}
          profile={recapData.profile}
          onOpenRecap={handleOpenStories}
          onClose={handleDismissOnboarding}
        />
      )}

      {/* Modals */}
      <ExplanationModal
        isOpen={explanationData.isOpen}
        title={explanationData.title}
        explanation={explanationData.explanation}
        onClose={() =>
          setExplanationData((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {recapData && (
        <ShareCardModal
          isOpen={isShareOpen}
          shareToken={recapData.share_token}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      <CTASimulationModal
        isOpen={ctaModalData.isOpen}
        actionUrl={ctaModalData.url}
        onClose={() => setCtaModalData({ isOpen: false, url: "" })}
      />
    </div>
  );
};

export default App;
