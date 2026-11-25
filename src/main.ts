/**
 * Точка входа приложения.
 * 
 * Создаёт корневую обёртку, монтирует её в `<body>`,
 * инициализирует роутер и регистрирует маршруты.
 */

import { App } from "@/App";
import { Router } from "@/router/Router";
import { MainPage } from "@/pages/MainPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { FavoritesPage } from '@/pages/FavoritesPage';
import { ProfilePage } from './pages/ProfilePage';

function bootstrap(): void {
    const app = new App();
    document.body.appendChild(app.el);

    const router = new Router('#root');

    router.register('#/', () => new MainPage());
    router.register('#/favorites', () => new FavoritesPage());
    router.register('#/profile', () => new ProfilePage());
    router.register('#/login', () => new LoginPage());
    router.register('#/register', () => new RegisterPage());

    router.setDefault('#/');
    router.start();
}

bootstrap();
