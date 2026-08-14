import React from 'react';
import { X, Eye, Lock, FileCode, CheckCircle2 } from 'lucide-react';
import { PIIPreviewData } from '../api/client';

interface PIIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PIIPreviewData | null;
  loading: boolean;
}

export const PIIPreviewModal: React.FC<PIIPreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500 font-medium flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Загрузка данных анонимизации...</span>
            </div>
          ) : previewData ? (
            <>
              {/* Compliance Status Badge */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block text-sm mb-0.5 text-emerald-900">
                    Защита персональных данных активирована
                  </span>
                  Персональная информация (ФИО и Username) автоматически скрывается перед вызовом API ИИ. Искусственный интеллект получает только анонимный идентификатор и обезличенную метрику активности.
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Data */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Исходный Профиль (БД)</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400 block">ID пользователя</span>
                      <span className="font-mono font-semibold text-gray-800">#{previewData.user_id}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">ФИО (Конфиденциально)</span>
                      <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block">
                        {previewData.original_full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Username</span>
                      <span className="font-mono text-gray-700 bg-gray-200/60 px-2 py-0.5 rounded inline-block">
                        @{previewData.original_username}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anonymized Data */}
                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Маскированный PII (Для ИИ)</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-emerald-600/70 block">Анонимное имя</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        {previewData.masked_full_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-emerald-600/70 block">Анонимный никнейм</span>
                      <span className="font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded inline-block">
                        {previewData.masked_username}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exact Prompt Payload Box */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  <span>Итоговый Payload промпта для OpenRouter:</span>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                  {previewData.anonymized_prompt_payload}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-red-500 font-medium">
              Не удалось загрузить данные превью PII.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Закрыть превью
          </button>
        </div>
      </div>
    </div>
  );
};
