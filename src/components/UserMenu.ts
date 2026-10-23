/**
 * Меню авторизованного пользователя.
 * 
 * Содержит кнопку-триггер (аватар + имя) и выпадающее меню
 * с информацией о пользователе и действиями (профиль, избранное, выход).
 * 
 * На устройствах с шириной <= 1100px клик по триггеру ведёт
 * сразу на страницу профиля (вместо открытия dropdown).
 */

import { el, svg } from 'redom';
import { authAPI } from '@/api/auth';
import { apiClient } from '@/api/client';
import { decodeJwt } from '@/utils/jwt';

export class UserMenu {
    public el: HTMLElement;

    private trigger: HTMLButtonElement;
    private dropdown: HTMLElement;
    private isOpen: boolean = false;
    private username: string;
    private email: string;

    /**
     * Обработчик клика вне меню (сохранён как поле для отписки).
     */
    private handleClickOutside = (e: MouseEvent): void => {
        if (!this.el.contains(e.target as Node)) {
            this.close();
        }
    };

    /**
     * Обработчик нажатия Escape.
     */
    private handleEscape = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.close();
        }
    };

    constructor() {
        const token = apiClient.getToken();
        const payload = token ? decodeJwt(token) : {};

        this.username = payload.username ?? 'Пользователь';
        this.email = payload.email ?? '';

        this.trigger = this.createTrigger(this.username);
        this.dropdown = this.createDropdown(this.username, this.email);

        this.el = el('div.user-menu', [
            this.trigger,
            this.dropdown,
        ]);
    }

    private createTrigger(username: string): HTMLButtonElement {
        const firstLetter = username.charAt(0).toUpperCase();

        return el('button.user-menu__trigger', {
            'aria-label': 'Меню пользователя',
            'aria-expanded': 'false',
            type: 'button',
            onclick: () => this.toggle(),
        }, [
            el('span.user-menu__info', [
                el('span.user-menu__avatar', firstLetter),
                el('span.user-menu__name', username),
            ]),
            svg('svg.icon.icon--small', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-arrow-right' }),
            ]),
        ]) as HTMLButtonElement;
    }

    private createDropdown(username: string, email: string): HTMLElement {
        const firstLetter = username.charAt(0).toUpperCase();

        return el('div.user-menu__dropdown', { hidden: true }, [
            el('div.user-menu__user-info', [
                el('span.user-menu__avatar', firstLetter),
                el('div.user-menu__user-details', [
                    el('span.user-menu__user-name', username),
                    el('span.user-menu__user-email', email),
                ]),
            ]),
            el('ul.user-menu__actions', [
                el('li', [
                    el('button.user-menu__action', {
                        type: 'button',
                        onclick: () => this.goToProfile(),
                    }, 'Мой профиль'),
                ]),
                el('li', [
                    el('button.user-menu__action', {
                        type: 'button',
                        onclick: () => this.goToFavorites(),
                    }, 'Избранное'),
                ]),
                el('li', [el('hr.user-menu__divider')]),
                el('li', [
                    el('button.user-menu__action.user-menu__action--logout', {
                        type: 'button',
                        onclick: () => this.logout(),
                    }, 'Выйти'),
                ]),
            ]),
        ]);
    }

    /**
     * Переключает состояние меню.
     * 
     * На устройствах шириной <= 1100px — редирект на профиль
     * (выпадающее меню там не помещается).
     */
    private toggle(): void {
        if (window.innerWidth <= 1100) {
            this.close();
            window.location.hash = '#/profile';
            return;
        }

        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.isOpen = true;
        this.dropdown.hidden = false;
        this.trigger.setAttribute('aria-expanded', 'true');

        document.addEventListener('click', this.handleClickOutside);
        document.addEventListener('keydown', this.handleEscape);
    }

    private close(): void {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.dropdown.hidden = true;
        this.trigger.setAttribute('aria-expanded', 'false');

        document.removeEventListener('click', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleEscape);
    }

    private goToProfile(): void {
        window.location.hash = '#/profile';
    }

    private goToFavorites(): void {
        window.location.hash = '#/favorites';
    }

    private logout(): void {
        authAPI.logout();
        window.location.hash = '#/login';
    }
}