import React, { useEffect, useState } from 'react';
import { ShareCard, fetchShareCard } from '../api/client';
import { Sparkles, ShieldCheck, Share2, Copy, Check, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

interface PublicShareCardPageProps {
  shareToken: string;
  onGoHome: () => void;
}

export const PublicShareCardPage: React.FC<PublicShareCardPageProps> = ({ shareToken, onGoHome }) => {
  const [data, setData] = useState<ShareCard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }
    });

    fetchShareCard(shareToken)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error loading public share card:", err);
          setError("Карточка итогов не найдена или ссылка недействительна.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  const currentUrl = `${window.location.origin}/#share=${shareToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Посмотрите мои Итоги 2024 года на Авито! ✨`);
    const url = encodeURIComponent(currentUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleShareVK = () => {
    const url = encodeURIComponent(currentUrl);
    const title = encodeURIComponent(`Мои Авито Итоги 2024`);
    window.open(`https://vk.com/share.php?url=${url}&title=${title}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-[#00aa5b] animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Загружаем публичную карточку итогов...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black">Карточка не найдена</h1>
            <p className="text-slate-400 text-sm">{error || "Не удалось загрузить данные по этой ссылке."}</p>
          </div>
          <button
            onClick={onGoHome}
            className="w-full py-3.5 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Перейти на главную
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white flex flex-col justify-between items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Dynamic background glow shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00aa5b]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#9A41FE]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-md flex items-center justify-between py-4 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onGoHome}>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#00AA5B]"></span>
            <span className="w-3 h-3 rounded-full bg-[#FF3E55]"></span>
            <span className="w-3 h-3 rounded-full bg-[#00A0FF]"></span>
            <span className="w-3 h-3 rounded-full bg-[#9A41FE]"></span>
          </div>
          <span className="text-base font-black tracking-tight text-white">Авито Итоги 2024</span>
        </div>
        <button
          onClick={onGoHome}
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
        >
          На главную
        </button>
      </header>

      {/* Public Share Card Content */}
      <main className="w-full max-w-md my-auto py-6 z-10 space-y-6">
        {/* Main Banner Card */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#00aa5b] via-[#0077c8] to-[#8b2cf5] text-white shadow-2xl space-y-6 border border-white/20 overflow-hidden">
          {/* Subtle watermark badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-white/80 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              Публичная карточка
            </span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-4 pt-1">
            <img
              src={data.avatar_url}
              alt={data.full_name}
              className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-lg shrink-0"
            />
            <div>
              <h2 className="font-extrabold text-xl sm:text-2xl leading-tight">
                {data.full_name}
              </h2>
              <div className="inline-block mt-1 text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 text-emerald-100">
                {data.archetype}
              </div>
            </div>
          </div>

          {/* Title Box */}
          <div className="p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/25 text-center shadow-inner">
            <div className="text-[11px] uppercase font-extrabold text-white/80 tracking-wide">Главный Титул 2024 года</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-sm">{data.ai_title}</div>
          </div>

          {/* Top Category */}
          {data.top_category && (
            <div className="flex items-center justify-between bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold">
              <span className="text-white/80">Любимая категория:</span>
              <span className="text-white font-extrabold">{data.top_category}</span>
            </div>
          )}

          {/* Achievements list */}
          {data.top_achievements && data.top_achievements.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-white/90">Разблокированные достижения:</div>
              <div className="flex flex-wrap gap-2">
                {data.top_achievements.map((ach, i) => (
                  <span
                    key={i}
                    className="bg-black/35 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-1.5 shadow-sm"
                  >
                    🏆 {ach}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security & Privacy Notice */}
        <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-md">
          <ShieldCheck className="w-5 h-5 text-[#00aa5b] shrink-0" />
          <span>
            <strong>Конфиденциальность подтверждена:</strong> личные переписки, точные суммы трат и контакты скрыты.
          </span>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {/* Main CTA */}
          <button
            onClick={onGoHome}
            className="w-full py-4 bg-[#00aa5b] hover:bg-[#009650] active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group"
          >
            <span>Посмотреть свои итоги 2024</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Social Share grid */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShareTelegram}
              className="py-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-[#229ED9] border border-[#229ED9]/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Telegram
            </button>

            <button
              onClick={handleShareVK}
              className="py-3 bg-[#0077FF]/20 hover:bg-[#0077FF]/30 text-[#0077FF] border border-[#0077FF]/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4" />
              ВКонтакте
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопировано!' : 'Ссылка'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-4 z-10 text-xs text-slate-500">
        © 2024 Авито Итоги Года. Безопасно и конфиденциально.
      </footer>
    </div>
  );
};
