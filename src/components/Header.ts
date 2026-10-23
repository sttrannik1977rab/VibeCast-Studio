/**
 * Шапка приложения.
 * 
 * Содержит поле поиска и блок авторизации (UserMenu или AuthButtons
 * в зависимости от статуса пользователя).
 */

import { el, svg } from 'redom';
import { Search } from '@/components/Search';
import { AuthButtons } from '@/components/AuthButtons';
import { UserMenu } from '@/components/UserMenu';
import { apiClient } from '@/api/client';

export interface HeaderOptions {
    /**
     * Колбэк, вызываемый при вводе текста в поиск.
     */
    onSearch?: (value: string) => void;
}

export class Header {
    public el: HTMLElement;

    constructor(options: HeaderOptions = {}) {
        this.el = this.createHeader(options);
    }

    private createLogo(): HTMLElement {
        return el('a.header__logo', { href: '#/' }, [
            svg('svg.logo__icon', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-logo' }),
            ]),
        ]);
    }

    /**
     * Создаёт структуру шапки.
     * 
     * Логотип нужен для мобильной версии (на десктопе он скрыт через CSS,
     * так как есть в сайдбаре).
     * 
     * @param options - Опции компонента (колбэк поиска)
     * @returns Элемент <header>
     */
    private createHeader(options: HeaderOptions): HTMLElement {
        const search = new Search({
            onInput: (value) => {
                if (options.onSearch) {
                    options.onSearch(value);
                }
            },
        });

        const authBlock = apiClient.isAuthenticated()
            ? new UserMenu().el
            : new AuthButtons().el;

        return el('header.vibecast__header', [
            this.createLogo(),
            search.el,
            authBlock,
        ]);
    }
}