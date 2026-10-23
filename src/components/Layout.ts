/**
 * Общий каркас страницы приложения.
 * 
 * Содержит Sidebar, Header, AudioPlayer и контент страницы.
 * Используется как обёртка для всех страниц, которым нужен общий интерфейс
 * (главная, избранное, профиль).
 */

import { el } from 'redom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { audioPlayerInstance } from '@/components/audioPlayerSingleton';

export class Layout {
    public el: HTMLElement;

    /**
     * @param content - HTML-элемент контента страницы
     * @param onSearch - Колбэк для поиска (пробрасывается в Header)
     */
    constructor(content: HTMLElement, onSearch?: (value: string) => void) {
        this.el = this.createLayout(content, onSearch);
    }

    private createLayout(content: HTMLElement, onSearch?: (value: string) => void): HTMLElement {
        return el('.vibecast', [
            new Header({ onSearch }).el,
            new Sidebar().el,
            el('main.vibecast__content', [content]),
            audioPlayerInstance.el,
        ]);
    }
}