import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  RecapResponse,
  RecapCard,
  fetchProfiles,
  fetchRecap,
} from './api/client';
import { Header } from './components/Header';
import { StoriesPlayer } from './components/StoriesPlayer';
import { AchievementsDashboard } from './components/AchievementsDashboard';
import { AvitoMainFeed } from './components/AvitoMainFeed';
import { ExplanationModal } from './components/ExplanationModal';
import { ShareCardModal } from './components/ShareCardModal';
import { CTASimulationModal } from './components/CTASimulationModal';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [activeView, setActiveView] = useState<'feed' | 'stories' | 'achievements'>('feed');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [explanationData, setExplanationData] = useState<{
    isOpen: boolean;
    title: string;
    explanation: string;
  }>({ isOpen: false, title: '', explanation: '' });

  const [isShareOpen, setIsShareOpen] = useState(false);

  const [ctaModalData, setCtaModalData] = useState<{
    isOpen: boolean;
    url: string;
  }>({ isOpen: false, url: '' });

  // Initial fetch profiles
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
    setLoading(true);
    fetchRecap(selectedProfileId)
      .then((data) => {
        setRecapData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedProfileId]);

  const handleOpenCardExplanation = (card: RecapCard) => {
    setExplanationData({
      isOpen: true,
      title: card.title,
      explanation: card.explanation,
    });
  };

  const handleOpenAchievementExplanation = (explanation: string, title: string) => {
    setExplanationData({
      isOpen: true,
      title: `Достижение: ${title}`,
      explanation: explanation,
    });
  };

  const handleSelectCTA = (action: string) => {
    if (action === 'share') {
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
        onSelectProfile={setSelectedProfileId}
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
          activeView === 'feed' ? (
            <AvitoMainFeed
              onOpenStories={() => setActiveView('stories')}
              onOpenAchievements={() => setActiveView('achievements')}
            />
          ) : activeView === 'stories' ? (
            <StoriesPlayer
              cards={recapData.cards}
              profile={recapData.profile}
              onSelectCTA={handleSelectCTA}
              onOpenExplanation={handleOpenCardExplanation}
              onOpenShareModal={() => setIsShareOpen(true)}
              onClose={() => setActiveView('feed')}
            />
          ) : (
            <AchievementsDashboard
              achievements={recapData.achievements}
              profile={recapData.profile}
              onSelectCTA={handleSelectCTA}
              onOpenExplanation={handleOpenAchievementExplanation}
            />
          )
        ) : (
          <div className="text-center py-20 text-[#757575]">
            Ошибка загрузки данных профиля.
          </div>
        )}
      </main>

      {/* Modals */}
      <ExplanationModal
        isOpen={explanationData.isOpen}
        title={explanationData.title}
        explanation={explanationData.explanation}
        onClose={() => setExplanationData((prev) => ({ ...prev, isOpen: false }))}
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
        onClose={() => setCtaModalData({ isOpen: false, url: '' })}
      />
    </div>
  );
};

export default App;
