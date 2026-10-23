/**
 * Компонент поиска.
 * 
 * Отображает поле ввода с иконкой лупы.
 * При вводе текста вызывает колбэк onInput (если передан).
 */

import { el, svg } from "redom";

export interface SearchOptions {
    /**
     * Колбэк, вызываемый при вводе текста.
     * Получает текущее значение input.
     */
    onInput?: (value: string) => void;
}

export class Search {
    public el: HTMLElement;
    private input: HTMLInputElement;
    private onInput?: (value: string) => void;

    constructor(options: SearchOptions = {}) {
        this.onInput = options.onInput;

        this.input = el('input.search__input', {
            type: 'text',
            placeholder: 'Что будем искать?',
            oninput: () => {
                if (this.onInput) {
                    this.onInput(this.input.value);
                }
            },
        }) as HTMLInputElement;

        this.el = this.createSearch();
    }

    private createSearch(): HTMLElement {
        return el('div.search', [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-search' }),
            ]),
            this.input,
        ]);
    }

    /**
     * Возвращает текущее значение поля поиска.
     */
    getValue(): string {
        return this.input.value;
    }

    /**
     * Очищает поле поиска.
     */
    clear(): void {
        this.input.value = '';
        if (this.onInput) {
            this.onInput('');
        }
    }
}