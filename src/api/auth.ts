/**
 * API для работы с авторизацией.
 * 
 * Предоставляет методы для регистрации, входа и выхода пользователя.
 * При успешном логине токен сохраняется в localStorage (через apiClient)
 * и автоматически добавляется в заголовки последующих запросов.
 */

import { apiClient } from './client';
import type { AuthResponse } from './types';

export const authAPI = {
    /**
     * Регистрация нового пользователя.
     * 
     * @param username - Имя пользователя (уникальное)
     * @param password - Пароль (хешируется на сервере)
     * @param email - Email пользователя
     * @returns Ответ сервера с сообщением и данными пользователя
     * @throws Error, если пользователь уже существует
     */
    register(username: string, password: string, email: string): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>('/register', {
            username,
            password,
            email,
        });
    },

    /**
     * Вход в систему.
     * 
     * При успехе возвращает JWT-токен, который автоматически
     * сохраняется в apiClient и localStorage.
     * 
     * @param username - Имя пользователя
     * @param password - Пароль
     * @returns Ответ сервера с сообщением и токеном
     * @throws Error, если данные неверные
     */
    login(username: string, password: string): Promise<AuthResponse> {
        return apiClient.post<AuthResponse>('/login', {
            username,
            password,
        });
    },

    /**
     * Выход из системы.
     * 
     * Удаляет токен на клиенте (из памяти и localStorage).
     * Запрос к серверу не отправляется.
     */
    logout(): void {
        apiClient.setToken(null);
    }
};