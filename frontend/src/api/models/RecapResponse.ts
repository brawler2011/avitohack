/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Achievement } from './Achievement';
import type { RecapCard } from './RecapCard';
import type { UserMetrics } from './UserMetrics';
import type { UserProfile } from './UserProfile';
export type RecapResponse = {
    profile: UserProfile;
    metrics: UserMetrics;
    cards: Array<RecapCard>;
    achievements: Array<Achievement>;
    share_token: string;
};

