/**
 * Аудиоплеер (нижняя панель приложения).
 * 
 * Управляет воспроизведением через HTMLAudioElement, синхронизирует
 * состояние с UI (кнопки, слайдеры, иконки) и обрабатывает события
 * от других компонентов (запуск трека, изменение избранного).
 */

import { el, svg } from "redom";
import type { Track } from '@/api/types';
import { formatTime } from "@/utils/formatTime";
import { tracksAPI } from '@/api/tracks';

export class AudioPlayer {
    public el: HTMLElement;
    private audio: HTMLAudioElement;
    private currentTrack: Track | null = null;
    private isPlaying: boolean = false;

    private playButton!: HTMLButtonElement;
    private playIcon!: SVGUseElement;
    private prevButton!: HTMLButtonElement;
    private nextButton!: HTMLButtonElement;

    private progressSlider!: HTMLInputElement;
    private currentTimeEl!: HTMLElement;
    private durationEl!: HTMLElement;

    private volumeSlider!: HTMLInputElement;
    private volumeButton!: HTMLButtonElement;
    private volumeIcon!: SVGUseElement;
    private isMuted: boolean = false;

    private playlist: Track[] = [];

    private titleEl!: HTMLElement;
    private artistEl!: HTMLElement;
    private coverEl!: HTMLImageElement;
    private favoriteBtn!: HTMLButtonElement;
    private favoriteIcon!: SVGUseElement;
    private infoEl!: HTMLElement;
    private isFavorite: boolean = false;

