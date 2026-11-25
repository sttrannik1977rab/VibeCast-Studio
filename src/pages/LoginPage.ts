/**
 * Страница входа в систему.
 * 
 * Содержит форму логина (username, password), валидирует данные через Zod,
 * отправляет запрос на сервер и сохраняет токен при успешном входе.
 */

import { el, svg } from 'redom';
import { z } from 'zod';
import { authAPI } from '@/api/auth';
import { apiClient } from '@/api/client';
import type { Page } from '@/router/Router';

/**
 * Схема валидации формы логина.
 * 
 * - username: минимум 3 символа
 * - password: минимум 6 символов
 */
const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'Введите имя пользователя')
        .min(3, 'Имя должно состоять минимум из 3-х символов'),
    password: z
        .string()
        .min(1, 'Введите пароль')
        .min(6, 'Пароль должен содержать минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export class LoginPage implements Page {
    public el: HTMLElement;

    private usernameInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;
    private passwordToggle: HTMLButtonElement;
    private passwordToggleIcon: SVGUseElement;
    private isPasswordVisible: boolean = false;
    private errorBlock: HTMLElement;
    private submitButton: HTMLButtonElement;

    constructor() {
        this.usernameInput = el('input.auth-form__input', {
            type: 'text',
            id: 'login-username',
            name: 'username',
            placeholder: 'Введите имя',
            autocomplete: 'username',
            required: true,
        }) as HTMLInputElement;

        this.passwordInput = el('input.auth-form__input', {
            type: 'password',
            id: 'password',
            name: 'password',
            placeholder: 'Введите пароль',
            autocomplete: 'current-password',
            required: true,
        }) as HTMLInputElement;

        this.errorBlock = el('div.auth-form__error', { hidden: true }) as HTMLElement;

        this.submitButton = el('button.auth-form__submit', {
            type: 'submit',
        }, 'Войти') as HTMLButtonElement;

        this.passwordToggleIcon = svg('use', { href: '#icon-eye' }) as SVGUseElement;

        this.passwordToggle = el('button.auth-form__toggle-password', {
            type: 'button',
            onclick: () => this.togglePasswordVisibility(),
            'aria-label': 'Показать пароль',
        }, [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                this.passwordToggleIcon,
            ]),
        ]) as HTMLButtonElement;

        this.el = this.createPage();
    }

    private createForm(): HTMLElement {
        return el('form.auth-form', {
            onsubmit: (e: Event) => {
                e.preventDefault();
                this.handleSubmit();
            },
        }, [
            el('h1.auth-form__title', 'Вход в VIBECAST'),
            el('p.auth-form__subtitle', 'Введите свои данные для входа'),
            this.errorBlock,
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'username' }, 'Имя пользователя'),
                this.usernameInput,
            ]),
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'password' }, 'Пароль'),
                el('div.auth-form__input-wrap', [
                    this.passwordInput,
                    this.passwordToggle,
                ]),
            ]),
            el('label.auth-form__checkbox', [
                el('input', { type: 'checkbox', name: 'remember' }),
                el('span', 'Запомнить меня'),
            ]),
            this.submitButton,
            el('a.auth-form__link', { href: '#/register' }, 'Нет аккаунта? Зарегистрироваться'),
        ]);
    }

    private createLogo(): SVGElement {
        return svg('svg.auth-page__logo', { 'aria-hidden': 'true' }, [
            svg('use', { href: '#icon-logo' }),
        ]);
    }

    private createPage(): HTMLElement {
        return el('.auth-page',
            el('.auth-page__card', [
                this.createLogo(),
                this.createForm(),
            ])
        );
    }

    private async handleSubmit(): Promise<void> {
        this.hideError();

        const formData: LoginFormData = {
            username: this.usernameInput.value.trim(),
            password: this.passwordInput.value,
        };

        const result = loginSchema.safeParse(formData);

        if (!result.success) {
            const firstError = result.error.issues[0];
            this.showError(firstError.message);
            return;
        }

        this.setLoading(true);

        try {
            const response = await authAPI.login(result.data.username, result.data.password);

            if (response.token) {
                apiClient.setToken(response.token);
                window.location.hash = '#/';
            } else {
                this.showError('Не удалось получить токен');
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Ошибка при входе';
            this.showError(message);
        } finally {
            this.setLoading(false);
        }
    }

    private showError(message: string): void {
        this.errorBlock.textContent = message;
        this.errorBlock.hidden = false;
    }

    private hideError(): void {
        this.errorBlock.hidden = true;
        this.errorBlock.textContent = '';
    }

    private setLoading(isLoading: boolean): void {
        this.submitButton.disabled = isLoading;
        this.submitButton.textContent = isLoading ? 'Вход...' : 'Войти';
    }

    private togglePasswordVisibility(): void {
        this.isPasswordVisible = !this.isPasswordVisible;
        this.passwordInput.type = this.isPasswordVisible ? 'text' : 'password';

        const iconId = this.isPasswordVisible ? '#icon-eye-off' : '#icon-eye';
        this.passwordToggleIcon.setAttribute('href', iconId);

        this.passwordToggle.setAttribute(
            'aria-label',
            this.isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'
        );
    }
}
