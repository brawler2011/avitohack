import React, { useState, useEffect, useRef } from 'react';
import {
  AdminUserItem,
  PIIPreviewData,
  WSEventMessage,
  fetchAdminUsers,
  triggerGenerate,
  fetchPIIPreview,
  getWebSocketUrl,
} from '../api/client';
import { PIIPreviewModal } from './PIIPreviewModal';
import {
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Layers,
  User,
  Radio,
  ArrowRight,
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectUserForPreview: (userId: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectUserForPreview,
}) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingUserIds, setGeneratingUserIds] = useState<number[]>([]);
  const [queuedUserIds, setQueuedUserIds] = useState<number[]>([]);

  // PII Preview Modal state
  const [piiModalOpen, setPiiModalOpen] = useState(false);
  const [piiData, setPiiData] = useState<PIIPreviewData | null>(null);
  const [piiLoading, setPiiLoading] = useState(false);

  // WebSocket Live Feed state
  const [wsConnected, setWsConnected] = useState(false);
  const [liveLogs, setLiveLogs] = useState<WSEventMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки пользователей';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    console.log('[Admin] Connecting WebSocket:', wsUrl);

    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectWS = () => {
      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log('[Admin] WebSocket Connected');
          setWsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data: WSEventMessage = JSON.parse(event.data);
            console.log('[Admin] WS Event:', data);

            setLiveLogs((prev) => [data, ...prev.slice(0, 49)]);

            if (data.status === 'QUEUED') {
              setQueuedUserIds((prev) => Array.from(new Set([...prev, data.user_id])));
            } else if (data.status === 'PROCESSING') {
              setQueuedUserIds((prev) => prev.filter((id) => id !== data.user_id));
              setGeneratingUserIds((prev) => Array.from(new Set([...prev, data.user_id])));
            } else if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              setGeneratingUserIds((prev) => prev.filter((id) => id !== data.user_id));
              setQueuedUserIds((prev) => prev.filter((id) => id !== data.user_id));
              loadUsers();
            }
          } catch (e) {
            console.error('[Admin] WS message parse error:', e);
          }
        };

        socket.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        socket.onerror = (err) => {
          console.warn('[Admin] WS Error:', err);
          socket?.close();
        };

        wsRef.current = socket;
      } catch (e) {
        console.error('[Admin] WS setup error:', e);
        reconnectTimeout = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleGenerateSingle = async (userId: number, force = false) => {
    try {
      setQueuedUserIds((prev) => Array.from(new Set([...prev, userId])));
      await triggerGenerate([userId], force);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки задачи';
      alert(`Не удалось запустить генерацию: ${msg}`);
      setQueuedUserIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleGenerateUngenerated = async () => {
    const ungenerated = users.filter((u) => !u.has_recap).map((u) => u.profile.id);
    if (ungenerated.length === 0) {
      alert('У всех пользователей уже сгенерированы карточки!');
      return;
    }
    try {
      setQueuedUserIds((prev) => Array.from(new Set([...prev, ...ungenerated])));
      await triggerGenerate(ungenerated, false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка пакета генерации';
      alert(`Ошибка генерации: ${msg}`);
    }
  };

  const handleRegenerateAll = async () => {
    if (!confirm('Вы уверены, что хотите перегенерировать карточки для ВСЕХ пользователей?')) {
      return;
    }
    const allIds = users.map((u) => u.profile.id);
    try {
      setQueuedUserIds((prev) => Array.from(new Set([...prev, ...allIds])));
      await triggerGenerate(allIds, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка перегенерации';
      alert(`Ошибка массовой перегенерации: ${msg}`);
    }
  };

  const handleOpenPII = async (profileId: number) => {
    setPiiModalOpen(true);
    setPiiLoading(true);
    setPiiData(null);
    try {
      const data = await fetchPIIPreview(profileId);
      setPiiData(data);
    } catch (err) {
      console.error('PII preview fetch error:', err);
    } finally {
      setPiiLoading(false);
    }
  };

  const generatedCount = users.filter((u) => u.has_recap).length;
  const ungeneratedCount = users.length - generatedCount;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#222222] font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              <span>Панель Управления ИИ-Генерацией</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Админка Итогов Года на Авито
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Управление задачами генерации карточек и достижений через RabbitMQ очередь, просмотр маскированных PII промптов и мониторинг в реальном времени.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              wsConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span>{wsConnected ? 'WebSockets Live: Подключено' : 'WebSockets: Подключение...'}</span>
            </div>

            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* OpenRouter API Budget Warning Banner */}
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-4 text-amber-900 bg-amber-50">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-extrabold text-base text-amber-950 flex items-center gap-2">
              <span>⚠️ Важное предупреждение по балансу API</span>
              <span className="text-xs font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                OpenRouter API
              </span>
            </h3>
            <p className="text-sm text-amber-900 mt-1 leading-relaxed">
              У нас <strong>лимитированное количество денег и токенов</strong> на OpenRouter. Пожалуйста, <strong>не спамьте частыми генерациями</strong> без необходимости. Перед отправкой больших пакетов проверяйте готовые карточки.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Всего тестовых профилей</span>
              <div className="text-3xl font-black text-gray-900 mt-1">{users.length}</div>
            </div>
            <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
              <User className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Сгенерировано карточек</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{generatedCount}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Не сгенерировано</span>
              <div className="text-3xl font-black text-amber-600 mt-1">{ungeneratedCount}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-indigo-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">В очереди RabbitMQ</span>
              <div className="text-3xl font-black text-indigo-600 mt-1">
                {queuedUserIds.length + generatingUserIds.length}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Live Task Queue Feed & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main User List Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            {/* Action Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00a0ff]" />
                <span>Список тестовых пользователей</span>
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleGenerateUngenerated}
                  disabled={ungeneratedCount === 0}
                  className="flex items-center gap-2 bg-[#00a0ff] hover:bg-[#0088d6] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Сгенерировать не сгенерированные ({ungeneratedCount})</span>
                </button>

                <button
                  onClick={handleRegenerateAll}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Перегенерировать все</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="py-16 text-center text-gray-500 font-medium flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[#00a0ff] border-t-transparent rounded-full animate-spin"></div>
                  <span>Загрузка профилей пользователей...</span>
                </div>
              ) : error ? (
                <div className="py-12 text-center text-red-500 font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-100/70 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-3.5 px-4">Пользователь</th>
                      <th className="py-3.5 px-4">Статус карточки</th>
                      <th className="py-3.5 px-4">Обновлено</th>
                      <th className="py-3.5 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((item) => {
                      const isGenerating = generatingUserIds.includes(item.profile.id);
                      const isQueued = queuedUserIds.includes(item.profile.id);

                      return (
                        <tr key={item.profile.id} className="hover:bg-blue-50/30 transition-colors group">
                          {/* Profile */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.profile.avatar_url}
                                alt={item.profile.full_name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-gray-900 group-hover:text-[#00a0ff] transition-colors">
                                  {item.profile.full_name}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                  <span>@{item.profile.username}</span>
                                  <span>•</span>
                                  <span className="capitalize px-1.5 py-0.2 bg-gray-100 rounded text-[11px]">
                                    {item.profile.user_type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isGenerating ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                                <span>Обработка ИИ...</span>
                              </span>
                            ) : isQueued ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>В очереди RabbitMQ</span>
                              </span>
                            ) : item.has_recap ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Сгенерировано</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                <span>Не сгенерировано</span>
                              </span>
                            )}
                          </td>

                          {/* Updated At */}
                          <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                            {item.recap_updated_at ? (
                              new Date(item.recap_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* PII Preview Button */}
                              <button
                                onClick={() => handleOpenPII(item.profile.id)}
                                title="Превью маскирования личных данных (PII)"
                                className="p-2 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-xl transition-all border border-slate-200 cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Preview Stories View */}
                              <button
                                onClick={() => onSelectUserForPreview(item.profile.id)}
                                title="Просмотреть карточки пользователя в UI"
                                className="p-2 text-slate-600 hover:text-[#00a0ff] bg-slate-100 hover:bg-blue-50 rounded-xl transition-all border border-slate-200 cursor-pointer"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>

                              {/* Generate or Regenerate Button */}
                              {item.has_recap ? (
                                <button
                                  onClick={() => handleGenerateSingle(item.profile.id, true)}
                                  disabled={isGenerating || isQueued}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                                  <span>Перегенерировать</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleGenerateSingle(item.profile.id, false)}
                                  disabled={isGenerating || isQueued}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a0ff] hover:bg-[#0088d6] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Сгенерировать</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* WebSocket Live Activity Widget (1 col) */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-md p-5 flex flex-col h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${wsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
                <h3 className="font-extrabold text-sm text-white">Live Лог Очереди (WebSockets)</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                RabbitMQ Workers
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
              {liveLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-sans text-xs">
                  Ожидание событий генерации... Нажмите «Сгенерировать», чтобы отследить обработку в реальном времени.
                </div>
              ) : (
                liveLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-850/80 rounded-xl border border-slate-800 flex flex-col gap-1 transition-all"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                        log.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        log.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
                        log.status === 'QUEUED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="text-slate-200 font-sans text-xs flex items-center justify-between mt-0.5">
                      <span>Пользователь #{log.user_id}</span>
                      <span className="text-slate-400 text-[11px]">{log.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PII Preview Modal */}
      <PIIPreviewModal
        isOpen={piiModalOpen}
        onClose={() => setPiiModalOpen(false)}
        previewData={piiData}
        loading={piiLoading}
      />
    </div>
  );
};
