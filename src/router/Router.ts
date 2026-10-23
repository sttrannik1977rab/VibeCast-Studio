/**
 * Hash-роутер приложения.
 * 
 * Слушает изменение location.hash, находит подходящую страницу
 * в реестре маршрутов и монтирует её в контейнер.
 * 
 * Использует хэш-навигацию (не History API), что позволяет
 * обходиться без серверной настройки.
 */

/**
 * Интерфейс страницы (контракт).
 * 
 * Любая страница должна иметь корневой элемент `el` и опциональные
 * хуки жизненного цикла `onEnter` / `onLeave`.
 */
export interface Page {
    el: HTMLElement;
    onEnter?: () => void;
    onLeave?: () => void;
}

type PageFactory = () => Page;

export class Router {
    private routes: Map<string, PageFactory> = new Map();
    private container: HTMLElement;
    private currentPage: Page | null = null;
    private defaultPath: string = '#/';

    constructor(containerSelector: string) {
        const container = document.querySelector(containerSelector);

        if (!container || !(container instanceof HTMLElement)) {
            throw new Error(`Router: контейнер "${containerSelector}" не найден`);
        }

        this.container = container;
    }

    /**
     * Регистрирует маршрут.
     * 
     * @param path - Хэш маршрута (например, '#/login')
     * @param factory - Функция, создающая новый экземпляр страницы при каждом переходе
     */
    register(path: string, factory: PageFactory): void {
        this.routes.set(path, factory);
    }

    /**
     * Устанавливает маршрут по умолчанию (если хэш пустой или неизвестный).
     */
    setDefault(path: string): void {
        this.defaultPath = path;
    }

    /**
     * Программная навигация.
     * 
     * @param path - Хэш маршрута
     */
    navigate(path: string): void {
        window.location.hash = path;
    }

    /**
     * Запускает роутер: подписывается на hashchange и рендерит текущую страницу.
     */
    start(): void {
        window.addEventListener('hashchange', () => this.handleRouter());
        this.handleRouter();
    }

    private handleRouter(): void {
        const path = window.location.hash || this.defaultPath;
        const factory = this.routes.get(path);

        if (!factory) {
            this.renderNotFound(path);
            return;
        }

        if (this.currentPage?.onLeave) {
            this.currentPage.onLeave();
        }

        const page = factory();
        this.container.replaceChildren(page.el);
        this.currentPage = page;

        if (page.onEnter) {
            page.onEnter();
        }
    }

    private renderNotFound(path: string): void {
        if (this.currentPage?.onLeave) {
            this.currentPage.onLeave();
        }

        const notFound = document.createElement('div');
        notFound.className = 'not-found';
        notFound.textContent = `Страница не найдена: ${path}`;

        this.container.replaceChildren(notFound);
        this.currentPage = null;
    }
}
