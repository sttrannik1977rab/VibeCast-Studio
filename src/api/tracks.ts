/**
 * API для работы с треками.
 * 
 * Содержит методы для получения списка всех треков,
 * а также для управления избранным (получение, добавление, удаление).
 * Все методы используют общий http-клиент (apiClient).
 */

import { apiClient } from './client';
import type { Track, FavoriteResponse } from './types';

export const tracksAPI = {
    /**
     * Получить список всех доступных треков.
     * 
     * @returns Массив объектов треков
     */
    getAll(): Promise<Track[]> {
        return apiClient.get<Track[]>('/tracks');
    },

    /**
     * Получить список избранных треков текущего пользователя.
     * 
     * Требует авторизации (токен автоматически подставляется клиентом).
     * 
     * @returns Массив объектов треков, добавленных в избранное
     */
    getFavorites(): Promise<Track[]> {
        return apiClient.get<Track[]>('/favorites');
    },

    /**
     * Добавить трек в избранное.
     * 
     * @param trackId - ID трека
     * @returns Сообщение об успехе
     */
    addToFavorites(trackId: number): Promise<FavoriteResponse> {
        return apiClient.post<FavoriteResponse>('/favorites', { trackId });
    },

    /**
     * Удалить трек из избранного.
     * 
     * @param trackId - ID трека
     * @returns Сообщение об успехе
     */
    removeFromFavorites(trackId: number): Promise<FavoriteResponse> {
        return apiClient.delete<FavoriteResponse>('/favorites', { trackId });
    },
};