import React from 'react';
import { HelpCircle, X, ShieldCheck } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  title: string;
  explanation: string;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  title,
  explanation,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white border border-[#e3e5e8] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#222222]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
          <div className="flex items-center gap-2 text-[#00aa5b] font-extrabold text-xs uppercase tracking-wider">
            <HelpCircle className="w-5 h-5" />
            Прозрачность алгоритма
          </div>
          <button
            onClick={onClose}
            className="text-[#757575] hover:text-[#222222] p-1 rounded-full hover:bg-[#f2f3f5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-xl font-black text-[#222222]">{title}</h3>

        <div className="p-4 bg-[#f8f9fa] rounded-2xl border border-[#e3e5e8] text-sm text-[#444444] leading-relaxed font-medium">
          {explanation}
        </div>

        {/* Safety Note */}
        <div className="flex items-start gap-2 text-xs text-[#555555] bg-[#e5f7ed] p-3 rounded-xl border border-[#b2e7ca]">
          <ShieldCheck className="w-4 h-4 text-[#00aa5b] shrink-0 mt-0.5" />
          <span>
            При расчетах не раскрываются личные сообщения, точные адреса и финансовые данные сторонних пользователей.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#f2f3f5] hover:bg-[#e5e7eb] text-[#222222] font-bold rounded-xl border border-[#d0d4dc] transition-all"
        >
          Понятно
        </button>
      </div>
    </div>
  );
};
