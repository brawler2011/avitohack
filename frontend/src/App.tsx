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
import { Loader2 } from "lucide-react";
import { RecapReveal } from "./components/recap/RecapReveal";
import { RecapOnboarding } from "./components/RecapOnboarding";

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
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [activeView, setActiveView] = useState<
    "feed" | "stories" | "achievements"
  >("feed");
  const [loading, setLoading] = useState<boolean>(true);
  const [onboardingProfileId, setOnboardingProfileId] = useState<number | null>(
    null,
  );
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

  useEffect(() => {
    if (!selectedProfileId) return;

    const alreadyViewed = viewedProfileIds.includes(selectedProfileId);
    const alreadySawOnboarding =
      readStoredProfileIds(ONBOARDING_SEEN_KEY).includes(selectedProfileId);

    if (!alreadyViewed && !alreadySawOnboarding) {
      setOnboardingProfileId(selectedProfileId);
    } else {
      setOnboardingProfileId(null);
    }
  }, [selectedProfileId, viewedProfileIds]);

  const handleSelectProfile = (profileId: number) => {
    setActiveView("feed");
    if (profileId !== selectedProfileId) {
      setSelectedProfileId(profileId);
    }
  };

  const handleOpenStories = () => {
    markRecapViewed(selectedProfileId);
    setOnboardingProfileId(null);
    setActiveView("stories");
  };

  const handleDismissOnboarding = () => {
    setOnboardingProfileId(null);
  };

  const isOnboardingOpen =
    onboardingProfileId === selectedProfileId &&
    !loading &&
    recapData?.profile.id === selectedProfileId &&
    activeView === "feed";

  useEffect(() => {
    if (isOnboardingOpen && onboardingProfileId !== null) {
      addStoredProfileId(ONBOARDING_SEEN_KEY, onboardingProfileId);
    }
  }, [isOnboardingOpen, onboardingProfileId]);

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
