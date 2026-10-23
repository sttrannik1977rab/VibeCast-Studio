/**
 * Главная страница приложения.
 * 
 * Отображает список треков с пагинацией (десктоп) или бесконечной
 * подгрузкой (мобилка). Поддерживает поиск по названию и исполнителю.
 */

import { el, svg } from "redom";
import type { Page } from "@/router/Router";
import { tracksAPI } from "@/api/tracks";
import { TrackList } from "@/components/TrackList";
import { Layout } from "@/components/Layout";
import { Track } from "@/api/types";
import { Pagination } from "@/components/Pagination";

export class MainPage implements Page {
    public el: HTMLElement;

    private listContainer: HTMLElement | null = null;
    private paginationContainer: HTMLElement | null = null;

    private allTracks: Track[] = [];
    private favoriteIds: Set<number> = new Set();

    private currentPage: number = 1;
    private itemsPerPage: number = 10;
    private currentQuery: string = '';

    private sentinel: HTMLElement | null = null;
    private observer: IntersectionObserver | null = null;

    constructor() {
        this.el = new Layout(this.createTracksSection(), (query) => {
            this.handleSearch(query);
        }).el;
    }

    /**
     * Обработчик поиска.
     * 
     * Если запрос пустой — возвращает пагинацию.
     * Иначе — фильтрует треки и отображает результат без пагинации.
     */
    private handleSearch(query: string): void {
        this.currentQuery = query;

        if (!query) {
            this.renderPage(1);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = this.allTracks.filter(track =>
            track.title.toLowerCase().includes(lowerQuery) ||
            track.artist.toLowerCase().includes(lowerQuery)
        );

        if (this.listContainer) {
            const trackList = new TrackList(filtered, this.favoriteIds);
            this.listContainer.replaceWith(trackList.el);
            this.listContainer = trackList.el;
        }

        if (this.paginationContainer) {
            this.paginationContainer.replaceChildren();
        }
    }

    private createTracksSection(): HTMLElement {
        this.listContainer = el('ul.tracks-section__list', 'Загрузка треков...');
        this.paginationContainer = el('div.pagination-wrap');

        return el('section.tracks-section', [
            el('h2.tracks-section__title', 'Аудиофайлы и треки'),
            el('.tracks-section__header', [
                el('.tracks-section__cell.tracks-section__cell--number', '№'),
                el('.tracks-section__cell.tracks-section__cell--info', 'Название'),
                el('.tracks-section__cell.tracks-section__cell--album', 'Альбом'),
                el('.tracks-section__cell.tracks-section__cell--date', [
                    svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                        svg('use', { 'href': '#icon-date' }),
                    ]),
                ]),
                el('div.tracks-section__cell.tracks-section__cell--favorite', ''),
                el('.tracks-section__cell.tracks-section__cell--duration', [
                    svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                        svg('use', { 'href': '#icon-clock' }),
                    ]),
                ]),
                el('div.tracks-section__cell.tracks-section__cell--menu', ''),
            ]),
            el('div.tracks-section__scroll', [
                this.listContainer,
                this.paginationContainer,
            ]),
        ]);
    }

    private renderPage(page: number): void {
        if (!this.listContainer || !this.paginationContainer) return;
        this.currentPage = page;

        if (this.currentQuery) return;

        if (window.innerWidth <= 550) {
            this.paginationContainer.replaceChildren();

            const pageTracks = this.allTracks.slice(0, this.itemsPerPage);
            const trackList = new TrackList(pageTracks, this.favoriteIds);
            this.listContainer.replaceWith(trackList.el);
            this.listContainer = trackList.el;

            this.setupInfiniteScroll();
            return;
        }

        let pageTracks: Track[];
        if (page === 0) {
            pageTracks = this.allTracks;
        } else {
            const start = (page - 1) * this.itemsPerPage;
            const end = start + this.itemsPerPage;
            pageTracks = this.allTracks.slice(start, end);
        }

        const trackList = new TrackList(pageTracks, this.favoriteIds);
        this.listContainer.replaceWith(trackList.el);
        this.listContainer = trackList.el;
        this.renderPagination();
    }

    private renderPagination(): void {
        if (!this.paginationContainer) return;

        const pagination = new Pagination({
            totalItems: this.allTracks.length,
            itemsPerPage: this.itemsPerPage,
            currentPage: this.currentPage,
            onPageChange: (page) => this.renderPage(page),
        });

        this.paginationContainer.replaceChildren(pagination.el);
    }

    /**
     * Настраивает бесконечную подгрузку для мобильных устройств
     * с помощью IntersectionObserver.
     */
    private setupInfiniteScroll(): void {
        if (window.innerWidth > 550) return;
        if (this.currentPage * this.itemsPerPage >= this.allTracks.length) return;

        this.sentinel = el('div.infinite-scroll-sentinel');
        this.paginationContainer?.after(this.sentinel);

        this.observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                this.loadNextPage();
            }
        });

        this.observer.observe(this.sentinel);
    }

    private loadNextPage(): void {
        if (!this.listContainer) return;

        this.currentPage++;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const newTracks = this.allTracks.slice(start, end);

        if (newTracks.length > 0) {
            const trackList = new TrackList(newTracks, this.favoriteIds);
            this.listContainer.appendChild(trackList.el);
        }

        if (this.currentPage * this.itemsPerPage >= this.allTracks.length) {
            this.observer?.disconnect();
            this.sentinel?.remove();
            this.sentinel = null;
        }
    }

    async onEnter(): Promise<void> {
        if (!this.listContainer) return;

        try {
            const [tracks, favorites] = await Promise.all([
                tracksAPI.getAll(),
                tracksAPI.getFavorites().catch(() => [] as Track[]),
            ]);

            this.allTracks = tracks;
            this.favoriteIds = new Set(favorites.map(f => f.id));
            this.currentPage = 1;

            this.renderPage(this.currentPage);
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Не удалось загрузить треки';
            this.listContainer.textContent = `Ошибка: ${message}`;
        }
    }

    onLeave(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}