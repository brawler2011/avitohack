import React, { useState, useEffect } from 'react';
import { ShareCard, fetchShareCard } from '../api/client';
import { Share2, X, Copy, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface ShareCardModalProps {
  isOpen: boolean;
  shareToken: string;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  shareToken,
  onClose,
}) => {
  const [data, setData] = useState<ShareCard | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && shareToken) {
      fetchShareCard(shareToken)
        .then(setData)
        .catch(console.error);
    }
  }, [isOpen, shareToken]);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/#share=${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-[#e3e5e8] rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-[#222222]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
          <div className="flex items-center gap-2 text-[#00aa5b] font-extrabold text-xs uppercase tracking-wider">
            <Share2 className="w-4 h-4" />
            Публичная карточка итогов
          </div>
          <button
            onClick={onClose}
            className="text-[#757575] hover:text-[#222222] p-1 rounded-full hover:bg-[#f2f3f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Card Banner */}
        {data ? (
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#00aa5b] via-[#0088d6] to-[#9A41FE] text-white shadow-lg space-y-4 border border-white/20">
            {/* Avito Brand dots */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00AA5B]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3E55]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A0FF]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#9A41FE]"></span>
                <span className="text-xs font-black tracking-tight ml-1 text-white">Авито Итоги 2024</span>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            </div>

            {/* Profile Avatar & Name */}
            <div className="flex items-center gap-3 pt-2">
              <img
                src={data.avatar_url}
                alt={data.full_name}
                className="w-12 h-12 rounded-full border-2 border-white object-cover shadow"
              />
              <div>
                <div className="font-extrabold text-base leading-tight">
                  {data.full_name}
                </div>
                <div className="text-xs font-semibold text-emerald-100">
                  {data.archetype}
                </div>
              </div>
            </div>

            {/* AI Title */}
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-center">
              <div className="text-[10px] uppercase font-bold text-white/80">Титул 2024 года</div>
              <div className="text-base font-black text-white mt-0.5">{data.ai_title}</div>
            </div>

            {/* Unlocked Badges */}
            <div className="space-y-1">
              <div className="text-xs font-bold text-white/90">Главные достижения:</div>
              <div className="flex flex-wrap gap-1.5">
                {data.top_achievements.map((ach, i) => (
                  <span
                    key={i}
                    className="bg-black/30 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full border border-white/20 text-white"
                  >
                    🏆 {ach}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-[#757575]">Загрузка карточки...</div>
        )}

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-xs text-[#757575] bg-[#f8f9fa] p-2.5 rounded-xl border border-[#e3e5e8]">
          <ShieldCheck className="w-4 h-4 text-[#00aa5b] shrink-0" />
          <span>Безопасная карточка: суммарные траты и личные сообщения скрыты.</span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold rounded-xl shadow-md transition-all"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-white" />
              Ссылка скопирована!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              Скопировать ссылку для соцсетей
            </>
          )}
        </button>
      </div>
    </div>
  );
};
