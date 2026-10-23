/**
 * Страница избранного.
 * 
 * Загружает список избранных треков с сервера и отображает их.
 * При удалении трека из избранного — убирает его из списка.
 * Если избранное пустое — показывает заглушку.
 */

import { el } from 'redom';
import type { Page } from '@/router/Router';
import { TrackList } from '@/components/TrackList';
import { tracksAPI } from '@/api/tracks';
import { Layout } from '@/components/Layout';

export class FavoritesPage implements Page {
    public el: HTMLElement;
    private tracksContainer: HTMLElement | null = null;

    constructor() {
        this.el = new Layout(this.createFavoritesSection()).el;
    }

    private createFavoritesSection(): HTMLElement {
        this.tracksContainer = el('ul.tracks-section__list', 'Загрузка избранного');

        return el('section.tracks-section', [
            el('h2.tracks-section__title', 'Избранное'),
            this.tracksContainer,
        ]);
    }

    /**
     * Обработчик события 'favorite:toggle'.
     * При удалении — удаляет карточку из DOM. При добавлении — перезагружает список.
     */
    private handleFavoriteToggle = (e: Event): void => {
        const { trackId, isFavorite } = (e as CustomEvent).detail;

        if (!isFavorite) {
            const card = this.tracksContainer?.querySelector(`[data-track-id="${trackId}"]`);
            if (card) {
                card.closest('li')?.remove();
            }

            if (this.tracksContainer) {
                const remainingItems = this.tracksContainer.querySelectorAll('li');
                if (remainingItems.length === 0) {
                    this.tracksContainer.textContent = 'В избранном пока нет треков';
                }
            }
        } else {
            this.reloadFavorites();
        }
    };

    private async reloadFavorites(): Promise<void> {
        if (!this.tracksContainer) return;

        try {
            const favorites = await tracksAPI.getFavorites();

            if (favorites.length === 0) {
                this.tracksContainer.textContent = 'В избранном пока нет треков';
                return;
            }

            const favoriteIds = new Set(favorites.map(f => f.id));
            const trackList = new TrackList(favorites, favoriteIds);

            this.tracksContainer.replaceWith(trackList.el);
            this.tracksContainer = trackList.el;
        } catch (error) {
            console.error('Ошибка перезагрузки избранного:', error);
        }
    }

    async onEnter(): Promise<void> {
        if (!this.tracksContainer) return;

        document.addEventListener('favorite:toggle', this.handleFavoriteToggle);

        try {
            const favorites = await tracksAPI.getFavorites();

            if (favorites.length === 0) {
                this.tracksContainer.textContent = 'В избранном пока нет треков';
                return;
            }

            const favoriteIds = new Set(favorites.map(f => f.id));
            const trackList = new TrackList(favorites, favoriteIds);

            const parent = this.tracksContainer.parentElement;
            if (!parent) return;

            parent.replaceChild(trackList.el, this.tracksContainer);
            this.tracksContainer = trackList.el;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ошибка загрузки';
            this.tracksContainer.textContent = `Ошибка: ${message}`;
        }
    }

    onLeave(): void {
        document.removeEventListener('favorite:toggle', this.handleFavoriteToggle);
    }
}