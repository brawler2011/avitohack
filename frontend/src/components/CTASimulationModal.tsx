import React from 'react';
import { ExternalLink, X, CheckCircle2 } from 'lucide-react';

interface CTASimulationModalProps {
  isOpen: boolean;
  actionUrl: string;
  onClose: () => void;
}

export const CTASimulationModal: React.FC<CTASimulationModalProps> = ({
  isOpen,
  actionUrl,
  onClose,
}) => {
  if (!isOpen) return null;

  const getActionTitle = (url: string) => {
    if (url.includes('add-item')) return 'Выложить новое объявление';
    if (url.includes('favorites')) return 'Переход в сохраненный поиск';
    if (url.includes('messenger')) return 'Переход в сообщения Авито';
    if (url.includes('promote')) return 'Получение продвижения на Авито';
    if (url.includes('search')) return 'Поиск новых объявлений';
    return 'Действие на Авито';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-[#e3e5e8] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center text-[#222222]">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="text-[#757575] hover:text-[#222222] p-1 rounded-full hover:bg-[#f2f3f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-14 h-14 bg-[#e5f7ed] text-[#00aa5b] border border-[#b2e7ca] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-black text-[#222222]">
          {getActionTitle(actionUrl)}
        </h3>

        <p className="text-sm text-[#555555] leading-relaxed">
          Имитация перехода по целевой воронке Авито: <span className="font-mono text-[#00aa5b] font-bold">{actionUrl}</span>.
          Пользователь превратил эмоцию от итогов года в реальное действие на платформе!
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#00aa5b] hover:bg-[#009650] text-white font-extrabold rounded-xl shadow-md transition-all"
        >
          Продолжить на Авито
        </button>
      </div>
    </div>
  );
};
