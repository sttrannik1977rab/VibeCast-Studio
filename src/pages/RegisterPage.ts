/**
 * Страница регистрации.
 * 
 * Содержит форму с 4 полями (username, email, password, passwordConfirm),
 * валидирует данные через Zod (включая проверку совпадения паролей)
 * и отправляет запрос на сервер.
 */

import { el, svg } from 'redom';
import { z } from 'zod';
import { authAPI } from '@/api/auth';
import type { Page } from '@/router/Router';

/**
 * Схема валидации формы регистрации.
 * 
 * Проверяет:
 * - username: минимум 3 символа
 * - email: корректный email
 * - password: минимум 6 символов
 * - passwordConfirm: совпадает с password
 */
const registerSchema = z
    .object({
        username: z
            .string()
            .min(1, 'Введите имя пользователя')
            .min(3, 'Имя должно состоять минимум из 3-х символов'),
        email: z
            .string()
            .min(1, 'Введите email')
            .email('Некорректный email'),
        password: z
            .string()
            .min(1, 'Введите пароль')
            .min(6, 'Пароль должен содержать минимум 6 символов'),
        passwordConfirm: z
            .string()
            .min(1, 'Повторите пароль'),
    })
    .refine(
        (data) => data.password === data.passwordConfirm,
        {
            message: 'пароли не совпадают',
            path: ['passwordConfirm'],
        }
    );

type RegisterFormData = z.infer<typeof registerSchema>;

export class RegisterPage implements Page {
    public el: HTMLElement;

    private usernameInput: HTMLInputElement;
    private emailInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;
    private passwordConfirmInput: HTMLInputElement;
    private passwordToggle: HTMLButtonElement;
    private passwordToggleIcon: SVGUseElement;
    private isPasswordVisible: boolean = false;
    private passwordConfirmToggle: HTMLButtonElement;
    private passwordConfirmToggleIcon: SVGUseElement;
    private isPasswordConfirmVisible: boolean = false;
    private errorBlock: HTMLElement;
    private submitButton: HTMLButtonElement;

    constructor() {
        this.usernameInput = el('input.auth-form__input', {
            type: 'text',
            id: 'register-username',
            name: 'username',
            placeholder: 'Придумайте имя',
            autocomplete: 'username',
            required: true,
        }) as HTMLInputElement;

        this.emailInput = el('input.auth-form__input', {
            type: 'email',
            id: 'register-email',
            name: 'email',
            placeholder: 'Введите email',
            autocomplete: 'email',
            required: true,
        }) as HTMLInputElement;

        this.passwordInput = el('input.auth-form__input', {
            type: 'password',
            id: 'register-password',
            name: 'password',
            placeholder: 'Придумайте пароль',
            autocomplete: 'new-password',
            required: true,
        }) as HTMLInputElement;

        this.passwordConfirmInput = el('input.auth-form__input', {
            type: 'password',
            id: 'register-password-confirm',
            name: 'password-confirm',
            placeholder: 'Повторите пароль',
            autocomplete: 'new-password',
            required: true,
        }) as HTMLInputElement;

        this.errorBlock = el('div.auth-form__error', { hidden: true }) as HTMLElement;

        this.submitButton = el('button.auth-form__submit', {
            type: 'submit',
        }, 'Зарегистрироваться') as HTMLButtonElement;

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

        this.passwordConfirmToggleIcon = svg('use', { href: '#icon-eye' }) as SVGUseElement;

        this.passwordConfirmToggle = el('button.auth-form__toggle-password', {
            type: 'button',
            onclick: () => this.togglePasswordConfirmVisibility(),
            'aria-label': 'Показать пароль',
        }, [
            svg('svg.icon.icon--medium', { 'aria-hidden': 'true' }, [
                this.passwordConfirmToggleIcon,
            ]),
        ]) as HTMLButtonElement;

        this.el = this.createPage();
    }

    private createLogo(): SVGElement {
        return svg('svg.auth-page__logo', { 'aria-hidden': 'true' }, [
            svg('use', { href: '#icon-logo' }),
        ]);
    }

    private createForm(): HTMLElement {
        return el('form.auth-form', {
            onsubmit: (e: Event) => {
                e.preventDefault();
                this.handleSubmit();
            },
        }, [
            el('h1.auth-form__title', 'Регистрация в VIBECAST'),
            el('p.auth-form__subtitle', 'Создайте аккаунт для начала работы'),
            this.errorBlock,
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'username' }, 'Имя пользователя'),
                this.usernameInput,
            ]),
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'register-email' }, 'Email'),
                this.emailInput,
            ]),
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'register-password' }, 'Пароль'),
                el('div.auth-form__input-wrap', [
                    this.passwordInput,
                    this.passwordToggle,
                ]),
            ]),
            el('div.auth-form__field', [
                el('label.auth-form__label', { for: 'register-password-confirm' }, 'Повторите пароль'),
                el('div.auth-form__input-wrap', [
                    this.passwordConfirmInput,
                    this.passwordConfirmToggle,
                ]),
            ]),
            this.submitButton,
            el('a.auth-form__link', { href: '#/login' }, 'Уже есть аккаунт? Войти'),
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

        const formData: RegisterFormData = {
            username: this.usernameInput.value.trim(),
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value,
            passwordConfirm: this.passwordConfirmInput.value,
        };

        const result = registerSchema.safeParse(formData);

        if (!result.success) {
            const firstError = result.error.issues[0];
            this.showError(firstError.message);
            return;
        }

        this.setLoading(true);

        try {
            await authAPI.register(
                result.data.username,
                result.data.password,
                result.data.email
            );

            this.showSuccess('Регистрация успешна! Теперь можно войти в систему.');

            setTimeout(() => {
                window.location.hash = '#/login';
            }, 1500);

            this.usernameInput.value = '';
            this.emailInput.value = '';
            this.passwordInput.value = '';
            this.passwordConfirmInput.value = '';
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Ошибка регистрации';
            this.showError(message);
        } finally {
            this.setLoading(false);
        }
    }

    private showError(message: string): void {
        this.errorBlock.textContent = message;
        this.errorBlock.hidden = false;
        this.errorBlock.classList.add('auth-form__error--error');
        this.errorBlock.classList.remove('auth-form__error--success');
    }

    private showSuccess(message: string): void {
        this.errorBlock.textContent = message;
        this.errorBlock.hidden = false;
        this.errorBlock.classList.add('auth-form__error--success');
        this.errorBlock.classList.remove('auth-form__error--error');
    }

    private hideError(): void {
        this.errorBlock.hidden = true;
        this.errorBlock.textContent = '';
        this.errorBlock.classList.remove('auth-form__error--error', 'auth-form__error--success');
    }

    private setLoading(isLoading: boolean): void {
        this.submitButton.disabled = isLoading;
        this.submitButton.textContent = isLoading ? 'Регистрация...' : 'Зарегистрироваться';
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

    private togglePasswordConfirmVisibility(): void {
        this.isPasswordConfirmVisible = !this.isPasswordConfirmVisible;
        this.passwordConfirmInput.type = this.isPasswordConfirmVisible ? 'text' : 'password';

        const iconId = this.isPasswordConfirmVisible ? '#icon-eye-off' : '#icon-eye';
        this.passwordConfirmToggleIcon.setAttribute('href', iconId);

        this.passwordConfirmToggle.setAttribute(
            'aria-label',
            this.isPasswordConfirmVisible ? 'Скрыть пароль' : 'Показать пароль'
        );
    }
}