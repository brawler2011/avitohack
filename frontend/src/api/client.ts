import { Api } from './Api';
export * from './models/UserProfile';
export * from './models/RecapResponse';
export * from './models/RecapCard';
export * from './models/Achievement';
export * from './models/ShareCard';
export * from './models/UserMetrics';
export * from './Api';
export * from './core/ApiError';

export interface AdminUserItem {
  profile: {
    id: number;
    username: string;
    full_name: string;
    avatar_url: string;
    user_type: string;
    registered_at: string;
  };
  has_recap: boolean;
  generated_by_ai: boolean;
  recap_updated_at?: string;
}

export interface PIIPreviewData {
  user_id: number;
  original_full_name: string;
  original_username: string;
  masked_full_name: string;
  masked_username: string;
  anonymized_prompt_payload: string;
}

export interface WSEventMessage {
  type: string;
  user_id: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  timestamp: string;
}

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '/api/v1';
};

const getOpenApiBaseUrl = (): string => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api\/v1\/?$/, '');
};

export const api = new Api({
  BASE: getOpenApiBaseUrl(),
});

export const fetchProfiles = () => api.default.getProfiles();
export const fetchRecap = (profileId: number) => api.default.getRecap({ profileId });
export const fetchAchievements = (profileId: number) => api.default.getAchievements({ profileId });
export const fetchShareCard = (shareToken: string) => api.default.getShareCard({ shareToken });

export const fetchAdminUsers = async (): Promise<AdminUserItem[]> => {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/admin/users`);
  if (!res.ok) throw new Error(`Failed to fetch admin users: ${res.statusText}`);
  return res.json();
};

export const triggerGenerate = async (userIds: number[], forceRegenerate = false): Promise<{ queued_count: number; status: string }> => {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/admin/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids: userIds, force_regenerate: forceRegenerate }),
  });
  if (!res.ok) throw new Error(`Failed to trigger generate: ${res.statusText}`);
  return res.json();
};

export const fetchPIIPreview = async (profileId: number): Promise<PIIPreviewData> => {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/admin/preview/${profileId}`);
  if (!res.ok) throw new Error(`Failed to fetch PII preview: ${res.statusText}`);
  return res.json();
};

export const getWebSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const baseUrl = getApiBaseUrl();
  if (baseUrl.startsWith('http')) {
    const url = new URL(baseUrl);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = url.pathname.replace(/\/+$/, '');
    return `${wsProtocol}//${url.host}${path}/admin/ws`;
  }
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${protocol}//${host}${cleanBase}/admin/ws`;
};
