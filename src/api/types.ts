/**
 * Типы данных и константы для работы с API.
 * 
 * Содержит описание структуры трека, ответов сервера
 * и глобальные настройки (URL, ключ для токена).
 */

/** Базовый URL для всех запросов к API. */
export const API_BASE_URL = 'http://localhost:8000/api';

/** Ключ, под которым JWT-токен хранится в localStorage. */
export const TOKEN_STORAGE_KEY = 'vibecast_auth_token';

/**
 * Описание структуры музыкального трека.
 */
export interface Track {
    /** Уникальный идентификатор трека. */
    id: number;
    /** Название трека. */
    title: string;
    /** Имя исполнителя. */
    artist: string;
    /** Название альбома (опционально). */
    album?: string;
    /** Дата добавления в виде готовой строки (например, "6 дней назад"). */
    date?: string;
    /** Длительность трека в секундах. */
    duration: number;
    /** Размер файла в мегабайтах (опционально). */
    size_mb?: number;
    /** Аудиоданные в формате base64 (опционально). */
    encoded_audio?: string;
}

/**
 * Ответ сервера при авторизации или регистрации.
 */
export interface AuthResponse {
    message: string;
    token?: string;
    user?: {
        username: string;
        email: string;
    };
}

/**
 * Стандартный ответ сервера с сообщением об ошибке.
 */
export interface ErrorResponse {
    message: string;
}

/**
 * Ответ сервера при работе с избранным.
 */
export interface FavoriteResponse {
    message: string;
}