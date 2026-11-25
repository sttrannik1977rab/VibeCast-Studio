/**
 * Страница профиля пользователя.
 * 
 * Отображает аватар, имя, email и кнопку выхода.
 * Данные берутся из JWT-токена.
 */

import { el } from 'redom';
import type { Page } from '@/router/Router';
import { Layout } from '@/components/Layout';
import { apiClient } from '@/api/client';
import { decodeJwt } from '@/utils/jwt';
import { authAPI } from '@/api/auth';

export class ProfilePage implements Page {
    public el: HTMLElement;

    constructor() {
        this.el = new Layout(this.createProfileSection()).el;
    }

    private createProfileSection(): HTMLElement {
        const token = apiClient.getToken();
        const payload = token ? decodeJwt(token) : {};

        const username = payload.username ?? '-';
        const email = payload.email ?? '—';
        const firstLetter = username.charAt(0).toUpperCase();

        const logoutBtn = el('button.profile-section__logout', {
            onclick: () => {
                authAPI.logout();
                window.location.hash = '#/login';
            },
        }, 'Выйти');

        return el('section.profile-section', [
            el('h2.profile-section__title', 'Профиль'),
            el('div.profile-section__content', [
                el('span.profile-section__avatar', firstLetter),
                el('h3.profile-section__name', username),
                el('p.profile-section__email', email),
                logoutBtn,
            ]),
        ]);
    }
}
