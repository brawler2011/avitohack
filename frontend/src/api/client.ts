import { Api } from './Api';
export * from './models/UserProfile';
export * from './models/RecapResponse';
export * from './models/RecapCard';
export * from './models/Achievement';
export * from './models/ShareCard';
export * from './models/UserMetrics';
export * from './Api';
export * from './core/ApiError';

export const api = new Api();

export const fetchProfiles = () => api.default.getProfiles();
export const fetchRecap = (profileId: number) => api.default.getRecap({ profileId });
export const fetchAchievements = (profileId: number) => api.default.getAchievements({ profileId });
export const fetchShareCard = (shareToken: string) => api.default.getShareCard({ shareToken });