    /**
     * Глобальный обработчик клавиатуры.
     * Сохранён как поле для возможности отписки.
     */
    private handleKeydown = (e: KeyboardEvent): void => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (!this.currentTrack) return;

        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seekBy(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seekBy(10);
                break;
        }
    };

    constructor() {
        this.audio = new Audio();
        this.el = this.createPlayer();
        this.attachEventListeners();
        this.progressSlider.classList.add('is-disabled');
    }

    private attachEventListeners(): void {
        this.playButton.onclick = () => this.togglePlay();
        this.audio.addEventListener('play', () => this.updatePlayIcon(true));
        this.audio.addEventListener('pause', () => this.updatePlayIcon(false));
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());

        this.progressSlider.addEventListener('input', () => this.seek());
        this.progressSlider.addEventListener('change', () => this.seek());

        this.volumeButton.onclick = () => this.toggleMute();
        this.volumeSlider.addEventListener('input', () => this.setVolume());
        this.audio.addEventListener('volumechange', () => this.syncVolumeUI());

        this.favoriteBtn.onclick = () => this.toggleFavorite();

        document.addEventListener('track:play', (e) => {
            const detail = (e as CustomEvent).detail as {
                track: Track;
                playlist: Track[];
                isFavorite: boolean;
            };
            this.loadTrack(detail.track, detail.playlist, detail.isFavorite);
        });

        this.audio.addEventListener('error', () => {
            const err = this.audio.error;
            console.error('Ошибка audio:', err?.code, err?.message);
        });

        this.prevButton.onclick = () => this.prevTrack();
        this.nextButton.onclick = () => this.nextTrack();
        document.addEventListener('keydown', this.handleKeydown);

        document.addEventListener('favorite:toggle', (e) => {
            const { trackId, isFavorite } = (e as CustomEvent).detail;
            if (this.currentTrack && this.currentTrack.id === trackId) {
                this.isFavorite = isFavorite;
                this.updateFavoriteIcon();
            }
        });
    }

    /**
     * Загружает трек и запускает воспроизведение.
     * 
     * @param track - Трек для воспроизведения
     * @param playlist - Список для навигации (next/prev)
     * @param isFavorite - Находится ли трек в избранном
     */
    public loadTrack(track: Track, playlist: Track[] = [], isFavorite: boolean = false): void {
        this.currentTrack = track;
        this.playlist = playlist;
        this.isFavorite = isFavorite;

        this.updateTrackUI(track);
        this.updateFavoriteIcon();
        this.progressSlider.classList.remove('is-disabled');
        this.loadAudio(track);

        if (this.infoEl) {
            this.infoEl.classList.remove('audio-player__info--empty');
        }

        this.audio.play().catch((error) => {
            // AbortError возникает при быстром переключении треков — это норма
            if (error.name !== 'AbortError') {
                console.error('Не удалось воспроизвести трек:', error);
            }
        });
    }

    private updateTrackUI(track: Track): void {
        this.titleEl.textContent = track.title;
        this.artistEl.textContent = track.artist;

        const firstLetter = track.title.charAt(0).toUpperCase();
        const color = `hsl(${track.id * 37}, 70%, 60%)`;

        const svgCover = `
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
                <rect width="60" height="60" fill="${color}"/>
                <text x="30" y="30" text-anchor="middle" dominant-baseline="central" 
                    fill="white" font-size="24" font-family="Actor, sans-serif">${firstLetter}</text>
            </svg>
        `;

        this.coverEl.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgCover)}`;
    }

    /**
     * Загружает аудио. Если данных с сервера нет или они битые — использует заглушку.
     */
    private loadAudio(track: Track): void {
        if (!track.encoded_audio) {
            this.setFallbackAudio();
            return;
        }

        let base64Data = track.encoded_audio;

        if (base64Data.startsWith('data:')) {
            this.audio.src = base64Data;
            return;
        }

        base64Data = base64Data.replace(/\s/g, '');

        let mimeType = 'audio/wav';
        if (base64Data.startsWith('SUQz')) mimeType = 'audio/mpeg';
        else if (base64Data.startsWith('T2dnUw')) mimeType = 'audio/ogg';
        else if (base64Data.startsWith('UklGR')) mimeType = 'audio/wav';

        try {
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Защита от фиктивных данных с сервера (меньше 1 КБ — точно не аудио)
            if (bytes.length < 1000) {
                console.warn(`Трек "${track.title}": encoded_audio слишком мал (${bytes.length} байт). Используем заглушку.`);
                this.setFallbackAudio();
                return;
            }

            const blob = new Blob([bytes], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Освобождаем предыдущий blob URL, чтобы не текла память
            if (this.audio.src && this.audio.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.audio.src);
            }

            this.audio.src = url;
        } catch (e) {
            console.error('Не удалось декодировать base64:', e);
            this.setFallbackAudio();
        }
    }

    private setFallbackAudio(): void {
        this.audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }

    private togglePlay(): void {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch((error) => {
                if (error.name !== 'AbortError') {
                    console.error('Не удалось воспроизвести:', error);
                }
            });
        }
    }

    /**
     * Переключает на следующий трек.
     * Если текущий — последний, возвращается к первому (зацикливание).
     */
    private nextTrack(): void {
        if (!this.currentTrack || !this.playlist.length) return;
        const index = this.playlist.findIndex(t => t.id === this.currentTrack?.id);
        if (index === -1) return;
        const nextIndex = (index + 1) % this.playlist.length;
        this.loadTrack(this.playlist[nextIndex], this.playlist);
    }

    /**
     * Переключает на предыдущий трек.
     * Если текущий — первый, переходит к последнему.
     */
    private prevTrack(): void {
        if (!this.currentTrack || !this.playlist.length) return;
        const index = this.playlist.findIndex(t => t.id === this.currentTrack?.id);
        if (index === -1) return;
        const prevIndex = (index - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.playlist[prevIndex], this.playlist);
    }

    private updatePlayIcon(isPlaying: boolean): void {
        this.isPlaying = isPlaying;
        const iconId = isPlaying ? '#icon-pause' : '#icon-play';
        this.playIcon.setAttribute('href', iconId);
        this.playButton.classList.toggle('is-pause', isPlaying);
    }

    private updateProgress(): void {
        const current = this.audio.currentTime;
        const duration = this.audio.duration;
        if (duration > 0) {
            const percent = (current / duration) * 100;
            this.progressSlider.value = String(percent);
            this.progressSlider.style.setProperty('--progress', `${percent}%`);
        }
        this.currentTimeEl.textContent = formatTime(current);
    }

    private updateDuration(): void {
        const duration = this.audio.duration;
        if (isFinite(duration)) {
            this.durationEl.textContent = formatTime(duration);
        }
    }

    private seek(): void {
        const duration = this.audio.duration;
        if (!isFinite(duration)) return;

        const percent = Number(this.progressSlider.value);
        this.audio.currentTime = (percent / 100) * duration;
        this.progressSlider.style.setProperty('--progress', `${percent}%`);
    }

    private setVolume(): void {
        const value = Number(this.volumeSlider.value);
        this.audio.volume = value / 100;
        this.volumeSlider.style.setProperty('--progress', `${value}%`);

        if (this.isMuted && value > 0) {
            this.toggleMute();
        }
    }

    private toggleMute(): void {
        this.isMuted = !this.isMuted;
        this.audio.muted = this.isMuted;
        this.updateMuteIcon();
    }

    private updateMuteIcon(): void {
        const iconId = this.isMuted ? '#icon-volume-mute' : '#icon-volume';
        this.volumeIcon.setAttribute('href', iconId);
        this.volumeButton.classList.toggle('is-muted', this.isMuted);

        const volumeSection = this.volumeButton.parentElement;
        if (volumeSection) {
            volumeSection.classList.toggle('is-muted', this.isMuted);
        }
    }

    private syncVolumeUI(): void {
        if (this.audio.muted !== this.isMuted) {
            this.isMuted = this.audio.muted;
            this.updateMuteIcon();
        }
    }

    /**
     * Перематывает трек на указанное количество секунд.
     * 
     * @param seconds - Сдвиг в секундах (положительный — вперёд, отрицательный — назад)
     */
    private seekBy(seconds: number): void {
        const duration = this.audio.duration;
        if (!isFinite(duration)) return;

        const newTime = Math.max(0, Math.min(duration, this.audio.currentTime + seconds));
        this.audio.currentTime = newTime;

        const percent = (newTime / duration) * 100;
        this.progressSlider.value = String(percent);
        this.progressSlider.style.setProperty('--progress', `${percent}%`);
        this.currentTimeEl.textContent = formatTime(newTime);
    }

    private createTrackSection(): HTMLElement {
        this.coverEl = el('img.audio-player__cover', {
            src: this.createEmptyCoverSvg(),
            alt: 'Обложка трека',
        }) as HTMLImageElement;

        this.titleEl = el('span.audio-player__title', '');
        this.artistEl = el('span.audio-player__artist', '');

        this.favoriteIcon = svg('use', { href: '#icon-heart' }) as SVGUseElement;
        this.favoriteBtn = el('button.audio-player__favorite-btn', [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [this.favoriteIcon]),
        ]) as HTMLButtonElement;

        const infoEl = el('div.audio-player__info.audio-player__info--empty', [
            el('div.audio-player__wrap-title', [
                this.titleEl,
                this.favoriteBtn,
            ]),
            this.artistEl,
        ]);
        this.infoEl = infoEl;

        return el('div.audio-player__track', [
            this.coverEl,
            infoEl,
        ]);
    }

    private createControlsSection(): HTMLElement {
        this.prevButton = el('button.audio-player__btn.audio-player__btn--prev', [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-prev' }),
            ]),
        ]) as HTMLButtonElement;

        this.playButton = el('button.audio-player__btn.audio-player__btn--play', [
            el('span.audio-player__play-circle', [
                svg('svg.audio-player__play-icon', { 'aria-hidden': 'true' }, [
                    this.playIcon = svg('use', { href: '#icon-play' }) as SVGUseElement,
                ]),
            ]),
        ]) as HTMLButtonElement;

        this.nextButton = el('button.audio-player__btn.audio-player__btn--next', [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-next' }),
            ]),
        ]) as HTMLButtonElement;

        this.currentTimeEl = el('span.audio-player__time', '0:00');

        this.progressSlider = el('input.audio-player__slider', {
            'type': 'range',
            'min': '0',
            'max': '100',
            'value': '0',
        }) as HTMLInputElement;

        this.durationEl = el('span.audio-player__time', '0:00');

        return el('div.audio-player__wrap-controls', [
            el('div.audio-player__controls', [
                el('button.audio-player__btn.audio-player__btn--shuffle', [
                    svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                        svg('use', { href: '#icon-shuffle' }),
                    ]),
                ]),
                this.prevButton,
                this.playButton,
                this.nextButton,
                el('button.audio-player__btn.audio-player__btn--repeat', [
                    svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                        svg('use', { href: '#icon-repeat' }),
                    ]),
                ]),
            ]),
            el('div.audio-player__progress', [
                this.currentTimeEl,
                this.progressSlider,
                this.durationEl,
            ]),
        ]);
    }

    private createVolumeSection(): HTMLElement {
        this.volumeIcon = svg('use', { href: '#icon-volume' }) as SVGUseElement;
        this.volumeButton = el('button.audio-player__volume-btn', { 'aria-label': 'Выключить звук' }, [
            svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                this.volumeIcon,
            ]),
        ]) as HTMLButtonElement;

        this.volumeSlider = el('input.audio-player__slider', {
            'type': 'range',
            'min': '0',
            'max': '100',
            'value': '70',
        }) as HTMLInputElement;

        return el('div.audio-player__volume', [
            this.volumeButton,
            this.volumeSlider,
        ]);
    }

    private createPlayer(): HTMLElement {
        return el('footer.audio-player', [
            this.createTrackSection(),
            this.createControlsSection(),
            this.createVolumeSection(),
        ]);
    }

    private updateFavoriteIcon(): void {
        this.favoriteBtn.classList.toggle('is-active', this.isFavorite);
    }

    private async toggleFavorite(): Promise<void> {
        if (!this.currentTrack) return;

        const newState = !this.isFavorite;
        this.isFavorite = newState;
        this.updateFavoriteIcon();

        try {
            if (newState) {
                await tracksAPI.addToFavorites(this.currentTrack.id);
            } else {
                await tracksAPI.removeFromFavorites(this.currentTrack.id);
            }

            document.dispatchEvent(new CustomEvent('favorite:toggle', {
                detail: { trackId: this.currentTrack.id, isFavorite: newState },
            }));
        } catch (error) {
            this.isFavorite = !newState;
            this.updateFavoriteIcon();
            console.error('Ошибка избранного в плеере:', error);
        }
    }

    private createEmptyCoverSvg(): string {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
                <rect width="60" height="60" fill="#F0F0F0"/>
                <g transform="translate(14, 14) scale(1)" fill="none" stroke="#C4C4C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22.5 25C24.433 25 26 23.433 26 21.5C26 19.567 24.433 18 22.5 18C20.567 18 19 19.567 19 21.5C19 23.433 20.567 25 22.5 25Z"/>
                    <path d="M6.5 29C8.433 29 10 27.433 10 25.5C10 23.567 8.433 22 6.5 22C4.567 22 3 23.567 3 25.5C3 27.433 4.567 29 6.5 29Z"/>
                    <path d="M26 10L10 14"/>
                    <path d="M10 25.5V8L26 4V21.5"/>
                </g>
            </svg>
        `;
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
}
