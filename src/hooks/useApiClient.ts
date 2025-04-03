'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';
import { toast } from "sonner";

interface ApiClientOptions extends RequestInit {
    // No custom options needed for now, but could add things like specific error handling flags
}

interface ApiClientResponse<T = any> {
    data: T | null;
    error: string | null;
    status: number;
}

export function useApiClient() {
    const { token, logout } = useAuth();

    const request = useCallback(async <T = any>(
        endpoint: string,
        options: ApiClientOptions = {}
    ): Promise<ApiClientResponse<T>> => {

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }), // Add auth token if available
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(`/api${endpoint}`, config);
            const responseData = await response.json();

            if (!response.ok) {
                // Handle common auth errors
                if (response.status === 401) {
                    toast.error('Authentication error. Please log in again.');
                    logout(); // Log out the user if token is invalid/expired
                    return { data: null, error: responseData.message || 'Unauthorized', status: response.status };
                }
                // Other errors
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            return { data: responseData, error: null, status: response.status };

        } catch (error: any) {
            console.error(`API Client Error (${options.method || 'GET'} ${endpoint}):`, error);
            return { data: null, error: error.message || 'An unexpected error occurred', status: 500 }; // Default to 500 for client-side errors
        }
    }, [token, logout]);

    // Define helper methods for common HTTP verbs
    const get = useCallback(<T = any>(endpoint: string, options: Omit<ApiClientOptions, 'method'> = {}) => {
        return request<T>(endpoint, { ...options, method: 'GET' });
    }, [request]);

    const post = useCallback(<T = any>(endpoint: string, body: any, options: Omit<ApiClientOptions, 'method' | 'body'> = {}) => {
        return request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }, [request]);

    const put = useCallback(<T = any>(endpoint: string, body: any, options: Omit<ApiClientOptions, 'method' | 'body'> = {}) => {
        return request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }, [request]);

    const del = useCallback(<T = any>(endpoint: string, options: Omit<ApiClientOptions, 'method'> = {}) => {
        return request<T>(endpoint, { ...options, method: 'DELETE' });
    }, [request]);

    return { get, post, put, del, request };
} 