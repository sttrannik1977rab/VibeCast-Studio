/**
 * Корневая обёртка приложения.
 * 
 * Создаёт внешний контейнер `.vibecast-wrapper` (фон, центрирование)
 * и `#root` — контейнер, в который роутер монтирует страницы.
 * 
 * Sidebar, Header и Player живут внутри страниц (MainPage, FavoritesPage, ProfilePage),
 * а не здесь — чтобы на страницах логина/регистрации их не было.
 */

import { el } from 'redom';

export class App {
    public el: HTMLElement;

    constructor() {
        this.el = el('.vibecast-wrapper',
            el('#root')
        );
    }
}