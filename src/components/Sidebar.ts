/**
 * Компонент сайдбара (боковая панель).
 * 
 * Содержит логотип и основную навигацию (Избранное, Аудиокомпозиции).
 * 
 * ВАЖНО: Для SVG-элементов используется функция `svg()` (создаёт элементы
 * в SVG-namespace). Если создать <svg> через `el()`, браузер его проигнорирует.
 */

import { el, svg } from "redom";

export class Sidebar {
    public el: HTMLElement;

    constructor() {
        this.el = this.createSidebar();
    }

    private createSidebar(): HTMLElement {
        return el('aside.vibecast__sidebar', [
            this.createLogo(),
            this.createNav(),
        ]);
    }

    private createLogo(): HTMLElement {
        return el('a.logo', { href: '#/' }, [
            svg('svg.logo__icon', { 'aria-hidden': 'true' }, [
                svg('use', { href: '#icon-logo' }),
            ]),
        ]);
    }

    private createNav(): HTMLElement {
        return el('nav.main-nav', [
            el('ul.main-nav__list', [
                this.createNavItem({
                    href: '#/favorites',
                    id: 'navFavorites',
                    text: 'Избранное',
                    isActive: this.isActiveNav('#/favorites'),
                    desktopIconId: 'icon-nav',
                    mobileIconId: null,
                }),
                this.createNavItem({
                    href: '#/',
                    id: 'navAllCompositions',
                    text: 'Аудиокомпозиции',
                    isActive: this.isActiveNav('#/'),
                    desktopIconId: 'icon-nav',
                    mobileIconId: 'icon-play-stroke',
                }),
            ]),
        ]);
    }

    /**
     * Создаёт один пункт навигации.
     * 
     * @param options - Параметры пункта меню
     * @param options.href - Куда ведёт ссылка
     * @param options.id - ID для JS-доступа
     * @param options.text - Текст пункта
     * @param options.isActive - Активный ли пункт
     * @param options.desktopIconId - ID иконки для десктопа
     * @param options.mobileIconId - ID иконки для мобилки (или null)
     * @returns Элемент <li> с ссылкой
     */
    private createNavItem(options: {
        href: string;
        id: string;
        text: string;
        isActive: boolean;
        desktopIconId: string | null;
        mobileIconId: string | null;
    }): HTMLElement {
        const linkClass = options.isActive
            ? 'main-nav__link main-nav__link--active'
            : 'main-nav__link';

        const children: (HTMLElement | SVGElement)[] = [];

        if (options.desktopIconId) {
            children.push(
                svg('svg.icon.icon--large.icon--desktop', { 'aria-hidden': 'true' }, [
                    svg('use', { href: `#${options.desktopIconId}` }),
                ])
            );
        }

        if (options.mobileIconId) {
            children.push(
                svg('svg.icon.icon--large.icon--mobile', { 'aria-hidden': 'true' }, [
                    svg('use', { href: `#${options.mobileIconId}` }),
                ])
            );
        }

        children.push(el('span.main-nav__text', options.text));

        return el('li.main-nav__item', [
            el('a.' + linkClass.replace(/ /g, '.'), {
                href: options.href,
                id: options.id,
            }, children),
        ]);
    }

    /**
     * Определяет, является ли текущий маршрут активным.
     */
    private isActiveNav(href: string): boolean {
        const currentHash = window.location.hash || '#/';
        return currentHash === href;
    }
}
