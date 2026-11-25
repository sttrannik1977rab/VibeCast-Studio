/**
 * Компонент списка треков.
 * 
 * Принимает массив треков и создаёт список карточек.
 * При клике на карточку отправляет событие 'track:play'.
 * При клике на сердечко — переключает избранное (оптимистичный UI).
 */

import { el, svg } from 'redom';
import type { Track } from '@/api/types';
import { tracksAPI } from '@/api/tracks';
import { formatTime } from '@/utils/formatTime';

export class TrackList {
    public el: HTMLElement;

    private tracks: Track[];
    private favoriteIds: Set<number>;

    constructor(tracks: Track[], favoriteIds: Set<number> = new Set()) {
        this.tracks = tracks;
        this.favoriteIds = favoriteIds;
        this.el = this.createList();
    }

    private createList(): HTMLElement {
        return el('ul.tracks-section__list',
            this.tracks.map(track => this.createTrackItem(track))
        );
    }

    private createTrackItem(track: Track): HTMLElement {
        return el('li.tracks-section__item',
            this.createTrackCard(track)
        );
    }

    /**
     * Создаёт обложку трека (цветной квадрат с первой буквой).
     * 
     * @param trackId - ID трека (используется для вычисления цвета)
     * @param title - Название трека (для первой буквы)
     */
    private createCover(trackId: number, title?: string): HTMLElement {
        const firstLetter = title
            ? title.charAt(0).toUpperCase()
            : '?';

        const cover = el('div.track-card__img', firstLetter) as HTMLElement;
        cover.style.setProperty('--track-id', String(trackId));

        return cover;
    }

    private createTrackCard(track: Track): HTMLElement {
        const favoriteBtn = el('button.track-card__favorite-btn', [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-heart' }),
            ]),
        ]) as HTMLButtonElement;

        if (this.favoriteIds.has(track.id)) {
            favoriteBtn.classList.add('is-active');
        }

        favoriteBtn.onclick = (e) => {
            e.stopPropagation(); // чтобы клик не запускал воспроизведение
            this.toggleFavorite(track, favoriteBtn);
        };

        const card = el('div.track-card', [
            el('div.track-card__cell.track-card__cell--number', track.id),
            el('div.track-card__cell.track-card__cell--info-wrap', [
                this.createCover(track.id, track.title),
                el('div.track-card__info', [
                    el('span.track-card__title', track.title),
                    el('span.track-card__artist', track.artist),
                    track.size_mb !== undefined
                        ? el('span.track-card__size', `${track.size_mb.toFixed(1)} MB`)
                        : null,
                ].filter(Boolean)),
            ]),
            el('span.track-card__cell.track-card__cell--album', track.album || '-'),
            el('span.track-card__cell.track-card__cell--date', track.date || '-'),
            el('div.track-card__cell.track-card__cell--favorite', [
                favoriteBtn,
            ]),
            el('span.track-card__cell.track-card__cell--duration', formatTime(track.duration)),
            el('div.track-card__cell.track-card__cell--menu', [
                el('button.track-card__menu-btn', [
                    svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                        svg('use', { href: '#icon-menu' }),
                    ]),
                ]),
            ]),
        ]);

        card.setAttribute('data-track-id', String(track.id));

        card.onclick = () => {
            document.dispatchEvent(new CustomEvent('track:play', {
                detail: {
                    track,
                    playlist: this.tracks,
                    isFavorite: this.favoriteIds.has(track.id),
                },
            }));
        };

        return card;
    }

    /**
     * Переключает избранное для трека.
     * 
     * Оптимистичный UI: сначала обновляем интерфейс, затем отправляем запрос.
     * При ошибке сервера — откатываем изменения и уведомляем AudioPlayer.
     */
    private async toggleFavorite(track: Track, button: HTMLElement): Promise<void> {
        const isCurrentlyFavorite = this.favoriteIds.has(track.id);

        if (isCurrentlyFavorite) {
            this.favoriteIds.delete(track.id);
            button.classList.remove('is-active');
        } else {
            this.favoriteIds.add(track.id);
            button.classList.add('is-active');
        }

        try {
            if (isCurrentlyFavorite) {
                await tracksAPI.removeFromFavorites(track.id);
            } else {
                await tracksAPI.addToFavorites(track.id);
            }

            document.dispatchEvent(new CustomEvent('favorite:toggle', {
                detail: { trackId: track.id, isFavorite: !isCurrentlyFavorite },
            }));
        } catch (error) {
            // Откат
            if (isCurrentlyFavorite) {
                this.favoriteIds.add(track.id);
                button.classList.add('is-active');
            } else {
                this.favoriteIds.delete(track.id);
                button.classList.remove('is-active');
            }

            console.error('Не удалось изменить избранное:', error);
        }
    }
}
