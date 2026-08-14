/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Achievement } from '../models/Achievement';
import type { AdminUserItem } from '../models/AdminUserItem';
import type { GenerateRecapRequest } from '../models/GenerateRecapRequest';
import type { GenerateRecapResponse } from '../models/GenerateRecapResponse';
import type { PIIPreviewResponse } from '../models/PIIPreviewResponse';
import type { RecapResponse } from '../models/RecapResponse';
import type { ShareCard } from '../models/ShareCard';
import type { UserProfile } from '../models/UserProfile';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get all available test profiles
     * @returns UserProfile List of test user profiles
     * @throws ApiError
     */
    public getProfiles(): CancelablePromise<Array<UserProfile>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/profiles',
        });
    }
    /**
     * Get personalized year recap for a user profile
     * @returns RecapResponse Personalized recap payload including story cards, AI summary, metrics, and achievements
     * @throws ApiError
     */
    public getRecap({
        profileId,
    }: {
        profileId: number,
    }): CancelablePromise<RecapResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/recap/{profileId}',
            path: {
                'profileId': profileId,
            },
            errors: {
                404: `Profile not found`,
            },
        });
    }
    /**
     * Get user achievements with progress and CTA links
     * @returns Achievement List of achievements for Steam-like dashboard
     * @throws ApiError
     */
    public getAchievements({
        profileId,
    }: {
        profileId: number,
    }): CancelablePromise<Array<Achievement>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/achievements/{profileId}',
            path: {
                'profileId': profileId,
            },
        });
    }
    /**
     * Get public share card data (privacy compliant)
     * @returns ShareCard Public share card payload
     * @throws ApiError
     */
    public getShareCard({
        shareToken,
    }: {
        shareToken: string,
    }): CancelablePromise<ShareCard> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/share/{shareToken}',
            path: {
                'shareToken': shareToken,
            },
        });
    }
    /**
     * Get list of users with recap status for admin dashboard
     * @returns AdminUserItem List of user profiles with generation status
     * @throws ApiError
     */
    public getAdminUsers(): CancelablePromise<Array<AdminUserItem>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/users',
        });
    }
    /**
     * Enqueue batch AI generation tasks via RabbitMQ
     * @returns GenerateRecapResponse Tasks queued successfully
     * @throws ApiError
     */
    public triggerGenerate({
        requestBody,
    }: {
        requestBody: GenerateRecapRequest,
    }): CancelablePromise<GenerateRecapResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/admin/generate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get PII-masked prompt preview and profile data for LLM inspection
     * @returns PIIPreviewResponse PII preview payload
     * @throws ApiError
     */
    public getPiiPreview({
        profileId,
    }: {
        profileId: number,
    }): CancelablePromise<PIIPreviewResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/v1/admin/preview/{profileId}',
            path: {
                'profileId': profileId,
            },
        });
    }
    /**
     * Flush all cached items in Redis
     * @returns any Cache flushed successfully
     * @throws ApiError
     */
    public flushCache(): CancelablePromise<{
        status?: string;
        message?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/v1/admin/cache/flush',
        });
    }
}
