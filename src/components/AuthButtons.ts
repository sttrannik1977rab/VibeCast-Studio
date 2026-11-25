/**
 * Кнопки авторизации (Войти / Регистрация).
 * 
 * Отображаются в шапке, если пользователь не авторизован.
 */

import { el } from "redom";

export class AuthButtons {
    public el: HTMLElement;

    constructor() {
        this.el = this.createButtons();
    }

    private createButtons(): HTMLElement {
        return el('div.auth-buttons', [
            el('a.auth-buttons__login', {
                href: '#/login',
            }, 'Войти'),
            el('a.auth-buttons__register', {
                href: '#/register',
            }, 'Регистрация'),
        ]);
    }
}