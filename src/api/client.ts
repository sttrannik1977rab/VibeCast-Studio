/**
 * HTTP-клиент для работы с API.
 * 
 * Обёртка над fetch, которая:
 * - Автоматически добавляет токен в заголовки.
 * - Обрабатывает ошибки (HTTP-статусы, сетевые проблемы).
 * - Типизирует ответы через дженерики.
 * 
 * Используется как Singleton: единый экземпляр для всего приложения.
 */

import { API_BASE_URL, TOKEN_STORAGE_KEY } from './types';
import type { ErrorResponse } from './types';

class ApiClient {
    private token: string | null;

    constructor() {
        // Восстанавливаем токен при инициализации (перезагрузка страницы)
        this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }

    /**
     * Сохраняет токен в память и localStorage.
     * @param token - JWT токен (или null для удаления)
     */
    setToken(token: string | null): void {
        this.token = token;
        
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
    }

    /**
     * Возвращает текущий токен.
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Проверяет, авторизован ли пользователь.
     */
    isAuthenticated(): boolean {
        return this.token !== null;
    }

    /**
     * Базовый метод для HTTP-запросов.
     * 
     * @param endpoint - Путь эндпоинта (например, '/tracks')
     * @param options - Опции fetch
     * @returns Promise с распарсенным JSON, приведённым к типу T
     * @throws Error с сообщением от сервера или ошибкой сети
     */
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                const errorData = data as ErrorResponse;
                throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
            }

            return data as T;
        } catch (error) {
            // Если это ошибка от сервера (response.ok) — прокидываем как есть
            if (error instanceof Error) {
                throw error;
            }
            // Иначе — сетевая ошибка или ошибка парсинга JSON
            throw new Error('Ошибка сети. Проверьте подключение.', { cause: error });
        }
    }

    /**
     * GET-запрос.
     */
    get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    /**
     * POST-запрос.
     */
    post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    /**
     * DELETE-запрос.
     */
    delete<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'DELETE',
            body: data ? JSON.stringify(data) : undefined,
        });
    }
}

/** Единственный экземпляр клиента (Singleton). */
export const apiClient = new ApiClient();
